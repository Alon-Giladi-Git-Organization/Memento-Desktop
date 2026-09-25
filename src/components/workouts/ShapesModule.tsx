import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Plus,
  Edit3,
  Trash2,
  Undo2,
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AbstractShapeCard } from '../../types/memory';
import { AIFieldGeneratorButton } from '../AIFieldGeneratorButton';

interface ShapesModuleProps {
  abstractShapes: AbstractShapeCard[];
  onEarnPoints: (amount: number, reason?: string) => void;
  onUnlockBadge: (badge: string) => void;
  onAddAbstractShape?: (shape: Omit<AbstractShapeCard, 'id'>) => void;
  onUpdateAbstractShape?: (id: string, updates: Partial<AbstractShapeCard>) => void;
  onDeleteAbstractShape?: (id: string) => void;
  onResetAbstractShapes?: () => void;
  onOpenSummary?: (techniqueId: string) => void;
}

export const ShapesModule: React.FC<ShapesModuleProps> = ({
  abstractShapes,
  onEarnPoints,
  onUnlockBadge,
  onAddAbstractShape,
  onUpdateAbstractShape,
  onDeleteAbstractShape,
  onResetAbstractShapes,
  onOpenSummary,
}) => {
  const [subView, setSubView] = useState<'registry' | 'quiz'>('registry');
  const [search, setSearch] = useState('');

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPareidolia, setEditPareidolia] = useState('');
  const [editMnemonic, setEditMnemonic] = useState('');
  const [editDigit, setEditDigit] = useState(1);
  const [editShapeType, setEditShapeType] = useState<AbstractShapeCard['svgShapeType']>('spiral');
  const [editTextureType, setEditTextureType] = useState<AbstractShapeCard['textureType']>('striped');

  // Add State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPareidolia, setNewPareidolia] = useState('');
  const [newMnemonic, setNewMnemonic] = useState('');
  const [newDigit, setNewDigit] = useState(1);
  const [newShapeType, setNewShapeType] = useState<AbstractShapeCard['svgShapeType']>('blob');
  const [newTextureType, setNewTextureType] = useState<AbstractShapeCard['textureType']>('striped');

  // Quiz State
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizGuess, setQuizGuess] = useState('');
  const [quizFeedback, setQuizFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [revealQuiz, setRevealQuiz] = useState(false);

  const handleAddNewShape = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (onAddAbstractShape) {
      onAddAbstractShape({
        title: newTitle.trim(),
        svgShapeType: newShapeType,
        textureType: newTextureType,
        textureDigit: newDigit,
        pareidoliaHint: newPareidolia.trim() || 'דמיון חופשי',
        mnemonicCode: newMnemonic.trim() || 'קוד מנמוני',
      });
    }

    setNewTitle('');
    setNewPareidolia('');
    setNewMnemonic('');
    setNewDigit(1);
    setShowAddForm(false);
  };

  const handleNextQuizQuestion = () => {
    if (abstractShapes.length === 0) return;
    setQuizIndex(Math.floor(Math.random() * abstractShapes.length));
    setQuizGuess('');
    setQuizFeedback('idle');
    setRevealQuiz(false);
  };

  const handleCheckQuiz = () => {
    const current = abstractShapes[quizIndex];
    if (!current) return;
    const target = current.mnemonicCode.trim().toLowerCase();
    const hint = current.pareidoliaHint.trim().toLowerCase();
    const title = current.title.trim().toLowerCase();
    const guess = quizGuess.trim().toLowerCase();
    if (!guess) return;

    const isExact = guess === target || guess === hint || guess === title;

    if (isExact) {
      setQuizFeedback('correct');
      onEarnPoints(20, 'זיהוי קוד צורה ומרקם במבחן');
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
    } else {
      setQuizFeedback('incorrect');
    }
  };

  const renderShapeSvg = (shapeType: string, textureType: string) => {
    return (
      <svg className="w-16 h-16 mx-auto stroke-teal-400 fill-teal-500/10" viewBox="0 0 100 100">
        {shapeType === 'spiral' && (
          <path
            d="M 50,50 m 0,-5 a 5,5 0 0,1 5,5 a 10,10 0 0,1 -10,10 a 15,15 0 0,1 -15,-15 a 20,20 0 0,1 20,-20 a 25,25 0 0,1 25,25 a 30,30 0 0,1 -30,30"
            fill="none"
            strokeWidth="4"
          />
        )}
        {shapeType === 'blob' && (
          <path
            d="M 30,20 Q 70,10 80,40 Q 90,70 60,85 Q 30,95 15,65 Q 5,35 30,20 Z"
            strokeWidth="3"
          />
        )}
        {shapeType === 'zigzag' && (
          <polyline
            points="10,20 30,80 50,30 70,90 90,20"
            fill="none"
            strokeWidth="4"
          />
        )}
        {shapeType === 'crystallite' && (
          <polygon
            points="50,10 85,35 70,85 30,85 15,35"
            strokeWidth="3"
          />
        )}
        {shapeType === 'cloud' && (
          <path
            d="M 25,60 a 20,20 0 0,1 30,-15 a 25,25 0 0,1 35,15 a 15,15 0 0,1 -10,20 l -50,0 a 15,15 0 0,1 -5,-20 z"
            strokeWidth="3"
          />
        )}
        {shapeType === 'shield' && (
          <path
            d="M 20,20 L 80,20 L 75,55 Q 50,90 50,90 Q 50,90 25,55 Z"
            strokeWidth="3"
          />
        )}
      </svg>
    );
  };

  const filtered = abstractShapes.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.pareidoliaHint.toLowerCase().includes(search.toLowerCase()) ||
      s.mnemonicCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
      {/* Header and Sub-Tabs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-400" />
              <span>צורות, מרקמים ופריידוליה (Abstract Shapes)</span>
            </h2>
            {onOpenSummary && (
              <button
                onClick={() => onOpenSummary('shapes')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-bold transition-all cursor-pointer"
                title="צפה בסיכום הטכניקה ודוגמאות מעשיות"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>סיכום ודוגמאות</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            הפיכת צורות גאומטריות מופשטות ומרקמים לחפצים מוחשיים בעזרת עקרון הפריידוליה
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-stretch md:self-auto justify-center">
          <button
            onClick={() => setSubView('registry')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subView === 'registry'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            מאגר צורות ומרקמים ({abstractShapes.length})
          </button>
          <button
            onClick={() => setSubView('quiz')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              subView === 'quiz'
                ? 'bg-teal-500 text-slate-950 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>מבחן שליפה</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: REGISTRY */}
      {subView === 'registry' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="חיפוש צורה, פריידוליה או קוד מנמוני..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-2">
              {onResetAbstractShapes && (
                <button
                  onClick={onResetAbstractShapes}
                  title="שחזר מאגר דוגמה מקורי"
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  <Undo2 className="w-3 h-3" />
                  <span>איפוס לברירת מחדל</span>
                </button>
              )}
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>הוסף צורה / מרקם</span>
              </button>
            </div>
          </div>

          {showAddForm && (
            <form
              onSubmit={handleAddNewShape}
              className="bg-slate-950 border border-teal-500/40 rounded-2xl p-4 sm:p-5 space-y-3 animate-fadeIn"
            >
              <h4 className="text-xs font-bold text-teal-400">הוספת צורה מופשטת ומרקם למאגר</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-right">
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold mb-1">
                    שם הצורה:
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="למשל: ספירלה דחוסה"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold mb-1">
                    סוג צורה (SVG):
                  </label>
                  <select
                    value={newShapeType}
                    onChange={(e) => setNewShapeType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  >
                    <option value="spiral">ספירלה (Spiral)</option>
                    <option value="blob">כתם אמורפי (Blob)</option>
                    <option value="zigzag">זיגזג (Zigzag)</option>
                    <option value="crystallite">גביש (Crystallite)</option>
                    <option value="cloud">ענן (Cloud)</option>
                    <option value="shield">מגן (Shield)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold mb-1">
                    ספרת מרקם (1-5):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={newDigit}
                    onChange={(e) => setNewDigit(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 font-semibold">
                      רמז פריידוליה (דמיון לחפץ מוחשי):
                    </label>
                    <AIFieldGeneratorButton
                      promptType="shape_association"
                      inputContext={newTitle || newShapeType}
                      onGenerated={(val) => setNewPareidolia(val)}
                      label="פריידוליה עם AI"
                      compact
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={newPareidolia}
                    onChange={(e) => setNewPareidolia(e.target.value)}
                    placeholder="למשל: קונכייה של שבלול ענק"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 font-semibold">
                      קוד מנמוני / סצנה מקשרת:
                    </label>
                    <AIFieldGeneratorButton
                      promptType="shape_tip"
                      inputContext={newTitle || newPareidolia}
                      extraContext={`פריידוליה: ${newPareidolia}`}
                      onGenerated={(val) => setNewMnemonic(val)}
                      label="קוד עם AI"
                      compact
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={newMnemonic}
                    onChange={(e) => setNewMnemonic(e.target.value)}
                    placeholder="למשל: שבלול מתיז פסים זוהרים"
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
                  className="px-4 py-1.5 bg-teal-500 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                >
                  שמור צורה
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => {
              const isEditing = editingId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 hover:border-teal-500/40 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-lg border border-teal-500/20">
                        ספרת מרקם: {item.textureDigit}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (isEditing) {
                              setEditingId(null);
                            } else {
                              setEditingId(item.id);
                              setEditTitle(item.title);
                              setEditPareidolia(item.pareidoliaHint);
                              setEditMnemonic(item.mnemonicCode);
                              setEditDigit(item.textureDigit);
                              setEditShapeType(item.svgShapeType);
                              setEditTextureType(item.textureType);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-teal-400 cursor-pointer"
                          title="ערוך צורה"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteAbstractShape && (
                          <button
                            onClick={() => onDeleteAbstractShape(item.id)}
                            className="p-1 text-slate-600 hover:text-rose-400 cursor-pointer"
                            title="מחק צורה"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="py-2 bg-slate-900/50 rounded-xl border border-slate-800/80">
                      {renderShapeSvg(item.svgShapeType, item.textureType)}
                    </div>

                    {isEditing ? (
                      <div className="space-y-2 pt-1 text-right">
                        <div>
                          <label className="text-[9px] text-slate-400 font-bold block mb-0.5">שם הצורה:</label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                onUpdateAbstractShape?.(item.id, {
                                  title: editTitle.trim(),
                                  pareidoliaHint: editPareidolia.trim(),
                                  mnemonicCode: editMnemonic.trim(),
                                  textureDigit: editDigit,
                                  svgShapeType: editShapeType,
                                  textureType: editTextureType,
                                });
                                setEditingId(null);
                              }
                            }}
                            placeholder="שם הצורה..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[9px] text-teal-400 font-bold">רמז פריידוליה:</label>
                            <AIFieldGeneratorButton
                              promptType="shape_association"
                              inputContext={editTitle || item.title}
                              onGenerated={(val) => setEditPareidolia(val)}
                              label="פריידוליה עם AI"
                              compact
                            />
                          </div>
                          <input
                            type="text"
                            value={editPareidolia}
                            onChange={(e) => setEditPareidolia(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                onUpdateAbstractShape?.(item.id, {
                                  title: editTitle.trim(),
                                  pareidoliaHint: editPareidolia.trim(),
                                  mnemonicCode: editMnemonic.trim(),
                                  textureDigit: editDigit,
                                  svgShapeType: editShapeType,
                                  textureType: editTextureType,
                                });
                                setEditingId(null);
                              }
                            }}
                            placeholder="רמז פריידוליה..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[9px] text-amber-400 font-bold">קוד מנמוני:</label>
                            <AIFieldGeneratorButton
                              promptType="shape_tip"
                              inputContext={editTitle || item.title}
                              extraContext={`פריידוליה: ${editPareidolia}`}
                              onGenerated={(val) => setEditMnemonic(val)}
                              label="קוד עם AI"
                              compact
                            />
                          </div>
                          <input
                            type="text"
                            value={editMnemonic}
                            onChange={(e) => setEditMnemonic(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                onUpdateAbstractShape?.(item.id, {
                                  title: editTitle.trim(),
                                  pareidoliaHint: editPareidolia.trim(),
                                  mnemonicCode: editMnemonic.trim(),
                                  textureDigit: editDigit,
                                  svgShapeType: editShapeType,
                                  textureType: editTextureType,
                                });
                                setEditingId(null);
                              }
                            }}
                            placeholder="קוד מנמוני..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-200"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-1 pt-1">
                          <span className="text-[9px] text-slate-500 font-mono">↵ Enter לשמירה</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-[10px] text-slate-400 hover:text-slate-200 px-2"
                            >
                              ביטול
                            </button>
                            <button
                              onClick={() => {
                                if (onUpdateAbstractShape) {
                                  onUpdateAbstractShape(item.id, {
                                    title: editTitle.trim(),
                                    pareidoliaHint: editPareidolia.trim(),
                                    mnemonicCode: editMnemonic.trim(),
                                    textureDigit: editDigit,
                                    svgShapeType: editShapeType,
                                    textureType: editTextureType,
                                  });
                                }
                                setEditingId(null);
                              }}
                              className="text-[10px] bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-2.5 py-1 rounded cursor-pointer"
                            >
                              שמור
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4 className="text-sm font-bold text-white">{item.title}</h4>
                        <div className="bg-slate-900/70 p-2 rounded-xl border border-slate-800 text-xs">
                          <span className="text-teal-400 font-bold block text-[10px]">
                            👁️ פריידוליה:
                          </span>
                          <span className="text-slate-300">{item.pareidoliaHint}</span>
                        </div>
                        <div className="bg-teal-950/30 p-2 rounded-xl border border-teal-500/20 text-xs">
                          <span className="text-amber-400 font-bold block text-[10px]">
                            ⚡ קוד מנמוני:
                          </span>
                          <span className="text-teal-200 font-mono">{item.mnemonicCode}</span>
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

      {/* SUB-VIEW 2: QUIZ */}
      {subView === 'quiz' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={handleNextQuizQuestion}
              className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 bg-slate-800 px-3.5 py-1.5 rounded-xl cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>צורה אקראית חדשה</span>
            </button>
          </div>

          {abstractShapes[quizIndex] && (
            <div className="max-w-xl mx-auto space-y-6 text-center">
              <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 shadow-inner space-y-4">
                <div className="w-24 h-24 mx-auto bg-slate-900/60 rounded-2xl flex items-center justify-center border border-slate-800">
                  {renderShapeSvg(
                    abstractShapes[quizIndex].svgShapeType,
                    abstractShapes[quizIndex].textureType
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-teal-400 uppercase tracking-widest block">
                    מה הקוד המנמוני או הפריידוליה של הצורה:
                  </span>
                  <div className="text-xl font-bold text-white mt-1">
                    "{abstractShapes[quizIndex].title}"
                  </div>
                </div>
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
                    placeholder="הקלד קוד מנמוני או פריידוליה..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center text-sm font-bold text-white focus:outline-none focus:border-teal-500"
                  />
                  <button
                    onClick={() => {
                      if (quizFeedback === 'correct') {
                        handleNextQuizQuestion();
                      } else {
                        handleCheckQuiz();
                      }
                    }}
                    className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    {quizFeedback === 'correct' ? 'הבא ↵' : 'בדוק'}
                  </button>
                </div>

                {quizFeedback === 'correct' && (
                  <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex flex-col items-center justify-center gap-1.5 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="font-bold text-sm">מעולה! פענוח מדויק של הצורה והמרקם ב-100% (+20 XP)</span>
                    </div>
                    <span className="text-[11px] text-emerald-400/90 font-medium">
                      לחץ Enter כדי לעבור ישר לצורה האקראית הבאה ↵
                    </span>
                  </div>
                )}

                {quizFeedback === 'incorrect' && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center gap-2 animate-fadeIn">
                    <XCircle className="w-5 h-5" />
                    <span className="font-bold text-sm">לא מדויק. נסה שוב או חשוף את הפתרון</span>
                  </div>
                )}

                {/* Auto-reveal full association on correct answer OR when clicking reveal */}
                {(quizFeedback === 'correct' || revealQuiz) && (
                  <div className="bg-slate-950/90 border border-teal-500/40 rounded-2xl p-5 text-xs space-y-2.5 text-right animate-fadeIn shadow-xl shadow-teal-500/5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-teal-400 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-teal-400" />
                        האסוציאציה המלאה לצורה:
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        ספרת מרקם: {abstractShapes[quizIndex].textureDigit}
                      </span>
                    </div>

                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-xs">
                      <span className="text-teal-300 font-bold block text-[10px]">👁️ פריידוליה:</span>
                      <span className="text-white font-medium">{abstractShapes[quizIndex].pareidoliaHint}</span>
                    </div>

                    <div className="bg-teal-950/40 border border-teal-500/30 p-3 rounded-xl text-xs text-teal-200">
                      ⚡ <strong className="text-amber-400">קוד מנמוני קינטי: </strong>
                      {abstractShapes[quizIndex].mnemonicCode}
                    </div>

                    {quizFeedback === 'correct' && (
                      <div className="flex justify-center pt-1">
                        <button
                          onClick={handleNextQuizQuestion}
                          className="text-xs text-teal-300 hover:text-white font-bold inline-flex items-center gap-1 bg-slate-900 px-3.5 py-1.5 rounded-xl border border-teal-500/30 cursor-pointer"
                        >
                          <span>לצורה הבאה (Enter ↵)</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {quizFeedback !== 'correct' && !revealQuiz && (
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => setRevealQuiz(true)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-teal-300 cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>חשוף פריידוליה וקוד</span>
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
