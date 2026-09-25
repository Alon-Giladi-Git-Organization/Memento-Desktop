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
  0: { primary: 'ס', allConsonants: 'ס, ז, שׂ', mnemonicWord: 'סוס' },
  1: { primary: 'ל', allConsonants: 'ל', mnemonicWord: 'לב' },
  2: { primary: 'ב', allConsonants: 'ב, פ', mnemonicWord: 'פה' },
  3: { primary: 'כ', allConsonants: 'כ, ק, ג', mnemonicWord: 'כוס' },
  4: { primary: 'ד', allConsonants: 'ט, ת, ד', mnemonicWord: 'תה' },
  5: { primary: 'ח', allConsonants: 'ח', mnemonicWord: 'חי' },
  6: { primary: 'ש', allConsonants: 'שׁ, צ', mnemonicWord: 'אש' },
  7: { primary: 'ר', allConsonants: 'ר', mnemonicWord: 'אור' },
  8: { primary: 'מ', allConsonants: 'מ', mnemonicWord: 'ים' },
  9: { primary: 'פ', allConsonants: 'פ, ב', mnemonicWord: 'אף' },
};

export interface PAOInitialsResult {
  tensDigit: number;
  unitsDigit: number;
  tensLetter: string;
  unitsLetter: string;
  initials: string; // e.g. "ל.ד."
  spaced: string; // e.g. "ל · ד"
  tensConsonants: string; // e.g. "ל"
  unitsConsonants: string; // e.g. "ט/ת/ד"
  fullFormula: string; // e.g. "1=ל, 4=ד/ת"
}

/**
 * Returns the two canonical initials for any 2-digit number (00 to 99)
 * based on the Major System default mapping.
 */
export function getPAOInitials(number: number): PAOInitialsResult {
  const absNum = Math.abs(number);
  const tensDigit = Math.floor(absNum / 10) % 10;
  const unitsDigit = absNum % 10;

  const tensDef = MAJOR_DIGITS_MAPPING[tensDigit] || {
    primary: '?',
    allConsonants: '?',
    mnemonicWord: '?',
  };
  const unitsDef = MAJOR_DIGITS_MAPPING[unitsDigit] || {
    primary: '?',
    allConsonants: '?',
    mnemonicWord: '?',
  };

  return {
    tensDigit,
    unitsDigit,
    tensLetter: tensDef.primary,
    unitsLetter: unitsDef.primary,
    initials: `${tensDef.primary}.${unitsDef.primary}.`,
    spaced: `${tensDef.primary} · ${unitsDef.primary}`,
    tensConsonants: tensDef.allConsonants,
    unitsConsonants: unitsDef.allConsonants,
    fullFormula: `${tensDigit}=${tensDef.primary}, ${unitsDigit}=${unitsDef.primary}`,
  };
}
