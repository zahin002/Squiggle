import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/Leaderboard.css';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('goldCoins');
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setLoadingLeaderboard(true);
    setError('');

    axios
      .get(`/api/users/leaderboard?sortBy=${activeTab}`)
      .then((res) => {
        setLeaderboard(res.data);
      })
      .catch(() => {
        setError('Could not load leaderboard data.');
      })
      .finally(() => {
        setLoadingLeaderboard(false);
      });
  }, [activeTab]);

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];
  const restRankings = leaderboard.slice(3);

  const getStatLabel = (userObj) => {
    if (activeTab === 'goldCoins') return `🪙 ${userObj.goldCoins} Coins`;
    if (activeTab === 'totalWins') return `🏆 ${userObj.totalWins} Wins`;
    if (activeTab === 'currentWinStreak') return `🔥 ${userObj.currentWinStreak} Streak`;
    if (activeTab === 'diamonds') return `💎 ${userObj.diamonds} Diamonds`;
    return `🪙 ${userObj.goldCoins} Coins`;
  };

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-card">
        {/* Header */}
        <header className="leaderboard-header">
          <div className="leaderboard-header-left">
            <button className="btn-back-lobby" onClick={() => navigate('/lobby')}>
              ← Back to Lobby
            </button>
            <h1 className="leaderboard-title">🏆 Global Leaderboard</h1>
          </div>
          <div className="lobby-header-user">
            {user ? `${user.username}${user.isGuest ? ' (Guest)' : ''}` : 'Guest ready'}
          </div>
        </header>

        {/* Guest Registration Upsell Banner */}
        {(!user || user.isGuest) && (
          <div className="guest-upsell-banner">
            <div className="guest-upsell-info">
              <span className="guest-upsell-icon">🌟</span>
              <div className="guest-upsell-text">
                <h4>Leaderboard Ranking is for Registered Accounts</h4>
                <p>Register a free account to earn Gold Coins, track win streaks, and climb the global leaderboard!</p>
              </div>
            </div>
            <button className="btn-guest-register" onClick={() => navigate('/register')}>
              Create Account →
            </button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="leaderboard-tabs">
          <button className={`tab-btn ${activeTab === 'goldCoins' ? 'active' : ''}`} onClick={() => setActiveTab('goldCoins')}>
            🪙 Most Gold Coins
          </button>
          <button className={`tab-btn ${activeTab === 'totalWins' ? 'active' : ''}`} onClick={() => setActiveTab('totalWins')}>
            🏆 Total Wins
          </button>
          <button className={`tab-btn ${activeTab === 'currentWinStreak' ? 'active' : ''}`} onClick={() => setActiveTab('currentWinStreak')}>
            🔥 Win Streaks
          </button>
          <button className={`tab-btn ${activeTab === 'diamonds' ? 'active' : ''}`} onClick={() => setActiveTab('diamonds')}>
            💎 Diamonds
          </button>
        </div>

        {loadingLeaderboard ? (
          <p style={{ textAlign: 'center', padding: '40px', fontWeight: 700, color: '#64748b' }}>
            Loading top player rankings...
          </p>
        ) : error ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#ef4444', fontWeight: 700 }}>
            {error}
          </p>
        ) : leaderboard.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>No registered players on the leaderboard yet!</p>
            <p style={{ fontSize: '0.95rem' }}>Be the first player to register an account and claim #1 rank!</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            <div className="podium-section">
              {/* 2nd Place */}
              {top2 && (
                <div className="podium-card rank-2">
                  <div className="podium-crown">🥈</div>
                  <div className="podium-avatar">{(top2.username || 'P').charAt(0).toUpperCase()}</div>
                  <div className="podium-name">{top2.username}</div>
                  <div className="podium-stat">{getStatLabel(top2)}</div>
                </div>
              )}

              {/* 1st Place */}
              {top1 && (
                <div className="podium-card rank-1">
                  <div className="podium-crown">🥇</div>
                  <div className="podium-avatar">{(top1.username || 'P').charAt(0).toUpperCase()}</div>
                  <div className="podium-name">{top1.username}</div>
                  <div className="podium-stat">{getStatLabel(top1)}</div>
                </div>
              )}

              {/* 3rd Place */}
              {top3 && (
                <div className="podium-card rank-3">
                  <div className="podium-crown">🥉</div>
                  <div className="podium-avatar">{(top3.username || 'P').charAt(0).toUpperCase()}</div>
                  <div className="podium-name">{top3.username}</div>
                  <div className="podium-stat">{getStatLabel(top3)}</div>
                </div>
              )}
            </div>

            {/* Full Rankings Table (All Players) */}
            {leaderboard.length > 0 && (
              <div className="table-container">
                <table className="rankings-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Player</th>
                      <th>Gold Coins</th>
                      <th>Wins</th>
                      <th>Win Streak</th>
                      <th>Diamonds</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((p) => (
                      <tr key={p.id || p.username} className={p.rank === 1 ? 'row-gold' : p.rank === 2 ? 'row-silver' : p.rank === 3 ? 'row-bronze' : ''}>
                        <td>
                          <span className="rank-badge">#{p.rank}</span>
                        </td>
                        <td>
                          <div className="player-cell">
                            <div className="table-avatar">{(p.username || 'P').charAt(0).toUpperCase()}</div>
                            <span>{p.username}</span>
                          </div>
                        </td>
                        <td>🪙 {p.goldCoins}</td>
                        <td>🏆 {p.totalWins}</td>
                        <td>🔥 {p.currentWinStreak}</td>
                        <td>💎 {p.diamonds}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
