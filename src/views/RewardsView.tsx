import React, { useState } from 'react';
import { Wallet } from 'lucide-react';
import { submitWithdrawal } from '../services/api';

export const RewardsView = ({ points, user, setRefreshPoints }: any) => {
  const [toast, setToast] = useState('');
  const [method, setMethod] = useState('USDT (TRC20)');
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async () => {
    if (!user) return showToast('الرجاء تسجيل الدخول أولاً');
    if (points < 50000) return showToast('الحد الأدنى للسحب 50,000 نقطة');
    if (!account) return showToast('يرجى إدخال رقم الحساب');
    
    setLoading(true);
    const amount = points / 1000; 
    const res = await submitWithdrawal(user.id, user.name || 'مستخدم', method, amount, points);
    
    if (res.success) {
      showToast('تم تقديم طلب السحب بنجاح!');
      setRefreshPoints((p: number) => p + 1);
      setAccount('');
    } else {
      showToast(` خطأ: ${res.error}`);
    }
    setLoading(false);
  }

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in w-full" dir="rtl">
      <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2"><Wallet className="text-green-500" /> سحب الأرباح</h2>
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
        <div className="bg-neutral-950 rounded-xl p-4 mb-6 text-center border border-neutral-800">
          <p className="text-neutral-400 text-sm mb-1">الرصيد القابل للسحب</p>
          <p className="text-3xl font-black text-green-400">${user ? (points / 1000).toFixed(2) : '0.00'}</p>
          <p className="text-neutral-500 text-xs mt-2">الرصيد الحالي: {points.toLocaleString()} نقطة</p>
        </div>
        <div className="space-y-4">
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-green-500">
            <option>USDT (TRC20)</option>
            <option>فيزا / ماستر كارد (Visa / Mastercard)</option>
            <option>Zain Cash</option>
          </select>
          <input type="text" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="رقم الحساب / عنوان المحفظة / رقم البطاقة" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-green-500" />
          <button disabled={loading} onClick={handleWithdraw} className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl mt-4 disabled:opacity-50">
             {loading ? 'جاري التقديم...' : 'تقديم طلب السحب'}
          </button>
        </div>
      </div>
      {toast && <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full font-bold text-sm bg-blue-600 text-white z-50">{toast}</div>}
    </div>
  );
};
