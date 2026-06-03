const { createRoomState, getRoom, setRoom, deleteRoom } = require('./roomStore');
const Room = require('../models/Room');
const jwt = require('jsonwebtoken');

module.exports = (io) => {
  io.on('connection', (socket) => {

    // ----- JOIN ROOM -----
    // Called from GamePage when the React component mounts
    socket.on('joinRoom', async ({ roomId, token, username, role, isGuest }) => {
      try {
        let roomState = getRoom(roomId);

        // If not in memory, load from DB (e.g. server restart scenario)
        if (!roomState) {
          const dbRoom = await Room.findOne({ roomId });
          if (!dbRoom) {
            socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
            return;
          }
          roomState = createRoomState(roomId, dbRoom.settings, null);
          setRoom(roomId, roomState);
        }

        // Guests cannot join non-standard mode rooms
        if (isGuest && roomState.settings.gameMode !== 'standard') {
          socket.emit('error', {
            code: 'GUEST_MODE_RESTRICTION',
            message: 'Guests can only join Standard Mode rooms.'
          });
          return;
        }

        // Decode JWT to get userId (guests have no token)
        let userId = null;
        if (!isGuest && token) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.id;
          } catch { /* invalid token — treat as guest */ }
        }

        socket.join(roomId);

        // Store identity on socket for disconnect cleanup
        socket.data = { roomId, username, role: role || 'player', isGuest: !!isGuest, userId };

        if (role === 'spectator') {
          roomState.spectators.push({ socketId: socket.id, username, isGuest: !!isGuest });
        } else {
          // Check capacity
          if (roomState.players.length >= roomState.settings.maxPlayers) {
            // Auto-assign as spectator if room is full
            roomState.spectators.push({ socketId: socket.id, username, isGuest: !!isGuest });
            socket.data.role = 'spectator';
          } else {
            roomState.players.push({
              socketId: socket.id,
              userId,
              username,
              isGuest: !!isGuest,
              score: 0,
              role: 'player'
            });
          }
        }

        // If no host yet (first join after room creation), assign host
        if (!roomState.hostId) {
          roomState.hostId = socket.id;
        }

        setRoom(roomId, roomState);

        // Send current room state to the joining player
        socket.emit('roomState', {
          roomId,
          settings: roomState.settings,
          players: roomState.players,
          spectators: roomState.spectators,
          status: roomState.status,
          isHost: roomState.hostId === socket.id,
          yourRole: socket.data.role,
          yourIsGuest: !!isGuest
        });

        // Tell everyone else someone joined
        socket.to(roomId).emit('playerJoined', {
          username,
          isGuest: !!isGuest,
          players: roomState.players
        });

        io.to(roomId).emit('chatMessage', {
          type: 'system',
          text: `${username}${isGuest ? ' (Guest)' : ''} joined the room.`
        });

      } catch (err) {
        console.error('joinRoom error:', err);
        socket.emit('error', { code: 'JOIN_FAILED', message: 'Could not join room' });
      }
    });

    // ----- START GAME -----
    // Only the host can start the game
    socket.on('startGame', ({ roomId }) => {
      const roomState = getRoom(roomId);
      if (!roomState) return;
      if (roomState.hostId !== socket.id) {
        socket.emit('error', { code: 'NOT_HOST', message: 'Only the host can start the game' });
        return;
      }
      if (roomState.players.length < 2) {
        socket.emit('error', { code: 'NOT_ENOUGH_PLAYERS', message: 'Need at least 2 players' });
        return;
      }

      roomState.status = 'playing';
      roomState.currentRound = 0;
      setRoom(roomId, roomState);

      io.to(roomId).emit('gameStarted', { message: 'Game is starting!' });

      // Kick off the first round — round management handled in roundManager.js (Week 7–9)
      // For now, emit the event and the round manager will take over
      require('./roundManager').startNextRound(io, roomId);
    });

    // ----- DISCONNECT -----
    socket.on('disconnect', () => {
      const { roomId, username, role, isGuest } = socket.data || {};
      if (!roomId) return;

      const roomState = getRoom(roomId);
      if (!roomState) return;

      if (role === 'player') {
        roomState.players = roomState.players.filter(p => p.socketId !== socket.id);

        // Reassign host if the host left and players remain
        if (roomState.hostId === socket.id && roomState.players.length > 0) {
          roomState.hostId = roomState.players[0].socketId;
          io.to(roomId).emit('chatMessage', {
            type: 'system',
            text: `${roomState.players[0].username} is now the room owner.`
          });
        }

        // If room is empty, clean up
        if (roomState.players.length === 0 && roomState.spectators.length === 0) {
          if (roomState.roundTimer) clearInterval(roomState.roundTimer);
          deleteRoom(roomId);
          return;
        }
      } else {
        roomState.spectators = roomState.spectators.filter(s => s.socketId !== socket.id);
      }

      setRoom(roomId, roomState);

      io.to(roomId).emit('playerLeft', {
        username,
        isGuest,
        players: roomState.players
      });
      io.to(roomId).emit('chatMessage', {
        type: 'system',
        text: `${username}${isGuest ? ' (Guest)' : ''} left the room.`
      });
    });
  });
};