import React, { useState } from 'react';
import {
  User,
  Search,
  RotateCcw,
  Sparkles,
  Edit3,
  Save,
  Undo2,
  Trash2,
  Plus,
  Layers,
  HelpCircle,
  CheckCircle2,
  XCircle,
  BookOpen,
  Check,
  ArrowLeft,
  Filter,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PAOItem } from '../../types/memory';
import { getPAOInitials } from '../../lib/paoInitials';
import { isHebrewFuzzyMatch } from '../../lib/fuzzyMatch';
import { AIFieldGeneratorButton } from '../AIFieldGeneratorButton';

interface PAOModuleProps {
  paoItems: PAOItem[];
  onEarnPoints: (amount: number, reason?: string) => void;
  onUnlockBadge: (badge: string) => void;
  onAddPAOItem?: (item: PAOItem) => void;
  onUpdatePAOItem: (
    number: number,
    updates: { userPerson?: string; userAction?: string; userObject?: string; is_ready_for_practice?: boolean }
  ) => void;
  onDeletePAOItem?: (number: number) => void;
  onResetPAOItem: (number: number) => void;
  onOpenSummary?: (techniqueId: string) => void;
  onTogglePAOReady?: (number: number, explicitState?: boolean) => void;
  onSetAllPAOReady?: (ready: boolean, numbers?: number[]) => void;
}

export const PAOModule: React.FC<PAOModuleProps> = ({
  paoItems,
  onEarnPoints,
  onUnlockBadge,
  onAddPAOItem,
  onUpdatePAOItem,
  onDeletePAOItem,
  onResetPAOItem,
  onOpenSummary,
  onTogglePAOReady,
  onSetAllPAOReady,
}) => {
  const [subView, setSubView] = useState<'sixDigits' | 'registry' | 'quiz'>('sixDigits');
  const [search, setSearch] = useState('');
  const [onlyReadyFilter, setOnlyReadyFilter] = useState(false);

  // Ready for practice whitelist calculation
  const readyPaoItems = paoItems.filter((item) => Boolean(item.is_ready_for_practice));

  // 6-digit trainer state
  const [pao6Digits, setPao6Digits] = useState('213988');
  const [sceneRevealed, setSceneRevealed] = useState(false);

  // Edit PAO Item
  const [editingNum, setEditingNum] = useState<number | null>(null);
  const [editPerson, setEditPerson] = useState('');
  const [editAction, setEditAction] = useState('');
  const [editObject, setEditObject] = useState('');

  // Add PAO Item
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [newPerson, setNewPerson] = useState('');
  const [newAction, setNewAction] = useState('');
  const [newObject, setNewObject] = useState('');

  // PAO Quiz state (Strictly over readyPaoItems)
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizType, setQuizType] = useState<'numberToAll' | 'personToNumber'>('numberToAll');
  const [userGuessPerson, setUserGuessPerson] = useState('');
  const [userGuessAction, setUserGuessAction] = useState('');
  const [userGuessObject, setUserGuessObject] = useState('');
  const [userGuessNumber, setUserGuessNumber] = useState('');
  const [quizFeedback, setQuizFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [revealQuizAnswer, setRevealQuizAnswer] = useState(false);

  const safeQuizIndex = readyPaoItems.length > 0 ? quizIndex % readyPaoItems.length : 0;
  const currentQuizItem = readyPaoItems.length > 0 ? readyPaoItems[safeQuizIndex] : null;

  // Jump to specific number in registry
  const [highlightedNum, setHighlightedNum] = useState<number | null>(null);

  const handleTogglePaoReady = (itemNumber: number, currentState?: boolean) => {
    if (onTogglePAOReady) {
      onTogglePAOReady(itemNumber, !currentState);
    } else {
      onUpdatePAOItem(itemNumber, { is_ready_for_practice: !currentState });
    }
  };

  const scrollToNumber = (num: number) => {
    setHighlightedNum(num);
    setTimeout(() => {
      const el = document.getElementById(`pao-item-${num}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
    setTimeout(() => {
      setHighlightedNum(null);
    }, 2500);
  };

  const handleGeneratePao6 = () => {
    if (readyPaoItems.length === 0) return;
    const pItem = readyPaoItems[Math.floor(Math.random() * readyPaoItems.length)];
    const aItem = readyPaoItems[Math.floor(Math.random() * readyPaoItems.length)];
    const oItem = readyPaoItems[Math.floor(Math.random() * readyPaoItems.length)];
    setPao6Digits(`${pItem.numberStr}${aItem.numberStr}${oItem.numberStr}`);
    setSceneRevealed(false);
  };

  // Sync initial 6 digits with ready items if available
  React.useEffect(() => {
    if (readyPaoItems.length > 0) {
      const p = pao6Digits.slice(0, 2);
      const a = pao6Digits.slice(2, 4);
      const o = pao6Digits.slice(4, 6);
      const pValid = readyPaoItems.some((i) => i.numberStr === p);
      const aValid = readyPaoItems.some((i) => i.numberStr === a);
      const oValid = readyPaoItems.some((i) => i.numberStr === o);
      if (!pValid || !aValid || !oValid) {
        handleGeneratePao6();
      }
    }
  }, [readyPaoItems.length]);

  const getPaoFor2Digits = (twoDigits: string) => {
    const num = parseInt(twoDigits, 10);
    const item = paoItems.find((p) => p.number === num);
    if (!item) {
      return {
        person: `דמות (${twoDigits})`,
        action: `מבצע פעולה (${twoDigits})`,
        object: `חפץ (${twoDigits})`,
      };
    }
    return {
      person: item.userPerson || item.person,
      action: item.userAction || item.action,
      object: item.userObject || item.object,
    };
  };

  const parsedPao = {
    person: getPaoFor2Digits(pao6Digits.slice(0, 2)).person,
    action: getPaoFor2Digits(pao6Digits.slice(2, 4)).action,
    object: getPaoFor2Digits(pao6Digits.slice(4, 6)).object,
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(newNumber, 10);
    if (isNaN(num)) return;
    const numStr = num < 10 && num >= 0 ? `0${num}` : `${num}`;

    if (onAddPAOItem) {
      onAddPAOItem({
        number: num,
        numberStr: numStr,
        person: newPerson.trim(),
        userPerson: newPerson.trim(),
        action: newAction.trim(),
        userAction: newAction.trim(),
        object: newObject.trim(),
        userObject: newObject.trim(),
      });
    }

    setNewNumber('');
    setNewPerson('');
    setNewAction('');
    setNewObject('');
    setShowAddForm(false);
  };

  const handleNextQuizQuestion = () => {
    if (readyPaoItems.length === 0) return;
    const nextIdx = Math.floor(Math.random() * readyPaoItems.length);
    setQuizIndex(nextIdx);
    setUserGuessPerson('');
    setUserGuessAction('');
    setUserGuessObject('');
    setUserGuessNumber('');
    setQuizFeedback('idle');
    setRevealQuizAnswer(false);
    setQuizType(Math.random() > 0.5 ? 'numberToAll' : 'personToNumber');
  };

  const handleCheckQuiz = () => {
    if (!currentQuizItem) return;

    if (quizType === 'numberToAll') {
      const targetP = currentQuizItem.userPerson || currentQuizItem.person || '';
      const defaultP = currentQuizItem.person || '';
      const guessP = userGuessPerson.trim();
      if (!guessP) return;

      // Flexible Fuzzy Match & Normalization (strips brackets, initials, handles typos)
      const isMatch = isHebrewFuzzyMatch(guessP, targetP) || isHebrewFuzzyMatch(guessP, defaultP);
      if (isMatch) {
        setQuizFeedback('correct');
        setRevealQuizAnswer(true);
        onEarnPoints(20, 'זיהוי מדויק של רכיב PAO');
        onUnlockBadge('שלשת אלופים (PAO)');
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      } else {
        setQuizFeedback('incorrect');
        setRevealQuizAnswer(true); // Automatically reveal correct answer on error
      }
    } else {
      const guessNum = userGuessNumber.trim();
      if (!guessNum) return;
      if (guessNum === currentQuizItem.numberStr || parseInt(guessNum, 10) === currentQuizItem.number) {
        setQuizFeedback('correct');
        setRevealQuizAnswer(true);
        onEarnPoints(20, 'שליפת מספר משלשת PAO');
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      } else {
        setQuizFeedback('incorrect');
        setRevealQuizAnswer(true); // Automatically reveal correct answer on error
      }
    }
  };

  const filteredItems = paoItems.filter((item) => {
    if (onlyReadyFilter && !item.is_ready_for_practice) return false;

    const p = item.userPerson || item.person;
    const a = item.userAction || item.action;
    const o = item.userObject || item.object;
    return (
      item.numberStr.includes(search) ||
      p.toLowerCase().includes(search.toLowerCase()) ||
      a.toLowerCase().includes(search.toLowerCase()) ||
      o.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-slate-900">
      {/* Header and Sub-Tabs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b-2 border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-[#1CB0F6]" />
              <span>שלשות PAO (אדם - פעולה - חפץ)</span>
            </h2>
            {onOpenSummary && (
              <button
                onClick={() => onOpenSummary('pao')}
                className="btn-duo-neutral inline-flex items-center gap-1.5 px-3 py-1 text-xs cursor-pointer"
                title="צפה בסיכום הטכניקה ודוגמאות מעשיות"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#1CB0F6]" />
                <span>סיכום ודוגמאות</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            קודד 6 ספרות לסצנה קולנועית אחת לפי ראשי תיבות של אותיות ה-Major (למשל 14 = ל.ד.)
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border-2 border-slate-200 self-stretch md:self-auto justify-center">
          <button
            onClick={() => setSubView('sixDigits')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              subView === 'sixDigits'
                ? 'bg-[#1CB0F6] text-white border-b-2 border-[#1899d6] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>אימון 6 ספרות</span>
          </button>
          <button
            onClick={() => setSubView('registry')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              subView === 'registry'
                ? 'bg-[#1CB0F6] text-white border-b-2 border-[#1899d6] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>מאגר שלשות ({paoItems.length})</span>
          </button>
          <button
            onClick={() => setSubView('quiz')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              subView === 'quiz'
                ? 'bg-[#1CB0F6] text-white border-b-2 border-[#1899d6] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>מבחן שליפה ({readyPaoItems.length} מוכנים)</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: SIX DIGITS TRAINER */}
      {subView === 'sixDigits' && (
        <div className="space-y-6">
          {readyPaoItems.length === 0 ? (
            <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-3xl p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto my-6 text-slate-900 animate-fadeIn">
              <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  טרם סימנת פריטים כמוכנים לתרגול במודולה זו. סמן מספר אסוציאציות כדי להתחיל.
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                  אימון 6 ספרות מבוסס על שילוב 3 שלשות PAO שלמדת והטמעת. עקומת הלמידה נמצאת בשליטתך המלאה – סמן שלשות כמוכנות לתרגול במאגר כדי להתחיל.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                <button
                  onClick={() => setSubView('registry')}
                  className="btn-duo-primary px-5 py-2.5 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>מעבר למאגר השלשות לסימון פריטים</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
                {onSetAllPAOReady && (
                  <button
                    onClick={() => {
                      onSetAllPAOReady(true, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
                      onEarnPoints(15, 'סימון 10 שלשות ראשונות כמוכנות');
                    }}
                    className="btn-duo-neutral px-4 py-2.5 text-xs font-bold cursor-pointer"
                  >
                    <span>סמן שלשות 00-09 והתחל</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-xl border border-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>מתרגל {readyPaoItems.length} שלשות שסומנו כמוכנות (מתוך {paoItems.length})</span>
                </span>
                <button
                  onClick={handleGeneratePao6}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-slate-800 px-3.5 py-1.5 rounded-xl cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>הגרל רצף 6 ספרות חדש</span>
                </button>
              </div>

          <div className="max-w-2xl mx-auto space-y-6 text-center">
            <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 shadow-inner space-y-3">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                רצף 6 ספרות לאיחוד PAO:
              </span>
              <div className="flex items-center justify-center gap-3 font-mono text-4xl sm:text-5xl font-black text-white">
                <div className="flex flex-col items-center">
                  <span className="bg-slate-900 px-3 py-1 rounded-xl text-amber-400 border border-amber-500/30">
                    {pao6Digits.slice(0, 2)}
                  </span>
                  <span className="text-[11px] font-sans font-bold text-amber-300/90 mt-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    ר"ת: {getPAOInitials(parseInt(pao6Digits.slice(0, 2), 10) || 0).initials}
                  </span>
                </div>
                <span className="text-slate-600 self-center">-</span>
                <div className="flex flex-col items-center">
                  <span className="bg-slate-900 px-3 py-1 rounded-xl text-indigo-400 border border-indigo-500/30">
                    {pao6Digits.slice(2, 4)}
                  </span>
                  <span className="text-[11px] font-sans font-bold text-indigo-300/90 mt-1 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    ר"ת: {getPAOInitials(parseInt(pao6Digits.slice(2, 4), 10) || 0).initials}
                  </span>
                </div>
                <span className="text-slate-600 self-center">-</span>
                <div className="flex flex-col items-center">
                  <span className="bg-slate-900 px-3 py-1 rounded-xl text-teal-400 border border-teal-500/30">
                    {pao6Digits.slice(4, 6)}
                  </span>
                  <span className="text-[11px] font-sans font-bold text-teal-300/90 mt-1 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                    ר"ת: {getPAOInitials(parseInt(pao6Digits.slice(4, 6), 10) || 0).initials}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-2 font-semibold">
                <span className="text-amber-400">דמות (P)</span>
                <span className="text-indigo-400">פעולה קינטית (A)</span>
                <span className="text-teal-400">חפץ פסיבי (O)</span>
              </div>
            </div>

            {!sceneRevealed ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  דמיין במוחך: מיהי הדמות לפי ראשי התיבות? מה הפעולה הדינמית שהיא עושה? ועל איזה חפץ?
                </p>
                <button
                  onClick={() => {
                    setSceneRevealed(true);
                    onEarnPoints(25, 'פענוח שלשת PAO');
                    onUnlockBadge('שלשת אלופים (PAO)');
                    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
                  }}
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  חשוף את הסצנה המאוחדת (+25 XP)
                </button>
              </div>
            ) : (
              <div className="bg-slate-950/80 border border-indigo-500/40 rounded-2xl p-6 space-y-4 text-right animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-amber-400 font-bold block">דמות (P):</span>
                      <span className="text-[10px] text-amber-300 font-mono font-bold">
                        [{getPAOInitials(parseInt(pao6Digits.slice(0, 2), 10) || 0).initials}]
                      </span>
                    </div>
                    <strong className="text-white text-sm">{parsedPao.person}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-indigo-400 font-bold block">פעולה (A):</span>
                      <span className="text-[10px] text-indigo-300 font-mono font-bold">
                        [{getPAOInitials(parseInt(pao6Digits.slice(2, 4), 10) || 0).initials}]
                      </span>
                    </div>
                    <strong className="text-white text-sm">{parsedPao.action}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-teal-400 font-bold block">חפץ (O):</span>
                      <span className="text-[10px] text-teal-300 font-mono font-bold">
                        [{getPAOInitials(parseInt(pao6Digits.slice(4, 6), 10) || 0).initials}]
                      </span>
                    </div>
                    <strong className="text-white text-sm">{parsedPao.object}</strong>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs sm:text-sm text-indigo-200 leading-relaxed font-medium">
                  ⚡ <strong className="text-amber-400">הסצנה המנמונית הסופית: </strong>
                  "{parsedPao.person} {parsedPao.action} {parsedPao.object}!"
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleGeneratePao6}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                  >
                    הגרל רצף נוסף
                  </button>
                </div>
              </div>
            )}
          </div>
            </>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: REGISTRY 00-99 & CUSTOM */}
      {subView === 'registry' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="חיפוש מספר, דמות, פעולה או חפץ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Ready for Practice Filter Button */}
              <button
                onClick={() => setOnlyReadyFilter(!onlyReadyFilter)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  onlyReadyFilter
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
                title="סנן והצג רק שלשות שסומנו כמוכנות לתרגול"
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${onlyReadyFilter ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>מוכנים בלבד ({readyPaoItems.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Batch Actions */}
              {onSetAllPAOReady && (
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    onClick={() => {
                      onSetAllPAOReady(true);
                      onEarnPoints(20, 'סימון כל 100 שלשות PAO כמוכנות');
                    }}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    ✓ סמן הכל
                  </button>
                  {readyPaoItems.length > 0 && (
                    <button
                      onClick={() => onSetAllPAOReady(false)}
                      className="text-[11px] font-medium text-slate-400 hover:text-rose-400 px-2 py-1.5 rounded-xl transition-all cursor-pointer"
                      title="בטל את כל סימוני התרגול לשלשות"
                    >
                      נקה סימונים
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>הוסף שלשת PAO חדשה</span>
              </button>
            </div>
          </div>

          {/* Add PAO Form */}
          {showAddForm && (
            <form
              onSubmit={handleAddNewItem}
              className="bg-slate-950 border border-indigo-500/40 rounded-2xl p-4 sm:p-5 space-y-3 animate-fadeIn"
            >
              <h4 className="text-xs font-bold text-indigo-400">הוספת שלשת PAO חדשה</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-right">
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold mb-1">
                    מספר (למשל 99):
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
                      אדם (Person):
                    </label>
                    <AIFieldGeneratorButton
                      promptType="pao_person"
                      inputContext={newNumber}
                      onGenerated={(val) => setNewPerson(val)}
                      label="אדם עם AI"
                      compact
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={newPerson}
                    onChange={(e) => setNewPerson(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 font-semibold">
                      פעולה (Action):
                    </label>
                    <AIFieldGeneratorButton
                      promptType="pao_action"
                      inputContext={newNumber}
                      extraContext={newPerson}
                      onGenerated={(val) => setNewAction(val)}
                      label="פעולה עם AI"
                      compact
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 font-semibold">
                      חפץ (Object):
                    </label>
                    <AIFieldGeneratorButton
                      promptType="pao_object"
                      inputContext={newNumber}
                      extraContext={newPerson}
                      onGenerated={(val) => setNewObject(val)}
                      label="חפץ עם AI"
                      compact
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={newObject}
                    onChange={(e) => setNewObject(e.target.value)}
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
                  className="px-4 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  שמור שלשה
                </button>
              </div>
            </form>
          )}

          {/* Quick Navigator Bar (סרגל ניווט מהיר לשלשות 00-99) */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-inner">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-indigo-400 ml-1">סרגל עשורים ושלשות:</span>
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
                  className="text-[10px] font-mono font-bold px-2 py-1 rounded-lg bg-slate-900 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer"
                >
                  {dec.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
              <span className="text-[10px] text-slate-400">קפיצה לשלשה:</span>
              <select
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) scrollToNumber(val);
                }}
                defaultValue=""
                className="bg-slate-900 border border-slate-700 text-indigo-300 text-xs rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
              >
                <option value="" disabled>בחר מספר...</option>
                {paoItems.map((item) => (
                  <option key={item.number} value={item.number}>
                    #{item.numberStr} - {item.userPerson || item.person}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* PAO Cards Grid with Side Navigator */}
          <div className="flex gap-3 items-start">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[580px] overflow-y-auto pr-1 scroll-smooth">
              {filteredItems.map((item) => {
                const isEditing = editingNum === item.number;
                const p = item.userPerson || item.person;
                const a = item.userAction || item.action;
                const o = item.userObject || item.object;
                const isCustom = !!item.userPerson || !!item.userAction || !!item.userObject;
                const isHighlighted = highlightedNum === item.number;

                return (
                  <div
                    id={`pao-item-${item.number}`}
                    key={item.number}
                    className={`bg-slate-950 border rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between ${
                      isHighlighted
                        ? 'border-indigo-400 ring-4 ring-indigo-400/30 scale-[1.02] shadow-xl shadow-indigo-500/20 bg-indigo-950/20'
                        : isCustom
                        ? 'border-indigo-500/50 shadow-sm shadow-indigo-500/10'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                          {item.numberStr}
                        </span>
                        <span
                          title={`ראשי תיבות לפי שיטת Major: ${getPAOInitials(item.number).fullFormula}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs"
                        >
                          <span className="text-[10px] text-amber-400/70 font-normal">ר"ת:</span>
                          <span>{getPAOInitials(item.number).initials}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {isCustom && (
                          <button
                            onClick={() => {
                              onResetPAOItem(item.number);
                              if (isEditing) setEditingNum(null);
                            }}
                            title="אפס לברירת מחדל"
                            className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                          >
                            <Undo2 className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (isEditing) {
                              setEditingNum(null);
                            } else {
                              setEditingNum(item.number);
                              setEditPerson(p);
                              setEditAction(a);
                              setEditObject(o);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-400 cursor-pointer"
                          title="ערוך שלשה"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {onDeletePAOItem && (
                          <button
                            onClick={() => onDeletePAOItem(item.number)}
                            className="p-1 text-slate-600 hover:text-rose-400 cursor-pointer"
                            title="מחק מהמאגר"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2 pt-1 text-right">
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[9px] text-amber-400 font-bold">אדם (P):</label>
                            <AIFieldGeneratorButton
                              promptType="pao_person"
                              inputContext={item.number.toString()}
                              onGenerated={(val) => setEditPerson(val)}
                              label="אדם עם AI"
                              compact
                            />
                          </div>
                          <input
                            type="text"
                            value={editPerson}
                            onChange={(e) => setEditPerson(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                onUpdatePAOItem(item.number, {
                                  userPerson: editPerson.trim(),
                                  userAction: editAction.trim(),
                                  userObject: editObject.trim(),
                                });
                                setEditingNum(null);
                              }
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[9px] text-indigo-400 font-bold">פעולה (A):</label>
                            <AIFieldGeneratorButton
                              promptType="pao_action"
                              inputContext={item.number.toString()}
                              extraContext={editPerson}
                              onGenerated={(val) => setEditAction(val)}
                              label="פעולה עם AI"
                              compact
                            />
                          </div>
                          <input
                            type="text"
                            value={editAction}
                            onChange={(e) => setEditAction(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                onUpdatePAOItem(item.number, {
                                  userPerson: editPerson.trim(),
                                  userAction: editAction.trim(),
                                  userObject: editObject.trim(),
                                });
                                setEditingNum(null);
                              }
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[9px] text-teal-400 font-bold">חפץ (O):</label>
                            <AIFieldGeneratorButton
                              promptType="pao_object"
                              inputContext={item.number.toString()}
                              extraContext={editPerson}
                              onGenerated={(val) => setEditObject(val)}
                              label="חפץ עם AI"
                              compact
                            />
                          </div>
                          <input
                            type="text"
                            value={editObject}
                            onChange={(e) => setEditObject(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                onUpdatePAOItem(item.number, {
                                  userPerson: editPerson.trim(),
                                  userAction: editAction.trim(),
                                  userObject: editObject.trim(),
                                });
                                setEditingNum(null);
                              }
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-1 pt-1">
                          <span className="text-[9px] text-slate-500 font-mono">↵ Enter לשמירה</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingNum(null)}
                              className="text-[10px] text-slate-400 hover:text-slate-200 px-2"
                            >
                              ביטול
                            </button>
                            <button
                              onClick={() => {
                                onUpdatePAOItem(item.number, {
                                  userPerson: editPerson.trim(),
                                  userAction: editAction.trim(),
                                  userObject: editObject.trim(),
                                });
                                setEditingNum(null);
                              }}
                              className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2.5 py-1 rounded cursor-pointer"
                            >
                              שמור
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-xs">
                        <div className="text-slate-300">
                          <span className="text-amber-400 font-bold ml-1">👤 אדם:</span>
                          {p}
                        </div>
                        <div className="text-slate-300">
                          <span className="text-indigo-400 font-bold ml-1">⚡ פעולה:</span>
                          {a}
                        </div>
                        <div className="text-slate-300">
                          <span className="text-teal-400 font-bold ml-1">📦 חפץ:</span>
                          {o}
                        </div>
                      </div>
                    )}

                    {/* Ready for Practice Checkbox */}
                    <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer select-none py-1 px-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 transition-all">
                        <input
                          type="checkbox"
                          checked={Boolean(item.is_ready_for_practice)}
                          onChange={() => handleTogglePaoReady(item.number, item.is_ready_for_practice)}
                          className="w-3.5 h-3.5 rounded text-indigo-500 focus:ring-indigo-500 cursor-pointer accent-indigo-500"
                        />
                        <span className={`text-[11px] font-bold ${item.is_ready_for_practice ? 'text-indigo-300' : 'text-slate-400'}`}>
                          מוכן לתרגול
                        </span>
                      </label>
                      {item.is_ready_for_practice && (
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3 text-indigo-400" />
                          <span>מוכן</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>

            {/* Vertical Sticky Side Index for PAO (00-99) */}
            <div className="hidden lg:flex flex-col gap-1 bg-slate-950 p-2 rounded-2xl border border-slate-800 max-h-[580px] overflow-y-auto no-scrollbar shrink-0 w-16 text-center shadow-inner">
              <span className="text-[9px] font-bold text-slate-400 pb-1 border-b border-slate-800">שלשה</span>
              {paoItems.map((item) => (
                <button
                  key={item.number}
                  onClick={() => scrollToNumber(item.number)}
                  title={`#${item.numberStr} - ${item.userPerson || item.person}`}
                  className={`text-[10px] font-mono py-1 rounded-lg transition-colors cursor-pointer ${
                    highlightedNum === item.number
                      ? 'bg-indigo-600 text-white font-black'
                      : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-900'
                  }`}
                >
                  {item.numberStr}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: QUIZ */}
      {subView === 'quiz' && (
        <div className="space-y-6">
          {readyPaoItems.length === 0 ? (
            <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-3xl p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto my-6 text-slate-900 animate-fadeIn">
              <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  טרם סימנת פריטים כמוכנים לתרגול במודולה זו. סמן מספר אסוציאציות כדי להתחיל.
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                  כדי שתוכל לשלוט באופן מלא בעקומת הלמידה, מבחן השליפה האקראי מתשאל אך ורק על שלשות שסומנו בתיבת "מוכן לתרגול". סמן את השלשות שהטמעת כדי להתחיל.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                <button
                  onClick={() => setSubView('registry')}
                  className="btn-duo-primary px-5 py-2.5 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>מעבר למאגר השלשות לסימון פריטים</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
                {onSetAllPAOReady && (
                  <button
                    onClick={() => {
                      onSetAllPAOReady(true, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
                      onEarnPoints(15, 'סימון 10 שלשות ראשונות כמוכנות');
                    }}
                    className="btn-duo-neutral px-4 py-2.5 text-xs font-bold cursor-pointer"
                  >
                    <span>סמן 10 שלשות ראשונות והתחל</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-xl border border-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>מתרגל {readyPaoItems.length} שלשות שסומנו כמוכנות (מתוך {paoItems.length})</span>
                </span>
                <button
                  onClick={handleNextQuizQuestion}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-slate-800 px-3.5 py-1.5 rounded-xl cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>שאלה אקראית חדשה</span>
                </button>
              </div>

              {currentQuizItem && (
                <div className="max-w-xl mx-auto space-y-6 text-center">
                  <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 shadow-inner space-y-3">
                    {quizType === 'numberToAll' ? (
                      <>
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                          מי הדמות של המספר:
                        </span>
                        <div className="text-6xl font-black text-white tracking-wider">
                          {currentQuizItem.numberStr}
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                          מה המספר של הדמות:
                        </span>
                        <div className="text-3xl font-black text-white tracking-wide">
                          {currentQuizItem.userPerson || currentQuizItem.person}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-2 max-w-sm mx-auto">
                      {quizType === 'numberToAll' ? (
                        <input
                          type="text"
                          value={userGuessPerson}
                          onChange={(e) => setUserGuessPerson(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (quizFeedback !== 'idle' || revealQuizAnswer) {
                                handleNextQuizQuestion();
                              } else {
                                handleCheckQuiz();
                              }
                            }
                          }}
                          placeholder="הקלד את שם הדמות..."
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                        />
                      ) : (
                        <input
                          type="text"
                          value={userGuessNumber}
                          onChange={(e) => setUserGuessNumber(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (quizFeedback !== 'idle' || revealQuizAnswer) {
                                handleNextQuizQuestion();
                              } else {
                                handleCheckQuiz();
                              }
                            }
                          }}
                          placeholder="הקלד את המספר (למשל 21)..."
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center text-sm font-bold text-white focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      )}
                      <button
                        onClick={() => {
                          if (quizFeedback !== 'idle' || revealQuizAnswer) {
                            handleNextQuizQuestion();
                          } else {
                            handleCheckQuiz();
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                      >
                        {quizFeedback !== 'idle' || revealQuizAnswer ? 'הבא ↵' : 'בדוק'}
                      </button>
                    </div>

                    {quizFeedback === 'correct' && (
                      <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex flex-col items-center justify-center gap-1.5 animate-fadeIn">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span className="font-bold text-sm">מעולה! שליפה מדויקת (+20 XP)</span>
                        </div>
                        <span className="text-[11px] text-emerald-400/90 font-medium">
                          לחץ Enter כדי לעבור ישר לשאלה האקראית הבאה ↵
                        </span>
                      </div>
                    )}

                    {quizFeedback === 'incorrect' && (
                      <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 flex flex-col items-center justify-center gap-1.5 animate-fadeIn">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-5 h-5 text-rose-400" />
                          <span className="font-bold text-sm">תשובה שגויה - התשובה הנכונה מוצגת למטה</span>
                        </div>
                        <span className="text-[11px] text-rose-300/90 font-medium">
                          אין צורך להקליד מחדש. לחץ Enter כדי לעבור ישר לשאלה הבאה ↵
                        </span>
                      </div>
                    )}

                    {/* Always show full PAO triplet & kinetic scene on correct answer OR reveal */}
                    {(quizFeedback === 'correct' || quizFeedback === 'incorrect' || revealQuizAnswer) && (
                      <div className="bg-slate-950/90 border border-indigo-500/40 rounded-2xl p-5 text-xs space-y-3 text-right animate-fadeIn shadow-xl shadow-indigo-500/5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-indigo-400 font-bold flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            שלשת PAO המלאה למספר {currentQuizItem.numberStr}:
                          </span>
                          <span className="text-[11px] font-mono text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            ר"ת: {getPAOInitials(currentQuizItem.number).initials}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center pt-1">
                          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                            <span className="text-[10px] text-amber-400 font-bold block">👤 דמות (P):</span>
                            <strong className="text-white text-xs block mt-0.5">
                              {currentQuizItem.userPerson || currentQuizItem.person}
                            </strong>
                          </div>
                          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                            <span className="text-[10px] text-indigo-400 font-bold block">⚡ פעולה (A):</span>
                            <strong className="text-white text-xs block mt-0.5">
                              {currentQuizItem.userAction || currentQuizItem.action}
                            </strong>
                          </div>
                          <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30">
                            <span className="text-[10px] text-teal-400 font-bold block">📦 חפץ (O):</span>
                            <strong className="text-white text-xs block mt-0.5">
                              {currentQuizItem.userObject || currentQuizItem.object}
                            </strong>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200">
                          ⚡ <strong className="text-amber-400">סצנה מנטלית:</strong>{' '}
                          "{currentQuizItem.userPerson || currentQuizItem.person} {currentQuizItem.userAction || currentQuizItem.action} {currentQuizItem.userObject || currentQuizItem.object}"
                        </div>

                        <div className="flex justify-center pt-1">
                          <button
                            onClick={handleNextQuizQuestion}
                            className="text-xs text-indigo-300 hover:text-white font-bold inline-flex items-center gap-1 bg-slate-900 px-4 py-2 rounded-xl border border-indigo-500/30 cursor-pointer shadow-sm hover:border-indigo-400"
                          >
                            <span>לשאלה האקראית הבאה (Enter ↵)</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {quizFeedback !== 'correct' && !revealQuizAnswer && (
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => setRevealQuizAnswer(true)}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-300 cursor-pointer"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>חשוף שלשה מלאה (אדם, פעולה, חפץ)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
