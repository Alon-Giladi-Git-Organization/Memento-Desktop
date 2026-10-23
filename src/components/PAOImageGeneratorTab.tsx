import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, AlertCircle, LogIn, Check, RefreshCw } from 'lucide-react';
import { auth } from '../lib/firebase';
import { compressDataUrl } from '../lib/imageCompression';

interface PAOImageGeneratorTabProps {
  numberStr: string;
  numberVal?: number;
  person: string;
  action: string;
  object: string;
  scene?: string;
  currentUser?: any;
  saveButtonLabel?: string;
  onLogin?: () => void;
  onImageGenerated: (imageUrl: string) => void;
}

export const PAOImageGeneratorTab: React.FC<PAOImageGeneratorTabProps> = ({
  numberStr,
  person,
  action,
  object,
  scene,
  currentUser,
  saveButtonLabel,
  onLogin,
  onImageGenerated,
}) => {
  const [stylePrompt, setStylePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isQuotaExhausted, setIsQuotaExhausted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user is authenticated with Google
  const effectiveUser = currentUser || auth.currentUser;
  const isAuthenticated = Boolean(effectiveUser);

  const cleanupTimers = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupTimers();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleGenerateImage = async () => {
    if (!isAuthenticated) {
      setErrorMessage('כדי לייצר תמונות עם Gemini Nano Banana, יש להתחבר תחילה עם חשבון Google שלך.');
      return;
    }

    if (!person && !action && !object && !scene) {
      setErrorMessage('לא ניתן לייצר תמונה ללא ערכי PAO (אדם, פעולה, חפץ או סצנה). הזן לפחות אחד מהערכים תחילה.');
      return;
    }

    cleanupTimers();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsGenerating(true);
    setIsSaved(false);
    setErrorMessage(null);
    setIsQuotaExhausted(false);
    setElapsedSeconds(0);

    // Live elapsed timer for clear feedback during generation
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Strict 120-second timeout as required:
    // If the timer expires, clear loading state and show exact Hebrew message.
    timeoutRef.current = setTimeout(() => {
      controller.abort();
      cleanupTimers();
      setIsGenerating(false);
      setErrorMessage('אנו חווים עומס כרגע. אנא נסה לייצר את התמונה שוב מאוחר יותר.');
    }, 120000);

    try {
      const res = await fetch('/api/gemini/generate-pao-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          userId: effectiveUser.uid,
          userEmail: effectiveUser.email || '',
          numberStr,
          person: person || '',
          action: action || '',
          object: object || '',
          scene: scene || '',
          userStylePrompt: stylePrompt.trim(),
        }),
      });

      const data = await res.json();
      cleanupTimers();

      if (!res.ok || !data.success) {
        if (res.status === 429 || data.error === 'QUOTA_EXHAUSTED') {
          setIsQuotaExhausted(true);
          setErrorMessage(
            data.message ||
              'מכסת הטוקנים היומית של Gemini לחשבונך מוצתה לסשן זה. תוכל להעלות תמונה מהמכשיר או לנסות שוב מאוחר יותר.'
          );
        } else if (data.error === 'API_KEY_INVALID') {
          setErrorMessage(
            data.message ||
              'מפתח ה-API של Gemini אינו בתוקף או שאינו מוגדר. יש לבחור או לרענן מפתח תקין בהגדרות המערכת.'
          );
        } else if (res.status === 401 || data.error === 'AUTH_REQUIRED') {
          setErrorMessage(
            data.message ||
              'כדי לייצר תמונות עם Gemini Nano Banana, יש להתחבר תחילה עם חשבון Google שלך (התחבר בסרגל העליון).'
          );
        } else {
          setErrorMessage(
            data.message ||
              'אירעה שגיאה ביצירת התמונה עם Gemini. תוכל לנסות שוב או להעלות קובץ ידנית מהמכשיר.'
          );
        }
        return;
      }

      if (data.imageUrl) {
        try {
          // Pre-compress to ~40-60KB JPEG so it's guaranteed to fit in Firestore effortlessly
          const optimized = await compressDataUrl(data.imageUrl);
          setPreviewImage(optimized);
        } catch {
          setPreviewImage(data.imageUrl);
        }
      }
    } catch (err: any) {
      cleanupTimers();
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        setErrorMessage('אנו חווים עומס כרגע. אנא נסה לייצר את התמונה שוב מאוחר יותר.');
      } else {
        console.error('Error generating image:', err);
        setErrorMessage('שגיאת תקשורת עם שרת ה-AI. ודא חיבור תקין לרשת ונסה שנית.');
      }
    } finally {
      cleanupTimers();
      setIsGenerating(false);
    }
  };

  const handleApplyImage = async () => {
    if (!previewImage) return;
    setIsSaving(true);
    try {
      const optimized = await compressDataUrl(previewImage);
      onImageGenerated(optimized);
      setIsSaved(true);
    } catch (err) {
      console.error('Error saving image:', err);
      onImageGenerated(previewImage);
      setIsSaved(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-slate-950/70 border-2 border-indigo-500/30 rounded-3xl p-5 sm:p-6 space-y-5 text-right text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <span>מחולל הדימויים המנמוניים • Gemini Nano Banana</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full font-bold">
                סצנה #{numberStr}
              </span>
            </h4>
            <p className="text-[11px] text-slate-400 font-medium">
              יצירה אוטומטית של סצנה קינטית אבסורדית ובלתי נשכחת לשלשת ה-PAO
            </p>
          </div>
        </div>
      </div>

      {/* Auth Validation Warning if not logged in */}
      {!isAuthenticated && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-200 space-y-3 animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-sm font-bold block text-white">נדרש חיבור לחשבון Google</strong>
              <p className="text-xs text-amber-300/90 leading-relaxed mt-0.5">
                יצירת תמונות מותאמות אישית באמצעות Gemini Nano Banana מופעלת דרך חשבון ה-Google שלך.
                כדי שנוכל לחבר את ה-AI לסשן שלך, אנא התחבר עם חשבון Google:
              </p>
            </div>
          </div>
          {onLogin && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onLogin}
                className="inline-flex items-center gap-2 bg-white text-slate-950 hover:bg-slate-100 font-black px-4 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-indigo-600" />
                <span>התחבר עכשיו עם Google</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Fixed PAO Anchor Keys Display */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-400 block">
          עוגני ה-PAO שנשלחים אוטומטית לג&apos;מיני:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="bg-slate-900 border border-amber-500/30 p-2.5 rounded-xl text-xs">
            <span className="text-amber-400 font-bold block text-[10px]">👤 אדם (Person):</span>
            <span className="font-bold text-slate-200 truncate block">{person || '(טרם הוגדר)'}</span>
          </div>
          <div className="bg-slate-900 border border-purple-500/30 p-2.5 rounded-xl text-xs">
            <span className="text-purple-400 font-bold block text-[10px]">⚡ פעולה (Action):</span>
            <span className="font-bold text-slate-200 truncate block">{action || '(טרם הוגדר)'}</span>
          </div>
          <div className="bg-slate-900 border border-teal-500/30 p-2.5 rounded-xl text-xs">
            <span className="text-teal-400 font-bold block text-[10px]">📦 חפץ (Object):</span>
            <span className="font-bold text-slate-200 truncate block">{object || '(טרם הוגדר)'}</span>
          </div>
        </div>
        {scene && (
          <div className="bg-slate-900/90 border border-amber-400/30 p-2.5 rounded-xl text-xs">
            <span className="text-amber-300 font-bold block text-[10px]">🎬 סצנה שלמה (Full Scene Details):</span>
            <span className="text-slate-200 leading-relaxed block text-[11px] mt-0.5">{scene}</span>
          </div>
        )}
      </div>

      {/* Requirement 1: Dedicated Loading State with large elegant spinning wheel */}
      {isGenerating && (
        <div className="py-14 sm:py-20 px-4 rounded-3xl bg-slate-900/95 border-2 border-indigo-500/50 flex flex-col items-center justify-center text-center space-y-6 shadow-2xl relative overflow-hidden animate-fadeIn">
          {/* Ambient glowing backdrop */}
          <div className="absolute w-72 h-72 bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

          {/* Large elegant spinner with multi-ring animation */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
            {/* Outer rotating gradient ring */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-400 border-r-purple-400 animate-spin" />
            {/* Middle counter-rotating ring */}
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-pink-400 border-l-amber-300 animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
            {/* Soft glowing core */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-pink-600 flex items-center justify-center shadow-lg shadow-indigo-500/50">
              <Sparkles className="w-6 h-6 text-amber-200 animate-pulse" />
            </div>
          </div>

          {/* Required Hebrew copy */}
          <div className="space-y-2 max-w-lg z-10">
            <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
              יוצר את הסצנה שלך... התהליך עשוי לקחת מספר דקות
            </h3>
            <p className="text-xs sm:text-sm text-indigo-200/80 leading-relaxed font-medium">
              Gemini מתרגם את שלשת ה-PAO לקריקטורה אבסטרקטית עשירה ומטמיע את פרטי הסצנה
            </p>
            <div className="pt-2 flex items-center justify-center gap-2 text-xs font-mono text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>זמן שעבר: {elapsedSeconds} שניות (פסק זמן של 120 שנ&apos;)</span>
            </div>
          </div>
        </div>
      )}

      {/* Error / Quota / Timeout Messages */}
      {errorMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed animate-fadeIn flex items-start gap-2.5 ${
            isQuotaExhausted
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
          }`}
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <div className="font-medium">{errorMessage}</div>
        </div>
      )}

      {/* Requirement 2: Prominent Large Image Display (No thumbnails) */}
      {!isGenerating && previewImage && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>התמונה נוצרה בהצלחה ע&quot;י Gemini!</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              שלשת PAO #{numberStr}
            </span>
          </div>

          {/* Big prominent display - full width, generous height */}
          <div className="w-full relative rounded-3xl overflow-hidden border-2 border-indigo-500/40 bg-black/75 shadow-2xl flex items-center justify-center p-2 sm:p-3 group">
            <img
              src={previewImage}
              alt={`Generated Mnemonic PAO #${numberStr}`}
              className="w-full max-h-[560px] sm:max-h-[640px] object-contain rounded-2xl shadow-xl transition-transform duration-300 group-hover:scale-[1.01]"
            />
          </div>

          {/* Requirement 3: Two prominent side-by-side buttons: 'שמור תמונה' and 'צור תמונה מחדש' */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleApplyImage}
              className={`w-full py-3.5 px-6 active:scale-95 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2.5 shadow-lg cursor-pointer transition-all ${
                isSaved
                  ? 'bg-emerald-500 shadow-emerald-500/50'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40'
              }`}
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span>{isSaved ? '✓ התמונה נשמרה ב-DB!' : isSaving ? 'שומר ב-DB...' : saveButtonLabel || 'שמור תמונה'}</span>
            </button>
            <button
              type="button"
              onClick={handleGenerateImage}
              disabled={isGenerating || !isAuthenticated}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 active:scale-95 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-950/40 cursor-pointer transition-all disabled:opacity-50"
            >
              <RefreshCw className="w-5 h-5" />
              <span>צור תמונה מחדש</span>
            </button>
          </div>

          {/* Database Save Confirmation Banner */}
          {isSaved && (
            <div className="p-3 bg-emerald-500/15 border-2 border-emerald-500/40 rounded-2xl text-xs text-emerald-300 font-bold flex items-center gap-2.5 animate-fadeIn shadow-md">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>התמונה נשמרה לצמיתות בבסיס הנתונים (Firestore) ומסונכרנת לכל המכשירים שלך!</span>
            </div>
          )}
        </div>
      )}

      {/* Requirement 3: Persistent Custom Prompt Input - ALWAYS VISIBLE BELOW BUTTONS */}
      {!isGenerating && (
        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-bold text-indigo-300 block">
            הוראות סגנון / דגשים אישיים לדימוי (אופציונלי):
          </label>
          <textarea
            rows={2}
            value={stylePrompt}
            onChange={(e) => setStylePrompt(e.target.value)}
            disabled={isGenerating || !isAuthenticated}
            placeholder="לדוגמה: הדגש תאורת לילה דרמטית, הוסף אבק כוכבים, צבעי ניאון עזים..."
            className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all disabled:opacity-50"
          />
          <p className="text-[10px] text-slate-400 leading-normal">
            💡 <strong className="text-indigo-300">ברירת המחדל המובנית:</strong> סגנון קריקטורה אבסטרקטית צבעונית והומוריסטית המותאם לסלבריטאים, כולל שילוב טקסט טבעי של האדם (על הבגד/עצם), הפעולה (בבועת קומיקס כמו POW או GLUG), והחפץ (על גבי תווית).
          </p>
        </div>
      )}

      {/* Main Trigger Button when no image yet and not generating */}
      {!previewImage && !isGenerating && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-500 font-mono">
            Powered by Google Gemini Nano Banana
          </span>
          <button
            type="button"
            disabled={isGenerating || !isAuthenticated}
            onClick={handleGenerateImage}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:opacity-40 text-white font-black text-sm rounded-2xl flex items-center gap-2.5 shadow-lg shadow-indigo-600/30 cursor-pointer transition-all active:scale-95 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span>צור תמונה עם Gemini Nano Banana</span>
          </button>
        </div>
      )}
    </div>
  );
};
