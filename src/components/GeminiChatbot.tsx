import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const GeminiChatbot = ({ user }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([
    { role: 'model', text: 'مرحباً! أنا المساعد الذكي الخاص بالموقع. كيف يمكنني مساعدتك اليوم؟' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const contents = messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
      }));
      contents.push({ role: 'user', parts: [{ text: userMessage }] });

      const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-preview',
          contents: contents,
          config: {
              systemInstruction: 'أنت مساعد ذكي ولطيف لمنصة وين تيوب wintube.win التي تتيح للمستخدمين ربح النقاط من مشاهدة الفيديوهات والإعلانات ولعب الألعاب. يمكنك التحدث باللغة العربية. ساعد المستخدمين وتحدث بطريقة ودودة.'
          }
      });
      
      const reply = response.text;
      
      if (reply) {
         setMessages(prev => [...prev, { role: 'model', text: reply }]);
      } else {
         setMessages(prev => [...prev, { role: 'model', text: 'عذراً، حدث خطأ غير متوقع.' }]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { role: 'model', text: 'عذراً لا يمكنني الرد الآن. يرجى المحاولة لاحقاً.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 left-6 bg-gradient-to-tr from-purple-600 to-blue-600 text-white p-4 rounded-full shadow-xl shadow-purple-900/30 hover:scale-105 active:scale-95 transition-transform z-40 flex items-center justify-center group"
      >
        <MessageSquare size={28} />
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-neutral-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
           تحدث مع الذكاء الاصطناعي
        </span>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 left-6 w-80 sm:w-96 bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl z-50 flex flex-col h-[500px] max-h-[80vh] font-sans" dir="rtl">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                 <h3 className="text-white font-bold text-lg leading-tight">مساعد وين تيوب</h3>
                 <p className="text-white/70 text-xs">مدعوم من Gemini</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-950">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-end gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                    {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
                  </div>
                  <div className={`p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-bl-none'}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-end gap-2 max-w-[85%]">
                  <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-purple-600">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="bg-neutral-800 border border-neutral-700 p-4 rounded-2xl rounded-bl-none flex gap-1 items-center">
                    <div className="w-2 h-2 rounded-full bg-neutral-500 animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 rounded-full bg-neutral-500 animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 rounded-full bg-neutral-500 animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 bg-neutral-900 border-t border-neutral-800">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="اكتب رسالتك هنا..."
                className="w-full bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 rounded-full py-3 pr-4 pl-12 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isTyping}
                className="absolute left-2 text-white bg-purple-600 hover:bg-purple-500 p-2 rounded-full disabled:opacity-50 disabled:hover:bg-purple-600 transition-colors flex items-center justify-center"
              >
                {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="rotate-180" />}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
