import React, { useEffect, useState } from 'react';
import { History, Coins } from 'lucide-react';
import { getUserHistory } from '../services/api';

export const ProfileView = ({ user, points }: any) => {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
       getUserHistory(user.id).then(res => setHistory(res));
    }
  }, [user, points]);

  if (!user) return <div className="text-center py-20 text-neutral-500">يرجى تسجيل الدخول لعرض حسابك</div>;
  
  return (
    <div className="max-w-4xl mx-auto animate-in fade-in w-full" dir="rtl">
      <div className="flex items-center gap-4 mb-8">
         <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-black text-3xl">{user.name?.charAt(0) || 'U'}</div>
         <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">{user.name} {user.role === 'admin' && <span className="bg-red-500 text-xs px-2 py-1 rounded text-white">مدير</span>}</h2>
            <p className="text-neutral-400">{user.role === 'admin' ? 'صلاحيات الإدارة الكاملة' : 'عضو نشط'}</p>
         </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><History className="text-blue-500" /> سجل العمليات</h3>
      {history.length === 0 ? ( <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-10 text-center text-neutral-500">لا توجد عمليات مسجلة حتى الآن.</div> ) : (
         <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
            {history.map((item, index) => (
               <div key={item.id} className={`flex items-center justify-between p-4 ${index !== history.length - 1 ? 'border-b border-neutral-800' : ''}`}>
                  <div><p className="font-bold text-white text-sm">{item.title}</p><p className="text-xs text-neutral-500 mt-1">{new Date(item.createdAt?.toDate?.() || Date.now()).toLocaleDateString('ar-EG')}</p></div>
                  <div className={`font-black flex items-center gap-1 ${item.type === 'earn' ? 'text-green-500' : item.type === 'spend' ? 'text-red-500' : 'text-neutral-400'}`}>
                     {item.amount > 0 ? '+' : ''}{item.amount !== 0 ? item.amount.toLocaleString() : '-'} <Coins size={12}/>
                  </div>
               </div>
            ))}
         </div>
      )}
    </div>
  );
};
