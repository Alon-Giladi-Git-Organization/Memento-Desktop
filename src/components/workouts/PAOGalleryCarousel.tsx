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
import { PAOItem, MajorItem } from '../../types/memory';
import { DEFAULT_PAO_ITEMS } from '../../data/defaultAssociations';
import { getPAOInitials } from '../../lib/paoInitials';
import { AIFieldGeneratorButton } from '../AIFieldGeneratorButton';

interface PAOGalleryCarouselProps {
  items: PAOItem[];
  majorDigits?: MajorItem[];
  majorItems?: MajorItem[];
  connectingLetters?: string[];
  initialIndex?: number;
  onClose?: () => void;
  onEditItem?: (number: number) => void;
  onUpdateItem?: (
    number: number,
    updates: { person?: string; action?: string; object?: string; scene?: string }
  ) => void;
  onOpenImagePreview?: (item: PAOItem) => void;
  onOpenImageGenerator?: (item: PAOItem) => void;
  onToggleReady?: (number: number, currentState?: boolean) => void;
}

export const PAOGalleryCarousel: React.FC<PAOGalleryCarouselProps> = ({
  items,
  majorDigits,
  majorItems,
  connectingLetters,
  initialIndex = 0,
  onClose,
  onEditItem,
  onUpdateItem,
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

  const [isEditingSlide, setIsEditingSlide] = useState(false);
  const [editPerson, setEditPerson] = useState('');
  const [editAction, setEditAction] = useState('');
  const [editObject, setEditObject] = useState('');
  const [editScene, setEditScene] = useState('');
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

  const currentItem = items[currentIndex];

  // Resolve Object value reliably (falling back to Major anchor word or default PAO object if empty)
  const resolvedObject = currentItem
    ? (currentItem.object && currentItem.object.trim()) ||
      ((currentItem as any).defaultObject && String((currentItem as any).defaultObject).trim()) ||
      ((currentItem as any).defaultWord && String((currentItem as any).defaultWord).trim()) ||
      majorItems?.find((m) => m.number === currentItem.number)?.defaultWord?.trim() ||
      DEFAULT_PAO_ITEMS.find((d) => d.number === currentItem.number)?.object?.trim() ||
      ''
    : '';

  // Sync draft edit values whenever active slide item changes
  useEffect(() => {
    if (currentItem) {
      setEditPerson(currentItem.person || '');
      setEditAction(currentItem.action || '');
      setEditObject(resolvedObject);
      setEditScene(currentItem.scene || '');
      setIsEditingSlide(false);
      setSaveSuccessNotice(null);
    }
  }, [currentItem?.number]);

  // Keep draft fields updated if item changes externally while not editing
  useEffect(() => {
    if (currentItem && !isEditingSlide) {
      setEditPerson(currentItem.person || '');
      setEditAction(currentItem.action || '');
      setEditObject(resolvedObject);
      setEditScene(currentItem.scene || '');
    }
  }, [currentItem?.person, currentItem?.action, resolvedObject, currentItem?.scene, isEditingSlide]);

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
          className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4 my-6"
        >
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
      </div>
    );
  }

  const initialsObj = getPAOInitials(currentItem.number, majorDigits);

  const handleSaveSlideEdits = () => {
    if (onUpdateItem) {
      onUpdateItem(currentItem.number, {
        person: editPerson.trim(),
        action: editAction.trim(),
        object: editObject.trim(),
        scene: editScene.trim(),
      });
      setSaveSuccessNotice('הערכים עודכנו בהצלחה!');
      setTimeout(() => setSaveSuccessNotice(null), 3000);
      setIsEditingSlide(false);
    } else if (onEditItem) {
      onEditItem(currentItem.number);
    }
  };

  const handleCancelSlideEdits = () => {
    setEditPerson(currentItem.person || '');
    setEditAction(currentItem.action || '');
    setEditObject(resolvedObject);
    setEditScene(currentItem.scene || '');
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
              className="p-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700/80 transition-all cursor-pointer flex items-center gap-1.5 text-xs sm:text-sm font-bold"
              title="חזרה לתצוגת רשת (Esc או לחיצה מחוץ לתמונה)"
            >
              <ArrowRight className="w-4 h-4" />
              <span>חזרה לתצוגת רשת (Esc)</span>
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <span className="font-mono text-base sm:text-lg font-black px-3.5 py-1 rounded-xl bg-gradient-to-r from-pink-500/20 to-indigo-500/20 text-pink-300 border border-pink-500/30">
              #{currentItem.numberStr}
            </span>
            <span className="text-xs sm:text-sm text-slate-300 hidden sm:inline font-medium">
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
            title="קפיצה לשלשה אקראית"
          >
            <Shuffle className="w-4 h-4 text-purple-400" />
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
            className="bg-slate-900 border border-slate-700 text-indigo-300 text-xs sm:text-sm font-mono font-bold rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
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

      {/* Main Hero Carousel Viewport: Side-by-Side Text Panel & Enlarged Image */}
      <div
        className="relative w-full rounded-2xl sm:rounded-3xl bg-slate-950/95 border-2 border-indigo-500/30 p-2 sm:p-3.5 md:p-4 shadow-2xl overflow-hidden flex flex-col"
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
          {/* 1. RIGHT SIDE (in RTL): Full Textual Information & Inline Editing at Image Height */}
          <div className="lg:col-span-5 xl:col-span-5 bg-slate-900/95 border border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-right flex flex-col justify-between gap-4 shadow-xl lg:h-[74vh] lg:min-h-[500px] lg:max-h-[760px] overflow-y-auto">
            <div className="space-y-4">
              {/* Header: Number, Initials, Ready Toggle & Edit */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5 flex-wrap gap-2.5">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-2xl sm:text-3xl font-black px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/40 shadow-inner">
                    #{currentItem.numberStr}
                  </span>
                  <div>
                    <span className="text-sm sm:text-base font-bold text-amber-400 block">
                      אותיות פונטיות: {initialsObj.initials}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-300 font-medium">
                      עיצורי Major: {initialsObj.fullFormula}
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
                      className="px-3.5 py-2 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/35 hover:border-indigo-500/50 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="ערוך את ערכי ה-PAO והסצנה ישירות בגלריה"
                    >
                      <Edit3 className="w-4 h-4 text-indigo-400" />
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
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>שמור</span>
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
                <div className="space-y-3.5">
                  {/* 3 Core Fields Stack (Person, Action, Object) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
                    <div className="bg-slate-950/90 border border-amber-500/35 p-3.5 sm:p-4 rounded-2xl">
                      <span className="text-sm sm:text-base font-bold text-amber-400 block mb-1">
                        👤 אדם (Person):
                      </span>
                      <span className="text-lg sm:text-xl md:text-2xl font-black text-white leading-snug block break-words">
                        {currentItem.person?.trim() || '(טרם הוגדר)'}
                      </span>
                    </div>
                    <div className="bg-slate-950/90 border border-purple-500/35 p-3.5 sm:p-4 rounded-2xl">
                      <span className="text-sm sm:text-base font-bold text-purple-400 block mb-1">
                        ⚡ פעולה (Action):
                      </span>
                      <span className="text-lg sm:text-xl md:text-2xl font-black text-white leading-snug block break-words">
                        {currentItem.action?.trim() || '(טרם הוגדר)'}
                      </span>
                    </div>
                    <div className="bg-slate-950/90 border border-teal-500/40 p-3.5 sm:p-4 rounded-2xl">
                      <span className="text-sm sm:text-base font-bold text-teal-400 block mb-1">
                        📦 חפץ (Object):
                      </span>
                      <span className="text-lg sm:text-xl md:text-2xl font-black text-white leading-snug block break-words">
                        {resolvedObject || '(טרם הוגדר)'}
                      </span>
                    </div>
                  </div>

                  {/* 4th Field: Full Scene Description */}
                  <div className="bg-gradient-to-br from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-2 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                      <span className="text-sm sm:text-base font-black text-amber-300">
                        🎬 סצנה שלמה (תיאור מנמוני רב-חושי):
                      </span>
                    </div>
                    <p className="text-base sm:text-lg md:text-xl text-white leading-relaxed font-semibold">
                      "{currentItem.scene?.trim() || 'טרם הוזנה סצנה שלמה. מומלץ לתאר אינטראקציה חיה ורב-חושית.'}"
                    </p>
                  </div>
                </div>
              ) : (
                /* Inline Editable Mode with AI Field Generators */
                <div className="space-y-3.5 pt-0.5">
                  <div className="grid grid-cols-1 gap-3">
                    {/* Person Input */}
                    <div className="bg-slate-950/90 border border-amber-500/40 p-3.5 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm sm:text-base font-bold text-amber-400">👤 אדם (Person):</label>
                        <AIFieldGeneratorButton
                          promptType="pao_person"
                          inputContext={currentItem.numberStr}
                          paoContext={{
                            number: currentItem.number,
                            numberStr: currentItem.numberStr,
                            person: editPerson,
                            action: editAction,
                            object: editObject,
                            scene: editScene,
                          }}
                          customDigits={majorDigits}
                          connectingLetters={connectingLetters}
                          onGenerated={(val) => setEditPerson(val)}
                          label="AI"
                          compact
                        />
                      </div>
                      <input
                        type="text"
                        value={editPerson}
                        onChange={(e) => setEditPerson(e.target.value)}
                        placeholder="שם הדמות..."
                        className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-base sm:text-lg font-bold text-white focus:outline-none"
                      />
                    </div>

                    {/* Action Input */}
                    <div className="bg-slate-950/90 border border-purple-500/40 p-3.5 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm sm:text-base font-bold text-purple-400">⚡ פעולה (Action):</label>
                        <AIFieldGeneratorButton
                          promptType="pao_action"
                          inputContext={currentItem.numberStr}
                          paoContext={{
                            number: currentItem.number,
                            numberStr: currentItem.numberStr,
                            person: editPerson,
                            action: editAction,
                            object: editObject,
                            scene: editScene,
                          }}
                          customDigits={majorDigits}
                          connectingLetters={connectingLetters}
                          onGenerated={(val) => setEditAction(val)}
                          label="AI"
                          compact
                        />
                      </div>
                      <input
                        type="text"
                        value={editAction}
                        onChange={(e) => setEditAction(e.target.value)}
                        placeholder="פעולה קינטית..."
                        className="w-full bg-slate-900 border border-slate-700 focus:border-purple-500 rounded-xl px-3.5 py-2 text-base sm:text-lg font-bold text-white focus:outline-none"
                      />
                    </div>

                    {/* Object Input */}
                    <div className="bg-slate-950/90 border border-teal-500/40 p-3.5 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm sm:text-base font-bold text-teal-400">📦 חפץ (Object):</label>
                        <AIFieldGeneratorButton
                          promptType="pao_object"
                          inputContext={currentItem.numberStr}
                          paoContext={{
                            number: currentItem.number,
                            numberStr: currentItem.numberStr,
                            person: editPerson,
                            action: editAction,
                            object: editObject,
                            scene: editScene,
                          }}
                          customDigits={majorDigits}
                          connectingLetters={connectingLetters}
                          onGenerated={(val) => setEditObject(val)}
                          label="AI"
                          compact
                        />
                      </div>
                      <input
                        type="text"
                        value={editObject}
                        onChange={(e) => setEditObject(e.target.value)}
                        placeholder="חפץ פסיבי מובחן..."
                        className="w-full bg-slate-900 border border-slate-700 focus:border-teal-500 rounded-xl px-3.5 py-2 text-base sm:text-lg font-bold text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Scene Input */}
                  <div className="bg-slate-950/90 border border-amber-500/40 p-3.5 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <label className="text-sm sm:text-base font-bold text-amber-300">
                          🎬 סצנה שלמה:
                        </label>
                      </div>
                      <AIFieldGeneratorButton
                        promptType="pao_scene"
                        inputContext={currentItem.numberStr}
                        paoContext={{
                          number: currentItem.number,
                          numberStr: currentItem.numberStr,
                          person: editPerson,
                          action: editAction,
                          object: editObject,
                          scene: editScene,
                        }}
                        customDigits={majorDigits}
                        connectingLetters={connectingLetters}
                        onGenerated={(val) => setEditScene(val)}
                        label="סצנה עם AI"
                        compact
                      />
                    </div>
                    <textarea
                      rows={3}
                      value={editScene}
                      onChange={(e) => setEditScene(e.target.value)}
                      placeholder="תאר סצנה חיה, הומוריסטית ורב-חושית המשלבת את הדמות, הפעולה והחפץ יחד..."
                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-base sm:text-lg text-white focus:outline-none leading-relaxed"
                    />
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCancelSlideEdits}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                      >
                        ביטול
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveSlideEdits}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>שמור שינויים</span>
                      </button>
                    </div>
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
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-slate-950/85 hover:bg-indigo-600 text-white border border-slate-700 hover:border-indigo-400 shadow-2xl flex items-center justify-center transition-all cursor-pointer active:scale-90 group/nav backdrop-blur-md"
              title="לשלשה הקודמת (חץ ימינה ➔)"
            >
              <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7 group-hover/nav:scale-110 transition-transform" />
            </button>

            {/* Navigation Arrow: Left (Next in RTL) — anchored inside image viewport */}
            <button
              type="button"
              onClick={goToNext}
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-slate-950/85 hover:bg-indigo-600 text-white border border-slate-700 hover:border-indigo-400 shadow-2xl flex items-center justify-center transition-all cursor-pointer active:scale-90 group/nav backdrop-blur-md"
              title="לשלשה הבאה (חץ שמאלה ⬅)"
            >
              <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7 group-hover/nav:scale-110 transition-transform" />
            </button>

            {currentItem.imageUrl ? (
              <>
                <img
                  src={currentItem.imageUrl}
                  alt={`PAO #${currentItem.numberStr} - ${currentItem.person}`}
                  className="w-full h-full max-h-[74vh] object-contain transition-transform duration-500 group-hover:scale-[1.01] drop-shadow-2xl"
                />

                {/* Floating Quick Action Overlay on Image (Regenerate with AI only) */}
                <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenImageGenerator?.(currentItem)}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600/90 to-pink-600/90 hover:from-indigo-500 hover:to-pink-500 text-white backdrop-blur-md border border-white/10 shadow-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs sm:text-sm font-bold"
                    title="צור תמונה מחדש עם Gemini"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span className="hidden sm:inline">יצירה מחדש (AI)</span>
                  </button>
                </div>

                {/* Bottom subtle tag on image */}
                <div className="absolute bottom-3 right-3 z-20 px-3.5 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-white text-xs sm:text-sm font-mono font-bold">
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
                  <p className="text-xs sm:text-sm text-indigo-200/80 max-w-md mx-auto">
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
    </div>
  );
};
