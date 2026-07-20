import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import DrawingCanvas from '../components/DrawingCanvas';
import { useAuth } from '../context/AuthContext';
import '../styles/GamePage.css';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export default function GamePage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const requestedRole = location.state?.role || 'player';
  const { user, loginAsGuest, loading } = useAuth();
  const [activeUser, setActiveUser] = useState(user);
  const [roomState, setRoomState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [guess, setGuess] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);

  const hasJoinedRef = useRef(false);
  const chatBottomRef = useRef(null);

  const socket = useMemo(() => io(SERVER_URL, { autoConnect: false }), []);

  useEffect(() => {
    if (loading) return;
    if (user) {
      setActiveUser(user);
      return;
    }
    setActiveUser(loginAsGuest());
  }, [user, loginAsGuest, loading]);

  // Auto-scroll chat to bottom when messages update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!activeUser) return;
    if (hasJoinedRef.current) return;

    hasJoinedRef.current = true;
    socket.connect();

    socket.emit('joinRoom', {
      roomId,
      token: localStorage.getItem('token'),
      username: activeUser.username,
      role: requestedRole,
      isGuest: !!activeUser.isGuest,
      guestId: activeUser.id,
      userId: activeUser.id,
    });

    socket.on('roomState', (state) => {
      console.log('[ROOMSTATE RECEIVED]', state);
      setRoomState((prev) => ({
        ...prev,
        ...state,
      }));

      if (state?.timeLeft !== undefined) {
        setTimeLeft(state.timeLeft);
      }

      if (state?.chatHistory) {
        setMessages(state.chatHistory);
      }
    });

    socket.on('connect', () => {
      socket.emit('requestCanvasState', { roomId });
    });

    socket.on('playerJoined', ({ players }) => {
      setRoomState((state) => (state ? { ...state, players } : state));
    });

    socket.on('playerLeft', ({ players }) => {
      setRoomState((state) => (state ? { ...state, players } : state));
    });

    socket.on('gameStarted', ({ message }) => {
      setMessages((items) => [...items, { type: 'system', text: message }]);
    });

    socket.on('wordChoices', ({ choices }) => {
      setRoomState((s) => (s ? { ...s, wordChoices: choices, status: 'wordSelection' } : s));
    });

    socket.on('roundStarted', (round) => {
      setRoomState((state) => (state ? { ...state, status: 'playing', ...round } : state));
      if (round?.timeLeft !== undefined) setTimeLeft(round.timeLeft);
    });

    socket.on('roundEnded', ({ word, players }) => {
      setRoomState((state) => (state ? { ...state, status: 'roundEnding', revealedWord: word, players: players || state.players } : state));
      setMessages((items) => [...items, { type: 'system', text: `Round over! The word was: "${word}"` }]);
    });

    socket.on('gameEnded', ({ winner, players }) => {
      setRoomState((state) => (state ? { ...state, status: 'finished', winner, players: players || state.players } : state));
      setMessages((items) => [...items, { type: 'system', text: `🏆 Game Over! Winner: ${winner || 'Nobody'}` }]);
    });

    socket.on('timerTick', ({ timeLeft, wordHint }) => {
      setTimeLeft(timeLeft);
      if (wordHint) {
        setRoomState((s) => (s ? { ...s, wordHint } : s));
      }
    });

    socket.on('yourWord', ({ word }) => {
      setRoomState((s) => (s ? { ...s, selectedWord: word, currentWord: word } : s));
    });

    socket.on('chatMessage', (message) => {
      setMessages((items) => [...items.slice(-40), message]);
    });

    socket.on('error', (payload) => {
      setError(payload.message || 'Something went wrong');
      if (payload.message && payload.message.includes('All players have left')) {
        setTimeout(() => navigate('/lobby'), 2500);
      }
    });

    return () => {
      socket.off('roomState');
      socket.off('playerJoined');
      socket.off('playerLeft');
      socket.off('gameStarted');
      socket.off('wordChoices');
      socket.off('roundStarted');
      socket.off('roundEnded');
      socket.off('gameEnded');
      socket.off('yourWord');
      socket.off('chatMessage');
      socket.off('timerTick');
      socket.off('error');

      socket.disconnect();
    };
  }, [activeUser, roomId, socket, navigate, requestedRole]);

  const isDrawer = roomState?.currentDrawer?.socketId === socket.id;
  const isHost = roomState?.isHost;

  if (loading) {
    return (
      <main className="game-page-modern" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>Loading game session...</p>
      </main>
    );
  }

  const currentDrawerId = roomState?.currentDrawer?.socketId;
  const sortedPlayers = [...(roomState?.players || [])].sort((a, b) => (b.score || 0) - (a.score || 0));

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const currentWordDisplay = roomState?.currentWord || roomState?.selectedWord;

  return (
    <div className="game-page-modern">
      {/* 1. Global Navbar */}
      <header className="game-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/lobby" className="game-navbar-logo" title="Back to Lobby">
            <span style={{ fontSize: '24px', fontWeight: 900, color: '#1a64ff', letterSpacing: '-0.5px' }}>
              Squiggle 🎨
            </span>
          </Link>
          <button className="leave-room-btn" onClick={() => navigate('/lobby')}>
            ← Leave
          </button>
        </div>

        <div className="game-navbar-links">
          {/* Persistent Room Code Display */}
          <div className="room-code-display">
            <span className="room-code-label">Room Code:</span>
            <span className="room-code-value">{roomId}</span>
          </div>

          {/* Copy Link Input & Button */}
          <div className="invite-link-box">
            <input type="text" readOnly value={window.location.href} className="invite-link-input" />
            <button className="invite-copy-btn" onClick={handleCopyInvite}>
              {copySuccess ? 'Copied! ✓' : 'Copy Link'}
            </button>
          </div>
        </div>

        <div className="game-navbar-profile">
          <span className="user-badge-name">{activeUser?.username || 'Player'}</span>
        </div>
      </header>

      {/* 2. Main 3-Column Grid */}
      <main className="game-main-content">
        {error && (
          <div className="game-error-banner">
            ⚠️ {error}
          </div>
        )}

        {/* LEFT COLUMN: Players & Leaderboard */}
        <aside className="game-left-col">
          <div className="players-header">
            Players ({roomState?.players?.length || 0})
          </div>
          <div className="players-list">
            {(roomState?.players || []).map((player) => {
              const isDrawing = player.socketId === currentDrawerId;
              const playerRankIndex = sortedPlayers.findIndex((p) => p.socketId === player.socketId);
              let medalEmoji = '';
              if (player.score > 0) {
                if (playerRankIndex === 0) medalEmoji = '🥇 ';
                else if (playerRankIndex === 1) medalEmoji = '🥈 ';
                else if (playerRankIndex === 2) medalEmoji = '🥉 ';
              }

              return (
                <div key={player.socketId || player.userId} className={`player-card-vertical ${isDrawing ? 'is-drawing' : ''}`}>
                  {isDrawing && (
                    <div className="player-drawing-icon" title="Drawing Now">
                      ✏️
                    </div>
                  )}
                  <div className="player-avatar-small">
                    <span>{(player.username || 'P').charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="player-info-vertical">
                    <span className="player-name-small" title={player.username}>
                      {medalEmoji}
                      {player.username} {player.isHost ? '(Host)' : ''}
                    </span>
                    <span className="player-score-small">{player.score || 0} pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* MIDDLE COLUMN: Round Header, Banners, Canvas */}
        <section className="game-mid-col">
          {/* Top Round Info Bar */}
          <div className="round-info-bar">
            <div className="round-info-text">
              <span className="round-count-badge">
                Round {roomState?.currentRound || 1} / {roomState?.settings?.rounds || 3}
              </span>
              <strong className="round-status-title">
                {roomState?.status === 'lobby'
                  ? 'Waiting for game to start...'
                  : isDrawer
                  ? '🎨 You are drawing!'
                  : `${roomState?.currentDrawer?.username || 'Drawer'} is drawing`}
              </strong>
            </div>

            {(roomState?.status === 'playing' || roomState?.status === 'wordSelection') && (
              <div className={`timer-bubble ${timeLeft <= 10 ? 'timer-warning' : ''}`}>
                <svg className="timer-clock-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                {timeLeft}s
              </div>
            )}
          </div>

          {/* Drawer Persistent Word Banner */}
          {isDrawer && roomState?.status === 'playing' && currentWordDisplay && (
            <div className="drawer-word-banner">
              <span className="banner-label">YOUR WORD TO DRAW:</span>
              <span className="banner-word">{currentWordDisplay}</span>
            </div>
          )}

          {/* Guesser Word Hint Banner */}
          {!isDrawer && roomState?.status === 'playing' && roomState?.wordHint && (
            <div className="guesser-hint-banner">
              <span className="hint-label">GUESS THE WORD:</span>
              <span className="hint-mask">{roomState.wordHint}</span>
              {roomState.wordLength && (
                <span className="hint-length">({roomState.wordLength} letters)</span>
              )}
            </div>
          )}

          {/* Drawing Canvas Container */}
          <div className="canvas-wrapper-relative">
            <DrawingCanvas socket={socket} roomId={roomId} isDrawer={isDrawer} status={roomState?.status} />

            {/* OVERLAY 1: Lobby Overlay (Waiting / Start Game) */}
            {roomState?.status === 'lobby' && (
              <div className="lobby-canvas-overlay">
                <h2>Game Lobby</h2>
                <p className="overlay-subtitle">
                  {(roomState?.players?.length || 0)} / {roomState?.settings?.maxPlayers || 8} Players Joined
                </p>
                {isHost ? (
                  <button
                    className="start-game-btn"
                    onClick={() => socket.emit('startGame', { roomId })}
                    disabled={(roomState?.players?.length || 0) < 2}
                  >
                    {(roomState?.players?.length || 0) < 2 ? 'Need at least 2 players to start' : '🚀 Start Game Now'}
                  </button>
                ) : (
                  <div className="waiting-host-box">
                    <span className="pulse-dot"></span>
                    <span>Waiting for room host to start the game...</span>
                  </div>
                )}
              </div>
            )}

            {/* OVERLAY 2: Word Selection Modal (Drawer only) */}
            {roomState?.wordChoices && isDrawer && roomState.status === 'wordSelection' && (
              <div className="word-selection-overlay">
                <div className="word-selection-card">
                  <h3>Choose a word to draw!</h3>
                  <div className="word-choices-grid">
                    {roomState.wordChoices.map((word) => (
                      <button
                        key={word}
                        className="word-choice-btn"
                        onClick={() => {
                          socket.emit('wordSelected', { roomId, word });
                          setRoomState((s) => ({ ...s, wordChoices: null, selectedWord: word, currentWord: word }));
                        }}
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                  <p className="auto-pick-timer">Auto-selecting in {timeLeft}s...</p>
                </div>
              </div>
            )}

            {/* OVERLAY 3: Round Ended Reveal */}
            {roomState?.status === 'roundEnding' && (
              <div className="round-ended-overlay">
                <div className="round-ended-card">
                  <h2>Round Completed! 🎉</h2>
                  <p className="revealed-word-label">The secret word was:</p>
                  <div className="revealed-word-box">{roomState.revealedWord || roomState.currentWord}</div>
                  <p className="next-round-countdown">Next round starting shortly...</p>
                </div>
              </div>
            )}

            {/* OVERLAY 4: Game Ended Podium */}
            {roomState?.status === 'finished' && (
              <div className="game-ended-overlay">
                <div className="game-ended-card">
                  <h2>🏆 Game Over!</h2>
                  <p className="winner-announcement">
                    Winner: <strong>{roomState.winner || sortedPlayers[0]?.username || 'Player'}</strong>!
                  </p>
                  <div className="podium-scores-list">
                    {sortedPlayers.slice(0, 5).map((p, idx) => (
                      <div key={p.socketId || idx} className="podium-player-row">
                        <span className="podium-rank">#{idx + 1}</span>
                        <span className="podium-name">{p.username}</span>
                        <span className="podium-score">{p.score || 0} pts</span>
                      </div>
                    ))}
                  </div>
                  <button className="start-game-btn" onClick={() => navigate('/lobby')} style={{ marginTop: '16px' }}>
                    Return to Lobby
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: Live Chat & Guess Input */}
        <aside className="game-right-col">
          <div className="chat-header">LIVE CHAT</div>

          <div className="chat-messages">
            {messages.map((message, index) => {
              const isSystem = message.type === 'system';
              const senderName = isSystem ? 'System' : message.username || message.sender || 'Unknown';

              if (isSystem) {
                return (
                  <div key={`${index}-${message.text}`} className="chat-message system">
                    {message.text}
                  </div>
                );
              }

              return (
                <div key={`${index}-${message.text}-${index}`} className="chat-message">
                  <div className="chat-message-header">
                    <span className="chat-message-name">{senderName}</span>
                  </div>
                  <div className="chat-message-bubble">{message.text}</div>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>

          <div className="chat-input-area">
            <form
              className="chat-form-modern"
              onSubmit={(e) => {
                e.preventDefault();
                const val = e.target.chatInput.value;
                if (!val.trim()) return;
                socket.emit('chatMessage', { roomId, text: val.trim() });
                e.target.chatInput.value = '';
              }}
            >
              <input name="chatInput" type="text" className="chat-input-modern" placeholder="Type a chat message..." />
              <button type="submit" className="chat-send-modern">
                Send
              </button>
            </form>
          </div>

          {/* Guess Section for Guessers / Info for Drawer */}
          {requestedRole !== 'spectator' && (
            <div className="guess-section-wrapper">
              {isDrawer ? (
                <div className="drawer-active-banner">
                  🎨 You are drawing! Watch player guesses in the chat above.
                </div>
              ) : (
                <form
                  className="guess-section"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!guess.trim()) return;
                    socket.emit('guessWord', { roomId, guess: guess.trim() });
                    setGuess('');
                  }}
                >
                  <input
                    type="text"
                    className="guess-input"
                    placeholder={roomState?.status === 'playing' ? 'Type your guess here...' : 'Waiting for game to start...'}
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    disabled={roomState?.status !== 'playing'}
                  />
                  <button type="submit" className="guess-submit-btn" disabled={roomState?.status !== 'playing' || !guess.trim()}>
                    Submit Guess →
                  </button>
                </form>
              )}
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}