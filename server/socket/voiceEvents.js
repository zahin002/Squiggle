// server/socket/voiceEvents.js
const { getRoom } = require('./roomStore');

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
      // Broadcast updated players list (with isMuted status changes) to all peers in the room
      io.to(roomId).emit('playerJoined', { players: room.players });
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
      io.to(roomId).emit('playerJoined', { players: room.players });
    }
  });
};
