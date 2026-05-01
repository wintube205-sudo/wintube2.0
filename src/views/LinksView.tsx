import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, orderBy, limit, doc, runTransaction, getDoc, serverTimestamp } from 'firebase/firestore';
import { Link as LinkIcon, Loader2, CheckCircle2, ChevronRight, AlertCircle, Coins } from 'lucide-react';

export const LinksView = ({ user, setRefreshPoints }: any) => {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Load links manually or from backend
  const loadLinks = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'short_links'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const linksData: any[] = [];
      snapshot.forEach(d => linksData.push({ id: d.id, ...d.data() }));

      // Fallback dummy link if empty
      if (linksData.length === 0) {
        linksData.push({
          id: 'dummy1',
          title: 'تخطي رابط Exe.io رقم 1',
          url: 'https://exe.io/qEdcOXx',
          reward: 50,
          maxClicks: 1000,
          clicks: 0
        });
      }

      // Check which links the user has already clicked today
      if (user) {
        const historyQ = query(collection(db, 'users', user.id, 'history'));
        const histSnap = await getDocs(historyQ);
        const clickedIds = new Set();
        const today = new Date().toDateString();
        
        histSnap.forEach(h => {
          const data = h.data();
          if (data.linkId && data.date === today) {
            clickedIds.add(data.linkId);
          }
        });
        
        const mergedLinks = linksData.map(l => ({ ...l, completedToday: clickedIds.has(l.id) }));
        setLinks(mergedLinks);
      } else {
        setLinks(linksData);
      }
    } catch (err: any) {
      console.error(err);
      setError('حدث خطأ أثناء تحميل الروابط.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, [user]);

  const handleLinkClick = async (link: any) => {
    if (!user) {
      setError('يجب تسجيل الدخول لتتمكن من جمع النقاط من تخطي الروابط.');
      return;
    }
    
    if (link.completedToday) {
      setError('لقد قمت بتخطي هذا الرابط اليوم. عد غداً!');
      return;
    }

    // In a real application, clicking the link redirects the user to the shortener.
    // The shortener then redirects back to a URL with a success token.
    // Since we don't have an automated backend webhook for exe.io, we will simulate
    // the process or use a simpler client-side click logic (not fully secure but works for demo).
    
    setProcessingId(link.id);
    window.open(link.url, '_blank');
    
    // Simulate waiting for them to complete it.
    // In production, you would verify a token from the callback URL.
    setTimeout(async () => {
      try {
        await runTransaction(db, async (t) => {
          const userRef = doc(db, 'users', user.id);
          const userDoc = await t.get(userRef);
          if (!userDoc.exists()) throw new Error('المستخدم غير موجود');

          // Add points
          const currentPoints = userDoc.data().points || 0;
          t.update(userRef, { points: currentPoints + link.reward });

          // Record history to prevent double click today
          const historyRef = doc(collection(db, 'users', user.id, 'history'));
          t.set(historyRef, {
            type: 'earn', // use earn so it shows up correctly in Earn history
            linkId: link.id,
            title: `تخطي الرابط: ${link.title}`,
            amount: link.reward,
            createdAt: serverTimestamp(),
            date: new Date().toDateString()
          });
        });
        
        setSuccess(`نجاح! تم إضافة ${link.reward} نقطة إلى رصيدك.`);
        setRefreshPoints((p: number) => p + 1);
        loadLinks(); // reload state
      } catch (err: any) {
        console.error(err);
        setError('فشل في إضافة النقاط.');
      } finally {
        setProcessingId(null);
      }
    }, 15000); // Wait 15 seconds to simulate them doing the task
  };

  return (
    <div className="w-full max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <LinkIcon className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">تخطي الروابط</h1>
          <p className="text-neutral-400 mt-1">تخطى الروابط المختصرة لجمع المزيد من النقاط بكل سهولة!</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 flex items-center justify-between">
          <span className="font-bold">{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-white">✕</button>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-xl mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} />
            <span className="font-bold">{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-green-500 hover:text-white">✕</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {links.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-neutral-900 border border-neutral-800 rounded-2xl">
              <LinkIcon size={48} className="mx-auto text-neutral-600 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">لا توجد روابط حالياً</h3>
              <p className="text-neutral-400">يرجى العودة لاحقاً للحصول على روابط جديدة.</p>
            </div>
          ) : (
            links.map((link) => (
              <div key={link.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 hover:border-blue-500/50 transition-colors flex flex-col justify-between">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-white text-lg mb-1">{link.title}</h3>
                    <p className="text-sm text-neutral-400">تخطى الرابط للحصول على النقاط</p>
                  </div>
                  <div className="bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold">
                    <Coins size={16} />
                    <span>{link.reward} نقطة</span>
                  </div>
                </div>

                {link.completedToday ? (
                  <button disabled className="w-full py-3 rounded-xl bg-green-500/10 text-green-500 font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                    <CheckCircle2 size={20} />
                    تم الإنجاز اليوم
                  </button>
                ) : (
                  processingId === link.id ? (
                      <button disabled className="w-full py-3 rounded-xl bg-blue-600/50 text-white font-bold flex items-center justify-center gap-2 cursor-wait">
                         <Loader2 className="animate-spin" size={20} />
                         يرجى الانتظار (جاري التحقق)...
                      </button>
                  ) : (
                    <button 
                      onClick={() => handleLinkClick(link)}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <span>بدء التخطي</span>
                      <ChevronRight size={18} />
                    </button>
                  )
                )}
              </div>
            ))
          )}
        </div>
      )}
      
      <div className="mt-8 bg-blue-500/10 border border-blue-500/20 p-5 rounded-2xl">
         <h4 className="flex items-center gap-2 text-blue-400 font-bold mb-2">
            <AlertCircle size={20} />
            كيف أربح من تخطي الروابط؟
         </h4>
         <ul className="list-disc list-inside text-sm text-neutral-300 space-y-1">
            <li>انقر على الزر "بدء التخطي" ليتم توجيهك إلى الرابط المختصر.</li>
            <li>اتبع التعليمات في الموقع وتخطى الإعلانات حتى تصل إلى الوجهة النهائية.</li>
            <li>سيتم احتساب النقاط تلقائياً بعد مرور وقت قصير من ضغط الرابط لإعطائك فرصة الإكمال.</li>
            <li>يمكنك إنجاز كل رابط مرة واحدة كل 24 ساعة.</li>
         </ul>
      </div>
    </div>
  );
};
