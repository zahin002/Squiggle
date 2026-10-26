const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Configure Nodemailer (Ethereal for testing)
let transporter;
async function setupMailer() {
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Generate test SMTP service account from ethereal.email
    let testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('Ethereal Email account configured for password resets.');
  }
}
setupMailer();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const user = new User({ username, email, password });
    await user.save();

    res.status(201).json({ message: 'Registered successfully' });
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body; // 'username' here can be either email or username
    
    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!(await user.comparePassword(password))) {
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
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
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
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    let user = await User.findOne({ googleId });
    if (!user) {
      // Check if email exists
      user = await User.findOne({ email });
      if (user) {
        // Link google account to existing email
        user.googleId = googleId;
        await user.save();
      } else {
        // Create new user
        // Ensure username is unique
        let baseUsername = name.replace(/\s+/g, '').substring(0, 15);
        let username = baseUsername;
        let count = 1;
        while (await User.findOne({ username })) {
          username = `${baseUsername}${count}`;
          count++;
        }
        
        user = new User({
          username,
          email,
          googleId,
          // No password required for Google auth
        });
        await user.save();
      }
    }

    const jwtToken = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        username: user.username,
        goldCoins: user.goldCoins,
        diamonds: user.diamonds,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error('GOOGLE AUTH ERROR:', err);
    res.status(401).json({ message: 'Invalid Google token' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      // Always return 200 for security
      return res.json({ message: 'If that email is registered, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    
    const info = await transporter.sendMail({
      from: '"Squiggle Support" <noreply@squiggle.test>',
      to: user.email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Please go to this link to reset your password: ${resetUrl}\n\nIf you did not request this, please ignore this email.`,
      html: `<p>You requested a password reset.</p><p>Click <a href="${resetUrl}">here</a> to reset your password.</p><p>If you did not request this, please ignore this email.</p>`
    });

    if (!process.env.SMTP_HOST) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }

    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) {
    console.error('FORGOT PASSWORD ERROR:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('RESET PASSWORD ERROR:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;