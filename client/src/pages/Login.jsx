import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  FaEye,
  FaEyeSlash,
  FaPaintBrush,
  FaGamepad,
  FaTrophy,
  FaBolt,
  FaPencilAlt,
  FaComments,
} from 'react-icons/fa';
import '../styles/Auth.css';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.username, form.password);
      navigate('/lobby');
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-page">
      {/* Fixed background layers that never shift on scroll */}
      <div className="auth-bg" aria-hidden="true" />
      <div className="auth-bg-icons" aria-hidden="true">
        <FaPaintBrush className="auth-doodle" />
        <FaGamepad className="auth-doodle" />
        <FaTrophy className="auth-doodle" />
        <FaBolt className="auth-doodle" />
        <FaPencilAlt className="auth-doodle" />
        <FaComments className="auth-doodle" />
      </div>

      {/* Scrollable content */}
      <div className="auth-content">
        <Link to="/" className="auth-logo" title="Squiggle Home">
          <img
            src="/squiggle-wordmark.png"
            alt="Squiggle"
            className="auth-logo-img"
          />
        </Link>

        <div className="auth-card">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Log in to draw, guess, and climb the leaderboard</p>

          {error && <div className="auth-error-banner">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form" style={{ marginTop: error ? '1rem' : '0' }}>
            <label className="auth-label">
              Email or Username
              <input
                type="text"
                className="auth-input"
                placeholder="Enter your email or username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                autoFocus
              />
            </label>

            <label className="auth-label">
              Password
              <div className="auth-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  style={{ paddingRight: '4.5rem' }}
                />
                <button
                  type="button"
                  className="auth-pwd-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
            </label>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>


          <div className="auth-switch">
            <span>
              Don't have an account?{' '}
              <Link to="/register" className="auth-switch-link">
                Create one here
              </Link>
            </span>
            <span>
              Just browsing?{' '}
              <Link to="/lobby" className="auth-guest-link">
                Play as Guest →
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}