import React, { useState, useEffect } from 'react';
import { getRecentProofs } from '../services/api';
import { Loader2, ShieldCheck, CheckCircle2, BadgeCheck } from 'lucide-react';

export const ProofsView = () => {
    const [proofs, setProofs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getRecentProofs().then(data => {
            setProofs(data);
            setLoading(false);
        });
    }, []);

    const maskName = (name: string) => {
        if (!name || name === 'مستخدم') return 'مستخدم ***';
        if (name.length <= 3) return name + '***';
        return name.substring(0, 3) + '***';
    };

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in w-full pb-20" dir="rtl">
            <div className="flex items-center gap-3 mb-8 justify-center">
                <BadgeCheck className="text-green-500" size={36} />
                <h2 className="text-3xl font-black text-white">إثباتات السحب</h2>
            </div>
            
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8">
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl mb-6 text-sm font-bold flex items-center justify-center gap-2">
                    <ShieldCheck size={20} />
                    جميع الإثباتات المعروضة هنا هي سحوبات حقيقية لمستخدمي المنصة وتم دفعها بنجاح.
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1,2,3,4,5,6].map(i => (
                            <div key={i} className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl flex justify-between items-center animate-pulse">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800"></div>
                                    <div className="space-y-2">
                                        <div className="w-20 h-4 bg-neutral-800 rounded"></div>
                                        <div className="w-16 h-3 bg-neutral-900 rounded"></div>
                                    </div>
                                </div>
                                <div className="space-y-2 text-left">
                                    <div className="w-16 h-3 bg-neutral-800 rounded ml-auto"></div>
                                    <div className="w-20 h-3 bg-neutral-900 rounded ml-auto"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : proofs.length === 0 ? (
                    <div className="text-center py-20 text-neutral-500 font-bold border border-dashed border-neutral-800 rounded-2xl">
                        لا توجد سحوبات مكتملة حتى الآن. كن أنت الأول!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {proofs.map(p => (
                            <div key={p.id} className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl flex justify-between items-center hover:border-green-500/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center text-green-500 border border-green-500/20 font-bold">
                                        $<br/>{p.amount}
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold">{maskName(p.userName)}</h4>
                                        <p className="text-neutral-500 text-xs mt-1">{p.method}</p>
                                    </div>
                                </div>
                                <div className="text-left">
                                     <div className="text-green-400 text-xs font-bold flex items-center justify-end gap-1 mb-1">
                                         <CheckCircle2 size={12} /> تم الدفع
                                     </div>
                                     <div className="text-neutral-600 text-xs font-mono">
                                         {new Date(p.createdAt?.toMillis?.() || Date.now()).toLocaleDateString('ar-EG')}
                                     </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
