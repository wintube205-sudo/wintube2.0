import React, { useState } from 'react';
import { updatePoints, incrementDailyProgress } from '../lib/firebase';
import { Disc, PlayCircle, Loader2 } from 'lucide-react';

export const WheelOfFortune = ({ user, points, setRefreshPoints }: any) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [bet, setBet] = useState(20);
  const [rotation, setRotation] = useState(0);

  const segments = [
    { label: '0x', multiplier: 0, color: '#ef4444' }, // 0
    { label: '2x', multiplier: 2, color: '#3b82f6' }, // 1
    { label: '0.5x', multiplier: 0.5, color: '#f59e0b' }, // 2
    { label: '3x', multiplier: 3, color: '#10b981' }, // 3
    { label: '0x', multiplier: 0, color: '#ef4444' }, // 4
    { label: '5x', multiplier: 5, color: '#8b5cf6' }, // 5
    { label: '0.5x', multiplier: 0.5, color: '#f59e0b' }, // 6
    { label: '1.5x', multiplier: 1.5, color: '#6b7280' }, // 7
  ];

  const spinWheel = async () => {
    if (!user) return alert('سجل دخولك أولاً');
    if (bet < 10) return alert('الحد الأدنى للرهان هو 10 نقاط');
    if (points < bet) return alert('رصيد غير كافٍ');

    setIsSpinning(true);
    setResult(null);

    try {
      const deduct = await updatePoints(user.id, -bet, 'عجلة الحظ - رهان', 'spend');
      if (!deduct.success) {
        setResult({ msg: deduct.error, color: 'text-red-500' });
        setIsSpinning(false);
        return;
      }
      setRefreshPoints((prev: number) => prev + 1);

      // Determine the winner (70% loss, 30% win/tie)
      const rand = Math.random();
      let winningIndex = 0;
      if (rand < 0.20) winningIndex = 0; // 0x (20%)
      else if (rand < 0.40) winningIndex = 4; // 0x (20%)
      else if (rand < 0.55) winningIndex = 2; // 0.5x (15%)
      else if (rand < 0.70) winningIndex = 6; // 0.5x (15%)
      else if (rand < 0.84) winningIndex = 7; // 1.5x (14%)
      else if (rand < 0.94) winningIndex = 1; // 2x (10%)
      else if (rand < 0.99) winningIndex = 3; // 3x (5%)
      else winningIndex = 5; // 5x (1%)

      const segment = segments[winningIndex];

      // Calculate new rotation
      const sliceAngle = 360 / segments.length;
      // Current rotation + minimum 5 spins (1800 deg) + offset to winning slice
      const targetRotation = rotation + 1800 + (360 - (winningIndex * sliceAngle)) - (sliceAngle / 2);
      
      setRotation(targetRotation);

      setTimeout(async () => {
        const wonAmount = Math.floor(bet * segment.multiplier);
        if (wonAmount > 0) {
          await updatePoints(user.id, wonAmount, `عجلة الحظ - فوز (${segment.label})`, 'earn');
          setRefreshPoints((prev: number) => prev + 1);
        }
        await incrementDailyProgress(user.id, 'game');
        
        let msg = '';
        let color = '';
        if (segment.multiplier > 1) {
          msg = `🎉 لقد ربحت ${wonAmount} نقطة!`;
          color = 'text-green-500';
        } else if (segment.multiplier === 1) {
          msg = 'استرددت رهانك';
          color = 'text-blue-500';
        } else if (segment.multiplier > 0) {
          msg = `لقد حصلت على نصف رهانك: ${wonAmount} نقطة`;
          color = 'text-yellow-500';
        } else {
          msg = 'الخسارة... حظ أوفر في المرة القادمة';
          color = 'text-red-500';
        }
        
        setResult({ msg, color });
        setIsSpinning(false);
      }, 5000);

    } catch (err) {
      setResult({ msg: 'حدث خطأ', color: 'text-red-500' });
      setIsSpinning(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center max-w-sm mx-auto w-full relative overflow-hidden">
      <h3 className="text-xl font-bold text-amber-400 mb-6 flex items-center justify-center gap-2">
        <Disc className="text-amber-500" /> عجلة الحظ
      </h3>

      <div className="relative w-64 h-64 mx-auto mb-8">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 z-20 text-white drop-shadow-lg">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21L23 3H1L12 21Z" fill="#ef4444" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Wheel */}
        <div 
          className="w-full h-full rounded-full border-4 border-neutral-800 overflow-hidden relative shadow-2xl transition-transform duration-[5s] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Background conic gradient */}
          <div className="absolute inset-0" style={{
            background: `conic-gradient(
              ${segments.map((seg, i) => `${seg.color} ${i * (360 / segments.length)}deg ${(i + 1) * (360 / segments.length)}deg`).join(', ')}
            )`
          }} />
          
          {/* Text labels and lines */}
          {segments.map((seg, i) => {
            const rot = i * (360 / segments.length) + (360 / segments.length / 2);
            return (
              <div key={i} className="absolute inset-0 flex flex-col items-center pt-4"
                   style={{ transform: `rotate(${rot}deg)` }}>
                <span className="text-white font-black text-lg drop-shadow-md">{seg.label}</span>
              </div>
            );
          })}
          
          {/* Inner details */}
          <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] pointer-events-none"></div>
          <div className="absolute top-1/2 left-1/2 w-10 h-10 bg-neutral-800 rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-neutral-700 z-10 flex items-center justify-center shadow-lg">
             <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex items-center bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden p-1">
        <span className="px-3 text-neutral-400 font-bold">رهان:</span>
        <input 
          type="number" 
          value={bet} 
          onChange={(e) => setBet(Number(e.target.value))} 
          className="w-full bg-transparent p-2 text-white text-center font-bold outline-none" 
          min="10" 
          disabled={isSpinning} 
        />
        <span className="px-3 text-amber-500 font-bold">نقطة</span>
      </div>

      <button 
        disabled={isSpinning} 
        onClick={spinWheel} 
        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black py-4 rounded-xl shadow-lg disabled:opacity-50 transition-all flex justify-center items-center gap-2"
      >
        {isSpinning ? <Loader2 className="animate-spin" /> : <PlayCircle />}
        {isSpinning ? 'جاري اللف...' : 'لف العجلة'}
      </button>

      {result && <div className={`mt-6 text-lg font-black ${result.color} animate-in slide-in-from-bottom flex justify-center items-center p-3 bg-black/20 rounded-xl`}>{result.msg}</div>}
    </div>
  );
};
