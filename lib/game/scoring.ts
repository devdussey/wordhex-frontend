// Letter point values (Scrabble-style)
const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4,
  I: 1, J: 8, K: 5, L: 1, M: 3, N: 1, O: 1, P: 3,
  Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8,
  Y: 4, Z: 10
};

// Length multipliers for longer words
const LENGTH_BONUS: Record<number, number> = {
  3: 1,
  4: 1,
  5: 1.5,
  6: 2,
  7: 2.5,
  8: 3,
};

/**
 * Calculate the score for a word
 * @param word - The word to score
 * @returns The calculated score
 */
export function scoreWord(word: string): number {
  if (!word || word.length < 3) return 0;

  const upperWord = word.toUpperCase();

  // Sum letter values
  let baseScore = 0;
  for (const letter of upperWord) {
    baseScore += LETTER_VALUES[letter] || 0;
  }

  // Apply length multiplier
  const multiplier = LENGTH_BONUS[word.length] || Math.max(3.5, word.length * 0.5);

  return Math.round(baseScore * multiplier);
}

/**
 * Get the point value for a single letter
 * @param letter - The letter to get value for
 * @returns The letter's point value
 */
export function getLetterValue(letter: string): number {
  return LETTER_VALUES[letter.toUpperCase()] || 0;
}
