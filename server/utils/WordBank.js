// server/utils/WordBank.js — FULL FIXED VERSION
const { generateAIWords } = require('../services/aiWordGenerator');

const wordBank = {
  animals: ['elephant','giraffe','platypus','chameleon','octopus','penguin','flamingo'],
  foodAndDrink: ['sushi','taco','milkshake','croissant','avocado','burrito'],
  nature: ['thunderstorm','waterfall','avalanche','volcano','rainbow','tornado'],
  entertainment: ['lightsaber','superhero','blockbuster','sitcom','screenplay'],
  videoGames: ['controller','dungeon','respawn','inventory','checkpoint'],
  anime: ['samurai','mecha','shinobi','isekai','protagonist'],
  historical: ['pharaoh','gladiator','astronaut','pioneer','renaissance'],
  brands: ['logo','trademark','advertisement','mascot','slogan'],
  space: ['blackhole','nebula','asteroid','galaxy','cosmonaut'],
  idioms: ['piece of cake','under the weather','bite the bullet','break a leg'],
  standard: ['apple','bicycle','castle','dragon','explosion','fireplace','guitar',
             'hospital','island','jungle','kangaroo','lighthouse','mountain','notebook']
};

async function getWordChoices(settings) {
  const { gameMode, selectedGenres, customWords, wordCount } = settings;

  // Try AI first (skips custom/wordle automatically)
  const aiWords = await generateAIWords(settings);
  if (aiWords) return aiWords;

  // Static fallback
  let pool = [];
  if (gameMode === 'custom') {
    pool = [...(customWords || [])];
  } else if (gameMode === 'genre' && selectedGenres?.length > 0) {
    selectedGenres.forEach(genre => {
      const key = genre.toLowerCase().replace(/[^a-z]/g, '');
      if (wordBank[key]) pool = [...pool, ...wordBank[key]];
    });
  } else {
    Object.values(wordBank).forEach(list => { pool = [...pool, ...list]; });
  }

  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, (wordCount || 3) + 1);
}

module.exports = { wordBank, getWordChoices };