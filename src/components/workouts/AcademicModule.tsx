import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  Undo2,
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AcademicKeyPoint } from '../../types/memory';
import { AIFieldGeneratorButton } from '../AIFieldGeneratorButton';

interface AcademicModuleProps {
  academicPoints: AcademicKeyPoint[];
  onEarnPoints: (amount: number, reason?: string) => void;
  onUnlockBadge: (badge: string) => void;
  onAddAcademicPoint?: (point: Omit<AcademicKeyPoint, 'id'>) => void;
  onUpdateAcademicPoint?: (id: string, updates: Partial<AcademicKeyPoint>) => void;
  onDeleteAcademicPoint?: (id: string) => void;
  onResetAcademicPoints?: () => void;
  onOpenSummary?: (techniqueId: string) => void;
}

export const AcademicModule: React.FC<AcademicModuleProps> = ({
  academicPoints,
  onEarnPoints,
  onUnlockBadge,
  onAddAcademicPoint,
  onUpdateAcademicPoint,
  onDeleteAcademicPoint,
  onResetAcademicPoints,
  onOpenSummary,
}) => {
  const [subView, setSubView] = useState<'registry' | 'quiz'>('registry');
  const [search, setSearch] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState('all');

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDiscipline, setEditDiscipline] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editKeyWord, setEditKeyWord] = useState('');
  const [editVisualAnchor, setEditVisualAnchor] = useState('');
  const [editLocus, setEditLocus] = useState('');
  const [editScene, setEditScene] = useState('');

  // Add Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDiscipline, setNewDiscipline] = useState('רפואה');
  const [newSummary, setNewSummary] = useState('');
  const [newKeyWord, setNewKeyWord] = useState('');
  const [newVisualAnchor, setNewVisualAnchor] = useState('');
  const [newLocus, setNewLocus] = useState('');
  const [newScene, setNewScene] = useState('');

  // Quiz State
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizGuess, setQuizGuess] = useState('');
  const [quizFeedback, setQuizFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [revealQuiz, setRevealQuiz] = useState(false);

  const disciplines = Array.from(new Set(academicPoints.map((p) => p.discipline)));

  const handleAddNewPoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (onAddAcademicPoint) {
      onAddAcademicPoint({
        conceptTitle: newTitle.trim(),
        discipline: newDiscipline.trim() || 'כללי',
        sourceSummary: newSummary.trim() || 'הגדרה מקוצרת',
        keyWord: newKeyWord.trim() || newTitle.trim(),
        visualAnchor: newVisualAnchor.trim() || 'עוגן חזותי',
        palaceLocusInfo: newLocus.trim() || 'חדר כניסה',
        mnemonicScene: newScene.trim() || 'סצנה בארמון הזיכרון',
      });
    }

    setNewTitle('');
    setNewSummary('');
    setNewKeyWord('');
    setNewVisualAnchor('');
    setNewLocus('');
    setNewScene('');
    setShowAddForm(false);
  };

  const handleNextQuizQuestion = () => {
    if (academicPoints.length === 0) return;
    setQuizIndex(Math.floor(Math.random() * academicPoints.length));
    setQuizGuess('');
    setQuizFeedback('idle');
    setRevealQuiz(false);
  };

  const handleCheckQuiz = () => {
    const current = academicPoints[quizIndex];
    if (!current) return;
    const targetAnchor = current.visualAnchor.trim().toLowerCase();
    const targetWord = current.keyWord.trim().toLowerCase();
    const targetTitle = current.conceptTitle.trim().toLowerCase();
    const guess = quizGuess.trim().toLowerCase();
    if (!guess) return;

    const isExact =
      guess === targetAnchor ||
      guess === targetWord ||
      guess === targetTitle;

    if (isExact) {
      setQuizFeedback('correct');
      onEarnPoints(25, 'שליפה מוצלחת של מושג אקדמי');
      onUnlockBadge('פרופסור מנמוני');
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } else {
      setQuizFeedback('incorrect');
    }
  };

  const filtered = academicPoints.filter((ap) => {
    const matchesSearch =
      ap.conceptTitle.toLowerCase().includes(search.toLowerCase()) ||
      ap.sourceSummary.toLowerCase().includes(search.toLowerCase()) ||
      ap.visualAnchor.toLowerCase().includes(search.toLowerCase()) ||
      ap.discipline.toLowerCase().includes(search.toLowerCase());

    const matchesDiscipline =
      disciplineFilter === 'all' || ap.discipline === disciplineFilter;

    return matchesSearch && matchesDiscipline;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
      {/* Header and Sub-Tabs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <span>קידוד מושגים אקדמיים ומאמרים</span>
            </h2>
            {onOpenSummary && (
              <button
                onClick={() => onOpenSummary('academic')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer"
                title="צפה בסיכום הטכניקה ודוגמאות מעשיות"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>סיכום ודוגמאות</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            המרת טרמינולוגיה כבדה (רפואה, משפטים, פסיכולוגיה) לעוגנים ויזואליים ומיקומים בארמון
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-stretch md:self-auto justify-center">
          <button
            onClick={() => setSubView('registry')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subView === 'registry'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            מאגר מושגים ומאמרים ({academicPoints.length})
          </button>
          <button
            onClick={() => setSubView('quiz')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
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

      {/* SUB-VIEW 1: REGISTRY */}
      {subView === 'registry' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="חיפוש מושג, תחום דעת, עוגן..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={disciplineFilter}
                  onChange={(e) => setDisciplineFilter(e.target.value)}
                  className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900 text-white">כל התחומים</option>
                  {disciplines.map((d) => (
                    <option key={d} value={d} className="bg-slate-900 text-white">
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onResetAcademicPoints && (
                <button
                  onClick={onResetAcademicPoints}
                  title="שחזר מאגר דוגמה מקורי"
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  <Undo2 className="w-3 h-3" />
                  <span>איפוס לברירת מחדל</span>
                </button>
              )}
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>הוסף מושג אקדמי</span>
              </button>
            </div>
          </div>

          {showAddForm && (
            <form
              onSubmit={handleAddNewPoint}
              className="bg-slate-950 border border-indigo-500/40 rounded-2xl p-4 sm:p-5 space-y-3 animate-fadeIn"
            >
              <h4 className="text-xs font-bold text-indigo-400">הוספת מושג / חומר אקדמי חדש</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-right">
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold mb-1">
                    כותרת המושג:
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="למשל: תסמונת גיאן-בארה"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold mb-1">
                    תחום דעת:
                  </label>
                  <input
                    type="text"
                    value={newDiscipline}
                    onChange={(e) => setNewDiscipline(e.target.value)}
                    placeholder="רפואה / משפטים / מדעי המוח..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 font-semibold">
                      עוגן ויזואלי / צלילי:
                    </label>
                    <AIFieldGeneratorButton
                      promptType="academic_concept"
                      inputContext={newTitle || 'מושג אקדמי'}
                      extraContext={newDiscipline}
                      onGenerated={(val) => setNewVisualAnchor(val)}
                      label="עוגן עם AI"
                      compact
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={newVisualAnchor}
                    onChange={(e) => setNewVisualAnchor(e.target.value)}
                    placeholder="למשל: גיאן -> גיא עמוק"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 font-semibold">
                      מיקום בארמון:
                    </label>
                    <AIFieldGeneratorButton
                      promptType="palace_desc"
                      inputContext={newTitle || 'תחנת ארמון'}
                      onGenerated={(val) => setNewLocus(val)}
                      label="לוקוס עם AI"
                      compact
                    />
                  </div>
                  <input
                    type="text"
                    value={newLocus}
                    onChange={(e) => setNewLocus(e.target.value)}
                    placeholder="למשל: סלון -> שטיח מרכזי"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 font-semibold">
                      הגדרה / תקציר המקור:
                    </label>
                    <AIFieldGeneratorButton
                      promptType="academic_concept"
                      inputContext={newTitle}
                      extraContext={newDiscipline}
                      onGenerated={(val) => setNewSummary(val)}
                      label="תקציר עם AI"
                      compact
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={newSummary}
                    onChange={(e) => setNewSummary(e.target.value)}
                    placeholder="למשל: מחלה אוטואימונית הפוגעת במעטפת המיאלין של מערכת העצבים"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="sm:col-span-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 font-semibold">
                      סצנה מנמונית בארמון הזיכרון:
                    </label>
                    <AIFieldGeneratorButton
                      promptType="academic_concept"
                      inputContext={newTitle}
                      extraContext={`${newDiscipline} - ${newSummary}`}
                      onGenerated={(txt) => setNewScene(txt)}
                      label="✨ חולל סצנה מנמונית ב-AI"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={newScene}
                    onChange={(e) => setNewScene(e.target.value)}
                    placeholder="למשל: גיא עמוק נפער בשטיח הסלון, ועצבים חשמליים זוהרים מתפוצצים בתוכו"
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
                  שמור מושג
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((item) => {
              const isEditing = editingId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 hover:border-indigo-500/40 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                        {item.discipline}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (isEditing) {
                              setEditingId(null);
                            } else {
                              setEditingId(item.id);
                              setEditTitle(item.conceptTitle);
                              setEditDiscipline(item.discipline);
                              setEditSummary(item.sourceSummary);
                              setEditKeyWord(item.keyWord);
                              setEditVisualAnchor(item.visualAnchor);
                              setEditLocus(item.palaceLocusInfo);
                              setEditScene(item.mnemonicScene);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-400 cursor-pointer"
                          title="ערוך מושג"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteAcademicPoint && (
                          <button
                            onClick={() => onDeleteAcademicPoint(item.id)}
                            className="p-1 text-slate-600 hover:text-rose-400 cursor-pointer"
                            title="מחק מושג"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2 pt-1 text-right">
                        <div>
                          <label className="text-[9px] text-slate-400 font-bold block mb-0.5">כותרת המושג:</label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                onUpdateAcademicPoint?.(item.id, {
                                  conceptTitle: editTitle.trim(),
                                  discipline: editDiscipline.trim(),
                                  sourceSummary: editSummary.trim(),
                                  visualAnchor: editVisualAnchor.trim(),
                                  mnemonicScene: editScene.trim(),
                                });
                                setEditingId(null);
                              }
                            }}
                            placeholder="כותרת המושג..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 font-bold block mb-0.5">תחום דעת:</label>
                          <input
                            type="text"
                            value={editDiscipline}
                            onChange={(e) => setEditDiscipline(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                onUpdateAcademicPoint?.(item.id, {
                                  conceptTitle: editTitle.trim(),
                                  discipline: editDiscipline.trim(),
                                  sourceSummary: editSummary.trim(),
                                  visualAnchor: editVisualAnchor.trim(),
                                  mnemonicScene: editScene.trim(),
                                });
                                setEditingId(null);
                              }
                            }}
                            placeholder="תחום דעת..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[9px] text-slate-400 font-bold">הגדרה / תקציר:</label>
                            <AIFieldGeneratorButton
                              promptType="academic_concept"
                              inputContext={editTitle || item.conceptTitle}
                              extraContext={editDiscipline || item.discipline}
                              onGenerated={(val) => setEditSummary(val)}
                              label="תקציר עם AI"
                              compact
                            />
                          </div>
                          <textarea
                            rows={2}
                            value={editSummary}
                            onChange={(e) => setEditSummary(e.target.value)}
                            placeholder="הגדרה / סיכום..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[9px] text-amber-400 font-bold">עוגן ויזואלי:</label>
                            <AIFieldGeneratorButton
                              promptType="academic_concept"
                              inputContext={editTitle || item.conceptTitle}
                              extraContext={editDiscipline || item.discipline}
                              onGenerated={(val) => setEditVisualAnchor(val)}
                              label="עוגן עם AI"
                              compact
                            />
                          </div>
                          <input
                            type="text"
                            value={editVisualAnchor}
                            onChange={(e) => setEditVisualAnchor(e.target.value)}
                            placeholder="עוגן ויזואלי..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-200"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[9px] text-emerald-400 font-bold">סצנה בארמון:</label>
                            <AIFieldGeneratorButton
                              promptType="academic_scene"
                              inputContext={editTitle || item.conceptTitle}
                              extraContext={`עוגן: ${editVisualAnchor}, תקציר: ${editSummary}`}
                              onGenerated={(val) => setEditScene(val)}
                              label="סצנה עם AI"
                              compact
                            />
                          </div>
                          <textarea
                            rows={2}
                            value={editScene}
                            onChange={(e) => setEditScene(e.target.value)}
                            placeholder="סצנה בארמון..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-200"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-1.5 pt-1">
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
                                if (onUpdateAcademicPoint) {
                                  onUpdateAcademicPoint(item.id, {
                                    conceptTitle: editTitle.trim(),
                                    discipline: editDiscipline.trim(),
                                    sourceSummary: editSummary.trim(),
                                    visualAnchor: editVisualAnchor.trim(),
                                    mnemonicScene: editScene.trim(),
                                  });
                                }
                                setEditingId(null);
                              }}
                              className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2.5 py-1 rounded cursor-pointer"
                            >
                              שמור
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4 className="text-base font-bold text-white">{item.conceptTitle}</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">{item.sourceSummary}</p>
                        <div className="bg-slate-900/70 p-2 rounded-xl border border-slate-800 text-xs">
                          <span className="text-amber-400 font-bold block text-[10px]">
                            🔍 עוגן ויזואלי:
                          </span>
                          <span className="text-slate-200 font-medium">{item.visualAnchor}</span>
                        </div>
                        <div className="bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-500/20 text-xs">
                          <span className="text-emerald-400 font-bold block text-[10px]">
                            ⚡ סצנה בארמון הזיכרון:
                          </span>
                          <span className="text-emerald-200 leading-relaxed font-medium">
                            {item.mnemonicScene}
                          </span>
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
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-slate-800 px-3.5 py-1.5 rounded-xl cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>מושג אקראי חדש</span>
            </button>
          </div>

          {academicPoints[quizIndex] && (
            <div className="max-w-xl mx-auto space-y-6 text-center">
              <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 shadow-inner space-y-3">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block">
                  שליפת עוגן וסצנה למושג:
                </span>
                <div className="text-2xl font-black text-white">
                  "{academicPoints[quizIndex].conceptTitle}"
                </div>
                <div className="text-xs text-slate-400">
                  תחום: <strong>{academicPoints[quizIndex].discipline}</strong>
                </div>
                <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-right mt-2">
                  {academicPoints[quizIndex].sourceSummary}
                </p>
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
                    placeholder="הקלד את העוגן הויזואלי..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                  />
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
                      <span className="font-bold text-sm">מעולה! שליפה אקדמית מדויקת ב-100% (+25 XP)</span>
                    </div>
                    <span className="text-[11px] text-emerald-400/90 font-medium">
                      לחץ Enter כדי לעבור ישר למושג האקראי הבא ↵
                    </span>
                  </div>
                )}

                {quizFeedback === 'incorrect' && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center gap-2 animate-fadeIn">
                    <XCircle className="w-5 h-5" />
                    <span className="font-bold text-sm">לא מדויק. נסה שוב או חשוף את הסצנה</span>
                  </div>
                )}

                {/* Auto-reveal full association on correct answer OR when clicking reveal */}
                {(quizFeedback === 'correct' || revealQuiz) && (
                  <div className="bg-slate-950/90 border border-indigo-500/40 rounded-2xl p-5 text-xs space-y-3 text-right animate-fadeIn shadow-xl shadow-indigo-500/5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-indigo-400 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        האסוציאציה המלאה והסצנה בארמון הזיכרון:
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {academicPoints[quizIndex].discipline}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-amber-400 font-bold block text-[10px]">🔍 עוגן ויזואלי / צלילי:</span>
                        <strong className="text-white text-sm">{academicPoints[quizIndex].visualAnchor}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-indigo-400 font-bold block text-[10px]">🏛️ מיקום בארמון:</span>
                        <strong className="text-white text-sm">{academicPoints[quizIndex].palaceLocusInfo}</strong>
                      </div>
                    </div>

                    <div className="bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-xl text-xs text-emerald-200">
                      ⚡ <strong className="text-emerald-400">סצנה מנטלית בארמון: </strong>
                      {academicPoints[quizIndex].mnemonicScene}
                    </div>

                    {quizFeedback === 'correct' && (
                      <div className="flex justify-center pt-1">
                        <button
                          onClick={handleNextQuizQuestion}
                          className="text-xs text-indigo-300 hover:text-white font-bold inline-flex items-center gap-1 bg-slate-900 px-3.5 py-1.5 rounded-xl border border-indigo-500/30 cursor-pointer"
                        >
                          <span>למושג הבא (Enter ↵)</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {quizFeedback !== 'correct' && !revealQuiz && (
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => setRevealQuiz(true)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-300 cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>חשוף עוגן וסצנה בארמון</span>
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
