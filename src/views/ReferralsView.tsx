import React, { useState } from 'react';
import { Users, CheckCircle2, Copy } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto animate-in fade-in w-full" dir="rtl">
      <div className="flex items-center gap-3 mb-6"><Users className="text-purple-500" size={28} /><h2 className="text-2xl font-black text-white">نظام الإحالة</h2></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-gradient-to-br from-purple-900/40 to-neutral-900 border border-purple-500/20 rounded-3xl p-6 md:p-8">
          <h3 className="text-xl font-bold text-white mb-2">شارك رابطك واربح!</h3>
          <p className="text-neutral-400 text-sm mb-6">احصل على 20% من جميع أرباح أصدقائك، بالإضافة إلى 500 نقطة فور تسجيلهم.</p>
          <div className="bg-neutral-950 border border-neutral-800 p-2 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-white font-mono text-sm px-4 truncate w-full" dir="ltr">{referralLink}</span>
            <button onClick={handleCopy} className={`w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm ${copied ? 'bg-green-600 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}>{copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}<span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span></button>
          </div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
          <h4 className="text-neutral-400 text-sm mb-4 font-bold">إحصائيات الإحالة</h4>
          <div className="space-y-4">
            <div className="flex justify-between bg-neutral-950 p-4 rounded-2xl border border-neutral-800"><span className="text-neutral-400">المسجلين</span><span className="font-black text-white">{user?.referralCount || 0}</span></div>
            <div className="flex justify-between bg-neutral-950 p-4 rounded-2xl border border-neutral-800"><span className="text-neutral-400">أرباحك</span><span className="font-black text-amber-400">+{user?.referralsEarnings || 0}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
