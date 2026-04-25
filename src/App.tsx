import React, { useState, useEffect } from 'react';
import { Header, Sidebar, BottomNav } from './components/Navigation';
import { HomeView } from './views/HomeView';
import { VideosView } from './views/VideosView';
import { OffersView } from './views/OffersView';
import { EarnView } from './views/EarnView';
import { GamesView } from './views/GamesView';
import { ReferralsView } from './views/ReferralsView';
import { LeaderboardView } from './views/LeaderboardView';
import { RewardsView } from './views/RewardsView';
import { ProfileView } from './views/ProfileView';
import { AdminView } from './views/AdminView';
import { LegalView } from './views/LegalView';

import { auth, signIn, getUserData, createUserDocument, signInWithEmail, signUpWithEmail, db } from './lib/firebase';
import { onAuthStateChanged, updateProfile, sendEmailVerification, signOut } from 'firebase/auth';
import { collection, query, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import { User, X, Loader2, Bell } from 'lucide-react';
import { getGlobalSettings } from './services/api';

const NotificationsModal = ({ isOpen, onClose, notifications, markAsRead }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl" onClick={onClose}>
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-6 relative max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 left-4 text-neutral-400"><X size={20} /></button>
        <div className="flex items-center gap-2 mb-6 text-white text-xl font-bold">
           <Bell className="text-red-500" />
           الإشعارات
        </div>
        {notifications.length === 0 ? (
          <div className="text-neutral-500 text-center py-10">لا توجد إشعارات حالياً</div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n: any) => (
               <div key={n.id} onClick={() => !n.read && markAsRead(n.id)} className={`p-4 rounded-xl border ${n.read ? 'bg-neutral-950 border-neutral-800 opacity-60' : 'bg-neutral-800 border-red-500/30 cursor-pointer'}`}>
                  <h4 className="font-bold text-white mb-1">{n.title}</h4>
                  <p className="text-sm text-neutral-400">{n.message}</p>
               </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const AuthModal = ({ isOpen, onClose, onGoogleLogin, onEmailLogin, onEmailRegister }: any) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      if (isLogin) {
        await onEmailLogin(email, password);
      } else {
        if (!name) { throw new Error('الاسم مطلوب'); }
        await onEmailRegister(email, password, name);
      }
    } catch (err: any) {
      let msg = err.message || 'حدث خطأ';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password')) msg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      else if (msg.includes('auth/email-already-in-use')) msg = 'البريد الإلكتروني مستخدم بالفعل لحساب آخر';
      else if (msg.includes('auth/weak-password')) msg = 'كلمة المرور ضعيفة جداً (يجب أن تكون 6 أحرف على الأقل)';
      else if (msg.includes('auth/invalid-email')) msg = 'صيغة البريد الإلكتروني غير صالحة';

      if (msg.includes('تم إنشاء حسابك بنجاح!')) {
         setSuccessMsg(msg);
         setIsLogin(true); // Switch back to login view after success
         setEmail('');
         setPassword('');
      } else {
         setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 left-4 text-neutral-400"><X size={20} /></button>
        <div className="text-center mb-6">
           <User size={32} className="mx-auto text-blue-500 mb-4" />
           <h2 className="text-2xl font-black text-white">{isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}</h2>
        </div>

        {error && <div className="bg-red-500/10 text-red-500 p-3 rounded-xl text-sm font-bold mb-4 text-center">{error}</div>}
        {successMsg && <div className="bg-green-500/10 text-green-500 p-3 rounded-xl text-sm font-bold mb-4 text-center">{successMsg}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-6">
          {!isLogin && (
            <input type="text" placeholder="الاسم" required value={name} onChange={e => setName(e.target.value)} className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500" />
          )}
          <input type="email" placeholder="البريد الإلكتروني" required value={email} onChange={e => setEmail(e.target.value)} className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 ltr" dir="ltr" />
          <input type="password" placeholder="كلمة المرور" required value={password} onChange={e => setPassword(e.target.value)} className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 ltr" dir="ltr" />
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl mt-2 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center">
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'دخول' : 'إنشاء حساب')}
          </button>
        </form>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-neutral-800"></div>
          <p className="text-neutral-500 text-sm">أو</p>
          <div className="flex-1 h-px bg-neutral-800"></div>
        </div>

        <button onClick={onGoogleLogin} disabled={loading} className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-neutral-200">
           توصيل مع Google
        </button>

        <div className="mt-6 text-center text-sm">
          <span className="text-neutral-400">{isLogin ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}</span>
          <button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg(''); }} className="text-blue-500 font-bold mr-2 hover:underline">
            {isLogin ? 'إنشاء حساب' : 'تسجيل الدخول'}
          </button>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [points, setPoints] = useState(0);
  const [activeTab, setActiveTab] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [refreshPoints, setRefreshPoints] = useState(0);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    getGlobalSettings().then(res => setSettings(res));
  }, []);

  useEffect(() => {
    // Check for referral code in URL
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('referralCode', ref);
    }

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        let uData: any = await getUserData(fbUser.uid);
        if (!uData) {
          uData = await createUserDocument(fbUser);
        }
        setUser(uData);
        setPoints(uData.points || 0);

        const isAdminCheck = uData.role === 'admin' || (fbUser.email && (fbUser.email.toLowerCase().trim() === 'iq.mh300@gmail.com' || fbUser.email.toLowerCase().trim() === 'wintube205@gmail.com'));
        if (isAdminCheck) setActiveTab('admin');

        // Subscribe to notifications
        const notifQuery = query(collection(db, 'users', fbUser.uid, 'notifications'), orderBy('createdAt', 'desc'));
        onSnapshot(notifQuery, (snapshot) => {
           const notifs: any[] = [];
           snapshot.forEach(doc => notifs.push({ id: doc.id, ...doc.data() }));
           setNotifications(notifs);
        });

      } else {
        setUser(null);
        setPoints(0);
        setNotifications([]);
      }
    });
    return unsub;
  }, []);

  const markAsRead = async (id: string) => {
    if(!user?.id) return;
    await updateDoc(doc(db, 'users', user.id, 'notifications', id), { read: true });
  };

  useEffect(() => {
    if (user?.id) {
       getUserData(user.id).then((uData: any) => {
           if (uData) setPoints(uData.points || 0);
       });
    }
  }, [refreshPoints]);

  const handleGoogleLogin = async () => {
    setIsAuthOpen(false);
    const fbUser = await signIn();
    if (fbUser) {
        let uData: any = await getUserData(fbUser.uid);
        if (!uData) {
          uData = await createUserDocument(fbUser);
        }
        setUser(uData);
        setPoints(uData.points || 0);
        const isAdminCheck = uData.role === 'admin' || (fbUser.email && (fbUser.email.toLowerCase().trim() === 'iq.mh300@gmail.com' || fbUser.email.toLowerCase().trim() === 'wintube205@gmail.com'));
        if (isAdminCheck) setActiveTab('admin');
    }
  };

  const handleEmailLogin = async (e: string, p: string) => {
    const fbUser = await signInWithEmail(e, p);
    if (fbUser) {
        if (!fbUser.emailVerified) {
          await signOut(auth);
          throw new Error('الرجاء تأكيد بريدك الإلكتروني أولاً عبر الرابط المرسل إليك لتفعيل حسابك (تفقد صندوق الوارد أو البريد المزعج).');
        }
        let uData: any = await getUserData(fbUser.uid);
        if (!uData) {
          uData = await createUserDocument(fbUser);
        }
        setUser(uData);
        setPoints(uData.points || 0);
        setIsAuthOpen(false);
        if (uData.role === 'admin') setActiveTab('admin');
    }
  };

  const handleEmailRegister = async (e: string, p: string, name: string) => {
    const fbUser = await signUpWithEmail(e, p);
    if (fbUser) {
        await updateProfile(fbUser, { displayName: name });
        try {
          await sendEmailVerification(fbUser);
        } catch (e) {
          console.error("Verification email failed", e);
        }
        await signOut(auth);
        throw new Error('تم إنشاء حسابك بنجاح! الرجاء الانتقال إلى بريدك الإلكتروني والضغط على رابط التفعيل قبل تسجيل الدخول.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-red-500/30">
      <Header 
         user={user} 
         points={points} 
         onOpenAuth={() => setIsAuthOpen(true)} 
         onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
         setActiveTab={setActiveTab} 
         unreadNotifications={notifications.filter(n => !n.read).length}
         onOpenNotifications={() => setIsNotifOpen(true)}
      />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} isMobile={true} onCloseSidebar={() => setIsSidebarOpen(false)} user={user} />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={true} isMobile={false} onCloseSidebar={() => {}} user={user} />

      <main className="md:pr-64 pt-20 pb-24 md:pb-8 min-h-screen flex flex-col px-4 md:px-8">
        {activeTab === 'home' && <HomeView setActiveTab={setActiveTab} />}
        {activeTab === 'videos' && <VideosView setRefreshPoints={setRefreshPoints} user={user} settings={settings} />}
        {activeTab === 'offers' && <OffersView user={user} setRefreshPoints={setRefreshPoints} />}
        {activeTab === 'earn' && <EarnView points={points} setRefreshPoints={setRefreshPoints} user={user} setActiveTab={setActiveTab} settings={settings} />}
        {activeTab === 'games' && <GamesView points={points} setRefreshPoints={setRefreshPoints} user={user} settings={settings} />}
        {activeTab === 'referrals' && <ReferralsView user={user} />}
        {activeTab === 'leaderboard' && <LeaderboardView user={user} points={points} />}
        {activeTab === 'rewards' && <RewardsView points={points} setRefreshPoints={setRefreshPoints} user={user} settings={settings} />}
        {activeTab === 'profile' && <ProfileView points={points} user={user} />}
        {activeTab === 'admin' && <AdminView user={user} onSettingsUpdated={setSettings} />}
        
        {activeTab === 'terms' && <LegalView type="terms" />}
        {activeTab === 'privacy' && <LegalView type="privacy" />}
        {activeTab === 'contact' && <LegalView type="contact" />}

        <footer className="mt-auto pt-16 pb-4 border-t border-neutral-900/50 flex flex-wrap justify-center gap-6 text-sm text-neutral-500 font-bold">
          <button onClick={() => setActiveTab('terms')} className="hover:text-red-500 transition-colors">شروط الاستخدام</button>
          <button onClick={() => setActiveTab('privacy')} className="hover:text-red-500 transition-colors">سياسة الخصوصية</button>
          <button onClick={() => setActiveTab('contact')} className="hover:text-red-500 transition-colors">اتصل بنا</button>
          <div className="w-full text-center mt-2 opacity-50">© 2026 WinTube. جميع الحقوق محفوظة.</div>
        </footer>
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onGoogleLogin={handleGoogleLogin} 
        onEmailLogin={handleEmailLogin}
        onEmailRegister={handleEmailRegister}
      />
      <NotificationsModal 
        isOpen={isNotifOpen} 
        onClose={() => setIsNotifOpen(false)} 
        notifications={notifications} 
        markAsRead={markAsRead} 
      />
    </div>
  );
};

export default App;
