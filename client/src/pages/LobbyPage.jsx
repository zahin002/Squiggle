import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import RoomSetup from '../components/lobby/RoomSetup';
import { useAuth } from '../context/AuthContext';
import {
  FaGamepad,
  FaTrophy,
  FaUser,
  FaHashtag,
  FaArrowRight,
  FaEye,
  FaPaintBrush,
  FaLock,
  FaGlobe,
} from 'react-icons/fa';
import '../styles/Lobby.css';

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
    return (
      <div className="lobby-page">
        <div className="lobby-bg" aria-hidden="true" />
        <div className="lobby-loading">
          <div className="lobby-spinner" />
          <p>Loading player data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lobby-page">
      {/* Fixed background layers */}
      <div className="lobby-bg" aria-hidden="true" />
      <div className="lobby-bg-icons" aria-hidden="true">
        <FaPaintBrush className="lobby-doodle" />
        <FaGamepad   className="lobby-doodle" />
        <FaTrophy    className="lobby-doodle" />
        <FaHashtag   className="lobby-doodle" />
        <FaLock      className="lobby-doodle" />
        <FaGlobe     className="lobby-doodle" />
        <FaPaintBrush className="lobby-doodle" />
        <FaGamepad   className="lobby-doodle" />
      </div>

      {/* Scrollable content */}
      <div className="lobby-content">

        {/* Header */}
        <header className="lobby-header">
          <Link to="/" className="lobby-brand">
            <svg className="lobby-brand-icon" viewBox="0 0 100 100" fill="none" stroke="url(#lobbyGrad)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="lobbyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7c4dff" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
              <path d="M10 60 C 10 20, 50 20, 40 50 C 30 80, 70 80, 60 50 C 50 20, 90 20, 90 60" />
            </svg>
            <span className="lobby-brand-text">Squiggle</span>
          </Link>

          <div className="lobby-header-right">
            <button className="lobby-nav-btn lobby-nav-btn--trophy" onClick={() => navigate('/leaderboard')}>
              <FaTrophy className="lobby-nav-icon" /> Leaderboard
            </button>

            {user && !user.isGuest ? (
              <button className="lobby-nav-btn lobby-nav-btn--profile" onClick={() => navigate('/profile')}>
                <FaUser className="lobby-nav-icon" /> {user.username}
              </button>
            ) : (
              <span className="lobby-user-badge">
                <FaUser className="lobby-nav-icon" />
                {user ? `${user.username} (Guest)` : 'Guest'}
              </span>
            )}
          </div>
        </header>

        {/* Two-column grid */}
        <section className="lobby-grid">
          <RoomSetup />

          {/* Join / Browse panel */}
          <div className="lobby-panel lobby-panel--join">
            <h2 className="lobby-panel-title">
              <FaHashtag className="panel-title-icon panel-title-icon--sky" />
              Join by Code
            </h2>

            <div className="join-row">
              <div className="join-inputs">
                <input
                  className="join-code-input"
                  placeholder="XXXXXX"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  maxLength={6}
                />
                <select
                  className="join-role-select"
                  value={joinRole}
                  onChange={(e) => setJoinRole(e.target.value)}
                >
                  <option value="player">Player</option>
                  <option value="spectator">Spectator</option>
                </select>
              </div>
              <button className="btn-join-main" onClick={() => joinRoom(joinCode)}>
                <FaArrowRight className="btn-icon-sm" /> Join Game
              </button>
            </div>

            {error && <p className="lobby-error">{error}</p>}

            <h2 className="lobby-panel-title lobby-panel-title--open">
              <FaGlobe className="panel-title-icon panel-title-icon--green" />
              Open Games
            </h2>

            {rooms.length === 0 ? (
              <div className="rooms-empty">
                <FaGamepad className="rooms-empty-icon" />
                <p>No public games right now.</p>
                <p className="rooms-empty-sub">Create a room and invite friends!</p>
              </div>
            ) : (
              <ul className="room-list">
                {rooms.map((room) => (
                  <li key={room.roomId} className="room-item">
                    <div className="room-info">
                      <span className="room-code-display">
                        <FaHashtag className="room-hash" />{room.roomId}
                      </span>
                      <span className="room-mode">
                        {room.settings?.isPrivate ? <FaLock className="room-mode-icon" /> : <FaGlobe className="room-mode-icon" />}
                        {room.settings?.gameMode || 'standard'}
                      </span>
                    </div>
                    <div className="room-actions">
                      <button className="btn-room-join" onClick={() => joinRoom(room.roomId, 'player')}>
                        <FaArrowRight /> Join
                      </button>
                      <button className="btn-room-spectate" onClick={() => joinRoom(room.roomId, 'spectator')}>
                        <FaEye /> Spectate
                      </button>
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
