import React from 'react';
import { Play, Briefcase, Zap, Gamepad2, Users } from 'lucide-react';

export const HomeView = ({ setActiveTab }: any) => (
  <div className="space-y-8 animate-in fade-in duration-500" dir="rtl">
    <section className="relative w-full aspect-[21/9] md:aspect-[21/7] rounded-3xl overflow-hidden bg-neutral-900">
      <div className="absolute inset-0 bg-gradient-to-l from-red-900/40 via-neutral-950/80 to-neutral-950"></div>
      <div className="relative h-full flex flex-col justify-center px-6 md:px-12 z-10">
        <span className="text-red-500 font-bold tracking-widest text-xs mb-4 uppercase inline-flex items-center gap-2">
          <Zap size={14} /> حدث حصري
        </span>
        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4">
          شاهد، العب، <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">واربح أموال حقيقية.</span>
        </h1>
        <p className="text-neutral-400 max-w-md mb-8 text-sm md:text-lg">
          نظام آمن مرتبط بقاعدة بيانات لحماية أرباحك. شاهد الفيديوهات، العب الألعاب، واسحب أرباحك فوراً.
        </p>
        <div className="flex gap-4">
          <button onClick={() => setActiveTab('videos')} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all flex items-center gap-2">
            ابدأ المشاهدة <Play fill="currentColor" size={16}/>
          </button>
          <button onClick={() => setActiveTab('offers')} className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-all flex items-center gap-2 hidden sm:flex">
            جدار العروض <Briefcase size={16}/>
          </button>
        </div>
      </div>
    </section>
    <section>
      <h2 className="text-2xl font-black text-white mb-6">طرق الربح المتاحة</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[
          { id: 'real_offers', title: 'عروض حقيقية', desc: 'مهام وتطبيقات موثوقة', icon: Briefcase, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { id: 'offers', title: 'جدار العروض', desc: 'اربح آلاف النقاط', icon: Briefcase, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { id: 'videos', title: 'شاهد الفيديوهات', desc: 'اربح نقطة كل 30 ثانية', icon: Play, color: 'text-red-500', bg: 'bg-red-500/10' },
          { id: 'games', title: 'العب واربح', desc: 'ألعاب محمية وعادلة', icon: Gamepad2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { id: 'referrals', title: 'دعوة الأصدقاء', desc: 'احصل على 20% من أرباحهم', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' }
        ].map((item, i) => (
          <div key={i} onClick={() => setActiveTab(item.id)} className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl hover:border-neutral-700 transition-colors cursor-pointer text-right group">
            <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}><item.icon className={item.color} size={24} /></div>
            <h3 className="font-bold text-white mb-1">{item.title}</h3>
            <p className="text-xs text-neutral-400">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
      <h2 className="text-2xl font-black text-white mb-8 relative z-10">كيف تبدأ وتربح معنا؟ (خطوات بسيطة)</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
         <div className="flex gap-4 items-start">
            <div className="w-10 h-10 shrink-0 rounded-full bg-blue-600 font-black text-white flex items-center justify-center text-xl shadow-lg shadow-blue-600/30">1</div>
            <div>
               <h3 className="text-white font-bold text-lg mb-2">جمع النقاط بحرية</h3>
               <p className="text-neutral-400 text-sm leading-relaxed">
                  أنشئ حسابك وابدأ بتنفيذ العروض، جمع النقاط عبر تخطي الروابط، أو مشاهدة الفيديوهات المتاحة في القائمة الجانبية.
               </p>
            </div>
         </div>
         <div className="flex gap-4 items-start">
            <div className="w-10 h-10 shrink-0 rounded-full bg-amber-500 font-black text-white flex items-center justify-center text-xl shadow-lg shadow-amber-500/30">2</div>
            <div>
               <h3 className="text-white font-bold text-lg mb-2">متابعة الأرباح</h3>
               <p className="text-neutral-400 text-sm leading-relaxed">
                  رصيدك يُحفظ فوراً في قاعدة بيانات سحابية وتستطيع رؤيته من الأعلى، ستلاحظ تقدمك كلما زاد نشاطك.
               </p>
            </div>
         </div>
         <div className="flex gap-4 items-start">
            <div className="w-10 h-10 shrink-0 rounded-full bg-green-500 font-black text-white flex items-center justify-center text-xl shadow-lg shadow-green-500/30">3</div>
            <div>
               <h3 className="text-white font-bold text-lg mb-2">سحب أرباحك الحقيقية</h3>
               <p className="text-neutral-400 text-sm leading-relaxed">
                  انتقل إلى قسم الجوائز واسحب نقاطك نقداً عبر (ASiaCell, ZainCash, USDT) وتصلك الأرباح سريعاً بعد المراجعة.
               </p>
            </div>
         </div>
      </div>
    </section>
  </div>
);
