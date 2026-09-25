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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PAOItem } from '../../types/memory';
import { getPAOInitials } from '../../lib/paoInitials';
import { AIFieldGeneratorButton } from '../AIFieldGeneratorButton';

interface PAOModuleProps {
  paoItems: PAOItem[];
  onEarnPoints: (amount: number, reason?: string) => void;
  onUnlockBadge: (badge: string) => void;
  onAddPAOItem?: (item: PAOItem) => void;
  onUpdatePAOItem: (
    number: number,
    updates: { userPerson?: string; userAction?: string; userObject?: string }
  ) => void;
  onDeletePAOItem?: (number: number) => void;
  onResetPAOItem: (number: number) => void;
  onOpenSummary?: (techniqueId: string) => void;
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
}) => {
  const [subView, setSubView] = useState<'sixDigits' | 'registry' | 'quiz'>('sixDigits');
  const [search, setSearch] = useState('');

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

  // PAO Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizType, setQuizType] = useState<'numberToAll' | 'personToNumber'>('numberToAll');
  const [userGuessPerson, setUserGuessPerson] = useState('');
  const [userGuessAction, setUserGuessAction] = useState('');
  const [userGuessObject, setUserGuessObject] = useState('');
  const [userGuessNumber, setUserGuessNumber] = useState('');
  const [quizFeedback, setQuizFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [revealQuizAnswer, setRevealQuizAnswer] = useState(false);

  const handleGeneratePao6 = () => {
    let res = '';
    for (let i = 0; i < 6; i++) {
      res += Math.floor(Math.random() * 10).toString();
    }
    setPao6Digits(res);
    setSceneRevealed(false);
  };

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
    if (paoItems.length === 0) return;
    const nextIdx = Math.floor(Math.random() * paoItems.length);
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
    const current = paoItems[quizIndex];
    if (!current) return;

    if (quizType === 'numberToAll') {
      const targetP = (current.userPerson || '').trim().toLowerCase();
      const defaultP = (current.person || '').trim().toLowerCase();
      const guessP = userGuessPerson.trim().toLowerCase();
      if (!guessP) return;

      // STRICT 100% EQUALITY CHECK ONLY
      const isExactMatch = (targetP && guessP === targetP) || (defaultP && guessP === defaultP);
      if (isExactMatch) {
        setQuizFeedback('correct');
        onEarnPoints(20, 'זיהוי מדויק של רכיב PAO');
        onUnlockBadge('שלשת אלופים (PAO)');
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      } else {
        setQuizFeedback('incorrect');
      }
    } else {
      const guessNum = userGuessNumber.trim();
      if (!guessNum) return;
      if (guessNum === current.numberStr || parseInt(guessNum, 10) === current.number) {
        setQuizFeedback('correct');
        onEarnPoints(20, 'שליפת מספר משלשת PAO');
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      } else {
        setQuizFeedback('incorrect');
      }
    }
  };

  const filteredItems = paoItems.filter((item) => {
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
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
      {/* Header and Sub-Tabs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" />
              <span>שלשות PAO (אדם - פעולה - חפץ)</span>
            </h2>
            {onOpenSummary && (
              <button
                onClick={() => onOpenSummary('pao')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer"
                title="צפה בסיכום הטכניקה ודוגמאות מעשיות"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>סיכום ודוגמאות</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            קודד 6 ספרות לסצנה קולנועית אחת לפי ראשי תיבות של אותיות ה-Major (למשל 14 = ל.ד.)
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-stretch md:self-auto justify-center">
          <button
            onClick={() => setSubView('sixDigits')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subView === 'sixDigits'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>אימון 6 ספרות</span>
          </button>
          <button
            onClick={() => setSubView('registry')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subView === 'registry'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>מאגר שלשות ({paoItems.length})</span>
          </button>
          <button
            onClick={() => setSubView('quiz')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subView === 'quiz'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>מבחן שליפה</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: SIX DIGITS TRAINER */}
      {subView === 'sixDigits' && (
        <div className="space-y-6">
          <div className="flex justify-end">
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
        </div>
      )}

      {/* SUB-VIEW 2: REGISTRY 00-99 & CUSTOM */}
      {subView === 'registry' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="חיפוש מספר, דמות, פעולה או חפץ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>הוסף שלשת PAO חדשה</span>
            </button>
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

          {/* PAO Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[550px] overflow-y-auto pr-1">
            {filteredItems.map((item) => {
              const isEditing = editingNum === item.number;
              const p = item.userPerson || item.person;
              const a = item.userAction || item.action;
              const o = item.userObject || item.object;
              const isCustom = !!item.userPerson || !!item.userAction || !!item.userObject;

              return (
                <div
                  key={item.number}
                  className={`bg-slate-950 border rounded-2xl p-4 transition-all flex flex-col justify-between ${
                    isCustom
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
          <div className="flex justify-end">
            <button
              onClick={handleNextQuizQuestion}
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-slate-800 px-3.5 py-1.5 rounded-xl cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>שאלה אקראית חדשה</span>
            </button>
          </div>

          {paoItems[quizIndex] && (
            <div className="max-w-xl mx-auto space-y-6 text-center">
              <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 shadow-inner space-y-3">
                {quizType === 'numberToAll' ? (
                  <>
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                      מי הדמות של המספר:
                    </span>
                    <div className="text-6xl font-black text-white tracking-wider">
                      {paoItems[quizIndex].numberStr}
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                      מה המספר של הדמות:
                    </span>
                    <div className="text-3xl font-black text-white tracking-wide">
                      {paoItems[quizIndex].userPerson || paoItems[quizIndex].person}
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
                          if (quizFeedback === 'correct') {
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
                          if (quizFeedback === 'correct') {
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
                      if (quizFeedback === 'correct') {
                        handleNextQuizQuestion();
                      } else {
                        handleCheckQuiz();
                      }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    {quizFeedback === 'correct' ? 'הבא ↵' : 'בדוק'}
                  </button>
                </div>

                {quizFeedback === 'correct' && (
                  <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex flex-col items-center justify-center gap-1.5 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="font-bold text-sm">מעולה! שליפה מהירה ומדויקת ב-100% (+20 XP)</span>
                    </div>
                    <span className="text-[11px] text-emerald-400/90 font-medium">
                      לחץ Enter כדי לעבור ישר לשאלה האקראית הבאה ↵
                    </span>
                  </div>
                )}

                {quizFeedback === 'incorrect' && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center gap-2 animate-fadeIn">
                    <XCircle className="w-5 h-5" />
                    <span className="font-bold text-sm">לא מדויק. נסה שוב או חשוף את השלשה</span>
                  </div>
                )}

                {/* Always show full PAO triplet & kinetic scene on correct answer OR reveal */}
                {(quizFeedback === 'correct' || revealQuizAnswer) && (
                  <div className="bg-slate-950/90 border border-indigo-500/40 rounded-2xl p-5 text-xs space-y-3 text-right animate-fadeIn shadow-xl shadow-indigo-500/5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-indigo-400 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        שלשת PAO המלאה למספר {paoItems[quizIndex].numberStr}:
                      </span>
                      <span className="text-[11px] font-mono text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        ר"ת: {getPAOInitials(paoItems[quizIndex].number).initials}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center pt-1">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                        <span className="text-[10px] text-amber-400 font-bold block">👤 דמות (P):</span>
                        <strong className="text-white text-xs block mt-0.5">
                          {paoItems[quizIndex].userPerson || paoItems[quizIndex].person}
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                        <span className="text-[10px] text-indigo-400 font-bold block">⚡ פעולה (A):</span>
                        <strong className="text-white text-xs block mt-0.5">
                          {paoItems[quizIndex].userAction || paoItems[quizIndex].action}
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30">
                        <span className="text-[10px] text-teal-400 font-bold block">📦 חפץ (O):</span>
                        <strong className="text-white text-xs block mt-0.5">
                          {paoItems[quizIndex].userObject || paoItems[quizIndex].object}
                        </strong>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200">
                      ⚡ <strong className="text-amber-400">סצנה מנטלית:</strong>{' '}
                      "{paoItems[quizIndex].userPerson || paoItems[quizIndex].person} {paoItems[quizIndex].userAction || paoItems[quizIndex].action} {paoItems[quizIndex].userObject || paoItems[quizIndex].object}"
                    </div>

                    {quizFeedback === 'correct' && (
                      <div className="flex justify-center pt-1">
                        <button
                          onClick={handleNextQuizQuestion}
                          className="text-xs text-indigo-300 hover:text-white font-bold inline-flex items-center gap-1 bg-slate-900 px-3 py-1.5 rounded-xl border border-indigo-500/30 cursor-pointer"
                        >
                          <span>לשאלה הבאה (Enter ↵)</span>
                        </button>
                      </div>
                    )}
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
        </div>
      )}
    </div>
  );
};
