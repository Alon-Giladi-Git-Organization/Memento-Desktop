import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  X,
  MessageSquare,
  ChevronUp,
  ChevronDown,
  Database,
  CheckCircle2,
  Wand2,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MentorChatMessage } from '../types/memory';

interface GlobalAIMentorWidgetProps {
  appContext: {
    majorDigitsCount: number;
    majorItemsCount: number;
    paoItemsCount: number;
    palacesCount: number;
    academicCount: number;
    contactsCount: number;
    recentPalaces?: Array<{ id: string; name: string; lociCount: number }>;
  };
  onUpdateMajorItem?: (number: number, updates: { userWord?: string; userImageHint?: string }) => void;
  onUpdatePAOItem?: (number: number, updates: { userPerson?: string; userAction?: string; userObject?: string }) => void;
  onAddPalace?: (name: string, description: string, icon: string) => void;
  onAddLocus?: (palaceId: string, locus: { title: string; roomName: string; positionDescription?: string; mnemonicScene?: string }) => void;
  onAddAcademicPoint?: (point: any) => void;
  onAddAssociation?: (assoc: any) => void;
  onEarnPoints?: (amount: number, reason?: string) => void;
}

export const GlobalAIMentorWidget: React.FC<GlobalAIMentorWidgetProps> = ({
  appContext,
  onUpdateMajorItem,
  onUpdatePAOItem,
  onAddPalace,
  onAddLocus,
  onAddAcademicPoint,
  onAddAssociation,
  onEarnPoints,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MentorChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'שלום! אני מנטור הזיכרון האישי שלך בממנטו. אני כאן לענות על כל שאלה בתיאוריית הזיכרון, לבנות עבורך סצנות קינטיות, ואפילו לנהל ולעדכן ישירות את מאגרי הזיכרון, הארמונות והשלשות שלך. במה אוכל לעזור היום?',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastActionExecuted, setLastActionExecuted] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMsg: MentorChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const chatHistory = [...messages, userMsg].slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/gemini/mentor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          appContext,
        }),
      });

      const data = await res.json();

      let actionNotice = '';
      if (data.action) {
        const { type, payload } = data.action;
        if (type === 'UPDATE_MAJOR' && onUpdateMajorItem && payload.number !== undefined) {
          onUpdateMajorItem(payload.number, {
            userWord: payload.userWord,
            userImageHint: payload.userImageHint,
          });
          actionNotice = `⚡ עודכנה בהצלחה מילת Major עבור המספר ${payload.number}!`;
        } else if (type === 'UPDATE_PAO' && onUpdatePAOItem && payload.number !== undefined) {
          onUpdatePAOItem(payload.number, {
            userPerson: payload.userPerson,
            userAction: payload.userAction,
            userObject: payload.userObject,
          });
          actionNotice = `⚡ עודכנה בהצלחה שלשת PAO עבור המספר ${payload.number}!`;
        } else if (type === 'ADD_PALACE' && onAddPalace && payload.name) {
          onAddPalace(payload.name, payload.description || '', payload.icon || 'Home');
          actionNotice = `⚡ נוצר בהצלחה ארמון זיכרון חדש: "${payload.name}"!`;
        } else if (type === 'ADD_LOCUS' && onAddLocus && payload.palaceId) {
          onAddLocus(payload.palaceId, {
            title: payload.title || 'תחנה חדשה',
            roomName: payload.roomName || 'חדר ראשי',
            positionDescription: payload.positionDescription,
            mnemonicScene: payload.mnemonicScene,
          });
          actionNotice = `⚡ נוספה בהצלחה תחנה חדשה בארמון הזיכרון!`;
        } else if (type === 'ADD_ACADEMIC' && onAddAcademicPoint && payload.conceptTitle) {
          onAddAcademicPoint(payload);
          actionNotice = `⚡ נוסף בהצלחה מושג אקדמי למאגר!`;
        } else if (type === 'ADD_ASSOCIATION' && onAddAssociation && payload.sourceKey) {
          onAddAssociation(payload);
          actionNotice = `⚡ נוספה בהצלחה אסוציאציה למאגר האישי!`;
        }

        if (actionNotice) {
          setLastActionExecuted(actionNotice);
          confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
        }
      }

      const assistantMsg: MentorChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'מעולה! אני כאן להמשיך להדריך אותך.',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      onEarnPoints?.(10, 'אינטראקציה עם מנטור ה-AI');
    } catch (err) {
      console.error('Error contacting mentor chat:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'מצטער, חלה שגיאה רגעית בתקשורת. אנא נסה לשאול שוב.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'איך עובד חוק אותיות הקישור (אני עונה)?',
    'צור לי סצנת PAO קינטית ל-6 ספרות: 142388',
    'הוסף לי ארמון זיכרון חדש: "משרד העבודה"',
    'איך לזכור מושג פילוסופי מורכב בארמון?',
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-5 left-5 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-amber-300/40 group"
          title="פתח צ'אט עם מנטור הזיכרון AI"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-slate-950 animate-spin-slow" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-slate-950 animate-ping" />
          </div>
          <span className="hidden sm:inline-block font-extrabold tracking-wide">
            מנטור הזיכרון AI
          </span>
          <span className="sm:hidden font-extrabold">מנטור AI</span>
        </button>
      </div>

      {/* Floating Chat Drawer */}
      {isOpen && (
        <>
          {/* Backdrop for click outside */}
          <div
            className="fixed inset-0 z-45 bg-slate-950/40 backdrop-blur-[2px] transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="fixed bottom-20 left-4 sm:left-6 z-50 w-[calc(100vw-32px)] sm:w-[460px] h-[580px] max-h-[85vh] bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
          {/* Drawer Header */}
          <div className="p-4 bg-slate-50 border-b-2 border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 flex items-center justify-center text-slate-950 font-black shadow-sm">
                <Bot className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <span>מנטור הזיכרון של ממנטו</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded-full font-bold">
                    AI Active
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  תשובות תאורטיות, סצנות קינטיות ועריכת מסד נתונים (CRUD)
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Notification Banner */}
          {lastActionExecuted && (
            <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center justify-between text-xs text-emerald-800 font-semibold animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{lastActionExecuted}</span>
              </div>
              <button
                onClick={() => setLastActionExecuted(null)}
                className="text-emerald-700 hover:text-emerald-950 text-xs mr-2 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/70">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs shadow-2xs ${
                      isUser
                        ? 'bg-amber-500 text-white font-bold'
                        : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs ${
                      isUser
                        ? 'bg-amber-500 text-white rounded-tl-none font-medium'
                        : 'bg-white border-2 border-slate-200 text-slate-900 rounded-tr-none whitespace-pre-wrap'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex gap-2.5 items-center text-xs text-amber-700 font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                <span>המנטור מנסח תשובה ומנתח את בסיס הנתונים...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-white border-t border-slate-200 flex gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={isLoading}
                className="text-[10px] whitespace-nowrap bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-amber-400 px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0 font-medium shadow-2xs"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t-2 border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="שאל כל שאלה או בקש להוסיף/לערוך ארמון, שלשה או מילה..."
              className="flex-1 bg-slate-50 border-2 border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </form>
        </div>
        </>
      )}
    </>
  );
};
