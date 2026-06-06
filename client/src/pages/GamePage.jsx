import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import DrawingCanvas from '../components/DrawingCanvas';
import { useAuth } from '../context/AuthContext';

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
  const isHost = roomState?.isHost;

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
    return <main className="page"><p>Loading player data...</p></main>;
  }

  return (
    <main className="page game-page">
      <header className="page-header">
        <Link to="/lobby">Lobby</Link>
        <span>Room {roomId}</span>
        <span>{activeUser?.username}</span>
      </header>

      {error && <p className="error">{error}</p>}

      <section className="game-layout">
        <div className="canvas-panel">
          <div className="round-bar">
            <strong>{isDrawer ? 'You are drawing' : `${roomState?.currentDrawer?.username || 'Waiting'} is drawing`}</strong>

            {(roomState?.status === 'playing' || roomState?.status === 'wordSelection') && (
              <div className="timer">⏱️ {timeLeft}s</div>
            )}

            {!isDrawer && roomState?.status === 'wordSelection' && (
              <div className="word-selection-overlay" style={{ marginTop: '10px', color: '#666' }}>
                <h2>{roomState.currentDrawer?.username} is choosing a word...</h2>
              </div>
            )}

            {!isDrawer &&
              roomState?.status === 'playing' &&
              roomState?.wordHint && (
                <div className="word-hint">
                  <h2>{roomState.wordHint}</h2>
                  <p>{roomState.wordLength} letters</p>
                </div>
              )}

            {isDrawer &&
              roomState?.selectedWord && (
                <div className="selected-word">
                  Word: {roomState.selectedWord}
                </div>
              )}


            {/* --- Replaced: Plain text choices replaced with interactive selection buttons --- */}

            {roomState?.wordChoices && isDrawer && roomState.status === 'wordSelection' && (
              <div className="word-choices">
                {roomState.wordChoices.map((word) => (
                  <button key={word} onClick={() => {
                    socket.emit('wordSelected', { roomId, word });
                    setRoomState((s) => ({ ...s, wordChoices: null }));
                  }}>
                    {word}
                  </button>
                ))}
              </div>
            )}
          </div>
          <DrawingCanvas socket={socket} roomId={roomId} isDrawer={isDrawer} status={roomState?.status} />
        </div>

        <aside className="side-panel">
          <h2>Players</h2>
          <ul className="player-list">
            {(roomState?.players || []).map((player) => (
              <li key={player.socketId}>
                <span>{player.username}{player.isGuest ? ' (Guest)' : ''}</span>
                <strong>{player.score}</strong>
              </li>
            ))}
          </ul>

          {isHost && roomState?.status === 'lobby' && (
            <button 
              onClick={() => socket.emit('startGame', { roomId })}
              disabled={(roomState?.players?.length || 0) < 2}
              title={(roomState?.players?.length || 0) < 2 ? "Need at least 2 players to start" : ""}
            >
              Start Game
            </button>
          )}

          <h2>Room Log</h2>
          <div className="chat-log">
            {messages.map((message, index) => (
              <p key={`${message.text}-${index}`}>{message.text}</p>
            ))}
          </div>

          {!isDrawer && requestedRole !== 'spectator' && roomState?.status === 'playing' && (
            <form className="chat-form" onSubmit={(e) => {
              e.preventDefault();
              if (!guess.trim()) return;
              socket.emit('guessWord', { roomId, guess: guess.trim() });
              setGuess('');
            }} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <input 
                type="text" 
                placeholder="Type your guess here..." 
                value={guess} 
                onChange={e => setGuess(e.target.value)} 
                style={{ flex: 1 }}
              />
              <button type="submit">Send</button>
            </form>
          )}
        </aside>
      </section>
    </main>
  );
}