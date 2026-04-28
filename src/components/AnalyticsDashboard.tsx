import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { MousePointerClick, LogOut, Loader2, RefreshCw } from 'lucide-react';

export const AnalyticsDashboard = () => {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(query(collection(db, 'analytics'), orderBy('createdAt', 'desc'), limit(100)));
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEvents(data);
        } catch(e) {
            console.error('Failed to load analytics', e);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadAnalytics();
    }, []);

    const clickEvents = events.filter(e => e.type === 'clicks').flatMap(e => {
        try {
            return JSON.parse(e.data);
        } catch {
            return [];
        }
    });

    const exitEvents = events.filter(e => e.type === 'exit');

    // Group exits by path
    const exitCounts = exitEvents.reduce((acc, ev) => {
        const path = ev.path || 'unknown';
        acc[path] = (acc[path] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="space-y-8 animate-in fade-in">
            <div className="flex items-center justify-between">
               <h3 className="text-xl font-bold text-white">تحليل المستخدمين و Heatmap</h3>
               <button onClick={loadAnalytics} className="bg-neutral-800 text-white p-2 rounded-lg hover:bg-neutral-700 transition-colors">
                   <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl">
                   <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><LogOut className="text-red-500" size={20}/> أماكن خروج المستخدمين</h4>
                   {loading ? <Loader2 className="animate-spin text-neutral-500 mx-auto py-10" /> : (
                       Object.keys(exitCounts).length > 0 ? (
                           <div className="space-y-3">
                               {Object.entries(exitCounts).sort((a,b) => (b[1] as number) - (a[1] as number)).map(([path, count]) => (
                                   <div key={path} className="flex justify-between items-center bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                                       <span className="text-neutral-300 font-mono text-sm">{path}</span>
                                       <span className="bg-red-500/20 text-red-500 px-3 py-1 rounded-lg text-sm font-bold">{count} خروج</span>
                                   </div>
                               ))}
                           </div>
                       ) : (
                           <div className="text-center text-neutral-500 py-10">لا توجد بيانات خروج بعد</div>
                       )
                   )}
               </div>

               <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl">
                   <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><MousePointerClick className="text-blue-500" size={20}/> إحصائيات النقرات (Heatmap Data)</h4>
                   <p className="text-neutral-400 text-sm mb-4">تم تسجيل {clickEvents.length} نقرة للمستخدمين مؤخراً.</p>
                   {loading ? <Loader2 className="animate-spin text-neutral-500 mx-auto py-10" /> : (
                       <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl max-h-[300px] overflow-y-auto">
                           {clickEvents.length > 0 ? clickEvents.slice(0, 50).map((c: any, i: number) => (
                               <div key={i} className="text-xs text-neutral-500 flex justify-between border-b border-neutral-900 py-2">
                                  <span>{c.path}</span>
                                  <span className="font-mono">X: {c.x}, Y: {c.y}</span>
                               </div>
                           )) : <div className="text-center text-neutral-500 py-10">لا توجد سجلات نقرات</div>}
                       </div>
                   )}
               </div>
            </div>
        </div>
    );
};
