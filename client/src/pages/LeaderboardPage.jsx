import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  FaCoins,
  FaTrophy,
  FaFire,
  FaGem,
  FaArrowLeft,
  FaChevronUp,
  FaUser,
  FaMedal,
} from 'react-icons/fa';
import '../styles/Leaderboard.css';

const TABS = [
  { key: 'goldCoins',         label: 'Gold Coins',   Icon: FaCoins  },
  { key: 'totalWins',         label: 'Total Wins',   Icon: FaTrophy },
  { key: 'currentWinStreak',  label: 'Win Streak',   Icon: FaFire   },
  { key: 'diamonds',          label: 'Diamonds',     Icon: FaGem    },
];

function getStatValue(userObj, activeTab) {
  if (activeTab === 'goldCoins')        return userObj.goldCoins;
  if (activeTab === 'totalWins')        return userObj.totalWins;
  if (activeTab === 'currentWinStreak') return userObj.currentWinStreak;
  if (activeTab === 'diamonds')         return userObj.diamonds;
  return userObj.goldCoins;
}

function getStatIcon(activeTab) {
  if (activeTab === 'goldCoins')        return <FaCoins  className="stat-icon stat-icon--gold"    />;
  if (activeTab === 'totalWins')        return <FaTrophy className="stat-icon stat-icon--trophy"  />;
  if (activeTab === 'currentWinStreak') return <FaFire   className="stat-icon stat-icon--fire"    />;
  if (activeTab === 'diamonds')         return <FaGem    className="stat-icon stat-icon--diamond" />;
  return <FaCoins className="stat-icon stat-icon--gold" />;
}

const RANK_COLORS = ['#f59e0b', '#94a3b8', '#cd7c3c'];

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard]             = useState([]);
  const [activeTab, setActiveTab]                 = useState('goldCoins');
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [error, setError]                         = useState('');
  const { user }  = useAuth();
  const navigate  = useNavigate();

  useEffect(() => {
    setLoadingLeaderboard(true);
    setError('');
    axios
      .get(`/api/users/leaderboard?sortBy=${activeTab}`)
      .then((res) => setLeaderboard(res.data))
      .catch(() => setError('Could not load leaderboard data.'))
      .finally(() => setLoadingLeaderboard(false));
  }, [activeTab]);

  const top3       = leaderboard.slice(0, 3);
  const restPlayers = leaderboard.slice(3);

  /* Podium order: 2nd | 1st | 3rd */
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podiumRanks = [2, 1, 3];

  return (
    <div className="lb-page">
      {/* ── Fixed background layers ──────────────────────────── */}
      <div className="lb-bg" aria-hidden="true" />
      <div className="lb-bg-icons" aria-hidden="true">
        <FaTrophy className="lb-doodle" />
        <FaMedal  className="lb-doodle" />
        <FaCoins  className="lb-doodle" />
        <FaGem    className="lb-doodle" />
        <FaFire   className="lb-doodle" />
        <FaTrophy className="lb-doodle" />
        <FaCoins  className="lb-doodle" />
        <FaMedal  className="lb-doodle" />
      </div>

      {/* ── Scrollable content ───────────────────────────────── */}
      <div className="lb-content">

        {/* Header */}
        <header className="lb-header">
          <button className="lb-back-btn" onClick={() => navigate('/lobby')}>
            <FaArrowLeft /> Back to Lobby
          </button>

          <div className="lb-header-center">
            <FaTrophy className="lb-header-icon" />
            <h1 className="lb-title">Global Leaderboard</h1>
          </div>

          <div className="lb-user-badge">
            <FaUser className="lb-user-icon" />
            {user ? `${user.username}${user.isGuest ? ' (Guest)' : ''}` : 'Guest'}
          </div>
        </header>

        {/* Guest banner */}
        {(!user || user.isGuest) && (
          <div className="lb-guest-banner">
            <div className="lb-guest-banner-text">
              <p className="lb-guest-banner-title">Leaderboard Rankings are for Registered Accounts</p>
              <p className="lb-guest-banner-sub">
                Create a free account to earn Gold Coins, track win streaks and climb the global leaderboard.
              </p>
            </div>
            <button className="lb-register-btn" onClick={() => navigate('/register')}>
              Create Account <FaChevronUp style={{ transform: 'rotate(90deg)', marginLeft: 4 }} />
            </button>
          </div>
        )}

        {/* Filter tabs */}
        <div className="lb-tabs">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              className={`lb-tab${activeTab === key ? ' lb-tab--active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              <Icon className="lb-tab-icon" /> {label}
            </button>
          ))}
        </div>

        {/* Body */}
        {loadingLeaderboard ? (
          <div className="lb-state-msg">
            <div className="lb-spinner" />
            <p>Loading rankings…</p>
          </div>
        ) : error ? (
          <div className="lb-state-msg lb-state-msg--error">
            <p>{error}</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="lb-state-msg">
            <FaTrophy className="lb-empty-icon" />
            <p className="lb-empty-title">No players ranked yet</p>
            <p className="lb-empty-sub">Be the first to register and claim #1!</p>
          </div>
        ) : (
          <>
            {/* Podium */}
            <div className="lb-podium">
              {podiumOrder.map((player, i) => {
                const rank = podiumRanks[i];
                return (
                  <div
                    key={player.username}
                    className={`lb-podium-card lb-podium-card--rank${rank}`}
                    style={{ '--rank-color': RANK_COLORS[rank - 1] }}
                  >
                    <div className="lb-podium-rank-label">{rank}</div>
                    <div className="lb-podium-avatar">
                      {(player.username || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div className="lb-podium-name">{player.username}</div>
                    <div className="lb-podium-stat">
                      {getStatIcon(activeTab)}
                      <span>{getStatValue(player, activeTab)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Full table */}
            <div className="lb-table-wrap">
              <table className="lb-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th><FaCoins  className="th-icon th-icon--gold"    /> Coins</th>
                    <th><FaTrophy className="th-icon th-icon--trophy"  /> Wins</th>
                    <th><FaFire   className="th-icon th-icon--fire"    /> Streak</th>
                    <th><FaGem    className="th-icon th-icon--diamond" /> Diamonds</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((p) => (
                    <tr
                      key={p.id || p.username}
                      className={
                        p.rank === 1 ? 'row-gold' :
                        p.rank === 2 ? 'row-silver' :
                        p.rank === 3 ? 'row-bronze' : ''
                      }
                    >
                      <td>
                        <span
                          className="lb-rank-badge"
                          style={{
                            '--badge-color':
                              p.rank === 1 ? '#f59e0b' :
                              p.rank === 2 ? '#94a3b8' :
                              p.rank === 3 ? '#cd7c3c' :
                              '#6366f1'
                          }}
                        >
                          {p.rank}
                        </span>
                      </td>
                      <td>
                        <div className="lb-player-cell">
                          <div className="lb-avatar">{(p.username || 'P').charAt(0).toUpperCase()}</div>
                          <span className="lb-player-name">{p.username}</span>
                        </div>
                      </td>
                      <td><span className="lb-stat-val">{p.goldCoins}</span></td>
                      <td><span className="lb-stat-val">{p.totalWins}</span></td>
                      <td><span className="lb-stat-val">{p.currentWinStreak}</span></td>
                      <td><span className="lb-stat-val">{p.diamonds}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
