import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function RoomSetup() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    maxPlayers: 8,
    drawTime: 80,
    rounds: 3,
    wordCount: 3,
    hints: 2,
    gameMode: 'standard', // 'standard' | 'custom' | 'genre' | 'wordle'
    isPrivate: false,
    customWords: '',
    selectedGenres: []
  });

  const genres = ['Animals', 'Food & Drink', 'Nature', 'Entertainment', 'Video Games', 
                  'Anime & Manga', 'Historical Figures', 'Brands & Logos', 'Space & Sci-Fi', 'Idioms'];

  const createRoom = async () => {
    try {
      const res = await axios.post('/api/rooms/create', settings);
      // Navigate to game page — roomId comes from the server
      navigate(`/game/${res.data.roomId}`);
    } catch (err) {
      console.error('Failed to create room:', err);
    }
  };

  return (
    <div className="room-setup">
      <h2>Create Room</h2>
      <label>Max Players (2–20):
        <input type="number" min={2} max={20}
          value={settings.maxPlayers}
          onChange={e => setSettings({ ...settings, maxPlayers: +e.target.value })}
        />
      </label>
      <label>Draw Time (seconds):
        <select value={settings.drawTime}
          onChange={e => setSettings({ ...settings, drawTime: +e.target.value })}>
          {[15,20,30,40,50,60,70,80,90,100,120,150,180,210,240].map(t =>
            <option key={t} value={t}>{t}s</option>
          )}
        </select>
      </label>
      <label>Rounds:
        <input type="number" min={1} max={10}
          value={settings.rounds}
          onChange={e => setSettings({ ...settings, rounds: +e.target.value })}
        />
      </label>
      <label>Game Mode:
        <select value={settings.gameMode}
          onChange={e => setSettings({ ...settings, gameMode: e.target.value })}>
          <option value="standard">Standard</option>
          <option value="genre">Genre</option>
          <option value="custom">Custom Words</option>
          <option value="wordle">Wordle Mode</option>
        </select>
      </label>
      {settings.gameMode === 'genre' && (
        <div className="genre-selector">
          {genres.map(g => (
            <label key={g}>
              <input type="checkbox"
                checked={settings.selectedGenres.includes(g)}
                onChange={e => {
                  const updated = e.target.checked
                    ? [...settings.selectedGenres, g]
                    : settings.selectedGenres.filter(x => x !== g);
                  setSettings({ ...settings, selectedGenres: updated });
                }} />
              {g}
            </label>
          ))}
        </div>
      )}
      {settings.gameMode === 'custom' && (
        <textarea
          placeholder="Enter words separated by commas (min 10 words)"
          value={settings.customWords}
          onChange={e => setSettings({ ...settings, customWords: e.target.value })}
          rows={4}
        />
      )}
      <label>
        <input type="checkbox" checked={settings.isPrivate}
          onChange={e => setSettings({ ...settings, isPrivate: e.target.checked })}
        /> Private Room
      </label>
      <button onClick={createRoom}>Create Room</button>
    </div>
  );
}