import React, { useState } from 'react';
import {
  Smile,
  Search,
  Plus,
  Edit3,
  Save,
  Trash2,
  Undo2,
  Sparkles,
  Eye,
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PersonFaceCard } from '../../types/memory';
import { AIFieldGeneratorButton } from '../AIFieldGeneratorButton';

interface NamesFacesModuleProps {
  peopleCards: PersonFaceCard[];
  onEarnPoints: (amount: number, reason?: string) => void;
  onUnlockBadge: (badge: string) => void;
  onAddPersonFaceCard?: (person: Omit<PersonFaceCard, 'id'>) => void;
  onUpdatePersonFaceCard?: (id: string, updates: Partial<PersonFaceCard>) => void;
  onDeletePersonFaceCard?: (id: string) => void;
  onResetPersonFaceCards?: () => void;
  onOpenSummary?: (techniqueId: string) => void;
}

export const NamesFacesModule: React.FC<NamesFacesModuleProps> = ({
  peopleCards,
  onEarnPoints,
  onUnlockBadge,
  onAddPersonFaceCard,
  onUpdatePersonFaceCard,
  onDeletePersonFaceCard,
  onResetPersonFaceCards,
  onOpenSummary,
}) => {
  const [subView, setSubView] = useState<'cards' | 'trainer' | 'quiz'>('cards');
  const [search, setSearch] = useState('');

  // Trainer state
  const [currentFaceIndex, setCurrentFaceIndex] = useState(0);
  const [revealFaceAnchor, setRevealFaceAnchor] = useState(false);

  // Edit card state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editAnchor, setEditAnchor] = useState('');
  const [editSubstitute, setEditSubstitute] = useState('');
  const [editScene, setEditScene] = useState('');

  // Add card form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newAnchor, setNewAnchor] = useState('');
  const [newSubstitute, setNewSubstitute] = useState('');
  const [newScene, setNewScene] = useState('');

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizGuessName, setQuizGuessName] = useState('');
  const [quizFeedback, setQuizFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [revealQuizAnswer, setRevealQuizAnswer] = useState(false);

  const handleAddNewCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    if (onAddPersonFaceCard) {
      const avatarSeed = `seed-${Date.now()}`;
      onAddPersonFaceCard({
        name: newName.trim(),
        roleOrJob: newRole.trim() || 'איש מקצוע',
        avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
        avatarSeed,
        morphologicalAnchor: newAnchor.trim() || 'מאפיין בולט בפנים',
        substituteWord: newSubstitute.trim() || newName.trim(),
        mnemonicScene: newScene.trim() || `התנגשות קינטית עם ${newAnchor}`,
      });
    }

    setNewName('');
    setNewRole('');
    setNewAnchor('');
    setNewSubstitute('');
    setNewScene('');
    setShowAddForm(false);
  };

  const handleNextQuizQuestion = () => {
    if (peopleCards.length === 0) return;
    const nextIdx = Math.floor(Math.random() * peopleCards.length);
    setQuizIndex(nextIdx);
    setQuizGuessName('');
    setQuizFeedback('idle');
    setRevealQuizAnswer(false);
  };

  const handleCheckQuiz = () => {
    const current = peopleCards[quizIndex];
    if (!current) return;
    const target = current.name.trim().toLowerCase();
    const guess = quizGuessName.trim().toLowerCase();
    if (!guess) return;

    // Strict exact match on full name or single first/last name if multi-part
    const targetParts = target.split(/\s+/).filter(Boolean);
    const isExact =
      guess === target ||
      (targetParts.length > 1 && targetParts.some((part) => part === guess));

    if (isExact) {
      setQuizFeedback('correct');
      onEarnPoints(20, 'זיהוי שם ופנים במבחן');
      onUnlockBadge('מזהה עוגנים ושמות');
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } else {
      setQuizFeedback('incorrect');
    }
  };

  const filteredPeople = peopleCards.filter((p) => {
    return (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.roleOrJob.toLowerCase().includes(search.toLowerCase()) ||
      p.morphologicalAnchor.toLowerCase().includes(search.toLowerCase()) ||
      p.substituteWord.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
      {/* Header and Sub-Tabs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Smile className="w-5 h-5 text-emerald-400" />
              <span>שמות ופנים (Names & Faces System)</span>
            </h2>
            {onOpenSummary && (
              <button
                onClick={() => onOpenSummary('names')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
                title="צפה בסיכום הטכניקה ודוגמאות מעשיות"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>סיכום ודוגמאות</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            הצמדת שמות לעוגן מורפולוגי בפנים בעזרת מילת תחליף והתנגשות קינטית
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-stretch md:self-auto justify-center">
          <button
            onClick={() => setSubView('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subView === 'cards'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>מאגר וכרטיסיות ({peopleCards.length})</span>
          </button>
          <button
            onClick={() => setSubView('trainer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subView === 'trainer'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>אימון חזותי</span>
          </button>
          <button
            onClick={() => setSubView('quiz')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subView === 'quiz'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>מבחן שליפה</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: CARDS & MANAGEMENT */}
      {subView === 'cards' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="חיפוש שם, תפקיד, עוגן בפנים או מילת תחליף..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              {onResetPersonFaceCards && (
                <button
                  onClick={onResetPersonFaceCards}
                  title="שחזר מאגר דוגמה מקורי"
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  <Undo2 className="w-3 h-3" />
                  <span>איפוס לברירת מחדל</span>
                </button>
              )}
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>הוסף כרטיס שם ופנים</span>
              </button>
            </div>
          </div>

          {/* Add New Card Form */}
          {showAddForm && (
            <form
              onSubmit={handleAddNewCard}
              className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 space-y-3 animate-fadeIn"
            >
              <h4 className="text-xs font-bold text-emerald-400">הוספת כרטיס אישי חדש (שם, עוגן מורפולוגי והתנגשות)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-right">
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold mb-1">
                    שם האדם:
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="למשל: יובל כהן"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold mb-1">
                    תפקיד / תיאור:
                  </label>
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="למשל: סמנכ''ל תפעול"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 font-semibold">
                      עוגן מורפולוגי בפנים:
                    </label>
                    <AIFieldGeneratorButton
                      promptType="name_face_anchor"
                      inputContext={newName || 'אדם חדש'}
                      extraContext={newRole}
                      onGenerated={(val) => setNewAnchor(val)}
                      label="עוגן עם AI"
                      compact
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={newAnchor}
                    onChange={(e) => setNewAnchor(e.target.value)}
                    placeholder="למשל: אף נשרי, גבות עבות, שומה בסנטר"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 font-semibold">
                      מילת תחליף לשם (Substitute):
                    </label>
                    <AIFieldGeneratorButton
                      promptType="name_face_substitute"
                      inputContext={newName || 'שם'}
                      onGenerated={(val) => setNewSubstitute(val)}
                      label="תחליף עם AI"
                      compact
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={newSubstitute}
                    onChange={(e) => setNewSubstitute(e.target.value)}
                    placeholder="למשל: יובל -> יובל מים שוצף"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 font-semibold">
                      סצנה קינטית (התנגשות בין המילה לעוגן):
                    </label>
                    <AIFieldGeneratorButton
                      promptType="name_face_scene"
                      inputContext={newName}
                      extraContext={`עוגן: ${newAnchor}, מילת תחליף: ${newSubstitute}`}
                      onGenerated={(val) => setNewScene(val)}
                      label="סצנה עם AI"
                      compact
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={newScene}
                    onChange={(e) => setNewScene(e.target.value)}
                    placeholder="למשל: נחל מים סוער מתפרץ ישירות מתוך הגבות העבות שלו"
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
                  className="px-4 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  שמור כרטיס
                </button>
              </div>
            </form>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPeople.map((person) => {
              const isEditing = editingId === person.id;

              return (
                <div
                  key={person.id}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={person.avatarUrl}
                          alt={person.name}
                          className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500/40"
                        />
                        <div>
                          <h4 className="text-sm font-bold text-white">{person.name}</h4>
                          <span className="text-[11px] text-slate-400">{person.roleOrJob}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (isEditing) {
                              setEditingId(null);
                            } else {
                              setEditingId(person.id);
                              setEditName(person.name);
                              setEditRole(person.roleOrJob);
                              setEditAnchor(person.morphologicalAnchor);
                              setEditSubstitute(person.substituteWord);
                              setEditScene(person.mnemonicScene);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-emerald-400 cursor-pointer"
                          title="ערוך כרטיס"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {onDeletePersonFaceCard && (
                          <button
                            onClick={() => onDeletePersonFaceCard(person.id)}
                            className="p-1 text-slate-600 hover:text-rose-400 cursor-pointer"
                            title="מחק כרטיס"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2 pt-2 border-t border-slate-800 text-right">
                        <div>
                          <label className="text-[9px] text-slate-400 block font-bold">שם:</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                onUpdatePersonFaceCard?.(person.id, {
                                  name: editName.trim(),
                                  roleOrJob: editRole.trim(),
                                  morphologicalAnchor: editAnchor.trim(),
                                  substituteWord: editSubstitute.trim(),
                                  mnemonicScene: editScene.trim(),
                                });
                                setEditingId(null);
                              }
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 block font-bold">תפקיד:</label>
                          <input
                            type="text"
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                onUpdatePersonFaceCard?.(person.id, {
                                  name: editName.trim(),
                                  roleOrJob: editRole.trim(),
                                  morphologicalAnchor: editAnchor.trim(),
                                  substituteWord: editSubstitute.trim(),
                                  mnemonicScene: editScene.trim(),
                                });
                                setEditingId(null);
                              }
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[9px] text-emerald-400 block font-bold">עוגן מורפולוגי בפנים:</label>
                            <AIFieldGeneratorButton
                              promptType="name_face_anchor"
                              inputContext={editName || person.name}
                              extraContext={editRole || person.roleOrJob}
                              onGenerated={(val) => setEditAnchor(val)}
                              label="עוגן עם AI"
                              compact
                            />
                          </div>
                          <input
                            type="text"
                            value={editAnchor}
                            onChange={(e) => setEditAnchor(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                onUpdatePersonFaceCard?.(person.id, {
                                  name: editName.trim(),
                                  roleOrJob: editRole.trim(),
                                  morphologicalAnchor: editAnchor.trim(),
                                  substituteWord: editSubstitute.trim(),
                                  mnemonicScene: editScene.trim(),
                                });
                                setEditingId(null);
                              }
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[9px] text-cyan-400 block font-bold">מילת תחליף:</label>
                            <AIFieldGeneratorButton
                              promptType="name_face_substitute"
                              inputContext={editName || person.name}
                              onGenerated={(val) => setEditSubstitute(val)}
                              label="תחליף עם AI"
                              compact
                            />
                          </div>
                          <input
                            type="text"
                            value={editSubstitute}
                            onChange={(e) => setEditSubstitute(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                onUpdatePersonFaceCard?.(person.id, {
                                  name: editName.trim(),
                                  roleOrJob: editRole.trim(),
                                  morphologicalAnchor: editAnchor.trim(),
                                  substituteWord: editSubstitute.trim(),
                                  mnemonicScene: editScene.trim(),
                                });
                                setEditingId(null);
                              }
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[9px] text-slate-400 block font-bold">סצנה קינטית:</label>
                            <AIFieldGeneratorButton
                              promptType="name_face_scene"
                              inputContext={editName || person.name}
                              extraContext={`עוגן: ${editAnchor}, מילת תחליף: ${editSubstitute}`}
                              onGenerated={(val) => setEditScene(val)}
                              label="סצנה עם AI"
                              compact
                            />
                          </div>
                          <input
                            type="text"
                            value={editScene}
                            onChange={(e) => setEditScene(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                onUpdatePersonFaceCard?.(person.id, {
                                  name: editName.trim(),
                                  roleOrJob: editRole.trim(),
                                  morphologicalAnchor: editAnchor.trim(),
                                  substituteWord: editSubstitute.trim(),
                                  mnemonicScene: editScene.trim(),
                                });
                                setEditingId(null);
                              }
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-1.5 pt-1">
                          <span className="text-[9px] text-slate-500 font-mono">↵ Enter לשמירה</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-[10px] text-slate-400 hover:text-slate-200 px-2 py-1"
                            >
                              ביטול
                            </button>
                            <button
                              onClick={() => {
                                if (onUpdatePersonFaceCard) {
                                  onUpdatePersonFaceCard(person.id, {
                                    name: editName.trim(),
                                    roleOrJob: editRole.trim(),
                                    morphologicalAnchor: editAnchor.trim(),
                                    substituteWord: editSubstitute.trim(),
                                    mnemonicScene: editScene.trim(),
                                  });
                                }
                                setEditingId(null);
                              }}
                              className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded cursor-pointer"
                            >
                              שמור שינויים
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5 text-xs">
                        <div className="bg-slate-900/70 p-2 rounded-xl border border-slate-800/80">
                          <span className="text-emerald-400 font-bold block text-[10px]">
                            🔍 עוגן מורפולוגי:
                          </span>
                          <span className="text-white font-medium">{person.morphologicalAnchor}</span>
                        </div>

                        <div className="bg-slate-900/70 p-2 rounded-xl border border-slate-800/80">
                          <span className="text-cyan-400 font-bold block text-[10px]">
                            🏷️ מילת תחליף לשם:
                          </span>
                          <span className="text-white font-medium">{person.substituteWord}</span>
                        </div>

                        <div className="bg-emerald-950/20 p-2 rounded-xl border border-emerald-500/20">
                          <span className="text-emerald-300 font-bold block text-[10px]">
                            ⚡ התנגשות קינטית:
                          </span>
                          <span className="text-emerald-100 text-[11px]">{person.mnemonicScene}</span>
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

      {/* SUB-VIEW 2: VISUAL TRAINER */}
      {subView === 'trainer' && (
        <div className="max-w-xl mx-auto space-y-6 text-center">
          {peopleCards[currentFaceIndex] && (
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>
                  כרטיס {currentFaceIndex + 1} מתוך {peopleCards.length}
                </span>
                <button
                  onClick={() => {
                    setCurrentFaceIndex((prev) => (prev + 1) % peopleCards.length);
                    setRevealFaceAnchor(false);
                  }}
                  className="text-emerald-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>הפנים הבאות</span>
                </button>
              </div>

              <div className="relative inline-block">
                <img
                  src={peopleCards[currentFaceIndex].avatarUrl}
                  alt={peopleCards[currentFaceIndex].name}
                  className="w-36 h-36 rounded-3xl object-cover mx-auto shadow-2xl border-4 border-emerald-500/30"
                />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">
                  {peopleCards[currentFaceIndex].name}
                </h3>
                <p className="text-xs text-slate-400">
                  {peopleCards[currentFaceIndex].roleOrJob}
                </p>
              </div>

              {!revealFaceAnchor ? (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-slate-400">
                    התבונן בפנים: מהו המאפיין הייחודי ביותר שקופץ לעין (עוגן)? כיצד מחברים את מילת
                    התחליף של השם לעוגן?
                  </p>
                  <button
                    onClick={() => {
                      setRevealFaceAnchor(true);
                      onEarnPoints(20, 'זיהוי עוגן מורפולוגי בשמות ופנים');
                      onUnlockBadge('מזהה עוגנים ושמות');
                      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
                    }}
                    className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    חשוף את העוגן וההדבקה הקינטית (+20 XP)
                  </button>
                </div>
              ) : (
                <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 space-y-3 animate-fadeIn text-right">
                  <div className="text-xs">
                    <span className="font-bold text-emerald-400 ml-1">עוגן מורפולוגי בפנים:</span>
                    <span className="text-white font-semibold">
                      {peopleCards[currentFaceIndex].morphologicalAnchor}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-cyan-400 ml-1">מילת תחליף לשם:</span>
                    <span className="text-white font-semibold">
                      {peopleCards[currentFaceIndex].substituteWord}
                    </span>
                  </div>
                  <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl text-xs text-emerald-200">
                    <span className="font-bold text-emerald-400">⚡ התנגשות קינטית: </span>
                    {peopleCards[currentFaceIndex].mnemonicScene}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 3: QUIZ */}
      {subView === 'quiz' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={handleNextQuizQuestion}
              className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-slate-800 px-3.5 py-1.5 rounded-xl cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>אדם אקראי חדש</span>
            </button>
          </div>

          {peopleCards[quizIndex] && (
            <div className="max-w-xl mx-auto space-y-6 text-center">
              <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 shadow-inner space-y-4">
                <img
                  src={peopleCards[quizIndex].avatarUrl}
                  alt="איש למבחן"
                  className="w-28 h-28 rounded-2xl object-cover mx-auto border-2 border-emerald-500/40 shadow-lg"
                />
                <div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block">
                    מה שמו של אדם זה?
                  </span>
                  <span className="text-xs text-slate-400">
                    תפקיד: {peopleCards[quizIndex].roleOrJob}
                  </span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-300">
                  💡 רמז עוגן בפנים: <strong>{peopleCards[quizIndex].morphologicalAnchor}</strong>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2 max-w-sm mx-auto">
                  <input
                    type="text"
                    value={quizGuessName}
                    onChange={(e) => setQuizGuessName(e.target.value)}
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
                    placeholder="הקלד את השם..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => {
                      if (quizFeedback === 'correct') {
                        handleNextQuizQuestion();
                      } else {
                        handleCheckQuiz();
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    {quizFeedback === 'correct' ? 'הבא ↵' : 'בדוק'}
                  </button>
                </div>

                {quizFeedback === 'correct' && (
                  <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex flex-col items-center justify-center gap-1.5 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="font-bold text-sm">מדויק ב-100%! זיכרון שמות פנומנלי (+20 XP)</span>
                    </div>
                    <span className="text-[11px] text-emerald-400/90 font-medium">
                      לחץ Enter כדי לעבור ישר לאדם האקראי הבא ↵
                    </span>
                  </div>
                )}

                {quizFeedback === 'incorrect' && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center gap-2 animate-fadeIn">
                    <XCircle className="w-5 h-5" />
                    <span className="font-bold text-sm">לא מדויק. נסה שוב או חשוף את השם</span>
                  </div>
                )}

                {/* Auto-reveal full association & kinetic scene on correct answer OR when clicking reveal */}
                {(quizFeedback === 'correct' || revealQuizAnswer) && (
                  <div className="bg-slate-950/90 border border-emerald-500/40 rounded-2xl p-5 text-xs space-y-2.5 text-right animate-fadeIn shadow-xl shadow-emerald-500/5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        האסוציאציה והסצנה המלאה:
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {peopleCards[quizIndex].roleOrJob}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-emerald-400 font-bold block text-[10px]">👤 שם האדם:</span>
                        <strong className="text-white text-sm">{peopleCards[quizIndex].name}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-cyan-400 font-bold block text-[10px]">🏷️ מילת תחליף לשם:</span>
                        <strong className="text-white text-sm">{peopleCards[quizIndex].substituteWord}</strong>
                      </div>
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-xs">
                      <span className="text-emerald-300 font-bold block text-[10px]">🔍 עוגן מורפולוגי בפנים:</span>
                      <span className="text-slate-200">{peopleCards[quizIndex].morphologicalAnchor}</span>
                    </div>
                    <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl text-xs text-emerald-200">
                      ⚡ <strong className="text-emerald-400">התנגשות קינטית מנטלית: </strong>
                      {peopleCards[quizIndex].mnemonicScene}
                    </div>

                    {quizFeedback === 'correct' && (
                      <div className="flex justify-center pt-1">
                        <button
                          onClick={handleNextQuizQuestion}
                          className="text-xs text-emerald-300 hover:text-white font-bold inline-flex items-center gap-1 bg-slate-900 px-3.5 py-1.5 rounded-xl border border-emerald-500/30 cursor-pointer"
                        >
                          <span>לאדם הבא (Enter ↵)</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {quizFeedback !== 'correct' && !revealQuizAnswer && (
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => setRevealQuizAnswer(true)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-300 cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>חשוף את השם והסצנה</span>
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
