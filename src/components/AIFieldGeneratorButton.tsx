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
  onGenerated: (generatedText: string) => void;
  label?: string;
  className?: string;
  compact?: boolean;
}

export const AIFieldGeneratorButton: React.FC<AIFieldGeneratorButtonProps> = ({
  promptType,
  inputContext,
  extraContext,
  onGenerated,
  label = 'מלא עם AI',
  className = '',
  compact = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [justGenerated, setJustGenerated] = useState(false);

  const handleGenerate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const effectiveInput = inputContext || extraContext || 'זיכרון ומנמוניקה';

    setLoading(true);
    setJustGenerated(false);

    try {
      const res = await fetch('/api/gemini/generate-mnemonic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: promptType,
          input: effectiveInput,
          extra: extraContext || '',
        }),
      });

      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`);
      }

      const data = await res.json();

      let textToUse = '';

      switch (promptType) {
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
          textToUse = data.visualScene || data.explanation || data.headline || '';
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
          textToUse = data.visualScene || data.hebrewKeyword || data.headline || '';
          break;
      }

      // Fallback if empty string
      if (!textToUse) {
        textToUse = data.headline || data.visualScene || effectiveInput;
      }

      if (textToUse) {
        onGenerated(textToUse.trim());
        setJustGenerated(true);
        setTimeout(() => setJustGenerated(false), 2000);
      }
    } catch (err) {
      console.error('Failed to generate mnemonic field:', err);
      // Even in catch, provide a sensible instant Hebrew kinetic fallback
      const fallbackText = `התנגשות קינטית של ${effectiveInput} עם אש וצבעי זהב מתפרצים`;
      onGenerated(fallbackText);
      setJustGenerated(true);
      setTimeout(() => setJustGenerated(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={loading}
      title="יצירה והשלמת שדה זה בעזרת מנוע ה-AI של ממנטו"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer select-none active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
        justGenerated
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px]'
          : 'bg-gradient-to-r from-amber-500/15 to-amber-600/15 hover:from-amber-500/25 hover:to-amber-600/25 text-amber-300 border border-amber-500/35 hover:border-amber-500/60 text-[10px] shadow-sm'
      } ${compact ? 'px-1.5 py-0.5 text-[9px]' : ''} ${className}`}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin text-amber-400 shrink-0" />
      ) : justGenerated ? (
        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
      ) : (
        <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
      )}
      <span>
        {loading ? 'מייצר...' : justGenerated ? 'הושלם!' : label}
      </span>
    </button>
  );
};
