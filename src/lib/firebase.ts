import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
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
  const refCode = localStorage.getItem('referralCode');

  const newUser = {
    name: user.displayName || 'مستخدم',
    email: user.email,
    role: 'user', // default role
    points: 0,
    banned: false,
    referralCount: 0,
    referralsEarnings: 0,
    referredBy: refCode || null,
    createdAt: serverTimestamp(),
  };
  await setDoc(userRef, newUser);

  if (refCode && refCode !== user.uid) {
    try {
      await processReferralReward(refCode);
      localStorage.removeItem('referralCode');
    } catch(e) {
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
        points: currentPoints + 500,
        referralCount: refCount + 1,
        referralsEarnings: refEarnings + 500
    });

    const historyRef = doc(collection(db, 'users', referrerId, 'history'));
    t.set(historyRef, {
        title: 'مكافأة دعوة صديق',
        amount: 500,
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

export async function claimDailyReward(uid: string, taskId: 'login' | 'videos' | 'games', reward: number, title: string) {
  const today = new Date().toISOString().split('T')[0];
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
      newTotal = (userSnap.data()?.points || 0) + reward;

      const updates: any = {};
      if (taskId === 'login') updates.loginClaimed = true;
      if (taskId === 'videos') updates.videosClaimed = true;
      if (taskId === 'games') updates.gamesClaimed = true;
      t.update(statRef, updates);
      
      t.update(userRef, { points: newTotal });

      const historyRef = doc(collection(db, 'users', uid, 'history'));
      t.set(historyRef, {
        title: title,
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

// ... more ops will be added directly into components for brevity ...
