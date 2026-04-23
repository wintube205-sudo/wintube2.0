import React, { useState, useEffect, useCallback } from 'react';
import { Gamepad2, X } from 'lucide-react';
import { updatePoints, incrementDailyProgress } from '../lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AdBanner } from '../components/AdBanner';

export const GamesView = ({ points, user, setRefreshPoints, settings }: any) => {
  const [bet, setBet] = useState(10);
  const [result, setResult] = useState<any>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [activeGameCategory, setActiveGameCategory] = useState('betting'); 
  const [playingArcadeGame, setPlayingArcadeGame] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [toast, setToast] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [pointReady, setPointReady] = useState(false);
  const [arcadeGames, setArcadeGames] = useState<any[]>([]);

  useEffect(() => {
     getDocs(query(collection(db, 'games'), limit(20))).then(snap => {
         setArcadeGames(snap.docs.map(d => ({ id: d.id, ...d.data() })));
     });
  }, []);

  const requestGamePointFromServer = useCallback(async () => {
    if (isClaiming || !pointReady || !user) return;
    setIsClaiming(true);
    try {
      const reward = settings?.gamePoints || 5;
      const response = await updatePoints(user.id, reward, 'لعب لعبة تسلية', 'earn');
      if (response.success) {
        await incrementDailyProgress(user.id, 'game');
        setRefreshPoints((prev: number) => prev + 1);
        setToast(`+ مكافأة ${reward} نقطة!`); 
        setPointReady(false); 
        setTimeLeft(30); 
      } else { 
        setToast(`❌ خطأ: ${response.error}`); 
        setPointReady(false); 
      }
    } catch (err) { setToast('حدث خطأ'); } finally { setIsClaiming(false); setTimeout(() => setToast(''), 2000); }
  }, [isClaiming, pointReady, user, settings]);

  useEffect(() => {
    let timer: any;
    if (playingArcadeGame && !isClaiming && !pointReady) {
      timer = setInterval(() => {
        if (!document.hidden) {
          setTimeLeft(prev => {
             if (prev <= 1) { 
               if (!user) { setToast('يرجى تسجيل الدخول'); setPlayingArcadeGame(null); setPointReady(false); return 0; } 
               setPointReady(true); return 0; 
             }
             return prev - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [playingArcadeGame, isClaiming, pointReady, user]);

  const playCoinFlip = async (choice: string) => {
    if (!user) return alert('سجل دخولك أولاً');
    if (bet < 10) return alert('الحد الأدنى 10 نقاط');
    if (points < bet) return alert('رصيد غير كافٍ');
    
    setIsRolling(true); setResult(null);
    try {
      const deduct = await updatePoints(user.id, -bet, 'رهان لعبة رمي العملة', 'spend');
      if (!deduct.success) {
         setResult({ msg: deduct.error, color: 'text-red-500' });
         setIsRolling(false);
         return;
      }
      setRefreshPoints((prev: number) => prev + 1);
      
      const isWin = Math.random() < 0.45;
      if (isWin) {
         const winAmt = bet * 2;
         await updatePoints(user.id, winAmt, 'فوز في لعبة رمي العملة', 'earn');
         setRefreshPoints((prev: number) => prev + 1);
      }
      
      await incrementDailyProgress(user.id, 'game');
      setResult({ msg: isWin ? 'لقد فزت!' : 'حظ أوفر', color: isWin ? 'text-green-500' : 'text-neutral-500' });

    } catch (err) { setResult({ msg: 'خطأ', color: 'text-red-500' }); } finally { setIsRolling(false); }
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in w-full" dir="rtl">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-black text-white flex items-center gap-2"><Gamepad2 className="text-blue-500" /> قسم الألعاب</h2>
        <div className="flex bg-neutral-900 rounded-xl p-1 border border-neutral-800">
          <button onClick={() => setActiveGameCategory('betting')} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeGameCategory === 'betting' ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}>ألعاب الرهان</button>
          <button onClick={() => setActiveGameCategory('arcade')} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeGameCategory === 'arcade' ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}>ألعاب تسلية</button>
        </div>
      </div>

      {activeGameCategory === 'betting' ? (
        <div className="max-w-2xl mx-auto bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center">
          <h3 className="text-xl font-bold text-amber-400 mb-2">رمي العملة</h3>
          <div className="mb-6"><input type="number" value={bet} onChange={(e) => setBet(Number(e.target.value))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white text-center font-bold outline-none" min="10" disabled={isRolling} /></div>
          <div className="flex gap-4">
            <button disabled={isRolling} onClick={() => playCoinFlip('heads')} className="flex-1 bg-neutral-800 text-white font-bold py-4 rounded-xl disabled:opacity-50">{isRolling ? '...' : 'طرة (Heads)'}</button>
            <button disabled={isRolling} onClick={() => playCoinFlip('tails')} className="flex-1 bg-neutral-800 text-white font-bold py-4 rounded-xl disabled:opacity-50">{isRolling ? '...' : 'نقش (Tails)'}</button>
          </div>
          {result && <div className={`mt-6 text-xl font-black ${result.color}`}>{result.msg}</div>}
        </div>
      ) : (
        <>
          {arcadeGames.filter(g => g.isFeatured).length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">✨ ألعاب مميزة</h3>
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x min-h-[250px] hide-scrollbar">
                {arcadeGames.filter(g => g.isFeatured).map((game) => (
                  <div key={game.id} onClick={() => { setPlayingArcadeGame(game); setTimeLeft(30); setPointReady(false); }} className="snap-center shrink-0 w-80 relative rounded-3xl overflow-hidden cursor-pointer group border border-neutral-800 hover:border-amber-500 transition-colors">
                    <img src={game.thumbnail} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e: any) => { e.target.src = 'https://via.placeholder.com/400x250?text=Game'; }} alt={game.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-6 w-full">
                      <span className="text-[10px] font-bold tracking-widest text-amber-500 uppercase mb-1 block">لعبة مميزة</span>
                      <h3 className="text-2xl font-black text-white">{game.title}</h3>
                      <button className="mt-3 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-bold w-max hover:bg-white hover:text-black transition-colors">العب الآن</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h3 className="text-lg font-bold text-white mb-4">كل الألعاب</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {arcadeGames.length === 0 ? <p className="col-span-full text-center py-10 text-neutral-500">جاري تحميل الألعاب...</p> : arcadeGames.map((game) => (
              <div key={game.id} onClick={() => { setPlayingArcadeGame(game); setTimeLeft(30); setPointReady(false); }} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden cursor-pointer hover:border-blue-500 group transition-colors">
                <div className="aspect-square bg-neutral-950 relative overflow-hidden"><img src={game.thumbnail} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" onError={(e: any) => { e.target.src = 'https://via.placeholder.com/150?text=Game'; }} alt={game.title} /></div>
                <div className="p-3 border-t border-neutral-800"><h3 className="font-bold text-white text-sm truncate">{game.title}</h3></div>
              </div>
            ))}
          </div>
        </>
      )}

      {playingArcadeGame && (
         <div className="fixed inset-0 bg-black/95 z-50 flex flex-col animate-in zoom-in-95">
          <div className="p-4 border-b border-neutral-800 flex justify-between bg-neutral-950">
            <div className="flex items-center gap-4 text-white font-bold"><Gamepad2 className="text-blue-500" size={20} /> {playingArcadeGame.title}</div>
            <button onClick={() => { setPlayingArcadeGame(null); setPointReady(false); }} className="p-2 bg-neutral-800 text-white rounded-xl flex items-center gap-1"><X size={18} /> إغلاق</button>
          </div>
          <div className="flex-grow w-full max-w-5xl mx-auto p-4 flex flex-col items-center justify-center relative overflow-y-auto">
             <AdBanner />
             <div className="w-full relative flex-grow min-h-[50vh] max-h-[80vh]">
               <iframe src={playingArcadeGame.url} allowFullScreen className="w-full h-full rounded-2xl bg-white relative z-0"></iframe>
             </div>
             <AdBanner />
             
             {pointReady && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                  <button onClick={requestGamePointFromServer} disabled={isClaiming} className="pointer-events-auto bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black py-4 px-10 rounded-full animate-bounce shadow-2xl scale-125 border-4 border-white/20">استلم النقطة وتابع اللعب ✨</button>
                </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};
