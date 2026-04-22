import React, { useState } from 'react';
import { Play, Gamepad2, Briefcase, Trophy, User, LogIn, Menu, Wallet, Flame, Users, LayoutDashboard, ShieldCheck, Coins, Bell, LogOut } from 'lucide-react';
import { signOut } from '../lib/firebase';

export const Header = ({ user, points, onOpenAuth, onToggleSidebar, setActiveTab, unreadNotifications = 0, onOpenNotifications }: any) => (
  <header className="fixed top-0 left-0 right-0 h-16 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 z-40 flex items-center justify-between px-4">
    <div className="flex items-center gap-3">
      <button onClick={onToggleSidebar} className="md:hidden text-neutral-400 hover:text-white"><Menu size={24} /></button>
      <div onClick={() => setActiveTab('home')} className="flex items-center gap-2 cursor-pointer">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center shadow-lg shadow-red-600/20"><Play fill="white" size={16} className="text-white" /></div>
        <span className="text-xl font-extrabold tracking-tight hidden sm:block text-white">Win<span className="text-red-500">Tube</span></span>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <div className="hidden md:flex items-center gap-1 text-green-500 text-xs font-bold px-2 py-1 bg-green-500/10 rounded-full border border-green-500/20"><ShieldCheck size={14} /> آمن</div>
      {user ? (
        <>
          <button onClick={onOpenNotifications} className="relative p-2 text-neutral-400 hover:text-white transition-colors">
            <Bell size={20} />
            {unreadNotifications > 0 && (
               <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-neutral-950"></span>
            )}
          </button>
          <div className="flex items-center gap-2 bg-neutral-900 px-4 py-1.5 rounded-full border border-neutral-800 cursor-pointer hover:bg-neutral-800 transition-colors" onClick={() => setActiveTab('rewards')}>
            <Coins size={16} className="text-amber-400" />
            <span className="text-amber-400 font-bold text-sm">{points.toLocaleString()} PTS</span>
          </div>
          <button onClick={() => setActiveTab('profile')} className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm border-2 border-neutral-800 hover:border-blue-500 transition-all">
            {user.avatar || user.name?.charAt(0) || 'U'}
          </button>
        </>
      ) : (
        <button onClick={onOpenAuth} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"><LogIn size={16} /><span>دخول</span></button>
      )}
    </div>
  </header>
);

export const Sidebar = ({ activeTab, setActiveTab, isOpen, isMobile, onCloseSidebar, user }: any) => {
  const navItems = [
    { id: 'home', icon: Play, label: 'الرئيسية' },
    { id: 'videos', icon: Play, label: 'الفيديوهات' },
    { id: 'offers', icon: Briefcase, label: 'جدار العروض', badge: 'جديد' },
    { id: 'earn', icon: Flame, label: 'المهام اليومية' },
    { id: 'games', icon: Gamepad2, label: 'الألعاب' },
    { id: 'referrals', icon: Users, label: 'دعوة الأصدقاء' },
    { id: 'leaderboard', icon: Trophy, label: 'المتصدرين' },
    { id: 'rewards', icon: Wallet, label: 'سحب الأرباح' },
  ];
  if (user?.role === 'admin') navItems.push({ id: 'admin', icon: LayoutDashboard, label: 'لوحة التحكم', badge: 'مدير' });

  const sidebarClass = isMobile 
    ? `fixed inset-y-0 right-0 w-64 bg-neutral-950 border-l border-neutral-800 z-50 transform transition-transform duration-300 overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'}`
    : `hidden md:flex flex-col fixed right-0 top-16 bottom-0 w-64 bg-neutral-950 border-l border-neutral-800 z-30 py-6 px-4 overflow-y-auto`;

  return (
    <>
      {isMobile && isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onCloseSidebar}></div>}
      <aside className={sidebarClass} dir="rtl">
        <nav className="flex flex-col gap-1 flex-grow mt-16 md:mt-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => { setActiveTab(item.id); if(isMobile) onCloseSidebar(); }} className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-sm text-right w-full ${isActive ? 'bg-red-600/10 text-red-500' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'}`}>
                <div className="flex items-center gap-4"><Icon size={20} className={isActive ? 'text-red-500' : ''} />{item.label}</div>
                {item.badge && <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.id === 'admin' ? 'bg-amber-500/20 text-amber-500' : 'bg-red-500/20 text-red-500'}`}>{item.badge}</span>}
              </button>
            );
          })}
          
          {user && (
            <div className="mt-auto pt-8 pb-4">
              <button onClick={() => { signOut(); setActiveTab('home'); if(isMobile) onCloseSidebar(); }} className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold text-sm text-right w-full text-red-500 hover:bg-neutral-900 border border-transparent hover:border-red-500/20">
                <LogOut size={20} /> تسجيل خروج
              </button>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
};

export const BottomNav = ({ activeTab, setActiveTab }: any) => {
  const navItems = [{ id: 'home', icon: Play, label: 'الرئيسية' }, { id: 'offers', icon: Briefcase, label: 'عروض' }, { id: 'games', icon: Gamepad2, label: 'ألعاب' }, { id: 'rewards', icon: Wallet, label: 'سحب' }, { id: 'profile', icon: User, label: 'حسابي' }];
  return (
    <nav className="md:hidden fixed bottom-0 w-full bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-800 z-40 pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeTab === item.id ? 'text-red-500' : 'text-neutral-500 hover:text-neutral-300'}`}>
            <item.icon size={20} className="mb-1" /><span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
