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

import { auth, signIn, getUserData, createUserDocument, signInWithEmail, signUpWithEmail } from './lib/firebase';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { User, X, Loader2 } from 'lucide-react';

const AuthModal = ({ isOpen, onClose, onGoogleLogin, onEmailLogin, onEmailRegister }: any) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await onEmailLogin(email, password);
      } else {
        if (!name) { throw new Error('الاسم مطلوب'); }
        await onEmailRegister(email, password, name);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ');
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
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-blue-500 font-bold mr-2 hover:underline">
            {isLogin ? 'إنشاء حساب' : 'تسجيل الدخول'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [points, setPoints] = useState(0);
  const [activeTab, setActiveTab] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [refreshPoints, setRefreshPoints] = useState(0);

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
      } else {
        setUser(null);
        setPoints(0);
      }
    });
    return unsub;
  }, []);

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
        if (uData.role === 'admin') setActiveTab('admin');
    }
  };

  const handleEmailLogin = async (e: string, p: string) => {
    const fbUser = await signInWithEmail(e, p);
    if (fbUser) {
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
        fbUser.displayName = name; // Update local reference
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

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-red-500/30">
      <Header user={user} points={points} onOpenAuth={() => setIsAuthOpen(true)} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} setActiveTab={setActiveTab} />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} isMobile={true} onCloseSidebar={() => setIsSidebarOpen(false)} user={user} />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={true} isMobile={false} onCloseSidebar={() => {}} user={user} />

      <main className="md:pr-64 pt-20 pb-24 md:pb-8 min-h-screen flex flex-col px-4 md:px-8">
        {activeTab === 'home' && <HomeView setActiveTab={setActiveTab} />}
        {activeTab === 'videos' && <VideosView setRefreshPoints={setRefreshPoints} user={user} />}
        {activeTab === 'offers' && <OffersView user={user} setRefreshPoints={setRefreshPoints} />}
        {activeTab === 'earn' && <EarnView points={points} setRefreshPoints={setRefreshPoints} user={user} setActiveTab={setActiveTab} />}
        {activeTab === 'games' && <GamesView points={points} setRefreshPoints={setRefreshPoints} user={user} />}
        {activeTab === 'referrals' && <ReferralsView user={user} />}
        {activeTab === 'leaderboard' && <LeaderboardView user={user} points={points} />}
        {activeTab === 'rewards' && <RewardsView points={points} setRefreshPoints={setRefreshPoints} user={user} />}
        {activeTab === 'profile' && <ProfileView points={points} user={user} />}
        {activeTab === 'admin' && <AdminView user={user} />}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onGoogleLogin={handleGoogleLogin} 
        onEmailLogin={handleEmailLogin}
        onEmailRegister={handleEmailRegister}
      />
    </div>
  );
}
