import React, { useState } from 'react';
import { Wallet } from 'lucide-react';
import { submitWithdrawal } from '../services/api';

export const RewardsView = ({ points, user, setRefreshPoints, settings }: any) => {
  const [toast, setToast] = useState('');
  const [method, setMethod] = useState('USDT (TRC20)');
  const [account, setAccount] = useState('');
  const [withdrawPoints, setWithdrawPoints] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);

  const minWithdrawal = settings?.minWithdrawal || 10;
  const pointsPerDollar = settings?.pointsPerDollar || 1000;
  const minPoints = minWithdrawal * pointsPerDollar;

  const handleWithdraw = async () => {
    if (!user) return showToast('الرجاء تسجيل الدخول أولاً');
    
    const pointsToWithdraw = Number(withdrawPoints);
    if (!pointsToWithdraw || pointsToWithdraw <= 0) return showToast('الرجاء إدخال عدد النقاط المراد سحبها');
    if (pointsToWithdraw < minPoints) return showToast(`الحد الأدنى للسحب هو ${minPoints.toLocaleString()} نقطة ($${minWithdrawal})`);
    if (pointsToWithdraw > points) return showToast('رصيدك الحالي لا يكفي لهذا السحب');
    if (!account) return showToast('يرجى إدخال رقم الحساب');
    
    setLoading(true);
    const amount = pointsToWithdraw / pointsPerDollar; 
    const res = await submitWithdrawal(user.id, user.name || 'مستخدم', method, amount, pointsToWithdraw, account);
    
    if (res.success) {
      showToast('تم تقديم طلب السحب بنجاح!');
      setRefreshPoints((p: number) => p + 1);
      setAccount('');
      setWithdrawPoints('');
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
          <p className="text-neutral-400 text-sm mb-1">الرصيد القابل للسحب بمحفظتك</p>
          <p className="text-3xl font-black text-green-400">${user ? (points / pointsPerDollar).toFixed(2) : '0.00'}</p>
          <p className="text-neutral-500 text-xs mt-2">الرصيد الحالي: {points.toLocaleString()} نقطة</p>
        </div>
        <div className="space-y-4">
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-green-500">
            <option>USDT (TRC20)</option>
            <option>فيزا / ماستر كارد (Visa / Mastercard)</option>
            <option>Zain Cash</option>
          </select>
          <input 
            type="number" 
            value={withdrawPoints} 
            onChange={(e) => setWithdrawPoints(e.target.value === '' ? '' : Number(e.target.value))} 
            placeholder={`عدد النقاط المراد سحبها (الحد الأدنى ${minPoints.toLocaleString()})`} 
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-green-500" 
          />
          <input type="text" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="رقم الحساب / عنوان المحفظة / رقم البطاقة" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-green-500" />
          <div className="text-sm text-neutral-400 text-center mt-2">سيعادل: <span className="text-green-400 font-bold">${withdrawPoints ? (Number(withdrawPoints) / pointsPerDollar).toFixed(2) : '0.00'}</span></div>
          <button disabled={loading} onClick={handleWithdraw} className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl mt-4 disabled:opacity-50">
             {loading ? 'جاري التقديم...' : 'تقديم طلب السحب'}
          </button>
        </div>
      </div>
      {toast && <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full font-bold text-sm bg-blue-600 text-white z-50">{toast}</div>}
    </div>
  );
};

