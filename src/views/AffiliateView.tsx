import React, { useState, useEffect } from 'react';
import { Megaphone, Users, DollarSign, TrendingUp, Link as LinkIcon, Copy, ArrowLeft, Activity } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export const AffiliateView = ({ user, setActiveTab }: any) => {
  const [isMarketer, setIsMarketer] = useState(user?.isMarketer || false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
     totalClicks: 0,
     totalSignups: 0,
     balance: 0,
     recentSignups: [] as any[]
  });
  const [toast, setToast] = useState('');

  const affiliateLink = `https://${window.location.hostname}?aff=${user?.id}`;

  const fetchStats = async () => {
    if (!user || (!user.isMarketer && !isMarketer)) return;
    try {
       const userDoc = await getDoc(doc(db, 'users', user.id));
       const userData = userDoc.data();
       
       const signupsQuery = query(collection(db, 'users'), where('referredByAffiliate', '==', user.id), orderBy('createdAt', 'desc'), limit(10));
       const signupsSnap = await getDocs(signupsQuery);
       
       setStats({
          totalClicks: userData?.affiliateClicks || 0,
          totalSignups: userData?.affiliateSignups || 0,
          balance: userData?.affiliateBalance || 0,
          recentSignups: signupsSnap.docs.map(d => d.data())
       });
    } catch(e) {
       console.error("Failed to fetch affiliate stats", e);
    }
  };

  useEffect(() => {
     fetchStats();
  }, [user, isMarketer]);

  const handleApply = async () => {
    setLoading(true);
    try {
       await updateDoc(doc(db, 'users', user.id), { isMarketer: true });
       setIsMarketer(true);
       setToast('تم تفعيل حساب المسوق بنجاح!');
    } catch (e: any) {
       setToast('حدث خطأ: ' + e.message);
    }
    setLoading(false);
    setTimeout(() => setToast(''), 3000);
  };

  const copyLink = () => {
     navigator.clipboard.writeText(affiliateLink);
     setToast('تم نسخ الرابط بنجاح!');
     setTimeout(() => setToast(''), 3000);
  };

  if (!user) {
     return <div className="text-center py-20 text-neutral-400 font-bold" dir="rtl">يرجى تسجيل الدخول للوصول إلى لوحة المسوقين.</div>;
  }

  if (!isMarketer) {
     return (
       <div className="max-w-4xl mx-auto pb-20 animate-in fade-in" dir="rtl">
          <div className="text-center mb-10 mt-8">
             <div className="w-20 h-20 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Megaphone size={40} />
             </div>
             <h2 className="text-3xl font-black text-white mb-4">برنامج الشركاء والمسوقين</h2>
             <p className="text-neutral-400 max-w-lg mx-auto leading-relaxed">حوّل تأثيرك إلى أرباح حقيقية! شارك رابطك الخاص واحصل على عمولات نقدية مباشرة عن كل مستخدم نشط يسجل عن طريقك.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
             <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl text-center">
                <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center mx-auto mb-4"><DollarSign size={24}/></div>
                <h3 className="text-white font-bold mb-2">عمولات مجزية</h3>
                <p className="text-neutral-500 text-sm">اربح أموالاً حقيقية (وليس نقاط فقط) قابلة للسحب المباشر.</p>
             </div>
             <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl text-center">
                <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4"><TrendingUp size={24}/></div>
                <h3 className="text-white font-bold mb-2">إحصائيات دقيقة</h3>
                <p className="text-neutral-500 text-sm">تتبع نقراتك، إحالاتك، وأرباحك من خلال لوحة تحكم متطورة.</p>
             </div>
             <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl text-center">
                <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center mx-auto mb-4"><Users size={24}/></div>
                <h3 className="text-white font-bold mb-2">بدون سقف للأرباح</h3>
                <p className="text-neutral-500 text-sm">اجلب المزيد من المحالين، وضاعف أرباحك بلا حدود.</p>
             </div>
          </div>

          <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 p-8 rounded-3xl text-center max-w-md mx-auto">
             <h3 className="text-xl font-bold text-white mb-4">هل أنت مستعد للبدء؟</h3>
             <button onClick={handleApply} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50">
                {loading ? 'جاري التفعيل...' : 'انضم كمسوق الآن'}
             </button>
             {toast && <p className="text-red-400 mt-4 text-sm font-bold">{toast}</p>}
          </div>
       </div>
     );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in" dir="rtl">
       <div className="flex items-center gap-3 mb-8">
         <Megaphone className="text-blue-500" size={32} />
         <h2 className="text-3xl font-black text-white">لوحة المسوقين</h2>
       </div>

       {/* Link Section */}
       <div className="bg-neutral-900 border border-blue-500/30 p-6 md:p-8 rounded-3xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 w-full md:w-auto">
             <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><LinkIcon size={18} className="text-blue-500"/> رابط التسويق الخاص بك</h3>
             <p className="text-neutral-400 text-sm mb-4">انشر هذا الرابط، واي شخص يسجل عن طريقه ستحصل على عمولة نقدية مباشرة وتضاف لرصيدك التسويقي.</p>
             
             <div className="flex items-center gap-2">
                <input type="text" readOnly value={affiliateLink} className="flex-1 bg-neutral-950 border border-neutral-800 text-neutral-300 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 text-left font-mono text-sm" dir="ltr" />
                <button onClick={copyLink} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center justify-center shrink-0">
                   <Copy size={18} />
                </button>
             </div>
          </div>
          
          <div className="relative z-10 bg-neutral-950/50 p-6 rounded-2xl border border-neutral-800 flex items-center gap-6 shrink-0 w-full md:w-auto">
             <div>
                <div className="text-neutral-500 text-sm font-bold mb-1">الرصيد التسويقي المتوفر</div>
                <div className="text-3xl font-black text-green-500">${stats.balance.toFixed(2)}</div>
             </div>
             {/* Note: This is an example, real withdrawal logic is needed for balance */}
             <button onClick={() => setActiveTab('rewards')} className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">سحب الأرباح</button>
          </div>
       </div>

       {/* Stats Grid */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
             <div className="text-neutral-500 text-xs font-bold mb-2 flex items-center gap-2"><Megaphone size={14}/> إجمالي النقرات</div>
             <div className="text-2xl font-black text-white">{stats.totalClicks}</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
             <div className="text-neutral-500 text-xs font-bold mb-2 flex items-center gap-2"><Users size={14}/> إجمالي المسجلين</div>
             <div className="text-2xl font-black text-white">{stats.totalSignups}</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
             <div className="text-neutral-500 text-xs font-bold mb-2 flex items-center gap-2"><Activity size={14}/> معدل التحويل</div>
             <div className="text-2xl font-black text-white">
               {stats.totalClicks > 0 ? ((stats.totalSignups / stats.totalClicks) * 100).toFixed(1) : 0}%
             </div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
             <div className="text-neutral-500 text-xs font-bold mb-2 flex items-center gap-2"><DollarSign size={14}/> إجمالي الأرباح</div>
             <div className="text-2xl font-black text-white">${stats.balance.toFixed(2)}</div>
          </div>
       </div>

       {/* Recent Signups */}
       <h3 className="text-xl font-bold text-white mb-4">أحدث المسجلين عن طريقك</h3>
       <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          {stats.recentSignups.length === 0 ? (
             <div className="p-8 text-center text-neutral-500 font-bold">لا يوجد مسجلين حتى الآن. انشر رابطك للبدء!</div>
          ) : (
             <div className="divide-y divide-neutral-800">
                {stats.recentSignups.map((s, i) => (
                   <div key={i} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center text-neutral-300 font-bold">{s.name ? s.name.charAt(0) : 'U'}</div>
                         <div>
                            <div className="text-white font-bold text-sm truncate max-w-[150px] md:max-w-xs">{s.name}</div>
                            <div className="text-neutral-500 text-xs">{new Date(s.createdAt?.toDate()).toLocaleDateString('ar-EG')}</div>
                         </div>
                      </div>
                      <div className="text-green-500 font-bold text-sm bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                         مكتمل
                      </div>
                   </div>
                ))}
             </div>
          )}
       </div>

       {toast && (
          <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-neutral-800 text-white px-6 py-3 rounded-full font-bold shadow-xl z-50">
             {toast}
          </div>
       )}
    </div>
  );
};
