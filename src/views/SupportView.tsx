import React, { useState } from 'react';
import { Star, MessageSquare, Send, CheckCircle2, ShieldCheck } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const SupportView = ({ user }: any) => {
    const [tab, setTab] = useState<'support' | 'rating'>('support');
    const [rating, setRating] = useState(0);
    const [message, setMessage] = useState('');
    const [subject, setSubject] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState('');

    const handleSubmitSupport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return showToast('قم بتسجيل الدخول أولاً');
        if (!message || !subject) return showToast('الرجاء إدخال جميع الحقول');

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'support_tickets'), {
                userId: user.id,
                userName: user.name || 'مستخدم',
                userEmail: user.email,
                subject,
                message,
                status: 'open',
                createdAt: serverTimestamp(),
            });
            setSubject('');
            setMessage('');
            showToast('تم إرسال رسالتك بنجاح! سيتم الرد عليك قريباً عبر البريد.');
        } catch (error) {
            showToast('حدث خطأ في الإرسال');
        }
        setIsSubmitting(false);
    };

    const handleRating = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return showToast('قم بتسجيل الدخول أولاً');
        if (rating === 0) return showToast('الرجاء اختيار عدد النجوم');
        
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'platform_ratings'), {
                userId: user.id,
                userName: user.name || 'مستخدم',
                rating,
                message,
                createdAt: serverTimestamp(),
            });
            setRating(0);
            setMessage('');
            showToast('شكراً لتقييمك! نحن نقدر ملاحظاتك.');
        } catch (error) {
            showToast('حدث خطأ في الإرسال');
        }
        setIsSubmitting(false);
    };

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(''), 4000);
    };

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in w-full pb-20" dir="rtl">
            <div className="flex items-center gap-3 mb-8 justify-center">
                <ShieldCheck className="text-red-500" size={36} />
                <h2 className="text-3xl font-black text-white">مركز الثقة والدعم</h2>
            </div>

            <div className="flex gap-4 mb-8 border-b border-neutral-800 pb-2">
                <button 
                  onClick={() => setTab('support')} 
                  className={`pb-2 px-4 font-bold transition-colors ${tab === 'support' ? 'text-red-500 border-b-2 border-red-500' : 'text-neutral-500'}`}
                >
                    الدعم الفني
                </button>
                <button 
                  onClick={() => setTab('rating')} 
                  className={`pb-2 px-4 font-bold transition-colors ${tab === 'rating' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-neutral-500'}`}
                >
                    تقييم المنصة
                </button>
            </div>

            {tab === 'support' && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8">
                    <h3 className="text-xl font-bold text-white mb-2">تواصل مع الدعم الفني</h3>
                    <p className="text-neutral-400 text-sm mb-6">هل واجهت مشكلة في سحب الأرباح أو في نظام النقاط؟ اشرح لنا المشكلة وسنقوم بحلها في أسرع وقت ممكن.</p>
                    
                    <form onSubmit={handleSubmitSupport} className="space-y-4">
                        <div>
                            <label className="text-white font-bold text-sm block mb-2">الموضوع</label>
                            <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-xl text-white focus:border-red-500 outline-none">
                                <option value="" disabled>اختر نوع المشكلة...</option>
                                <option value="withdrawal">مشكلة في سحب الأرباح</option>
                                <option value="points">لم يتم احتساب النقاط (عروض / ألعاب)</option>
                                <option value="account">مشكلة في الحساب أو تسجيل الدخول</option>
                                <option value="other">استفسار آخر</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-white font-bold text-sm block mb-2">التفاصيل</label>
                            <textarea 
                                value={message} 
                                onChange={e => setMessage(e.target.value)} 
                                rows={5} 
                                placeholder="اكتب تفاصيل المشكلة هنا بكل وضوح..."
                                className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-xl text-white focus:border-red-500 outline-none resize-none"
                            ></textarea>
                        </div>
                        <button disabled={isSubmitting} type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-xl w-full flex justify-center items-center gap-2 transition-colors disabled:opacity-50">
                            <Send size={20} /> إرسال التذكرة
                        </button>
                    </form>
                </div>
            )}

            {tab === 'rating' && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center">
                    <h3 className="text-2xl font-black text-white mb-2">كيف تقيم تجربتك؟</h3>
                    <p className="text-neutral-400 text-sm mb-8">رأيك يهمنا ويساعدنا في تحسين المنصة. قيم تجربتك بكل شفافية.</p>

                    <form onSubmit={handleRating} className="space-y-6">
                        <div className="flex justify-center gap-2 flex-row-reverse">
                            {[5, 4, 3, 2, 1].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`p-2 transition-transform hover:scale-110 ${rating >= star ? 'text-amber-500' : 'text-neutral-700'}`}
                                >
                                    <Star size={48} fill={rating >= star ? 'currentColor' : 'none'} />
                                </button>
                            ))}
                        </div>

                        <div>
                            <textarea 
                                value={message} 
                                onChange={e => setMessage(e.target.value)} 
                                rows={4} 
                                placeholder="طالما قيمت، أخبرنا ما الذي أعجبك وما الذي يمكننا تحسينه..."
                                className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-xl text-white focus:border-amber-500 outline-none resize-none mt-4 text-right"
                            ></textarea>
                        </div>

                        <button disabled={isSubmitting} type="submit" className="bg-amber-500 hover:bg-amber-600 text-black font-black py-4 px-8 rounded-xl w-full flex justify-center items-center gap-2 transition-colors disabled:opacity-50">
                            تقديم التقييم 
                        </button>
                    </form>
                </div>
            )}

            {toast && (
                <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full font-bold text-sm bg-green-600 text-white z-50 flex items-center gap-2">
                    <CheckCircle2 size={16} /> {toast}
                </div>
            )}
        </div>
    );
};
