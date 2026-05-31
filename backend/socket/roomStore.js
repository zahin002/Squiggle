const rooms = new Map();

const createRoom = (roomCode, data) => {
  rooms.set(roomCode, {
    roomCode,
    roomId: data.roomId,
    hostUserId: data.host,
    settings: data.settings,
    phase: 'waiting',        // 'waiting' | 'choosing' | 'drawing' | 'roundEnd' | 'gameEnd'
    players: [],             // live socket players { socketId, userId, username, avatar, score, isDrawer, role }
    spectators: [],          // live spectators { socketId, userId, username }
    hostSocketId: null,
    currentDrawer: null,
    currentWord: null,
    currentRound: 0,
    guessedCorrectly: [],    // socketIds who guessed right this round
    timerInterval: null,
    canvasState: []          // full drawing history for late-joiner sync
  });
};

const getRoom = (roomCode) => {
  return rooms.get(roomCode);
};

const setRoom = (roomCode, data) => {
  rooms.set(roomCode, data);
};

const deleteRoom = (roomCode) => {
  rooms.delete(roomCode);
};

const getAllRooms = () => {
  return Array.from(rooms.values());
};

module.exports = { createRoom, getRoom, setRoom, deleteRoom, getAllRooms };