import React, { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Loader2, Settings, Bell } from 'lucide-react';
import { getAdminData, handleAdminWithdrawal, updateGlobalSettings } from '../services/api';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';

export const AdminView = ({ user, onSettingsUpdated }: any) => {
  const [activeAdminTab, setActiveAdminTab] = useState('dashboard');
  const [adminData, setAdminData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [newGameForm, setNewGameForm] = useState({ title: '', url: '', thumbnail: '' });
  const [settingsForm, setSettingsForm] = useState<any>({ 
    videoPoints: 0, gamePoints: 0, minWithdrawal: 0, pointsPerDollar: 1000,
    taskRewardLogin: 0, taskTargetVideos: 0, taskRewardVideos: 0, taskTargetGames: 0, taskRewardGames: 0,
    eventMode: false
  });

  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newApiName, setNewApiName] = useState('');
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [platformRatings, setPlatformRatings] = useState<any[]>([]);
  const [vipRequests, setVipRequests] = useState<any[]>([]);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    getAdminData().then(res => {
      setAdminData(res);
      if (res.settings) {
        setSettingsForm({
          videoPoints: res.settings.videoPoints || 0,
          gamePoints: res.settings.gamePoints || 0,
          minWithdrawal: res.settings.minWithdrawal || 0,
          pointsPerDollar: res.settings.pointsPerDollar || 1000,
          taskRewardLogin: res.settings.taskRewardLogin || 0,
          taskTargetVideos: res.settings.taskTargetVideos || 0,
          taskRewardVideos: res.settings.taskRewardVideos || 0,
          taskTargetGames: res.settings.taskTargetGames || 0,
          taskRewardGames: res.settings.taskRewardGames || 0,
          eventMode: res.settings.eventMode || false
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

    // Load API Keys
    import('firebase/firestore').then(({ collection, getDocs }) => {
      getDocs(collection(db, 'api_keys')).then(snap => {
         setApiKeys(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }).catch(e => console.error("Could not load API keys", e));
      
      getDocs(collection(db, 'support_tickets')).then(snap => {
         const tickets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
         // Sort by created at mostly
         tickets.sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
         setSupportTickets(tickets);
      }).catch(e => console.error("Could not load Support Tickets", e));
      
      getDocs(collection(db, 'platform_ratings')).then(snap => {
         const ratings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
         ratings.sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
         setPlatformRatings(ratings);
      }).catch(e => console.error("Could not load Platform Ratings", e));

      getDocs(collection(db, 'vip_requests')).then(snap => {
         const requests = snap.docs.map(d => ({ id: d.id, ...d.data() }));
         requests.sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
         setVipRequests(requests);
      }).catch(e => console.error("Could not load VIP requests", e));
    });
  }, [onSettingsUpdated]);

  const createApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApiName.trim()) return;
    try {
      const { setDoc, doc } = await import('firebase/firestore');
      const newId = 'wt_dev_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      const newDoc = {
        name: newApiName,
        active: true,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'api_keys', newId), newDoc);
      setApiKeys([...apiKeys, { id: newId, ...newDoc }]);
      setNewApiName('');
      showToast('تم توليد مفتاح جديد بنجاح');
    } catch(err: any) {
      showToast('خطأ: ' + err.message);
    }
  };

  const toggleApiKey = async (id: string, currentStatus: boolean) => {
     try {
       const { updateDoc, doc } = await import('firebase/firestore');
       await updateDoc(doc(db, 'api_keys', id), { active: !currentStatus });
       setApiKeys(apiKeys.map(k => k.id === id ? { ...k, active: !currentStatus } : k));
     } catch(err: any) {
       showToast('خطأ: ' + err.message);
     }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
      try {
          const { updateDoc, doc } = await import('firebase/firestore');
          await updateDoc(doc(db, 'support_tickets', ticketId), { status });
          setSupportTickets(supportTickets.map(t => t.id === ticketId ? { ...t, status } : t));
          showToast('تم تحديث حالة التذكرة');
      } catch (e: any) {
          showToast('خطأ: ' + e.message);
      }
  };

  const handleVipRequest = async (requestId: string, userId: string, action: 'approved' | 'rejected') => {
      try {
          const { updateDoc, doc, serverTimestamp } = await import('firebase/firestore');
          const batch: any[] = [];
          
          if (action === 'approved') {
              // 10 years (Permanent)
              const exp = new Date();
              exp.setFullYear(exp.getFullYear() + 10);
              
              await updateDoc(doc(db, 'users', userId), {
                  isVIP: true,
                  vipExpiration: exp
              });
              
              const { addNotification } = await import('../lib/firebase');
              await addNotification(userId, 'تم تفعيل الـ VIP! 👑', 'مبروك! تم تفعيل اشتراكك الـ VIP الدائم بنجاح. استمتع بمضاعفة الأرباح!', 'reward');
          }

          await updateDoc(doc(db, 'vip_requests', requestId), { status: action });
          setVipRequests(vipRequests.map(r => r.id === requestId ? { ...r, status: action } : r));
          showToast(action === 'approved' ? 'تم تفعيل الـ VIP للمستخدم' : 'تم رفض الطلب');
      } catch (e: any) {
          showToast('خطأ: ' + e.message);
      }
  };

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
          <button onClick={() => setActiveAdminTab('notifications')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${activeAdminTab === 'notifications' ? 'bg-red-600 text-white' : 'text-neutral-400'}`}><Bell size={16}/> الإشعارات</button>
          <button onClick={() => setActiveAdminTab('analytics')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${activeAdminTab === 'analytics' ? 'bg-red-600 text-white' : 'text-neutral-400'}`}>التحليلات</button>
          <button onClick={() => setActiveAdminTab('api_keys')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${activeAdminTab === 'api_keys' ? 'bg-red-600 text-white' : 'text-neutral-400'}`}>منصة API</button>
          <button onClick={() => setActiveAdminTab('support_tickets')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${activeAdminTab === 'support_tickets' ? 'bg-red-600 text-white' : 'text-neutral-400'}`}>الدعم الفني</button>
        </div>
      </div>

      {activeAdminTab === 'analytics' && <AnalyticsDashboard />}

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
               <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800">
                 <tr>
                   <th className="p-4">المستخدم</th>
                   <th className="p-4">الوسيلة</th>
                   <th className="p-4">رقم الحساب</th>
                   <th className="p-4">المبلغ</th>
                   <th className="p-4 text-center">الإجراء</th>
                 </tr>
               </thead>
               <tbody className="text-white">
                  {withdrawals.map((req: any) => (
                     <tr key={req.id} className="border-b border-neutral-800">
                        <td className="p-4">{req.userName}</td>
                        <td className="p-4">{req.method}</td>
                        <td className="p-4 font-mono text-xs">{req.account || 'غير محدد'}</td>
                        <td className="p-4 text-green-400 font-bold">${req.amount?.toFixed?.(2) || req.amount}</td>
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
                        onChange={e => setSettingsForm({...settingsForm, videoPoints: e.target.value === '' ? '' : Number(e.target.value)})}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white font-bold focus:border-red-500 transition-colors" 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-neutral-400 text-sm font-bold block">مكافأة لعب الألعاب (لكل مرة - نقاط)</label>
                      <input 
                        type="number" 
                        value={settingsForm.gamePoints} 
                        onChange={e => setSettingsForm({...settingsForm, gamePoints: e.target.value === '' ? '' : Number(e.target.value)})}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white font-bold focus:border-red-500 transition-colors" 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-neutral-400 text-sm font-bold block">الحد الأدنى للسحب (بالدولار $)</label>
                      <input 
                        type="number" 
                        value={settingsForm.minWithdrawal} 
                        onChange={e => setSettingsForm({...settingsForm, minWithdrawal: e.target.value === '' ? '' : Number(e.target.value)})}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white font-bold focus:border-red-500 transition-colors" 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-neutral-400 text-sm font-bold block">سعر صرف الـ 1 دولار (بالنقاط)</label>
                      <input 
                        type="number" 
                        value={settingsForm.pointsPerDollar} 
                        onChange={e => setSettingsForm({...settingsForm, pointsPerDollar: e.target.value === '' ? '' : Number(e.target.value)})}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white font-bold focus:border-red-500 transition-colors" 
                      />
                      <div className="text-xs text-neutral-500 italic mt-1">مثال: لو وضعت 10,000 فهذا يعني كل 10 آلاف نقطة = 1 دولار</div>
                   </div>
                </div>
                
                 <div className="mt-8 flex items-center p-4 bg-neutral-950 border border-neutral-800 rounded-xl gap-4">
                    <input 
                       type="checkbox" 
                       id="eventModeToggle"
                       checked={settingsForm.eventMode || false}
                       onChange={e => setSettingsForm({...settingsForm, eventMode: e.target.checked})}
                       className="w-6 h-6 rounded bg-neutral-900 border-neutral-700 text-red-500 focus:ring-red-500"
                    />
                    <div>
                       <label htmlFor="eventModeToggle" className="text-white font-bold text-lg select-none cursor-pointer block">تفعيل مهرجان النقاط (Event Mode 2X)</label>
                       <p className="text-neutral-500 text-sm mt-1">عند تفعيله ستتضاعف نقاط الفيديوهات والألعاب بشكل فوري.</p>
                    </div>
                 </div>

               <h3 className="text-xl font-bold text-white mb-4 italic flex items-center gap-2 mt-8 border-t border-neutral-800 pt-8"><Settings className="text-red-500"/> إعدادات المهام اليومية</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                      <label className="text-neutral-400 text-sm font-bold block">مكافأة تسجيل الدخول اليومي</label>
                      <input 
                        type="number" 
                        value={settingsForm.taskRewardLogin} 
                        onChange={e => setSettingsForm({...settingsForm, taskRewardLogin: e.target.value === '' ? '' : Number(e.target.value)})}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white font-bold focus:border-red-500 transition-colors" 
                      />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                  <div className="space-y-2 border border-neutral-800 p-4 rounded-xl relative">
                      <div className="absolute top-0 right-4 -translate-y-1/2 bg-neutral-900 px-2 text-sm font-bold text-red-400">مهمة الفيديوهات</div>
                      <label className="text-neutral-400 text-sm font-bold block">العدد المطلوب</label>
                      <input 
                        type="number" 
                        value={settingsForm.taskTargetVideos} 
                        onChange={e => setSettingsForm({...settingsForm, taskTargetVideos: e.target.value === '' ? '' : Number(e.target.value)})}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white font-bold focus:border-red-500 transition-colors mb-3" 
                      />
                      <label className="text-neutral-400 text-sm font-bold block">المكافأة (نقاط)</label>
                      <input 
                        type="number" 
                        value={settingsForm.taskRewardVideos} 
                        onChange={e => setSettingsForm({...settingsForm, taskRewardVideos: e.target.value === '' ? '' : Number(e.target.value)})}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white font-bold focus:border-red-500 transition-colors" 
                      />
                  </div>
                  
                  <div className="space-y-2 border border-neutral-800 p-4 rounded-xl relative">
                      <div className="absolute top-0 right-4 -translate-y-1/2 bg-neutral-900 px-2 text-sm font-bold text-blue-400">مهمة الألعاب</div>
                      <label className="text-neutral-400 text-sm font-bold block">العدد المطلوب</label>
                      <input 
                        type="number" 
                        value={settingsForm.taskTargetGames} 
                        onChange={e => setSettingsForm({...settingsForm, taskTargetGames: e.target.value === '' ? '' : Number(e.target.value)})}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white font-bold focus:border-red-500 transition-colors mb-3" 
                      />
                      <label className="text-neutral-400 text-sm font-bold block">المكافأة (نقاط)</label>
                      <input 
                        type="number" 
                        value={settingsForm.taskRewardGames} 
                        onChange={e => setSettingsForm({...settingsForm, taskRewardGames: e.target.value === '' ? '' : Number(e.target.value)})}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white font-bold focus:border-red-500 transition-colors" 
                      />
                  </div>
               </div>
                
                <div className="pt-4 border-t border-neutral-800 flex flex-col sm:flex-row gap-4 justify-between items-center mt-8">
                   <button type="submit" className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black py-4 px-12 rounded-2xl shadow-xl shadow-red-600/10 transition-all transform active:scale-95">حفظ التغييرات</button>
                </div>
             </form>
             <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
                💡 تغيير هذه القيم سيؤثر فوراً على جميع المستخدمين في الصفحة الرئيسية والمهام.
             </div>
           </div>
        </div>
      )}

      {activeAdminTab === 'notifications' && (
         <div className="animate-in fade-in">
           <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
             <h3 className="text-xl font-bold text-white mb-6 relative z-10 flex items-center gap-2"><Bell className="text-blue-500" /> إرسال إشعارات جماعية</h3>
             <form onSubmit={async (e) => {
               e.preventDefault();
               try {
                 const { sendGlobalNotification } = await import('../lib/firebase');
                 // @ts-ignore
                 const title = e.target.elements.title.value;
                 // @ts-ignore
                 const message = e.target.elements.message.value;
                 // @ts-ignore
                 const type = e.target.elements.type.value;
                 if (!title || !message) return showToast('يرجى ملء جميع الحقول');
                 await sendGlobalNotification(title, message, type);
                 showToast('تم إرسال الإشعار للجميع بنجاح');
                 // @ts-ignore
                 e.target.reset();
               } catch (err: any) {
                 showToast('خطأ: ' + err.message);
               }
             }} className="relative z-10 space-y-6">
               <div className="space-y-4">
                 <div>
                   <label className="text-neutral-400 text-sm font-bold block mb-2">عنوان الإشعار</label>
                   <input required name="title" type="text" placeholder="مثال: توفر مهام جديدة! 🚀" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white focus:border-blue-500 transition-colors" />
                 </div>
                 <div>
                   <label className="text-neutral-400 text-sm font-bold block mb-2">تفاصيل الإشعار</label>
                   <textarea required name="message" rows={3} placeholder="اكتب رسالتك للمستخدمين..." className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white focus:border-blue-500 transition-colors" />
                 </div>
                 <div>
                   <label className="text-neutral-400 text-sm font-bold block mb-2">نوع الإشعار</label>
                   <select name="type" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white focus:border-blue-500 transition-colors">
                     <option value="system">نظام (مهام، تحديثات، أخبار)</option>
                     <option value="reward">مكافأة (أحداث، نقاط مضاعفة)</option>
                   </select>
                 </div>
               </div>
               <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all">إرسال الإشعار الآن</button>
             </form>
             <div className="mt-6 flex flex-wrap gap-2">
                 <button onClick={() => {
                    const form: any = document.querySelector('form');
                    form.elements.title.value = "توفر مهام عروض جديدة! 💸";
                    form.elements.message.value = "تمت إضافة عروض استبيانات وتطبيقات جديدة! ادخل الآن قسم العروض وابدأ الربح.";
                    form.elements.type.value = "system";
                 }} className="bg-neutral-800 text-neutral-300 text-xs px-3 py-1.5 rounded-lg border border-neutral-700 hover:text-white">نموذج: مهام جديدة</button>
                 <button onClick={() => {
                    const form: any = document.querySelector('form');
                    form.elements.title.value = "انتهى حدث النقاط المضاعفة ⏳";
                    form.elements.message.value = "شكراً لمشاركتك في مهرجان النقاط المضاعفة! انتظرونا في فعاليات قادمة.";
                    form.elements.type.value = "system";
                 }} className="bg-neutral-800 text-neutral-300 text-xs px-3 py-1.5 rounded-lg border border-neutral-700 hover:text-white">نموذج: انتهاء حدث</button>
             </div>
           </div>
         </div>
      )}

      {activeAdminTab === 'api_keys' && (
         <div className="animate-in fade-in space-y-8">
           <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8">
             <h3 className="text-xl font-bold text-white mb-6">مولد مفاتيح API</h3>
             <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
                استخدم هذه الواجهة لتوليد مفاتيح API تسمح بربط منصة WinTube مع تطبيقات الهواتف أو المواقع الأخرى (B2B). 
                باستخدام هذه المفاتيح، يمكن للمنصات الخارجية جلب معلومات المستخدم وقراءة الرصيد وإضافته.
             </p>
             <form onSubmit={createApiKey} className="flex flex-col md:flex-row gap-4 mb-8">
                <input required type="text" value={newApiName} onChange={e => setNewApiName(e.target.value)} placeholder="اسم التطبيق او المنصة (مثال: WinTube Mobile IOS)" className="flex-1 bg-neutral-950 border border-neutral-800 p-4 rounded-xl text-white focus:border-red-500" />
                <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-xl shrink-0">إنشاء مفتاح جديد</button>
             </form>
             
             <div className="overflow-x-auto">
               <table className="w-full text-right text-sm">
                 <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800">
                    <tr><th className="p-4">اسم المنصة</th><th className="p-4">مفتاح API</th><th className="p-4">تاريخ الإنشاء</th><th className="p-4 text-center">الحالة</th></tr>
                 </thead>
                 <tbody className="text-white">
                    {apiKeys.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-neutral-500">لا توجد مفاتيح</td></tr> : apiKeys.map((key) => (
                       <tr key={key.id} className={`border-b border-neutral-800 ${!key.active ? 'opacity-50' : ''}`}>
                          <td className="p-4 font-bold">{key.name}</td>
                          <td className="p-4 font-mono text-xs text-amber-400 select-all">{key.id}</td>
                          <td className="p-4 text-neutral-500">{new Date(key.createdAt).toLocaleDateString('ar-EG')}</td>
                          <td className="p-4 flex justify-center">
                             <button onClick={() => toggleApiKey(key.id, key.active)} className={`px-4 py-1.5 rounded-full text-xs font-bold ${key.active ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-green-500/20 text-green-500 border border-green-500/50'}`}>
                                {key.active ? 'إيقاف' : 'تفعيل'}
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
               </table>
             </div>
           </div>
           
           <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8">
              <h3 className="text-xl font-bold text-white mb-6">توثيق الواجهة البرمجية (API Documentation)</h3>
              <div className="space-y-4 font-mono text-sm" dir="ltr" style={{ textAlign: 'left' }}>
                  <div className="bg-neutral-950 p-4 border border-neutral-800 rounded-lg">
                     <span className="text-blue-400 font-bold">GET</span> /api/v1/users/:id
                     <p className="text-neutral-500 mt-2 text-xs">Headers: X-API-Key: your_key</p>
                  </div>
                  <div className="bg-neutral-950 p-4 border border-neutral-800 rounded-lg">
                     <span className="text-green-400 font-bold">POST</span> /api/v1/users/:id/points
                     <p className="text-neutral-500 mt-2 text-xs">Headers: X-API-Key: your_key</p>
                     <p className="text-neutral-500 mt-1 text-xs">Body: {`{ "amount": 100, "reason": "Watched ad", "type": "earn" }`}</p>
                  </div>
                  <div className="bg-neutral-950 p-4 border border-neutral-800 rounded-lg">
                     <span className="text-blue-400 font-bold">GET</span> /api/v1/content?type=game
                     <p className="text-neutral-500 mt-2 text-xs">Headers: X-API-Key: your_key</p>
                  </div>
              </div>
           </div>
         </div>
      )}

      {activeAdminTab === 'support_tickets' && (
         <div className="animate-in fade-in space-y-8">
           <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8">
             <h3 className="text-xl font-bold text-white mb-6">تذاكر الدعم الفني</h3>
             <div className="space-y-4">
                 {supportTickets.length === 0 ? (
                     <div className="text-center text-neutral-500 py-10 font-bold border border-dashed border-neutral-800 rounded-2xl">
                         لا توجد تذاكر دعم فني حالياً
                     </div>
                 ) : supportTickets.map(ticket => (
                     <div key={ticket.id} className="bg-neutral-950 border border-neutral-800 p-6 rounded-2xl">
                         <div className="flex justify-between items-start mb-4">
                             <div>
                                 <h4 className="text-lg font-bold text-white mb-1">{ticket.subject}</h4>
                                 <p className="text-sm text-neutral-400">بواسطة: {ticket.userName} ({ticket.userEmail})</p>
                                 <p className="text-xs text-neutral-500 mt-1">{new Date(ticket.createdAt?.toMillis?.() || Date.now()).toLocaleString('ar-EG')}</p>
                             </div>
                             <span className={`px-3 py-1 rounded-full text-xs font-bold ${ticket.status === 'open' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/50' : 'bg-neutral-800 text-neutral-400'}`}>
                                 {ticket.status === 'open' ? 'مفتوحة' : 'مغلقة'}
                             </span>
                         </div>
                         <div className="bg-neutral-900 p-4 rounded-xl text-neutral-300 mb-4 whitespace-pre-wrap">
                             {ticket.message}
                         </div>
                         <div className="flex gap-2">
                             {ticket.status === 'open' ? (
                                 <button onClick={() => updateTicketStatus(ticket.id, 'closed')} className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">إغلاق التذكرة</button>
                             ) : (
                                 <button onClick={() => updateTicketStatus(ticket.id, 'open')} className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">إعادة فتح</button>
                             )}
                             <a href={`mailto:${ticket.userEmail}?subject=Re: ${ticket.subject}`} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                                رد عبر الإيميل
                             </a>
                         </div>
                     </div>
                 ))}
             </div>
           </div>

           <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8">
             <div className="flex items-center gap-2 mb-6">
                 <h3 className="text-xl font-bold text-white">تقييمات المنصة</h3>
                 <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-sm font-bold border border-amber-500/20">{platformRatings.length} تقييم</span>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {platformRatings.length === 0 ? (
                      <div className="text-center text-neutral-500 py-10 font-bold border border-dashed border-neutral-800 rounded-2xl col-span-2">
                          لا توجد تقييمات حالياً
                      </div>
                 ) : platformRatings.map(rating => (
                     <div key={rating.id} className="bg-neutral-950 border border-neutral-800 p-6 rounded-2xl flex flex-col justify-between">
                         <div>
                             <div className="flex justify-between items-start mb-3">
                                 <div>
                                     <h4 className="font-bold text-white mb-1">{rating.userName}</h4>
                                     <p className="text-xs text-neutral-500">{new Date(rating.createdAt?.toMillis?.() || Date.now()).toLocaleDateString('ar-EG')}</p>
                                 </div>
                                 <div className="flex text-amber-500">
                                     {Array.from({ length: 5 }).map((_, i) => (
                                         <svg key={i} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={i < rating.rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={i < rating.rating ? "text-amber-500" : "text-neutral-700"}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                     ))}
                                 </div>
                             </div>
                             {rating.message && (
                                 <p className="text-sm text-neutral-300 italic bg-neutral-900 p-3 rounded-lg border border-neutral-800/50">"{rating.message}"</p>
                             )}
                         </div>
                     </div>
                 ))}
             </div>
           </div>
         </div>
      )}

      {activeAdminTab === 'vip_requests' && (
         <div className="animate-in fade-in space-y-8">
           <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8">
             <h3 className="text-xl font-bold text-white mb-6">طلبات ترقية VIP ($19)</h3>
             <div className="space-y-4">
                 {vipRequests.length === 0 ? (
                     <div className="text-center text-neutral-500 py-10 font-bold border border-dashed border-neutral-800 rounded-2xl">
                         لا توجد طلبات VIP حالياً
                     </div>
                 ) : vipRequests.map(req => (
                     <div key={req.id} className="bg-neutral-950 border border-neutral-800 p-6 rounded-2xl">
                         <div className="flex justify-between items-start mb-4">
                             <div>
                                 <h4 className="text-lg font-bold text-white mb-1">{req.userName}</h4>
                                 <p className="text-sm text-neutral-400">الوسيلة: <span className="text-amber-500 font-bold">{req.method}</span></p>
                                 <p className="text-xs text-neutral-500 mt-1">{new Date(req.createdAt?.toMillis?.() || Date.now()).toLocaleString('ar-EG')}</p>
                             </div>
                             <span className={`px-3 py-1 rounded-full text-xs font-bold ${req.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/50' : req.status === 'approved' ? 'bg-green-500/10 text-green-500 border border-green-500/50' : 'bg-red-500/10 text-red-500'}`}>
                                 {req.status === 'pending' ? 'قيد المراجعة' : req.status === 'approved' ? 'تم التفعيل' : 'مرفوض'}
                             </span>
                         </div>
                         <div className="bg-neutral-900 p-4 rounded-xl mb-4">
                             <div className="text-xs text-neutral-500 mb-1">رقم العملية / تفاصيل التحويل:</div>
                             <div className="text-white font-mono break-all">{req.transactionId}</div>
                         </div>
                         {req.status === 'pending' && (
                             <div className="flex gap-2">
                                 <button onClick={() => handleVipRequest(req.id, req.userId, 'approved')} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors">تفعيل VIP</button>
                                 <button onClick={() => handleVipRequest(req.id, req.userId, 'rejected')} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors">رفض الطلب</button>
                             </div>
                         )}
                     </div>
                 ))}
             </div>
           </div>
         </div>
      )}

      {toast && <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full font-bold text-sm bg-green-600 text-white z-50">{toast}</div>}
    </div>
  );
};
