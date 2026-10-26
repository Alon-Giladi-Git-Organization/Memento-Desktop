import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  Database,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MentorChatMessage } from '../types/memory';
import {
  AIMentorCRUDConfirmationModal,
  AIMentorCRUDHandlers,
  AIMentorDatabaseSnapshot,
  executeAIMentorCRUDAction,
  fetchAndSanitizeUserDatabaseForMentor,
  normalizeCRUDAction,
  PendingCRUDAction,
} from './AIMentorCRUDModal';

interface AIMentorChatProps extends AIMentorCRUDHandlers {
  messages: MentorChatMessage[];
  onSendMessage: (role: 'user' | 'assistant', content: string) => void;
  onEarnPoints: (amount: number, reason?: string) => void;
  userDatabase?: AIMentorDatabaseSnapshot;
  appContext?: Record<string, any>;
}

export const AIMentorChat: React.FC<AIMentorChatProps> = ({
  messages,
  onSendMessage,
  onEarnPoints,
  userDatabase,
  appContext,
  ...crudHandlers
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingCRUDAction | null>(null);
  const [lastActionBanner, setLastActionBanner] = useState<{
    text: string;
    isCancelled?: boolean;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleApproveAction = () => {
    if (!pendingAction) return;
    const statusText = executeAIMentorCRUDAction(pendingAction, crudHandlers, userDatabase);
    setPendingAction(null);
    setLastActionBanner({ text: statusText, isCancelled: false });
    confetti({ particleCount: 35, spread: 65, origin: { y: 0.7 } });
    onSendMessage('assistant', `✅ אושר ובוצע במסד הנתונים שלך: ${statusText}`);
    onEarnPoints(15, 'אישור פעולת CRUD עם מנטור הזיכרון');
  };

  const handleCancelAction = () => {
    if (!pendingAction) return;
    setPendingAction(null);
    setLastActionBanner({
      text: 'הפעולה בוטלה לבקשתך. לא בוצע כל שינוי במסד הנתונים.',
      isCancelled: true,
    });
    onSendMessage('assistant', '❎ הפעולה בוטלה על ידך. לא בוצע שום שינוי במסד הנתונים שלך.');
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const trimmedText = text.trim();
    onSendMessage('user', trimmedText);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const fullMessages = [...history, { role: 'user', content: trimmedText }];
      const cleanUserDb = await fetchAndSanitizeUserDatabaseForMentor(userDatabase);

      const res = await fetch('/api/gemini/mentor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: fullMessages,
          message: trimmedText,
          history,
          appContext,
          userDatabase: cleanUserDb,
        }),
      });

      const data = await res.json();
      onSendMessage('assistant', data.reply || 'מעולה! נמשיך לתרגל יחד.');
      onEarnPoints(10, 'אימון עם מנטור הזיכרון');

      const normalized = normalizeCRUDAction(data.action);
      if (normalized) {
        if (normalized.operation === 'READ') {
          // Read operations execute immediately without confirmation modal
        } else {
          // Pause execution and open confirmation modal for Create, Update, Delete
          setPendingAction(normalized);
        }
      }
    } catch (e: any) {
      console.error('Error in AIMentorChat:', e);
      onSendMessage(
        'assistant',
        `שגיאת תקשורת מול שרת ה-AI (${e?.message || 'Network Error'}). אנא נסה לשלוח שוב.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'מה מילת ה-Major ושלשת ה-PAO שלי עבור המספר 14?',
    'עדכן את מילת ה-Major של מספר 14 ל-"ידית"',
    'הוסף ארמון זיכרון חדש בשם "המשרד הראשי"',
    'המר לי לתמונה אחת חדה: "אלברט איינשטיין פרסם את תורת היחסות הכללית בשנת 1915"',
  ];

  return (
    <div className="w-full max-w-none space-y-6 pb-16">
      {/* Confirmation Pop-up Modal for Create / Update / Delete */}
      <AIMentorCRUDConfirmationModal
        pendingAction={pendingAction}
        userName={userDatabase?.userName}
        onApprove={handleApproveAction}
        onCancel={handleCancelAction}
      />

      {/* Header Banner */}
      <div className="bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden text-slate-900">
        <div className="flex items-center justify-between gap-4 flex-wrap relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
                  <span>מומחה מנמוניקה ויזואלית</span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span>גישה מלאה למסד הנתונים שלך (קריאה מיידית • CRUD באישור משתמש)</span>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">מנטור הזיכרון החי ב-AI</h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                שליפה מיידית של כל נתוני הזיכרון שלך, בניית תמונות אסוציאטיביות וניהול מלא (יצירה, עריכה ומחיקה) של הטבלאות והארמונות שלך באישורך המפורש.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Prompts */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-200">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer text-right shadow-2xs"
            >
              💬 {q}
            </button>
          ))}
        </div>
      </div>

      {/* Status Notification Banner */}
      {lastActionBanner && (
        <div
          className={`border-2 rounded-2xl px-4 py-3 flex items-center justify-between text-xs sm:text-sm font-bold animate-fadeIn ${
            lastActionBanner.isCancelled
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {lastActionBanner.isCancelled ? (
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{lastActionBanner.text}</span>
          </div>
          <button
            onClick={() => setLastActionBanner(null)}
            className="text-slate-500 hover:text-slate-900 font-bold px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Messages Box */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 max-h-[550px] overflow-y-auto">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                  isUser
                    ? 'bg-amber-100 text-amber-800 border-2 border-amber-300'
                    : 'bg-indigo-100 text-indigo-800 border-2 border-indigo-300'
                }`}
              >
                {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              <div
                className={`rounded-2xl p-4 max-w-[85%] text-xs sm:text-sm leading-relaxed shadow-2xs ${
                  isUser
                    ? 'bg-amber-500 text-white font-medium shadow-amber-500/20'
                    : 'bg-slate-50 text-slate-900 border-2 border-slate-200'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs text-slate-600 font-medium">
              מנטור הזיכרון קורא את מסד הנתונים שלך ומגבש תשובה...
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
          placeholder="שאל על הנתונים שלך או בקש להוסיף/לערוך/למחוק רשומה..."
          className="flex-1 bg-white border-2 border-slate-200 rounded-2xl px-5 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-2xs"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black px-6 py-3 rounded-2xl shadow-sm text-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <Send className="w-4 h-4" />
          <span>שלח</span>
        </button>
      </form>
    </div>
  );
};
