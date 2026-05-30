const socketAuth = require('./authMiddleware');
const { getRoom, setRoom, deleteRoom } = require('./roomStore');
const drawingEvents = require('./drawingEvents');

module.exports = (io) => {

  // Run auth check on every new socket connection
  socketAuth(io);

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ─── JOIN ROOM ────────────────────────────────────────────
    socket.on('joinRoom', ({ roomCode, avatar }, callback) => {
      const room = getRoom(roomCode);

      if (!room) {
        return callback({ error: 'Room not found' });
      }

      const isRoomFull = room.players.length >= room.settings.playerCount;
      const gameInProgress = room.phase !== 'waiting';

      // Decide role
      let role = 'player';
      if (isRoomFull || gameInProgress) role = 'spectator';

      const playerData = {
        socketId: socket.id,
        userId: socket.data.user.userId,
        username: socket.data.user.username,
        avatar: avatar || null,
        score: 0,
        role,
        isDrawer: false
      };

      if (role === 'player') {
        room.players.push(playerData);
      } else {
        room.spectators.push(playerData);
      }

      // First player becomes host
      if (room.players.length === 1) {
        room.hostSocketId = socket.id;
      }

      setRoom(roomCode, room);

      // Join the Socket.IO room group
      socket.join(roomCode);
      socket.data.roomCode = roomCode;

      // Send current room state back to this socket only
      callback({ success: true, room, role });

      // If mid-round, send canvas history to this socket so they catch up
      if (room.phase === 'drawing' && room.canvasState.length > 0) {
        socket.emit('canvas:sync', { canvasState: room.canvasState });
      }

      // Tell everyone else a new player joined
      socket.to(roomCode).emit('playerJoined', {
        player: playerData,
        players: room.players,
        spectators: room.spectators
      });

      // System message in chat
      io.to(roomCode).emit('chatMessage', {
        type: 'system',
        text: `${playerData.username} joined the room!`
      });
    });

    // ─── REQUEST ROOM STATE (for page refresh) ────────────────
    socket.on('requestRoomState', ({ roomCode }, callback) => {
      const room = getRoom(roomCode);
      if (!room) return callback({ error: 'Room not found' });
      callback({ room });
    });

    // ─── HOST STARTS GAME ─────────────────────────────────────
    socket.on('startGame', ({ roomCode }) => {
      const room = getRoom(roomCode);
      if (!room) return;

      // Only host can start
      if (socket.id !== room.hostSocketId) return;

      // Need at least 2 players
      if (room.players.length < 2) {
        socket.emit('error', { message: 'Need at least 2 players to start' });
        return;
      }

      room.phase = 'starting';
      room.currentRound = 1;
      setRoom(roomCode, room);

      io.to(roomCode).emit('gameStarting', {
        message: 'Game is starting!',
        totalRounds: room.settings.rounds
      });

      // Full round logic comes Week 7-9
      // For now this just signals the game is starting
    });

    // ─── WORD SELECTED BY DRAWER ──────────────────────────────
    socket.on('word:selected', ({ roomCode, word }) => {
      const room = getRoom(roomCode);
      if (!room) return;

      if (socket.id !== room.currentDrawer) return;

      room.currentWord = word;
      room.phase = 'drawing';
      room.canvasState = [];
      room.guessedCorrectly = [];
      setRoom(roomCode, room);

      // Tell drawer to start — they get the real word
      socket.emit('round:start', {
        word,
        isDrawer: true
      });

      // Tell everyone else — masked word
      const maskedWord = word
        .split('')
        .map(c => (c === ' ' ? ' ' : '_'))
        .join('');

      const drawerName = room.players.find(
        p => p.socketId === socket.id
      )?.username;

      socket.to(roomCode).emit('round:start', {
        word: maskedWord,
        isDrawer: false,
        drawerName
      });
    });

    // ─── DISCONNECT ───────────────────────────────────────────
    socket.on('disconnect', () => {
      const roomCode = socket.data.roomCode;
      if (!roomCode) return;

      const room = getRoom(roomCode);
      if (!room) return;

      const leavingPlayer = room.players.find(p => p.socketId === socket.id);
      const leavingSpectator = room.spectators.find(p => p.socketId === socket.id);

      // Remove from players or spectators
      room.players = room.players.filter(p => p.socketId !== socket.id);
      room.spectators = room.spectators.filter(p => p.socketId !== socket.id);

      // If room is now empty, delete it
      if (room.players.length === 0 && room.spectators.length === 0) {
        deleteRoom(roomCode);
        return;
      }

      // If host left, assign new host
      if (room.hostSocketId === socket.id && room.players.length > 0) {
        room.hostSocketId = room.players[0].socketId;
        io.to(roomCode).emit('chatMessage', {
          type: 'system',
          text: `${room.players[0].username} is now the room owner!`
        });
      }

      setRoom(roomCode, room);

      const name = leavingPlayer?.username || leavingSpectator?.username || 'Someone';

      io.to(roomCode).emit('playerLeft', {
        socketId: socket.id,
        players: room.players,
        spectators: room.spectators
      });

      io.to(roomCode).emit('chatMessage', {
        type: 'system',
        text: `${name} left the room.`
      });
    });

    // Load drawing events (Week 5-6)
    drawingEvents(io, socket);
  });
};