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

// ... more ops will be added directly into components for brevity ...
