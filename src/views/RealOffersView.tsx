import React, { useState, useEffect } from 'react';
import { Briefcase, AlertTriangle, CheckCircle, ShieldAlert, Smartphone, ArrowLeft, Loader2, Play } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const RealOffersView = ({ user, setActiveTab }: any) => {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [myleadToken, setMyleadToken] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [showGate, setShowGate] = useState(false);
  const [agreedToRules, setAgreedToRules] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'global'));
        if (settingsSnap.exists()) {
          setMyleadToken(settingsSnap.data().myleadToken || '');
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchAllOffers = async () => {
      setLoading(true);
      let allOffers: any[] = [];
      
      // Fetch CPAGrip
      try {
        const userId = user?.id || 'guest';
        const url = `https://www.cpagrip.com/common/offer_feed_json.php?user_id=2507811&pubkey=296f0c770b5322f24936b50aedcdb1b3&key=2e47a59b99cb8a12a2e766f783f4f1d2&tracking_id=${userId}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.offers) {
          allOffers = [...allOffers, ...data.offers.map((o: any) => ({
             id: o.offer_id,
             title: o.title,
             description: o.description || o.category,
             image: o.offerphoto,
             link: o.offerlink,
             network: 'CPAGrip'
          }))];
        }
      } catch (err) {}

      // Fetch MyLead
      if (myleadToken) {
        try {
          const response = await fetch('https://api.mylead.eu/api/external/v1/campaigns', {
             headers: {
               'Authorization': `Bearer ${myleadToken}`,
               'Accept': 'application/json'
             }
          });
          const data = await response.json();
          let myleadCampaigns = [];
          if (data && data.data && Array.isArray(data.data)) {
             myleadCampaigns = data.data;
          } else if (data && data.campaigns) {
             myleadCampaigns = data.campaigns;
          }
          
          allOffers = [...allOffers, ...myleadCampaigns.map((o: any) => ({
             id: o.id || o.campaign_id,
             title: o.name || o.title,
             description: o.description || o.category_name,
             image: o.image_url || o.logo,
             link: o.url || o.tracking_url || `https://api.mylead.eu/api/external/v1/campaign/${o.id}/url`,
             network: 'MyLead'
          }))];
        } catch (err) {}
      }

      setOffers(allOffers);
      setLoading(false);
    };

    fetchAllOffers();
  }, [myleadToken, user]);

  const handleOfferClick = (offer: any) => {
    setSelectedOffer(offer);
    setShowGate(true);
    setAgreedToRules(false);
  };

  const handleStartOffer = () => {
    if (!agreedToRules) return;
    if (!user) {
      alert('الرجاء تسجيل الدخول أولاً');
      return;
    }
    const finalLink = `${selectedOffer.link}&tracking_id=${user.id}`;
    window.open(finalLink, '_blank');
    setShowGate(false);
    setSelectedOffer(null);
  };

  if (showGate && selectedOffer) {
    return (
      <div className="max-w-xl mx-auto animate-in slide-in-from-bottom flex flex-col min-h-[80vh] justify-center pb-20" dir="rtl">
         <button onClick={() => setShowGate(false)} className="text-neutral-400 hover:text-white flex items-center gap-2 mb-8">
            <ArrowLeft size={20} className="rotate-180" /> عودة للعروض
         </button>
         
         <div className="bg-neutral-900 border-2 border-red-500/30 rounded-3xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>
            
            <div className="flex items-center gap-4 mb-6 relative z-10">
               <div className="w-16 h-16 rounded-2xl overflow-hidden bg-neutral-800 flex-shrink-0 border border-neutral-700">
                  <img src={selectedOffer.image} alt="app" className="w-full h-full object-cover" onError={(e:any)=>e.target.src='https://via.placeholder.com/64'} />
               </div>
               <div>
                  <h2 className="text-xl font-bold text-white mb-1">{selectedOffer.title}</h2>
                  <p className="text-sm text-neutral-400 line-clamp-1">{selectedOffer.description}</p>
               </div>
            </div>

            <div className="space-y-4 mb-8">
               <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3 text-red-200">
                 <ShieldAlert className="flex-shrink-0 text-red-500" size={24} />
                 <div>
                    <h3 className="font-bold text-red-500 mb-1">تنبيه هام ومشدد!</h3>
                    <p className="text-sm text-red-300">نظامنا مزود بحماية صارمة. أي محاولة للتحايل ستؤدي لحظر حسابك نهائياً وفقدان رصيدك.</p>
                 </div>
               </div>
               
               <div className="space-y-3">
                  <div className="flex items-center gap-3 text-neutral-300 text-sm bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                     <AlertTriangle className="text-amber-500 flex-shrink-0" size={20} />
                     <p>يمنع منعاً باتاً استخدام برامج <strong className="text-white">VPN</strong> أو <strong className="text-white">Proxy</strong> لتغيير موقعك.</p>
                  </div>
                  <div className="flex items-center gap-3 text-neutral-300 text-sm bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                     <Smartphone className="text-blue-500 flex-shrink-0" size={20} />
                     <p>يجب تثبيت التطبيق وتنزيله <strong className="text-white">فقط</strong> من خلال الرابط الذي سيظهر لك.</p>
                  </div>
                  <div className="flex items-center gap-3 text-neutral-300 text-sm bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                     <CheckCircle className="text-emerald-500 flex-shrink-0" size={20} />
                     <p>أكمل كافة متطلبات العرض داخل التطبيق ليتم احتسابه بشكل صحيح.</p>
                  </div>
               </div>
            </div>

            <div className="border border-neutral-700 bg-neutral-950 p-4 rounded-xl flex items-center gap-3 cursor-pointer select-none" onClick={() => setAgreedToRules(!agreedToRules)}>
               <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${agreedToRules ? 'bg-emerald-500 border-emerald-500' : 'border-neutral-500'}`}>
                  {agreedToRules && <CheckCircle size={16} className="text-white" />}
               </div>
               <span className="text-neutral-300 text-sm font-bold">قرأت الشروط المنصوصة وأوافق عليها وأتحمل مسؤولية أي مخالفة.</span>
            </div>

            <button 
               onClick={handleStartOffer}
               disabled={!agreedToRules}
               className={`w-full mt-6 py-4 rounded-xl font-black text-lg transition-all flex justify-center items-center gap-2
                  ${agreedToRules ? 'bg-emerald-600 text-white hover:bg-emerald-500 transform hover:-translate-y-1' : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'}`}
            >
               ابدأ العرض الآن <Play size={20} fill="currentColor" />
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in pb-24" dir="rtl">
      <div className="text-center mb-10 pt-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-4 text-emerald-500">
           <Briefcase size={32} />
        </div>
        <h1 className="text-3xl font-black text-white mb-2">عروض أصلية</h1>
        <p className="text-neutral-400 text-sm max-w-md mx-auto">
          حمل التطبيقات، أكمل التحديات، واستمتع بتجربة أصلية خالية من الإزعاج والأكواد الوهمية.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
           <Loader2 className="animate-spin text-emerald-500" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {offers.length > 0 ? (
            offers.map((offer) => (
              <div key={offer.id} className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl hover:border-neutral-700 transition-colors flex flex-col h-full">
                 <div className="flex items-start gap-4 mb-4">
                    <img src={offer.image} alt={offer.title} className="w-16 h-16 rounded-2xl object-cover bg-neutral-800 flex-shrink-0" onError={(e:any)=>e.target.src='https://via.placeholder.com/64'} />
                    <div>
                       <h3 className="font-bold text-white text-lg line-clamp-1">{offer.title}</h3>
                       {/* Removing 'Earn points' entirely from this view */}
                       <p className="text-neutral-400 text-xs mt-1 bg-neutral-800 inline-block px-2 py-1 rounded-md">موثوق</p>
                    </div>
                 </div>
                 
                 <div className="bg-neutral-950 p-3 rounded-xl mb-4 flex-grow border border-neutral-800/50">
                    <p className="text-sm text-neutral-300 font-medium mb-1">المطلوب:</p>
                    <p className="text-xs text-neutral-500 leading-relaxed line-clamp-3">{offer.description}</p>
                 </div>

                 <button 
                   onClick={() => handleOfferClick(offer)}
                   className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-colors text-sm"
                 >
                    ابدأ العرض
                 </button>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-neutral-900/50 rounded-3xl border border-dashed border-neutral-800 text-neutral-500">
               <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
               <p className="text-lg">لا توجد عروض متاحة حالياً.</p>
               <p className="text-sm mt-2">يرجى المحاولة في وقت لاحق.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
