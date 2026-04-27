import React, { useState, useEffect } from 'react';
import { Flame, Calendar, Play, Gamepad2, CheckCircle2, Loader2, Trophy, Star, Target } from 'lucide-react';
import { getDailyTasks, claimDailyReward, claimLongtermReward, claimChainReward } from '../lib/firebase';

export const EarnView = ({ points, setRefreshPoints, user, setActiveTab, settings }: any) => {
  const [toast, setToast] = useState<any>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'daily' | 'weekly' | 'achievements' | 'chains'>('daily');
  
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
  
  const handleClaimLongterm = async (kind: any, target: number, reward: number, title: string) => {
    if (!user) return;
    if (isClaiming) return;
    setIsClaiming(true);
    
    const res = await claimLongtermReward(user.id, kind, target, reward, `إنجاز: ${title}`);
    if (res.success) {
        setRefreshPoints((p: number) => p + 1);
        setToast({ msg: `تم استلام مكافأة الإنجاز! ✨`, isError: false });
    } else setToast({ msg: `❌ ${res.error}`, isError: true });
    
    setIsClaiming(false);
    setTimeout(() => setToast(null), 3000);
  };

  const handleClaimChain = async (stepIndex: number, requiredType: string, requiredAmount: number, reward: number) => {
    if (!user) return;
    if (isClaiming) return;
    setIsClaiming(true);
    
    const res = await claimChainReward(user.id, stepIndex, requiredType, requiredAmount, reward);
    if (res.success) {
        setRefreshPoints((p: number) => p + 1);
        setToast({ msg: `تم استلام مكافأة السلسلة! ✨`, isError: false });
    } else setToast({ msg: `❌ ${res.error}`, isError: true });
    
    setIsClaiming(false);
    setTimeout(() => setToast(null), 3000);
  };

  const chainSteps = [
     { type: 'video', amount: 5, reward: 200, title: 'شاهد 5 فيديوهات', targetTab: 'videos', icon: Play, color: 'text-red-500' },
     { type: 'game', amount: 3, reward: 300, title: 'العب 3 ألعاب', targetTab: 'games', icon: Gamepad2, color: 'text-blue-500' },
     { type: 'video', amount: 15, reward: 800, title: 'شاهد 15 فيديو', targetTab: 'videos', icon: Play, color: 'text-red-500' },
     { type: 'game', amount: 10, reward: 1000, title: 'العب 10 ألعاب', targetTab: 'games', icon: Gamepad2, color: 'text-blue-500' },
     { type: 'video', amount: 30, reward: 2000, title: 'شاهد 30 فيديو', targetTab: 'videos', icon: Play, color: 'text-red-500' },
     { type: 'game', amount: 25, reward: 2500, title: 'العب 25 لعبة', targetTab: 'games', icon: Gamepad2, color: 'text-blue-500' }
  ];

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
  
  // Weekly / Monthly Logic
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const monthKey = `${year}-${month}`;
  
  const targetDate = new Date(currentDate.valueOf());
  const dayNr = (currentDate.getDay() + 6) % 7;
  targetDate.setDate(targetDate.getDate() - dayNr + 3);
  const firstThursday = targetDate.valueOf();
  targetDate.setMonth(0, 1);
  if (targetDate.getDay() !== 4) {
    targetDate.setMonth(0, 1 + ((4 - targetDate.getDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - targetDate.valueOf()) / 604800000);
  const weekKey = `${year}-W${String(weekNumber).padStart(2, '0')}`;
  
  const isCurrentWeek = user?.currentWeek === weekKey;
  const isCurrentMonth = user?.currentMonth === monthKey;
  
  const weeklyVidProgress = isCurrentWeek ? (user?.weeklyVideosWatched || 0) : 0;
  const weeklyGamesProgress = isCurrentWeek ? (user?.weeklyGamesPlayed || 0) : 0;
  
  const monthlyVidProgress = isCurrentMonth ? (user?.monthlyVideosWatched || 0) : 0;
  const monthlyGamesProgress = isCurrentMonth ? (user?.monthlyGamesPlayed || 0) : 0;
  
  const lifetimeVidProgress = user?.totalVideosWatched || 0;
  const lifetimeGamesProgress = user?.totalGamesPlayed || 0;

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in w-full" dir="rtl">
      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/20 rounded-3xl p-6 mb-6 flex justify-between items-center">
        <div><h2 className="text-2xl font-black text-white mb-1"><Target className="inline text-orange-500"/> مركز المهام</h2></div>
        <div className="text-3xl font-black text-amber-400">{user ? points.toLocaleString() : '0'}</div>
      </div>
      
      {!user && <div className="text-center text-neutral-500 mb-4 bg-neutral-900 border border-neutral-800 rounded-xl p-4">قم بتسجيل الدخول لمتابعة المهام</div>}

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 hide-scrollbar">
         <button onClick={() => setActiveSubTab('daily')} className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors ${activeSubTab === 'daily' ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-400 hover:text-white'}`}>
            <Flame className="inline w-4 h-4 mr-1" /> مهام يومية
         </button>
         <button onClick={() => setActiveSubTab('weekly')} className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors ${activeSubTab === 'weekly' ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-400 hover:text-white'}`}>
            <Calendar className="inline w-4 h-4 mr-1" /> أسبوعية وشہرية
         </button>
         <button onClick={() => setActiveSubTab('achievements')} className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors ${activeSubTab === 'achievements' ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-400 hover:text-white'}`}>
            <Trophy className="inline w-4 h-4 mr-1" /> إنجازات
         </button>
         <button onClick={() => setActiveSubTab('chains')} className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors ${activeSubTab === 'chains' ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-400 hover:text-white'}`}>
            <Target className="inline w-4 h-4 mr-1" /> سلاسل المهام
         </button>
      </div>

      <div className="space-y-4">
          {activeSubTab === 'daily' && (
             <>
                {/* Daily Login */}
                <div className={`bg-neutral-900 border ${loginCompleted ? 'border-green-500/30' : 'border-neutral-800'} rounded-2xl p-5 flex items-center gap-4`}>
                   <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${loginCompleted ? 'bg-green-500/20' : tasksTemplate.login.bg}`}>
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
                   <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${vidCompleted ? 'bg-green-500/20' : tasksTemplate.videos.bg}`}>
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
                   <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${gameCompleted ? 'bg-green-500/20' : tasksTemplate.games.bg}`}>
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
             </>
          )}
          
          {activeSubTab === 'weekly' && (
             <>
                {/* Weekly Videos */}
                <LongTermTask 
                   title="مشاهدة فيديوهات (أسبوعي)" 
                   desc="شاهد 50 فيديو هذا الأسبوع" 
                   target={50} 
                   progress={weeklyVidProgress} 
                   reward={1000} 
                   isClaimed={user?.weeklyClaimedVideos}
                   onClaim={() => handleClaimLongterm('weeklyVideos', 50, 1000, 'مهام أسبوعية - مشاهدة فيديوهات')}
                   actionTab="videos"
                   setActiveTab={setActiveTab}
                   icon={Play}
                   iconColor="text-pink-500"
                />
                
                {/* Weekly Games */}
                <LongTermTask 
                   title="لعب ألعاب (أسبوعي)" 
                   desc="العب 20 لعبة هذا الأسبوع" 
                   target={20} 
                   progress={weeklyGamesProgress} 
                   reward={1000} 
                   isClaimed={user?.weeklyClaimedGames}
                   onClaim={() => handleClaimLongterm('weeklyGames', 20, 1000, 'مهام أسبوعية - ألعاب')}
                   actionTab="games"
                   setActiveTab={setActiveTab}
                   icon={Gamepad2}
                   iconColor="text-indigo-500"
                />
                
                {/* Monthly Videos */}
                <LongTermTask 
                   title="ماراثون الفيديوهات (شهري)" 
                   desc="شاهد 200 فيديو هذا الشهر" 
                   target={200} 
                   progress={monthlyVidProgress} 
                   reward={5000} 
                   isClaimed={user?.monthlyClaimedVideos}
                   onClaim={() => handleClaimLongterm('monthlyVideos', 200, 5000, 'مهام شهرية - مشاهدة فيديوهات')}
                   actionTab="videos"
                   setActiveTab={setActiveTab}
                   icon={Calendar}
                   iconColor="text-green-500"
                />
                
                {/* Monthly Games */}
                <LongTermTask 
                   title="بطل الألعاب (شهري)" 
                   desc="العب 100 لعبة هذا الشهر" 
                   target={100} 
                   progress={monthlyGamesProgress} 
                   reward={5000} 
                   isClaimed={user?.monthlyClaimedGames}
                   onClaim={() => handleClaimLongterm('monthlyGames', 100, 5000, 'مهام شهرية - ألعاب')}
                   actionTab="games"
                   setActiveTab={setActiveTab}
                   icon={Calendar}
                   iconColor="text-green-500"
                />
             </>
          )}
          
          {activeSubTab === 'achievements' && (
             <>
                <LongTermTask 
                   title="عين الصقر" 
                   desc="شاهد 100 فيديو (إنجاز مدى الحياة)" 
                   target={100} 
                   progress={lifetimeVidProgress} 
                   reward={10000} 
                   isClaimed={user?.lifetimeClaimed100Videos}
                   onClaim={() => handleClaimLongterm('lifetime100Videos', 100, 10000, 'إنجاز - 100 فيديو')}
                   actionTab="videos"
                   setActiveTab={setActiveTab}
                   icon={Star}
                   iconColor="text-yellow-500"
                />
                <LongTermTask 
                   title="متيم الألعاب" 
                   desc="العب 100 لعبة (إنجاز مدى الحياة)" 
                   target={100} 
                   progress={lifetimeGamesProgress} 
                   reward={10000} 
                   isClaimed={user?.lifetimeClaimed100Games}
                   onClaim={() => handleClaimLongterm('lifetime100Games', 100, 10000, 'إنجاز - 100 لعبة')}
                   actionTab="games"
                   setActiveTab={setActiveTab}
                   icon={Star}
                   iconColor="text-yellow-500"
                />
             </>
          )}

          {activeSubTab === 'chains' && (
             <div className="space-y-6">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                   <h3 className="text-xl font-bold text-white mb-2">سلسلة المكافآت</h3>
                   <p className="text-neutral-400 mb-6 text-sm">أكمل المهام بالترتيب لفتح المهمة التالية، واستمر في الحلقة لجمع المزيد من المكافآت.</p>
                   
                   <div className="space-y-4 relative">
                      {/* Line connector */}
                      <div className="absolute right-[27px] top-8 bottom-8 w-1 bg-neutral-800 rounded-full z-0"></div>

                      {[0, 1, 2, 3].map((offset) => {
                         const userStep = user?.chainStep || 0;
                         const renderIdx = userStep + offset;
                         const stepConf = chainSteps[renderIdx % chainSteps.length];
                         
                         // Calculation
                         let progress = 0;
                         if (offset === 0) {
                            const base = stepConf.type === 'video' ? (user?.[`chainVideosBase_${userStep}`] || 0) : (user?.[`chainGamesBase_${userStep}`] || 0);
                            const current = stepConf.type === 'video' ? (user?.totalVideosWatched || 0) : (user?.totalGamesPlayed || 0);
                            progress = Math.max(0, current - base);
                         } else {
                            progress = 0; // future steps
                         }

                         const isCurrent = offset === 0;
                         const isReady = isCurrent && progress >= stepConf.amount;
                         
                         return (
                            <div key={`chain_${renderIdx}`} className={`relative z-10 bg-neutral-950 border ${isCurrent ? 'border-amber-500/50' : 'border-neutral-800/50'} rounded-2xl p-4 flex items-center gap-4 ${offset > 0 ? 'opacity-50' : ''}`}>
                               <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${isCurrent ? 'bg-amber-500/20' : 'bg-neutral-900'} border ${isCurrent ? 'border-amber-500/30' : 'border-neutral-800'}`}>
                                  {isCurrent && isReady ? <CheckCircle2 className="text-amber-500" /> : <stepConf.icon className={isCurrent ? stepConf.color : 'text-neutral-500'} />}
                               </div>
                               <div className="flex-grow">
                                  <h3 className={`font-bold ${isCurrent ? 'text-white' : 'text-neutral-400'}`}>
                                    {stepConf.title} <span className="text-amber-500 text-sm">({stepConf.reward}+)</span>
                                  </h3>
                                  <div className="w-full bg-neutral-900 rounded-full h-2 mt-2">
                                     <div className={`h-2 rounded-full transition-all ${isCurrent ? (stepConf.type ==='video'?'bg-red-500':'bg-blue-500') : 'bg-neutral-700'}`} style={{ width: `${Math.min((progress/stepConf.amount)*100, 100)}%` }}></div>
                                  </div>
                                  <div className="text-xs text-neutral-500 mt-1 font-mono">{progress} / {stepConf.amount}</div>
                               </div>
                               <div className="flex-shrink-0">
                                  {isCurrent ? (
                                      isReady ? <button onClick={() => handleClaimChain(renderIdx, stepConf.type, stepConf.amount, stepConf.reward)} className="bg-amber-500 text-black font-bold px-4 py-2 rounded-xl shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform">استلم!</button>
                                      : <button onClick={() => setActiveTab(stepConf.targetTab)} className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-xl text-sm transition-colors">أكمل</button>
                                  ) : (
                                      <div className="px-4 py-2 text-sm text-neutral-600 font-bold">مغلق</div>
                                  )}
                               </div>
                            </div>
                         );
                      })}

                   </div>
                </div>
             </div>
          )}

      </div>
      {toast && <div className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full font-bold text-white z-50 shadow-lg ${toast.isError ? 'bg-red-600' : 'bg-green-600'}`}>{toast.msg}</div>}
    </div>
  );
};


const LongTermTask = ({ title, desc, target, progress, reward, isClaimed, onClaim, actionTab, setActiveTab, icon: Icon, iconColor }: any) => {
   const isReady = progress >= target && !isClaimed;
   
   return (
      <div className={`bg-neutral-900 border ${isClaimed ? 'border-green-500/30' : 'border-neutral-800'} rounded-2xl p-5 flex items-center gap-4`}>
         <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${isClaimed ? 'bg-green-500/20' : 'bg-neutral-800'}`}>
            {isClaimed ? <CheckCircle2 className="text-green-500" /> : <Icon className={iconColor} />}
         </div>
         <div className="flex-grow">
            <h3 className="font-bold text-white">{title} <span className="text-amber-500 text-sm">({reward}+)</span></h3>
            <p className="text-xs text-neutral-400 mb-2">{desc}</p>
            <div className="w-full bg-neutral-950 rounded-full h-2 mt-2">
               <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all" style={{ width: `${Math.min((progress/target)*100, 100)}%` }}></div>
            </div>
            <div className="text-xs text-neutral-500 mt-1 font-mono">{progress} / {target}</div>
         </div>
         <div className="flex-shrink-0">
            {isClaimed ? <span className="text-green-500 font-bold text-sm">مستلمة</span> : 
                isReady ? <button onClick={onClaim} className="bg-amber-500 text-black font-bold px-4 py-2 rounded-xl shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform">استلم!</button>
                : <button onClick={() => setActiveTab(actionTab)} className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-xl text-sm transition-colors">أكمل</button>}
         </div>
      </div>
   );
}
