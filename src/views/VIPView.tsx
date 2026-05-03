import React, { useState } from 'react';
import { Crown, CreditCard, ShieldCheck, CheckCircle2, Copy, Zap, Star } from 'lucide-react';
import { submitVipRequest, buyVip } from '../lib/firebase';

export const VIPView = ({ user, points, setRefreshPoints }: any) => {
    const [tab, setTab] = useState<'points' | 'cash'>('cash');
    const [method, setMethod] = useState<'mastercard' | 'usdt'>('mastercard');
    const [txId, setTxId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState('');

    const cards = [
        { id: 'mastercard', label: 'Mastercard / Visa', value: import.meta.env.VITE_VIP_MASTERCARD || 'يجب تعيين المتغير البيئي' },
        { id: 'usdt', label: 'USDT (TRC-20)', value: import.meta.env.VITE_VIP_USDT || 'يجب تعيين المتغير البيئي' }
    ];

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast('تم النسخ إلى الحافظة');
    };

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(''), 4000);
    };

    const handleSubmitManual = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return showToast('يرجى تسجيل الدخول أولاً');
        if (!txId.trim()) return showToast('يرجى إدخال رقم العملية أو سكرين شوت');

        setSubmitting(true);
        const res = await submitVipRequest(user.id, user.name, method === 'mastercard' ? 'Mastercard' : 'USDT', 19, txId);
        if (res.success) {
            showToast('تم إرسال طلبك بنجاح! سيتم تفعيله خلال 12-24 ساعة.');
            setTxId('');
        } else {
            showToast('خطأ: ' + res.error);
        }
        setSubmitting(false);
    };

    const handleBuyWithPoints = async (days: number, cost: number) => {
        if (!user) return showToast('يرجى تسجيل الدخول أولاً');
        if (points < cost) return showToast('رصيد نقاطك غير كافٍ');

        setSubmitting(true);
        const res = await buyVip(user.id, days, cost);
        if (res.success) {
            showToast(`تم تفعيل الـ VIP بنجاح لمدة ${days} يوم!`);
            setRefreshPoints((p: number) => p + 1);
        } else {
            showToast('خطأ: ' + res.error);
        }
        setSubmitting(false);
    };

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in w-full pb-20 px-4 sm:px-0" dir="rtl">
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500/20 rounded-full mb-4 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                    <Crown size={48} className="text-amber-500" />
                </div>
                <h2 className="text-4xl font-black text-white mb-2">ترقية حسابك إلى VIP</h2>
                <p className="text-neutral-400 font-bold italic">ضاعف أرباحك، تخلص من الإعلانات، واسحب أموالك فوراً!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <Star className="text-amber-500" /> مميزات الـ VIP
                    </h3>
                    <ul className="space-y-4">
                        {[
                            { icon: Zap, text: 'مضاعفة 2x لجميع النقاط المكتسبة من الفيديوهات والألعاب.' },
                            { icon: ShieldCheck, text: 'إزالة الإعلانات المنبثقة والبانرات الترويجية.' },
                            { icon: Star, text: 'أولوية قصوى في معالجة طلبات السحب (دفع فوري).' },
                            { icon: Crown, text: 'شارة VIP ذهبية مميزة بجانب اسمك في المتصدرين.' },
                            { icon: Star, text: 'الوصول إلى عروض حصرية تمنحك آلاف النقاط يومياً.' }
                        ].map((perk, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <perk.icon className="text-amber-500 shrink-0 mt-1" size={18} />
                                <span className="text-neutral-300 font-medium">{perk.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="space-y-4">
                    <div className="flex p-1 bg-neutral-900 rounded-2xl border border-neutral-800">
                        <button onClick={() => setTab('cash')} className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${tab === 'cash' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-neutral-400 hover:text-white'}`}>
                            اشتراك دائم ($19)
                        </button>
                        <button onClick={() => setTab('points')} className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${tab === 'points' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-neutral-400 hover:text-white'}`}>
                            اشتراك بالنقاط
                        </button>
                    </div>

                    {tab === 'cash' && (
                        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 space-y-6">
                            <h4 className="text-xl font-black text-white text-center">ترقية دائمة بـ 19 دولار</h4>
                            
                            <div className="flex gap-4">
                                {cards.map(c => (
                                    <button 
                                        key={c.id} 
                                        onClick={() => setMethod(c.id as any)} 
                                        className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${method === c.id ? 'border-amber-500 bg-amber-500/10' : 'border-neutral-800 bg-neutral-950 text-neutral-500'}`}
                                    >
                                        <CreditCard size={24} />
                                        <span className="text-xs font-bold">{c.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl">
                                <p className="text-xs text-neutral-500 mb-2">قم بتحويل مبلغ 19$ إلى الحساب التالي:</p>
                                <div className="flex items-center justify-between bg-neutral-900 p-3 rounded-xl border border-neutral-800">
                                    <span className="font-mono text-white text-sm break-all">{cards.find(c => c.id === method)?.value}</span>
                                    <button onClick={() => copyToClipboard(cards.find(c => c.id === method)?.value || '')} className="text-neutral-400 hover:text-amber-500 px-2">
                                        <Copy size={18} />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleSubmitManual} className="space-y-4">
                                <div>
                                    <label className="text-white text-xs font-bold block mb-2">رقم العملية أو اسم المحول (Transaction ID)</label>
                                    <input 
                                        required
                                        type="text" 
                                        value={txId}
                                        onChange={e => setTxId(e.target.value)}
                                        placeholder="اكتب رقم العملية هنا..."
                                        className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-xl text-white focus:border-amber-500 outline-none"
                                    />
                                </div>
                                <button disabled={submitting} type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-xl shadow-lg shadow-green-600/20 transition-all disabled:opacity-50">
                                    تأكيد عملية الدفع
                                </button>
                            </form>
                        </div>
                    )}

                    {tab === 'points' && (
                        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 space-y-4">
                            <h4 className="text-xl font-black text-white text-center">اشترك بنقاطك المستحقة</h4>
                            <div className="grid grid-cols-1 gap-4">
                                <button 
                                    disabled={submitting || points < 5000}
                                    onClick={() => handleBuyWithPoints(7, 5000)}
                                    className="bg-neutral-950 border border-neutral-800 p-6 rounded-2xl flex justify-between items-center hover:border-amber-500/30 transition-all disabled:opacity-50 group"
                                >
                                    <div className="text-right">
                                        <div className="text-white font-bold text-lg">7 أيام VIP</div>
                                        <div className="text-amber-500 font-bold">5000 نقطة</div>
                                    </div>
                                    <Crown className="text-neutral-700 group-hover:text-amber-500 transition-colors" size={32} />
                                </button>
                                <button 
                                    disabled={submitting || points < 15000}
                                    onClick={() => handleBuyWithPoints(30, 15000)}
                                    className="bg-neutral-950 border border-neutral-800 p-6 rounded-2xl flex justify-between items-center hover:border-amber-500/30 transition-all disabled:opacity-50 group"
                                >
                                    <div className="text-right">
                                        <div className="text-white font-bold text-lg">30 يوم VIP</div>
                                        <div className="text-amber-500 font-bold">15000 نقطة</div>
                                    </div>
                                    <Crown className="text-neutral-700 group-hover:text-amber-500 transition-colors" size={32} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-blue-600/10 border border-blue-600/30 p-6 rounded-3xl flex items-start gap-4">
                <ShieldCheck className="text-blue-500 shrink-0 mt-1" size={24} />
                <div>
                   <h5 className="text-white font-bold mb-1">حمایة العضو والمدفوعات</h5>
                   <p className="text-neutral-400 text-sm leading-relaxed">
                      نحن نضمن لك تفعيل العضوية بمجرد التأكد من عملية التحويل. إذا واجهت أي مشكلة يمكنك التواصل مع الدعم الفني مباشرة وسنقوم بحل مشكلتك خلال دقائق.
                   </p>
                </div>
            </div>

            {toast && (
                <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full font-bold text-sm bg-green-600 text-white z-50 flex items-center gap-2 shadow-2xl">
                    <CheckCircle2 size={16} /> {toast}
                </div>
            )}
        </div>
    );
};
