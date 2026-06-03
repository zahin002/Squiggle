import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import RoomSetup from '../components/lobby/RoomSetup';
import { useAuth } from '../context/AuthContext';

export default function LobbyPage() {
  const [rooms, setRooms] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const { user, loginAsGuest } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/rooms')
      .then((res) => setRooms(res.data))
      .catch(() => setRooms([]));
  }, []);

  const ensureUser = () => user || loginAsGuest();

  const joinRoom = async (roomId) => {
    const normalized = roomId.trim().toUpperCase();
    if (!normalized) return;

    setError('');
    try {
      ensureUser();
      await axios.get(`/api/rooms/${normalized}`);
      navigate(`/game/${normalized}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not join that room');
    }
  };

  return (
    <main className="page lobby-page">
      <header className="page-header">
        <Link to="/">Squiggle</Link>
        <span>{user ? `${user.username}${user.isGuest ? ' (Guest)' : ''}` : 'Guest ready'}</span>
      </header>

      <section className="lobby-grid">
        <RoomSetup />

        <div className="room-browser">
          <h2>Join Room</h2>
          <div className="join-row">
            <input
              placeholder="Room code"
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value)}
            />
            <button onClick={() => joinRoom(joinCode)}>Join</button>
          </div>
          {error && <p className="error">{error}</p>}

          <h2>Public Rooms</h2>
          {rooms.length === 0 ? (
            <p>No public rooms yet.</p>
          ) : (
            <ul className="room-list">
              {rooms.map((room) => (
                <li key={room.roomId}>
                  <span>{room.roomId}</span>
                  <span>{room.settings?.gameMode || 'standard'}</span>
                  <button onClick={() => joinRoom(room.roomId)}>Join</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
