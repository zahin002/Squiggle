import { useEffect, useMemo, useState } from 'react';
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

  const socket = useMemo(() => io(SERVER_URL, { autoConnect: false }), []);

  useEffect(() => {
    if (user) {
      setActiveUser(user);
      return;
    }

    setActiveUser(loginAsGuest());
  }, [user, loginAsGuest]);

  useEffect(() => {
    if (!activeUser) return undefined;

    socket.connect();

    // DEBUG
    socket.on('connect', () => {
      console.log('SOCKET CONNECTED:', socket.id);
    });

    console.log('EMITTING joinRoom:', {
      roomId,
      username: activeUser.username,
      isGuest: !!activeUser.isGuest,
    });

    socket.emit('joinRoom', {
      roomId,
      token: localStorage.getItem('token'),
      username: activeUser.username,
      role: 'player',
      isGuest: !!activeUser.isGuest,
    });

    socket.on('roomState', (state) => {
      console.log('ROOM STATE RECEIVED:', state);

      setRoomState(state);

      socket.emit('requestCanvasState', { roomId });
    });

    socket.on('playerJoined', ({ players }) => {
      console.log('PLAYER JOINED EVENT:', players);

      setRoomState((state) =>
        state ? { ...state, players } : state
      );
    });

    socket.on('playerLeft', ({ players }) => {
      console.log('PLAYER LEFT EVENT:', players);

      setRoomState((state) =>
        state ? { ...state, players } : state
      );
    });

    socket.on('gameStarted', ({ message }) => {
      console.log('GAME STARTED:', message);

      setMessages((items) => [
        ...items,
        { type: 'system', text: message },
      ]);
    });

    socket.on('roundStarted', (round) => {
      console.log('ROUND STARTED:', round);

      setRoomState((state) =>
        state
          ? {
              ...state,
              status: 'playing',
              ...round,
            }
          : state
      );
    });

    socket.on('chatMessage', (message) => {
      console.log('CHAT MESSAGE:', message);

      setMessages((items) => [
        ...items.slice(-30),
        message,
      ]);
    });

    socket.on('error', (payload) => {
      console.error('SOCKET ERROR:', payload);

      setError(payload.message || 'Something went wrong');
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [activeUser, roomId, socket]);

  const isDrawer =
    roomState?.currentDrawer?.socketId === socket.id;

  const isHost = roomState?.isHost;

  // DEBUG
  console.log('CURRENT ROOM STATE:', roomState);
  console.log('IS HOST:', isHost);
  console.log('IS DRAWER:', isDrawer);

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
            <strong>
              {isDrawer
                ? 'You are drawing'
                : `${roomState?.currentDrawer?.username || 'Waiting'} is drawing`}
            </strong>

            {roomState?.wordChoices && isDrawer && (
              <span>
                Choices: {roomState.wordChoices.join(', ')}
              </span>
            )}
          </div>

          <DrawingCanvas
            socket={socket}
            roomId={roomId}
            isDrawer={isDrawer}
          />
        </div>

        <aside className="side-panel">
          <h2>Players</h2>

          <ul className="player-list">
            {(roomState?.players || []).map((player) => (
              <li key={player.socketId}>
                <span>
                  {player.username}
                  {player.isGuest ? ' (Guest)' : ''}
                </span>

                <strong>{player.score}</strong>
              </li>
            ))}
          </ul>

          {isHost && roomState?.status === 'lobby' && (
            <button
              onClick={() => {
                console.log('START GAME CLICKED');

                socket.emit('startGame', { roomId });
              }}
            >
              Start Game
            </button>
          )}

          <h2>Room Log</h2>

          <div className="chat-log">
            {messages.map((message, index) => (
              <p key={`${message.text}-${index}`}>
                {message.text}
              </p>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}