import React, { useState, useEffect, useCallback } from 'react';
import { Play, EyeOff, Loader2, Gift, Clock, X, Search, Sparkles } from 'lucide-react';
import { updatePoints, incrementDailyProgress, checkDailyLimit } from '../lib/firebase';
import { AdBanner } from '../components/AdBanner';
import { NativeAdBanner } from '../components/NativeAdBanner';

export const VideosView = ({ user, setRefreshPoints, settings }: any) => {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [toast, setToast] = useState('');
  const [isClaiming, setIsClaiming] = useState(false); 
  const [pointReady, setPointReady] = useState(false); 
  const [searchQuery, setSearchQuery] = useState('');
  const [watchStartTime, setWatchStartTime] = useState<number>(0);
  const [videoAnalysis, setVideoAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchVideos = useCallback(async (searchQueryRaw = '') => {
    setLoading(true);
    try {
      // Fetch user uploaded content
      let userVideos: any[] = [];
      try {
        const { collection, query, where, limit, getDocs } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        const q = query(
          collection(db, 'user_content'), 
          where('type', '==', 'video'),
          limit(10)
        );
        const snap = await getDocs(q);
        userVideos = snap.docs.map(doc => ({ isUserContent: true, id: doc.id, ...doc.data() }));
      } catch(e) {
        console.error('Failed to fetch user videos', e);
      }

      const endpoint = searchQueryRaw 
        ? `https://api.dailymotion.com/videos?search=${encodeURIComponent(searchQueryRaw)}&limit=15&fields=id,title,description,thumbnail_360_url`
        : `https://api.dailymotion.com/videos?channel=videogames&limit=15&fields=id,title,description,thumbnail_360_url`;
        
      const res = await fetch(endpoint);
      const data = await res.json();
      
      setVideos([...userVideos, ...(data.list || [])]);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVideos(searchQuery);
  };

  const requestPointFromServer = useCallback(async () => {
    if (isClaiming || !pointReady || !user) return;
    
    // Anti-Cheat: Validate true watch time (at least 30 seconds)
    if (!watchStartTime) {
        setToast('❌ أكتشف النظام محاولة غش (عدم مشاهدة الفديو). تم إبطال النقطة.');
        setPlayingVideo(null);
        setPointReady(false);
        return;
    }
    const timeElapsed = Date.now() - watchStartTime;
    if (timeElapsed < 29000) { // Using 29s to account for slight timer drift
        setToast('❌ أكتشف النظام محاولة غش (تخطي الوقت). تم إبطال النقطة.');
        setPlayingVideo(null);
        setPointReady(false);
        return;
    }

    setWatchStartTime(0); // Reset for the next video

    setIsClaiming(true);
    try {
      const canWatch = await checkDailyLimit(user.id, 'video');
      if (!canWatch) {
         setToast('لقد وصلت للحد الأقصى من مشاهدة الفيديوهات لهذا اليوم (20 نقطة). عد غداً!');
         setPlayingVideo(null);
         return;
      }

      const baseReward = settings?.videoPoints || 10;
      const reward = settings?.eventMode ? baseReward * 2 : baseReward;
      const response = await updatePoints(user.id, reward, `مشاهدة فيديو: ${playingVideo?.title}`, 'earn');
      if (response.success) {
        // Increment daily tasks counter for video
        await incrementDailyProgress(user.id, 'video');

        // Reward Uploader
        if (playingVideo?.isUserContent && playingVideo?.uploaderId && playingVideo?.uploaderId !== user.id) {
           const { increment, doc, updateDoc } = await import('firebase/firestore');
           const { db } = await import('../lib/firebase');
           try {
               await updatePoints(playingVideo.uploaderId, 5, `أرباح مشاهدة محتواك: ${playingVideo.title}`, 'earn');
               await updateDoc(doc(db, 'user_content', playingVideo.id), { views: increment(1) });
           } catch(e) { console.error(e) }
        }

        setRefreshPoints((prev: number) => prev + 1);
        setToast(`+ مكافأة ${reward} نقطة آمنة!`); 
        setPointReady(false); 
        setTimeLeft(30); 
      } else { 
        setToast(`❌ خطأ: ${response.error}`); 
        setPlayingVideo(null); 
        setPointReady(false); 
      }
    } catch (err: any) { 
      setToast('حدث خطأ في الاتصال'); 
    } finally { 
      setIsClaiming(false); 
      setTimeout(() => setToast(''), 2000); 
    }
  }, [isClaiming, pointReady, user, playingVideo, settings, watchStartTime]);

  // 1. Timer Effect
  useEffect(() => {
    let timer: any;
    if (playingVideo && !isClaiming && !pointReady) {
      timer = setInterval(() => {
        if (!document.hidden) {
          setTimeLeft(prev => {
            if (prev <= 1) {
              if (!user) { setToast('يرجى تسجيل الدخول للحصول على النقاط'); setPlayingVideo(null); return 0; }
              setPointReady(true); return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [playingVideo, isClaiming, pointReady, user]);

  const analyzeVideo = async () => {
    if (!playingVideo) return;
    setIsAnalyzing(true);
    setVideoAnalysis(null);
    try {
        const { GoogleGenAI } = await import('@google/genai');
        const key = process.env.GEMINI_API_KEY || '';
        const ai = new GoogleGenAI({ apiKey: key || '' });
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-preview',
            contents: `تحليل محتوى الفيديو التالي بناءً على عنوانه و وصفه: 
العنوان: ${playingVideo.title}
الوصف: ${playingVideo.description || 'غير متوفر'}`,
            config: {
                systemInstruction: 'أنت مساعد ذكي لمنصة وين تيوب. مهمتك تحليل الفيديوهات للمستخدم وإعطائه فكرة عامة حول ما يحتويه الفيديو بطريقة ممتعة ومختصرة باللغة العربية.'
            }
        });
        setVideoAnalysis(response.text);
    } catch(err) {
        setVideoAnalysis("تعذر تحليل الفيديو في الوقت الحالي.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in w-full" dir="rtl">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-black text-white flex items-center gap-2"><Play className="text-red-500" /> شاهد واربح</h2>
        <div className="bg-red-500/10 text-red-500 px-4 py-2 rounded-xl font-bold text-sm text-center flex items-center gap-2 w-full sm:w-auto">
          <EyeOff size={16}/> العداد يتوقف إذا تركت الصفحة
        </div>
      </div>

      <form onSubmit={handleSearch} className="mb-6 relative w-full">
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث عن فيديوهات..." 
          className="w-full bg-neutral-900 border border-neutral-800 text-white p-4 pl-12 rounded-2xl focus:outline-none focus:border-red-500"
        />
        <button type="submit" className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white">
           <Search size={20} />
        </button>
      </form>

      {!user?.isVIP && (
        <div className="w-full flex justify-center mb-6">
          <NativeAdBanner />
        </div>
      )}

      {loading ? ( <div className="flex justify-center py-20 text-neutral-500"><Loader2 className="animate-spin w-10 h-10 text-red-500" /></div> ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((vid) => (
            <div key={vid.id} onClick={() => { setPlayingVideo(vid); setTimeLeft(30); setPointReady(false); setToast(''); setWatchStartTime(Date.now()); }} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden cursor-pointer hover:border-red-500 transition-all group relative">
              {vid.isUserContent && (
                 <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow">محتوى مستخدم</div>
              )}
              <div className="relative aspect-video overflow-hidden bg-neutral-800 flex items-center justify-center">
                {vid.thumbnail_360_url || vid.thumbnail ? (
                   <img src={vid.thumbnail_360_url || vid.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Video thumbnail" />
                ) : (
                   <Play size={40} className="text-neutral-600" />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white"><Play fill="currentColor" className="ml-1" /></div></div>
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow flex items-center gap-1"><Gift size={12}/> +{settings?.eventMode ? (settings.videoPoints || 10) * 2 : (settings?.videoPoints || 10)} {settings?.eventMode && <span className="mr-1 text-[10px] bg-red-600 px-1 rounded">2X</span>}</div>
                </div>
              </div>
              <div className="p-4"><h3 className="font-bold text-white text-sm line-clamp-2">{vid.title}</h3></div>
            </div>
          ))}
          {videos.length === 0 && <div className="col-span-1 md:col-span-3 text-center py-20 text-neutral-500">لا توجد نتائج بحث. جرب كلمات أخرى!</div>}
        </div>
      )}

      {playingVideo && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col animate-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-4 bg-neutral-950">
            <div className="flex items-center gap-4">
              {pointReady ? (
                <button onClick={requestPointFromServer} disabled={isClaiming} className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full font-black text-sm animate-pulse">
                  <Gift size={18} /> {isClaiming ? 'جاري الاستلام...' : 'اضغط هنا لاستلام النقطة! ✨'}
                </button>
              ) : (
                <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 px-4 py-2 rounded-full font-bold text-sm">
                  <Clock size={18} /> <span>بعد <span className="text-xl mx-1 w-6 text-center inline-block">{timeLeft}</span> ثانية</span>
                </div>
              )}
            </div>
            <button onClick={() => { setPlayingVideo(null); setPointReady(false); }} className="p-2 bg-neutral-800 text-white rounded-xl font-bold text-sm flex items-center gap-1"><X size={18} /> إغلاق</button>
          </div>
          <div className="flex-grow w-full max-w-5xl mx-auto p-4 flex flex-col items-center justify-center relative overflow-y-auto">
             <div className="w-full relative flex-grow max-h-[70vh]">
                <iframe src={playingVideo.isUserContent ? playingVideo.url : `https://www.dailymotion.com/embed/video/${playingVideo.id}?autoplay=1&mute=0`} allowFullScreen className="w-full h-full aspect-video rounded-2xl shadow-2xl border border-neutral-800 bg-black relative z-0"></iframe>
             </div>
             <div className="w-full mt-8 flex flex-col gap-4">
               <button 
                  onClick={analyzeVideo} 
                  disabled={isAnalyzing}
                  className="self-start flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
               >
                 {isAnalyzing ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                 <span>تحليل الفيديو بالذكاء الاصطناعي</span>
               </button>
               {videoAnalysis && (
                  <div className="bg-neutral-900 border border-purple-500/30 rounded-2xl p-6 shadow-xl relative mt-2">
                     <div className="absolute -top-3 -right-3 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white p-2 rounded-full shadow-lg">
                        <Sparkles size={16} />
                     </div>
                     <h3 className="font-bold text-white mb-2 text-lg">تحليل مستخلص:</h3>
                     <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap">{videoAnalysis}</p>
                  </div>
               )}
               {/* إعلانات */}
             </div>
          </div>
          {toast && <div className={`absolute bottom-10 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full font-bold shadow-xl z-50 ${toast.includes('خطأ') ? 'bg-red-600' : 'bg-green-600'} text-white`}>{toast}</div>}
        </div>
      )}
    </div>
  );
};
