import React, { useState, useEffect } from 'react';
import { Briefcase, Info, X, ExternalLink, Loader2, Gift, ChevronRight } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const OffersView = ({ user }: any) => {
  const [activeWall, setActiveWall] = useState<any>(null);
  const [nativeOffers, setNativeOffers] = useState<any[]>([]);
  const [myLeadOffers, setMyLeadOffers] = useState<any[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [loadingMyLead, setLoadingMyLead] = useState(false);
  const [pointsPerDollar, setPointsPerDollar] = useState(1000);
  const [myleadToken, setMyleadToken] = useState('');

  useEffect(() => {
    // Fetch global settings to get points exchange rate
    const fetchSettings = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'global'));
        if (settingsSnap.exists()) {
          setPointsPerDollar(settingsSnap.data().pointsPerDollar || 1000);
          setMyleadToken(settingsSnap.data().myleadToken || '');
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    // Fetch CPAGrip offers
    const fetchCpaGripOffers = async () => {
      setLoadingOffers(true);
      try {
        const userId = user?.id || 'guest';
        const url = `/api/proxy/cpagrip?user_id=2507811&pubkey=296f0c770b5322f24936b50aedcdb1b3&key=2e47a59b99cb8a12a2e766f783f4f1d2&tracking_id=${userId}`;
        
        // Using a proxy or just direct fetch if possible. 
        // Note: Direct fetch might fail due to CORS in some cases, but for JSON feeds they usually allow it.
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.offers) {
          setNativeOffers(data.offers);
        }
      } catch (err) {
        console.error("Error fetching CPAGrip offers:", err);
      } finally {
        setLoadingOffers(false);
      }
    };

    fetchCpaGripOffers();
  }, [user]);

  useEffect(() => {
    if (!myleadToken) return;

    // Fetch MyLead offers
    const fetchMyLeadOffers = async () => {
      setLoadingMyLead(true);
      try {
        // Direct fetch from MyLead API. Note: If CORS issue occurs, a backend proxy is required (e.g. Firebase Functions).
        // Since we are frontend only, we attempt a direct fetch.
        const response = await fetch(`/api/proxy/mylead?token=${myleadToken}`);
        const data = await response.json();
        
        // MyLead API wraps response in `data`
        if (data && data.data && Array.isArray(data.data)) {
           setMyLeadOffers(data.data);
        } else if (data && data.campaigns) {
           setMyLeadOffers(data.campaigns);
        }
      } catch (err) {
        console.error("Error fetching MyLead offers:", err);
      } finally {
        setLoadingMyLead(false);
      }
    };

    fetchMyLeadOffers();
  }, [myleadToken]);

  // روابط جدران العروض
  const providers = [
    { 
      id: 'mylead', 
      title: 'عروض MyLead (الرئيسية)', 
      desc: 'أفضل العروض والمهام ذات العائد المرتفع', 
      urlTemplate: 'https://reward-me.eu/03922d64-3b32-11f1-832c-8a5fb7be40ea?player_id=[USER_ID]',
      bgColor: 'bg-purple-600',
      icon: Briefcase
    },
    {
      id: 'cpxresearch',
      title: 'استبيانات CPX Research',
      desc: 'اربح مبالغ ضخمة من إكمال الاستبيانات',
      urlTemplate: 'https://offers.cpx-research.com/index.php?app_id=32823&ext_user_id=[USER_ID]',
      bgColor: 'bg-blue-600',
      icon: Briefcase
    },
    {
      id: 'bitcotasks',
      title: 'عروض BitcoTasks',
      desc: 'مهام وعروض إضافية مميزة',
      urlTemplate: 'https://bitcotasks.com/wall?subid=[USER_ID]', // يرجى تغيير الرابط بالرابط الخاص بك في BitcoTasks
      bgColor: 'bg-amber-600',
      icon: Gift
    }
  ];

  const handleOpenWall = (provider: any) => {
    if (!user) {
      alert('الرجاء تسجيل الدخول أولاً للاستفادة من العروض');
      return;
    }
    const finalUrl = provider.urlTemplate.replace('[USER_ID]', user.id);
    setActiveWall({ ...provider, finalUrl });
  };

  const handleOpenOffer = (offer: any) => {
    if (!user) {
      alert('الرجاء تسجيل الدخول أولاً للاستفادة من العروض');
      return;
    }
    // Append tracking_id to the offer link
    const finalLink = `${offer.offerlink}&tracking_id=${user.id}`;
    window.open(finalLink, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in w-full pb-20" dir="rtl">
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

      {/* CPAGrip Native Offers */}
      <div className="mb-10">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Gift className="text-amber-500" size={20} />
          عروض سريعة ومكافآت فورية
        </h3>
        
        {loadingOffers ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {nativeOffers.length > 0 ? (
              nativeOffers.map((offer: any) => {
                const points = Math.floor(parseFloat(offer.payout) * pointsPerDollar);
                return (
                  <div 
                    key={offer.offer_id} 
                    onClick={() => handleOpenOffer(offer)}
                    className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center gap-4 hover:border-emerald-500 transition-all cursor-pointer group"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-800 flex-shrink-0">
                      <img src={offer.offerphoto} alt={offer.title} className="w-full h-full object-cover" onError={(e: any) => e.target.src = 'https://via.placeholder.com/64?text=Offer'} />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-white text-sm sm:text-base truncate">{offer.title}</h4>
                      <p className="text-xs text-neutral-400 truncate">{offer.category}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-black">
                        +{points.toLocaleString()} نقطة
                      </div>
                      <ChevronRight size={16} className="text-neutral-600 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-800 text-neutral-500">
                لا توجد عروض متاحة حالياً لبلدك. جرب لاحقاً!
              </div>
            )}
          </div>
        )}
      </div>

      {/* MyLead Native Offers */}
      {myleadToken && (
        <div className="mb-10">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Briefcase className="text-purple-500" size={20} />
            مهام وعروض MyLead الحصرية
          </h3>
          
          {loadingMyLead ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-purple-500" size={32} />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {myLeadOffers.length > 0 ? (
                myLeadOffers.slice(0, 20).map((offer: any) => {
                  const points = Math.floor(parseFloat(offer.rate || offer.payout || 0) * pointsPerDollar);
                  return (
                    <div 
                      key={offer.id || offer.campaign_id} 
                      onClick={() => handleOpenOffer({ offerlink: offer.url || offer.tracking_url || `https://api.mylead.eu/api/external/v1/campaign/${offer.id}/url` })}
                      className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center gap-4 hover:border-purple-500 transition-all cursor-pointer group"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-800 flex-shrink-0">
                        <img src={offer.image_url || offer.logo || 'https://via.placeholder.com/64?text=MyLead'} alt={offer.name} className="w-full h-full object-cover" onError={(e: any) => e.target.src = 'https://via.placeholder.com/64?text=Offer'} />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="font-bold text-white text-sm sm:text-base truncate">{offer.name || offer.title}</h4>
                        <p className="text-xs text-neutral-400 truncate">{offer.description || offer.category_name || 'عرض'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="bg-purple-600 text-white px-3 py-1 rounded-lg text-xs font-black">
                          +{points > 0 ? points.toLocaleString() : '؟؟؟'} نقطة
                        </div>
                        <ChevronRight size={16} className="text-neutral-600 group-hover:text-purple-500 transition-colors" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-800 text-neutral-500">
                  لا توجد عروض متاحة لـ MyLead حالياً.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <h3 className="text-lg font-bold text-white mb-4">شركات العروض الأخرى</h3>
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
