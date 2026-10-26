import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/Lobby.css';

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
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to reset password.' });
    }
  };

  return (
    <div className="lobby-container" style={{ alignItems: 'center' }}>
      <div className="lobby-card room-setup" style={{ maxWidth: '500px', width: '100%' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.2rem' }}>Create New Password</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
          <label style={{ position: 'relative' }}>
            New Password
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              style={{ paddingRight: '5rem', width: '100%', boxSizing: 'border-box' }}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '12px', bottom: '15px', background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 700, padding: 0 }}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg> Hide</>
              ) : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg> Show</>
              )}
            </button>
          </label>
          <label style={{ position: 'relative' }}>
            Confirm New Password
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </label>
          
          {status.message && (
            <p className={status.type === 'error' ? 'error-text' : ''} style={status.type === 'success' ? { color: '#2ed573', fontWeight: 600, textAlign: 'center' } : {}}>
              {status.message}
            </p>
          )}
          
          <button type="submit" className="btn-join-main" style={{ marginTop: '0.5rem' }} disabled={status.type === 'loading' || status.type === 'success'}>
            {status.type === 'loading' ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontWeight: 600, color: '#555', marginTop: '2rem' }}>
          <p><Link to="/login" style={{ color: '#4facfe', textDecoration: 'none' }}>Back to Login</Link></p>
        </div>
      </div>
    </div>
  );
}
