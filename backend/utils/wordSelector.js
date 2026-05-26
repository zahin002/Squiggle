const Groq = require('groq-sdk');
const { genres, availableGenres } = require('./wordBank');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// ─── Generate a single word from AI ───────────────────────────
const generateWordFromAI = async (genre, usedWords = []) => {
  const genreInfo = genres[genre];

  if (!genreInfo) {
    throw new Error(`Genre "${genre}" not found`);
  }

  const usedWordsText = usedWords.length > 0
    ? `Do NOT use any of these words that were already used: ${usedWords.join(', ')}.`
    : '';

  const prompt = `You are a word generator for a drawing and guessing game called Squiggle.
  
Generate exactly ONE word or short phrase that fits this category: ${genreInfo.prompt}

Rules:
- Return ONLY the word or phrase, nothing else
- No punctuation, no explanation, no extra text
- Must be something a person can reasonably draw
- Must be universally recognizable
- ${usedWordsText}

Respond with just the word or phrase.`;

  const response = await groq.chat.completions.create({
   model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.9,
    max_tokens: 20
  });

  const word = response.choices[0].message.content.trim();
  return word;
};

// ─── Get word choices for a round ─────────────────────────────
const getWordChoices = async (options = {}) => {
  const {
    genre = 'standard',
    customWords = [],
    usedWords = [],
    count = 3
  } = options;

  // If custom words mode — pick from the custom list
  if (genre === 'custom' && customWords.length > 0) {
    const available = customWords.filter(w => !usedWords.includes(w));
    const shuffled = available.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // If standard mode — pick a random genre
  let selectedGenre = genre;
  if (genre === 'standard') {
    const randomIndex = Math.floor(Math.random() * availableGenres.length);
    selectedGenre = availableGenres[randomIndex];
  }

  // Generate words from AI
  const words = [];
  const attempts = [];

  for (let i = 0; i < count; i++) {
    try {
      // Pass already generated words to avoid duplicates
      const word = await generateWordFromAI(selectedGenre, [
        ...usedWords,
        ...attempts
      ]);

      attempts.push(word);
      words.push(word);
    } catch (error) {
      console.error(`Error generating word ${i + 1}:`, error.message);
      // If AI fails, push a fallback
      words.push(`Draw something from ${genres[selectedGenre]?.label || 'any category'}`);
    }
  }

  return words;
};

// ─── Get random genre ──────────────────────────────────────────
const getRandomGenre = () => {
  const randomIndex = Math.floor(Math.random() * availableGenres.length);
  return availableGenres[randomIndex];
};

module.exports = { getWordChoices, getRandomGenre, generateWordFromAI };