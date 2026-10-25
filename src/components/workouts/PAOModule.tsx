import React, { useState, useRef, useEffect } from 'react';
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
  GripVertical,
  AlertTriangle,
  Image as ImageIcon,
  ImagePlus,
  Upload,
  Maximize2,
  X,
  ExternalLink,
  RefreshCw,
  Headphones,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PAOItem, MajorItem } from '../../types/memory';
import { getPAOInitials } from '../../lib/paoInitials';
import { isHebrewFuzzyMatch, isHebrewSearchMatch, isHebrewMultiFieldSearchMatch } from '../../lib/fuzzyMatch';
import { AIFieldGeneratorButton } from '../AIFieldGeneratorButton';
import {
  validateHebrewLogic,
  validatePAOPerson,
  checkPAODuplicates,
  DEFAULT_CONNECTING_LETTERS,
  useIgnoredValidations,
  buildLogicIgnoreKey,
} from '../../lib/hebrewLogicValidator';
import {
  getCurrentOrInitialDeckItem,
  advanceToNextDeckItem,
  getNextPAOTriplet,
  resetQuizDeck,
  DeckProgress,
} from '../../lib/quizDeckManager';
import { QuizDeckProgressBar } from '../QuizDeckProgressBar';
import { compressImageFile } from '../../lib/imageCompression';
import { ImageDropzone } from '../ImageDropzone';
import { PAOImageGeneratorTab } from '../PAOImageGeneratorTab';
import { PAOGalleryCarousel } from './PAOGalleryCarousel';
import { PAOHandsFreeVoiceQuiz } from './PAOHandsFreeVoiceQuiz';

export type PAOColumnKey = 'number' | 'image' | 'person' | 'action' | 'object' | 'scene' | 'ready' | 'actions';

export interface PAOColumnDef {
  key: PAOColumnKey;
  label: string;
  defaultWidth: number;
  minWidth: number;
  headerColorClass: string;
}

export const DEFAULT_PAO_COLUMNS: PAOColumnDef[] = [
  { key: 'number', label: 'מספר', defaultWidth: 85, minWidth: 65, headerColorClass: 'text-indigo-400' },
  { key: 'image', label: 'תמונה', defaultWidth: 70, minWidth: 60, headerColorClass: 'text-center text-pink-400' },
  { key: 'person', label: '👤 אדם', defaultWidth: 150, minWidth: 90, headerColorClass: 'text-amber-400' },
  { key: 'action', label: '⚡ פעולה', defaultWidth: 150, minWidth: 90, headerColorClass: 'text-purple-400' },
  { key: 'object', label: '📦 חפץ', defaultWidth: 150, minWidth: 90, headerColorClass: 'text-teal-400' },
  { key: 'scene', label: '🎬 סצנה שלמה', defaultWidth: 250, minWidth: 130, headerColorClass: 'text-amber-300' },
  { key: 'ready', label: 'מוכן לתרגול', defaultWidth: 105, minWidth: 80, headerColorClass: 'text-center' },
  { key: 'actions', label: 'פעולות', defaultWidth: 95, minWidth: 75, headerColorClass: 'text-center' },
];

interface PAOModuleProps {
  paoItems: PAOItem[];
  majorItems?: MajorItem[];
  majorDigits?: MajorItem[];
  connectingLetters?: string[];
  currentUser?: any;
  onLogin?: () => void;
  onEarnPoints: (amount: number, reason?: string) => void;
  onUnlockBadge: (badge: string) => void;
  onAddPAOItem?: (item: PAOItem) => void;
  onUpdatePAOItem: (
    number: number,
    updates: { person?: string; action?: string; object?: string; scene?: string; imageUrl?: string; is_ready_for_practice?: boolean }
  ) => void;
  onDeletePAOItem?: (number: number) => void;
  onResetPAOItem: (number: number) => void;
  onOpenSummary?: (techniqueId: string) => void;
  onTogglePAOReady?: (number: number, explicitState?: boolean) => void;
  onSetAllPAOReady?: (ready: boolean, numbers?: number[]) => void;
  onNavigateToLogicTab?: () => void;
  onSyncMajorAndPAOObjects?: (direction: 'majorToPao' | 'paoToMajor') => void;
  onRestoreOriginalPAO?: () => Promise<any>;
}

export const PAOModule: React.FC<PAOModuleProps> = ({
  paoItems,
  majorItems = [],
  majorDigits,
  connectingLetters = DEFAULT_CONNECTING_LETTERS,
  currentUser,
  onLogin,
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
  const { isIgnored, ignoreValidation } = useIgnoredValidations();
  const [subView, setSubView] = useState<'registry' | 'quiz' | 'voice'>('registry');
  const [search, setSearch] = useState('');
  const [modalImageMode, setModalImageMode] = useState<'upload' | 'ai'>('ai');
  const [quickUploadMode, setQuickUploadMode] = useState<'upload' | 'ai'>('ai');
  const [cardImageMode, setCardImageMode] = useState<'upload' | 'ai'>('ai');
  const [onlyReadyFilter, setOnlyReadyFilter] = useState(false);

  // Ready for practice whitelist calculation
  const readyPaoItems = paoItems.filter((item) => Boolean(item.is_ready_for_practice));
  const allPaoReady =
    paoItems.length > 0 && paoItems.every((item) => Boolean(item.is_ready_for_practice));

  // 6-digit trainer state
  const [pao6Digits, setPao6Digits] = useState('213988');
  const [sceneRevealed, setSceneRevealed] = useState(false);

  // View mode: 'grid' (כוורת) or 'list' (רשימה) or 'gallery' (קרוסלה)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'gallery'>('grid');

  // Excel-style customizable column order & widths for List View
  const [columnOrder, setColumnOrder] = useState<PAOColumnKey[]>(() => {
    try {
      const saved = localStorage.getItem('pao_table_col_order_v3');
      if (saved) {
        const parsed: PAOColumnKey[] = JSON.parse(saved);
        const allKeys: PAOColumnKey[] = ['number', 'image', 'person', 'action', 'object', 'scene', 'ready', 'actions'];
        if (allKeys.every((k) => parsed.includes(k)) && parsed.length === allKeys.length) {
          return parsed;
        }
      }
    } catch {}
    return ['number', 'image', 'person', 'action', 'object', 'scene', 'ready', 'actions'];
  });

  const [columnWidths, setColumnWidths] = useState<Record<PAOColumnKey, number>>(() => {
    try {
      const saved = localStorage.getItem('pao_table_col_widths_v3');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      number: 85,
      image: 70,
      person: 150,
      action: 150,
      object: 150,
      scene: 250,
      ready: 105,
      actions: 95,
    };
  });

  // Drag-and-drop state for column reordering
  const [draggedCol, setDraggedCol] = useState<PAOColumnKey | null>(null);
  const [dragOverCol, setDragOverCol] = useState<PAOColumnKey | null>(null);

  const handleDragStart = (e: React.DragEvent, colKey: PAOColumnKey) => {
    setDraggedCol(colKey);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', colKey);
  };

  const handleDragOver = (e: React.DragEvent, colKey: PAOColumnKey) => {
    e.preventDefault();
    if (draggedCol && draggedCol !== colKey) {
      setDragOverCol(colKey);
    }
  };

  const handleDrop = (e: React.DragEvent, targetColKey: PAOColumnKey) => {
    e.preventDefault();
    if (!draggedCol || draggedCol === targetColKey) {
      setDraggedCol(null);
      setDragOverCol(null);
      return;
    }
    const newOrder = [...columnOrder];
    const fromIndex = newOrder.indexOf(draggedCol);
    const toIndex = newOrder.indexOf(targetColKey);
    if (fromIndex !== -1 && toIndex !== -1) {
      newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, draggedCol);
      setColumnOrder(newOrder);
      try {
        localStorage.setItem('pao_table_col_order_v2', JSON.stringify(newOrder));
      } catch {}
    }
    setDraggedCol(null);
    setDragOverCol(null);
  };

  const handleDragEnd = () => {
    setDraggedCol(null);
    setDragOverCol(null);
  };

  // Excel-style mouse drag resize logic (adapted for RTL table direction)
  const resizingRef = useRef<{
    colKey: PAOColumnKey;
    startX: number;
    startWidth: number;
  } | null>(null);

  const handleResizeMouseDown = (colKey: PAOColumnKey, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = {
      colKey,
      startX: e.clientX,
      startWidth: columnWidths[colKey] || 150,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizingRef.current) return;
      const { colKey, startX, startWidth } = resizingRef.current;
      // In RTL, resizing the left border of a column: dragging left (smaller clientX) widens the column
      const delta = startX - moveEvent.clientX;
      const colDef = DEFAULT_PAO_COLUMNS.find((c) => c.key === colKey);
      const minW = colDef?.minWidth || 70;
      const newWidth = Math.max(minW, Math.min(800, startWidth + delta));
      setColumnWidths((prev) => ({
        ...prev,
        [colKey]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (resizingRef.current) {
        setColumnWidths((currentWidths) => {
          try {
            localStorage.setItem('pao_table_col_widths_v2', JSON.stringify(currentWidths));
          } catch {}
          return currentWidths;
        });
        resizingRef.current = null;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleResetTableLayout = () => {
    const defaultOrder: PAOColumnKey[] = ['number', 'image', 'person', 'action', 'object', 'scene', 'ready', 'actions'];
    const defaultWidths: Record<PAOColumnKey, number> = {
      number: 85,
      image: 70,
      person: 150,
      action: 150,
      object: 150,
      scene: 250,
      ready: 105,
      actions: 95,
    };
    setColumnOrder(defaultOrder);
    setColumnWidths(defaultWidths);
    try {
      localStorage.removeItem('pao_table_col_order_v3');
      localStorage.removeItem('pao_table_col_widths_v3');
    } catch {}
  };

  // Light-dismiss Image Full-Screen Modal State
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<{
    url: string;
    title: string;
    subtitle?: string;
    scene?: string;
    numberStr?: string;
    number?: number;
  } | null>(null);

  // In-Modal Edit/Replace Image State
  const [modalIsEditing, setModalIsEditing] = useState(false);
  const [modalNewImageUrl, setModalNewImageUrl] = useState('');
  const [modalIsCompressing, setModalIsCompressing] = useState(false);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);

  // Drag-and-Drop Feedback States
  const [dragOverCardNum, setDragOverCardNum] = useState<number | null>(null);
  const [isModalDragOver, setIsModalDragOver] = useState(false);
  const [isQuickUploadDragOver, setIsQuickUploadDragOver] = useState(false);

  // Quick Image Upload Modal State
  const [quickUploadItem, setQuickUploadItem] = useState<PAOItem | null>(null);
  const [quickUploadUrl, setQuickUploadUrl] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  // Validation Alert Modal
  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details?: string;
    onConfirmBypass?: () => void;
  } | null>(null);

  // Gallery of all PAO items with images for seamless left/right browsing
  const itemsWithImages = paoItems.filter((it) => Boolean(it.imageUrl && it.imageUrl.trim()));

  const navigateGallery = (direction: 'prev' | 'next') => {
    if (itemsWithImages.length <= 1 || !selectedPreviewImage) return;
    const currentIndex = itemsWithImages.findIndex(
      (it) => it.number === selectedPreviewImage.number
    );
    if (currentIndex === -1) return;
    const nextIdx =
      direction === 'next'
        ? (currentIndex + 1) % itemsWithImages.length
        : (currentIndex - 1 + itemsWithImages.length) % itemsWithImages.length;
    const nextItem = itemsWithImages[nextIdx];
    if (nextItem) {
      setSelectedPreviewImage({
        url: nextItem.imageUrl || '',
        title: `שלשת PAO #${nextItem.numberStr}${nextItem.person ? ` - ${nextItem.person}` : ''}`,
        subtitle: `${nextItem.person || ''} • ${nextItem.action || ''} • ${nextItem.object || ''}`,
        scene: nextItem.scene || '',
        numberStr: nextItem.numberStr,
        number: nextItem.number,
      });
      setModalIsEditing(false);
      setModalNewImageUrl('');
    }
  };

  // Edit PAO Item (Draft State for Centered Modal)
  const [editingNum, setEditingNum] = useState<number | null>(null);
  const [editPerson, setEditPerson] = useState('');
  const [editAction, setEditAction] = useState('');
  const [editObject, setEditObject] = useState('');
  const [editScene, setEditScene] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editActionNotice, setEditActionNotice] = useState<string | null>(null);

  // Escape key & Gallery Arrow keys handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (validationModal) {
          setValidationModal(null);
          return;
        }
        if (selectedPreviewImage) {
          setSelectedPreviewImage(null);
          setModalIsEditing(false);
          setConfirmDeleteModal(false);
          return;
        }
        if (quickUploadItem) {
          setQuickUploadItem(null);
          return;
        }
        if (editingNum !== null) {
          setEditingNum(null);
          setEditImageUrl('');
          setEditActionNotice(null);
          return;
        }
      } else if (selectedPreviewImage) {
        const activeTag = (document.activeElement?.tagName || '').toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          if (e.key === 'ArrowRight') {
            navigateGallery('next');
          } else if (e.key === 'ArrowLeft') {
            navigateGallery('prev');
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPreviewImage, quickUploadItem, validationModal, editingNum, itemsWithImages]);

  // Add PAO Item
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [newPerson, setNewPerson] = useState('');
  const [newAction, setNewAction] = useState('');
  const [newObject, setNewObject] = useState('');
  const [newScene, setNewScene] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newActionNotice, setNewActionNotice] = useState<string | null>(null);
  const [quizActionNotice, setQuizActionNotice] = useState<string | null>(null);

  // PAO Quiz question & filter types
  type PAOQuizQuestionType =
    | 'numberToPerson'
    | 'numberToAction'
    | 'numberToObject'
    | 'personToNumber'
    | 'actionToNumber'
    | 'objectToNumber'
    | 'fullScene';

  type PAOQuizFilter = 'all' | 'fullScene' | 'person' | 'action' | 'object' | 'reverse';

  // PAO Quiz state (Strictly over readyPaoItems)
  const [deckProgress, setDeckProgress] = useState<DeckProgress | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizFilter, setQuizFilter] = useState<PAOQuizFilter>('all');
  const [questionType, setQuestionType] = useState<PAOQuizQuestionType>('numberToPerson');
  const [userGuessInput, setUserGuessInput] = useState('');
  const [quizFeedback, setQuizFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [revealQuizAnswer, setRevealQuizAnswer] = useState(false);
  const [quizSceneTriplet, setQuizSceneTriplet] = useState<{
    p: PAOItem;
    a: PAOItem;
    o: PAOItem;
  } | null>(null);
  
  // Quiz Inline Edit State
  const [isQuizEditing, setIsQuizEditing] = useState(false);
  const [quizEditPerson, setQuizEditPerson] = useState('');
  const [quizEditAction, setQuizEditAction] = useState('');
  const [quizEditObject, setQuizEditObject] = useState('');
  const [quizEditScene, setQuizEditScene] = useState('');
  const [quizEditImageUrl, setQuizEditImageUrl] = useState('');

  const safeQuizIndex = readyPaoItems.length > 0 ? quizIndex % readyPaoItems.length : 0;
  const currentQuizItem = readyPaoItems.length > 0 ? readyPaoItems[safeQuizIndex] : null;

  // Jump to specific number in registry
  const [highlightedNum, setHighlightedNum] = useState<number | null>(null);


  // --- Core Save Logic (Lifting State Up) ---
  const handleSaveItem = (itemNum: number, bypassValidation = false) => {
    if (typeof itemNum !== 'number' || isNaN(itemNum)) return;
    const pTrim = editPerson.trim();
    const aTrim = editAction.trim();
    const oTrim = editObject.trim();
    const sTrim = editScene.trim();

    if (!bypassValidation) {
      const existing = paoItems.find((p) => p.number === itemNum || parseInt(p.numberStr, 10) === itemNum);
      const personChanged = existing ? pTrim !== (existing.person || '').trim() : false;
      const actionChanged = existing ? aTrim !== (existing.action || '').trim() : false;
      const objectChanged = existing ? oTrim !== (existing.object || '').trim() : false;

      // 1. Check duplicate person / action / object only for modified fields
      if (personChanged || actionChanged || objectChanged) {
        const dup = checkPAODuplicates(paoItems, itemNum, {
          person: personChanged ? pTrim : undefined,
          action: actionChanged ? aTrim : undefined,
          object: objectChanged ? oTrim : undefined,
        });
        if (dup.hasDuplicate) {
          setValidationModal({
            isOpen: true,
            title: 'הודעת ולידציה: ערך כפול',
            message: dup.message,
            details: `במודולת PAO לכל מספר רצוי לייחד פעולה, דמות וחפץ בלעדיים כדי למנוע טעויות בשליפת רצפים.`,
            onConfirmBypass: () => handleSaveItem(itemNum, true),
          });
          return;
        }
      }

      // 2. Check logic conformity for person ONLY if changed (validates only initials)
      if (personChanged && pTrim && majorDigits) {
        const pIgnoreKey = buildLogicIgnoreKey('pao-person', itemNum, pTrim);
        if (!isIgnored(pIgnoreKey)) {
          const pLogic = validatePAOPerson(pTrim, itemNum, majorDigits, connectingLetters);
          if (!pLogic.isValid) {
            setValidationModal({
              isOpen: true,
              title: 'הודעת ולידציה: אי-התאמה לראשי תיבות של הדמות',
              message: pLogic.message,
              details: `הדמות "${pTrim}" אינה עונה לכללי ראשי התיבות של מספר ${itemNum < 10 ? '0' + itemNum : itemNum}. ${pLogic.details || ''}`,
              onConfirmBypass: () => {
                ignoreValidation(pIgnoreKey);
                handleSaveItem(itemNum, true);
              },
            });
            return;
          }
        }
      }

      // 3. Check logic conformity for object ONLY if changed
      if (objectChanged && oTrim && majorDigits) {
        const oIgnoreKey = buildLogicIgnoreKey('pao-object', itemNum, oTrim);
        if (!isIgnored(oIgnoreKey)) {
          const oLogic = validateHebrewLogic(oTrim, itemNum, majorDigits, connectingLetters, 'pao');
          if (!oLogic.isValid) {
            setValidationModal({
              isOpen: true,
              title: 'הודעת ולידציה: אי-התאמה לחוקי הלוגיקה',
              message: oLogic.message,
              details: `החפץ "${oTrim}" אינו עונה לכללי הלוגיקה של מספר ${itemNum}. ${oLogic.details || ''}`,
              onConfirmBypass: () => {
                ignoreValidation(oIgnoreKey);
                handleSaveItem(itemNum, true);
              },
            });
            return;
          }
        }
      }
    }

    onUpdatePAOItem(itemNum, {
      person: pTrim,
      action: aTrim,
      object: oTrim,
      scene: sTrim,
      imageUrl: editImageUrl ? editImageUrl.trim() : '',
    });
    setEditingNum(null);
    setEditImageUrl('');
    setValidationModal(null);
  };

  const handleTogglePaoReady = (itemNumber: number, currentState?: boolean) => {
    if (typeof itemNumber !== 'number' || isNaN(itemNumber)) return;
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
      person: item.person,
      action: item.action,
      object: item.object,
    };
  };

  const parsedPao = {
    person: getPaoFor2Digits(pao6Digits.slice(0, 2)).person,
    action: getPaoFor2Digits(pao6Digits.slice(2, 4)).action,
    object: getPaoFor2Digits(pao6Digits.slice(4, 6)).object,
  };

  const handleAddNewItem = (e?: React.FormEvent | React.KeyboardEvent, bypass = false) => {
    if (e && e.preventDefault) e.preventDefault();
    const num = parseInt(newNumber.trim(), 10);
    if (isNaN(num) || num < 0 || num > 99) return;
    const numStr = (num < 10 ? `0${num}` : `${num}`).padStart(2, '0');
    const pTrim = newPerson.trim();
    const aTrim = newAction.trim();
    const oTrim = newObject.trim();
    const sTrim = newScene.trim();

    if (!bypass) {
      const dup = checkPAODuplicates(paoItems, num, { person: pTrim, action: aTrim, object: oTrim });
      if (dup.hasDuplicate) {
        setValidationModal({
          isOpen: true,
          title: 'הודעת ולידציה: ערך כפול',
          message: dup.message,
          details: `הערך כבר מוגדר עבור מספר אחר (${dup.conflictingNumberStr}). מומלץ לייחד ערך בלעדי.`,
          onConfirmBypass: () => handleAddNewItem(undefined, true),
        });
        return;
      }

      if (pTrim && majorDigits) {
        const pIgnoreKey = buildLogicIgnoreKey('pao-person', num, pTrim);
        if (!isIgnored(pIgnoreKey)) {
          const pLogic = validatePAOPerson(pTrim, num, majorDigits, connectingLetters);
          if (!pLogic.isValid) {
            setValidationModal({
              isOpen: true,
              title: 'הודעת ולידציה: אי-התאמה לראשי תיבות של הדמות',
              message: pLogic.message,
              details: `הדמות "${pTrim}" אינה עונה לכללי ראשי התיבות של מספר ${num < 10 ? '0' + num : num}. ${pLogic.details || ''}`,
              onConfirmBypass: () => {
                ignoreValidation(pIgnoreKey);
                handleAddNewItem(undefined, true);
              },
            });
            return;
          }
        }
      }

      if (oTrim && majorDigits) {
        const oIgnoreKey = buildLogicIgnoreKey('pao-object', num, oTrim);
        if (!isIgnored(oIgnoreKey)) {
          const oLogic = validateHebrewLogic(oTrim, num, majorDigits, connectingLetters, 'pao');
          if (!oLogic.isValid) {
            setValidationModal({
              isOpen: true,
              title: 'הודעת ולידציה: אי-התאמה לחוקי הלוגיקה',
              message: oLogic.message,
              details: `החפץ "${oTrim}" אינו עונה לכללי הלוגיקה של מספר ${num}. ${oLogic.details || ''}`,
              onConfirmBypass: () => {
                ignoreValidation(oIgnoreKey);
                handleAddNewItem(undefined, true);
              },
            });
            return;
          }
        }
      }
    }

    if (onAddPAOItem) {
      onAddPAOItem({
        number: num,
        numberStr: numStr,
        person: pTrim,
        action: aTrim,
        object: oTrim,
        scene: sTrim,
        imageUrl: newImageUrl.trim(),
        is_ready_for_practice: true,
      });
    }

    setNewNumber('');
    setNewPerson('');
    setNewAction('');
    setNewObject('');
    setNewScene('');
    setNewImageUrl('');
    setShowAddForm(false);
    setValidationModal(null);
  };

  const pickNextQuestionType = (filter: PAOQuizFilter): PAOQuizQuestionType => {
    if (filter === 'fullScene') return 'fullScene';
    if (filter === 'person') return 'numberToPerson';
    if (filter === 'action') return 'numberToAction';
    if (filter === 'object') return 'numberToObject';
    if (filter === 'reverse') {
      const revs: PAOQuizQuestionType[] = ['personToNumber', 'actionToNumber', 'objectToNumber'];
      return revs[Math.floor(Math.random() * revs.length)];
    }
    // Filter 'all' -> random question including fullScene
    const rand = Math.random();
    if (rand < 0.25) return 'fullScene';
    if (rand < 0.50) return 'numberToPerson';
    if (rand < 0.70) return 'numberToAction';
    if (rand < 0.85) return 'numberToObject';
    const revs: PAOQuizQuestionType[] = ['personToNumber', 'actionToNumber', 'objectToNumber'];
    return revs[Math.floor(Math.random() * revs.length)];
  };

  const handleNextQuizQuestion = (customFilter?: PAOQuizFilter) => {
    if (readyPaoItems.length === 0) return;
    const { item, progress } = advanceToNextDeckItem('workout_pao_single', readyPaoItems, (i) => i.number);
    if (item) {
      const idx = readyPaoItems.findIndex((x) => x.number === item.number);
      if (idx >= 0) setQuizIndex(idx);
    }
    setDeckProgress(progress);
    setUserGuessInput('');
    setQuizFeedback('idle');
    setRevealQuizAnswer(false);
    setIsQuizEditing(false);

    // Pick 3 ready items for 6-digit full scene triplet training without immediate repeats
    try {
      const triplet = getNextPAOTriplet(readyPaoItems);
      setQuizSceneTriplet({ p: triplet.p, a: triplet.a, o: triplet.o });
    } catch {
      // fallback
    }

    const activeFilter = customFilter !== undefined ? customFilter : quizFilter;
    setQuestionType(pickNextQuestionType(activeFilter));
  };

  // On mount or when readyPaoItems changes, peek current deck item without advancing
  React.useEffect(() => {
    if (readyPaoItems.length > 0) {
      const { item, progress } = getCurrentOrInitialDeckItem('workout_pao_single', readyPaoItems, (i) => i.number);
      if (item) {
        const idx = readyPaoItems.findIndex((x) => x.number === item.number);
        if (idx >= 0) setQuizIndex(idx);
      }
      setDeckProgress(progress);

      if (!quizSceneTriplet) {
        try {
          const triplet = getNextPAOTriplet(readyPaoItems);
          setQuizSceneTriplet({ p: triplet.p, a: triplet.a, o: triplet.o });
        } catch {
          // fallback
        }
      }
    }
  }, [readyPaoItems.length]);

  const handleStartQuizEdit = () => {
    if (!currentQuizItem) return;
    setQuizEditPerson(currentQuizItem.person || '');
    setQuizEditAction(currentQuizItem.action || '');
    setQuizEditObject(currentQuizItem.object || '');
    setQuizEditScene(currentQuizItem.scene || '');
    setQuizEditImageUrl(currentQuizItem.imageUrl || '');
    setIsQuizEditing((prev) => !prev);
  };

  const handleSaveQuizEdit = (bypass = false) => {
    if (!currentQuizItem) return;
    const pTrim = quizEditPerson.trim();
    const aTrim = quizEditAction.trim();
    const oTrim = quizEditObject.trim();
    const sTrim = quizEditScene.trim();

    if (!bypass) {
      const personChanged = pTrim !== (currentQuizItem.person || '').trim();
      const actionChanged = aTrim !== (currentQuizItem.action || '').trim();
      const objectChanged = oTrim !== (currentQuizItem.object || '').trim();

      if (personChanged || actionChanged || objectChanged) {
        const dup = checkPAODuplicates(paoItems, currentQuizItem.number, {
          person: personChanged ? pTrim : undefined,
          action: actionChanged ? aTrim : undefined,
          object: objectChanged ? oTrim : undefined,
        });
        if (dup.hasDuplicate) {
          setValidationModal({
            isOpen: true,
            title: 'הודעת ולידציה: ערך כפול',
            message: dup.message,
            details: `הערך כבר מוגדר עבור מספר אחר (${dup.conflictingNumberStr}).`,
            onConfirmBypass: () => handleSaveQuizEdit(true),
          });
          return;
        }
      }

      if (personChanged && pTrim && majorDigits) {
        const pIgnoreKey = buildLogicIgnoreKey('pao-person', currentQuizItem.number, pTrim);
        if (!isIgnored(pIgnoreKey)) {
          const pLogic = validatePAOPerson(pTrim, currentQuizItem.number, majorDigits, connectingLetters);
          if (!pLogic.isValid) {
            setValidationModal({
              isOpen: true,
              title: 'הודעת ולידציה: אי-התאמה לראשי תיבות של הדמות',
              message: pLogic.message,
              details: pLogic.details,
              onConfirmBypass: () => {
                ignoreValidation(pIgnoreKey);
                handleSaveQuizEdit(true);
              },
            });
            return;
          }
        }
      }

      if (objectChanged && oTrim && majorDigits) {
        const oIgnoreKey = buildLogicIgnoreKey('pao-object', currentQuizItem.number, oTrim);
        if (!isIgnored(oIgnoreKey)) {
          const oLogic = validateHebrewLogic(oTrim, currentQuizItem.number, majorDigits, connectingLetters, 'pao');
          if (!oLogic.isValid) {
            setValidationModal({
              isOpen: true,
              title: 'הודעת ולידציה: אי-התאמה לחוקי הלוגיקה',
              message: oLogic.message,
              details: oLogic.details,
              onConfirmBypass: () => {
                ignoreValidation(oIgnoreKey);
                handleSaveQuizEdit(true);
              },
            });
            return;
          }
        }
      }
    }

    onUpdatePAOItem(currentQuizItem.number, {
      person: pTrim,
      action: aTrim,
      object: oTrim,
      scene: sTrim,
      imageUrl: quizEditImageUrl.trim(),
    });
    setIsQuizEditing(false);
    setValidationModal(null);
    onEarnPoints(10, 'עדכון שלשת PAO מתוך מבחן השליפה');
  };

  const handleCheckQuiz = () => {
    const guess = userGuessInput.trim();
    if (!guess) return;

    let isMatch = false;
    let successReason = '';

    if (questionType === 'fullScene') {
      const p = quizSceneTriplet?.p || currentQuizItem;
      const a = quizSceneTriplet?.a || currentQuizItem;
      const o = quizSceneTriplet?.o || currentQuizItem;
      if (!p || !a || !o) return;

      const targetScene = `${p.person} ${a.action} ${o.object}`;
      const customScene = p.scene || '';

      // 1. Direct Hebrew fuzzy match on full scene or custom scene
      const matchFull =
        isHebrewFuzzyMatch(guess, targetScene) ||
        (customScene ? isHebrewFuzzyMatch(guess, customScene) : false);

      // 2. Component-by-component recognition: does user guess mention the person, action, and object?
      // e.g. "סטאלון נותן אגרוף לסוס" vs "סילבסטר סטאלון" + "מתאגרף" + "סוס"
      const matchP =
        isHebrewSearchMatch(p.person, guess) ||
        isHebrewFuzzyMatch(guess, p.person) ||
        isHebrewSearchMatch(guess, p.person);
      const matchA =
        isHebrewSearchMatch(a.action, guess) ||
        isHebrewFuzzyMatch(guess, a.action) ||
        isHebrewSearchMatch(guess, a.action);
      const matchO =
        isHebrewSearchMatch(o.object, guess) ||
        isHebrewFuzzyMatch(guess, o.object) ||
        isHebrewSearchMatch(guess, o.object);

      isMatch = Boolean(matchFull || (matchP && matchA && matchO));
      successReason = 'שליפת סצנת PAO מלאה';
    } else {
      if (!currentQuizItem) return;
      switch (questionType) {
        case 'numberToPerson': {
          const target = currentQuizItem.person || '';
          isMatch = isHebrewFuzzyMatch(guess, target);
          successReason = 'שליפת דמות PAO';
          break;
        }
        case 'numberToAction': {
          const target = currentQuizItem.action || '';
          isMatch = isHebrewFuzzyMatch(guess, target);
          successReason = 'שליפת פעולת PAO';
          break;
        }
        case 'numberToObject': {
          const target = currentQuizItem.object || '';
          isMatch = isHebrewFuzzyMatch(guess, target);
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
    }

    if (isMatch) {
      setQuizFeedback('correct');
      setRevealQuizAnswer(true);
      onEarnPoints(questionType === 'fullScene' ? 30 : 20, successReason);
      onUnlockBadge('שלשת אלופים (PAO)');
      confetti({ particleCount: 45, spread: 65, origin: { y: 0.6 } });
    } else {
      setQuizFeedback('incorrect');
      setRevealQuizAnswer(true);
    }
  };

  const filteredItems = paoItems.filter((item) => {
    if (onlyReadyFilter && !item.is_ready_for_practice) return false;
    return isHebrewMultiFieldSearchMatch(
      search,
      item.numberStr,
      item.number,
      item.person,
      item.action,
      item.object,
      item.scene
    );
  });

  const getQuizMeta = () => {
    if (questionType === 'fullScene') {
      const p = quizSceneTriplet?.p || currentQuizItem;
      const a = quizSceneTriplet?.a || currentQuizItem;
      const o = quizSceneTriplet?.o || currentQuizItem;
      const pDigits = p?.numberStr || '00';
      const aDigits = a?.numberStr || '00';
      const oDigits = o?.numberStr || '00';
      return {
        theme: 'indigo' as const,
        badgeIcon: <Sparkles className="w-3.5 h-3.5 text-indigo-400" />,
        badgeText: '🎬 שאלה: סצנה שלמה (איחוד 6 ספרות / דמות+פעולה+חפץ)',
        badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        title: 'שלוף והקלד את הסצנה המאוחדת:',
        titleColor: 'text-indigo-400',
        cardBorder: 'border-indigo-500/40',
        cardBg: 'bg-gradient-to-b from-indigo-950/20 via-slate-950 to-slate-950 shadow-xl shadow-indigo-500/5',
        inputBorder: 'border-indigo-500/40 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/30',
        btnColor: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30',
        tagColor: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/25',
        mainValue: `${pDigits} - ${aDigits} - ${oDigits}`,
        isNumberMain: false,
        isFullScene: true,
        digitsP: pDigits,
        digitsA: aDigits,
        digitsO: oDigits,
        pItem: p,
        aItem: a,
        oItem: o,
        testedField: 'scene' as const,
        placeholder: 'הקלד את הסצנה השלמה (למשל: סילבסטר סטאלון מתאגרף עם סוס)...',
        correctTarget: `${p?.person || ''} ${a?.action || ''} ${o?.object || ''}`.trim(),
      };
    }

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
          isFullScene: false,
          testedField: 'person' as const,
          placeholder: 'הקלד את שם הדמות (למשל סילבסטר סטאלון)...',
          correctTarget: currentQuizItem.person,
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
          correctTarget: currentQuizItem.action,
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
          correctTarget: currentQuizItem.object,
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
          mainValue: currentQuizItem.person,
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
          mainValue: currentQuizItem.action,
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
          mainValue: currentQuizItem.object,
          isNumberMain: false,
          testedField: 'object' as const,
          placeholder: 'הקלד את המספר (למשל 23)...',
          correctTarget: currentQuizItem.numberStr,
        };
    }
  };

  const quizMeta = getQuizMeta();

  return (
    <div className="w-full max-w-none bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm space-y-6 text-slate-900">
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
            <span>מבחן שליפה</span>
            {readyPaoItems.length > 0 && (
              <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                {readyPaoItems.length} מוכנים
              </span>
            )}
          </button>
          <button
            onClick={() => setSubView('voice')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              subView === 'voice'
                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white border-b-2 border-purple-700 shadow-md shadow-purple-600/30'
                : 'text-purple-600 hover:text-purple-800 hover:bg-purple-50'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>🎙️ שליפה קולית (נהיגה)</span>
          </button>
        </div>
      </div>

      {/* דפוס M3 מספר 3: Fade Through (דהייה והחלפה קונטקסטואלית)
          נבחר עבור החלפת מצבי תצוגה ראשיים ב-PAO: מאגר השלשות (Registry) לעומת מבחן שליפה פעילה (Quiz).
          לפי Google Material Motion, שינוי קונטקסט מלא מתבצע ב-Fade Through עם Scale עדין,
          המונע תנועה חדה בציר שאינו קיים ומאפשר למשתמש להתמקד במצב הלמידה החדש. */}
      {subView === 'registry' && (
        <div key="pao-registry" className="space-y-4 m3-fade-through">
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

              {/* View Mode Toggle (כוורת vs. רשימה vs. גלריה) */}
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
                <button
                  type="button"
                  onClick={() => setViewMode('gallery')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'gallery'
                      ? 'bg-gradient-to-r from-pink-600 to-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="תצוגת גלריה (קרוסלה להצגת כל השלשות)"
                >
                  <span>🖼️</span>
                  <span>גלריה</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Single Bulk Ready Toggle Button */}
              {onSetAllPAOReady && (
                <div className="flex items-center gap-1.5 text-xs">
                  {allPaoReady ? (
                    <button
                      type="button"
                      onClick={() => onSetAllPAOReady(false)}
                      className="text-xs font-bold text-white bg-slate-950 hover:bg-black border border-slate-700 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm"
                      title="הסר את כל שלשות ה-PAO מסטטוס מוכן לתרגול"
                    >
                      הסר הכל מסטטוס מוכן לתרגול
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onSetAllPAOReady(true);
                        onEarnPoints(20, 'סימון כל 100 שלשות PAO כמוכנות לתרגול');
                      }}
                      className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm"
                      title="סמן את כל 100 שלשות ה-PAO כמוכנות לתרגול"
                    >
                      סמן הכל כמוכן לתרגול
                    </button>
                  )}
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
                      paoContext={{
                        number: newNumber,
                        person: newPerson,
                        action: newAction,
                        object: newObject,
                        scene: newScene,
                      }}
                      customDigits={majorDigits}
                      connectingLetters={connectingLetters}
                      onGenerated={(val) => {
                        setNewPerson(val);
                        setNewActionNotice(null);
                      }}
                      label="אדם עם AI"
                      compact
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={newPerson}
                    onChange={(e) => {
                      setNewPerson(e.target.value);
                      if (e.target.value.trim()) setNewActionNotice(null);
                    }}
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
                      paoContext={{
                        number: newNumber,
                        person: newPerson,
                        action: newAction,
                        object: newObject,
                        scene: newScene,
                      }}
                      customDigits={majorDigits}
                      connectingLetters={connectingLetters}
                      onGenerated={(val) => setNewAction(val)}
                      onNotice={(note) => setNewActionNotice(note)}
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
                  {newActionNotice && (
                    <p className="text-[11px] text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded-lg px-2 py-1 mt-1 leading-snug">
                      ⚠️ {newActionNotice}
                    </p>
                  )}
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
                      paoContext={{
                        number: newNumber,
                        person: newPerson,
                        action: newAction,
                        object: newObject,
                        scene: newScene,
                      }}
                      customDigits={majorDigits}
                      connectingLetters={connectingLetters}
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
                        שדה רביעי: סצנה שלמה (עקרון SEE - חושים, רגש, הקצנה ותנועה)
                      </label>
                    </div>
                    <AIFieldGeneratorButton
                      promptType="pao_scene"
                      inputContext={newNumber ? `מספר ${newNumber}` : 'שלשת PAO'}
                      extraContext={`אדם: ${newPerson} | פעולה: ${newAction} | חפץ: ${newObject}`}
                      paoContext={{
                        number: newNumber,
                        person: newPerson,
                        action: newAction,
                        object: newObject,
                        scene: newScene,
                      }}
                      customDigits={majorDigits}
                      connectingLetters={connectingLetters}
                      onGenerated={(val) => setNewScene(val)}
                      label="צור סצנה עם AI"
                      compact
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={newScene}
                    onChange={(e) => setNewScene(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const form = e.currentTarget.form;
                        if (form && form.reportValidity()) {
                          handleAddNewItem();
                        }
                      }
                    }}
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
                    #{item.numberStr} - {item.person}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* דפוס M3 מספר 3: Fade Through (דהייה והחלפה בין כוורת לטבלה)
              החלפה בין תצוגת כרטיסים לתצוגת שורות טבלה מבוצעת ב-Fade Through,
              למניעת קפיצות גלילה וליצירת מעבר חלק וזורם לעין. */}
          <div key={viewMode} className="flex gap-3 items-start m3-fade-through">
            {viewMode === 'gallery' ? (
              <PAOGalleryCarousel
                items={filteredItems}
                majorDigits={majorDigits}
                onClose={() => setViewMode('grid')}
                onOpenImagePreview={(item) => {
                  setSelectedPreviewImage({
                    url: item.imageUrl || '',
                    title: item.person || `שלשה #${item.numberStr}`,
                    subtitle: `${item.action || ''} • ${item.object || ''}`,
                    numberStr: item.numberStr,
                    number: item.number,
                    scene: item.scene || '',
                  });
                }}
                onOpenImageGenerator={(item) => {
                  setQuickUploadItem(item);
                  setQuickUploadMode('ai');
                  setQuickUploadUrl('');
                }}
                onEditItem={(num) => {
                  const it = paoItems.find((p) => p.number === num);
                  if (it) {
                    setEditingNum(it.number);
                    setEditPerson(it.person || '');
                    setEditAction(it.action || '');
                    setEditObject(it.object || '');
                    setEditScene(it.scene || '');
                    setEditImageUrl(it.imageUrl || '');
                    setViewMode('grid');
                    scrollToNumber(it.number);
                  }
                }}
                onToggleReady={(num, curr) => handleTogglePaoReady(num, curr)}
              />
            ) : viewMode === 'grid' ? (
              /* Main Cards Grid - Responsive Full-Width */
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 max-h-[680px] overflow-y-auto pr-1 scroll-smooth w-full">
                {filteredItems.map((item) => {
                  const isEditing = editingNum === item.number;
                  const p = item.person;
                  const a = item.action;
                  const o = item.object;
                  const s = item.scene || '';
                  const isCustom = Boolean(item.scene);
                  const isHighlighted = highlightedNum === item.number;
                  const initialsInfo = getPAOInitials(item.number, majorDigits);
                  const personIgnoreKey = buildLogicIgnoreKey('pao-person', item.number, p || '');
                  const objectIgnoreKey = buildLogicIgnoreKey('pao-object', item.number, o || '');
                  const rawPersonValidation =
                    p && p.trim() && majorDigits
                      ? validatePAOPerson(p, item.number, majorDigits, connectingLetters)
                      : { isValid: true, message: '' };
                  const personValidation = isIgnored(personIgnoreKey)
                    ? { isValid: true, message: '' }
                    : rawPersonValidation;
                  const rawObjectValidation =
                    o && o.trim() && majorDigits
                      ? validateHebrewLogic(o, item.number, majorDigits, connectingLetters, 'pao')
                      : { isValid: true, message: '' };
                  const objectValidation = isIgnored(objectIgnoreKey)
                    ? { isValid: true, message: '' }
                    : rawObjectValidation;

                  const matchingMajor = majorItems.find((m) => m.number === item.number);
                  const majorWord = matchingMajor?.defaultWord?.trim() || '';
                  const mismatchIgnoreKey = buildLogicIgnoreKey(
                    'major-pao-mismatch',
                    item.number,
                    majorWord,
                    o || ''
                  );
                  const hasMajorMismatch =
                    Boolean(o && o.trim() && majorWord && o.trim() !== majorWord) &&
                    !isIgnored(mismatchIgnoreKey);

                  const hasLogicConflict =
                    !personValidation.isValid || !objectValidation.isValid || hasMajorMismatch;

                  // דפוס M3 מספר 4: Shape Morphing / Expressive Spring (שינוי צורה וקפיציות בכרטיס)
                  return (
                    <div
                      id={`pao-item-${item.number}`}
                      key={item.number}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragOverCardNum !== item.number) {
                          setDragOverCardNum(item.number);
                        }
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        if (dragOverCardNum === item.number) {
                          setDragOverCardNum(null);
                        }
                      }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        setDragOverCardNum(null);
                        const file = e.dataTransfer.files?.[0];
                        if (!file || !file.type.startsWith('image/')) return;
                        try {
                          setIsCompressing(true);
                          const comp = await compressImageFile(file);
                          onUpdatePAOItem(item.number, { imageUrl: comp });
                          onEarnPoints(10, 'העלאת תמונה לשלשת PAO בגרירה');
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setIsCompressing(false);
                        }
                      }}
                      className={`relative bg-slate-950 border rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between overflow-hidden m3-shape-morph ${
                        dragOverCardNum === item.number
                          ? 'border-indigo-400 ring-4 ring-indigo-400/40 scale-[1.02] shadow-xl bg-indigo-950/40'
                          : isHighlighted
                          ? 'border-indigo-400 ring-4 ring-indigo-400/30 scale-[1.02] shadow-xl shadow-indigo-500/20 bg-indigo-950/20'
                          : hasLogicConflict
                          ? 'border-amber-500/65 ring-1 ring-amber-500/25'
                          : isCustom
                          ? 'border-indigo-500/50 shadow-sm shadow-indigo-500/10'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Drag overlay when hovering with an image file */}
                      {dragOverCardNum === item.number && (
                        <div className="absolute inset-0 z-20 bg-indigo-950/90 border-2 border-dashed border-indigo-400 rounded-2xl flex flex-col items-center justify-center p-3 text-center animate-fadeIn pointer-events-none">
                          <Upload className="w-7 h-7 text-indigo-300 animate-bounce mb-1.5" />
                          <span className="text-xs font-black text-white">שחרר להגדרת תמונה!</span>
                          <span className="text-[10px] text-indigo-200">שלשת PAO #{item.numberStr}</span>
                        </div>
                      )}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-lg font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20 shrink-0">
                            {item.numberStr}
                          </span>
                          <span
                            title={`ראשי תיבות לפי שיטת Major (מסונכרן בזמן אמת): ${initialsInfo.fullFormula}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs shrink-0"
                          >
                            <span className="text-[11px] text-amber-400/70 font-normal">ר"ת:</span>
                            <span>{initialsInfo.initials}</span>
                          </span>

                          {/* Image Thumbnail or Quick Upload trigger */}
                          {item.imageUrl ? (
                            <div
                              onClick={() =>
                                setSelectedPreviewImage({
                                  url: item.imageUrl!,
                                  title: `שלשת PAO #${item.numberStr}`,
                                  subtitle: `${p} • ${a} • ${o}`,
                                  scene: s,
                                  numberStr: item.numberStr,
                                  number: item.number,
                                })
                              }
                              className="relative group cursor-pointer shrink-0"
                              title="לחץ להגדלה במסך מלא (Light Dismiss)"
                            >
                              <img
                                src={item.imageUrl}
                                alt={`סצנה ${item.numberStr}`}
                                className="w-9 h-9 object-cover rounded-lg border border-indigo-500/40 shadow-sm group-hover:scale-105 group-hover:border-indigo-400 transition-all"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity">
                                <Maximize2 className="w-3.5 h-3.5 text-white drop-shadow" />
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={() => {
                                setQuickUploadItem(item);
                                setQuickUploadUrl('');
                                setQuickUploadMode('ai');
                              }}
                              className="w-8 h-8 p-1.5 rounded-xl text-slate-400 hover:text-indigo-300 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all cursor-pointer inline-flex items-center justify-center shrink-0"
                              title="צרף תמונה לשלשה זו"
                            >
                              <ImagePlus className="w-4 h-4 pointer-events-none" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0 relative z-20">
                          {isCustom && (
                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={() => {
                                onResetPAOItem(item.number);
                                if (isEditing) setEditingNum(null);
                              }}
                              title="אפס לברירת מחדל"
                              className="w-8 h-8 p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer inline-flex items-center justify-center transition-colors"
                            >
                              <Undo2 className="w-3.5 h-3.5 pointer-events-none" />
                            </button>
                          )}
                          <button
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingNum(item.number);
                              setEditPerson(item.person || '');
                              setEditAction(item.action || '');
                              setEditObject(item.object || '');
                              setEditScene(item.scene || '');
                              setEditImageUrl(item.imageUrl || '');
                              setEditActionNotice(null);
                            }}
                            className="relative z-20 w-9 h-9 p-2 rounded-xl text-slate-300 hover:text-indigo-300 hover:bg-indigo-500/20 border border-transparent hover:border-indigo-500/30 cursor-pointer inline-flex items-center justify-center transition-colors shrink-0"
                            title="ערוך שלשה בחלון מורחב"
                          >
                            <Edit3 className="w-4 h-4 pointer-events-none" />
                          </button>
                          {onDeletePAOItem && (
                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={() => onDeletePAOItem(item.number)}
                              className="w-8 h-8 p-1.5 rounded-xl text-slate-600 hover:text-rose-400 cursor-pointer inline-flex items-center justify-center"
                              title="מחק מהמאגר"
                            >
                              <Trash2 className="w-4 h-4 pointer-events-none" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs sm:text-sm">
                        <div className="text-slate-200 flex items-center gap-1.5 flex-wrap">
                          <span className="text-amber-400 font-bold">👤 אדם:</span>
                          <span>{p}</span>
                          {!personValidation.isValid && (
                            <div
                              title={personValidation.details || personValidation.message}
                              className="w-full mt-1 flex flex-col gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] font-bold leading-snug"
                            >
                              <div className="flex items-start gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <span>{personValidation.message}</span>
                              </div>
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => ignoreValidation(personIgnoreKey)}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900/90 hover:bg-slate-800 text-amber-200 border border-amber-500/40 cursor-pointer transition-colors"
                                >
                                  התעלם במקרה זה
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-slate-200">
                          <span className="text-purple-400 font-bold ml-1.5">⚡ פעולה:</span>
                          {a}
                        </div>
                        <div className="text-slate-200 flex items-center gap-1.5 flex-wrap">
                          <span className="text-teal-400 font-bold">📦 חפץ:</span>
                          <span>{o}</span>
                          {!objectValidation.isValid && (
                            <div
                              title={objectValidation.details || objectValidation.message}
                              className="w-full mt-1 flex flex-col gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] font-bold leading-snug"
                            >
                              <div className="flex items-start gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <span>{objectValidation.message}</span>
                              </div>
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => ignoreValidation(objectIgnoreKey)}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900/90 hover:bg-slate-800 text-amber-200 border border-amber-500/40 cursor-pointer transition-colors"
                                >
                                  התעלם במקרה זה
                                </button>
                              </div>
                            </div>
                          )}
                          {hasMajorMismatch && (
                            <div className="w-full mt-1 flex flex-col gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/40 text-sky-200 text-[11px] font-bold leading-snug">
                              <div className="flex items-start gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                                <span>
                                  לתשומת לבך - במודולת MAJOR הגדרת מילה מנמונית אחרת עבור מספר זה ("{majorWord}") ; מומלץ לבחור באותה המילה עבור 2 המודולות
                                </span>
                              </div>
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => ignoreValidation(mismatchIgnoreKey)}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900/90 hover:bg-slate-800 text-sky-200 border border-sky-500/40 cursor-pointer transition-colors"
                                >
                                  התעלם במקרה זה
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {s ? (
                          <div className="text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 mt-2 leading-relaxed">
                            <span className="font-bold text-amber-400 block text-xs mb-0.5">🎬 סצנה שלמה:</span>
                            "{s}"
                          </div>
                        ) : null}
                      </div>

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
                      <th className="py-2.5 px-3 text-center text-pink-400">תמונה</th>
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
                      const p = item.person;
                      const a = item.action;
                      const o = item.object;
                      const s = item.scene || '';
                      const isCustom = Boolean(item.scene);
                      const isHighlighted = highlightedNum === item.number;
                      const initialsInfo = getPAOInitials(item.number, majorDigits);
                      const personIgnoreKey = buildLogicIgnoreKey('pao-person', item.number, p || '');
                      const objectIgnoreKey = buildLogicIgnoreKey('pao-object', item.number, o || '');
                      const rawPersonValidation =
                        p && p.trim() && majorDigits
                          ? validatePAOPerson(p, item.number, majorDigits, connectingLetters)
                          : { isValid: true, message: '' };
                      const personValidation = isIgnored(personIgnoreKey)
                        ? { isValid: true, message: '' }
                        : rawPersonValidation;
                      const rawObjectValidation =
                        o && o.trim() && majorDigits
                          ? validateHebrewLogic(o, item.number, majorDigits, connectingLetters, 'pao')
                          : { isValid: true, message: '' };
                      const objectValidation = isIgnored(objectIgnoreKey)
                        ? { isValid: true, message: '' }
                        : rawObjectValidation;

                      const matchingMajor = majorItems.find((m) => m.number === item.number);
                      const majorWord = matchingMajor?.defaultWord?.trim() || '';
                      const mismatchIgnoreKey = buildLogicIgnoreKey(
                        'major-pao-mismatch',
                        item.number,
                        majorWord,
                        o || ''
                      );
                      const hasMajorMismatch =
                        Boolean(o && o.trim() && majorWord && o.trim() !== majorWord) &&
                        !isIgnored(mismatchIgnoreKey);

                      return (
                        <tr
                          id={`pao-item-${item.number}`}
                          key={item.number}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (dragOverCardNum !== item.number) {
                              setDragOverCardNum(item.number);
                            }
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            if (dragOverCardNum === item.number) {
                              setDragOverCardNum(null);
                            }
                          }}
                          onDrop={async (e) => {
                            e.preventDefault();
                            setDragOverCardNum(null);
                            const file = e.dataTransfer.files?.[0];
                            if (!file || !file.type.startsWith('image/')) return;
                            try {
                              setIsCompressing(true);
                              const comp = await compressImageFile(file);
                              onUpdatePAOItem(item.number, { imageUrl: comp });
                              if (isEditing) setEditImageUrl(comp);
                              onEarnPoints(10, 'העלאת תמונה לשלשת PAO בגרירה');
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setIsCompressing(false);
                            }
                          }}
                          className={`transition-colors ${
                            dragOverCardNum === item.number
                              ? 'bg-indigo-950/80 ring-2 ring-indigo-400'
                              : isHighlighted
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
                              <span
                                className="text-[10px] text-amber-300 font-sans"
                                title={`ראשי תיבות לפי לוגיקת הספרות: ${initialsInfo.fullFormula}`}
                              >
                                ({initialsInfo.initials})
                              </span>
                            </div>
                          </td>

                          {/* Image Thumbnail Cell */}
                          <td className="py-2 px-2 text-center whitespace-nowrap">
                            {item.imageUrl ? (
                              <div
                                onClick={() =>
                                  setSelectedPreviewImage({
                                    url: item.imageUrl!,
                                    title: `שלשת PAO #${item.numberStr}`,
                                    subtitle: `${p} • ${a} • ${o}`,
                                    scene: s,
                                    numberStr: item.numberStr,
                                    number: item.number,
                                  })
                                }
                                className="relative inline-block group cursor-pointer"
                                title="לחץ להגדלה במסך מלא (Light Dismiss)"
                              >
                                <img
                                  src={item.imageUrl}
                                  alt={item.numberStr}
                                  className="w-8 h-8 sm:w-9 sm:h-9 object-cover rounded-lg border border-indigo-500/40 shadow-xs group-hover:scale-110 group-hover:border-indigo-400 transition-all"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity">
                                  <Maximize2 className="w-3 h-3 text-white drop-shadow" />
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={() => {
                                  setQuickUploadItem(item);
                                  setQuickUploadUrl('');
                                  setQuickUploadMode('ai');
                                }}
                                className="w-8 h-8 p-1.5 rounded-xl text-slate-500 hover:text-indigo-400 hover:bg-slate-900 transition-colors cursor-pointer inline-flex items-center justify-center"
                                title="צרף תמונה לשלשה זו"
                              >
                                <ImagePlus className="w-4 h-4 pointer-events-none" />
                              </button>
                            )}
                          </td>

                          <td className="py-2.5 px-3 font-semibold text-slate-200">
                            <div className="flex flex-col gap-1">
                              <span>{p}</span>
                              {!personValidation.isValid && (
                                <div
                                  title={personValidation.details || personValidation.message}
                                  className="inline-flex flex-col gap-1 text-[10px] text-amber-300 bg-amber-500/15 border border-amber-500/40 rounded px-1.5 py-1 font-bold leading-snug max-w-xs"
                                >
                                  <div className="flex items-start gap-1">
                                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                                    <span>{personValidation.message}</span>
                                  </div>
                                  <div className="flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => ignoreValidation(personIgnoreKey)}
                                      className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-amber-200 border border-amber-500/40 cursor-pointer"
                                    >
                                      התעלם במקרה זה
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                            {a}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">
                            <div className="flex flex-col gap-1">
                              <span>{o}</span>
                              {!objectValidation.isValid && (
                                <div
                                  title={objectValidation.details || objectValidation.message}
                                  className="inline-flex flex-col gap-1 text-[10px] text-amber-300 bg-amber-500/15 border border-amber-500/40 rounded px-1.5 py-1 font-bold leading-snug max-w-xs"
                                >
                                  <div className="flex items-start gap-1">
                                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                                    <span>{objectValidation.message}</span>
                                  </div>
                                  <div className="flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => ignoreValidation(objectIgnoreKey)}
                                      className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-amber-200 border border-amber-500/40 cursor-pointer"
                                    >
                                      התעלם במקרה זה
                                    </button>
                                  </div>
                                </div>
                              )}
                              {hasMajorMismatch && (
                                <div className="inline-flex flex-col gap-1 text-[10px] text-sky-200 bg-sky-500/15 border border-sky-500/40 rounded px-1.5 py-1 font-bold leading-snug max-w-xs">
                                  <div className="flex items-start gap-1">
                                    <AlertTriangle className="w-3 h-3 text-sky-400 shrink-0 mt-0.5" />
                                    <span>
                                      לתשומת לבך - במודולת MAJOR הגדרת מילה מנמונית אחרת עבור מספר זה ("{majorWord}") ; מומלץ לבחור באותה המילה עבור 2 המודולות
                                    </span>
                                  </div>
                                  <div className="flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => ignoreValidation(mismatchIgnoreKey)}
                                      className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-sky-200 border border-sky-500/40 cursor-pointer"
                                    >
                                      התעלם במקרה זה
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-xs max-w-xs" title={s}>
                            <span className="text-amber-200/90 truncate block">{s || <span className="text-slate-600">-</span>}</span>
                          </td>

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
                              <button
                                type="button"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setEditingNum(item.number);
                                  setEditPerson(item.person || '');
                                  setEditAction(item.action || '');
                                  setEditObject(item.object || '');
                                  setEditScene(item.scene || '');
                                  setEditImageUrl(item.imageUrl || '');
                                  setEditActionNotice(null);
                                }}
                                className="relative z-10 w-8 h-8 p-1.5 rounded-xl text-slate-300 hover:text-indigo-300 hover:bg-indigo-500/20 border border-transparent hover:border-indigo-500/30 cursor-pointer inline-flex items-center justify-center transition-colors"
                                title="ערוך שלשה בחלון מורחב"
                              >
                                <Edit3 className="w-4 h-4 pointer-events-none" />
                              </button>
                              {isCustom && (
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={() => onResetPAOItem(item.number)}
                                  className="w-8 h-8 p-1.5 rounded-xl text-slate-500 hover:text-rose-400 cursor-pointer inline-flex items-center justify-center"
                                  title="אפס לברירת מחדל"
                                >
                                  <Undo2 className="w-3.5 h-3.5 pointer-events-none" />
                                </button>
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
            {viewMode !== 'gallery' && (
              <div className="hidden lg:flex flex-col gap-1 bg-slate-950 p-2 rounded-2xl border border-slate-800 max-h-[580px] overflow-y-auto no-scrollbar shrink-0 w-16 text-center shadow-inner">
                <span className="text-[9px] font-bold text-slate-400 pb-1 border-b border-slate-800">שלשה</span>
                {paoItems.map((item) => (
                  <button
                    key={item.number}
                    onClick={() => scrollToNumber(item.number)}
                    title={`#${item.numberStr} - ${item.person}`}
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
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: QUIZ */}
      {/* דפוס M3 מספר 3: Fade Through (מעבר קונטקסטואלי מלא למבחן שליפה) */}
      {subView === 'quiz' && (
        <div key="pao-quiz-mode" className="space-y-6 m3-fade-through">
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
                    { id: 'fullScene', label: '🎬 סצנה כולה (6 ספרות / דמות+פעולה+חפץ)', activeCls: 'bg-indigo-600 text-white shadow-sm' },
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

                <div className="flex items-center gap-2 justify-between sm:justify-end flex-wrap">
                  <span className="text-[11px] bg-emerald-500/15 text-emerald-300 font-bold px-2.5 py-1 rounded-xl border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{readyPaoItems.length} מוכנים לתרגול</span>
                  </span>
                  <button
                    onClick={() => setSubView('voice')}
                    className="flex items-center gap-1.5 text-xs text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold px-3 py-1 rounded-xl cursor-pointer shadow-sm transition-transform active:scale-95"
                    title="מבחן שליפה קולי Hands-Free (מתאים לנהיגה/ריצה)"
                  >
                    <Headphones className="w-3 h-3" />
                    <span>מצב קולי (נהיגה)</span>
                  </button>
                  <button
                    onClick={() => handleNextQuizQuestion()}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 bg-slate-800 px-3 py-1 rounded-xl cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>החלף שאלה</span>
                  </button>
                </div>
              </div>

              {/* Non-repeating Quiz Deck Progress Bar */}
              <div className="w-full max-w-4xl mx-auto">
                <QuizDeckProgressBar
                  progress={deckProgress}
                  onResetDeck={() => {
                    resetQuizDeck('workout_pao_single');
                    resetQuizDeck('workout_pao_triplet_p');
                    resetQuizDeck('workout_pao_triplet_a');
                    resetQuizDeck('workout_pao_triplet_o');
                    handleNextQuizQuestion();
                  }}
                  deckTitle="מאגר שלשות PAO"
                />
              </div>

              {/* דפוס M3 מספר 2: Shared Axis - ציר X (מעבר אופקי בשאלות שליפה)
                  נבחר עבור מעבר בין שאלות רצופות במבחן השליפה.
                  לפי Google Material Motion, מעבר בין כרטיסיות שאלות ברצף למידה נע על ציר X
                  האופקי, ומעניק תחושה טבעית של התקדמות פלאשקארד ברצף השליפה. */}
              {currentQuizItem && quizMeta && (
                <div
                  key={`${currentQuizItem.numberStr}-${quizFilter}-${quizFeedback}`}
                  className="w-full max-w-4xl mx-auto space-y-6 text-center m3-shared-axis-x-forward"
                >
                  {/* Dynamic Themed Question Card */}
                  <div className={`p-6 sm:p-8 rounded-3xl ${quizMeta.cardBg} border ${quizMeta.cardBorder} shadow-inner space-y-4 transition-all ${
                    quizFeedback === 'incorrect'
                      ? 'animate-shake ring-2 ring-rose-500/50'
                      : quizFeedback === 'correct'
                      ? 'm3-spring-pop ring-2 ring-emerald-500/50'
                      : ''
                  }`}>
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

                    {quizMeta.isFullScene ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-2">
                        <div className="flex items-center justify-center gap-2.5 sm:gap-4 font-mono text-3xl sm:text-5xl font-black text-white">
                          <div className="flex flex-col items-center">
                            <span className="bg-slate-900 px-3 py-1 rounded-xl text-amber-400 border border-amber-500/30">
                              {quizMeta.digitsP}
                            </span>
                            <span className="text-[10px] font-sans font-bold text-amber-300/90 mt-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              👤 P: {getPAOInitials(parseInt(quizMeta.digitsP || '0', 10) || 0, majorDigits).initials}
                            </span>
                          </div>
                          <span className="text-slate-600 self-center">-</span>
                          <div className="flex flex-col items-center">
                            <span className="bg-slate-900 px-3 py-1 rounded-xl text-purple-400 border border-purple-500/30">
                              {quizMeta.digitsA}
                            </span>
                            <span className="text-[10px] font-sans font-bold text-purple-300/90 mt-1 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                              ⚡ A: {getPAOInitials(parseInt(quizMeta.digitsA || '0', 10) || 0, majorDigits).initials}
                            </span>
                          </div>
                          <span className="text-slate-600 self-center">-</span>
                          <div className="flex flex-col items-center">
                            <span className="bg-slate-900 px-3 py-1 rounded-xl text-teal-400 border border-teal-500/30">
                              {quizMeta.digitsO}
                            </span>
                            <span className="text-[10px] font-sans font-bold text-teal-300/90 mt-1 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                              📦 O: {getPAOInitials(parseInt(quizMeta.digitsO || '0', 10) || 0, majorDigits).initials}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-6 text-[11px] text-slate-400 pt-1 font-semibold">
                          <span className="text-amber-400">דמות (P)</span>
                          <span className="text-purple-400">פעולה קינטית (A)</span>
                          <span className="text-teal-400">חפץ פסיבי (O)</span>
                        </div>
                      </div>
                    ) : quizMeta.isNumberMain ? (
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <div className="text-6xl font-black text-white tracking-wider font-mono">
                          {quizMeta.mainValue}
                        </div>
                        <span className={`text-[11px] font-sans font-bold ${quizMeta.tagColor} px-2.5 py-0.5 rounded-lg border`}>
                          ר"ת: {getPAOInitials(currentQuizItem?.number || 0, majorDigits).initials}
                        </span>
                      </div>
                    ) : (
                      <div className="text-3xl font-black text-white tracking-wide py-2">
                        {quizMeta.mainValue}
                      </div>
                    )}
                  </div>

                  {/* Real-Time PAO Edit Panel */}
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
                          ר"ת: {getPAOInitials(currentQuizItem.number, majorDigits).initials}
                        </span>
                      </div>

                      {/* 3 Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-slate-950/80 border border-orange-500/30 rounded-xl p-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] text-orange-400 font-bold flex items-center gap-1">
                              <User className="w-3 h-3 text-orange-400" />
                              <span>דמות (Person):</span>
                            </label>
                            <AIFieldGeneratorButton
                              promptType="pao_person"
                              inputContext={currentQuizItem.number.toString()}
                              paoContext={{
                                number: currentQuizItem.numberStr,
                                person: quizEditPerson,
                                action: quizEditAction,
                                object: quizEditObject,
                                scene: quizEditScene,
                              }}
                              customDigits={majorDigits}
                              connectingLetters={connectingLetters}
                              onGenerated={(val) => {
                                setQuizEditPerson(val);
                                setQuizActionNotice(null);
                              }}
                              label="AI"
                              compact
                            />
                          </div>
                          <input
                            type="text"
                            value={quizEditPerson}
                            onChange={(e) => {
                              setQuizEditPerson(e.target.value);
                              if (e.target.value.trim()) setQuizActionNotice(null);
                            }}
                            placeholder="שם הדמות..."
                            className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>

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
                              paoContext={{
                                number: currentQuizItem.numberStr,
                                person: quizEditPerson,
                                action: quizEditAction,
                                object: quizEditObject,
                                scene: quizEditScene,
                              }}
                              customDigits={majorDigits}
                              connectingLetters={connectingLetters}
                              onGenerated={(val) => setQuizEditAction(val)}
                              onNotice={(note) => setQuizActionNotice(note)}
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
                          {quizActionNotice && (
                            <p className="text-[11px] text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded-lg px-2 py-1 mt-1 leading-snug">
                              ⚠️ {quizActionNotice}
                            </p>
                          )}
                        </div>

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
                              paoContext={{
                                number: currentQuizItem.numberStr,
                                person: quizEditPerson,
                                action: quizEditAction,
                                object: quizEditObject,
                                scene: quizEditScene,
                              }}
                              customDigits={majorDigits}
                              connectingLetters={connectingLetters}
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

                      <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>סצנה שלמה (תיאור חופשי ורב-חושי לפי עקרון SEE):</span>
                          </label>
                          <AIFieldGeneratorButton
                            promptType="pao_scene"
                            inputContext={currentQuizItem.number.toString()}
                            extraContext={`אדם: ${quizEditPerson} | פעולה: ${quizEditAction} | חפץ: ${quizEditObject}`}
                            paoContext={{
                              number: currentQuizItem.numberStr,
                              person: quizEditPerson,
                              action: quizEditAction,
                              object: quizEditObject,
                              scene: quizEditScene,
                            }}
                            customDigits={majorDigits}
                            connectingLetters={connectingLetters}
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

                      {/* Image Attachment in Quiz Edit */}
                      <div className="bg-slate-950/80 border border-pink-500/30 rounded-xl p-3 space-y-2">
                        <label className="text-[11px] text-pink-300 font-bold flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                          <span>תמונה ויזואלית לסצנה (העלאה מקובץ או קישור URL):</span>
                        </label>
                        <div className="flex items-center gap-2">
                          {quizEditImageUrl && (
                            <div className="relative group shrink-0">
                              <img
                                src={quizEditImageUrl}
                                alt="תצוגה מקדימה"
                                className="w-11 h-11 object-cover rounded-lg border border-pink-500/40"
                              />
                              <button
                                type="button"
                                onClick={() => setQuizEditImageUrl('')}
                                className="absolute -top-1 -right-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-0.5 cursor-pointer shadow"
                                title="הסר תמונה"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                          <label className="py-1.5 px-3 rounded-lg border border-dashed border-indigo-500/50 hover:border-indigo-400 bg-indigo-950/30 text-xs text-indigo-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all">
                            <Upload className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{isCompressing ? 'דוחס תמונה...' : 'בחר תמונה מהמכשיר'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={isCompressing}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  setIsCompressing(true);
                                  const comp = await compressImageFile(file);
                                  setQuizEditImageUrl(comp);
                                } catch (err) {
                                  console.error(err);
                                } finally {
                                  setIsCompressing(false);
                                }
                              }}
                            />
                          </label>
                          <input
                            type="url"
                            value={quizEditImageUrl.startsWith('data:') ? '' : quizEditImageUrl}
                            onChange={(e) => setQuizEditImageUrl(e.target.value)}
                            placeholder="או הדבק כתובת URL לתמונה..."
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>

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
                          onClick={() => handleSaveQuizEdit()}
                          className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-900/30 transition-all"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>שמור שינויים בזמן אמת</span>
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
                          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                            e.preventDefault();
                            setRevealQuizAnswer(true);
                            return;
                          }
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
                      <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex flex-col items-center justify-center gap-1.5 animate-pop shadow-md">
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
                      <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 flex flex-col items-center justify-center gap-1.5 animate-shake shadow-md">
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
                            {quizMeta.isFullScene
                              ? `שלשת PAO המאוחדת לרצף ${quizMeta.digitsP}-${quizMeta.digitsA}-${quizMeta.digitsO}:`
                              : `שלשת PAO המלאה למספר ${currentQuizItem?.numberStr}:`}
                          </span>
                          {!quizMeta.isFullScene && currentQuizItem && (
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
                                ר"ת: {getPAOInitials(currentQuizItem.number, majorDigits).initials}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Triplet Grid with highlight for the tested dimension */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center pt-1">
                          <div
                            className={`p-3 rounded-xl border transition-all ${
                              quizMeta.testedField === 'person' || quizMeta.isFullScene
                                ? 'bg-orange-500/25 border-orange-400 ring-2 ring-orange-400/40 shadow-md shadow-orange-500/10'
                                : 'bg-orange-500/10 border-orange-500/30 opacity-80'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-orange-400 font-bold flex items-center gap-1">
                                <User className="w-3 h-3 text-orange-400" />
                                <span>דמות (P):</span>
                              </span>
                              <span className="text-[9px] font-mono text-orange-300 font-bold">
                                #{quizMeta.isFullScene ? quizMeta.digitsP : currentQuizItem?.numberStr}
                              </span>
                            </div>
                            <strong className="text-white text-xs block mt-1.5">
                              {quizMeta.isFullScene ? quizMeta.pItem?.person : currentQuizItem?.person}
                            </strong>
                          </div>

                          <div
                            className={`p-3 rounded-xl border transition-all ${
                              quizMeta.testedField === 'action' || quizMeta.isFullScene
                                ? 'bg-purple-500/25 border-purple-400 ring-2 ring-purple-400/40 shadow-md shadow-purple-500/10'
                                : 'bg-purple-500/10 border-purple-500/30 opacity-80'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-purple-400 font-bold flex items-center gap-1">
                                <Zap className="w-3 h-3 text-purple-400" />
                                <span>פעולה (A):</span>
                              </span>
                              <span className="text-[9px] font-mono text-purple-300 font-bold">
                                #{quizMeta.isFullScene ? quizMeta.digitsA : currentQuizItem?.numberStr}
                              </span>
                            </div>
                            <strong className="text-white text-xs block mt-1.5">
                              {quizMeta.isFullScene ? quizMeta.aItem?.action : currentQuizItem?.action}
                            </strong>
                          </div>

                          <div
                            className={`p-3 rounded-xl border transition-all ${
                              quizMeta.testedField === 'object' || quizMeta.isFullScene
                                ? 'bg-teal-500/25 border-teal-400 ring-2 ring-teal-400/40 shadow-md shadow-teal-500/10'
                                : 'bg-teal-500/10 border-teal-500/30 opacity-80'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-teal-400 font-bold flex items-center gap-1">
                                <Package className="w-3 h-3 text-teal-400" />
                                <span>חפץ (O):</span>
                              </span>
                              <span className="text-[9px] font-mono text-teal-300 font-bold">
                                #{quizMeta.isFullScene ? quizMeta.digitsO : currentQuizItem?.numberStr}
                              </span>
                            </div>
                            <strong className="text-white text-xs block mt-1.5">
                              {quizMeta.isFullScene ? quizMeta.oItem?.object : currentQuizItem?.object}
                            </strong>
                          </div>
                        </div>

                        {/* Scene text & Visual Image representation */}
                        <div className="space-y-2">
                          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200">
                            ⚡ <strong className="text-amber-400">סצנה מנטלית:</strong>{' '}
                            "{quizMeta.isFullScene
                              ? `${quizMeta.pItem?.person} ${quizMeta.aItem?.action} ${quizMeta.oItem?.object}`
                              : `${currentQuizItem?.person} ${currentQuizItem?.action} ${currentQuizItem?.object}`}"
                          </div>

                          {/* Visual Scene Image in Quiz Feedback */}
                          {!quizMeta.isFullScene && currentQuizItem && (
                            <div>
                              {currentQuizItem.imageUrl ? (
                                <div className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-500/30 rounded-2xl p-3 flex flex-col sm:flex-row items-center gap-3.5 text-right">
                                  <div
                                    onClick={() =>
                                      setSelectedPreviewImage({
                                        url: currentQuizItem.imageUrl!,
                                        title: `שלשת PAO #${currentQuizItem.numberStr}`,
                                        subtitle: `${currentQuizItem.person} • ${currentQuizItem.action} • ${currentQuizItem.object}`,
                                        scene: currentQuizItem.scene || `${currentQuizItem.person} ${currentQuizItem.action} ${currentQuizItem.object}`,
                                        numberStr: currentQuizItem.numberStr,
                                        number: currentQuizItem.number,
                                      })
                                    }
                                    className="relative group cursor-pointer shrink-0"
                                    title="לחץ להגדלה במסך מלא (Light Dismiss)"
                                  >
                                    <img
                                      src={currentQuizItem.imageUrl}
                                      alt={`סצנה ${currentQuizItem.numberStr}`}
                                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border-2 border-pink-500/40 shadow-lg group-hover:scale-105 group-hover:border-pink-400 transition-all"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center transition-opacity">
                                      <Maximize2 className="w-5 h-5 text-white drop-shadow" />
                                    </div>
                                    <span className="absolute bottom-1 right-1 text-[9px] bg-black/75 text-pink-200 px-1.5 py-0.5 rounded backdrop-blur-xs font-mono">
                                      מסך מלא 🔍
                                    </span>
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-pink-300 flex items-center gap-1.5">
                                        <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                                        <span>הדימוי הויזואלי של הסצנה:</span>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setQuickUploadItem(currentQuizItem);
                                          setQuickUploadUrl(currentQuizItem.imageUrl || '');
                                        }}
                                        className="text-[10px] text-slate-400 hover:text-pink-300 underline cursor-pointer"
                                      >
                                        החלף תמונה
                                      </button>
                                    </div>
                                    <p className="text-xs text-slate-300 italic leading-relaxed">
                                      "{currentQuizItem.scene || `${currentQuizItem.person} ${currentQuizItem.action} ${currentQuizItem.object}`}"
                                    </p>
                                    <span className="text-[10px] text-slate-400 block pt-0.5">
                                      לחץ על התמונה להצגה במסך מלא ברזולוציה גבוהה
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-2.5 rounded-xl bg-slate-900/50 border border-dashed border-slate-800 flex items-center justify-between text-xs text-slate-400">
                                  <span className="flex items-center gap-1.5 text-slate-400">
                                    <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                                    <span>עדיין לא צורפה תמונה ויזואלית לסצנה זו</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuickUploadItem(currentQuizItem);
                                      setQuickUploadUrl('');
                                    }}
                                    className="text-[11px] text-pink-300 hover:text-white font-semibold bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                                  >
                                    <ImagePlus className="w-3 h-3" />
                                    <span>+ צרף תמונה עכשיו</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Full scene images if applicable */}
                          {quizMeta.isFullScene && (
                            <div className="flex flex-wrap items-center gap-3 pt-1">
                              {[
                                { item: quizMeta.pItem, role: '👤 P (דמות)' },
                                { item: quizMeta.aItem, role: '⚡ A (פעולה)' },
                                { item: quizMeta.oItem, role: '📦 O (חפץ)' },
                              ].map(
                                ({ item, role }) =>
                                  item?.imageUrl && (
                                    <div
                                      key={item.number}
                                      onClick={() =>
                                        setSelectedPreviewImage({
                                          url: item.imageUrl!,
                                          title: `שלשת PAO #${item.numberStr} (${role})`,
                                          subtitle: `${item.person} • ${item.action} • ${item.object}`,
                                          scene: item.scene,
                                          numberStr: item.numberStr,
                                          number: item.number,
                                        })
                                      }
                                      className="relative group cursor-pointer"
                                      title="לחץ להגדלה במסך מלא (Light Dismiss)"
                                    >
                                      <img
                                        src={item.imageUrl}
                                        alt={item.numberStr}
                                        className="w-14 h-14 object-cover rounded-xl border border-indigo-500/40 shadow group-hover:scale-105 transition-all"
                                      />
                                      <span className="text-[9px] text-slate-300 block text-center pt-0.5">
                                        #{item.numberStr}
                                      </span>
                                    </div>
                                  )
                              )}
                            </div>
                          )}
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

      {/* SUB-VIEW 4: HANDS-FREE VOICE QUIZ */}
      {subView === 'voice' && (
        <PAOHandsFreeVoiceQuiz
          readyItems={readyPaoItems}
          allPaoItems={paoItems}
          onEarnPoints={onEarnPoints}
          onClose={() => setSubView('registry')}
        />
      )}

      {/* Light-Dismiss Full-Screen Image Modal */}
      {selectedPreviewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedPreviewImage(null);
            }
          }}
        >
          {/* דפוס M3 מספר 1: Container Transform (טרנספורמציית קונטיינר) */}
          <div
            className="relative w-full max-w-6xl xl:max-w-7xl bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] m3-container-transform"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-3">
                {selectedPreviewImage.numberStr && (
                  <span className="font-mono text-base font-black px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    #{selectedPreviewImage.numberStr}
                  </span>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-sm sm:text-base">
                      {selectedPreviewImage.title}
                    </h3>
                    {itemsWithImages.length > 1 && (
                      <span className="text-[11px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-lg">
                        {itemsWithImages.findIndex((it) => it.number === selectedPreviewImage.number) + 1} מתוך {itemsWithImages.length}
                      </span>
                    )}
                  </div>
                  {selectedPreviewImage.subtitle && (
                    <p className="text-xs text-slate-400">
                      {selectedPreviewImage.subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons: Replace, Delete, Close */}
              <div className="flex items-center gap-2">
                {(() => {
                  const targetItemNumber =
                    typeof selectedPreviewImage.number === 'number'
                      ? selectedPreviewImage.number
                      : selectedPreviewImage.numberStr !== undefined
                      ? parseInt(selectedPreviewImage.numberStr, 10)
                      : NaN;
                  const canManageItem = !isNaN(targetItemNumber) && targetItemNumber >= 0 && targetItemNumber <= 99;

                  if (!canManageItem) return null;

                  return (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalIsEditing((prev) => !prev);
                          setModalNewImageUrl(selectedPreviewImage.url);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          modalIsEditing
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30'
                        }`}
                        title="החלף תמונה לשלשת PAO זו"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{modalIsEditing ? 'סגור החלפה' : 'החלף תמונה'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdatePAOItem(targetItemNumber, {
                            imageUrl: '',
                          });
                          setSelectedPreviewImage(null);
                          setModalIsEditing(false);
                          setModalNewImageUrl('');
                          setConfirmDeleteModal(false);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                        title="מחק תמונה זו לחלוטין"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>מחק תמונה</span>
                      </button>
                    </>
                  );
                })()}

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPreviewImage(null);
                    setModalIsEditing(false);
                    setConfirmDeleteModal(false);
                  }}
                  className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="סגור (Esc או לחיצה מחוץ לתמונה)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* In-Modal Image Replace Drawer */}
            {modalIsEditing && typeof selectedPreviewImage.number === 'number' && (
              <div className="bg-slate-950/95 border-b border-indigo-500/30 p-4 sm:p-6 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-indigo-400" />
                    <span>החלפת תמונה לשלשת PAO #{selectedPreviewImage.numberStr}:</span>
                  </span>

                  {/* Mode switcher: AI Generation vs Upload File */}
                  <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-2xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setModalImageMode('ai')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        modalImageMode === 'ai'
                          ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>יצירה עם Gemini</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalImageMode('upload')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        modalImageMode === 'upload'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      📁 העלאת קובץ
                    </button>
                  </div>
                </div>

                {modalImageMode === 'upload' ? (
                  <>
                    {/* Big Drag and Drop Container Matching Reference Image */}
                    <ImageDropzone
                      isProcessing={modalIsCompressing}
                      title="בחר קובץ או גרור לכאן להחלפת התמונה"
                      subtitle="Choose a file or drag it here • JPG, PNG, WebP"
                      onImageSelected={async (file) => {
                        try {
                          setModalIsCompressing(true);
                          const comp = await compressImageFile(file);
                          if (typeof selectedPreviewImage.number === 'number') {
                            onUpdatePAOItem(selectedPreviewImage.number, {
                              imageUrl: comp,
                            });
                            setSelectedPreviewImage((prev) => (prev ? { ...prev, url: comp } : null));
                            setModalIsEditing(false);
                            onEarnPoints(10, 'עדכון תמונה ויזואלית לסצנה');
                          }
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setModalIsCompressing(false);
                        }
                      }}
                    />

                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                      <span className="text-xs text-slate-400 shrink-0">או הדבק קישור (URL) לתמונה:</span>
                      <input
                        type="url"
                        value={modalNewImageUrl.startsWith('data:') ? '' : modalNewImageUrl}
                        onChange={(e) => setModalNewImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && modalNewImageUrl.trim()) {
                            e.preventDefault();
                            if (typeof selectedPreviewImage.number === 'number') {
                              onUpdatePAOItem(selectedPreviewImage.number, {
                                imageUrl: modalNewImageUrl.trim(),
                              });
                              setSelectedPreviewImage((prev) =>
                                prev ? { ...prev, url: modalNewImageUrl.trim() } : null
                              );
                              setModalIsEditing(false);
                              onEarnPoints(10, 'עדכון תמונה ויזואלית לסצנה');
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        disabled={!modalNewImageUrl || modalNewImageUrl === selectedPreviewImage.url}
                        onClick={() => {
                          if (typeof selectedPreviewImage.number === 'number' && modalNewImageUrl) {
                            onUpdatePAOItem(selectedPreviewImage.number, {
                              imageUrl: modalNewImageUrl.trim(),
                            });
                            setSelectedPreviewImage((prev) =>
                              prev ? { ...prev, url: modalNewImageUrl.trim() } : null
                            );
                            setModalIsEditing(false);
                            onEarnPoints(10, 'עדכון תמונה ויזואלית לסצנה');
                          }
                        }}
                        className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all shrink-0"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>שמור קישור</span>
                      </button>
                    </div>
                  </>
                ) : (
                  (() => {
                    const currentPaoItem = typeof selectedPreviewImage.number === 'number'
                      ? paoItems.find((p) => p.number === selectedPreviewImage.number)
                      : null;

                    return (
                      <PAOImageGeneratorTab
                        numberStr={selectedPreviewImage.numberStr || String(selectedPreviewImage.number || '')}
                        person={currentPaoItem?.person || ''}
                        action={currentPaoItem?.action || ''}
                        object={currentPaoItem?.object || ''}
                        scene={currentPaoItem?.scene || ''}
                        currentUser={currentUser}
                        onLogin={onLogin}
                        onImageGenerated={(generatedUrl) => {
                          if (typeof selectedPreviewImage.number === 'number') {
                            onUpdatePAOItem(selectedPreviewImage.number, {
                              imageUrl: generatedUrl,
                            });
                            setSelectedPreviewImage((prev) =>
                              prev ? { ...prev, url: generatedUrl } : null
                            );
                            setModalIsEditing(false);
                            onEarnPoints(15, 'יצירת תמונה מנמונית עם Gemini');
                          }
                        }}
                      />
                    );
                  })()
                )}
              </div>
            )}

            {/* High-Resolution Image Viewport with drag-and-drop replacement */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsModalDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsModalDragOver(false);
              }}
              onDrop={async (e) => {
                e.preventDefault();
                setIsModalDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (!file || !file.type.startsWith('image/')) return;
                try {
                  setModalIsCompressing(true);
                  const comp = await compressImageFile(file);
                  if (typeof selectedPreviewImage.number === 'number') {
                    onUpdatePAOItem(selectedPreviewImage.number, { imageUrl: comp });
                    setSelectedPreviewImage((prev) => (prev ? { ...prev, url: comp } : null));
                    setModalIsEditing(false);
                    onEarnPoints(10, 'עדכון תמונה ויזואלית לסצנה');
                  }
                } catch (err) {
                  console.error(err);
                } finally {
                  setModalIsCompressing(false);
                }
              }}
              className="relative flex-1 overflow-auto p-4 flex items-center justify-center bg-black/60 min-h-[300px]"
            >
              {isModalDragOver && (
                <div className="absolute inset-0 z-20 bg-indigo-950/85 border-4 border-dashed border-indigo-400 rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
                  <Upload className="w-12 h-12 text-indigo-300 animate-bounce mb-3" />
                  <span className="text-lg font-black text-white">שחרר כאן להחלפת התמונה!</span>
                  <span className="text-xs text-indigo-200 mt-1">שלשת PAO #{selectedPreviewImage.numberStr}</span>
                </div>
              )}
              {/* Prev / Next Gallery Navigation Buttons */}
              {itemsWithImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateGallery('prev');
                    }}
                    title="תמונה קודמת (מקש חץ שמאלה)"
                    className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-slate-950/80 hover:bg-indigo-600 text-white border border-slate-700/80 shadow-2xl backdrop-blur-sm cursor-pointer hover:scale-110 active:scale-95 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateGallery('next');
                    }}
                    title="תמונה הבאה (מקש חץ ימינה)"
                    className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-slate-950/80 hover:bg-indigo-600 text-white border border-slate-700/80 shadow-2xl backdrop-blur-sm cursor-pointer hover:scale-110 active:scale-95 transition-all"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </>
              )}

              <img
                src={selectedPreviewImage.url}
                alt={selectedPreviewImage.title}
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl shadow-2xl border border-slate-800"
              />
            </div>

            {/* Gallery Thumbnail Filmstrip */}
            {itemsWithImages.length > 1 && (
              <div className="p-2.5 border-t border-slate-800 bg-slate-950/90 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[10px] text-slate-400 font-bold shrink-0 ml-1">גלריה ({itemsWithImages.length}):</span>
                {itemsWithImages.map((gItem) => {
                  const isCurrent = gItem.number === selectedPreviewImage.number;
                  return (
                    <button
                      key={gItem.number}
                      type="button"
                      onClick={() => {
                        setSelectedPreviewImage({
                          url: gItem.imageUrl || '',
                          title: `שלשת PAO #${gItem.numberStr}${gItem.person ? ` - ${gItem.person}` : ''}`,
                          subtitle: `${gItem.person || ''} • ${gItem.action || ''} • ${gItem.object || ''}`,
                          scene: gItem.scene || '',
                          numberStr: gItem.numberStr,
                          number: gItem.number,
                        });
                        setModalIsEditing(false);
                      }}
                      className={`relative shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-indigo-400 ring-2 ring-indigo-400/50 scale-105'
                          : 'border-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100'
                      }`}
                      title={`#${gItem.numberStr} ${gItem.person || ''}`}
                    >
                      <img src={gItem.imageUrl} alt="" className="w-9 h-9 object-cover" />
                      <span className="absolute bottom-0 right-0 bg-black/85 text-[8px] font-mono font-bold text-white px-1">
                        {gItem.numberStr}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Modal Footer with Scene Details */}
            {selectedPreviewImage.scene && (
              <div className="p-4 border-t border-slate-800 bg-slate-950/80 text-right space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>סצנה מנטלית:</span>
                </div>
                <p className="text-xs text-slate-200 italic leading-relaxed">
                  "{selectedPreviewImage.scene}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Image Upload Modal */}
      {quickUploadItem && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 md:p-8 animate-fadeIn overflow-y-auto"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setQuickUploadItem(null);
            }
          }}
        >
          {/* דפוס M3 מספר 1: Container Transform (טרנספורמציית קונטיינר) */}
          <div
            className="w-full max-w-6xl xl:max-w-7xl max-h-[92vh] overflow-y-auto bg-slate-900 border-2 border-pink-500/40 rounded-3xl p-5 sm:p-7 text-right space-y-5 shadow-2xl m3-container-transform my-auto"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                    <span>תמונה ויזואלית לסצנת שלשת PAO</span>
                    <span className="font-mono text-sm px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-black">
                      #{quickUploadItem.numberStr}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    הצמד דימוי מנמוני חי או צור תמונה ייחודית בעזרת Gemini
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickUploadItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
                title="סגור חלון"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div><strong className="text-amber-400">👤 אדם:</strong> {quickUploadItem.person || '(ריק)'}</div>
                <div><strong className="text-purple-400">⚡ פעולה:</strong> {quickUploadItem.action || '(ריק)'}</div>
                <div><strong className="text-teal-400">📦 חפץ:</strong> {quickUploadItem.object || '(ריק)'}</div>
              </div>
              {quickUploadItem.scene && (
                <div className="pt-2 border-t border-slate-800/80 leading-relaxed">
                  <strong className="text-amber-300">🎬 סצנה שלמה:</strong> {quickUploadItem.scene}
                </div>
              )}
            </div>

            {/* Mode Switcher: AI Generation vs Upload File */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setQuickUploadMode('ai')}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  quickUploadMode === 'ai' ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>יצירת תמונה עם Gemini</span>
              </button>
              <button
                type="button"
                onClick={() => setQuickUploadMode('upload')}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  quickUploadMode === 'upload' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                📁 העלאת קובץ מהמכשיר
              </button>
            </div>

            {quickUploadMode === 'upload' ? (
              /* Image Preview & Upload Input */
              <div className="space-y-4">
                {(quickUploadUrl || quickUploadItem.imageUrl) && quickUploadUrl !== 'REMOVE' && (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="relative group">
                      <img
                        src={quickUploadUrl || quickUploadItem.imageUrl}
                        alt="סצנה"
                        className="w-44 h-44 object-cover rounded-2xl border-2 border-indigo-500/50 shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => setQuickUploadUrl('REMOVE')}
                        className="absolute -top-2 -right-2 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-1.5 cursor-pointer shadow hover:scale-110 transition-transform"
                        title="הסר תמונה"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setQuickUploadUrl('REMOVE')}
                      className="px-3 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>מחק תמונה</span>
                    </button>
                  </div>
                )}

                {/* Big tactile drag-and-drop container matching user's reference */}
                <ImageDropzone
                  isProcessing={isCompressing}
                  title={
                    (quickUploadUrl || quickUploadItem.imageUrl) && quickUploadUrl !== 'REMOVE'
                      ? "בחר קובץ או גרור לכאן להחלפת התמונה"
                      : "בחר קובץ או גרור לכאן"
                  }
                  subtitle="Choose a file or drag it here • JPG, PNG, WebP"
                  onImageSelected={async (file) => {
                    try {
                      setIsCompressing(true);
                      const compressed = await compressImageFile(file);
                      setQuickUploadUrl(compressed);
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setIsCompressing(false);
                    }
                  }}
                />

                <div className="space-y-1">
                  <label className="block text-xs text-slate-400">
                    או הדבק קישור (URL) לתמונה באינטרנט:
                  </label>
                  <input
                    type="url"
                    value={quickUploadUrl === 'REMOVE' ? '' : quickUploadUrl.startsWith('data:') ? '' : quickUploadUrl}
                    onChange={(e) => setQuickUploadUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            ) : (
              <PAOImageGeneratorTab
                numberStr={quickUploadItem.numberStr}
                person={quickUploadItem.person}
                action={quickUploadItem.action}
                object={quickUploadItem.object}
                scene={quickUploadItem.scene}
                currentUser={currentUser}
                onLogin={onLogin}
                onImageGenerated={(generatedUrl) => {
                  setQuickUploadUrl(generatedUrl);
                  onUpdatePAOItem(quickUploadItem.number, {
                    imageUrl: generatedUrl,
                  });
                  setQuickUploadItem(null);
                  onEarnPoints(15, 'יצירת תמונה מנמונית עם Gemini');
                }}
              />
            )}

            {/* Modal Bottom Action Bar */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setQuickUploadItem(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer transition-colors"
              >
                {quickUploadMode === 'ai' ? 'סגור חלון' : 'ביטול'}
              </button>
              {/* Only show the manual save button in upload mode. In AI mode, the single save button is inside the generated image card */}
              {quickUploadMode === 'upload' && (
                <button
                  type="button"
                  onClick={() => {
                    const finalUrl = quickUploadUrl === 'REMOVE' ? '' : quickUploadUrl || quickUploadItem.imageUrl || '';
                    onUpdatePAOItem(quickUploadItem.number, {
                      imageUrl: finalUrl,
                    });
                    setQuickUploadItem(null);
                    setQuickUploadUrl('');
                  }}
                  className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer shadow-md transition-all active:scale-95"
                >
                  שמור תמונה
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Expanded Centered PAO Edit Modal (with Light Dismiss via mousedown outside or Escape) */}
      {editingNum !== null && (() => {
        const editingItem = paoItems.find((p) => p.number === editingNum);
        if (!editingItem) return null;
        const initialsInfo = getPAOInitials(editingItem.number, majorDigits);
        const modalPersonIgnoreKey = buildLogicIgnoreKey('pao-person', editingItem.number, editPerson);
        const modalObjectIgnoreKey = buildLogicIgnoreKey('pao-object', editingItem.number, editObject);
        const rawModalPersonValidation =
          editPerson.trim() && majorDigits
            ? validatePAOPerson(editPerson, editingItem.number, majorDigits, connectingLetters)
            : { isValid: true, message: '' };
        const modalPersonValidation = isIgnored(modalPersonIgnoreKey)
          ? { isValid: true, message: '' }
          : rawModalPersonValidation;
        const rawModalObjectValidation =
          editObject.trim() && majorDigits
            ? validateHebrewLogic(editObject, editingItem.number, majorDigits, connectingLetters, 'pao')
            : { isValid: true, message: '' };
        const modalObjectValidation = isIgnored(modalObjectIgnoreKey)
          ? { isValid: true, message: '' }
          : rawModalObjectValidation;

        const modalMatchingMajor = majorItems.find((m) => m.number === editingItem.number);
        const modalMajorWord = modalMatchingMajor?.defaultWord?.trim() || '';
        const modalMismatchIgnoreKey = buildLogicIgnoreKey(
          'major-pao-mismatch',
          editingItem.number,
          modalMajorWord,
          editObject
        );
        const modalHasMajorMismatch =
          Boolean(editObject.trim() && modalMajorWord && editObject.trim() !== modalMajorWord) &&
          !isIgnored(modalMismatchIgnoreKey);

        return (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 md:p-8 animate-fadeIn overflow-y-auto"
            dir="rtl"
            onMouseDown={(e) => {
              // Light Dismiss: Close ONLY if the initial mousedown occurred outside the modal container
              if (e.target === e.currentTarget) {
                setEditingNum(null);
                setEditImageUrl('');
                setEditActionNotice(null);
              }
            }}
          >
            <div
              className="w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-slate-900 border-2 border-indigo-500/50 rounded-3xl p-5 sm:p-7 text-right space-y-5 shadow-2xl m3-container-transform my-auto"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-2xl sm:text-3xl font-black text-indigo-300 bg-indigo-500/15 px-3.5 py-1.5 rounded-2xl border border-indigo-500/30 shadow-inner">
                    #{editingItem.numberStr}
                  </span>
                  <div>
                    <h3 className="text-base sm:text-xl font-black text-white flex items-center gap-2 flex-wrap">
                      <span>עריכת שלשת PAO</span>
                      <span
                        title={`ראשי תיבות לפי מיפוי הספרות האישי: ${initialsInfo.fullFormula}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs"
                      >
                        <span className="text-amber-400/80 font-normal">ראשי תיבות נדרשים:</span>
                        <span>{initialsInfo.initials}</span>
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      נוסחת המיפוי האישי למספר {editingItem.numberStr}: <strong className="text-slate-200">{initialsInfo.fullFormula}</strong> • לחץ מחוץ לחלון או <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] font-mono text-slate-300">Esc</kbd> לסגירה מהירה
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetPAOItem(editingItem.number);
                      setEditingNum(null);
                      setEditImageUrl('');
                      setEditActionNotice(null);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-300 bg-slate-950 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-500/30 flex items-center gap-1.5 cursor-pointer transition-all"
                    title="אפס שלשה זו לברירת המחדל"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>איפוס לברירת מחדל</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNum(null);
                      setEditImageUrl('');
                      setEditActionNotice(null);
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
                    title="סגור חלון (Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 3 Main PAO Fields in Expanded Horizontal Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Person */}
                <div className="bg-slate-950/90 border border-amber-500/30 rounded-2xl p-4 space-y-2 shadow-inner">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs sm:text-sm text-amber-400 font-black flex items-center gap-1.5">
                      <User className="w-4 h-4 text-amber-400" />
                      <span>👤 אדם (Person):</span>
                    </label>
                    <AIFieldGeneratorButton
                      promptType="pao_person"
                      inputContext={editingItem.number.toString()}
                      paoContext={{
                        number: editingItem.numberStr,
                        person: editPerson,
                        action: editAction,
                        object: editObject,
                        scene: editScene,
                      }}
                      customDigits={majorDigits}
                      connectingLetters={connectingLetters}
                      onGenerated={(val) => {
                        setEditPerson(val);
                        setEditActionNotice(null);
                      }}
                      label="אדם עם AI"
                      compact
                    />
                  </div>
                  <input
                    type="text"
                    value={editPerson}
                    onChange={(e) => {
                      setEditPerson(e.target.value);
                      if (e.target.value.trim()) setEditActionNotice(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveItem(editingItem.number);
                      }
                    }}
                    placeholder={`דמות אמיתית/בדיונית בראשי תיבות ${initialsInfo.initials}...`}
                    className={`w-full bg-slate-900 border ${
                      !modalPersonValidation.isValid
                        ? 'border-amber-500 focus:border-amber-400'
                        : 'border-slate-700 focus:border-amber-500'
                    } focus:ring-1 focus:ring-amber-500/30 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white placeholder-slate-500`}
                  />
                  {!modalPersonValidation.isValid ? (
                    <div className="text-[11px] text-amber-300 bg-amber-500/15 border border-amber-500/35 rounded-xl px-2.5 py-2 leading-snug flex flex-col gap-1.5">
                      <div className="flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{modalPersonValidation.message}</span>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => ignoreValidation(modalPersonIgnoreKey)}
                          className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-200 border border-amber-500/40 cursor-pointer transition-colors"
                        >
                          התעלם במקרה זה
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      שם פרטי ומשפחה המתחילים באותיות המיפוי ({initialsInfo.initials}).
                    </p>
                  )}
                </div>

                {/* 2. Action */}
                <div className="bg-slate-950/90 border border-purple-500/30 rounded-2xl p-4 space-y-2 shadow-inner">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs sm:text-sm text-purple-400 font-black flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span>⚡ פעולה (Action):</span>
                    </label>
                    <AIFieldGeneratorButton
                      promptType="pao_action"
                      inputContext={editingItem.number.toString()}
                      extraContext={editPerson}
                      paoContext={{
                        number: editingItem.numberStr,
                        person: editPerson,
                        action: editAction,
                        object: editObject,
                        scene: editScene,
                      }}
                      customDigits={majorDigits}
                      connectingLetters={connectingLetters}
                      onGenerated={(val) => setEditAction(val)}
                      onNotice={(note) => setEditActionNotice(note)}
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
                        handleSaveItem(editingItem.number);
                      }
                    }}
                    placeholder={
                      editPerson.trim()
                        ? `פעולה המזוהה עם ${editPerson}...`
                        : 'פעולה דינמית (הזן אדם להתאמה אישית)...'
                    }
                    className="w-full bg-slate-900 border border-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white placeholder-slate-500"
                  />
                  {editActionNotice ? (
                    <div className="text-[11px] text-amber-300 bg-amber-500/15 border border-amber-500/35 rounded-xl px-2.5 py-1.5 leading-snug flex items-start gap-1.5 animate-fadeIn">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{editActionNotice}</span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      פעולה המאפיינת באופן מובהק את האדם שנבחר (אם שדה האדם ריק תוצע פעולה אקראית).
                    </p>
                  )}
                </div>

                {/* 3. Object */}
                <div className="bg-slate-950/90 border border-teal-500/30 rounded-2xl p-4 space-y-2 shadow-inner">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs sm:text-sm text-teal-400 font-black flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-teal-400" />
                      <span>📦 חפץ (Object):</span>
                    </label>
                    <AIFieldGeneratorButton
                      promptType="pao_object"
                      inputContext={editingItem.number.toString()}
                      extraContext={editPerson}
                      paoContext={{
                        number: editingItem.numberStr,
                        person: editPerson,
                        action: editAction,
                        object: editObject,
                        scene: editScene,
                      }}
                      customDigits={majorDigits}
                      connectingLetters={connectingLetters}
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
                        handleSaveItem(editingItem.number);
                      }
                    }}
                    placeholder="חפץ מוחשי מעיצורי המספר ואותיות חיבור בלבד..."
                    className={`w-full bg-slate-900 border ${
                      !modalObjectValidation.isValid || modalHasMajorMismatch
                        ? 'border-amber-500 focus:border-amber-400'
                        : 'border-slate-700 focus:border-teal-500'
                    } focus:ring-1 focus:ring-teal-500/30 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white placeholder-slate-500`}
                  />
                  {!modalObjectValidation.isValid && (
                    <div className="text-[11px] text-amber-300 bg-amber-500/15 border border-amber-500/35 rounded-xl px-2.5 py-2 leading-snug flex flex-col gap-1.5">
                      <div className="flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{modalObjectValidation.message}</span>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => ignoreValidation(modalObjectIgnoreKey)}
                          className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-200 border border-amber-500/40 cursor-pointer transition-colors"
                        >
                          התעלם במקרה זה
                        </button>
                      </div>
                    </div>
                  )}
                  {modalHasMajorMismatch && (
                    <div className="text-[11px] text-sky-200 bg-sky-500/15 border border-sky-500/35 rounded-xl px-2.5 py-2 leading-snug flex flex-col gap-1.5">
                      <div className="flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                        <span>
                          לתשומת לבך - במודולת MAJOR הגדרת מילה מנמונית אחרת עבור מספר זה ("{modalMajorWord}") ; מומלץ לבחור באותה המילה עבור 2 המודולות
                        </span>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => ignoreValidation(modalMismatchIgnoreKey)}
                          className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-200 border border-sky-500/40 cursor-pointer transition-colors"
                        >
                          התעלם במקרה זה
                        </button>
                      </div>
                    </div>
                  )}
                  {modalObjectValidation.isValid && !modalHasMajorMismatch && (
                    <p className="text-[11px] text-slate-400">
                      בנוי מעיצורי המספר בלבד + אותיות חיבור שקופות ({(connectingLetters || ['א', 'נ', 'י', 'ע', 'ו', 'ה']).join(', ')}).
                    </p>
                  )}
                </div>
              </div>

              {/* 4. Full Mnemonic Scene (SEE Principle, Active Movement & Insane Causality, Von Restorff Focus) */}
              <div className="bg-slate-950/90 border border-amber-500/35 rounded-2xl p-4 sm:p-5 space-y-2.5 shadow-inner">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="text-xs sm:text-sm text-amber-300 font-black flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>🎬 סצנה מנמונית שלמה (עקרון SEE • תנועה וסיבתיות מטורפת • אפקט פון רסטורף):</span>
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      שילוב רב-חושי (רעשים, ריחות, מרקמים), רגש והומור קיצוני, הקצנת פרופורציות ושרשרת סיבה-ותוצאה על רקע נקי ופשוט.
                    </p>
                  </div>
                  <AIFieldGeneratorButton
                    promptType="pao_scene"
                    inputContext={editingItem.number.toString()}
                    extraContext={`אדם: ${editPerson} | פעולה: ${editAction} | חפץ: ${editObject}`}
                    paoContext={{
                      number: editingItem.numberStr,
                      person: editPerson,
                      action: editAction,
                      object: editObject,
                      scene: editScene,
                    }}
                    customDigits={majorDigits}
                    connectingLetters={connectingLetters}
                    onGenerated={(val) => setEditScene(val)}
                    label="צור סצנה עם AI"
                  />
                </div>
                <textarea
                  rows={3}
                  value={editScene}
                  onChange={(e) => setEditScene(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSaveItem(editingItem.number);
                    }
                  }}
                  placeholder="תאר סצנה חיה, מוקצנת ורב-חושית שבה הדמות מבצעת את הפעולה על החפץ בתנועה מתפרצת..."
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 leading-relaxed"
                />
              </div>

              {/* 5. Visual Image Section inside Modal */}
              <div className="bg-slate-950/90 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs sm:text-sm text-indigo-300 font-bold flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-400" />
                    <span>תמונה ויזואלית לסצנת PAO:</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setCardImageMode('ai')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          cardImageMode === 'ai'
                            ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-sm'
                            : 'text-amber-400/80 hover:text-amber-300'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>יצירה עם Gemini AI</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCardImageMode('upload')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          cardImageMode === 'upload'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        📁 העלאת קובץ / קישור
                      </button>
                    </div>

                    {editImageUrl && (
                      <button
                        type="button"
                        onClick={() => setEditImageUrl('')}
                        className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>הסר תמונה</span>
                      </button>
                    )}
                  </div>
                </div>

                {cardImageMode === 'ai' ? (
                  <PAOImageGeneratorTab
                    numberStr={editingItem.numberStr}
                    numberVal={editingItem.number}
                    person={editPerson}
                    action={editAction}
                    object={editObject}
                    scene={editScene}
                    currentUser={currentUser}
                    saveButtonLabel="שמור תמונה לשלשה זו"
                    onLogin={onLogin}
                    onImageGenerated={(dataUrl) => {
                      setEditImageUrl(dataUrl);
                      onUpdatePAOItem(editingItem.number, {
                        person: editPerson,
                        action: editAction,
                        object: editObject,
                        scene: editScene,
                        imageUrl: dataUrl,
                      });
                      setEditingNum(null);
                      setEditActionNotice(null);
                      onEarnPoints(15, 'יצירת תמונה מנמונית עם Gemini');
                    }}
                  />
                ) : (
                  <div className="space-y-3">
                    {editImageUrl && (
                      <div className="flex items-center justify-between bg-slate-900 p-3 rounded-2xl border border-slate-800">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={editImageUrl}
                            alt="סצנה"
                            className="w-16 h-16 object-cover rounded-xl border border-indigo-500/40 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-200 block truncate">תמונה קיימת לשלשה #{editingItem.numberStr}</span>
                            <span className="text-[11px] text-slate-400 block">גרור קובץ חדש או הדבק קישור למטה להחלפה</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <ImageDropzone
                      isProcessing={isCompressing}
                      title={editImageUrl ? 'בחר קובץ או גרור לכאן להחלפת התמונה' : 'בחר קובץ או גרור לכאן'}
                      subtitle="Choose a file or drag it here • JPG, PNG, WebP"
                      className="py-5 px-4"
                      onImageSelected={async (file) => {
                        try {
                          setIsCompressing(true);
                          const comp = await compressImageFile(file);
                          setEditImageUrl(comp);
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setIsCompressing(false);
                        }
                      }}
                    />

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 shrink-0">או קישור ישיר לתמונה:</span>
                      <input
                        type="url"
                        value={editImageUrl.startsWith('data:') ? '' : editImageUrl}
                        onChange={(e) => setEditImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <span className="text-xs text-slate-400">
                  💡 טיפ: לחץ <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px] text-slate-300">Enter</kbd> לשמירה מהירה או <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px] text-slate-300">Esc</kbd> לביטול
                </span>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNum(null);
                      setEditImageUrl('');
                      setEditActionNotice(null);
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors"
                  >
                    ביטול
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSaveItem(editingItem.number);
                    }}
                    className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white cursor-pointer shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>שמור שינויים</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Validation Alert Modal */}
      {validationModal && validationModal.isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setValidationModal(null);
            }
          }}
        >
          <div
            className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl max-w-md w-full p-6 text-right space-y-4 shadow-2xl m3-container-transform animate-shake"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  {validationModal.title}
                </h3>
                <p className="text-xs text-amber-300 font-bold mt-0.5">
                  {validationModal.message}
                </p>
              </div>
            </div>

            {validationModal.details && (
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {validationModal.details}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              {validationModal.onConfirmBypass && (
                <button
                  type="button"
                  onClick={validationModal.onConfirmBypass}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3.5 py-2 rounded-xl border border-slate-700 transition-all cursor-pointer"
                >
                  התעלם במקרה זה
                </button>
              )}
              <button
                type="button"
                onClick={() => setValidationModal(null)}
                className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md"
              >
                חזור ותקן ערך
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};