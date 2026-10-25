import React, { useState, useEffect } from 'react';
import {
  Hash,
  Search,
  Filter,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Edit3,
  Save,
  Undo2,
  Trash2,
  Plus,
  Wand2,
  Sliders,
  Sparkles,
  BookOpen,
  Check,
  ArrowLeft,
  AlertTriangle,
  X,
  Package,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MajorItem, PAOItem } from '../../types/memory';
import { isHebrewFuzzyMatch, isHebrewMultiFieldSearchMatch } from '../../lib/fuzzyMatch';
import { AIFieldGeneratorButton } from '../AIFieldGeneratorButton';
import {
  validateHebrewLogic,
  checkMajorDuplicates,
  DEFAULT_CONNECTING_LETTERS,
  getLiveMajorConsonants,
  useIgnoredValidations,
  buildLogicIgnoreKey,
} from '../../lib/hebrewLogicValidator';
import {
  getCurrentOrInitialDeckItem,
  advanceToNextDeckItem,
  resetQuizDeck,
  DeckProgress,
} from '../../lib/quizDeckManager';
import { QuizDeckProgressBar } from '../QuizDeckProgressBar';

interface MajorModuleProps {
  majorDigits: MajorItem[];
  connectingLetters?: string[];
  majorItems: MajorItem[];
  paoItems?: PAOItem[];
  onEarnPoints: (amount: number, reason?: string) => void;
  onUnlockBadge: (badge: string) => void;
  onUpdateMajorDigit: (digit: number, consonants: string, word?: string, hint?: string) => void;
  onResetMajorDigit: (digit: number) => void;
  onRecalculateMajor00_99FromDigits: (customDigits?: MajorItem[]) => void;
  onAddMajorItem?: (item: MajorItem) => void;
  onUpdateMajorItem: (
    number: number,
    updates: {
      defaultWord?: string;
      consonants?: string;
      imageHint?: string;
      customNotes?: string;
      is_ready_for_practice?: boolean;
    }
  ) => void;
  onDeleteMajorItem?: (number: number) => void;
  onResetMajorItem: (number: number) => void;
  onOpenSummary?: (techniqueId: string) => void;
  onToggleMajorReady?: (number: number, explicitState?: boolean) => void;
  onSetAllMajorReady?: (ready: boolean, numbers?: number[]) => void;
  onNavigateToLogicTab?: () => void;
  onSyncMajorAndPAOObjects?: (direction: 'majorToPao' | 'paoToMajor') => void;
}

export const MajorModule: React.FC<MajorModuleProps> = ({
  majorDigits,
  connectingLetters = DEFAULT_CONNECTING_LETTERS,
  majorItems,
  paoItems = [],
  onEarnPoints,
  onUnlockBadge,
  onRecalculateMajor00_99FromDigits,
  onAddMajorItem,
  onUpdateMajorItem,
  onDeleteMajorItem,
  onResetMajorItem,
  onOpenSummary,
  onToggleMajorReady,
  onSetAllMajorReady,
  onNavigateToLogicTab,
}) => {
  const { isIgnored, ignoreValidation } = useIgnoredValidations();
  const [subView, setSubView] = useState<'table' | 'digits' | 'quiz'>('table');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [decadeFilter, setDecadeFilter] = useState('all');
  const [onlyReadyFilter, setOnlyReadyFilter] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Ready for practice items calculation (Strict Whitelist Filtering)
  const readyItems = majorItems.filter((item) => Boolean(item.is_ready_for_practice));
  const allMajorReady =
    majorItems.length > 0 && majorItems.every((item) => Boolean(item.is_ready_for_practice));

  // Editing Major Item (0-99) via Expanded Modal Container
  const [editingNum, setEditingNum] = useState<number | null>(null);
  const [editWord, setEditWord] = useState('');
  const [editHint, setEditHint] = useState('');

  // Validation alert modal state
  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details?: string;
    ignoreKey?: string;
    onConfirmBypass?: () => void;
  } | null>(null);

  // Light Dismiss via Escape key for MAJOR Edit Modal & Validation Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (validationModal?.isOpen) {
          setValidationModal(null);
          return;
        }
        if (editingNum !== null) {
          setEditingNum(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingNum, validationModal]);

  const handleOpenEditModal = (item: MajorItem) => {
    setEditingNum(item.number);
    setEditWord(item.defaultWord || '');
    setEditHint(item.imageHint || '');
  };

  const handleSaveItem = (itemNum: number, bypassValidation = false) => {
    const wordToSave = editWord.trim();
    if (!bypassValidation && wordToSave) {
      // 1. Check duplicate
      const dup = checkMajorDuplicates(majorItems, itemNum, wordToSave);
      if (dup.hasDuplicate) {
        setValidationModal({
          isOpen: true,
          title: 'הודעת ולידציה: ערך כפול',
          message: dup.message,
          details: `המילה "${wordToSave}" כבר מוגדרת עבור מספר אחר (${dup.conflictingNumberStr}). מומלץ שלכל מספר תהיה אסוציאציה בלעדית.`,
          onConfirmBypass: () => handleSaveItem(itemNum, true),
        });
        return;
      }

      // 2. Check logic conformity (unless ignored)
      const logicIgnoreKey = buildLogicIgnoreKey('major-word', itemNum, wordToSave);
      if (!isIgnored(logicIgnoreKey)) {
        const logicRes = validateHebrewLogic(wordToSave, itemNum, majorDigits, connectingLetters, 'major');
        if (!logicRes.isValid) {
          setValidationModal({
            isOpen: true,
            title: 'הודעת ולידציה: חריגה מהלוגיקה',
            message: logicRes.message,
            details: logicRes.details,
            ignoreKey: logicIgnoreKey,
            onConfirmBypass: () => {
              ignoreValidation(logicIgnoreKey);
              handleSaveItem(itemNum, true);
            },
          });
          return;
        }
      }
    }

    const liveCons =
      getLiveMajorConsonants(itemNum, majorDigits) ||
      majorItems.find((m) => m.number === itemNum)?.consonants ||
      '';

    onUpdateMajorItem(itemNum, {
      defaultWord: wordToSave,
      consonants: liveCons,
      imageHint: editHint.trim(),
    });
    setEditingNum(null);
    setValidationModal(null);
  };

  const handleToggleItemReady = (itemNumber: number, currentState?: boolean) => {
    if (onToggleMajorReady) {
      onToggleMajorReady(itemNumber, !currentState);
    } else {
      onUpdateMajorItem(itemNumber, { is_ready_for_practice: !currentState });
    }
  };

  // Add New Major Item Modal/State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [newWord, setNewWord] = useState('');
  const [newHint, setNewHint] = useState('');

  // Quiz State (Strictly over readyItems via non-repeating permutation cycle)
  const [deckProgress, setDeckProgress] = useState<DeckProgress | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [userGuess, setUserGuess] = useState('');
  const [quizFeedback, setQuizFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [revealHint, setRevealHint] = useState(false);
  const [isQuizEditing, setIsQuizEditing] = useState(false);
  const [quizEditWord, setQuizEditWord] = useState('');
  const [quizEditHint, setQuizEditHint] = useState('');

  // Peek/Mount quiz question when switching to quiz subview without advancing
  useEffect(() => {
    if (subView === 'quiz' && readyItems.length > 0) {
      const { item, progress } = getCurrentOrInitialDeckItem('workout_major', readyItems, (i) => i.number);
      if (item) {
        const idx = readyItems.findIndex((x) => x.number === item.number);
        if (idx >= 0) setQuizIndex(idx);
      }
      setDeckProgress(progress);
      setUserGuess('');
      setQuizFeedback('idle');
      setRevealHint(false);
    }
  }, [subView, readyItems.length]);

  // Safe item for the quiz
  const safeQuizIndex = readyItems.length > 0 ? quizIndex % readyItems.length : 0;
  const currentQuizItem = readyItems.length > 0 ? readyItems[safeQuizIndex] : null;

  // Jump to specific number in table
  const [highlightedNum, setHighlightedNum] = useState<number | null>(null);

  const scrollToNumber = (num: number) => {
    setDecadeFilter('all');
    setOnlyReadyFilter(false);
    setHighlightedNum(num);
    setTimeout(() => {
      const el = document.getElementById(`major-item-${num}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
    setTimeout(() => {
      setHighlightedNum(null);
    }, 2500);
  };

  const handleNextQuestion = () => {
    if (readyItems.length === 0) return;
    const { item, progress } = advanceToNextDeckItem('workout_major', readyItems, (i) => i.number);
    if (item) {
      const idx = readyItems.findIndex((x) => x.number === item.number);
      if (idx >= 0) setQuizIndex(idx);
    }
    setDeckProgress(progress);
    setUserGuess('');
    setQuizFeedback('idle');
    setRevealHint(false);
    setIsQuizEditing(false);
  };

  const handleCheckAnswer = () => {
    if (!currentQuizItem) return;
    const guess = userGuess.trim();
    if (!guess) return;

    const defaultWord = (currentQuizItem.defaultWord || '').trim();
    const isExactMatch = isHebrewFuzzyMatch(guess, defaultWord);

    if (isExactMatch) {
      setQuizFeedback('correct');
      onEarnPoints(15, 'מענה נכון במבחן Major');
      onUnlockBadge('שליטה בעיצורים (Major)');
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } else {
      setQuizFeedback('incorrect');
    }
  };

  const handleSaveQuizEdit = (bypass = false) => {
    if (!currentQuizItem) return;
    const wordToSave = quizEditWord.trim();

    if (!bypass && wordToSave) {
      const dup = checkMajorDuplicates(majorItems, currentQuizItem.number, wordToSave);
      if (dup.hasDuplicate) {
        setValidationModal({
          isOpen: true,
          title: 'הודעת ולידציה: ערך כפול',
          message: dup.message,
          details: `המילה "${wordToSave}" כבר מוגדרת עבור מספר ${dup.conflictingNumberStr}.`,
          onConfirmBypass: () => handleSaveQuizEdit(true),
        });
        return;
      }

      const logicIgnoreKey = buildLogicIgnoreKey('major-word', currentQuizItem.number, wordToSave);
      if (!isIgnored(logicIgnoreKey)) {
        const logicRes = validateHebrewLogic(wordToSave, currentQuizItem.number, majorDigits, connectingLetters, 'major');
        if (!logicRes.isValid) {
          setValidationModal({
            isOpen: true,
            title: 'הודעת ולידציה: חריגה מהלוגיקה',
            message: logicRes.message,
            details: logicRes.details,
            ignoreKey: logicIgnoreKey,
            onConfirmBypass: () => {
              ignoreValidation(logicIgnoreKey);
              handleSaveQuizEdit(true);
            },
          });
          return;
        }
      }
    }

    const liveCons =
      getLiveMajorConsonants(currentQuizItem.number, majorDigits) ||
      currentQuizItem.consonants ||
      '';

    onUpdateMajorItem(currentQuizItem.number, {
      defaultWord: wordToSave,
      consonants: liveCons,
      imageHint: quizEditHint.trim(),
    });
    setIsQuizEditing(false);
    setValidationModal(null);
    onEarnPoints(10, 'עדכון אסוציאציה מתוך מבחן השליפה');
  };

  const handleAddNewItem = (e?: React.FormEvent, bypass = false) => {
    if (e && e.preventDefault) e.preventDefault();
    const num = parseInt(newNumber, 10);
    if (isNaN(num)) return;
    const numStr = num < 10 && num >= 0 ? `0${num}` : `${num}`;
    const wordToSave = newWord.trim();

    if (!bypass && wordToSave) {
      const dup = checkMajorDuplicates(majorItems, num, wordToSave);
      if (dup.hasDuplicate) {
        setValidationModal({
          isOpen: true,
          title: 'הודעת ולידציה: ערך כפול',
          message: dup.message,
          details: `המילה "${wordToSave}" כבר מוגדרת עבור מספר ${dup.conflictingNumberStr}.`,
          onConfirmBypass: () => handleAddNewItem(undefined, true),
        });
        return;
      }

      const logicIgnoreKey = buildLogicIgnoreKey('major-word', num, wordToSave);
      if (!isIgnored(logicIgnoreKey)) {
        const logicRes = validateHebrewLogic(wordToSave, num, majorDigits, connectingLetters, 'major');
        if (!logicRes.isValid) {
          setValidationModal({
            isOpen: true,
            title: 'הודעת ולידציה: חריגה מהלוגיקה',
            message: logicRes.message,
            details: logicRes.details,
            ignoreKey: logicIgnoreKey,
            onConfirmBypass: () => {
              ignoreValidation(logicIgnoreKey);
              handleAddNewItem(undefined, true);
            },
          });
          return;
        }
      }
    }

    const liveCons = getLiveMajorConsonants(num, majorDigits) || '';

    if (onAddMajorItem) {
      onAddMajorItem({
        number: num,
        numberStr: numStr,
        defaultWord: wordToSave,
        consonants: liveCons,
        imageHint: newHint.trim(),
        is_ready_for_practice: true,
      });
    }

    setNewNumber('');
    setNewWord('');
    setNewHint('');
    setShowAddForm(false);
    setValidationModal(null);
  };

  const filteredItems = majorItems.filter((item) => {
    if (onlyReadyFilter && !item.is_ready_for_practice) return false;

    const matchesSearch = isHebrewMultiFieldSearchMatch(
      search,
      item.numberStr,
      item.number,
      item.defaultWord,
      item.consonants,
      item.imageHint
    );

    if (decadeFilter === 'all') return matchesSearch;
    const decade = parseInt(decadeFilter, 10);
    const matchesDecade = item.number >= decade && item.number < decade + 10;
    return matchesSearch && matchesDecade;
  });

  return (
    <div className="w-full max-w-none bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm space-y-6 text-slate-900">
      {/* Header and Sub-Tabs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b-2 border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Hash className="w-5 h-5 text-[#58CC02]" />
              <span>שיטת Major - המרת מספרים לאותיות ודימויים</span>
            </h2>
            {onOpenSummary && (
              <button
                onClick={() => onOpenSummary('major')}
                className="btn-duo-neutral inline-flex items-center gap-1.5 px-3 py-1 text-xs cursor-pointer"
                title="צפה בסיכום הטכניקה ודוגמאות מעשיות"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#58CC02]" />
                <span>סיכום ודוגמאות</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            ניהול והתאמה אישית של מאגר המספרים (0-100) ותרגול שליפה לשיטת מז'ור
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border-2 border-slate-200 self-stretch md:self-auto justify-center flex-wrap">
          <button
            onClick={() => setSubView('table')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              subView === 'table'
                ? 'bg-[#58CC02] text-white border-b-2 border-[#46a302] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Hash className="w-4 h-4" />
            <span>מאגר מספרים 0-100 ({majorItems.length})</span>
          </button>
          <button
            onClick={() => setSubView('digits')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              subView === 'digits'
                ? 'bg-[#58CC02] text-white border-b-2 border-[#46a302] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>מיפוי ספרות 0-9 (עריכת לוגיקה)</span>
          </button>
          <button
            onClick={() => setSubView('quiz')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              subView === 'quiz'
                ? 'bg-[#58CC02] text-white border-b-2 border-[#46a302] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>מבחן שליפה ({readyItems.length} מוכנים)</span>
          </button>
        </div>
      </div>

      {/* Connecting Letters Rule Note / חוק אותיות הקישור (Live Data Binding from Numbers Logic) */}
      <div className="bg-gradient-to-r from-sky-50 via-white to-indigo-50 border border-sky-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-right">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 border border-sky-300 flex items-center justify-center font-bold shrink-0 text-lg shadow-xs">
            💡
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-sky-900">
                חוק אותיות החיבור (מסונכרן בזמן אמת מהמוח הלוגי):
              </span>
              <span className="text-sm font-mono font-bold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-lg border border-sky-300">
                {connectingLetters.length > 0 ? connectingLetters.map((l) => `${l}'`).join(', ') : 'ללא אותיות חיבור'}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              אותיות אלו שקופות לחלוטין ומשמשות כחומרי קישור חופשיים. כל מילות המאגר מבוססות <strong>אך ורק</strong> על עיצורי המספר עצמו לפי לוגיקת הספרות + אותיות החיבור הפעילות.
            </p>
          </div>
        </div>
      </div>

      {/* SUB-VIEW 2: TABLE 00-99 & CUSTOM */}
      {/* דפוס M3 מספר 3: Fade Through (דהייה והחלפה קונטקסטואלית)
          נבחר עבור החלפת תתי-המצבים בשיטת Major: מאגר 00-99, מיפוי ספרות 0-9 ומבחן שליפה.
          לפי Google Material Motion, שינוי מצב תוכן ראשי דוהה החוצה ונכנס בריכוך עדין למניעת הבהוב. */}
      {subView === 'table' && (
        <div key="major-table" className="space-y-4 m3-fade-through">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-4 h-4 absolute right-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="חיפוש מספר, מילה או אות..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={decadeFilter}
                  onChange={(e) => setDecadeFilter(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900 text-white">כל העשורים</option>
                  {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map((d) => (
                    <option key={d} value={d} className="bg-slate-900 text-white">
                      {d === 0 ? 'ספרות 0-9' : `עשור ${d} (${d}-${d + 9})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ready for Practice Filter Button */}
              <button
                onClick={() => setOnlyReadyFilter(!onlyReadyFilter)}
                className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  onlyReadyFilter
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
                title="סנן והצג רק פריטים שסומנו כמוכנים לתרגול"
              >
                <CheckCircle2 className={`w-4 h-4 ${onlyReadyFilter ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>מוכנים בלבד ({readyItems.length})</span>
              </button>

              {/* View Mode Toggle (כוורת vs. רשימה) */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="תצוגת כוורת (כרטיסים)"
                >
                  <span>⊞</span>
                  <span>כוורת</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="תצוגת רשימה (נוחה לעיניים)"
                >
                  <span>☰</span>
                  <span>רשימה</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Single Bulk Ready Toggle Button */}
              {onSetAllMajorReady && (
                <div className="flex items-center gap-1.5 text-xs">
                  {allMajorReady ? (
                    <button
                      type="button"
                      onClick={() => onSetAllMajorReady(false)}
                      className="text-xs font-bold text-white bg-slate-950 hover:bg-black border border-slate-700 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                      title="הסר את כל המספרים מסטטוס מוכן לתרגול"
                    >
                      הסר הכל מסטטוס מוכן לתרגול
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onSetAllMajorReady(true);
                        onEarnPoints(20, 'סימון כל מספרי Major כמוכנים לתרגול');
                      }}
                      className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                      title="סמן את כל המספרים כמוכנים לתרגול"
                    >
                      סמן הכל כמוכן לתרגול
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl transition-all cursor-pointer shrink-0 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>הוסף מספר ואסוציאציה</span>
              </button>
            </div>
          </div>

          {/* Quick Number Navigator Bar */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-inner">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-amber-400 ml-1">סרגל עשורים וניווט מהיר:</span>
              {[
                { label: '0-9', min: 0 },
                { label: '10-19', min: 10 },
                { label: '20-29', min: 20 },
                { label: '30-39', min: 30 },
                { label: '40-49', min: 40 },
                { label: '50-59', min: 50 },
                { label: '60-69', min: 60 },
                { label: '70-79', min: 70 },
                { label: '80-89', min: 80 },
                { label: '90-99', min: 90 },
              ].map((dec) => (
                <button
                  key={dec.min}
                  onClick={() => scrollToNumber(dec.min)}
                  className="text-[10px] font-mono font-bold px-2 py-1 rounded-lg bg-slate-900 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer"
                >
                  {dec.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
              <span className="text-[10px] text-slate-400">קפוץ למספר:</span>
              <select
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) scrollToNumber(val);
                }}
                defaultValue=""
                className="bg-slate-900 border border-slate-700 text-amber-300 text-xs rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
              >
                <option value="" disabled>בחר מספר...</option>
                {majorItems.map((item) => (
                  <option key={item.number} value={item.number}>
                    #{item.numberStr} - {item.defaultWord}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Add New Item Form */}
          {showAddForm && (
            <form
              onSubmit={handleAddNewItem}
              className="bg-slate-950 border border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-3 animate-fadeIn"
            >
              <h4 className="text-xs font-bold text-amber-400">הוספת מספר ואסוציאציה חדשה למאגר</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-right">
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold mb-1">
                    המספר (למשל 100):
                  </label>
                  <input
                    type="number"
                    required
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 font-semibold">
                      מילת/חפץ עוגן (עצם מוחשי):
                    </label>
                    <AIFieldGeneratorButton
                      promptType="major_word"
                      inputContext={newNumber}
                      extraContext={
                        newNumber && !isNaN(parseInt(newNumber, 10))
                          ? getLiveMajorConsonants(parseInt(newNumber, 10), majorDigits)
                          : ''
                      }
                      paoContext={{ number: newNumber, object: newWord }}
                      customDigits={majorDigits}
                      connectingLetters={connectingLetters}
                      onGenerated={(val) => setNewWord(val)}
                      label="חפץ עם AI"
                      compact
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    placeholder="חפץ או עצם מוחשי בלבד..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 font-semibold">
                      סצנה קינטית:
                    </label>
                    <AIFieldGeneratorButton
                      promptType="major_hint"
                      inputContext={newNumber}
                      extraContext={newWord}
                      paoContext={{ number: newNumber, object: newWord, scene: newHint }}
                      customDigits={majorDigits}
                      connectingLetters={connectingLetters}
                      onGenerated={(val) => setNewHint(val)}
                      label="סצנה עם AI"
                      compact
                    />
                  </div>
                  <input
                    type="text"
                    value={newHint}
                    onChange={(e) => setNewHint(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-400"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                >
                  שמור למאגר
                </button>
              </div>
            </form>
          )}

          {/* דפוס M3 מספר 3: Fade Through (דהייה והחלפה בין כוורת לרשימה) */}
          <div key={viewMode} className="flex gap-4 items-start m3-fade-through">
            {viewMode === 'grid' ? (
              /* Main Cards Grid */
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 max-h-[640px] overflow-y-auto pr-1 scroll-smooth">
                {filteredItems.map((item) => {
                  const isEditing = editingNum === item.number;
                  const activeWord = item.defaultWord || '';
                  const activeConsonants =
                    getLiveMajorConsonants(item.number, majorDigits) || item.consonants || '';
                  const activeHint = item.imageHint || '';
                  const logicIgnoreKey = buildLogicIgnoreKey('major-word', item.number, activeWord);
                  const rawWordValidation = activeWord.trim()
                    ? validateHebrewLogic(activeWord, item.number, majorDigits, connectingLetters, 'major')
                    : { isValid: true, message: '' };
                  const wordValidation = isIgnored(logicIgnoreKey)
                    ? { isValid: true, message: '' }
                    : rawWordValidation;

                  const matchingPao = paoItems.find((p) => p.number === item.number);
                  const paoObj = matchingPao?.object?.trim() || '';
                  const mismatchIgnoreKey = buildLogicIgnoreKey(
                    'major-pao-mismatch',
                    item.number,
                    activeWord,
                    paoObj
                  );
                  const hasPaoMismatch =
                    Boolean(activeWord.trim() && paoObj && activeWord.trim() !== paoObj) &&
                    !isIgnored(mismatchIgnoreKey);

                  const isHighlighted = highlightedNum === item.number;

                  // דפוס M3 מספר 4: Shape Morphing / Expressive Spring (שינוי צורה וקפיציות בכרטיס Major)
                  return (
                    <div
                      id={`major-item-${item.number}`}
                      key={item.number}
                      className={`bg-slate-950 border rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between m3-shape-morph ${
                        isEditing
                          ? 'border-amber-400 ring-2 ring-amber-400/30'
                          : !wordValidation.isValid || hasPaoMismatch
                          ? 'border-amber-500/70 ring-1 ring-amber-500/30'
                          : item.is_ready_for_practice
                          ? 'border-emerald-500/60 ring-2 ring-emerald-500/20 bg-emerald-950/15'
                          : isHighlighted
                          ? 'border-amber-400 ring-4 ring-amber-400/30 scale-[1.02] shadow-xl shadow-amber-500/20 bg-amber-950/20'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xl font-black text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                              {item.numberStr}
                            </span>
                            <span
                              className="text-xs text-amber-300/80 font-mono font-bold"
                              title="עיצורים מסונכרנים בזמן אמת ממודולת לוגיקת הספרות"
                            >
                              [{activeConsonants}]
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={() => handleOpenEditModal(item)}
                              className="relative z-10 w-8 h-8 p-1.5 rounded-xl text-slate-300 hover:text-amber-300 hover:bg-amber-500/15 cursor-pointer inline-flex items-center justify-center transition-colors"
                              title="ערוך מספר בחלון עריכה מורחב"
                            >
                              <Edit3 className="w-4 h-4 pointer-events-none" />
                            </button>
                            {onDeleteMajorItem && (
                              <button
                                onClick={() => onDeleteMajorItem(item.number)}
                                className="p-1.5 text-slate-600 hover:text-rose-400 cursor-pointer"
                                title="מחק מהמאגר"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-bold text-white tracking-wide">{activeWord}</h4>
                          </div>
                          {!wordValidation.isValid && (
                            <div
                              title={wordValidation.details || wordValidation.message}
                              className="w-full flex flex-col gap-1.5 px-2.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/50 text-amber-300 text-[11px] font-bold leading-snug"
                            >
                              <div className="flex items-start gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <span>{wordValidation.message}</span>
                              </div>
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => ignoreValidation(logicIgnoreKey)}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-amber-200 border border-amber-500/40 cursor-pointer transition-colors"
                                >
                                  התעלם במקרה זה
                                </button>
                              </div>
                            </div>
                          )}
                          {hasPaoMismatch && (
                            <div className="w-full flex flex-col gap-1.5 px-2.5 py-2 rounded-xl bg-sky-500/15 border border-sky-500/50 text-sky-200 text-[11px] font-bold leading-snug">
                              <div className="flex items-start gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                                <span>
                                  לתשומת לבך - במודולת PAO הגדרת חפץ אחר עבור מספר זה ("{paoObj}") ; מומלץ לבחור באותה המילה עבור 2 המודולות
                                </span>
                              </div>
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => ignoreValidation(mismatchIgnoreKey)}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-sky-200 border border-sky-500/40 cursor-pointer transition-colors"
                                >
                                  התעלם במקרה זה
                                </button>
                              </div>
                            </div>
                          )}
                          {activeHint && (
                            <p className="text-xs text-slate-300 bg-slate-900/80 p-2 rounded-xl border border-slate-800 leading-relaxed">
                              ⚡ {activeHint}
                            </p>
                          )}
                        </div>

                        {/* Ready for Practice Checkbox */}
                        <div className="pt-2.5 mt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <label className="inline-flex items-center gap-2 cursor-pointer select-none py-1.5 px-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 transition-all">
                            <input
                              type="checkbox"
                              checked={Boolean(item.is_ready_for_practice)}
                              onChange={() => handleToggleItemReady(item.number, item.is_ready_for_practice)}
                              className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                            />
                            <span className={`text-xs font-bold ${item.is_ready_for_practice ? 'text-emerald-400' : 'text-slate-400'}`}>
                              מוכן לתרגול
                            </span>
                          </label>
                          {item.is_ready_for_practice && (
                            <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>מוכן</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* List View (רשימה נקייה, מרווחת ונוחה לעין) */
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-inner max-h-[640px] overflow-y-auto">
                <table className="w-full text-right border-collapse">
                  <thead className="bg-slate-900/90 sticky top-0 z-10 border-b border-slate-800 text-xs font-bold text-slate-400">
                    <tr>
                      <th className="py-3 px-4 w-16 text-center">מספר</th>
                      <th className="py-3 px-4 w-28">עיצורים</th>
                      <th className="py-3 px-4 w-48">מילה (חפץ מוחשי)</th>
                      <th className="py-3 px-4">דימוי חושי קינטי</th>
                      <th className="py-3 px-4 w-32 text-center">מוכן לתרגול</th>
                      <th className="py-3 px-4 w-24 text-left">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {filteredItems.map((item) => {
                      const activeWord = item.defaultWord || '';
                      const activeConsonants =
                        getLiveMajorConsonants(item.number, majorDigits) || item.consonants || '';
                      const activeHint = item.imageHint || '';
                      const logicIgnoreKey = buildLogicIgnoreKey('major-word', item.number, activeWord);
                      const rawWordValidation = activeWord.trim()
                        ? validateHebrewLogic(activeWord, item.number, majorDigits, connectingLetters, 'major')
                        : { isValid: true, message: '' };
                      const wordValidation = isIgnored(logicIgnoreKey)
                        ? { isValid: true, message: '' }
                        : rawWordValidation;

                      const matchingPao = paoItems.find((p) => p.number === item.number);
                      const paoObj = matchingPao?.object?.trim() || '';
                      const mismatchIgnoreKey = buildLogicIgnoreKey(
                        'major-pao-mismatch',
                        item.number,
                        activeWord,
                        paoObj
                      );
                      const hasPaoMismatch =
                        Boolean(activeWord.trim() && paoObj && activeWord.trim() !== paoObj) &&
                        !isIgnored(mismatchIgnoreKey);

                      return (
                        <tr
                          key={item.number}
                          id={`major-item-${item.number}`}
                          className={`hover:bg-slate-900/60 transition-colors ${
                            item.is_ready_for_practice ? 'bg-emerald-950/10' : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-center font-mono font-black text-amber-400 text-base">
                            {item.numberStr}
                          </td>
                          <td className="py-3 px-4 font-mono text-amber-300 font-semibold text-xs">
                            {activeConsonants}
                          </td>
                          <td className="py-3 px-4 font-bold text-white text-base">
                            <div className="flex flex-col gap-1.5">
                              <span>{activeWord}</span>
                              {!wordValidation.isValid && (
                                <div
                                  title={wordValidation.details || wordValidation.message}
                                  className="inline-flex flex-col gap-1 text-[11px] text-amber-300 bg-amber-500/15 border border-amber-500/40 rounded-lg px-2 py-1.5 font-bold leading-snug"
                                >
                                  <div className="flex items-start gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                    <span>{wordValidation.message}</span>
                                  </div>
                                  <div className="flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => ignoreValidation(logicIgnoreKey)}
                                      className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-amber-200 border border-amber-500/40 cursor-pointer"
                                    >
                                      התעלם במקרה זה
                                    </button>
                                  </div>
                                </div>
                              )}
                              {hasPaoMismatch && (
                                <div className="inline-flex flex-col gap-1 text-[11px] text-sky-200 bg-sky-500/15 border border-sky-500/40 rounded-lg px-2 py-1.5 font-bold leading-snug">
                                  <div className="flex items-start gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                                    <span>
                                      לתשומת לבך - במודולת PAO הגדרת חפץ אחר עבור מספר זה ("{paoObj}") ; מומלץ לבחור באותה המילה עבור 2 המודולות
                                    </span>
                                  </div>
                                  <div className="flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => ignoreValidation(mismatchIgnoreKey)}
                                      className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-sky-200 border border-sky-500/40 cursor-pointer"
                                    >
                                      התעלם במקרה זה
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-300">
                            {activeHint || <span className="text-slate-600 italic">ללא סצנה</span>}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none py-1 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-all">
                              <input
                                type="checkbox"
                                checked={Boolean(item.is_ready_for_practice)}
                                onChange={() => handleToggleItemReady(item.number, item.is_ready_for_practice)}
                                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                              />
                              <span className={`text-xs font-bold ${item.is_ready_for_practice ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {item.is_ready_for_practice ? 'מוכן' : 'לא מוכן'}
                              </span>
                            </label>
                          </td>
                          <td className="py-3 px-4 text-left">
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                type="button"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={() => handleOpenEditModal(item)}
                                className="w-8 h-8 p-1.5 rounded-xl text-slate-300 hover:text-amber-300 hover:bg-amber-500/15 cursor-pointer inline-flex items-center justify-center transition-colors"
                                title="ערוך שורה בחלון עריכה מורחב"
                              >
                                <Edit3 className="w-4 h-4 pointer-events-none" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Vertical Sticky Side Index for 1-100 */}
            <div className="hidden lg:flex flex-col gap-1 bg-slate-950 p-2 rounded-2xl border border-slate-800 max-h-[580px] overflow-y-auto no-scrollbar shrink-0 w-16 text-center shadow-inner">
              <span className="text-[10px] font-bold text-slate-400 pb-1 border-b border-slate-800">מספר</span>
              {majorItems.map((item) => (
                <button
                  key={item.number}
                  onClick={() => scrollToNumber(item.number)}
                  title={`#${item.numberStr} - ${item.defaultWord}`}
                  className={`text-xs font-mono py-1 rounded-lg transition-colors cursor-pointer ${
                    highlightedNum === item.number
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-amber-300 hover:bg-slate-900'
                  }`}
                >
                  {item.numberStr}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW: DIGITS 0-9 ANCHOR WORDS (No Consonant Editing Here — Consonants Edited Only in Numbers Logic) */}
      {subView === 'digits' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Explanation Banner */}
          <div className="bg-slate-950 border border-amber-500/30 rounded-3xl p-5 sm:p-6 space-y-3 shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-amber-400 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  <span>חפצי עוגן לספרות היסוד (0-9)</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  כאן ניתן לערוך את חפצי העוגן והסצנות של ספרות 0-9. עריכת העיצורים עצמם מתבצעת אך ורק במודולת "לוגיקת מספרים".
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {onNavigateToLogicTab && (
                  <button
                    type="button"
                    onClick={onNavigateToLogicTab}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>ערוך עיצורים בלוגיקת מספרים</span>
                  </button>
                )}
                {onRecalculateMajor00_99FromDigits && (
                  <button
                    onClick={() => {
                      onRecalculateMajor00_99FromDigits(majorDigits);
                      onEarnPoints(25, 'חישוב מחדש של מאגר 00-99 לפי מיפוי הספרות');
                      setSyncToast('מאגר 00-99 חושב ועודכן בהצלחה!');
                      setTimeout(() => setSyncToast(null), 3000);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-md shrink-0 flex items-center gap-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>החל מיפוי על כל 00-99</span>
                  </button>
                )}
              </div>
            </div>

            {syncToast && (
              <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{syncToast}</span>
              </div>
            )}

            {/* Connecting Letters Reminder */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-right">
              <div className="space-y-1">
                <span className="text-xs font-bold text-sky-400 block">אותיות החיבור השקופות (מסונכרנות בזמן אמת):</span>
                <span className="font-mono font-black text-base text-sky-300">
                  {connectingLetters.length > 0 ? connectingLetters.map((l) => `${l}'`).join(', ') : 'ללא אותיות חיבור'}
                </span>
                <p className="text-xs text-slate-400">
                  אותיות אלו אינן מקושרות לאף ספרה, ומשמשות תמיד כדבק חיבור חופשי למילים ולדימויים.
                </p>
              </div>
            </div>
          </div>

          {/* Digits 0-9 Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {majorDigits.map((d) => {
              const majorItem = majorItems.find((m) => m.number === d.number) || d;
              const activeConsonants = d.consonants;
              const activeWord = majorItem.defaultWord || '';
              const activeHint = majorItem.imageHint || '';
              const logicIgnoreKey = buildLogicIgnoreKey('major-word', d.number, activeWord);
              const rawDigitValidation = activeWord.trim()
                ? validateHebrewLogic(activeWord, d.number, majorDigits, connectingLetters, 'major')
                : { isValid: true, message: '' };
              const digitValidation = isIgnored(logicIgnoreKey)
                ? { isValid: true, message: '' }
                : rawDigitValidation;

              const matchingPao = paoItems.find((p) => p.number === d.number);
              const paoObj = matchingPao?.object?.trim() || '';
              const mismatchIgnoreKey = buildLogicIgnoreKey(
                'major-pao-mismatch',
                d.number,
                activeWord,
                paoObj
              );
              const hasPaoMismatch =
                Boolean(activeWord.trim() && paoObj && activeWord.trim() !== paoObj) &&
                !isIgnored(mismatchIgnoreKey);

              return (
                <div
                  key={d.number}
                  className={`bg-slate-950 border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                    !digitValidation.isValid || hasPaoMismatch
                      ? 'border-amber-500/70 ring-1 ring-amber-500/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-black text-xl flex items-center justify-center">
                          {d.number}
                        </span>
                        <span
                          className="text-xs font-mono font-bold text-amber-300/90 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800"
                          title="עיצורים מסונכרנים ממודולת לוגיקת מספרים"
                        >
                          [{activeConsonants}]
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={() => handleOpenEditModal(majorItem)}
                          className="w-8 h-8 p-1.5 rounded-xl text-slate-300 hover:text-amber-300 hover:bg-amber-500/15 cursor-pointer inline-flex items-center justify-center transition-colors"
                          title="ערוך חפץ עוגן בחלון עריכה מורחב"
                        >
                          <Edit3 className="w-4 h-4 pointer-events-none" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onResetMajorItem(d.number)}
                          className="w-8 h-8 p-1.5 rounded-xl text-slate-500 hover:text-rose-400 cursor-pointer inline-flex items-center justify-center"
                          title="אפס חפץ עוגן לברירת מחדל"
                        >
                          <Undo2 className="w-3.5 h-3.5 pointer-events-none" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-right">
                      <div>
                        <span className="text-xs text-slate-400 font-bold block">מילת/חפץ עוגן:</span>
                        <div className="flex flex-col gap-1.5 mt-0.5">
                          <span className="text-base font-bold text-white">{activeWord}</span>
                          {!digitValidation.isValid && (
                            <div
                              title={digitValidation.details || digitValidation.message}
                              className="w-full flex flex-col gap-1.5 px-2.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/50 text-amber-300 text-[11px] font-bold leading-snug"
                            >
                              <div className="flex items-start gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <span>{digitValidation.message}</span>
                              </div>
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => ignoreValidation(logicIgnoreKey)}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-amber-200 border border-amber-500/40 cursor-pointer transition-colors"
                                >
                                  התעלם במקרה זה
                                </button>
                              </div>
                            </div>
                          )}
                          {hasPaoMismatch && (
                            <div className="w-full flex flex-col gap-1.5 px-2.5 py-2 rounded-xl bg-sky-500/15 border border-sky-500/50 text-sky-200 text-[11px] font-bold leading-snug">
                              <div className="flex items-start gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                                <span>
                                  לתשומת לבך - במודולת PAO הגדרת חפץ אחר עבור מספר זה ("{paoObj}") ; מומלץ לבחור באותה המילה עבור 2 המודולות
                                </span>
                              </div>
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => ignoreValidation(mismatchIgnoreKey)}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-sky-200 border border-sky-500/40 cursor-pointer transition-colors"
                                >
                                  התעלם במקרה זה
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {activeHint && (
                        <p className="text-xs text-slate-400 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                          ⚡ {activeHint}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: QUIZ */}
      {subView === 'quiz' && (
        <div className="space-y-6">
          {readyItems.length === 0 ? (
            <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-3xl p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto my-6 text-slate-900 animate-fadeIn">
              <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  טרם סימנת פריטים כמוכנים לתרגול במודולה זו. סמן מספר אסוציאציות כדי להתחיל.
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                  כדי שתוכל לשלוט באופן מלא בעקומת הלמידה, מנגנון השליפה האקראי מתרגל אך ורק פריטים שסומנו בתיבת "מוכן לתרגול". סמן את המספרים ששיננת כדי להתחיל במבחן.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                <button
                  onClick={() => setSubView('table')}
                  className="btn-duo-primary px-5 py-2.5 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>מעבר לטבלת 00-99 לסימון פריטים</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
                {onSetAllMajorReady && (
                  <button
                    onClick={() => {
                      onSetAllMajorReady(true, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
                      onEarnPoints(10, 'סימון עשר ספרות ראשונות כמוכנות');
                    }}
                    className="btn-duo-neutral px-4 py-2.5 text-xs font-bold cursor-pointer"
                  >
                    <span>סמן ספרות 0-9 כמוכנות והתחל</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-xl border border-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>מתרגל {readyItems.length} פריטים שסומנו כמוכנים (מתוך {majorItems.length})</span>
                  </span>
                  <div className="text-xs text-slate-400 font-medium hidden sm:block">
                    💡 לחץ <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-amber-300 font-mono text-[10px]">Ctrl + Enter</kbd> לחשיפת תשובה
                  </div>
                </div>
                <button
                  onClick={handleNextQuestion}
                  className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 bg-slate-800 px-3.5 py-1.5 rounded-xl cursor-pointer hover:bg-slate-700 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>שאלה הבאה בסבב</span>
                </button>
              </div>

              {/* Non-repeating Quiz Deck Progress Bar */}
              <div className="w-full max-w-4xl mx-auto">
                <QuizDeckProgressBar
                  progress={deckProgress}
                  onResetDeck={() => {
                    resetQuizDeck('workout_major');
                    handleNextQuestion();
                  }}
                  deckTitle="שיטת Major (00-99)"
                />
              </div>

              {currentQuizItem && (
                <div
                  key={`${currentQuizItem.numberStr}-${quizFeedback}`}
                  className="w-full max-w-4xl mx-auto space-y-6 text-center m3-shared-axis-x-forward"
                >
                  <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 shadow-inner space-y-3 relative overflow-hidden">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                      מה המילה המנמונית של המספר:
                    </span>
                    <div className="text-6xl font-black text-white tracking-wider">
                      {currentQuizItem.numberStr}
                    </div>
                    <div className="text-xs text-slate-400">
                      עיצורים מנחים:{' '}
                      <strong className="text-slate-200">
                        {getLiveMajorConsonants(currentQuizItem.number, majorDigits) || currentQuizItem.consonants}
                      </strong>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-2 max-w-sm mx-auto">
                      <input
                        type="text"
                        value={userGuess}
                        onChange={(e) => setUserGuess(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                            e.preventDefault();
                            setRevealHint(true);
                            return;
                          }
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (quizFeedback === 'correct') {
                              handleNextQuestion();
                            } else {
                              handleCheckAnswer();
                            }
                          }
                        }}
                        placeholder="הקלד את המילה המנמונית..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={() => {
                          if (quizFeedback === 'correct') {
                            handleNextQuestion();
                          } else {
                            handleCheckAnswer();
                          }
                        }}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                      >
                        {quizFeedback === 'correct' ? 'הבא ↵' : 'בדוק'}
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={handleNextQuestion}
                        className="text-xs text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>דלג למספר הבא ⏭️</span>
                      </button>
                      {!revealHint && quizFeedback !== 'correct' && (
                        <button
                          onClick={() => setRevealHint(true)}
                          className="text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>חשוף תשובה (Ctrl+Enter)</span>
                        </button>
                      )}
                    </div>

                    {quizFeedback === 'correct' && (
                      <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex flex-col items-center justify-center gap-1.5 m3-spring-pop shadow-md">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span className="font-bold text-sm">מעולה! תשובה מדויקת ב-100% (+15 XP)</span>
                        </div>
                        <span className="text-[11px] text-emerald-400/90 font-medium">
                          לחץ Enter כדי לעבור ישר למספר האקראי הבא ↵
                        </span>
                      </div>
                    )}

                    {quizFeedback === 'incorrect' && (
                      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center gap-2 animate-shake shadow-md">
                        <XCircle className="w-5 h-5" />
                        <span className="font-bold text-sm">לא מדויק. לחץ Ctrl+Enter לחשיפת התשובה או דלג הלאה</span>
                      </div>
                    )}

                    {(quizFeedback === 'correct' || revealHint) && (
                      <div className="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-5 text-xs space-y-3 text-right animate-fadeIn shadow-xl shadow-amber-500/5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-amber-400 font-bold flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            האסוציאציה המלאה שנקבעה:
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (currentQuizItem) {
                                  setQuizEditWord(currentQuizItem.defaultWord);
                                  setQuizEditHint(currentQuizItem.imageHint || '');
                                  setIsQuizEditing(!isQuizEditing);
                                }
                              }}
                              className="text-[11px] text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>{isQuizEditing ? 'סגור עריכה' : 'שנה אסוציאציה'}</span>
                            </button>
                            <span className="text-[11px] font-mono text-slate-400">
                              #{currentQuizItem.numberStr}
                            </span>
                          </div>
                        </div>

                        {isQuizEditing ? (
                          <div className="space-y-3 bg-slate-900 p-3.5 rounded-xl border border-amber-500/30 animate-fadeIn">
                            <div className="text-xs font-bold text-amber-300">עריכת האסוציאציה למספר {currentQuizItem.numberStr}:</div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] text-slate-400 font-bold">מילת/חפץ עוגן (עצם מוחשי):</label>
                                <AIFieldGeneratorButton
                                  promptType="major_word"
                                  inputContext={currentQuizItem.number.toString()}
                                  extraContext={getLiveMajorConsonants(currentQuizItem.number, majorDigits)}
                                  paoContext={{ number: currentQuizItem.numberStr, object: quizEditWord }}
                                  customDigits={majorDigits}
                                  connectingLetters={connectingLetters}
                                  onGenerated={(val) => setQuizEditWord(val)}
                                  label="חפץ עם AI"
                                  compact
                                />
                              </div>
                              <input
                                type="text"
                                value={quizEditWord}
                                onChange={(e) => setQuizEditWord(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveQuizEdit();
                                  }
                                }}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                              />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] text-slate-400 font-bold">סצנה קינטית:</label>
                                <AIFieldGeneratorButton
                                  promptType="major_hint"
                                  inputContext={currentQuizItem.number.toString()}
                                  extraContext={quizEditWord}
                                  paoContext={{ number: currentQuizItem.numberStr, object: quizEditWord, scene: quizEditHint }}
                                  customDigits={majorDigits}
                                  connectingLetters={connectingLetters}
                                  onGenerated={(val) => setQuizEditHint(val)}
                                  label="סצנה עם AI"
                                  compact
                                />
                              </div>
                              <input
                                type="text"
                                value={quizEditHint}
                                onChange={(e) => setQuizEditHint(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveQuizEdit();
                                  }
                                }}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                              />
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setIsQuizEditing(false)}
                                className="text-xs text-slate-400 px-3 py-1"
                              >
                                ביטול
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveQuizEdit()}
                                className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-1 rounded-lg cursor-pointer"
                              >
                                שמור שינויים
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="text-amber-300 font-bold text-sm">
                              מילה מנמונית: <span className="text-white text-base font-black">{currentQuizItem.defaultWord}</span>
                            </div>
                            <div className="text-slate-200 bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-xs leading-relaxed">
                              ⚡ <strong className="text-amber-400">סצנה קינטית מוקצנת:</strong>{' '}
                              {currentQuizItem.imageHint || 'התנגשות קינטית עזה שצרובה בהיפוקמפוס.'}
                            </div>
                          </>
                        )}

                        <div className="flex justify-center pt-1">
                          <button
                            onClick={handleNextQuestion}
                            className="text-xs text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-1 bg-slate-900 px-4 py-2 rounded-xl border border-amber-500/30 cursor-pointer hover:bg-slate-800 transition-colors"
                          >
                            <span>למספר האקראי הבא (Enter ↵)</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Expanded Centered MAJOR Edit Modal (Dialog with Light Dismiss, identical to PAO Edit Modal, without Consonants field) */}
      {editingNum !== null && (() => {
        const modalItem = majorItems.find((i) => i.number === editingNum);
        if (!modalItem) return null;
        const liveConsonants =
          getLiveMajorConsonants(modalItem.number, majorDigits) || modalItem.consonants || '';
        const modalLogicIgnoreKey = buildLogicIgnoreKey('major-word', modalItem.number, editWord);
        const rawModalWordValidation =
          editWord && editWord.trim()
            ? validateHebrewLogic(editWord, modalItem.number, majorDigits, connectingLetters, 'major')
            : { isValid: true, message: '' };
        const modalWordValidation = isIgnored(modalLogicIgnoreKey)
          ? { isValid: true, message: '' }
          : rawModalWordValidation;

        const modalMatchingPao = paoItems.find((p) => p.number === modalItem.number);
        const modalPaoObj = modalMatchingPao?.object?.trim() || '';
        const modalMismatchIgnoreKey = buildLogicIgnoreKey(
          'major-pao-mismatch',
          modalItem.number,
          editWord,
          modalPaoObj
        );
        const modalHasPaoMismatch =
          Boolean(editWord.trim() && modalPaoObj && editWord.trim() !== modalPaoObj) &&
          !isIgnored(modalMismatchIgnoreKey);

        return (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
            dir="rtl"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setEditingNum(null);
              }
            }}
          >
            <div
              className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl w-full max-w-2xl p-5 sm:p-7 shadow-2xl space-y-5 text-right my-auto relative"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-2xl sm:text-3xl font-black text-amber-300 bg-amber-500/15 px-3.5 py-1.5 rounded-2xl border border-amber-500/30 shadow-inner">
                    #{modalItem.numberStr}
                  </span>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                      <span>עריכת מספר #{modalItem.numberStr} בשיטת Major</span>
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <span className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 rounded-lg font-bold">
                        עיצורי המספר לפי המוח הלוגי: [{liveConsonants}]
                      </span>
                      <span className="text-xs text-sky-300 bg-sky-500/10 border border-sky-500/25 px-2.5 py-0.5 rounded-lg font-bold">
                        אותיות חיבור מותרות: {connectingLetters.join(', ')}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingNum(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                  title="סגור חלון (Esc או לחיצה בחוץ)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body: Anchor Word/Object + Scene (NO Consonants Field) */}
              <div className="space-y-4">
                {/* Anchor Object Word Field */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="text-sm font-black text-amber-400 flex items-center gap-1.5">
                      <Package className="w-4 h-4" />
                      <span>📦 מילת/חפץ עוגן (חפץ או עצם מוחשי בלבד)</span>
                    </label>
                    <AIFieldGeneratorButton
                      promptType="major_word"
                      inputContext={modalItem.numberStr}
                      extraContext={liveConsonants}
                      paoContext={{
                        number: modalItem.numberStr,
                        object: editWord,
                        scene: editHint,
                      }}
                      customDigits={majorDigits}
                      connectingLetters={connectingLetters}
                      onGenerated={(val) => setEditWord(val)}
                      label="הצע חפץ מוחשי עם AI"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    חפץ או עצם פיזי מוחשי הבנוי מעיצורי המספר ({liveConsonants}) + אותיות החיבור ({connectingLetters.join(', ')}) בלבד.
                  </p>
                  <input
                    type="text"
                    value={editWord}
                    onChange={(e) => setEditWord(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveItem(modalItem.number);
                      }
                    }}
                    placeholder="הקלד חפץ או עצם מוחשי..."
                    className={`w-full bg-slate-900 border rounded-xl px-3.5 py-2.5 text-sm text-white font-semibold focus:outline-none ${
                      !modalWordValidation.isValid || modalHasPaoMismatch
                        ? 'border-amber-500 focus:border-amber-400'
                        : 'border-slate-700 focus:border-amber-500'
                    }`}
                  />
                  {!modalWordValidation.isValid && (
                    <div className="flex flex-col gap-2 text-xs text-amber-300 bg-amber-500/15 border border-amber-500/40 rounded-xl p-2.5 font-bold leading-relaxed">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div>{modalWordValidation.message}</div>
                          {modalWordValidation.details && (
                            <div className="text-[11px] text-amber-200/80 font-normal mt-0.5">
                              {modalWordValidation.details}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => ignoreValidation(modalLogicIgnoreKey)}
                          className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-200 border border-amber-500/40 cursor-pointer transition-colors"
                        >
                          התעלם במקרה זה
                        </button>
                      </div>
                    </div>
                  )}
                  {modalHasPaoMismatch && (
                    <div className="flex flex-col gap-2 text-xs text-sky-200 bg-sky-500/15 border border-sky-500/40 rounded-xl p-2.5 font-bold leading-relaxed">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          לתשומת לבך - במודולת PAO הגדרת חפץ אחר עבור מספר זה ("{modalPaoObj}") ; מומלץ לבחור באותה המילה עבור 2 המודולות
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => ignoreValidation(modalMismatchIgnoreKey)}
                          className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-200 border border-sky-500/40 cursor-pointer transition-colors"
                        >
                          התעלם במקרה זה
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Kinetic Scene Field */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <label className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>🎬 סצנה קינטית מוקצנת (עקרון SEE - חושים, רגש והגזמה)</span>
                      </label>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        חבר את החפץ לסצנה רב-חושית מוגזמת, פעילה ויוצאת דופן שתיצרב בזיכרון.
                      </p>
                    </div>
                    <AIFieldGeneratorButton
                      promptType="major_hint"
                      inputContext={modalItem.numberStr}
                      extraContext={editWord}
                      paoContext={{
                        number: modalItem.numberStr,
                        object: editWord,
                        scene: editHint,
                      }}
                      customDigits={majorDigits}
                      connectingLetters={connectingLetters}
                      onGenerated={(val) => setEditHint(val)}
                      label="צור סצנת SEE עם AI"
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={editHint}
                    onChange={(e) => setEditHint(e.target.value)}
                    placeholder="תאר סצנה מוחשית ומוקצנת עבור החפץ..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-amber-100 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 transition-all">
                    <input
                      type="checkbox"
                      checked={Boolean(modalItem.is_ready_for_practice)}
                      onChange={() => handleToggleItemReady(modalItem.number, modalItem.is_ready_for_practice)}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                    />
                    <span className={`text-xs font-bold ${modalItem.is_ready_for_practice ? 'text-emerald-300' : 'text-slate-400'}`}>
                      מוכן לתרגול במבחן השליפה
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      onResetMajorItem(modalItem.number);
                      setEditingNum(null);
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-3 py-2 rounded-xl font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>אפס לברירת מחדל</span>
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingNum(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                  >
                    ביטול (Esc)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveItem(modalItem.number)}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>שמור שינויים</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Validation Alert Modal */}
      {validationModal && validationModal.isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          dir="rtl"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setValidationModal(null);
            }
          }}
        >
          <div
            className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl max-w-md w-full p-6 text-right space-y-4 shadow-2xl animate-in fade-in zoom-in-95"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  {validationModal.title}
                </h3>
                <p className="text-xs text-amber-300 font-bold mt-0.5">
                  {validationModal.message}
                </p>
              </div>
            </div>

            {validationModal.details && (
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {validationModal.details}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              {validationModal.onConfirmBypass && (
                <button
                  type="button"
                  onClick={validationModal.onConfirmBypass}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3.5 py-2 rounded-xl border border-slate-700 transition-all cursor-pointer"
                >
                  התעלם במקרה זה
                </button>
              )}
              <button
                type="button"
                onClick={() => setValidationModal(null)}
                className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md"
              >
                חזור ותקן ערך
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
