import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  Edit3,
  Maximize2,
  ImagePlus,
  Play,
  Pause,
  Shuffle,
  X,
  ArrowRight,
} from 'lucide-react';
import { PAOItem } from '../../types/memory';
import { getPAOInitials } from '../../lib/paoInitials';

interface PAOGalleryCarouselProps {
  items: PAOItem[];
  initialIndex?: number;
  onClose?: () => void;
  onEditItem?: (number: number) => void;
  onOpenImagePreview?: (item: PAOItem) => void;
  onOpenImageGenerator?: (item: PAOItem) => void;
  onToggleReady?: (number: number, currentState?: boolean) => void;
}

export const PAOGalleryCarousel: React.FC<PAOGalleryCarouselProps> = ({
  items,
  initialIndex = 0,
  onClose,
  onEditItem,
  onOpenImagePreview,
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

  // Keep index within bounds if items change
  useEffect(() => {
    if (currentIndex >= items.length) {
      setCurrentIndex(Math.max(0, items.length - 1));
    }
  }, [items.length, currentIndex]);

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

  // Keyboard navigation & Light Dismiss via Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
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
  }, [goToNext, goToPrev, onClose]);

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
    if (!thumbnailListRef.current) return;
    const activeThumb = thumbnailListRef.current.querySelector<HTMLButtonElement>(
      `[data-thumb-index="${currentIndex}"]`
    );
    if (activeThumb) {
      activeThumb.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [currentIndex]);

  // Mobile Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartXRef.current;
    touchStartXRef.current = null;

    if (Math.abs(deltaX) > 45) {
      // Swipe left on RTL advances forward, swipe right goes back
      if (deltaX < 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
  };

  if (items.length === 0) {
    return (
      <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4 my-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
          <ImagePlus className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white">אין שלשות להצגה בגלריה</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          לא נמצאו פריטים התואמים לחיפוש או לסינון הנוכחי.
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
    );
  }

  const currentItem = items[currentIndex];
  const initialsObj = getPAOInitials(currentItem.number);

  return (
    <div
      onClick={(e) => {
        // Light dismiss: if user clicks directly on the outer backdrop container (sides)
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
      className="w-full space-y-4 animate-fadeIn select-none p-1 sm:p-2"
    >
      {/* Top Gallery Header Bar */}
      <div className="flex items-center justify-between bg-slate-950/90 border border-slate-800/90 px-4 py-3 rounded-2xl flex-wrap gap-2.5 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700/80 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="חזרה לתצוגת רשת (Esc או לחיצה מחוץ לתמונה)"
            >
              <ArrowRight className="w-4 h-4" />
              <span>חזרה לתצוגת רשת (Esc)</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="font-mono text-sm sm:text-base font-black px-3 py-1 rounded-xl bg-gradient-to-r from-pink-500/20 to-indigo-500/20 text-pink-300 border border-pink-500/30">
              #{currentItem.numberStr}
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              שלשה {currentIndex + 1} מתוך {items.length}
            </span>
          </div>
        </div>

        {/* Center/Right Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Autoplay button */}
          <button
            type="button"
            onClick={() => setIsAutoPlaying((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isAutoPlaying
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80'
            }`}
            title="ניגון אוטומטי רציף של הגלריה"
          >
            {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAutoPlaying ? 'השהה ניגון' : 'ניגון אוטומטי'}</span>
          </button>

          {/* Random button */}
          <button
            type="button"
            onClick={goToRandom}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 flex items-center gap-1.5 transition-all cursor-pointer"
            title="קפיצה לשלשה אקראית"
          >
            <Shuffle className="w-3.5 h-3.5 text-purple-400" />
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
            className="bg-slate-900 border border-slate-700 text-indigo-300 text-xs font-mono font-bold rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
          >
            {items.map((it) => (
              <option key={it.number} value={it.number}>
                #{it.numberStr} - {it.person || 'שלשה'}
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

      {/* Main Hero Carousel Viewport: Image Fills Full Screen/Width, Text Below */}
      <div
        className="relative w-full rounded-3xl bg-slate-950 border-2 border-indigo-500/30 p-3 sm:p-5 shadow-2xl overflow-hidden flex flex-col"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Arrow: Right (Previous in RTL) */}
        <button
          type="button"
          onClick={goToPrev}
          className="absolute right-3 sm:right-6 top-[32%] z-30 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-950/85 hover:bg-indigo-600 text-white border border-slate-700 hover:border-indigo-400 shadow-2xl flex items-center justify-center transition-all cursor-pointer active:scale-90 group backdrop-blur-md"
          title="לשלשה הקודמת (חץ ימינה ➔)"
        >
          <ChevronRight className="w-7 h-7 group-hover:scale-110 transition-transform" />
        </button>

        {/* Navigation Arrow: Left (Next in RTL) */}
        <button
          type="button"
          onClick={goToNext}
          className="absolute left-3 sm:left-6 top-[32%] z-30 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-950/85 hover:bg-indigo-600 text-white border border-slate-700 hover:border-indigo-400 shadow-2xl flex items-center justify-center transition-all cursor-pointer active:scale-90 group backdrop-blur-md"
          title="לשלשה הבאה (חץ שמאלה ⬅)"
        >
          <ChevronLeft className="w-7 h-7 group-hover:scale-110 transition-transform" />
        </button>

        {/* Slide Container */}
        <div
          key={currentItem.number}
          className={`w-full flex flex-col gap-5 ${
            slideDirection === 'left' ? 'animate-slide-left' : 'animate-slide-right'
          }`}
        >
          {/* 1. TOP: Full-Screen / Full-Width Enlarged Image Viewport */}
          <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-800 bg-black/80 flex items-center justify-center max-h-[62vh] min-h-[340px] sm:min-h-[460px] shadow-inner group">
            {currentItem.imageUrl ? (
              <>
                <img
                  src={currentItem.imageUrl}
                  alt={`PAO #${currentItem.numberStr} - ${currentItem.person}`}
                  className="w-full h-full max-h-[62vh] object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                />

                {/* Floating Quick Action Overlay on Image */}
                <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenImagePreview?.(currentItem)}
                    className="p-2 rounded-xl bg-black/60 hover:bg-indigo-600 text-white backdrop-blur-md border border-white/10 shadow-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                    title="הגדל תמונה במסך מלא (Full Light Dismiss Modal)"
                  >
                    <Maximize2 className="w-4 h-4" />
                    <span className="hidden sm:inline">הגדלה מלאה</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenImageGenerator?.(currentItem)}
                    className="p-2 rounded-xl bg-gradient-to-r from-indigo-600/90 to-pink-600/90 hover:from-indigo-500 hover:to-pink-500 text-white backdrop-blur-md border border-white/10 shadow-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                    title="צור תמונה מחדש עם Gemini"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span className="hidden sm:inline">יצירה מחדש (AI)</span>
                  </button>
                </div>

                {/* Bottom subtle tag on image */}
                <div className="absolute bottom-3 right-3 z-20 px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-white text-xs font-mono font-bold">
                  #{currentItem.numberStr} • {currentItem.person}
                </div>
              </>
            ) : (
              /* High-impact placeholder if no image exists yet */
              <div className="w-full py-16 px-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl">
                  <ImagePlus className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base sm:text-lg font-black text-white">
                    אין עדיין תמונה לשלשת PAO #{currentItem.numberStr}
                  </h4>
                  <p className="text-xs text-indigo-200/80 max-w-md mx-auto">
                    הפק דימוי מנמוני חי ומרהיב של הסצנה באמצעות Gemini AI בלחיצת כפתור אחת.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenImageGenerator?.(currentItem)}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-black text-sm rounded-2xl flex items-center gap-2.5 shadow-xl shadow-indigo-600/30 cursor-pointer transition-all active:scale-95"
                >
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>צור תמונה עם Gemini</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. BOTTOM: Full Textual Information Directly Below The Image */}
          <div className="w-full bg-slate-900/95 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-right space-y-4 shadow-xl">
            {/* Header: Number, Initials, Ready Toggle & Edit */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5 flex-wrap gap-2.5">
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl sm:text-3xl font-black px-4 py-1.5 rounded-2xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/40 shadow-inner">
                  #{currentItem.numberStr}
                </span>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-amber-400 block">
                    אותיות פונטיות: {initialsObj.initials}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    עיצורי Major: {initialsObj.fullFormula}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onToggleReady && (
                  <button
                    type="button"
                    onClick={() => onToggleReady(currentItem.number, currentItem.is_ready_for_practice)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      currentItem.is_ready_for_practice
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{currentItem.is_ready_for_practice ? 'מוכן לתרגול' : 'סמן כמוכן'}</span>
                  </button>
                )}

                {onEditItem && (
                  <button
                    type="button"
                    onClick={() => onEditItem(currentItem.number)}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
                    title="ערוך שלשת PAO זו"
                  >
                    <Edit3 className="w-4 h-4 text-indigo-400" />
                  </button>
                )}
              </div>
            </div>

            {/* 3 Core Fields Grid (Person, Action, Object) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950/80 border border-amber-500/30 p-3.5 rounded-2xl">
                <span className="text-xs font-bold text-amber-400 block mb-1">👤 אדם (Person):</span>
                <span className="text-sm sm:text-base font-black text-slate-100 block">
                  {currentItem.person || '(טרם הוגדר)'}
                </span>
              </div>
              <div className="bg-slate-950/80 border border-purple-500/30 p-3.5 rounded-2xl">
                <span className="text-xs font-bold text-purple-400 block mb-1">⚡ פעולה (Action):</span>
                <span className="text-sm sm:text-base font-black text-slate-100 block">
                  {currentItem.action || '(טרם הוגדר)'}
                </span>
              </div>
              <div className="bg-slate-950/80 border border-teal-500/30 p-3.5 rounded-2xl">
                <span className="text-xs font-bold text-teal-400 block mb-1">📦 חפץ (Object):</span>
                <span className="text-sm sm:text-base font-black text-slate-100 block">
                  {currentItem.object || '(טרם הוגדר)'}
                </span>
              </div>
            </div>

            {/* 4th Field: Full Scene Description */}
            <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-amber-500/35 rounded-2xl p-4 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs sm:text-sm font-black text-amber-300">
                  🎬 סצנה שלמה (תיאור מנמוני רב-חושי):
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                "{currentItem.scene || 'טרם הוזנה סצנה שלמה. מומלץ לתאר אינטראקציה חיה ורב-חושית.'}"
              </p>
            </div>
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
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md scale-105 ring-2 ring-indigo-400/40'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {it.imageUrl ? (
                <img
                  src={it.imageUrl}
                  alt={it.numberStr}
                  className="w-8 h-8 object-cover rounded-lg shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-mono text-slate-400">
                  {it.numberStr}
                </div>
              )}
              <span className="font-mono text-xs font-bold px-1">#{it.numberStr}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
