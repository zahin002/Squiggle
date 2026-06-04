/**
 * client/src/components/game/RoundManager.jsx
 *
 * RoundManager is the component that drives the word-selection phase of each
 * round and the game-end screen. It is rendered inside GamePage.jsx.
 *
 * ─── When is it rendered? ────────────────────────────────────────────────────
 * GamePage passes `gameStatus` from useGameState down. RoundManager renders
 * different content depending on that status:
 *
 *   'lobby'         → Lobby waiting screen (show connected players, Start button)
 *   'wordSelection' → If current user IS the drawer: word-choice modal
 *                     If current user is NOT the drawer: "Choosing..." overlay
 *   'playing'       → Hidden — canvas, chat, timer take over
 *   'roundEnd'      → Round summary overlay (word revealed, score deltas)
 *   'gameEnd'       → Final game-end screen with rankings and upsell for guests
 *
 * ─── Props ───────────────────────────────────────────────────────────────────
 *   socket          {object}   Socket.IO client instance
 *   roomId          {string}   Current room ID
 *   gameStatus      {string}   From useGameState
 *   players         {array}    All players with { socketId, username, score, isGuest }
 *   currentDrawer   {object}   { socketId, username } of who is drawing this round
 *   wordChoices     {array}    Words sent only to the drawer to pick from
 *   roundWord       {string}   Revealed at round end
 *   currentRound    {number}   e.g. 1
 *   totalRounds     {number}   e.g. 3
 *   mySocketId      {string}   This client's own socket.id (to detect if drawer)
 *   isGuest         {boolean}  Whether the current user is a guest
 *   onStartGame     {function} Called by host to emit 'startGame' socket event
 *   isHost          {boolean}  Whether this player is the room host
 *
 * ─── Socket events emitted from here ─────────────────────────────────────────
 *   'wordSelected'  { roomId, word }   — drawer picks a word
 *   (startGame via onStartGame prop)   — host starts the match
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Auto-select countdown for the drawer (seconds).
// If the drawer doesn't pick within this time, the first word is auto-selected.
const WORD_SELECT_TIMEOUT = 30;

export default function RoundManager({
  socket,
  roomId,
  gameStatus,
  players,
  currentDrawer,
  wordChoices,
  roundWord,
  currentRound,
  totalRounds,
  mySocketId,
  isGuest,
  onStartGame,
  isHost,
}) {
  const navigate = useNavigate();
  const isDrawer = currentDrawer?.socketId === mySocketId;

  // Countdown timer for word-selection phase
  const [selectCountdown, setSelectCountdown] = useState(WORD_SELECT_TIMEOUT);
  // Which word the drawer has highlighted (hover/keyboard) before confirming
  const [hoveredWord, setHoveredWord] = useState(null);
  // Tracks whether a word was submitted (prevents double-emit)
  const [wordSubmitted, setWordSubmitted] = useState(false);

  // ── Word selection auto-timer ─────────────────────────────────────────────
  // When it's the drawer's word-selection phase:
  //   - Countdown ticks down from WORD_SELECT_TIMEOUT
  //   - On expiry, auto-select the first word in the list
  useEffect(() => {
    if (gameStatus !== 'wordSelection' || !isDrawer || wordSubmitted) return;

    setSelectCountdown(WORD_SELECT_TIMEOUT);

    const interval = setInterval(() => {
      setSelectCountdown(prev => {
        if (prev <= 1) {
          // Time's up — auto-select first word
          clearInterval(interval);
          if (wordChoices.length > 0 && !wordSubmitted) {
            emitWordSelected(wordChoices[0]);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStatus, isDrawer, wordChoices, wordSubmitted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset word-submitted flag when round changes
  useEffect(() => {
    setWordSubmitted(false);
    setHoveredWord(null);
  }, [currentRound]);

  // ── Word emission ─────────────────────────────────────────────────────────
  function emitWordSelected(word) {
    if (wordSubmitted) return;
    setWordSubmitted(true);
    socket.emit('wordSelected', { roomId, word });
  }

  // ─── STATUS: 'lobby' ─────────────────────────────────────────────────────
  if (gameStatus === 'lobby') {
    const sortedPlayers = [...players].sort((a, b) =>
      a.username.localeCompare(b.username)
    );

    return (
      <div className="round-manager round-manager--lobby">
        <div className="round-manager__lobby-card">
          <h2 className="round-manager__lobby-title">Waiting for players…</h2>

          <div className="round-manager__player-list" aria-label="Players in lobby">
            {sortedPlayers.map(p => (
              <div key={p.socketId} className="round-manager__lobby-player">
                <span
                  className="round-manager__lobby-avatar"
                  style={{ backgroundColor: p.avatar?.color || '#4A90E2' }}
                  aria-hidden="true"
                >
                  {p.username.charAt(0).toUpperCase()}
                </span>
                <span className="round-manager__lobby-name">
                  {p.username}
                  {p.isGuest && (
                    <span className="round-manager__guest-badge" title="Guest player">Guest</span>
                  )}
                  {p.socketId === mySocketId && (
                    <span className="round-manager__you-badge"> (you)</span>
                  )}
                </span>
                <span
                  className="round-manager__ready-dot"
                  aria-label={p.isReady ? 'Ready' : 'Not ready'}
                  title={p.isReady ? 'Ready' : 'Not ready'}
                  style={{ backgroundColor: p.isReady ? '#4CAF50' : '#ccc' }}
                />
              </div>
            ))}
          </div>

          {players.length < 2 && (
            <p className="round-manager__lobby-hint">
              At least 2 players are needed to start.
            </p>
          )}

          {isHost && players.length >= 2 && (
            <button
              className="round-manager__start-btn"
              onClick={onStartGame}
              type="button"
            >
              Start Game
            </button>
          )}

          {!isHost && (
            <p className="round-manager__lobby-hint">
              Waiting for the host to start the game…
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─── STATUS: 'wordSelection' — drawer ────────────────────────────────────
  if (gameStatus === 'wordSelection' && isDrawer) {
    const timerPercent = (selectCountdown / WORD_SELECT_TIMEOUT) * 100;

    return (
      <div className="round-manager round-manager--word-select" role="dialog"
           aria-modal="true" aria-label="Choose a word to draw">

        <div className="round-manager__word-card">
          {/* Round badge */}
          <div className="round-manager__round-badge">
            Round {currentRound} of {totalRounds}
          </div>

          <h2 className="round-manager__word-title">Choose a word to draw!</h2>
          <p className="round-manager__word-subtitle">
            The other players will try to guess what you draw.
          </p>

          {/* Auto-select countdown */}
          <div className="round-manager__select-timer" aria-live="polite">
            <div className="round-manager__select-timer-bar-track">
              <div
                className="round-manager__select-timer-bar"
                style={{
                  width: `${timerPercent}%`,
                  backgroundColor: timerPercent > 50
                    ? '#4CAF50'
                    : timerPercent > 25
                      ? '#FF9800'
                      : '#F44336',
                  transition: 'width 1s linear, background-color 0.5s',
                }}
              />
            </div>
            <span className="round-manager__select-timer-text" aria-label={`${selectCountdown} seconds remaining`}>
              Auto-select in {selectCountdown}s
            </span>
          </div>

          {/* Word choices */}
          <div
            className="round-manager__word-choices"
            role="listbox"
            aria-label="Word choices"
          >
            {wordChoices.length === 0 ? (
              <p className="round-manager__no-words">Loading words…</p>
            ) : (
              wordChoices.map((word, i) => (
                <button
                  key={`${word}-${i}`}
                  className={`round-manager__word-choice ${hoveredWord === word ? 'round-manager__word-choice--hovered' : ''}`}
                  onClick={() => emitWordSelected(word)}
                  onMouseEnter={() => setHoveredWord(word)}
                  onMouseLeave={() => setHoveredWord(null)}
                  onFocus={() => setHoveredWord(word)}
                  onBlur={() => setHoveredWord(null)}
                  aria-label={`Draw "${word}"`}
                  role="option"
                  type="button"
                  disabled={wordSubmitted}
                >
                  <span className="round-manager__word-text">{word}</span>
                  <span
                    className="round-manager__word-difficulty"
                    aria-hidden="true"
                  >
                    {/* Difficulty indicator — number of characters as a rough proxy */}
                    {word.length <= 5 ? '⭐' : word.length <= 9 ? '⭐⭐' : '⭐⭐⭐'}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── STATUS: 'wordSelection' — NOT drawer ────────────────────────────────
  if (gameStatus === 'wordSelection' && !isDrawer) {
    return (
      <div className="round-manager round-manager--waiting" role="status"
           aria-live="polite" aria-label="Waiting for drawer to choose a word">
        <div className="round-manager__waiting-card">
          <div className="round-manager__round-badge">
            Round {currentRound} of {totalRounds}
          </div>
          <div className="round-manager__waiting-spinner" aria-hidden="true">
            <div className="round-manager__spinner-dot" />
            <div className="round-manager__spinner-dot" />
            <div className="round-manager__spinner-dot" />
          </div>
          <p className="round-manager__waiting-text">
            <strong>{currentDrawer?.username}</strong> is choosing a word…
          </p>
          <p className="round-manager__waiting-hint">
            Get ready to guess!
          </p>
        </div>
      </div>
    );
  }

  // ─── STATUS: 'roundEnd' ──────────────────────────────────────────────────
  if (gameStatus === 'roundEnd') {
    const sortedByScore = [...players].sort((a, b) => b.score - a.score);

    return (
      <div className="round-manager round-manager--round-end" role="dialog"
           aria-modal="true" aria-label="Round ended">
        <div className="round-manager__round-end-card">
          <div className="round-manager__round-badge">
            Round {currentRound} of {totalRounds} — Finished!
          </div>

          {roundWord && (
            <div className="round-manager__word-reveal">
              <span className="round-manager__word-reveal-label">The word was</span>
              <span className="round-manager__word-reveal-word">
                {roundWord.toUpperCase()}
              </span>
            </div>
          )}

          {/* Per-round score summary */}
          <div className="round-manager__score-list" aria-label="Round scores">
            {sortedByScore.map((p, i) => (
              <div key={p.socketId} className="round-manager__score-row">
                <span className="round-manager__score-rank">#{i + 1}</span>
                <span className="round-manager__score-name">
                  {p.username}
                  {p.isGuest && (
                    <span className="round-manager__guest-badge">Guest</span>
                  )}
                  {p.socketId === mySocketId && (
                    <span className="round-manager__you-badge"> (you)</span>
                  )}
                </span>
                {/* Coins earned this round — hidden for guests */}
                {!p.isGuest && p.coinsThisRound > 0 && (
                  <span className="round-manager__coins-earned" aria-label={`+${p.coinsThisRound} coins`}>
                    +{p.coinsThisRound} 🪙
                  </span>
                )}
                <span className="round-manager__score-total">{p.score} pts</span>
              </div>
            ))}
          </div>

          <p className="round-manager__next-hint" aria-live="polite">
            {currentRound < totalRounds
              ? `Next round starts in a moment…`
              : `Game ending…`}
          </p>
        </div>
      </div>
    );
  }

  // ─── STATUS: 'gameEnd' ───────────────────────────────────────────────────
  if (gameStatus === 'gameEnd') {
    const sortedFinal = [...players].sort((a, b) => b.score - a.score);
    const winner = sortedFinal[0];
    const isWinner = winner?.socketId === mySocketId;

    return (
      <div className="round-manager round-manager--game-end" role="dialog"
           aria-modal="true" aria-label="Game over">
        <div className="round-manager__game-end-card">
          <div className="round-manager__trophy" aria-label="Trophy" role="img">🏆</div>

          <h2 className="round-manager__game-end-title">
            {isWinner ? 'You won! 🎉' : `${winner?.username || 'Someone'} wins!`}
          </h2>

          {/* Final rankings */}
          <div className="round-manager__final-rankings" aria-label="Final rankings">
            {sortedFinal.map((p, i) => (
              <div
                key={p.socketId}
                className={`round-manager__final-row ${i === 0 ? 'round-manager__final-row--winner' : ''}`}
              >
                <span className="round-manager__final-rank">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </span>
                <span className="round-manager__final-name">
                  {p.username}
                  {p.isGuest && (
                    <span className="round-manager__guest-badge">Guest</span>
                  )}
                  {p.socketId === mySocketId && (
                    <span className="round-manager__you-badge"> (you)</span>
                  )}
                </span>
                {/* Total coins earned — hidden for guests */}
                {!p.isGuest && (
                  <span className="round-manager__final-coins" aria-label={`${p.coinsThisRound || 0} coins earned`}>
                    +{p.coinsThisRound || 0} 🪙
                  </span>
                )}
                <span className="round-manager__final-score">{p.score} pts</span>
              </div>
            ))}
          </div>

          {/* Guest upsell — shown only to the current player if they are a guest */}
          {isGuest && (
            <div className="round-manager__guest-upsell" role="complementary">
              <p className="round-manager__upsell-text">
                Great game, {winner?.socketId === mySocketId ? 'winner' : 'player'}!
                Create a free account to earn coins, use power-ups, and save your progress.
              </p>
              <button
                className="round-manager__upsell-btn"
                onClick={() => navigate('/register')}
                type="button"
              >
                Create Free Account
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="round-manager__end-actions">
            <button
              className="round-manager__action-btn round-manager__action-btn--lobby"
              onClick={() => navigate('/lobby')}
              type="button"
            >
              Back to Lobby
            </button>
            {!isGuest && (
              <button
                className="round-manager__action-btn round-manager__action-btn--profile"
                onClick={() => navigate('/profile')}
                type="button"
              >
                View Profile
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── STATUS: 'playing' or any other — render nothing ─────────────────────
  // The canvas, chat, and timer take full control during the drawing phase.
  return null;
}