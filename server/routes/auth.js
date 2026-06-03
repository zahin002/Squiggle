const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('BODY:', req.body);

    const exists = await User.findOne({ username });

    console.log('EXISTS:', exists);

    const user = new User({ username, password });

    console.log('USER CREATED');

    await user.save();

    console.log('USER SAVED');

    res.status(201).json({ message: 'Registered successfully' });
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Daily login reward
    const today = new Date().toDateString();
    const lastLogin = user.lastLoginDate?.toDateString();
    if (lastLogin !== today) {
      user.goldCoins += 2; // +2 daily coins
      user.lastLoginDate = new Date();
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        goldCoins: user.goldCoins,
        diamonds: user.diamonds,
        avatar: user.avatar
      }
    });
  } catch (err) {
  console.error('REGISTER ERROR');
  console.error(err);
  console.error(err.stack);

  res.status(500).json({
    message: err.message,
    stack: err.stack
  });
}
});

module.exports = router;