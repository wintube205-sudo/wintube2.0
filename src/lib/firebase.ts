import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, runTransaction, writeBatch, where } from 'firebase/firestore';
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

export async function resetUserPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error: any) {
    console.error("Password Reset Error:", error);
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
  if (data.banned) {
     throw new Error("Anti-Cheat: حسابك محظور.");
  }

  // Anti-Cheat: Validate Device ID
  const dId = getDeviceId();
  if (data.deviceId && data.deviceId !== dId) {
     // User logged in from a new device/browser, or changed it
     await updateDoc(userRef, { deviceId: dId });
  }

  if (data.isVIP && data.vipExpiration) {
    const exp = data.vipExpiration.toDate ? data.vipExpiration.toDate() : new Date(data.vipExpiration);
    if (exp <= new Date()) {
      data.isVIP = false;
    }
  }
  return { id: snap.id, ...data };
}

// Anti-Cheat: Get or generate Device ID
export function getDeviceId() {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
}

// Anti-Cheat: Proxy / VPN Detection
export async function checkVPNAndProxy() {
  try {
     // A simple fallback check comparing timezone from browser and timezone from IP
     // In a real production app, you would use a service like IPQualityScore or ip-api (pro)
     const res = await fetch('https://ipapi.co/json/');
     const data = await res.json();
     const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
     
     // Extremely basic and non-restrictive check for demonstration
     if (data.timezone && browserTimezone && data.timezone !== browserTimezone) {
        // Just note it, don't necessarily block yet to avoid false positives in development
        console.warn("Anti-Cheat: Timezone mismatch - possible VPN usage detected.");
     }
  } catch (e) {
     console.error("Anti-Cheat: VPN check failed");
  }
}

export async function recordAffiliateClick(affId: string) {
   try {
      const affRef = doc(db, 'users', affId);
      const affDoc = await getDoc(affRef);
      if (affDoc.exists() && affDoc.data()?.isMarketer) {
         await updateDoc(affRef, {
             affiliateClicks: (affDoc.data()?.affiliateClicks || 0) + 1
         });
      }
   } catch(e) {
      console.error(e);
   }
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

  // Anti-Cheat: Prevent multi-accounting
  const deviceId = getDeviceId();
  const usersWithSameDeviceQuery = query(collection(db, 'users'), where('deviceId', '==', deviceId), limit(1));
  const sameDeviceDocs = await getDocs(usersWithSameDeviceQuery);
  if (!sameDeviceDocs.empty) {
     // Throw an error to stop creation (user will be created in Auth but barred from DB/app)
     // A robust app would delete the auth record, but here we just throw.
     throw new Error("Anti-Cheat: تم اكتشاف حساب آخر على هذا الجهاز. تعدد الحسابات ممنوع.");
  }

  let refCode = localStorage.getItem('referralCode');
  let affCode = localStorage.getItem('affiliateCode');
  
  let ref1 = null;
  let ref2 = null;
  let ref3 = null;
  let referredByAffiliate = null;

  // Process normal ref code
  if (refCode && refCode !== user.uid) {
    ref1 = refCode;
    try {
      const parentDoc = await getDoc(doc(db, 'users', ref1));
      if (parentDoc.exists()) {
         ref2 = parentDoc.data()?.ref1 || null;
         ref3 = parentDoc.data()?.ref2 || null;
      } else {
         ref1 = null; // invalid refcode
      }
    } catch(e) { console.error(e) }
  }

  // Process affiliate code
  if (affCode && affCode !== user.uid) {
     try {
        const affDoc = await getDoc(doc(db, 'users', affCode));
        if (affDoc.exists() && affDoc.data()?.isMarketer) {
           referredByAffiliate = affCode;
        }
     } catch(e) { console.error(e) }
  }

  const newUser = {
    name: user.displayName || 'مستخدم',
    email: user.email || 'user@example.com',
    role: 'user', // default role
    points: 0,
    banned: false,
    referralCount: 0,
    referralsEarnings: 0,
    referredBy: ref1, // Legacy
    ref1, // Level 1
    ref2, // Level 2
    ref3, // Level 3
    levelings: { level1: 0, level2: 0, level3: 0 }, // earnings by levels
    level: 1, // Start at level 1 (Bronze)
    xp: 0, // Experience Points
    deviceId: deviceId, // Anti-Cheat marker
    isMarketer: false,
    referredByAffiliate,
    affiliateClicks: 0,
    affiliateSignups: 0,
    affiliateBalance: 0,

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

  if (refCode && refCode !== user.uid && !referredByAffiliate) {
    try {
      await processReferralReward(refCode);
      localStorage.removeItem('referralCode');
    } catch(e: any) {
      console.error("Referral Error", e);
    }
  }

  if (referredByAffiliate) {
     try {
       await processAffiliateReward(referredByAffiliate);
       localStorage.removeItem('affiliateCode');
     } catch(e: any) {
       console.error("Affiliate Error", e);
     }
  }

  return { id: user.uid, ...newUser };
}

async function processAffiliateReward(affId: string) {
   const affRef = doc(db, 'users', affId);
   await runTransaction(db, async (t) => {
      const affDoc = await t.get(affRef);
      if (!affDoc.exists()) return;

      const currentBalance = affDoc.data()?.affiliateBalance || 0;
      const currentSignups = affDoc.data()?.affiliateSignups || 0;

      // Give $0.50 per signup (example amount)
      t.update(affRef, {
         affiliateBalance: currentBalance + 0.50,
         affiliateSignups: currentSignups + 1
      });
   });
}

async function processReferralReward(referrerId: string) {
  const referrerRef = doc(db, 'users', referrerId);
  await runTransaction(db, async (t) => {
    const referrerDoc = await t.get(referrerRef);
    if (!referrerDoc.exists()) return;
    
    const currentPoints = referrerDoc.data()?.points || 0;
    const refCount = referrerDoc.data()?.referralCount || 0;
    const refEarnings = referrerDoc.data()?.referralsEarnings || 0;
    const levelings = referrerDoc.data()?.levelings || { level1: 0, level2: 0, level3: 0 };
    
    levelings.level1 = (levelings.level1 || 0) + 100;

    t.update(referrerRef, {
        points: currentPoints + 100,
        referralCount: refCount + 1,
        referralsEarnings: refEarnings + 100,
        levelings: levelings
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
    // Anti-Cheat: Bot Protection (Rate Limiting)
    if (type === 'earn') {
       const now = Date.now();
       const lastAction = Number(localStorage.getItem('anti_cheat_last_action')) || 0;
       if (now - lastAction < 1000) { // Actions less than 1 second apart
          throw new Error("Anti-Cheat: تم رصد سرعة غير طبيعية (Bot Protection). يرجى الانتظار.");
       }
       localStorage.setItem('anti_cheat_last_action', String(now));
    }

    const userRef = doc(db, 'users', uid);
    
    let newTotal = 0;
    
    // Arrays for tracking multi-level commissions
    let commissions: { id: string, amount: number, level: number, refDoc: any }[] = [];

    await runTransaction(db, async (transaction) => {
      // 1. All Reads
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) throw new Error("User does not exist!");
      const userData = userDoc.data();
      
      let ref1Doc = null, ref2Doc = null, ref3Doc = null;
      if (type === 'earn' && pointsDelta > 0) {
        if (userData?.ref1 || userData?.referredBy) {
           const id1 = userData.ref1 || userData.referredBy;
           ref1Doc = await transaction.get(doc(db, 'users', id1));
           if (ref1Doc.exists()) {
             commissions.push({ id: id1, amount: Math.max(1, Math.floor(pointsDelta * 0.15)), level: 1, refDoc: ref1Doc.data() });
           }
        }
        if (userData?.ref2) {
           ref2Doc = await transaction.get(doc(db, 'users', userData.ref2));
           if (ref2Doc.exists()) {
             commissions.push({ id: userData.ref2, amount: Math.max(1, Math.floor(pointsDelta * 0.05)), level: 2, refDoc: ref2Doc.data() });
           }
        }
        if (userData?.ref3) {
           ref3Doc = await transaction.get(doc(db, 'users', userData.ref3));
           if (ref3Doc.exists()) {
             commissions.push({ id: userData.ref3, amount: Math.max(1, Math.floor(pointsDelta * 0.02)), level: 3, refDoc: ref3Doc.data() });
           }
        }
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
         
         // Give 1 XP per point earned
         let newXp = currentXp + finalPointsDelta;
         
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
         }
      }

      transaction.update(userRef, updateData);

      for (const comm of commissions) {
         if (comm.amount > 0) {
            const refRef = doc(db, 'users', comm.id);
            const levelingsObj = comm.refDoc.levelings || { level1: 0, level2: 0, level3: 0 };
            levelingsObj[`level${comm.level}`] = (levelingsObj[`level${comm.level}`] || 0) + comm.amount;
            
            transaction.update(refRef, {
              points: (comm.refDoc.points || 0) + comm.amount,
              referralsEarnings: (comm.refDoc.referralsEarnings || 0) + comm.amount,
              levelings: levelingsObj
            });
         }
      }
    });
    
    const shortReason = reason.length > 90 ? reason.substring(0, 90) + '...' : reason;
    await logHistory(uid, shortReason, pointsDelta, type);

    if (type === 'earn' && pointsDelta >= 500) {
       await addNotification(uid, "ربح كبير! 🚀", `لقد حققت أرباحاً جيدة (${pointsDelta} نقطة) من ${shortReason}. استمر في التقدم! العب المزيد لمضاعفة أرباحك! 🤑`, 'reward');
    }

    // Log commission history & notification
    for (const comm of commissions) {
       if (comm.amount > 0) {
           await logHistory(comm.id, `أرباح إحالة (مستوى ${comm.level}) ${comm.level === 1 ? '15' : comm.level === 2 ? '5' : '2'}% من نشاط صديق`, comm.amount, 'earn');
           if (comm.amount >= 100) {
               await addNotification(comm.id, "أرباح إحالة مجزية! 🤑", `لقد ربحت للتو ${comm.amount} نقطة من أصدقائك (مستوى ${comm.level})! قم بدعوة المزيد لزيادة أرباحك السلبية.`, 'reward');
           }
       }
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
      const startValue = requiredType === 'video' ? (userData.chainVideosBase || 0) : (userData.chainGamesBase || 0);

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
           chainVideosBase: currentTotalVideos,
           chainGamesBase: currentTotalGames
       };

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

export async function submitVipRequest(uid: string, userName: string, method: string, amount: number, transactionId: string) {
  try {
    await addDoc(collection(db, 'vip_requests'), {
      userId: uid,
      userName,
      method,
      amount,
      transactionId,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    return { success: true };
  } catch(e: any) {
    return { success: false, error: e.message };
  }
}

export async function checkDailyLimit(uid: string, type: 'video' | 'game'): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const statRef = doc(db, 'users', uid, 'daily_stats', today);
    const snap = await getDoc(statRef);
    if (!snap.exists()) return true;
    const data = snap.data();
    if (type === 'video' && (data.videosWatched || 0) >= 20) return false;
    if (type === 'game' && (data.gamesPlayed || 0) >= 20) return false;
    return true;
  } catch (e) {
    console.error("Error checking daily limit", e);
    return true; // Allow on error to not block users accidentally
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
      const userSnap = await t.get(userRef);
      
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

export async function sendGlobalNotification(title: string, message: string, type: 'system' | 'reward' = 'system') {
  const usersSnap = await getDocs(collection(db, 'users'));
  const batch = writeBatch(db);
  let count = 0;
  
  usersSnap.forEach((userDoc) => {
     if (count >= 495) return; // Prevent batch limit error for demo purposes
     const notifRef = doc(collection(db, 'users', userDoc.id, 'notifications'));
     batch.set(notifRef, {
         title, message, type, read: false, createdAt: serverTimestamp()
     });
     count++;
  });
  
  if (count > 0) {
    await batch.commit();
  }
}

export async function purchaseStoreItem(uid: string, itemId: string, cost: number, itemName: string) {
  try {
    const userRef = doc(db, 'users', uid);
    
    await runTransaction(db, async (t) => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists()) throw new Error("User not found");
      const userData = userDoc.data();
      
      if ((userData.points || 0) < cost) {
        throw new Error("رصيد غير كافٍ");
      }

      const updates: any = { points: userData.points - cost };

      if (itemId === 'vip_1_day' || itemId === 'vip_7_days') {
         const days = itemId === 'vip_1_day' ? 1 : 7;
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
         updates.isVIP = true;
         updates.vipExpiration = exp;
      } else if (itemId === 'profile_shield') {
         updates.hasShield = true;
      } else if (itemId === 'promote_post') {
         updates.hasPromoteBadge = true;
      }

      t.update(userRef, updates);
    });

    await logHistory(uid, `شراء من المتجر: ${itemName}`, -cost, 'spend');
    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function transferPoints(senderUid: string, receiverEmail: string, amount: number, fee: number) {
   if (amount <= 0 || fee < 0) return { success: false, error: "المبلغ غير صالح" };
   const totalDeduction = amount;
   const amountToTransfer = amount - fee;

   try {
     const senderRef = doc(db, 'users', senderUid);
     
     const usersRef = collection(db, 'users');
     const q = query(usersRef, where("email", "==", receiverEmail), limit(1));
     const docsSnap = await getDocs(q);
     if (docsSnap.empty) throw new Error("المستلم غير موجود (تأكد من البريد الإلكتروني)");
     const receiverDocSnapshot = docsSnap.docs[0];
     const receiverRef = doc(db, 'users', receiverDocSnapshot.id);

     if (senderUid === receiverDocSnapshot.id) throw new Error("لا يمكنك التحويل لنفسك");

     await runTransaction(db, async (t) => {
         const sDoc = await t.get(senderRef);
         const rDoc = await t.get(receiverRef);

         if (!sDoc.exists() || !rDoc.exists()) throw new Error("خطأ في البيانات");
         
         const sData = sDoc.data();
         if ((sData.points || 0) < totalDeduction) {
             throw new Error("رصيد غير كافٍ");
         }

         const rData = rDoc.data();

         t.update(senderRef, { points: sData.points - totalDeduction });
         t.update(receiverRef, { points: (rData.points || 0) + amountToTransfer });
     });

     await logHistory(senderUid, `تحويل نقاط إلى ${receiverEmail}`, -totalDeduction, 'spend');
     await logHistory(receiverDocSnapshot.id, `استلام نقاط من لاعب`, amountToTransfer, 'earn');
     
     return { success: true, error: null };
   } catch(e: any) {
     return { success: false, error: e.message };
   }
}
