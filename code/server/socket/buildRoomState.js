function buildRoomState(room, currentUserId, socketId) {
  if (!room) return null;

  const hostUserId = room.hostUserId ? String(room.hostUserId) : null;
  const hostSocketId = room.hostSocketId ? String(room.hostSocketId) : (room.hostId ? String(room.hostId) : null);
  const currentUserIdStr = currentUserId ? String(currentUserId) : null;

  const isHost = hostUserId
    ? (currentUserIdStr != null && hostUserId === currentUserIdStr)
    : (hostSocketId ? (hostSocketId === socketId || room.hostId === socketId) : false);

  const isDrawer =
    (room.currentDrawer?.socketId && room.currentDrawer.socketId === socketId) ||
    (room.currentDrawer?.userId && currentUserIdStr && String(room.currentDrawer.userId) === currentUserIdStr);

  const hasGuessed = (room.correctGuessers || []).some(
    id => String(id) === String(socketId) || (currentUserIdStr && String(id) === currentUserIdStr)
  );

  return {
    roomId: room.roomId,
    settings: room.settings,
    hostUserId,
    hostId: hostSocketId || room.hostId || null,

    // Annotate each player with isHost and hasGuessed so the UI can show badges
    players: (room.players || []).map(p => {
      const pUserIdStr = p.userId ? String(p.userId) : null;
      const pSocketId = p.socketId;
      const pHasGuessed = (room.correctGuessers || []).some(
        id => (pSocketId && String(id) === String(pSocketId)) || (pUserIdStr && String(id) === pUserIdStr)
      );
      return {
        ...p,
        isHost: hostUserId
          ? (pUserIdStr != null && pUserIdStr === hostUserId)
          : (hostSocketId ? (p.socketId === hostSocketId || p.socketId === room.hostId) : false),
        hasGuessed: pHasGuessed
      };
    }),
    spectators: room.spectators,

    status: room.status,
    currentDrawer: room.currentDrawer,
    // The word is visible to the drawer and anyone who has already solved/guessed it.
    currentWord: (isDrawer || hasGuessed) ? room.currentWord : null,
    hasGuessed,
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

    powerupsAllowed: room.settings?.gameMode === 'standard' && room.settings?.powerupsEnabled !== false,
    powerupsActive: room.settings?.gameMode === 'standard' && room.settings?.powerupsEnabled !== false && room.status === 'playing' && !isDrawer,
    freezeState: room.freezeState ? {
      active: !!room.freezeState.active,
      userSocketId: room.freezeState.userSocketId,
      username: room.freezeState.username,
      freezeSecondsRemaining: room.freezeState.freezeSecondsRemaining,
      normalTimeFrozenAt: room.freezeState.normalTimeFrozenAt,
      isNormalTimeExpired: room.timeLeft <= 0
    } : null,

    isHost
  };
}

module.exports = { buildRoomState };
