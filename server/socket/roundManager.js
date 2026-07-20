const { getRoom, setRoom, persistRoom } = require('./roomStore');
const { getWordChoices } = require('../utils/WordBank');

async function startNextRound(io, roomId) {
  const room = getRoom(roomId);
  if (!room) return;

  // A start request and a delayed end-of-round callback may both reach here.
  // Only those two lifecycle states are allowed to create a new round.
  if (!['starting', 'roundEnding'].includes(room.status)) return;

  if (room.nextRoundTimeout) {
    clearTimeout(room.nextRoundTimeout);
    room.nextRoundTimeout = null;
  }

  room.currentRound += 1;

  if (room.currentRound > room.settings.rounds) {
    const winner = [...room.players].sort((a, b) => b.score - a.score)[0];
    io.to(roomId).emit('gameEnded', {
      players: room.players,
      winner: winner?.username
    });
    room.status = 'finished';
    setRoom(roomId, room);
    persistRoom(roomId, { status: 'finished' });
    return;
  }

  // Rotate drawer by round index
  const drawerIndex = (room.currentRound - 1) % room.players.length;
  room.currentDrawer = room.players[drawerIndex];
  room.correctGuessers = [];
  room.currentWord = null;
  room.status = 'wordSelection';
  setRoom(roomId, room);

  // Auto-clear canvas for the new round
  io.to(roomId).emit('clearCanvas');

  // Get word choices (async — Gemini or static fallback)
  const choices = await getWordChoices(room.settings);
  // The room may have ended or been replaced while an AI request was pending.
  const currentRoom = getRoom(roomId);
  if (!currentRoom || currentRoom !== room || currentRoom.status !== 'wordSelection') return;
  if (!Array.isArray(choices) || choices.length === 0) {
    currentRoom.status = 'finished';
    setRoom(roomId, currentRoom);
    persistRoom(roomId, { status: 'finished' });
    io.to(roomId).emit('error', { message: 'Unable to generate words for this round.' });
    return;
  }
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

  startWordSelectionTimer(io, room, roomId);
}

function processWordSelection(io, roomId, word) {
  const room = getRoom(roomId);
  if (!room || room.status !== 'wordSelection') return;
  if (typeof word !== 'string' || !room.wordChoices.includes(word)) return;

  if (room.wordSelectionTimer) {
    clearInterval(room.wordSelectionTimer);
    room.wordSelectionTimer = null;
  }

  room.currentWord = word;
  room.status = 'playing';
  room.timeLeft = room.settings.drawTime;
  room.revealedHintIndices = [];
  
  // Calculate dynamic max hints for the round based on word length
  const len = word.length;
  let maxHints = 0;
  if (len === 4) {
    maxHints = 1;
  } else if (len >= 5 && len <= 7) {
    maxHints = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4
  } else if (len >= 8 && len <= 9) {
    maxHints = Math.floor(Math.random() * 2) + 4; // 4 or 5
  } else if (len >= 10) {
    const baseHints = 5 + Math.floor((len - 10) / 2);
    maxHints = baseHints + Math.floor(Math.random() * 2); // base or base + 1
  }
  room.maxHints = maxHints;

  setRoom(roomId, room);

  const hint = word.replace(/[a-zA-Z]/g, '_').split('').join(' ');
  room.wordHint = hint;

  io.to(roomId).emit('roundStarted', {
    drawer: { username: room.currentDrawer.username, socketId: room.currentDrawer.socketId },
    wordHint: hint,
    wordLength: word.length,
    round: room.currentRound,
    totalRounds: room.settings.rounds,
    timeLeft: room.timeLeft
  });

  io.to(roomId).emit('chatMessage', {
    type: 'system',
    text: `${room.currentDrawer.username} started drawing`
  });

  io.to(room.currentDrawer.socketId).emit('yourWord', { word });

  startRoundTimer(io, room, roomId);
}

function startWordSelectionTimer(io, room, roomId) {
  const { setRoom } = require('./roomStore');
  room.timeLeft = 25;
  setRoom(roomId, room);
  
  room.wordSelectionTimer = setInterval(() => {
    const current = require('./roomStore').getRoom(roomId);
    if (!current || current.status !== 'wordSelection') {
      if (room.wordSelectionTimer) clearInterval(room.wordSelectionTimer);
      return;
    }

    current.timeLeft -= 1;
    io.to(roomId).emit('timerTick', { timeLeft: current.timeLeft });

    if (current.timeLeft <= 0) {
      clearInterval(current.wordSelectionTimer);
      const randomWord = current.wordChoices[Math.floor(Math.random() * current.wordChoices.length)];
      processWordSelection(io, roomId, randomWord);
    } else {
      setRoom(roomId, current);
    }
  }, 1000);
}

function updateWordHint(room) {
  if (!room.currentWord || !room.maxHints) return;
  const len = room.currentWord.length;
  
  const timePercentage = room.timeLeft / room.settings.drawTime; 
  
  // Dynamically calculate expected hints:
  // As timePercentage goes from 1.0 down to 0.0, (1 - timePercentage) goes from 0.0 to 1.0.
  // Multiplying by (maxHints + 1) evenly spaces out the hint thresholds.
  let expectedHints = Math.floor((1 - timePercentage) * (room.maxHints + 1));
  if (expectedHints > room.maxHints) expectedHints = room.maxHints;

  if (!room.revealedHintIndices) room.revealedHintIndices = [];

  let newHintAdded = false;
  while (room.revealedHintIndices.length < expectedHints) {
      const unrevealed = [];
      for (let i = 0; i < len; i++) {
          if (room.currentWord[i] !== ' ' && !room.revealedHintIndices.includes(i)) {
              unrevealed.push(i);
          }
      }
      if (unrevealed.length === 0) break;
      const randIdx = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      room.revealedHintIndices.push(randIdx);
      newHintAdded = true;
  }

  if (newHintAdded || !room.wordHint) {
    let newHint = '';
    for (let i = 0; i < len; i++) {
        if (room.currentWord[i] === ' ') newHint += '  ';
        else if (room.revealedHintIndices.includes(i)) newHint += room.currentWord[i] + ' ';
        else newHint += '_ ';
    }
    room.wordHint = newHint.trim();
  }
}

function startRoundTimer(io, room, roomId) {
  const { setRoom } = require('./roomStore');

  room.roundTimer = setInterval(async () => {
    const current = require('./roomStore').getRoom(roomId);
    if (!current) { clearInterval(room.roundTimer); return; }

    current.timeLeft -= 1;
    updateWordHint(current);
    io.to(roomId).emit('timerTick', { timeLeft: current.timeLeft, wordHint: current.wordHint });

    if (current.timeLeft <= 0) {
      clearInterval(current.roundTimer);
      await endRound(io, current, roomId);
    }

    setRoom(roomId, current);
  }, 1000);
}

async function endRound(io, room, roomId) {
  if (!room || room.status === 'roundEnding' || room.status === 'finished') return;

  clearInterval(room.roundTimer);
  clearInterval(room.wordSelectionTimer);
  room.roundTimer = null;
  room.wordSelectionTimer = null;
  room.status = 'roundEnding';

  io.to(roomId).emit('roundEnded', {
    word: room.currentWord,
    players: room.players
  });

  setRoom(roomId, room);

  room.nextRoundTimeout = setTimeout(() => {
    const current = getRoom(roomId);
    if (!current || current.status !== 'roundEnding') return;
    current.nextRoundTimeout = null;
    startNextRound(io, roomId);
  }, 5000);
  setRoom(roomId, room);
}

module.exports = { startNextRound, startRoundTimer, endRound, processWordSelection };
