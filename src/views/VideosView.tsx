import React, { useState, useEffect, useCallback } from 'react';
import { Play, EyeOff, Loader2, Gift, Clock, X } from 'lucide-react';
import { updatePoints, incrementDailyProgress } from '../lib/firebase';

export const VideosView = ({ user, setRefreshPoints }: any) => {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [toast, setToast] = useState('');
  const [isClaiming, setIsClaiming] = useState(false); 
  const [pointReady, setPointReady] = useState(false); 

  useEffect(() => {
    setLoading(true);
    const endpoint = 'https://api.dailymotion.com/videos?channel=videogames&limit=12&fields=id,title,thumbnail_360_url';
    fetch(endpoint).then(res => res.json()).then(data => { setVideos(data.list || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const requestPointFromServer = useCallback(async () => {
    if (isClaiming || !pointReady || !user) return;
    setIsClaiming(true);
    try {
      const response = await updatePoints(user.id, 10, 'مشاهدة فيديو', 'earn');
      if (response.success) {
        // Increment daily tasks counter for video
        await incrementDailyProgress(user.id, 'video');

        setRefreshPoints((prev: number) => prev + 1);
        setToast('+ مكافأة آمنة!'); 
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
  }, [isClaiming, pointReady, user]);

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

  // 2. Fluid Player Initialization Effect
  useEffect(() => {
    let playerInstance: any = null;

    if (playingVideo) {
      const initFluidPlayer = () => {
         // Prevent double initialization
         if (playerInstance) return;
         
         const videoEl = document.getElementById('video-player');
         if ((window as any).fluidPlayer && videoEl) {
             playerInstance = (window as any).fluidPlayer('video-player', {
                layoutControls: {
                   fillToContainer: true,
                   autoPlay: true,
                   mute: false
                },
                vastOptions: {
                   allowVPAID: true,
                   adList: [
                      {
                         roll: 'preRoll',
                         vastTag: 'https://s.magsrv.com/v1/vast.php?idzone=5904732'
                      }
                   ]
                }
             });
         }
      };

      if (!(window as any).fluidPlayer) {
          const script = document.createElement('script');
          script.src = 'https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js';
          document.body.appendChild(script);
          script.onload = initFluidPlayer;
      } else {
          setTimeout(initFluidPlayer, 100);
      }
    }

    return () => {
       if (playerInstance && typeof playerInstance.destroy === 'function') {
           playerInstance.destroy();
       }
    };
  }, [playingVideo]);

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in w-full" dir="rtl">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-black text-white flex items-center gap-2"><Play className="text-red-500" /> شاهد واربح</h2>
        <div className="bg-red-500/10 text-red-500 px-4 py-2 rounded-xl font-bold text-sm text-center flex items-center gap-2">
          <EyeOff size={16}/> العداد يتوقف إذا تركت الصفحة
        </div>
      </div>
      {loading ? ( <div className="flex justify-center py-20 text-neutral-500"><Loader2 className="animate-spin w-10 h-10 text-red-500" /></div> ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((vid) => (
            <div key={vid.id} onClick={() => { setPlayingVideo(vid); setTimeLeft(30); setPointReady(false); setToast(''); }} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden cursor-pointer hover:border-red-500 transition-all group">
              <div className="relative aspect-video overflow-hidden">
                <img src={vid.thumbnail_360_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Video thumbnail" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white"><Play fill="currentColor" className="ml-1" /></div></div>
              </div>
              <div className="p-4"><h3 className="font-bold text-white text-sm line-clamp-2">{vid.title}</h3></div>
            </div>
          ))}
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
          <div className="flex-grow w-full max-w-5xl mx-auto p-4 flex items-center justify-center relative">
            <video id={`video-player`} className="w-full aspect-video rounded-2xl shadow-2xl bg-black relative z-0">
               <source src='https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' type='video/mp4' />
            </video>
          </div>
          {toast && <div className={`absolute bottom-10 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full font-bold shadow-xl z-50 ${toast.includes('خطأ') ? 'bg-red-600' : 'bg-green-600'} text-white`}>{toast}</div>}
        </div>
      )}
    </div>
  );
};
