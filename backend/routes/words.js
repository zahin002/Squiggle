const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getWordChoices, availableGenres } = require('../utils/wordSelector');
const { availableGenres: genreList, genres } = require('../utils/wordBank');

// ─── GET WORD CHOICES FOR A ROUND ─────────────────────────────
// POST /api/words/choices
router.post('/choices', protect, async (req, res) => {
  const { genre, customWords, usedWords, count } = req.body;

  try {
    const words = await getWordChoices({
      genre: genre || 'standard',
      customWords: customWords || [],
      usedWords: usedWords || [],
      count: count || 3
    });

    res.status(200).json({
      words,
      genre: genre || 'standard'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET ALL AVAILABLE GENRES ──────────────────────────────────
// GET /api/words/genres
router.get('/genres', protect, (req, res) => {
  const genreOptions = genreList.map(key => ({
    value: key,
    label: genres[key].label
  }));

  res.status(200).json({ genres: genreOptions });
});

module.exports = router;