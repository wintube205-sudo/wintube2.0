import React, { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Loader2, Settings } from 'lucide-react';
import { getAdminData, handleAdminWithdrawal, updateGlobalSettings } from '../services/api';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const AdminView = ({ user, onSettingsUpdated }: any) => {
  const [activeAdminTab, setActiveAdminTab] = useState('dashboard');
  const [adminData, setAdminData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [newGameForm, setNewGameForm] = useState({ title: '', url: '', thumbnail: '' });
  const [settingsForm, setSettingsForm] = useState({ videoPoints: 0, gamePoints: 0, minWithdrawal: 0 });

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    getAdminData().then(res => {
      setAdminData(res);
      if (res.settings) {
        setSettingsForm({
          videoPoints: res.settings.videoPoints || 0,
          gamePoints: res.settings.gamePoints || 0,
          minWithdrawal: res.settings.minWithdrawal || 0
        });
        if (onSettingsUpdated) onSettingsUpdated(res.settings);
      }
      setLoading(false);
    }).catch(err => {
      console.error("Admin Load Error:", err);
      setError("حدث خطأ أثناء تحميل البيانات. تحقق من الصلاحيات والاتصال: " + err.message);
      setToast("خطأ في تحميل البيانات: " + err.message);
      setTimeout(() => setToast(''), 3000);
      setLoading(false);
    });
  }, [onSettingsUpdated]);

  useEffect(() => { loadData(); }, [loadData]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  
  const onUpdateSettings = async (e: any) => {
    e.preventDefault();
    try {
      await updateGlobalSettings(settingsForm);
      showToast('تم تحديث الإعدادات بنجاح');
      loadData();
    } catch (err: any) {
      showToast('خطأ: ' + err.message);
    }
  };

  const onWithdrawalAction = async (id: string, action: 'approved'|'rejected', wData: any) => { 
    await handleAdminWithdrawal(id, action, wData);
    if (action === 'approved') {
       import('../lib/firebase').then(({ addNotification }) => {
           addNotification(wData.userId, 'تم الموافقة على السحب!', `تم تحويل مبلغ $${wData.amount} بنجاح`, 'withdrawal');
       });
    }
    showToast('تم الإجراء بنجاح'); 
    loadData(); 
  };
  
  const onUserAction = async (id: string, action: 'ban'|'unban') => { 
    await updateDoc(doc(db, 'users', id), { banned: action === 'ban' });
    showToast('تم التنفيذ'); 
    loadData(); 
  };
  
  const onAddGame = async (e: any) => { 
    e.preventDefault(); 
    if (!newGameForm.title || !newGameForm.url) {
      showToast('يرجى تعبئة الحقول المطلوبة');
      return; 
    }
    try {
      await addDoc(collection(db, 'games'), { ...newGameForm, createdAt: new Date().toISOString() });
      showToast('تم الإضافة بنجاح'); 
      setNewGameForm({ title: '', url: '', thumbnail: '' }); 
      loadData();
    } catch(err: any) {
      console.error(err);
      showToast('خطأ: ' + err.message);
    }
  };

  const onDeleteGame = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه اللعبة؟')) return;
    await deleteDoc(doc(db, 'games', id));
    showToast('تم الحذف بنجاح');
    loadData();
  };

  const onToggleFeaturedGame = async (id: string, isFeatured: boolean) => {
    await updateDoc(doc(db, 'games', id), { isFeatured: !isFeatured });
    showToast('تم التحديث بنجاح');
    loadData();
  };

  const isAdminEmail = user?.email && (user.email.toLowerCase().trim() === 'iq.mh300@gmail.com' || user.email.toLowerCase().trim() === 'wintube205@gmail.com');
  const hasAccess = user?.role === 'admin' || isAdminEmail;

  if (!hasAccess) return <div className="text-center py-20 text-red-500 font-bold">مرفوض: دخول للإدارة فقط. (الإيميل الحالي: {user?.email})</div>;
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-red-500" size={40} /></div>;
  if (error) return <div className="text-center py-20 text-red-500 font-bold bg-neutral-900 border border-red-500/20 m-4 rounded-xl flex flex-col items-center gap-4">
    <p>{error}</p>
    <div className="text-sm text-neutral-400 bg-black/50 p-4 rounded-lg w-full max-w-xl text-left font-mono" dir="ltr">
      Debug Info: <br />
      Email: {user?.email} <br />
      Role: {user?.role} <br />
      UID: {user?.id}
    </div>
    <button onClick={loadData} className="px-6 py-2 bg-red-600 text-white rounded-lg">إعادة المحاولة</button>
  </div>;
  if (!adminData) return null;

  const { totalUsers, totalPointsGiven, pendingWithdrawals, withdrawals, users, games } = adminData;

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in w-full" dir="rtl">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3"><LayoutDashboard className="text-red-500" size={32} /><h2 className="text-3xl font-black text-white">لوحة الإدارة</h2></div>
        <div className="flex bg-neutral-900 rounded-xl p-1 border border-neutral-800 overflow-x-auto w-full sm:w-auto">
          <button onClick={() => setActiveAdminTab('dashboard')} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeAdminTab === 'dashboard' ? 'bg-red-600 text-white' : 'text-neutral-400'}`}>نظرة عامة</button>
          <button onClick={() => setActiveAdminTab('users')} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeAdminTab === 'users' ? 'bg-red-600 text-white' : 'text-neutral-400'}`}>المستخدمين</button>
          <button onClick={() => setActiveAdminTab('games')} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeAdminTab === 'games' ? 'bg-red-600 text-white' : 'text-neutral-400'}`}>الألعاب</button>
          <button onClick={() => setActiveAdminTab('settings')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${activeAdminTab === 'settings' ? 'bg-red-600 text-white' : 'text-neutral-400'}`}><Settings size={16}/> الإعدادات</button>
        </div>
      </div>

      {activeAdminTab === 'dashboard' && (
        <div className="animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl"><div className="text-neutral-400 mb-2">إجمالي المستخدمين</div><div className="text-3xl font-black text-white">{totalUsers}</div></div>
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl"><div className="text-neutral-400 mb-2">النقاط الموزعة</div><div className="text-3xl font-black text-amber-400">{totalPointsGiven}</div></div>
            <div className="bg-neutral-900 border border-red-900/30 p-6 rounded-2xl"><div className="text-red-400 mb-2">طلبات معلقة</div><div className="text-3xl font-black text-red-500">{pendingWithdrawals}</div></div>
          </div>
          <h3 className="text-xl font-bold text-white mb-4">طلبات السحب</h3>
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden overflow-x-auto">
            <table className="w-full text-right text-sm">
               <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800"><tr><th className="p-4">المستخدم</th><th className="p-4">الوسيلة</th><th className="p-4">المبلغ</th><th className="p-4 text-center">الإجراء</th></tr></thead>
               <tbody className="text-white">
                  {withdrawals.map((req: any) => (
                     <tr key={req.id} className="border-b border-neutral-800">
                        <td className="p-4">{req.userName}</td><td className="p-4">{req.method}</td><td className="p-4 text-green-400 font-bold">${req.amount}</td>
                        <td className="p-4 flex justify-center gap-2">
                           {req.status === 'pending' ? (
                             <><button onClick={() => onWithdrawalAction(req.id, 'approved', req)} className="bg-green-600/20 text-green-500 px-3 py-1 rounded">دفع</button><button onClick={() => onWithdrawalAction(req.id, 'rejected', req)} className="bg-red-600/20 text-red-500 px-3 py-1 rounded">رفض</button></>
                           ) : <span className="text-neutral-500">{req.status === 'approved' ? 'مدفوع' : 'مرفوض'}</span>}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
          </div>
        </div>
      )}

      {activeAdminTab === 'users' && (
        <div className="animate-in fade-in">
           <h3 className="text-xl font-bold text-white mb-4">المستخدمين</h3>
           <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden overflow-x-auto">
            <table className="w-full text-right text-sm">
               <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800"><tr><th className="p-4">الاسم</th><th className="p-4">النقاط</th><th className="p-4 text-center">الإجراء</th></tr></thead>
               <tbody className="text-white">
                  {users.map((u: any) => (
                     <tr key={u.id} className={`border-b border-neutral-800 ${u.banned ? 'opacity-50' : ''}`}>
                        <td className="p-4">{u.name}</td><td className="p-4 text-amber-400">{u.points}</td>
                        <td className="p-4 flex justify-center gap-2">
                           <button onClick={() => onUserAction(u.id, u.banned ? 'unban' : 'ban')} className={`${u.banned ? 'bg-green-600/20 text-green-500' : 'bg-red-600/20 text-red-500'} px-3 py-1 rounded`}>{u.banned ? 'فك الحظر' : 'حظر'}</button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
          </div>
        </div>
      )}

      {activeAdminTab === 'games' && (
        <div className="animate-in fade-in space-y-8">
           <div>
             <h3 className="text-xl font-bold text-white mb-4">الألعاب الحالية</h3>
             <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden overflow-x-auto">
               <table className="w-full text-right text-sm">
                 <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800">
                    <tr><th className="p-4">اللعبة</th><th className="p-4 text-center">الإجراء</th></tr>
                 </thead>
                 <tbody className="text-white">
                    {games?.map((g: any) => (
                       <tr key={g.id} className="border-b border-neutral-800">
                          <td className="p-4 flex items-center gap-3">
                            <img src={g.thumbnail} alt={g.title} className="w-10 h-10 rounded-lg object-cover bg-neutral-800" />
                            <div className="flex flex-col">
                              <span>{g.title}</span>
                              {g.isFeatured && <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full w-max mt-1">مميزة</span>}
                            </div>
                          </td>
                          <td className="p-4 flex flex-wrap justify-center gap-2">
                             <button onClick={() => onToggleFeaturedGame(g.id, !!g.isFeatured)} className={`${g.isFeatured ? 'bg-neutral-800 text-neutral-400' : 'bg-amber-600/20 text-amber-500'} hover:bg-neutral-700 transition-colors px-3 py-1 rounded`}>{g.isFeatured ? 'إلغاء التمييز' : 'تمييز كـ مميزة'}</button>
                             <button onClick={() => onDeleteGame(g.id)} className="bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white transition-colors px-3 py-1 rounded">حذف</button>
                          </td>
                       </tr>
                    ))}
                    {(!games || games.length === 0) && (
                       <tr><td colSpan={2} className="p-4 text-center text-neutral-500">لا توجد ألعاب مضافة حالياً.</td></tr>
                    )}
                 </tbody>
               </table>
             </div>
           </div>

           <div>
             <h3 className="text-xl font-bold text-white mb-4">إضافة لعبة HTML5 جديدة</h3>
             <form onSubmit={onAddGame} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" value={newGameForm.title} onChange={e => setNewGameForm({...newGameForm, title: e.target.value})} placeholder="اسم اللعبة" className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white" />
                <input type="text" value={newGameForm.url} onChange={e => {
                   let val = e.target.value;
                   const srcMatch = val.match(/src=["'](.*?)["']/);
                   if (srcMatch && srcMatch[1]) { val = srcMatch[1]; }
                   setNewGameForm({...newGameForm, url: val});
                }} placeholder="رابط اللعبة أو كود التضمين (iframe)" className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white ltr" dir="ltr" />
                <input type="text" value={newGameForm.thumbnail} onChange={e => setNewGameForm({...newGameForm, thumbnail: e.target.value})} placeholder="رابط الصورة المصغرة (Thumbnail)" className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white ltr" dir="ltr" />
                <div className="col-span-1 md:col-span-3 text-xs text-neutral-500 mb-2">يمكنك وضع "الرابط المباشر للعبة" أو لصق "كود iframe" بالكامل وسيقوم النظام باستخراج الرابط تلقائياً.</div>
                <div className="md:col-span-3"><button type="submit" className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl">إضافة اللعبة HTML5</button></div>
             </form>
           </div>
        </div>
      )}

      {activeAdminTab === 'settings' && (
        <div className="animate-in fade-in space-y-8">
           <div>
             <h3 className="text-xl font-bold text-white mb-4 italic flex items-center gap-2"><Settings className="text-red-500"/> إعدادات النظام العامة</h3>
             <form onSubmit={onUpdateSettings} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-neutral-400 text-sm font-bold block">مكافأة مشاهدة الفيديو (نقاط)</label>
                      <input 
                        type="number" 
                        value={settingsForm.videoPoints} 
                        onChange={e => setSettingsForm({...settingsForm, videoPoints: Number(e.target.value)})}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white font-bold focus:border-red-500 transition-colors" 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-neutral-400 text-sm font-bold block">مكافأة لعب الألعاب (لكل مرة - نقاط)</label>
                      <input 
                        type="number" 
                        value={settingsForm.gamePoints} 
                        onChange={e => setSettingsForm({...settingsForm, gamePoints: Number(e.target.value)})}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white font-bold focus:border-red-500 transition-colors" 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-neutral-400 text-sm font-bold block">الحد الأدنى للسحب (بالدولار $)</label>
                      <input 
                        type="number" 
                        value={settingsForm.minWithdrawal} 
                        onChange={e => setSettingsForm({...settingsForm, minWithdrawal: Number(e.target.value)})}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white font-bold focus:border-red-500 transition-colors" 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-neutral-400 text-sm font-bold block">سعر صرف الـ 1 دولار (بالنقاط)</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={adminData.settings?.pointsPerDollar || 1000} 
                          disabled
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-neutral-500 font-bold opacity-50" 
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-neutral-600 italic">ثابت حالياً عند 1000</div>
                      </div>
                   </div>
                </div>
                
                <div className="pt-4 border-t border-neutral-800 flex justify-end">
                   <button type="submit" className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black py-4 px-12 rounded-2xl shadow-xl shadow-red-600/10 transition-all transform active:scale-95">حفظ التغييرات</button>
                </div>
             </form>
             <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
                💡 تغيير هذه القيم سيؤثر فوراً على جميع المستخدمين في الصفحة الرئيسية والمهام.
             </div>
           </div>
        </div>
      )}

      {toast && <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full font-bold text-sm bg-green-600 text-white z-50">{toast}</div>}
    </div>
  );
};
