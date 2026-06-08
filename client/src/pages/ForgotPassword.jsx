import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/Lobby.css';

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
    <div className="lobby-container" style={{ alignItems: 'center' }}>
      <div className="lobby-card room-setup" style={{ maxWidth: '500px', width: '100%' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.2rem' }}>Reset Password</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
          Enter your registered email address and we'll send you a link to reset your password.
        </p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label>
            Email Address
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </label>
          
          {status.message && (
            <p className={status.type === 'error' ? 'error-text' : ''} style={status.type === 'success' ? { color: '#2ed573', fontWeight: 600, textAlign: 'center' } : {}}>
              {status.message}
            </p>
          )}
          
          <button type="submit" className="btn-join-main" style={{ marginTop: '0.5rem' }} disabled={status.type === 'loading'}>
            {status.type === 'loading' ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontWeight: 600, color: '#555', marginTop: '2rem' }}>
          <p>Remember your password? <Link to="/login" style={{ color: '#4facfe', textDecoration: 'none' }}>Log In</Link></p>
        </div>
      </div>
    </div>
  );
}
