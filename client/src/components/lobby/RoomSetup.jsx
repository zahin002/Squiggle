// client/src/components/lobby/RoomSetup.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  FaPlus,
  FaExclamationTriangle,
  FaPaintBrush,
  FaLayerGroup,
  FaPencilAlt,
  FaThLarge,
  FaChevronDown,
  FaLock,
} from 'react-icons/fa';

const GENRES = [
  'Animals', 'Food & Drink', 'Nature', 'Entertainment', 'Video Games',
  'Anime & Manga', 'Historical Figures', 'Brands & Logos', 'Space & Sci-Fi', 'Idioms', 'Abstract Concepts', 'Wordle',
];

const GAME_MODES = [
  { id: 'standard', label: 'Standard', Icon: FaPaintBrush, color: '#38bdf8' },
  { id: 'genre',    label: 'Genre',    Icon: FaLayerGroup, color: '#c084fc' },
  { id: 'custom',   label: 'Custom',   Icon: FaPencilAlt,  color: '#fbbf24' },
  { id: 'wordle',   label: 'Wordle',   Icon: FaThLarge,    color: '#34d399' },
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
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const modeDropdownRef = useRef(null);

  const isGuest = !!user?.isGuest;

  // Close mode dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(e.target)) {
        setModeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          Max Players
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
          Draw Time
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
        <div className="rs-label" ref={modeDropdownRef} style={{ position: 'relative' }}>
          <span>Game Mode</span>
          <button
            type="button"
            className="rs-input rs-mode-trigger"
            onClick={() => !isGuest && setModeDropdownOpen((prev) => !prev)}
            disabled={isGuest}
            title={isGuest ? 'Register to unlock additional game modes' : 'Select Game Mode'}
            aria-expanded={modeDropdownOpen}
          >
            <span className="rs-mode-current">
              {(() => {
                const current = GAME_MODES.find((m) => m.id === settings.gameMode) || GAME_MODES[0];
                const IconComponent = current.Icon;
                return (
                  <>
                    <IconComponent className="rs-mode-icon" style={{ color: current.color }} />
                    <span className="rs-mode-label">{current.label}</span>
                  </>
                );
              })()}
            </span>
            <FaChevronDown
              className={`rs-mode-chevron ${modeDropdownOpen ? 'rs-mode-chevron--open' : ''}`}
            />
          </button>

          {modeDropdownOpen && !isGuest && (
            <div className="rs-mode-dropdown-menu" role="listbox">
              {GAME_MODES.map((mode) => {
                const IconComponent = mode.Icon;
                const isSelected = settings.gameMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`rs-mode-option ${isSelected ? 'rs-mode-option--selected' : ''}`}
                    onClick={() => {
                      setError('');
                      setSettings({ ...settings, gameMode: mode.id });
                      setModeDropdownOpen(false);
                    }}
                  >
                    <div className="rs-mode-option-left">
                      <IconComponent className="rs-mode-icon" style={{ color: mode.color }} />
                      <span className="rs-mode-label">{mode.label}</span>
                    </div>
                    {isSelected && <span className="rs-mode-badge">Selected</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

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
            Custom Words
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

        {/* Power-Ups toggle - only visible in Standard Mode */}
        {settings.gameMode === 'standard' && (
          <label className="rs-checkbox-label" title="Allow players to use Hint Steal and Freeze Time">
            <input
              className="rs-checkbox"
              type="checkbox"
              checked={settings.powerupsEnabled !== false}
              onChange={(e) => setSettings({ ...settings, powerupsEnabled: e.target.checked })}
            />
            <span>Enable Power-Ups</span>
          </label>
        )}
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