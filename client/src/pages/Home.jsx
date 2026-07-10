import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Lobby.css'; // Using the new unified theme

export default function Home() {
  const { user, loginAsGuest, logout } = useAuth();
  const navigate = useNavigate();

  const handleGuest = () => {
    loginAsGuest();
    navigate('/lobby');
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="lobby-container" style={{ alignItems: 'center' }}>
      <div className="lobby-card" style={{ maxWidth: '600px', textAlign: 'center' }}>
        <div className="logo-container" style={{ marginBottom: '0.5rem' }}>
          <img 
            src="/logo.png" 
            alt="Squiggle Logo" 
            className="squiggle-logo" 
            style={{ maxWidth: '280px', width: '100%' }}
            onError={(e) => {
              e.target.onerror = null; 
              e.target.style.display = 'none';
              document.getElementById('fallback-logo-text').style.display = 'block';
            }} 
          />
          <h1 id="fallback-logo-text" style={{ display: 'none', color: '#4facfe', fontSize: '3rem', margin: 0 }}>Squiggle</h1>
        </div>
        
        {user && !user.isGuest ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '1.2rem' }}>Welcome back, <strong style={{ color: '#4facfe' }}>{user.username}</strong>!</p>
            <button className="btn-join-main" onClick={() => navigate('/lobby')}>
              Enter Lobby
            </button>
            <button style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontWeight: 600, marginTop: '1rem' }} onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {user && user.isGuest && (
              <p style={{ fontSize: '1.1rem' }}>Currently playing as <strong style={{ color: '#ff758c' }}>{user.username}</strong></p>
            )}
            
            <button className="btn-join-main" onClick={handleGuest}>
              Play as Guest
            </button>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button 
                style={{ flex: 1, padding: '1rem', borderRadius: '15px', border: '2px solid #e2e8f0', background: '#fff', color: '#555', fontWeight: 800, cursor: 'pointer' }} 
                onClick={() => navigate('/login')}
              >
                Log In
              </button>
              <button 
                style={{ flex: 1, padding: '1rem', borderRadius: '15px', border: '2px solid #e2e8f0', background: '#fff', color: '#555', fontWeight: 800, cursor: 'pointer' }} 
                onClick={() => navigate('/register')}
              >
                Create Account
              </button>
            </div>
            
            {user && user.isGuest && (
              <button style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontWeight: 600, marginTop: '1rem' }} onClick={handleLogout}>
                Clear Guest Session
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}