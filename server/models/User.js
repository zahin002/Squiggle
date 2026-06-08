const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minLength: 3,
    maxLength: 20
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  password: { type: String }, // Optional for Google Auth users
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  avatar: {
    body: { type: String, default: 'default_body' },
    color: { type: String, default: '#4A90E2' },
    accessory: { type: String, default: 'none' }
  },
  goldCoins: { type: Number, default: 0 },
  diamonds: { type: Number, default: 5 }, // New users get 5 diamonds
  totalWins: { type: Number, default: 0 },
  currentWinStreak: { type: Number, default: 0 },
  lastLoginDate: { type: Date },
  milestonesClaimed: [{ type: Number }], // e.g. [10, 20] for claimed milestones
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 12);
});

// Method to compare passwords during login
userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);