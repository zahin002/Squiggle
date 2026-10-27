import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
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

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [showPassword, setShowPassword] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match' });
      return;
    }

    setStatus({ type: 'loading', message: 'Resetting password...' });
    try {
      await axios.post(`/api/auth/reset-password/${token}`, { password });
      setStatus({ type: 'success', message: 'Password has been reset successfully! Redirecting to login...' });
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to reset password.' });
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
          <h1 className="auth-title">Create New Password</h1>
          <p className="auth-subtitle">Choose a strong, secure password for your account</p>

          {status.message && (
            <div className={status.type === 'error' ? 'auth-error-banner' : 'auth-success-banner'} style={{ marginBottom: '1.2rem' }}>
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-label">
              New Password
              <div className="auth-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ paddingRight: '4.5rem' }}
                  autoFocus
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
              Confirm New Password
              <input
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </label>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={status.type === 'loading' || status.type === 'success'}
            >
              {status.type === 'loading' ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="auth-switch" style={{ marginTop: '1.8rem' }}>
            <span>
              <Link to="/login" className="auth-switch-link">
                ← Back to Login
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
