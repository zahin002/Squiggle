import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import RoomSetup from '../components/lobby/RoomSetup';
import { useAuth } from '../context/AuthContext';

export default function LobbyPage() {
  const [rooms, setRooms] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [joinRole, setJoinRole] = useState('player');
  const [error, setError] = useState('');
  const { user, loginAsGuest, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/rooms')
      .then((res) => setRooms(res.data))
      .catch(() => setRooms([]));
  }, []);

  const ensureUser = () => {
    if (loading) return null;
    return user || loginAsGuest();
  };

  const joinRoom = async (roomId, role = joinRole) => {
    const normalized = roomId.trim().toUpperCase();
    if (!normalized) return;

    setError('');
    try {
      ensureUser();
      await axios.get(`/api/rooms/${normalized}`);
      navigate(`/game/${normalized}`, { state: { role } });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not join that room');
    }
  };

  if (loading) {
    return <main className="page"><p>Loading player data...</p></main>;
  }

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
            <select value={joinRole} onChange={e => setJoinRole(e.target.value)} style={{ padding: '8px', marginLeft: '8px' }}>
              <option value="player">As Player</option>
              <option value="spectator">As Spectator</option>
            </select>
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
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => joinRoom(room.roomId, 'player')}>Join</button>
                    <button onClick={() => joinRoom(room.roomId, 'spectator')} className="secondary">Spectate</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
