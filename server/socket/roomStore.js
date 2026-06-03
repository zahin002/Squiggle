// In-memory game state for all active rooms.
// MongoDB stores persistent data; this Map holds transient round state.
const rooms = new Map();

function createRoomState(roomId, settings, hostSocketId) {
  return {
    roomId,
    settings,
    hostId: hostSocketId,
    status: 'lobby',       // 'lobby' | 'wordSelection' | 'playing' | 'roundEnd' | 'gameEnd'
    players: [],           // [{ socketId, userId, username, score, isGuest, role: 'player' }]
    spectators: [],        // [{ socketId, username, isGuest }]
    currentDrawer: null,
    currentWord: null,
    wordChoices: [],
    correctGuessers: [],   // socketIds of players who guessed correctly this round
    currentRound: 0,
    timeLeft: 0,
    roundTimer: null,      // setInterval reference — clear on round end
    wordPool: [],          // words queued for this session (refilled by Gemini if depleted)
    usedWords: new Set(),  // prevent repeats within a session
  };
}

function getRoom(roomId)          { return rooms.get(roomId) || null; }
function setRoom(roomId, state)   { rooms.set(roomId, state); }
function deleteRoom(roomId)       { rooms.delete(roomId); }

module.exports = { rooms, createRoomState, getRoom, setRoom, deleteRoom };