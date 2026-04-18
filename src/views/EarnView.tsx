import React, { useState } from 'react';
import { Flame, Calendar, Play, Gamepad2, CheckCircle2 } from 'lucide-react';
import { updatePoints } from '../lib/firebase';

export const EarnView = ({ points, setRefreshPoints, user, setActiveTab }: any) => {
  const [toast, setToast] = useState<any>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  
  // Real implementation would store this in user document mapping dates to tasks.
  const [tasks, setTasks] = useState({
      login: { completed: false, reward: 50, title: 'تسجيل الدخول اليومي', desc: 'احصل على مكافأتك مجاناً', icon: Calendar, color: 'text-green-500', bg: 'bg-green-500/20' },
      watchVideos: { progress: 0, target: 5, completed: false, reward: 200, title: 'شاهد 5 فيديوهات', icon: Play, color: 'text-red-500', bg: 'bg-red-500/20', actionTab: 'videos' },
      playGames: { progress: 0, target: 3, completed: false, reward: 150, title: 'العب 3 مرات', icon: Gamepad2, color: 'text-blue-500', bg: 'bg-blue-500/20', actionTab: 'games' }
  });

  const handleClaimReward = async (taskId: string) => {
    if (!user) return setToast({ msg: 'سجل دخولك أولاً', isError: true });
    if (isClaiming) return;
    setIsClaiming(true);
    
    const task = (tasks as any)[taskId];
    const res = await updatePoints(user.id, task.reward, `إكمال مهمة: ${task.title}`, 'earn');
    
    if (res.success) {
        setRefreshPoints((p: number) => p + 1);
        setTasks(prev => ({ ...prev, [taskId]: { ...prev[taskId as keyof typeof prev], completed: true } }));
        setToast({ msg: `تم استلام ${task.reward} نقطة! ✨`, isError: false });
    } else setToast({ msg: `❌ ${res.error}`, isError: true });
    
    setIsClaiming(false); 
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in w-full" dir="rtl">
      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/20 rounded-3xl p-6 mb-8 flex justify-between items-center">
        <div><h2 className="text-2xl font-black text-white mb-1"><Flame className="inline text-orange-500"/> المهام اليومية</h2></div>
        <div className="text-3xl font-black text-amber-400">{user ? points.toLocaleString() : '0'}</div>
      </div>
      <div className="space-y-4">
          {Object.entries(tasks).map(([id, task]) => (
                <div key={id} className={`bg-neutral-900 border ${task.completed ? 'border-green-500/30' : 'border-neutral-800'} rounded-2xl p-5 flex items-center gap-4`}>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${task.completed ? 'bg-green-500/20' : task.bg}`}>
                    {task.completed ? <CheckCircle2 className="text-green-500" /> : <task.icon className={task.color} />}
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-bold text-white">{task.title}</h3>
                    {task.target && <div className="w-full bg-neutral-950 rounded-full h-2 mt-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min((task.progress/task.target)*100, 100)}%` }}></div></div>}
                  </div>
                  <div className="flex-shrink-0">
                      {task.completed ? <span className="text-green-500 font-bold text-sm">مستلمة</span> : 
                       (id === 'login' || task.progress >= task.target) ? 
                          <button onClick={() => handleClaimReward(id)} disabled={isClaiming} className="bg-amber-500 text-white font-bold px-4 py-2 rounded-xl">استلم!</button> :
                          <button onClick={() => setActiveTab(task.actionTab!)} className="bg-neutral-800 text-white px-4 py-2 rounded-xl text-sm">أكمل</button>}
                  </div>
                </div>
          ))}
      </div>
      {toast && <div className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full font-bold text-white z-50 ${toast.isError ? 'bg-red-600' : 'bg-green-600'}`}>{toast.msg}</div>}
    </div>
  );
};
