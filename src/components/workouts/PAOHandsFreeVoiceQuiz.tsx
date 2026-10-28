import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Play,
  Square,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Headphones,
  Sparkles,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PAOItem, MajorItem } from '../../types/memory';
import { voiceService, VoiceTriggerAction } from '../../lib/voiceService';
import { soundEffects } from '../../lib/soundEffects';
import { getPAOInitials } from '../../lib/paoInitials';
import {
  getCurrentOrInitialDeckItem,
  advanceToNextDeckItem,
  resetQuizDeck,
  DeckProgress,
} from '../../lib/quizDeckManager';
import { QuizDeckProgressBar } from '../QuizDeckProgressBar';

interface PAOHandsFreeVoiceQuizProps {
  readyItems: PAOItem[];
  majorDigits?: MajorItem[];
  onEarnPoints: (amount: number, reason?: string) => void;
  onUnlockBadge: (badge: string) => void;
  onExitVoiceMode?: () => void;
}

type VoiceQuestionType = 'scene' | 'triplet' | 'person' | 'action' | 'object' | 'mixed';

interface VoiceQuestion {
  item: PAOItem;
  aspect: 'scene' | 'triplet' | 'person' | 'action' | 'object';
  spokenPrompt: string;
  displayTitle: string;
  displayValue: string;
  expectedAnswers: string[];
  correctDisplayAnswer: string;
  spokenFullAnswer: string;
  targetTriplet: string;
  targetScene: string;
}

export const PAOHandsFreeVoiceQuiz: React.FC<PAOHandsFreeVoiceQuizProps> = ({
  readyItems,
  majorDigits,
  onEarnPoints,
  onUnlockBadge,
  onExitVoiceMode,
}) => {
  const [isHandsFreeActive, setIsHandsFreeActive] = useState(false);
  const [questionMode, setQuestionMode] = useState<VoiceQuestionType>('scene');
  const [deckProgress, setDeckProgress] = useState<DeckProgress | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<VoiceQuestion | null>(null);

  const [statusPhase, setStatusPhase] = useState<
    'idle' | 'speaking' | 'listening' | 'evaluating' | 'feedback_correct' | 'feedback_incorrect'
  >('idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [lastEvaluationMessage, setLastEvaluationMessage] = useState('');
  const [semanticExplanation, setSemanticExplanation] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showMicPermissionPrompt, setShowMicPermissionPrompt] = useState(false);

  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);

  const isHandsFreeRef = useRef(isHandsFreeActive);
  isHandsFreeRef.current = isHandsFreeActive;

  const currentQuestionRef = useRef<VoiceQuestion | null>(currentQuestion);
  currentQuestionRef.current = currentQuestion;

  const statusPhaseRef = useRef(statusPhase);
  statusPhaseRef.current = statusPhase;

  const buildQuestionFromItem = useCallback(
    (item: PAOItem, mode: VoiceQuestionType): VoiceQuestion => {
      const aspects: ('scene' | 'triplet' | 'person' | 'action' | 'object')[] = [
        'scene',
        'triplet',
        'person',
        'action',
        'object',
      ];
      const chosenAspect =
        mode === 'mixed' ? aspects[Math.floor(Math.random() * aspects.length)] : mode;

      const spokenDigits =
        item.number < 10 ? `אפס ${item.number}` : item.numberStr;

      const fullTripletStr = `${item.person} • ${item.action} • ${item.object}`;
      const fullSceneStr =
        item.scene && item.scene.trim()
          ? item.scene.trim()
          : `${item.person} ${item.action} ${item.object}`;

      if (chosenAspect === 'person') {
        return {
          item,
          aspect: 'person',
          spokenPrompt: `מספר ${spokenDigits}. מי הדמות?`,
          displayTitle: 'מי הדמות (Person) של המספר:',
          displayValue: item.numberStr,
          expectedAnswers: [item.person],
          correctDisplayAnswer: item.person,
          spokenFullAnswer: `הדמות של מספר ${spokenDigits} היא ${item.person}`,
          targetTriplet: fullTripletStr,
          targetScene: fullSceneStr,
        };
      }
      if (chosenAspect === 'action') {
        return {
          item,
          aspect: 'action',
          spokenPrompt: `מספר ${spokenDigits}. מה הפעולה?`,
          displayTitle: 'מה הפעולה (Action) של המספר:',
          displayValue: item.numberStr,
          expectedAnswers: [item.action],
          correctDisplayAnswer: item.action,
          spokenFullAnswer: `הפעולה של מספר ${spokenDigits} היא ${item.action}`,
          targetTriplet: fullTripletStr,
          targetScene: fullSceneStr,
        };
      }
      if (chosenAspect === 'object') {
        return {
          item,
          aspect: 'object',
          spokenPrompt: `מספר ${spokenDigits}. מה החפץ?`,
          displayTitle: 'מה החפץ (Object) של המספר:',
          displayValue: item.numberStr,
          expectedAnswers: [item.object],
          correctDisplayAnswer: item.object,
          spokenFullAnswer: `החפץ של מספר ${spokenDigits} הוא ${item.object}`,
          targetTriplet: fullTripletStr,
          targetScene: fullSceneStr,
        };
      }
      if (chosenAspect === 'triplet') {
        return {
          item,
          aspect: 'triplet',
          spokenPrompt: `מספר ${spokenDigits}. מהם הדמות, הפעולה והחפץ?`,
          displayTitle: 'מהי שלשת ה-PAO המלאה (אדם • פעולה • חפץ) של המספר:',
          displayValue: item.numberStr,
          expectedAnswers: [
            `${item.person} ${item.action} ${item.object}`,
            fullSceneStr,
          ],
          correctDisplayAnswer: fullTripletStr,
          spokenFullAnswer: `${item.person}, ${item.action}, ${item.object}`,
          targetTriplet: fullTripletStr,
          targetScene: fullSceneStr,
        };
      }

      // Default: 'scene' (Full Scene / Conceptual PAO Recall)
      return {
        item,
        aspect: 'scene',
        spokenPrompt: `מספר ${spokenDigits}. מה הסצנה או שלשת ה-PAO?`,
        displayTitle: 'תאר בשפה חופשית את הסצנה או שלשת ה-PAO של המספר:',
        displayValue: item.numberStr,
        expectedAnswers: [
          fullSceneStr,
          `${item.person} ${item.action} ${item.object}`,
        ],
        correctDisplayAnswer: item.scene
          ? `${fullTripletStr} — "${item.scene}"`
          : fullTripletStr,
        spokenFullAnswer: item.scene
          ? `${item.person}, ${item.action}, ${item.object}. הסצנה היא: ${item.scene}`
          : `${item.person}, ${item.action}, ${item.object}`,
        targetTriplet: fullTripletStr,
        targetScene: fullSceneStr,
      };
    },
    []
  );

  // Initialize first question on mount
  useEffect(() => {
    if (readyItems.length > 0 && !currentQuestion) {
      const { item, progress } = getCurrentOrInitialDeckItem(
        'workout_pao_voice',
        readyItems,
        (i) => i.number
      );
      setDeckProgress(progress);
      if (item) {
        setCurrentQuestion(buildQuestionFromItem(item, questionMode));
      }
    }
  }, [readyItems, currentQuestion, questionMode, buildQuestionFromItem]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      voiceService.stopSpeaking();
      voiceService.stopListening({ silent: true });
    };
  }, []);

  const handleAnswerEvaluation = useCallback(
    async (transcript: string) => {
      const q = currentQuestionRef.current;
      if (!q) return;

      const trimmed = transcript.trim();
      if (!trimmed) {
        // If no transcript was captured and session is still active, re-open microphone for unlimited thinking time
        if (isHandsFreeRef.current) {
          startListeningPhase();
        }
        return;
      }

      voiceService.stopListening({ silent: true });
      setStatusPhase('evaluating');
      setLiveTranscript(trimmed);
      setTotalAttempted((prev) => prev + 1);

      // Send the user's transcribed free-text response to Gemini for semantic conceptual evaluation
      const semanticResult = await voiceService.evaluateAnswerWithGemini({
        question: `${q.displayTitle} ${q.displayValue}`,
        userResponse: trimmed,
        targetAnswer: q.correctDisplayAnswer,
        targetTriplet: q.targetTriplet,
        targetScene: q.targetScene,
        acceptableAlternatives: q.expectedAnswers,
        context: `מבחן שליפה קולי PAO למספר ${q.item.numberStr} (מצב: ${q.aspect})`,
      });

      if (!isHandsFreeRef.current && statusPhaseRef.current === 'idle') {
        return;
      }

      setSemanticExplanation(semanticResult.explanation || '');

      if (semanticResult.isCorrect) {
        setStatusPhase('feedback_correct');
        setCorrectCount((prev) => prev + 1);
        setLastEvaluationMessage(`נכון מאוד! "${trimmed}"`);
        soundEffects.playSuccess();
        onEarnPoints(25, 'מענה קולי סמנטי מדויק במבחן Hands-Free');
        onUnlockBadge('אלוף שליפה קולית');
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });

        // Confirm the correct answer aloud and immediately read the next question
        await voiceService.speakHebrew('נכון מאוד!');
        if (isHandsFreeRef.current) {
          advanceAndSpeakNext();
        } else {
          setStatusPhase('idle');
        }
      } else {
        setStatusPhase('feedback_incorrect');
        setLastEvaluationMessage(
          `לא מדויק (נקלט: "${trimmed}"). התשובה הנכונה: ${q.correctDisplayAnswer}`
        );
        soundEffects.playError();

        // Notify the user that the answer is incorrect, read the full correct answer aloud,
        // and ONLY THEN proceed to the next question.
        await voiceService.speakHebrew(
          `לא מדויק. התשובה הנכונה היא: ${q.spokenFullAnswer}`
        );
        if (isHandsFreeRef.current) {
          advanceAndSpeakNext();
        } else {
          setStatusPhase('idle');
        }
      }
    },
    [onEarnPoints, onUnlockBadge]
  );

  const handleVoiceCommand = useCallback(
    async (action: VoiceTriggerAction) => {
      voiceService.stopListening({ silent: true });
      voiceService.stopSpeaking();

      if (action === 'stop') {
        setIsHandsFreeActive(false);
        setStatusPhase('idle');
        await voiceService.speakHebrew('אימון קולי הופסק');
        return;
      }

      if (action === 'repeat') {
        if (currentQuestionRef.current) {
          speakAndListenQuestion(currentQuestionRef.current);
        }
        return;
      }

      if (action === 'hint') {
        const q = currentQuestionRef.current;
        if (q) {
          const initials = getPAOInitials(q.item.number, majorDigits).initials;
          await voiceService.speakHebrew(`רמז: ראשי התיבות הם ${initials}`);
          if (isHandsFreeRef.current) {
            startListeningPhase();
          }
        }
        return;
      }

      if (action === 'next') {
        advanceAndSpeakNext();
      }
    },
    [majorDigits]
  );

  const startListeningPhase = useCallback(() => {
    if (!isHandsFreeRef.current) return;
    setStatusPhase('listening');
    setLiveTranscript('');
    setErrorMessage(null);

    voiceService.startListening(
      {
        onInterimResult: (interim) => {
          setLiveTranscript(interim);
        },
        onFinalResult: (finalText) => {
          handleAnswerEvaluation(finalText);
        },
        onTriggerCommand: (cmd) => {
          handleVoiceCommand(cmd);
        },
        onError: (code, humanMsg) => {
          if (code === 'not-allowed' || code === 'service-not-allowed') {
            setIsHandsFreeActive(false);
            isHandsFreeRef.current = false;
            setStatusPhase('idle');
            setShowMicPermissionPrompt(true);
          } else if (code === 'audio-capture') {
            setErrorMessage(humanMsg);
            setIsHandsFreeActive(false);
            isHandsFreeRef.current = false;
            setStatusPhase('idle');
          }
        },
      },
      {
        continuous: true,
        unlimitedThinkingTime: true,
        postSpeechSilenceMs: 2400,
      }
    );
  }, [handleAnswerEvaluation, handleVoiceCommand]);

  const speakAndListenQuestion = useCallback(
    async (q: VoiceQuestion) => {
      if (!isHandsFreeRef.current) return;
      voiceService.stopListening({ silent: true });
      setStatusPhase('speaking');
      setLiveTranscript('');
      setLastEvaluationMessage('');
      setSemanticExplanation('');

      await voiceService.speakHebrew(q.spokenPrompt);

      if (isHandsFreeRef.current) {
        startListeningPhase();
      }
    },
    [startListeningPhase]
  );

  const advanceAndSpeakNext = useCallback(() => {
    if (readyItems.length === 0) return;
    voiceService.stopListening({ silent: true });
    voiceService.stopSpeaking();

    const { item, progress } = advanceToNextDeckItem(
      'workout_pao_voice',
      readyItems,
      (i) => i.number
    );
    setDeckProgress(progress);

    if (item) {
      const nextQ = buildQuestionFromItem(item, questionMode);
      setCurrentQuestion(nextQ);
      currentQuestionRef.current = nextQ;
      if (isHandsFreeRef.current) {
        setTimeout(() => {
          speakAndListenQuestion(nextQ);
        }, 250);
      } else {
        setStatusPhase('idle');
      }
    }
  }, [readyItems, questionMode, buildQuestionFromItem, speakAndListenQuestion]);

  const confirmMicPermissionAndStart = async () => {
    setShowMicPermissionPrompt(false);
    setErrorMessage(null);

    const perm = await voiceService.requestMicrophonePermission();
    if (!perm.granted && perm.errorMessage) {
      setErrorMessage(perm.errorMessage);
      return;
    }

    voiceService.markMicPermissionGranted();
    setIsHandsFreeActive(true);
    isHandsFreeRef.current = true;
    if (currentQuestion) {
      setTimeout(() => {
        speakAndListenQuestion(currentQuestion);
      }, 150);
    }
  };

  const toggleHandsFreeSession = async () => {
    if (isHandsFreeActive) {
      setIsHandsFreeActive(false);
      isHandsFreeRef.current = false;
      setStatusPhase('idle');
      voiceService.stopListening({ silent: true });
      voiceService.stopSpeaking();
    } else {
      setErrorMessage(null);
      if (!voiceService.hasMicPermission()) {
        setShowMicPermissionPrompt(true);
        return;
      }
      await confirmMicPermissionAndStart();
    }
  };

  const supported = voiceService.isSupported();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner & Explanation */}
      <div className="bg-gradient-to-r from-indigo-950 via-purple-950/80 to-slate-950 border border-indigo-500/40 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-black">
              <Headphones className="w-3.5 h-3.5 text-indigo-400" />
              <span>מבחן שליפה קולי אוטונומי (Hands-Free + ניתוח סמנטי Gemini)</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              אימון קולי ללא ידיים — זמן מחשבה חופשי והערכה רעיונית חכמה
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              המערכת מקריאה את השאלה ופותחת את המיקרופון עם <strong>זמן מחשבה ללא הגבלה</strong>. ענה בשפה חופשית וטבעית ללא צורך במילות קוד לעצירה — תשובתך מתומללת ונשלחת ל-Gemini לבדיקת דיוק רעיוני מול מסד הנתונים.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onExitVoiceMode && (
              <button
                onClick={() => {
                  setIsHandsFreeActive(false);
                  voiceService.stopListening({ silent: true });
                  voiceService.stopSpeaking();
                  onExitVoiceMode();
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer"
              >
                חזרה למבחן הרגיל
              </button>
            )}
          </div>
        </div>

        {/* Mode Selector */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-400 ml-1">מה לתרגל בקול:</span>
            {[
              { id: 'scene', label: '🎬 סצנה / שלשה מלאה (מומלץ)' },
              { id: 'mixed', label: '🎲 מעורב אקראי' },
              { id: 'triplet', label: '👥 שלשה (P+A+O)' },
              { id: 'person', label: '👤 דמויות (P)' },
              { id: 'action', label: '⚡ פעולות (A)' },
              { id: 'object', label: '📦 חפצים (O)' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  const newMode = m.id as VoiceQuestionType;
                  setQuestionMode(newMode);
                  if (currentQuestion) {
                    const updated = buildQuestionFromItem(currentQuestion.item, newMode);
                    setCurrentQuestion(updated);
                    currentQuestionRef.current = updated;
                    if (isHandsFreeActive) {
                      speakAndListenQuestion(updated);
                    }
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  questionMode === m.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
              הצלחות: {correctCount} / {totalAttempted}
            </span>
          </div>
        </div>
      </div>

      {/* Browser Support Warning */}
      {!supported.stt && (
        <div className="bg-amber-950/60 border border-amber-500/50 rounded-2xl p-4 flex items-center gap-3 text-amber-200 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <strong>שים לב:</strong> הדפדפן הנוכחי אינו תומך במלואו בזיהוי דיבור אוטומטי (Web Speech API). לחוויה קולית מלאה מומלץ להשתמש בדפדפן <strong>Google Chrome</strong>.
          </div>
        </div>
      )}

      {/* Deck Progress */}
      <div className="w-full max-w-3xl mx-auto">
        <QuizDeckProgressBar
          progress={deckProgress}
          onResetDeck={() => {
            resetQuizDeck('workout_pao_voice');
            advanceAndSpeakNext();
          }}
          deckTitle="סבב שליפה קולית (PAO)"
        />
      </div>

      {/* Main Voice Control & Active Question Card */}
      {currentQuestion && (
        <div className="w-full max-w-3xl mx-auto bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          {/* Status Indicator Pill */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              {statusPhase === 'listening' && (
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-black animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span>מקשיב לתשובתך... (זמן מחשבה ללא הגבלה)</span>
                </span>
              )}
              {statusPhase === 'speaking' && (
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 text-xs font-black">
                  <Volume2 className="w-4 h-4 text-indigo-400 animate-bounce" />
                  <span>מקריא בקול...</span>
                </span>
              )}
              {statusPhase === 'evaluating' && (
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/50 text-purple-200 text-xs font-black">
                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                  <span>מנתח תשובה סמנטית מול Gemini...</span>
                </span>
              )}
              {statusPhase === 'feedback_correct' && (
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-black">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>תשובה נכונה! מיד עובר לשאלה הבאה...</span>
                </span>
              )}
              {statusPhase === 'feedback_incorrect' && (
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-black">
                  <XCircle className="w-4 h-4 text-amber-400" />
                  <span>מקריא את התשובה המלאה לפני מעבר לשאלה הבאה...</span>
                </span>
              )}
              {statusPhase === 'idle' && (
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 text-xs font-bold">
                  <MicOff className="w-3.5 h-3.5" />
                  <span>ממתין להפעלה</span>
                </span>
              )}
            </div>

            <span className="text-xs font-mono text-amber-300 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20 font-bold">
              ר"ת: {getPAOInitials(currentQuestion.item.number, majorDigits).initials}
            </span>
          </div>

          {/* Question Display */}
          <div className="py-4 space-y-2">
            <span className="text-xs sm:text-sm font-bold text-indigo-400 block">
              {currentQuestion.displayTitle}
            </span>
            <div className="text-6xl sm:text-7xl font-black font-mono text-white tracking-wider">
              {currentQuestion.displayValue}
            </div>
          </div>

          {/* Live Transcript Box */}
          <div className="min-h-[84px] flex flex-col items-center justify-center bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2">
            {liveTranscript ? (
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block">התשובה שלך (תמלול חי):</span>
                <p className="text-base sm:text-lg font-black text-white">"{liveTranscript}"</p>
              </div>
            ) : statusPhase === 'listening' ? (
              <p className="text-xs sm:text-sm text-rose-300 font-semibold">
                🎤 המיקרופון פתוח (זמן מחשבה חופשי ללא הגבלה) — דבר בשפה טבעית, והמערכת תזהה אוטומטית כשסיימת לענות
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                לחץ על הכפתור הראשי למטה להפעלת רצף שליפה קולי אוטונומי
              </p>
            )}

            {statusPhase === 'listening' && liveTranscript.trim().length > 0 && (
              <button
                type="button"
                onClick={() => voiceService.completeListeningNow()}
                className="mt-1 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer shadow-md transition-all"
              >
                סיימתי לענות — בדוק תשובה כעת ↵
              </button>
            )}
          </div>

          {/* Evaluation Feedback Banner */}
          {lastEvaluationMessage && (
            <div
              className={`p-4 rounded-2xl border text-sm font-bold space-y-1.5 animate-fadeIn ${
                statusPhase === 'feedback_correct'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              }`}
            >
              <div>{lastEvaluationMessage}</div>
              {semanticExplanation && (
                <div className="text-xs font-normal text-slate-200">{semanticExplanation}</div>
              )}
              {statusPhase === 'feedback_incorrect' && currentQuestion.item.scene && (
                <div className="text-xs text-amber-200 pt-1 border-t border-rose-500/20">
                  🎬 סצנה מלאה: "{currentQuestion.item.scene}"
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Big Hands-Free Control Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={toggleHandsFreeSession}
              className={`px-7 py-4 rounded-2xl font-black text-sm sm:text-base flex items-center gap-2.5 shadow-xl transition-all cursor-pointer active:scale-95 ${
                isHandsFreeActive
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30'
              }`}
            >
              {isHandsFreeActive ? (
                <>
                  <Square className="w-5 h-5 fill-white" />
                  <span>עצור אימון קולי</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-white" />
                  <span>התחל מבחן שליפה קולי (Hands-Free)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentQuestion) {
                  if (!isHandsFreeActive) {
                    setIsHandsFreeActive(true);
                    isHandsFreeRef.current = true;
                  }
                  speakAndListenQuestion(currentQuestion);
                }
              }}
              className="px-4 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
              title="הקרא שוב את השאלה הנוכחית"
            >
              <RotateCcw className="w-4 h-4 text-indigo-400" />
              <span>הקרא שוב</span>
            </button>

            <button
              type="button"
              onClick={advanceAndSpeakNext}
              className="px-4 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
              title="דלג לשאלה הבאה"
            >
              <SkipForward className="w-4 h-4 text-emerald-400" />
              <span>הבא</span>
            </button>
          </div>

          {/* Hands-Free Workflow Guide */}
          <div className="pt-4 border-t border-slate-800/80 text-right">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>כיצד פועל מבחן השליפה הקולי והניתוח הסמנטי:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-slate-300">
                <strong className="text-indigo-400 block">1. הקראה וזמן מחשבה חופשי</strong>
                המערכת מקריאה את השאלה ופותחת מיקרופון יחיד עם זמן מחשבה בלתי מוגבל.
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-slate-300">
                <strong className="text-purple-400 block">2. שפה טבעית + ניתוח Gemini</strong>
                דבר חופשי ללא מילות קוד לעצירה. Gemini בודק דיוק רעיוני מול התשובה במסד הנתונים.
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-slate-300">
                <strong className="text-emerald-400 block">3. משוב קולי חכם</strong>
                בתשובה נכונה עוברים מיד לשאלה הבאה; בשגיאה המערכת מקריאה את התשובה המלאה ורק אז ממשיכה.
              </div>
            </div>
          </div>
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
