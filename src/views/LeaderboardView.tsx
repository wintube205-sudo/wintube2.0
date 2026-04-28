import React, { useState, useEffect } from 'react';
import { Trophy, Loader2, Gift, Clock, Shield, Zap, Users } from 'lucide-react';
import { getLeaderboard, getTopReferrals } from '../services/api';

export const LeaderboardView = ({ user, points }: any) => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'points' | 'referrals'>('points');

  // For weekly timer
  const [timeRemaining, setTimeRemaining] = useState('');
  useEffect(() => {
     const calcTime = () => {
        const now = new Date();
        const endOfWeek = new Date();
        // Set to next Sunday at 23:59:59
        endOfWeek.setDate(now.getDate() + (7 - now.getDay()) % 7);
        if (endOfWeek.getDay() === now.getDay() && now.getHours() === 23 && now.getMinutes() >= 59) {
           endOfWeek.setDate(endOfWeek.getDate() + 7);
        }
        endOfWeek.setHours(23, 59, 59, 999);
        const diff = endOfWeek.getTime() - now.getTime();
        
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / 1000 / 60) % 60);
        setTimeRemaining(`${d}يوم ${h}س ${m}د`);
     };
     calcTime();
     const interval = setInterval(calcTime, 60000);
     return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setLoading(true);
    if (activeTab === 'points') {
      getLeaderboard(user?.id).then(res => {
        setLeaders(res);
        setLoading(false);
      });
    } else {
      getTopReferrals(user?.id).then(res => {
        setLeaders(res);
        setLoading(false);
      });
    }
  }, [user, points, activeTab]);

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in w-full pb-20" dir="rtl">
      <div className="flex items-center gap-3 mb-6 justify-center"><Trophy className="text-amber-500" size={36} /><h2 className="text-3xl font-black text-white">المنافسة والتصدر</h2></div>
      
      <div className="flex justify-center mb-8 gap-4">
        <button 
          onClick={() => setActiveTab('points')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'points' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/50' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'}`}
        >
          <Trophy size={20} />
          <span>أكثر النقاط الأسبوعية</span>
        </button>
        <button 
          onClick={() => setActiveTab('referrals')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'referrals' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'}`}
        >
          <Users size={20} />
          <span>أفضل الإحالات</span>
        </button>
      </div>

      {activeTab === 'points' ? (
        <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/10 border border-amber-500/30 rounded-3xl p-6 mb-8 flex flex-col items-center text-center">
           <Gift className="text-amber-400 mb-2" size={40} />
           <h3 className="text-2xl font-black text-white mb-2">جوائز التوب 10 الأسبوعية</h3>
           <p className="text-amber-200/80 mb-4 max-w-lg">
             أول 10 متصدرين بالنقاط يحصلون على مكافآت ضخمة نهاية كل أسبوع! كلما زاد تفاعلك (فيديوهات، ألعاب، مهام) زادت فرصتك.
           </p>
           <div className="flex flex-wrap justify-center gap-2 mb-4">
              <span className="bg-amber-500/20 text-amber-500 font-bold px-3 py-1 rounded-full text-sm">المركز الأول: 100,000 نقطة</span>
              <span className="bg-amber-500/20 text-amber-500 font-bold px-3 py-1 rounded-full text-sm">التوب 3: 50,000 نقطة</span>
              <span className="bg-neutral-800 text-neutral-300 font-bold px-3 py-1 rounded-full text-sm">الرابع - العاشر: 10,000 نقطة</span>
           </div>
           <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl text-neutral-300 text-sm">
              <Clock size={16} className="text-amber-500" /> التوزيع القادم بعد: <span className="text-white font-bold">{timeRemaining}</span>
           </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/10 border border-purple-500/30 rounded-3xl p-6 mb-8 flex flex-col items-center text-center">
           <Gift className="text-purple-400 mb-2" size={40} />
           <h3 className="text-2xl font-black text-white mb-2">جوائز أفضل صانعي الشبكات</h3>
           <p className="text-purple-200/80 mb-4 max-w-lg">
             أول 10 متصدرين بدعوات الأصدقاء (الإحالات) يحصلون على جوائز نقدية شهرية. استمر في بناء شبكتك وضاعف أرباحك السلبية!
           </p>
           <div className="flex flex-wrap justify-center gap-2 mb-4">
              <span className="bg-purple-500/20 text-purple-400 font-bold px-3 py-1 rounded-full text-sm">المركز الأول: $100</span>
              <span className="bg-purple-500/20 text-purple-400 font-bold px-3 py-1 rounded-full text-sm">الثاني والثالث: $50</span>
              <span className="bg-neutral-800 text-neutral-300 font-bold px-3 py-1 rounded-full text-sm">الرابع - العاشر: $10</span>
           </div>
        </div>
      )}

      {loading ? ( <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-500" size={40} /></div> ) : (
        <div className="space-y-3">
          {leaders.map((leader, index) => {
            const isTop3 = index < 3;
            const rankColors = ['bg-yellow-500/10 border-yellow-500/30 text-yellow-500', 'bg-gray-300/10 border-gray-300/30 text-gray-300', 'bg-amber-700/10 border-amber-700/30 text-amber-600'];
            const rankStyle = isTop3 ? rankColors[index] : 'bg-neutral-900 border-neutral-800 text-neutral-400';
            return (
              <div key={leader.id || index} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${rankStyle} ${leader.isCurrentUser ? 'ring-2 ring-blue-500' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center font-black text-lg">{index + 1}</div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold bg-neutral-700">{leader.name?.charAt(0) || 'U'}</div>
                    <div>
                      <span className={`font-bold text-lg ${leader.isCurrentUser ? 'text-blue-400' : 'text-white'}`}>{leader.name} {leader.isCurrentUser && <span className="text-xs ml-1 text-blue-300">(أنت)</span>}</span>
                      {leader.isVip && <span className="bg-purple-500/20 text-purple-400 text-[10px] px-2 ml-2 rounded font-bold">VIP</span>}
                      {leader.hasShield && <Shield className="inline w-4 h-4 ml-1 text-blue-400" />}
                      {leader.hasPromoteBadge && <Zap className="inline w-4 h-4 ml-1 text-purple-400" />}
                    </div>
                  </div>
                </div>
                <div className="font-black text-xl">
                  {activeTab === 'points' ? (
                     <div className="flex items-center gap-1 text-amber-400"><Zap size={20} /> {leader.points?.toLocaleString() || 0}</div>
                  ) : (
                     <div className="flex flex-col items-end">
                       <span className="flex items-center gap-1 text-purple-400"><Users size={20} /> {leader.referralCount?.toLocaleString() || 0} إحالة</span>
                       <span className="text-xs text-neutral-500 font-mono">+{leader.referralsEarnings?.toLocaleString() || 0} نقطة</span>
                     </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
