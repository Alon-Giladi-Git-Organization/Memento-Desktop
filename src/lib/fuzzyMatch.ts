/**
 * Normalizes Hebrew final forms (sofit) to standard letters
 * (ך->כ, ם->מ, ן->נ, ף->פ, ץ->צ) so roots and stems match seamlessly.
 */
export function normalizeHebrewFinals(text: string): string {
  if (!text) return '';
  return text
    .replace(/ך/g, 'כ')
    .replace(/ם/g, 'מ')
    .replace(/ן/g, 'נ')
    .replace(/ף/g, 'פ')
    .replace(/ץ/g, 'צ');
}

/**
 * Normalizes Hebrew text for flexible comparison:
 * - Strips parentheses and brackets with contents (e.g., "(ס.ב)" or "[ס.ב.]")
 * - Strips Hebrew niqqud / diacritics
 * - Removes punctuation (quotes, hyphens, dots, commas)
 * - Normalizes Hebrew final letters
 * - Trims extra whitespace
 */
export function normalizeHebrewText(text: string): string {
  if (!text) return '';
  const cleaned = text
    // Remove parentheses/brackets and their inner content
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\{.*?\}/g, '')
    // Remove Hebrew niqqud (U+0591 to U+05C7)
    .replace(/[\u0591-\u05C7]/g, '')
    // Remove punctuation & special characters
    .replace(/[^\u0590-\u05FFa-zA-Z0-9\s]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

  return normalizeHebrewFinals(cleaned);
}

/**
 * Calculates Levenshtein Distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Common Hebrew prepositions, conjunctions, and stop words to ignore when comparing phrases
 */
const HEBREW_STOP_WORDS = new Set([
  'של', 'על', 'את', 'עם', 'אל', 'ב', 'ל', 'מ', 'כ', 'ש', 'הוא', 'היא', 'הם', 'הן',
  'זה', 'זו', 'אלה', 'עבור', 'לתוך', 'מתוך', 'מעל', 'תחת', 'ליד', 'בתוך', 'מול',
  'לעבר', 'בין', 'אשר', 'שלו', 'שלה', 'שלהם', 'שלהן', 'אודות', 'בלי', 'ללא', 'כמו',
  'אך', 'רק', 'גם', 'כל', 'נותן', 'לתת', 'עושה', 'לעשות', 'מבצע', 'לבצע', 'שם', 'לשים'
]);

/**
 * Extracts the Hebrew morphological root/stem skeleton:
 * - Strips multi-letter verb prefixes (מת-, הת-, לת-, נת-, כש-, וש-)
 * - Strips single-letter prefixes (ה, מ, ל, ת, נ, ו, ש, ב, כ)
 * - Strips common suffixes (ות, ים, ית, יה, ון, ה, ת, י, נו)
 * - Strips internal vowel letters (אהו"י) to reveal consonant root skeleton
 *
 * Example:
 * "מתאגרף" -> "גרפ"
 * "אגרוף"   -> "גרפ"
 * "הקלדה"  -> "קלד"
 * "מקליד"  -> "קלד"
 */
export function getHebrewStem(word: string): string {
  let w = normalizeHebrewText(word);
  if (w.length <= 2) return w;

  // Leading multi-letter conjunctions & binyan prefixes
  if (w.startsWith('כש') && w.length >= 5) w = w.slice(2);
  else if (w.startsWith('וש') && w.length >= 5) w = w.slice(2);
  else if ((w.startsWith('מת') || w.startsWith('הת') || w.startsWith('לת') || w.startsWith('נת')) && w.length >= 5) {
    w = w.slice(2);
  } else if ((w.startsWith('ו') || w.startsWith('ש')) && w.length >= 4) {
    w = w.slice(1);
  }

  // Single-letter prefixes
  if (
    (w.startsWith('ה') ||
      w.startsWith('מ') ||
      w.startsWith('ל') ||
      w.startsWith('ת') ||
      w.startsWith('נ') ||
      w.startsWith('ב') ||
      w.startsWith('כ')) &&
    w.length >= 4
  ) {
    w = w.slice(1);
  }

  // Trailing suffixes
  if (w.endsWith('ות') && w.length >= 4) w = w.slice(0, -2);
  else if (w.endsWith('ים') && w.length >= 4) w = w.slice(0, -2);
  else if (w.endsWith('ית') && w.length >= 4) w = w.slice(0, -2);
  else if (w.endsWith('יה') && w.length >= 4) w = w.slice(0, -2);
  else if (w.endsWith('ון') && w.length >= 4) w = w.slice(0, -2);
  else if (w.endsWith('נו') && w.length >= 4) w = w.slice(0, -2);
  else if (w.endsWith('ה') && w.length >= 4) w = w.slice(0, -1);
  else if (w.endsWith('ת') && w.length >= 4) w = w.slice(0, -1);
  else if (w.endsWith('י') && w.length >= 4) w = w.slice(0, -1);

  const skeleton = w.replace(/[אהוי]/g, '');
  return skeleton.length >= 2 ? skeleton : w;
}

/**
 * Checks whether an individual guess word matches an individual target word
 * using exact, substring, typo (Levenshtein), or Hebrew morphological root stem.
 */
export function isHebrewWordMatch(guessWord: string, targetWord: string): boolean {
  if (!guessWord || !targetWord) return false;
  if (guessWord === targetWord) return true;

  // Substring match if meaningful length
  if (guessWord.length >= 3 && targetWord.includes(guessWord)) return true;
  if (targetWord.length >= 3 && guessWord.includes(targetWord)) return true;

  // Levenshtein fuzzy match for typos (e.g. "סלסבטר" vs "סילבסטר")
  const maxLen = Math.max(guessWord.length, targetWord.length);
  const dist = levenshteinDistance(guessWord, targetWord);
  if (maxLen <= 5 && dist <= 1) return true;
  if (maxLen <= 8 && dist <= 2) return true;
  if (maxLen > 8 && dist <= 3) return true;
  if (maxLen >= 7 && dist <= 3) return true;

  // Hebrew morphological stem match (e.g. "הקלדה" vs "מקליד", "אגרוף" vs "מתאגרף")
  const stemG = getHebrewStem(guessWord);
  const stemT = getHebrewStem(targetWord);
  if (stemG.length >= 2 && stemG === stemT) return true;
  if (stemG.length >= 3 && (stemT.includes(stemG) || stemG.includes(stemT))) return true;

  return false;
}

/**
 * Global Hebrew Morphological Search Matcher:
 * Operates across all search bars and filters in the app.
 * Matches exact, prefixes, stems, roots, and substrings.
 * Example: Searching "אגרוף" matches "סילבסטר סטאלון מתאגרף עם סוס" (root א.ג.ר.פ).
 */
export function isHebrewSearchMatch(query: string, targetContent: string): boolean {
  if (!query || !query.trim()) return true;
  if (!targetContent) return false;

  const rawQ = query.trim().toLowerCase();
  const rawT = targetContent.toLowerCase();

  // 1. Direct substring match
  if (rawT.includes(rawQ)) return true;

  // 2. Normalized substring match
  const normQ = normalizeHebrewText(rawQ);
  const normT = normalizeHebrewText(rawT);
  if (!normQ) return true;
  if (normT.includes(normQ)) return true;

  // 3. Multi-word & root/stem match
  const qWords = normQ.split(' ').filter(Boolean);
  const tWords = normT.split(' ').filter(Boolean);

  // Every word in query must have a match or stem match in target
  return qWords.every((qw) => {
    // Exact or substring in any target word
    if (tWords.some((tw) => tw.includes(qw) || isHebrewWordMatch(qw, tw))) return true;

    // Root stem match
    const qStem = getHebrewStem(qw);
    if (qStem.length >= 2) {
      return tWords.some((tw) => {
        const tStem = getHebrewStem(tw);
        return tStem === qStem || (tStem.length >= 3 && (tStem.includes(qStem) || qStem.includes(tStem)));
      });
    }

    return false;
  });
}

/**
 * Flexible Hebrew Fuzzy Match with Morphological Support:
 * 1. Normalizes both guess & target (strips parentheses, punctuation, niqqud, finals).
 * 2. Checks exact normalized match.
 * 3. Checks direct substring inclusion (e.g. "חוברת" inside "חוברת קומיקס נדירה").
 * 4. Checks word-by-word matching with morphological stemming & Levenshtein typo tolerance.
 *    (e.g., "הקלדה" matches "מקליד על מחשב", "סלסבטר סטלון" matches "סילבסטר סטאלון").
 * 5. Overall Levenshtein tolerance for whole-phrase typos.
 */
export function isHebrewFuzzyMatch(guess: string, target: string): boolean {
  const normGuess = normalizeHebrewText(guess);
  const normTarget = normalizeHebrewText(target);

  if (!normGuess || !normTarget) return false;

  // 1. Direct match after normalization
  if (normGuess === normTarget) return true;

  // 2. Direct substring check (e.g. "חוברת" in "חוברת קומיקס נדירה", or "סילבסטר" in "סילבסטר סטאלון")
  if (normGuess.length >= 3 && normTarget.includes(normGuess)) return true;
  if (normTarget.length >= 3 && normGuess.includes(normTarget)) return true;

  // Split into meaningful words, filtering stop words
  const targetWords = normTarget.split(' ').filter((w) => w && !HEBREW_STOP_WORDS.has(w));
  const guessWords = normGuess.split(' ').filter((w) => w && !HEBREW_STOP_WORDS.has(w));

  if (guessWords.length === 0 || targetWords.length === 0) return false;

  // 3. Check if words of the guess match words in target
  let matchedGuessCount = 0;
  for (const gw of guessWords) {
    const matched = targetWords.some((tw) => isHebrewWordMatch(gw, tw));
    if (matched) matchedGuessCount++;
  }

  // If every meaningful word of the guess matched a target word
  if (matchedGuessCount === guessWords.length) return true;

  // For multi-word guesses, allow majority match
  if (guessWords.length >= 2 && matchedGuessCount >= Math.ceil(guessWords.length * 0.7)) {
    return true;
  }

  // 4. Hebrew Plene spelling reduction (removing matres lectionis 'א', 'ו', 'י' for phonetic comparison)
  const skeletonGuess = normGuess.replace(/[אהוי]/g, '');
  const skeletonTarget = normTarget.replace(/[אהוי]/g, '');

  if (skeletonGuess.length > 2 && skeletonGuess === skeletonTarget) {
    return true;
  }

  // 5. Overall Levenshtein Distance tolerance
  const dist = levenshteinDistance(normGuess, normTarget);
  const maxLen = Math.max(normGuess.length, normTarget.length);

  if (maxLen <= 8 && dist <= 2) return true;
  if (maxLen > 8 && (maxLen - dist) / maxLen >= 0.7) return true;

  return false;
}

/**
 * Searches across multiple entity fields using Hebrew morphological roots,
 * stems, exact matching, and substring filtering.
 */
export function isHebrewMultiFieldSearchMatch(
  query: string,
  ...fields: (string | number | undefined | null)[]
): boolean {
  if (!query || !query.trim()) return true;
  const q = query.trim().toLowerCase();

  // 1. Direct match on any field (fast path)
  for (const field of fields) {
    if (field === undefined || field === null) continue;
    const str = String(field);
    if (str.toLowerCase().includes(q)) return true;
  }

  // 2. Morphological root match on any individual field
  for (const field of fields) {
    if (field === undefined || field === null) continue;
    const str = String(field);
    if (isHebrewSearchMatch(query, str)) return true;
  }

  // 3. Morphological check on combined text of all fields
  const combined = fields.filter((f) => f !== undefined && f !== null).map(String).join(' ');
  return isHebrewSearchMatch(query, combined);
}

