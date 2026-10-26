import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  FaPaintBrush,
  FaGamepad,
  FaTrophy,
  FaBolt,
  FaPencilAlt,
  FaComments,
} from 'react-icons/fa';
import '../styles/Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Sending request...' });
    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      setStatus({ type: 'success', message: res.data.message || 'Reset link sent!' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to send reset link.' });
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
        <Link to="/" className="auth-logo">
          <FaPaintBrush className="auth-logo-icon" />
          <span>Squiggle</span>
        </Link>

        <div className="auth-card">
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">
            Enter your registered email address and we'll send you a password reset link
          </p>

          {status.message && (
            <div className={status.type === 'error' ? 'auth-error-banner' : 'auth-success-banner'} style={{ marginBottom: '1.2rem' }}>
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-label">
              Email Address
              <input
                type="email"
                className="auth-input"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </label>

            <button type="submit" className="auth-submit-btn" disabled={status.type === 'loading'}>
              {status.type === 'loading' ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="auth-switch" style={{ marginTop: '1.8rem' }}>
            <span>
              Remember your password?{' '}
              <Link to="/login" className="auth-switch-link">
                Log in here
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
