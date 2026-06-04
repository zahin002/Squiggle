const { createRoomState, getRoom, setRoom, deleteRoom } = require('./roomStore');
const Room = require('../models/Room');
const jwt = require('jsonwebtoken');

module.exports = (io) => {
  io.on('connection', (socket) => {

    console.log('[SOCKET CONNECTED]', socket.id);

    // ----- JOIN ROOM -----
    socket.on('joinRoom', async ({ roomId, token, username, role, isGuest }) => {
      try {
        console.log('[JOIN ROOM REQUEST]', {
          roomId,
          username,
          role,
          isGuest,
          socketId: socket.id
        });

        let roomState = getRoom(roomId);

        // Load from DB if not in memory
        if (!roomState) {
          console.log('[ROOM NOT IN MEMORY] Loading from DB:', roomId);

          const dbRoom = await Room.findOne({ roomId });

          if (!dbRoom) {
            console.log('[ROOM NOT FOUND]', roomId);

            socket.emit('error', {
              code: 'ROOM_NOT_FOUND',
              message: 'Room not found'
            });

            return;
          }

          roomState = createRoomState(
            roomId,
            dbRoom.settings,
            null
          );

          setRoom(roomId, roomState);

          console.log('[ROOM LOADED FROM DB]', roomId);
        }

        // Guest restriction
        if (
          isGuest &&
          roomState.settings.gameMode !== 'standard'
        ) {
          console.log(
            '[GUEST BLOCKED]',
            username,
            roomState.settings.gameMode
          );

          socket.emit('error', {
            code: 'GUEST_MODE_RESTRICTION',
            message:
              'Guests can only join Standard Mode rooms.'
          });

          return;
        }

        let userId = null;

        if (!isGuest && token) {
          try {
            const decoded = jwt.verify(
              token,
              process.env.JWT_SECRET
            );

            userId = decoded.id;
          } catch {
            console.log(
              '[JWT INVALID]',
              username
            );
          }
        }

        socket.join(roomId);

        console.log(
          '[ROOM JOINED]',
          username,
          roomId
        );

        socket.data = {
          roomId,
          username,
          role: role || 'player',
          isGuest: !!isGuest,
          userId
        };

        if (role === 'spectator') {
          roomState.spectators.push({
            socketId: socket.id,
            username,
            isGuest: !!isGuest
          });
        } else {
          if (
            roomState.players.length >=
            roomState.settings.maxPlayers
          ) {
            roomState.spectators.push({
              socketId: socket.id,
              username,
              isGuest: !!isGuest
            });

            socket.data.role = 'spectator';

            console.log(
              '[ROOM FULL → SPECTATOR]',
              username
            );
          } else {
            roomState.players.push({
              socketId: socket.id,
              userId,
              username,
              isGuest: !!isGuest,
              score: 0,
              role: 'player'
            });

            console.log(
              '[PLAYER ADDED]',
              username
            );
          }
        }

        if (!roomState.hostId) {
          roomState.hostId = socket.id;

          console.log(
            '[HOST ASSIGNED]',
            username,
            socket.id
          );
        }

        setRoom(roomId, roomState);

        console.log('[ROOM STATE SENT]', {
          roomId,
          hostId: roomState.hostId,
          playerCount: roomState.players.length,
          spectatorCount: roomState.spectators.length,
          status: roomState.status
        });

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
        console.error('[JOIN ROOM ERROR]', err);

        socket.emit('error', {
          code: 'JOIN_FAILED',
          message: 'Could not join room'
        });
      }
    });

    // ----- START GAME -----
    socket.on('startGame', ({ roomId }) => {

      console.log(
        '[START GAME REQUEST]',
        roomId,
        socket.id
      );

      const roomState = getRoom(roomId);

      if (!roomState) {
        console.log('[START GAME FAILED] Room missing');
        return;
      }

      if (roomState.hostId !== socket.id) {
        console.log(
          '[START GAME FAILED] Not host'
        );

        socket.emit('error', {
          code: 'NOT_HOST',
          message: 'Only the host can start the game'
        });

        return;
      }

      if (roomState.players.length < 2) {
        console.log(
          '[START GAME FAILED] Not enough players'
        );

        socket.emit('error', {
          code: 'NOT_ENOUGH_PLAYERS',
          message: 'Need at least 2 players'
        });

        return;
      }

      roomState.status = 'playing';
      roomState.currentRound = 0;

      setRoom(roomId, roomState);

      console.log(
        '[GAME STARTED]',
        roomId
      );

      io.to(roomId).emit('gameStarted', {
        message: 'Game is starting!'
      });

      require('./roundManager')
        .startNextRound(io, roomId);
    });

    // ----- DISCONNECT -----
    socket.on('disconnect', () => {

      console.log(
        '[DISCONNECT]',
        socket.id
      );

      const {
        roomId,
        username,
        role,
        isGuest
      } = socket.data || {};

      if (!roomId) return;

      const roomState = getRoom(roomId);

      if (!roomState) return;

      if (role === 'player') {
        roomState.players =
          roomState.players.filter(
            p => p.socketId !== socket.id
          );

        if (
          roomState.hostId === socket.id &&
          roomState.players.length > 0
        ) {
          roomState.hostId =
            roomState.players[0].socketId;

          console.log(
            '[HOST REASSIGNED]',
            roomState.players[0].username
          );

          io.to(roomId).emit('chatMessage', {
            type: 'system',
            text: `${roomState.players[0].username} is now the room owner.`
          });
        }

        if (
          roomState.players.length === 0 &&
          roomState.spectators.length === 0
        ) {
          console.log(
            '[ROOM DELETED]',
            roomId
          );

          if (roomState.roundTimer)
            clearInterval(roomState.roundTimer);

          deleteRoom(roomId);

          return;
        }
      } else {
        roomState.spectators =
          roomState.spectators.filter(
            s => s.socketId !== socket.id
          );
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