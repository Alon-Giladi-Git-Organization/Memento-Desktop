import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, Bot, User, HelpCircle, Trophy } from 'lucide-react';
import { MentorChatMessage } from '../types/memory';

interface AIMentorChatProps {
  messages: MentorChatMessage[];
  onSendMessage: (role: 'user' | 'assistant', content: string) => void;
  onEarnPoints: (amount: number, reason?: string) => void;
}

export const AIMentorChat: React.FC<AIMentorChatProps> = ({
  messages,
  onSendMessage,
  onEarnPoints,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    onSendMessage('user', text.trim());
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/gemini/mentor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history,
        }),
      });

      const data = await res.json();
      onSendMessage('assistant', data.reply || 'מעולה! נמשיך לתרגל יחד.');
      onEarnPoints(10, 'אימון עם מנטור הזיכרון');
    } catch (e) {
      console.error(e);
      onSendMessage('assistant', 'משהו קרה בחיבור לשרת, אנא נסה לשאול שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'איך אני בונה את ארמון הזיכרון הראשון שלי צעד-אחר-צעד?',
    'תן לי סצנה מנמונית מוקצנת עבור מספר תעודת זהות של 9 ספרות',
    'איך לזכור שמות של 20 אנשים במפגש נטוורקינג מבלי לשכוח אף אחד?',
    'מה ההבדל בין שיטת ה-Major לשיטת PAO ומתי להשתמש בכל אחת?',
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border-2 border-indigo-500/50 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">מנטור הזיכרון החי ב-AI</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              מומחה עולמי בטכניקות מנמוניקה, פירוק מספרים, ארמונות זיכרון והצמדות קינטיות.
            </p>
          </div>
        </div>

        {/* Quick Prompts */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-800">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700 transition-colors cursor-pointer text-right"
            >
              💬 {q}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4 max-h-[550px] overflow-y-auto">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                }`}
              >
                {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              <div
                className={`rounded-2xl p-4 max-w-[85%] text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-amber-500/15 text-white border border-amber-500/30'
                    : 'bg-slate-950 text-slate-200 border border-slate-800/80'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs text-slate-400">
              מנטור הזיכרון חושב ובונה סצנה מנמונית...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="שאל כל דבר: איך לזכור נוסחה מורכבת, מספר טלפון, או תחנה בארמון..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-indigo-600/20 text-sm flex items-center gap-2 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>שלח</span>
        </button>
      </form>
    </div>
  );
};
