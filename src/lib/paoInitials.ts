// PAO (Person-Action-Object) Initials and Major System Consonant Mapping
// In accordance with the default Hebrew Major System mapping:
// 0 = ס (ס, ז, שׂ)
// 1 = ל
// 2 = ב (ב, פ דגושה)
// 3 = כ (כ, ק, ג)
// 4 = ד (ט, ת, ד)
// 5 = ח
// 6 = ש (שׁ, צ)
// 7 = ר
// 8 = מ
// 9 = פ (פ, ב רפה)

export interface DigitConsonantDef {
  primary: string;
  allConsonants: string;
  mnemonicWord: string;
}

export const MAJOR_DIGITS_MAPPING: Record<number, DigitConsonantDef> = {
  0: { primary: 'ס', allConsonants: 'ס, ז, שׂ (ש דגושה)', mnemonicWord: 'סוס' },
  1: { primary: 'ל', allConsonants: 'ל', mnemonicWord: 'לב' },
  2: { primary: 'ב', allConsonants: 'ב', mnemonicWord: 'בית' },
  3: { primary: 'ג', allConsonants: 'ג, ק, כ', mnemonicWord: 'כוס' },
  4: { primary: 'ד', allConsonants: 'ד, ת, ט', mnemonicWord: 'תה' },
  5: { primary: 'ח', allConsonants: 'ח', mnemonicWord: 'חי' },
  6: { primary: 'ש', allConsonants: 'שׁ, ג\', צ\'', mnemonicWord: 'אש' },
  7: { primary: 'ר', allConsonants: 'ר', mnemonicWord: 'אור' },
  8: { primary: 'מ', allConsonants: 'מ', mnemonicWord: 'ים' },
  9: { primary: 'פ', allConsonants: 'פ (רפה ודגושה)', mnemonicWord: 'פה' },
};

export interface PAOInitialsResult {
  tensDigit: number;
  unitsDigit: number;
  tensLetter: string;
  unitsLetter: string;
  initials: string; // e.g. "ל.ד."
  spaced: string; // e.g. "ל · ד"
  tensConsonants: string; // e.g. "ל"
  unitsConsonants: string; // e.g. "ד/ת/ט"
  fullFormula: string; // e.g. "1=ל, 4=ד/ת/ט"
}

/**
 * Returns the two canonical initials for any 2-digit number (00 to 99)
 * based on the Major System mapping, with optional customDigits override.
 */
export function getPAOInitials(
  number: number,
  customDigits?: Array<{ number: number; consonants?: string; userConsonants?: string }>
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
      const cons = (customTensObj.userConsonants || customTensObj.consonants || '').trim();
      if (cons) {
        tensConsonants = cons;
        const firstHebrew = cons.match(/[\u0590-\u05FF]/);
        if (firstHebrew) tensLetter = firstHebrew[0];
      }
    }

    const customUnitsObj = customDigits.find((d) => d.number === unitsDigit);
    if (customUnitsObj) {
      const cons = (customUnitsObj.userConsonants || customUnitsObj.consonants || '').trim();
      if (cons) {
        unitsConsonants = cons;
        const firstHebrew = cons.match(/[\u0590-\u05FF]/);
        if (firstHebrew) unitsLetter = firstHebrew[0];
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
    fullFormula: `${tensDigit}=${tensLetter}, ${unitsDigit}=${unitsLetter}`,
  };
}
