// client/src/components/lobby/RoomSetup.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaExclamationTriangle } from 'react-icons/fa';

const GENRES = [
  'Animals', 'Food & Drink', 'Nature', 'Entertainment', 'Video Games',
  'Anime & Manga', 'Historical Figures', 'Brands & Logos', 'Space & Sci-Fi', 'Idioms',
];

export default function RoomSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [settings, setSettings] = useState({
    maxPlayers: 8,
    drawTime: 80,
    rounds: 3,
    wordCount: 3,
    hints: 2,
    gameMode: 'standard',
    isPrivate: false,
    customWords: '',
    selectedGenres: [],
  });

  const isGuest = !!user?.isGuest;

  const createRoom = async () => {
    try {
      const effectiveSettings = isGuest
        ? { ...settings, gameMode: 'standard', customWords: '', selectedGenres: [] }
        : settings;
      const res = await axios.post('/api/rooms/create', effectiveSettings);
      navigate(`/game/${res.data.roomId}`);
    } catch (err) {
      console.error('Failed to create room:', err);
    }
  };

  const handleGenreToggle = (genre, checked) => {
    const updated = checked
      ? [...settings.selectedGenres, genre]
      : settings.selectedGenres.filter((g) => g !== genre);
    setSettings({ ...settings, selectedGenres: updated });
  };

  return (
    <div className="lobby-panel lobby-panel--create">
      <h2 className="lobby-panel-title">
        <FaPlus className="panel-title-icon panel-title-icon--purple" />
        Create Room
      </h2>

      {/* Guest restriction notice */}
      {isGuest && (
        <div className="guest-restriction-banner">
          <FaExclamationTriangle className="guest-banner-icon" />
          <div>
            <strong>Guest Mode:</strong> Only Standard gameplay is available.{' '}
            <a href="/register" className="guest-register-link">Register for free</a> to unlock Genre, Custom &amp; Wordle modes.
          </div>
        </div>
      )}

      <div className="rs-fields">
        {/* Max Players */}
        <label className="rs-label">
          Max Players (2–20)
          <input
            className="rs-input"
            type="number"
            min={2}
            max={20}
            value={settings.maxPlayers}
            onChange={(e) => setSettings({ ...settings, maxPlayers: +e.target.value })}
          />
        </label>

        {/* Draw Time */}
        <label className="rs-label">
          Draw Time (seconds)
          <select
            className="rs-input"
            value={settings.drawTime}
            onChange={(e) => setSettings({ ...settings, drawTime: +e.target.value })}
          >
            {[15, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 180, 210, 240].map((t) => (
              <option key={t} value={t}>{t}s</option>
            ))}
          </select>
        </label>

        {/* Rounds */}
        <label className="rs-label">
          Rounds
          <input
            className="rs-input"
            type="number"
            min={1}
            max={10}
            value={settings.rounds}
            onChange={(e) => setSettings({ ...settings, rounds: +e.target.value })}
          />
        </label>

        {/* Game Mode */}
        <label className="rs-label">
          Game Mode
          <select
            className="rs-input"
            value={settings.gameMode}
            onChange={(e) => setSettings({ ...settings, gameMode: e.target.value })}
            disabled={isGuest}
            title={isGuest ? 'Register to unlock additional game modes' : undefined}
          >
            <option value="standard">Standard</option>
            {!isGuest && <option value="genre">Genre</option>}
            {!isGuest && <option value="custom">Custom Words</option>}
            {!isGuest && <option value="wordle">Wordle Mode</option>}
          </select>
        </label>

        {/* Genre selector */}
        {!isGuest && settings.gameMode === 'genre' && (
          <div className="genre-section">
            <p className="genre-label">Select Genres</p>
            <div className="genre-grid">
              {GENRES.map((g) => (
                <label key={g} className={`genre-chip${settings.selectedGenres.includes(g) ? ' genre-chip--active' : ''}`}>
                  <input
                    type="checkbox"
                    className="genre-checkbox"
                    checked={settings.selectedGenres.includes(g)}
                    onChange={(e) => handleGenreToggle(g, e.target.checked)}
                  />
                  {g}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Custom words */}
        {!isGuest && settings.gameMode === 'custom' && (
          <label className="rs-label rs-label--full">
            Custom Words
            <textarea
              className="rs-textarea"
              placeholder="Enter words separated by commas (minimum 10 words)"
              value={settings.customWords}
              onChange={(e) => setSettings({ ...settings, customWords: e.target.value })}
              rows={4}
            />
          </label>
        )}

        {/* Private toggle */}
        <label className="rs-checkbox-label">
          <input
            className="rs-checkbox"
            type="checkbox"
            checked={settings.isPrivate}
            onChange={(e) => setSettings({ ...settings, isPrivate: e.target.checked })}
          />
          <span>Private Room</span>
        </label>
      </div>

      <button className="btn-create" onClick={createRoom}>
        <FaPlus className="btn-icon-sm" /> Create Room
      </button>
    </div>
  );
}