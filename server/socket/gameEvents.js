const { createRoomState, getRoom, setRoom, deleteRoom } = require('./roomStore');
const Room = require('../models/Room');
const User = require('../models/User');
const Reward = require('../models/Reward');
const jwt = require('jsonwebtoken');
const { buildRoomState } = require('./buildRoomState');
const drawingEvents = require('./drawingEvents');
const voiceEvents = require('./voiceEvents');
const voteKickEvents = require('./voteKickEvents');
const powerupEvents = require('./powerupEvents');

module.exports = (io) => {
  io.on('connection', (socket) => {

    drawingEvents(socket, io);
    voiceEvents(socket, io);
    voteKickEvents(socket, io);
    powerupEvents(socket, io);

    // ----- JOIN ROOM -----
    socket.on('joinRoom', async ({ roomId, token, userId, username, role, isGuest, avatar }) => {
      try {
        console.log('[JOIN ROOM REQUEST]', {
          roomId,
          username,
          role,
          isGuest,
          socketId: socket.id,
          avatar: !!avatar
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
            dbRoom.hostUserId ? dbRoom.hostUserId.toString() : (dbRoom.hostSocketId || null)
          );

          setRoom(roomId, roomState);

          console.log('[ROOM LOADED FROM DB]', roomId, 'hostUserId:', roomState.hostUserId);
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

        let resolvedUserId = userId;

        if (!isGuest && token) {
          try {
            const decoded = jwt.verify(
              token,
              process.env.JWT_SECRET
            );

            resolvedUserId = decoded.id;
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
          userId: resolvedUserId
        };

        // Ensure we can derive host from stable userId across refreshes.
        if (
          roomState.players.length === 0 &&
          !roomState.hostUserId &&
          !roomState.hostId &&
          !roomState.hostSocketId
        ) {
          if (resolvedUserId != null) {
            roomState.hostUserId = String(resolvedUserId);
            roomState.hostSocketId = socket.id;
          } else {
            roomState.hostId = socket.id;
            roomState.hostSocketId = socket.id;
          }
        } else if (
          roomState.hostUserId &&
          resolvedUserId &&
          String(roomState.hostUserId) === String(resolvedUserId)
        ) {
          roomState.hostSocketId = socket.id;
        }

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
            const existingPlayerIndex = roomState.players.findIndex(
              p =>
                (p.userId && resolvedUserId && String(p.userId) === String(resolvedUserId)) ||
                (p.isGuest && isGuest && p.username === username)
            );

            if (existingPlayerIndex !== -1) {
              roomState.players[existingPlayerIndex].socketId = socket.id;
              roomState.players[existingPlayerIndex].username = username;
              if (avatar) roomState.players[existingPlayerIndex].avatar = avatar;

              // Rebind drawer to the latest player record after reconnect.
              const player = roomState.players[existingPlayerIndex];

              if (
                player &&
                roomState.currentDrawer &&
                ((roomState.currentDrawer.userId && player.userId && String(roomState.currentDrawer.userId) === String(player.userId)) ||
                 (roomState.currentDrawer.username === player.username))
              ) {
                roomState.currentDrawer = player;
              }

              console.log(
                '[PLAYER RECONNECTED]',
                username
              );
            } else {
              roomState.players.push({
                socketId: socket.id,
                userId: resolvedUserId,
                username,
                avatar: avatar || null,
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
        }

        // Persist host ownership across refreshes.
        // If userId is available, use it as the stable host identifier.
        // Fall back to socket.id only when userId is missing.
        if (!roomState.hostUserId && !roomState.hostId && !roomState.hostSocketId) {
          if (resolvedUserId != null) {
            roomState.hostUserId = String(resolvedUserId);
            roomState.hostSocketId = socket.id;
            roomState.hostId = null;
          } else {
            roomState.hostId = socket.id;
            roomState.hostSocketId = socket.id;
          }

          console.log(
            '[HOST ASSIGNED]',
            username,
            roomState.hostUserId || roomState.hostId
          );
        } else if (
          roomState.hostUserId &&
          resolvedUserId &&
          String(roomState.hostUserId) === String(resolvedUserId)
        ) {
          roomState.hostSocketId = socket.id;
        }

        setRoom(roomId, roomState);

        console.log('[ROOM STATE SENT]', {
          roomId,
          hostId: roomState.hostId,
          hostUserId: roomState.hostUserId,
          playerCount: roomState.players.length,
          spectatorCount: roomState.spectators.length,
          status: roomState.status
        });

        const roomStateForThisUser = buildRoomState(
          roomState,
          resolvedUserId,
          socket.id
        );

        console.log(
          '[HOST DEBUG]',
          {
            hostUserId: roomState.hostUserId,
            hostId: roomState.hostId,
            currentUserId: userId,
            username
          }
        );

        console.log('[ROOMSTATE EMIT TO RECONNECTED USER]', {
          roomId: roomState.roomId,
          status: roomState.status,
          players: roomState.players?.length,
          currentDrawer: roomState.currentDrawer?.username,
          currentDrawerSocket: roomState.currentDrawer?.socketId
        });

        socket.emit('roomState', {
          ...roomStateForThisUser,
          yourRole: socket.data.role,
          yourIsGuest: !!isGuest
        });

        socket.to(roomId).emit('playerJoined', {
          username,
          isGuest: !!isGuest,
          players: buildRoomState(roomState, null, null).players
        });

        console.log(
          '[JOIN SYSTEM MESSAGE]',
          username
        );

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
    socket.on('startGame', async ({ roomId }) => {
      console.log('[START GAME REQUEST]', roomId, socket.id);

      let roomState = getRoom(roomId);

      // If room is missing from memory (e.g. server restart), restore from DB
      if (!roomState) {
        console.log('[START GAME] Room not in memory, attempting DB lookup:', roomId);
        const Room = require('../models/Room');
        const dbRoom = await Room.findOne({ roomId });
        if (!dbRoom) {
          console.log('[START GAME FAILED] Room missing in DB and memory');
          socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
          return;
        }
        roomState = createRoomState(roomId, dbRoom.settings, dbRoom.hostUserId);
        setRoom(roomId, roomState);
      }

      // Check if room is already starting or playing to prevent duplicate trigger
      if (roomState.status && roomState.status !== 'lobby') {
        console.log('[START GAME IGNORED] Room status is already:', roomState.status);
        return;
      }

      // Check player in roomState; if not found by socketId, match by userId or username
      let player = roomState.players.find(p => p.socketId === socket.id);
      if (!player && (socket.data?.userId || socket.data?.username)) {
        player = roomState.players.find(
          p => (socket.data?.userId && p.userId && String(p.userId) === String(socket.data.userId)) ||
               (socket.data?.username && p.username === socket.data.username)
        );
        if (player) {
          player.socketId = socket.id;
        }
      }

      if (!player && socket.data?.username) {
        player = {
          socketId: socket.id,
          userId: socket.data.userId || null,
          username: socket.data.username,
          score: 0,
          isGuest: !!socket.data.isGuest
        };
        roomState.players.push(player);
        setRoom(roomId, roomState);
      }

      const hostUserIdStr = roomState.hostUserId ? String(roomState.hostUserId) : null;
      const playerUserIdStr = player?.userId ? String(player.userId) : (socket.data?.userId ? String(socket.data.userId) : null);

      const isHost = hostUserIdStr
        ? (playerUserIdStr != null && hostUserIdStr === playerUserIdStr)
        : (roomState.hostSocketId
            ? socket.id === roomState.hostSocketId
            : (roomState.hostId
                ? socket.id === roomState.hostId
                : (roomState.players[0] && roomState.players[0].socketId === socket.id)));

      if (!isHost) {
        console.log('[START GAME FAILED] Not host', { hostUserIdStr, playerUserIdStr, socketId: socket.id, hostId: roomState.hostId });
        socket.emit('error', {
          code: 'NOT_HOST',
          message: 'Only the host can start the game'
        });
        return;
      }

      if (roomState.players.length < 2) {
        console.log('[START GAME FAILED] Not enough players (min 2 required):', roomState.players.length);
        socket.emit('error', {
          code: 'NOT_ENOUGH_PLAYERS',
          message: 'At least 2 players are required to start the game'
        });
        return;
      }

      roomState.status = 'starting';
      roomState.currentRound = 0;
      roomState.currentDrawerIndex = 0;
      roomState.drawersDrawnThisRound = 0;
      setRoom(roomId, roomState);
      const { persistRoom } = require('./roomStore');
      persistRoom(roomId, { status: 'playing' });

      console.log('[GAME STARTED]', roomId);
      io.to(roomId).emit('gameStarted', {
        message: 'Game is starting!'
      });

      // Broadcast roomState immediately so clients transition out of lobby instantly
      const { buildRoomState } = require('./buildRoomState');
      const nsp = io.of('/');
      const sockets = await nsp.in(roomId).fetchSockets();
      sockets.forEach((s) => {
        s.emit('roomState', buildRoomState(roomState, s.data?.userId ?? null, s.id));
      });

      require('./roundManager.js').startNextRound(io, roomId);
    });

    // ----- WORD SELECTED -----
    socket.on('wordSelected', ({ roomId, word }) => {
      const room = getRoom(roomId);
      if (!room) return;

      const isDrawerSocket = room.currentDrawer?.socketId === socket.id;
      const isDrawerUser = (room.currentDrawer?.userId && socket.data?.userId && String(room.currentDrawer.userId) === String(socket.data.userId));
      const isDrawerUsername = (socket.data?.username && room.currentDrawer?.username === socket.data.username);

      if (!isDrawerSocket && !isDrawerUser && !isDrawerUsername) {
        console.warn(`[wordSelected REJECTED] Socket ${socket.id} is not drawer:`, {
          drawerSocket: room.currentDrawer?.socketId,
          drawerUser: room.currentDrawer?.userId,
          drawerName: room.currentDrawer?.username,
          socketUser: socket.data?.userId,
          socketName: socket.data?.username,
        });
        return;
      }

      // Keep current drawer socketId up to date
      if (room.currentDrawer) {
        room.currentDrawer.socketId = socket.id;
      }

      require('./roundManager.js').processWordSelection(io, roomId, word);
    });

    // Helper to process a Wordle guess
    function processWordleGuess(room, targetRoomId, player, guess) {
      const cleanGuess = (guess || '').trim().toUpperCase();
      if (cleanGuess.length !== 5 || !/^[A-Z]{5}$/.test(cleanGuess)) {
        return socket.emit('wordleError', { message: 'Guess must be exactly 5 letters.' });
      }

      if (!room.wordleState && room.settings?.gameMode === 'wordle') {
        const { getWordlePhaseDuration } = require('../utils/wordleHelper');
        room.wordleState = {
          currentGuessPhase: 1,
          isDrawerLocked: true,
          phase: 1,
          playerGuesses: {},
          playerSolved: {},
          submittedThisPhase: []
        };
      }

      const ws = room.wordleState;
      if (!ws) return;

      if (ws.playerSolved && ws.playerSolved[socket.id]) {
        return socket.emit('wordleError', { message: 'You have already solved this word!' });
      }

      const playerGuesses = ws.playerGuesses[socket.id] || [];
      if (playerGuesses.length >= 6) {
        return socket.emit('wordleError', { message: 'You have reached the maximum of 6 guesses.' });
      }

      if (playerGuesses.length >= ws.currentGuessPhase) {
        return socket.emit('wordleError', { message: 'You already submitted a guess for this phase. Please wait for the next phase!' });
      }

      const { evaluateWordleGuess, getWordleScoreForGuess } = require('../utils/wordleHelper');
      const { evaluation, isCorrect } = evaluateWordleGuess(cleanGuess, room.currentWord);
      const guessNum = playerGuesses.length + 1;

      playerGuesses.push({ guess: cleanGuess, evaluation, guessNumber: guessNum, isCorrect });
      ws.playerGuesses[socket.id] = playerGuesses;
      if (!ws.submittedThisPhase.includes(socket.id)) {
        ws.submittedThisPhase.push(socket.id);
      }

      let points = 0;
      if (isCorrect) {
        points = getWordleScoreForGuess(guessNum);
        player.score = (player.score || 0) + points;
        ws.playerSolved[socket.id] = { guessNum, scoreAwarded: points };

        if (!room.correctGuessers) room.correctGuessers = [];
        room.correctGuessers.push(player.userId || socket.id);

        if (player.userId && !player.isGuest) {
          User.findByIdAndUpdate(player.userId, { $inc: { goldCoins: 1 } }).catch(() => {});
          Reward.create({
            userId: player.userId,
            type: 'correct_guess',
            amount: 1,
            currency: 'goldCoins'
          }).catch(() => {});
        }

        io.to(targetRoomId).emit('chatMessage', {
          type: 'system',
          text: `[Wordle] ${player.username} solved the Wordle on Guess ${guessNum}/6 (+${points} pts)!`
        });
      }

      socket.emit('wordleGuessResult', {
        guess: cleanGuess,
        evaluation,
        guessNumber: guessNum,
        isCorrect,
        scoreAwarded: points,
        myGuesses: playerGuesses
      });

      io.to(targetRoomId).emit('playerJoined', { players: room.players });
      io.to(targetRoomId).emit('wordleActivity', {
        username: player.username,
        guessNumber: guessNum,
        isCorrect,
        solversCount: Object.keys(ws.playerSolved).length
      });

      setRoom(targetRoomId, room);

      // Check if all non-drawer players solved
      const guessers = (room.players || []).filter(p => p.socketId !== room.currentDrawer?.socketId);
      const allSolved = guessers.length > 0 && guessers.every(p => ws.playerSolved[p.socketId]);

      if (allSolved) {
        require('./roundManager').endRound(io, room, targetRoomId);
        return;
      }

      // If all active unsolved guessers submitted for this phase, advance immediately
      const activeUnsolved = guessers.filter(p => !ws.playerSolved[p.socketId]);
      const allSubmitted = activeUnsolved.every(p => ws.submittedThisPhase.includes(p.socketId));

      if (allSubmitted && activeUnsolved.length > 0) {
        const shouldEnd = require('./roundManager').advanceWordlePhase(io, room, targetRoomId);
        if (shouldEnd) {
          require('./roundManager').endRound(io, room, targetRoomId);
        }
      }
    }

    // ----- SUBMIT WORDLE GUESS -----
    socket.on('submitWordleGuess', ({ roomId, guess }) => {
      const room = getRoom(roomId);
      if (!room || room.status !== 'playing') return;

      const player = room.players.find(p => p.socketId === socket.id);
      if (!player) return;

      if (room.currentDrawer?.socketId === socket.id) {
        return socket.emit('wordleError', { message: 'Drawers cannot submit guesses.' });
      }

      processWordleGuess(room, roomId, player, guess);
    });

    // ----- GUESS WORDLE (Fallback Alias) -----
    socket.on('guessWordle', ({ roomId, guess }) => {
      const room = getRoom(roomId);
      if (!room || room.status !== 'playing') return;

      const player = room.players.find(p => p.socketId === socket.id);
      if (!player) return;

      if (room.currentDrawer?.socketId === socket.id) {
        return socket.emit('wordleError', { message: 'Drawers cannot submit guesses.' });
      }

      processWordleGuess(room, roomId, player, guess);
    });

    // ----- GUESS WORD -----
    socket.on('guessWord', ({ roomId, guess }) => {
      const room = getRoom(roomId);
      if (!room || room.status !== 'playing' || !guess) return;

      const player = room.players.find(p => p.socketId === socket.id);
      if (!player) return;

      // Drawers can't guess
      if (room.currentDrawer?.socketId === socket.id) return;

      if (room.settings?.gameMode === 'wordle') {
        processWordleGuess(room, roomId, player, guess);
        return;
      }

      const isCorrect = guess.toLowerCase() === room.currentWord?.toLowerCase();

      if (isCorrect) {
        // Prevent duplicate scoring
        const guesserId = player.userId || player.socketId;
        if (!room.correctGuessers) room.correctGuessers = [];
        if (room.correctGuessers.includes(guesserId)) return;
        
        room.correctGuessers.push(guesserId);

        // Award points based on timeLeft
        const points = Math.max(10, room.timeLeft * 10);
        player.score += points;
        
        // Award points to drawer as well
        if (room.currentDrawer) {
          const drawerPlayer = room.players.find(p => p.userId === room.currentDrawer.userId || p.socketId === room.currentDrawer.socketId);
          if (drawerPlayer) drawerPlayer.score += 50;
        }

        // Persist Gold Coins to MongoDB for registered users & record audit in Reward
        if (player.userId && !player.isGuest) {
          User.findByIdAndUpdate(player.userId, { $inc: { goldCoins: 1 } }).catch(() => {});
          Reward.create({
            userId: player.userId,
            type: 'correct_guess',
            amount: 1,
            currency: 'goldCoins'
          }).catch(() => {});
        }

        setRoom(roomId, room);

        io.to(roomId).emit('chatMessage', {
          type: 'system',
          text: `${player.username} guessed the word!`
        });

        // Broadcast updated players list for scores
        io.to(roomId).emit('playerJoined', { players: room.players });

        // If freeze user guessed and normal time had already expired, end round immediately
        if (room.timeLeft <= 0 && room.freezeState?.active && room.freezeState.userSocketId === socket.id) {
          room.freezeState.active = false;
          require('./roundManager').endRound(io, room, roomId);
          return;
        }

        // Check if all players (except drawer) have guessed
        if (room.correctGuessers.length >= room.players.length - 1) {
           require('./roundManager').endRound(io, room, roomId);
        }

      } else {
        // Incorrect guess -> standard chat message
        io.to(roomId).emit('chatMessage', {
          type: 'chat',
          text: `${player.username}: ${guess}`
        });
      }
    });

    // ----- CHAT MESSAGE -----
    socket.on('chatMessage', ({ roomId, text }) => {
      const room = getRoom(roomId);
      if (!room || room.status === 'lobby') return;
      const player = room.players.find(p => p.socketId === socket.id);
      if (!player) return;

      let cleanText = text;

      // Wordle Mode spoiler protection: If player already solved, mask the secret word
      if (room.settings?.gameMode === 'wordle' && room.currentWord) {
        const isSolved = room.wordleState?.playerSolved?.[socket.id];
        if (isSolved) {
          const wordRegex = new RegExp(`\\b${room.currentWord}\\b`, 'gi');
          if (wordRegex.test(cleanText)) {
            cleanText = cleanText.replace(wordRegex, '*****');
            socket.emit('chatMessage', {
              type: 'system',
              text: '[Wordle] Secret word masked to prevent spoilers for other players.'
            });
          }
        }
      }

      io.to(roomId).emit('chatMessage', {
        type: 'chat',
        username: player.username,
        text: cleanText
      });
    });

    // ----- LEAVE ROOM (Instant Exit) -----
    socket.on('leaveRoom', ({ roomId }) => {
      const targetRoomId = roomId || socket.data?.roomId;
      if (!targetRoomId) return;

      const room = getRoom(targetRoomId);
      if (!room) return;

      const disconnectedSocketId = socket.id;
      const username = socket.data?.username;
      const isGuest = socket.data?.isGuest;

      socket.data = { ...(socket.data || {}), hasLeftExplicitly: true };
      socket.leave(targetRoomId);

      // Remove player immediately (0ms delay)
      room.players = (room.players || []).filter(p => p.socketId !== disconnectedSocketId);
      room.spectators = (room.spectators || []).filter(s => s.socketId !== disconnectedSocketId);

      console.log('[EXPLICIT LEAVE]', username, targetRoomId, 'Remaining players:', room.players.length);

      // If room is empty, delete immediately from memory AND MongoDB
      if (room.players.length === 0) {
        console.log('[ROOM INSTANTLY DELETED]', targetRoomId);
        if (room.roundTimer) clearInterval(room.roundTimer);
        if (room.wordSelectionTimer) clearInterval(room.wordSelectionTimer);
        if (room.nextRoundTimeout) clearTimeout(room.nextRoundTimeout);
        deleteRoom(targetRoomId);
        return;
      }

      // If only 1 player remains while game was active, end the game immediately
      if (room.players.length === 1 && (room.status === 'playing' || room.status === 'wordSelection' || room.status === 'starting' || room.status === 'roundEnding')) {
        console.log('[ONLY 1 PLAYER LEFT - ENDING GAME]', targetRoomId);
        require('./roundManager').triggerGameEnd(io, room, targetRoomId, 'insufficient_players');
      } else {
        // If drawer left during a round, end the round
        const wasDrawer = room.currentDrawer && room.currentDrawer.socketId === disconnectedSocketId;
        if (wasDrawer && (room.status === 'playing' || room.status === 'wordSelection')) {
          io.to(targetRoomId).emit('chatMessage', {
            type: 'system',
            text: `The drawer left! Round over.`
          });
          require('./roundManager').endRound(io, room, targetRoomId);
        }
      }

      // If target of active vote-kick left, cancel vote
      if (room.activeVoteKick && room.activeVoteKick.targetSocketId === disconnectedSocketId) {
        if (room.activeVoteKick.timer) clearInterval(room.activeVoteKick.timer);
        const targetName = room.activeVoteKick.targetUsername;
        room.activeVoteKick = null;
        io.to(targetRoomId).emit('voteKickEnded', {
          passed: false,
          targetUsername: targetName,
          reason: 'Target player left the room.'
        });
      }

      // If host left, reassign to next player
      const isLeavingHost = (room.hostId === disconnectedSocketId) ||
        (room.hostSocketId === disconnectedSocketId) ||
        (room.hostUserId && socket.data?.userId && String(room.hostUserId) === String(socket.data.userId));

      if (isLeavingHost && room.players.length > 0) {
        if (room.players[0].userId != null) {
          room.hostUserId = String(room.players[0].userId);
          room.hostSocketId = null;
          room.hostId = null;
        } else {
          room.hostUserId = null;
          room.hostId = room.players[0].socketId;
          room.hostSocketId = room.players[0].socketId;
        }
        io.to(targetRoomId).emit('chatMessage', {
          type: 'system',
          text: `${room.players[0].username} is now the room owner.`
        });
      }

      setRoom(targetRoomId, room);

      io.to(targetRoomId).emit('playerLeft', {
        username,
        isGuest,
        players: buildRoomState(room, null, null).players
      });

      io.to(targetRoomId).emit('chatMessage', {
        type: 'system',
        text: `${username}${isGuest ? ' (Guest)' : ''} left the room.`
      });
    });

    // ----- DISCONNECT -----
    socket.on('disconnect', () => {

      if (socket.data?.hasLeftExplicitly) {
        console.log('[DISCONNECT SKIPPED - ALREADY LEFT EXPLICITLY]', socket.id);
        return;
      }

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
        const disconnectedSocketId = socket.id;
        const disconnectedUserId = socket.data?.userId ? String(socket.data.userId) : null;
        const disconnectedUsername = socket.data?.username;
        const disconnectedIsGuest = !!socket.data?.isGuest;
        const roomIdForCleanup = roomId;

        const isDrawer = roomState.currentDrawer && roomState.currentDrawer.socketId === socket.id;
        if (isDrawer && (roomState.status === 'playing' || roomState.status === 'wordSelection')) {
          console.log('[DRAWER DISCONNECTED] Ending round immediately');
          io.to(roomId).emit('chatMessage', {
            type: 'system',
            text: `The drawer disconnected! Round over.`
          });
          require('./roundManager').endRound(io, roomState, roomId);
        }

        // Delay cleanup to allow quick refresh/reconnect (5s grace period).
        // If the same user reconnects with a different socketId, we keep them.
        setTimeout(() => {
          const room = getRoom(roomIdForCleanup);
          if (!room) return;

          const reconnected = (room.players || []).some(p => {
            const sameUser = disconnectedUserId && p.userId && String(p.userId) === disconnectedUserId;
            const sameGuest = disconnectedIsGuest && p.isGuest && p.username === disconnectedUsername;
            return (sameUser || sameGuest) && p.socketId !== disconnectedSocketId;
          });

          if (reconnected) {
            console.log('[REFRESH DETECTED - KEEPING PLAYER]', {
              userId: disconnectedUserId,
              username: disconnectedUsername,
              oldSocketId: disconnectedSocketId
            });
            return;
          }

          room.players = (room.players || []).filter(
            p => p.socketId !== disconnectedSocketId
          );

          console.log('[AFTER REMOVE]', {
            disconnectedSocket: disconnectedSocketId,
            players: room.players.map(p => ({
              username: p.username,
              socketId: p.socketId,
              userId: p.userId
            }))
          });

          // Re-apply host reassignment logic after delayed removal.
          const wasHost = (room.hostId === disconnectedSocketId) ||
            (room.hostSocketId === disconnectedSocketId) ||
            (room.hostUserId && disconnectedUserId && String(room.hostUserId) === disconnectedUserId);

          if (wasHost && room.players.length > 0) {
            if (room.players[0].userId != null) {
              room.hostUserId = String(room.players[0].userId);
              room.hostSocketId = null;
              room.hostId = null;
            } else {
              room.hostUserId = null;
              room.hostId = room.players[0].socketId;
              room.hostSocketId = room.players[0].socketId;
            }

            console.log(
              '[HOST REASSIGNED]',
              room.players[0].username
            );

            io.to(roomIdForCleanup).emit('chatMessage', {
              type: 'system',
              text: `${room.players[0].username} is now the room owner.`
            });
          }

          if (room.players.length === 0) {
            console.log('[ROOM DELETED]', roomIdForCleanup);
            
            if (room.spectators.length > 0) {
              io.to(roomIdForCleanup).emit('error', { message: 'All players have left the room. Room closed.' });
            }

            if (room.roundTimer)
              clearInterval(room.roundTimer);
            if (room.wordSelectionTimer)
              clearInterval(room.wordSelectionTimer);

            deleteRoom(roomIdForCleanup);
            return;
          }

          setRoom(roomIdForCleanup, room);

          io.to(roomIdForCleanup).emit('playerLeft', {
            username: disconnectedUsername,
            isGuest: disconnectedIsGuest,
            players: buildRoomState(room, null, null).players
          });

          io.to(roomIdForCleanup).emit('chatMessage', {
            type: 'system',
            text: `${disconnectedUsername}${disconnectedIsGuest ? ' (Guest)' : ''} left the room.`
          });
          if (room.players.length === 1 && (room.status === 'playing' || room.status === 'wordSelection' || room.status === 'starting' || room.status === 'roundEnding')) {
            console.log('[ONLY 1 PLAYER LEFT AFTER DISCONNECT - ENDING GAME]', roomIdForCleanup);
            require('./roundManager').triggerGameEnd(io, room, roomIdForCleanup, 'insufficient_players');
          }
        }, 5000);


      } else {
        roomState.spectators =
          roomState.spectators.filter(
            s => s.socketId !== socket.id
          );
        
        if (roomState.players.length === 0) {
          console.log('[ROOM DELETED]', roomId);
          if (roomState.roundTimer) clearInterval(roomState.roundTimer);
          if (roomState.wordSelectionTimer) clearInterval(roomState.wordSelectionTimer);
          deleteRoom(roomId);
          return;
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
      }
    });

    // ----- PLAY AGAIN (RESET ROOM BACK TO LOBBY) -----
    socket.on('playAgain', ({ roomId }) => {
      if (!roomId) return;
      const room = getRoom(roomId);
      if (!room) return;

      const isHost = (room.hostId === socket.id) ||
        (room.hostSocketId === socket.id) ||
        (room.hostUserId && socket.data?.userId && String(room.hostUserId) === String(socket.data.userId));
      if (!isHost) return;

      room.status = 'lobby';
      room.currentRound = 0;
      room.drawersDrawnThisRound = 0;
      room.currentDrawerIndex = 0;
      room.currentWord = null;
      room.currentDrawer = null;
      room.wordChoices = null;
      room.wordHint = null;
      (room.players || []).forEach(p => { p.score = 0; });
      setRoom(roomId, room);
      persistRoom(roomId, { status: 'lobby' });

      io.to(roomId).emit('clearCanvas');
      io.to(roomId).emit('roomStateUpdated', buildRoomState(room, null, null));
      io.to(roomId).emit('chatMessage', {
        type: 'system',
        text: '🔄 The host has reset the room for a new game!'
      });
    });
  });

  // 15-minute inactivity cleaner
  setInterval(() => {
    const { rooms, deleteRoom } = require('./roomStore');
    const now = Date.now();
    for (const [roomId, room] of rooms.entries()) {
      if (room.lastActive && now - room.lastActive > 15 * 60 * 1000) {
        console.log(`[INACTIVITY] Closing room ${roomId}`);
        io.to(roomId).emit('error', { message: 'Room closed due to 15 minutes of inactivity.' });
        if (room.roundTimer) clearInterval(room.roundTimer);
        if (room.wordSelectionTimer) clearInterval(room.wordSelectionTimer);
        deleteRoom(roomId);
      }
    }
  }, 60 * 1000);
};