import React, { useEffect, useState } from 'react';
import { History, Coins, Trophy, Flame, Users, LogOut, Crown, Shield, Zap } from 'lucide-react';
import { getUserHistory } from '../services/api';
import { signOut, buyVip } from '../lib/firebase';

export const ProfileView = ({ user, points, setRefreshPoints }: any) => {
  const [history, setHistory] = useState<any[]>([]);
  const [buyingVip, setBuyingVip] = useState(false);

  useEffect(() => {
    if (user?.id) {
       getUserHistory(user.id).then(res => setHistory(res));
    }
  }, [user, points]);

  if (!user) return <div className="text-center py-20 text-neutral-500">يرجى تسجيل الدخول لعرض حسابك</div>;
  
  const levelNames = ['برونزي', 'فضي', 'ذهبي', 'ماسي', 'أسطورة'];

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in w-full" dir="rtl">
      <div className="flex items-center gap-4 mb-6">
         <div className="w-20 h-20 shrink-0 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-black text-3xl">{user.name?.charAt(0) || 'U'}</div>
         <div className="flex-1">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
                {user.name} 
                {user.role === 'admin' && <span className="bg-red-500 text-xs px-2 py-1 rounded text-white">مدير</span>}
                {user.hasShield && <Shield className="w-5 h-5 text-blue-400" />}
                {user.hasPromoteBadge && <Zap className="w-5 h-5 text-purple-400" />}
            </h2>
            <p className="text-neutral-400 mb-2">{user.email}</p>
            
            {/* XP Progress Bar */}
            {(() => {
               const level = user.level || 1;
               const xp = user.xp || 0;
               const nextLevelThreshold = level * 500 + Math.pow(level, 2) * 50;
               const prevLevelThreshold = level > 1 ? ((level - 1) * 500 + Math.pow(level - 1, 2) * 50) : 0;
               const xpInCurrentLevel = xp - prevLevelThreshold;
               const xpRequiredForNext = nextLevelThreshold - prevLevelThreshold;
               const progressPercent = Math.min(100, Math.max(0, (xpInCurrentLevel / xpRequiredForNext) * 100));
               return (
                 <div className="w-full">
                   <div className="flex justify-between text-xs font-bold mb-1">
                     <span className="text-blue-400">مستوى {level}</span>
                     <span className="text-neutral-400">{Math.floor(xpInCurrentLevel)} / {Math.floor(xpRequiredForNext)} XP</span>
                     <span className="text-neutral-500">مستوى {level + 1}</span>
                   </div>
                   <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all" style={{ width: `${progressPercent}%` }}></div>
                   </div>
                 </div>
               );
            })()}
         </div>
         <button onClick={() => signOut()} className="mr-auto shrink-0 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-bold text-sm">
           <LogOut size={16} className="hidden sm:block" /> تسجيل خروج
         </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
         <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <Trophy className="text-amber-500 mb-2" size={24} />
            <span className="text-xs text-neutral-400 mb-1">الرتبة</span>
            <span className="font-bold text-white text-lg">{levelNames[(user.level || 1)-1] || `مستوى ${user.level}`}</span>
         </div>
         <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <Flame className="text-orange-500 mb-2" size={24} />
            <span className="text-xs text-neutral-400 mb-1">تسجيل منتظم</span>
            <span className="font-bold text-white text-lg">{user.streak || 0} أيام</span>
         </div>
         <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <Users className="text-blue-500 mb-2" size={24} />
            <span className="text-xs text-neutral-400 mb-1">عدد الإحالات</span>
            <span className="font-bold text-white text-lg">{user.referralCount || 0}</span>
         </div>
         <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <Coins className="text-green-500 mb-2" size={24} />
            <span className="text-xs text-neutral-400 mb-1">أرباح الإحالة</span>
            <span className="font-bold text-white text-lg">{user.referralsEarnings || 0}</span>
         </div>
      </div>

      {/* Level Perks Section */}
      <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-500/20 rounded-3xl p-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
           <Trophy size={100} />
        </div>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">مزايا مستواك الحالي (مستوى {user.level || 1})</h3>
        <ul className="space-y-3 text-neutral-300">
           <li className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-blue-500"></div>
             ربح أساسي من المهام ومشاهدة الفيديوهات.
           </li>
           {(user.level || 1) >= 2 && (
             <li className="flex items-center gap-2 text-white font-bold">
               <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
               مكافأة 5% إضافية على كل نقطة تكسبها.
             </li>
           )}
           {(user.level || 1) >= 3 && (
             <li className="flex items-center gap-2 text-white font-bold">
               <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
               أولوية في سرعة معالجة السحوبات (أقل من 12 ساعة).
             </li>
           )}
           {(user.level || 1) >= 4 && (
             <li className="flex items-center gap-2 text-white font-bold">
               <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
               مكافأة 10% إضافية على كل نقطة تكسبها + مهام سرية عالية القيمة.
             </li>
           )}
           {(user.level || 1) < 4 && (
             <li className="flex items-center gap-2 text-neutral-500 mt-4 text-sm mt-4">
               استمر في جمع النقاط لفتح مزايا أكثر! كل تفاعل في التطبيق يمنحك XP.
             </li>
           )}
        </ul>
      </div>

      {/* VIP Subscription Section */}
      <div className="bg-gradient-to-br from-amber-900/40 to-yellow-900/40 border border-amber-500/50 rounded-3xl p-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
           <Crown size={100} />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
           <h3 className="text-xl font-bold text-amber-500 flex items-center gap-2">
             <Crown className="text-amber-500" />
             نظام VIP
           </h3>
           
           {user.isVIP ? (
              <span className="bg-amber-500/20 text-amber-500 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                 نشط حتى {new Date(user.vipExpiration?.toDate ? user.vipExpiration.toDate() : user.vipExpiration).toLocaleDateString('ar-EG')}
              </span>
           ) : (
              <span className="bg-neutral-800 text-neutral-400 px-3 py-1 rounded-full text-sm font-bold">
                 غير نشط
              </span>
           )}
        </div>
        
        <p className="text-neutral-300 mb-4 font-bold">
          اشترك الآن بنقاطك واحصل على مزايا خرافية لتسريع أرباحك:
        </p>
        
        <ul className="grid sm:grid-cols-2 gap-3 text-sm text-neutral-300 mb-6 relative z-10">
           <li className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-amber-500"></div> مضاعفة الأرباح 2x
           </li>
           <li className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-amber-500"></div> إعلانات أقل
           </li>
           <li className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-amber-500"></div> عروض حصرية للـ VIP
           </li>
           <li className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-amber-500"></div> سرعة السحب الفائقة
           </li>
        </ul>
        
        <div className="flex gap-3 relative z-10">
           <button 
             disabled={buyingVip || points < 5000}
             onClick={async () => {
                 setBuyingVip(true);
                 const res = await buyVip(user.id, 7, 5000);
                 if (res.success) {
                    alert('تم تفعيل VIP بنجاح لـ 7 أيام!');
                    setRefreshPoints((p: number) => p + 1);
                 } else {
                    alert(res.error);
                 }
                 setBuyingVip(false);
             }}
             className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl disabled:opacity-50 transition-colors"
           >
             7 أيام (5000 نقطة)
           </button>
           <button 
             disabled={buyingVip || points < 15000}
             onClick={async () => {
                 setBuyingVip(true);
                 const res = await buyVip(user.id, 30, 15000);
                 if (res.success) {
                    alert('تم تفعيل VIP بنجاح لـ 30 يوم!');
                    setRefreshPoints((p: number) => p + 1);
                 } else {
                    alert(res.error);
                 }
                 setBuyingVip(false);
             }}
             className="flex-1 bg-gradient-to-r from-amber-400 to-yellow-600 hover:opacity-90 text-black font-black py-3 rounded-xl disabled:opacity-50 shadow-lg shadow-amber-500/20 transition-opacity"
           >
             30 يوم (15000 نقطة)
           </button>
        </div>
      </div>

      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><History className="text-blue-500" /> سجل العمليات</h3>
      {history.length === 0 ? ( <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-10 text-center text-neutral-500">لا توجد عمليات مسجلة حتى الآن.</div> ) : (
         <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
            {history.map((item, index) => (
               <div key={item.id} className={`flex items-center justify-between p-4 ${index !== history.length - 1 ? 'border-b border-neutral-800' : ''}`}>
                  <div><p className="font-bold text-white text-sm">{item.title}</p><p className="text-xs text-neutral-500 mt-1">{new Date(item.createdAt?.toDate?.() || Date.now()).toLocaleDateString('ar-EG')}</p></div>
                  <div className={`font-black flex items-center gap-1 ${item.type === 'earn' ? 'text-green-500' : item.type === 'spend' ? 'text-red-500' : 'text-neutral-400'}`}>
                     {item.amount > 0 ? '+' : ''}{item.amount !== 0 ? item.amount.toLocaleString() : '-'} <Coins size={12}/>
                  </div>
               </div>
            ))}
         </div>
      )}
    </div>
  );
};
