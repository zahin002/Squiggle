// client/src/components/lobby/RoomSetup.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaExclamationTriangle } from 'react-icons/fa';

const GENRES = [
  'Animals', 'Food & Drink', 'Nature', 'Entertainment', 'Video Games',
  'Anime & Manga', 'Historical Figures', 'Brands & Logos', 'Space & Sci-Fi', 'Idioms', 'Abstract Concepts', 'Wordle',
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
    voiceChatEnabled: false,
    powerupsEnabled: true,
    customWords: '',
    selectedGenres: [],
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isGuest = !!user?.isGuest;

  // Boundary validation checks
  const isPlayersInvalid = settings.maxPlayers !== '' && (settings.maxPlayers < 2 || settings.maxPlayers > 20);
  const isRoundsInvalid = settings.rounds !== '' && (settings.rounds < 1 || settings.rounds > 10);
  
  const customWordsCount = settings.customWords
    .split(',')
    .map((w) => w.trim())
    .filter(Boolean).length;
  
  const isCustomWordsInvalid = !isGuest && settings.gameMode === 'custom' && customWordsCount < 10;
  const isGenreInvalid = !isGuest && settings.gameMode === 'genre' && settings.selectedGenres.length === 0;

  const createRoom = async () => {
    setError('');

    // Pre-flight boundary checks with user-friendly errors
    if (settings.maxPlayers === '' || settings.maxPlayers < 2 || settings.maxPlayers > 20) {
      setError('Max Players must be between 2 and 20.');
      return;
    }

    if (settings.rounds === '' || settings.rounds < 1 || settings.rounds > 10) {
      setError('Rounds must be between 1 and 10.');
      return;
    }

    if (!isGuest && settings.gameMode === 'genre' && settings.selectedGenres.length === 0) {
      setError('Please select at least one genre for Genre Mode.');
      return;
    }

    if (!isGuest && settings.gameMode === 'custom' && customWordsCount < 10) {
      setError(`Custom Mode requires at least 10 words (currently ${customWordsCount}).`);
      return;
    }

    setLoading(true);
    try {
      const effectiveSettings = isGuest
        ? { ...settings, gameMode: 'standard', customWords: '', selectedGenres: [] }
        : settings;

      const res = await axios.post('/api/rooms/create', effectiveSettings);
      navigate(`/game/${res.data.roomId}`);
    } catch (err) {
      console.error('Failed to create room:', err);
      setError(err.response?.data?.message || 'Failed to create room. Please check your settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenreToggle = (genre, checked) => {
    setError('');
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

      {/* Form Error Notice */}
      {error && (
        <div className="rs-error-banner">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      <div className="rs-fields">
        {/* Max Players */}
        <label className="rs-label">
          Max Players (2–20)
          <input
            className={`rs-input ${isPlayersInvalid ? 'rs-input--invalid' : ''}`}
            type="number"
            min={2}
            max={20}
            value={settings.maxPlayers}
            onChange={(e) => {
              setError('');
              const val = e.target.value;
              setSettings({ ...settings, maxPlayers: val === '' ? '' : Number(val) });
            }}
          />
          {isPlayersInvalid && (
            <span className="rs-field-warning">
              ⚠️ Must be between 2 and 20 players
            </span>
          )}
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
          Rounds (1–10)
          <input
            className={`rs-input ${isRoundsInvalid ? 'rs-input--invalid' : ''}`}
            type="number"
            min={1}
            max={10}
            value={settings.rounds}
            onChange={(e) => {
              setError('');
              const val = e.target.value;
              setSettings({ ...settings, rounds: val === '' ? '' : Number(val) });
            }}
          />
          {isRoundsInvalid && (
            <span className="rs-field-warning">
              ⚠️ Must be between 1 and 10 rounds
            </span>
          )}
        </label>

        {/* Game Mode */}
        <label className="rs-label">
          Game Mode
          <select
            className="rs-input"
            value={settings.gameMode}
            onChange={(e) => {
              setError('');
              setSettings({ ...settings, gameMode: e.target.value });
            }}
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
            {isGenreInvalid && (
              <span className="rs-field-warning" style={{ marginTop: '4px' }}>
                ⚠️ Select at least one genre to continue
              </span>
            )}
          </div>
        )}

        {/* Custom words */}
        {!isGuest && settings.gameMode === 'custom' && (
          <label className="rs-label rs-label--full">
            Custom Words (minimum 10)
            <textarea
              className={`rs-textarea ${isCustomWordsInvalid ? 'rs-input--invalid' : ''}`}
              placeholder="Enter words separated by commas (minimum 10 words, e.g. laptop, guitar, ocean, volcano...)"
              value={settings.customWords}
              onChange={(e) => {
                setError('');
                setSettings({ ...settings, customWords: e.target.value });
              }}
              rows={4}
            />
            <span
              className="rs-field-warning"
              style={{ color: customWordsCount >= 10 ? '#86efac' : '#fca5a5' }}
            >
              {customWordsCount >= 10
                ? `✓ ${customWordsCount} words added (ready)`
                : `⚠️ ${customWordsCount}/10 words added (need at least 10)`}
            </span>
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

        {/* Voice Chat toggle */}
        <label className="rs-checkbox-label" title="Enable voice chat for all players in this room">
          <input
            className="rs-checkbox"
            type="checkbox"
            checked={settings.voiceChatEnabled === true}
            onChange={(e) => setSettings({ ...settings, voiceChatEnabled: e.target.checked })}
          />
          <span>Enable Voice Chat</span>
        </label>

        {/* Power-Ups toggle */}
        <label className="rs-checkbox-label" title="Allow players to use Hint Steal, Extra Clues, and Freeze Time in Standard Mode">
          <input
            className="rs-checkbox"
            type="checkbox"
            checked={settings.powerupsEnabled !== false}
            onChange={(e) => setSettings({ ...settings, powerupsEnabled: e.target.checked })}
          />
          <span>Enable Power-Ups (Standard Mode)</span>
        </label>
      </div>

      <button
        className="btn-create"
        onClick={createRoom}
        disabled={loading || isPlayersInvalid || isRoundsInvalid || isCustomWordsInvalid || isGenreInvalid}
        style={{
          opacity: loading || isPlayersInvalid || isRoundsInvalid || isCustomWordsInvalid || isGenreInvalid ? 0.6 : 1,
          cursor: loading || isPlayersInvalid || isRoundsInvalid || isCustomWordsInvalid || isGenreInvalid ? 'not-allowed' : 'pointer'
        }}
      >
        <FaPlus className="btn-icon-sm" /> {loading ? 'Creating Room...' : 'Create Room'}
      </button>
    </div>
  );
}