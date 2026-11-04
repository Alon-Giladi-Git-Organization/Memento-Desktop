import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ArrowRight,
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

  // Lock body scroll while gallery modal is open so background never scrolls
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
  }, [goToNext, goToPrev, onClose, isEditingSlide, editWord, editHint, currentIndex]);

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

  const currentItem = items[currentIndex];

  const resolvedWord = currentItem
    ? (currentItem.defaultWord && currentItem.defaultWord.trim()) ||
      DEFAULT_MAJOR_00_99.find((d) => d.number === currentItem.number)?.defaultWord?.trim() ||
      ''
    : '';

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
        // Swiped Left in RTL -> Next item
        goToNext();
      } else {
        // Swiped Right in RTL -> Prev item
        goToPrev();
      }
    }
    touchStartXRef.current = null;
  };

  if (items.length === 0 || !currentItem) {
    return (
      <div
        onMouseDown={(e) => {
          if (e.target === e.currentTarget && onClose) onClose();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) onClose();
        }}
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md overflow-y-auto flex items-center justify-center p-4 animate-fadeIn"
      >
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md py-16 px-4 text-center rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <ImagePlus className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">אין פריטים להצגה בגלריה</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            לא נמצאו פריטי Major התואמים לחיפוש או לסינון הנוכחי.
          </p>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              חזרה לתצוגת כוורת
            </button>
          )}
        </div>
      </div>
    );
  }

  const handleSaveSlideEdits = () => {
    if (onUpdateMajorItem) {
      onUpdateMajorItem(currentItem.number, {
        defaultWord: editWord.trim(),
        imageHint: editHint.trim(),
      });
      setSaveSuccessNotice('הערכים עודכנו בהצלחה!');
      setTimeout(() => setSaveSuccessNotice(null), 3000);
      setIsEditingSlide(false);
    } else if (onEditItem) {
      onEditItem(currentItem.number);
    }
  };

  const handleCancelSlideEdits = () => {
    setEditWord(resolvedWord);
    setEditHint(currentItem.imageHint || '');
    setIsEditingSlide(false);
  };

  return (
    <div
      onMouseDown={(e) => {
        // Light dismiss: close when clicking on the sides of the screen (the backdrop)
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
      onClick={(e) => {
        // Light dismiss: close when clicking on the sides of the screen (the backdrop)
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md overflow-y-auto flex flex-col items-center justify-start p-1 sm:p-2.5 md:p-3.5 animate-fadeIn"
    >
      <div
        className="w-full max-w-[98vw] 2xl:max-w-[1750px] my-auto space-y-3 sm:space-y-4 select-none relative"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
      {/* Top Gallery Header Bar */}
      <div className="flex items-center justify-between bg-slate-950/90 border border-slate-800/90 px-4 py-3 rounded-2xl flex-wrap gap-2.5 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-emerald-600 text-slate-300 hover:text-white border border-slate-700/80 transition-all cursor-pointer flex items-center gap-1.5 text-xs sm:text-sm font-bold"
              title="חזרה לתצוגת רשת (Esc)"
            >
              <ArrowRight className="w-4 h-4" />
              <span>חזרה לתצוגת רשת (Esc)</span>
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <span className="font-mono text-base sm:text-lg font-black px-3.5 py-1 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30">
              #{currentItem.numberStr}
            </span>
            <span className="text-xs sm:text-sm text-slate-300 hidden sm:inline font-medium">
              פריט {currentIndex + 1} מתוך {items.length}
            </span>
          </div>
        </div>

        {/* Center/Right Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Autoplay button */}
          <button
            type="button"
            onClick={() => setIsAutoPlaying((prev) => !prev)}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isAutoPlaying
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80'
            }`}
            title="ניגון אוטומטי רציף של הגלריה"
          >
            {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isAutoPlaying ? 'השהה ניגון' : 'ניגון אוטומטי'}</span>
          </button>

          {/* Random button */}
          <button
            type="button"
            onClick={goToRandom}
            className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 flex items-center gap-1.5 transition-all cursor-pointer"
            title="קפיצה לפריט אקראי"
          >
            <Shuffle className="w-4 h-4 text-teal-400" />
            <span>אקראי</span>
          </button>

          {/* Quick Jump Dropdown */}
          <select
            value={currentItem.number}
            onChange={(e) => {
              const num = parseInt(e.target.value, 10);
              const targetIdx = items.findIndex((it) => it.number === num);
              if (targetIdx !== -1) goToIndex(targetIdx);
            }}
            className="bg-slate-900 border border-slate-700 text-emerald-300 text-xs sm:text-sm font-mono font-bold rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
          >
            {items.map((it) => (
              <option key={it.number} value={it.number}>
                #{it.numberStr} - {it.defaultWord || 'מספר'}
              </option>
            ))}
          </select>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer mr-1"
              title="סגור גלריה (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Hero Carousel Viewport: Side-by-Side Text Panel & Enlarged Image */}
      <div
        className="relative w-full rounded-2xl sm:rounded-3xl bg-slate-950/95 border-2 border-emerald-500/30 p-2 sm:p-3.5 md:p-4 shadow-2xl overflow-hidden flex flex-col"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slide Container: Side-by-Side Layout (Text Panel on Right, Image on Left in RTL) */}
        <div
          key={currentItem.number}
          className={`w-full grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-stretch ${
            slideDirection === 'left' ? 'animate-slide-left' : 'animate-slide-right'
          }`}
        >
          {/* 1. RIGHT SIDE (in RTL): Full Textual Information & In-Gallery Editing at Image Height */}
          <div className="lg:col-span-5 xl:col-span-5 bg-slate-900/95 border border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-right flex flex-col justify-between gap-4 shadow-xl lg:h-[74vh] lg:min-h-[500px] lg:max-h-[760px] overflow-y-auto">
            <div className="space-y-4">
              {/* Header: Number, Consonants, Ready Toggle & In-Gallery Edit Controls */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5 flex-wrap gap-2.5">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-2xl sm:text-3xl font-black px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-inner">
                    #{currentItem.numberStr}
                  </span>
                  <div>
                    <span className="text-sm sm:text-base font-bold text-amber-400 block">
                      עיצורי Major: {currentItem.consonants || '—'}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-300 font-medium">
                      מילת עוגן: {resolvedWord || '(טרם הוגדרה)'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {onToggleReady && (
                    <button
                      type="button"
                      onClick={() => onToggleReady(currentItem.number, currentItem.is_ready_for_practice)}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        currentItem.is_ready_for_practice
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{currentItem.is_ready_for_practice ? 'מוכן לתרגול' : 'סמן כמוכן'}</span>
                    </button>
                  )}

                  {/* In-Gallery Edit Toggle Button or Save / Cancel Buttons */}
                  {!isEditingSlide ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingSlide(true)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/35 hover:border-emerald-500/50 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="ערוך את מילת העוגן והסצנה ישירות בגלריה"
                    >
                      <Edit3 className="w-4 h-4 text-emerald-400" />
                      <span>עריכת ערכים</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCancelSlideEdits}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs sm:text-sm font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>ביטול</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveSlideEdits}
                        title="שמור שינויים (ניתן גם ללחוץ Enter)"
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>שמור (Enter)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {saveSuccessNotice && (
                <div className="text-sm font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-2.5 rounded-xl flex items-center gap-2 animate-fade-in">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{saveSuccessNotice}</span>
                </div>
              )}

              {/* View Mode vs Inline Edit Mode */}
              {!isEditingSlide ? (
                <div className="space-y-4">
                  {/* 1. Anchor Word Display */}
                  <div className="bg-slate-950/90 border border-amber-500/35 p-4 sm:p-5 rounded-2xl">
                    <span className="text-sm sm:text-base font-bold text-amber-400 block mb-1.5">
                      🏷️ מילת עוגן / חפץ (Word):
                    </span>
                    <span className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-snug block break-words">
                      {resolvedWord || '(טרם הוגדר)'}
                    </span>
                  </div>

                  {/* 2. Scene / Visual Hint Display */}
                  <div className="bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-2 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                      <span className="text-sm sm:text-base font-black text-amber-300">
                        🎬 סצנה שלמה / רמז ויזואלי (Scene Hint):
                      </span>
                    </div>
                    <p className="text-base sm:text-lg md:text-xl text-white leading-relaxed font-semibold">
                      "{currentItem.imageHint?.trim() || 'טרם הוזנה סצנה. מומלץ לתאר חפץ או אינטראקציה ויזואלית חיה.'}"
                    </p>
                  </div>
                </div>
              ) : (
                /* Inline Editable Mode with AI Field Generators */
                <div className="space-y-3.5 pt-0.5">
                  {/* Anchor Word Input with AI Generator */}
                  <div className="bg-slate-950/90 border border-amber-500/40 p-3.5 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm sm:text-base font-bold text-amber-400">🏷️ מילת עוגן / חפץ:</label>
                      <AIFieldGeneratorButton
                        promptType="major_word"
                        inputContext={currentItem.numberStr}
                        extraContext={currentItem.consonants}
                        customDigits={majorDigits}
                        connectingLetters={connectingLetters}
                        onGenerated={(val) => setEditWord(val)}
                        label="חולל עם AI"
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
                      placeholder="מילת עוגן (לדוגמה: סם, גג)..."
                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-base sm:text-lg font-bold text-white focus:outline-none"
                    />
                  </div>

                  {/* Consonants Info Badge */}
                  <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-center">
                    <span className="text-sm font-bold text-slate-300 block mb-1">עיצורים פונטיים נדרשים:</span>
                    <span className="font-mono text-base sm:text-lg font-black text-teal-300">
                      {currentItem.consonants || '—'}
                    </span>
                  </div>

                  {/* Scene / Visual Hint Input with AI Generator */}
                  <div className="bg-slate-950/90 border border-amber-500/40 p-3.5 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <label className="text-sm sm:text-base font-bold text-amber-300">
                          🎬 סצנה / רמז ויזואלי:
                        </label>
                      </div>
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
                      rows={4}
                      value={editHint}
                      onChange={(e) => setEditHint(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSaveSlideEdits();
                        }
                      }}
                      placeholder="תאר סצנה חיה, הומוריסטית ורב-חושית הממקמת את החפץ בצורה מנמונית בלתי נשכחת..."
                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-base sm:text-lg text-white focus:outline-none leading-relaxed"
                    />
                    <p className="text-xs text-slate-400 text-left">
                      לחץ <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-200">Enter</kbd> לשמירה מהירה
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. LEFT SIDE (in RTL): Enlarged Wide Image Viewport at Matching Height */}
          <div className="lg:col-span-7 xl:col-span-7 relative w-full rounded-xl sm:rounded-2xl overflow-hidden border border-slate-800/90 bg-black/90 flex items-center justify-center lg:h-[74vh] lg:min-h-[500px] lg:max-h-[760px] min-h-[360px] sm:min-h-[460px] shadow-inner group">
            {/* Navigation Arrow: Right (Previous in RTL) — anchored inside image viewport so it never covers the text panel */}
            <button
              type="button"
              onClick={goToPrev}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-slate-950/85 hover:bg-emerald-600 text-white border border-slate-700 hover:border-emerald-400 shadow-2xl flex items-center justify-center transition-all cursor-pointer active:scale-90 group/nav backdrop-blur-md"
              title="לפריט הקודם (חץ ימינה ➔)"
            >
              <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7 group-hover/nav:scale-110 transition-transform" />
            </button>

            {/* Navigation Arrow: Left (Next in RTL) — anchored inside image viewport */}
            <button
              type="button"
              onClick={goToNext}
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-slate-950/85 hover:bg-emerald-600 text-white border border-slate-700 hover:border-emerald-400 shadow-2xl flex items-center justify-center transition-all cursor-pointer active:scale-90 group/nav backdrop-blur-md"
              title="לפריט הבא (חץ שמאלה ⬅)"
            >
              <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7 group-hover/nav:scale-110 transition-transform" />
            </button>

            {currentItem.imageUrl ? (
              <>
                <img
                  src={currentItem.imageUrl}
                  alt={`Major #${currentItem.numberStr} - ${resolvedWord}`}
                  className="w-full h-full max-h-[74vh] object-contain transition-transform duration-500 group-hover:scale-[1.01] drop-shadow-2xl"
                />

                {/* Floating Quick Action Overlay on Image (Change Image: Upload or AI) */}
                <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenImageGenerator?.(currentItem)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 text-white backdrop-blur-md border border-white/10 shadow-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs sm:text-sm font-bold"
                    title="שנה תמונה (יצירה עם AI או העלאת תמונה)"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>שנה תמונה</span>
                  </button>
                </div>

                {/* Bottom subtle tag on image */}
                <div className="absolute bottom-3 right-3 z-20 px-3.5 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-white text-xs sm:text-sm font-mono font-bold">
                  #{currentItem.numberStr} • {resolvedWord}
                </div>
              </>
            ) : (
              /* High-impact placeholder if no image exists yet */
              <div className="w-full py-16 px-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl">
                  <ImagePlus className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base sm:text-lg font-black text-white">
                    אין עדיין תמונה למספר Major #{currentItem.numberStr}
                  </h4>
                  <p className="text-xs sm:text-sm text-emerald-200/80 max-w-md mx-auto">
                    הפק דימוי מנמוני חי ומרהיב של מילת העוגן והסצנה באמצעות Gemini AI או העלה תמונה בלחיצת כפתור.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenImageGenerator?.(currentItem)}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl flex items-center gap-2.5 shadow-xl shadow-emerald-600/30 cursor-pointer transition-all active:scale-95"
                >
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>שנה תמונה</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Thumbnail Scrub Strip */}
      <div
        ref={thumbnailListRef}
        className="flex items-center gap-2 overflow-x-auto p-2.5 bg-slate-950/90 rounded-2xl border border-slate-800/80 scroll-smooth max-w-full"
      >
        {items.map((it, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={it.number}
              type="button"
              data-thumb-index={idx}
              onClick={() => goToIndex(idx)}
              className={`shrink-0 flex items-center gap-1.5 p-1.5 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-500/20 border-emerald-400 shadow-md shadow-emerald-500/30 scale-105'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
              }`}
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/60 border border-slate-800 flex items-center justify-center shrink-0">
                {it.imageUrl ? (
                  <img src={it.imageUrl} alt={it.defaultWord} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-mono text-xs font-bold text-slate-400">#{it.numberStr}</span>
                )}
              </div>
              <div className="text-right pl-1 min-w-[50px]">
                <span className="font-mono text-[11px] font-black text-emerald-300 block">
                  #{it.numberStr}
                </span>
                <span className="text-[10px] text-slate-300 block truncate max-w-[80px]">
                  {it.defaultWord || '—'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      </div>
    </div>
  );
};
