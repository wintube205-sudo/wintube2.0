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
  return { id: snap.id, ...snap.data() };
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
    streak: 0, // Daily login streak
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
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) throw new Error("User does not exist!");
      const currentPoints = userDoc.data()?.points || 0;
      newTotal = currentPoints + pointsDelta;
      if (newTotal < 0) throw new Error("Insufficient points");
      transaction.update(userRef, { points: newTotal });
    });
    
    await logHistory(uid, reason, pointsDelta, type);
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

export async function incrementDailyProgress(uid: string, type: 'video' | 'game') {
  try {
    const today = new Date().toISOString().split('T')[0];
    const statRef = doc(db, 'users', uid, 'daily_stats', today);
    
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
