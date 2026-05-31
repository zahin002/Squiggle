const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  players: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  spectators: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  settings: {
    playerCount: {
      type: Number,
      default: 8
    },
    drawTime: {
      type: Number,
      default: 80
    },
    rounds: {
      type: Number,
      default: 3
    },
    wordCount: {
      type: Number,
      default: 3
    },
    hints: {
      type: Number,
      default: 2
    },
    gameMode: {
      type: String,
      enum: ['standard', 'custom', 'genre', 'wordle'],
      default: 'standard'
    },
    selectedGenres: {
      type: [String],
      default: []
    },
    customWords: {
      type: [String],
      default: []
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    spectatorMode: {
      type: Boolean,
      default: true
    }
  },
  status: {
    type: String,
    enum: ['waiting', 'playing', 'finished'],
    default: 'waiting'
  },
  currentRound: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Room', roomSchema);