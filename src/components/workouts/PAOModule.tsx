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
  Zap,
  Package,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PAOItem, MajorItem } from '../../types/memory';
import { getPAOInitials } from '../../lib/paoInitials';
import { isHebrewFuzzyMatch } from '../../lib/fuzzyMatch';
import { AIFieldGeneratorButton } from '../AIFieldGeneratorButton';

interface PAOModuleProps {
  paoItems: PAOItem[];
  majorDigits?: MajorItem[];
  onEarnPoints: (amount: number, reason?: string) => void;
  onUnlockBadge: (badge: string) => void;
  onAddPAOItem?: (item: PAOItem) => void;
  onUpdatePAOItem: (
    number: number,
    updates: { userPerson?: string; userAction?: string; userObject?: string; userScene?: string; is_ready_for_practice?: boolean }
  ) => void;
  onDeletePAOItem?: (number: number) => void;
  onResetPAOItem: (number: number) => void;
  onOpenSummary?: (techniqueId: string) => void;
  onTogglePAOReady?: (number: number, explicitState?: boolean) => void;
  onSetAllPAOReady?: (ready: boolean, numbers?: number[]) => void;
}

export const PAOModule: React.FC<PAOModuleProps> = ({
  paoItems,
  majorDigits,
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

  // View mode: 'grid' (כוורת) or 'list' (רשימה)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Edit PAO Item
  const [editingNum, setEditingNum] = useState<number | null>(null);
  const [editPerson, setEditPerson] = useState('');
  const [editAction, setEditAction] = useState('');
  const [editObject, setEditObject] = useState('');
  const [editScene, setEditScene] = useState('');

  // Add PAO Item
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [newPerson, setNewPerson] = useState('');
  const [newAction, setNewAction] = useState('');
  const [newObject, setNewObject] = useState('');
  const [newScene, setNewScene] = useState('');

  // PAO Quiz question & filter types
  type PAOQuizQuestionType =
    | 'numberToPerson'
    | 'numberToAction'
    | 'numberToObject'
    | 'personToNumber'
    | 'actionToNumber'
    | 'objectToNumber';

  type PAOQuizFilter = 'all' | 'person' | 'action' | 'object' | 'reverse';

  // PAO Quiz state (Strictly over readyPaoItems)
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizFilter, setQuizFilter] = useState<PAOQuizFilter>('all');
  const [questionType, setQuestionType] = useState<PAOQuizQuestionType>('numberToPerson');
  const [userGuessInput, setUserGuessInput] = useState('');
  const [quizFeedback, setQuizFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [revealQuizAnswer, setRevealQuizAnswer] = useState(false);
  const [isQuizEditing, setIsQuizEditing] = useState(false);
  const [quizEditPerson, setQuizEditPerson] = useState('');
  const [quizEditAction, setQuizEditAction] = useState('');
  const [quizEditObject, setQuizEditObject] = useState('');
  const [quizEditScene, setQuizEditScene] = useState('');

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
        scene: newScene.trim(),
        userScene: newScene.trim(),
      });
    }

    setNewNumber('');
    setNewPerson('');
    setNewAction('');
    setNewObject('');
    setNewScene('');
    setShowAddForm(false);
  };

  const pickNextQuestionType = (filter: PAOQuizFilter): PAOQuizQuestionType => {
    if (filter === 'person') return 'numberToPerson';
    if (filter === 'action') return 'numberToAction';
    if (filter === 'object') return 'numberToObject';
    if (filter === 'reverse') {
      const revs: PAOQuizQuestionType[] = ['personToNumber', 'actionToNumber', 'objectToNumber'];
      return revs[Math.floor(Math.random() * revs.length)];
    }
    // Filter 'all' -> random question testing either Person (35%), Action (35%), Object (20%), or Reverse Number (10%)
    const rand = Math.random();
    if (rand < 0.35) return 'numberToPerson';
    if (rand < 0.70) return 'numberToAction';
    if (rand < 0.90) return 'numberToObject';
    const revs: PAOQuizQuestionType[] = ['personToNumber', 'actionToNumber', 'objectToNumber'];
    return revs[Math.floor(Math.random() * revs.length)];
  };

  const handleNextQuizQuestion = (customFilter?: PAOQuizFilter) => {
    if (readyPaoItems.length === 0) return;
    const nextIdx = Math.floor(Math.random() * readyPaoItems.length);
    setQuizIndex(nextIdx);
    setUserGuessInput('');
    setQuizFeedback('idle');
    setRevealQuizAnswer(false);
    setIsQuizEditing(false);
    const activeFilter = customFilter !== undefined ? customFilter : quizFilter;
    setQuestionType(pickNextQuestionType(activeFilter));
  };

  const handleStartQuizEdit = () => {
    if (!currentQuizItem) return;
    setQuizEditPerson(currentQuizItem.userPerson || currentQuizItem.person || '');
    setQuizEditAction(currentQuizItem.userAction || currentQuizItem.action || '');
    setQuizEditObject(currentQuizItem.userObject || currentQuizItem.object || '');
    setQuizEditScene(currentQuizItem.userScene || currentQuizItem.scene || '');
    setIsQuizEditing((prev) => !prev);
  };

  const handleSaveQuizEdit = () => {
    if (!currentQuizItem) return;
    onUpdatePAOItem(currentQuizItem.number, {
      userPerson: quizEditPerson.trim(),
      userAction: quizEditAction.trim(),
      userObject: quizEditObject.trim(),
      userScene: quizEditScene.trim(),
    });
    setIsQuizEditing(false);
    onEarnPoints(10, 'עדכון שלשת PAO מתוך מבחן השליפה');
  };

  const handleCheckQuiz = () => {
    if (!currentQuizItem) return;
    const guess = userGuessInput.trim();
    if (!guess) return;

    let isMatch = false;
    let successReason = '';

    switch (questionType) {
      case 'numberToPerson': {
        const target = currentQuizItem.userPerson || currentQuizItem.person || '';
        const fallback = currentQuizItem.person || '';
        isMatch = isHebrewFuzzyMatch(guess, target) || isHebrewFuzzyMatch(guess, fallback);
        successReason = 'שליפת דמות PAO';
        break;
      }
      case 'numberToAction': {
        const target = currentQuizItem.userAction || currentQuizItem.action || '';
        const fallback = currentQuizItem.action || '';
        isMatch = isHebrewFuzzyMatch(guess, target) || isHebrewFuzzyMatch(guess, fallback);
        successReason = 'שליפת פעולת PAO';
        break;
      }
      case 'numberToObject': {
        const target = currentQuizItem.userObject || currentQuizItem.object || '';
        const fallback = currentQuizItem.object || '';
        isMatch = isHebrewFuzzyMatch(guess, target) || isHebrewFuzzyMatch(guess, fallback);
        successReason = 'שליפת חפץ PAO';
        break;
      }
      case 'personToNumber':
      case 'actionToNumber':
      case 'objectToNumber': {
        isMatch = guess === currentQuizItem.numberStr || parseInt(guess, 10) === currentQuizItem.number;
        successReason = 'שליפת מספר משלשת PAO';
        break;
      }
    }

    if (isMatch) {
      setQuizFeedback('correct');
      setRevealQuizAnswer(true);
      onEarnPoints(20, successReason);
      onUnlockBadge('שלשת אלופים (PAO)');
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } else {
      setQuizFeedback('incorrect');
      setRevealQuizAnswer(true); // Automatically reveal correct answer on error
    }
  };

  const filteredItems = paoItems.filter((item) => {
    if (onlyReadyFilter && !item.is_ready_for_practice) return false;

    const p = item.userPerson || item.person;
    const a = item.userAction || item.action;
    const o = item.userObject || item.object;
    const s = item.userScene || item.scene || '';
    return (
      item.numberStr.includes(search) ||
      p.toLowerCase().includes(search.toLowerCase()) ||
      a.toLowerCase().includes(search.toLowerCase()) ||
      o.toLowerCase().includes(search.toLowerCase()) ||
      s.toLowerCase().includes(search.toLowerCase())
    );
  });

  const getQuizMeta = () => {
    if (!currentQuizItem) return null;
    switch (questionType) {
      case 'numberToPerson':
        return {
          theme: 'orange' as const,
          badgeIcon: <User className="w-3.5 h-3.5 text-orange-400" />,
          badgeText: '👤 שאלה: דמות (Person)',
          badgeColor: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
          title: 'מי הדמות המשויכת למספר:',
          titleColor: 'text-orange-400',
          cardBorder: 'border-orange-500/40',
          cardBg: 'bg-gradient-to-b from-orange-950/20 via-slate-950 to-slate-950 shadow-xl shadow-orange-500/5',
          inputBorder: 'border-orange-500/40 focus:border-orange-400 focus:ring-1 focus:ring-orange-500/30',
          btnColor: 'bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/30',
          tagColor: 'text-orange-300 bg-orange-500/10 border-orange-500/25',
          mainValue: currentQuizItem.numberStr,
          isNumberMain: true,
          testedField: 'person' as const,
          placeholder: 'הקלד את שם הדמות (למשל סילבסטר סטאלון)...',
          correctTarget: currentQuizItem.userPerson || currentQuizItem.person,
        };
      case 'numberToAction':
        return {
          theme: 'purple' as const,
          badgeIcon: <Zap className="w-3.5 h-3.5 text-purple-400" />,
          badgeText: '⚡ שאלה: פעולה (Action)',
          badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          title: 'מה הפעולה המשויכת למספר:',
          titleColor: 'text-purple-400',
          cardBorder: 'border-purple-500/40',
          cardBg: 'bg-gradient-to-b from-purple-950/20 via-slate-950 to-slate-950 shadow-xl shadow-purple-500/5',
          inputBorder: 'border-purple-500/40 focus:border-purple-400 focus:ring-1 focus:ring-purple-500/30',
          btnColor: 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30',
          tagColor: 'text-purple-300 bg-purple-500/10 border-purple-500/25',
          mainValue: currentQuizItem.numberStr,
          isNumberMain: true,
          testedField: 'action' as const,
          placeholder: 'הקלד את הפעולה (למשל הקלדה / מקליד)...',
          correctTarget: currentQuizItem.userAction || currentQuizItem.action,
        };
      case 'numberToObject':
        return {
          theme: 'teal' as const,
          badgeIcon: <Package className="w-3.5 h-3.5 text-teal-400" />,
          badgeText: '📦 שאלה: חפץ (Object)',
          badgeColor: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
          title: 'מה החפץ המשויך למספר:',
          titleColor: 'text-teal-400',
          cardBorder: 'border-teal-500/40',
          cardBg: 'bg-gradient-to-b from-teal-950/20 via-slate-950 to-slate-950 shadow-xl shadow-teal-500/5',
          inputBorder: 'border-teal-500/40 focus:border-teal-400 focus:ring-1 focus:ring-teal-500/30',
          btnColor: 'bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-600/30',
          tagColor: 'text-teal-300 bg-teal-500/10 border-teal-500/25',
          mainValue: currentQuizItem.numberStr,
          isNumberMain: true,
          testedField: 'object' as const,
          placeholder: 'הקלד את שם החפץ (למשל חוברת / כפפות)...',
          correctTarget: currentQuizItem.userObject || currentQuizItem.object,
        };
      case 'personToNumber':
        return {
          theme: 'orange' as const,
          badgeIcon: <User className="w-3.5 h-3.5 text-orange-400" />,
          badgeText: '👤 שאלה על דמות: שליפת מספר',
          badgeColor: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
          title: 'מה המספר המשויך לדמות:',
          titleColor: 'text-orange-400',
          cardBorder: 'border-orange-500/40',
          cardBg: 'bg-gradient-to-b from-orange-950/20 via-slate-950 to-slate-950 shadow-xl shadow-orange-500/5',
          inputBorder: 'border-orange-500/40 focus:border-orange-400 focus:ring-1 focus:ring-orange-500/30',
          btnColor: 'bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/30',
          tagColor: 'text-orange-300 bg-orange-500/10 border-orange-500/25',
          mainValue: currentQuizItem.userPerson || currentQuizItem.person,
          isNumberMain: false,
          testedField: 'person' as const,
          placeholder: 'הקלד את המספר (למשל 23)...',
          correctTarget: currentQuizItem.numberStr,
        };
      case 'actionToNumber':
        return {
          theme: 'purple' as const,
          badgeIcon: <Zap className="w-3.5 h-3.5 text-purple-400" />,
          badgeText: '⚡ שאלה על פעולה: שליפת מספר',
          badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          title: 'מה המספר המשויך לפעולה:',
          titleColor: 'text-purple-400',
          cardBorder: 'border-purple-500/40',
          cardBg: 'bg-gradient-to-b from-purple-950/20 via-slate-950 to-slate-950 shadow-xl shadow-purple-500/5',
          inputBorder: 'border-purple-500/40 focus:border-purple-400 focus:ring-1 focus:ring-purple-500/30',
          btnColor: 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30',
          tagColor: 'text-purple-300 bg-purple-500/10 border-purple-500/25',
          mainValue: currentQuizItem.userAction || currentQuizItem.action,
          isNumberMain: false,
          testedField: 'action' as const,
          placeholder: 'הקלד את המספר (למשל 23)...',
          correctTarget: currentQuizItem.numberStr,
        };
      case 'objectToNumber':
        return {
          theme: 'teal' as const,
          badgeIcon: <Package className="w-3.5 h-3.5 text-teal-400" />,
          badgeText: '📦 שאלה על חפץ: שליפת מספר',
          badgeColor: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
          title: 'מה המספר המשויך לחפץ:',
          titleColor: 'text-teal-400',
          cardBorder: 'border-teal-500/40',
          cardBg: 'bg-gradient-to-b from-teal-950/20 via-slate-950 to-slate-950 shadow-xl shadow-teal-500/5',
          inputBorder: 'border-teal-500/40 focus:border-teal-400 focus:ring-1 focus:ring-teal-500/30',
          btnColor: 'bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-600/30',
          tagColor: 'text-teal-300 bg-teal-500/10 border-teal-500/25',
          mainValue: currentQuizItem.userObject || currentQuizItem.object,
          isNumberMain: false,
          testedField: 'object' as const,
          placeholder: 'הקלד את המספר (למשל 23)...',
          correctTarget: currentQuizItem.numberStr,
        };
    }
  };

  const quizMeta = getQuizMeta();

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

              {/* View Mode Toggle (כוורת vs. רשימה) */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="תצוגת כוורת (כרטיסים)"
                >
                  <span>⊞</span>
                  <span>כוורת</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="תצוגת רשימה (נוחה לעיניים)"
                >
                  <span>☰</span>
                  <span>רשימה</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Batch Actions - Always display BOTH Select All and Deselect All */}
              {onSetAllPAOReady && (
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    onClick={() => {
                      onSetAllPAOReady(true);
                      onEarnPoints(20, 'סימון כל 100 שלשות PAO כמוכנות');
                    }}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                    title="סמן את כל 100 שלשות ה-PAO כמוכנות לתרגול"
                  >
                    ✓ סמן הכל
                  </button>
                  <button
                    onClick={() => onSetAllPAOReady(false)}
                    className="text-[11px] font-bold text-slate-400 hover:text-rose-400 bg-slate-900 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                    title="בטל את כל סימוני התרגול לשלשות ה-PAO"
                  >
                    ✕ בטל הכל
                  </button>
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
              className="bg-slate-950 border border-indigo-500/40 rounded-2xl p-4 sm:p-5 space-y-4 animate-fadeIn"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span>הוספת שלשת PAO חדשה למאגר</span>
                </h4>
                <span className="text-xs text-slate-400">4 שדות: דמות, פעולה, חפץ + סצנה שלמה</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 text-right">
                <div>
                  <label className="text-xs text-slate-300 block font-semibold mb-1">
                    מספר (למשל 99):
                  </label>
                  <input
                    type="number"
                    required
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-amber-400 font-semibold">
                      👤 אדם (Person):
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
                    placeholder="שם הדמות (למשל סילבסטר סטאלון)..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-purple-400 font-semibold">
                      ⚡ פעולה (Action):
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
                    placeholder="פעולה קינטית (למשל מתאגרף)..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-teal-400 font-semibold">
                      📦 חפץ (Object):
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
                    placeholder="חפץ מוחשי (למשל סוס)..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500"
                  />
                </div>

                {/* 4th Field: סצנה שלמה */}
                <div className="sm:col-span-4 bg-slate-900/70 border border-amber-500/30 rounded-2xl p-3.5 space-y-2 mt-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <label className="text-xs font-bold text-amber-300">
                        שדה רביעי: סצנה שלמה (תיאור חופשי רב-חושי)
                      </label>
                    </div>
                    <AIFieldGeneratorButton
                      promptType="pao_scene"
                      inputContext={newNumber ? `מספר ${newNumber}` : 'שלשת PAO'}
                      extraContext={`אדם: ${newPerson} | פעולה: ${newAction} | חפץ: ${newObject}`}
                      onGenerated={(val) => setNewScene(val)}
                      label="צור סצנה עם AI"
                      compact
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={newScene}
                    onChange={(e) => setNewScene(e.target.value)}
                    placeholder="סצנה מפורטת המשלבת את 3 השדות יחד בכל החושים (צבעים, ריחות, תחושות מגע וטמפרטורה)..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400 leading-normal">
                    💡 <strong>שים לב:</strong> שדה זה מיועד לכתיבה חופשית של סצנה רב-חושית עשירה. מבחן השליפה לא יבדוק שדה זה, אלא הוא נועד לחיזוק הקיבוע בזיכרון.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer shadow-md shadow-indigo-600/30 transition-all"
                >
                  שמור שלשה למאגר
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

          {/* PAO Cards Grid OR List View with Side Navigator */}
          <div className="flex gap-3 items-start">
            {viewMode === 'grid' ? (
              /* Main Cards Grid */
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[620px] overflow-y-auto pr-1 scroll-smooth">
                {filteredItems.map((item) => {
                  const isEditing = editingNum === item.number;
                  const p = item.userPerson || item.person;
                  const a = item.userAction || item.action;
                  const o = item.userObject || item.object;
                  const s = item.userScene || item.scene || '';
                  const isCustom = Boolean(item.userPerson || item.userAction || item.userObject || item.userScene);
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
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-lg font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">
                            {item.numberStr}
                          </span>
                          <span
                            title={`ראשי תיבות לפי שיטת Major: ${getPAOInitials(item.number).fullFormula}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs"
                          >
                            <span className="text-[11px] text-amber-400/70 font-normal">ר"ת:</span>
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
                              <Undo2 className="w-3.5 h-3.5" />
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
                                setEditScene(s);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-400 cursor-pointer"
                            title="ערוך שלשה"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {onDeletePAOItem && (
                            <button
                              onClick={() => onDeletePAOItem(item.number)}
                              className="p-1 text-slate-600 hover:text-rose-400 cursor-pointer"
                              title="מחק מהמאגר"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="space-y-2.5 pt-1 text-right">
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="text-xs text-amber-400 font-bold">👤 אדם (Person):</label>
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
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-white"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="text-xs text-purple-400 font-bold">⚡ פעולה (Action):</label>
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
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-white"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="text-xs text-teal-400 font-bold">📦 חפץ (Object):</label>
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
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-white"
                            />
                          </div>

                          {/* 4th Field: סצנה שלמה */}
                          <div className="bg-slate-900/70 border border-amber-500/25 rounded-xl p-2.5 space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-xs text-amber-300 font-bold flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                <span>סצנה שלמה:</span>
                              </label>
                              <AIFieldGeneratorButton
                                promptType="pao_scene"
                                inputContext={item.number.toString()}
                                extraContext={`אדם: ${editPerson} | פעולה: ${editAction} | חפץ: ${editObject}`}
                                onGenerated={(val) => setEditScene(val)}
                                label="סצנה עם AI"
                                compact
                              />
                            </div>
                            <textarea
                              rows={2}
                              value={editScene}
                              onChange={(e) => setEditScene(e.target.value)}
                              placeholder="סצנה מפורטת המשלבת את 3 השדות..."
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>

                          <div className="flex items-center justify-between gap-1 pt-1">
                            <span className="text-[10px] text-slate-500 font-mono">↵ שמירה</span>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => setEditingNum(null)}
                                className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 cursor-pointer"
                              >
                                ביטול
                              </button>
                              <button
                                onClick={() => {
                                  onUpdatePAOItem(item.number, {
                                    userPerson: editPerson.trim(),
                                    userAction: editAction.trim(),
                                    userObject: editObject.trim(),
                                    userScene: editScene.trim(),
                                  });
                                  setEditingNum(null);
                                }}
                                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1 rounded-lg cursor-pointer"
                              >
                                שמור
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5 text-xs sm:text-sm">
                          <div className="text-slate-200">
                            <span className="text-amber-400 font-bold ml-1.5">👤 אדם:</span>
                            {p}
                          </div>
                          <div className="text-slate-200">
                            <span className="text-purple-400 font-bold ml-1.5">⚡ פעולה:</span>
                            {a}
                          </div>
                          <div className="text-slate-200">
                            <span className="text-teal-400 font-bold ml-1.5">📦 חפץ:</span>
                            {o}
                          </div>

                          {s && (
                            <div className="text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 mt-2 leading-relaxed">
                              <span className="font-bold text-amber-400 block text-xs mb-0.5">🎬 סצנה שלמה:</span>
                              "{s}"
                            </div>
                          )}
                        </div>
                      )}

                      {/* Ready for Practice Checkbox */}
                      <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none py-1 px-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 transition-all">
                          <input
                            type="checkbox"
                            checked={Boolean(item.is_ready_for_practice)}
                            onChange={() => handleTogglePaoReady(item.number, item.is_ready_for_practice)}
                            className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500 cursor-pointer accent-indigo-500"
                          />
                          <span className={`text-xs font-bold ${item.is_ready_for_practice ? 'text-indigo-300' : 'text-slate-400'}`}>
                            מוכן לתרגול
                          </span>
                        </label>
                        {item.is_ready_for_practice && (
                          <span className="text-xs bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/30 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-indigo-400" />
                            <span>מוכן</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            ) : (
              /* Main List View */
              <div className="flex-1 overflow-x-auto max-h-[620px] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/90 shadow-inner scroll-smooth">
                <table className="w-full text-right text-xs sm:text-sm">
                  <thead className="bg-slate-900/90 text-slate-300 text-xs font-bold sticky top-0 z-10 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">מספר</th>
                      <th className="py-2.5 px-3 text-amber-400">👤 אדם</th>
                      <th className="py-2.5 px-3 text-purple-400">⚡ פעולה</th>
                      <th className="py-2.5 px-3 text-teal-400">📦 חפץ</th>
                      <th className="py-2.5 px-3 text-amber-300">🎬 סצנה שלמה</th>
                      <th className="py-2.5 px-3 text-center">מוכן לתרגול</th>
                      <th className="py-2.5 px-3 text-center">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredItems.map((item) => {
                      const isEditing = editingNum === item.number;
                      const p = item.userPerson || item.person;
                      const a = item.userAction || item.action;
                      const o = item.userObject || item.object;
                      const s = item.userScene || item.scene || '';
                      const isCustom = Boolean(item.userPerson || item.userAction || item.userObject || item.userScene);
                      const isHighlighted = highlightedNum === item.number;

                      return (
                        <tr
                          id={`pao-item-${item.number}`}
                          key={item.number}
                          className={`transition-colors ${
                            isHighlighted
                              ? 'bg-indigo-950/40 ring-1 ring-indigo-500'
                              : item.is_ready_for_practice
                              ? 'bg-indigo-950/10 hover:bg-slate-900/80'
                              : 'hover:bg-slate-900/50'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono font-black text-indigo-400 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                {item.numberStr}
                              </span>
                              <span className="text-[10px] text-amber-300 font-sans">
                                ({getPAOInitials(item.number).initials})
                              </span>
                            </div>
                          </td>

                          {isEditing ? (
                            <>
                              <td className="py-2 px-2">
                                <input
                                  type="text"
                                  value={editPerson}
                                  onChange={(e) => setEditPerson(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                  placeholder="דמות..."
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="text"
                                  value={editAction}
                                  onChange={(e) => setEditAction(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                  placeholder="פעולה..."
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="text"
                                  value={editObject}
                                  onChange={(e) => setEditObject(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                  placeholder="חפץ..."
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="text"
                                  value={editScene}
                                  onChange={(e) => setEditScene(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                  placeholder="סצנה שלמה..."
                                />
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-2.5 px-3 font-semibold text-slate-200 whitespace-nowrap">
                                {p}
                              </td>
                              <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                                {a}
                              </td>
                              <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                                {o}
                              </td>
                              <td className="py-2.5 px-3 text-xs text-amber-200/90 max-w-xs truncate" title={s}>
                                {s || <span className="text-slate-600">-</span>}
                              </td>
                            </>
                          )}

                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={Boolean(item.is_ready_for_practice)}
                              onChange={() => handleTogglePaoReady(item.number, item.is_ready_for_practice)}
                              className="w-4 h-4 rounded text-indigo-500 cursor-pointer accent-indigo-500"
                              title="סמן כמוכן לתרגול"
                            />
                          </td>

                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => {
                                      onUpdatePAOItem(item.number, {
                                        userPerson: editPerson.trim(),
                                        userAction: editAction.trim(),
                                        userObject: editObject.trim(),
                                        userScene: editScene.trim(),
                                      });
                                      setEditingNum(null);
                                    }}
                                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded cursor-pointer"
                                  >
                                    שמור
                                  </button>
                                  <button
                                    onClick={() => setEditingNum(null)}
                                    className="px-1.5 py-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                                  >
                                    ביטול
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingNum(item.number);
                                      setEditPerson(p);
                                      setEditAction(a);
                                      setEditObject(o);
                                      setEditScene(s);
                                    }}
                                    className="p-1 text-slate-400 hover:text-indigo-400 cursor-pointer"
                                    title="ערוך שורה"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  {isCustom && (
                                    <button
                                      onClick={() => onResetPAOItem(item.number)}
                                      className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                                      title="איפוס לברירת מחדל"
                                    >
                                      <Undo2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

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
              {/* Quiz Mode Selector & Header */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-slate-400 font-bold ml-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-indigo-400" />
                    <span>התמקד ב:</span>
                  </span>
                  {[
                    { id: 'all', label: '🎯 הכל מעורב (אקראי)', activeCls: 'bg-indigo-600 text-white shadow-sm' },
                    { id: 'person', label: '👤 דמויות (P)', activeCls: 'bg-orange-600 text-white shadow-sm shadow-orange-500/30' },
                    { id: 'action', label: '⚡ פעולות (A)', activeCls: 'bg-purple-600 text-white shadow-sm shadow-purple-500/30' },
                    { id: 'object', label: '📦 חפצים (O)', activeCls: 'bg-teal-600 text-white shadow-sm shadow-teal-500/30' },
                    { id: 'reverse', label: '🔢 פריט ➔ מספר', activeCls: 'bg-indigo-600 text-white shadow-sm' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setQuizFilter(f.id as PAOQuizFilter);
                        handleNextQuizQuestion(f.id as PAOQuizFilter);
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        quizFilter === f.id
                          ? f.activeCls
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 justify-between sm:justify-end">
                  <span className="text-[11px] bg-emerald-500/15 text-emerald-300 font-bold px-2.5 py-1 rounded-xl border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{readyPaoItems.length} מוכנים לתרגול</span>
                  </span>
                  <button
                    onClick={() => handleNextQuizQuestion()}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 bg-slate-800 px-3 py-1 rounded-xl cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>החלף שאלה</span>
                  </button>
                </div>
              </div>

              {currentQuizItem && quizMeta && (
                <div className="max-w-xl mx-auto space-y-6 text-center">
                  {/* Dynamic Themed Question Card (Orange for Person, Purple for Action, Teal for Object) */}
                  <div className={`p-6 sm:p-8 rounded-3xl ${quizMeta.cardBg} border ${quizMeta.cardBorder} shadow-inner space-y-4`}>
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-xl border ${quizMeta.badgeColor}`}
                      >
                        {quizMeta.badgeIcon}
                        <span>{quizMeta.badgeText}</span>
                      </span>

                      {/* Real-time Edit Button in Question Card */}
                      <button
                        type="button"
                        onClick={handleStartQuizEdit}
                        className="text-xs text-amber-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        title="ערוך את שלשת ה-PAO בזמן אמת"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isQuizEditing ? 'סגור עריכה' : 'ערוך שלשה'}</span>
                      </button>
                    </div>

                    <span className={`text-xs font-bold ${quizMeta.titleColor} uppercase tracking-widest block`}>
                      {quizMeta.title}
                    </span>

                    {quizMeta.isNumberMain ? (
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <div className="text-6xl font-black text-white tracking-wider font-mono">
                          {quizMeta.mainValue}
                        </div>
                        <span className={`text-[11px] font-sans font-bold ${quizMeta.tagColor} px-2.5 py-0.5 rounded-lg border`}>
                          ר"ת: {getPAOInitials(currentQuizItem.number).initials}
                        </span>
                      </div>
                    ) : (
                      <div className="text-3xl font-black text-white tracking-wide py-2">
                        {quizMeta.mainValue}
                      </div>
                    )}
                  </div>

                  {/* Real-Time PAO Edit Panel (similar to Major system quiz) */}
                  {isQuizEditing && (
                    <div className="space-y-4 bg-slate-900/95 border border-amber-500/40 rounded-2xl p-5 text-right animate-fadeIn shadow-2xl">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span className="font-bold text-xs text-amber-300">
                            עריכת שלשת PAO בזמן אמת למספר #{currentQuizItem.numberStr}:
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          ר"ת: {getPAOInitials(currentQuizItem.number).initials}
                        </span>
                      </div>

                      {/* 3 Fields: Person (Orange), Action (Purple), Object (Teal) */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* 👤 Person - כתום */}
                        <div className="bg-slate-950/80 border border-orange-500/30 rounded-xl p-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] text-orange-400 font-bold flex items-center gap-1">
                              <User className="w-3 h-3 text-orange-400" />
                              <span>דמות (Person):</span>
                            </label>
                            <AIFieldGeneratorButton
                              promptType="pao_person"
                              inputContext={currentQuizItem.number.toString()}
                              onGenerated={(val) => setQuizEditPerson(val)}
                              label="AI"
                              compact
                            />
                          </div>
                          <input
                            type="text"
                            value={quizEditPerson}
                            onChange={(e) => setQuizEditPerson(e.target.value)}
                            placeholder="שם הדמות..."
                            className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>

                        {/* ⚡ Action - סגול */}
                        <div className="bg-slate-950/80 border border-purple-500/30 rounded-xl p-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] text-purple-400 font-bold flex items-center gap-1">
                              <Zap className="w-3 h-3 text-purple-400" />
                              <span>פעולה (Action):</span>
                            </label>
                            <AIFieldGeneratorButton
                              promptType="pao_action"
                              inputContext={currentQuizItem.number.toString()}
                              extraContext={quizEditPerson}
                              onGenerated={(val) => setQuizEditAction(val)}
                              label="AI"
                              compact
                            />
                          </div>
                          <input
                            type="text"
                            value={quizEditAction}
                            onChange={(e) => setQuizEditAction(e.target.value)}
                            placeholder="פעולה..."
                            className="w-full bg-slate-900 border border-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>

                        {/* 📦 Object - טורקיז */}
                        <div className="bg-slate-950/80 border border-teal-500/30 rounded-xl p-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] text-teal-400 font-bold flex items-center gap-1">
                              <Package className="w-3 h-3 text-teal-400" />
                              <span>חפץ (Object):</span>
                            </label>
                            <AIFieldGeneratorButton
                              promptType="pao_object"
                              inputContext={currentQuizItem.number.toString()}
                              extraContext={quizEditPerson}
                              onGenerated={(val) => setQuizEditObject(val)}
                              label="AI"
                              compact
                            />
                          </div>
                          <input
                            type="text"
                            value={quizEditObject}
                            onChange={(e) => setQuizEditObject(e.target.value)}
                            placeholder="חפץ..."
                            className="w-full bg-slate-900 border border-slate-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>

                      {/* 🎬 Full Scene - סצנה שלמה */}
                      <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>סצנה שלמה (תיאור חופשי ורב-חושי):</span>
                          </label>
                          <AIFieldGeneratorButton
                            promptType="pao_scene"
                            inputContext={currentQuizItem.number.toString()}
                            extraContext={`אדם: ${quizEditPerson} | פעולה: ${quizEditAction} | חפץ: ${quizEditObject}`}
                            onGenerated={(val) => setQuizEditScene(val)}
                            label="סצנה עם AI"
                            compact
                          />
                        </div>
                        <textarea
                          rows={2}
                          value={quizEditScene}
                          onChange={(e) => setQuizEditScene(e.target.value)}
                          placeholder="סצנה שלמה המשלבת את 3 השדות יחד בכל החושים..."
                          className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>

                      {/* Buttons: Cancel & Save in real-time */}
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setIsQuizEditing(false)}
                          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 cursor-pointer"
                        >
                          ביטול
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveQuizEdit}
                          className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-900/30 transition-all"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>שמור שינויים בזמן אמת (Firestore & Rowy)</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex gap-2 max-w-sm mx-auto">
                      <input
                        type="text"
                        value={userGuessInput}
                        onChange={(e) => setUserGuessInput(e.target.value)}
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
                        autoFocus
                        placeholder={quizMeta.placeholder}
                        className={`flex-1 bg-slate-950 border rounded-xl px-4 py-2.5 text-center text-sm font-bold text-white placeholder:text-slate-600 ${quizMeta.inputBorder}`}
                      />
                      <button
                        onClick={() => {
                          if (quizFeedback !== 'idle' || revealQuizAnswer) {
                            handleNextQuizQuestion();
                          } else {
                            handleCheckQuiz();
                          }
                        }}
                        className={`${quizMeta.btnColor} font-bold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap`}
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
                      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 text-xs space-y-3 text-right animate-fadeIn shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-slate-200 font-bold flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            שלשת PAO המלאה למספר {currentQuizItem.numberStr}:
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleStartQuizEdit}
                              className="text-[11px] text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all"
                              title="ערוך שלשת PAO זו בזמן אמת"
                            >
                              <Edit3 className="w-3 h-3 text-amber-300" />
                              <span>{isQuizEditing ? 'סגור עריכה' : 'שנה שלשה'}</span>
                            </button>
                            <span className="text-[11px] font-mono text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              ר"ת: {getPAOInitials(currentQuizItem.number).initials}
                            </span>
                          </div>
                        </div>

                        {/* Triplet Grid with highlight for the tested dimension (Orange for Person, Purple for Action, Teal for Object) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center pt-1">
                          {/* Person Card - כתום */}
                          <div
                            className={`p-3 rounded-xl border transition-all ${
                              quizMeta.testedField === 'person'
                                ? 'bg-orange-500/25 border-orange-400 ring-2 ring-orange-400/40 shadow-md shadow-orange-500/10'
                                : 'bg-orange-500/10 border-orange-500/30 opacity-80'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-orange-400 font-bold flex items-center gap-1">
                                <User className="w-3 h-3 text-orange-400" />
                                <span>דמות (P):</span>
                              </span>
                              {quizMeta.testedField === 'person' && (
                                <span className="text-[9px] bg-orange-500 text-white font-black px-1.5 py-0.2 rounded-md">
                                  נבדק בשאלה
                                </span>
                              )}
                            </div>
                            <strong className="text-white text-xs block mt-1.5">
                              {currentQuizItem.userPerson || currentQuizItem.person}
                            </strong>
                          </div>

                          {/* Action Card - סגול */}
                          <div
                            className={`p-3 rounded-xl border transition-all ${
                              quizMeta.testedField === 'action'
                                ? 'bg-purple-500/25 border-purple-400 ring-2 ring-purple-400/40 shadow-md shadow-purple-500/10'
                                : 'bg-purple-500/10 border-purple-500/30 opacity-80'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-purple-400 font-bold flex items-center gap-1">
                                <Zap className="w-3 h-3 text-purple-400" />
                                <span>פעולה (A):</span>
                              </span>
                              {quizMeta.testedField === 'action' && (
                                <span className="text-[9px] bg-purple-500 text-white font-black px-1.5 py-0.2 rounded-md">
                                  נבדק בשאלה
                                </span>
                              )}
                            </div>
                            <strong className="text-white text-xs block mt-1.5">
                              {currentQuizItem.userAction || currentQuizItem.action}
                            </strong>
                          </div>

                          {/* Object Card - טורקיז */}
                          <div
                            className={`p-3 rounded-xl border transition-all ${
                              quizMeta.testedField === 'object'
                                ? 'bg-teal-500/25 border-teal-400 ring-2 ring-teal-400/40 shadow-md shadow-teal-500/10'
                                : 'bg-teal-500/10 border-teal-500/30 opacity-80'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-teal-400 font-bold flex items-center gap-1">
                                <Package className="w-3 h-3 text-teal-400" />
                                <span>חפץ (O):</span>
                              </span>
                              {quizMeta.testedField === 'object' && (
                                <span className="text-[9px] bg-teal-500 text-white font-black px-1.5 py-0.2 rounded-md">
                                  נבדק בשאלה
                                </span>
                              )}
                            </div>
                            <strong className="text-white text-xs block mt-1.5">
                              {currentQuizItem.userObject || currentQuizItem.object}
                            </strong>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200">
                          ⚡ <strong className="text-amber-400">סצנה מנטלית:</strong>{' '}
                          "{currentQuizItem.userPerson || currentQuizItem.person}{' '}
                          {currentQuizItem.userAction || currentQuizItem.action}{' '}
                          {currentQuizItem.userObject || currentQuizItem.object}"
                        </div>

                        <div className="flex justify-center pt-1">
                          <button
                            onClick={() => handleNextQuizQuestion()}
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
