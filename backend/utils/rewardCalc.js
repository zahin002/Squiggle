const User = require('../models/User');
const Reward = require('../models/Reward');

const rewardCalc = async (gameSessionId, players, hadGuestPlayers) => {
  const results = [];

  for (const player of players) {
    // Skip guests — they have no user account to reward
    if (!player.user) continue;

    const user = await User.findById(player.user);
    if (!user) continue;

    let coinsEarned = 0;
    let diamondsEarned = 0;
    const rewardLogs = [];

    // ── Base coin rewards ──────────────────────────────────
    // Every correct guess earns 10 coins
    coinsEarned += player.correctGuesses * 10;
    if (player.correctGuesses > 0) {
      rewardLogs.push({
        type: 'correct_guess',
        coinsEarned: player.correctGuesses * 10,
        description: `${player.correctGuesses} correct guess(es) — ${player.correctGuesses * 10} coins`
      });
    }

    // Drawer bonus — 5 coins per round drawn
    coinsEarned += player.roundsDrawn * 5;
    if (player.roundsDrawn > 0) {
      rewardLogs.push({
        type: 'drawer_bonus',
        coinsEarned: player.roundsDrawn * 5,
        description: `Drew ${player.roundsDrawn} round(s) — ${player.roundsDrawn * 5} coins`
      });
    }

    // Win bonus — 50 coins
    const isWinner = player.score === Math.max(...players.map(p => p.score));
    if (isWinner) {
      coinsEarned += 50;
      user.wins += 1;
      user.winStreak += 1;
      user.totalGames += 1;

      rewardLogs.push({
        type: 'game_win',
        coinsEarned: 50,
        description: 'Won the game — 50 coins'
      });

      // ── Milestone rewards (only if no guests in game) ──
      if (!hadGuestPlayers) {
        // Win streak diamonds — doubles every 3 streak
        if (user.winStreak % 3 === 0) {
          const streakDiamonds = Math.min(user.winStreak / 3, 4);
          diamondsEarned += streakDiamonds;
          rewardLogs.push({
            type: 'win_streak',
            diamondsEarned: streakDiamonds,
            description: `${user.winStreak} win streak — ${streakDiamonds} diamond(s)`
          });
        }

        // 10 wins milestone
        if (user.wins === 10) {
          coinsEarned += 300;
          rewardLogs.push({
            type: 'milestone_10_wins',
            coinsEarned: 300,
            description: '10 wins milestone — 300 coins'
          });
        }

        // 20 wins milestone
        if (user.wins === 20) {
          coinsEarned += 600;
          diamondsEarned += 2;
          rewardLogs.push({
            type: 'milestone_20_wins',
            coinsEarned: 600,
            diamondsEarned: 2,
            description: '20 wins milestone — 600 coins + 2 diamonds'
          });
        }
      }
    } else {
      // Lost — still counts as a game played, reset streak
      user.winStreak = 0;
      user.totalGames += 1;
    }

    // ── Save rewards to user account ───────────────────────
    user.coins += coinsEarned;
    user.diamonds += diamondsEarned;
    await user.save();

    // ── Log each reward to Reward collection ───────────────
    for (const log of rewardLogs) {
      await Reward.create({
        user: player.user,
        gameSession: gameSessionId,
        type: log.type,
        coinsEarned: log.coinsEarned || 0,
        diamondsEarned: log.diamondsEarned || 0,
        description: log.description
      });
    }

    results.push({
      userId: player.user,
      username: player.username,
      coinsEarned,
      diamondsEarned,
      isWinner,
      newTotal: {
        coins: user.coins,
        diamonds: user.diamonds,
        wins: user.wins,
        winStreak: user.winStreak
      }
    });
  }

  return results;
};

module.exports = { rewardCalc };