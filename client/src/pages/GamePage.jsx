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

  const hasJoinedRef = useRef(false);

  const socket = useMemo(() => io(SERVER_URL, { autoConnect: false }), []);


  useEffect(() => {
    if (loading) return;
    if (user) {
      setActiveUser(user);
      return;
    }
    setActiveUser(loginAsGuest());
  }, [user, loginAsGuest, loading]);

  useEffect(() => {
    if (!activeUser) return;

    if (hasJoinedRef.current) return;

    hasJoinedRef.current = true;

    socket.connect();
    console.log('[CLIENT JOIN ROOM EMIT]', {
      roomId,
      socketId: socket.id,
      time: Date.now()
    });

    console.log(
      '[CLIENT JOIN ROOM EMIT]',
      Date.now()
    );

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
      setRoomState(prev => ({
        ...prev,
        ...state,
      }));
      
      if (state?.timeLeft !== undefined) {
        setTimeLeft(state.timeLeft);
      }

      // HYDRATE MESSAGES FROM SERVER LOG HISTORY
      if (state?.chatHistory) {
        setMessages(state.chatHistory);
      }
    });



    socket.on('connect', () => {
      socket.emit('requestCanvasState', { roomId });
    });


    socket.on('playerJoined', ({ players }) => {
      console.log('PLAYER_JOINED EVENT');
      console.log('received players =', players);
      console.log('received count =', players?.length);

      setRoomState((state) =>
      state ? { ...state, players } : state
      );
    });
    socket.on('playerLeft', ({ players }) => {
      setRoomState((state) => state ? { ...state, players } : state);
    });
    socket.on('gameStarted', ({ message }) => {
      setMessages((items) => [...items, { type: 'system', text: message }]);
    });
    
    // --- Added: wordChoices Listener ---
    socket.on('wordChoices', ({ choices }) => {
      setRoomState((s) => s ? { ...s, wordChoices: choices, status: 'wordSelection' } : s);
    });

    socket.on('roundStarted', (round) => {
      setRoomState((state) => state ? { ...state, status: 'playing', ...round } : state);
      if (round?.timeLeft !== undefined) setTimeLeft(round.timeLeft);
    });

    socket.on('timerTick', ({ timeLeft, wordHint }) => {
      setTimeLeft(timeLeft);
      if (wordHint) {
        setRoomState((s) => (s ? { ...s, wordHint } : s));
      }
    });

    socket.on('yourWord', ({ word }) => {
      setRoomState((s) => (s ? { ...s, selectedWord: word } : s));
    });

    socket.on('chatMessage', (message) => {
      setMessages((items) => [...items.slice(-30), message]);
    });

    socket.on('error', (payload) => {
      setError(payload.message || 'Something went wrong');
      if (payload.message && payload.message.includes('All players have left')) {
        setTimeout(() => navigate('/lobby'), 2000);
      }
    });

    return () => {
      socket.off('roomState');
      socket.off('playerJoined');
      socket.off('playerLeft');
      socket.off('gameStarted');
      socket.off('wordChoices');
      socket.off('roundStarted');
      socket.off('yourWord');
      socket.off('chatMessage');
      socket.off('timerTick');
      socket.off('error');

      socket.disconnect();
    };
  }, [activeUser, roomId, socket]);

  const isDrawer = roomState?.currentDrawer?.socketId === socket.id;
  const isHost = roomState?.isHost || roomState?.players?.some(p => p.socketId === socket.id && p.isHost);

  useEffect(() => {
    // Avoid logging socket.id before Socket.IO finishes connecting.
    const log = () => {
      console.log('socket.id =', socket?.id);
      console.log('currentDrawer =', roomState?.currentDrawer);
      console.log('isDrawer =', isDrawer);
      console.log('wordChoices =', roomState?.wordChoices);
      console.log('status =', roomState?.status);
      console.log('wordHint =', roomState?.wordHint);
      console.log('wordLength =', roomState?.wordLength);
      console.log('isHost =', isHost);
      console.log('room status =', roomState?.status);
      console.log('players count =', roomState?.players?.length);
      console.log('players =', roomState?.players);
    };

    if (socket?.connected) {
      log();
      return;
    }

    socket?.on?.('connect', log);
    return () => {
      socket?.off?.('connect', log);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, roomState, isDrawer, isHost]);



  if (loading) {
    return <main className="game-page-modern"><p>Loading player data...</p></main>;
  }

  const currentDrawerId = roomState?.currentDrawer?.socketId;
  
  // Sort players by score descending
  const sortedPlayers = [...(roomState?.players || [])].sort((a, b) => (b.score || 0) - (a.score || 0));
  
  const handleCopyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    // Could add a toast notification here
  };

  return (
    <div className="game-page-modern">
      {/* 1. Global Navbar */}
      <nav className="game-navbar">
        <Link to="/" className="game-navbar-logo">
          <img src="/Top Corner Logo.png" alt="Squiggle Logo" />
        </Link>
        <div className="game-navbar-links">
          <a href="#">Leaderboard</a>
          <a href="#">Shop</a>
          
          <div className="invite-link-box">
            <span className="invite-link-text">{window.location.href}</span>
            <button className="invite-copy-btn" onClick={handleCopyInvite}>Copy</button>
          </div>
        </div>
        <div className="game-navbar-profile">
          <svg viewBox="0 0 24 24" fill="#0f172a" width="24" height="24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
      </nav>

      <main className="game-main-content">
        {error && <p style={{color: 'red', fontWeight: 'bold', textAlign: 'center', gridColumn: '1 / -1'}}>{error}</p>}

        {/* LEFT COLUMN: Players */}
        <aside className="game-left-col">
          <div className="players-header">
            Players ({roomState?.players?.length || 0})
          </div>
          <div className="players-list">
            {(roomState?.players || []).map((player) => {
              const isDrawing = player.socketId === currentDrawerId;
              return (
                <div key={player.socketId} className={`player-card-vertical ${isDrawing ? 'is-drawing' : ''}`}>
                  {isDrawing && (
                    <div className="player-drawing-icon" title="Drawing">
                      ✏️
                    </div>
                  )}
                  <div className="player-avatar-small">
                    <svg viewBox="0 0 100 100" fill="#cbd5e1" width="100%" height="100%">
                      <circle cx="50" cy="40" r="20" fill="#94a3b8" />
                      <path d="M20 100 Q 50 60 80 100" fill="#94a3b8" />
                    </svg>
                  </div>
                  <div className="player-info-vertical">
                    <span className="player-name-small" title={player.username}>
                      {player.score > 0 && sortedPlayers.findIndex(p => p.socketId === player.socketId) === 0 ? '🥇 ' : ''}
                      {player.score > 0 && sortedPlayers.findIndex(p => p.socketId === player.socketId) === 1 ? '🥈 ' : ''}
                      {player.score > 0 && sortedPlayers.findIndex(p => p.socketId === player.socketId) === 2 ? '🥉 ' : ''}
                      {player.username} {player.isHost ? '(Host)' : ''}
                    </span>
                    <span className="player-score-small">{player.score || 0} pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* MIDDLE COLUMN: Canvas & Guess */}
        <section className="game-mid-col">
          
          {/* Round Info Bar */}
          <div className="round-info-bar">
            <strong style={{fontSize: '16px', fontWeight: 800, color: '#0f172a'}}>
              {roomState?.status === 'lobby' 
                ? 'Waiting for players...' 
                : isDrawer 
                  ? 'You are drawing!' 
                  : `${roomState?.currentDrawer?.username || 'Waiting'} is drawing...`
              }
            </strong>

            {(roomState?.status === 'playing' || roomState?.status === 'wordSelection') && (
              <div className="timer-bubble">
                <svg className="timer-clock-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                {timeLeft}s
              </div>
            )}
          </div>

          {/* Word Selection (Drawer only) */}
          {roomState?.wordChoices && isDrawer && roomState.status === 'wordSelection' && (
            <div style={{display: 'flex', gap: '10px', background: '#fff', padding: '16px', borderRadius: '16px', border: '3px solid #0f172a'}}>
              <h3 style={{margin: 0, alignSelf: 'center', marginRight: '10px'}}>Choose a word:</h3>
              {roomState.wordChoices.map((word) => (
                <button 
                  key={word} 
                  className="guess-submit-btn" 
                  style={{padding: '8px 16px', borderRadius: '8px'}}
                  onClick={() => {
                    socket.emit('wordSelected', { roomId, word });
                    setRoomState((s) => ({ ...s, wordChoices: null }));
                  }}
                >
                  {word}
                </button>
              ))}
            </div>
          )}

          {/* Word Hint (Guessers only) */}
          {!isDrawer && roomState?.status === 'playing' && roomState?.wordHint && (
            <div style={{background: '#0f172a', color: '#fff', padding: '12px', borderRadius: '16px', textAlign: 'center', letterSpacing: '4px', fontSize: '24px', fontWeight: 'bold'}}>
              {roomState.wordHint}
            </div>
          )}

          {/* Drawing Canvas and Overlay Component */}
          <div style={{ position: 'relative' }}>
            <DrawingCanvas socket={socket} roomId={roomId} isDrawer={isDrawer} status={roomState?.status} />
            
            {/* Start Game Overlay (Lobby) */}
            {roomState?.status === 'lobby' && (
              <div className="lobby-canvas-overlay">
                <h2>Waiting for other players...</h2>
                {isHost ? (
                  <button 
                    className="start-game-btn"
                    onClick={() => socket.emit('startGame', { roomId })}
                    disabled={(roomState?.players?.length || 0) < 2}
                  >
                    Start Game Now!
                  </button>
                ) : (
                  <p style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 'bold' }}>
                    Waiting for the host to start the game.
                  </p>
                )}
              </div>
            )}
          </div>

        </section>

        {/* RIGHT COLUMN: Live Chat */}
        <aside className="game-right-col">
          <div className="chat-header">
            LIVE CHAT
          </div>
          
          <div className="chat-messages">
            {messages.map((message, index) => {
              const isSystem = message.type === 'system';
              const senderName = isSystem ? 'System' : (message.username || message.sender || 'Unknown');
              
              if (isSystem) {
                return (
                  <div key={`${index}-${message.time || index}`} className="chat-message system">
                    {message.text}
                  </div>
                );
              }

              return (
                <div key={`${index}-${message.time || index}`} className="chat-message">
                  <div className="chat-message-header">
                    <span className="chat-message-name">{senderName}</span>
                  </div>
                  <div className="chat-message-bubble">
                    {message.text}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="chat-input-area">
            <form className="chat-form-modern" onSubmit={(e) => {
              e.preventDefault();
              const val = e.target.chatInput.value;
              if (!val.trim()) return;
              socket.emit('chatMessage', { roomId, text: val.trim() });
              e.target.chatInput.value = '';
            }}>
              <input 
                name="chatInput"
                type="text" 
                className="chat-input-modern"
                placeholder="Type a message..." 
              />
              <button type="submit" className="chat-send-modern">Send</button>
            </form>
          </div>

          {/* Guess The Word Section (Moved to right column) */}
          {!isDrawer && requestedRole !== 'spectator' && (
            <form 
              className="guess-section" 
              style={{ padding: '0 16px 16px 16px' }}
              onSubmit={(e) => {
                e.preventDefault();
                if (!guess.trim()) return;
                socket.emit('guessWord', { roomId, guess: guess.trim() });
                setGuess('');
              }}
            >
              <div className="guess-input-wrapper" style={{ flexDirection: 'column' }}>
                <input 
                  type="text" 
                  className="guess-input"
                  placeholder={roomState?.status === 'playing' ? "Type your guess here..." : "Waiting for game to start..."}
                  value={guess} 
                  onChange={e => setGuess(e.target.value)} 
                  disabled={roomState?.status !== 'playing'}
                />
                <button type="submit" className="guess-submit-btn" disabled={roomState?.status !== 'playing'} style={{ padding: '12px', width: '100%' }}>
                  Submit Guess →
                </button>
              </div>
            </form>
          )}
        </aside>

      </main>
    </div>
  );
}