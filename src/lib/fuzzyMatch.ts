/**
 * Normalizes Hebrew text for flexible comparison:
 * - Strips parentheses and brackets with contents (e.g., "(ס.ב)" or "[ס.ב.]")
 * - Strips Hebrew niqqud / diacritics
 * - Removes punctuation (quotes, hyphens, dots, commas)
 * - Normalizes Hebrew plene spelling (matres lectionis like 'א', 'ו', 'י' variations)
 * - Trims extra whitespace
 */
export function normalizeHebrewText(text: string): string {
  if (!text) return '';
  return text
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
 * Flexible Hebrew Fuzzy Match:
 * 1. Normalizes both guess & target (strips parentheses, punctuation, niqqud).
 * 2. Checks exact normalized match.
 * 3. Checks if guess matches part of target or vice versa.
 * 4. Checks Hebrew plene spelling variations (ignoring 'א', 'ו', 'י' differences).
 * 5. Uses Levenshtein distance for minor typos/spelling differences.
 */
export function isHebrewFuzzyMatch(guess: string, target: string): boolean {
  const normGuess = normalizeHebrewText(guess);
  const normTarget = normalizeHebrewText(target);

  if (!normGuess || !normTarget) return false;

  // 1. Direct match after normalization
  if (normGuess === normTarget) return true;

  // 2. Substring match (e.g. "סילבסטר" or "סטאלון" for "סילבסטר סטאלון")
  if (normTarget.includes(normGuess) || normGuess.includes(normTarget)) {
    return true;
  }

  // 3. Word-by-word match (if multi-word target, e.g., first + last name)
  const targetWords = normTarget.split(' ').filter(Boolean);
  const guessWords = normGuess.split(' ').filter(Boolean);

  if (targetWords.length > 1 && guessWords.length > 0) {
    const matchedCount = guessWords.filter((gw) =>
      targetWords.some(
        (tw) => tw === gw || (tw.length >= 3 && (tw.includes(gw) || gw.includes(tw)))
      )
    ).length;

    if (matchedCount === guessWords.length || matchedCount >= Math.ceil(targetWords.length / 2)) {
      return true;
    }
  }

  // 4. Hebrew Plene spelling reduction (removing matres lectionis 'א', 'ו', 'י' for phonetic comparison)
  const skeletonGuess = normGuess.replace(/[אוי]/g, '');
  const skeletonTarget = normTarget.replace(/[אוי]/g, '');

  if (skeletonGuess.length > 2 && skeletonGuess === skeletonTarget) {
    return true;
  }

  // 5. Levenshtein Distance tolerance
  const dist = levenshteinDistance(normGuess, normTarget);
  const maxLen = Math.max(normGuess.length, normTarget.length);

  // Allow minor typos based on string length
  if (maxLen <= 5 && dist <= 1) return true;
  if (maxLen <= 10 && dist <= 2) return true;
  if (maxLen > 10 && dist <= 3) return true;

  const similarity = (maxLen - dist) / maxLen;
  return similarity >= 0.75;
}
