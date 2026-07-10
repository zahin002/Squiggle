// client/src/components/lobby/RoomSetup.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

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
      // For guests: override to standard mode before sending, even if state drifted
      const effectiveSettings = isGuest
        ? {
            ...settings,
            gameMode: 'standard',
            customWords: '',
            selectedGenres: [],
          }
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
    <div className="room-setup">
      <h2>Create Room</h2>

      {/* ── Guest restriction banner ───────────────────────────────────── */}
      {isGuest && (
        <div className="guest-restriction-banner">
          🎮 <strong>Guest Mode:</strong> Only Standard gameplay is available.{' '}
          <a href="/register">Register for free</a> to unlock Genre, Custom &amp; Wordle modes.
        </div>
      )}

      {/* ── Max players ───────────────────────────────────────────────── */}
      <label>
        Max Players (2–20):
        <input
          type="number"
          min={2}
          max={20}
          value={settings.maxPlayers}
          onChange={(e) =>
            setSettings({ ...settings, maxPlayers: +e.target.value })
          }
        />
      </label>

      {/* ── Draw time ─────────────────────────────────────────────────── */}
      <label>
        Draw Time (seconds):
        <select
          value={settings.drawTime}
          onChange={(e) =>
            setSettings({ ...settings, drawTime: +e.target.value })
          }
        >
          {[15, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 180, 210, 240].map(
            (t) => (
              <option key={t} value={t}>
                {t}s
              </option>
            )
          )}
        </select>
      </label>

      {/* ── Rounds ────────────────────────────────────────────────────── */}
      <label>
        Rounds:
        <input
          type="number"
          min={1}
          max={10}
          value={settings.rounds}
          onChange={(e) =>
            setSettings({ ...settings, rounds: +e.target.value })
          }
        />
      </label>

      {/* ── Game mode ─────────────────────────────────────────────────── */}
      <label>
        Game Mode:
        <select
          value={settings.gameMode}
          onChange={(e) =>
            setSettings({ ...settings, gameMode: e.target.value })
          }
          // Guests cannot change the game mode
          disabled={isGuest}
          title={isGuest ? 'Register to unlock additional game modes' : undefined}
        >
          <option value="standard">Standard</option>
          {/* Non-standard options are only rendered for registered users */}
          {!isGuest && <option value="genre">Genre</option>}
          {!isGuest && <option value="custom">Custom Words</option>}
          {!isGuest && <option value="wordle">Wordle Mode</option>}
        </select>
      </label>

      {/* ── Genre selector (registered users only, genre mode only) ──── */}
      {!isGuest && settings.gameMode === 'genre' && (
        <div className="genre-selector">
          <p>Select genres:</p>
          {GENRES.map((g) => (
            <label key={g}>
              <input
                type="checkbox"
                checked={settings.selectedGenres.includes(g)}
                onChange={(e) => handleGenreToggle(g, e.target.checked)}
              />
              {g}
            </label>
          ))}
        </div>
      )}

      {/* ── Custom words (registered users only, custom mode only) ────── */}
      {!isGuest && settings.gameMode === 'custom' && (
        <textarea
          placeholder="Enter words separated by commas (minimum 10 words)"
          value={settings.customWords}
          onChange={(e) =>
            setSettings({ ...settings, customWords: e.target.value })
          }
          rows={4}
        />
      )}

      {/* ── Private room toggle ───────────────────────────────────────── */}
      <label>
        <input
          type="checkbox"
          checked={settings.isPrivate}
          onChange={(e) =>
            setSettings({ ...settings, isPrivate: e.target.checked })
          }
        />
        {' '}Private Room
      </label>

      <button className="btn-create" onClick={createRoom}>Create Room</button>
    </div>
  );
}