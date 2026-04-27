import React, { useState, useEffect } from 'react';
import { Calendar, Flame, Timer, Zap, Loader2, Play, Gamepad2, Gift } from 'lucide-react';

export const EventsView = ({ settings, setActiveTab }: any) => {
   // Event logic - simple 3 days event simulation for demo
   // In a real app this would come from Firebase settings
   
   const [timeRemaining, setTimeRemaining] = useState('');
   const [endDate] = useState(() => {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      return d;
   });

   useEffect(() => {
      const interval = setInterval(() => {
         const now = new Date();
         const diff = endDate.getTime() - now.getTime();
         if (diff <= 0) {
            setTimeRemaining('انتهى الحدث');
            return;
         }
         const d = Math.floor(diff / (1000 * 60 * 60 * 24));
         const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
         const m = Math.floor((diff / 1000 / 60) % 60);
         const s = Math.floor((diff / 1000) % 60);
         setTimeRemaining(`${d}يوم ${h}س ${m}د ${s}ث`);
      }, 1000);
      return () => clearInterval(interval);
   }, [endDate]);

   return (
     <div className="max-w-4xl mx-auto animate-in fade-in w-full pb-20" dir="rtl">
       <div className="flex items-center gap-3 mb-8 justify-center">
         <Zap className="text-amber-500" size={36} />
         <h2 className="text-3xl font-black text-white">الفعاليات المؤقتة</h2>
       </div>

       <div className="bg-gradient-to-r from-purple-900 to-indigo-900 border border-purple-500/30 rounded-3xl p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
             <div>
                <span className="inline-block bg-red-500 text-white font-bold px-3 py-1 rounded-full text-sm mb-3 animate-pulse">حدث نشط!</span>
                <h3 className="text-3xl font-black text-white mb-2">مهرجان النقاط المضاعفة 2X</h3>
                <p className="text-purple-200 font-medium">احصل على ضعف النقاط المعتادة من مشاهدة الفيديوهات ولعب الألعاب لفترة محدودة!</p>
             </div>
             
             <div className="bg-black/40 backdrop-blur-sm border border-purple-500/50 rounded-2xl p-4 text-center min-w-[200px]">
                <div className="text-purple-300 text-sm font-bold mb-1 flex items-center justify-center gap-2">
                   <Timer size={16} /> ينتهي الحدث خلال
                </div>
                <div className="text-2xl font-black text-white font-mono">{timeRemaining || 'جاري الحساب...'}</div>
             </div>
          </div>
       </div>

       <h3 className="text-xl font-bold text-white mb-4 mt-8 flex items-center gap-2"><Gift className="text-amber-500"/> مهام الحدث الخاصة</h3>
       
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 hover:border-amber-500/30 transition-colors">
             <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500">
                   <Play size={24} />
                </div>
                <div className="bg-amber-500/20 text-amber-500 font-bold px-3 py-1 rounded-full text-sm">
                   2X نقاط
                </div>
             </div>
             <h4 className="font-bold text-white text-lg mb-1">فيديوهات خيالية</h4>
             <p className="text-neutral-400 text-sm mb-4">كل فيديو تشاهده الآن يعطيك {(settings?.videoPoints || 10) * 2} نقطة بدلاً من {settings?.videoPoints || 10}!</p>
             <button onClick={() => setActiveTab('videos')} className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2 rounded-xl transition-colors">ابزأ الآن</button>
          </div>
          
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 hover:border-amber-500/30 transition-colors">
             <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
                   <Gamepad2 size={24} />
                </div>
                <div className="bg-amber-500/20 text-amber-500 font-bold px-3 py-1 rounded-full text-sm">
                   2X نقاط
                </div>
             </div>
             <h4 className="font-bold text-white text-lg mb-1">ألعاب التحدي المضاعف</h4>
             <p className="text-neutral-400 text-sm mb-4">كل لعبة تلعبها الآن تعطيك {(settings?.gamePoints || 15) * 2} نقطة بدلاً من {settings?.gamePoints || 15}!</p>
             <button onClick={() => setActiveTab('games')} className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2 rounded-xl transition-colors">العب الآن</button>
          </div>
       </div>

     </div>
   );
};
