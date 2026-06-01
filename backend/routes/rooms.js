const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { protect } = require('../middleware/authMiddleware');
const { optionalAuth } = require('../middleware/optionalAuthMiddleware');

// ─── Helper: Generate Unique Room Code ────────────────────────
const generateRoomCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

// ─── CREATE ROOM ──────────────────────────────────────────────
// POST /api/rooms/create
router.post('/create', optionalAuth, async (req, res) => {
  const {
    playerCount,
    drawTime,
    rounds,
    wordCount,
    hints,
    gameMode,
    selectedGenres,
    customWords,
    isPrivate,
    spectatorMode
  } = req.body;

  try {
    // Generate a unique room code
    let roomCode = generateRoomCode();

    // Make sure the code is not already used
    let codeExists = await Room.findOne({ roomCode });
    while (codeExists) {
      roomCode = generateRoomCode();
      codeExists = await Room.findOne({ roomCode });
    }

    // Create the room in MongoDB
  const room = await Room.create({
      roomCode,
      host: req.user ? req.user._id : null,
      players: req.user ? [req.user._id] : [],
      settings: {
        playerCount: playerCount || 8,
        drawTime: drawTime || 80,
        rounds: rounds || 3,
        wordCount: wordCount || 3,
        hints: hints || 2,
        gameMode: gameMode || 'standard',
        selectedGenres: selectedGenres || [],
        customWords: customWords || [],
        isPrivate: isPrivate || false,
        spectatorMode: spectatorMode !== undefined ? spectatorMode : true
      }
    });

    // ── Integration Point with Ashfaque ──────────────────────
    // When Ashfaque finishes roomStore.js, uncomment this:
    // const { setRoom } = require('../socket/roomStore');
    // setRoom(room.roomCode, {
    //   roomId: room._id,
    //   host: req.user._id,
    //   players: [req.user._id],
    //   settings: room.settings,
    //   status: 'waiting',
    //   currentRound: 0
    // });
    // ─────────────────────────────────────────────────────────

    res.status(201).json({
      message: 'Room created successfully',
      roomCode: room.roomCode,
      roomId: room._id,
      host: req.user.username,
      settings: room.settings
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET ROOM BY CODE ─────────────────────────────────────────
// GET /api/rooms/:roomCode
router.get('/:roomCode', protect, async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.roomCode })
      .populate('host', 'username')
      .populate('players', 'username');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;