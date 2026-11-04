import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, AlertCircle, LogIn, Check, RefreshCw } from 'lucide-react';
import { auth } from '../lib/firebase';
import { compressDataUrl } from '../lib/imageCompression';

interface MajorImageGeneratorTabProps {
  numberStr: string;
  numberVal?: number;
  defaultWord: string;
  imageHint: string;
  consonants: string;
  currentUser?: any;
  saveButtonLabel?: string;
  onLogin?: () => void;
  onImageGenerated: (imageUrl: string) => void;
}

export const MajorImageGeneratorTab: React.FC<MajorImageGeneratorTabProps> = ({
  numberStr,
  numberVal,
  defaultWord,
  imageHint,
  consonants,
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

  // Check authentication
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
      setErrorMessage('כדי לייצר תמונות עם Gemini, יש להתחבר תחילה עם חשבון Google שלך.');
      return;
    }

    if (!defaultWord && !imageHint) {
      setErrorMessage('לא ניתן לייצר תמונה ללא מילת עוגן או סצנה/רמז ויזואלי. הזן לפחות אחד מהערכים תחילה.');
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

    // Live elapsed timer for clear feedback
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Strict 120-second timeout
    timeoutRef.current = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      cleanupTimers();
      setIsGenerating(false);
      setErrorMessage('יצירת התמונה נמשכה זמן רב מדי (מעל 120 שניות). אנא נסה שוב או נסה להעלות תמונה ידנית.');
    }, 120000);

    try {
      const response = await fetch('/api/gemini/generate-major-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          userId: effectiveUser.uid,
          userEmail: effectiveUser.email,
          numberStr,
          numberVal,
          defaultWord,
          imageHint,
          consonants,
          userStylePrompt: stylePrompt.trim() || undefined,
        }),
      });

      cleanupTimers();

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'QUOTA_EXHAUSTED' || response.status === 429) {
          setIsQuotaExhausted(true);
          setErrorMessage(data.message || 'מכסת ה-API של Gemini מוצתה. ניתן להעלות תמונה מהמכשיר או לנסות שוב מאוחר יותר.');
        } else if (data.error === 'API_KEY_INVALID' || response.status === 401) {
          setErrorMessage(data.message || 'שגיאת אימות עם Gemini API. אנא בדוק את הגדרות הפרויקט.');
        } else {
          setErrorMessage(data.message || 'אירעה שגיאה ביצירת התמונה.');
        }
        setIsGenerating(false);
        return;
      }

      if (data.imageUrl) {
        setPreviewImage(data.imageUrl);
      } else {
        setErrorMessage('לא התקבלה תמונה מהשרת. נסה שוב.');
      }
    } catch (err: any) {
      cleanupTimers();
      if (err.name === 'AbortError') {
        // Handled by timeout or cancel
        return;
      }
      console.error('Fetch error during Major image generation:', err);
      setErrorMessage('תקלת תקשורת מול שרת יצירת התמונות. אנא נסה שנית.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyImage = async () => {
    if (!previewImage) return;
    setIsSaving(true);
    try {
      const compressed = await compressDataUrl(previewImage, 800, 0.85);
      onImageGenerated(compressed);
      setIsSaved(true);
    } catch (err) {
      console.error('Error compressing Major image:', err);
      onImageGenerated(previewImage);
      setIsSaved(true);
    } finally {
      setIsSaving(false);
    }
  };

  const styleSuggestions = [
    { label: '🎨 קריקטורה קומית חיה', prompt: 'Humorous, vibrant abstract 2D cartoon caricature with bold clean comic outlines and saturated expressive colors' },
    { label: '🌟 תלת-מימד ססגוני (3D Render)', prompt: 'Crisp vibrant 3D stylized character render, claymation Disney-Pixar style lighting, vibrant reflections' },
    { label: '🖌️ ציור שמן מנמוני', prompt: 'Lively expressive oil painting style with thick brushstrokes and dramatic mnemonic lighting' },
    { label: '💥 סגנון קומיקס רטרו (Pop-Art)', prompt: 'Classic vintage comic book illustration, pop-art halftone dots, vibrant action panel layout' },
  ];

  return (
    <div className="space-y-4 text-right">
      {/* Target Item Summary Preview Card */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-black px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              #{numberStr}
            </span>
            <span className="text-xs text-amber-300 font-bold">
              עיצורים: [{consonants || '—'}]
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Gemini Nano Banana 2.1</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
            <span className="text-slate-400 font-semibold block text-[10px]">מילת עוגן / חפץ מרכזי:</span>
            <span className="text-white font-bold">{defaultWord || '(טרם הוגדר)'}</span>
          </div>
          <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
            <span className="text-slate-400 font-semibold block text-[10px]">סצנה / רמז ויזואלי:</span>
            <span className="text-amber-200 font-medium line-clamp-2">{imageHint || '(טרם הוגדר)'}</span>
          </div>
        </div>
      </div>

      {/* Style & Atmosphere Optional Prompt */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-200 block">
          התאמת סגנון ויזואלי והנחיות מיוחדות (אופציונלי):
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {styleSuggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setStylePrompt(s.prompt)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-600/40 transition-colors cursor-pointer"
            >
              {s.label}
            </button>
          ))}
        </div>
        <textarea
          rows={2}
          value={stylePrompt}
          onChange={(e) => setStylePrompt(e.target.value)}
          placeholder="למשל: סגנון קריקטורה קומית חיה, תאורה דרמטית, צבעים זוהרים..."
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Authentication Banner if not signed in */}
      {!isAuthenticated && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-right">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-200">
              נדרש חיבור חשבון Google כדי לייצר תמונות עם Gemini Nano Banana.
            </p>
          </div>
          {onLogin && (
            <button
              type="button"
              onClick={onLogin}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>התחבר עכשיו</span>
            </button>
          )}
        </div>
      )}

      {/* Error Message & Quota Notification */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-right">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-200 space-y-1">
            <p className="font-bold">{errorMessage}</p>
            {isQuotaExhausted && (
              <p className="text-[11px] text-rose-300/80">
                טיפ: תוכל לעבור לטאב "העלאה מהמכשיר" או "הזנת קישור" כדי להגדיר תמונה מיידית ללא המתנה.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Action / Generate Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleGenerateImage}
          disabled={isGenerating || !isAuthenticated || (!defaultWord && !imageHint)}
          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isGenerating
              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 cursor-wait'
              : !isAuthenticated || (!defaultWord && !imageHint)
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 active:scale-98'
          }`}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
              <span>מייצר תמונה עם Gemini Nano Banana... ({elapsedSeconds} שניות)</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{previewImage ? 'יצירת תמונה מחדש (AI)' : 'צור תמונה עם Gemini'}</span>
            </>
          )}
        </button>

        {isGenerating && (
          <button
            type="button"
            onClick={() => {
              if (abortControllerRef.current) abortControllerRef.current.abort();
              cleanupTimers();
              setIsGenerating(false);
            }}
            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors cursor-pointer shrink-0"
          >
            ביטול
          </button>
        )}
      </div>

      {/* Generated Preview & Confirm Save */}
      {previewImage && (
        <div className="space-y-3 pt-3 border-t border-slate-800 animate-fade-in">
          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            <span>התמונה נוצרה בהצלחה! תצוגה מקדימה:</span>
          </div>

          <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-black aspect-square max-w-[280px] mx-auto shadow-2xl">
            <img
              src={previewImage}
              alt={`Major #${numberStr} - ${defaultWord}`}
              className="w-full h-full object-contain"
            />
          </div>

          <button
            type="button"
            onClick={handleApplyImage}
            disabled={isSaving || isSaved}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isSaved
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 cursor-default'
                : isSaving
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500 cursor-wait'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4" />
                <span>התמונה נשמרה בהצלחה!</span>
              </>
            ) : isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
                <span>שומר ומכווץ תמונה...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{saveButtonLabel || 'שמור תמונה זו למספר Major זה'}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
