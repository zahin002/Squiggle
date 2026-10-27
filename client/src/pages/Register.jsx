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

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password
      });
      navigate('/login');
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
          <h1 className="auth-title">Join Squiggle</h1>
          <p className="auth-subtitle">Create an account to save wins, customize avatars, and climb ranks</p>

          {error && <div className="auth-error-banner">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form" style={{ marginTop: error ? '1rem' : '0' }}>
            <label className="auth-label">
              Username
              <input
                type="text"
                className="auth-input"
                placeholder="Choose a playful username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                minLength={3}
                maxLength={20}
                autoFocus
              />
            </label>

            <label className="auth-label">
              Email Address
              <input
                type="email"
                className="auth-input"
                placeholder="name@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>

            <label className="auth-label">
              Password
              <div className="auth-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Create a password (min 6 chars)"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
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

            <label className="auth-label">
              Confirm Password
              <input
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
              />
            </label>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>


          <div className="auth-switch">
            <span>
              Already have an account?{' '}
              <Link to="/login" className="auth-switch-link">
                Log in here
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