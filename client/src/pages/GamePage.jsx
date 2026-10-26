import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import DrawingCanvas from '../components/DrawingCanvas';
import { useAuth } from '../context/AuthContext';
import useWebRTC from '../hooks/useWebRTC';
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

  const {
    isMuted,
    isForceMuted,
    remoteStreams,
    toggleMute,
  } = useWebRTC(socket, roomId, requestedRole, roomState?.players);

  useEffect(() => {
    if (loading) return;
    if (user) {
      setActiveUser(user);
      return;
    }
    setActiveUser(loginAsGuest());
  }, [user, loginAsGuest, loading]);

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
      setMessages((items) => [...items, { type: 'system', text: `Round over! Word was: "${word}"` }]);
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
      {/* Unified Compact Top Header Bar */}
      <header className="game-navbar-compact">
        {/* Left: Logo & Leave Button */}
        <div className="nav-left">
          <Link to="/lobby" className="nav-logo">
            Squiggle 🎨
          </Link>
          <button className="leave-btn" onClick={() => navigate('/lobby')}>
            ← Leave
          </button>
        </div>

        {/* Center: Live Round, Timer & Word Banner */}
        <div className="nav-center">
          <span className="round-badge">
            Round {roomState?.currentRound || 1}/{roomState?.settings?.rounds || 3}
          </span>

          {(roomState?.status === 'playing' || roomState?.status === 'wordSelection') && (
            <div className={`timer-bubble-compact ${timeLeft <= 10 ? 'warn' : ''}`}>
              ⏱️ {timeLeft}s
            </div>
          )}

          {/* Word / Hint Display in Navbar Center */}
          {isDrawer && roomState?.status === 'playing' && currentWordDisplay && (
            <div className="drawer-word-pill">
              <span>DRAW:</span>
              <strong>{currentWordDisplay}</strong>
            </div>
          )}

          {!isDrawer && roomState?.status === 'playing' && roomState?.wordHint && (
            <div className="guesser-hint-pill">
              <span>GUESS:</span>
              <strong className="hint-mask-text">{roomState.wordHint}</strong>
            </div>
          )}
        </div>

        {/* Right: Room Code, Copy Link, Mic, User */}
        <div className="nav-right">
          <div className="room-code-badge">
            <span>Code:</span>
            <strong>{roomId}</strong>
          </div>

          <button className="copy-link-btn" onClick={handleCopyInvite}>
            {copySuccess ? 'Copied! ✓' : 'Copy Link'}
          </button>

          {requestedRole !== 'spectator' && (
            <button
              className={`nav-mic-btn ${isForceMuted ? 'force-muted' : isMuted ? 'muted' : 'active'}`}
              onClick={toggleMute}
              disabled={isForceMuted}
              title={isForceMuted ? 'Muted by Host' : isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isForceMuted ? '🔇 Muted by Host' : isMuted ? '🔇 Mic Muted' : '🎤 Mic On'}
            </button>
          )}

          <span className="user-badge">{activeUser?.username || 'Player'}</span>
        </div>
      </header>

      {/* Main 3-Column Content (100vh - 48px) */}
      <main className="game-main-content">
        {error && <div className="game-error-banner">⚠️ {error}</div>}

        {/* LEFT SIDEBAR: Players */}
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
                  {isDrawing && <div className="player-drawing-icon" title="Drawing Now">✏️</div>}
                  <div className="player-avatar-small">
                    <span>{(player.username || 'P').charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="player-info-vertical">
                    <span className="player-name-small" title={player.username}>
                      {medalEmoji}{player.username} {player.isHost ? '(Host)' : ''}
                      <span className="player-mic-status-icon" style={{ marginLeft: '6px' }}>
                        {player.isMuted ? '🔇' : '🎤'}
                      </span>
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span className="player-score-small">{player.score || 0} pts</span>
                      
                      {/* Host controls to force mute other active players */}
                      {isHost && player.socketId !== socket.id && (
                        <button
                          className="btn-force-mute"
                          onClick={() => socket.emit('forceMuteUser', {
                            roomId,
                            targetSocketId: player.socketId,
                            mute: !player.isMuted
                          })}
                        >
                          {player.isMuted ? '🔊 Unmute' : '🔇 Mute'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* CENTER COLUMN: Canvas & Canvas Overlays (NO SCROLLING) */}
        <section className="game-mid-col">
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
                    {(roomState?.players?.length || 0) < 2 ? 'Need 2+ players to start' : '🚀 Start Game Now'}
                  </button>
                ) : (
                  <div className="waiting-host-box">
                    <span className="pulse-dot" />
                    <span>Waiting for room host to start...</span>
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
                  <p className="auto-pick-timer">Auto-picking in {timeLeft}s...</p>
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
                  <button className="start-game-btn" onClick={() => navigate('/lobby')} style={{ marginTop: '12px' }}>
                    Return to Lobby
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT SIDEBAR: Live Chat & Guess Input */}
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
              <input name="chatInput" type="text" className="chat-input-modern" placeholder="Type a message..." />
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
                  🎨 You are drawing! Watch guesses above.
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
                    placeholder={roomState?.status === 'playing' ? 'Type your guess here...' : 'Waiting to start...'}
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

      {/* Hidden WebRTC Remote Audio Elements */}
      {Object.entries(remoteStreams).map(([socketId, stream]) => {
        if (!stream) return null;
        return (
          <audio
            key={socketId}
            ref={(el) => {
              if (el) {
                el.srcObject = stream;
                el.volume = 1.0;
              }
            }}
            autoPlay
            playsInline
            muted={false}
            style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
          />
        );
      })}
    </div>
  );
}