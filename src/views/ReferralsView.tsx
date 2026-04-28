import React, { useState } from 'react';
import { Users, CheckCircle2, Copy, Network, ArrowDownRight, Layers } from 'lucide-react';

export const ReferralsView = ({ user }: any) => {
  const [copied, setCopied] = useState(false);
  
  // Real referral link based on the user's ID
  const referralLink = `${window.location.origin}?ref=${user?.id}`;

  const handleCopy = () => {
    const textArea = document.createElement("textarea");
    textArea.value = referralLink;
    document.body.appendChild(textArea);
    textArea.select();
    try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (err) {}
    document.body.removeChild(textArea);
  };

  if (!user) return <div className="p-20 text-center"><Users className="mx-auto text-purple-500 mb-4" size={48}/><h2 className="text-2xl font-bold text-white mb-2">دعوة الأصدقاء</h2><p className="text-neutral-400">يرجى تسجيل الدخول للحصول على رابط الدعوة.</p></div>;

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in w-full pb-20" dir="rtl">
      <div className="flex items-center gap-3 mb-8 justify-center lg:justify-start">
        <Network className="text-purple-500" size={32} />
        <h2 className="text-3xl font-black text-white">نظام الإحالة التسويقي (3 مستويات)</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-gradient-to-br from-purple-900/40 to-neutral-900 border border-purple-500/20 rounded-3xl p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl -ml-20 -mt-20"></div>
          
          <h3 className="text-2xl font-bold text-white mb-3">شارك رابطك وابنِ شبكتك! 🚀</h3>
          <p className="text-neutral-400 leading-relaxed mb-6">
            اربح ليس فقط من أصدقائك المباشرين، بل من أصدقاء أصدقائك أيضاً! احصل على عمولات عن كل نشاط يقومون به في المنصة بشكل تلقائي.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
             <div className="bg-black/40 border border-purple-500/30 rounded-2xl p-4 text-center">
                <span className="block text-xs text-purple-400 font-bold mb-1 tracking-wider uppercase">المستوى 1</span>
                <span className="block text-2xl font-black text-white">15%</span>
                <span className="text-[10px] text-neutral-500 mt-1">دعواتك المباشرة</span>
             </div>
             <div className="bg-black/40 border border-purple-500/20 rounded-2xl p-4 text-center">
                <span className="block text-xs text-purple-400 font-bold mb-1 tracking-wider uppercase">المستوى 2</span>
                <span className="block text-2xl font-black text-white">5%</span>
                <span className="text-[10px] text-neutral-500 mt-1">أصدقاء المستوى 1</span>
             </div>
             <div className="bg-black/40 border border-purple-500/10 rounded-2xl p-4 text-center">
                <span className="block text-xs text-purple-400 font-bold mb-1 tracking-wider uppercase">المستوى 3</span>
                <span className="block text-2xl font-black text-white">2%</span>
                <span className="text-[10px] text-neutral-500 mt-1">أصدقاء المستوى 2</span>
             </div>
          </div>

          <div className="bg-neutral-950/80 border border-neutral-800 p-2 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 backdrop-blur-sm shadow-xl">
             <span className="text-white font-mono text-sm px-4 truncate w-full opacity-80" dir="ltr">{referralLink}</span>
             <button onClick={handleCopy} className={`w-full sm:w-auto flex justify-center items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition-all ${copied ? 'bg-green-600 text-white shadow-lg shadow-green-900/50 scale-95' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/50'}`}>
                {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
             </button>
          </div>
          
          <div className="mt-4 text-xs text-purple-300/60 font-medium text-center">
             * تحصل أيضاً على مكافأة تسجيل 100 نقطة عن كل صديق مباشر (مستوى 1).
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 relative overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 mb-6">
             <Layers className="text-amber-500" size={20} />
             <h4 className="text-white font-bold">إحصائيات الشبكة</h4>
          </div>
          
          <div className="space-y-3 flex-1">
             <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 flex justify-between items-center group hover:border-purple-500/30 transition-colors">
                <div className="flex flex-col">
                   <span className="text-xs text-neutral-500 mb-1">المسجلين (مباشرين)</span>
                   <span className="text-neutral-300 flex items-center gap-1"><Users size={12}/> الإجمالي</span>
                </div>
                <span className="text-2xl font-black text-white">{user?.referralCount || 0}</span>
             </div>
             
             <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-4 rounded-2xl border border-amber-500/20 flex justify-between items-center mt-6">
                <div className="flex flex-col">
                   <span className="text-xs text-amber-500/70 font-bold mb-1">إجمالي الأرباح السلبية</span>
                   <span className="text-amber-400 font-bold">من جميع الشبكة</span>
                </div>
                <span className="text-2xl font-black text-amber-400">+{user?.referralsEarnings || 0}</span>
             </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-neutral-800/50">
             <h5 className="text-xs text-neutral-500 mb-3 font-bold">تفصيل الأرباح حسب المستوى</h5>
             <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-neutral-400 flex items-center gap-1"><ArrowDownRight size={14}/> مستوى 1</span><span className="text-white font-mono">+{user?.levelings?.level1 || 0}</span></div>
                <div className="flex justify-between text-sm"><span className="text-neutral-400 flex items-center gap-1"><ArrowDownRight size={14}/> مستوى 2</span><span className="text-white font-mono">+{user?.levelings?.level2 || 0}</span></div>
                <div className="flex justify-between text-sm"><span className="text-neutral-400 flex items-center gap-1"><ArrowDownRight size={14}/> مستوى 3</span><span className="text-white font-mono">+{user?.levelings?.level3 || 0}</span></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
