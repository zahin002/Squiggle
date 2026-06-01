const express = require('express');
const { nanoid } = require('nanoid');
const Room = require('../models/Room');
const { createRoomState, setRoom } = require('../socket/roomStore');
const authMiddleware = require('../utils/authMiddleware');
const router = express.Router();

// POST /api/rooms/create — requires login
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const roomId = nanoid(6).toUpperCase(); // e.g. 'AB3X9Z'
    const settings = req.body;

    // Validate custom words
    if (settings.gameMode === 'custom') {
      const words = settings.customWords.split(',').map(w => w.trim()).filter(Boolean);
      if (words.length < 10) {
        return res.status(400).json({ message: 'Custom mode requires at least 10 words' });
      }
      settings.customWords = words;
    }

    // Save to DB
    const room = new Room({ roomId, hostId: req.user.id, settings });
    await room.save();

    // Initialize in-memory game state (used by socket layer)
    const roomState = createRoomState(roomId, settings, req.user.id);
    setRoom(roomId, roomState);

    res.status(201).json({ roomId });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create room' });
  }
});

// GET /api/rooms/:roomId — check if room exists before joining
router.get('/:roomId', async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/rooms — list public rooms
router.get('/', async (req, res) => {
  const rooms = await Room.find({ 'settings.isPrivate': false, status: { $ne: 'finished' } });
  res.json(rooms);
});

module.exports = router;