import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FaPaintBrush,
  FaBolt,
  FaTrophy,
  FaGamepad,
  FaEye,
  FaPlay,
  FaDoorOpen,
  FaPencilAlt,
  FaComments,
  FaMedal,
  FaUser,
  FaLightbulb,
  FaPalette,
  FaSmile,
  FaStar,
  FaDice,
  FaCrown,
  FaEraser,
  FaQuestion,
  FaCoins,
  FaGem
} from 'react-icons/fa';
import '../styles/Home.css';

export default function Home() {
  const { user, loginAsGuest, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePlayNow = () => {
    if (user) {
      navigate('/lobby');
    } else {
      loginAsGuest();
      navigate('/lobby');
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="home-page">
      {/* Fixed colorful floating background icons (persist across scroll) */}
      <div className="home-doodles" aria-hidden="true">
        <span className="home-doodle home-doodle--1"><FaPencilAlt /></span>
        <span className="home-doodle home-doodle--2"><FaLightbulb /></span>
        <span className="home-doodle home-doodle--3"><FaPalette /></span>
        <span className="home-doodle home-doodle--4"><FaGamepad /></span>
        <span className="home-doodle home-doodle--5"><FaSmile /></span>
        <span className="home-doodle home-doodle--6"><FaEraser /></span>
        <span className="home-doodle home-doodle--7"><FaCrown /></span>
        <span className="home-doodle home-doodle--8"><FaComments /></span>
        <span className="home-doodle home-doodle--9"><FaPaintBrush /></span>
        <span className="home-doodle home-doodle--10"><FaQuestion /></span>
        <span className="home-doodle home-doodle--11"><FaStar /></span>
        <span className="home-doodle home-doodle--12"><FaDice /></span>
        <span className="home-doodle home-doodle--13"><FaTrophy /></span>
        <span className="home-doodle home-doodle--14"><FaGem /></span>
        <span className="home-doodle home-doodle--15"><FaBolt /></span>
        <span className="home-doodle home-doodle--16"><FaCoins /></span>
      </div>

      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav className={`home-navbar ${scrolled ? 'scrolled' : ''}`}>
        <Link to="/" className="navbar-brand">
          <img
            src="/squiggle-wordmark.png"
            alt="Squiggle"
            className="navbar-logo-img"
          />
        </Link>

        <div className="navbar-links">
          {user && !user.isGuest ? (
            <>
              <button className="navbar-link navbar-link--ghost" onClick={() => navigate('/lobby')}>
                <FaGamepad className="nav-btn-icon" /> Play
              </button>
              <button className="navbar-link navbar-link--ghost" onClick={() => navigate('/leaderboard')}>
                <FaTrophy className="nav-btn-icon" /> Leaderboard
              </button>
              <button className="navbar-link navbar-link--profile" onClick={() => navigate('/profile')}>
                <FaUser className="nav-btn-icon" /> {user.username}
              </button>
              <button className="navbar-link navbar-link--logout" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button className="navbar-link navbar-link--ghost" onClick={() => navigate('/leaderboard')}>
                <FaTrophy className="nav-btn-icon" /> Leaderboard
              </button>
              <button className="navbar-link navbar-link--signin" onClick={() => navigate('/login')}>
                Sign In
              </button>
              <button className="navbar-link navbar-link--signup" onClick={() => navigate('/register')}>
                Sign Up Free
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero Section ───────────────────────────────────── */}
      <section className="home-hero">
        <div className="hero-badge">
          <span className="hero-badge-dot"></span>
          {user && !user.isGuest
            ? `Welcome back, ${user.username}!`
            : 'Free to play • No download required'}
        </div>

        <h1 className="hero-logo-wrapper">
          <img
            src="/official-logo.png"
            alt="Squiggle - Sketch. Think. Guess."
            className="hero-official-logo"
          />
        </h1>

        <p className="hero-subtitle">
          The ultimate multiplayer drawing &amp; guessing game. Grab your friends,
          sketch something wild, and race to guess what others are doodling — in real time!
        </p>

        <div className="hero-actions">
          <button className="hero-btn hero-btn--primary" onClick={handlePlayNow}>
            <FaPlay className="btn-icon" /> Play Now
          </button>
          {!user || user.isGuest ? (
            <button className="hero-btn hero-btn--secondary" onClick={() => navigate('/register')}>
              Create Account
            </button>
          ) : (
            <button className="hero-btn hero-btn--secondary" onClick={() => navigate('/lobby')}>
              Go to Lobby
            </button>
          )}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section className="home-section">
        <div className="section-header">
          <span className="section-label">Why Squiggle?</span>
          <h2 className="section-title">Packed with Fun Features</h2>
          <p className="section-subtitle">
            Everything you need for an epic drawing and guessing party with friends or random players worldwide.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card" style={{ '--card-accent': '#7c4dff' }}>
            <div className="feature-icon-wrapper">
              <FaPaintBrush />
            </div>
            <div className="feature-title">Pro Drawing Tools</div>
            <div className="feature-desc">
              Brushes, shapes, eraser, color picker and more — everything you need to create masterpieces or hilarious stick figures.
            </div>
          </div>
          <div className="feature-card" style={{ '--card-accent': '#38bdf8' }}>
            <div className="feature-icon-wrapper">
              <FaBolt />
            </div>
            <div className="feature-title">Real-Time Multiplayer</div>
            <div className="feature-desc">
              See drawings appear stroke by stroke with instant, smooth, and lag-free gameplay.
            </div>
          </div>

          <div className="feature-card" style={{ '--card-accent': '#f59e0b' }}>
            <div className="feature-icon-wrapper">
              <FaTrophy />
            </div>
            <div className="feature-title">Leaderboards & Ranks</div>
            <div className="feature-desc">
              Climb the global rankings, earn gold coins and diamonds, and show off your drawing prowess.
            </div>
          </div>
          <div className="feature-card" style={{ '--card-accent': '#ff758c' }}>
            <div className="feature-icon-wrapper">
              <FaGamepad />
            </div>
            <div className="feature-title">Multiple Game Modes</div>
            <div className="feature-desc">
              Classic draw & guess, speed rounds, team battles — choose your style and jump right in.
            </div>
          </div>
          <div className="feature-card" style={{ '--card-accent': '#06b6d4' }}>
            <div className="feature-icon-wrapper">
              <FaEye />
            </div>
            <div className="feature-title">Spectator Mode</div>
            <div className="feature-desc">
              Not in the mood to draw? Watch live games, learn techniques, and cheer for your favorites.
            </div>
          </div>
        </div>
      </section>

      {/* ── How To Play ────────────────────────────────────── */}
      <section className="home-section">
        <div className="section-header">
          <span className="section-label">Get Started</span>
          <h2 className="section-title">How to Play</h2>
          <p className="section-subtitle">
            Jump in and start playing in under a minute. It's that simple!
          </p>
        </div>

        <div className="howto-steps">
          <div className="howto-step">
            <div className="howto-number">01</div>
            <div className="howto-icon-wrapper">
              <FaDoorOpen />
            </div>
            <div className="howto-title">Join or Create a Room</div>
            <div className="howto-desc">
              Create a private room for friends or jump into a public game instantly.
            </div>
          </div>
          <div className="howto-step">
            <div className="howto-number">02</div>
            <div className="howto-icon-wrapper">
              <FaPencilAlt />
            </div>
            <div className="howto-title">Draw Your Word</div>
            <div className="howto-desc">
              When it's your turn, draw the word using our powerful canvas tools.
            </div>
          </div>
          <div className="howto-step">
            <div className="howto-number">03</div>
            <div className="howto-icon-wrapper">
              <FaComments />
            </div>
            <div className="howto-title">Guess & Chat</div>
            <div className="howto-desc">
              Type your guesses in the chat. Faster guesses earn more points!
            </div>
          </div>
          <div className="howto-step">
            <div className="howto-number">04</div>
            <div className="howto-icon-wrapper">
              <FaMedal />
            </div>
            <div className="howto-title">Win & Climb</div>
            <div className="howto-desc">
              Score the most points to win and climb the global leaderboard!
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ─────────────────────────────────────── */}
      <section className="home-cta">
        <div className="cta-card">
          <h2 className="cta-title">Ready to Squiggle?</h2>
          <p className="cta-subtitle">
            No download, no install. Just click and play. It's free forever!
          </p>
          <div className="cta-actions">
            <button className="hero-btn hero-btn--primary" onClick={handlePlayNow}>
              <FaPlay className="btn-icon" /> Start Playing Now
            </button>
            {(!user || user.isGuest) && (
              <button className="hero-btn hero-btn--secondary" onClick={() => navigate('/register')}>
                Create Free Account
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="home-footer">
        <div className="footer-brand">
          <img
            src="/squiggle-wordmark.png"
            alt="Squiggle"
            className="footer-logo-img"
          />
        </div>
        <p className="footer-text">
          SKETCH, THINK AND GUESS
        </p>
      </footer>
    </div>
  );
}