const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../utils/authMiddleware');

const router = express.Router();

// GET /api/users/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      id: user._id,
      username: user.username,
      email: user.email || null,
      goldCoins: user.goldCoins || 0,
      diamonds: user.diamonds || 0,
      avatar: user.avatar,
      totalWins: user.totalWins || 0,
      currentWinStreak: user.currentWinStreak || 0,
      lastLoginDate: user.lastLoginDate,
      createdAt: user.createdAt,
      isGuest: false
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// GET /api/users/leaderboard?sortBy=goldCoins|totalWins|currentWinStreak
router.get('/leaderboard', async (req, res) => {
  try {
    const validSortFields = ['goldCoins', 'totalWins', 'currentWinStreak', 'diamonds'];
    const sortBy = validSortFields.includes(req.query.sortBy) ? req.query.sortBy : 'goldCoins';

    // Build sort with tiebreakers so tied players have a fair, deterministic order
    const sortOption = (() => {
      switch (sortBy) {
        case 'goldCoins':
          return { goldCoins: -1, totalWins: -1, createdAt: 1 };
        case 'totalWins':
          return { totalWins: -1, goldCoins: -1, createdAt: 1 };
        case 'currentWinStreak':
          return { currentWinStreak: -1, totalWins: -1, createdAt: 1 };
        case 'diamonds':
          return { diamonds: -1, goldCoins: -1, createdAt: 1 };
        default:
          return { goldCoins: -1, totalWins: -1, createdAt: 1 };
      }
    })();

    const topUsers = await User.find({
      $or: [
        { password: { $exists: true } },
        { googleId: { $exists: true } }
      ]
    })
      .select('username goldCoins diamonds totalWins currentWinStreak avatar createdAt')
      .sort(sortOption)
      .limit(20);

    const leaderboard = topUsers.map((u, index) => ({
      rank: index + 1,
      id: u._id,
      username: u.username,
      goldCoins: u.goldCoins || 0,
      diamonds: u.diamonds || 0,
      totalWins: u.totalWins || 0,
      currentWinStreak: u.currentWinStreak || 0,
      avatar: u.avatar,
      createdAt: u.createdAt,
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard API error:', error);
    res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
});

// GET /api/users/me/rank — returns the logged-in user's global rank by goldCoins
router.get('/me/rank', authMiddleware, async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select('goldCoins');
    if (!me) return res.status(404).json({ message: 'User not found' });

    // Count how many registered users have MORE gold coins than this user
    const ahead = await User.countDocuments({
      $or: [
        { password: { $exists: true } },
        { googleId: { $exists: true } }
      ],
      goldCoins: { $gt: me.goldCoins }
    });

    res.json({ rank: ahead + 1 });
  } catch (error) {
    console.error('Rank fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/users/me/avatar — update avatar color
router.patch('/me/avatar', authMiddleware, async (req, res) => {
  try {
    const { color } = req.body;

    // Basic hex color validation
    if (!color || !/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color)) {
      return res.status(400).json({ message: 'Invalid color format' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 'avatar.color': color },
      { new: true }
    ).select('avatar');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ avatar: user.avatar });
  } catch (error) {
    console.error('Avatar update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;