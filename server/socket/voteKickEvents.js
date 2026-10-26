// server/socket/voteKickEvents.js
const { getRoom, setRoom } = require('./roomStore');
const User = require('../models/User');
const Reward = require('../models/Reward');

function cleanupVoteTimer(room) {
  if (room?.activeVoteKick?.timer) {
    clearInterval(room.activeVoteKick.timer);
    room.activeVoteKick.timer = null;
  }
}

function executeKick(io, room, roomId, voteKick) {
  cleanupVoteTimer(room);

  // 1. Deduct 50 Gold Coins from registered target user & record Reward audit
  if (voteKick.targetUserId && !voteKick.targetIsGuest) {
    User.findByIdAndUpdate(voteKick.targetUserId, { $inc: { goldCoins: -50 } }).catch((err) => {
      console.error('[VOTE KICK PENALTY ERROR]', err);
    });

    Reward.create({
      userId: voteKick.targetUserId,
      type: 'vote_kick_penalty',
      amount: -50,
      currency: 'goldCoins'
    }).catch(() => {});
  }

  // 2. Notify the kicked player specifically
  io.to(voteKick.targetSocketId).emit('kickedFromRoom', {
    reason: 'You were vote-kicked from the room (-50 Gold Coins penalty).'
  });

  // 3. Eject the target socket from the socket.io room
  const kickedSocket = io.sockets.sockets.get(voteKick.targetSocketId);
  if (kickedSocket) {
    kickedSocket.leave(roomId);
  }

  // 4. Remove player from room.players list
  room.players = (room.players || []).filter(p => p.socketId !== voteKick.targetSocketId);
  room.spectators = (room.spectators || []).filter(s => s.socketId !== voteKick.targetSocketId);

  // 5. If kicked player was currently drawing, end the round
  const wasDrawer = room.currentDrawer && room.currentDrawer.socketId === voteKick.targetSocketId;
  if (wasDrawer && (room.status === 'playing' || room.status === 'wordSelection')) {
    io.to(roomId).emit('chatMessage', {
      type: 'system',
      text: `The drawer was vote-kicked! Round over.`
    });
    require('./roundManager').endRound(io, room, roomId);
  }

  // 6. If kicked player was host, reassign host
  if (room.players.length > 0 && (
    room.hostId === voteKick.targetSocketId ||
    (room.hostUserId && voteKick.targetUserId && room.hostUserId.toString() === voteKick.targetUserId.toString())
  )) {
    if (room.players[0].userId != null) {
      room.hostUserId = room.players[0].userId;
      room.hostSocketId = null;
    } else {
      room.hostId = room.players[0].socketId;
    }
    io.to(roomId).emit('chatMessage', {
      type: 'system',
      text: `${room.players[0].username} is now the room host.`
    });
  }

  // 7. Broadcast vote success and chat message to remaining players
  io.to(roomId).emit('voteKickEnded', {
    passed: true,
    targetSocketId: voteKick.targetSocketId,
    targetUsername: voteKick.targetUsername,
    reason: `Vote passed! ${voteKick.targetUsername} was kicked.`
  });

  io.to(roomId).emit('chatMessage', {
    type: 'system',
    text: `[Vote Kick] ${voteKick.targetUsername} was vote-kicked from the room (-50 Gold Coins penalty).`
  });

  io.to(roomId).emit('playerLeft', {
    username: voteKick.targetUsername,
    isGuest: voteKick.targetIsGuest,
    players: room.players
  });

  io.to(roomId).emit('playerJoined', {
    players: room.players
  });

  room.activeVoteKick = null;
  setRoom(roomId, room);
}

module.exports = (socket, io) => {
  // ----- START VOTE KICK -----
  socket.on('startVoteKick', ({ roomId, targetSocketId }) => {
    const room = getRoom(roomId);
    if (!room) {
      return socket.emit('voteKickError', { message: 'Room not found.' });
    }

    if (room.activeVoteKick) {
      return socket.emit('voteKickError', { message: 'A vote kick is already active in this room.' });
    }

    if (targetSocketId === socket.id) {
      return socket.emit('voteKickError', { message: 'You cannot vote to kick yourself.' });
    }

    const targetPlayer = (room.players || []).find(p => p.socketId === targetSocketId);
    if (!targetPlayer) {
      return socket.emit('voteKickError', { message: 'Target player not found in the room.' });
    }

    const eligibleVoters = (room.players || []).filter(p => p.socketId !== targetSocketId);
    if (eligibleVoters.length === 0) {
      return socket.emit('voteKickError', { message: 'Not enough players to start a vote kick.' });
    }

    // Require strict majority of eligible voters
    const votesRequired = Math.floor(eligibleVoters.length / 2) + 1;

    const voteKick = {
      targetSocketId,
      targetUsername: targetPlayer.username,
      targetUserId: targetPlayer.userId,
      targetIsGuest: targetPlayer.isGuest,
      initiatorSocketId: socket.id,
      initiatorUsername: socket.data?.username || 'A player',
      votesRequired,
      yesVotes: [socket.id], // Initiator votes YES automatically
      noVotes: [],
      timeLeft: 25,
      timer: null
    };

    room.activeVoteKick = voteKick;
    setRoom(roomId, room);

    // If only 1 vote is required, execute immediately
    if (voteKick.yesVotes.length >= votesRequired) {
      return executeKick(io, room, roomId, voteKick);
    }

    // Broadcast vote kick start
    io.to(roomId).emit('voteKickStarted', {
      targetSocketId: voteKick.targetSocketId,
      targetUsername: voteKick.targetUsername,
      initiatorUsername: voteKick.initiatorUsername,
      votesRequired: voteKick.votesRequired,
      currentVotes: voteKick.yesVotes.length,
      yesVotes: voteKick.yesVotes.length,
      noVotes: voteKick.noVotes.length,
      timeLeft: voteKick.timeLeft
    });

    io.to(roomId).emit('chatMessage', {
      type: 'system',
      text: `[Vote Kick] Initiated against ${targetPlayer.username} by ${voteKick.initiatorUsername} (${voteKick.yesVotes.length}/${votesRequired} votes needed).`
    });

    // Start 25-second countdown timer
    voteKick.timer = setInterval(() => {
      const currentRoom = getRoom(roomId);
      if (!currentRoom || !currentRoom.activeVoteKick) {
        clearInterval(voteKick.timer);
        return;
      }

      currentRoom.activeVoteKick.timeLeft -= 1;

      if (currentRoom.activeVoteKick.timeLeft <= 0) {
        cleanupVoteTimer(currentRoom);
        const targetName = currentRoom.activeVoteKick.targetUsername;
        currentRoom.activeVoteKick = null;
        setRoom(roomId, currentRoom);

        io.to(roomId).emit('voteKickEnded', {
          passed: false,
          targetUsername: targetName,
          reason: 'Vote expired without reaching majority.'
        });

        io.to(roomId).emit('chatMessage', {
          type: 'system',
          text: `[Vote Kick] Vote against ${targetName} failed (time expired).`
        });
        return;
      }

      io.to(roomId).emit('voteKickTick', {
        timeLeft: currentRoom.activeVoteKick.timeLeft
      });
      setRoom(roomId, currentRoom);
    }, 1000);
  });

  // ----- CAST VOTE KICK -----
  socket.on('castVoteKick', ({ roomId, vote }) => {
    const room = getRoom(roomId);
    if (!room || !room.activeVoteKick) return;

    const voteKick = room.activeVoteKick;

    // Target cannot vote
    if (socket.id === voteKick.targetSocketId) {
      return socket.emit('voteKickError', { message: 'You cannot vote on your own kick.' });
    }

    // Must be in room.players
    const isPlayer = (room.players || []).some(p => p.socketId === socket.id);
    if (!isPlayer) return;

    // Cannot vote twice
    if (voteKick.yesVotes.includes(socket.id) || voteKick.noVotes.includes(socket.id)) {
      return socket.emit('voteKickError', { message: 'You have already voted.' });
    }

    if (vote === true) {
      voteKick.yesVotes.push(socket.id);
    } else {
      voteKick.noVotes.push(socket.id);
    }

    const eligibleVoters = (room.players || []).filter(p => p.socketId !== voteKick.targetSocketId);

    // Broadcast updated vote counts
    io.to(roomId).emit('voteKickUpdated', {
      currentVotes: voteKick.yesVotes.length,
      yesVotes: voteKick.yesVotes.length,
      noVotes: voteKick.noVotes.length,
      votesRequired: voteKick.votesRequired,
      timeLeft: voteKick.timeLeft
    });

    // Check if passed
    if (voteKick.yesVotes.length >= voteKick.votesRequired) {
      executeKick(io, room, roomId, voteKick);
      return;
    }

    // Check if mathematically impossible to pass
    const remainingPotentialVotes = eligibleVoters.length - (voteKick.yesVotes.length + voteKick.noVotes.length);
    if (voteKick.yesVotes.length + remainingPotentialVotes < voteKick.votesRequired) {
      cleanupVoteTimer(room);
      const targetName = voteKick.targetUsername;
      room.activeVoteKick = null;
      setRoom(roomId, room);

      io.to(roomId).emit('voteKickEnded', {
        passed: false,
        targetUsername: targetName,
        reason: 'Vote rejected by players.'
      });

      io.to(roomId).emit('chatMessage', {
        type: 'system',
        text: `[Vote Kick] Vote against ${targetName} failed (majority voted No).`
      });
      return;
    }

    setRoom(roomId, room);
  });
};
