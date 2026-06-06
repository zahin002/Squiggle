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

  return {
    roomId: room.roomId,
    settings: room.settings,

    players: room.players,
    spectators: room.spectators,

    status: room.status,
    currentDrawer: room.currentDrawer,
    currentWord: room.currentWord,
    currentRound: room.currentRound,
    timeLeft: room.timeLeft,
    wordChoices: room.wordChoices,

    isHost
  };
}

module.exports = { buildRoomState };

