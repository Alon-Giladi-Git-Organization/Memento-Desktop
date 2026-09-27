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
  Check,
  ArrowLeft,
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
  onTogglePersonReady?: (id: string, explicitState?: boolean) => void;
  onSetAllPeopleReady?: (ready: boolean) => void;
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
  onTogglePersonReady,
  onSetAllPeopleReady,
}) => {
  const [subView, setSubView] = useState<'cards' | 'trainer' | 'quiz'>('cards');
  const [search, setSearch] = useState('');
  const [onlyReadyFilter, setOnlyReadyFilter] = useState(false);

  // Ready for practice whitelist calculation
  const readyPeople = peopleCards.filter((p) => Boolean(p.is_ready_for_practice));

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

  // Quiz state (Strictly over readyPeople)
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizGuessName, setQuizGuessName] = useState('');
  const [quizFeedback, setQuizFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [revealQuizAnswer, setRevealQuizAnswer] = useState(false);

  const safeQuizIndex = readyPeople.length > 0 ? quizIndex % readyPeople.length : 0;
  const currentQuizPerson = readyPeople.length > 0 ? readyPeople[safeQuizIndex] : null;

  const safeTrainerIndex = readyPeople.length > 0 ? currentFaceIndex % readyPeople.length : 0;
  const currentTrainerPerson = readyPeople.length > 0 ? readyPeople[safeTrainerIndex] : null;

  const handleToggleReady = (id: string, currentState?: boolean) => {
    if (onTogglePersonReady) {
      onTogglePersonReady(id, !currentState);
    } else if (onUpdatePersonFaceCard) {
      onUpdatePersonFaceCard(id, { is_ready_for_practice: !currentState });
    }
  };

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
        is_ready_for_practice: true,
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
    if (readyPeople.length === 0) return;
    const nextIdx = Math.floor(Math.random() * readyPeople.length);
    setQuizIndex(nextIdx);
    setQuizGuessName('');
    setQuizFeedback('idle');
    setRevealQuizAnswer(false);
  };

  const handleCheckQuiz = () => {
    if (!currentQuizPerson) return;
    const target = currentQuizPerson.name.trim().toLowerCase();
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
    if (onlyReadyFilter && !p.is_ready_for_practice) return false;
    return (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.roleOrJob.toLowerCase().includes(search.toLowerCase()) ||
      p.morphologicalAnchor.toLowerCase().includes(search.toLowerCase()) ||
      p.substituteWord.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-slate-900">
      {/* Header and Sub-Tabs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b-2 border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Smile className="w-5 h-5 text-[#FF9600]" />
              <span>שמות ופנים (Names & Faces System)</span>
            </h2>
            {onOpenSummary && (
              <button
                onClick={() => onOpenSummary('names')}
                className="btn-duo-neutral inline-flex items-center gap-1.5 px-3 py-1 text-xs cursor-pointer"
                title="צפה בסיכום הטכניקה ודוגמאות מעשיות"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#FF9600]" />
                <span>סיכום ודוגמאות</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            הצמדת שמות לעוגן מורפולוגי בפנים בעזרת מילת תחליף והתנגשות קינטית
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border-2 border-slate-200 self-stretch md:self-auto justify-center">
          <button
            onClick={() => setSubView('cards')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              subView === 'cards'
                ? 'bg-[#FF9600] text-white border-b-2 border-[#e07e00] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>מאגר וכרטיסיות ({peopleCards.length})</span>
          </button>
          <button
            onClick={() => setSubView('trainer')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              subView === 'trainer'
                ? 'bg-[#FF9600] text-white border-b-2 border-[#e07e00] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>אימון חזותי</span>
          </button>
          <button
            onClick={() => setSubView('quiz')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              subView === 'quiz'
                ? 'bg-[#FF9600] text-white border-b-2 border-[#e07e00] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>מבחן שליפה ({readyPeople.length} מוכנים)</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: CARDS & MANAGEMENT */}
      {subView === 'cards' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="חיפוש שם, תפקיד, עוגן בפנים או מילת תחליף..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-2xs"
                />
              </div>

              {/* Ready for Practice Filter Button */}
              <button
                onClick={() => setOnlyReadyFilter(!onlyReadyFilter)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border-2 transition-all cursor-pointer ${
                  onlyReadyFilter
                    ? 'bg-emerald-500/15 text-emerald-800 border-emerald-400'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
                title="סנן והצג רק אנשים שסומנו כמוכנים לתרגול"
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${onlyReadyFilter ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>מוכנים בלבד ({readyPeople.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Batch Actions */}
              {onSetAllPeopleReady && (
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    onClick={() => {
                      onSetAllPeopleReady(true);
                      onEarnPoints(15, 'סימון כל כרטיסי השמות כמוכנים');
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    ✓ סמן הכל
                  </button>
                  {readyPeople.length > 0 && (
                    <button
                      onClick={() => onSetAllPeopleReady(false)}
                      className="text-[11px] font-medium text-slate-500 hover:text-rose-600 px-2 py-1.5 rounded-xl transition-all cursor-pointer"
                      title="בטל את כל סימוני התרגול"
                    >
                      נקה סימונים
                    </button>
                  )}
                </div>
              )}

              {onResetPersonFaceCards && (
                <button
                  onClick={onResetPersonFaceCards}
                  title="שחזר מאגר דוגמה מקורי"
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 bg-slate-50 border-2 border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer font-bold shadow-2xs"
                >
                  <Undo2 className="w-3 h-3" />
                  <span>איפוס לברירת מחדל</span>
                </button>
              )}
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 bg-[#FF9600] hover:bg-[#e07e00] text-white font-black text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 shadow-xs"
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
              className="bg-white border-2 border-amber-300 rounded-2xl p-4 sm:p-5 space-y-3 animate-fadeIn shadow-md text-slate-900"
            >
              <h4 className="text-xs font-bold text-amber-800">הוספת כרטיס אישי חדש (שם, עוגן מורפולוגי והתנגשות)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-right">
                <div>
                  <label className="text-[10px] text-slate-600 block font-bold mb-1">
                    שם האדם:
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="למשל: יובל כהן"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 block font-bold mb-1">
                    תפקיד / תיאור:
                  </label>
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="למשל: סמנכ''ל תפעול"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-600 font-bold">
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
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-600 font-bold">
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
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-600 font-bold">
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
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#FF9600] hover:bg-[#e07e00] text-white font-black text-xs rounded-xl cursor-pointer shadow-xs"
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
                  className="bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 hover:border-slate-300 rounded-2xl p-4 transition-all flex flex-col justify-between space-y-3 shadow-2xs text-slate-900"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={person.avatarUrl}
                          alt={person.name}
                          className="w-11 h-11 rounded-full object-cover border-2 border-amber-400 shadow-2xs"
                        />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{person.name}</h4>
                          <span className="text-[11px] text-slate-500 font-medium">{person.roleOrJob}</span>
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
                          className="p-1 text-slate-400 hover:text-amber-600 cursor-pointer"
                          title="ערוך כרטיס"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {onDeletePersonFaceCard && (
                          <button
                            onClick={() => onDeletePersonFaceCard(person.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
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
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <span className="text-amber-800 font-bold block text-[10px]">
                            🔍 עוגן מורפולוגי:
                          </span>
                          <span className="text-slate-900 font-medium">{person.morphologicalAnchor}</span>
                        </div>

                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <span className="text-cyan-800 font-bold block text-[10px]">
                            🏷️ מילת תחליף לשם:
                          </span>
                          <span className="text-slate-900 font-medium">{person.substituteWord}</span>
                        </div>

                        <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                          <span className="text-emerald-800 font-bold block text-[10px]">
                            ⚡ התנגשות קינטית:
                          </span>
                          <span className="text-emerald-950 font-medium text-[11px]">{person.mnemonicScene}</span>
                        </div>
                      </div>
                    )}

                    {/* Ready for Practice Checkbox */}
                    <div className="pt-2.5 mt-2 border-t border-slate-200 flex items-center justify-between">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer select-none py-1 px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all">
                        <input
                          type="checkbox"
                          checked={Boolean(person.is_ready_for_practice)}
                          onChange={() => handleToggleReady(person.id, person.is_ready_for_practice)}
                          className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
                        />
                        <span className={`text-[11px] font-bold ${person.is_ready_for_practice ? 'text-amber-800' : 'text-slate-500'}`}>
                          מוכן לתרגול
                        </span>
                      </label>
                      {person.is_ready_for_practice && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>מוכן</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: VISUAL TRAINER */}
      {subView === 'trainer' && (
        <div className="max-w-xl mx-auto space-y-6 text-center text-slate-900">
          {readyPeople.length === 0 ? (
            <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-3xl p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto my-6 text-slate-900 animate-fadeIn">
              <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  טרם סימנת פריטים כמוכנים לתרגול במודולה זו. סמן מספר אסוציאציות כדי להתחיל.
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                  האימון החזותי מציג אך ורק כרטיסי שמות ופנים שהגדרת כמוכנים לתרגול. סמן כרטיסים במאגר כדי להתחיל לתרגל.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                <button
                  onClick={() => setSubView('cards')}
                  className="btn-duo-primary px-5 py-2.5 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>מעבר למאגר הכרטיסיות לסימון</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
                {onSetAllPeopleReady && (
                  <button
                    onClick={() => {
                      onSetAllPeopleReady(true);
                      onEarnPoints(15, 'סימון כל הכרטיסים כמוכנים');
                    }}
                    className="btn-duo-neutral px-4 py-2.5 text-xs font-bold cursor-pointer"
                  >
                    <span>סמן את כל הכרטיסים והתחל</span>
                  </button>
                )}
              </div>
            </div>
          ) : currentTrainerPerson ? (
            <div className="bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                <span className="font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                  כרטיס {safeTrainerIndex + 1} מתוך {readyPeople.length} מוכנים
                </span>
                <button
                  onClick={() => {
                    setCurrentFaceIndex((prev) => (prev + 1) % readyPeople.length);
                    setRevealFaceAnchor(false);
                  }}
                  className="text-[#FF9600] font-black hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>הפנים הבאות</span>
                </button>
              </div>

              <div className="relative inline-block">
                <img
                  src={currentTrainerPerson.avatarUrl}
                  alt={currentTrainerPerson.name}
                  className="w-36 h-36 rounded-3xl object-cover mx-auto shadow-md border-4 border-amber-300"
                />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {currentTrainerPerson.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {currentTrainerPerson.roleOrJob}
                </p>
              </div>

              {!revealFaceAnchor ? (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-slate-600 font-medium">
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
                    className="px-6 py-2.5 rounded-2xl bg-[#FF9600] hover:bg-[#e07e00] text-white font-black text-xs shadow-sm cursor-pointer active:scale-95"
                  >
                    חשוף את העוגן וההדבקה הקינטית (+20 XP)
                  </button>
                </div>
              ) : (
                <div className="bg-slate-50 border-2 border-amber-300 rounded-2xl p-5 space-y-3 animate-fadeIn text-right shadow-2xs">
                  <div className="text-xs">
                    <span className="font-bold text-amber-800 ml-1">עוגן מורפולוגי בפנים:</span>
                    <span className="text-slate-900 font-bold">
                      {currentTrainerPerson.morphologicalAnchor}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-cyan-800 ml-1">מילת תחליף לשם:</span>
                    <span className="text-slate-900 font-bold">
                      {currentTrainerPerson.substituteWord}
                    </span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-950 font-medium">
                    <span className="font-bold text-emerald-800">⚡ התנגשות קינטית: </span>
                    {currentTrainerPerson.mnemonicScene}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* SUB-VIEW 3: QUIZ */}
      {subView === 'quiz' && (
        <div className="space-y-6 text-slate-900">
          {readyPeople.length === 0 ? (
            <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-3xl p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto my-6 text-slate-900 animate-fadeIn">
              <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  טרם סימנת פריטים כמוכנים לתרגול במודולה זו. סמן מספר אסוציאציות כדי להתחיל.
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                  כדי שתוכל לשלוט באופן מלא בעקומת הלמידה, מבחן השליפה מתשאל אך ורק על אנשים שסומנו בתיבת "מוכן לתרגול". סמן את האנשים שהטמעת כדי להתחיל.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                <button
                  onClick={() => setSubView('cards')}
                  className="btn-duo-primary px-5 py-2.5 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>מעבר למאגר הכרטיסיות לסימון</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
                {onSetAllPeopleReady && (
                  <button
                    onClick={() => {
                      onSetAllPeopleReady(true);
                      onEarnPoints(15, 'סימון כל הכרטיסים כמוכנים');
                    }}
                    className="btn-duo-neutral px-4 py-2.5 text-xs font-bold cursor-pointer"
                  >
                    <span>סמן את כל הכרטיסים והתחל</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-xl border border-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>מתרגל {readyPeople.length} אנשים שסומנו כמוכנים (מתוך {peopleCards.length})</span>
                </span>
                <button
                  onClick={handleNextQuizQuestion}
                  className="flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-900 bg-slate-100 font-bold px-3.5 py-1.5 rounded-xl border border-slate-200 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>אדם אקראי חדש</span>
                </button>
              </div>

              {currentQuizPerson && (
                <div className="max-w-xl mx-auto space-y-6 text-center">
                  <div className="p-8 rounded-3xl bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 shadow-sm space-y-4">
                    <img
                      src={currentQuizPerson.avatarUrl}
                      alt="איש למבחן"
                      className="w-28 h-28 rounded-2xl object-cover mx-auto border-2 border-amber-400 shadow-md"
                    />
                    <div>
                      <span className="text-xs font-black text-amber-600 uppercase tracking-widest block">
                        מה שמו של אדם זה?
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        תפקיד: {currentQuizPerson.roleOrJob}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700">
                      💡 רמז עוגן בפנים: <strong>{currentQuizPerson.morphologicalAnchor}</strong>
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
                        className="flex-1 bg-white border-2 border-slate-200 rounded-xl px-4 py-2.5 text-center text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
                      />
                      <button
                        onClick={() => {
                          if (quizFeedback === 'correct') {
                            handleNextQuizQuestion();
                          } else {
                            handleCheckQuiz();
                          }
                        }}
                        className="bg-[#FF9600] hover:bg-[#e07e00] text-white font-black px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        {quizFeedback === 'correct' ? 'הבא ↵' : 'בדוק'}
                      </button>
                    </div>

                    {quizFeedback === 'correct' && (
                      <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 flex flex-col items-center justify-center gap-1.5 animate-fadeIn">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <span className="font-bold text-sm">מדויק ב-100%! זיכרון שמות פנומנלי (+20 XP)</span>
                        </div>
                        <span className="text-[11px] text-emerald-700 font-medium">
                          לחץ Enter כדי לעבור ישר לאדם האקראי הבא ↵
                        </span>
                      </div>
                    )}

                    {quizFeedback === 'incorrect' && (
                      <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-800 flex items-center justify-center gap-2 animate-fadeIn">
                        <XCircle className="w-5 h-5 text-rose-600" />
                        <span className="font-bold text-sm">לא מדויק. נסה שוב או חשוף את השם</span>
                      </div>
                    )}

                    {/* Auto-reveal full association & kinetic scene on correct answer OR when clicking reveal */}
                    {(quizFeedback === 'correct' || revealQuizAnswer) && (
                      <div className="bg-white border-2 border-amber-300 rounded-2xl p-5 text-xs space-y-2.5 text-right animate-fadeIn shadow-md">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <span className="text-amber-800 font-bold flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            האסוציאציה והסצנה המלאה:
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {currentQuizPerson.roleOrJob}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-amber-800 font-bold block text-[10px]">👤 שם האדם:</span>
                            <strong className="text-slate-900 text-sm">{currentQuizPerson.name}</strong>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-cyan-800 font-bold block text-[10px]">🏷️ מילת תחליף לשם:</span>
                            <strong className="text-slate-900 text-sm">{currentQuizPerson.substituteWord}</strong>
                          </div>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                          <span className="text-amber-800 font-bold block text-[10px]">🔍 עוגן מורפולוגי בפנים:</span>
                          <span className="text-slate-800 font-medium">{currentQuizPerson.morphologicalAnchor}</span>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-950 font-medium">
                          ⚡ <strong className="text-emerald-800">התנגשות קינטית מנטלית: </strong>
                          {currentQuizPerson.mnemonicScene}
                        </div>

                        {quizFeedback === 'correct' && (
                          <div className="flex justify-center pt-1">
                            <button
                              onClick={handleNextQuizQuestion}
                              className="text-xs text-amber-800 hover:text-amber-950 font-bold inline-flex items-center gap-1 bg-amber-50 px-3.5 py-1.5 rounded-xl border border-amber-300 cursor-pointer"
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
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-amber-700 cursor-pointer font-bold"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>חשוף את השם והסצנה</span>
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
