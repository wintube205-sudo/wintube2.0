import React, { useState, useEffect, useCallback } from 'react';
import { ExternalLink, Loader2, EyeOff, Search, Sparkles } from 'lucide-react';
import { updatePoints, incrementDailyProgress, checkDailyLimit } from '../lib/firebase';
import { collection, getDocs, query, limit, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AdBanner } from '../components/AdBanner';
import { NativeAdBanner } from '../components/NativeAdBanner';

export const PTCView = ({ user, setRefreshPoints, settings }: any) => {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visitingAd, setVisitingAd] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [toast, setToast] = useState('');
  const [isClaiming, setIsClaiming] = useState(false); 
  const [pointReady, setPointReady] = useState(false); 

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'user_content'), 
        where('type', '==', 'ptc'),
        limit(20)
      );
      const snap = await getDocs(q);
      const userAds = snap.docs
        .map(doc => ({ isUserContent: true, id: doc.id, ...doc.data() as any }))
        .filter(ad => !ad.maxViews || (ad.views || 0) < ad.maxViews);
      
      const adminQ = query(collection(db, 'ptc_ads'), limit(30));
      const adminSnap = await getDocs(adminQ);
      const adminAds = adminSnap.docs
        .map(doc => ({ isAdminContent: true, id: doc.id, ...doc.data() as any }))
        .filter(ad => !ad.maxClicks || (ad.clicks || 0) < ad.maxClicks);

      let defaultAds = [
        { id: 'ad1', title: 'زيارة موقع إخباري', url: 'https://example.com', reward: 5, duration: 15, thumbnail: 'https://via.placeholder.com/400x200?text=News' },
        { id: 'ad2', title: 'اكتشف خدماتنا', url: 'https://example.com', reward: 5, duration: 15, thumbnail: 'https://via.placeholder.com/400x200?text=Services' }
      ];

      setAds([...adminAds, ...userAds, ...defaultAds]);
    } catch (e) {
      console.error('Failed to fetch PTC ads', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!visitingAd || pointReady || isClaiming) return;

    let timer: any;
    let awayStartTime = document.hasFocus() ? 0 : Date.now();

    const checkTime = () => {
       if (awayStartTime > 0) {
          const now = Date.now();
          const delta = Math.floor((now - awayStartTime) / 1000);
          if (delta > 0) {
             setTimeLeft(prev => {
                const next = prev - delta;
                if (next <= 0) {
                   setPointReady(true);
                   return 0;
                }
                return next;
             });
             awayStartTime = now;
          }
       }
    };

    const handleVisibilityChange = () => {
      // If the document has focus, the user is looking at the main app, NOT the ad.
      if (document.hasFocus()) {
         checkTime(); // Catch up any remaining time
         awayStartTime = 0; // Pause the timer
      } else {
         // User went away (hopefully to the ad tab)
         if (awayStartTime === 0) {
            awayStartTime = Date.now();
         }
      }
    };

    window.addEventListener('blur', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    timer = setInterval(() => {
      checkTime();
    }, 1000);

    return () => {
      window.removeEventListener('blur', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      clearInterval(timer);
    };
  }, [visitingAd, pointReady, isClaiming]);

  const [isPaused, setIsPaused] = useState(false);
  useEffect(() => {
    const checkFocus = setInterval(() => {
      setIsPaused(document.hasFocus() && visitingAd && !pointReady && !isClaiming);
    }, 500);
    return () => clearInterval(checkFocus);
  }, [visitingAd, pointReady, isClaiming]);

  const claimPoints = async () => {
    if (!user || !pointReady || isClaiming || !visitingAd) return;
    
    setIsClaiming(true);
    try {
      const canVisit = await checkDailyLimit(user.id, 'ptc');
      if (!canVisit) {
         setToast('لقد وصلت للحد الأقصى من زيارة المواقع لهذا اليوم (20 نقطة). عد غداً!');
         setVisitingAd(null);
         setIsClaiming(false);
         setPointReady(false);
         return;
      }

      const reward = visitingAd.reward || 5;
      const response = await updatePoints(user.id, reward, `زيارة موقع: ${visitingAd.title}`, 'earn');
      if (response.success) {
        await incrementDailyProgress(user.id, 'ptc');

        // Reward Uploader
        if (visitingAd.isUserContent && visitingAd.uploaderId && visitingAd.uploaderId !== user.id) {
           const { increment, doc, updateDoc } = await import('firebase/firestore');
           try {
               await updateDoc(doc(db, 'user_content', visitingAd.id), { views: increment(1) });
           } catch(e) { console.error(e) }
        } else if (visitingAd.isAdminContent) {
           const { increment, doc, updateDoc } = await import('firebase/firestore');
           try {
               await updateDoc(doc(db, 'ptc_ads', visitingAd.id), { clicks: increment(1) });
           } catch(e) { console.error(e) }
        }

        setRefreshPoints((prev: number) => prev + 1);
        setToast(`+ مكافأة ${reward} نقطة!`); 
        setAds(prev => prev.filter(ad => ad.id !== visitingAd.id)); // Remove visited ad
        setVisitingAd(null);
      } else { 
        setToast(`❌ خطأ: ${response.error}`); 
      }
    } catch(e: any) { 
        setToast(`❌ ${e.message}`); 
    }
    setIsClaiming(false);
    setPointReady(false);
    setTimeout(() => setToast(''), 3000);
  };

  const handleVisit = (ad: any) => {
    setVisitingAd(ad);
    setTimeLeft(ad.duration || 15);
    setPointReady(false);
    setToast('');
    window.open(ad.url, '_blank');
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="max-w-6xl mx-auto w-full animate-in fade-in pb-24" dir="rtl">
      
      <div className="mb-4">
        <AdBanner />
      </div>

      <div className="flex items-center gap-3 mb-8 justify-center lg:justify-start">
        <ExternalLink className="text-pink-500" size={32} />
        <h2 className="text-3xl font-black tracking-tight text-white">زيارة المواقع (PTC)</h2>
      </div>

      <div className="flex flex-col gap-6">
        
        {toast && (
          <div className="bg-green-600 text-white px-6 py-3 rounded-full font-bold text-center animate-bounce shadow-lg shadow-green-900/50">
            {toast}
          </div>
        )}

        {visitingAd && (
          <div className="bg-gradient-to-r from-pink-900/40 to-purple-900/40 border border-pink-500/30 p-6 rounded-3xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm">
            <div className="flex items-center gap-4">
               <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 ${isPaused ? 'bg-red-500/20' : 'bg-pink-500/20'}`}>
                  <span className={`text-2xl font-black ${isPaused ? 'text-red-400' : 'text-pink-400'}`}>{timeLeft}</span>
               </div>
               <div>
                  <h3 className="text-xl font-bold text-white mb-1">جاري زيارة: {visitingAd.title}</h3>
                  {isPaused ? (
                    <p className="text-red-400 text-sm font-bold animate-pulse">تم إيقاف العداد مؤقتاً. اذهب إلى صفحة الإعلان لإكمال الوقت!</p>
                  ) : (
                    <p className="text-neutral-400 text-sm">انتظر في الموقع المفتوح حتى انتهاء العداد لجمع النقاط.</p>
                  )}
               </div>
            </div>
            
            {pointReady ? (
               <button 
                  onClick={claimPoints} 
                  disabled={isClaiming}
                  className="bg-green-500 hover:bg-green-400 text-black px-6 py-3 rounded-xl font-black w-full md:w-auto shadow-lg shadow-green-500/20 transition-all transform hover:scale-105 disabled:opacity-50"
               >
                  {isClaiming ? <Loader2 className="animate-spin mx-auto" /> : 'المطالبة بالنقاط الآن!'}
               </button>
            ) : (
               <button 
                  onClick={() => window.open(visitingAd.url, '_blank')} 
                  className="bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-3 rounded-xl font-bold w-full md:w-auto transition-colors"
               >
                  العودة للموقع
               </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ads.length === 0 ? (
             <div className="col-span-full py-20 text-center flex flex-col items-center text-neutral-500 bg-neutral-900/50 rounded-3xl border border-neutral-800">
                <EyeOff size={48} className="mb-4 opacity-20" />
                <p className="text-lg">لا توجد مواقع متاحة للزيارة حالياً.</p>
                <p className="text-sm">عد لاحقاً لمزيد من العروض.</p>
             </div>
          ) : (
             ads.map((ad, idx) => (
               <React.Fragment key={ad.id}>
                 {idx === 2 && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3">
                       <NativeAdBanner />
                    </div>
                 )}
                 <div onClick={() => handleVisit(ad)} className={`bg-neutral-900 border ${visitingAd?.id === ad.id ? 'border-pink-500 bg-pink-900/10' : 'border-neutral-800 hover:border-pink-500'} rounded-2xl overflow-hidden cursor-pointer transition-all group relative`}>
                   {ad.isUserContent && (
                      <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow">محتوى مستخدم</div>
                   )}
                   <div className="h-32 bg-neutral-800 relative">
                     <img src={ad.thumbnail} alt={ad.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" onError={(e: any) => e.target.style.display = 'none'} />
                   </div>
                   <div className="p-4">
                     <h3 className="font-bold text-white mb-2 line-clamp-1 group-hover:text-pink-400 transition-colors">{ad.title}</h3>
                     <div className="flex items-center justify-between mt-4">
                        <div className="bg-amber-500/20 text-amber-500 font-bold px-3 py-1 rounded-lg text-sm">
                           +{ad.reward || 5} نقطة
                        </div>
                        <div className="text-neutral-500 text-xs flex items-center gap-1">
                           <Sparkles size={12} /> {ad.duration || 15} ثانية
                        </div>
                     </div>
                   </div>
                 </div>
               </React.Fragment>
             ))
          )}
        </div>
      </div>
    </div>
  );
};
