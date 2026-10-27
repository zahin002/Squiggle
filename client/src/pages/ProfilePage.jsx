import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  FaEnvelope,
  FaCalendarAlt,
  FaGlobeAmericas,
  FaCoins,
  FaGem,
  FaTrophy,
  FaFire,
  FaPalette,
  FaExclamationTriangle,
  FaUserSecret,
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaTimesCircle
} from 'react-icons/fa';
import '../styles/Profile.css';

// Preset avatar color palette (same as GamePage gradient start color options)
const COLOR_PRESETS = [
  '#1a64ff', // blue
  '#7c4dff', // purple
  '#10b981', // green
  '#ef4444', // red
  '#f59e0b', // amber
  '#0ea5e9', // sky
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
];

function ordinalSuffix(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile]       = useState(null);
  const [rank, setRank]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  // Avatar color state
  const [selectedColor, setSelectedColor] = useState('');
  const [savingColor, setSavingColor]     = useState(false);
  const [colorMsg, setColorMsg]           = useState('');

  // ── Fetch profile + rank ────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [profileRes, rankRes] = await Promise.all([
        axios.get('/api/users/me'),
        axios.get('/api/users/me/rank'),
      ]);
      setProfile(profileRes.data);
      setRank(rankRes.data.rank);
      setSelectedColor(profileRes.data.avatar?.color || '#1a64ff');
    } catch {
      setError('Could not load your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Guests have no profile — don't bother fetching
    if (user && !user.isGuest) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user, fetchProfile]);

  // ── Save avatar color ────────────────────────────────────────
  const handleSaveColor = async () => {
    setSavingColor(true);
    setColorMsg('');
    try {
      const res = await axios.patch('/api/users/me/avatar', { color: selectedColor });
      // Update AuthContext so avatar shows immediately everywhere
      setUser(prev => ({ ...prev, avatar: res.data.avatar }));
      setProfile(prev => ({ ...prev, avatar: res.data.avatar }));
      setColorMsg('Saved!');
    } catch {
      setColorMsg('Failed to save');
    } finally {
      setSavingColor(false);
      setTimeout(() => setColorMsg(''), 2500);
    }
  };

  const colorChanged = selectedColor !== (profile?.avatar?.color || '#1a64ff');

  // ── Render: loading ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-bg" aria-hidden="true" />
        <div className="profile-card">
          <div className="profile-loading">
            <div className="profile-spinner" />
            <p style={{ color: '#cbd5e1', fontWeight: 700, fontSize: '1.1rem', marginTop: '16px' }}>
              Loading your profile...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: guest or not logged in ──────────────────────────
  if (!user || user.isGuest) {
    return (
      <div className="profile-container">
        <div className="profile-bg" aria-hidden="true" />
        <div className="profile-bg-icons" aria-hidden="true">
          <FaTrophy className="profile-doodle" />
          <FaPalette className="profile-doodle" />
          <FaCoins className="profile-doodle" />
          <FaGem className="profile-doodle" />
          <FaFire className="profile-doodle" />
        </div>
        <div className="profile-card">
          <header className="profile-header">
            <div className="profile-header-left">
              <button className="leave-room-box-btn profile-back-btn" onClick={() => navigate('/lobby')}>
                <FaArrowLeft style={{ marginRight: '6px', verticalAlign: '-1px' }} /> Back to Lobby
              </button>
            </div>
            <div className="profile-header-center">
              <h1 className="profile-page-title">My Profile</h1>
            </div>
            <div className="profile-header-right">
              <Link to="/" className="profile-brand-link" title="Squiggle Home">
                <img src="/squiggle-wordmark.png" alt="Squiggle" className="profile-brand-logo-img" />
              </Link>
            </div>
          </header>

          <div className="profile-guest-notice">
            <div style={{ fontSize: '3.5rem', marginBottom: '16px', color: '#a78bfa' }}>
              <FaUserSecret />
            </div>
            <h2>Guest Account</h2>
            <p>
              You're playing as a guest. Create a free account to save your
              progress, earn gold coins, and appear on the Global Leaderboard!
            </p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="btn-go-register" onClick={() => navigate('/register')}>
                Create Account <FaArrowRight style={{ marginLeft: '6px' }} />
              </button>
              <button className="leave-room-box-btn profile-back-btn" onClick={() => navigate('/lobby')}>
                <FaArrowLeft style={{ marginRight: '6px', verticalAlign: '-1px' }} /> Back to Lobby
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: error ────────────────────────────────────────────
  if (error) {
    return (
      <div className="profile-container">
        <div className="profile-bg" aria-hidden="true" />
        <div className="profile-card">
          <header className="profile-header">
            <div className="profile-header-left">
              <button className="leave-room-box-btn profile-back-btn" onClick={() => navigate('/lobby')}>
                <FaArrowLeft style={{ marginRight: '6px', verticalAlign: '-1px' }} /> Back to Lobby
              </button>
            </div>
            <div className="profile-header-center">
              <h1 className="profile-page-title">My Profile</h1>
            </div>
            <div className="profile-header-right">
              <Link to="/" className="profile-brand-link" title="Squiggle Home">
                <img src="/squiggle-wordmark.png" alt="Squiggle" className="profile-brand-logo-img" />
              </Link>
            </div>
          </header>

          <div className="profile-guest-notice">
            <div style={{ fontSize: '2.5rem', marginBottom: '12px', color: '#ef4444' }}>
              <FaExclamationTriangle />
            </div>
            <p style={{ color: '#ef4444', fontWeight: 700 }}>{error}</p>
            <button className="btn-go-register" onClick={fetchProfile} style={{ marginTop: '16px' }}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const initials = (profile.username || 'U').charAt(0).toUpperCase();
  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : 'Unknown';

  return (
    <div className="profile-container">
      {/* ── Fixed background layers ── */}
      <div className="profile-bg" aria-hidden="true" />
      <div className="profile-bg-icons" aria-hidden="true">
        <FaTrophy className="profile-doodle" />
        <FaPalette className="profile-doodle" />
        <FaCoins className="profile-doodle" />
        <FaGem className="profile-doodle" />
        <FaFire className="profile-doodle" />
        <FaGlobeAmericas className="profile-doodle" />
      </div>

      <div className="profile-card">

        {/* ── Header ── */}
        <header className="profile-header">
          <div className="profile-header-left">
            <button className="leave-room-box-btn profile-back-btn" onClick={() => navigate('/lobby')}>
              <FaArrowLeft style={{ marginRight: '6px', verticalAlign: '-1px' }} /> Back to Lobby
            </button>
          </div>
          <div className="profile-header-center">
            <h1 className="profile-page-title">My Profile</h1>
          </div>
          <div className="profile-header-right">
            <Link to="/" className="profile-brand-link" title="Squiggle Home">
              <img src="/squiggle-wordmark.png" alt="Squiggle" className="profile-brand-logo-img" />
            </Link>
          </div>
        </header>

        {/* ── Hero: Avatar + Name ── */}
        <div className="profile-hero">
          <div
            className="profile-avatar-large"
            style={{ background: `linear-gradient(135deg, ${profile.avatar?.color || '#1a64ff'}, #7c4dff)` }}
          >
            {initials}
          </div>
          <div className="profile-hero-info">
            <h2 className="profile-username">{profile.username}</h2>
            {profile.email && (
              <p className="profile-email">
                <FaEnvelope className="profile-inline-icon" /> {profile.email}
              </p>
            )}
            <span className="profile-member-since">
              <FaCalendarAlt className="profile-inline-icon" /> Member since {memberSince}
            </span>
          </div>
        </div>

        {/* ── Global Rank Banner ── */}
        {rank !== null && (
          <div className="profile-rank-banner">
            <div>
              <div className="profile-rank-label">
                <FaGlobeAmericas className="profile-inline-icon rank-globe-icon" /> Global Rank (by Gold Coins)
              </div>
              <div>
                <span className="profile-rank-number">{ordinalSuffix(rank)}</span>
                <span className="profile-rank-suffix"> place</span>
              </div>
            </div>
            <div className="profile-climb-box">
              <div className="profile-climb-text">
                Want to climb higher?
              </div>
              <button
                className="btn-view-leaderboard"
                onClick={() => navigate('/leaderboard')}
              >
                View Leaderboard <FaArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* ── Stats Grid ── */}
        <div className="profile-stats-grid">
          <div className="stat-card gold-coins">
            <div className="stat-icon stat-icon--gold"><FaCoins /></div>
            <div className="stat-value">{profile.goldCoins.toLocaleString()}</div>
            <div className="stat-label">Gold Coins</div>
          </div>
          <div className="stat-card diamonds">
            <div className="stat-icon stat-icon--diamond"><FaGem /></div>
            <div className="stat-value">{profile.diamonds.toLocaleString()}</div>
            <div className="stat-label">Diamonds</div>
          </div>
          <div className="stat-card wins">
            <div className="stat-icon stat-icon--wins"><FaTrophy /></div>
            <div className="stat-value">{profile.totalWins.toLocaleString()}</div>
            <div className="stat-label">Total Wins</div>
          </div>
          <div className="stat-card streak">
            <div className="stat-icon stat-icon--streak"><FaFire /></div>
            <div className="stat-value">{profile.currentWinStreak}</div>
            <div className="stat-label">Win Streak</div>
          </div>
        </div>

        {/* ── Avatar Color Picker ── */}
        <div className="avatar-color-section">
          <p className="avatar-color-title">
            <FaPalette className="profile-inline-icon palette-icon" /> Avatar Color
          </p>
          <div className="color-swatches">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                className={`color-swatch ${selectedColor === c ? 'selected' : ''}`}
                style={{ background: c }}
                onClick={() => setSelectedColor(c)}
                title={c}
                aria-label={`Select color ${c}`}
              />
            ))}

            {/* Custom hex color picker */}
            <div className="color-swatch-custom">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                title="Pick a custom color"
              />
            </div>

            {/* Preview + Save */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${selectedColor}, #7c4dff)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 900,
                fontSize: 14,
                flexShrink: 0,
              }}
              title="Preview"
            >
              {initials}
            </div>

            <button
              className="save-color-btn"
              onClick={handleSaveColor}
              disabled={savingColor || !colorChanged}
            >
              {savingColor ? 'Saving...' : 'Save Color'}
            </button>

            {colorMsg && (
              <span className={`save-color-msg ${colorMsg === 'Saved!' ? 'success' : 'error'}`}>
                {colorMsg === 'Saved!' ? (
                  <><FaCheck style={{ marginRight: '4px' }} /> Saved!</>
                ) : (
                  <><FaTimesCircle style={{ marginRight: '4px' }} /> {colorMsg}</>
                )}
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
