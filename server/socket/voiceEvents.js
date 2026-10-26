// server/socket/voiceEvents.js
const { getRoom } = require('./roomStore');

// Annotate players with isHost flag for the UI
function annotatePlayersWithHost(room) {
  const hostUserId = room.hostUserId ?? null;
  const hostSocketId = room.hostSocketId ?? null;

  return (room.players || []).map(p => ({
    ...p,
    isHost: hostUserId
      ? p.userId === hostUserId
      : hostSocketId
        ? p.socketId === hostSocketId
        : room.hostId
          ? p.socketId === room.hostId
          : false,
  }));
}

module.exports = (socket, io) => {
  // ----- WebRTC Signaling Relay -----
  socket.on('webrtcSignal', ({ targetSocketId, signal }) => {
    // Relays offers, answers, and ICE candidates to the specific target peer
    io.to(targetSocketId).emit('webrtcSignal', {
      senderSocketId: socket.id,
      signal
    });
  });

  // ----- Host Moderation: Force Mute -----
  socket.on('forceMuteUser', ({ roomId, targetSocketId, mute }) => {
    const room = getRoom(roomId);
    if (!room) return;

    // Check if the requester is the host
    const isHost = room.hostUserId
      ? room.hostUserId === socket.data?.userId
      : room.hostSocketId === socket.id || room.hostId === socket.id;

    if (!isHost) return;

    // Send targeted force-mute command to the player
    io.to(targetSocketId).emit('forceMutedByHost', { mute });

    // Update player state in room store to keep icons synced
    const player = room.players.find(p => p.socketId === targetSocketId);
    if (player) {
      player.isMuted = mute;
      // Broadcast updated players list (with isMuted + isHost flags) to all peers
      io.to(roomId).emit('playerJoined', { players: annotatePlayersWithHost(room) });
    }
  });

  // ----- User State Sync: Toggle Self Mute -----
  socket.on('toggleSelfMute', ({ roomId, mute }) => {
    const room = getRoom(roomId);
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (player) {
      player.isMuted = mute;
      // Broadcast updated state to keep speaker indicators synchronized
      io.to(roomId).emit('playerJoined', { players: annotatePlayersWithHost(room) });
    }
  });
};
