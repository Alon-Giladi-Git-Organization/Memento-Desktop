import React, { useState } from 'react';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MajorItem } from '../../types/memory';
import { AIFieldGeneratorButton } from '../AIFieldGeneratorButton';

interface MajorModuleProps {
  majorDigits: MajorItem[];
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
      userWord?: string;
      userConsonants?: string;
      userImageHint?: string;
      customNotes?: string;
    }
  ) => void;
  onDeleteMajorItem?: (number: number) => void;
  onResetMajorItem: (number: number) => void;
  onOpenSummary?: (techniqueId: string) => void;
}

export const MajorModule: React.FC<MajorModuleProps> = ({
  majorDigits,
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
}) => {
  const [subView, setSubView] = useState<'digits' | 'table' | 'quiz'>('digits');
  const [search, setSearch] = useState('');
  const [decadeFilter, setDecadeFilter] = useState('all');
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Editing Single Digit (0-9)
  const [editingDigit, setEditingDigit] = useState<number | null>(null);
  const [editDigitLetters, setEditDigitLetters] = useState('');
  const [editDigitWord, setEditDigitWord] = useState('');
  const [editDigitHint, setEditDigitHint] = useState('');

  // Editing Major Item (00-99)
  const [editingNum, setEditingNum] = useState<number | null>(null);
  const [editWord, setEditWord] = useState('');
  const [editConsonants, setEditConsonants] = useState('');
  const [editHint, setEditHint] = useState('');

  const handleSaveDigit = (digitNum: number) => {
    onUpdateMajorDigit(
      digitNum,
      editDigitLetters.trim(),
      editDigitWord.trim(),
      editDigitHint.trim()
    );
    setEditingDigit(null);
  };

  const handleSaveItem = (itemNum: number) => {
    onUpdateMajorItem(itemNum, {
      userWord: editWord.trim(),
      userConsonants: editConsonants.trim(),
      userImageHint: editHint.trim(),
    });
    setEditingNum(null);
  };

  const handleApplyToAll = () => {
    onRecalculateMajor00_99FromDigits(majorDigits);
    onEarnPoints(20, 'סנכרון אותיות ומילים חדשות לכל מספרי 0-99');
    setSyncToast('האותיות החדשות הוחלו וכל 100 המילים והתמונות ב-0 עד 99 חושבו והותאמו מחדש בהצלחה!');
    setTimeout(() => {
      setSyncToast(null);
    }, 4500);
  };

  // Add New Major Item Modal/State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [newWord, setNewWord] = useState('');
  const [newConsonants, setNewConsonants] = useState('');
  const [newHint, setNewHint] = useState('');

  // Quiz State
  const [quizIndex, setQuizIndex] = useState(0);
  const [userGuess, setUserGuess] = useState('');
  const [quizFeedback, setQuizFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [revealHint, setRevealHint] = useState(false);
  const [isQuizEditing, setIsQuizEditing] = useState(false);
  const [quizEditWord, setQuizEditWord] = useState('');
  const [quizEditConsonants, setQuizEditConsonants] = useState('');
  const [quizEditHint, setQuizEditHint] = useState('');

  // Jump to specific number in table
  const [highlightedNum, setHighlightedNum] = useState<number | null>(null);

  const scrollToNumber = (num: number) => {
    setDecadeFilter('all');
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
    if (majorItems.length === 0) return;
    const nextIdx = Math.floor(Math.random() * majorItems.length);
    setQuizIndex(nextIdx);
    setUserGuess('');
    setQuizFeedback('idle');
    setRevealHint(false);
    setIsQuizEditing(false);
  };

  const handleCheckAnswer = () => {
    const current = majorItems[quizIndex];
    if (!current) return;
    const guess = userGuess.trim().toLowerCase();
    if (!guess) return;

    const userWord = (current.userWord || '').trim().toLowerCase();
    const defaultWord = (current.defaultWord || '').trim().toLowerCase();

    // STRICT 100% EQUALITY MATCH ONLY - no substring / partial match allowed
    const isExactMatch = (userWord && guess === userWord) || (defaultWord && guess === defaultWord);

    if (isExactMatch) {
      setQuizFeedback('correct');
      onEarnPoints(15, 'מענה נכון במבחן Major');
      onUnlockBadge('שליטה בעיצורים (Major)');
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } else {
      setQuizFeedback('incorrect');
    }
  };

  const handleSaveQuizEdit = () => {
    const current = majorItems[quizIndex];
    if (!current) return;
    onUpdateMajorItem(current.number, {
      userWord: quizEditWord.trim(),
      userConsonants: quizEditConsonants.trim(),
      userImageHint: quizEditHint.trim(),
    });
    setIsQuizEditing(false);
    onEarnPoints(10, 'עדכון אסוציאציה מתוך מבחן השליפה');
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(newNumber, 10);
    if (isNaN(num)) return;
    const numStr = num < 10 && num >= 0 ? `0${num}` : `${num}`;

    if (onAddMajorItem) {
      onAddMajorItem({
        number: num,
        numberStr: numStr,
        defaultWord: newWord.trim(),
        userWord: newWord.trim(),
        consonants: newConsonants.trim(),
        userConsonants: newConsonants.trim(),
        imageHint: newHint.trim(),
        userImageHint: newHint.trim(),
      });
    }

    setNewNumber('');
    setNewWord('');
    setNewConsonants('');
    setNewHint('');
    setShowAddForm(false);
  };

  const filteredItems = majorItems.filter((item) => {
    const matchesSearch =
      item.numberStr.includes(search) ||
      (item.userWord || item.defaultWord).toLowerCase().includes(search.toLowerCase()) ||
      (item.userConsonants || item.consonants).includes(search);

    if (decadeFilter === 'all') return matchesSearch;
    const decade = parseInt(decadeFilter, 10);
    const matchesDecade = item.number >= decade && item.number < decade + 10;
    return matchesSearch && matchesDecade;
  });

  return (
    <div className="bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-slate-900">
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
            הגדר והתאם אישית את ספרות היסוד (0-9), את מאגר המספרים (00-99+), והיבחן עליהם
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border-2 border-slate-200 self-stretch md:self-auto justify-center">
          <button
            onClick={() => setSubView('digits')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              subView === 'digits'
                ? 'bg-[#58CC02] text-white border-b-2 border-[#46a302] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>ספרות 0-9 ואותיות</span>
          </button>
          <button
            onClick={() => setSubView('table')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              subView === 'table'
                ? 'bg-[#58CC02] text-white border-b-2 border-[#46a302] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>מאגר מספרים ({majorItems.length})</span>
          </button>
          <button
            onClick={() => setSubView('quiz')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              subView === 'quiz'
                ? 'bg-[#58CC02] text-white border-b-2 border-[#46a302] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>מבחן שליפה</span>
          </button>
        </div>
      </div>

      {/* Connecting Letters Rule Note / חוק אותיות הקישור */}
      <div className="bg-gradient-to-r from-sky-50 via-white to-indigo-50 border border-sky-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-right">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 border border-sky-300 flex items-center justify-center font-bold shrink-0 text-base shadow-xs">
            💡
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-sky-900">
                חוק "אותיות הקישור" (ללא ספרה משויכת):
              </span>
              <span className="text-xs font-mono font-bold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-lg border border-sky-300">
                א', ה', ו', י, נ', ע'
              </span>
              <span className="text-xs font-black text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-300">
                ביטוי עזר אנגרמתי לזיכרון: "אני עונה"
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              לאותיות אלו אין ספרה משויכת, והן משמשות חופשי כחומרי קישור. כל מילות 00-99 מורכבות <strong>אך ורק</strong> מעיצורי המספר עצמו + אותיות הקישור הללו (למשל: <span className="text-amber-800 font-bold">11 = לול</span>, כי 1=ל ו-ו' אות קישור, ללא עיצורים זרים).
            </p>
          </div>
        </div>
      </div>

      {/* SUB-VIEW 1: DIGITS 0-9 */}
      {subView === 'digits' && (
        <div className="space-y-6">
          {syncToast && (
            <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 p-3.5 rounded-2xl text-xs flex items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">{syncToast}</span>
              </div>
              <button
                onClick={() => setSyncToast(null)}
                className="text-emerald-400 hover:text-white text-xs px-2 py-0.5 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl">
            <div className="text-right">
              <h4 className="text-xs font-bold text-amber-300">
                ⚡ התאמה אישית של עיצורי הבסיס (0 עד 9)
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5">
                שינית אותיות לספרה כלשהי? לחץ על "החל על כל 0-99" כדי לעדכן אוטומטית את צמדי העיצורים,
                וליצור מילים ותמונות מנמוניות חדשות ומותאמות לכל 100 המספרים!
              </p>
            </div>
            <button
              onClick={handleApplyToAll}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shrink-0 shadow-md shadow-amber-500/20 active:scale-95"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>החל על כל 0-99</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {majorDigits.map((item) => {
              const isEditing = editingDigit === item.number;
              const activeConsonants = item.userConsonants || item.consonants;
              const activeWord = item.userWord || item.defaultWord;
              const activeHint = item.userImageHint || item.imageHint;
              const isCustom = !!item.userConsonants || !!item.userWord;

              return (
                <div
                  key={item.number}
                  className={`bg-slate-950 border rounded-2xl p-4 transition-all flex flex-col justify-between ${
                    isCustom
                      ? 'border-amber-500/60 shadow-lg shadow-amber-500/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 font-black text-lg flex items-center justify-center border border-amber-500/40">
                        {item.number}
                      </span>
                      <div className="flex items-center gap-1">
                        {isCustom && (
                          <button
                            onClick={() => {
                              onResetMajorDigit(item.number);
                              if (isEditing) setEditingDigit(null);
                            }}
                            title="אפס לברירת מחדל"
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Undo2 className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (isEditing) {
                              setEditingDigit(null);
                            } else {
                              setEditingDigit(item.number);
                              setEditDigitLetters(activeConsonants);
                              setEditDigitWord(activeWord);
                              setEditDigitHint(activeHint);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                          title="ערוך ספרת יסוד"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2 pt-1 text-right">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] text-slate-400 font-semibold">
                              אותיות / עיצורים:
                            </label>
                            <AIFieldGeneratorButton
                              promptType="major_consonants"
                              inputContext={item.number.toString()}
                              onGenerated={(val) => setEditDigitLetters(val)}
                              label="עיצורים עם AI"
                              compact
                            />
                          </div>
                          <input
                            type="text"
                            value={editDigitLetters}
                            onChange={(e) => setEditDigitLetters(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveDigit(item.number);
                              }
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] text-slate-400 font-semibold">
                              מילה מייצגת:
                            </label>
                            <AIFieldGeneratorButton
                              promptType="major_word"
                              inputContext={item.number.toString()}
                              extraContext={editDigitLetters}
                              onGenerated={(val) => setEditDigitWord(val)}
                              label="מילה עם AI"
                              compact
                            />
                          </div>
                          <input
                            type="text"
                            value={editDigitWord}
                            onChange={(e) => setEditDigitWord(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveDigit(item.number);
                              }
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] text-slate-400 font-semibold">
                              דימוי ויזואלי / סצנה:
                            </label>
                            <AIFieldGeneratorButton
                              promptType="major_hint"
                              inputContext={item.number.toString()}
                              extraContext={editDigitWord}
                              onGenerated={(val) => setEditDigitHint(val)}
                              label="סצנה עם AI"
                              compact
                            />
                          </div>
                          <input
                            type="text"
                            value={editDigitHint}
                            onChange={(e) => setEditDigitHint(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveDigit(item.number);
                              }
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[10px] text-slate-300"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-1 pt-1.5">
                          <span className="text-[9px] text-slate-500 font-mono">↵ Enter לשמירה</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingDigit(null)}
                              className="text-[10px] text-slate-400 hover:text-slate-200 px-2 py-1"
                            >
                              ביטול
                            </button>
                            <button
                              onClick={() => handleSaveDigit(item.number)}
                              className="text-[10px] bg-amber-500 text-slate-950 font-bold px-2.5 py-1 rounded-lg cursor-pointer hover:bg-amber-400"
                            >
                              שמור
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-medium">אותיות:</span>
                          <span className="font-mono text-base font-bold text-amber-300">
                            {activeConsonants}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-bold text-white block">{activeWord}</span>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                            {activeHint}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: TABLE 00-99 & CUSTOM */}
      {subView === 'table' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="חיפוש מספר, מילה או אות..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={decadeFilter}
                  onChange={(e) => setDecadeFilter(e.target.value)}
                  className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900 text-white">כל העשורים</option>
                  {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map((d) => (
                    <option key={d} value={d} className="bg-slate-900 text-white">
                      {d === 0 ? 'ספרות 0-9' : `עשור ${d} (${d}-${d + 9})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>הוסף מספר ואסוציאציה חדשה</span>
            </button>
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
                    #{item.numberStr} - {item.userWord || item.defaultWord}
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

          {/* Cards Grid with Side Navigator */}
          <div className="flex gap-3 items-start">
            {/* Main Cards Grid */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[580px] overflow-y-auto pr-1 scroll-smooth">
              {filteredItems.map((item) => {
                const isEditing = editingNum === item.number;
                const activeWord = item.userWord || item.defaultWord;
                const activeConsonants = item.userConsonants || item.consonants;
                const activeHint = item.userImageHint || item.imageHint;
                const isCustom = !!item.userWord || !!item.userConsonants;
                const isHighlighted = highlightedNum === item.number;

                return (
                  <div
                    id={`major-item-${item.number}`}
                    key={item.number}
                    className={`bg-slate-950 border rounded-2xl p-3.5 transition-all duration-300 flex flex-col justify-between ${
                      isHighlighted
                        ? 'border-amber-400 ring-4 ring-amber-400/30 scale-[1.02] shadow-xl shadow-amber-500/20 bg-amber-950/20'
                        : isCustom
                        ? 'border-amber-500/50 shadow-sm shadow-amber-500/10'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                          {item.numberStr}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
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
                              setEditWord(activeWord);
                              setEditConsonants(activeConsonants);
                              setEditHint(activeHint || '');
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-amber-400 cursor-pointer"
                          title="ערוך מספר"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteMajorItem && (
                          <button
                            onClick={() => onDeleteMajorItem(item.number)}
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
                            <label className="text-[9px] text-slate-400 font-bold">מילה מנמונית:</label>
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
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[9px] text-slate-400 font-bold">עיצורים (ס + ר):</label>
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
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-200"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[9px] text-slate-400 font-bold">סצנה קינטית:</label>
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
                            placeholder="סצנה קינטית..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[10px] text-slate-300"
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
                              onClick={() => handleSaveItem(item.number)}
                              className="text-[10px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded cursor-pointer"
                            >
                              שמור
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4 className="text-sm font-bold text-white">{activeWord}</h4>
                        {activeHint && (
                          <p className="text-[10px] text-slate-400 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                            ⚡ {activeHint}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            </div>

            {/* Vertical Sticky Side Index for 1-100 */}
            <div className="hidden lg:flex flex-col gap-1 bg-slate-950 p-2 rounded-2xl border border-slate-800 max-h-[580px] overflow-y-auto no-scrollbar shrink-0 w-16 text-center shadow-inner">
              <span className="text-[9px] font-bold text-slate-400 pb-1 border-b border-slate-800">מספר</span>
              {majorItems.map((item) => (
                <button
                  key={item.number}
                  onClick={() => scrollToNumber(item.number)}
                  title={`#${item.numberStr} - ${item.userWord || item.defaultWord}`}
                  className={`text-[10px] font-mono py-1 rounded-lg transition-colors cursor-pointer ${
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

      {/* SUB-VIEW 3: QUIZ */}
      {subView === 'quiz' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="text-xs text-slate-400 font-medium">
              💡 טיפ: לחץ <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-amber-300 font-mono text-[10px]">Ctrl + Enter</kbd> לחשיפת התשובה והסצנה בכל שלב
            </div>
            <button
              onClick={handleNextQuestion}
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 bg-slate-800 px-3.5 py-1.5 rounded-xl cursor-pointer hover:bg-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>מספר אקראי חדש</span>
            </button>
          </div>

          {majorItems[quizIndex] && (
            <div className="max-w-xl mx-auto space-y-6 text-center">
              <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 shadow-inner space-y-3 relative overflow-hidden">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  מה המילה המנמונית של המספר:
                </span>
                <div className="text-6xl font-black text-white tracking-wider">
                  {majorItems[quizIndex].numberStr}
                </div>
                <div className="text-xs text-slate-400">
                  עיצורים מנחים:{' '}
                  <strong className="text-slate-200">
                    {majorItems[quizIndex].userConsonants || majorItems[quizIndex].consonants}
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
                            const cur = majorItems[quizIndex];
                            if (cur) {
                              setQuizEditWord(cur.userWord || cur.defaultWord);
                              setQuizEditConsonants(cur.userConsonants || cur.consonants);
                              setQuizEditHint(cur.userImageHint || cur.imageHint || '');
                              setIsQuizEditing(!isQuizEditing);
                            }
                          }}
                          className="text-[11px] text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{isQuizEditing ? 'סגור עריכה' : 'שנה אסוציאציה'}</span>
                        </button>
                        <span className="text-[11px] font-mono text-slate-400">
                          #{majorItems[quizIndex].numberStr}
                        </span>
                      </div>
                    </div>

                    {isQuizEditing ? (
                      <div className="space-y-3 bg-slate-900 p-3.5 rounded-xl border border-amber-500/30 animate-fadeIn">
                        <div className="text-xs font-bold text-amber-300">עריכת האסוציאציה למספר {majorItems[quizIndex].numberStr}:</div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] text-slate-400 font-bold">מילה מנמונית:</label>
                            <AIFieldGeneratorButton
                              promptType="major_word"
                              inputContext={majorItems[quizIndex].number.toString()}
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
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] text-slate-400 font-bold">סצנה קינטית:</label>
                            <AIFieldGeneratorButton
                              promptType="major_hint"
                              inputContext={majorItems[quizIndex].number.toString()}
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
                            onClick={handleSaveQuizEdit}
                            className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-1 rounded-lg cursor-pointer"
                          >
                            שמור שינויים
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-amber-300 font-bold text-sm">
                          מילה מנמונית: <span className="text-white text-base font-black">{majorItems[quizIndex].userWord || majorItems[quizIndex].defaultWord}</span>
                        </div>
                        <div className="text-slate-200 bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-xs leading-relaxed">
                          ⚡ <strong className="text-amber-400">סצנה קינטית מוקצנת:</strong>{' '}
                          {majorItems[quizIndex].userImageHint || majorItems[quizIndex].imageHint || 'התנגשות קינטית עזה שצרובה בהיפוקמפוס.'}
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
        </div>
      )}
    </div>
  );
};
