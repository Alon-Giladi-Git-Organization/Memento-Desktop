import { parseConsonantTokens } from './hebrewLogicValidator';

export interface DigitConsonantDef {
  primary: string;
  allConsonants: string;
  mnemonicWord: string;
}

export const MAJOR_DIGITS_MAPPING: Record<number, DigitConsonantDef> = {
  0: { primary: 'ס', allConsonants: 'ס, ז, שׂ', mnemonicWord: 'סוס' },
  1: { primary: 'ל', allConsonants: 'ל', mnemonicWord: 'לב' },
  2: { primary: 'ב', allConsonants: 'בּ, ב', mnemonicWord: 'בית' },
  3: { primary: 'ג', allConsonants: 'ג, ק, כּ, כ', mnemonicWord: 'כוס' },
  4: { primary: 'ד', allConsonants: 'ד, תּ, ת, ט', mnemonicWord: 'תה' },
  5: { primary: 'ח', allConsonants: 'ח', mnemonicWord: 'חי' },
  6: { primary: 'ש', allConsonants: "שׁ, ג', צ, צ'", mnemonicWord: 'אש' },
  7: { primary: 'ר', allConsonants: 'ר', mnemonicWord: 'אור' },
  8: { primary: 'מ', allConsonants: 'מ', mnemonicWord: 'ים' },
  9: { primary: 'פ', allConsonants: 'פּ, פ', mnemonicWord: 'פה' },
};

export interface PAOInitialsResult {
  tensDigit: number;
  unitsDigit: number;
  tensLetter: string;
  unitsLetter: string;
  initials: string; // e.g. "ל.ד."
  spaced: string; // e.g. "ל · ד"
  tensConsonants: string; // e.g. "ל"
  unitsConsonants: string; // e.g. "ד, ת, ט"
  fullFormula: string; // e.g. "1=ל | 4=ד, ת, ט"
}

/**
 * Returns the live initials and consonant formula for any 2-digit number (00 to 99)
 * pulled directly (Live Binding) from the Numbers Logic module (`customDigits`).
 */
export function getPAOInitials(
  number: number,
  customDigits?: Array<{ number: number; consonants?: string }>
): PAOInitialsResult {
  const absNum = Math.abs(number);
  const tensDigit = Math.floor(absNum / 10) % 10;
  const unitsDigit = absNum % 10;

  const defaultTens = MAJOR_DIGITS_MAPPING[tensDigit] || {
    primary: '?',
    allConsonants: '?',
    mnemonicWord: '?',
  };
  const defaultUnits = MAJOR_DIGITS_MAPPING[unitsDigit] || {
    primary: '?',
    allConsonants: '?',
    mnemonicWord: '?',
  };

  let tensLetter = defaultTens.primary;
  let tensConsonants = defaultTens.allConsonants;
  let unitsLetter = defaultUnits.primary;
  let unitsConsonants = defaultUnits.allConsonants;

  if (customDigits && customDigits.length > 0) {
    const customTensObj = customDigits.find((d) => d.number === tensDigit);
    if (customTensObj) {
      const cons = (customTensObj.consonants || '').trim();
      tensConsonants = cons || 'ללא עיצור';
      const tokens = parseConsonantTokens(cons);
      if (tokens.length > 0) {
        tensLetter = tokens[0];
      } else {
        tensLetter = '?';
      }
    }

    const customUnitsObj = customDigits.find((d) => d.number === unitsDigit);
    if (customUnitsObj) {
      const cons = (customUnitsObj.consonants || '').trim();
      unitsConsonants = cons || 'ללא עיצור';
      const tokens = parseConsonantTokens(cons);
      if (tokens.length > 0) {
        unitsLetter = tokens[0];
      } else {
        unitsLetter = '?';
      }
    }
  }

  return {
    tensDigit,
    unitsDigit,
    tensLetter,
    unitsLetter,
    initials: `${tensLetter}.${unitsLetter}.`,
    spaced: `${tensLetter} · ${unitsLetter}`,
    tensConsonants,
    unitsConsonants,
    fullFormula: `${tensDigit}=[${tensConsonants}] • ${unitsDigit}=[${unitsConsonants}]`,
  };
}
