const express = require('express');
const User = require('../models/User');
const Reward = require('../models/Reward');
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

// PATCH /api/users/me/avatar — update avatar customization
router.patch('/me/avatar', authMiddleware, async (req, res) => {
  try {
    const { color, eyebrows, eyes, mouth, moustache, beard } = req.body;

    const updateFields = {};

    if (color !== undefined) {
      if (typeof color === 'string' && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color)) {
        updateFields['avatar.color'] = color;
      } else {
        return res.status(400).json({ message: 'Invalid color format' });
      }
    }

    if (typeof eyebrows === 'string') updateFields['avatar.eyebrows'] = eyebrows.slice(0, 30);
    if (typeof eyes === 'string') updateFields['avatar.eyes'] = eyes.slice(0, 30);
    if (typeof mouth === 'string') updateFields['avatar.mouth'] = mouth.slice(0, 30);
    if (typeof moustache === 'string') updateFields['avatar.moustache'] = moustache.slice(0, 30);
    if (typeof beard === 'string') updateFields['avatar.beard'] = beard.slice(0, 30);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true }
    ).select('avatar');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ avatar: user.avatar });
  } catch (error) {
    console.error('Avatar update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/me/rewards — get user reward transaction history
router.get('/me/rewards', authMiddleware, async (req, res) => {
  try {
    const rewards = await Reward.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(rewards);
  } catch (error) {
    console.error('Rewards fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;