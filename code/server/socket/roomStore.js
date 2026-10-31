// In-memory game state for all active rooms.
// MongoDB stores persistent data; this Map holds transient round state.
const rooms = new Map();

function createRoomState(roomId, settings, hostUserIdOrSocketId) {
  const hostStr = hostUserIdOrSocketId ? String(hostUserIdOrSocketId) : null;
  // MongoDB ObjectIds are 24-char hex strings; socket IDs are 20-char base64 strings
  // If hostUserIdOrSocketId was explicitly passed from room.hostUserId, or is a 24-char hex string, treat as userId
  const isProbablyUserId = hostStr && (
    (typeof hostUserIdOrSocketId === 'object' && hostUserIdOrSocketId._bsontype === 'ObjectID') ||
    /^[0-9a-fA-F]{24}$/.test(hostStr)
  );

  return {
    roomId,
    settings,

    // Prefer persisting by userId (stable across refreshes). If we only have a socketId,
    // we’ll fall back to that for backward compatibility.
    hostUserId: isProbablyUserId ? hostStr : null,
    hostSocketId: isProbablyUserId ? null : hostStr,
    hostId: isProbablyUserId ? null : hostStr,

    status: 'lobby',
    players: [],
    spectators: [],
    currentDrawer: null,
    currentDrawerIndex: 0,
    drawersDrawnThisRound: 0,
    currentWord: null,
    wordChoices: [],
    correctGuessers: [],
    currentRound: 0,
    timeLeft: 0,
    roundTimer: null,
    wordPool: [],
    usedWords: new Set(),
  };
}

function getRoom(roomId)          { return rooms.get(roomId) || null; }
function setRoom(roomId, state)   { 
  state.lastActive = Date.now();
  rooms.set(roomId, state); 
}
function deleteRoom(roomId)       { 
  const room = rooms.get(roomId);
  if (room) {
    if (room.roundTimer) clearInterval(room.roundTimer);
    if (room.wordSelectionTimer) clearInterval(room.wordSelectionTimer);
    if (room.nextRoundTimeout) clearTimeout(room.nextRoundTimeout);
  }
  rooms.delete(roomId); 
  require('../models/Room').deleteOne({ roomId }).catch(err => console.error("Error deleting room from DB:", err));
}

function persistRoom(roomId, updates) {
  require('../models/Room')
    .updateOne({ roomId }, { $set: updates })
    .catch(err => console.error('Error persisting room state:', err));
}

module.exports = { rooms, createRoomState, getRoom, setRoom, deleteRoom, persistRoom };
