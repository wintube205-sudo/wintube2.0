import React, { useState } from 'react';
import { Briefcase, Info, X, ExternalLink } from 'lucide-react';

export const OffersView = ({ user }: any) => {
  const [activeWall, setActiveWall] = useState<any>(null);

  // هنا نضع روابط جدران العروض الخاصة بك
  // يجب عليك التسجيل في هذه الشركات، وإنشاء تطبيق، ثم نسخ "رابط العرض" ووضعه هنا.
  // لاحظ كيف نرسل `[USER_ID]` لكي تعرف الشركة من هو المستخدم الذي أكمل العرض.
  const providers = [
    { 
      id: 'cpalead', 
      title: 'عروض CPALead', 
      desc: 'استبيانات وتحميل تطبيقات (سريع)', 
      urlTemplate: 'https://cdn.cpalead.com/adwall/preview.php?pub=XXXXXX&subid=[USER_ID]', // استبدل XXXXXX برقمك
      bgColor: 'bg-blue-600',
      icon: Briefcase
    },
    { 
      id: 'timewall', 
      title: 'TimeWall', 
      desc: 'المهام المصغرة والنقرات', 
      urlTemplate: 'https://timewall.com/offers?pub=YYYYYY&userid=[USER_ID]', // استبدل YYYYYY برقمك
      bgColor: 'bg-emerald-600',
      icon: ExternalLink
    }
  ];

  const handleOpenWall = (provider: any) => {
    if (!user) {
      alert('الرجاء تسجيل الدخول أولاً للاستفادة من العروض');
      return;
    }
    
    // استبدال كلمة [USER_ID] برقم المستخدم الفعلي لدينا في قاعدة البيانات
    const finalUrl = provider.urlTemplate.replace('[USER_ID]', user.id);
    
    setActiveWall({ ...provider, finalUrl });
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in w-full" dir="rtl">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-black text-white flex items-center gap-2"><Briefcase className="text-emerald-500" /> جدران العروض</h2>
        <div className="bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-xl font-bold text-sm text-center">
          الشركاء الرسميون (اربح الآلاف!)
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-500/20 rounded-2xl p-4 mb-8 flex gap-3 text-sm text-blue-200">
        <Info className="flex-shrink-0 text-blue-400" size={20} />
        <div>
          <p className="font-bold mb-1">كيف تعمل العروض؟</p>
          <p>عند إكمالك لأي عرض (تحميل لعبة، الإجابة على استبيان)، ستقوم شركة الإعلانات بإرسال إشعار للخادم الخاص بنا لإضافة النقاط إلى حسابك تلقائياً خلال دقائق.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map(provider => (
          <div key={provider.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-600 transition-colors flex flex-col justify-between">
            <div className="flex items-start gap-4 mb-6">
              <div className={`w-14 h-14 rounded-xl ${provider.bgColor} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                <provider.icon size={28} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg mb-1">{provider.title}</h3>
                <p className="text-sm text-neutral-400">{provider.desc}</p>
              </div>
            </div>
            <button onClick={() => handleOpenWall(provider)} className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 rounded-xl transition-colors">
              فتح قسم العروض
            </button>
          </div>
        ))}
      </div>

      {/* نافذة عرض الاوفر وول (Iframe) */}
      {activeWall && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
          <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950">
            <div className="flex items-center gap-3 text-white font-bold">
              <span>جاري عرض: {activeWall.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => window.open(activeWall.finalUrl, '_blank')} className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm flex items-center gap-2">
                <ExternalLink size={16} /> فتح في نافذة مستقلة
              </button>
              <button onClick={() => setActiveWall(null)} className="p-2 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="flex-grow w-full h-full relative">
            <iframe 
               src={activeWall.finalUrl} 
               className="w-full h-full border-none bg-white" 
               title="Offerwall"
               sandbox="allow-scripts allow-top-navigation allow-forms allow-same-origin allow-popups"
            />
          </div>
        </div>
      )}
    </div>
  );
};
