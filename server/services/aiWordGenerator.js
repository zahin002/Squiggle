/**
 * server/services/aiWordGenerator.js
 *
 * AI-powered word generation for Squiggle.
 *
 * WHY THIS EXISTS:
 * The static wordBank in server/utils/wordBank.js has a fixed pool of words.
 * Frequent players will exhaust it quickly and start seeing repeated words,
 * which ruins the guessing experience. This service calls the Google Gemini
 * API to generate fresh, contextually appropriate words on demand.
 *
 * HOW IT FITS INTO THE ARCHITECTURE:
 *   getWordChoices() in wordBank.js  ->  calls generateAIWords() here
 *                                         |
 *                              Google Gemini API
 *                                         |
 *                         Returns string[] of draw-friendly words
 *                                         |
 *                     Passed to drawer via 'wordChoices' socket event
 *
 * FALLBACK STRATEGY:
 * If the API call fails (network error, rate limit, invalid key), the service
 * returns null. The caller (wordBank.js) must fall back to the static word list.
 * This ensures the game never breaks due to an AI service outage.
 *
 * CACHING:
 * Generated word sets are cached in memory for CACHE_TTL_MS milliseconds,
 * keyed by (gameMode + genres + wordCount). This prevents redundant API calls
 * when many rooms request the same configuration simultaneously.
 */

'use strict';

const { GoogleGenAI, Type } = require('@google/genai');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const MODEL = 'gemini-2.5-flash-lite';
const MAX_OUTPUT_TOKENS = 512;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 2;

// ---------------------------------------------------------------------------
// In-memory cache
// Structure: Map<cacheKey: string, { words: string[], expiresAt: number }>
// ---------------------------------------------------------------------------

const cache = new Map();

/**
 * Build a deterministic cache key from generation parameters.
 * @param {string} gameMode
 * @param {string[]} selectedGenres
 * @param {number} wordCount
 * @returns {string}
 */
function buildCacheKey(gameMode, selectedGenres, wordCount) {
  const sortedGenres = [...(selectedGenres || [])].sort().join(',');
  return `${gameMode}|${sortedGenres}|${wordCount}`;
}

/**
 * Return cached words if the entry exists and has not expired.
 * @param {string} key
 * @returns {string[] | null}
 */
function getFromCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.words;
}

/**
 * Store a word list in the cache.
 * @param {string} key
 * @param {string[]} words
 */
function setInCache(key, words) {
  cache.set(key, {
    words,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

/**
 * Build the system prompt. The system prompt establishes the generator role
 * and strict output format so the model returns a machine-parseable list.
 * @returns {string}
 */
function buildSystemPrompt() {
  return [
    'You are a word generator for a real-time drawing-and-guessing party game called Squiggle.',
    'Your only job is to produce a JSON array of words suitable for players to draw.',
    '',
    'STRICT OUTPUT RULES - follow them exactly or the game will break:',
    '1. Respond with a raw JSON array of strings only. No markdown, no backticks, no explanation.',
    '   Example of correct output: ["elephant","bicycle","castle"]',
    '2. Every word must be drawable as a simple sketch (concrete nouns, actions, or compound concepts).',
    '3. No offensive, violent, sexual, or politically charged words.',
    '4. No proper nouns (no specific people, brands, or place names) unless the genre is "Brands & Logos".',
    '5. Difficulty should be moderate - not too obscure, not too trivially simple.',
    '6. Each word must be unique within the response.',
    '7. Words may be single words or short two-word phrases (e.g. "hot dog", "roller coaster").',
    '8. Do not repeat words that are extremely common (apple, cat, house) unless the genre is "standard".',
  ].join('\n');
}

/**
 * Build the user message that describes exactly what words are needed.
 * @param {object} params
 * @param {string}   params.gameMode        - 'standard' | 'genre' | 'custom' (custom not used here)
 * @param {string[]} params.selectedGenres  - relevant when gameMode === 'genre'
 * @param {number}   params.wordCount       - how many choices the drawer sees (typically 3-5)
 * @param {number}   params.requestCount    - total words to generate (wordCount + buffer)
 * @returns {string}
 */
function buildUserMessage({ gameMode, selectedGenres, wordCount, requestCount }) {
  const lines = [];

  lines.push(`Generate exactly ${requestCount} drawing words.`);

  if (gameMode === 'genre' && selectedGenres && selectedGenres.length > 0) {
    const genreList = selectedGenres.join(', ');
    lines.push(`The words must belong to one or more of these genres: ${genreList}.`);
    lines.push('Distribute the words roughly evenly across the selected genres when possible.');
  } else {
    lines.push('The words can be from any everyday category (animals, objects, food, nature, sports, etc.).');
  }

  lines.push(`Return exactly ${requestCount} items in a JSON array. Nothing else.`);

  return lines.join(' ');
}

// ---------------------------------------------------------------------------
// Gemini helper
// ---------------------------------------------------------------------------

/**
 * Make a content-generation request to Google Gemini.
 *
 * @param {object} params
 * @param {string} params.apiKey
 * @param {string} params.systemPrompt
 * @param {string} params.userMessage
 * @returns {Promise<object>} Gemini SDK response
 */
async function callGeminiAPI({ apiKey, systemPrompt, userMessage }) {
  const ai = new GoogleGenAI({ apiKey });

  return ai.models.generateContent({
    model: MODEL,
    contents: userMessage,
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.7,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call Gemini with a small bounded retry. Failures still return null from the
 * public API so rooms can fall back without crashing.
 *
 * @param {object} params
 * @returns {Promise<object>}
 */
async function callGeminiWithRetry(params) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await callGeminiAPI(params);
    } catch (err) {
      lastError = err;
      if (attempt < MAX_ATTEMPTS) {
        await wait(250 * attempt);
      }
    }
  }

  throw lastError;
}

// ---------------------------------------------------------------------------
// Response parser
// ---------------------------------------------------------------------------

/**
 * Extract text from a Gemini SDK response. The SDK exposes a top-level `text`
 * convenience property, but this also supports the raw candidates shape.
 *
 * @param {object} apiResponse - Full response from the Gemini SDK
 * @returns {string}
 */
function extractResponseText(apiResponse) {
  if (typeof apiResponse?.text === 'string') {
    return apiResponse.text;
  }

  const parts = apiResponse?.candidates?.[0]?.content?.parts || [];
  const textPart = parts.find((part) => typeof part.text === 'string');
  return textPart?.text || '';
}

/**
 * Extract and validate the word array from the Gemini API response.
 * Gemini is configured for JSON output, but we defensively strip accidental
 * markdown fences before parsing to preserve the existing sanitization flow.
 *
 * @param {object} apiResponse - Full response from the Gemini SDK
 * @param {number} expected    - How many words we asked for
 * @returns {string[]} Validated array of word strings
 * @throws {Error} If the response cannot be parsed or validated
 */
function parseWordList(apiResponse, expected) {
  let raw = extractResponseText(apiResponse).trim();

  if (!raw) {
    throw new Error('No text content found in Gemini response');
  }

  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Could not parse word list JSON: ${err.message}. Raw: "${raw.slice(0, 200)}"`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`Expected JSON array, got ${typeof parsed}`);
  }

  const words = parsed
    .filter((item) => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim().toLowerCase());

  const unique = [...new Set(words)];

  if (unique.length < Math.ceil(expected * 0.6)) {
    throw new Error(
      `Too few valid words after deduplication: got ${unique.length}, expected ~${expected}`
    );
  }

  return unique;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate AI-powered word choices for a Squiggle round.
 *
 * This is the only function the rest of the codebase should call.
 * It is designed to be a drop-in enhancement for `getWordChoices()` in
 * `server/utils/wordBank.js`:
 *
 *   const aiWords = await generateAIWords(settings);
 *   if (aiWords) return aiWords.slice(0, wordCount + 1);
 *   // else fall back to static pool
 *
 * @param {object}   settings
 * @param {string}   settings.gameMode         - 'standard' | 'genre'
 * @param {string[]} [settings.selectedGenres] - Required when gameMode === 'genre'
 * @param {number}   [settings.wordCount=3]    - How many choices the drawer sees (3-5)
 *
 * @returns {Promise<string[] | null>}
 *   Array of `wordCount + 1` lowercase word strings on success,
 *   or null if the API call fails (caller should fall back to static words).
 */
async function generateAIWords(settings = {}) {
  const {
    gameMode = 'standard',
    selectedGenres = [],
    wordCount = 3,
  } = settings;

  // Custom mode is handled entirely by the static word bank (user-supplied words).
  // Wordle mode needs specific word-length constraints not handled here yet.
  // In both cases, return null so the caller uses its own logic.
  if (gameMode === 'custom' || gameMode === 'wordle') {
    return null;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[aiWordGenerator] GEMINI_API_KEY not set - skipping AI generation');
    return null;
  }

  // We request wordCount + 2 words to have a small buffer after deduplication.
  // The caller only uses wordCount + 1, so the extra gives dedup headroom.
  const requestCount = wordCount + 2;

  const cacheKey = buildCacheKey(gameMode, selectedGenres, wordCount);
  const cached = getFromCache(cacheKey);
  if (cached) {
    const shuffled = [...cached].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, wordCount + 1);
  }

  try {
    const response = await callGeminiWithRetry({
      apiKey,
      systemPrompt: buildSystemPrompt(),
      userMessage: buildUserMessage({ gameMode, selectedGenres, wordCount, requestCount }),
    });
    const words = parseWordList(response, requestCount);

    setInCache(cacheKey, words);

    const shuffled = [...words].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, wordCount + 1);
  } catch (err) {
    console.error('[aiWordGenerator] Failed to generate words via Gemini:', err.message);
    return null;
  }
}

/**
 * Clear the entire in-memory word cache.
 * Useful in tests or if you want to force fresh generation.
 */
function clearCache() {
  cache.clear();
}

/**
 * Return cache stats - useful for health-check endpoints or debugging.
 * @returns {{ size: number, keys: string[] }}
 */
function getCacheStats() {
  return {
    size: cache.size,
    keys: [...cache.keys()],
  };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  generateAIWords,
  clearCache,
  getCacheStats,
};
