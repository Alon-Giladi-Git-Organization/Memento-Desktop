import React, { useState } from 'react';
import { Sparkles, Loader2, Check, AlertCircle } from 'lucide-react';

export type MnemonicPromptType =
  | 'palace_scene'
  | 'palace_desc'
  | 'academic_concept'
  | 'academic_scene'
  | 'major_word'
  | 'major_hint'
  | 'major_consonants'
  | 'pao_element'
  | 'pao_person'
  | 'pao_action'
  | 'pao_object'
  | 'pao_scene'
  | 'name_face_anchor'
  | 'name_face_substitute'
  | 'name_face_scene'
  | 'shape_association'
  | 'shape_tip'
  | 'body_peg'
  | 'custom_association'
  | 'general_mnemonic';

export interface PAOFieldContext {
  numberStr?: string;
  number?: number | string;
  person?: string;
  action?: string;
  object?: string;
  scene?: string;
}

interface AIFieldGeneratorButtonProps {
  promptType: MnemonicPromptType;
  inputContext: string;
  extraContext?: string;
  paoContext?: PAOFieldContext;
  customDigits?: any[];
  connectingLetters?: string[];
  onGenerated: (generatedText: string, meta?: { isRandomAction?: boolean; actionNote?: string }) => void;
  onNotice?: (notice: string | null) => void;
  label?: string;
  className?: string;
  compact?: boolean;
}

export const AIFieldGeneratorButton: React.FC<AIFieldGeneratorButtonProps> = ({
  promptType,
  inputContext,
  extraContext,
  paoContext,
  customDigits,
  connectingLetters,
  onGenerated,
  onNotice,
  label = 'מלא עם AI',
  className = '',
  compact = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [justGenerated, setJustGenerated] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [previousSuggestions, setPreviousSuggestions] = useState<string[]>([]);
  const [inlineNotice, setInlineNotice] = useState<string | null>(null);

  const handleGenerate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const effectiveInput = inputContext || paoContext?.numberStr || extraContext || '00';
    const currentCycle = cycleCount;
    setCycleCount((prev) => prev + 1);

    setLoading(true);
    setJustGenerated(false);
    setInlineNotice(null);
    if (onNotice) onNotice(null);

    // Always include the user's custom 0-9 letter-to-number dictionary
    let activeDigits = customDigits;
    if (!activeDigits || activeDigits.length === 0) {
      try {
        const raw = localStorage.getItem('mem_major_digits_0_9_v3');
        if (raw) activeDigits = JSON.parse(raw);
      } catch {}
    }

    // Always include the user's custom connecting letters / vowels
    let activeConnecting = connectingLetters;
    if (!activeConnecting || activeConnecting.length === 0) {
      try {
        const rawConn = localStorage.getItem('mem_connecting_letters_v1');
        if (rawConn) activeConnecting = JSON.parse(rawConn);
      } catch {}
    }
    if (!activeConnecting || activeConnecting.length === 0) {
      activeConnecting = ['א', 'ה', 'ו', 'י', 'נ', 'ע'];
    }

    try {
      const res = await fetch('/api/gemini/generate-mnemonic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: promptType,
          input: effectiveInput,
          extra: extraContext || '',
          cycle: currentCycle,
          customDigits: activeDigits,
          connectingLetters: activeConnecting,
          paoContext: paoContext || undefined,
          previousSuggestions,
        }),
      });

      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`);
      }

      const data = await res.json();

      let textToUse = '';

      switch (promptType) {
        case 'pao_scene':
          textToUse = data.fullScene || data.visualScene || data.explanation || '';
          break;
        case 'major_word':
        case 'major_consonants':
        case 'name_face_substitute':
          textToUse = data.hebrewKeyword || data.paoObject || data.headline || '';
          break;
        case 'pao_person':
          textToUse = data.paoPerson || data.hebrewKeyword || data.headline || '';
          break;
        case 'pao_action':
          textToUse = data.paoAction || data.hebrewKeyword || data.visualScene || '';
          break;
        case 'pao_object':
          textToUse = data.paoObject || data.hebrewKeyword || '';
          break;
        case 'name_face_anchor':
          textToUse = data.hebrewKeyword || data.headline || 'מבט חודר ועוגן ייחודי';
          break;
        case 'name_face_scene':
        case 'academic_scene':
        case 'palace_scene':
        case 'major_hint':
        case 'shape_tip':
        case 'custom_association':
          textToUse = data.fullScene || data.visualScene || data.explanation || data.headline || '';
          break;
        case 'academic_concept':
          textToUse = data.visualScene || `${data.headline}: ${data.explanation}`;
          break;
        case 'palace_desc':
          textToUse = data.explanation || data.visualScene || data.headline || '';
          break;
        case 'shape_association':
        case 'body_peg':
          textToUse = data.hebrewKeyword || data.headline || data.visualScene || '';
          break;
        default:
          textToUse = data.fullScene || data.visualScene || data.hebrewKeyword || data.headline || '';
          break;
      }

      if (!textToUse) {
        textToUse = data.fullScene || data.headline || data.visualScene || effectiveInput;
      }

      const cleanText = textToUse.trim();

      if (cleanText) {
        setPreviousSuggestions((prev) => [...prev.slice(-10), cleanText]);

        const isRandomAction = Boolean(data.isRandomAction);
        const actionNote = data.actionNote ? String(data.actionNote).trim() : '';

        if (promptType === 'pao_action' && (isRandomAction || actionNote)) {
          const noteMsg =
            actionNote ||
            'שים לב: הפעולה נבחרה באקראי מכיוון שטרם הוגדרה דמות בשדה "אדם".';
          if (onNotice) {
            onNotice(noteMsg);
          } else {
            setInlineNotice(noteMsg);
          }
        }

        onGenerated(cleanText, { isRandomAction, actionNote });
        setJustGenerated(true);
        setTimeout(() => setJustGenerated(false), 2000);
      }
    } catch (err) {
      console.error('Failed to generate mnemonic field:', err);
      const fallbackOptions = [
        `סצנה חושית עזה של ${effectiveInput}: צבעים עזים, ריח אבקת שריפה והתנגשות מתכתית רועמת`,
        `סצנה קולנועית של ${effectiveInput} בגלימת משי אדומה, מזיע ומריח מחציר רטוב לקראת קרב דרמטי`,
        `בתוך ענן עשן סגול וריח מנטה מקפיא: ${effectiveInput} מתנפץ לרסיסי זהב מנצנצים`,
      ];
      const fallbackText = fallbackOptions[currentCycle % fallbackOptions.length];
      onGenerated(fallbackText);
      setJustGenerated(true);
      setTimeout(() => setJustGenerated(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  const dynamicLabel =
    loading
      ? 'מייצר עם AI...'
      : justGenerated
      ? 'נוצר בהצלחה!'
      : cycleCount > 0
      ? `${label} (רעיון נוסף)`
      : label;

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        title="יצירה דינמית באמצעות Gemini AI בהתאם למיפוי האותיות והספרות האישי שלך. לחיצה חוזרת תציע רעיון חדש!"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer select-none active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
          justGenerated
            ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-500/50 text-xs shadow-xs'
            : 'bg-gradient-to-r from-amber-500/20 via-amber-600/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-200 border border-amber-500/40 hover:border-amber-400 text-xs shadow-xs'
        } ${compact ? 'px-2 py-0.5 text-[11px]' : ''} ${className}`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
        ) : justGenerated ? (
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        )}
        <span>{dynamicLabel}</span>
      </button>

      {inlineNotice && (
        <div className="flex items-start gap-1.5 bg-amber-500/15 border border-amber-500/40 text-amber-200 rounded-lg px-2 py-1 text-[10px] font-medium max-w-xs text-right animate-fadeIn">
          <AlertCircle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
          <span>{inlineNotice}</span>
        </div>
      )}
    </div>
  );
};
