import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Radio,
  Flame,
  X,
  Headphones,
} from 'lucide-react';
import { PAOItem } from '../../types/memory';
import { voiceService } from '../../lib/voiceService';
import { soundEffects } from '../../lib/soundEffects';

export type VoiceQuizMode = 'triplet' | 'person' | 'action' | 'object' | 'mixed';

interface PAOHandsFreeVoiceQuizProps {
  readyItems: PAOItem[];
  allPaoItems: PAOItem[];
  onEarnPoints?: (amount: number, reason?: string) => void;
  onClose?: () => void;
}

type QuizPhase =
  | 'idle'
  | 'prompting' // System is speaking question via TTS
  | 'listening' // Mic is active, capturing user voice
  | 'evaluating' // Checking answer
  | 'feedback' // Showing & speaking feedback
  | 'paused';

export const PAOHandsFreeVoiceQuiz: React.FC<PAOHandsFreeVoiceQuizProps> = ({
  readyItems,
  allPaoItems,
  onEarnPoints,
  onClose,
}) => {
  const activeDeck = readyItems.length > 0 ? readyItems : allPaoItems;

  const [quizMode, setQuizMode] = useState<VoiceQuizMode>('mixed');
  const [phase, setPhase] = useState<QuizPhase>('idle');
  const [currentItem, setCurrentItem] = useState<PAOItem | null>(null);
  const [currentQuestionType, setCurrentQuestionType] = useState<
    'triplet' | 'person' | 'action' | 'object'
  >('triplet');
  const [currentQuestionText, setCurrentQuestionText] = useState('');
  const [recognizedText, setRecognizedText] = useState('');
  const [lastResult, setLastResult] = useState<'correct' | 'incorrect' | null>(null);
  const [correctAnswerSummary, setCorrectAnswerSummary] = useState('');
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMicPermissionGranted, setIsMicPermissionGranted] = useState<boolean | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  const stopListeningRef = useRef<(() => void) | null>(null);
  const isLoopActiveRef = useRef(false);
  const currentItemRef = useRef<PAOItem | null>(null);
  const questionTypeRef = useRef<'triplet' | 'person' | 'action' | 'object'>('triplet');

  currentItemRef.current = currentItem;
  questionTypeRef.current = currentQuestionType;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isLoopActiveRef.current = false;
      voiceService.stopSpeaking();
      if (stopListeningRef.current) {
        stopListeningRef.current();
      }
    };
  }, []);

  /**
   * Generates a question prompt text based on selected mode
   */
  const generateQuestionFor = useCallback(
    (item: PAOItem, mode: VoiceQuizMode) => {
      let qType: 'triplet' | 'person' | 'action' | 'object' = 'triplet';

      if (mode === 'mixed') {
        const types: Array<'triplet' | 'person' | 'action' | 'object'> = [
          'triplet',
          'person',
          'action',
          'object',
        ];
        qType = types[Math.floor(Math.random() * types.length)];
      } else {
        qType = mode;
      }

      let spokenQuestion = '';
      if (qType === 'triplet') {
        spokenQuestion = `מה השלשה של מספר ${item.number}?`;
      } else if (qType === 'person') {
        spokenQuestion = `מי האדם של מספר ${item.number}?`;
      } else if (qType === 'action') {
        spokenQuestion = `מה הפעולה של מספר ${item.number}?`;
      } else if (qType === 'object') {
        spokenQuestion = `מה החפץ של מספר ${item.number}?`;
      }

      return { qType, spokenQuestion };
    },
    []
  );

  /**
   * Evaluates the spoken transcript and proceeds with the automated hands-free flow
   */
  const handleAnswerEvaluation = useCallback(
    async (spoken: string) => {
      if (!isLoopActiveRef.current) return;
      if (stopListeningRef.current) {
        stopListeningRef.current();
        stopListeningRef.current = null;
      }

      setPhase('evaluating');
      const item = currentItemRef.current;
      const qType = questionTypeRef.current;

      if (!item) return;

      const evalResult = voiceService.evaluateAnswer(
        spoken,
        item.number,
        {
          person: item.person,
          action: item.action,
          object: item.object,
          scene: item.scene,
        },
        qType
      );

      const isCorrect = evalResult.isCorrect;
      setLastResult(isCorrect ? 'correct' : 'incorrect');

      if (isCorrect) {
        // Correct answer flow
        setStreak((prev) => prev + 1);
        setScore((prev) => prev + 15);
        onEarnPoints?.(15, 'מענה קולי נכון בשליפה קולית');

        // Play positive success chime
        soundEffects.playSuccessChime();
        setPhase('feedback');

        // Wait 1200ms of visual/audio delight, then next question
        setTimeout(() => {
          if (isLoopActiveRef.current) {
            askNextQuestion();
          }
        }, 1200);
      } else {
        // Incorrect answer flow
        setStreak(0);
        soundEffects.playErrorBuzzer();
        setPhase('feedback');

        // Prepare spoken correction
        let correctionText = '';
        if (qType === 'triplet') {
          correctionText = `התשובה היא: ${item.person}, ${item.action}, ${item.object}.`;
        } else if (qType === 'person') {
          correctionText = `האדם של ${item.number} הוא ${item.person}.`;
        } else if (qType === 'action') {
          correctionText = `הפעולה של ${item.number} היא ${item.action}.`;
        } else if (qType === 'object') {
          correctionText = `החפץ של ${item.number} הוא ${item.object}.`;
        }

        setCorrectAnswerSummary(correctionText);

        // Speak the correct answer via Google Text-to-Speech
        await voiceService.speakHebrew(correctionText, 0.95);

        // Advance to next question after speaking
        setTimeout(() => {
          if (isLoopActiveRef.current) {
            askNextQuestion();
          }
        }, 900);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onEarnPoints]
  );

  /**
   * Starts listening to user speech strictly AFTER TTS has completely finished speaking
   */
  const startListeningPhase = useCallback(() => {
    if (!isLoopActiveRef.current) return;

    setPhase('listening');
    setRecognizedText('');
    setErrorMessage(null);

    // Play subtle mic activation beep
    soundEffects.playMicListeningBeep();

    const stopFn = voiceService.startListening({
      onResult: (transcript, isFinal) => {
        setRecognizedText(transcript);

        // Voice skip command
        const lower = transcript.toLowerCase();
        if (lower.includes('דלג') || lower.includes('הבא') || lower.includes('עבור')) {
          if (stopListeningRef.current) stopListeningRef.current();
          askNextQuestion();
          return;
        }

        if (isFinal && transcript.trim().length > 0) {
          handleAnswerEvaluation(transcript);
        }
      },
      onError: (err) => {
        console.warn('Speech recognition warning:', err);
        if (err.includes('הרשאת מיקרופון') || err.includes('not-allowed')) {
          setIsMicPermissionGranted(false);
          setShowPermissionModal(true);
          setErrorMessage('נדרש אישור גישה למיקרופון עבור אימון ללא מגע ידיים.');
          setPhase('paused');
          isLoopActiveRef.current = false;
        } else if (err.includes('לא זוהה דיבור')) {
          // If no speech detected after silence timeout, treat as incorrect
          handleAnswerEvaluation('');
        }
      },
      onEnd: () => {
        // If mic ended without final result, evaluate whatever we caught
        // (Evaluation is handled by onResult or silence timeout)
      },
      silenceTimeoutMs: 7000,
    });

    stopListeningRef.current = stopFn;
    setIsMicPermissionGranted(true);
  }, [handleAnswerEvaluation]);

  /**
   * Core Loop: Selects next random question and speaks it
   */
  const askNextQuestion = useCallback(async () => {
    if (!isLoopActiveRef.current || activeDeck.length === 0) return;

    // Pick a random item from deck
    const nextItem = activeDeck[Math.floor(Math.random() * activeDeck.length)];
    const { qType, spokenQuestion } = generateQuestionFor(nextItem, quizMode);

    setCurrentItem(nextItem);
    setCurrentQuestionType(qType);
    setCurrentQuestionText(spokenQuestion);
    setRecognizedText('');
    setLastResult(null);
    setCorrectAnswerSummary('');
    setPhase('prompting');

    // 1. Speak the question via high-quality natural Gemini TTS / speech engine
    await voiceService.speakHebrew(spokenQuestion, 0.95);

    // 2. Strict timing synchronization: wait 350ms of silence before opening mic to prevent echo loop!
    setTimeout(() => {
      if (isLoopActiveRef.current) {
        startListeningPhase();
      }
    }, 350);
  }, [activeDeck, generateQuestionFor, quizMode, startListeningPhase]);

  /**
   * Starts the hands-free session loop
   */
  const startSessionCore = useCallback(() => {
    isLoopActiveRef.current = true;
    setErrorMessage(null);
    setPhase('prompting');
    askNextQuestion();
  }, [askNextQuestion]);

  /**
   * Requests browser microphone permission via getUserMedia and pops native browser dialog
   */
  const handleRequestMicPermission = async () => {
    setIsRequestingPermission(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        setIsMicPermissionGranted(true);
        setShowPermissionModal(false);
        setIsRequestingPermission(false);
        setErrorMessage(null);
        startSessionCore();
      } else {
        throw new Error('getUserMedia not supported');
      }
    } catch (err: any) {
      console.warn('Microphone permission request error:', err);
      setIsRequestingPermission(false);
      setIsMicPermissionGranted(false);
      setErrorMessage('הרשאת המיקרופון נדחתה או נחסמה. לחץ שוב כדי לפתוח את חלון האישור.');
    }
  };

  /**
   * Starts the hands-free session, requesting permission popup first if needed
   */
  const handleStartSession = async () => {
    if (isMicPermissionGranted) {
      startSessionCore();
      return;
    }

    // Try checking browser permission status if supported
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (status.state === 'granted') {
          setIsMicPermissionGranted(true);
          startSessionCore();
          return;
        }
      } catch {}
    }

    // Show friendly in-app modal popup so user can click to trigger browser permission dialog!
    setShowPermissionModal(true);
  };

  /**
   * Pauses the hands-free session
   */
  const handlePauseSession = () => {
    isLoopActiveRef.current = false;
    voiceService.stopSpeaking();
    if (stopListeningRef.current) {
      stopListeningRef.current();
      stopListeningRef.current = null;
    }
    setPhase('paused');
  };

  /**
   * Resumes the hands-free session
   */
  const handleResumeSession = () => {
    isLoopActiveRef.current = true;
    askNextQuestion();
  };

  /**
   * Skips to the next question immediately
   */
  const handleSkipQuestion = () => {
    voiceService.stopSpeaking();
    if (stopListeningRef.current) {
      stopListeningRef.current();
      stopListeningRef.current = null;
    }
    askNextQuestion();
  };

  return (
    <div className="w-full bg-slate-950 border-2 border-indigo-500/40 rounded-3xl p-5 sm:p-7 space-y-6 text-right text-slate-100 shadow-2xl relative overflow-hidden animate-fadeIn select-none">
      {/* Background ambient driving glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Mode Badge, Stats, and Close */}
      <div className="flex items-center justify-between border-b border-indigo-500/20 pb-4 flex-wrap gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>אימון שליפה קולי ללא מגע ידיים</span>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-0.5 rounded-full font-bold">
                Hands-Free Mode
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              אימון מלא באמצעות קול בלבד – מותאם לנהיגה, הליכה וספורט
            </p>
          </div>
        </div>

        {/* Stats & Close Button */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-bold text-amber-300">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>רצף: {streak}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-bold text-emerald-400">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>ניקוד: {score}</span>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={() => {
                handlePauseSession();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="סגור מצב נהיגה"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Mode Filter Selector */}
      <div className="flex items-center gap-2 flex-wrap bg-slate-900/80 p-2 rounded-2xl border border-slate-800/80 text-xs">
        <span className="text-slate-400 font-bold ml-1">סוג השאלות:</span>
        {[
          { id: 'mixed', label: '🎯 הכל מעורב' },
          { id: 'triplet', label: '🎬 שלשה שלמה (דמות+פעולה+חפץ)' },
          { id: 'person', label: '👤 דמויות בלבד' },
          { id: 'action', label: '⚡ פעולות בלבד' },
          { id: 'object', label: '📦 חפצים בלבד' },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setQuizMode(m.id as VoiceQuizMode);
              if (phase !== 'idle' && phase !== 'paused') {
                askNextQuestion();
              }
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              quizMode === m.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Mic Permission Warning */}
      {isMicPermissionGranted === false && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border-2 border-rose-500/40 text-rose-200 flex items-start gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-sm font-bold block">נדרשת הרשאת מיקרופון</strong>
            <p className="text-xs text-rose-300/90 leading-relaxed">
              כדי להשתמש במצב ה-Hands-Free, אנא אשר גישה למיקרופון בהגדרות הדפדפן (סמל המנעול ליד
              שורת הכתובת).
            </p>
          </div>
        </div>
      )}

      {/* Main Driving Stage: Huge Visual Status for Glancing from a Distance */}
      <div className="py-8 sm:py-12 px-4 rounded-3xl bg-slate-900/95 border-2 border-indigo-500/40 flex flex-col items-center justify-center text-center space-y-6 shadow-2xl relative overflow-hidden min-h-[300px]">
        {/* Pulsing Status Icon */}
        <div className="relative">
          {phase === 'prompting' && (
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-indigo-600/30 border-4 border-indigo-400 flex items-center justify-center animate-pulse shadow-lg shadow-indigo-500/40">
              <Volume2 className="w-12 h-12 text-indigo-300" />
            </div>
          )}

          {phase === 'listening' && (
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-pink-600/30 border-4 border-pink-400 flex items-center justify-center shadow-lg shadow-pink-500/50">
              <span className="absolute inset-0 rounded-full border-4 border-pink-400 animate-ping opacity-75" />
              <Mic className="w-12 h-12 text-pink-300 animate-bounce" />
            </div>
          )}

          {phase === 'evaluating' && (
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-purple-600/30 border-4 border-purple-400 flex items-center justify-center animate-spin">
              <Radio className="w-10 h-10 text-purple-300" />
            </div>
          )}

          {phase === 'feedback' && lastResult === 'correct' && (
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-emerald-600/30 border-4 border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/50 animate-bounce">
              <CheckCircle2 className="w-14 h-14 text-emerald-300 stroke-[2.5]" />
            </div>
          )}

          {phase === 'feedback' && lastResult === 'incorrect' && (
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-rose-600/30 border-4 border-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/50">
              <XCircle className="w-14 h-14 text-rose-300 stroke-[2.5]" />
            </div>
          )}

          {(phase === 'idle' || phase === 'paused') && (
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center text-slate-400">
              <MicOff className="w-12 h-12" />
            </div>
          )}
        </div>

        {/* Phase Text & Current Question */}
        <div className="space-y-3 max-w-xl">
          {phase === 'prompting' && (
            <>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase tracking-wider">
                המערכת שואלת כעת...
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {currentQuestionText}
              </h2>
            </>
          )}

          {phase === 'listening' && (
            <>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-pink-500/20 text-pink-300 border border-pink-500/40 uppercase tracking-wider animate-pulse">
                מקשיב לתשובתך עכשיו... דבר בקול ברור
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {currentQuestionText}
              </h2>
              {recognizedText ? (
                <div className="p-3 bg-slate-950/80 rounded-2xl border border-pink-500/40 text-pink-200 text-base font-bold font-mono">
                  &quot;{recognizedText}&quot;
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  אמור את התשובה (או אמור &quot;דלג&quot; למעבר לשאלה הבאה)
                </p>
              )}
            </>
          )}

          {phase === 'feedback' && lastResult === 'correct' && (
            <div className="space-y-2 animate-fadeIn">
              <h2 className="text-3xl sm:text-4xl font-black text-emerald-400">
                מעולה! תשובה נכונה (+15 נקודות)
              </h2>
              <p className="text-sm text-emerald-200/90 font-medium">
                עובר מיד לשאלה הבאה ברצף...
              </p>
            </div>
          )}

          {phase === 'feedback' && lastResult === 'incorrect' && (
            <div className="space-y-2 animate-fadeIn">
              <h2 className="text-2xl sm:text-3xl font-black text-rose-400">
                לא מדויק
              </h2>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-bold">
                {correctAnswerSummary}
              </p>
            </div>
          )}

          {phase === 'idle' && (
            <>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                מוכן לאימון קולי ללא מגע ידיים?
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                המערכת תקריא שאלות בקול, תקשיב לתשובותיך ותשמיע צליל אישור או תיקון אוטומטי.
              </p>
            </>
          )}

          {phase === 'paused' && (
            <>
              <h2 className="text-2xl sm:text-3xl font-black text-amber-400">
                האימון הקולי מושהה
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                לחץ על &quot;המשך אימון&quot; לחזרה לרצף השליפה הקולית
              </p>
            </>
          )}
        </div>
      </div>

      {/* Prominent Action Controls Bar */}
      <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
        {phase === 'idle' && (
          <button
            type="button"
            onClick={handleStartSession}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-black text-base rounded-2xl flex items-center gap-3 shadow-xl shadow-indigo-600/30 cursor-pointer transition-all active:scale-95"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>התחל אימון קולי (Start)</span>
          </button>
        )}

        {(phase === 'prompting' || phase === 'listening' || phase === 'feedback') && (
          <>
            <button
              type="button"
              onClick={handlePauseSession}
              className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-sm rounded-2xl border border-slate-700 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Pause className="w-4 h-4" />
              <span>השהה אימון</span>
            </button>

            <button
              type="button"
              onClick={handleSkipQuestion}
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer transition-all active:scale-95"
            >
              <SkipForward className="w-4 h-4" />
              <span>דלג לשאלה הבאה</span>
            </button>
          </>
        )}

        {phase === 'paused' && (
          <>
            <button
              type="button"
              onClick={handleResumeSession}
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl flex items-center gap-2 shadow-lg shadow-emerald-900/40 cursor-pointer transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>המשך אימון קולי</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setScore(0);
                setStreak(0);
                handleResumeSession();
              }}
              className="px-4 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-sm rounded-2xl border border-slate-700 flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>איפוס והתחלה מחדש</span>
            </button>
          </>
        )}
      </div>

      {/* Voice commands hint footer */}
      <div className="pt-3 border-t border-slate-800 text-center text-[11px] text-slate-500 flex items-center justify-center gap-3">
        <span>💡 פקודות קוליות נתמכות: אמור &quot;דלג&quot; או &quot;הבא&quot; למעבר מהיר</span>
        <span>•</span>
        <span>סנכרון זמנים קפדני מונע קליטה חוזרת של קול השאלה</span>
      </div>

      {/* In-App Microphone Permission Modal Popup */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border-2 border-indigo-500/60 rounded-3xl max-w-md w-full p-6 sm:p-7 text-right space-y-5 shadow-2xl relative">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-3.5 rounded-2xl bg-indigo-600/25 text-indigo-400 border border-indigo-500/30">
                <Mic className="w-7 h-7 animate-pulse text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">אישור גישה למיקרופון</h3>
                <p className="text-xs text-indigo-300 font-semibold">אימון שליפה קולי Hands-Free</p>
              </div>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              כדי לאפשר מענה קולי ללא מגע ידיים (בנהיגה, הליכה או אימון), לחץ על הכפתור למטה ובחלון הקופץ שייפתח בדפדפן בחר באפשרות <strong className="text-emerald-400">&quot;אפשר&quot; (Allow)</strong>.
            </p>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleRequestMicPermission}
                disabled={isRequestingPermission}
                className="flex-1 py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <Mic className="w-4 h-4" />
                <span>{isRequestingPermission ? 'ממתין לאישורך בחלון הדפדפן...' : 'אפשר גישה למיקרופון עכשיו'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPermissionModal(false)}
                className="py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-2xl border border-slate-700 cursor-pointer"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
