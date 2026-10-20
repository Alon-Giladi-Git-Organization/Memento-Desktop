import React, { useState } from 'react';
import {
  Layers,
  Edit3,
  Undo2,
  Trash2,
  Plus,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Check,
  XCircle,
  RotateCcw,
  BookOpen,
  Search,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PegShapeItem, BodyPegItem } from '../../types/memory';
import { AIFieldGeneratorButton } from '../AIFieldGeneratorButton';
import { isHebrewFuzzyMatch, isHebrewMultiFieldSearchMatch } from '../../lib/fuzzyMatch';
import {
  getCurrentOrInitialDeckItem,
  advanceToNextDeckItem,
  resetQuizDeck,
  DeckProgress,
} from '../../lib/quizDeckManager';
import { QuizDeckProgressBar } from '../QuizDeckProgressBar';

interface PegsModuleProps {
  shapePegs: PegShapeItem[];
  bodyPegs: BodyPegItem[];
  onEarnPoints: (amount: number, reason?: string) => void;
  onUnlockBadge: (badge: string) => void;
  onAddShapePeg?: (item: PegShapeItem) => void;
  onUpdateShapePeg: (
    number: number,
    updates: { defaultObject?: string; shapeName?: string; kineticTip?: string; is_ready_for_practice?: boolean }
  ) => void;
  onDeleteShapePeg?: (number: number) => void;
  onResetShapePeg: (number: number) => void;
  onToggleShapePegReady?: (number: number, explicitState?: boolean) => void;
  onSetAllShapePegsReady?: (ready: boolean) => void;
  onAddBodyPeg?: (item: BodyPegItem) => void;
  onUpdateBodyPeg: (
    index: number,
    updates: { defaultObject?: string; bodyPartHebrew?: string; kineticTip?: string; is_ready_for_practice?: boolean }
  ) => void;
  onDeleteBodyPeg?: (index: number) => void;
  onResetBodyPeg: (index: number) => void;
  onToggleBodyPegReady?: (index: number, explicitState?: boolean) => void;
  onSetAllBodyPegsReady?: (ready: boolean) => void;
  onOpenSummary?: (techniqueId: string) => void;
}

export const PegsModule: React.FC<PegsModuleProps> = ({
  shapePegs,
  bodyPegs,
  onEarnPoints,
  onUnlockBadge,
  onAddShapePeg,
  onUpdateShapePeg,
  onDeleteShapePeg,
  onResetShapePeg,
  onToggleShapePegReady,
  onSetAllShapePegsReady,
  onAddBodyPeg,
  onUpdateBodyPeg,
  onDeleteBodyPeg,
  onResetBodyPeg,
  onToggleBodyPegReady,
  onSetAllBodyPegsReady,
  onOpenSummary,
}) => {
  const [activeTab, setActiveTab] = useState<'shape' | 'body' | 'quiz'>('shape');

  // Edit Peg state
  const [editingPegKey, setEditingPegKey] = useState<number | null>(null);
  const [editObject, setEditObject] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editTip, setEditTip] = useState('');

  // Add Peg Form
  const [showAddShapeForm, setShowAddShapeForm] = useState(false);
  const [newShapeNum, setNewShapeNum] = useState('');
  const [newShapeName, setNewShapeName] = useState('');
  const [newShapeObj, setNewShapeObj] = useState('');
  const [newShapeTip, setNewShapeTip] = useState('');

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [onlyReadyShapeFilter, setOnlyReadyShapeFilter] = useState(false);
  const [onlyReadyBodyFilter, setOnlyReadyBodyFilter] = useState(false);

  const readyShapePegs = shapePegs.filter((p) => p.is_ready_for_practice !== false);
  const filteredShapePegs = shapePegs.filter((p) => {
    if (onlyReadyShapeFilter && p.is_ready_for_practice === false) return false;
    return isHebrewMultiFieldSearchMatch(
      search,
      p.number,
      p.shapeName,
      p.defaultObject,
      p.visualMetaphor,
      p.kineticTip
    );
  });

  const readyBodyPegs = bodyPegs.filter((b) => b.is_ready_for_practice !== false);
  const filteredBodyPegs = bodyPegs.filter((b) => {
    if (onlyReadyBodyFilter && b.is_ready_for_practice === false) return false;
    return isHebrewMultiFieldSearchMatch(
      search,
      b.index,
      b.bodyPartHebrew,
      b.defaultObject,
      b.kineticTip
    );
  });

  const [showAddBodyForm, setShowAddBodyForm] = useState(false);
  const [newBodyIndex, setNewBodyIndex] = useState('');
  const [newBodyPart, setNewBodyPart] = useState('');
  const [newBodyObj, setNewBodyObj] = useState('');
  const [newBodyTip, setNewBodyTip] = useState('');

  // Quiz state (Strictly via non-repeating permutation cycle)
  const [deckProgress, setDeckProgress] = useState<DeckProgress | null>(null);
  const [quizTarget, setQuizTarget] = useState<'shape' | 'body'>('shape');
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizGuess, setQuizGuess] = useState('');
  const [quizFeedback, setQuizFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [revealQuiz, setRevealQuiz] = useState(false);

  // Peek on mount or when target changes
  React.useEffect(() => {
    if (quizTarget === 'shape') {
      if (shapePegs.length > 0) {
        const { item, progress } = getCurrentOrInitialDeckItem('workout_pegs_shape', shapePegs, (p) => p.number);
        if (item) {
          const idx = shapePegs.findIndex((p) => p.number === item.number);
          if (idx >= 0) setQuizIndex(idx);
        }
        setDeckProgress(progress);
      }
    } else {
      if (bodyPegs.length > 0) {
        const { item, progress } = getCurrentOrInitialDeckItem('workout_pegs_body', bodyPegs, (p) => p.index);
        if (item) {
          const idx = bodyPegs.findIndex((p) => p.index === item.index);
          if (idx >= 0) setQuizIndex(idx);
        }
        setDeckProgress(progress);
      }
    }
  }, [quizTarget, shapePegs.length, bodyPegs.length]);

  const handleNextQuizQuestion = () => {
    if (quizTarget === 'shape') {
      if (shapePegs.length === 0) return;
      const { item, progress } = advanceToNextDeckItem('workout_pegs_shape', shapePegs, (p) => p.number);
      if (item) {
        const idx = shapePegs.findIndex((p) => p.number === item.number);
        if (idx >= 0) setQuizIndex(idx);
      }
      setDeckProgress(progress);
    } else {
      if (bodyPegs.length === 0) return;
      const { item, progress } = advanceToNextDeckItem('workout_pegs_body', bodyPegs, (p) => p.index);
      if (item) {
        const idx = bodyPegs.findIndex((p) => p.index === item.index);
        if (idx >= 0) setQuizIndex(idx);
      }
      setDeckProgress(progress);
    }
    setQuizGuess('');
    setQuizFeedback('idle');
    setRevealQuiz(false);
  };

  const handleCheckQuiz = () => {
    const guess = quizGuess.trim();
    if (!guess) return;

    if (quizTarget === 'shape') {
      const current = shapePegs[quizIndex];
      if (!current) return;
      const targetObj = (current.defaultObject || '').trim();
      const targetShape = (current.shapeName || '').trim();
      const isMatch =
        isHebrewFuzzyMatch(guess, targetObj) ||
        isHebrewFuzzyMatch(guess, targetShape) ||
        guess === current.number.toString();

      if (isMatch) {
        setQuizFeedback('correct');
        onEarnPoints(15, 'מענה נכון במבחן מתלי צורה');
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
      } else {
        setQuizFeedback('incorrect');
      }
    } else {
      const current = bodyPegs[quizIndex];
      if (!current) return;
      const targetObj = (current.defaultObject || '').trim();
      const targetBody = (current.bodyPartHebrew || '').trim();
      const isMatch =
        isHebrewFuzzyMatch(guess, targetObj) ||
        isHebrewFuzzyMatch(guess, targetBody) ||
        guess === current.index.toString();

      if (isMatch) {
        setQuizFeedback('correct');
        onEarnPoints(15, 'מענה נכון במבחן מתלי גוף');
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
      } else {
        setQuizFeedback('incorrect');
      }
    }
  };

  const handleAddShape = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(newShapeNum, 10);
    if (isNaN(num)) return;
    if (onAddShapePeg) {
      onAddShapePeg({
        number: num,
        shapeName: newShapeName.trim(),
        defaultObject: newShapeObj.trim(),
        visualMetaphor: `דמיון חזותי לספרה ${num}`,
        kineticTip: newShapeTip.trim() || 'הדבקה מנטלית חזקה',
        is_ready_for_practice: true,
      });
    }
    setNewShapeNum('');
    setNewShapeName('');
    setNewShapeObj('');
    setNewShapeTip('');
    setShowAddShapeForm(false);
  };

  const handleAddBody = (e: React.FormEvent) => {
    e.preventDefault();
    const idx = parseInt(newBodyIndex, 10);
    if (isNaN(idx)) return;
    if (onAddBodyPeg) {
      onAddBodyPeg({
        index: idx,
        bodyPartHebrew: newBodyPart.trim(),
        defaultObject: newBodyObj.trim(),
        kineticTip: newBodyTip.trim() || 'תחושה פיזית חזקה באיבר',
        is_ready_for_practice: true,
      });
    }
    setNewBodyIndex('');
    setNewBodyPart('');
    setNewBodyObj('');
    setNewBodyTip('');
    setShowAddBodyForm(false);
  };

  return (
    <div className="w-full max-w-none bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl space-y-6">
      {/* Header and Sub-Tabs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-yellow-400" />
              <span>מתלי צורה ומתלי גוף (Peg Systems)</span>
            </h2>
            {onOpenSummary && (
              <button
                onClick={() => onOpenSummary('pegs')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-300 border border-yellow-500/30 text-xs font-bold transition-all cursor-pointer"
                title="צפה בסיכום הטכניקה ודוגמאות מעשיות"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>סיכום ודוגמאות</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            השתמש בצורות ספרות או באיברי גופך כמתלים קבועים לתליית פריטים בסדר מדויק
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-stretch md:self-auto justify-center">
          <button
            onClick={() => setActiveTab('shape')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'shape'
                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            מתלי צורת ספרה (0-9)
          </button>
          <button
            onClick={() => setActiveTab('body')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'body'
                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            10 תחנות הגוף (1-10)
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'quiz'
                ? 'bg-yellow-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>מבחן שליפה</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: SHAPE PEGS */}
      {activeTab === 'shape' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-full sm:w-56">
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="חיפוש צורה, חפץ או טיפ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setOnlyReadyShapeFilter(!onlyReadyShapeFilter)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  onlyReadyShapeFilter
                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 shadow-xs'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
                title="הצג רק מתלים שסומנו כמוכנים לתרגול"
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${onlyReadyShapeFilter ? 'text-yellow-400' : 'text-slate-500'}`} />
                <span>מוכנים בלבד ({readyShapePegs.length}/{shapePegs.length})</span>
              </button>

              {onSetAllShapePegsReady && (
                <div className="flex items-center gap-1.5 text-xs bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => {
                      onSetAllShapePegsReady(true);
                      onEarnPoints(10, 'סימון כל מתלי הצורה כמוכנים');
                    }}
                    className="text-xs font-bold text-yellow-400 hover:text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                    title="סמן את כל מתלי הצורה כמוכנים לתרגול (Select All)"
                  >
                    ✓ סמן הכל
                  </button>
                  <button
                    onClick={() => onSetAllShapePegsReady(false)}
                    className="text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                    title="בטל את כל סימוני התרגול למתלי צורה (Deselect All)"
                  >
                    ✗ בטל הכל
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowAddShapeForm(!showAddShapeForm)}
              className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>הוסף מתלה צורה חדש</span>
            </button>
          </div>

          {showAddShapeForm && (
            <form
              onSubmit={handleAddShape}
              className="bg-slate-950 border border-yellow-500/40 rounded-2xl p-4 space-y-3 animate-fadeIn"
            >
              <h4 className="text-xs font-bold text-yellow-400">הוספת מתלה צורה חדש</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-right">
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold mb-1">מספר (למשל 10):</label>
                  <input
                    type="number"
                    required
                    value={newShapeNum}
                    onChange={(e) => setNewShapeNum(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 font-semibold">שם הצורה:</label>
                    <AIFieldGeneratorButton
                      promptType="shape_association"
                      inputContext={`ספרה ${newShapeNum}`}
                      onGenerated={(val) => setNewShapeName(val)}
                      label="שם עם AI"
                      compact
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={newShapeName}
                    onChange={(e) => setNewShapeName(e.target.value)}
                    placeholder="למשל צלחת וכף..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 font-semibold">חפץ תלוי עיקרי:</label>
                    <AIFieldGeneratorButton
                      promptType="shape_association"
                      inputContext={`ספרה ${newShapeNum}`}
                      extraContext={newShapeName}
                      onGenerated={(val) => setNewShapeObj(val)}
                      label="חפץ עם AI"
                      compact
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={newShapeObj}
                    onChange={(e) => setNewShapeObj(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 font-semibold">טיפ קינטי:</label>
                    <AIFieldGeneratorButton
                      promptType="shape_tip"
                      inputContext={newShapeObj || `ספרה ${newShapeNum}`}
                      onGenerated={(val) => setNewShapeTip(val)}
                      label="טיפ עם AI"
                      compact
                    />
                  </div>
                  <input
                    type="text"
                    value={newShapeTip}
                    onChange={(e) => setNewShapeTip(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddShapeForm(false)}
                  className="px-3 py-1 text-xs text-slate-400"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-yellow-500 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                >
                  שמור מתלה
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredShapePegs.map((peg) => {
              const isEditing = editingPegKey === peg.number;
              const isReady = peg.is_ready_for_practice !== false;

              return (
                <div
                  key={peg.number}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 hover:border-yellow-500/40 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="w-9 h-9 rounded-xl bg-yellow-500/20 text-yellow-400 font-black text-xl flex items-center justify-center border border-yellow-500/40 font-mono">
                        {peg.number}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (isEditing) {
                              setEditingPegKey(null);
                            } else {
                              setEditingPegKey(peg.number);
                              setEditObject(peg.defaultObject);
                              setEditTitle(peg.shapeName);
                              setEditTip(peg.kineticTip);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-yellow-400 cursor-pointer"
                          title="ערוך מתלה"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {onDeleteShapePeg && (
                          <button
                            onClick={() => onDeleteShapePeg(peg.number)}
                            className="p-1 text-slate-600 hover:text-rose-400 cursor-pointer"
                            title="מחק מתלה"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2 pt-1 text-right">
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-xs text-slate-400 font-bold">שם הצורה:</label>
                            <AIFieldGeneratorButton
                              promptType="shape_association"
                              inputContext={`ספרה ${peg.number}`}
                              onGenerated={(val) => setEditTitle(val)}
                              label="שם עם AI"
                              compact
                            />
                          </div>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                onUpdateShapePeg(peg.number, {
                                  shapeName: editTitle.trim(),
                                  defaultObject: editObject.trim(),
                                  kineticTip: editTip.trim(),
                                });
                                setEditingPegKey(null);
                              }
                            }}
                            placeholder="שם הצורה..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-xs text-slate-400 font-bold">חפץ המתלה:</label>
                            <AIFieldGeneratorButton
                              promptType="shape_association"
                              inputContext={`ספרה ${peg.number}`}
                              extraContext={editTitle}
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
                                onUpdateShapePeg(peg.number, {
                                  shapeName: editTitle.trim(),
                                  defaultObject: editObject.trim(),
                                  kineticTip: editTip.trim(),
                                });
                                setEditingPegKey(null);
                              }
                            }}
                            placeholder="חפץ המתלה..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-xs text-slate-400 font-bold">טיפ קינטי:</label>
                            <AIFieldGeneratorButton
                              promptType="shape_tip"
                              inputContext={editObject || `ספרה ${peg.number}`}
                              onGenerated={(val) => setEditTip(val)}
                              label="טיפ עם AI"
                              compact
                            />
                          </div>
                          <input
                            type="text"
                            value={editTip}
                            onChange={(e) => setEditTip(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                onUpdateShapePeg(peg.number, {
                                  shapeName: editTitle.trim(),
                                  defaultObject: editObject.trim(),
                                  kineticTip: editTip.trim(),
                                });
                                setEditingPegKey(null);
                              }
                            }}
                            placeholder="טיפ קינטי..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-1 pt-1">
                          <span className="text-[10px] text-slate-500 font-mono">↵ Enter לשמירה</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingPegKey(null)}
                              className="text-xs text-slate-400 hover:text-slate-200 px-2"
                            >
                              ביטול
                            </button>
                            <button
                              onClick={() => {
                                onUpdateShapePeg(peg.number, {
                                  shapeName: editTitle.trim(),
                                  defaultObject: editObject.trim(),
                                  kineticTip: editTip.trim(),
                                });
                                setEditingPegKey(null);
                              }}
                              className="text-xs bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold px-3 py-1 rounded-lg cursor-pointer"
                            >
                              שמור
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-xs font-bold text-yellow-400/90">{peg.shapeName}</div>
                        <div className="font-extrabold text-white text-base">{peg.defaultObject}</div>
                        <p className="text-xs text-slate-300">{peg.visualMetaphor}</p>
                        <p className="text-xs text-yellow-300/90 bg-yellow-950/30 border border-yellow-500/20 p-2.5 rounded-xl">
                          💡 {peg.kineticTip}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Ready for Practice Checkbox */}
                  <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none py-1 px-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 transition-all">
                      <input
                        type="checkbox"
                        checked={isReady}
                        onChange={() => {
                          if (onToggleShapePegReady) {
                            onToggleShapePegReady(peg.number, !isReady);
                          } else {
                            onUpdateShapePeg(peg.number, { is_ready_for_practice: !isReady });
                          }
                        }}
                        className="w-4 h-4 rounded text-yellow-500 focus:ring-yellow-500 cursor-pointer accent-yellow-500"
                      />
                      <span className={`text-xs font-bold ${isReady ? 'text-yellow-300' : 'text-slate-400'}`}>
                        מוכן לתרגול
                      </span>
                    </label>
                    {isReady && (
                      <span className="text-[11px] bg-yellow-500/15 text-yellow-300 font-bold px-2 py-0.5 rounded-full border border-yellow-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3 text-yellow-400" />
                        <span>מוכן</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: BODY PEGS */}
      {activeTab === 'body' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-full sm:w-56">
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="חיפוש איבר גוף, חפץ או טיפ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setOnlyReadyBodyFilter(!onlyReadyBodyFilter)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  onlyReadyBodyFilter
                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 shadow-xs'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
                title="הצג רק תחנות גוף שסומנו כמוכנות לתרגול"
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${onlyReadyBodyFilter ? 'text-yellow-400' : 'text-slate-500'}`} />
                <span>מוכנים בלבד ({readyBodyPegs.length}/{bodyPegs.length})</span>
              </button>

              {onSetAllBodyPegsReady && (
                <div className="flex items-center gap-1.5 text-xs bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => {
                      onSetAllBodyPegsReady(true);
                      onEarnPoints(10, 'סימון כל תחנות הגוף כמוכנות');
                    }}
                    className="text-xs font-bold text-yellow-400 hover:text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                    title="סמן את כל תחנות הגוף כמוכנות לתרגול (Select All)"
                  >
                    ✓ סמן הכל
                  </button>
                  <button
                    onClick={() => onSetAllBodyPegsReady(false)}
                    className="text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                    title="בטל את כל סימוני התרגול לתחנות הגוף (Deselect All)"
                  >
                    ✗ בטל הכל
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowAddBodyForm(!showAddBodyForm)}
              className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>הוסף תחנת גוף</span>
            </button>
          </div>

          {showAddBodyForm && (
            <form
              onSubmit={handleAddBody}
              className="bg-slate-950 border border-yellow-500/40 rounded-2xl p-4 space-y-3 animate-fadeIn"
            >
              <h4 className="text-xs font-bold text-yellow-400">הוספת תחנת גוף חדשה</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-right">
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold mb-1">מספר תחנה (למשל 11):</label>
                  <input
                    type="number"
                    required
                    value={newBodyIndex}
                    onChange={(e) => setNewBodyIndex(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 font-semibold">איבר גוף:</label>
                    <AIFieldGeneratorButton
                      promptType="body_peg"
                      inputContext={`תחנת גוף #${newBodyIndex}`}
                      onGenerated={(val) => setNewBodyPart(val)}
                      label="איבר עם AI"
                      compact
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={newBodyPart}
                    onChange={(e) => setNewBodyPart(e.target.value)}
                    placeholder="למשל: סנטר"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 font-semibold">חפץ תלוי:</label>
                    <AIFieldGeneratorButton
                      promptType="body_peg"
                      inputContext={`תחנת ${newBodyPart || newBodyIndex}`}
                      extraContext={newBodyPart}
                      onGenerated={(val) => setNewBodyObj(val)}
                      label="חפץ עם AI"
                      compact
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={newBodyObj}
                    onChange={(e) => setNewBodyObj(e.target.value)}
                    placeholder="למשל: זקן תיש צבעוני"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 font-semibold">טיפ קינטי:</label>
                    <AIFieldGeneratorButton
                      promptType="shape_tip"
                      inputContext={newBodyObj || newBodyPart}
                      onGenerated={(val) => setNewBodyTip(val)}
                      label="טיפ עם AI"
                      compact
                    />
                  </div>
                  <input
                    type="text"
                    value={newBodyTip}
                    onChange={(e) => setNewBodyTip(e.target.value)}
                    placeholder="למשל: גירוד עז בסנטר"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddBodyForm(false)}
                  className="px-3 py-1 text-xs text-slate-400"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-yellow-500 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                >
                  שמור תחנה
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredBodyPegs.map((bp) => {
              const isEditing = editingPegKey === bp.index;
              const isReady = bp.is_ready_for_practice !== false;

              return (
                <div
                  key={bp.index}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 hover:border-yellow-500/40 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="w-9 h-9 rounded-xl bg-yellow-500/20 text-yellow-400 font-black text-sm flex items-center justify-center border border-yellow-500/40 font-mono">
                        #{bp.index}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (isEditing) {
                              setEditingPegKey(null);
                            } else {
                              setEditingPegKey(bp.index);
                              setEditTitle(bp.bodyPartHebrew);
                              setEditObject(bp.defaultObject);
                              setEditTip(bp.kineticTip);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-yellow-400 cursor-pointer"
                          title="ערוך תחנת גוף"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {onDeleteBodyPeg && (
                          <button
                            onClick={() => onDeleteBodyPeg(bp.index)}
                            className="p-1 text-slate-600 hover:text-rose-400 cursor-pointer"
                            title="מחק תחנה"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2 pt-1 text-right">
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-xs text-slate-400 font-bold">איבר גוף:</label>
                            <AIFieldGeneratorButton
                              promptType="body_peg"
                              inputContext={`תחנת גוף #${bp.index}`}
                              onGenerated={(val) => setEditTitle(val)}
                              label="איבר עם AI"
                              compact
                            />
                          </div>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                onUpdateBodyPeg(bp.index, {
                                  bodyPartHebrew: editTitle.trim(),
                                  defaultObject: editObject.trim(),
                                  kineticTip: editTip.trim(),
                                });
                                setEditingPegKey(null);
                              }
                            }}
                            placeholder="איבר גוף..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-xs text-slate-400 font-bold">חפץ תלוי:</label>
                            <AIFieldGeneratorButton
                              promptType="body_peg"
                              inputContext={`תחנת ${editTitle || bp.index}`}
                              extraContext={editTitle}
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
                                onUpdateBodyPeg(bp.index, {
                                  bodyPartHebrew: editTitle.trim(),
                                  defaultObject: editObject.trim(),
                                  kineticTip: editTip.trim(),
                                });
                                setEditingPegKey(null);
                              }
                            }}
                            placeholder="חפץ תלוי..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-xs text-slate-400 font-bold">טיפ קינטי:</label>
                            <AIFieldGeneratorButton
                              promptType="shape_tip"
                              inputContext={editObject || editTitle}
                              onGenerated={(val) => setEditTip(val)}
                              label="טיפ עם AI"
                              compact
                            />
                          </div>
                          <input
                            type="text"
                            value={editTip}
                            onChange={(e) => setEditTip(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                onUpdateBodyPeg(bp.index, {
                                  bodyPartHebrew: editTitle.trim(),
                                  defaultObject: editObject.trim(),
                                  kineticTip: editTip.trim(),
                                });
                                setEditingPegKey(null);
                              }
                            }}
                            placeholder="טיפ קינטי..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-1 pt-1">
                          <span className="text-[10px] text-slate-500 font-mono">↵ Enter לשמירה</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingPegKey(null)}
                              className="text-xs text-slate-400 hover:text-slate-200 px-2"
                            >
                              ביטול
                            </button>
                            <button
                              onClick={() => {
                                onUpdateBodyPeg(bp.index, {
                                  bodyPartHebrew: editTitle.trim(),
                                  defaultObject: editObject.trim(),
                                  kineticTip: editTip.trim(),
                                });
                                setEditingPegKey(null);
                              }}
                              className="text-xs bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold px-3 py-1 rounded-lg cursor-pointer"
                            >
                              שמור
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-xs font-bold text-yellow-400/90">{bp.bodyPartHebrew}</div>
                        <div className="font-extrabold text-white text-base">{bp.defaultObject}</div>
                        <p className="text-xs text-yellow-300/90 bg-yellow-950/30 border border-yellow-500/20 p-2.5 rounded-xl">
                          💡 {bp.kineticTip}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Ready for Practice Checkbox */}
                  <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none py-1 px-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 transition-all">
                      <input
                        type="checkbox"
                        checked={isReady}
                        onChange={() => {
                          if (onToggleBodyPegReady) {
                            onToggleBodyPegReady(bp.index, !isReady);
                          } else {
                            onUpdateBodyPeg(bp.index, { is_ready_for_practice: !isReady });
                          }
                        }}
                        className="w-4 h-4 rounded text-yellow-500 focus:ring-yellow-500 cursor-pointer accent-yellow-500"
                      />
                      <span className={`text-xs font-bold ${isReady ? 'text-yellow-300' : 'text-slate-400'}`}>
                        מוכן לתרגול
                      </span>
                    </label>
                    {isReady && (
                      <span className="text-[11px] bg-yellow-500/15 text-yellow-300 font-bold px-2 py-0.5 rounded-full border border-yellow-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3 text-yellow-400" />
                        <span>מוכן</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: QUIZ */}
      {activeTab === 'quiz' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setQuizTarget('shape');
                  setQuizIndex(0);
                  setQuizFeedback('idle');
                  setRevealQuiz(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  quizTarget === 'shape'
                    ? 'bg-yellow-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                מבחן מתלי צורה (0-9)
              </button>
              <button
                onClick={() => {
                  setQuizTarget('body');
                  setQuizIndex(0);
                  setQuizFeedback('idle');
                  setRevealQuiz(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  quizTarget === 'body'
                    ? 'bg-yellow-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                מבחן מתלי גוף (1-10)
              </button>
            </div>

            <button
              onClick={handleNextQuizQuestion}
              className="flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300 bg-slate-800 px-3.5 py-1.5 rounded-xl cursor-pointer"
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
                resetQuizDeck(quizTarget === 'shape' ? 'workout_pegs_shape' : 'workout_pegs_body');
                handleNextQuizQuestion();
              }}
              deckTitle={quizTarget === 'shape' ? 'מתלי צורות (0-9)' : 'מתלי גוף (1-20)'}
            />
          </div>

          <div className="w-full max-w-4xl mx-auto space-y-6 text-center">
            <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 shadow-inner space-y-3">
              {quizTarget === 'shape' ? (
                <>
                  <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">
                    מה החפץ המנמוני של מתלה צורה:
                  </span>
                  <div className="text-6xl font-black text-white">
                    {shapePegs[quizIndex]?.number}
                  </div>
                  <div className="text-xs text-slate-400">
                    צורה: {shapePegs[quizIndex]?.shapeName}
                  </div>
                </>
              ) : (
                <>
                  <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">
                    מה החפץ התלוי בתחנת הגוף:
                  </span>
                  <div className="text-4xl font-black text-white">
                    #{bodyPegs[quizIndex]?.index} - {bodyPegs[quizIndex]?.bodyPartHebrew}
                  </div>
                </>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex gap-2 max-w-sm mx-auto">
                <input
                  type="text"
                  value={quizGuess}
                  onChange={(e) => setQuizGuess(e.target.value)}
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
                  placeholder="הקלד את החפץ התלוי..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center text-sm font-bold text-white focus:outline-none focus:border-yellow-500"
                />
                <button
                  onClick={() => {
                    if (quizFeedback === 'correct') {
                      handleNextQuizQuestion();
                    } else {
                      handleCheckQuiz();
                    }
                  }}
                  className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                >
                  {quizFeedback === 'correct' ? 'הבא ↵' : 'בדוק'}
                </button>
              </div>

              {quizFeedback === 'correct' && (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex flex-col items-center justify-center gap-1.5 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold text-sm">מדויק ב-100%! שליפה נהדרת מהמתלה (+15 XP)</span>
                  </div>
                  <span className="text-[11px] text-emerald-400/90 font-medium">
                    לחץ Enter כדי לעבור ישר למתלה האקראי הבא ↵
                  </span>
                </div>
              )}

              {quizFeedback === 'incorrect' && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center gap-2 animate-fadeIn">
                  <XCircle className="w-5 h-5" />
                  <span className="font-bold text-sm">לא מדויק. נסה שוב או חשוף את התשובה</span>
                </div>
              )}

              {/* Auto-reveal full association on correct answer OR when revealing */}
              {(quizFeedback === 'correct' || revealQuiz) && (
                <div className="bg-slate-950/90 border border-yellow-500/40 rounded-2xl p-5 text-xs space-y-2 text-right animate-fadeIn shadow-xl shadow-yellow-500/5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-yellow-400 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                      האסוציאציה המלאה:
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {quizTarget === 'shape'
                        ? `ספרה ${shapePegs[quizIndex]?.number} (${shapePegs[quizIndex]?.shapeName})`
                        : `תחנת גוף #${bodyPegs[quizIndex]?.index} (${bodyPegs[quizIndex]?.bodyPartHebrew})`}
                    </span>
                  </div>
                  <div className="text-yellow-300 font-bold text-sm">
                    חפץ תלוי:{' '}
                    <span className="text-white text-base font-black">
                      {quizTarget === 'shape'
                        ? shapePegs[quizIndex]?.defaultObject
                        : bodyPegs[quizIndex]?.defaultObject}
                    </span>
                  </div>
                  <div className="text-slate-200 bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-xs leading-relaxed">
                    💡 <strong className="text-yellow-400">טיפ קינטי:</strong>{' '}
                    {quizTarget === 'shape'
                      ? shapePegs[quizIndex]?.kineticTip
                      : bodyPegs[quizIndex]?.kineticTip}
                  </div>
                  {quizFeedback === 'correct' && (
                    <div className="flex justify-center pt-1">
                      <button
                        onClick={handleNextQuizQuestion}
                        className="text-xs text-yellow-400 hover:text-yellow-300 font-bold inline-flex items-center gap-1 bg-slate-900 px-3 py-1.5 rounded-xl border border-yellow-500/30 cursor-pointer"
                      >
                        <span>למתלה הבא (Enter ↵)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {quizFeedback !== 'correct' && !revealQuiz && (
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setRevealQuiz(true)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-yellow-300 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>חשוף תשובה וטיפ קינטי</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
