import React from 'react';
import { FileText, ShieldAlert, Mail } from 'lucide-react';

export const LegalView = ({ type }: { type: 'terms' | 'privacy' | 'contact' }) => {
  const content = {
    terms: {
      title: 'شروط استخدام الموقع',
      icon: FileText,
      color: 'text-blue-500',
      sections: [
        { t: '1. قبول الشروط', d: 'باستخدامك لموقعنا، فإنك توافق على الالتزام بجميع القواعد الموضحة في هذه الصفحة. إذا كنت لا توافق، يُرجى التوقف عن استخدام الموقع.' },
        { t: '2. الحسابات والتسجيل', d: 'يُسمح بحساب واحد فقط لكل شخص/جهاز. استخدام برامج الـ VPN، الـ Proxy، أو أي أداة لتغيير الـ IP أو محاكاة الأجهزة لتجاوز العروض أو مشاهدة الفيديوهات يعتبر غشاً وسيؤدي إلى حظر الحساب فوراً دون سابق إنذار.' },
        { t: '3. قسم العروض والنقاط', d: 'نحن نعتمد على شركات الطرف الثالث (Offerwalls) لتوفير العروض. الأرباح تعتمد على تأكيد هذه الشركات، وفي حال لم تقم الشركة بتأكيد اكتمال العرض، لا يحق للمستخدم المطالبة بالنقاط.' },
        { t: '4. سحب الأرباح', d: 'تتم مراجعة جميع طلبات السحب يدوياً للتأكد من نزاهة الحصول على النقاط. يحق للإدارة رفض أي طلب سحب في حال اكتشاف نشاط مشبوه أو مخالفة للشروط.' },
      ]
    },
    privacy: {
      title: 'سياسة الخصوصية',
      icon: ShieldAlert,
      color: 'text-emerald-500',
      sections: [
        { t: '1. البيانات التي نجمعها', d: 'نقوم بجمع البيانات الأساسية التي تقدمها عند التسجيل مثل: الاسم، البريد الإلكتروني، وتاريخ التسجيل. لا نقوم بجمع أو تخزين كلمات المرور لحسابات Google.' },
        { t: '2. كيف نستخدم معلوماتك', d: 'تُستخدم المعلومات للحفاظ على أمان حسابك، ترتيبك في قائمة المتصدرين، ضمان الدفع لك بالطريقة الصحيحة، ومنع محاولات الاحتيال وتعدد الحسابات.' },
        { t: '3. مشاركة البيانات', d: 'نحن نحترم خصوصيتك بشكل كامل ولا نقوم ببيع أو تأجير أو مشاركة معلوماتك الشخصية مع أي جهة خارجية أو شركات إعلانية، باستثناء ما يتطلبه القانون.' },
        { t: '4. ملفات تعريف الارتباط (Cookies)', d: 'نستخدم بعض ملفات تعريف الارتباط الأساسية (Cookies) لحفظ تسجيل دخولك وإعداداتك، ولتتبع روابط الإحالة بشكل صحيح لضمان منح المكافآت لمستحقيها.' },
      ]
    },
    contact: {
      title: 'اتصل بنا',
      icon: Mail,
      color: 'text-purple-500',
      sections: [
        { t: 'تواصل مع الدعم الفني', d: 'إذا كان لديك أي استفسار حول طلب سحب متأخر، أو واجهت مشكلة في الموقع، أو ترغب في الإبلاغ عن خطأ ما، فنحن هنا لمساعدتك.' },
        { t: 'البريد الإلكتروني للإدارة', d: 'support@wintube.win' },
        { t: 'أوقات العمل', d: 'نحاول الرد على جميع رسائل البريد الإلكتروني في غضون 24-48 ساعة خلال أيام العمل الرسمية.' },
      ]
    }
  }[type];

  const Icon = content.icon;

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in w-full pb-10" dir="rtl">
      <div className="flex items-center gap-3 mb-8">
         <div className="bg-neutral-900 p-3 rounded-2xl border border-neutral-800">
            <Icon className={content.color} size={32} />
         </div>
         <h2 className="text-3xl font-black text-white">{content.title}</h2>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-10 space-y-8">
         {content.sections.map((sec, idx) => (
            <div key={idx} className="border-b border-neutral-800/50 pb-6 last:border-0 last:pb-0">
               <h3 className="text-lg font-bold text-white mb-2">{sec.t}</h3>
               <p className="text-neutral-400 leading-relaxed text-sm md:text-base">{sec.d}</p>
            </div>
         ))}
      </div>
    </div>
  );
};
