// server/socket/powerupEvents.js

const { getRoom, setRoom, persistRoom } = require('./roomStore');
const User = require('../models/User');
const Reward = require('../models/Reward');


function arePowerupsActive(room) {
  if (!room) return false;
  return room.settings?.gameMode === 'standard' && room.settings?.powerupsEnabled !== false && room.status === 'playing';
}

module.exports = (socket, io) => {
  // ── Host toggle in lobby ──────────────────────────────────────────
  socket.on('setPowerupsEnabled', ({ roomId, enabled }) => {
    const room = getRoom(roomId);
    if (!room) return;

    const senderUserId = socket.data?.userId ? String(socket.data.userId) : null;
    const isHost = room.hostUserId
      ? (senderUserId && String(room.hostUserId) === senderUserId)
      : (room.hostSocketId === socket.id || room.hostId === socket.id);

    if (!isHost) {
      return socket.emit('error', { message: 'Only the host can change power-up settings.' });
    }

    room.settings.powerupsEnabled = !!enabled;
    setRoom(roomId, room);
    persistRoom(roomId, { 'settings.powerupsEnabled': !!enabled });

    io.to(roomId).emit('powerupsStatusChanged', { powerupsEnabled: !!enabled });
  });

  // ── 1. Hint Steal ────────────────────────────────────────────────
  socket.on('useHintSteal', async ({ roomId, currency = 'gold' }) => {
    try {
      const room = getRoom(roomId);
      if (!room || room.status !== 'playing') {
        return socket.emit('powerupError', { message: 'A round must be in progress to use Hint Steal.' });
      }

      if (room.settings?.gameMode !== 'standard' || room.settings?.powerupsEnabled === false) {
        return socket.emit('powerupError', { message: 'Power-ups are disabled for this match.' });
      }

      const player = (room.players || []).find((p) => p.socketId === socket.id);
      if (!player) {
        return socket.emit('powerupError', { message: 'Player not found in room.' });
      }

      if (room.currentDrawer?.socketId === socket.id) {
        return socket.emit('powerupError', { message: 'The drawer cannot use Hint Steal.' });
      }

      const guesserId = player.userId || player.socketId;
      if (room.correctGuessers && room.correctGuessers.includes(guesserId)) {
        return socket.emit('powerupError', { message: 'You have already guessed the word!' });
      }

      if (!player.userId || player.isGuest) {
        return socket.emit('powerupError', { message: 'Log in with an account to spend Gold Coins or Diamonds on power-ups.' });
      }

      const currentWord = room.currentWord;
      if (!currentWord) {
        return socket.emit('powerupError', { message: 'No active word to reveal.' });
      }

      // Calculate unrevealed letters
      const revealed = room.revealedHintIndices || [];
      const unrevealedIndices = [];
      for (let i = 0; i < currentWord.length; i++) {
        if (currentWord[i] !== ' ' && !revealed.includes(i)) {
          unrevealedIndices.push(i);
        }
      }

      const lettersRemaining = unrevealedIndices.length;
      if (lettersRemaining === 0) {
        return socket.emit('powerupError', { message: 'All letters have already been revealed!' });
      }

      // Cost calculation
      let goldCost = 100;
      let diamondCost = 1;
      if (lettersRemaining === 1) {
        goldCost = 300;
        diamondCost = 2;
      } else if (lettersRemaining === 2) {
        goldCost = 200;
        diamondCost = 1;
      } else {
        goldCost = 100;
        diamondCost = 1;
      }

      const user = await User.findById(player.userId);
      if (!user) {
        return socket.emit('powerupError', { message: 'User account not found.' });
      }

      const useDiamonds = currency === 'diamonds';
      if (useDiamonds) {
        if ((user.diamonds || 0) < diamondCost) {
          return socket.emit('powerupError', {
            message: `Not enough Diamonds! Needs ${diamondCost} 💎 (You have ${user.diamonds || 0})`
          });
        }
        user.diamonds = (user.diamonds || 0) - diamondCost;
      } else {
        if ((user.goldCoins || 0) < goldCost) {
          return socket.emit('powerupError', {
            message: `Not enough Gold Coins! Needs ${goldCost} 🪙 (You have ${user.goldCoins || 0})`
          });
        }
        user.goldCoins = (user.goldCoins || 0) - goldCost;
      }

      await user.save();

      // Log in Reward collection
      Reward.create({
        userId: user._id,
        type: 'powerup_spend',
        amount: useDiamonds ? -diamondCost : -goldCost,
        currency: useDiamonds ? 'diamonds' : 'goldCoins',
        metadata: { powerup: 'hint_steal', lettersRemaining }
      }).catch(() => {});

      // Reveal random unrevealed index
      const chosenIdx = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
      if (!room.revealedHintIndices) room.revealedHintIndices = [];
      room.revealedHintIndices.push(chosenIdx);

      // Reconstruct word hint
      let newHint = '';
      for (let i = 0; i < currentWord.length; i++) {
        if (currentWord[i] === ' ') newHint += '  ';
        else if (room.revealedHintIndices.includes(i)) newHint += currentWord[i] + ' ';
        else newHint += '_ ';
      }
      room.wordHint = newHint.trim();
      setRoom(roomId, room);

      socket.emit('powerupSuccess', {
        powerup: 'hint_steal',
        goldCoins: user.goldCoins,
        diamonds: user.diamonds,
        revealedLetter: currentWord[chosenIdx]
      });

      io.to(roomId).emit('timerTick', {
        timeLeft: room.timeLeft,
        wordHint: room.wordHint,
        freezeState: room.freezeState
      });

      io.to(roomId).emit('chatMessage', {
        type: 'system',
        text: `💡 ${player.username} used Hint Steal! A letter has been revealed.`
      });
    } catch (err) {
      console.error('[USE HINT STEAL ERROR]', err);
      socket.emit('powerupError', { message: 'Failed to use Hint Steal.' });
    }
  });

  // ── 2. Freeze Time ───────────────────────────────────────────────
  socket.on('useFreezeTime', async ({ roomId, currency = 'gold' }) => {
    try {
      const room = getRoom(roomId);
      if (!room || room.status !== 'playing') {
        return socket.emit('powerupError', { message: 'A round must be in progress to use Freeze Time.' });
      }

      if (room.settings?.gameMode !== 'standard' || room.settings?.powerupsEnabled === false) {
        return socket.emit('powerupError', { message: 'Power-ups are disabled for this match.' });
      }

      const player = (room.players || []).find((p) => p.socketId === socket.id);
      if (!player) {
        return socket.emit('powerupError', { message: 'Player not found in room.' });
      }

      if (room.currentDrawer?.socketId === socket.id) {
        return socket.emit('powerupError', { message: 'The drawer cannot use Freeze Time.' });
      }

      const guesserId = player.userId || player.socketId;
      if (room.correctGuessers && room.correctGuessers.includes(guesserId)) {
        return socket.emit('powerupError', { message: 'You have already guessed the word!' });
      }

      if (!player.userId || player.isGuest) {
        return socket.emit('powerupError', { message: 'Log in with an account to spend Gold Coins or Diamonds on power-ups.' });
      }

      // Only one player can have active freeze time at a time
      if (room.freezeState && room.freezeState.active && room.freezeState.userSocketId !== socket.id) {
        return socket.emit('powerupError', {
          message: `Freeze Time is already active for ${room.freezeState.username}!`
        });
      }

      // Cost calculation: 200, 400, 800, 1600... / 1, 2, 4, 8...
      const purchases = room.freezeState?.purchasesByUser?.[socket.id] || 0;
      const costGold = 200 * Math.pow(2, purchases);
      const costDiamond = 1 * Math.pow(2, purchases);

      const user = await User.findById(player.userId);
      if (!user) {
        return socket.emit('powerupError', { message: 'User account not found.' });
      }

      const useDiamonds = currency === 'diamonds';
      if (useDiamonds) {
        if ((user.diamonds || 0) < costDiamond) {
          return socket.emit('powerupError', {
            message: `Not enough Diamonds! Needs ${costDiamond} 💎 (You have ${user.diamonds || 0})`
          });
        }
        user.diamonds = (user.diamonds || 0) - costDiamond;
      } else {
        if ((user.goldCoins || 0) < costGold) {
          return socket.emit('powerupError', {
            message: `Not enough Gold Coins! Needs ${costGold} 🪙 (You have ${user.goldCoins || 0})`
          });
        }
        user.goldCoins = (user.goldCoins || 0) - costGold;
      }

      await user.save();

      Reward.create({
        userId: user._id,
        type: 'powerup_spend',
        amount: useDiamonds ? -costDiamond : -costGold,
        currency: useDiamonds ? 'diamonds' : 'goldCoins',
        metadata: { powerup: 'freeze_time', purchaseNumber: purchases + 1 }
      }).catch(() => {});

      const currentRemaining = (room.freezeState?.active && room.freezeState?.userSocketId === socket.id)
        ? room.freezeState.freezeSecondsRemaining
        : 0;

      const frozenNormalTime = (room.freezeState?.active && room.freezeState?.userSocketId === socket.id)
        ? room.freezeState.normalTimeFrozenAt
        : room.timeLeft;

      room.freezeState = {
        active: true,
        userSocketId: socket.id,
        userId: player.userId,
        username: player.username,
        freezeSecondsRemaining: currentRemaining + 20,
        normalTimeFrozenAt: frozenNormalTime,
        purchasesByUser: {
          ...(room.freezeState?.purchasesByUser || {}),
          [socket.id]: purchases + 1
        }
      };

      setRoom(roomId, room);

      socket.emit('powerupSuccess', {
        powerup: 'freeze_time',
        goldCoins: user.goldCoins,
        diamonds: user.diamonds
      });

      io.to(roomId).emit('freezeTimeUpdate', {
        active: true,
        userSocketId: socket.id,
        username: player.username,
        freezeSecondsRemaining: room.freezeState.freezeSecondsRemaining,
        normalTimeFrozenAt: room.freezeState.normalTimeFrozenAt,
        normalTimeLeft: room.timeLeft
      });

      io.to(roomId).emit('chatMessage', {
        type: 'system',
        text: `❄️ ${player.username} activated Freeze Time (+20s)! Clock stopped!`
      });
    } catch (err) {
      console.error('[USE FREEZE TIME ERROR]', err);
      socket.emit('powerupError', { message: 'Failed to use Freeze Time.' });
    }
  });
};
