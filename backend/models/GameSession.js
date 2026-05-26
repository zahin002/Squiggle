const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  players: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      username: {
        type: String
      },
      score: {
        type: Number,
        default: 0
      },
      coinsEarned: {
        type: Number,
        default: 0
      },
      diamondsEarned: {
        type: Number,
        default: 0
      },
      correctGuesses: {
        type: Number,
        default: 0
      },
      roundsDrawn: {
        type: Number,
        default: 0
      }
    }
  ],
  rounds: [
    {
      roundNumber: {
        type: Number
      },
      drawer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      word: {
        type: String
      },
      correctGuessers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      ],
      timeExpired: {
        type: Boolean,
        default: false
      }
    }
  ],
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  gameMode: {
    type: String,
    enum: ['standard', 'custom', 'genre', 'wordle'],
    default: 'standard'
  },
  totalRounds: {
    type: Number
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('GameSession', gameSessionSchema);