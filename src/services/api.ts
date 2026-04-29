import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, runTransaction, where } from 'firebase/firestore';

export async function submitWithdrawal(uid: string, userName: string, method: string, amount: number, points: number, account: string) {
  try {
    let success = false;
    let errorMsg = "";

    // Anti-Cheat: Enforce withdrawal cooldown
    const lastWithdrawals = await getUserWithdrawals(uid);
    if (lastWithdrawals.length > 0) {
      const lastWTime = lastWithdrawals[0].createdAt?.toMillis?.() || 0;
      if (Date.now() - lastWTime < 24 * 60 * 60 * 1000) {
         throw new Error("يمكنك تقديم طلب سحب واحد كل 24 ساعة.");
      }
    }
    
    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', uid);
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) throw new Error("User not found");
      
      const currentPoints = userDoc.data()?.points || 0;
      if (currentPoints < points) throw new Error("رصيد غير كافٍ");
      
      transaction.update(userRef, { points: currentPoints - points });
      
      const withdrawRef = doc(collection(db, 'withdrawals'));
      transaction.set(withdrawRef, {
        userId: uid,
        userName,
        method,
        account,
        amount,
        points,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      const historyRef = doc(collection(db, 'users', uid, 'history'));
      transaction.set(historyRef, {
        title: 'طلب سحب أرباح',
        amount: -points,
        type: 'spend',
        createdAt: serverTimestamp()
      });
    });
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getRecentProofs() {
  const q = query(
    collection(db, 'withdrawals'),
    where('status', '==', 'approved'),
    limit(20)
  );
  try {
    const snap = await getDocs(q);
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any);
    return data.sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function getUserWithdrawals(uid: string) {
  const q = query(
    collection(db, 'withdrawals'),
    where('userId', '==', uid)
  );
  const snap = await getDocs(q);
  const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any);
  return data.sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
}

export async function getLeaderboard(currentUid: string | null) {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('points', 'desc'), limit(10));
  const snap = await getDocs(q);
  
  const leaders = snap.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name,
    points: doc.data().points,
    isVip: doc.data().isVIP || doc.data().role === 'admin',
    hasShield: doc.data().hasShield,
    hasPromoteBadge: doc.data().hasPromoteBadge,
    isCurrentUser: doc.id === currentUid
  }));
  return leaders;
}

export async function getTopReferrals(currentUid: string | null) {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('referralCount', 'desc'), limit(10));
  const snap = await getDocs(q);
  
  const leaders = snap.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name,
    referralCount: doc.data().referralCount || 0,
    referralsEarnings: doc.data().referralsEarnings || 0,
    isVip: doc.data().isVIP || doc.data().role === 'admin',
    isCurrentUser: doc.id === currentUid
  }));
  return leaders;
}

export async function getAdminData() {
   // Since the real site might have thousands of users, we'd normally paginate or use aggregation queries.
   // For now we just query simple lists.
   const usersSnap = await getDocs(query(collection(db, 'users'), limit(50)));
   const withdrawalsSnap = await getDocs(query(collection(db, 'withdrawals'), limit(50)));
   const gamesSnap = await getDocs(collection(db, 'games'));
   
   return {
     totalUsers: usersSnap.size,
     totalPointsGiven: usersSnap.docs.reduce((acc, doc) => acc + (doc.data().points || 0), 0),
     pendingWithdrawals: withdrawalsSnap.docs.filter(d => d.data().status === 'pending').length,
     withdrawals: withdrawalsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
     users: usersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
     games: gamesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
     settings: (await getGlobalSettings())
   };
}

export async function getGlobalSettings() {
    const settingsRef = doc(db, 'settings', 'global');
    try {
      const snap = await getDoc(settingsRef);
      if (!snap.exists()) {
         const defaults = {
            videoPoints: 10,
            gamePoints: 15,
            minWithdrawal: 10, // In Dollars
            pointsPerDollar: 1000, // Conversion rate
            taskRewardLogin: 50,
            taskTargetVideos: 5,
            taskRewardVideos: 200,
            taskTargetGames: 3,
            taskRewardGames: 150,
            eventMode: false,
            myleadToken: ''
         };
         // We do not setDoc here automatically for regular users to avoid "Missing permissions"
         // AdminView will handle initialization/updates
         return defaults;
      }
      return snap.data();
    } catch (err) {
      // Fallback for cases where even read fails (rare)
      return {
          videoPoints: 10,
          gamePoints: 15,
          minWithdrawal: 10,
          pointsPerDollar: 1000,
          taskRewardLogin: 50,
          taskTargetVideos: 5,
          taskRewardVideos: 200,
          taskTargetGames: 3,
          taskRewardGames: 150,
          eventMode: false,
          myleadToken: ''
      };
    }
}

export async function updateGlobalSettings(newSettings: any) {
    const settingsRef = doc(db, 'settings', 'global');
    await setDoc(settingsRef, newSettings, { merge: true });
}

export async function handleAdminWithdrawal(id: string, action: 'approved'|'rejected', wData: any) {
   if (action === 'rejected') {
      // Refund points
      await runTransaction(db, async (t) => {
         const userRef = doc(db, 'users', wData.userId);
         const wRef = doc(db, 'withdrawals', id);
         const userSnap = await t.get(userRef);
         if (userSnap.exists()) {
             t.update(userRef, { points: (userSnap.data()?.points || 0) + wData.points });
         }
         t.update(wRef, { status: 'rejected' });
      });
   } else {
      await updateDoc(doc(db, 'withdrawals', id), { status: 'approved' });
   }
}

export async function getUserHistory(uid: string) {
   const q = query(collection(db, 'users', uid, 'history'), orderBy('createdAt', 'desc'), limit(20));
   const snap = await getDocs(q);
   return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
