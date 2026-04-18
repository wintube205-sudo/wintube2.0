import React, { useState, useEffect } from 'react';
import { Trophy, Loader2 } from 'lucide-react';
import { getLeaderboard } from '../services/api';

export const LeaderboardView = ({ user, points }: any) => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard(user?.id).then(res => {
      setLeaders(res);
      setLoading(false);
    });
  }, [user, points]);

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in w-full" dir="rtl">
      <div className="flex items-center gap-3 mb-8 justify-center"><Trophy className="text-amber-500" size={36} /><h2 className="text-3xl font-black text-white">قائمة المتصدرين</h2></div>
      {loading ? ( <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-500" size={40} /></div> ) : (
        <div className="space-y-3">
          {leaders.map((leader, index) => {
            const isTop3 = index < 3;
            const rankColors = ['bg-yellow-500/10 border-yellow-500/30 text-yellow-500', 'bg-gray-300/10 border-gray-300/30 text-gray-300', 'bg-amber-700/10 border-amber-700/30 text-amber-600'];
            const rankStyle = isTop3 ? rankColors[index] : 'bg-neutral-900 border-neutral-800 text-neutral-400';
            return (
              <div key={leader.id || index} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${rankStyle} ${leader.isCurrentUser ? 'ring-2 ring-blue-500' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center font-black text-lg">{index + 1}</div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold bg-neutral-700">{leader.name?.charAt(0) || 'U'}</div>
                    <div>
                      <span className={`font-bold text-lg ${leader.isCurrentUser ? 'text-blue-400' : 'text-white'}`}>{leader.name} {leader.isCurrentUser && <span className="text-xs ml-1 text-blue-300">(أنت)</span>}</span>
                      {leader.isVip && <span className="bg-purple-500/20 text-purple-400 text-[10px] px-2 ml-2 rounded font-bold">VIP</span>}
                    </div>
                  </div>
                </div>
                <div className="font-black text-xl">{leader.points.toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
