const { getRoom, setRoom } = require('./roomStore');
const { getWordChoices } = require('../utils/WordBank');

async function startNextRound(io, roomId) {
  const room = getRoom(roomId);
  if (!room) return;

  room.currentRound += 1;

  if (room.currentRound > room.settings.rounds) {
    const winner = [...room.players].sort((a, b) => b.score - a.score)[0];
    io.to(roomId).emit('gameEnded', {
      players: room.players,
      winner: winner?.username
    });
    room.status = 'gameEnd';
    setRoom(roomId, room);
    return;
  }

  // Rotate drawer by round index
  const drawerIndex = (room.currentRound - 1) % room.players.length;
  room.currentDrawer = room.players[drawerIndex];
  room.correctGuessers = [];
  room.currentWord = null;
  room.status = 'wordSelection';

  // Get word choices (async — Gemini or static fallback)
  const choices = await getWordChoices(room.settings);
  room.wordChoices = choices;
  setRoom(roomId, room);

  // Emit roomState with `isHost` computed per-socket.
  // `room` contains host identifiers; `isHost` needs to be resolved against each socket.
  const { buildRoomState } = require('./buildRoomState');
  const nsp = io.of('/');
  const sockets = await nsp.in(roomId).fetchSockets();
  sockets.forEach((s) => {
    const roomStateForThisSocket = buildRoomState(
      room,
      s.data?.userId ?? null,
      s.id
    );
    s.emit('roomState', roomStateForThisSocket);
  });



  // Only the drawer gets word choices
  io.to(room.currentDrawer.socketId).emit('wordChoices', { choices });


  io.to(roomId).emit('chatMessage', {
    type: 'system',
    text: `${room.currentDrawer.username} is choosing a word...`
  });
}

function startRoundTimer(io, room, roomId) {
  const { setRoom } = require('./roomStore');

  room.roundTimer = setInterval(async () => {
    const current = require('./roomStore').getRoom(roomId);
    if (!current) { clearInterval(room.roundTimer); return; }

    current.timeLeft -= 1;
    io.to(roomId).emit('timerTick', { timeLeft: current.timeLeft });

    if (current.timeLeft <= 0) {
      clearInterval(current.roundTimer);
      await endRound(io, current, roomId);
    }

    setRoom(roomId, current);
  }, 1000);
}

async function endRound(io, room, roomId) {
  clearInterval(room.roundTimer);

  io.to(roomId).emit('roundEnded', {
    word: room.currentWord,
    players: room.players
  });

  setRoom(roomId, room);

  setTimeout(() => startNextRound(io, roomId), 5000);
}

module.exports = { startNextRound, startRoundTimer, endRound };