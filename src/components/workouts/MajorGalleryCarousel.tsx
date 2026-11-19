import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  Edit3,
  ImagePlus,
  Play,
  Pause,
  Shuffle,
  X,
  Save,
  Check,
} from 'lucide-react';
import { MajorItem } from '../../types/memory';
import { DEFAULT_MAJOR_00_99 } from '../../data/defaultAssociations';
import { AIFieldGeneratorButton } from '../AIFieldGeneratorButton';

interface MajorGalleryCarouselProps {
  items: MajorItem[];
  majorDigits?: MajorItem[];
  connectingLetters?: string[];
  initialIndex?: number;
  onClose?: () => void;
  onEditItem?: (number: number) => void;
  onUpdateMajorItem?: (
    number: number,
    updates: { defaultWord?: string; imageHint?: string; imageUrl?: string; customNotes?: string }
  ) => void;
  onOpenImagePreview?: (item: MajorItem) => void;
  onOpenImageGenerator?: (item: MajorItem) => void;
  onToggleReady?: (number: number, currentState?: boolean) => void;
}

export const MajorGalleryCarousel: React.FC<MajorGalleryCarouselProps> = ({
  items,
  majorDigits,
  connectingLetters,
  initialIndex = 0,
  onClose,
  onEditItem,
  onUpdateMajorItem,
  onOpenImageGenerator,
  onToggleReady,
}) => {
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (initialIndex >= 0 && initialIndex < items.length) return initialIndex;
    return 0;
  });

  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const thumbnailListRef = useRef<HTMLDivElement | null>(null);

  // In-Gallery inline editing states
  const [isEditingSlide, setIsEditingSlide] = useState(false);
  const [editWord, setEditWord] = useState('');
  const [editHint, setEditHint] = useState('');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Keep index within bounds if items change
  useEffect(() => {
    if (currentIndex >= items.length) {
      setCurrentIndex(Math.max(0, items.length - 1));
    }
  }, [items.length, currentIndex]);

  // Sync index whenever initialIndex prop changes (e.g. user clicked a thumbnail)
  useEffect(() => {
    if (initialIndex !== undefined && initialIndex >= 0 && initialIndex < items.length) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex, items.length]);

  // Lock body scroll while lightbox is open so background never scrolls
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const goToNext = useCallback(() => {
    if (items.length === 0) return;
    setSlideDirection('left');
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const goToPrev = useCallback(() => {
    if (items.length === 0) return;
    setSlideDirection('right');
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  const goToIndex = (index: number) => {
    if (index === currentIndex || index < 0 || index >= items.length) return;
    setSlideDirection(index > currentIndex ? 'left' : 'right');
    setCurrentIndex(index);
  };

  const goToRandom = () => {
    if (items.length <= 1) return;
    let nextIndex = Math.floor(Math.random() * items.length);
    if (nextIndex === currentIndex) {
      nextIndex = (currentIndex + 1) % items.length;
    }
    setSlideDirection('left');
    setCurrentIndex(nextIndex);
  };

  const currentItem = items[currentIndex];

  const resolvedWord = currentItem
    ? (currentItem.defaultWord && currentItem.defaultWord.trim()) ||
      DEFAULT_MAJOR_00_99.find((d) => d.number === currentItem.number)?.defaultWord?.trim() ||
      ''
    : '';

  const handleSaveSlideEdits = useCallback(() => {
    if (!currentItem) return;
    if (onUpdateMajorItem) {
      onUpdateMajorItem(currentItem.number, {
        defaultWord: editWord.trim(),
        imageHint: editHint.trim(),
      });
      setSaveSuccessNotice('הערכים עודכנו בהצלחה');
      setTimeout(() => setSaveSuccessNotice(null), 2600);
      setIsEditingSlide(false);
    } else if (onEditItem) {
      onEditItem(currentItem.number);
    }
  }, [currentItem, onUpdateMajorItem, onEditItem, editWord, editHint]);

  const handleCancelSlideEdits = useCallback(() => {
    if (!currentItem) return;
    setEditWord(resolvedWord);
    setEditHint(currentItem.imageHint || '');
    setIsEditingSlide(false);
  }, [currentItem, resolvedWord]);

  // Keyboard navigation, Enter to save in edit mode & Light Dismiss via Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditingSlide && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSaveSlideEdits();
        return;
      }

      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        if (e.key === 'Escape') {
          e.preventDefault();
          handleCancelSlideEdits();
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (isEditingSlide) {
          handleCancelSlideEdits();
        } else {
          onClose?.();
        }
      } else if (e.key === 'ArrowLeft') {
        goToNext();
      } else if (e.key === 'ArrowRight') {
        goToPrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsAutoPlaying((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, onClose, isEditingSlide, handleSaveSlideEdits, handleCancelSlideEdits]);

  // Autoplay timer
  useEffect(() => {
    if (!isAutoPlaying || items.length <= 1) return;
    const interval = setInterval(() => {
      goToNext();
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoPlaying, items.length, goToNext]);

  // Center active thumbnail in bottom strip
  useEffect(() => {
    if (thumbnailListRef.current) {
      const activeThumb = thumbnailListRef.current.querySelector(
        `[data-thumb-index="${currentIndex}"]`
      ) as HTMLElement | null;
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    }
  }, [currentIndex]);

  // Sync draft edit values whenever the active slide item changes
  useEffect(() => {
    if (currentItem) {
      setEditWord(resolvedWord);
      setEditHint(currentItem.imageHint || '');
      setIsEditingSlide(false);
      setSaveSuccessNotice(null);
    }
  }, [currentItem?.number]);

  useEffect(() => {
    if (currentItem && !isEditingSlide) {
      setEditWord(resolvedWord);
      setEditHint(currentItem.imageHint || '');
    }
  }, [resolvedWord, currentItem?.imageHint, isEditingSlide]);

  // Touch Swipe Handlers (RTL aware: swipe left -> next, swipe right -> prev)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchStartXRef.current - touchEndX;
    const SWIPE_THRESHOLD = 50;

    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
    touchStartXRef.current = null;
  };

  const renderInPortal = (node: React.ReactNode) => {
    if (typeof document === 'undefined') return node;
    return createPortal(node, document.body);
  };

  if (items.length === 0 || !currentItem) {
    return renderInPortal(
      <div
        dir="rtl"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget && onClose) onClose();
        }}
        className="fixed inset-0 z-[60] bg-black/92 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
      >
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full max-w-md py-10 px-6 text-center rounded-2xl bg-slate-950/95 border border-white/10 space-y-4 shadow-2xl"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <ImagePlus className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">אין פריטים להצגה בגלריה</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            לא נמצאו פריטי Major התואמים לחיפוש או לסינון הנוכחי.
          </p>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-lg cursor-pointer transition-colors"
            >
              חזרה לתצוגת כוורת
            </button>
          )}
        </div>
      </div>
    );
  }

  return renderInPortal(
    <div
      dir="rtl"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[60] bg-black/93 backdrop-blur-md flex flex-col justify-between overflow-y-auto select-none animate-fadeIn"
    >
      {/* Top Lightbox Controls Bar */}
      <header
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-gradient-to-b from-black/80 to-transparent shrink-0 z-20"
      >
        <div className="flex items-center gap-3 text-xs text-slate-300 min-w-0">
          <span className="font-mono text-sm font-bold text-emerald-300 tabular-nums whitespace-nowrap">
            #{currentItem.numberStr}
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="font-mono tabular-nums text-slate-400 whitespace-nowrap">
            {currentIndex + 1} / {items.length}
          </span>
          <span aria-hidden="true" className="text-slate-600 hidden md:inline">·</span>
          <span className="text-slate-400 hidden md:inline truncate">
            עיצורים: {currentItem.consonants || '—'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end">
          {/* Quick Jump Dropdown */}
          <select
            value={currentItem.number}
            onChange={(e) => {
              const num = parseInt(e.target.value, 10);
              const targetIdx = items.findIndex((it) => it.number === num);
              if (targetIdx !== -1) goToIndex(targetIdx);
            }}
            aria-label="בחר מספר Major"
            className="bg-white/8 hover:bg-white/12 border border-white/10 text-emerald-200 text-xs font-mono rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-400 cursor-pointer max-w-[140px] sm:max-w-[180px]"
          >
            {items.map((it) => (
              <option key={it.number} value={it.number} className="bg-slate-950 text-white">
                #{it.numberStr} - {it.defaultWord || 'מספר'}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIsAutoPlaying((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              isAutoPlaying
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-white/8 hover:bg-white/15 text-slate-200 border border-white/10'
            }`}
            title="ניגון אוטומטי (מקש רווח)"
          >
            {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isAutoPlaying ? 'השהה' : 'ניגון'}</span>
          </button>

          <button
            type="button"
            onClick={goToRandom}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/8 hover:bg-white/15 text-slate-200 border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            title="פריט אקראי"
          >
            <Shuffle className="w-3.5 h-3.5 text-teal-300" />
            <span className="hidden sm:inline">אקראי</span>
          </button>

          {onToggleReady && (
            <button
              type="button"
              onClick={() => onToggleReady(currentItem.number, currentItem.is_ready_for_practice)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                currentItem.is_ready_for_practice
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-white/8 hover:bg-white/15 text-slate-300 border border-white/10'
              }`}
              title={currentItem.is_ready_for_practice ? 'מוכן לתרגול' : 'סמן כמוכן לתרגול'}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">
                {currentItem.is_ready_for_practice ? 'מוכן' : 'סמן כמוכן'}
              </span>
            </button>
          )}

          {/* Change Image button */}
          <button
            type="button"
            onClick={() => onOpenImageGenerator?.(currentItem)}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            title="שנה תמונה (יצירה עם AI או העלאה מהמחשב)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>שנה תמונה</span>
          </button>

          {/* Edit Values button */}
          {!isEditingSlide ? (
            <button
              type="button"
              onClick={() => setIsEditingSlide(true)}
              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              title="ערוך את מילת העוגן והסצנה"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-300" />
              <span>עריכה</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCancelSlideEdits}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-medium cursor-pointer transition-colors whitespace-nowrap"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={handleSaveSlideEdits}
                title="שמור שינויים (ניתן גם ללחוץ Enter)"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
              >
                <Save className="w-3.5 h-3.5" />
                <span>שמור (Enter)</span>
              </button>
            </div>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/8 hover:bg-white/20 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="סגור גלריה (Esc)"
              aria-label="סגור גלריה"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Lightbox Stage: Centered Image Above + Compact Text Values Below */}
      <main
        className="flex-1 flex flex-col items-center justify-center relative px-4 sm:px-14 py-2 gap-3 sm:gap-4 min-h-0"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget && onClose) {
            onClose();
          }
        }}
      >
        {/* Navigation Arrow: Right (Previous in RTL) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goToPrev();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="fixed right-2.5 sm:right-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-white/15 text-white/90 hover:text-white border border-white/15 shadow-2xl flex items-center justify-center transition-all cursor-pointer active:scale-95 backdrop-blur-md"
          title="לפריט הקודם (חץ ימינה)"
          aria-label="לפריט הקודם"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Navigation Arrow: Left (Next in RTL) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="fixed left-2.5 sm:left-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-white/15 text-white/90 hover:text-white border border-white/15 shadow-2xl flex items-center justify-center transition-all cursor-pointer active:scale-95 backdrop-blur-md"
          title="לפריט הבא (חץ שמאלה)"
          aria-label="לפריט הבא"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Slide Content Column: Image on Top, Compact Caption Below */}
        <div
          key={currentItem.number}
          onMouseDown={(e) => e.stopPropagation()}
          className={`w-full max-w-4xl flex flex-col items-center gap-3 sm:gap-4 ${
            slideDirection === 'left' ? 'animate-slide-left' : 'animate-slide-right'
          }`}
        >
          {/* 1. HERO IMAGE FRAME */}
          <div className="relative w-full flex items-center justify-center">
            {currentItem.imageUrl ? (
              <img
                src={currentItem.imageUrl}
                referrerPolicy="no-referrer"
                alt={`Major #${currentItem.numberStr} - ${resolvedWord}`}
                className={`w-auto max-w-full object-contain rounded-xl shadow-[0_24px_80px_rgba(0,0,0,0.85)] border border-white/10 transition-all duration-300 ${
                  isEditingSlide ? 'max-h-[40vh] sm:max-h-[45vh]' : 'max-h-[58vh] sm:max-h-[64vh]'
                }`}
              />
            ) : (
              <div className="w-full max-w-lg py-12 px-6 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                  <ImagePlus className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">
                    אין עדיין תמונה למספר Major #{currentItem.numberStr}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    צור תמונה עם Gemini AI או העלה תמונה מהמכשיר.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenImageGenerator?.(currentItem)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>שנה תמונה</span>
                </button>
              </div>
            )}
          </div>

          {saveSuccessNotice && (
            <div className="text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/35 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-fade-in">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{saveSuccessNotice}</span>
            </div>
          )}

          {/* 2. COMPACT TEXTUAL CAPTION / INLINE EDITOR BELOW IMAGE */}
          <div className="w-full max-w-3xl text-right">
            {!isEditingSlide ? (
              <div className="bg-slate-950/75 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-md space-y-2">
                <div className="flex items-center justify-between gap-3 flex-wrap text-xs sm:text-[13px]">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div>
                      <span className="text-[11px] font-semibold text-amber-400/90 ml-1.5">מילת עוגן:</span>
                      <span className="font-semibold text-white">
                        {resolvedWord || '(טרם הוגדר)'}
                      </span>
                    </div>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <div>
                      <span className="text-[11px] font-semibold text-teal-400/90 ml-1.5">עיצורים:</span>
                      <span className="font-mono text-slate-200">{currentItem.consonants || '—'}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingSlide(true)}
                    className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="ערוך ערכי Major"
                    aria-label="ערוך ערכי Major"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed">
                    <span className="text-[11px] font-semibold text-amber-300/90 ml-1.5">סצנה / רמז:</span>
                    {currentItem.imageHint?.trim() || 'טרם הוזן תיאור סצנה.'}
                  </p>
                </div>
              </div>
            ) : (
              /* Compact Inline Edit Form below the image */
              <div className="bg-slate-950/95 border border-white/15 rounded-2xl p-3.5 sm:p-4 space-y-3 backdrop-blur-md shadow-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <label className="text-[11px] font-semibold text-amber-400">מילת עוגן / חפץ</label>
                      <AIFieldGeneratorButton
                        promptType="major_word"
                        inputContext={currentItem.numberStr}
                        extraContext={currentItem.consonants}
                        customDigits={majorDigits}
                        connectingLetters={connectingLetters}
                        onGenerated={(val) => setEditWord(val)}
                        label="AI"
                        compact
                      />
                    </div>
                    <input
                      type="text"
                      value={editWord}
                      onChange={(e) => setEditWord(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveSlideEdits();
                        }
                      }}
                      placeholder="מילת עוגן..."
                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-medium text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-teal-400 block">עיצורים פונטיים</span>
                    <div className="bg-slate-900/70 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-xs sm:text-sm text-teal-300">
                      {currentItem.consonants || '—'}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[11px] font-semibold text-amber-300">סצנה / רמז ויזואלי</label>
                    <AIFieldGeneratorButton
                      promptType="major_hint"
                      inputContext={editWord || resolvedWord}
                      extraContext={currentItem.numberStr}
                      customDigits={majorDigits}
                      connectingLetters={connectingLetters}
                      onGenerated={(val) => setEditHint(val)}
                      label="סצנה עם AI"
                      compact
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={editHint}
                    onChange={(e) => setEditHint(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSaveSlideEdits();
                      }
                    }}
                    placeholder="תאר סצנה חיה ורב-חושית..."
                    className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-white focus:outline-none leading-relaxed"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Slim Bottom Lightbox Filmstrip */}
      <footer
        onMouseDown={(e) => e.stopPropagation()}
        ref={thumbnailListRef}
        className="w-full flex items-center gap-1.5 overflow-x-auto px-4 py-2 bg-black/75 border-t border-white/10 scroll-smooth shrink-0 z-20"
      >
        {items.map((it, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={it.number}
              type="button"
              data-thumb-index={idx}
              onClick={() => goToIndex(idx)}
              className={`shrink-0 flex items-center gap-1.5 p-1 rounded-lg border transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-600/90 text-white border-emerald-400 shadow-md'
                  : 'bg-white/5 hover:bg-white/12 text-slate-400 border-white/10 opacity-75 hover:opacity-100'
              }`}
            >
              {it.imageUrl ? (
                <img
                  src={it.imageUrl}
                  referrerPolicy="no-referrer"
                  alt={it.defaultWord}
                  className="w-7 h-7 object-cover rounded shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded bg-white/10 flex items-center justify-center text-[10px] font-mono text-slate-400">
                  {it.numberStr}
                </div>
              )}
              <span className="font-mono text-[11px] font-semibold px-1 tabular-nums">#{it.numberStr}</span>
            </button>
          );
        })}
      </footer>
    </div>
  );
};
