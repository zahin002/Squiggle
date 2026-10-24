import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
      {/* Floating decorative doodles */}
      <div className="home-doodles">
        <span className="doodle">✏️</span>
        <span className="doodle">🎨</span>
        <span className="doodle">🖌️</span>
        <span className="doodle">⭐</span>
        <span className="doodle">🎯</span>
        <span className="doodle">💡</span>
        <span className="doodle">🏆</span>
        <span className="doodle">🎮</span>
      </div>

      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav className={`home-navbar ${scrolled ? 'scrolled' : ''}`}>
        <Link to="/" className="navbar-brand">
          <svg className="navbar-brand-icon" viewBox="0 0 100 100" fill="none" stroke="url(#navGrad)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <linearGradient id="navGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c4dff" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
            <path d="M10 60 C 10 20, 50 20, 40 50 C 30 80, 70 80, 60 50 C 50 20, 90 20, 90 60" />
          </svg>
          <span className="navbar-brand-text">Squiggle</span>
        </Link>

        <div className="navbar-links">
          {user && !user.isGuest ? (
            <>
              <button className="navbar-link navbar-link--ghost" onClick={() => navigate('/lobby')}>
                🎮 Play
              </button>
              <button className="navbar-link navbar-link--ghost" onClick={() => navigate('/leaderboard')}>
                🏆 Leaderboard
              </button>
              <button className="navbar-link navbar-link--profile" onClick={() => navigate('/profile')}>
                👤 {user.username}
              </button>
              <button className="navbar-link navbar-link--logout" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button className="navbar-link navbar-link--ghost" onClick={() => navigate('/leaderboard')}>
                🏆 Leaderboard
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

        <h1 className="hero-title">
          <span className="hero-title-main">Draw, Guess &</span>
          <span className="hero-title-accent">Win Together!</span>
        </h1>

        <p className="hero-subtitle">
          The ultimate multiplayer drawing &amp; guessing game. Grab your friends,
          sketch something wild, and race to guess what others are doodling — in real time!
        </p>

        <div className="hero-actions">
          <button className="hero-btn hero-btn--primary" onClick={handlePlayNow}>
            🚀 Play Now
          </button>
          {!user || user.isGuest ? (
            <button className="hero-btn hero-btn--secondary" onClick={() => navigate('/register')}>
              ✨ Create Account
            </button>
          ) : (
            <button className="hero-btn hero-btn--secondary" onClick={() => navigate('/lobby')}>
              🏠 Go to Lobby
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
            <span className="feature-icon">🎨</span>
            <div className="feature-title">Pro Drawing Tools</div>
            <div className="feature-desc">
              Brushes, shapes, eraser, color picker and more — everything you need to create masterpieces or hilarious stick figures.
            </div>
          </div>
          <div className="feature-card" style={{ '--card-accent': '#38bdf8' }}>
            <span className="feature-icon">⚡</span>
            <div className="feature-title">Real-Time Multiplayer</div>
            <div className="feature-desc">
              See drawings appear stroke by stroke. Powered by WebSocket for instant, lag-free gameplay.
            </div>
          </div>

          <div className="feature-card" style={{ '--card-accent': '#f59e0b' }}>
            <span className="feature-icon">🏆</span>
            <div className="feature-title">Leaderboards & Ranks</div>
            <div className="feature-desc">
              Climb the global rankings, earn gold coins and diamonds, and show off your drawing prowess.
            </div>
          </div>
          <div className="feature-card" style={{ '--card-accent': '#ff758c' }}>
            <span className="feature-icon">🎭</span>
            <div className="feature-title">Multiple Game Modes</div>
            <div className="feature-desc">
              Classic draw & guess, speed rounds, team battles — choose your style and jump right in.
            </div>
          </div>
          <div className="feature-card" style={{ '--card-accent': '#06b6d4' }}>
            <span className="feature-icon">👀</span>
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
            <span className="howto-icon">🚪</span>
            <div className="howto-title">Join or Create a Room</div>
            <div className="howto-desc">
              Create a private room for friends or jump into a public game instantly.
            </div>
          </div>
          <div className="howto-step">
            <div className="howto-number">02</div>
            <span className="howto-icon">✏️</span>
            <div className="howto-title">Draw Your Word</div>
            <div className="howto-desc">
              When it's your turn, draw the word using our powerful canvas tools.
            </div>
          </div>
          <div className="howto-step">
            <div className="howto-number">03</div>
            <span className="howto-icon">💬</span>
            <div className="howto-title">Guess & Chat</div>
            <div className="howto-desc">
              Type your guesses in the chat. Faster guesses earn more points!
            </div>
          </div>
          <div className="howto-step">
            <div className="howto-number">04</div>
            <span className="howto-icon">🥇</span>
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
              🎮 Start Playing Now
            </button>
            {(!user || user.isGuest) && (
              <button className="hero-btn hero-btn--secondary" onClick={() => navigate('/register')}>
                📝 Create Free Account
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="home-footer">
        <div className="footer-brand">Squiggle</div>
        <p className="footer-text">
          © {new Date().getFullYear()} Squiggle — Draw, Guess & Have Fun!
        </p>
      </footer>
    </div>
  );
}