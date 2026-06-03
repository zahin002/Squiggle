// Word lists organized by genre
const wordBank = {
  animals: ['elephant', 'giraffe', 'platypus', 'chameleon', 'octopus', 'penguin', 'flamingo'],
  foodAndDrink: ['sushi', 'taco', 'milkshake', 'croissant', 'avocado', 'burrito'],
  nature: ['thunderstorm', 'waterfall', 'avalanche', 'volcano', 'rainbow', 'tornado'],
  entertainment: ['lightsaber', 'superhero', 'blockbuster', 'sitcom', 'screenplay'],
  videoGames: ['controller', 'dungeon', 'respawn', 'inventory', 'checkpoint'],
  anime: ['samurai', 'mecha', 'shinobi', 'isekai', 'protagonist'],
  historical: ['pharaoh', 'gladiator', 'astronaut', 'pioneer', 'renaissance'],
  brands: ['logo', 'trademark', 'advertisement', 'mascot', 'slogan'],
  space: ['blackhole', 'nebula', 'asteroid', 'galaxy', 'cosmonaut'],
  idioms: ['piece of cake', 'under the weather', 'bite the bullet', 'break a leg'],
  standard: ['apple', 'bicycle', 'castle', 'dragon', 'explosion', 'fireplace', 'guitar',
             'hospital', 'island', 'jungle', 'kangaroo', 'lighthouse', 'mountain', 'notebook']
};

/**
 * Get word choices for a round based on game mode and settings.
 * Returns wordCount+1 words so the drawer can pick one.
 */
function getWordChoices(settings) {
  const { gameMode, selectedGenres, customWords, wordCount } = settings;
  let pool = [];

  if (gameMode === 'custom') {
    pool = [...customWords];
  } else if (gameMode === 'genre' && selectedGenres.length > 0) {
    selectedGenres.forEach(genre => {
      const key = genre.toLowerCase().replace(/[^a-z]/g, '');
      if (wordBank[key]) pool = [...pool, ...wordBank[key]];
    });
  } else {
    // Standard mode — use all words
    Object.values(wordBank).forEach(list => pool = [...pool, ...list]);
  }

  // Shuffle and return wordCount+1 options (extra gives drawer a choice)
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, (wordCount || 3) + 1);
}

const { generateAIWords } = require('../services/aiWordGenerator');

async function getWordChoices(settings) {
  const aiWords = await generateAIWords(settings);
  if (aiWords) return aiWords;           // AI path succeeded
  // ... existing static pool fallback below
}

module.exports = { wordBank, getWordChoices };