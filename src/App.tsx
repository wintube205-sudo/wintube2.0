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

import { auth, signIn, getUserData, createUserDocument } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { User, X } from 'lucide-react';

const AuthModal = ({ isOpen, onClose, onLogin }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 left-4 text-neutral-400"><X size={20} /></button>
        <div className="text-center mb-8"><User size={32} className="mx-auto text-blue-500 mb-4" /><h2 className="text-2xl font-black text-white">تسجيل الدخول</h2></div>
        <button onClick={onLogin} className="w-full bg-white text-black font-bold py-3 rounded-xl mb-4 hover:bg-neutral-200">الدخول عبر Google</button>
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

  const handleLogin = async () => {
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
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLogin={handleLogin} />
    </div>
  );
}
