import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import '../styles/Lobby.css';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      await axios.post('/api/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password
      });
      // Optionally auto-login, but we'll redirect to login page for now
      navigate('/login');
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(`Error: ${err.message}`);
      }
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post('/api/auth/google', { token: credentialResponse.credential });
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      setUser(res.data.user);
      navigate('/lobby');
    } catch (err) {
      setError('Google Sign-In failed');
    }
  };

  return (
    <div className="lobby-container" style={{ alignItems: 'center' }}>
      <div className="lobby-card room-setup" style={{ maxWidth: '500px', width: '100%' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.2rem' }}>Join Squiggle</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label>
            Username
            <input
              placeholder="Choose a playful username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </label>
          <label>
            Email Address
            <input
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </label>
          <label style={{ position: 'relative' }}>
            Password
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
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
            Confirm Password
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              required
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </label>
          
          {error && <p className="error-text">{error}</p>}
          
          <button type="submit" className="btn-join-main" style={{ marginTop: '0.5rem' }}>Create Account</button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '2rem 0', color: '#999', fontWeight: 600 }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
          <span style={{ padding: '0 1rem' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google Sign-In failed')}
            shape="pill"
            theme="filled_blue"
            size="large"
            text="signup_with"
          />
        </div>

        <div style={{ textAlign: 'center', fontWeight: 600, color: '#555' }}>
          <p>Already have an account? <Link to="/login" style={{ color: '#4facfe', textDecoration: 'none' }}>Log In</Link></p>
        </div>
      </div>
    </div>
  );
}