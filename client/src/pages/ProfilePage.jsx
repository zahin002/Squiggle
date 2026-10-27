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
  FaTimesCircle,
  FaDice,
  FaUndo
} from 'react-icons/fa';
import {
  LuEye,
  LuSmile,
  LuSparkles,
  LuPalette,
  LuRotateCcw,
  LuCheck,
  LuDices
} from 'react-icons/lu';
import Avatar, {
  AVATAR_COLOR_PRESETS,
  EYEBROW_OPTIONS,
  EYE_OPTIONS,
  MOUTH_OPTIONS,
  MOUSTACHE_OPTIONS,
  BEARD_OPTIONS,
  getRandomAvatar,
  normalizeAvatar
} from '../components/Avatar';
import '../styles/Profile.css';

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

  // Avatar customization state
  const [avatarState, setAvatarState] = useState({
    color: '#1a64ff',
    eyebrows: 'natural',
    eyes: 'normal',
    mouth: 'smile',
    moustache: 'none',
    beard: 'none',
  });
  const [activeTab, setActiveTab]     = useState('eyes'); // 'eyes' | 'eyebrows' | 'mouth' | 'moustache' | 'beard' | 'color'
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarMsg, setAvatarMsg]     = useState('');
  const [isRolling, setIsRolling]     = useState(false);

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
      setAvatarState(normalizeAvatar(profileRes.data.avatar));
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

  // ── Avatar Actions ───────────────────────────────────────────
  const handleRandomize = () => {
    setIsRolling(true);
    const randomized = getRandomAvatar(avatarState.color);
    setAvatarState(randomized);
    setTimeout(() => setIsRolling(false), 350);
  };

  const handleResetAvatar = () => {
    if (profile?.avatar) {
      setAvatarState(normalizeAvatar(profile.avatar));
    }
  };

  const handleSaveAvatar = async () => {
    setSavingAvatar(true);
    setAvatarMsg('');
    try {
      const res = await axios.patch('/api/users/me/avatar', avatarState);
      // Update AuthContext so avatar reflects everywhere immediately
      setUser(prev => ({ ...prev, avatar: res.data.avatar }));
      setProfile(prev => ({ ...prev, avatar: res.data.avatar }));
      setAvatarMsg('Saved!');
    } catch {
      setAvatarMsg('Failed to save');
    } finally {
      setSavingAvatar(false);
      setTimeout(() => setAvatarMsg(''), 2500);
    }
  };

  const savedNorm = normalizeAvatar(profile?.avatar);
  const hasAvatarChanges = (
    avatarState.color !== savedNorm.color ||
    avatarState.eyebrows !== savedNorm.eyebrows ||
    avatarState.eyes !== savedNorm.eyes ||
    avatarState.mouth !== savedNorm.mouth ||
    avatarState.moustache !== savedNorm.moustache ||
    avatarState.beard !== savedNorm.beard
  );

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
          <div className="profile-hero-avatar-box">
            <Avatar avatar={profile.avatar} size={108} username={profile.username} />
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

        {/* ── Avatar Customization Studio ── */}
        <div className="avatar-customizer-panel">
          <div className="avatar-studio-header">
            <div className="avatar-studio-title-group">
              <h3 className="avatar-studio-heading">
                <FaPalette className="studio-heading-icon" /> Avatar Studio
              </h3>
              <p className="avatar-studio-subtitle">
                Customize your eyebrows, eyes, mouths, facial hair, and colors, or hit Randomize to get an instant unique avatar!
              </p>
            </div>

            {/* Quick Actions Bar */}
            <div className="avatar-studio-actions">
              <button
                type="button"
                className={`btn-avatar-randomize ${isRolling ? 'is-rolling' : ''}`}
                onClick={handleRandomize}
                title="Randomize all avatar features"
              >
                <FaDice className="btn-action-svg" />
                <span>Randomize</span>
              </button>

              <button
                type="button"
                className="btn-avatar-reset"
                onClick={handleResetAvatar}
                disabled={!hasAvatarChanges}
                title="Revert to saved avatar"
              >
                <FaUndo className="btn-action-svg" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                className="btn-avatar-save"
                onClick={handleSaveAvatar}
                disabled={savingAvatar || !hasAvatarChanges}
                title="Save avatar changes"
              >
                <FaCheck className="btn-action-svg" />
                <span>{savingAvatar ? 'Saving...' : 'Save Avatar'}</span>
              </button>
            </div>
          </div>

          {avatarMsg && (
            <div className={`avatar-studio-alert ${avatarMsg === 'Saved!' ? 'is-success' : 'is-error'}`}>
              {avatarMsg === 'Saved!' ? (
                <><FaCheck style={{ marginRight: '6px' }} /> Avatar saved successfully! Visible across games & lobby.</>
              ) : (
                <><FaTimesCircle style={{ marginRight: '6px' }} /> {avatarMsg}</>
              )}
            </div>
          )}

          {/* Studio Body: Live Preview & Options */}
          <div className="avatar-studio-body">
            {/* Left: Large Live Interactive Preview */}
            <div className="avatar-preview-showcase">
              <div className="avatar-preview-halo" style={{ '--glow-color': avatarState.color || '#1a64ff' }}>
                <Avatar avatar={avatarState} size={132} username={profile.username} />
              </div>
              <div className="avatar-current-chips">
                <span className="avatar-chip" title="Eyes">👁️ {avatarState.eyes}</span>
                <span className="avatar-chip" title="Eyebrows">〰️ {avatarState.eyebrows}</span>
                <span className="avatar-chip" title="Mouth">👄 {avatarState.mouth}</span>
                {avatarState.moustache !== 'none' && (
                  <span className="avatar-chip" title="Moustache">🥸 {avatarState.moustache}</span>
                )}
                {avatarState.beard !== 'none' && (
                  <span className="avatar-chip" title="Beard">🧔 {avatarState.beard}</span>
                )}
              </div>
            </div>

            {/* Right: Customization Controls */}
            <div className="avatar-controls-box">
              {/* Category Navigation Tabs */}
              <div className="avatar-category-nav" role="tablist">
                <button
                  type="button"
                  className={`avatar-tab-btn ${activeTab === 'eyes' ? 'active' : ''}`}
                  onClick={() => setActiveTab('eyes')}
                >
                  <LuEye className="tab-icon" /> Eyes
                </button>
                <button
                  type="button"
                  className={`avatar-tab-btn ${activeTab === 'eyebrows' ? 'active' : ''}`}
                  onClick={() => setActiveTab('eyebrows')}
                >
                  <span className="tab-text-icon">〰️</span> Eyebrows
                </button>
                <button
                  type="button"
                  className={`avatar-tab-btn ${activeTab === 'mouth' ? 'active' : ''}`}
                  onClick={() => setActiveTab('mouth')}
                >
                  <LuSmile className="tab-icon" /> Mouth
                </button>
                <button
                  type="button"
                  className={`avatar-tab-btn ${activeTab === 'moustache' ? 'active' : ''}`}
                  onClick={() => setActiveTab('moustache')}
                >
                  <span className="tab-text-icon">🥸</span> Moustache
                </button>
                <button
                  type="button"
                  className={`avatar-tab-btn ${activeTab === 'beard' ? 'active' : ''}`}
                  onClick={() => setActiveTab('beard')}
                >
                  <span className="tab-text-icon">🧔</span> Beard
                </button>
                <button
                  type="button"
                  className={`avatar-tab-btn ${activeTab === 'color' ? 'active' : ''}`}
                  onClick={() => setActiveTab('color')}
                >
                  <LuPalette className="tab-icon" /> Color
                </button>
              </div>

              {/* Tab Contents */}
              <div className="avatar-tab-content">
                {/* 1. Eye Shapes */}
                {activeTab === 'eyes' && (
                  <div className="avatar-options-grid">
                    {EYE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`avatar-option-card ${avatarState.eyes === opt.id ? 'is-selected' : ''}`}
                        onClick={() => setAvatarState((prev) => ({ ...prev, eyes: opt.id }))}
                      >
                        <div className="option-avatar-thumb">
                          <Avatar avatar={{ ...avatarState, eyes: opt.id }} size={42} />
                        </div>
                        <span className="option-label">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* 2. Eyebrows */}
                {activeTab === 'eyebrows' && (
                  <div className="avatar-options-grid">
                    {EYEBROW_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`avatar-option-card ${avatarState.eyebrows === opt.id ? 'is-selected' : ''}`}
                        onClick={() => setAvatarState((prev) => ({ ...prev, eyebrows: opt.id }))}
                      >
                        <div className="option-avatar-thumb">
                          <Avatar avatar={{ ...avatarState, eyebrows: opt.id }} size={42} />
                        </div>
                        <span className="option-label">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* 3. Mouths */}
                {activeTab === 'mouth' && (
                  <div className="avatar-options-grid">
                    {MOUTH_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`avatar-option-card ${avatarState.mouth === opt.id ? 'is-selected' : ''}`}
                        onClick={() => setAvatarState((prev) => ({ ...prev, mouth: opt.id }))}
                      >
                        <div className="option-avatar-thumb">
                          <Avatar avatar={{ ...avatarState, mouth: opt.id }} size={42} />
                        </div>
                        <span className="option-label">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* 4. Moustache */}
                {activeTab === 'moustache' && (
                  <div className="avatar-options-grid">
                    {MOUSTACHE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`avatar-option-card ${avatarState.moustache === opt.id ? 'is-selected' : ''}`}
                        onClick={() => setAvatarState((prev) => ({ ...prev, moustache: opt.id }))}
                      >
                        <div className="option-avatar-thumb">
                          <Avatar avatar={{ ...avatarState, moustache: opt.id }} size={42} />
                        </div>
                        <span className="option-label">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* 5. Beard */}
                {activeTab === 'beard' && (
                  <div className="avatar-options-grid">
                    {BEARD_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`avatar-option-card ${avatarState.beard === opt.id ? 'is-selected' : ''}`}
                        onClick={() => setAvatarState((prev) => ({ ...prev, beard: opt.id }))}
                      >
                        <div className="option-avatar-thumb">
                          <Avatar avatar={{ ...avatarState, beard: opt.id }} size={42} />
                        </div>
                        <span className="option-label">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* 6. Color */}
                {activeTab === 'color' && (
                  <div className="avatar-colors-picker-wrap">
                    <p className="avatar-colors-instruction">Select a base color theme for your avatar:</p>
                    <div className="avatar-color-swatches-grid">
                      {AVATAR_COLOR_PRESETS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`avatar-color-circle ${avatarState.color === c ? 'is-selected' : ''}`}
                          style={{ background: c }}
                          onClick={() => setAvatarState((prev) => ({ ...prev, color: c }))}
                          title={c}
                          aria-label={`Select color ${c}`}
                        />
                      ))}

                      {/* Custom color picker */}
                      <div className="avatar-custom-color-btn" title="Pick custom color">
                        <input
                          type="color"
                          value={avatarState.color || '#1a64ff'}
                          onChange={(e) => setAvatarState((prev) => ({ ...prev, color: e.target.value }))}
                          aria-label="Pick custom color"
                        />
                        <span className="custom-color-text">Custom</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
