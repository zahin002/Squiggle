// In-memory game state for all active rooms.
// MongoDB stores persistent data; this Map holds transient round state.
const rooms = new Map();

function createRoomState(roomId, settings, hostUserIdOrSocketId) {
  const isProbablyUserId = typeof hostUserIdOrSocketId === 'string' && hostUserIdOrSocketId && hostUserIdOrSocketId.length > 10;

  return {
    roomId,
    settings,

    // Prefer persisting by userId (stable across refreshes). If we only have a socketId,
    // we’ll fall back to that for backward compatibility.
    hostUserId: isProbablyUserId ? hostUserIdOrSocketId : null,
    hostSocketId: isProbablyUserId ? null : hostUserIdOrSocketId,

    status: 'lobby',
    players: [],
    spectators: [],
    currentDrawer: null,
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
