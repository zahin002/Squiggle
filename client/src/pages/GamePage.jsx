import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import DrawingCanvas from '../components/DrawingCanvas';
import { useAuth } from '../context/AuthContext';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export default function GamePage() {
  const { roomId } = useParams();
  const { user, loginAsGuest } = useAuth();
  const [activeUser, setActiveUser] = useState(user);
  const [roomState, setRoomState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');

  const hasJoinedRef = useRef(false);

  const socket = useMemo(() => io(SERVER_URL, { autoConnect: false }), []);


  useEffect(() => {
    if (user) {
      setActiveUser(user);
      return;
    }
    setActiveUser(loginAsGuest());
  }, [user, loginAsGuest]);

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
      role: 'player',
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
    });

    socket.on('yourWord', ({ word }) => {
      setRoomState((s) => (s ? { ...s, selectedWord: word } : s));
    });

    socket.on('chatMessage', (message) => {
      setMessages((items) => [...items.slice(-30), message]);
    });

    socket.on('error', (payload) => {
      setError(payload.message || 'Something went wrong');
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
      socket.off('error');

      socket.disconnect();
    };
  }, [activeUser, roomId, socket]);

  const isDrawer = roomState?.currentDrawer?.socketId === socket.id;
  const isHost = roomState?.isHost;

  console.log('socket.id =', socket.id);
  console.log('currentDrawer =', roomState?.currentDrawer);
  console.log('isDrawer =', isDrawer);
  console.log('wordChoices =', roomState?.wordChoices);
  console.log('status =', roomState?.status);
  console.log('wordHint =', roomState?.wordHint);
  console.log('wordLength =', roomState?.wordLength);

  console.log("isHost =", isHost);

  console.log("room status =", roomState?.status);
  console.log("players count =", roomState?.players?.length);
  console.log("players =", roomState?.players);


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
          <DrawingCanvas socket={socket} roomId={roomId} isDrawer={isDrawer} />
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
            <button onClick={() => socket.emit('startGame', { roomId })}>Start Game</button>
          )}

          <h2>Room Log</h2>
          <div className="chat-log">
            {messages.map((message, index) => (
              <p key={`${message.text}-${index}`}>{message.text}</p>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}