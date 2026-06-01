const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// ─── GET MY PROFILE ───────────────────────────────────────────
// GET /api/users/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET LEADERBOARD ──────────────────────────────────────────
// GET /api/users/leaderboard
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const topPlayers = await User.find()
      .sort({ wins: -1, coins: -1 })
      .limit(20)
      .select('username wins coins diamonds winStreak totalGames');

    res.status(200).json({ leaderboard: topPlayers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── UPDATE AVATAR ────────────────────────────────────────────
// PUT /api/users/avatar
router.put('/avatar', protect, async (req, res) => {
  const { avatar } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar },
      { new: true }
    ).select('-password');

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;