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
  CheckSquare,
  Check,
  ArrowLeft,
  ListFilter,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MajorItem } from '../../types/memory';
import { isHebrewFuzzyMatch, isHebrewMultiFieldSearchMatch } from '../../lib/fuzzyMatch';
import { AIFieldGeneratorButton } from '../AIFieldGeneratorButton';
import {
  validateHebrewLogic,
  checkMajorDuplicates,
  DEFAULT_CONNECTING_LETTERS,
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
  onEarnPoints: (amount: number, reason?: string) => void;
  onUnlockBadge: (badge: string) => void;
  onUpdateMajorDigit: (digit: number, consonants: string, word: string, hint: string) => void;
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
  onEarnPoints,
  onUnlockBadge,
  onUpdateMajorDigit,
  onResetMajorDigit,
  onRecalculateMajor00_99FromDigits,
  onAddMajorItem,
  onUpdateMajorItem,
  onDeleteMajorItem,
  onResetMajorItem,
  onOpenSummary,
  onToggleMajorReady,
  onSetAllMajorReady,
  onNavigateToLogicTab,
  onSyncMajorAndPAOObjects,
}) => {
  const [subView, setSubView] = useState<'table' | 'digits' | 'quiz'>('table');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [decadeFilter, setDecadeFilter] = useState('all');
  const [onlyReadyFilter, setOnlyReadyFilter] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Ready for practice items calculation (Strict Whitelist Filtering)
  const readyItems = majorItems.filter((item) => Boolean(item.is_ready_for_practice));

  // Editing Major Item (00-99)
  const [editingNum, setEditingNum] = useState<number | null>(null);
  const [editWord, setEditWord] = useState('');
  const [editConsonants, setEditConsonants] = useState('');
  const [editHint, setEditHint] = useState('');

  // Editing Single Digit (0-9) Mapping
  const [editingDigitNum, setEditingDigitNum] = useState<number | null>(null);
  const [editDigitConsonants, setEditDigitConsonants] = useState('');
  const [editDigitWord, setEditDigitWord] = useState('');
  const [editDigitHint, setEditDigitHint] = useState('');

  // Validation alert modal state
  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details?: string;
    onConfirmBypass?: () => void;
  } | null>(null);

  const handleSaveDigit = (digitNum: number) => {
    onUpdateMajorDigit(
      digitNum,
      editDigitConsonants.trim(),
      editDigitWord.trim(),
      editDigitHint.trim()
    );
    setEditingDigitNum(null);
    onEarnPoints(10, `עדכון לוגיקת ספרה ${digitNum}`);
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

      // 2. Check logic conformity
      const logicRes = validateHebrewLogic(wordToSave, itemNum, majorDigits, connectingLetters, 'major');
      if (!logicRes.isValid) {
        setValidationModal({
          isOpen: true,
          title: 'הודעת ולידציה: אי-התאמה לחוקי הלוגיקה',
          message: logicRes.message,
          details: logicRes.details || `המילה "${wordToSave}" אינה תואמת לעיצורים שהוגדרו עבור ספרה ${itemNum}.`,
          onConfirmBypass: () => handleSaveItem(itemNum, true),
        });
        return;
      }
    }

    onUpdateMajorItem(itemNum, {
      defaultWord: wordToSave,
      consonants: editConsonants.trim(),
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
  const [newConsonants, setNewConsonants] = useState('');
  const [newHint, setNewHint] = useState('');

  // Quiz State (Strictly over readyItems via non-repeating permutation cycle)
  const [deckProgress, setDeckProgress] = useState<DeckProgress | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [userGuess, setUserGuess] = useState('');
  const [quizFeedback, setQuizFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [revealHint, setRevealHint] = useState(false);
  const [isQuizEditing, setIsQuizEditing] = useState(false);
  const [quizEditWord, setQuizEditWord] = useState('');
  const [quizEditConsonants, setQuizEditConsonants] = useState('');
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

      const logicRes = validateHebrewLogic(wordToSave, currentQuizItem.number, majorDigits, connectingLetters, 'major');
      if (!logicRes.isValid) {
        setValidationModal({
          isOpen: true,
          title: 'הודעת ולידציה: אי-התאמה לחוקי הלוגיקה',
          message: logicRes.message,
          details: logicRes.details,
          onConfirmBypass: () => handleSaveQuizEdit(true),
        });
        return;
      }
    }

    onUpdateMajorItem(currentQuizItem.number, {
      defaultWord: wordToSave,
      consonants: quizEditConsonants.trim(),
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

      const logicRes = validateHebrewLogic(wordToSave, num, majorDigits, connectingLetters, 'major');
      if (!logicRes.isValid) {
        setValidationModal({
          isOpen: true,
          title: 'הודעת ולידציה: אי-התאמה לחוקי הלוגיקה',
          message: logicRes.message,
          details: logicRes.details,
          onConfirmBypass: () => handleAddNewItem(undefined, true),
        });
        return;
      }
    }

    if (onAddMajorItem) {
      onAddMajorItem({
        number: num,
        numberStr: numStr,
        defaultWord: wordToSave,
        consonants: newConsonants.trim(),
        imageHint: newHint.trim(),
        is_ready_for_practice: true,
      });
    }

    setNewNumber('');
    setNewWord('');
    setNewConsonants('');
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

      {/* Connecting Letters Rule Note / חוק אותיות הקישור */}
      <div className="bg-gradient-to-r from-sky-50 via-white to-indigo-50 border border-sky-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-right">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 border border-sky-300 flex items-center justify-center font-bold shrink-0 text-lg shadow-xs">
            💡
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-sky-900">
                חוק אותיות החיבור (ללא ערך מספרי):
              </span>
              <span className="text-sm font-mono font-bold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-lg border border-sky-300">
                א', נ', י', ע', ו', ה'
              </span>
              <span className="text-xs font-black text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-300">
                ביטוי עזר לזיכרון: "א-נ-י-ע-ו-נ-ה"
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              אותיות אלו שקופות לחלוטין ומשמשות כחומרי קישור חופשיים. כל מילות המאגר מבוססות <strong>אך ורק</strong> על עיצורי המספר עצמו + אותיות החיבור (למשל: <span className="text-amber-800 font-bold">11 = לול</span>, כי 1=ל ו-ו' אות חיבור).
            </p>
          </div>
        </div>
      </div>

      {/* SUB-VIEW 2: TABLE 00-99 & CUSTOM */}
      {subView === 'table' && (
        <div className="space-y-4">
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
              {/* Batch Actions - Always display BOTH Select All and Deselect All */}
              {onSetAllMajorReady && (
                <div className="flex items-center gap-1.5 text-xs">
                  {decadeFilter !== 'all' ? (
                    <>
                      <button
                        onClick={() => {
                          const d = parseInt(decadeFilter, 10);
                          const nums = Array.from({ length: 10 }, (_, i) => d + i);
                          onSetAllMajorReady(true, nums);
                          onEarnPoints(10, `סימון עשור ${d} כמוכן לתרגול`);
                        }}
                        className="text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs"
                        title="סמן את כל 10 המספרים בעשור זה כמוכנים לתרגול"
                      >
                        ✓ סמן עשור {decadeFilter}
                      </button>
                      <button
                        onClick={() => {
                          const d = parseInt(decadeFilter, 10);
                          const nums = Array.from({ length: 10 }, (_, i) => d + i);
                          onSetAllMajorReady(false, nums);
                        }}
                        className="text-xs font-medium text-slate-400 hover:text-rose-400 bg-slate-950 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 px-2 py-1.5 rounded-xl transition-all cursor-pointer"
                        title="בטל סימון לעשור זה"
                      >
                        ✗ בטל עשור
                      </button>
                    </>
                  ) : null}

                  <button
                    onClick={() => {
                      onSetAllMajorReady(true);
                      onEarnPoints(20, 'סימון כל 100 מספרי Major כמוכנים');
                    }}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs"
                    title="סמן את כל 100 המספרים כמוכנים לתרגול (Select All)"
                  >
                    ✓ סמן הכל (100)
                  </button>

                  <button
                    onClick={() => onSetAllMajorReady(false)}
                    className="text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                    title="בטל את כל סימוני התרגול (Deselect All)"
                  >
                    ✗ בטל הכל
                  </button>
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
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-right">
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
                      מילה מנמונית:
                    </label>
                    <AIFieldGeneratorButton
                      promptType="major_word"
                      inputContext={newNumber}
                      extraContext={newConsonants}
                      onGenerated={(val) => setNewWord(val)}
                      label="מילה עם AI"
                      compact
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 font-semibold">
                      עיצורים / אותיות:
                    </label>
                    <AIFieldGeneratorButton
                      promptType="major_consonants"
                      inputContext={newNumber}
                      onGenerated={(val) => setNewConsonants(val)}
                      label="עיצורים"
                      compact
                    />
                  </div>
                  <input
                    type="text"
                    value={newConsonants}
                    onChange={(e) => setNewConsonants(e.target.value)}
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

          <div className="flex gap-4 items-start">
            {viewMode === 'grid' ? (
              /* Main Cards Grid */
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 max-h-[640px] overflow-y-auto pr-1 scroll-smooth">
                {filteredItems.map((item) => {
                  const isEditing = editingNum === item.number;
                  const activeWord = item.defaultWord || '';
                  const activeConsonants = item.consonants || '';
                  const activeHint = item.imageHint || '';
                  const isCustom = false;
                  const isHighlighted = highlightedNum === item.number;

                  return (
                    <div
                      id={`major-item-${item.number}`}
                      key={item.number}
                      className={`bg-slate-950 border rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between ${
                        item.is_ready_for_practice
                          ? 'border-emerald-500/60 ring-2 ring-emerald-500/20 bg-emerald-950/15'
                          : isHighlighted
                          ? 'border-amber-400 ring-4 ring-amber-400/30 scale-[1.02] shadow-xl shadow-amber-500/20 bg-amber-950/20'
                          : isCustom
                          ? 'border-amber-500/50 shadow-sm shadow-amber-500/10'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xl font-black text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                            {item.numberStr}
                          </span>
                          <span className="text-xs text-amber-300/80 font-mono font-bold">
                            [{activeConsonants}]
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {isCustom && (
                            <button
                              onClick={() => {
                                onResetMajorItem(item.number);
                                if (isEditing) setEditingNum(null);
                              }}
                              title="אפס לברירת מחדל"
                              className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                            >
                              <Undo2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (isEditing) {
                                setEditingNum(null);
                              } else {
                                setEditingNum(item.number);
                                setEditWord(activeWord);
                                setEditConsonants(activeConsonants);
                                setEditHint(activeHint || '');
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-400 cursor-pointer"
                            title="ערוך מספר"
                          >
                            <Edit3 className="w-4 h-4" />
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

                      {isEditing ? (
                        <div className="space-y-2.5 pt-1 text-right">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs text-slate-300 font-bold">מילה מנמונית:</label>
                              <AIFieldGeneratorButton
                                promptType="major_word"
                                inputContext={item.number.toString()}
                                extraContext={editConsonants || item.consonants}
                                onGenerated={(val) => setEditWord(val)}
                                label="מילה עם AI"
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
                                  handleSaveItem(item.number);
                                }
                              }}
                              placeholder="מילה מנמונית..."
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs text-slate-300 font-bold">עיצורים (למשל: ס + ר):</label>
                              <AIFieldGeneratorButton
                                promptType="major_consonants"
                                inputContext={item.number.toString()}
                                onGenerated={(val) => setEditConsonants(val)}
                                label="עיצורים"
                                compact
                              />
                            </div>
                            <input
                              type="text"
                              value={editConsonants}
                              onChange={(e) => setEditConsonants(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveItem(item.number);
                                }
                              }}
                              placeholder="עיצורים (ס + ר)..."
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-amber-200 focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs text-slate-300 font-bold">סצנה קינטית / דימוי חושי:</label>
                              <AIFieldGeneratorButton
                                promptType="major_hint"
                                inputContext={item.number.toString()}
                                extraContext={editWord}
                                onGenerated={(val) => setEditHint(val)}
                                label="סצנה עם AI"
                                compact
                              />
                            </div>
                            <input
                              type="text"
                              value={editHint}
                              onChange={(e) => setEditHint(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveItem(item.number);
                                }
                              }}
                              placeholder="סצנה קינטית רב-חושית..."
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div className="flex items-center justify-between gap-1 pt-1">
                            <span className="text-[11px] text-slate-500 font-mono">↵ Enter לשמירה</span>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => setEditingNum(null)}
                                className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1"
                              >
                                ביטול
                              </button>
                              <button
                                onClick={() => handleSaveItem(item.number)}
                                className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded-lg cursor-pointer shadow-xs"
                              >
                                שמור
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h4 className="text-base font-bold text-white tracking-wide">{activeWord}</h4>
                          {activeHint && (
                            <p className="text-xs text-slate-300 bg-slate-900/80 p-2 rounded-xl border border-slate-800 leading-relaxed">
                              ⚡ {activeHint}
                            </p>
                          )}
                        </>
                      )}

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
                      <th className="py-3 px-4 w-36">מילה</th>
                      <th className="py-3 px-4">דימוי חושי קינטי</th>
                      <th className="py-3 px-4 w-32 text-center">מוכן לתרגול</th>
                      <th className="py-3 px-4 w-24 text-left">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {filteredItems.map((item) => {
                      const isEditing = editingNum === item.number;
                      const activeWord = item.defaultWord || '';
                      const activeConsonants = item.consonants || '';
                      const activeHint = item.imageHint || '';
                      const isCustom = false;

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
                            {isEditing ? (
                              <input
                                type="text"
                                value={editConsonants}
                                onChange={(e) => setEditConsonants(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveItem(item.number);
                                  }
                                }}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300"
                              />
                            ) : (
                              activeConsonants
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold text-white text-base">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editWord}
                                onChange={(e) => setEditWord(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveItem(item.number);
                                  }
                                }}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white"
                              />
                            ) : (
                              <span>{activeWord}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-300">
                            {isEditing ? (
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  value={editHint}
                                  onChange={(e) => setEditHint(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleSaveItem(item.number);
                                    }
                                  }}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                                />
                                <div className="flex gap-1">
                                  <AIFieldGeneratorButton
                                    promptType="major_hint"
                                    inputContext={item.number.toString()}
                                    extraContext={editWord}
                                    onGenerated={(val) => setEditHint(val)}
                                    label="הצע סצנה AI"
                                    compact
                                  />
                                </div>
                              </div>
                            ) : (
                              activeHint || <span className="text-slate-600 italic">ללא סצנה</span>
                            )}
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
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleSaveItem(item.number)}
                                    className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg cursor-pointer"
                                  >
                                    שמור
                                  </button>
                                  <button
                                    onClick={() => setEditingNum(null)}
                                    className="px-1.5 py-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                                  >
                                    ביטול
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingNum(item.number);
                                      setEditWord(activeWord);
                                      setEditConsonants(activeConsonants);
                                      setEditHint(activeHint || '');
                                    }}
                                    className="p-1 text-slate-400 hover:text-amber-400 cursor-pointer"
                                    title="ערוך שורה"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  {isCustom && (
                                    <button
                                      onClick={() => onResetMajorItem(item.number)}
                                      className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                                      title="איפוס לברירת מחדל"
                                    >
                                      <Undo2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              )}
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

      {/* SUB-VIEW: DIGITS 0-9 MAPPING & LOGIC EDITOR */}
      {subView === 'digits' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Explanation Banner */}
          <div className="bg-slate-950 border border-amber-500/30 rounded-3xl p-5 sm:p-6 space-y-3 shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-amber-400 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  <span>עריכה והתאמה אישית של ספרות היסוד (0-9)</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  כל מילות ה-Major וה-PAO בכל האפליקציה נגזרות ממיפוי זה. ניתן להתאים אישית כל ספרה, ולאחר מכן לחשב מחדש את כל מאגר 00-99.
                </p>
              </div>

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

            {/* Connecting Letters Reminder */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-right">
              <div className="space-y-1">
                <span className="text-xs font-bold text-sky-400 block">אותיות החיבור השקופות:</span>
                <span className="font-mono font-black text-base text-sky-300">
                  א', נ', י', ע', ו', ה' ("א-נ-י-ע-ו-נ-ה")
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
              const isEditing = editingDigitNum === d.number;
              const activeConsonants = d.consonants;
              const activeWord = d.defaultWord;
              const activeHint = d.imageHint;

              return (
                <div
                  key={d.number}
                  className={`bg-slate-950 border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                    isEditing
                      ? 'border-amber-400 ring-2 ring-amber-400/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-black text-xl flex items-center justify-center">
                        {d.number}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (isEditing) {
                              setEditingDigitNum(null);
                            } else {
                              setEditingDigitNum(d.number);
                              setEditDigitConsonants(activeConsonants);
                              setEditDigitWord(activeWord);
                              setEditDigitHint(activeHint);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-400 cursor-pointer"
                          title="ערוך ספרה זו"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onResetMajorDigit(d.number)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                          title="אפס ספרה זו לברירת מחדל"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2 text-right">
                        <div>
                          <label className="text-xs text-slate-400 font-bold block mb-1">עיצורים:</label>
                          <input
                            type="text"
                            value={editDigitConsonants}
                            onChange={(e) => setEditDigitConsonants(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveDigit(d.number);
                              }
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-amber-300"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 font-bold block mb-1">מילת עוגן:</label>
                          <input
                            type="text"
                            value={editDigitWord}
                            onChange={(e) => setEditDigitWord(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveDigit(d.number);
                              }
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 font-bold block mb-1">דימוי חושי:</label>
                          <input
                            type="text"
                            value={editDigitHint}
                            onChange={(e) => setEditDigitHint(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveDigit(d.number);
                              }
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300"
                          />
                        </div>
                        <div className="flex justify-end gap-1.5 pt-1">
                          <button
                            onClick={() => setEditingDigitNum(null)}
                            className="text-xs text-slate-400 px-2 py-1"
                          >
                            ביטול
                          </button>
                          <button
                            onClick={() => handleSaveDigit(d.number)}
                            className="text-xs bg-amber-500 text-slate-950 font-bold px-3 py-1 rounded-lg cursor-pointer"
                          >
                            שמור
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-right">
                        <div>
                          <span className="text-xs text-slate-400 font-bold block">עיצורים מקושרים:</span>
                          <span className="text-sm font-black text-amber-300">{activeConsonants}</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-400 font-bold block">מילה מנמונית:</span>
                          <span className="text-base font-bold text-white">{activeWord}</span>
                        </div>
                        {activeHint && (
                          <p className="text-xs text-slate-400 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                            ⚡ {activeHint}
                          </p>
                        )}
                      </div>
                    )}
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
                <div className="w-full max-w-4xl mx-auto space-y-6 text-center">
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
                        {currentQuizItem.consonants}
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
                      <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex flex-col items-center justify-center gap-1.5 animate-fadeIn">
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
                      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center gap-2 animate-fadeIn">
                        <XCircle className="w-5 h-5" />
                        <span className="font-bold text-sm">לא מדויק. לחץ Ctrl+Enter לחשיפת התשובה או דלג הלאה</span>
                      </div>
                    )}

                    {/* Always show full association and kinetic scene on correct answer OR when revealing */}
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
                                  setQuizEditConsonants(currentQuizItem.consonants);
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
                                <label className="text-[10px] text-slate-400 font-bold">מילה מנמונית:</label>
                                <AIFieldGeneratorButton
                                  promptType="major_word"
                                  inputContext={currentQuizItem.number.toString()}
                                  extraContext={quizEditConsonants}
                                  onGenerated={(val) => setQuizEditWord(val)}
                                  label="מילה עם AI"
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

      {/* Validation Alert Modal */}
      {validationModal && validationModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl max-w-md w-full p-6 text-right space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
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
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-2 rounded-xl transition-all cursor-pointer"
                >
                  שמור בכל זאת כמקרה חריג
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
