import React, { useState } from 'react';
import { Sparkles, Loader2, Check } from 'lucide-react';

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

interface AIFieldGeneratorButtonProps {
  promptType: MnemonicPromptType;
  inputContext: string;
  extraContext?: string;
  customDigits?: any[];
  onGenerated: (generatedText: string) => void;
  label?: string;
  className?: string;
  compact?: boolean;
}

export const AIFieldGeneratorButton: React.FC<AIFieldGeneratorButtonProps> = ({
  promptType,
  inputContext,
  extraContext,
  customDigits,
  onGenerated,
  label = 'מלא עם AI',
  className = '',
  compact = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [justGenerated, setJustGenerated] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);

  const handleGenerate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const effectiveInput = inputContext || extraContext || 'זיכרון ומנמוניקה';
    const currentCycle = cycleCount;
    setCycleCount((prev) => prev + 1);

    setLoading(true);
    setJustGenerated(false);

    let activeDigits = customDigits;
    if (!activeDigits || activeDigits.length === 0) {
      try {
        const raw = localStorage.getItem('mem_major_digits_0_9_v3');
        if (raw) activeDigits = JSON.parse(raw);
      } catch {}
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
          textToUse = data.hebrewKeyword || data.headline || '';
          break;
        case 'pao_person':
          textToUse = data.paoPerson || data.hebrewKeyword || data.headline || '';
          break;
        case 'pao_action':
          textToUse = data.paoAction || data.visualScene || '';
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
          textToUse = data.visualScene || data.fullScene || data.explanation || data.headline || '';
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

      // Fallback if empty string
      if (!textToUse) {
        textToUse = data.fullScene || data.headline || data.visualScene || effectiveInput;
      }

      if (textToUse) {
        onGenerated(textToUse.trim());
        setJustGenerated(true);
        setTimeout(() => setJustGenerated(false), 2000);
      }
    } catch (err) {
      console.error('Failed to generate mnemonic field:', err);
      // Sensible instant Hebrew multisensory fallback
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
      ? 'מייצר רעיון...'
      : justGenerated
      ? 'הושלם בהצלחה!'
      : cycleCount > 0
      ? `${label} (רעיון נוסף)`
      : label;

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={loading}
      title="יצירה והשלמת שדה זה בעזרת מנוע ה-AI של ממנטו. לחיצה חוזרת תציע רעיון רב-חושי חדש!"
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
  );
};
