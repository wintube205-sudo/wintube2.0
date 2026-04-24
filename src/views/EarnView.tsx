import React, { useState, useEffect } from 'react';
import { Flame, Calendar, Play, Gamepad2, CheckCircle2, Loader2 } from 'lucide-react';
import { getDailyTasks, claimDailyReward } from '../lib/firebase';

export const EarnView = ({ points, setRefreshPoints, user, setActiveTab, settings }: any) => {
  const [toast, setToast] = useState<any>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [serverStats, setServerStats] = useState<any>(null);

  const tasksTemplate = {
      login: { 
         reward: settings?.taskRewardLogin || 50, 
         title: 'تسجيل الدخول اليومي', desc: 'احصل على مكافأتك مجاناً', icon: Calendar, color: 'text-green-500', bg: 'bg-green-500/20' 
      },
      videos: { 
         target: settings?.taskTargetVideos || 5, 
         reward: settings?.taskRewardVideos || 200, 
         title: `شاهد ${settings?.taskTargetVideos || 5} فيديوهات`, icon: Play, color: 'text-red-500', bg: 'bg-red-500/20', actionTab: 'videos' 
      },
      games: { 
         target: settings?.taskTargetGames || 3, 
         reward: settings?.taskRewardGames || 150, 
         title: `العب ${settings?.taskTargetGames || 3} مرات`, icon: Gamepad2, color: 'text-blue-500', bg: 'bg-blue-500/20', actionTab: 'games' 
      }
  };

  useEffect(() => {
    if (user) {
        setIsLoading(true);
        getDailyTasks(user.id).then(data => {
            setServerStats(data);
            setIsLoading(false);
        }).catch(() => setIsLoading(false));
    } else {
        setIsLoading(false);
    }
  }, [user]);

  const handleClaimReward = async (taskId: 'login' | 'videos' | 'games') => {
    if (!user) return setToast({ msg: 'سجل دخولك أولاً', isError: true });
    if (isClaiming) return;
    setIsClaiming(true);
    
    const task = tasksTemplate[taskId];
    const res = await claimDailyReward(user.id, taskId, task.reward, `إكمال مهمة: ${task.title}`);
    
    if (res.success) {
        setRefreshPoints((p: number) => p + 1);
        setServerStats((prev: any) => ({ ...prev, [`${taskId}Claimed`]: true }));
        setToast({ msg: `تم استلام ${task.reward} نقطة! ✨`, isError: false });
    } else setToast({ msg: `❌ ${res.error}`, isError: true });
    
    setIsClaiming(false); 
    setTimeout(() => setToast(null), 3000);
  };

  if (isLoading) {
      return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-500" size={40}/></div>;
  }

  const loginCompleted = serverStats?.loginClaimed || false;
  
  const vidProgress = serverStats?.videosWatched || 0;
  const vidCompleted = serverStats?.videosClaimed || false;
  const vidReady = vidProgress >= tasksTemplate.videos.target && !vidCompleted;

  const gameProgress = serverStats?.gamesPlayed || 0;
  const gameCompleted = serverStats?.gamesClaimed || false;
  const gameReady = gameProgress >= tasksTemplate.games.target && !gameCompleted;

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in w-full" dir="rtl">
      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/20 rounded-3xl p-6 mb-8 flex justify-between items-center">
        <div><h2 className="text-2xl font-black text-white mb-1"><Flame className="inline text-orange-500"/> المهام اليومية</h2></div>
        <div className="text-3xl font-black text-amber-400">{user ? points.toLocaleString() : '0'}</div>
      </div>
      
      {!user && <div className="text-center text-neutral-500 mb-4 bg-neutral-900 border border-neutral-800 rounded-xl p-4">قم بتسجيل الدخول لمتابعة المهام اليومية</div>}

      <div className="space-y-4">
          {/* Daily Login */}
          <div className={`bg-neutral-900 border ${loginCompleted ? 'border-green-500/30' : 'border-neutral-800'} rounded-2xl p-5 flex items-center gap-4`}>
             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${loginCompleted ? 'bg-green-500/20' : tasksTemplate.login.bg}`}>
                {loginCompleted ? <CheckCircle2 className="text-green-500" /> : <tasksTemplate.login.icon className={tasksTemplate.login.color} />}
             </div>
             <div className="flex-grow">
                <h3 className="font-bold text-white">{tasksTemplate.login.title} ({tasksTemplate.login.reward}+)</h3>
             </div>
             <div className="flex-shrink-0">
                {loginCompleted ? <span className="text-green-500 font-bold text-sm">مستلمة</span> : 
                  <button onClick={() => handleClaimReward('login')} disabled={isClaiming || !user} className="bg-amber-500 text-white font-bold px-4 py-2 rounded-xl disabled:opacity-50">استلم!</button>}
             </div>
          </div>

          {/* Videos */}
          <div className={`bg-neutral-900 border ${vidCompleted ? 'border-green-500/30' : 'border-neutral-800'} rounded-2xl p-5 flex items-center gap-4`}>
             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${vidCompleted ? 'bg-green-500/20' : tasksTemplate.videos.bg}`}>
                {vidCompleted ? <CheckCircle2 className="text-green-500" /> : <tasksTemplate.videos.icon className={tasksTemplate.videos.color} />}
             </div>
             <div className="flex-grow">
                <h3 className="font-bold text-white">{tasksTemplate.videos.title} ({tasksTemplate.videos.reward}+)</h3>
                <div className="w-full bg-neutral-950 rounded-full h-2 mt-2"><div className="bg-red-500 h-2 rounded-full transition-all" style={{ width: `${Math.min((vidProgress/tasksTemplate.videos.target)*100, 100)}%` }}></div></div>
                <div className="text-xs text-neutral-500 mt-1">{vidProgress} / {tasksTemplate.videos.target}</div>
             </div>
             <div className="flex-shrink-0">
                {vidCompleted ? <span className="text-green-500 font-bold text-sm">مستلمة</span> : 
                    vidReady ? <button onClick={() => handleClaimReward('videos')} disabled={isClaiming} className="bg-amber-500 text-white font-bold px-4 py-2 rounded-xl">استلم!</button>
                    : <button onClick={() => setActiveTab('videos')} className="bg-neutral-800 text-white px-4 py-2 rounded-xl text-sm">أكمل</button>}
             </div>
          </div>

          {/* Games */}
          <div className={`bg-neutral-900 border ${gameCompleted ? 'border-green-500/30' : 'border-neutral-800'} rounded-2xl p-5 flex items-center gap-4`}>
             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${gameCompleted ? 'bg-green-500/20' : tasksTemplate.games.bg}`}>
                {gameCompleted ? <CheckCircle2 className="text-green-500" /> : <tasksTemplate.games.icon className={tasksTemplate.games.color} />}
             </div>
             <div className="flex-grow">
                <h3 className="font-bold text-white">{tasksTemplate.games.title} ({tasksTemplate.games.reward}+)</h3>
                <div className="w-full bg-neutral-950 rounded-full h-2 mt-2"><div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${Math.min((gameProgress/tasksTemplate.games.target)*100, 100)}%` }}></div></div>
                <div className="text-xs text-neutral-500 mt-1">{gameProgress} / {tasksTemplate.games.target}</div>
             </div>
             <div className="flex-shrink-0">
                {gameCompleted ? <span className="text-green-500 font-bold text-sm">مستلمة</span> : 
                    gameReady ? <button onClick={() => handleClaimReward('games')} disabled={isClaiming} className="bg-amber-500 text-white font-bold px-4 py-2 rounded-xl">استلم!</button>
                    : <button onClick={() => setActiveTab('games')} className="bg-neutral-800 text-white px-4 py-2 rounded-xl text-sm">أكمل</button>}
             </div>
          </div>

      </div>
      {toast && <div className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full font-bold text-white z-50 shadow-lg ${toast.isError ? 'bg-red-600' : 'bg-green-600'}`}>{toast.msg}</div>}
    </div>
  );
};
