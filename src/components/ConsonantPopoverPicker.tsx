import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Plus, Sparkles, Check } from 'lucide-react';
import { MajorItem } from '../types/memory';
import {
  PHONETIC_CONSONANT_TOKENS,
  getConsonantPoolForDigit,
  serializeConsonantTokens,
  DEFAULT_CONNECTING_LETTERS,
} from '../lib/hebrewLogicValidator';

interface ConsonantPopoverPickerProps {
  digit: number;
  value: string;
  majorDigits: MajorItem[];
  connectingLetters?: string[];
  onChange: (newConsonantsStr: string) => void;
  placeholder?: string;
  compact?: boolean;
}

export const ConsonantPopoverPicker: React.FC<ConsonantPopoverPickerProps> = ({
  digit,
  value,
  majorDigits,
  connectingLetters = DEFAULT_CONNECTING_LETTERS,
  onChange,
  placeholder = 'לחץ לבחירת עיצורים מהמאגר הפנוי...',
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { selectedTokens, availableTokens } = getConsonantPoolForDigit(
    majorDigits,
    digit,
    value,
    connectingLetters
  );

  // Light dismiss on click outside or Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleAddToken = (tokenStr: string) => {
    if (selectedTokens.includes(tokenStr)) return;
    const next = [...selectedTokens, tokenStr];
    onChange(serializeConsonantTokens(next));
  };

  const handleRemoveToken = (tokenStr: string) => {
    const next = selectedTokens.filter((t) => t !== tokenStr);
    onChange(serializeConsonantTokens(next));
  };

  const getTokenMeta = (tokenStr: string) => {
    return (
      PHONETIC_CONSONANT_TOKENS.find((p) => p.token === tokenStr) || {
        token: tokenStr,
        display: tokenStr,
        subLabel: 'עיצור',
        baseLetter: tokenStr[0] || tokenStr,
        variantType: 'standard' as const,
      }
    );
  };

  return (
    <div ref={containerRef} className="relative w-full text-right" dir="rtl">
      {/* Clickable Consonants Field Trigger */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className={`w-full bg-slate-900 border transition-all rounded-xl ${
          compact ? 'px-2.5 py-1.5 min-h-[36px]' : 'px-3 py-2 min-h-[42px]'
        } flex items-center justify-between gap-2 cursor-pointer select-none ${
          isOpen
            ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-md shadow-amber-950/30'
            : 'border-slate-700 hover:border-amber-500/60'
        }`}
        title="לחץ לפתיחת מאגר העיצורים הפנויים או לחץ על עיצור נבחר להסרתו"
      >
        <div className="flex items-center flex-wrap gap-1.5 flex-1">
          {selectedTokens.length > 0 ? (
            selectedTokens.map((tok) => {
              const meta = getTokenMeta(tok);
              return (
                <button
                  key={tok}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveToken(tok);
                  }}
                  title={`לחץ להסרת "${meta.display}" (${meta.subLabel}) והחזרתו למאגר הפנוי`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-rose-500/25 border border-amber-500/40 hover:border-rose-500/50 text-amber-200 hover:text-rose-200 font-mono font-black text-xs sm:text-sm transition-all cursor-pointer group"
                >
                  <span>{meta.display}</span>
                  <X className="w-3 h-3 text-amber-400/70 group-hover:text-rose-300 transition-colors" />
                </button>
              );
            })
          ) : (
            <span className="text-xs text-slate-500 italic">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-amber-400/80">
          <Plus className="w-3.5 h-3.5" />
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-amber-300' : ''
            }`}
          />
        </div>
      </div>

      {/* Popover / Tooltip Container */}
      {isOpen && (
        <div
          className="absolute z-50 top-full mt-2 right-0 left-0 sm:min-w-[330px] bg-slate-950 border-2 border-amber-500/60 rounded-2xl p-3.5 shadow-2xl space-y-3 animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h4 className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>בחירת עיצורים לספרה {digit}</span>
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                מוצגות רק אותיות פנויות שלא שויכו לספרות אחרות
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              title="סגור חלונית"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Currently Selected Consonants for this Digit (Click to remove & return to pool) */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-emerald-400 block">
              נבחרו לספרה {digit} (לחץ להסרה והחזרה למאגר הפנוי):
            </span>
            {selectedTokens.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                {selectedTokens.map((tok) => {
                  const meta = getTokenMeta(tok);
                  return (
                    <button
                      key={tok}
                      type="button"
                      onClick={() => handleRemoveToken(tok)}
                      className="flex flex-col items-center justify-center min-w-[46px] px-2 py-1 rounded-xl bg-amber-500/20 hover:bg-rose-500/25 border border-amber-400/60 hover:border-rose-400 text-amber-200 hover:text-rose-200 transition-all cursor-pointer group"
                      title={`הסר את "${meta.display}" (${meta.subLabel}) והחזר למאגר`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-black text-sm">{meta.display}</span>
                        <X className="w-3 h-3 text-amber-400 group-hover:text-rose-300" />
                      </div>
                      <span className="text-[9px] text-amber-300/80 group-hover:text-rose-200 leading-tight">
                        {meta.subLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 bg-slate-900/50 px-2.5 py-1.5 rounded-xl border border-slate-800/80">
                טרם נבחרו עיצורים לספרה {digit}. לחץ על אייקון למטה להוספה.
              </div>
            )}
          </div>

          {/* Available Consonant Pool (Strictly unassigned letters + phonetic variations) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-300">
                מאגר עיצורים ווריאציות פונטיות פנויים ({availableTokens.length}):
              </span>
              <span className="text-[9px] text-slate-500">לחץ להוספה מיידית</span>
            </div>

            {availableTokens.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-56 overflow-y-auto p-1 pr-0.5">
                {availableTokens.map((pt) => {
                  const isSpecialVariant = pt.variantType !== 'standard';
                  return (
                    <button
                      key={pt.token}
                      type="button"
                      onClick={() => handleAddToken(pt.token)}
                      className={`flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                        isSpecialVariant
                          ? 'bg-indigo-950/40 hover:bg-amber-500/20 border-indigo-500/40 hover:border-amber-400 text-indigo-200 hover:text-amber-200'
                          : 'bg-slate-900 hover:bg-amber-500/20 border-slate-800 hover:border-amber-400 text-slate-200 hover:text-amber-200'
                      }`}
                      title={`הוסף "${pt.display}" (${pt.subLabel}) לספרה ${digit}`}
                    >
                      <span className="font-mono font-black text-base leading-none mb-1">
                        {pt.display}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium leading-tight text-center truncate w-full">
                        {pt.subLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-amber-300 bg-amber-950/30 border border-amber-500/30 rounded-xl p-2.5 text-center">
                כל העיצורים הפנויים כבר שויכו לספרות. שחרר עיצור מספרה אחרת כדי לשייכו לכאן.
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-500">
              כולל הבחנה בין דגושה/רפה (פּ/פ, בּ/ב, כּ/כ) וגרושות (צ/צ', ג/ג', ז/ז')
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>סיום</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
