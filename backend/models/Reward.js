const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GameSession',
    default: null
  },
  type: {
    type: String,
    enum: [
      'game_win',
      'correct_guess',
      'drawer_bonus',
      'daily_login',
      'milestone_10_wins',
      'milestone_20_wins',
      'win_streak',
      'power_up_spend',
      'diamond_spend'
    ],
    required: true
  },
  coinsEarned: {
    type: Number,
    default: 0
  },
  diamondsEarned: {
    type: Number,
    default: 0
  },
  coinsSpent: {
    type: Number,
    default: 0
  },
  diamondsSpent: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Reward', rewardSchema);