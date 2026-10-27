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
  FaPencilAlt,
  FaPalette,
  FaLightbulb,
  FaQuestion,
  FaDice,
  FaSmile,
  FaCrown,
  FaStar,
  FaCoins,
  FaGem,
  FaBolt,
  FaEraser,
  FaComments
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
    const fetchRooms = () => {
      axios.get('/api/rooms')
        .then((res) => setRooms(res.data))
        .catch(() => setRooms([]));
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
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
      {/* Fixed background layers with vibrant floating doodle icons */}
      <div className="lobby-bg" aria-hidden="true" />
      <div className="lobby-bg-icons" aria-hidden="true">
        <span className="lobby-doodle lobby-doodle--1"><FaPencilAlt /></span>
        <span className="lobby-doodle lobby-doodle--2"><FaPaintBrush /></span>
        <span className="lobby-doodle lobby-doodle--3"><FaPalette /></span>
        <span className="lobby-doodle lobby-doodle--4"><FaLightbulb /></span>
        <span className="lobby-doodle lobby-doodle--5"><FaQuestion /></span>
        <span className="lobby-doodle lobby-doodle--6"><FaGamepad /></span>
        <span className="lobby-doodle lobby-doodle--7"><FaDice /></span>
        <span className="lobby-doodle lobby-doodle--8"><FaSmile /></span>
        <span className="lobby-doodle lobby-doodle--9"><FaTrophy /></span>
        <span className="lobby-doodle lobby-doodle--10"><FaCrown /></span>
        <span className="lobby-doodle lobby-doodle--11"><FaStar /></span>
        <span className="lobby-doodle lobby-doodle--12"><FaCoins /></span>
        <span className="lobby-doodle lobby-doodle--13"><FaGem /></span>
        <span className="lobby-doodle lobby-doodle--14"><FaBolt /></span>
        <span className="lobby-doodle lobby-doodle--15"><FaEraser /></span>
        <span className="lobby-doodle lobby-doodle--16"><FaComments /></span>
      </div>

      {/* Scrollable content */}
      <div className="lobby-content">

        {/* Header */}
        <header className="lobby-header">
          <Link to="/" className="lobby-brand" title="Squiggle Home">
            <img
              src="/squiggle-wordmark.png"
              alt="Squiggle"
              className="lobby-brand-logo-img"
            />
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
              Join By Code
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
