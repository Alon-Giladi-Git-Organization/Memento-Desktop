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
  XCircle,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PegShapeItem, BodyPegItem } from '../../types/memory';
import { AIFieldGeneratorButton } from '../AIFieldGeneratorButton';

interface PegsModuleProps {
  shapePegs: PegShapeItem[];
  bodyPegs: BodyPegItem[];
  onEarnPoints: (amount: number, reason?: string) => void;
  onUnlockBadge: (badge: string) => void;
  onAddShapePeg?: (item: PegShapeItem) => void;
  onUpdateShapePeg: (
    number: number,
    updates: { userObject?: string; userShapeName?: string; userKineticTip?: string }
  ) => void;
  onDeleteShapePeg?: (number: number) => void;
  onResetShapePeg: (number: number) => void;
  onAddBodyPeg?: (item: BodyPegItem) => void;
  onUpdateBodyPeg: (
    index: number,
    updates: { userObject?: string; userBodyPart?: string; userKineticTip?: string }
  ) => void;
  onDeleteBodyPeg?: (index: number) => void;
  onResetBodyPeg: (index: number) => void;
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
  onAddBodyPeg,
  onUpdateBodyPeg,
  onDeleteBodyPeg,
  onResetBodyPeg,
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

  const [showAddBodyForm, setShowAddBodyForm] = useState(false);
  const [newBodyIndex, setNewBodyIndex] = useState('');
  const [newBodyPart, setNewBodyPart] = useState('');
  const [newBodyObj, setNewBodyObj] = useState('');
  const [newBodyTip, setNewBodyTip] = useState('');

  // Quiz state
  const [quizTarget, setQuizTarget] = useState<'shape' | 'body'>('shape');
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizGuess, setQuizGuess] = useState('');
  const [quizFeedback, setQuizFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [revealQuiz, setRevealQuiz] = useState(false);

  const handleNextQuizQuestion = () => {
    const listLength = quizTarget === 'shape' ? shapePegs.length : bodyPegs.length;
    if (listLength === 0) return;
    setQuizIndex(Math.floor(Math.random() * listLength));
    setQuizGuess('');
    setQuizFeedback('idle');
    setRevealQuiz(false);
  };

  const handleCheckQuiz = () => {
    const guess = quizGuess.trim().toLowerCase();
    if (!guess) return;

    if (quizTarget === 'shape') {
      const current = shapePegs[quizIndex];
      if (!current) return;
      const targetUser = (current.userObject || '').trim().toLowerCase();
      const targetDef = (current.defaultObject || '').trim().toLowerCase();
      const isExact = (targetUser && guess === targetUser) || (targetDef && guess === targetDef);

      if (isExact) {
        setQuizFeedback('correct');
        onEarnPoints(15, 'מענה נכון במבחן מתלי צורה');
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
      } else {
        setQuizFeedback('incorrect');
      }
    } else {
      const current = bodyPegs[quizIndex];
      if (!current) return;
      const targetUser = (current.userObject || '').trim().toLowerCase();
      const targetDef = (current.defaultObject || '').trim().toLowerCase();
      const isExact = (targetUser && guess === targetUser) || (targetDef && guess === targetDef);

      if (isExact) {
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
        userShapeName: newShapeName.trim(),
        defaultObject: newShapeObj.trim(),
        userObject: newShapeObj.trim(),
        visualMetaphor: `דמיון חזותי לספרה ${num}`,
        kineticTip: newShapeTip.trim() || 'הדבקה מנטלית חזקה',
        userKineticTip: newShapeTip.trim() || 'הדבקה מנטלית חזקה',
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
        userBodyPart: newBodyPart.trim(),
        defaultObject: newBodyObj.trim(),
        userObject: newBodyObj.trim(),
        kineticTip: newBodyTip.trim() || 'תחושה פיזית חזקה באיבר',
        userKineticTip: newBodyTip.trim() || 'תחושה פיזית חזקה באיבר',
      });
    }
    setNewBodyIndex('');
    setNewBodyPart('');
    setNewBodyObj('');
    setNewBodyTip('');
    setShowAddBodyForm(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
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
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">
              התאם או הוסף מתלי צורת ספרה לפי הדימוי החזותי שמתאים לך
            </span>
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
            {shapePegs.map((peg) => {
              const isEditing = editingPegKey === peg.number;
              const activeObj = peg.userObject || peg.defaultObject;
              const isCustom = !!peg.userObject;

              return (
                <div
                  key={peg.number}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 hover:border-yellow-500/40 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-xl bg-yellow-500/20 text-yellow-400 font-black text-lg flex items-center justify-center border border-yellow-500/40">
                        {peg.number}
                      </span>
                      <div className="flex items-center gap-1">
                        {isCustom && (
                          <button
                            onClick={() => {
                              onResetShapePeg(peg.number);
                              if (isEditing) setEditingPegKey(null);
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
                              setEditingPegKey(null);
                            } else {
                              setEditingPegKey(peg.number);
                              setEditObject(activeObj);
                              setEditTitle(peg.userShapeName || peg.shapeName);
                              setEditTip(peg.userKineticTip || peg.kineticTip);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-yellow-400 cursor-pointer"
                          title="ערוך מתלה"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteShapePeg && (
                          <button
                            onClick={() => onDeleteShapePeg(peg.number)}
                            className="p-1 text-slate-600 hover:text-rose-400 cursor-pointer"
                            title="מחק מתלה"
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
                            <label className="text-[9px] text-slate-400 font-bold">שם הצורה:</label>
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
                                  userShapeName: editTitle.trim(),
                                  userObject: editObject.trim(),
                                  userKineticTip: editTip.trim(),
                                });
                                setEditingPegKey(null);
                              }
                            }}
                            placeholder="שם הצורה..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[9px] text-slate-400 font-bold">חפץ המתלה:</label>
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
                                  userShapeName: editTitle.trim(),
                                  userObject: editObject.trim(),
                                  userKineticTip: editTip.trim(),
                                });
                                setEditingPegKey(null);
                              }
                            }}
                            placeholder="חפץ המתלה..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[9px] text-slate-400 font-bold">טיפ קינטי:</label>
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
                                  userShapeName: editTitle.trim(),
                                  userObject: editObject.trim(),
                                  userKineticTip: editTip.trim(),
                                });
                                setEditingPegKey(null);
                              }
                            }}
                            placeholder="טיפ קינטי..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[10px] text-slate-300"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-1 pt-1">
                          <span className="text-[9px] text-slate-500 font-mono">↵ Enter לשמירה</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingPegKey(null)}
                              className="text-[10px] text-slate-400 hover:text-slate-200 px-2"
                            >
                              ביטול
                            </button>
                            <button
                              onClick={() => {
                                onUpdateShapePeg(peg.number, {
                                  userShapeName: editTitle.trim(),
                                  userObject: editObject.trim(),
                                  userKineticTip: editTip.trim(),
                                });
                                setEditingPegKey(null);
                              }}
                              className="text-[10px] bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold px-2.5 py-1 rounded cursor-pointer"
                            >
                              שמור
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-xs text-slate-400">{peg.userShapeName || peg.shapeName}</div>
                        <div className="font-bold text-white text-sm">{activeObj}</div>
                        <p className="text-[11px] text-slate-400">{peg.visualMetaphor}</p>
                        <p className="text-[10px] text-yellow-300/80 bg-yellow-950/20 p-2 rounded-lg">
                          💡 {peg.userKineticTip || peg.kineticTip}
                        </p>
                      </>
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
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">
              תחנות הגוף מהרגליים עד הראש: מיקום מושלם לרשימות קצרות ומיידיות
            </span>
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
            {bodyPegs.map((bp) => {
              const isEditing = editingPegKey === bp.index;
              const activeObj = bp.userObject || bp.defaultObject;
              const isCustom = !!bp.userObject;

              return (
                <div
                  key={bp.index}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 hover:border-yellow-500/40 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-xl bg-yellow-500/20 text-yellow-400 font-black text-sm flex items-center justify-center border border-yellow-500/40">
                        #{bp.index}
                      </span>
                      <div className="flex items-center gap-1">
                        {isCustom && (
                          <button
                            onClick={() => {
                              onResetBodyPeg(bp.index);
                              if (isEditing) setEditingPegKey(null);
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
                              setEditingPegKey(null);
                            } else {
                              setEditingPegKey(bp.index);
                              setEditTitle(bp.userBodyPart || bp.bodyPartHebrew);
                              setEditObject(activeObj);
                              setEditTip(bp.userKineticTip || bp.kineticTip);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-yellow-400 cursor-pointer"
                          title="ערוך תחנת גוף"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteBodyPeg && (
                          <button
                            onClick={() => onDeleteBodyPeg(bp.index)}
                            className="p-1 text-slate-600 hover:text-rose-400 cursor-pointer"
                            title="מחק תחנה"
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
                            <label className="text-[9px] text-slate-400 font-bold">איבר גוף:</label>
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
                                  userBodyPart: editTitle.trim(),
                                  userObject: editObject.trim(),
                                  userKineticTip: editTip.trim(),
                                });
                                setEditingPegKey(null);
                              }
                            }}
                            placeholder="איבר גוף..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[9px] text-slate-400 font-bold">חפץ תלוי:</label>
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
                                  userBodyPart: editTitle.trim(),
                                  userObject: editObject.trim(),
                                  userKineticTip: editTip.trim(),
                                });
                                setEditingPegKey(null);
                              }
                            }}
                            placeholder="חפץ תלוי..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[9px] text-slate-400 font-bold">טיפ קינטי:</label>
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
                                  userBodyPart: editTitle.trim(),
                                  userObject: editObject.trim(),
                                  userKineticTip: editTip.trim(),
                                });
                                setEditingPegKey(null);
                              }
                            }}
                            placeholder="טיפ קינטי..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[10px] text-slate-300"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-1 pt-1">
                          <span className="text-[9px] text-slate-500 font-mono">↵ Enter לשמירה</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingPegKey(null)}
                              className="text-[10px] text-slate-400 hover:text-slate-200 px-2"
                            >
                              ביטול
                            </button>
                            <button
                              onClick={() => {
                                onUpdateBodyPeg(bp.index, {
                                  userBodyPart: editTitle.trim(),
                                  userObject: editObject.trim(),
                                  userKineticTip: editTip.trim(),
                                });
                                setEditingPegKey(null);
                              }}
                              className="text-[10px] bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold px-2.5 py-1 rounded cursor-pointer"
                            >
                              שמור
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-xs font-bold text-slate-300">{bp.userBodyPart || bp.bodyPartHebrew}</div>
                        <div className="font-bold text-white text-sm">{activeObj}</div>
                        <p className="text-[10px] text-yellow-300/80 bg-yellow-950/20 p-2 rounded-lg">
                          💡 {bp.userKineticTip || bp.kineticTip}
                        </p>
                      </>
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
              <span>מתלה אקראי חדש</span>
            </button>
          </div>

          <div className="max-w-xl mx-auto space-y-6 text-center">
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
                    צורה: {shapePegs[quizIndex]?.userShapeName || shapePegs[quizIndex]?.shapeName}
                  </div>
                </>
              ) : (
                <>
                  <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">
                    מה החפץ התלוי בתחנת הגוף:
                  </span>
                  <div className="text-4xl font-black text-white">
                    #{bodyPegs[quizIndex]?.index} - {bodyPegs[quizIndex]?.userBodyPart || bodyPegs[quizIndex]?.bodyPartHebrew}
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
                        ? `ספרה ${shapePegs[quizIndex]?.number} (${shapePegs[quizIndex]?.userShapeName || shapePegs[quizIndex]?.shapeName})`
                        : `תחנת גוף #${bodyPegs[quizIndex]?.index} (${bodyPegs[quizIndex]?.userBodyPart || bodyPegs[quizIndex]?.bodyPartHebrew})`}
                    </span>
                  </div>
                  <div className="text-yellow-300 font-bold text-sm">
                    חפץ תלוי:{' '}
                    <span className="text-white text-base font-black">
                      {quizTarget === 'shape'
                        ? shapePegs[quizIndex]?.userObject || shapePegs[quizIndex]?.defaultObject
                        : bodyPegs[quizIndex]?.userObject || bodyPegs[quizIndex]?.defaultObject}
                    </span>
                  </div>
                  <div className="text-slate-200 bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-xs leading-relaxed">
                    💡 <strong className="text-yellow-400">טיפ קינטי:</strong>{' '}
                    {quizTarget === 'shape'
                      ? shapePegs[quizIndex]?.userKineticTip || shapePegs[quizIndex]?.kineticTip
                      : bodyPegs[quizIndex]?.userKineticTip || bodyPegs[quizIndex]?.kineticTip}
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
