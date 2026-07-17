// server/routes/rooms.js

const express = require('express');
const crypto = require('crypto');
const Room = require('../models/Room');
const { createRoomState, setRoom } = require('../socket/roomStore');
const optionalAuth = require('../utils/optionalAuthMiddleware'); // replaces authMiddleware
const router = express.Router();

// ---------------------------------------------------------------------------
// POST /api/rooms/create
// Works for BOTH registered users (with JWT) and guests (no token).
// Guest hosts are automatically locked to standard mode.
// ---------------------------------------------------------------------------
router.post('/create', optionalAuth, async (req, res) => {
  try {
    const roomId = crypto.randomBytes(3).toString('hex').toUpperCase(); // e.g. 'AB3X9Z'
    let settings = { ...req.body };

    // req.user is null when no valid JWT was provided → guest host
    const isGuestHost = !req.user;

    if (isGuestHost) {
      // Force standard mode — guests cannot create non-standard rooms.
      // This mirrors the frontend lock in RoomSetup but must also be
      // enforced server-side (never trust the client).
      settings.gameMode = 'standard';
      settings.customWords = [];
      settings.selectedGenres = [];
    } else {
      // Registered host — validate custom words if applicable
      if (settings.gameMode === 'custom') {
        const words = (settings.customWords || '')
          .split(',')
          .map((w) => w.trim())
          .filter(Boolean);

        if (words.length < 10) {
          return res
            .status(400)
            .json({ message: 'Custom mode requires at least 10 words' });
        }
        settings.customWords = words;
      }
    }

    // Persist room to MongoDB
    const room = new Room({
      roomId,
      hostUserId: req.user?.id || null, // null for guest hosts
      isGuestHosted: isGuestHost,   // metadata — useful for analytics / admin
      settings,
    });
    await room.save();

    // Initialise in-memory game state (used by the socket layer)
    const roomState = createRoomState(roomId, settings, req.user?.id || null);
    setRoom(roomId, roomState);

    res.status(201).json({ roomId });
  } catch (err) {
    console.error('Room creation error:', err);
    res.status(500).json({ message: 'Failed to create room' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/rooms/:roomId
// Check whether a room exists before a player attempts to join.
// ---------------------------------------------------------------------------
router.get('/:roomId', async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/rooms
// List all public, non-finished rooms (lobby browser).
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find({
      'settings.isPrivate': false,
      status: { $ne: 'finished' },
    });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;