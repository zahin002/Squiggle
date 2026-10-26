const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true }, // short code like 'ABC123'
  hostUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  hostSocketId: { type: String },
  isGuestHosted: { type: Boolean, default: false },
  settings: {
    maxPlayers: { type: Number, default: 8, min: 2, max: 20 },
    drawTime: { type: Number, default: 80 },
    rounds: { type: Number, default: 3 },
    wordCount: { type: Number, default: 3, min: 1, max: 5 },
    hints: { type: Number, default: 2, min: 0, max: 5 },
    gameMode: {
      type: String,
      enum: ['standard', 'genre', 'custom', 'wordle'],
      default: 'standard'
    },
    isPrivate: { type: Boolean, default: false },
    selectedGenres: [String],
    customWords: [String],
    spectatorMode: { type: Boolean, default: true }
  },
  status: {
    type: String,
    enum: ['lobby', 'playing', 'finished'],
    default: 'lobby'
  },
  createdAt: { type: Date, default: Date.now, expires: 86400 } // Auto-delete after 24h
});

module.exports = mongoose.model('Room', roomSchema);