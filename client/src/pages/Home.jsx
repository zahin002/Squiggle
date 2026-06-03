import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, loginAsGuest } = useAuth();
  const navigate = useNavigate();

  const handleGuest = () => {
    loginAsGuest();
    navigate('/lobby');
  };

  return (
    <div className="home">
      <h1>🎨 Squiggle</h1>
      <p>A real-time multiplayer drawing & guessing game</p>
      {user ? (
        <>
          <p>Welcome, <strong>{user.username}</strong>!</p>
          <button onClick={() => navigate('/lobby')}>Enter Lobby</button>
        </>
      ) : (
        <>
          <button onClick={() => navigate('/login')}>Log In</button>
          <button onClick={() => navigate('/register')}>Register</button>
          <button className="btn-secondary" onClick={handleGuest}>
            Play as Guest
          </button>
        </>
      )}
    </div>
  );
}