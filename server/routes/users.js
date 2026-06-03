const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../utils/authMiddleware');

const router = express.Router();

// GET /api/users/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      id: user._id,
      username: user.username,
      goldCoins: user.goldCoins,
      diamonds: user.diamonds,
      avatar: user.avatar,
      totalWins: user.totalWins,
      isGuest: false
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Server error'
    });
  }
});

module.exports = router;