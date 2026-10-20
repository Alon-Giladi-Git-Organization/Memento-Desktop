import { MajorItem, PAOItem } from '../types/memory';

export const ALL_HEBREW_LETTERS = [
  'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י',
  'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת',
] as const;

export const DEFAULT_CONNECTING_LETTERS = ['א', 'ה', 'ו', 'י', 'נ', 'ע'];

// Mapping of final letters to base letters
export const FINAL_LETTER_MAP: Record<string, string> = {
  'ך': 'כ',
  'ם': 'מ',
  'ן': 'נ',
  'ף': 'פ',
  'ץ': 'צ',
};

/**
 * Normalizes Hebrew character: converts final letters (ך, ם, ן, ף, ץ) to base forms
 */
export function normalizeHebrewChar(ch: string): string {
  return FINAL_LETTER_MAP[ch] || ch;
}

/**
 * Extracts Hebrew letters from text and normalizes final forms
 */
export function extractHebrewLettersOnly(text: string): string[] {
  if (!text) return [];
  // Remove non-Hebrew characters and niqqud
  const matches = text.match(/[\u0590-\u05FF]/g) || [];
  return matches
    .filter((ch) => ch >= 'א' && ch <= 'ת')
    .map(normalizeHebrewChar);
}

/**
 * Builds a map from Hebrew letter to its assigned digit (0-9)
 * based on majorDigits configuration.
 */
export function buildLetterToDigitMap(majorDigits: MajorItem[]): Map<string, number> {
  const map = new Map<string, number>();

  for (const item of majorDigits) {
    const digit = item.number;
    if (typeof digit !== 'number' || isNaN(digit) || digit < 0 || digit > 9) continue;

    // Extract letters from consonants string (e.g. "ס, ז, ש דגושה" or "ג, ק, כ")
    const letters = extractHebrewLettersOnly(item.consonants);
    for (const letter of letters) {
      map.set(letter, digit);
    }

    // Also if defaultWord starts with or contains letters
    const wordLetters = extractHebrewLettersOnly(item.defaultWord);
    if (wordLetters.length > 0 && !map.has(wordLetters[0])) {
      // Keep primary if not set
    }
  }

  // Ensure baseline defaults for any missing digits
  const fallbackDigits: Record<number, string[]> = {
    0: ['ס', 'ז', 'ש'],
    1: ['ל'],
    2: ['ב'],
    3: ['ג', 'ק', 'כ'],
    4: ['ד', 'ת', 'ט'],
    5: ['ח'],
    6: ['ש', 'צ'],
    7: ['ר'],
    8: ['מ'],
    9: ['פ'],
  };

  for (let d = 0; d <= 9; d++) {
    const hasAny = Array.from(map.values()).includes(d);
    if (!hasAny && fallbackDigits[d]) {
      for (const ch of fallbackDigits[d]) {
        map.set(normalizeHebrewChar(ch), d);
      }
    }
  }

  return map;
}

export interface LogicValidationResult {
  isValid: boolean;
  message: string;
  detectedDigits?: number[];
  expectedDigits?: number[];
  details?: string;
}

/**
 * Validates whether a given Hebrew word or phrase conforms to the number's logic rules.
 *
 * Rules:
 * 1. Connecting letters (אותיות מקשרות) are ignored in phonetic analysis.
 * 2. Non-connecting letters map to digits according to majorDigits.
 * 3. For single digits (0-9): word must contain consonant(s) for that digit, and must NOT contain non-connecting consonants of other digits.
 * 4. For 2-digit numbers (00-99):
 *    - In Major: non-connecting consonants must represent tens then units (e.g. 14 -> [1, 4]).
 *    - In PAO: can match either via Major consonants OR via initials (ראשי תיבות) of words in the phrase!
 */
export function validateHebrewLogic(
  text: string,
  targetNumber: number,
  majorDigits: MajorItem[],
  connectingLetters: string[] = DEFAULT_CONNECTING_LETTERS,
  mode: 'major' | 'pao' = 'major'
): LogicValidationResult {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    return { isValid: true, message: '' };
  }

  if (typeof targetNumber !== 'number' || isNaN(targetNumber) || targetNumber < 0 || targetNumber > 99) {
    return { isValid: true, message: '' };
  }

  const letterMap = buildLetterToDigitMap(majorDigits);
  const normalizedConnecting = new Set(connectingLetters.map(normalizeHebrewChar));

  // Determine target digits:
  // For 0..9 in Major, it's a single digit [targetNumber] unless explicitly padded '00'..'09'
  const isSingleDigit = targetNumber >= 0 && targetNumber <= 9;
  const expectedDigits = isSingleDigit
    ? [targetNumber]
    : [Math.floor(targetNumber / 10), targetNumber % 10];

  // Helper: check initials for multi-word phrase (e.g. in PAO "לאונרדו דה וינצ'י" -> ל, ד)
  if (mode === 'pao' && !isSingleDigit) {
    const words = trimmed.split(/[\s\-–—\.]+/).filter((w) => w.length > 0);
    if (words.length >= 2) {
      const initialLetters = words
        .map((w) => extractHebrewLettersOnly(w)[0])
        .filter(Boolean);

      if (initialLetters.length >= 2) {
        const firstLetterDigit = letterMap.get(initialLetters[0]);
        const secondLetterDigit = letterMap.get(initialLetters[1]);

        if (firstLetterDigit === expectedDigits[0] && secondLetterDigit === expectedDigits[1]) {
          return {
            isValid: true,
            message: '',
            expectedDigits,
            detectedDigits: [firstLetterDigit, secondLetterDigit],
          };
        }
      }
    }
  }

  // Phonetic consonant analysis:
  // Extract all Hebrew letters from text
  const allLetters = extractHebrewLettersOnly(trimmed);
  if (allLetters.length === 0) {
    return { isValid: true, message: '' };
  }

  // Filter out connecting letters
  const nonConnecting = allLetters.filter((ch) => !normalizedConnecting.has(ch));

  // If all letters were connecting letters (no consonants at all), that cannot represent the number
  if (nonConnecting.length === 0) {
    return {
      isValid: false,
      message: 'הדמות/החפץ אינו עונה לדרישות הלוגיקה הנוכחית',
      details: `המילה מכילה אך ורק אותיות מקשרות (${connectingLetters.join(', ')}) וללא עיצורים המייצגים את המספר.`,
      expectedDigits,
      detectedDigits: [],
    };
  }

  // Map non-connecting consonants to digits
  const detectedDigits: number[] = [];
  const unrecognizedLetters: string[] = [];

  for (const ch of nonConnecting) {
    const d = letterMap.get(ch);
    if (d !== undefined) {
      // Deduplicate consecutive identical digits (e.g. "סוס" has ס, ס -> represents 0 or 00)
      if (detectedDigits.length === 0 || detectedDigits[detectedDigits.length - 1] !== d) {
        detectedDigits.push(d);
      }
    } else {
      unrecognizedLetters.push(ch);
    }
  }

  // Validation logic for single digit (0-9)
  if (isSingleDigit) {
    const target = expectedDigits[0];
    const hasTarget = detectedDigits.includes(target);
    const foreignDigits = detectedDigits.filter((d) => d !== target);

    if (hasTarget && foreignDigits.length === 0) {
      return { isValid: true, message: '', expectedDigits, detectedDigits };
    }

    // Fails single digit validation!
    // Construct user-friendly Hebrew explanation
    const detectedStr = detectedDigits.length > 0 ? detectedDigits.join(', ') : 'ללא עיצור מוגדר';
    return {
      isValid: false,
      message: 'הדמות/החפץ אינו עונה לדרישות הלוגיקה הנוכחית',
      expectedDigits,
      detectedDigits,
      details: `נמצאו עיצורים השייכים לספרות [${detectedStr}] במקום ספרה ${target}.`,
    };
  }

  // Validation logic for 2-digit number (10-99, or two-digit 00-09)
  const tens = expectedDigits[0];
  const units = expectedDigits[1];

  // Case A: Exact sequence of 2 digits (e.g. [1, 4] for 14)
  if (detectedDigits.length === 2 && detectedDigits[0] === tens && detectedDigits[1] === units) {
    return { isValid: true, message: '', expectedDigits, detectedDigits };
  }

  // Case B: Digits where tens === units (e.g. 00, 11, 22):
  // "סוס" for 00 has consonants ס, ס which might compress to [0], or "לול" for 11 -> [1]
  if (tens === units && detectedDigits.length === 1 && detectedDigits[0] === tens) {
    return { isValid: true, message: '', expectedDigits, detectedDigits };
  }

  // Case C: For PAO, check if the first 2 detected digits match tens and units
  if (mode === 'pao' && detectedDigits.length >= 2 && detectedDigits[0] === tens && detectedDigits[1] === units) {
    return { isValid: true, message: '', expectedDigits, detectedDigits };
  }

  // If we reach here, it failed the logic requirements!
  const detectedStr = detectedDigits.length > 0 ? detectedDigits.join(', ') : 'ללא עיצור מוגדר';
  return {
    isValid: false,
    message: 'הדמות/החפץ אינו עונה לדרישות הלוגיקה הנוכחית',
    expectedDigits,
    detectedDigits,
    details: `הספרות שפוענחו מהמילה הן [${detectedStr}] במקום ${tens}${units}.`,
  };
}

export interface DuplicateCheckResult {
  hasDuplicate: boolean;
  field: 'person' | 'action' | 'object' | 'word' | null;
  message: string;
  conflictingNumber?: number;
  conflictingNumberStr?: string;
}

/**
 * Checks for duplicate entries across PAO items
 */
export function checkPAODuplicates(
  paoItems: PAOItem[],
  currentNumber: number,
  values: { person?: string; action?: string; object?: string }
): DuplicateCheckResult {
  const norm = (s?: string) => (s || '').trim().toLowerCase();

  const person = norm(values.person);
  const action = norm(values.action);
  const object = norm(values.object);

  for (const item of paoItems) {
    if (item.number === currentNumber) continue;

    const numStr = item.numberStr || String(item.number).padStart(2, '0');

    if (person && norm(item.person) === person) {
      return {
        hasDuplicate: true,
        field: 'person',
        message: `הדמות הזו כבר מופיעה (עבור מספר ${numStr})`,
        conflictingNumber: item.number,
        conflictingNumberStr: numStr,
      };
    }

    if (action && norm(item.action) === action) {
      return {
        hasDuplicate: true,
        field: 'action',
        message: `הפעולה הזו כבר מופיעה (עבור מספר ${numStr})`,
        conflictingNumber: item.number,
        conflictingNumberStr: numStr,
      };
    }

    if (object && norm(item.object) === object) {
      return {
        hasDuplicate: true,
        field: 'object',
        message: `החפץ הזה כבר מופיע (עבור מספר ${numStr})`,
        conflictingNumber: item.number,
        conflictingNumberStr: numStr,
      };
    }
  }

  return { hasDuplicate: false, field: null, message: '' };
}

/**
 * Checks for duplicate word across Major items
 */
export function checkMajorDuplicates(
  majorItems: MajorItem[],
  currentNumber: number,
  word?: string
): DuplicateCheckResult {
  const norm = (s?: string) => (s || '').trim().toLowerCase();
  const targetWord = norm(word);

  if (!targetWord) {
    return { hasDuplicate: false, field: null, message: '' };
  }

  for (const item of majorItems) {
    if (item.number === currentNumber) continue;

    if (norm(item.defaultWord) === targetWord) {
      const numStr = item.numberStr || String(item.number).padStart(2, '0');
      return {
        hasDuplicate: true,
        field: 'word',
        message: `המילה הזו כבר מופיעה (עבור מספר ${numStr})`,
        conflictingNumber: item.number,
        conflictingNumberStr: numStr,
      };
    }
  }

  return { hasDuplicate: false, field: null, message: '' };
}
