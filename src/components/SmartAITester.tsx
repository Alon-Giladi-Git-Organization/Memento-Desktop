import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Brain,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  RotateCcw,
  Lightbulb,
  Shuffle,
  Award,
  Mic,
  MicOff,
  Volume2,
  Headphones,
  Square,
  Play,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  MajorItem,
  PAOItem,
  MemoryPalace,
  PersonFaceCard,
  AcademicKeyPoint,
  PersonalContactAssociation,
} from '../types/memory';
import {
  getCurrentOrInitialDeckItem,
  advanceToNextDeckItem,
  resetQuizDeck,
  DeckProgress,
} from '../lib/quizDeckManager';
import { QuizDeckProgressBar } from './QuizDeckProgressBar';
import { voiceService } from '../lib/voiceService';
import { soundEffects } from '../lib/soundEffects';

interface SmartAITesterProps {
  majorItems: MajorItem[];
  paoItems: PAOItem[];
  palaces: MemoryPalace[];
  peopleCards: PersonFaceCard[];
  academicPoints: AcademicKeyPoint[];
  personalAssociations: PersonalContactAssociation[];
  onEarnPoints: (amount: number, reason: string) => void;
  onUnlockBadge: (badge: string) => void;
  onSaveTestResult: (
    category: 'major' | 'pao' | 'palaces' | 'names' | 'academic' | 'shapes' | 'pegs',
    score: number,
    total: number
  ) => void;
}

interface TestQuestionItem {
  id: string;
  category: 'major' | 'pao' | 'palaces' | 'names' | 'academic' | 'personal';
  categoryLabel: string;
  promptTitle: string;
  promptSubtitle: string;
  targetAssociation: string;
  targetScene?: string;
  targetTriplet?: string;
  contextDetails: string;
}

interface AIEvalResult {
  isCorrect: boolean;
  score: number;
  verdictTitle: string;
  explanation: string;
  memoryTip: string;
}

export const SmartAITester: React.FC<SmartAITesterProps> = ({
  majorItems,
  paoItems,
  palaces,
  peopleCards,
  academicPoints,
  personalAssociations,
  onEarnPoints,
  onUnlockBadge,
  onSaveTestResult,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [userAnswer, setUserAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<AIEvalResult | null>(null);
  const [showTargetHint, setShowTargetHint] = useState(false);

  // Hands-Free Voice Mode state
  const [isHandsFreeActive, setIsHandsFreeActive] = useState(false);
  const [voicePhase, setVoicePhase] = useState<
    'idle' | 'speaking' | 'listening' | 'evaluating' | 'feedback_correct' | 'feedback_incorrect'
  >('idle');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [showMicPermissionPrompt, setShowMicPermissionPrompt] = useState(false);

  const [sessionScore, setSessionScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);

  const isHandsFreeRef = useRef(isHandsFreeActive);
  isHandsFreeRef.current = isHandsFreeActive;

  // Build pool of questions strictly from items marked as Ready for Practice (Whitelist)
  const questionPool: TestQuestionItem[] = useMemo(() => {
    const pool: TestQuestionItem[] = [];

    // 1. Major Items (Strictly Ready for Practice)
    majorItems
      .filter((m) => Boolean(m.is_ready_for_practice))
      .forEach((m) => {
        const scene = m.userWord || m.imageHint || m.defaultWord;
        pool.push({
          id: `major-${m.number}`,
          category: 'major',
          categoryLabel: 'מערכת ה-Major (00-99)',
          promptTitle: `מהו החפץ או הסצנה שקישרת למספר ${m.numberStr}?`,
          promptSubtitle: `עיצורים: ${m.consonants}`,
          targetAssociation: `${m.defaultWord} (${scene})`,
          targetScene: scene,
          contextDetails: `מספר: ${m.numberStr}, מילת בסיס: ${m.defaultWord}`,
        });
      });

    // 2. PAO Items (Strictly Ready for Practice)
    paoItems
      .filter((p) => Boolean(p.is_ready_for_practice))
      .forEach((p) => {
        const pName = p.person;
        const aName = p.action;
        const oName = p.object;
        const sDesc = p.scene || '';
        const tripletStr = `${pName} • ${aName} • ${oName}`;
        pool.push({
          id: `pao-${p.number}`,
          category: 'pao',
          categoryLabel: 'שיטת השלשות (PAO)',
          promptTitle: `תאר את דמות ה-PAO, הפעולה והחפץ של מספר ${p.numberStr}`,
          promptSubtitle: `תאר בשפה חופשית את השלשה או הסצנה המנטלית עבור ${p.numberStr}`,
          targetAssociation: `דמות: ${pName}, פעולה: ${aName}, חפץ: ${oName}${sDesc ? `, סצנה: ${sDesc}` : ''}`,
          targetTriplet: tripletStr,
          targetScene: sDesc || tripletStr,
          contextDetails: `מספר PAO: ${p.numberStr}`,
        });
      });

    // 3. Memory Palaces Loci (Strictly Ready for Practice)
    palaces.forEach((pal) => {
      pal.loci
        .filter((l) => l.is_ready_for_practice !== false)
        .forEach((loc) => {
          if (loc.storedContent || loc.mnemonicScene) {
            pool.push({
              id: `palace-${pal.id}-${loc.id}`,
              category: 'palaces',
              categoryLabel: `ארמון זיכרון: ${pal.name}`,
              promptTitle: `מה אחסנת בתחנה #${loc.stepNumber}: "${loc.title}" (${loc.roomName})?`,
              promptSubtitle: `מיקום מדויק: ${loc.positionDescription}`,
              targetAssociation: `${loc.storedContent || ''} - ${loc.mnemonicScene || ''}`,
              targetScene: loc.mnemonicScene || loc.storedContent || '',
              contextDetails: `ארמון: ${pal.name}, חדר: ${loc.roomName}, תחנה: ${loc.title}`,
            });
          }
        });
    });

    // 4. Names & Faces (Strictly Ready for Practice)
    peopleCards
      .filter((p) => Boolean(p.is_ready_for_practice))
      .forEach((person) => {
        pool.push({
          id: `person-${person.id}`,
          category: 'names',
          categoryLabel: 'שמות ופנים',
          promptTitle: `כיצד קידדת את השם של "${person.name}" (${person.roleOrJob})?`,
          promptSubtitle: `עוגן מורפולוגי בפנים: ${person.morphologicalAnchor}`,
          targetAssociation: `מילת תחליף: ${person.substituteWord} | סצנה: ${person.mnemonicScene}`,
          targetScene: person.mnemonicScene,
          contextDetails: `שם: ${person.name}, עוגן פנים: ${person.morphologicalAnchor}`,
        });
      });

    // 5. Academic Points
    academicPoints.forEach((ap) => {
      pool.push({
        id: `acad-${ap.id}`,
        category: 'academic',
        categoryLabel: `מושג אקדמי (${ap.discipline})`,
        promptTitle: `מהי הסצנה והעוגן החזותי עבור המושג "${ap.conceptTitle}"?`,
        promptSubtitle: `תקציר המושג: ${ap.sourceSummary}`,
        targetAssociation: `עוגן: ${ap.visualAnchor} | מיקום: ${ap.palaceLocusInfo} | סצנה: ${ap.mnemonicScene}`,
        targetScene: ap.mnemonicScene,
        contextDetails: `מושג: ${ap.conceptTitle}, תחום: ${ap.discipline}`,
      });
    });

    // 6. Personal Associations
    personalAssociations.forEach((pa) => {
      pool.push({
        id: `pers-${pa.id}`,
        category: 'personal',
        categoryLabel: 'פנקס אסוציאציות אישי',
        promptTitle: `מהי הסצנה המנמונית והמידע עבור "${pa.targetSubject}"?`,
        promptSubtitle: `שיטת קידוד: ${pa.methodUsed.toUpperCase()}`,
        targetAssociation: `מספר/עובדה: ${pa.storedNumberOrFact} | סצנה: ${pa.encodedMnemonic}`,
        targetScene: pa.encodedMnemonic,
        contextDetails: `נושא: ${pa.targetSubject}`,
      });
    });

    return pool;
  }, [majorItems, paoItems, palaces, peopleCards, academicPoints, personalAssociations]);

  const filteredPool = useMemo(() => {
    if (selectedCategory === 'all') return questionPool;
    return questionPool.filter((q) => q.category === selectedCategory);
  }, [questionPool, selectedCategory]);

  const deckKey = `smart_tester_${selectedCategory}`;
  const [deckProgress, setDeckProgress] = useState<DeckProgress | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (filteredPool.length > 0) {
      const { item, progress } = getCurrentOrInitialDeckItem(deckKey, filteredPool, (q) => q.id);
      if (item) {
        const idx = filteredPool.findIndex((q) => q.id === item.id);
        if (idx >= 0) setCurrentIndex(idx);
      }
      setDeckProgress(progress);
    } else {
      setDeckProgress(null);
    }
  }, [deckKey, filteredPool.length]);

  useEffect(() => {
    return () => {
      voiceService.stopSpeaking();
      voiceService.stopListening({ silent: true });
    };
  }, []);

  const currentQuestion =
    filteredPool.length > 0 ? filteredPool[currentIndex % filteredPool.length] : null;

  const currentQuestionRef = useRef<TestQuestionItem | null>(currentQuestion);
  currentQuestionRef.current = currentQuestion;

  const handleNextQuestion = useCallback(() => {
    if (filteredPool.length === 0) return null;
    const { item, progress } = advanceToNextDeckItem(deckKey, filteredPool, (q) => q.id);
    let nextQ: TestQuestionItem | null = null;
    if (item) {
      const idx = filteredPool.findIndex((q) => q.id === item.id);
      if (idx >= 0) {
        setCurrentIndex(idx);
        nextQ = filteredPool[idx];
      }
    }
    setDeckProgress(progress);
    setUserAnswer('');
    setEvalResult(null);
    setShowTargetHint(false);
    return nextQ;
  }, [filteredPool, deckKey]);

  const evaluateResponseAndHandleFlow = useCallback(
    async (answerText: string, fromVoiceHandsFree: boolean) => {
      const q = currentQuestionRef.current;
      if (!q || !answerText.trim()) return;

      const trimmedAnswer = answerText.trim();
      setUserAnswer(trimmedAnswer);
      setIsEvaluating(true);
      if (fromVoiceHandsFree) {
        setVoicePhase('evaluating');
      }

      try {
        const res = await fetch('/api/gemini/evaluate-recall', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: q.promptTitle,
            targetAssociation: q.targetAssociation,
            targetTriplet: q.targetTriplet || '',
            targetScene: q.targetScene || '',
            userResponse: trimmedAnswer,
            context: q.contextDetails,
          }),
        });
        const data: AIEvalResult = await res.json();
        setEvalResult(data);
        setQuestionsAnswered((prev) => prev + 1);

        if (data.isCorrect) {
          setSessionScore((prev) => prev + 1);
          soundEffects.playSuccess();
          onEarnPoints(30, 'זיהוי אסוציאציה סמנטי בבוחן ה-AI');
          confetti({ particleCount: 55, spread: 60, origin: { y: 0.6 } });
          if (sessionScore + 1 >= 5) {
            onUnlockBadge('אלוף השליפה הסמנטית');
          }
        } else {
          soundEffects.playError();
        }

        const catMap: any =
          q.category === 'personal' ? 'major' : q.category;
        onSaveTestResult(catMap, data.isCorrect ? 100 : data.score || 30, 100);

        if (fromVoiceHandsFree && isHandsFreeRef.current) {
          if (data.isCorrect) {
            setVoicePhase('feedback_correct');
            // Confirm correct answer and immediately read the next question
            await voiceService.speakHebrew('נכון מאוד!');
            if (isHandsFreeRef.current) {
              const nextQ = handleNextQuestion();
              if (nextQ) {
                currentQuestionRef.current = nextQ;
                setTimeout(() => {
                  speakAndListenQuestion(nextQ);
                }, 200);
              }
            }
          } else {
            setVoicePhase('feedback_incorrect');
            // Notify incorrect, read the full correct answer aloud, and ONLY THEN proceed to next question
            await voiceService.speakHebrew(
              `לא מדויק. התשובה הנכונה היא: ${q.targetAssociation}`
            );
            if (isHandsFreeRef.current) {
              const nextQ = handleNextQuestion();
              if (nextQ) {
                currentQuestionRef.current = nextQ;
                setTimeout(() => {
                  speakAndListenQuestion(nextQ);
                }, 250);
              }
            }
          }
        } else {
          setVoicePhase('idle');
        }
      } catch (e) {
        console.error(e);
        setVoicePhase('idle');
      } finally {
        setIsEvaluating(false);
      }
    },
    [handleNextQuestion, onEarnPoints, onSaveTestResult, onUnlockBadge, sessionScore]
  );

  const startVoiceListening = useCallback(
    (autoHandsFreeMode: boolean) => {
      setVoiceError(null);
      setVoicePhase('listening');

      voiceService.startListening(
        {
          onInterimResult: (interim) => {
            setUserAnswer(interim);
          },
          onFinalResult: (finalText) => {
            evaluateResponseAndHandleFlow(finalText, autoHandsFreeMode);
          },
          onError: (code, humanMsg) => {
            if (code === 'not-allowed' || code === 'service-not-allowed') {
              setIsHandsFreeActive(false);
              isHandsFreeRef.current = false;
              setVoicePhase('idle');
              setShowMicPermissionPrompt(true);
            } else if (code === 'audio-capture') {
              setVoiceError(humanMsg);
              setIsHandsFreeActive(false);
              isHandsFreeRef.current = false;
              setVoicePhase('idle');
            }
          },
        },
        {
          continuous: true,
          unlimitedThinkingTime: true,
          postSpeechSilenceMs: 2400,
        }
      );
    },
    [evaluateResponseAndHandleFlow]
  );

  const speakAndListenQuestion = useCallback(
    async (q: TestQuestionItem) => {
      if (!isHandsFreeRef.current) return;
      voiceService.stopListening({ silent: true });
      setVoicePhase('speaking');
      setUserAnswer('');
      setEvalResult(null);

      await voiceService.speakHebrew(q.promptTitle);

      if (isHandsFreeRef.current) {
        startVoiceListening(true);
      }
    },
    [startVoiceListening]
  );

  const confirmMicPermissionAndStart = async () => {
    setShowMicPermissionPrompt(false);
    setVoiceError(null);
    const perm = await voiceService.requestMicrophonePermission();
    if (!perm.granted && perm.errorMessage) {
      setVoiceError(perm.errorMessage);
      return;
    }
    voiceService.markMicPermissionGranted();
    setIsHandsFreeActive(true);
    isHandsFreeRef.current = true;
    if (currentQuestion) {
      speakAndListenQuestion(currentQuestion);
    }
  };

  const toggleHandsFreeMode = async () => {
    if (isHandsFreeActive) {
      setIsHandsFreeActive(false);
      isHandsFreeRef.current = false;
      setVoicePhase('idle');
      voiceService.stopListening({ silent: true });
      voiceService.stopSpeaking();
    } else {
      setVoiceError(null);
      if (!voiceService.hasMicPermission()) {
        setShowMicPermissionPrompt(true);
        return;
      }
      await confirmMicPermissionAndStart();
    }
  };

  const handleSubmitEvaluation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentQuestion || !userAnswer.trim() || isEvaluating) return;
    voiceService.stopListening({ silent: true });
    await evaluateResponseAndHandleFlow(userAnswer, isHandsFreeActive);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>בוחן שליפה חכם ב-AI • טקסט חופשי ומצב קולי Hands-Free</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            מבחן שליפה בשפה חופשית (קולי או כתוב)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            המערכת מקריאה את השאלה ומאפשרת זמן מחשבה ללא הגבלה. ענה בקול או בכתב — Gemini מנתח את הדיוק הרעיוני מול מסד הנתונים שלך!
          </p>
        </div>

        {/* Hands-Free Toggle & Session Score */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={toggleHandsFreeMode}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-md ${
              isHandsFreeActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-indigo-600/20'
            }`}
          >
            {isHandsFreeActive ? (
              <>
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>עצור מבחן קולי</span>
              </>
            ) : (
              <>
                <Headphones className="w-4 h-4" />
                <span>הפעל מבחן שליפה קולי (Hands-Free)</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-2xl">
            <Award className="w-5 h-5 text-amber-400" />
            <div className="text-xs">
              <div className="text-slate-400">דיוק בסשן נוכחי</div>
              <div className="font-black text-white text-sm">
                {sessionScore} / {questionsAnswered} תשובות נכונות
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <span className="text-xs text-slate-400 font-semibold ml-1 whitespace-nowrap">
          סנן נושא שליפה:
        </span>
        {[
          { id: 'all', label: 'הכל (מעורב)' },
          { id: 'major', label: 'Major (00-99)' },
          { id: 'pao', label: 'שלשות PAO' },
          { id: 'palaces', label: 'ארמונות זיכרון' },
          { id: 'names', label: 'שמות ופנים' },
          { id: 'academic', label: 'מושגים אקדמיים' },
          { id: 'personal', label: 'פנקס אישי' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              setCurrentIndex(0);
              setEvalResult(null);
              setUserAnswer('');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Non-repeating Quiz Deck Progress Bar */}
      {filteredPool.length > 0 && (
        <div className="max-w-xl mx-auto">
          <QuizDeckProgressBar
            progress={deckProgress}
            onResetDeck={() => {
              resetQuizDeck(deckKey);
              handleNextQuestion();
            }}
            deckTitle="בוחן שליפה חכם"
          />
        </div>
      )}

      {/* Voice Status Banner when Hands-Free or Mic is active */}
      {(isHandsFreeActive || voicePhase !== 'idle') && (
        <div className="bg-slate-950/90 border border-indigo-500/40 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            {voicePhase === 'speaking' && (
              <span className="inline-flex items-center gap-2 text-indigo-300">
                <Volume2 className="w-4 h-4 text-indigo-400 animate-bounce" />
                <span>המערכת מקריאה את השאלה...</span>
              </span>
            )}
            {voicePhase === 'listening' && (
              <span className="inline-flex items-center gap-2 text-rose-300 animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span>המיקרופון פתוח (זמן מחשבה ללא הגבלה) — דבר בשפה חופשית וטבעית</span>
              </span>
            )}
            {voicePhase === 'evaluating' && (
              <span className="inline-flex items-center gap-2 text-purple-300">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span>Gemini מבצע ניתוח סמנטי לתשובתך מול מסד הנתונים...</span>
              </span>
            )}
            {voicePhase === 'feedback_correct' && (
              <span className="inline-flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>תשובה נכונה! מיד מקריא את השאלה הבאה...</span>
              </span>
            )}
            {voicePhase === 'feedback_incorrect' && (
              <span className="inline-flex items-center gap-2 text-amber-300">
                <XCircle className="w-4 h-4 text-amber-400" />
                <span>מקריא את התשובה המלאה לפני מעבר לשאלה הבאה...</span>
              </span>
            )}
          </div>

          {voicePhase === 'listening' && userAnswer.trim().length > 0 && (
            <button
              type="button"
              onClick={() => voiceService.completeListeningNow()}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer"
            >
              סיימתי לענות — בדוק כעת ↵
            </button>
          )}
        </div>
      )}

      {voiceError && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
          {voiceError}
        </div>
      )}

      {/* Question Card */}
      {currentQuestion ? (
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
              {currentQuestion.categoryLabel}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  voiceService.speakHebrew(currentQuestion.promptTitle);
                }}
                className="flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 cursor-pointer"
                title="הקרא שאלה בקול"
              >
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>הקרא שאלה</span>
              </button>

              <button
                onClick={() => {
                  const nextQ = handleNextQuestion();
                  if (nextQ && isHandsFreeActive) {
                    speakAndListenQuestion(nextQ);
                  }
                }}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>החלף שאלה</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg sm:text-xl font-black text-white">
              {currentQuestion.promptTitle}
            </h3>
            <p className="text-xs text-slate-400">{currentQuestion.promptSubtitle}</p>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmitEvaluation} className="space-y-3">
            <div className="relative">
              <textarea
                rows={2}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (evalResult && evalResult.isCorrect) {
                      handleNextQuestion();
                    } else if (userAnswer.trim() && !isEvaluating) {
                      handleSubmitEvaluation();
                    }
                  }
                }}
                placeholder="הקלד או הקלט בקול את הסצנה, החפץ או הקשר המנטלי בשפה חופשית..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowTargetHint(!showTargetHint)}
                  className="text-xs text-slate-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span>{showTargetHint ? 'הסתר אסוציאציה שמורה' : 'הצץ באסוציאציה השמורה'}</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (voicePhase === 'listening') {
                      voiceService.completeListeningNow();
                    } else {
                      const perm = await voiceService.requestMicrophonePermission();
                      if (!perm.granted) {
                        setVoiceError(perm.errorMessage || 'הגישה למיקרופון נחסמה.');
                        return;
                      }
                      startVoiceListening(false);
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    voicePhase === 'listening'
                      ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                  }`}
                >
                  {voicePhase === 'listening' ? (
                    <>
                      <MicOff className="w-3.5 h-3.5" />
                      <span>עצור הקלטה ובדוק</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-rose-400" />
                      <span>השב במיקרופון</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                {evalResult && (
                  <button
                    type="button"
                    onClick={() => {
                      const nextQ = handleNextQuestion();
                      if (nextQ && isHandsFreeActive) {
                        speakAndListenQuestion(nextQ);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>לשאלה הבאה</span>
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!userAnswer.trim() || isEvaluating}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  {isEvaluating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gemini מנתח תשובה...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4" />
                      <span>בדוק תשובה עם AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Hint Box */}
          {showTargetHint && (
            <div className="bg-slate-900/80 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-200/90 animate-fadeIn">
              <span className="font-bold text-amber-400 block mb-1">
                האסוציאציה השמורה במערכת:
              </span>
              {currentQuestion.targetAssociation}
            </div>
          )}

          {/* AI Evaluation Result */}
          {evalResult && (
            <div
              className={`rounded-2xl p-5 border space-y-3 animate-fadeIn ${
                evalResult.isCorrect
                  ? 'bg-emerald-950/30 border-emerald-500/40'
                  : 'bg-rose-950/30 border-rose-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {evalResult.isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-400" />
                  )}
                  <h4
                    className={`font-black text-base ${
                      evalResult.isCorrect ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {evalResult.verdictTitle}
                  </h4>
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-900 text-amber-400 border border-slate-700">
                  ציון התאמה סמנטית: {evalResult.score}%
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {evalResult.explanation}
              </p>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs space-y-1">
                <div className="text-slate-400">
                  <strong className="text-slate-300">הערך המקורי במערכת: </strong>
                  {currentQuestion.targetAssociation}
                </div>
                {evalResult.memoryTip && (
                  <div className="text-indigo-300">
                    <strong className="text-indigo-400">💡 טיפ קוגניטיבי: </strong>
                    {evalResult.memoryTip}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-400 text-sm">
          לא נמצאו פריטים מוכנים לתרגול בקטגוריה זו. סמן פריטים כ"מוכן לתרגול" במודולות כדי להתחיל!
        </div>
      )}

      {/* Microphone Permission Request Popup Modal */}
      {showMicPermissionPrompt && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowMicPermissionPrompt(false)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-6 shadow-2xl space-y-5 text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
                <Mic className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white">אישור גישה למיקרופון</h4>
                <p className="text-xs text-indigo-300 font-semibold">
                  נדרש להפעלת מבחן שליפה קולי (Hands-Free)
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              מבחן השליפה הקולי זקוק לגישה למיקרופון כדי להקשיב לתשובותיך בשפה חופשית ולנתח אותן סמנטית מול מסד הנתונים. לחץ על <strong>"אשר גישה למיקרופון"</strong> כדי לאפשר גישה ולהתחיל במבחן.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowMicPermissionPrompt(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer transition-colors"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={confirmMicPermissionAndStart}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer transition-all"
              >
                <Mic className="w-4 h-4" />
                <span>אשר גישה למיקרופון והתחל</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
