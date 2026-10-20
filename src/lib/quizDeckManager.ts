/**
 * Quiz Deck Manager
 *
 * Implements non-repeating permutation cycle ("shuffled deck") for active recall testing.
 * Guarantees:
 * 1. Every eligible item in the test pool is presented exactly once in random order before any item repeats.
 * 2. When a cycle is exhausted, all items are reshuffled into a fresh cycle.
 * 3. The first item of a new cycle is guaranteed to be different from the last item of the previous cycle
 *    (preventing back-to-back repetitions across cycle boundaries).
 * 4. Progress is persisted in localStorage, so leaving and returning tomorrow resumes exactly where the user left off.
 */

export interface DeckProgress {
  currentQuestionNumber: number; // 1-indexed (e.g. 1)
  totalInCycle: number;          // e.g. 100
  remainingInCycle: number;      // e.g. 99
  cycleNumber: number;           // e.g. 1
  isNewCycleJustStarted?: boolean;
}

export interface PersistedDeckState {
  shuffledIds: Array<string | number>;
  currentIndex: number;
  cycleNumber: number;
  lastDrawnId?: string | number;
  updatedAt: number;
}

const STORAGE_PREFIX = 'mem_quiz_deck_v1_';

/**
 * Modern Fisher-Yates shuffle algorithm
 */
function fisherYatesShuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const memoryCache = new Map<string, string>();

function getStorageItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    if (typeof localStorage !== 'undefined' && localStorage.getItem) {
      return localStorage.getItem(key);
    }
  } catch {
    // ignore
  }
  return memoryCache.get(key) || null;
}

function setStorageItem(key: string, val: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, val);
    }
    if (typeof localStorage !== 'undefined' && localStorage.setItem) {
      localStorage.setItem(key, val);
    }
  } catch {
    // ignore
  }
  memoryCache.set(key, val);
}

function removeStorageItem(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
    if (typeof localStorage !== 'undefined' && localStorage.removeItem) {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
  memoryCache.delete(key);
}

/**
 * Loads persisted deck state for a given deck key
 */
function loadDeckState(deckKey: string): PersistedDeckState | null {
  try {
    const raw = getStorageItem(`${STORAGE_PREFIX}${deckKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.shuffledIds) && typeof parsed.currentIndex === 'number') {
      return parsed;
    }
  } catch {
    // Ignore invalid JSON
  }
  return null;
}

/**
 * Saves deck state to localStorage
 */
function saveDeckState(deckKey: string, state: PersistedDeckState): void {
  try {
    setStorageItem(`${STORAGE_PREFIX}${deckKey}`, JSON.stringify(state));
  } catch {
    // Ignore quota errors
  }
}

/**
 * Resets a quiz deck to start a fresh cycle from scratch
 */
export function resetQuizDeck(deckKey: string): void {
  removeStorageItem(`${STORAGE_PREFIX}${deckKey}`);
}

/**
 * Synchronizes the persisted deck with the current list of candidate items,
 * returning the updated state ready for drawing.
 */
function syncAndEnsureDeck<T>(
  deckKey: string,
  candidateItems: T[],
  getId: (item: T) => string | number
): { state: PersistedDeckState; idToItemMap: Map<string | number, T>; isNewCycle: boolean } {
  const idToItemMap = new Map<string | number, T>();
  const allCandidateIds: Array<string | number> = [];

  for (const item of candidateItems) {
    const id = getId(item);
    if (id !== undefined && id !== null && id !== 'NaN' && id !== '') {
      idToItemMap.set(id, item);
      allCandidateIds.push(id);
    }
  }

  let state = loadDeckState(deckKey);
  let isNewCycle = false;

  if (!state || allCandidateIds.length === 0) {
    const shuffled = fisherYatesShuffle(allCandidateIds);
    state = {
      shuffledIds: shuffled,
      currentIndex: 0,
      cycleNumber: 1,
      lastDrawnId: undefined,
      updatedAt: Date.now(),
    };
    saveDeckState(deckKey, state);
    return { state, idToItemMap, isNewCycle: true };
  }

  // 1. Keep only IDs from existing deck that are still present in current candidates
  const candidateIdSet = new Set(allCandidateIds);
  const validExistingIds = state.shuffledIds.filter((id) => candidateIdSet.has(id));

  // 2. Find newly added candidate IDs that weren't in the deck
  const existingIdSet = new Set(validExistingIds);
  const newCandidateIds = allCandidateIds.filter((id) => !existingIdSet.has(id));

  if (newCandidateIds.length > 0) {
    // Append new IDs in randomized order to be seen in current cycle
    const shuffledNew = fisherYatesShuffle(newCandidateIds);
    validExistingIds.push(...shuffledNew);
  }

  state.shuffledIds = validExistingIds;

  // 3. Check if all items in current cycle were already consumed
  if (state.currentIndex >= state.shuffledIds.length || state.shuffledIds.length === 0) {
    // Start fresh cycle with all candidate items
    let freshShuffled = fisherYatesShuffle(allCandidateIds);

    // Guard: Prevent the last item of the previous cycle from being the first item of the new cycle
    if (freshShuffled.length > 1 && state.lastDrawnId !== undefined && freshShuffled[0] === state.lastDrawnId) {
      // Swap first item with the last item or random index > 0
      const swapIdx = 1 + Math.floor(Math.random() * (freshShuffled.length - 1));
      [freshShuffled[0], freshShuffled[swapIdx]] = [freshShuffled[swapIdx], freshShuffled[0]];
    }

    state.shuffledIds = freshShuffled;
    state.currentIndex = 0;
    state.cycleNumber = (state.cycleNumber || 1) + 1;
    isNewCycle = true;
  }

  saveDeckState(deckKey, state);
  return { state, idToItemMap, isNewCycle };
}

/**
 * Gets the current item from the deck without advancing the index (peek/mount).
 * If the deck is empty or uninitialized, initializes it.
 */
export function getCurrentOrInitialDeckItem<T>(
  deckKey: string,
  candidateItems: T[],
  getId: (item: T) => string | number
): { item: T | null; progress: DeckProgress } {
  if (candidateItems.length === 0) {
    return {
      item: null,
      progress: {
        currentQuestionNumber: 0,
        totalInCycle: 0,
        remainingInCycle: 0,
        cycleNumber: 1,
      },
    };
  }

  const { state, idToItemMap, isNewCycle } = syncAndEnsureDeck(deckKey, candidateItems, getId);

  if (state.shuffledIds.length === 0) {
    return {
      item: null,
      progress: {
        currentQuestionNumber: 0,
        totalInCycle: 0,
        remainingInCycle: 0,
        cycleNumber: state.cycleNumber,
      },
    };
  }

  // Current ID in the deck
  const currentId = state.shuffledIds[state.currentIndex] ?? state.shuffledIds[0];
  const item = idToItemMap.get(currentId) || candidateItems[0];

  return {
    item,
    progress: {
      currentQuestionNumber: state.currentIndex + 1,
      totalInCycle: state.shuffledIds.length,
      remainingInCycle: state.shuffledIds.length - (state.currentIndex + 1),
      cycleNumber: state.cycleNumber,
      isNewCycleJustStarted: isNewCycle,
    },
  };
}

/**
 * Advances the deck to the next question and returns the next item.
 * Guarantees that every item in candidateItems is seen before restarting the cycle.
 */
export function advanceToNextDeckItem<T>(
  deckKey: string,
  candidateItems: T[],
  getId: (item: T) => string | number
): { item: T | null; progress: DeckProgress } {
  if (candidateItems.length === 0) {
    return {
      item: null,
      progress: {
        currentQuestionNumber: 0,
        totalInCycle: 0,
        remainingInCycle: 0,
        cycleNumber: 1,
      },
    };
  }

  let { state, idToItemMap } = syncAndEnsureDeck(deckKey, candidateItems, getId);

  // Mark current as drawn
  const currentId = state.shuffledIds[state.currentIndex];
  state.lastDrawnId = currentId;

  // Advance index
  state.currentIndex += 1;
  let isNewCycle = false;

  // If cycle completed, reshuffle fresh cycle
  if (state.currentIndex >= state.shuffledIds.length) {
    const allCandidateIds = Array.from(idToItemMap.keys());
    let freshShuffled = fisherYatesShuffle(allCandidateIds);

    // Prevent immediate back-to-back duplicate across cycle transition
    if (freshShuffled.length > 1 && state.lastDrawnId !== undefined && freshShuffled[0] === state.lastDrawnId) {
      const swapIdx = 1 + Math.floor(Math.random() * (freshShuffled.length - 1));
      [freshShuffled[0], freshShuffled[swapIdx]] = [freshShuffled[swapIdx], freshShuffled[0]];
    }

    state.shuffledIds = freshShuffled;
    state.currentIndex = 0;
    state.cycleNumber = (state.cycleNumber || 1) + 1;
    isNewCycle = true;
  }

  state.updatedAt = Date.now();
  saveDeckState(deckKey, state);

  const nextId = state.shuffledIds[state.currentIndex];
  const nextItem = idToItemMap.get(nextId) || candidateItems[0];

  return {
    item: nextItem,
    progress: {
      currentQuestionNumber: state.currentIndex + 1,
      totalInCycle: state.shuffledIds.length,
      remainingInCycle: state.shuffledIds.length - (state.currentIndex + 1),
      cycleNumber: state.cycleNumber,
      isNewCycleJustStarted: isNewCycle,
    },
  };
}

/**
 * PAO Triplet Generator:
 * Generates (Person, Action, Object) for 6-digit or combined training
 * ensuring Person, Action, and Object cycle through without repeating in close proximity.
 */
export function getNextPAOTriplet<T extends { number: number; person: string; action: string; object: string }>(
  candidateItems: T[]
): {
  p: T;
  a: T;
  o: T;
  progress: DeckProgress;
} {
  if (candidateItems.length === 0) {
    throw new Error('No PAO items available');
  }

  // Draw person from person deck
  const pResult = advanceToNextDeckItem('workout_pao_triplet_p', candidateItems, (i) => i.number);
  const p = pResult.item || candidateItems[0];

  // Draw action from action deck
  const aCandidates = candidateItems.filter((i) => candidateItems.length <= 1 || i.number !== p.number);
  const aPool = aCandidates.length > 0 ? aCandidates : candidateItems;
  const aResult = advanceToNextDeckItem('workout_pao_triplet_a', aPool, (i) => i.number);
  const a = aResult.item || aPool[0];

  // Draw object from object deck
  const oCandidates = candidateItems.filter(
    (i) => candidateItems.length <= 2 || (i.number !== p.number && i.number !== a.number)
  );
  const oPool = oCandidates.length > 0 ? oCandidates : candidateItems;
  const oResult = advanceToNextDeckItem('workout_pao_triplet_o', oPool, (i) => i.number);
  const o = oResult.item || oPool[0];

  return {
    p,
    a,
    o,
    progress: pResult.progress,
  };
}
