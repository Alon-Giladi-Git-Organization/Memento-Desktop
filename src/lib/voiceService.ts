import { isHebrewFuzzyMatch, normalizeHebrewText } from './fuzzyMatch';

/**
 * Hebrew Number Words Dictionary (0 to 99)
 * Used to translate spoken Hebrew numbers (e.g. "ארבעים וחמש" -> 45) into integers.
 */
const HEBREW_UNITS: Record<string, number> = {
  אפס: 0,
  אחת: 1,
  אחד: 1,
  שתים: 2,
  שתיים: 2,
  שניים: 2,
  שנים: 2,
  שלוש: 3,
  שלושה: 3,
  ארבע: 4,
  ארבעה: 4,
  חמש: 5,
  חמישה: 5,
  שש: 6,
  שישה: 6,
  שבע: 7,
  שבעה: 7,
  שמונה: 8,
  שמונהה: 8,
  תשע: 9,
  תשעה: 9,
  עשר: 10,
  עשרה: 10,
};

const HEBREW_TEENS: Record<string, number> = {
  אחתעשרה: 11,
  'אחת עשרה': 11,
  'אחד עשר': 11,
  שתיםעשרה: 12,
  שתייםעשרה: 12,
  'שתים עשרה': 12,
  'שתיים עשרה': 12,
  'שנים עשר': 12,
  שלושעשרה: 13,
  'שלוש עשרה': 13,
  'שלושה עשר': 13,
  ארבעעשרה: 14,
  'ארבע עשרה': 14,
  'ארבעה עשר': 14,
  חמשעשרה: 15,
  'חמש עשרה': 15,
  'חמישה עשר': 15,
  ששעשרה: 16,
  'שש עשרה': 16,
  'שישה עשר': 16,
  שבעעשרה: 17,
  'שבע עשרה': 17,
  'שבעה עשר': 17,
  שמונהעשרה: 18,
  'שמונה עשרה': 18,
  'שמונה עשר': 18,
  תשעעשרה: 19,
  'תשע עשרה': 19,
  'תשעה עשר': 19,
};

const HEBREW_TENS: Record<string, number> = {
  עשרים: 20,
  שלושים: 30,
  ארבעים: 40,
  חמישים: 50,
  שישים: 60,
  שבעים: 70,
  שמונים: 80,
  תשעים: 90,
};

/**
 * Parses a spoken Hebrew string to find an integer from 0 to 99.
 */
export function convertHebrewSpokenNumber(input: string): number | null {
  if (!input) return null;
  const clean = input.trim();

  // 1. Direct digit match in text (e.g. "45", "04", "שבע 45")
  const digitMatch = clean.match(/\b\d{1,2}\b/);
  if (digitMatch) {
    const num = parseInt(digitMatch[0], 10);
    if (!isNaN(num) && num >= 0 && num <= 99) return num;
  }

  // Normalize Hebrew
  const words = clean
    .replace(/[^\u0590-\u05FF\s]/g, '')
    .trim()
    .split(/\s+/);

  if (words.length === 0) return null;

  // Single word lookup
  const single = words.join(' ');
  if (HEBREW_UNITS[single] !== undefined) return HEBREW_UNITS[single];
  if (HEBREW_TEENS[single] !== undefined) return HEBREW_TEENS[single];
  if (HEBREW_TENS[single] !== undefined) return HEBREW_TENS[single];

  // Compound tens + units (e.g. "ארבעים וחמש" or "ארבעים חמש" or "חמישים ואחת")
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (HEBREW_TENS[w] !== undefined) {
      const tensVal = HEBREW_TENS[w];
      const nextWord = words[i + 1];
      if (nextWord) {
        const strippedNext = nextWord.startsWith('ו') ? nextWord.slice(1) : nextWord;
        if (HEBREW_UNITS[strippedNext] !== undefined) {
          return tensVal + HEBREW_UNITS[strippedNext];
        }
      }
      return tensVal;
    }
  }

  // Reverse compound: "חמש וארבעים"
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (HEBREW_UNITS[w] !== undefined) {
      const unitsVal = HEBREW_UNITS[w];
      const nextWord = words[i + 1];
      if (nextWord) {
        const strippedNext = nextWord.startsWith('ו') ? nextWord.slice(1) : nextWord;
        if (HEBREW_TENS[strippedNext] !== undefined) {
          return HEBREW_TENS[strippedNext] + unitsVal;
        }
      }
    }
  }

  return null;
}

/**
 * Voice Service providing Text-to-Speech (TTS) and Speech-to-Text (STT) in Hebrew
 */
class VoiceService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private currentRecognition: any = null;
  private isSpeakingState = false;
  private cachedHebrewVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadHebrewVoice();
      };
      this.loadHebrewVoice();
    }
  }

  private loadHebrewVoice(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    // Prioritize Google Hebrew Voice or high quality natural voices if available
    const hebrewVoices = voices.filter(
      (v) => v.lang === 'he-IL' || v.lang === 'he_IL' || v.lang.startsWith('he')
    );

    const googleHebrew = hebrewVoices.find((v) => v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('natural'));
    this.cachedHebrewVoice = googleHebrew || hebrewVoices[0] || null;
    return this.cachedHebrewVoice;
  }

  /**
   * Speaks Hebrew text via advanced Gemini AI TTS model (gemini-3.8-flash-lite-tts),
   * falling back smoothly to browser speech synthesis if offline or delayed.
   */
  async speakHebrew(text: string, rate = 0.95): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve();

    // Cancel any previous speech immediately
    this.stopSpeaking();

    // Try AI Speech Model (Gemini Flash Lite TTS) first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const res = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          return new Promise<void>((resolve) => {
            const audioSrc = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
            const audio = new Audio(audioSrc);
            this.currentAudioElement = audio;
            this.isSpeakingState = true;

            let finished = false;
            const finish = () => {
              if (!finished) {
                finished = true;
                this.isSpeakingState = false;
                this.currentAudioElement = null;
                resolve();
              }
            };

            audio.onended = () => finish();
            audio.onerror = () => finish();
            setTimeout(finish, 15000); // safety fallback

            audio.play().catch(() => finish());
          });
        }
      }
    } catch {
      // Fall through to browser speech synthesis fallback
    }

    // Fallback: Browser Web Speech API
    if (!('speechSynthesis' in window)) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'he-IL';
        utterance.rate = rate;
        utterance.pitch = 1.0;

        const voice = this.cachedHebrewVoice || this.loadHebrewVoice();
        if (voice) {
          utterance.voice = voice;
        }

        this.isSpeakingState = true;
        this.currentUtterance = utterance;

        let isFinished = false;
        const finish = () => {
          if (!isFinished) {
            isFinished = true;
            this.isSpeakingState = false;
            this.currentUtterance = null;
            resolve();
          }
        };

        utterance.onend = () => finish();
        utterance.onerror = (e) => {
          console.warn('Speech synthesis note:', e);
          finish();
        };

        // Safety fallback timer: max 12 seconds
        const safetyTimer = setTimeout(() => {
          finish();
        }, 12000);

        utterance.addEventListener('end', () => clearTimeout(safetyTimer));

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('Error starting speech synthesis:', err);
        this.isSpeakingState = false;
        resolve();
      }
    });
  }

  /**
   * Stops current speech synthesis and audio playback immediately
   */
  stopSpeaking(): void {
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
      } catch {}
      this.currentAudioElement = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
      this.isSpeakingState = false;
      this.currentUtterance = null;
    }
    this.isSpeakingState = false;
  }

  isSpeaking(): boolean {
    return this.isSpeakingState;
  }

  /**
   * Checks if browser speech recognition (Google STT) is supported
   */
  isRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  /**
   * Starts listening to user speech via Google Speech-to-Text API in Hebrew
   */
  startListening(options: {
    onResult: (transcript: string, isFinal: boolean) => void;
    onError?: (error: string) => void;
    onEnd?: () => void;
    silenceTimeoutMs?: number;
  }): () => void {
    if (!this.isRecognitionSupported()) {
      options.onError?.('זיהוי דיבור אינו נתמך בדפדפן זה. מומלץ להשתמש ב-Google Chrome.');
      options.onEnd?.();
      return () => {};
    }

    // Make sure we stop any active speech before listening to prevent audio loop!
    this.stopSpeaking();
    this.stopListening();

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRec();

    recognition.lang = 'he-IL';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    this.currentRecognition = recognition;

    let hasReceivedResult = false;
    let silenceTimer: any = null;

    const resetSilenceTimer = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      const timeout = options.silenceTimeoutMs || 7500;
      silenceTimer = setTimeout(() => {
        try {
          recognition.stop();
        } catch {}
      }, timeout);
    };

    resetSilenceTimer();

    recognition.onresult = (event: any) => {
      hasReceivedResult = true;
      resetSilenceTimer();

      let transcript = '';
      let isFinal = false;

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          isFinal = true;
        }
      }

      options.onResult(transcript.trim(), isFinal);
    };

    recognition.onerror = (event: any) => {
      if (silenceTimer) clearTimeout(silenceTimer);
      if (event.error === 'no-speech') {
        if (!hasReceivedResult) {
          options.onError?.('לא זוהה דיבור');
        }
      } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        options.onError?.('הרשאת מיקרופון נדחתה. יש לאשר גישה למיקרופון בהגדרות הדפדפן.');
      } else {
        options.onError?.(event.error || 'שגיאה בקליטת הקול');
      }
    };

    recognition.onend = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      this.currentRecognition = null;
      options.onEnd?.();
    };

    try {
      recognition.start();
    } catch (err) {
      console.warn('Recognition start issue:', err);
      options.onError?.('שגיאה בהפעלת המיקרופון');
      options.onEnd?.();
    }

    return () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      try {
        recognition.stop();
      } catch {}
      this.currentRecognition = null;
    };
  }

  stopListening(): void {
    if (this.currentRecognition) {
      try {
        this.currentRecognition.stop();
      } catch {}
      this.currentRecognition = null;
    }
  }

  /**
   * Intelligently evaluates whether the spoken user answer matches the target question
   */
  evaluateAnswer(
    spokenText: string,
    expectedNumber: number,
    expectedPao: { person: string; action: string; object: string; scene?: string },
    questionType: 'number' | 'person' | 'action' | 'object' | 'triplet'
  ): { isCorrect: boolean; detectedTarget: string } {
    const cleanSpoken = normalizeHebrewText(spokenText);
    if (!cleanSpoken) return { isCorrect: false, detectedTarget: '' };

    // 1. If question asked for the Number
    if (questionType === 'number') {
      const spokenNum = convertHebrewSpokenNumber(spokenText);
      const isCorrect = spokenNum === expectedNumber;
      return { isCorrect, detectedTarget: spokenNum !== null ? String(spokenNum) : spokenText };
    }

    // 2. If question asked for Person
    if (questionType === 'person') {
      const isCorrect = isHebrewFuzzyMatch(cleanSpoken, expectedPao.person);
      return { isCorrect, detectedTarget: expectedPao.person };
    }

    // 3. If question asked for Action
    if (questionType === 'action') {
      const isCorrect = isHebrewFuzzyMatch(cleanSpoken, expectedPao.action);
      return { isCorrect, detectedTarget: expectedPao.action };
    }

    // 4. If question asked for Object
    if (questionType === 'object') {
      const isCorrect = isHebrewFuzzyMatch(cleanSpoken, expectedPao.object);
      return { isCorrect, detectedTarget: expectedPao.object };
    }

    // 5. If question asked for the full Triplet (e.g. "מה השלשה של 45?")
    // The user may speak all 3, or at least 2 components, or the scene
    const pMatch = isHebrewFuzzyMatch(cleanSpoken, expectedPao.person);
    const aMatch = isHebrewFuzzyMatch(cleanSpoken, expectedPao.action);
    const oMatch = isHebrewFuzzyMatch(cleanSpoken, expectedPao.object);

    let matchCount = 0;
    if (pMatch) matchCount++;
    if (aMatch) matchCount++;
    if (oMatch) matchCount++;

    // User spoke at least 2 components or scene contains spoken keywords
    const isCorrect = matchCount >= 2 || (matchCount >= 1 && (expectedPao.person.length > 3 || expectedPao.object.length > 3));

    return {
      isCorrect,
      detectedTarget: `${expectedPao.person}, ${expectedPao.action}, ${expectedPao.object}`,
    };
  }
}

export const voiceService = new VoiceService();
