import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, runTransaction } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export async function signIn() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Auth Error:", error);
    return null;
  }
}

export async function signUpWithEmail(email: string, pass: string) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error: any) {
    console.error("Sign Up Error:", error);
    throw new Error(error.message);
  }
}

export async function signInWithEmail(email: string, pass: string) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error: any) {
    console.error("Sign In Error:", error);
    throw new Error(error.message);
  }
}

export async function signOut() {
  await fbSignOut(auth);
}

export async function getUserData(uid: string) {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    // New user
    return null;
  }
  const data = snap.data();
  if (data.isVIP && data.vipExpiration) {
    const exp = data.vipExpiration.toDate ? data.vipExpiration.toDate() : new Date(data.vipExpiration);
    if (exp <= new Date()) {
      data.isVIP = false;
    }
  }
  return { id: snap.id, ...data };
}

export async function createUserDocument(user: any) {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  
  if (snap.exists()) {
    if (user.displayName && snap.data().name !== user.displayName && snap.data().name === 'مستخدم') {
      try {
        await updateDoc(userRef, { name: user.displayName });
      } catch (e) {
        console.error("Could not update name", e);
      }
    }
    return { id: snap.id, ...snap.data() };
  }

  const refCode = localStorage.getItem('referralCode');

  const newUser = {
    name: user.displayName || 'مستخدم',
    email: user.email || 'user@example.com',
    role: 'user', // default role
    points: 0,
    banned: false,
    referralCount: 0,
    referralsEarnings: 0,
    referredBy: refCode || null,
    level: 1, // Start at level 1 (Bronze)
    xp: 0, // Experience Points
    streak: 0, // Daily login streak
    isVIP: false,
    vipExpiration: null,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(userRef, newUser);
  } catch (err: any) {
    console.error("Error writing user doc", err);
    throw new Error(`Error writing user doc: ${err.message}`);
  }

  if (refCode && refCode !== user.uid) {
    try {
      await processReferralReward(refCode);
      localStorage.removeItem('referralCode');
    } catch(e: any) {
      console.error("Referral Error", e);
    }
  }

  return { id: user.uid, ...newUser };
}

async function processReferralReward(referrerId: string) {
  const referrerRef = doc(db, 'users', referrerId);
  await runTransaction(db, async (t) => {
    const referrerDoc = await t.get(referrerRef);
    if (!referrerDoc.exists()) return;
    
    const currentPoints = referrerDoc.data()?.points || 0;
    const refCount = referrerDoc.data()?.referralCount || 0;
    const refEarnings = referrerDoc.data()?.referralsEarnings || 0;

    t.update(referrerRef, {
        points: currentPoints + 100,
        referralCount: refCount + 1,
        referralsEarnings: refEarnings + 100
    });

    const historyRef = doc(collection(db, 'users', referrerId, 'history'));
    t.set(historyRef, {
        title: 'مكافأة دعوة صديق',
        amount: 100,
        type: 'earn',
        createdAt: serverTimestamp()
    });
  });
}

export async function logHistory(uid: string, title: string, amount: number, type: 'earn' | 'spend' | 'system') {
  const historyRef = collection(db, 'users', uid, 'history');
  await addDoc(historyRef, {
    title,
    amount,
    type,
    createdAt: serverTimestamp()
  });
}

export async function updatePoints(uid: string, pointsDelta: number, reason: string, type: 'earn' | 'spend' | 'system' = 'earn') {
  try {
    const userRef = doc(db, 'users', uid);
    
    let newTotal = 0;
    let referrerId: string | null = null;
    let commission = 0;

    await runTransaction(db, async (transaction) => {
      // 1. All Reads
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) throw new Error("User does not exist!");
      const userData = userDoc.data();
      
      let referrerDoc = null;
      if (type === 'earn' && pointsDelta > 0 && userData?.referredBy) {
        referrerId = userData.referredBy;
        const referrerRef = doc(db, 'users', referrerId);
        referrerDoc = await transaction.get(referrerRef);
      }

      // 2. All Writes
      const currentPoints = userData?.points || 0;
      newTotal = currentPoints + pointsDelta;
      if (newTotal < 0) throw new Error("Insufficient points");
      
      const updateData: any = { points: newTotal };
      
      // XP & Leveling logic for earning activities
      if (type === 'earn' && pointsDelta > 0) {
         let currentXp = userData?.xp || 0;
         let currentLevel = userData?.level || 1;
         let isVIP = false;
         
         if (userData?.isVIP && userData?.vipExpiration) {
            const exp = userData.vipExpiration.toDate ? userData.vipExpiration.toDate() : new Date(userData.vipExpiration);
            if (exp > new Date()) {
                isVIP = true;
            }
         }
         
         // Apply level bonus multipliers
         let finalPointsDelta = pointsDelta;
         let bonusPoints = 0;
         if (currentLevel >= 4) {
           bonusPoints = Math.floor(pointsDelta * 0.10); // 10% bonus
         } else if (currentLevel >= 2) {
           bonusPoints = Math.floor(pointsDelta * 0.05); // 5% bonus
         }
         
         finalPointsDelta += bonusPoints;
         
         if (isVIP) {
            finalPointsDelta = Math.floor(finalPointsDelta * 2); // Double VIP points
         }
         
         pointsDelta = finalPointsDelta; // Update pointsDelta so logging matches
         newTotal = currentPoints + finalPointsDelta;
         updateData.points = newTotal; // Update the dictionary with newTotal
         
         // Give 1 XP per point earned (before bonus, or after? let's do after to be nice)
         let newXp = currentXp + finalPointsDelta;
         
         // Calculate new level
         // Formula: XP needed for next level = currentLevel * 500 + currentLevel^2 * 50
         let threshold = currentLevel * 500 + Math.pow(currentLevel, 2) * 50;
         let leveledUp = false;
         
         while (newXp >= threshold) {
            currentLevel++;
            leveledUp = true;
            threshold = currentLevel * 500 + Math.pow(currentLevel, 2) * 50;
         }
         
         updateData.xp = newXp;
         if (leveledUp) {
            updateData.level = currentLevel;
            // Optionally log level up event
         }
      }

      transaction.update(userRef, updateData);

      if (referrerDoc && referrerDoc.exists() && referrerId) {
        commission = Math.max(1, Math.floor(pointsDelta * 0.2)); // At least 1 point if earning
        if (commission > 0) {
          const refData = referrerDoc.data();
          const referrerRef = doc(db, 'users', referrerId);
          transaction.update(referrerRef, {
            points: (refData.points || 0) + commission,
            referralsEarnings: (refData.referralsEarnings || 0) + commission
          });
        }
      } else {
        referrerId = null; // Prevent logging if referrer missing
      }
    });
    
    await logHistory(uid, reason, pointsDelta, type);

    if (referrerId && commission > 0) {
       await logHistory(referrerId, `أرباح إحالة 20% (من نشاط صديق)`, commission, 'earn');
    }

    return { success: true, newPoints: newTotal, error: null };
  } catch(e: any) {
    return { success: false, newPoints: 0, error: e.message };
  }
}

// ... daily stats functions ...

export async function getDailyTasks(uid: string) {
  const today = new Date().toISOString().split('T')[0];
  const statRef = doc(db, 'users', uid, 'daily_stats', today);
  const statSnap = await getDoc(statRef);
  
  if (!statSnap.exists()) {
    const initialData = {
      videosWatched: 0,
      gamesPlayed: 0,
      loginClaimed: false,
      videosClaimed: false,
      gamesClaimed: false,
      updatedAt: serverTimestamp()
    };
    await setDoc(statRef, initialData);
    return initialData;
  }
  return statSnap.data();
}

export async function claimChainReward(uid: string, stepIndex: number, requiredType: string, requiredAmount: number, baseReward: number) {
  try {
    const userRef = doc(db, 'users', uid);
    let newTotal = 0;
    let earnedPoints = 0;

    await runTransaction(db, async (t) => {
      const userSnap = await t.get(userRef);
      if (!userSnap.exists()) throw new Error("User not found");
      const userData = userSnap.data();

      // Check current step
      const currentStep = userData.chainStep || 0;
      if (currentStep !== stepIndex) throw new Error("مرحلة غير صحيحة");

      // Verify progress
      const progress = requiredType === 'video' ? (userData.totalVideosWatched || 0) : (userData.totalGamesPlayed || 0);
      const startValue = requiredType === 'video' ? (userData[`chainVideosBase_${stepIndex}`] || 0) : (userData[`chainGamesBase_${stepIndex}`] || 0);

      if ((progress - startValue) < requiredAmount) {
         throw new Error("لم تستوفِ شروط هذه المهمة بعد");
      }

      let reward = baseReward;
      let level = userData.level || 1;
      
      // Calculate VIP / Level bonuses
       let isVIP = false;
       if (userData.isVIP && userData.vipExpiration) {
          const exp = userData.vipExpiration.toDate ? userData.vipExpiration.toDate() : new Date(userData.vipExpiration);
          if (exp > new Date()) {
              isVIP = true;
          }
       }
       
       let bonusPoints = 0;
       if (level >= 4) {
         bonusPoints = Math.floor(baseReward * 0.10);
       } else if (level >= 2) {
         bonusPoints = Math.floor(baseReward * 0.05);
       }
       
       reward += bonusPoints;
       if (isVIP) reward = Math.floor(reward * 2);
       
       earnedPoints = reward;
       newTotal = (userData.points || 0) + reward;

       const nextStep = currentStep + 1;
       
       // Record start value for next step so it's a fresh counter
       const currentTotalVideos = userData.totalVideosWatched || 0;
       const currentTotalGames = userData.totalGamesPlayed || 0;

       const updates: any = {
           points: newTotal,
           xp: (userData.xp || 0) + reward,
           chainStep: nextStep,
           [`chainStartValue_${nextStep}`]: nextStep % 2 === 0 ? currentTotalVideos : currentTotalGames // just generic recording, could record both
       };
       // Better to just record both base values for the next step
       updates[`chainVideosBase_${nextStep}`] = currentTotalVideos;
       updates[`chainGamesBase_${nextStep}`] = currentTotalGames;

      // Check level upgrades
      let currentLevel = level;
      let threshold = currentLevel * 500 + Math.pow(currentLevel, 2) * 50;
      while (updates.xp >= threshold) {
         currentLevel++;
         threshold = currentLevel * 500 + Math.pow(currentLevel, 2) * 50;
      }
      updates.level = currentLevel;

      t.update(userRef, updates);
    });

    await logHistory(uid, `إنجاز متسلسل مرحلة ${stepIndex + 1}`, earnedPoints, 'earn');
    return { success: true, newPoints: newTotal, error: null };
  } catch(e: any) {
    return { success: false, newPoints: 0, error: e.message };
  }
}

export async function claimLongtermReward(uid: string, kind: 'weeklyVideos' | 'weeklyGames' | 'monthlyVideos' | 'monthlyGames' | 'lifetime100Videos' | 'lifetime100Games', target: number, baseReward: number, title: string) {
  try {
    const userRef = doc(db, 'users', uid);
    let newTotal = 0;
    let earnedPoints = 0;
    
    await runTransaction(db, async (t) => {
      const userSnap = await t.get(userRef);
      if (!userSnap.exists()) throw new Error("User not found");
      const userData = userSnap.data();
      
      let reward = baseReward;
      let level = userData.level || 1;
      
      // Calculate VIP / Level bonuses
       let isVIP = false;
       if (userData.isVIP && userData.vipExpiration) {
          const exp = userData.vipExpiration.toDate ? userData.vipExpiration.toDate() : new Date(userData.vipExpiration);
          if (exp > new Date()) {
              isVIP = true;
          }
       }
       
       let bonusPoints = 0;
       if (level >= 4) {
         bonusPoints = Math.floor(baseReward * 0.10);
       } else if (level >= 2) {
         bonusPoints = Math.floor(baseReward * 0.05);
       }
       
       reward += bonusPoints;
       if (isVIP) reward = Math.floor(reward * 2);
       
       earnedPoints = reward;
       newTotal = (userData.points || 0) + reward;

       const updates: any = {
           points: newTotal,
           xp: (userData.xp || 0) + reward
       };

      // Condition logic
      if (kind === 'weeklyVideos') {
         if ((userData.weeklyVideosWatched || 0) < target || userData.weeklyClaimedVideos) throw new Error("غير مستوفي الشروط أو مستلم مسبقاً");
         updates.weeklyClaimedVideos = true;
      } else if (kind === 'weeklyGames') {
         if ((userData.weeklyGamesPlayed || 0) < target || userData.weeklyClaimedGames) throw new Error("غير مستوفي الشروط أو مستلم مسبقاً");
         updates.weeklyClaimedGames = true;
      } else if (kind === 'monthlyVideos') {
         if ((userData.monthlyVideosWatched || 0) < target || userData.monthlyClaimedVideos) throw new Error("غير مستوفي الشروط أو مستلم مسبقاً");
         updates.monthlyClaimedVideos = true;
      } else if (kind === 'monthlyGames') {
         if ((userData.monthlyGamesPlayed || 0) < target || userData.monthlyClaimedGames) throw new Error("غير مستوفي الشروط أو مستلم مسبقاً");
         updates.monthlyClaimedGames = true;
      } else if (kind === 'lifetime100Videos') {
         if ((userData.totalVideosWatched || 0) < target || userData.lifetimeClaimed100Videos) throw new Error("غير مستوفي الشروط أو مستلم مسبقاً");
         updates.lifetimeClaimed100Videos = true;
      } else if (kind === 'lifetime100Games') {
         if ((userData.totalGamesPlayed || 0) < target || userData.lifetimeClaimed100Games) throw new Error("غير مستوفي الشروط أو مستلم مسبقاً");
         updates.lifetimeClaimed100Games = true;
      }

      // Check level upgrades
      let currentLevel = level;
      let threshold = currentLevel * 500 + Math.pow(currentLevel, 2) * 50;
      while (updates.xp >= threshold) {
         currentLevel++;
         threshold = currentLevel * 500 + Math.pow(currentLevel, 2) * 50;
      }
      updates.level = currentLevel;

      t.update(userRef, updates);
    });

    await logHistory(uid, title, earnedPoints, 'earn');
    return { success: true, newPoints: newTotal, error: null };
  } catch(e: any) {
    return { success: false, newPoints: 0, error: e.message };
  }
}
export async function buyVip(uid: string, days: number, cost: number) {
  try {
    const userRef = doc(db, 'users', uid);
    
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) throw new Error("User not found");
      const userData = userDoc.data();
      
      if ((userData.points || 0) < cost) {
        throw new Error("رصيد غير كافٍ");
      }
      
      let exp: Date;
      if (userData.isVIP && userData.vipExpiration) {
          const currentExp = userData.vipExpiration.toDate ? userData.vipExpiration.toDate() : new Date(userData.vipExpiration);
          if (currentExp > new Date()) {
             exp = new Date(currentExp.getTime() + days * 24 * 60 * 60 * 1000);
          } else {
             exp = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
          }
      } else {
          exp = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      }
      
      transaction.update(userRef, {
         points: userData.points - cost,
         isVIP: true,
         vipExpiration: exp
      });
      
      // Add transaction history
      const historyRef = doc(collection(db, 'users', uid, 'history'));
      transaction.set(historyRef, {
        points: -cost,
        reason: `اشتراك VIP لمدة ${days} أيام`,
        type: 'spend',
        createdAt: serverTimestamp()
      });
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function incrementDailyProgress(uid: string, type: 'video' | 'game') {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // YYYY-Www for weekly, YYYY-MM for monthly
    const currentDate = new Date();
    
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const monthKey = `${year}-${month}`;
    
    // Calculate ISO week
    const target = new Date(currentDate.valueOf());
    const dayNr = (currentDate.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
    const weekKey = `${year}-W${String(weekNumber).padStart(2, '0')}`;

    const statRef = doc(db, 'users', uid, 'daily_stats', today);
    const userRef = doc(db, 'users', uid);
    
    await runTransaction(db, async (t) => {
      const statSnap = await t.get(statRef);
      if (!statSnap.exists()) {
        t.set(statRef, {
          videosWatched: type === 'video' ? 1 : 0,
          gamesPlayed: type === 'game' ? 1 : 0,
          loginClaimed: false,
          videosClaimed: false,
          gamesClaimed: false,
          updatedAt: serverTimestamp()
        });
      } else {
        const data = statSnap.data();
        const updates: any = {};
        if (type === 'video') updates.videosWatched = (data.videosWatched || 0) + 1;
        if (type === 'game') updates.gamesPlayed = (data.gamesPlayed || 0) + 1;
        t.update(statRef, updates);
      }

      // Also increment weekly, monthly, and lifetime stats directly on user doc
      const userSnap = await t.get(userRef);
      if (userSnap.exists()) {
         const userData = userSnap.data();
         const updates: any = {};
         
         // Total Stats
         if (type === 'video') updates.totalVideosWatched = (userData.totalVideosWatched || 0) + 1;
         if (type === 'game') updates.totalGamesPlayed = (userData.totalGamesPlayed || 0) + 1;
         
         // Weekly Stats
         if (userData.currentWeek !== weekKey) {
             updates.currentWeek = weekKey;
             updates.weeklyVideosWatched = type === 'video' ? 1 : 0;
             updates.weeklyGamesPlayed = type === 'game' ? 1 : 0;
             updates.weeklyClaimedVideos = false;
             updates.weeklyClaimedGames = false;
         } else {
             if (type === 'video') updates.weeklyVideosWatched = (userData.weeklyVideosWatched || 0) + 1;
             if (type === 'game') updates.weeklyGamesPlayed = (userData.weeklyGamesPlayed || 0) + 1;
         }
         
         // Monthly Stats
         if (userData.currentMonth !== monthKey) {
             updates.currentMonth = monthKey;
             updates.monthlyVideosWatched = type === 'video' ? 1 : 0;
             updates.monthlyGamesPlayed = type === 'game' ? 1 : 0;
             updates.monthlyClaimedVideos = false;
             updates.monthlyClaimedGames = false;
         } else {
             if (type === 'video') updates.monthlyVideosWatched = (userData.monthlyVideosWatched || 0) + 1;
             if (type === 'game') updates.monthlyGamesPlayed = (userData.monthlyGamesPlayed || 0) + 1;
         }
         
         t.update(userRef, updates);
      }
    });
  } catch (err) {
    console.error("Increment daily error", err);
  }
}

export async function claimDailyReward(uid: string, taskId: 'login' | 'videos' | 'games', baseReward: number, title: string) {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const statRef = doc(db, 'users', uid, 'daily_stats', today);
  const userRef = doc(db, 'users', uid);

  try {
    let newTotal = 0;
    await runTransaction(db, async (t) => {
      const statSnap = await t.get(statRef);
      let statData: any = statSnap.exists() ? statSnap.data() : { videosWatched: 0, gamesPlayed: 0, loginClaimed: false, videosClaimed: false, gamesClaimed: false };
      
      if (taskId === 'login' && statData.loginClaimed) throw new Error("تم استلام المكافأة مسبقاً");
      if (taskId === 'videos' && (statData.videosWatched < 5 || statData.videosClaimed)) throw new Error("غير مستوفي الشروط أو مستلم مسبقاً");
      if (taskId === 'games' && (statData.gamesPlayed < 3 || statData.gamesClaimed)) throw new Error("غير مستوفي الشروط أو مستلم مسبقاً");

      const userSnap = await t.get(userRef);
      if (!userSnap.exists()) throw new Error("User not found");
      
      let reward = baseReward;
      let newStreak = userSnap.data()?.streak || 0;
      let level = userSnap.data()?.level || 1;
      
      if (taskId === 'login') {
         const lastClaimDate = userSnap.data()?.lastLoginClaim;
         // If claiming yesterday, keep streak. If not, reset to 1.
         if (lastClaimDate === yesterday) {
            newStreak = (newStreak + 1) > 7 ? 7 : (newStreak + 1);
         } else if (lastClaimDate !== today) {
            newStreak = 1;
         }
         // Progressive reward: base * streak
         reward = newStreak * 20; // 20, 40, 60... up to 140
      }

      // VIP/Level multiplier (10% extra per level above 1, max 30% for lvl 4)
      if (taskId !== 'login') {
         const multiplier = 1 + ((level - 1) * 0.1);
         reward = Math.floor(baseReward * multiplier);
      }

      newTotal = (userSnap.data()?.points || 0) + reward;

      const updates: any = {};
      if (taskId === 'login') updates.loginClaimed = true;
      if (taskId === 'videos') updates.videosClaimed = true;
      if (taskId === 'games') updates.gamesClaimed = true;
      t.set(statRef, updates, { merge: true }); // Use set with merge in case doc doesn't exist
      
      const userUpdates: any = { points: newTotal };
      if (taskId === 'login') {
         userUpdates.streak = newStreak;
         userUpdates.lastLoginClaim = today;
      }
      t.update(userRef, userUpdates);

      const historyRef = doc(collection(db, 'users', uid, 'history'));
      t.set(historyRef, {
        title: taskId === 'login' ? `تسجيل الدخول (اليوم ${newStreak})` : title,
        amount: reward,
        type: 'earn',
        createdAt: serverTimestamp()
      });
    });
    return { success: true, newPoints: newTotal, error: null };
  } catch (e: any) {
    return { success: false, newPoints: 0, error: e.message };
  }
}

export async function addNotification(userId: string, title: string, message: string, type: 'reward' | 'system' | 'withdrawal' = 'system') {
  const notifRef = collection(db, 'users', userId, 'notifications');
  await addDoc(notifRef, {
    title, message, type, read: false, createdAt: serverTimestamp()
  });
}

// ... more ops will be added directly into components for brevity ...
