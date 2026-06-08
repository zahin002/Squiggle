import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import RoomSetup from '../components/lobby/RoomSetup';
import { useAuth } from '../context/AuthContext';
import '../styles/Lobby.css'; // Import the new styles

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
    return <main className="lobby-container"><p>Loading player data...</p></main>;
  }

  return (
    <div className="lobby-container">
      <div className="lobby-card">
        <header className="lobby-header">
          <Link to="/">Squiggle</Link>
          <span className="lobby-header-user">
            {user ? `${user.username}${user.isGuest ? ' (Guest)' : ''}` : 'Guest ready'}
          </span>
        </header>

        <section className="lobby-grid">
          <RoomSetup />

          <div className="room-browser">
            <h2>Join by Code</h2>
            <div className="join-row">
              <div className="join-inputs">
                <input
                  placeholder="Enter 6-letter code"
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value)}
                  maxLength={6}
                />
                <select value={joinRole} onChange={e => setJoinRole(e.target.value)}>
                  <option value="player">Player</option>
                  <option value="spectator">Spectator</option>
                </select>
              </div>
              <button className="btn-join-main" onClick={() => joinRoom(joinCode)}>Join Game</button>
            </div>
            {error && <p className="error-text">{error}</p>}

            <h2>Open Games</h2>
            {rooms.length === 0 ? (
              <p style={{ color: '#888', fontWeight: 600 }}>No public games available right now. Why not create one?</p>
            ) : (
              <ul className="room-list">
                {rooms.map((room) => (
                  <li key={room.roomId}>
                    <div className="room-info">
                      <span className="room-code-display">{room.roomId}</span>
                      <span className="room-mode">Mode: {room.settings?.gameMode || 'standard'}</span>
                    </div>
                    <div className="room-actions">
                      <button className="btn-join" onClick={() => joinRoom(room.roomId, 'player')}>Join</button>
                      <button className="btn-spectate" onClick={() => joinRoom(room.roomId, 'spectator')}>Spectate</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
