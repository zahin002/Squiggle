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
  LuCrown
} from 'react-icons/lu';
import Avatar, {
  AVATAR_COLOR_PRESETS,
  HAT_OPTIONS,
  EYEBROW_OPTIONS,
  EYE_OPTIONS,
  MOUTH_OPTIONS,
  MOUSTACHE_OPTIONS,
  BEARD_OPTIONS,
  getRandomAvatar,
  normalizeAvatar
} from '../components/Avatar';
import '../styles/Profile.css';

function PixelArrow({ direction = 'left' }) {
  return (
    <svg
      viewBox="0 0 20 28"
      width="20"
      height="26"
      className={`pixel-arrow pixel-arrow--${direction}`}
      style={{ display: 'block' }}
    >
      {direction === 'left' ? (
        <path
          d="M 16 3 L 6 14 L 16 25 L 11 25 L 1 14 L 11 3 Z"
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinejoin="miter"
        />
      ) : (
        <path
          d="M 4 3 L 14 14 L 4 25 L 9 25 L 19 14 L 9 3 Z"
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinejoin="miter"
        />
      )}
    </svg>
  );
}

function ordinalSuffix(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function ProfilePage() {
  const { user, setUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile]       = useState(null);
  const [rank, setRank]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  // Avatar customization state
  const [avatarState, setAvatarState] = useState({
    color: '#f5c6a5',
    hat: 'none',
    eyebrows: 'natural',
    eyes: 'normal',
    mouth: 'smile',
    moustache: 'none',
    beard: 'none',
  });
  const [activeTab, setActiveTab]     = useState('hat'); // 'hat' | 'eyes' | 'eyebrows' | 'mouth' | 'moustache' | 'beard' | 'color'
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
    // Wait until AuthContext finishes checking token
    if (authLoading) return;

    // Guests have no profile — don't bother fetching
    if (user && !user.isGuest) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user, authLoading, fetchProfile]);

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

  const cycleOption = (category, direction) => {
    let options = [];
    if (category === 'hat') options = HAT_OPTIONS;
    else if (category === 'eyes') options = EYE_OPTIONS;
    else if (category === 'mouth') options = MOUTH_OPTIONS;
    else if (category === 'color') options = AVATAR_COLOR_PRESETS;
    else if (category === 'eyebrows') options = EYEBROW_OPTIONS;

    if (!options || options.length === 0) return;

    if (category === 'color') {
      const currentIndex = options.indexOf(avatarState.color);
      const safeIndex = currentIndex === -1 ? 0 : currentIndex;
      const nextIndex = (safeIndex + direction + options.length) % options.length;
      setAvatarState(prev => ({ ...prev, color: options[nextIndex] }));
    } else {
      const currentIndex = options.findIndex(o => o.id === avatarState[category]);
      const safeIndex = currentIndex === -1 ? 0 : currentIndex;
      const nextIndex = (safeIndex + direction + options.length) % options.length;
      setAvatarState(prev => ({ ...prev, [category]: options[nextIndex].id }));
    }
  };

  const savedNorm = normalizeAvatar(profile?.avatar);
  const hasAvatarChanges = (
    avatarState.color !== savedNorm.color ||
    avatarState.hat !== savedNorm.hat ||
    avatarState.eyebrows !== savedNorm.eyebrows ||
    avatarState.eyes !== savedNorm.eyes ||
    avatarState.mouth !== savedNorm.mouth ||
    avatarState.moustache !== savedNorm.moustache ||
    avatarState.beard !== savedNorm.beard
  );

  // ── Render: loading (auth initializing or profile fetching) ──
  if (authLoading || loading || (!profile && user && !user.isGuest && !error)) {
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

  // ── Render: error or missing profile ─────────────────────────
  if (error || !profile) {
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
            <p style={{ color: '#ef4444', fontWeight: 700 }}>{error || 'Could not load your profile.'}</p>
            <button className="btn-go-register" onClick={fetchProfile} style={{ marginTop: '16px' }}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const initials = (profile?.username || 'U').charAt(0).toUpperCase();
  const memberSince = profile?.createdAt
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
                <FaGlobeAmericas className="profile-inline-icon rank-globe-icon" /> Global Rank
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
            <div className="stat-value">{(profile?.goldCoins ?? 0).toLocaleString()}</div>
            <div className="stat-label">Gold Coins</div>
          </div>
          <div className="stat-card diamonds">
            <div className="stat-icon stat-icon--diamond"><FaGem /></div>
            <div className="stat-value">{(profile?.diamonds ?? 0).toLocaleString()}</div>
            <div className="stat-label">Diamonds</div>
          </div>
          <div className="stat-card wins">
            <div className="stat-icon stat-icon--wins"><FaTrophy /></div>
            <div className="stat-value">{(profile?.totalWins ?? 0).toLocaleString()}</div>
            <div className="stat-label">Total Wins</div>
          </div>
          <div className="stat-card streak">
            <div className="stat-icon stat-icon--streak"><FaFire /></div>
            <div className="stat-value">{profile?.currentWinStreak ?? 0}</div>
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
            {/* Left: Skribbl-style Interactive Preview Stage */}
            <div className="avatar-preview-showcase skribbl-avatar-stage">
              {/* Top-Right Quick Randomize Dice */}
              <button
                type="button"
                className={`skribbl-stage-dice-btn ${isRolling ? 'is-rolling' : ''}`}
                onClick={handleRandomize}
                title="Randomize avatar"
                aria-label="Randomize avatar"
              >
                <FaDice />
              </button>

              {/* Character Flanked by Pixel Arrow Selectors */}
              <div className="skribbl-stage-arena">
                {/* Left Arrow Column */}
                <div className="skribbl-arrow-column skribbl-arrow-column--left">
                  <button
                    type="button"
                    className="btn-skribbl-arrow"
                    onClick={() => cycleOption('hat', -1)}
                    title="Previous hat"
                    aria-label="Previous hat"
                  >
                    <PixelArrow direction="left" />
                  </button>
                  <button
                    type="button"
                    className="btn-skribbl-arrow"
                    onClick={() => cycleOption('eyes', -1)}
                    title="Previous eyes"
                    aria-label="Previous eyes"
                  >
                    <PixelArrow direction="left" />
                  </button>
                  <button
                    type="button"
                    className="btn-skribbl-arrow"
                    onClick={() => cycleOption('mouth', -1)}
                    title="Previous mouth"
                    aria-label="Previous mouth"
                  >
                    <PixelArrow direction="left" />
                  </button>
                  <button
                    type="button"
                    className="btn-skribbl-arrow"
                    onClick={() => cycleOption('color', -1)}
                    title="Previous color"
                    aria-label="Previous color"
                  >
                    <PixelArrow direction="left" />
                  </button>
                </div>

                {/* Center Avatar Display */}
                <div className="skribbl-avatar-center-wrap">
                  <Avatar avatar={avatarState} size={156} username={profile.username} isStage />
                </div>

                {/* Right Arrow Column */}
                <div className="skribbl-arrow-column skribbl-arrow-column--right">
                  <button
                    type="button"
                    className="btn-skribbl-arrow"
                    onClick={() => cycleOption('hat', 1)}
                    title="Next hat"
                    aria-label="Next hat"
                  >
                    <PixelArrow direction="right" />
                  </button>
                  <button
                    type="button"
                    className="btn-skribbl-arrow"
                    onClick={() => cycleOption('eyes', 1)}
                    title="Next eyes"
                    aria-label="Next eyes"
                  >
                    <PixelArrow direction="right" />
                  </button>
                  <button
                    type="button"
                    className="btn-skribbl-arrow"
                    onClick={() => cycleOption('mouth', 1)}
                    title="Next mouth"
                    aria-label="Next mouth"
                  >
                    <PixelArrow direction="right" />
                  </button>
                  <button
                    type="button"
                    className="btn-skribbl-arrow"
                    onClick={() => cycleOption('color', 1)}
                    title="Next color"
                    aria-label="Next color"
                  >
                    <PixelArrow direction="right" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Customization Controls */}
            <div className="avatar-controls-box">
              {/* Category Navigation Tabs (Vector Icons Only, No Emojis) */}
              <div className="avatar-category-nav" role="tablist">
                <button
                  type="button"
                  className={`avatar-tab-btn ${activeTab === 'hat' ? 'active' : ''}`}
                  onClick={() => setActiveTab('hat')}
                >
                  <LuCrown className="tab-icon" /> Hat
                </button>
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
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="tab-icon">
                    <path d="M3 12 Q7 7 11 11" />
                    <path d="M13 11 Q17 7 21 12" />
                  </svg>
                  Eyebrows
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
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="tab-icon">
                    <path d="M12 14.5 C10 11.5 5.5 11 2 13 C 4.5 17 9 17.5 12 15 C 15 17.5 19.5 17 22 13 C 18.5 11 14 11.5 12 14.5 Z" />
                  </svg>
                  Moustache
                </button>
                <button
                  type="button"
                  className={`avatar-tab-btn ${activeTab === 'beard' ? 'active' : ''}`}
                  onClick={() => setActiveTab('beard')}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="tab-icon">
                    <path d="M4 8 C4 14 7 19 12 19 C17 19 20 14 20 8 M8 13 C9.5 14.5 14.5 14.5 16 13" />
                  </svg>
                  Beard
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
                {/* 0. Hats */}
                {activeTab === 'hat' && (
                  <div className="avatar-options-grid">
                    {HAT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`avatar-option-card ${avatarState.hat === opt.id ? 'is-selected' : ''}`}
                        onClick={() => setAvatarState((prev) => ({ ...prev, hat: opt.id }))}
                      >
                        <div className="option-avatar-thumb">
                          <Avatar avatar={{ ...avatarState, hat: opt.id }} size={46} isStage />
                        </div>
                        <span className="option-label">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}

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
                          <Avatar avatar={{ ...avatarState, eyes: opt.id }} size={46} isStage />
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
                          <Avatar avatar={{ ...avatarState, eyebrows: opt.id }} size={46} isStage />
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
                          <Avatar avatar={{ ...avatarState, mouth: opt.id }} size={46} isStage />
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
                          <Avatar avatar={{ ...avatarState, moustache: opt.id }} size={46} isStage />
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
                          <Avatar avatar={{ ...avatarState, beard: opt.id }} size={46} isStage />
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
