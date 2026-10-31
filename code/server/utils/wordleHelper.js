// server/utils/wordleHelper.js

/**
 * Standard Wordle guess evaluation algorithm.
 * Handles duplicate letters with proper green/yellow/gray priority.
 *
 * @param {string} guess - The 5-letter guessed word
 * @param {string} target - The 5-letter target secret word
 * @returns {{ evaluation: Array<{ letter: string, status: 'correct'|'present'|'absent' }>, isCorrect: boolean }}
 */
function evaluateWordleGuess(guess, target) {
  const g = (guess || '').trim().toUpperCase().slice(0, 5);
  const t = (target || '').trim().toUpperCase().slice(0, 5);

  const evaluation = Array(5).fill(null).map((_, i) => ({
    letter: g[i] || '',
    status: 'absent'
  }));

  const targetLetterCounts = {};

  // First pass: identify exact matches (green / 'correct')
  for (let i = 0; i < 5; i++) {
    if (g[i] === t[i]) {
      evaluation[i].status = 'correct';
    } else {
      targetLetterCounts[t[i]] = (targetLetterCounts[t[i]] || 0) + 1;
    }
  }

  // Second pass: identify misplaced letters (yellow / 'present')
  for (let i = 0; i < 5; i++) {
    if (evaluation[i].status !== 'correct') {
      const char = g[i];
      if (targetLetterCounts[char] && targetLetterCounts[char] > 0) {
        evaluation[i].status = 'present';
        targetLetterCounts[char] -= 1;
      } else {
        evaluation[i].status = 'absent';
      }
    }
  }

  const isCorrect = g === t;
  return { evaluation, isCorrect };
}

/**
 * Reward points for correct guess attempt according to Wordle mode spec:
 * Guess 1: +100 Points
 * Guess 2: +80 Points
 * Guess 3: +60 Points
 * Guess 4: +40 Points
 * Guess 5: +20 Points
 * Guess 6: +10 Points
 */
function getWordleScoreForGuess(guessNumber) {
  switch (guessNumber) {
    case 1: return 100;
    case 2: return 80;
    case 3: return 60;
    case 4: return 40;
    case 5: return 20;
    case 6: return 10;
    default: return 0;
  }
}

/**
 * Drawer rewards based on guessing success:
 * - At least one player guesses correctly: +50 Points
 * - Majority of players guess correctly: +80 Points
 * - Nobody guesses correctly: +10 Consolation Points
 */
function getDrawerWordlePoints(totalGuessersCount, solversCount) {
  if (solversCount === 0) {
    return { points: 10, reason: 'Consolation bonus (0 solvers)' };
  }
  const isMajority = totalGuessersCount > 0 && solversCount > Math.floor(totalGuessersCount / 2);
  if (isMajority) {
    return { points: 80, reason: 'Majority of players solved the word' };
  }
  return { points: 50, reason: 'At least one player solved the word' };
}

/**
 * Phase duration:
 * Phase 1 (Guess 1 & 2): 60 seconds
 * Phase 2 (Guess 3 to 6): 30 seconds
 */
function getWordlePhaseDuration(guessNumber) {
  return guessNumber <= 2 ? 60 : 30;
}

module.exports = {
  evaluateWordleGuess,
  getWordleScoreForGuess,
  getDrawerWordlePoints,
  getWordlePhaseDuration
};
