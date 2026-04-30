import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Sparkles, Loader2, Bot, TrendingUp, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';

export const AdminAICoach = ({ adminData }: any) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const key = process.env.GEMINI_API_KEY || '';
      const ai = new GoogleGenAI({ apiKey: key || '' });
      
      const promptText = `
أنت مستشار ذكي (AI Coach) لمنصة wintube.win المصممة لربح المال من الفيديوهات، الألعاب والعروض.
اطلب منك تقييم الوضع الحالي للموقع بناءً على البيانات التالية من لوحة تحكم الإدمن:

إجمالي المستخدمين: ${adminData?.totalUsers || 0}
إجمالي النقاط الموزعة: ${adminData?.totalPointsGiven || 0}
طلبات السحب المعلقة: ${adminData?.pendingWithdrawals || 0}
إجمالي الألعاب: ${adminData?.games?.length || 0}
عدد المستخدمين المسجلين: ${adminData?.users?.length || 0}
الربح من الإعلانات: الإعلانات المستخدمة حالياً هي (AdBanner, NativeAdBanner).

الإجابة يجب أن تكون باللغة العربية، احترافية ومشجعة كمدير تنفيذي يقرأ تقرير.
قم بالإجابة على التساؤلات التالية في تقريرك:
1. ما رأيك في أداء الموقع بناءً على هذه الأرقام؟
2. هل إذا تم إطلاق الموقع للعالم سيربح من الإعلانات الموجودة (AdBanner, NativeAdBanner) بدون الاعتماد فقط على العروض؟
3. هل ترى أن النظام البيئي (نقاط للمستخدم مقابل إعلانات) سليم لهذه المنصة؟
4. أعطِ نصيحة استراتيجية واحدة لزيادة الأرباح للمسؤول.

يجب أن يكون الرد منسقًا ومرتبًا بطريقة ممتازة (استخدم رموز تعبيرية وفواصل).
`;

      const response = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: promptText,
          config: {
              systemInstruction: 'أنت مستشار ذكي يساعد مسؤولي المواقع، تتحدث العربية. قدم نصائح منطقية.'
          }
      });
      
      setAnalysis(response.text);
    } catch (err: any) {
      console.error(err);
      setError("تعذر الاتصال بخادم الذكاء الاصطناعي: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="animate-in fade-in space-y-6">
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 border border-indigo-500/30 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Bot size={150} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
           <div className="bg-white/10 p-4 rounded-2xl flex-shrink-0">
             <Bot size={48} className="text-white" />
           </div>
           <div>
             <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                 المستشار الذكي للمنصة 
                 <Sparkles className="text-amber-400" size={24} />
             </h2>
             <p className="text-indigo-200 leading-relaxed max-w-2xl text-lg">
                 يقوم نظام الذكاء الاصطناعي الخاص بنا (Gemini 3.1 Pro) بتحليل بيانات منصتك بالكامل وإعطائك نظرة شاملة وتقييم حقيقي لإمكانيات نجاح موقعك ومستوى أرباح الإعلانات.
             </p>
             <button
                onClick={runAnalysis}
                disabled={isAnalyzing}
                className="mt-6 flex items-center gap-2 bg-gradient-to-l from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
             >
                {isAnalyzing ? <Loader2 size={24} className="animate-spin" /> : <BarChart3 size={24} />}
                <span>{isAnalyzing ? 'جاري تحليل المنصة...' : 'توليد تقرير شامل'}</span>
             </button>
           </div>
        </div>
      </div>

      {error && (
         <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="text-red-500 shrink-0" />
            <p className="text-red-400">{error}</p>
         </div>
      )}

      {analysis && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl relative">
          <div className="absolute -top-4 -right-4 bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-2xl shadow-xl">
             <CheckCircle className="text-white" size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
             <TrendingUp className="text-emerald-500" />
             تقرير منصة wintube.win
          </h3>
          <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-headings:text-indigo-300">
            <div className="whitespace-pre-wrap text-neutral-300 text-lg">
               {analysis}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
