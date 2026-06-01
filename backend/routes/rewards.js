const express = require('express');
const router = express.Router();
const Reward = require('../models/Reward');
const { protect } = require('../middleware/authMiddleware');

// ─── GET MY REWARD HISTORY ────────────────────────────────────
// GET /api/rewards/history
router.get('/history', protect, async (req, res) => {
  try {
    const rewards = await Reward.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('gameSession', 'gameMode startedAt');

    res.status(200).json({ rewards });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── SPEND COINS ON POWER UP ──────────────────────────────────
// POST /api/rewards/spend
router.post('/spend', protect, async (req, res) => {
  const { type, coinsSpent, diamondsSpent, description } = req.body;

  try {
    const user = req.user;

    // Check if user has enough
    if (coinsSpent && user.coins < coinsSpent) {
      return res.status(400).json({ message: 'Not enough coins' });
    }
    if (diamondsSpent && user.diamonds < diamondsSpent) {
      return res.status(400).json({ message: 'Not enough diamonds' });
    }

    // Deduct from user
    if (coinsSpent) user.coins -= coinsSpent;
    if (diamondsSpent) user.diamonds -= diamondsSpent;
    await user.save();

    // Log the spending
    const reward = await Reward.create({
      user: user._id,
      type: type || 'power_up_spend',
      coinsSpent: coinsSpent || 0,
      diamondsSpent: diamondsSpent || 0,
      description: description || 'Power-up purchase'
    });

    res.status(200).json({
      message: 'Purchase successful',
      reward,
      newBalance: {
        coins: user.coins,
        diamonds: user.diamonds
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;