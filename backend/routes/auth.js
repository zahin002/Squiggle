const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Helper: Generate JWT Token ───────────────────────────────
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// ─── Helper: Check Daily Login Bonus ──────────────────────────
const checkDailyBonus = async (user) => {
  const today = new Date();
  const lastLogin = user.lastLoginDate;

  // Check if user has never logged in or last login was yesterday or earlier
  if (
    !lastLogin ||
    today.toDateString() !== new Date(lastLogin).toDateString()
  ) {
    user.coins += 2;
    user.lastLoginDate = today;
    await user.save();
    return true; // bonus was given
  }

  return false; // bonus already given today
};

// ─── REGISTER ─────────────────────────────────────────────────
// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (userExists) {
      return res.status(400).json({
        message: 'User with that email or username already exists'
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the user
    const user = await User.create({
      username,
      email,
      password: hashedPassword
    });

    // Give daily login bonus on first login
    await checkDailyBonus(user);

    // Send back token
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      coins: user.coins,
      diamonds: user.diamonds,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── LOGIN ────────────────────────────────────────────────────
// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check and give daily bonus
    const bonusGiven = await checkDailyBonus(user);

    // Send back token
    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      coins: user.coins,
      diamonds: user.diamonds,
      wins: user.wins,
      bonusGiven,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;