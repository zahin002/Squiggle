function buildRoomState(room, currentUserId, socketId) {
  if (!room) return null;

  const hostUserId = room.hostUserId ?? null;
  const hostSocketId = room.hostSocketId ?? null;

  const isHost = hostUserId
    ? hostUserId === currentUserId
    : hostSocketId
      ? hostSocketId === socketId
      : room.hostId
        ? room.hostId === socketId
        : false;

  const isDrawer = room.currentDrawer?.socketId === socketId;

  return {
    roomId: room.roomId,
    settings: room.settings,

    // Annotate each player with isHost so the UI can show host badges
    players: (room.players || []).map(p => ({
      ...p,
      isHost: hostUserId
        ? p.userId === hostUserId
        : hostSocketId
          ? p.socketId === hostSocketId
          : room.hostId
            ? p.socketId === room.hostId
            : false,
    })),
    spectators: room.spectators,

    status: room.status,
    currentDrawer: room.currentDrawer,
    // The word and alternatives must never be included in another player's state.
    currentWord: isDrawer ? room.currentWord : null,
    currentRound: room.currentRound,
    timeLeft: room.timeLeft,
    wordChoices: isDrawer ? room.wordChoices : [],

    wordleState: room.settings?.gameMode === 'wordle' ? {
      currentGuessPhase: room.wordleState?.currentGuessPhase || 1,
      maxGuesses: 6,
      isDrawerLocked: room.wordleState?.isDrawerLocked ?? true,
      phase: room.wordleState?.phase || 1,
      myGuesses: room.wordleState?.playerGuesses?.[socketId] || [],
      isSolved: !!room.wordleState?.playerSolved?.[socketId],
      mySolvedInfo: room.wordleState?.playerSolved?.[socketId] || null,
      solversCount: Object.keys(room.wordleState?.playerSolved || {}).length,
      totalGuessers: (room.players || []).filter(p => p.socketId !== room.currentDrawer?.socketId).length
    } : null,

    isHost
  };
}

module.exports = { buildRoomState };
