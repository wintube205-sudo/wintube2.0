import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, doc, setDoc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Link as LinkIcon, Plus, Trash2, Edit2, Loader2, Save, X, Image as ImageIcon } from 'lucide-react';

export const AdminPTC = () => {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [reward, setReward] = useState<number>(5);
  const [duration, setDuration] = useState<number>(15);
  const [maxClicks, setMaxClicks] = useState<number>(1000);

  const loadAds = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'ptc_ads'));
      const snapshot = await getDocs(q);
      const data: any[] = [];
      snapshot.forEach(d => data.push({ id: d.id, ...d.data() }));
      setAds(data.sort((a,b) => b.reward - a.reward));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAds();
  }, []);

  const handleSave = async () => {
    if (!title || !url || !thumbnail || reward <= 0 || duration <= 0) return alert('يرجى تعبئة جميع الحقول بشكل صحيح');
    try {
      if (editingId) {
        await updateDoc(doc(db, 'ptc_ads', editingId), {
          title, url, thumbnail, reward, duration, maxClicks
        });
      } else {
        const newId = `ptc_${Date.now()}`;
        await setDoc(doc(db, 'ptc_ads', newId), {
          title, url, thumbnail, reward, duration, maxClicks, clicks: 0, createdAt: serverTimestamp()
        });
      }
      resetForm();
      loadAds();
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const handleEdit = (ad: any) => {
    setEditingId(ad.id);
    setTitle(ad.title);
    setUrl(ad.url);
    setThumbnail(ad.thumbnail || '');
    setReward(ad.reward);
    setDuration(ad.duration || 15);
    setMaxClicks(ad.maxClicks || 1000);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    try {
      await deleteDoc(doc(db, 'ptc_ads', id));
      loadAds();
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setUrl('');
    setThumbnail('');
    setReward(5);
    setDuration(15);
    setMaxClicks(1000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          {editingId ? <Edit2 size={20} /> : <Plus size={20} />}
          {editingId ? 'تعديل إعلان PTC' : 'إضافة إعلان PTC جديد'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-neutral-400 mb-1">عنوان الإعلان (يظهر للمستخدم)</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: موقع رائع جداً" className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1">صورة الإعلان (رابط Thumbnail)</label>
            <input type="url" value={thumbnail} onChange={e => setThumbnail(e.target.value)} placeholder="https://..." className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none text-left" dir="ltr" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-neutral-400 mb-1">رابط الموقع (URL)</label>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none text-left" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1">المدة المطلوبة (بالثواني)</label>
            <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1">عدد النقاط للمستخدم</label>
            <input type="number" value={reward} onChange={e => setReward(Number(e.target.value))} className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1">الحد الأقصى للزيارات (اختياري)</label>
            <input type="number" value={maxClicks} onChange={e => setMaxClicks(Number(e.target.value))} className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none" />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={handleSave} className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-colors">
            <Save size={18} /> {editingId ? 'حفظ التعديلات' : 'إضافة الإعلان'}
          </button>
          {editingId && (
            <button onClick={resetForm} className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-colors">
              <X size={18} /> إلغاء
            </button>
          )}
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">الإعلانات الحالية (PTC)</h2>
        {loading ? (
          <div className="flex justify-center"><Loader2 className="animate-spin text-pink-500" /></div>
        ) : ads.length === 0 ? (
          <p className="text-neutral-500 text-center py-4">لا توجد إعلانات مضافة حالياً.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ads.map((ad: any) => (
              <div key={ad.id} className="bg-black border border-neutral-800 p-4 rounded-xl flex flex-col gap-4">
                 <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                       <div className="w-16 h-16 rounded-lg bg-neutral-900 border border-neutral-800 shrink-0 overflow-hidden">
                          {ad.thumbnail ? <img src={ad.thumbnail} alt={ad.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-neutral-600"><ImageIcon size={20} /></div>}
                       </div>
                       <div>
                          <h4 className="font-bold text-white line-clamp-1">{ad.title}</h4>
                          <p className="text-neutral-500 text-xs mt-1 truncate max-w-[150px]" dir="ltr" title={ad.url}>{ad.url}</p>
                       </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(ad)} className="p-2 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 rounded-lg transition-colors" title="تعديل">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(ad.id)} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors" title="حذف">
                        <Trash2 size={18} />
                      </button>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-800 text-center text-sm">
                    <div className="bg-neutral-900 rounded p-2 text-neutral-400">
                       <div className="text-[10px] mb-1">النقاط</div>
                       <div className="font-bold text-amber-500">{ad.reward}</div>
                    </div>
                    <div className="bg-neutral-900 rounded p-2 text-neutral-400">
                       <div className="text-[10px] mb-1">المدة</div>
                       <div className="font-bold text-white">{ad.duration} ث</div>
                    </div>
                    <div className="bg-neutral-900 rounded p-2 text-neutral-400">
                       <div className="text-[10px] mb-1">الزيارات</div>
                       <div className="font-bold text-white line-clamp-1" title={`${ad.clicks || 0} / ${ad.maxClicks}`}>{ad.clicks || 0}/{ad.maxClicks}</div>
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
