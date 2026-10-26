import { useState, useEffect, useCallback } from 'react';
import { MajorItem, PAOItem } from '../types/memory';

const IGNORED_VALIDATIONS_STORAGE_KEY = 'mem_ignored_validations_v1';
const IGNORED_VALIDATIONS_EVENT = 'mem-ignored-validations-changed';

export function getIgnoredValidationsSet(): Set<string> {
  try {
    const raw = localStorage.getItem(IGNORED_VALIDATIONS_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function addIgnoredValidationKey(key: string): void {
  if (!key) return;
  try {
    const current = getIgnoredValidationsSet();
    current.add(key);
    localStorage.setItem(IGNORED_VALIDATIONS_STORAGE_KEY, JSON.stringify(Array.from(current)));
    window.dispatchEvent(new CustomEvent(IGNORED_VALIDATIONS_EVENT));
  } catch {
    // ignore storage errors
  }
}

export function useIgnoredValidations() {
  const [ignoredSet, setIgnoredSet] = useState<Set<string>>(() => getIgnoredValidationsSet());

  useEffect(() => {
    const handleUpdate = () => {
      setIgnoredSet(getIgnoredValidationsSet());
    };
    window.addEventListener(IGNORED_VALIDATIONS_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(IGNORED_VALIDATIONS_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const isIgnored = useCallback(
    (key: string) => {
      return ignoredSet.has(key);
    },
    [ignoredSet]
  );

  const ignoreValidation = useCallback((key: string) => {
    addIgnoredValidationKey(key);
    setIgnoredSet(getIgnoredValidationsSet());
  }, []);

  return { isIgnored, ignoreValidation };
}

export function buildLogicIgnoreKey(
  scope: 'major-word' | 'pao-person' | 'pao-object' | 'major-pao-mismatch',
  number: number,
  valueA: string,
  valueB?: string
): string {
  const normA = (valueA || '').trim();
  const normB = (valueB || '').trim();
  return `${scope}:${number}:${normA}${normB ? `:${normB}` : ''}`;
}


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

export interface PhoneticConsonantToken {
  token: string;
  display: string;
  subLabel: string;
  baseLetter: string;
  hasGeresh?: boolean;
  variantType: 'dagesh' | 'rafe' | 'shin' | 'sin' | 'geresh' | 'standard';
}

/**
 * Complete catalog of Hebrew consonants & phonetic variations
 * (including Dagesh vs Rafe, Shin vs Sin, and standard vs Geresh)
 * displayed as distinct clickable buttons in the Consonant Selector Popover.
 */
export const PHONETIC_CONSONANT_TOKENS: PhoneticConsonantToken[] = [
  { token: 'א', display: 'א', subLabel: 'אל״ף', baseLetter: 'א', variantType: 'standard' },
  { token: 'בּ', display: 'בּ', subLabel: 'דגושה (B)', baseLetter: 'ב', variantType: 'dagesh' },
  { token: 'ב', display: 'ב', subLabel: 'רפה (V)', baseLetter: 'ב', variantType: 'rafe' },
  { token: 'ג', display: 'ג', subLabel: 'רגילה (G)', baseLetter: 'ג', variantType: 'standard' },
  { token: "ג'", display: "ג'", subLabel: "גרושה (J)", baseLetter: 'ג', hasGeresh: true, variantType: 'geresh' },
  { token: 'ד', display: 'ד', subLabel: 'דל״ת (D)', baseLetter: 'ד', variantType: 'standard' },
  { token: 'ה', display: 'ה', subLabel: 'ה״א (H)', baseLetter: 'ה', variantType: 'standard' },
  { token: 'ו', display: 'ו', subLabel: 'ו״ו (V)', baseLetter: 'ו', variantType: 'standard' },
  { token: 'ז', display: 'ז', subLabel: 'רגילה (Z)', baseLetter: 'ז', variantType: 'standard' },
  { token: "ז'", display: "ז'", subLabel: "גרושה (Zh)", baseLetter: 'ז', hasGeresh: true, variantType: 'geresh' },
  { token: 'ח', display: 'ח', subLabel: 'חי״ת (Kh)', baseLetter: 'ח', variantType: 'standard' },
  { token: 'ט', display: 'ט', subLabel: 'טי״ת (T)', baseLetter: 'ט', variantType: 'standard' },
  { token: 'י', display: 'י', subLabel: 'יו״ד (Y)', baseLetter: 'י', variantType: 'standard' },
  { token: 'כּ', display: 'כּ', subLabel: 'דגושה (K)', baseLetter: 'כ', variantType: 'dagesh' },
  { token: 'כ', display: 'כ', subLabel: 'רפה (Kh)', baseLetter: 'כ', variantType: 'rafe' },
  { token: 'ל', display: 'ל', subLabel: 'למ״ד (L)', baseLetter: 'ל', variantType: 'standard' },
  { token: 'מ', display: 'מ', subLabel: 'מ״ם (M)', baseLetter: 'מ', variantType: 'standard' },
  { token: 'נ', display: 'נ', subLabel: 'נו״ן (N)', baseLetter: 'נ', variantType: 'standard' },
  { token: 'ס', display: 'ס', subLabel: 'סמ״ך (S)', baseLetter: 'ס', variantType: 'standard' },
  { token: 'ע', display: 'ע', subLabel: 'עי״ן', baseLetter: 'ע', variantType: 'standard' },
  { token: 'פּ', display: 'פּ', subLabel: 'דגושה (P)', baseLetter: 'פ', variantType: 'dagesh' },
  { token: 'פ', display: 'פ', subLabel: 'רפה (F)', baseLetter: 'פ', variantType: 'rafe' },
  { token: 'צ', display: 'צ', subLabel: 'רגילה (Tz)', baseLetter: 'צ', variantType: 'standard' },
  { token: "צ'", display: "צ'", subLabel: "גרושה (Ch)", baseLetter: 'צ', hasGeresh: true, variantType: 'geresh' },
  { token: 'ק', display: 'ק', subLabel: 'קו״ף (K)', baseLetter: 'ק', variantType: 'standard' },
  { token: 'ר', display: 'ר', subLabel: 'רי״ש (R)', baseLetter: 'ר', variantType: 'standard' },
  { token: 'שׁ', display: 'שׁ', subLabel: 'ימנית (Sh)', baseLetter: 'ש', variantType: 'shin' },
  { token: 'שׂ', display: 'שׂ', subLabel: 'שמאלית (S)', baseLetter: 'ש', variantType: 'sin' },
  { token: 'תּ', display: 'תּ', subLabel: 'דגושה (T)', baseLetter: 'ת', variantType: 'dagesh' },
  { token: 'ת', display: 'ת', subLabel: 'רפה (Th)', baseLetter: 'ת', variantType: 'rafe' },
];

/**
 * Normalizes Hebrew character: converts final letters (ך, ם, ן, ף, ץ) to base forms
 */
export function normalizeHebrewChar(ch: string): string {
  return FINAL_LETTER_MAP[ch] || ch;
}

/**
 * Parses a digit's consonants string (including legacy phrases like "ש דגושה" or "פ (רפה ודגושה)")
 * into canonical phonetic tokens from PHONETIC_CONSONANT_TOKENS.
 */
export function parseConsonantTokens(consonantsStr?: string): string[] {
  if (!consonantsStr || !consonantsStr.trim()) return [];
  const raw = consonantsStr.trim();
  const result: string[] = [];
  const addUnique = (t: string) => {
    if (t && !result.includes(t)) result.push(t);
  };

  // Split by comma, slash, or plus
  const segments = raw
    .split(/[,/+]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const seg of segments) {
    // Handle legacy descriptive segments
    if (seg.includes('פ') && seg.includes('רפה') && seg.includes('דגושה')) {
      addUnique('פּ');
      addUnique('פ');
      continue;
    }
    if (seg.includes('ב') && seg.includes('רפה') && seg.includes('דגושה')) {
      addUnique('בּ');
      addUnique('ב');
      continue;
    }
    if (seg.includes('כ') && seg.includes('רפה') && seg.includes('דגושה')) {
      addUnique('כּ');
      addUnique('כ');
      continue;
    }
    if (seg.includes('ת') && seg.includes('רפה') && seg.includes('דגושה')) {
      addUnique('תּ');
      addUnique('ת');
      continue;
    }
    if (seg.includes('ש') && (seg.includes('שמאלית') || seg.includes('דגושה') || seg.includes('\u05C2'))) {
      addUnique('שׂ');
      continue;
    }
    if (seg.includes('ש') && (seg.includes('ימנית') || seg.includes('\u05C1'))) {
      addUnique('שׁ');
      continue;
    }
    if (seg.includes('פ') && seg.includes('דגושה')) {
      addUnique('פּ');
      continue;
    }
    if (seg.includes('פ') && seg.includes('רפה')) {
      addUnique('פ');
      continue;
    }
    if (seg.includes('ב') && seg.includes('דגושה')) {
      addUnique('בּ');
      continue;
    }
    if (seg.includes('ב') && seg.includes('רפה')) {
      addUnique('ב');
      continue;
    }
    if (seg.includes('כ') && seg.includes('דגושה')) {
      addUnique('כּ');
      continue;
    }
    if (seg.includes('כ') && seg.includes('רפה')) {
      addUnique('כ');
      continue;
    }

    // Direct token matching (with geresh/dagesh/shin/sin)
    const normalizedGeresh = seg.replace(/[׳`’]/g, "'");
    const exactMatch = PHONETIC_CONSONANT_TOKENS.find((p) => p.token === normalizedGeresh);
    if (exactMatch) {
      addUnique(exactMatch.token);
      continue;
    }

    // Plain single letter 'ש' without dot -> 'שׁ'
    if (normalizedGeresh === 'ש') {
      addUnique('שׁ');
      continue;
    }

    // Extract any tokens inside segment
    const tokenRegex = /([א-ת][\u05BC\u05C1\u05C2]?['׳]?)/g;
    const matches = normalizedGeresh.match(tokenRegex) || [];
    for (const m of matches) {
      const cleanM = m.replace(/׳/g, "'");
      const base = normalizeHebrewChar(cleanM[0]);
      const rest = cleanM.slice(1);
      const candidate = base + rest;
      if (candidate === 'ש') {
        addUnique('שׁ');
      } else {
        const found = PHONETIC_CONSONANT_TOKENS.find((p) => p.token === candidate);
        if (found) {
          addUnique(found.token);
        } else if (base >= 'א' && base <= 'ת') {
          addUnique(base);
        }
      }
    }
  }

  return result;
}

/**
 * Serializes an array of phonetic consonant tokens into a clean display string
 */
export function serializeConsonantTokens(tokens: string[]): string {
  return Array.from(new Set(tokens.filter(Boolean))).join(', ');
}

/**
 * Computes the available letter/consonant pool for a given digit (0-9).
 * Prevents letter duplication across different numbers: any token already assigned
 * to another digit (or in connectingLetters) is excluded from availableTokens.
 */
export function getConsonantPoolForDigit(
  majorDigits: MajorItem[],
  targetDigit: number,
  currentConsonantsOverride?: string,
  connectingLetters: string[] = DEFAULT_CONNECTING_LETTERS
): {
  selectedTokens: string[];
  availableTokens: PhoneticConsonantToken[];
  assignedElsewhereMap: Map<string, number>;
} {
  const targetItem = majorDigits.find((d) => d.number === targetDigit);
  const currentStr =
    currentConsonantsOverride !== undefined
      ? currentConsonantsOverride
      : targetItem?.consonants || '';
  const selectedTokens = parseConsonantTokens(currentStr);

  const assignedElsewhereMap = new Map<string, number>();
  for (const d of majorDigits) {
    if (d.number === targetDigit) continue;
    const tokens = parseConsonantTokens(d.consonants);
    for (const t of tokens) {
      assignedElsewhereMap.set(t, d.number);
    }
  }

  const normalizedConnecting = new Set(connectingLetters.map(normalizeHebrewChar));

  const availableTokens = PHONETIC_CONSONANT_TOKENS.filter((pt) => {
    if (selectedTokens.includes(pt.token)) return false;
    if (assignedElsewhereMap.has(pt.token)) return false;
    // Also exclude tokens whose base letter is marked as a transparent connecting letter
    if (normalizedConnecting.has(pt.baseLetter) && pt.variantType === 'standard') return false;
    return true;
  });

  return {
    selectedTokens,
    availableTokens,
    assignedElsewhereMap,
  };
}

/**
 * Live Data Binding helper: returns the live consonants display string for any number (0-99)
 * directly from the Numbers Logic module (`majorDigits`).
 */
export function getLiveMajorConsonants(targetNumber: number, majorDigits: MajorItem[]): string {
  if (!majorDigits || majorDigits.length === 0) return '';
  if (targetNumber >= 0 && targetNumber <= 9) {
    const d = majorDigits.find((m) => m.number === targetNumber);
    return d?.consonants || '';
  }
  if (targetNumber >= 10 && targetNumber <= 99) {
    const tens = Math.floor(targetNumber / 10);
    const units = targetNumber % 10;
    const tensCons = majorDigits.find((m) => m.number === tens)?.consonants || '';
    const unitsCons = majorDigits.find((m) => m.number === units)?.consonants || '';
    if (tensCons && unitsCons) return `${tensCons} + ${unitsCons}`;
    return tensCons || unitsCons || '';
  }
  return '';
}

/**
 * Strips all parentheses (...) and their contents from a string so that
 * any annotations or comments inside parentheses are completely ignored by validation.
 */
export function stripParentheses(text: string): string {
  if (!text) return '';
  let result = text;
  // Repeatedly strip innermost (...) to handle nested or multiple parenthetical segments
  let prev = '';
  while (result !== prev) {
    prev = result;
    result = result.replace(/\([^()]*\)/g, ' ');
  }
  // Also strip any stray unclosed parenthesis characters
  return result.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Extracts Hebrew letters from text and normalizes final forms (ignoring anything inside parentheses)
 */
export function extractHebrewLettersOnly(text: string): string[] {
  const cleaned = stripParentheses(text);
  if (!cleaned) return [];
  const matches = cleaned.match(/[\u0590-\u05FF]/g) || [];
  return matches
    .filter((ch) => ch >= 'א' && ch <= 'ת')
    .map(normalizeHebrewChar);
}

/**
 * Extracts phonetic tokens from a Hebrew word/phrase (ignoring anything inside parentheses),
 * preserving geresh (ג', ז', צ') and explicit niqqud (בּ, כּ, פּ, שׁ, שׂ, תּ) when present, and normalizing final letters.
 */
export function extractPhoneticTokensFromWord(text: string): Array<{
  rawToken: string;
  baseLetter: string;
  hasExplicitVariant: boolean;
}> {
  const cleaned = stripParentheses(text);
  if (!cleaned) return [];
  const normalized = cleaned.replace(/[׳`’]/g, "'");
  const regex = /([א-ת])([\u05BC\u05C1\u05C2]?)([']?)/g;
  const results: Array<{ rawToken: string; baseLetter: string; hasExplicitVariant: boolean }> = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(normalized)) !== null) {
    const base = normalizeHebrewChar(match[1]);
    if (base < 'א' || base > 'ת') continue;
    const niqqud = match[2] || '';
    const geresh = match[3] || '';
    const rawToken = `${base}${niqqud}${geresh}`;
    const hasExplicitVariant = Boolean(niqqud || geresh);
    results.push({
      rawToken,
      baseLetter: base,
      hasExplicitVariant,
    });
  }
  return results;
}

/**
 * Builds a map from Hebrew letter/token to its assigned digit (0-9)
 * strictly based on majorDigits configuration (the Numbers Logic Brain).
 */
export function buildLetterToDigitMap(majorDigits: MajorItem[]): Map<string, number> {
  const map = new Map<string, number>();

  for (const item of majorDigits) {
    const digit = item.number;
    if (typeof digit !== 'number' || isNaN(digit) || digit < 0 || digit > 9) continue;

    const tokens = parseConsonantTokens(item.consonants);
    for (const token of tokens) {
      map.set(token, digit);
      const base = normalizeHebrewChar(token[0]);
      if (base && !map.has(base)) {
        map.set(base, digit);
      }
    }
  }

  return map;
}

/**
 * Builds a multi-digit lookup from majorDigits so that:
 * - An explicit phonetic token (like "צ'" or "פּ" or "שׂ") maps to its exact digit.
 * - An unvocalized base letter (like "פ" or "ש" typed without niqqud) can match any digit
 *   that has a Dagesh/Rafe or Shin/Sin variant of that letter assigned.
 * - For Geresh letters (ג vs ג', ז vs ז', צ vs צ'), un-apostrophed letters prefer the non-geresh digit.
 */
export function resolvePossibleDigitsForWordToken(
  tok: { rawToken: string; baseLetter: string; hasExplicitVariant: boolean },
  majorDigits: MajorItem[]
): number[] {
  const digitsWithExactToken: number[] = [];
  const digitsWithNonGereshBase: number[] = [];
  const digitsWithAnyBase: number[] = [];

  for (const d of majorDigits) {
    const digit = d.number;
    if (typeof digit !== 'number' || isNaN(digit) || digit < 0 || digit > 9) continue;
    const assignedTokens = parseConsonantTokens(d.consonants);

    for (const at of assignedTokens) {
      const atBase = normalizeHebrewChar(at[0]);
      const atHasGeresh = at.includes("'");
      if (at === tok.rawToken) {
        if (!digitsWithExactToken.includes(digit)) digitsWithExactToken.push(digit);
      }
      if (atBase === tok.baseLetter) {
        if (!digitsWithAnyBase.includes(digit)) digitsWithAnyBase.push(digit);
        if (!atHasGeresh && !digitsWithNonGereshBase.includes(digit)) {
          digitsWithNonGereshBase.push(digit);
        }
      }
    }
  }

  if (tok.hasExplicitVariant) {
    return digitsWithExactToken.length > 0 ? digitsWithExactToken : digitsWithAnyBase;
  }

  // Unvocalized token without geresh:
  // Prefer non-geresh variants of this base letter (e.g. 'צ' -> matches 'צ' rather than "צ'"),
  // while allowing Dagesh/Rafe ('פּ' and 'פ', 'בּ' and 'ב', 'שׁ' and 'שׂ') to both match unvocalized keyboard input!
  if (digitsWithNonGereshBase.length > 0) {
    return digitsWithNonGereshBase;
  }
  return digitsWithExactToken;
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
 * 1. Parentheses (...) and their contents are completely ignored.
 * 2. Connecting letters (אותיות מקשרות) are ignored in phonetic analysis.
 * 3. Non-connecting letters map to digits strictly according to majorDigits (Numbers Logic module).
 * 4. For single digits (0-9): word must contain consonant(s) for that digit, and must NOT contain non-connecting consonants of other digits.
 * 5. For 2-digit numbers (00-99):
 *    - Non-connecting consonants must represent tens then units (e.g. 14 -> [1, 4]).
 */
export function validateHebrewLogic(
  text: string,
  targetNumber: number,
  majorDigits: MajorItem[],
  connectingLetters: string[] = DEFAULT_CONNECTING_LETTERS,
  mode: 'major' | 'pao' = 'major'
): LogicValidationResult {
  const trimmed = stripParentheses(text || '');
  if (!trimmed) {
    return { isValid: true, message: '' };
  }

  if (typeof targetNumber !== 'number' || isNaN(targetNumber) || targetNumber < 0 || targetNumber > 99) {
    return { isValid: true, message: '' };
  }

  const normalizedConnecting = new Set(connectingLetters.map(normalizeHebrewChar));

  const isSingleDigit = mode !== 'pao' && targetNumber >= 0 && targetNumber <= 9;
  const expectedDigits = isSingleDigit
    ? [targetNumber]
    : [Math.floor(targetNumber / 10), targetNumber % 10];

  const wordTokens = extractPhoneticTokensFromWord(trimmed);
  if (wordTokens.length === 0) {
    return { isValid: true, message: '' };
  }

  // Filter out transparent connecting letters (unless the user explicitly typed a geresh/dagesh consonant token that is assigned to a digit)
  const nonConnecting = wordTokens.filter((wt) => {
    if (wt.hasExplicitVariant) {
      const exactAssigned = resolvePossibleDigitsForWordToken(wt, majorDigits);
      if (exactAssigned.length > 0) return true;
    }
    return !normalizedConnecting.has(wt.baseLetter);
  });

  if (nonConnecting.length === 0) {
    const expectedConsStr = isSingleDigit
      ? majorDigits.find((d) => d.number === expectedDigits[0])?.consonants || 'ללא עיצור'
      : `${majorDigits.find((d) => d.number === expectedDigits[0])?.consonants || '?'} + ${majorDigits.find((d) => d.number === expectedDigits[1])?.consonants || '?'}`;
    const detailMsg = `בערך "${trimmed}" קיימות רק אותיות חיבור (${connectingLetters.join(', ')}) וחסרים עיצורים המתאימים למספר ${isSingleDigit ? expectedDigits[0] : `${expectedDigits[0]}${expectedDigits[1]}`} (נדרש: ${expectedConsStr}).`;
    return {
      isValid: false,
      message: `חריגה בלוגיקה: ${detailMsg}`,
      details: detailMsg,
      expectedDigits,
      detectedDigits: [],
    };
  }

  const unrecognizedLetters: string[] = [];
  const tokenDigitOptions: number[][] = [];
  const tokenBreakdowns: string[] = [];

  for (const wt of nonConnecting) {
    const possible = resolvePossibleDigitsForWordToken(wt, majorDigits);
    if (possible.length === 0) {
      unrecognizedLetters.push(wt.rawToken);
      tokenBreakdowns.push(`'${wt.rawToken}' (ללא שיוך מספרי)`);
    } else {
      tokenDigitOptions.push(possible);
      tokenBreakdowns.push(`'${wt.rawToken}' (ספרה ${possible.join('/')})`);
    }
  }

  // Generate possible deduplicated digit sequences from tokenDigitOptions
  const buildSequences = (optionsList: number[][]): number[][] => {
    if (optionsList.length === 0) return [[]];
    let currentSeqs: number[][] = [[]];
    for (const opts of optionsList) {
      const nextSeqs: number[][] = [];
      for (const seq of currentSeqs) {
        for (const d of opts) {
          const dedup = seq.length > 0 && seq[seq.length - 1] === d ? seq : [...seq, d];
          nextSeqs.push(dedup);
        }
      }
      currentSeqs = nextSeqs;
    }
    return currentSeqs;
  };

  const candidateSequences = buildSequences(tokenDigitOptions);
  const primaryDetected = candidateSequences[0] || [];

  // Validation logic for single digit (0-9) in Major mode
  if (isSingleDigit) {
    const target = expectedDigits[0];
    if (unrecognizedLetters.length === 0) {
      const matchingSeq = candidateSequences.find(
        (seq) => seq.length === 1 && seq[0] === target
      );
      if (matchingSeq) {
        return { isValid: true, message: '', expectedDigits, detectedDigits: matchingSeq };
      }
    }

    const targetCons = majorDigits.find((d) => d.number === target)?.consonants || 'ללא עיצור מוגדר';
    const detectedStr = primaryDetected.length > 0 ? primaryDetected.join(', ') : 'ללא ספרה';
    const detailMsg = `בערך "${trimmed}" זוהו העיצורים [${tokenBreakdowns.join(', ')}] (ספרות: ${detectedStr}), שאינם מתאימים ללוגיקה הנוכחית של ספרה ${target} (עיצורים נדרשים: ${targetCons}).`;
    return {
      isValid: false,
      message: `חריגה בלוגיקה: ${detailMsg}`,
      expectedDigits,
      detectedDigits: primaryDetected,
      details: detailMsg,
    };
  }

  // Validation logic for 2-digit number (10-99, or two-digit 00-09)
  const tens = expectedDigits[0];
  const units = expectedDigits[1];

  if (unrecognizedLetters.length === 0) {
    for (const seq of candidateSequences) {
      // Case A: Exact sequence of 2 digits (e.g. [1, 4] for 14, or [0, 1] for 01)
      if (seq.length === 2 && seq[0] === tens && seq[1] === units) {
        return { isValid: true, message: '', expectedDigits, detectedDigits: seq };
      }
      // Case B: Digits where tens === units (e.g. 00, 11, 22):
      if (tens === units && seq.length === 1 && seq[0] === tens) {
        return { isValid: true, message: '', expectedDigits, detectedDigits: seq };
      }
      // Case C: For PAO 00-09 (tens === 0), allow single-digit consonant words matching units (e.g. 01 -> "לב" [1] or "עלה" [1])
      if (mode === 'pao' && tens === 0 && seq.length === 1 && seq[0] === units) {
        return { isValid: true, message: '', expectedDigits, detectedDigits: seq };
      }
    }
  }

  const tensCons = majorDigits.find((d) => d.number === tens)?.consonants || 'ללא עיצור';
  const unitsCons = majorDigits.find((d) => d.number === units)?.consonants || 'ללא עיצור';
  const detectedStr = primaryDetected.length > 0 ? primaryDetected.join('') : 'ללא ספרה';
  const detailMsg = `בערך "${trimmed}" זוהו העיצורים [${tokenBreakdowns.join(', ')}] (ספרות: ${detectedStr}), שאינם מתאימים ללוגיקה הנוכחית של מספר ${tens}${units} (נדרשים עיצורי ספרה ${tens} [${tensCons}] וספרה ${units} [${unitsCons}]).`;
  return {
    isValid: false,
    message: `חריגה בלוגיקה: ${detailMsg}`,
    expectedDigits,
    detectedDigits: primaryDetected,
    details: detailMsg,
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

/**
 * Validates the "Person" (אדם) field in the PAO system.
 * Checks ONLY the first letter/token of the first name (tens digit) and the first letter/token of the last name (units digit)
 * against the live Numbers Logic module (`majorDigits`).
 */
export function validatePAOPerson(
  text: string,
  targetNumber: number,
  majorDigits: MajorItem[],
  connectingLetters: string[] = DEFAULT_CONNECTING_LETTERS
): LogicValidationResult {
  const trimmed = stripParentheses(text || '');
  if (!trimmed) {
    return { isValid: true, message: '' };
  }

  if (typeof targetNumber !== 'number' || isNaN(targetNumber) || targetNumber < 0 || targetNumber > 99) {
    return { isValid: true, message: '' };
  }

  const tens = Math.floor(targetNumber / 10);
  const units = targetNumber % 10;
  const expectedDigits = [tens, units];

  // Clean text: strip quotation marks (parentheses already stripped via stripParentheses)
  const clean = trimmed.replace(/[״"]/g, '').trim();

  // Split into words
  const words = clean.split(/[\s\-–—\.]+/).filter((w) => w.length > 0);

  const getFirstPhoneticToken = (w: string) => {
    const tokens = extractPhoneticTokensFromWord(w);
    return tokens.length > 0 ? tokens[0] : null;
  };

  let initial1: string | null = null;
  let initial2: string | null = null;
  let d1List: number[] = [];
  let d2List: number[] = [];

  if (words.length >= 2) {
    const firstTok = getFirstPhoneticToken(words[0]);
    if (firstTok) {
      initial1 = firstTok.rawToken;
      d1List = resolvePossibleDigitsForWordToken(firstTok, majorDigits);
    }

    for (let i = 1; i < words.length; i++) {
      const candTok = getFirstPhoneticToken(words[i]);
      if (!candTok) continue;
      const candDigits = resolvePossibleDigitsForWordToken(candTok, majorDigits);
      if (!initial2) {
        initial2 = candTok.rawToken;
        d2List = candDigits;
      }
      if (d1List.includes(tens) && candDigits.includes(units)) {
        return {
          isValid: true,
          message: '',
          expectedDigits,
          detectedDigits: [tens, units],
        };
      }
    }
  } else if (words.length === 1) {
    const tokens = extractPhoneticTokensFromWord(words[0]);
    if (tokens.length >= 2) {
      initial1 = tokens[0].rawToken;
      initial2 = tokens[1].rawToken;
      d1List = resolvePossibleDigitsForWordToken(tokens[0], majorDigits);
      d2List = resolvePossibleDigitsForWordToken(tokens[1], majorDigits);
      if (d1List.includes(tens) && d2List.includes(units)) {
        return {
          isValid: true,
          message: '',
          expectedDigits,
          detectedDigits: [tens, units],
        };
      }
    }
  }

  const tensItem = majorDigits.find((m) => m.number === tens);
  const unitsItem = majorDigits.find((m) => m.number === units);
  const tensCons = tensItem?.consonants || `ספרה ${tens}`;
  const unitsCons = unitsItem?.consonants || `ספרה ${units}`;
  const d1 = d1List[0];
  const d2 = d2List[0];
  const init1Desc = initial1 ? `'${initial1}' (${d1 !== undefined ? `ספרה ${d1}` : 'ללא מיפוי'})` : 'חסרה אות ראשונה';
  const init2Desc = initial2 ? `'${initial2}' (${d2 !== undefined ? `ספרה ${d2}` : 'ללא מיפוי'})` : 'חסרה אות שנייה';
  const detailMsg = `בערך "${trimmed}" ראשי התיבות הם ${init1Desc} ו-${init2Desc}, שאינם מתאימים ללוגיקה הנוכחית של מספר ${tens}${units} (נדרש: ספרת עשרות ${tens} [${tensCons}] וספרת אחדות ${units} [${unitsCons}]).`;

  return {
    isValid: false,
    message: `חריגה בלוגיקה: ${detailMsg}`,
    expectedDigits,
    detectedDigits: [d1 ?? -1, d2 ?? -1].filter((d) => d >= 0),
    details: detailMsg,
  };
}
