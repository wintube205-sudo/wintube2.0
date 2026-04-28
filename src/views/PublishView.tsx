import React, { useState, useEffect } from 'react';
import { Upload, Video, Gamepad2, Link as LinkIcon, Loader2, CheckCircle2, TrendingUp, Eye } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

export const PublishView = ({ user }: any) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'video' | 'game'>('video');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [myContent, setMyContent] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchMyContent();
    }
  }, [user]);

  const fetchMyContent = async () => {
    setFetching(true);
    try {
      const q = query(
        collection(db, 'user_content'), 
        where('uploaderId', '==', user.id),
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any);
      setMyContent(data.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));
    } catch (e) {
      console.error(e);
    }
    setFetching(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url || !user?.id) return;
    
    setLoading(true);
    try {
      let embedUrl = url;
      // Auto-convert youtube links to embed
      if (url.includes('youtube.com/watch')) {
          const vId = new URL(url).searchParams.get('v');
          if (vId) embedUrl = `https://www.youtube.com/embed/${vId}`;
      } else if (url.includes('youtu.be/')) {
          const vId = url.split('youtu.be/')[1].split('?')[0];
          if (vId) embedUrl = `https://www.youtube.com/embed/${vId}`;
      }
      
      await addDoc(collection(db, 'user_content'), {
        title,
        url: embedUrl,
        type,
        uploaderId: user.id,
        uploaderName: user.name,
        views: 0,
        createdAt: serverTimestamp()
      });
      setSuccess(true);
      setTitle('');
      setUrl('');
      fetchMyContent();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="p-20 text-center text-white">
        يرجى تسجيل الدخول لنشر وتسويق محتواك.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full animate-in fade-in pb-20" dir="rtl">
      <div className="flex items-center gap-3 mb-8 justify-center lg:justify-start">
        <Upload className="text-blue-500" size={32} />
        <h2 className="text-3xl font-black text-white">نشر محتوى جديد</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl">
          <h3 className="text-xl font-bold text-white mb-2">أضف رابطك</h3>
          <p className="text-neutral-400 text-sm mb-6">
            قم بنشر رابط فيديو أو لعبة خاصة بك، وسنضعها أمام المستخدمين. ستحصل على مكافأة لكل مشاهدة/لعب لمحتواك! بالإضافة لأرباحك من عرض الإعلانات.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-neutral-400 block mb-1">نوع المحتوى</label>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setType('video')} 
                  className={`flex-1 p-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all border ${type === 'video' ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-white'}`}
                >
                  <Video size={18} /> فيديو
                </button>
                <button 
                  type="button" 
                  onClick={() => setType('game')} 
                  className={`flex-1 p-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all border ${type === 'game' ? 'bg-purple-500/20 border-purple-500 text-purple-500' : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-white'}`}
                >
                  <Gamepad2 size={18} /> لعبة (HTML5)
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-neutral-400 block mb-1">عنوان المحتوى</label>
              <input 
                type="text" 
                required 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-white outline-none focus:border-blue-500"
                placeholder="مثال: لعبتي الجديدة / مقطع مضحك"
              />
            </div>

            <div>
              <label className="text-sm text-neutral-400 block mb-1">رابط المحتوى</label>
              <div className="relative">
                <LinkIcon className="absolute right-3 top-3.5 text-neutral-500" size={18} />
                <input 
                  type="url" 
                  required 
                  value={url} 
                  onChange={e => setUrl(e.target.value)} 
                  className="w-full bg-neutral-950 border border-neutral-800 p-3 pr-10 rounded-xl text-white outline-none focus:border-blue-500"
                  placeholder="https://..."
                  dir="ltr"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || !title || !url} 
              className={`w-full py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all ${loading ? 'bg-neutral-800 text-neutral-500' : success ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50'}`}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : success ? <><CheckCircle2 size={20} /> تم النشر بنجاح</> : 'نشر المحتوى'}
            </button>
          </form>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-blue-500" size={24} />
            <h3 className="text-xl font-bold text-white">إحصائيات محتواك</h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {fetching ? (
              <div className="flex justify-center py-10"><Loader2 className="text-blue-500 animate-spin" size={30} /></div>
            ) : myContent.length === 0 ? (
              <div className="text-center py-10 text-neutral-500">
                لم تقم بنشر أي محتوى بعد.
              </div>
            ) : (
              myContent.map((item, idx) => (
                <div key={idx} className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-neutral-900 p-2 rounded-lg">
                      {item.type === 'video' ? <Video className="text-red-500" size={20} /> : <Gamepad2 className="text-purple-500" size={20} />}
                    </div>
                    <div>
                      <div className="text-white font-bold max-w-[200px] truncate">{item.title}</div>
                      <div className="text-neutral-500 text-xs">
                        {new Date(item.createdAt?.toMillis?.() || Date.now()).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg flex flex-col items-center">
                    <span className="text-xs text-blue-400 font-bold flex items-center gap-1"><Eye size={12}/> {item.views || 0}</span>
                    <span className="text-[10px] text-neutral-500">مشاهدة</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
