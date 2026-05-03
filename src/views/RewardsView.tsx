import React, { useState, useEffect } from 'react';
import { Wallet, Clock, CheckCircle2, XCircle, ArrowDownToLine, Loader2, History } from 'lucide-react';
import { submitWithdrawal, getUserWithdrawals } from '../services/api';

export const RewardsView = ({ points, user, setRefreshPoints, settings }: any) => {
  const [toast, setToast] = useState('');
  const [method, setMethod] = useState('USDT (TRC20)');
  const [account, setAccount] = useState('');
  const [withdrawPoints, setWithdrawPoints] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const minWithdrawal = settings?.minWithdrawal || 10;
  const pointsPerDollar = settings?.pointsPerDollar || 1000;
  const minPoints = minWithdrawal * pointsPerDollar;

  useEffect(() => {
    if (user) {
       loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
     setLoadingHistory(true);
     try {
       const withdrawals = await getUserWithdrawals(user.id);
       setHistory(withdrawals);
     } catch (e) {
       console.error("Error loading withdrawals", e);
     }
     setLoadingHistory(false);
  }

  const handleWithdraw = async () => {
    if (!user) return showToast('الرجاء تسجيل الدخول أولاً');
    
    const pointsToWithdraw = Number(withdrawPoints);
    if (!pointsToWithdraw || pointsToWithdraw <= 0) return showToast('الرجاء إدخال عدد النقاط المراد سحبها');
    if (pointsToWithdraw < minPoints) return showToast(`الحد الأدنى للسحب هو ${minPoints.toLocaleString()} نقطة ($${minWithdrawal})`);
    if (pointsToWithdraw > points) return showToast('رصيدك الحالي لا يكفي لهذا السحب');
    if (!account) return showToast('يرجى إدخال رقم الحساب');
    
    // Anti-Cheat: Max Withdrawal Limit (e.g., $100 per request) constraints 
    const maxWithdrawalPoints = 100 * pointsPerDollar;
    if (pointsToWithdraw > maxWithdrawalPoints) {
       return showToast(`الحد الأقصى للسحب في المرة الواحدة هو ${maxWithdrawalPoints.toLocaleString()} نقطة ($100).`);
    }
    
    setLoading(true);
    const amount = pointsToWithdraw / pointsPerDollar; 
    const res = await submitWithdrawal(user.id, user.name || 'مستخدم', method, amount, pointsToWithdraw, account);
    
    if (res.success) {
      showToast('تم تقديم طلب السحب بنجاح!');
      setRefreshPoints((p: number) => p + 1);
      setAccount('');
      setWithdrawPoints('');
      loadHistory();
    } else {
      showToast(` خطأ: ${res.error}`);
    }
    setLoading(false);
  }

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }

  const formatStatus = (status: string) => {
      if (status === 'approved') return <span className="text-sm font-bold text-green-400 flex items-center gap-1"><CheckCircle2 size={16}/> مكتمل</span>;
      if (status === 'rejected') return <span className="text-sm font-bold text-red-500 flex items-center gap-1"><XCircle size={16}/> مرفوض</span>;
      return <span className="text-sm font-bold text-amber-500 flex items-center gap-1"><Clock size={16}/> قيد المراجعة</span>;
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in w-full pb-20" dir="rtl">
      <div className="flex items-center gap-3 mb-8 justify-center">
         <Wallet className="text-green-500" size={36} />
         <h2 className="text-3xl font-black text-white">المحفظة (Wallet)</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Withdrawal Form */}
         <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
           
           <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-2xl p-6 mb-6 text-center border border-green-500/20 shadow-inner">
             <p className="text-green-400/80 text-sm mb-2 font-bold uppercase tracking-wider">الرصيد المتاح للسحب</p>
             <p className="text-5xl font-black text-green-400 mb-2">${user ? (points / pointsPerDollar).toFixed(2) : '0.00'}</p>
             <div className="bg-black/30 rounded-full py-1.5 px-4 inline-block">
                <p className="text-green-300/70 text-sm font-mono">{points.toLocaleString()} <span className="text-xs">نقاط</span></p>
             </div>
           </div>

           <div className="space-y-4">
             <div>
                <label className="block text-sm font-bold text-neutral-400 mb-2">طريقة السحب</label>
                <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full bg-black/50 border border-neutral-800 rounded-xl p-3.5 text-white focus:outline-none focus:border-green-500 transition-colors">
                  <option>USDT (TRC20)</option>
                  <option>فيزا / ماستر كارد (Visa / Mastercard)</option>
                  <option>Zain Cash</option>
                  <option>PayPal</option>
                  <option>Payeer</option>
                </select>
             </div>
             <div>
                <label className="block text-sm font-bold text-neutral-400 mb-2 flex justify-between">
                   <span>كمية النقاط للسحب</span>
                   <span className="text-xs text-green-500">الحد الأدنى: {minPoints.toLocaleString()}</span>
                </label>
                <div className="relative">
                   <input 
                     type="number" 
                     value={withdrawPoints} 
                     onChange={(e) => setWithdrawPoints(e.target.value === '' ? '' : Number(e.target.value))} 
                     placeholder={`مثال: ${minPoints}`} 
                     className="w-full bg-black/50 border border-neutral-800 rounded-xl p-3.5 text-white focus:outline-none focus:border-green-500 font-mono transition-colors" 
                   />
                   {withdrawPoints && (
                     <div className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400 font-bold bg-green-500/10 px-2 py-1 rounded text-sm">
                       ~ ${(Number(withdrawPoints) / pointsPerDollar).toFixed(2)}
                     </div>
                   )}
                </div>
             </div>
             <div>
                <label className="block text-sm font-bold text-neutral-400 mb-2">معلومات الحساب</label>
                <input type="text" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="رقم الحساب / عنوان المحفظة / رقم البطاقة" className="w-full bg-black/50 border border-neutral-800 rounded-xl p-3.5 text-white focus:outline-none focus:border-green-500 transition-colors" />
             </div>
             
             <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mt-2">
                <p className="text-amber-400/90 text-xs leading-relaxed flex items-start gap-2">
                   <Clock className="min-w-4 w-4 h-4 mt-0.5" />
                   لأسباب أمنية، تخضع عملية السحب للمراجعة وقد تستغرق من 24 إلى 48 ساعة. يحق لك طلب سحب واحد كل 24 ساعة.
                </p>
             </div>

             <button disabled={loading} onClick={handleWithdraw} className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl mt-4 disabled:opacity-50 transition-colors shadow-lg shadow-green-900/50 flex justify-center items-center gap-2">
                {loading ? <Loader2 className="animate-spin" /> : <><ArrowDownToLine size={20} /> تأكيد طلب السحب</>}
             </button>
           </div>
         </div>

         {/* History */}
         <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><History className="text-blue-500" /> سجل السحوبات</h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
               {loadingHistory ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-neutral-500" /></div>
               ) : history.length === 0 ? (
                  <div className="text-center py-10 text-neutral-500 border border-dashed border-neutral-800 rounded-2xl">
                     لا يوجد طلبات سحب سابقة.
                  </div>
               ) : (
                  history.map(item => (
                     <div key={item.id} className="bg-black/40 border border-neutral-800/50 rounded-2xl p-4 hover:border-neutral-700 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                           <div>
                              <p className="font-bold text-white">${item.amount}</p>
                              <p className="text-xs text-neutral-500">{new Date(item.createdAt?.toMillis?.() || Date.now()).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                           </div>
                           <div className="bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800">
                              {formatStatus(item.status)}
                           </div>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-3 border-t border-neutral-800/50 mt-2">
                           <span className="text-neutral-400">{item.method}</span>
                           <span className="text-neutral-500 font-mono text-xs truncate max-w-[150px]" title={item.account}>{item.account}</span>
                        </div>
                     </div>
                  ))
               )}
            </div>
         </div>
      </div>

      {toast && (
         <div className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full font-bold text-sm z-50 shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom ${toast.includes('خطأ') ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
            {toast}
         </div>
      )}
    </div>
  );
};

