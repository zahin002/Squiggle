const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  roomId: String,
  players: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    score: Number,
    coinsEarned: Number
  }],
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gameMode: String,
  rounds: Number,
  completedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GameSession', gameSessionSchema);