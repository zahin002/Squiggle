const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['correct_guess', 'successful_draw', 'failed_round', 'game_win', 
           'daily_login', 'milestone', 'win_streak', 'powerup_spend'],
    required: true
  },
  amount: { type: Number, required: true }, // positive = earn, negative = spend
  currency: { type: String, enum: ['goldCoins', 'diamonds'], default: 'goldCoins' },
  gameSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameSession' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reward', rewardSchema);