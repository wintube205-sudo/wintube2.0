import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, doc, setDoc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Link as LinkIcon, Plus, Trash2, Edit2, Loader2, Save, X } from 'lucide-react';

export const AdminShortLinks = () => {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customId, setCustomId] = useState('');
  
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [reward, setReward] = useState<number>(50);
  const [maxClicks, setMaxClicks] = useState<number>(1000);

  const loadLinks = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'short_links'));
      const snapshot = await getDocs(q);
      const data: any[] = [];
      snapshot.forEach(d => data.push({ id: d.id, ...d.data() }));
      setLinks(data.sort((a,b) => b.reward - a.reward));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  const handleSave = async () => {
    if (!title || !url || reward <= 0) return alert('يرجى تعبئة جميع الحقول بشكل صحيح');
    try {
      let finalId = editingId;
      if (editingId) {
        await updateDoc(doc(db, 'short_links', editingId), {
          title, url, reward, maxClicks
        });
      } else {
        const newId = customId.trim() !== '' ? customId.trim() : `link_${Date.now()}`;
        finalId = newId;
        await setDoc(doc(db, 'short_links', newId), {
          title, url, reward, maxClicks, clicks: 0, createdAt: serverTimestamp()
        });
      }
      resetForm();
      loadLinks();
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const handleEdit = (link: any) => {
    setEditingId(link.id);
    setTitle(link.title);
    setUrl(link.url);
    setReward(link.reward);
    setMaxClicks(link.maxClicks);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الرابط؟')) return;
    try {
      await deleteDoc(doc(db, 'short_links', id));
      loadLinks();
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setCustomId('');
    setTitle('');
    setUrl('');
    setReward(50);
    setMaxClicks(1000);
  };

  const myUrl = window.location.origin;
  const dummyId = `link_${Date.now()}`;

  return (
    <div className="space-y-6">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">
          كيفية إعداد روابط التخطي بشكل صحيح
        </h3>
        <p className="text-neutral-400 mb-2">
          للحصول على أفضل نتيجة، قم بإنشاء الرابط في موقع اختصار الروابط (مثل Exe.io)، واجعل <b>رابط الوجهة (Destination URL)</b> يشير إلى موقعك كالتالي:
        </p>
        <div className="bg-black/50 p-3 rounded border border-neutral-800 text-blue-400 text-left mb-2" dir="ltr">
          {myUrl}/?verify_link=<b>[LINK_ID]</b>
        </div>
        <p className="text-neutral-400 text-sm">
          بهذه الطريقة، عندما يتخطى المستخدم الرابط، سيعود تلقائياً لهذا الموقع، وسيتم منحه النقاط الخاصة بهذا الرابط.
          ثم انسخ الرابط المختصر الذي أعطاك إياه موقع الاختصار، وضعه في خانة "الرابط المختصر" بالأسفل.
        </p>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          {editingId ? <Edit2 size={20} /> : <Plus size={20} />}
          {editingId ? 'تعديل الرابط' : 'إضافة رابط جديد'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-neutral-400 mb-1">معرف الرابط (اختياري - سيكون جزء من رابط الوجهة)</label>
            <input type="text" value={editingId || customId} onChange={e => !editingId && setCustomId(e.target.value)} disabled={!!editingId} placeholder="مثال: task1 (أو اتركه لتوليد تلقائي)" className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none text-left disabled:opacity-50 disabled:cursor-not-allowed" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1">عنوان الرابط (يظهر للمستخدم)</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: الرابط الذهبي الأول" className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-neutral-400 mb-1">الرابط المختصر (Short URL من موقع الاختصار)</label>
            <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://exe.io/..." className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none text-left" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1">عدد النقاط للرابط</label>
            <input type="number" value={reward} onChange={e => setReward(Number(e.target.value))} className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1">الحد الأقصى للنقرات الإجمالية</label>
            <input type="number" value={maxClicks} onChange={e => setMaxClicks(Number(e.target.value))} className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none" />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2">
            <Save size={18} /> {editingId ? 'حفظ التعديلات' : 'إضافة الرابط'}
          </button>
          {editingId && (
            <button onClick={resetForm} className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2">
              <X size={18} /> إلغاء
            </button>
          )}
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">الروابط الحالية</h2>
        {loading ? (
          <div className="flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>
        ) : links.length === 0 ? (
          <p className="text-neutral-500 text-center py-4">لا توجد روابط مضافة حالياً.</p>
        ) : (
          <div className="space-y-3">
            {links.map((li: any) => (
              <div key={li.id} className="bg-black border border-neutral-800 p-4 rounded-xl flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <LinkIcon size={16} className="text-blue-500" /> {li.title}
                    </h4>
                    <p className="text-neutral-500 text-sm mt-1 truncate max-w-md" dir="ltr" title={li.url}>{li.url}</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      ID: <span className="text-blue-400 pr-2 font-mono" dir="ltr">{li.id}</span> | النقاط: <span className="text-amber-500 font-bold">{li.reward}</span> | الزيارات: {li.clicks || 0}/{li.maxClicks}
                    </p>
                  </div>
                  <div className="flex gap-2 self-end sm:self-start">
                    <button onClick={() => handleEdit(li)} className="p-2 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 rounded-lg transition-colors" title="تعديل">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(li.id)} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors" title="حذف">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-neutral-800">
                   <label className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1 block">رابط الوجهة (ضعه في موقع الاختصار):</label>
                   <div className="flex items-center gap-2 bg-black/50 p-2 rounded-lg border border-neutral-800">
                      <code className="text-xs text-blue-400 flex-1 truncate font-mono" dir="ltr">{myUrl}/?verify_link={li.id}</code>
                      <button 
                        onClick={() => {
                          const destUrl = `${myUrl}/?verify_link=${li.id}`;
                          navigator.clipboard.writeText(destUrl);
                          alert('تم نسخ رابط الوجهة بنجاح!\nقم بوضعه في "Destination URL" بموقع الاختصار.');
                        }}
                        className="text-[10px] bg-neutral-800 hover:bg-neutral-700 text-white px-2 py-1 rounded transition-colors"
                      >
                        نسخ الرابط
                      </button>
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
