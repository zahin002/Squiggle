function buildRoomState(room, currentUserId, socketId) {
  if (!room) return null;

  const hostUserId = room.hostUserId ?? null;
  const hostSocketId = room.hostSocketId ?? null;

  const isHost = hostUserId
    ? hostUserId === currentUserId
    : hostSocketId
      ? hostSocketId === socketId
      : // Backward compatibility if only `hostId` exists.
        room.hostId
          ? room.hostId === socketId
          : false;
  const isDrawer = room.currentDrawer?.socketId === socketId;

  return {
    roomId: room.roomId,
    settings: room.settings,

    players: room.players,
    spectators: room.spectators,

    status: room.status,
    currentDrawer: room.currentDrawer,
    // The word and alternatives must never be included in another player's state.
    // A client can inspect every Socket.IO payload even if the UI does not render it.
    currentWord: isDrawer ? room.currentWord : null,
    currentRound: room.currentRound,
    timeLeft: room.timeLeft,
    wordChoices: isDrawer ? room.wordChoices : [],

    isHost
  };
}

module.exports = { buildRoomState };

