const { getRoom, setRoom, persistRoom } = require('./roomStore');
const { getWordChoices } = require('../utils/WordBank');

async function startNextRound(io, roomId) {
  const room = getRoom(roomId);
  if (!room) return;

  // A start request and a delayed end-of-round callback may both reach here.
  // Only those two lifecycle states are allowed to create a new round.
  if (!['starting', 'roundEnding'].includes(room.status)) return;

  if (room.players.length === 0) return;

  // Handle round & turn progression:
  // Each round consists of EVERY player getting 1 turn to draw.
  // The round only advances to the next round after all players have drawn.
  let isNewRoundStarting = false;

  if (room.status === 'starting') {
    room.currentRound = 1;
    room.currentDrawerIndex = 0;
    room.drawersDrawnThisRound = 0;
    isNewRoundStarting = true;
  } else {
    // Coming from roundEnding (a player's drawing turn just concluded)
    room.drawersDrawnThisRound = (room.drawersDrawnThisRound || 0) + 1;

    // If every player has had their turn to draw in the current round:
    if (room.drawersDrawnThisRound >= room.players.length) {
      room.currentRound += 1;
      room.drawersDrawnThisRound = 0;
      room.currentDrawerIndex = 0;
      isNewRoundStarting = true;
    } else {
      // Advance to the next player's turn in the same round
      room.currentDrawerIndex = (room.currentDrawerIndex + 1) % room.players.length;
    }
  }

  if (room.currentRound > room.settings.rounds) {
    const sortedPlayers = [...room.players].sort((a, b) => (b.score || 0) - (a.score || 0));
    const winner = sortedPlayers[0];
    
    // Award win bonuses to MongoDB for registered winner
    if (winner?.userId && !winner?.isGuest) {
      const User = require('../models/User');
      const Reward = require('../models/Reward');

      try {
        const user = await User.findById(winner.userId);
        if (user) {
          const newStreak = (user.currentWinStreak || 0) + 1;
          const earnsDiamond = (newStreak % 2 === 0); // Every 2 consecutive wins awards 1 diamond
          const diamondBonus = earnsDiamond ? 1 : 0;

          user.goldCoins = (user.goldCoins || 0) + 20;
          user.totalWins = (user.totalWins || 0) + 1;
          user.currentWinStreak = newStreak;
          if (diamondBonus > 0) {
            user.diamonds = (user.diamonds || 0) + diamondBonus;
          }
          await user.save();

          // Audit log in Reward collection
          Reward.create({
            userId: user._id,
            type: 'game_win',
            amount: 20,
            currency: 'goldCoins'
          }).catch(() => {});

          if (diamondBonus > 0) {
            Reward.create({
              userId: user._id,
              type: 'win_streak',
              amount: diamondBonus,
              currency: 'diamonds'
            }).catch(() => {});

            io.to(roomId).emit('chatMessage', {
              type: 'system',
              text: `💎 WIN STREAK BONUS! ${winner.username} reached a ${newStreak}-win streak and earned +1 Diamond!`
            });
          }
        }
      } catch (err) {
        console.error('[WIN BONUS ERROR]', err);
      }

      // Reset win streaks for other registered players who lost
      const otherUserIds = room.players
        .filter(p => p.userId && !p.isGuest && p.userId.toString() !== winner.userId.toString())
        .map(p => p.userId);

      if (otherUserIds.length > 0) {
        const User = require('../models/User');
        User.updateMany({ _id: { $in: otherUserIds } }, { $set: { currentWinStreak: 0 } }).catch(() => {});
      }
    }

    io.to(roomId).emit('gameEnded', {
      players: room.players,
      winner: winner?.username
    });
    room.status = 'finished';
    setRoom(roomId, room);
    persistRoom(roomId, { status: 'finished' });
    return;
  }

  // If a brand new round started (e.g. Round 2 or 3), notify the room
  if (isNewRoundStarting && room.currentRound > 1) {
    io.to(roomId).emit('chatMessage', {
      type: 'system',
      text: `🔔 Round ${room.currentRound} of ${room.settings.rounds} has started!`
    });
  }

  // Ensure current drawer index is valid
  if (room.currentDrawerIndex >= room.players.length || room.currentDrawerIndex < 0) {
    room.currentDrawerIndex = 0;
  }

  room.currentDrawer = room.players[room.currentDrawerIndex];
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
  room.revealedHintIndices = [];
  room.freezeState = null;
  room.playerExtraClues = {};

  const isWordle = room.settings?.gameMode === 'wordle';
  if (isWordle) {
    const { getWordlePhaseDuration } = require('../utils/wordleHelper');
    room.wordleState = {
      currentGuessPhase: 1, // 1 to 6
      isDrawerLocked: true, // true for guesses 1 and 2
      phase: 1,             // 1 = Blind Guessing (guesses 1-2), 2 = Drawing (guesses 3-6)
      playerGuesses: {},    // { [socketId]: [ { guess: 'APPLE', evaluation: [...] } ] }
      playerSolved: {},     // { [socketId]: { guessNum: 1, scoreAwarded: 100 } }
      submittedThisPhase: []
    };
    room.timeLeft = getWordlePhaseDuration(1); // 60s
  } else {
    room.timeLeft = room.settings.drawTime;
  }
  
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
    timeLeft: room.timeLeft,
    isWordle,
    wordleState: room.wordleState ? {
      currentGuessPhase: room.wordleState.currentGuessPhase,
      maxGuesses: 6,
      isDrawerLocked: room.wordleState.isDrawerLocked,
      phase: room.wordleState.phase
    } : null
  });

  const startMsg = isWordle
    ? `Wordle Mode started! Phase 1: Blind Guessing (Guess 1 of 6). Drawer is locked.`
    : `${room.currentDrawer.username} started drawing`;

  io.to(roomId).emit('chatMessage', {
    type: 'system',
    text: startMsg
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

function advanceWordlePhase(io, room, roomId) {
  const { getWordlePhaseDuration } = require('../utils/wordleHelper');
  const ws = room.wordleState;
  if (!ws) return true;

  const guessers = (room.players || []).filter(p => p.socketId !== room.currentDrawer?.socketId);
  const allSolved = guessers.length > 0 && guessers.every(p => ws.playerSolved && ws.playerSolved[p.socketId]);

  // For any unsolved guesser who didn't submit a guess for the phase that just completed,
  // automatically block that row as skipped/missed.
  const completedPhase = ws.currentGuessPhase;
  if (!ws.playerGuesses) ws.playerGuesses = {};

  guessers.forEach(p => {
    if (ws.playerSolved && ws.playerSolved[p.socketId]) return;

    if (!ws.playerGuesses[p.socketId]) {
      ws.playerGuesses[p.socketId] = [];
    }

    const pGuesses = ws.playerGuesses[p.socketId];
    while (pGuesses.length < completedPhase && pGuesses.length < 6) {
      const skippedGuessNum = pGuesses.length + 1;
      pGuesses.push({
        guess: '-----',
        evaluation: [
          { letter: '—', status: 'skipped' },
          { letter: '—', status: 'skipped' },
          { letter: '—', status: 'skipped' },
          { letter: '—', status: 'skipped' },
          { letter: '—', status: 'skipped' }
        ],
        guessNumber: skippedGuessNum,
        isCorrect: false,
        isSkipped: true
      });
    }

    // Emit updated guesses to player so their board reflects the blocked row immediately
    io.to(p.socketId).emit('wordleGuessResult', {
      myGuesses: pGuesses,
      isCorrect: !!(ws.playerSolved && ws.playerSolved[p.socketId]),
      solversCount: Object.keys(ws.playerSolved || {}).length
    });
  });

  if (ws.currentGuessPhase >= 6 || allSolved) {
    return true; // signal that round should end
  }

  ws.currentGuessPhase += 1;
  ws.isDrawerLocked = ws.currentGuessPhase <= 2;
  ws.phase = ws.currentGuessPhase <= 2 ? 1 : 2;
  ws.submittedThisPhase = [];
  room.timeLeft = getWordlePhaseDuration(ws.currentGuessPhase);

  const phaseMsg = ws.phase === 1
    ? `Phase 1 (Blind Guessing): Guess ${ws.currentGuessPhase} of 6 (60s). Drawer locked!`
    : `Phase 2 (Drawing Active): Guess ${ws.currentGuessPhase} of 6 (30s). Drawer unlocked!`;

  io.to(roomId).emit('wordlePhaseStarted', {
    guessPhase: ws.currentGuessPhase,
    isDrawerLocked: ws.isDrawerLocked,
    phase: ws.phase,
    timeLeft: room.timeLeft
  });

  io.to(roomId).emit('chatMessage', {
    type: 'system',
    text: `[Wordle] ${phaseMsg}`
  });

  const { setRoom } = require('./roomStore');
  setRoom(roomId, room);
  return false;
}

function startRoundTimer(io, room, roomId) {
  const { setRoom, getRoom } = require('./roomStore');

  room.roundTimer = setInterval(async () => {
    const current = getRoom(roomId);
    if (!current) { clearInterval(room.roundTimer); return; }

    // Check if Freeze Time is active
    if (current.freezeState && current.freezeState.active && current.freezeState.freezeSecondsRemaining > 0) {
      current.freezeState.freezeSecondsRemaining -= 1;

      // Normal time ticks down for other players until 0
      if (current.timeLeft > 0) {
        current.timeLeft -= 1;
        if (current.settings?.gameMode !== 'wordle') {
          updateWordHint(current);
        }
      }

      io.to(roomId).emit('timerTick', {
        timeLeft: current.timeLeft,
        wordHint: current.wordHint,
        freezeState: {
          active: true,
          userSocketId: current.freezeState.userSocketId,
          username: current.freezeState.username,
          freezeSecondsRemaining: current.freezeState.freezeSecondsRemaining,
          normalTimeFrozenAt: current.freezeState.normalTimeFrozenAt,
          isNormalTimeExpired: current.timeLeft <= 0
        }
      });

      // When freeze time runs out:
      if (current.freezeState.freezeSecondsRemaining <= 0) {
        current.freezeState.active = false;
        io.to(roomId).emit('freezeTimeEnded', {
          userSocketId: current.freezeState.userSocketId,
          username: current.freezeState.username
        });
        io.to(roomId).emit('chatMessage', {
          type: 'system',
          text: `❄️ Freeze time has expired!`
        });

        // If normal time had already expired while frozen, end the round now
        if (current.timeLeft <= 0) {
          clearInterval(current.roundTimer);
          await endRound(io, current, roomId);
          return;
        }
      }

      setRoom(roomId, current);
      return;
    }

    // Normal tick (no freeze active)
    current.timeLeft -= 1;
    if (current.settings?.gameMode !== 'wordle') {
      updateWordHint(current);
    }
    io.to(roomId).emit('timerTick', {
      timeLeft: current.timeLeft,
      wordHint: current.wordHint,
      freezeState: null
    });

    if (current.timeLeft <= 0) {
      // If freeze time became active, hold
      if (current.freezeState && current.freezeState.active && current.freezeState.freezeSecondsRemaining > 0) {
        setRoom(roomId, current);
        return;
      }

      if (current.settings?.gameMode === 'wordle') {
        const shouldEnd = advanceWordlePhase(io, current, roomId);
        if (shouldEnd) {
          clearInterval(current.roundTimer);
          await endRound(io, current, roomId);
        }
      } else {
        clearInterval(current.roundTimer);
        await endRound(io, current, roomId);
      }
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

  const isWordle = room.settings?.gameMode === 'wordle';
  const isFailedRound = !room.correctGuessers || room.correctGuessers.length === 0;

  // Award Wordle Drawer points based on solver count
  if (isWordle && room.currentDrawer) {
    const { getDrawerWordlePoints } = require('../utils/wordleHelper');
    const guessers = (room.players || []).filter(p => p.socketId !== room.currentDrawer.socketId);
    const solversCount = Object.keys(room.wordleState?.playerSolved || {}).length;
    const drawerReward = getDrawerWordlePoints(guessers.length, solversCount);

    const drawerPlayer = room.players.find(p => p.socketId === room.currentDrawer.socketId || p.userId === room.currentDrawer.userId);
    if (drawerPlayer) {
      drawerPlayer.score = (drawerPlayer.score || 0) + drawerReward.points;
    }

    io.to(roomId).emit('chatMessage', {
      type: 'system',
      text: `[Wordle] Drawer ${room.currentDrawer.username} earned +${drawerReward.points} pts (${drawerReward.reason}).`
    });
  }

  if (isFailedRound && room.currentDrawer?.userId && !room.currentDrawer?.isGuest) {
    const User = require('../models/User');
    const Reward = require('../models/Reward');

    User.findOneAndUpdate(
      { _id: room.currentDrawer.userId, goldCoins: { $gt: 0 } },
      { $inc: { goldCoins: -1 } },
      { new: true }
    ).then((updated) => {
      if (updated) {
        Reward.create({
          userId: room.currentDrawer.userId,
          type: 'failed_round',
          amount: -1,
          currency: 'goldCoins'
        }).catch(() => {});
      }
    }).catch(() => {});

    io.to(roomId).emit('chatMessage', {
      type: 'system',
      text: `❌ Round failed! Nobody guessed the word (-1 coin for drawer).`
    });
  } else if (!isFailedRound && room.currentDrawer?.userId && !room.currentDrawer?.isGuest) {
    const User = require('../models/User');
    const Reward = require('../models/Reward');

    User.findByIdAndUpdate(
      room.currentDrawer.userId,
      { $inc: { goldCoins: 2 } }
    ).catch(() => {});

    Reward.create({
      userId: room.currentDrawer.userId,
      type: 'successful_draw',
      amount: 2,
      currency: 'goldCoins'
    }).catch(() => {});

    io.to(roomId).emit('chatMessage', {
      type: 'system',
      text: `Drawing successful! ${room.currentDrawer.username} earned +2 Gold Coins.`
    });
  }

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

module.exports = { startNextRound, startRoundTimer, endRound, processWordSelection, advanceWordlePhase };
