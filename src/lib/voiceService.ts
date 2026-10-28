import { isHebrewFuzzyMatch } from './fuzzyMatch';

export type VoiceTriggerAction = 'next' | 'repeat' | 'stop' | 'hint';

export interface VoiceRecognitionCallbacks {
  onInterimResult?: (transcript: string) => void;
  onFinalResult?: (transcript: string) => void;
  onTriggerCommand?: (action: VoiceTriggerAction, rawTranscript: string) => void;
  onError?: (errorCode: string, humanMessage: string) => void;
  onEnd?: () => void;
  onStart?: () => void;
}

export interface SemanticRecallEvalResult {
  isCorrect: boolean;
  score: number;
  verdictTitle: string;
  explanation: string;
  memoryTip?: string;
  matchedValue?: string;
}

// Optional spoken commands if the user explicitly says them, though no trigger words are required to stop or submit
const TRIGGER_MAP: Record<VoiceTriggerAction, string[]> = {
  next: ['הבא', 'שאלה הבאה', 'דלג', 'עבור הלאה'],
  repeat: ['חזור על השאלה', 'שוב פעם'],
  stop: ['עצור אימון', 'סיים אימון', 'הפסק אימון'],
  hint: ['תן רמז', 'בקש רמז'],
};

class VoiceService {
  private synthesis: SpeechSynthesis | null = null;
  private recognition: any = null;
  private isListeningState: boolean = false;
  private isStartingListening: boolean = false;
  private activeSessionId: number = 0;
  private activeMediaStream: MediaStream | null = null;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private postSpeechTimer: ReturnType<typeof setTimeout> | null = null;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;
  private hebrewVoice: SpeechSynthesisVoice | null = null;
  private activeAudioElement: HTMLAudioElement | null = null;
  private ttsAbortController: AbortController | null = null;
  private currentAccumulatedTranscript: string = '';
  private currentInterimTranscript: string = '';
  private currentCallbacks: VoiceRecognitionCallbacks | null = null;
  private micPermissionGrantedInSession: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        this.synthesis = window.speechSynthesis;
        this.loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
      }
    }
  }

  private loadVoices() {
    if (!this.synthesis) return;
    const voices = this.synthesis.getVoices();
    const heVoices = voices.filter(
      (v) =>
        v.lang.toLowerCase().includes('he') ||
        v.lang.toLowerCase().includes('iw') ||
        v.name.toLowerCase().includes('hebrew') ||
        v.name.includes('עברית')
    );

    if (heVoices.length > 0) {
      const preferred =
        heVoices.find(
          (v) =>
            v.name.toLowerCase().includes('natural') ||
            v.name.toLowerCase().includes('google') ||
            v.name.toLowerCase().includes('avri') ||
            v.name.toLowerCase().includes('hila') ||
            v.name.toLowerCase().includes('carmit') ||
            v.name.toLowerCase().includes('online')
        ) || heVoices[0];

      this.hebrewVoice = preferred;
    }
  }

  private stopActiveMediaStream() {
    if (this.activeMediaStream) {
      try {
        this.activeMediaStream.getTracks().forEach((track) => track.stop());
      } catch {
        // ignore
      }
      this.activeMediaStream = null;
    }
  }

  private clearAllRecognitionTimers() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.postSpeechTimer) {
      clearTimeout(this.postSpeechTimer);
      this.postSpeechTimer = null;
    }
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
  }

  private detachAndDestroyRecognition() {
    if (this.recognition) {
      const oldRec = this.recognition;
      this.recognition = null;
      try {
        oldRec.onstart = null;
        oldRec.onresult = null;
        oldRec.onerror = null;
        oldRec.onend = null;
        oldRec.abort();
      } catch {
        try {
          oldRec.stop();
        } catch {
          // ignore
        }
      }
    }
  }

  public isSupported(): { tts: boolean; stt: boolean } {
    if (typeof window === 'undefined') return { tts: false, stt: false };
    const tts = 'speechSynthesis' in window || typeof Audio !== 'undefined';
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const stt = Boolean(SpeechRec);
    return { tts, stt };
  }

  public hasMicPermission(): boolean {
    return this.micPermissionGrantedInSession;
  }

  public markMicPermissionGranted(): void {
    this.micPermissionGrantedInSession = true;
  }

  public async requestMicrophonePermission(): Promise<{
    granted: boolean;
    errorMessage?: string;
  }> {
    if (typeof window === 'undefined') {
      return { granted: true };
    }

    // Enforce Audio Collision Prevention: stop any active listening before requesting microphone permission
    if (this.isListeningState || this.isStartingListening || this.recognition) {
      this.stopListening({ silent: true });
    }

    // 1. Trigger native browser microphone permission popup via getUserMedia directly in the user click gesture
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        this.activeMediaStream = stream;
        this.stopActiveMediaStream();
        this.micPermissionGrantedInSession = true;
        return { granted: true };
      } catch (err: any) {
        this.stopActiveMediaStream();
        const name = err?.name || '';
        if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          return {
            granted: false,
            errorMessage: 'לא נמצא מיקרופון מחובר למכשיר זה.',
          };
        }
        // Fall through to SpeechRecognition permission prompt
      }
    }

    // 2. Fallback: Trigger browser SpeechRecognition permission prompt directly
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      this.micPermissionGrantedInSession = true;
      return { granted: true };
    }

    return new Promise((resolve) => {
      let settled = false;
      const probe = new SpeechRec();
      probe.lang = 'he-IL';
      probe.continuous = false;
      probe.interimResults = false;

      const finish = (result: { granted: boolean; errorMessage?: string }) => {
        if (settled) return;
        settled = true;
        if (result.granted) {
          this.micPermissionGrantedInSession = true;
        }
        try {
          probe.onstart = null;
          probe.onerror = null;
          probe.onend = null;
          probe.abort();
        } catch {
          // ignore
        }
        resolve(result);
      };

      const timeoutId = setTimeout(() => {
        finish({ granted: true });
      }, 1800);

      probe.onstart = () => {
        clearTimeout(timeoutId);
        finish({ granted: true });
      };

      probe.onerror = (event: any) => {
        clearTimeout(timeoutId);
        const code = event?.error || '';
        if (code === 'audio-capture') {
          finish({
            granted: false,
            errorMessage: 'לא נמצא מיקרופון פעיל במכשיר.',
          });
        } else {
          // Allow the session to proceed and request microphone when recognition starts
          finish({ granted: true });
        }
      };

      probe.onend = () => {
        clearTimeout(timeoutId);
        finish({ granted: true });
      };

      try {
        probe.start();
      } catch {
        clearTimeout(timeoutId);
        finish({ granted: true });
      }
    });
  }

  /**
   * Speaks Hebrew text using Gemini AI TTS with instant fallback to browser SpeechSynthesis.
   * Enforces Audio Collision Prevention by stopping any active microphone recording before speaking.
   */
  public speakHebrew(
    text: string,
    options?: {
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: () => void;
      preferFastLocal?: boolean;
    }
  ): Promise<void> {
    return new Promise(async (resolve) => {
      if (typeof window === 'undefined') {
        options?.onEnd?.();
        resolve();
        return;
      }

      // Audio Collision Prevention: Never allow TTS and microphone recording simultaneously
      if (this.isListeningState || this.isStartingListening || this.recognition) {
        this.stopListening({ silent: true });
      }

      this.stopSpeaking();

      const sanitizedText = (text || '')
        .replace(/speak in a [a-z\s]+ voice:?/gi, '')
        .replace(/read aloud:?/gi, '')
        .trim();

      if (!sanitizedText) {
        options?.onEnd?.();
        resolve();
        return;
      }

      const useCloudTts = !options?.preferFastLocal;

      if (useCloudTts) {
        try {
          this.ttsAbortController = new AbortController();
          const timeoutId = setTimeout(() => {
            this.ttsAbortController?.abort();
          }, 5500);

          const res = await fetch('/api/gemini/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: sanitizedText, voiceName: 'Kore' }),
            signal: this.ttsAbortController.signal,
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            if (data?.audioBase64) {
              const mime = data.mimeType || 'audio/wav';
              const audioSrc = `data:${mime};base64,${data.audioBase64}`;
              const audio = new Audio(audioSrc);
              this.activeAudioElement = audio;
              if (options?.rate) {
                audio.playbackRate = Math.max(0.75, Math.min(1.5, options.rate));
              }

              audio.onplay = () => {
                options?.onStart?.();
              };

              audio.onended = () => {
                this.activeAudioElement = null;
                options?.onEnd?.();
                resolve();
              };

              audio.onerror = () => {
                this.activeAudioElement = null;
                this.speakWithBrowserSynthesis(sanitizedText, options, resolve);
              };

              await audio.play();
              return;
            }
          }
        } catch {
          // Fall back seamlessly to local browser synthesis
        }
      }

      this.speakWithBrowserSynthesis(sanitizedText, options, resolve);
    });
  }

  private speakWithBrowserSynthesis(
    text: string,
    options:
      | {
          rate?: number;
          pitch?: number;
          onStart?: () => void;
          onEnd?: () => void;
          onError?: () => void;
        }
      | undefined,
    resolve: () => void
  ) {
    if (!this.synthesis) {
      options?.onEnd?.();
      resolve();
      return;
    }

    try {
      this.synthesis.cancel();
    } catch {
      // ignore
    }

    const cleanSpeechText = text.replace(/[#*_~`•]/g, ' ').replace(/\s+/g, ' ').trim();
    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.lang = 'he-IL';
    utterance.rate = options?.rate ?? 1.0;
    utterance.pitch = options?.pitch ?? 1.0;

    if (!this.hebrewVoice) {
      this.loadVoices();
    }
    if (this.hebrewVoice) {
      utterance.voice = this.hebrewVoice;
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      options?.onEnd?.();
      resolve();
    };

    const safetyMs = Math.max(4500, cleanSpeechText.length * 140);
    const safetyTimer = setTimeout(finish, safetyMs);

    utterance.onstart = () => {
      options?.onStart?.();
    };

    utterance.onend = () => {
      clearTimeout(safetyTimer);
      finish();
    };

    utterance.onerror = () => {
      clearTimeout(safetyTimer);
      options?.onError?.();
      finish();
    };

    try {
      this.synthesis.speak(utterance);
    } catch {
      clearTimeout(safetyTimer);
      finish();
    }
  }

  public stopSpeaking() {
    if (this.ttsAbortController) {
      try {
        this.ttsAbortController.abort();
      } catch {
        // ignore
      }
      this.ttsAbortController = null;
    }
    if (this.activeAudioElement) {
      try {
        this.activeAudioElement.pause();
        this.activeAudioElement.currentTime = 0;
      } catch {
        // ignore
      }
      this.activeAudioElement = null;
    }
    if (this.synthesis) {
      try {
        this.synthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  public detectTriggerCommand(transcript: string): VoiceTriggerAction | null {
    const clean = transcript
      .trim()
      .replace(/[.,!?״"']/g, '')
      .replace(/\s+/g, ' ');
    if (!clean) return null;

    // Only match if the entire utterance is a short command (<= 3 words) so free-flowing answers are never interrupted
    const wordCount = clean.split(' ').length;
    if (wordCount > 3) return null;

    for (const [action, phrases] of Object.entries(TRIGGER_MAP) as [
      VoiceTriggerAction,
      string[],
    ][]) {
      for (const phrase of phrases) {
        if (clean === phrase) {
          return action;
        }
      }
    }
    return null;
  }

  /**
   * Starts a single-instance microphone listening session.
   *
   * AUDIO COLLISION PREVENTION:
   * - Enforces that ONLY ONE microphone recording/listening session can be active at any given time.
   * - Any existing microphone session or TTS playback is immediately terminated before opening the mic.
   *
   * HANDS-FREE UNLIMITED THINKING TIME:
   * - When `unlimitedThinkingTime` is true (default), the user has unlimited time to think before speaking.
   *   If browser SpeechRecognition times out with silence before any speech is uttered, it transparently
   *   re-opens within the same locked session.
   * - Once the user begins speaking in natural free-flowing language, speech is accumulated continuously.
   *   After the user finishes speaking and pauses naturally (`postSpeechSilenceMs`, default 2400ms),
   *   the complete response is automatically submitted without needing any trigger words.
   */
  public startListening(
    callbacks: VoiceRecognitionCallbacks,
    options?: {
      continuous?: boolean;
      silenceTimeoutMs?: number;
      unlimitedThinkingTime?: boolean;
      postSpeechSilenceMs?: number;
    }
  ) {
    if (typeof window === 'undefined') return;
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      callbacks.onError?.(
        'not-supported',
        'הדפדפן שלך אינו תומך בזיהוי דיבור קולי. מומלץ להשתמש בדפדפן Google Chrome.'
      );
      return;
    }

    // STRICT AUDIO COLLISION PREVENTION:
    // Immediately abort any existing microphone session or active TTS before starting a new one.
    this.stopSpeaking();
    this.stopListening({ silent: true });

    this.activeSessionId += 1;
    const sessionId = this.activeSessionId;

    this.isStartingListening = true;
    this.isListeningState = true;
    this.currentAccumulatedTranscript = '';
    this.currentInterimTranscript = '';
    this.currentCallbacks = callbacks;

    const unlimitedThinking = options?.unlimitedThinkingTime ?? true;
    const postSpeechSilenceMs = options?.postSpeechSilenceMs ?? 2400;
    const initialSilenceTimeoutMs = options?.silenceTimeoutMs ?? 0;

    let hasNotifiedStart = false;
    let isSessionFinalized = false;

    const finalizeAndDeliver = () => {
      if (isSessionFinalized || sessionId !== this.activeSessionId) return;
      const fullText = [this.currentAccumulatedTranscript, this.currentInterimTranscript]
        .map((s) => s.trim())
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!fullText) return;

      isSessionFinalized = true;
      this.stopListening({ silent: true });

      const trigger = this.detectTriggerCommand(fullText);
      if (trigger && callbacks.onTriggerCommand) {
        callbacks.onTriggerCommand(trigger, fullText);
      } else {
        callbacks.onFinalResult?.(fullText);
      }
      callbacks.onEnd?.();
    };

    const schedulePostSpeechCompletion = () => {
      if (this.postSpeechTimer) {
        clearTimeout(this.postSpeechTimer);
      }
      this.postSpeechTimer = setTimeout(() => {
        if (sessionId !== this.activeSessionId || isSessionFinalized) return;
        finalizeAndDeliver();
      }, postSpeechSilenceMs);
    };

    const launchRecognitionInstance = () => {
      if (sessionId !== this.activeSessionId || isSessionFinalized) return;

      // Ensure any previous recognition object is detached before creating the single active instance
      this.detachAndDestroyRecognition();

      const rec = new SpeechRec();
      this.recognition = rec;
      rec.lang = 'he-IL';
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 3;

      rec.onstart = () => {
        if (sessionId !== this.activeSessionId) {
          try {
            rec.abort();
          } catch {
            // ignore
          }
          return;
        }
        this.isStartingListening = false;
        this.isListeningState = true;
        if (!hasNotifiedStart) {
          hasNotifiedStart = true;
          callbacks.onStart?.();
        }
      };

      rec.onresult = (event: any) => {
        if (sessionId !== this.activeSessionId || isSessionFinalized) return;

        let newFinalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const text = (res[0]?.transcript || '').trim();
          if (res.isFinal) {
            if (text) {
              newFinalChunk += (newFinalChunk ? ' ' : '') + text;
            }
          } else {
            if (text) {
              interimChunk += (interimChunk ? ' ' : '') + text;
            }
          }
        }

        if (newFinalChunk) {
          this.currentAccumulatedTranscript = [
            this.currentAccumulatedTranscript,
            newFinalChunk,
          ]
            .filter(Boolean)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
        }
        this.currentInterimTranscript = interimChunk;

        const combinedLive = [this.currentAccumulatedTranscript, this.currentInterimTranscript]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (combinedLive) {
          callbacks.onInterimResult?.(combinedLive);
          // User has started speaking -> reset the natural post-speech completion timer
          schedulePostSpeechCompletion();
        }
      };

      rec.onerror = (event: any) => {
        if (sessionId !== this.activeSessionId || isSessionFinalized) return;
        const code = event?.error || 'unknown';

        if (code === 'aborted') {
          return;
        }

        if (code === 'no-speech') {
          const hasSpoken =
            this.currentAccumulatedTranscript.trim().length > 0 ||
            this.currentInterimTranscript.trim().length > 0;

          if (hasSpoken) {
            finalizeAndDeliver();
            return;
          }

          if (unlimitedThinking) {
            // User is still thinking -> keep session open by letting onend transparently restart
            return;
          }

          callbacks.onError?.(
            'no-speech',
            'לא זוהה דיבור במיקרופון. ודא שהמיקרופון פעיל ונסה לדבר שוב.'
          );
          return;
        }

        let msg = 'שגיאה בזיהוי קולי.';
        if (code === 'not-allowed' || code === 'service-not-allowed') {
          this.micPermissionGrantedInSession = false;
          msg = 'נדרש אישור גישה למיקרופון להפעלת מבחן השליפה הקולי.';
          this.stopListening({ silent: true });
          callbacks.onError?.(code, msg);
          callbacks.onEnd?.();
          return;
        } else if (code === 'audio-capture') {
          msg = 'לא נמצא מיקרופון תקין במכשיר.';
          this.stopListening({ silent: true });
          callbacks.onError?.(code, msg);
          callbacks.onEnd?.();
          return;
        } else if (code === 'network') {
          msg = 'שגיאת רשת בשירות הזיהוי הקולי.';
        }

        callbacks.onError?.(code, msg);
      };

      rec.onend = () => {
        if (sessionId !== this.activeSessionId || isSessionFinalized) return;

        const hasSpoken =
          this.currentAccumulatedTranscript.trim().length > 0 ||
          this.currentInterimTranscript.trim().length > 0;

        if (hasSpoken) {
          // User spoke and recognition ended -> deliver their full answer immediately
          finalizeAndDeliver();
          return;
        }

        if (unlimitedThinking && this.isListeningState) {
          // User has not spoken yet and is still thinking -> transparently reopen recognition
          // within the same single session lock so thinking time is unlimited.
          this.restartTimer = setTimeout(() => {
            if (sessionId === this.activeSessionId && this.isListeningState && !isSessionFinalized) {
              launchRecognitionInstance();
            }
          }, 120);
          return;
        }

        this.isListeningState = false;
        this.isStartingListening = false;
        callbacks.onEnd?.();
      };

      try {
        rec.start();
      } catch {
        // Retry once after brief delay if browser speech engine was busy closing previous handle
        this.restartTimer = setTimeout(() => {
          if (sessionId === this.activeSessionId && this.isListeningState && !isSessionFinalized) {
            try {
              rec.start();
            } catch {
              this.isListeningState = false;
              this.isStartingListening = false;
              callbacks.onEnd?.();
            }
          }
        }, 180);
      }
    };

    if (!unlimitedThinking && initialSilenceTimeoutMs > 0) {
      this.silenceTimer = setTimeout(() => {
        if (sessionId === this.activeSessionId && this.isListeningState) {
          this.stopListening();
        }
      }, initialSilenceTimeoutMs);
    }

    launchRecognitionInstance();
  }

  /**
   * Manually completes the current listening session immediately and submits any accumulated speech.
   */
  public completeListeningNow() {
    if (!this.isListeningState && !this.recognition) return;
    const fullText = [this.currentAccumulatedTranscript, this.currentInterimTranscript]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    const cb = this.currentCallbacks;
    this.stopListening({ silent: true });

    if (cb) {
      if (fullText) {
        cb.onFinalResult?.(fullText);
      }
      cb.onEnd?.();
    }
  }

  public stopListening(options?: { silent?: boolean }) {
    this.activeSessionId += 1;
    this.isListeningState = false;
    this.isStartingListening = false;
    this.clearAllRecognitionTimers();
    this.detachAndDestroyRecognition();
    this.stopActiveMediaStream();
    if (!options?.silent && this.currentCallbacks?.onEnd) {
      const cb = this.currentCallbacks;
      this.currentCallbacks = null;
      cb.onEnd?.();
    } else {
      this.currentCallbacks = null;
    }
  }

  public getIsListening(): boolean {
    return this.isListeningState || this.isStartingListening;
  }

  /**
   * Sends the user's transcribed response to Gemini on the backend (/api/gemini/evaluate-recall)
   * for conceptual semantic evaluation against the target answer in the database.
   */
  public async evaluateAnswerWithGemini(params: {
    question: string;
    userResponse: string;
    targetAnswer: string;
    targetTriplet?: string;
    targetScene?: string;
    acceptableAlternatives?: string[];
    context?: string;
  }): Promise<SemanticRecallEvalResult> {
    const cleanUser = (params.userResponse || '').trim();
    if (!cleanUser) {
      return {
        isCorrect: false,
        score: 0,
        verdictTitle: 'לא נקלטה תשובה',
        explanation: `התשובה הנכונה היא: ${params.targetAnswer}`,
      };
    }

    // Fast path: if local fuzzy match already confirms an exact or near-exact match, return immediately
    const localFastCheck = this.evaluateAnswer(
      cleanUser,
      [
        params.targetAnswer,
        ...(params.acceptableAlternatives || []),
        ...(params.targetScene ? [params.targetScene] : []),
      ].filter(Boolean)
    );
    if (localFastCheck.isCorrect) {
      return {
        isCorrect: true,
        score: 100,
        verdictTitle: 'תשובה מדויקת!',
        explanation: 'התשובה תואמת במדויק למסד הנתונים.',
        matchedValue: localFastCheck.matchedTarget,
      };
    }

    try {
      const res = await fetch('/api/gemini/evaluate-recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: params.question,
          targetAssociation: params.targetAnswer,
          targetTriplet: params.targetTriplet || '',
          targetScene: params.targetScene || '',
          userResponse: cleanUser,
          context: params.context || 'מבחן שליפה קולי Hands-Free',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          isCorrect: Boolean(data.isCorrect),
          score: typeof data.score === 'number' ? data.score : data.isCorrect ? 95 : 25,
          verdictTitle: data.verdictTitle || (data.isCorrect ? 'תשובה נכונה!' : 'תשובה לא מדויקת'),
          explanation:
            data.explanation ||
            (data.isCorrect
              ? 'המשמעות תואמת לתשובת היעד במסד הנתונים.'
              : `התשובה הנכונה היא: ${params.targetAnswer}`),
          memoryTip: data.memoryTip,
          matchedValue: params.targetAnswer,
        };
      }
    } catch (err) {
      console.warn('Gemini semantic evaluation fallback to local match:', err);
    }

    return {
      isCorrect: localFastCheck.isCorrect,
      score: localFastCheck.isCorrect ? 90 : 20,
      verdictTitle: localFastCheck.isCorrect ? 'תשובה נכונה!' : 'תשובה לא מדויקת',
      explanation: localFastCheck.isCorrect
        ? 'נמצאה התאמה לתשובת היעד.'
        : `התשובה הנכונה היא: ${params.targetAnswer}`,
      matchedValue: localFastCheck.matchedTarget,
    };
  }

  /**
   * Evaluates a spoken Hebrew response against one or more expected target strings locally.
   */
  public evaluateAnswer(
    spokenTranscript: string,
    expectedTargets: string[]
  ): { isCorrect: boolean; matchedTarget?: string } {
    const cleanSpoken = spokenTranscript
      .trim()
      .replace(/[.,!?״"']/g, '')
      .replace(/\s+/g, ' ');

    if (!cleanSpoken) return { isCorrect: false };

    const digitMap: Record<string, string[]> = {
      '0': ['אפס'],
      '1': ['אחד', 'אחת'],
      '2': ['שתיים', 'שניים', 'שתי', 'שני'],
      '3': ['שלוש', 'שלושה'],
      '4': ['ארבע', 'ארבעה'],
      '5': ['חמש', 'חמישה'],
      '6': ['שש', 'שישה'],
      '7': ['שבע', 'שבעה'],
      '8': ['שמונה'],
      '9': ['תשע', 'תשעה'],
      '00': ['אפס אפס', 'מאה'],
    };

    for (const rawTarget of expectedTargets) {
      if (!rawTarget) continue;
      const cleanTarget = rawTarget
        .trim()
        .replace(/\([^)]*\)/g, '')
        .replace(/[.,!?״"']/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanTarget) continue;

      if (isHebrewFuzzyMatch(cleanSpoken, cleanTarget)) {
        return { isCorrect: true, matchedTarget: rawTarget };
      }

      if (
        cleanSpoken.length >= 2 &&
        (cleanSpoken.includes(cleanTarget) || cleanTarget.includes(cleanSpoken))
      ) {
        return { isCorrect: true, matchedTarget: rawTarget };
      }

      const targetTokens = cleanTarget.split(/[\s\-/]+/).filter((t) => t.length >= 2);
      const spokenTokens = cleanSpoken.split(/[\s\-/]+/).filter((t) => t.length >= 2);

      if (targetTokens.length > 1) {
        const matchedTokensCount = targetTokens.filter((tt) =>
          spokenTokens.some((st) => isHebrewFuzzyMatch(st, tt))
        ).length;
        if (matchedTokensCount >= 1 && spokenTokens.length >= 1) {
          if (
            matchedTokensCount === targetTokens.length ||
            isHebrewFuzzyMatch(spokenTokens[0], targetTokens[0])
          ) {
            return { isCorrect: true, matchedTarget: rawTarget };
          }
        }
      }

      if (digitMap[cleanTarget]) {
        if (digitMap[cleanTarget].some((word) => cleanSpoken.includes(word))) {
          return { isCorrect: true, matchedTarget: rawTarget };
        }
      }
    }

    return { isCorrect: false };
  }
}

export const voiceService = new VoiceService();
