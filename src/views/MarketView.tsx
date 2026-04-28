import React, { useState } from 'react';
import { ShoppingCart, Send, Crown, Zap, Shield, ArrowRightLeft, Gift, Loader2, CheckCircle2 } from 'lucide-react';
import { purchaseStoreItem, transferPoints } from '../lib/firebase';

export const MarketView = ({ user, points, setRefreshPoints }: any) => {
   const [activeTab, setActiveTab] = useState<'store' | 'p2p'>('store');
   const [isProcessing, setIsProcessing] = useState(false);
   const [toast, setToast] = useState<any>(null);

   const [transferEmail, setTransferEmail] = useState('');
   const [transferAmount, setTransferAmount] = useState('');

   const storeItems = [
      { id: 'vip_1_day', name: 'عضوية VIP (يوم واحد)', desc: 'مضاعفة جميع النقاط المكتسبة لمدة 24 ساعة!', price: 10000, icon: Crown, color: 'text-amber-400', bg: 'bg-amber-400/20' },
      { id: 'vip_7_days', name: 'عضوية VIP (أسبوع)', desc: 'مضاعفة جميع النقاط المكتسبة لمدة 7 أيام!', price: 50000, icon: Crown, color: 'text-amber-500', bg: 'bg-amber-500/20' },
      { id: 'profile_shield', name: 'درع الحماية', desc: 'شارة مميزة تظهر بجانب اسمك', price: 5000, icon: Shield, color: 'text-blue-400', bg: 'bg-blue-400/20' },
      { id: 'promote_post', name: 'ترويج حساب', desc: 'ضع حسابك في قائمة التوصيات (قريباً)', price: 15000, icon: Zap, color: 'text-purple-400', bg: 'bg-purple-400/20' },
   ];

   const handlePurchase = async (item: any) => {
      if (!user) return;
      if (points < item.price) {
         setToast({ msg: 'رصيدك غير كافٍ', isError: true });
         setTimeout(() => setToast(null), 3000);
         return;
      }
      if (confirm(`هل أنت متأكد من شراء "${item.name}" مقابل ${item.price} نقطة؟`)) {
         setIsProcessing(true);
         const res = await purchaseStoreItem(user.id, item.id, item.price, item.name);
         setIsProcessing(false);
         if (res.success) {
            setRefreshPoints((p: number) => p + 1);
            setToast({ msg: 'تم الشراء بنجاح!', isError: false });
         } else {
            setToast({ msg: res.error, isError: true });
         }
         setTimeout(() => setToast(null), 3000);
      }
   };

   const handleTransfer = async () => {
       if (!user) return;
       const amt = Number(transferAmount);
       if (!transferEmail || isNaN(amt) || amt <= 0) {
           setToast({ msg: 'الرجاء إدخال بيانات صحيحة', isError: true });
           setTimeout(() => setToast(null), 3000);
           return;
       }
       if (points < amt) {
           setToast({ msg: 'رصيدك غير كافٍ', isError: true });
           setTimeout(() => setToast(null), 3000);
           return;
       }
       const fee = Math.ceil(amt * 0.10); // 10% fee
       if (confirm(`هل أنت متأكد من تحويل ${amt} نقطة إلى ${transferEmail}؟ سيتم خصم عمولة 10% (${fee} نقطة).`)) {
           setIsProcessing(true);
           const res = await transferPoints(user.id, transferEmail, amt, fee);
           setIsProcessing(false);
           if (res.success) {
               setTransferEmail('');
               setTransferAmount('');
               setRefreshPoints((p: number) => p + 1);
               setToast({ msg: 'تم التحويل بنجاح!', isError: false });
           } else {
               setToast({ msg: res.error, isError: true });
           }
           setTimeout(() => setToast(null), 3000);
       }
   };

   return (
      <div className="max-w-4xl mx-auto animate-in fade-in w-full pb-20" dir="rtl">
         <div className="flex items-center gap-3 mb-8 justify-center">
            <ShoppingCart className="text-amber-500" size={36} />
            <h2 className="text-3xl font-black text-white">السوق (Marketplace)</h2>
         </div>

         <div className="flex bg-neutral-900 p-1 rounded-2xl mb-8 w-fit mx-auto">
            <button onClick={() => setActiveTab('store')} className={`px-6 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 ${activeTab === 'store' ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:text-white'}`}>
               <Gift size={18}/> المتجر الرسمي
            </button>
            <button onClick={() => setActiveTab('p2p')} className={`px-6 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 ${activeTab === 'p2p' ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:text-white'}`}>
               <ArrowRightLeft size={18}/> سوق اللاعبين (P2P)
            </button>
         </div>

         {activeTab === 'store' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {storeItems.map(item => (
                  <div key={item.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between hover:border-neutral-700 transition-colors">
                     <div className="flex items-start gap-4 mb-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${item.bg} ${item.color}`}>
                           <item.icon size={28} />
                        </div>
                        <div>
                           <h3 className="font-bold text-lg text-white mb-1">{item.name}</h3>
                           <p className="text-neutral-400 text-sm leading-relaxed">{item.desc}</p>
                        </div>
                     </div>
                     <div className="flex items-center justify-between mt-auto pt-4 border-t border-neutral-800">
                        <div className="font-mono font-bold text-amber-500">{item.price.toLocaleString()} نقطة</div>
                        <button 
                           onClick={() => handlePurchase(item)}
                           disabled={isProcessing}
                           className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50"
                        >
                           شراء الآن
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         )}

         {activeTab === 'p2p' && (
            <div className="max-w-md mx-auto">
               <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                  
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Send className="text-blue-500"/> تحويل النقاط</h3>
                  <p className="text-neutral-400 text-sm mb-6 pb-6 border-b border-neutral-800">يمكنك تحويل رصيدك من النقاط إلى لاعب آخر لبيعها خارج المنصة أو إهدائها. تُطبق عمولة 10% على كل عملية تحويل.</p>

                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-bold text-neutral-300 mb-2">البريد الإلكتروني للمستلم</label>
                        <input 
                           type="email" 
                           value={transferEmail}
                           onChange={(e) => setTransferEmail(e.target.value)}
                           placeholder="user@example.com"
                           className="w-full bg-black/50 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                     </div>
                     
                     <div>
                        <label className="block text-sm font-bold text-neutral-300 mb-2">المبلغ (الكمية)</label>
                        <input 
                           type="number" 
                           value={transferAmount}
                           onChange={(e) => setTransferAmount(e.target.value)}
                           placeholder="مثال: 5000"
                           className="w-full bg-black/50 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-mono transition-colors"
                        />
                     </div>

                     <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-200">
                        <div className="flex justify-between mb-1">
                           <span>المبلغ المحول:</span>
                           <span className="font-mono">{Number(transferAmount) ? Number(transferAmount).toLocaleString() : 0}</span>
                        </div>
                        <div className="flex justify-between mb-1 text-red-400">
                           <span>العمولة (10%):</span>
                           <span className="font-mono">- {Number(transferAmount) ? Math.ceil(Number(transferAmount) * 0.10).toLocaleString() : 0}</span>
                        </div>
                        <div className="flex justify-between font-bold text-blue-400 mt-2 pt-2 border-t border-blue-500/20">
                           <span>يصل للمستلم:</span>
                           <span className="font-mono">{Number(transferAmount) ? (Number(transferAmount) - Math.ceil(Number(transferAmount) * 0.10)).toLocaleString() : 0}</span>
                        </div>
                     </div>

                     <button 
                        onClick={handleTransfer}
                        disabled={isProcessing}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 group disabled:opacity-50"
                     >
                        {isProcessing ? <Loader2 className="animate-spin" /> : <><Send size={18} className="transition-transform group-hover:-translate-x-1" /> إرسال النقاط</>}
                     </button>
                  </div>
               </div>
            </div>
         )}
         
         {toast && (
            <div className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full font-bold text-white z-50 shadow-lg ${toast.isError ? 'bg-red-600' : 'bg-green-600'} flex items-center gap-2`}>
               {!toast.isError && <CheckCircle2 size={20} />} {toast.msg}
            </div>
         )}
      </div>
   );
};
