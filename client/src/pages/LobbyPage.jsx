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
import {
  LuInfo,
  LuUsers,
  LuClock,
  LuTrophy,
  LuMic,
  LuMicOff,
  LuZap,
  LuGamepad2,
  LuHash,
  LuLock,
  LuGlobe,
  LuArrowRight,
  LuEye
} from 'react-icons/lu';
import '../styles/Lobby.css';

export default function LobbyPage() {
  const [rooms, setRooms] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [joinRole, setJoinRole] = useState('player');
  const [error, setError] = useState('');
  const [expandedRoomId, setExpandedRoomId] = useState(null);
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
        <span className="lobby-doodle lobby-doodle--2"><FaLightbulb /></span>
        <span className="lobby-doodle lobby-doodle--3"><FaPalette /></span>
        <span className="lobby-doodle lobby-doodle--4"><FaGamepad /></span>
        <span className="lobby-doodle lobby-doodle--5"><FaSmile /></span>
        <span className="lobby-doodle lobby-doodle--6"><FaEraser /></span>
        <span className="lobby-doodle lobby-doodle--7"><FaCrown /></span>
        <span className="lobby-doodle lobby-doodle--8"><FaComments /></span>
        <span className="lobby-doodle lobby-doodle--9"><FaPaintBrush /></span>
        <span className="lobby-doodle lobby-doodle--10"><FaQuestion /></span>
        <span className="lobby-doodle lobby-doodle--11"><FaStar /></span>
        <span className="lobby-doodle lobby-doodle--12"><FaDice /></span>
        <span className="lobby-doodle lobby-doodle--13"><FaTrophy /></span>
        <span className="lobby-doodle lobby-doodle--14"><FaGem /></span>
        <span className="lobby-doodle lobby-doodle--15"><FaBolt /></span>
        <span className="lobby-doodle lobby-doodle--16"><FaCoins /></span>
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
              <LuHash className="panel-title-icon panel-title-icon--sky" />
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
                <LuArrowRight className="btn-icon-sm" /> Join Game
              </button>
            </div>

            {error && <p className="lobby-error">{error}</p>}

            <h2 className="lobby-panel-title lobby-panel-title--open">
              <LuGlobe className="panel-title-icon panel-title-icon--cyan" />
              Open Games
            </h2>

            {rooms.length === 0 ? (
              <div className="rooms-empty">
                <LuGamepad2 className="rooms-empty-icon" />
                <p>No public games right now.</p>
                <p className="rooms-empty-sub">Create a room and invite friends!</p>
              </div>
            ) : (
              <div className="room-list-scroll-container">
                <ul className="room-list">
                  {rooms.map((room) => {
                    const isExpanded = expandedRoomId === room.roomId;
                    const isVoiceEnabled = room.settings?.voiceChatEnabled === true;
                    const isPowerupsEnabled = room.settings?.powerupsEnabled !== false;
                    const gameMode = room.settings?.gameMode || 'standard';
                    const currentPlayers = room.playerCount || room.players?.length || 1;
                    const maxPlayers = room.settings?.maxPlayers || 8;
                    const drawTime = room.settings?.drawTime || 80;
                    const rounds = room.settings?.rounds || 3;

                    return (
                      <li key={room.roomId} className={`room-item ${isExpanded ? 'is-expanded' : ''}`}>
                        <div className="room-item-row">
                          {/* ── LEFT: Room identification ── */}
                          <div className="room-ident-group">
                            <div className="room-code-tag">
                              <span className="room-hash">#</span>
                              <span className="room-code-gradient">{room.roomId}</span>
                            </div>
                            <span className="room-mode-subtle">{gameMode}</span>
                          </div>

                          {/* ── CENTER: Status icons ── */}
                          <div className="room-status-group">
                            <span
                              className={`room-status-ico-badge ${isVoiceEnabled ? 'is-voice-on' : 'is-voice-off'}`}
                              title={isVoiceEnabled ? 'Voice Chat: Enabled' : 'Voice Chat: Disabled'}
                              aria-label={isVoiceEnabled ? 'Voice Chat Enabled' : 'Voice Chat Disabled'}
                            >
                              {isVoiceEnabled ? <LuMic className="room-status-svg" /> : <LuMicOff className="room-status-svg" />}
                            </span>

                            <span
                              className={`room-status-ico-badge ${isPowerupsEnabled ? 'is-powerup-on' : 'is-powerup-off'}`}
                              title={isPowerupsEnabled ? 'Power-Ups: Enabled' : 'Power-Ups: Disabled'}
                              aria-label={isPowerupsEnabled ? 'Power-Ups Enabled' : 'Power-Ups Disabled'}
                            >
                              <LuZap className="room-status-svg" />
                            </span>
                          </div>

                          {/* ── RIGHT: Actions ── */}
                          <div className="room-actions-group">
                            <button
                              type="button"
                              className="btn-room-join-compact"
                              onClick={() => joinRoom(room.roomId, 'player')}
                              title={`Join room #${room.roomId}`}
                            >
                              <span>Join</span>
                              <LuArrowRight className="btn-compact-icon" />
                            </button>

                            <button
                              type="button"
                              className="btn-room-spectate-compact"
                              onClick={() => joinRoom(room.roomId, 'spectator')}
                              title="Spectate"
                              aria-label="Spectate"
                            >
                              <LuEye className="btn-compact-icon" />
                            </button>

                            <button
                              type="button"
                              className={`btn-room-info-compact ${isExpanded ? 'is-active' : ''}`}
                              onClick={() => setExpandedRoomId((prev) => (prev === room.roomId ? null : room.roomId))}
                              title={isExpanded ? 'Hide room details' : 'Room details'}
                              aria-label="Room details"
                            >
                              <LuInfo className="btn-compact-icon" />
                            </button>
                          </div>
                        </div>

                        {/* Optional Expandable Details */}
                        {isExpanded && (
                          <div className="room-details-drawer">
                            <div className="room-details-grid">
                              <div className="room-detail-pill" title="Players">
                                <LuUsers className="detail-pill-icon icon-users" />
                                <span className="detail-pill-label">Players:</span>
                                <strong className="detail-pill-value">{currentPlayers}/{maxPlayers}</strong>
                              </div>
                              <div className="room-detail-pill" title="Draw Time">
                                <LuClock className="detail-pill-icon icon-clock" />
                                <span className="detail-pill-label">Time:</span>
                                <strong className="detail-pill-value">{drawTime}s</strong>
                              </div>
                              <div className="room-detail-pill" title="Rounds">
                                <LuTrophy className="detail-pill-icon icon-trophy" />
                                <span className="detail-pill-label">Rounds:</span>
                                <strong className="detail-pill-value">{rounds}</strong>
                              </div>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
