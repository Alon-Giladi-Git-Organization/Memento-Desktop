import React, { useState } from 'react';
import {
  Compass,
  Plus,
  Play,
  CheckCircle,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Edit2,
  Sparkles,
  MapPin,
  Home,
  Building,
  GraduationCap,
  Trees,
  Check,
  RotateCcw,
  Trophy,
  HelpCircle,
  Cloud,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MemoryPalace, PalaceLocus } from '../types/memory';
import { AIFieldGeneratorButton } from './AIFieldGeneratorButton';

interface PalacesManagerProps {
  palaces: MemoryPalace[];
  onAddPalace: (
    name: string,
    description: string,
    category: 'home' | 'work' | 'campus' | 'outdoor' | 'custom'
  ) => Promise<any>;
  onDeletePalace: (palaceId: string) => Promise<void>;
  onAddLocus: (
    palaceId: string,
    title: string,
    roomName: string,
    positionDescription: string,
    storedContent?: string,
    mnemonicScene?: string
  ) => Promise<void>;
  onUpdateLocus: (palaceId: string, locusId: string, updates: Partial<PalaceLocus>) => void;
  onDeleteLocus: (palaceId: string, locusId: string) => void;
  onEarnPoints: (amount: number, reason?: string) => void;
  onUnlockBadge: (badge: string) => void;
  isAuthenticated: boolean;
  onOpenSummary?: (techniqueId: string) => void;
}

export const PalacesManager: React.FC<PalacesManagerProps> = ({
  palaces,
  onAddPalace,
  onDeletePalace,
  onAddLocus,
  onUpdateLocus,
  onDeleteLocus,
  onEarnPoints,
  onUnlockBadge,
  isAuthenticated,
  onOpenSummary,
}) => {
  const [selectedPalaceId, setSelectedPalaceId] = useState<string>(
    palaces[0]?.id || 'palace-home-1'
  );

  // Walkthrough Practice Mode
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);
  const [walkthroughIndex, setWalkthroughIndex] = useState(0);
  const [isRecallHidden, setIsRecallHidden] = useState(true);
  const [userRecallGuess, setUserRecallGuess] = useState('');
  const [walkthroughScore, setWalkthroughScore] = useState<{ [locusId: string]: boolean }>({});
  const [isWalkthroughComplete, setIsWalkthroughComplete] = useState(false);

  // New Palace Modal
  const [showAddPalaceModal, setShowAddPalaceModal] = useState(false);
  const [newPalaceName, setNewPalaceName] = useState('');
  const [newPalaceDesc, setNewPalaceDesc] = useState('');
  const [newPalaceCategory, setNewPalaceCategory] = useState<
    'home' | 'work' | 'campus' | 'outdoor' | 'custom'
  >('home');

  // ESC key dismiss for modals
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddPalaceModal) setShowAddPalaceModal(false);
        if (isWalkthroughOpen) setIsWalkthroughOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddPalaceModal, isWalkthroughOpen]);

  // New Locus Form
  const [showAddLocusForm, setShowAddLocusForm] = useState(false);
  const [newLocusRoom, setNewLocusRoom] = useState('');
  const [newLocusTitle, setNewLocusTitle] = useState('');
  const [newLocusPosition, setNewLocusPosition] = useState('');
  const [newLocusContent, setNewLocusContent] = useState('');
  const [newLocusScene, setNewLocusScene] = useState('');
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);

  // Editing locus
  const [editingLocusId, setEditingLocusId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editScene, setEditScene] = useState('');

  const currentPalace = palaces.find((p) => p.id === selectedPalaceId) || palaces[0];

  const handleStartWalkthrough = () => {
    if (!currentPalace || currentPalace.loci.length === 0) return;
    setWalkthroughIndex(0);
    setIsRecallHidden(true);
    setUserRecallGuess('');
    setWalkthroughScore({});
    setIsWalkthroughComplete(false);
    setIsWalkthroughOpen(true);
  };

  const handleNextWalkthroughLocus = (isCorrect?: boolean) => {
    if (!currentPalace) return;
    const currentLocus = currentPalace.loci[walkthroughIndex];

    if (currentLocus && isCorrect !== undefined) {
      setWalkthroughScore((prev) => ({ ...prev, [currentLocus.id]: isCorrect }));
      if (isCorrect) {
        onEarnPoints(10, 'שליפה מוצלחת מתחנת ארמון');
      }
    }

    if (walkthroughIndex + 1 < currentPalace.loci.length) {
      setWalkthroughIndex((prev) => prev + 1);
      setIsRecallHidden(true);
      setUserRecallGuess('');
    } else {
      setIsWalkthroughComplete(true);
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      onEarnPoints(30, 'סיום סיור מלא בארמון הזיכרון');
      onUnlockBadge('ארכיטקט ארמונות');
    }
  };

  const handleCreatePalaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPalaceName.trim()) return;

    const created = await onAddPalace(
      newPalaceName.trim(),
      newPalaceDesc.trim() || 'ארמון זיכרון אישי לאחסון ושימור מידע',
      newPalaceCategory
    );

    setNewPalaceName('');
    setNewPalaceDesc('');
    setShowAddPalaceModal(false);
    if (created && created.id) {
      setSelectedPalaceId(created.id);
    }
  };

  const handleCreateLocusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPalace || !newLocusTitle.trim() || !newLocusRoom.trim()) return;

    await onAddLocus(
      currentPalace.id,
      newLocusTitle.trim(),
      newLocusRoom.trim(),
      newLocusPosition.trim() || 'מיקום מרכזי בחדר',
      newLocusContent.trim(),
      newLocusScene.trim()
    );

    setNewLocusTitle('');
    setNewLocusRoom('');
    setNewLocusPosition('');
    setNewLocusContent('');
    setNewLocusScene('');
    setShowAddLocusForm(false);
  };

  // AI Mnemonic Scene Suggester for a locus
  const handleAIGenerateScene = async () => {
    if (!newLocusContent.trim()) return;
    setIsGeneratingScene(true);
    try {
      const res = await fetch('/api/gemini/generate-mnemonic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'academic_concept',
          input: newLocusContent,
          extra: `תחנה: ${newLocusTitle} בחדר: ${newLocusRoom}`,
        }),
      });
      const data = await res.json();
      if (data.visualScene) {
        setNewLocusScene(data.visualScene);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingScene(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'home':
        return <Home className="w-4 h-4 text-amber-400" />;
      case 'campus':
        return <GraduationCap className="w-4 h-4 text-indigo-400" />;
      case 'outdoor':
        return <Trees className="w-4 h-4 text-emerald-400" />;
      case 'work':
        return <Building className="w-4 h-4 text-cyan-400" />;
      default:
        return <Compass className="w-4 h-4 text-violet-400" />;
    }
  };

  // Group loci by room
  const lociByRoom = currentPalace?.loci.reduce((acc, locus) => {
    const room = locus.roomName || 'חדר כללי';
    if (!acc[room]) acc[room] = [];
    acc[room].push(locus);
    return acc;
  }, {} as { [room: string]: PalaceLocus[] }) || {};

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden text-slate-900">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-[#1CB0F6]/15 border-2 border-[#1CB0F6]/40 text-[#0d7bb0] px-3.5 py-1 rounded-2xl text-xs font-black">
              <Compass className="w-3.5 h-3.5" />
              <span>שיטת המקומות (Method of Loci) • הפעלת תאי מקום ורשת</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              ארכיטקטורת ארמונות זיכרון (Memory Palaces)
            </h1>
            <p className="text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed font-medium">
              העוגן החזק ביותר במוח האנושי. מבוסס על הניווט המרחבי של ההיפוקמפוס (פרס נובל 2014).
              בנה ארמונות משלך, הגדר תחנות בכיוון השעון, והטמע דימויים מנטליים קינטיים עזים לשימור עילאי.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onOpenSummary && (
              <button
                onClick={() => onOpenSummary('palaces')}
                className="btn-duo-neutral flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer"
                title="צפה בסיכום הטכניקה ודוגמאות מעשיות"
              >
                <BookOpen className="w-4 h-4 text-[#1CB0F6]" />
                <span>סיכום ודוגמאות</span>
              </button>
            )}

            <button
              onClick={() => setShowAddPalaceModal(true)}
              className="btn-duo-blue flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>בנה ארמון חדש</span>
            </button>

            {currentPalace && currentPalace.loci.length > 0 && (
              <button
                onClick={handleStartWalkthrough}
                className="btn-duo-yellow flex items-center gap-2 px-5 py-2.5 text-sm cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-900" />
                <span>התחל סיור ותרגול שליפה</span>
              </button>
            )}
          </div>
        </div>

        {/* Palaces Selector Tabs */}
        <div className="flex items-center gap-2 mt-8 pt-4 border-t-2 border-slate-200 overflow-x-auto no-scrollbar">
          <span className="text-xs text-slate-500 font-bold ml-2 whitespace-nowrap">הארמונות שלך:</span>
          {palaces.map((p) => {
            const isSelected = p.id === selectedPalaceId;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPalaceId(p.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all whitespace-nowrap cursor-pointer active:translate-y-0.5 ${
                  isSelected
                    ? 'bg-[#1CB0F6]/15 text-[#0d7bb0] border-2 border-[#1CB0F6] border-b-4 border-b-[#1899d6] shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 border-2 border-slate-200 border-b-4'
                }`}
              >
                {getCategoryIcon(p.category)}
                <span>{p.name}</span>
                <span className="bg-white text-[#0d7bb0] text-[10px] px-2 py-0.5 rounded-full font-black border border-slate-200 shadow-xs">
                  {p.loci.length} תחנות
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Palace Details Card */}
      {currentPalace && (
        <div className="bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-slate-900">
          {/* Palace Meta */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700">
                  {getCategoryIcon(currentPalace.category)}
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                    {currentPalace.name}
                    {isAuthenticated && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                        <Cloud className="w-3 h-3" /> מסונכרן בענן
                      </span>
                    )}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
                    {currentPalace.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddLocusForm(true)}
                className="btn-duo-neutral flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#1CB0F6]" />
                <span>הוסף תחנה לחדר</span>
              </button>

              {palaces.length > 1 && (
                <button
                  onClick={() => {
                    if (window.confirm(`האם למחוק את הארמון "${currentPalace.name}"?`)) {
                      onDeletePalace(currentPalace.id);
                      setSelectedPalaceId(palaces.find((p) => p.id !== currentPalace.id)?.id || '');
                    }
                  }}
                  className="text-slate-500 hover:text-rose-400 p-2 rounded-xl hover:bg-slate-800/80 transition-colors"
                  title="מחק ארמון זה"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Add Locus Form Modal / Drawer */}
          {showAddLocusForm && (
            <div className="bg-slate-950 border border-indigo-500/40 rounded-2xl p-5 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>הוספת תחנת זיכרון (Locus) חדשה לארמון</span>
                </div>
                <button
                  onClick={() => setShowAddLocusForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  ביטול
                </button>
              </div>

              <form onSubmit={handleCreateLocusSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    שם החדר / האזור בארמון:
                  </label>
                  <input
                    type="text"
                    required
                    value={newLocusRoom}
                    onChange={(e) => setNewLocusRoom(e.target.value)}
                    placeholder="למשל: סלון מרכזי, מטבח, חדר שינה, מסדרון"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    שם התחנה הפיזית (העוגן המרחבי):
                  </label>
                  <input
                    type="text"
                    required
                    value={newLocusTitle}
                    onChange={(e) => setNewLocusTitle(e.target.value)}
                    placeholder="למשל: שולחן הקפה מזכוכית, מנורת העמידה"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    תיאור המיקום המדויק (בכיוון השעון):
                  </label>
                  <input
                    type="text"
                    value={newLocusPosition}
                    onChange={(e) => setNewLocusPosition(e.target.value)}
                    placeholder="למשל: פינת הזכוכית הימנית, אהיל הבד הצהוב"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    המידע או הפריט המאוחסן בתחנה (מה זוכרים כאן?):
                  </label>
                  <input
                    type="text"
                    value={newLocusContent}
                    onChange={(e) => setNewLocusContent(e.target.value)}
                    placeholder="למשל: חוק שימור האנרגיה, 3 עקרונות יסוד בחוזה"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      הסצנה המנמונית הקינטית (האינטראקציה המוקצנת בתחנה):
                    </label>
                    <AIFieldGeneratorButton
                      promptType="palace_scene"
                      inputContext={newLocusContent || newLocusTitle}
                      extraContext={`תחנה: ${newLocusTitle} בחדר: ${newLocusRoom}, מיקום: ${newLocusPosition}`}
                      onGenerated={(val) => setNewLocusScene(val)}
                      label="סצנה עם AI"
                      compact
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={newLocusScene}
                    onChange={(e) => setNewLocusScene(e.target.value)}
                    placeholder="למשל: סוללת ענק מחשמלת שמתפוצצת לרסיסי ניצוצות ומבעירה את שולחן הקפה ברעש אדיר..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddLocusForm(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                  >
                    ביטול
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
                  >
                    הוסף תחנה
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Palace Rooms and Loci Grid */}
          {Object.keys(lociByRoom).length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl">
              <Compass className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-300">עדיין אין תחנות בארמון זה</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                הוסף את התחנה הראשונה שלך. מומלץ לסדר תחנות בכיוון השעון לאורך קירות החדר (5 תחנות לחדר).
              </p>
              <button
                onClick={() => setShowAddLocusForm(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>הוסף תחנה ראשונה</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(lociByRoom).map(([room, loci]) => (
                <div key={room} className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                      <h3 className="font-extrabold text-white text-base">{room}</h3>
                      <span className="text-xs text-slate-400">({loci.length} תחנות)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loci.map((locus) => (
                      <div
                        key={locus.id}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-black text-xs flex items-center justify-center border border-indigo-500/40">
                              {locus.stepNumber}
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setEditingLocusId(locus.id);
                                  setEditContent(locus.storedContent || '');
                                  setEditScene(locus.mnemonicScene || '');
                                }}
                                className="p-1 text-slate-400 hover:text-indigo-300 transition-colors"
                                title="ערוך תוכן תחנה"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteLocus(currentPalace.id, locus.id)}
                                className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                                title="מחק תחנה"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <h4 className="font-bold text-slate-200 text-sm">{locus.title}</h4>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {locus.positionDescription}
                          </p>

                          {editingLocusId === locus.id ? (
                            <div className="space-y-2 pt-2 border-t border-slate-800 text-right">
                              <div>
                                <label className="text-[9px] text-slate-400 font-bold block mb-0.5">מידע מאוחסן:</label>
                                <input
                                  type="text"
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      onUpdateLocus(currentPalace.id, locus.id, {
                                        storedContent: editContent,
                                        mnemonicScene: editScene,
                                      });
                                      setEditingLocusId(null);
                                    }
                                  }}
                                  placeholder="תוכן מאוחסן..."
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                                />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-0.5">
                                  <label className="text-[9px] text-indigo-400 font-bold">סצנה קינטית:</label>
                                  <AIFieldGeneratorButton
                                    promptType="palace_scene"
                                    inputContext={editContent || locus.title}
                                    extraContext={`תחנה: ${locus.title}, מיקום: ${locus.positionDescription}`}
                                    onGenerated={(val) => setEditScene(val)}
                                    label="סצנה עם AI"
                                    compact
                                  />
                                </div>
                                <textarea
                                  rows={2}
                                  value={editScene}
                                  onChange={(e) => setEditScene(e.target.value)}
                                  placeholder="סצנה קינטית מנמונית..."
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                                />
                              </div>
                              <div className="flex items-center justify-between gap-1.5 pt-1">
                                <span className="text-[9px] text-slate-500 font-mono">↵ Enter</span>
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => setEditingLocusId(null)}
                                    className="text-[10px] text-slate-400 px-2 py-1"
                                  >
                                    ביטול
                                  </button>
                                  <button
                                    onClick={() => {
                                      onUpdateLocus(currentPalace.id, locus.id, {
                                        storedContent: editContent,
                                        mnemonicScene: editScene,
                                      });
                                      setEditingLocusId(null);
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
                              {locus.storedContent ? (
                                <div className="mt-2 pt-2 border-t border-slate-800/80">
                                  <span className="text-[10px] font-semibold text-emerald-400 block mb-0.5">
                                    מידע מאוחסן:
                                  </span>
                                  <p className="text-xs text-slate-200 font-medium bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                                    {locus.storedContent}
                                  </p>
                                </div>
                              ) : (
                                <div className="text-[11px] text-slate-500 italic mt-1">
                                  תחנה ריקה - מוכנה לקליטת מידע
                                </div>
                              )}

                              {locus.mnemonicScene && (
                                <div className="mt-1.5 text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg">
                                  <span className="font-bold text-amber-400">⚡ סצנה: </span>
                                  {locus.mnemonicScene}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Interactive Palace Walkthrough & Active Recall Simulator Modal */}
      {isWalkthroughOpen && currentPalace && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsWalkthroughOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-400" />
                <span className="font-extrabold text-white text-base">
                  סיור ותרגול שליפה פעילה בארמון: {currentPalace.name}
                </span>
              </div>
              <button
                onClick={() => setIsWalkthroughOpen(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800 cursor-pointer"
              >
                יציאה מסיור
              </button>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-semibold">
                <span>
                  תחנה {walkthroughIndex + 1} מתוך {currentPalace.loci.length}
                </span>
                <span>
                  {Math.round(((walkthroughIndex + 1) / currentPalace.loci.length) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-amber-400 transition-all duration-300"
                  style={{
                    width: `${((walkthroughIndex + 1) / currentPalace.loci.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Current Locus Display */}
            {!isWalkthroughComplete ? (
              (() => {
                const locus = currentPalace.loci[walkthroughIndex];
                if (!locus) return null;

                return (
                  <div className="space-y-6">
                    {/* Location Card */}
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center space-y-3 relative overflow-hidden">
                      <div className="inline-block bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-bold px-3 py-1 rounded-full">
                        {locus.roomName} • תחנה #{locus.stepNumber}
                      </div>

                      <h3 className="text-2xl font-black text-white">{locus.title}</h3>
                      <p className="text-sm text-slate-400 font-medium">
                        עוגן מרחבי: {locus.positionDescription}
                      </p>

                      {/* Recall Card or Input */}
                      {isRecallHidden ? (
                        <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
                          <p className="text-xs text-slate-400">
                            עצור כאן. עצום עיניים ודמיין את התחנה הפיזית. מה הצבת כאן?
                          </p>
                          <input
                            type="text"
                            value={userRecallGuess}
                            onChange={(e) => setUserRecallGuess(e.target.value)}
                            placeholder="הקלד כאן את המידע או הסצנה שאתה נזכר בה..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                          />
                          <button
                            onClick={() => setIsRecallHidden(false)}
                            className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs shadow-md shadow-amber-500/20 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>חשוף ובדוק את התחנה</span>
                          </button>
                        </div>
                      ) : (
                        <div className="mt-6 pt-6 border-t border-slate-800 space-y-4 animate-fadeIn">
                          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 text-right">
                            <span className="text-[11px] font-bold text-emerald-400 block mb-1">
                              המידע המאוחסן:
                            </span>
                            <div className="text-base font-extrabold text-white">
                              {locus.storedContent || 'תחנה ללא תוכן מוגדר עדיין'}
                            </div>
                          </div>

                          {locus.mnemonicScene && (
                            <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-3.5 text-right text-xs text-amber-200">
                              <span className="font-bold text-amber-400">⚡ הסצנה הקינטית: </span>
                              {locus.mnemonicScene}
                            </div>
                          )}

                          {userRecallGuess && (
                            <div className="text-right text-xs text-slate-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                              <span className="font-medium text-slate-500">מה שכתבת: </span>
                              "{userRecallGuess}"
                            </div>
                          )}

                          <div className="pt-2">
                            <p className="text-xs text-slate-300 font-semibold mb-2">
                              האם הצלחת לשלוף את התחנה במדויק?
                            </p>
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() => handleNextWalkthroughLocus(false)}
                                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-bold border border-rose-500/30 cursor-pointer"
                              >
                                לא, נדרש חיזוק
                              </button>
                              <button
                                onClick={() => handleNextWalkthroughLocus(true)}
                                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>כן! נשלף בהצלחה (+10 XP)</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Step Navigation Controls */}
                    <div className="flex items-center justify-between">
                      <button
                        disabled={walkthroughIndex === 0}
                        onClick={() => {
                          setWalkthroughIndex((prev) => prev - 1);
                          setIsRecallHidden(true);
                          setUserRecallGuess('');
                        }}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                        <span>לתחנה הקודמת</span>
                      </button>

                      <button
                        onClick={() => handleNextWalkthroughLocus()}
                        className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                      >
                        <span>דלג לתחנה הבאה</span>
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              /* Complete Walkthrough Summary */
              <div className="text-center py-8 space-y-5 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500/60 text-amber-400 flex items-center justify-center mx-auto">
                  <Trophy className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-white">סיור מלא הושלם בהצלחה!</h3>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  עברת על כל {currentPalace.loci.length} התחנות בארמון "{currentPalace.name}".
                  האימון הפעיל את תאי המקום והרשת במוח והטמיע את המידע בזיכרון ארוך-טווח.
                </p>

                <div className="flex items-center justify-center gap-3 pt-3">
                  <button
                    onClick={handleStartWalkthrough}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>סיור חוזר</span>
                  </button>
                  <button
                    onClick={() => setIsWalkthroughOpen(false)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>סיום וחזרה לארמון</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Palace Modal */}
      {showAddPalaceModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowAddPalaceModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-white text-lg">בניית ארמון זיכרון חדש</h3>
              <button
                onClick={() => setShowAddPalaceModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                סגור
              </button>
            </div>

            <form onSubmit={handleCreatePalaceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  שם הארמון (מבנה פיזי מוכר מאוד):
                </label>
                <input
                  type="text"
                  required
                  value={newPalaceName}
                  onChange={(e) => setNewPalaceName(e.target.value)}
                  placeholder="למשל: בית ההורים, דירת השותפים, קמפוס אקדמי"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  סוג המבנה / המסלול:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'home', label: 'בית פרטי / דירה', icon: <Home className="w-3.5 h-3.5" /> },
                    { id: 'campus', label: 'קמפוס / מוסד', icon: <GraduationCap className="w-3.5 h-3.5" /> },
                    { id: 'outdoor', label: 'מסלול פארק / טבע', icon: <Trees className="w-3.5 h-3.5" /> },
                    { id: 'work', label: 'משרד / בניין', icon: <Building className="w-3.5 h-3.5" /> },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNewPalaceCategory(cat.id as any)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                        newPalaceCategory === cat.id
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      {cat.icon}
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  תיאור המסלול:
                </label>
                <textarea
                  rows={2}
                  value={newPalaceDesc}
                  onChange={(e) => setNewPalaceDesc(e.target.value)}
                  placeholder="למשל: מסלול בכיוון השעון מכניסת הבית דרך הסלון, המטבח וחדר השינה"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPalaceModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
                >
                  צור ארמון
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
