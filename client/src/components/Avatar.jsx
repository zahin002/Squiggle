import { memo } from 'react';

// Preset color palette for avatar skin/background (including natural skintones & vibrant game tones)
export const AVATAR_COLOR_PRESETS = [
  '#f5c6a5', // Warm Tan / Peach (classic cartoon)
  '#ffd1b3', // Fair Peach
  '#d29b71', // Golden Caramel
  '#a1683d', // Caramel Bronze
  '#6b3f21', // Rich Chestnut / Dark Brown
  '#3d2314', // Deep Espresso
  '#1a64ff', // Electric Blue
  '#7c4dff', // Neon Purple
  '#06b6d4', // Cyan
  '#10b981', // Emerald Green
  '#f59e0b', // Warm Amber
  '#f43f5e', // Vivid Rose
  '#ec4899', // Pink
  '#f97316', // Orange
  '#64748b', // Slate
];

export const HAT_OPTIONS = [
  { id: 'none', label: 'No Hat' },
  { id: 'cap', label: 'Baseball Cap' },
  { id: 'beanie', label: 'Beanie' },
  { id: 'tophat', label: 'Top Hat' },
  { id: 'cowboy', label: 'Cowboy' },
  { id: 'crown', label: 'Royal Crown' },
  { id: 'party', label: 'Party Cone' },
  { id: 'headband', label: 'Ninja Band' },
  { id: 'viking', label: 'Viking Horns' },
  { id: 'chef', label: 'Chef Toque' },
];

export const EYEBROW_OPTIONS = [
  { id: 'natural', label: 'Natural' },
  { id: 'arched', label: 'Arched' },
  { id: 'angry', label: 'Fierce' },
  { id: 'bushy', label: 'Bushy' },
  { id: 'sad', label: 'Innocent' },
  { id: 'unibrow', label: 'Unibrow' },
  { id: 'raised', label: 'Curious' },
];

export const EYE_OPTIONS = [
  { id: 'normal', label: 'Normal' },
  { id: 'dot', label: 'Dot' },
  { id: 'x_x', label: 'Dead' },
  { id: 'girlie', label: 'Girlie' },
  { id: 'cool', label: 'Sunglasses' },
  { id: 'happy', label: 'Happy' },
  { id: 'wink', label: 'Wink' },
  { id: 'wide', label: 'Wide' },
  { id: 'sleepy', label: 'Sleepy' },
  { id: 'sparkle', label: 'Starry' },
  { id: 'glasses', label: 'Glasses' },
  { id: 'monocle', label: 'Monocle' },
];

export const MOUTH_OPTIONS = [
  { id: 'smile', label: 'Smile' },
  { id: 'grin', label: 'Grin' },
  { id: 'open', label: 'Laugh' },
  { id: 'surprised', label: 'Round O' },
  { id: 'smirk', label: 'Smirk' },
  { id: 'tongue', label: 'Tongue Out' },
  { id: 'neutral', label: 'Chill' },
  { id: 'frown', label: 'Pout' },
];

export const MOUSTACHE_OPTIONS = [
  { id: 'none', label: 'Clean' },
  { id: 'classic', label: 'Gentleman' },
  { id: 'handlebar', label: 'Handlebar' },
  { id: 'pencil', label: 'Pencil' },
  { id: 'chevron', label: 'Chevron' },
  { id: 'stubble', label: 'Stubble' },
];

export const BEARD_OPTIONS = [
  { id: 'none', label: 'Clean' },
  { id: 'goatee', label: 'Goatee' },
  { id: 'full', label: 'Full Beard' },
  { id: 'chinstrap', label: 'Chinstrap' },
  { id: 'curly', label: 'Curly Beard' },
  { id: 'pointed', label: 'Wizard' },
];

// Helper to randomly pick an element from an array
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Generate a random avatar configuration
export function getRandomAvatar(currentColor) {
  return {
    color: currentColor && Math.random() > 0.4 ? currentColor : pickRandom(AVATAR_COLOR_PRESETS),
    hat: pickRandom(HAT_OPTIONS).id,
    eyebrows: pickRandom(EYEBROW_OPTIONS).id,
    eyes: pickRandom(EYE_OPTIONS).id,
    mouth: pickRandom(MOUTH_OPTIONS).id,
    moustache: pickRandom(MOUSTACHE_OPTIONS).id,
    beard: pickRandom(BEARD_OPTIONS).id,
  };
}

// Ensure an avatar object has safe defaults
export function normalizeAvatar(raw) {
  if (!raw) {
    return {
      color: '#f5c6a5',
      hat: 'none',
      eyebrows: 'natural',
      eyes: 'normal',
      mouth: 'smile',
      moustache: 'none',
      beard: 'none',
    };
  }
  // Support legacy avatar if it was just a string color
  if (typeof raw === 'string') {
    return {
      color: raw.startsWith('#') ? raw : '#f5c6a5',
      hat: 'none',
      eyebrows: 'natural',
      eyes: 'normal',
      mouth: 'smile',
      moustache: 'none',
      beard: 'none',
    };
  }
  const beard = raw.beard === 'soulpatch' ? 'curly' : (raw.beard || 'none');
  return {
    color: raw.color || '#f5c6a5',
    hat: raw.hat || 'none',
    eyebrows: raw.eyebrows || 'natural',
    eyes: raw.eyes || 'normal',
    mouth: raw.mouth || 'smile',
    moustache: raw.moustache || 'none',
    beard,
  };
}

// ── SVG Renderers for Parts (0-100 coordinate space) ──

function renderHat(style) {
  switch (style) {
    case 'cap':
      return (
        <g id="hat-cap">
          <path
            d="M 21 18 C 21 6 35 2 50 2 C 65 2 79 6 79 18 Z"
            fill="#ef4444"
            stroke="#0f172a"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <circle cx="50" cy="3" r="2.8" fill="#fbbf24" stroke="#0f172a" strokeWidth="2" />
          {/* Visor Brim (sits at y=18, leaves forehead clear for eyebrows at y=29) */}
          <path
            d="M 18 18 Q 50 12 86 19 C 82 23 67 24 50 21 C 33 18 18 21 18 18 Z"
            fill="#dc2626"
            stroke="#0f172a"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
        </g>
      );
    case 'beanie':
      return (
        <g id="hat-beanie">
          <circle cx="50" cy="2" r="5" fill="#f59e0b" stroke="#0f172a" strokeWidth="2.5" />
          <path
            d="M 20 18 C 20 5 35 2 50 2 C 65 2 80 5 80 18 Z"
            fill="#3b82f6"
            stroke="#0f172a"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <path d="M 36 7 Q 34 13 33 18" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" />
          <path d="M 50 4 L 50 18" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" />
          <path d="M 64 7 Q 66 13 67 18" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" />
          <path
            d="M 18 15 Q 50 17 82 15 L 81 21 Q 50 23 19 21 Z"
            fill="#2563eb"
            stroke="#0f172a"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
        </g>
      );
    case 'tophat':
      return (
        <g id="hat-tophat">
          <ellipse cx="50" cy="18" rx="35" ry="5" fill="#1e293b" stroke="#0f172a" strokeWidth="3" />
          <path
            d="M 30 18 L 32 1 L 68 1 L 70 18 Z"
            fill="#1e293b"
            stroke="#0f172a"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <ellipse cx="50" cy="1.5" rx="18" ry="2.2" fill="#334155" stroke="#0f172a" strokeWidth="1.8" />
          <path d="M 30.6 13 L 69.4 13 L 70 18 L 30 18 Z" fill="#e11d48" stroke="#0f172a" strokeWidth="1.4" />
        </g>
      );
    case 'cowboy':
      return (
        <g id="hat-cowboy">
          <path
            d="M 8 18 Q 28 13 50 15 Q 72 13 92 18 Q 74 23 50 21 Q 26 23 8 18 Z"
            fill="#854d0e"
            stroke="#0f172a"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M 27 16 C 27 3 35 5 43 9 C 48 11 52 11 57 9 C 65 5 73 3 73 16 Z"
            fill="#a16207"
            stroke="#0f172a"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M 27 14 Q 50 16 73 14 L 73 17 Q 50 19 27 17 Z" fill="#451a03" />
        </g>
      );
    case 'crown':
      return (
        <g id="hat-crown">
          <path
            d="M 22 18 L 20 6 L 35 13 L 50 4 L 65 13 L 80 6 L 78 18 Z"
            fill="#fbbf24"
            stroke="#0f172a"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M 22 17 L 78 17 L 77 21 L 23 21 Z" fill="#f59e0b" stroke="#0f172a" strokeWidth="2.4" strokeLinejoin="round" />
          <circle cx="50" cy="12" r="2.8" fill="#ef4444" stroke="#0f172a" strokeWidth="1.4" />
          <circle cx="34" cy="15" r="2" fill="#3b82f6" stroke="#0f172a" strokeWidth="1.2" />
          <circle cx="66" cy="15" r="2" fill="#10b981" stroke="#0f172a" strokeWidth="1.2" />
        </g>
      );
    case 'party':
      return (
        <g id="hat-party">
          <path
            d="M 50 0 L 27 20 Q 50 23 73 20 Z"
            fill="#ec4899"
            stroke="#0f172a"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M 43 8 L 57 8 Q 50 11 43 8 Z" fill="#fbbf24" />
          <path d="M 35 15 L 65 15 Q 50 18 35 15 Z" fill="#06b6d4" />
          <circle cx="50" cy="0" r="4.2" fill="#facc15" stroke="#0f172a" strokeWidth="1.8" />
        </g>
      );
    case 'headband':
      return (
        <g id="hat-headband">
          <path
            d="M 20 18 Q 50 21 80 18 L 80 23 Q 50 26 20 23 Z"
            fill="#ef4444"
            stroke="#0f172a"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          <rect x="42" y="19" width="16" height="5" rx="1.5" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.4" />
          <path d="M 20 20 C 14 22 12 28 8 34 L 12 34 C 15 29 18 24 21 22 Z" fill="#dc2626" stroke="#0f172a" strokeWidth="1.4" />
        </g>
      );
    case 'viking':
      return (
        <g id="hat-viking">
          <path
            d="M 24 16 C 14 14 8 7 6 1 C 12 6 20 11 25 13 Z"
            fill="#fef08a"
            stroke="#0f172a"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path
            d="M 76 16 C 86 14 92 7 94 1 C 88 6 80 11 75 13 Z"
            fill="#fef08a"
            stroke="#0f172a"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path
            d="M 21 19 C 21 7 34 3 50 3 C 66 3 79 7 79 19 Z"
            fill="#64748b"
            stroke="#0f172a"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <path d="M 20 17 Q 50 19 80 17 L 79 21 Q 50 23 21 21 Z" fill="#475569" stroke="#0f172a" strokeWidth="1.8" />
          <circle cx="50" cy="19" r="1.4" fill="#f8fafc" />
        </g>
      );
    case 'chef':
      return (
        <g id="hat-chef">
          <path
            d="M 30 17 C 20 15 16 5 24 1 C 30 -4 43 -4 48 0 C 53 -4 66 -4 73 1 C 82 5 78 15 70 17 Z"
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <path
            d="M 29 16 L 71 16 L 70 21 L 30 21 Z"
            fill="#f1f5f9"
            stroke="#0f172a"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
        </g>
      );
    case 'none':
    default:
      return null;
  }
}

function renderEyebrows(style) {
  const strokeColor = '#0f172a';
  switch (style) {
    case 'arched':
      return (
        <g stroke={strokeColor} strokeWidth="3.4" strokeLinecap="round" fill="none">
          <path d="M 28 30 Q 36 23 44 29" />
          <path d="M 56 29 Q 64 23 72 30" />
        </g>
      );
    case 'angry':
      return (
        <g stroke={strokeColor} strokeWidth="3.8" strokeLinecap="round" fill="none">
          <path d="M 28 27 L 44 33" />
          <path d="M 72 27 L 56 33" />
        </g>
      );
    case 'bushy':
      return (
        <g fill={strokeColor}>
          <path d="M 27 30 Q 36 24 45 30 C 43 33 29 34 27 30 Z" />
          <path d="M 55 30 Q 64 24 73 30 C 71 34 57 33 55 30 Z" />
        </g>
      );
    case 'sad':
      return (
        <g stroke={strokeColor} strokeWidth="3.4" strokeLinecap="round" fill="none">
          <path d="M 29 33 Q 36 27 44 27" />
          <path d="M 56 27 Q 64 27 71 33" />
        </g>
      );
    case 'unibrow':
      return (
        <path
          d="M 27 31 Q 38 25 50 30 Q 62 25 73 31"
          stroke={strokeColor}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      );
    case 'raised':
      return (
        <g stroke={strokeColor} strokeWidth="3.4" strokeLinecap="round" fill="none">
          <path d="M 28 31 Q 36 28 44 31" />
          <path d="M 56 25 Q 64 18 73 25" />
        </g>
      );
    case 'natural':
    default:
      return (
        <g stroke={strokeColor} strokeWidth="3.4" strokeLinecap="round" fill="none">
          <path d="M 28 30 Q 36 27 44 30" />
          <path d="M 56 30 Q 64 27 72 30" />
        </g>
      );
  }
}

function renderEyes(style) {
  switch (style) {
    case 'x_x':
      return (
        <g stroke="#0f172a" strokeWidth="3.8" strokeLinecap="round">
          {/* Left X */}
          <path d="M 31 36 L 41 46" />
          <path d="M 41 36 L 31 46" />
          {/* Right X */}
          <path d="M 59 36 L 69 46" />
          <path d="M 69 36 L 59 46" />
        </g>
      );
    case 'dot':
      return (
        <g>
          <circle cx="36" cy="41" r="4.8" fill="#ffffff" />
          <circle cx="36" cy="41" r="3.4" fill="#0f172a" />
          <circle cx="64" cy="41" r="4.8" fill="#ffffff" />
          <circle cx="64" cy="41" r="3.4" fill="#0f172a" />
        </g>
      );
    case 'girlie':
      return (
        <g>
          {/* Left Eye */}
          <ellipse cx="36" cy="42" rx="6.8" ry="7.8" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
          <circle cx="36" cy="42" r="4.8" fill="#0f172a" />
          <circle cx="34.5" cy="40" r="2.3" fill="#ffffff" />
          <circle cx="38" cy="44" r="1.1" fill="#ffffff" />
          {/* Left Lashes */}
          <path d="M 28 38 Q 36 30 44 37" stroke="#0f172a" strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <path d="M 44 37 L 47 34" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 42 40 L 46 39" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />

          {/* Right Eye */}
          <ellipse cx="64" cy="42" rx="6.8" ry="7.8" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
          <circle cx="64" cy="42" r="4.8" fill="#0f172a" />
          <circle cx="62.5" cy="40" r="2.3" fill="#ffffff" />
          <circle cx="66" cy="44" r="1.1" fill="#ffffff" />
          {/* Right Lashes */}
          <path d="M 56 37 Q 64 30 72 38" stroke="#0f172a" strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <path d="M 72 37 L 75 34" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 70 40 L 74 39" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case 'cool':
      return (
        <g>
          {/* Sunglasses */}
          <path
            d="M 23 37 L 47 37 C 47 46 42 50 35 50 C 28 50 23 46 23 37 Z"
            fill="#0f172a"
            stroke="#ffffff"
            strokeWidth="1.6"
          />
          <path
            d="M 53 37 L 77 37 C 77 46 72 50 65 50 C 58 50 53 46 53 37 Z"
            fill="#0f172a"
            stroke="#ffffff"
            strokeWidth="1.6"
          />
          <path d="M 46 39 L 54 39" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M 27 39 L 33 47" stroke="rgba(255,255,255,0.5)" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M 57 39 L 63 47" stroke="rgba(255,255,255,0.5)" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      );
    case 'happy':
      return (
        <g stroke="#0f172a" strokeWidth="3.6" strokeLinecap="round" fill="none">
          <path d="M 28 42 Q 36 35 44 42" />
          <path d="M 56 42 Q 64 35 72 42" />
        </g>
      );
    case 'wink':
      return (
        <g>
          <circle cx="36" cy="41" r="5.6" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
          <circle cx="37" cy="41" r="2.5" fill="#0f172a" />
          <circle cx="38" cy="40" r="1" fill="#ffffff" />
          <path d="M 56 42 Q 64 35 72 42" stroke="#0f172a" strokeWidth="3.6" strokeLinecap="round" fill="none" />
        </g>
      );
    case 'wide':
      return (
        <g>
          <ellipse cx="36" cy="41" rx="7.8" ry="8.8" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
          <circle cx="36.5" cy="41" r="3.8" fill="#0f172a" />
          <circle cx="38" cy="39" r="1.5" fill="#ffffff" />

          <ellipse cx="64" cy="41" rx="7.8" ry="8.8" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
          <circle cx="63.5" cy="41" r="3.8" fill="#0f172a" />
          <circle cx="65" cy="39" r="1.5" fill="#ffffff" />
        </g>
      );
    case 'sleepy':
      return (
        <g stroke="#0f172a" strokeWidth="3.4" strokeLinecap="round" fill="none">
          <path d="M 28 42 L 44 42" />
          <path d="M 56 42 L 72 42" />
          <circle cx="36" cy="43" r="2.1" fill="#0f172a" stroke="none" />
          <circle cx="64" cy="43" r="2.1" fill="#0f172a" stroke="none" />
        </g>
      );
    case 'sparkle':
      return (
        <g fill="#0f172a">
          <path d="M 36 34 Q 36 41 43 41 Q 36 41 36 48 Q 36 41 29 41 Q 36 41 36 34 Z" />
          <path d="M 64 34 Q 64 41 71 41 Q 64 41 64 48 Q 64 41 57 41 Q 64 41 64 34 Z" />
        </g>
      );
    case 'glasses':
      return (
        <g>
          <circle cx="36" cy="41" r="4.4" fill="#ffffff" />
          <circle cx="36.5" cy="41" r="2.2" fill="#0f172a" />
          <circle cx="64" cy="41" r="4.4" fill="#ffffff" />
          <circle cx="63.5" cy="41" r="2.2" fill="#0f172a" />
          <circle cx="36" cy="41" r="8.8" fill="none" stroke="#0f172a" strokeWidth="2.5" />
          <circle cx="64" cy="41" r="8.8" fill="none" stroke="#0f172a" strokeWidth="2.5" />
          <path d="M 44.8 41 L 55.2 41" stroke="#0f172a" strokeWidth="2.5" />
          <path d="M 18 41 L 27.2 41" stroke="#0f172a" strokeWidth="2.2" />
          <path d="M 72.8 41 L 82 41" stroke="#0f172a" strokeWidth="2.2" />
        </g>
      );
    case 'monocle':
      return (
        <g>
          <circle cx="36" cy="41" r="5.6" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
          <circle cx="37" cy="41" r="2.5" fill="#0f172a" />
          <circle cx="64" cy="41" r="5.6" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
          <circle cx="65" cy="41" r="2.5" fill="#0f172a" />
          <circle cx="64" cy="41" r="9" fill="rgba(255,255,255,0.2)" stroke="#fbbf24" strokeWidth="2.5" />
          <path d="M 64 50 Q 70 60 75 70" fill="none" stroke="#fbbf24" strokeWidth="1.6" strokeDasharray="2,2" />
        </g>
      );
    case 'normal':
    default:
      return (
        <g>
          <circle cx="36" cy="41" r="6" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
          <circle cx="37" cy="41" r="2.9" fill="#0f172a" />
          <circle cx="38" cy="39.5" r="1.1" fill="#ffffff" />

          <circle cx="64" cy="41" r="6" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
          <circle cx="63" cy="41" r="2.9" fill="#0f172a" />
          <circle cx="64" cy="39.5" r="1.1" fill="#ffffff" />
        </g>
      );
  }
}

function renderMouth(style) {
  switch (style) {
    case 'grin':
      return (
        <g>
          <path
            d="M 36 52 Q 50 65 64 52 Z"
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M 38 54 Q 50 59 62 54" stroke="#94a3b8" strokeWidth="1.4" fill="none" />
        </g>
      );
    case 'open':
      return (
        <g>
          <path
            d="M 36 51 Q 50 69 64 51 Z"
            fill="#e11d48"
            stroke="#0f172a"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          <path d="M 43 60 Q 50 56 57 60 Q 50 66 43 60 Z" fill="#fda4af" />
          <path d="M 38 52 Q 50 56 62 52" stroke="#ffffff" strokeWidth="2.2" fill="none" />
        </g>
      );
    case 'surprised':
      return (
        <ellipse
          cx="50"
          cy="54"
          rx="6"
          ry="7.5"
          fill="#0f172a"
          stroke="#0f172a"
          strokeWidth="2.5"
        />
      );
    case 'smirk':
      return (
        <path
          d="M 39 54 Q 52 53 63 49"
          stroke="#0f172a"
          strokeWidth="3.4"
          strokeLinecap="round"
          fill="none"
        />
      );
    case 'tongue':
      return (
        <g>
          <path d="M 37 52 Q 50 59 63 52" stroke="#0f172a" strokeWidth="3.2" strokeLinecap="round" fill="none" />
          <path
            d="M 46 54 C 46 63 54 63 54 54 Z"
            fill="#fb7185"
            stroke="#0f172a"
            strokeWidth="2"
          />
          <path d="M 50 54 L 50 59" stroke="#e11d48" strokeWidth="1.2" />
        </g>
      );
    case 'neutral':
      return (
        <path
          d="M 39 54 L 61 54"
          stroke="#0f172a"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
      );
    case 'frown':
      return (
        <path
          d="M 37 56 Q 50 48 63 56"
          stroke="#0f172a"
          strokeWidth="3.4"
          strokeLinecap="round"
          fill="none"
        />
      );
    case 'smile':
    default:
      return (
        <path
          d="M 37 51 Q 50 61 63 51"
          stroke="#0f172a"
          strokeWidth="3.6"
          strokeLinecap="round"
          fill="none"
        />
      );
  }
}

function renderMoustache(style) {
  switch (style) {
    case 'classic':
      return (
        <path
          d="M 50 48 C 45 45 36 44 30 49 C 34 53 44 54 50 51 C 56 54 66 53 70 49 C 64 44 55 45 50 48 Z"
          fill="#1e293b"
          stroke="#0f172a"
          strokeWidth="1.8"
        />
      );
    case 'handlebar':
      return (
        <path
          d="M 50 49 Q 40 46 28 50 Q 22 53 21 48 Q 24 44 34 45 Q 45 46 50 49 Q 55 46 66 45 Q 76 44 79 48 Q 78 53 72 50 Q 60 46 50 49 Z"
          fill="#1e293b"
          stroke="#0f172a"
          strokeWidth="1.8"
        />
      );
    case 'pencil':
      return (
        <g stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round">
          <path d="M 36 48 Q 44 49 48 48" />
          <path d="M 52 48 Q 56 49 64 48" />
        </g>
      );
    case 'chevron':
      return (
        <path
          d="M 50 47 L 32 53 C 34 56 43 55 50 53 C 57 55 66 56 68 53 Z"
          fill="#1e293b"
          stroke="#0f172a"
          strokeWidth="1.8"
        />
      );
    case 'stubble':
      return (
        <g fill="#0f172a" opacity="0.65">
          <circle cx="38" cy="48" r="0.9" />
          <circle cx="43" cy="47" r="0.9" />
          <circle cx="48" cy="48" r="0.9" />
          <circle cx="52" cy="48" r="0.9" />
          <circle cx="57" cy="47" r="0.9" />
          <circle cx="62" cy="48" r="0.9" />
        </g>
      );
    case 'none':
    default:
      return null;
  }
}

function renderBeard(style) {
  switch (style) {
    case 'goatee':
      return (
        <path
          d="M 44 56 Q 50 54 56 56 L 53 65 Q 50 68 47 65 Z"
          fill="#1e293b"
          stroke="#0f172a"
          strokeWidth="1.5"
        />
      );
    case 'full':
      return (
        <path
          d="M 23 44 C 21 57 34 66 50 66 C 66 66 79 57 77 44 C 72 55 62 58 50 58 C 38 58 28 55 23 44 Z"
          fill="#1e293b"
          stroke="#0f172a"
          strokeWidth="2"
        />
      );
    case 'chinstrap':
      return (
        <path
          d="M 23 43 C 22 53 36 60 50 60 C 64 60 78 53 77 43 C 74 50 62 56 50 56 C 38 56 26 50 23 43 Z"
          fill="#1e293b"
          stroke="#0f172a"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      );
    case 'curly':
    case 'soulpatch':
      return (
        <g id="beard-curly">
          <path
            d="M 24 44 C 21 48 20 53 23 57 C 21 61 24 66 29 68 C 32 72 38 74 44 74 C 47 75 53 75 56 74 C 62 74 68 72 71 68 C 76 66 79 61 77 57 C 80 53 79 48 76 44 C 72 52 63 57 50 57 C 37 57 28 52 24 44 Z"
            fill="#1e293b"
            stroke="#0f172a"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M 33 63 C 31 60 35 58 37 60 C 38 62 36 64 34 64"
            fill="none"
            stroke="#475569"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M 47 67 C 45 64 49 62 51 64 C 52 66 50 68 48 68"
            fill="none"
            stroke="#475569"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M 61 63 C 59 60 63 58 65 60 C 66 62 64 64 62 64"
            fill="none"
            stroke="#475569"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </g>
      );
    case 'pointed':
      return (
        <path
          d="M 43 56 Q 50 55 57 56 L 50 70 Z"
          fill="#1e293b"
          stroke="#0f172a"
          strokeWidth="1.8"
        />
      );
    case 'none':
    default:
      return null;
  }
}

function AvatarComponent({ avatar, size = 48, className = '', username = '', isStage = false }) {
  const norm = normalizeAvatar(avatar);

  const baseColor = norm.color || '#f5c6a5';

  return (
    <div
      className={`squiggle-avatar-wrap ${isStage ? 'is-stage' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: isStage ? '12px' : '50%',
        boxShadow: isStage ? 'none' : `0 4px 16px ${baseColor}33`,
        flexShrink: 0,
        overflow: isStage ? 'visible' : 'hidden',
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        style={{
          borderRadius: isStage ? '0' : '50%',
          display: 'block',
          overflow: isStage ? 'visible' : 'hidden',
        }}
      >
        <defs>
          <radialGradient id="avatar-bg-soft" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#251648" />
            <stop offset="100%" stopColor="#150a2b" />
          </radialGradient>
        </defs>

        {/* 1. Backdrop circle for circular profile badges / cards when NOT in stage mode */}
        {!isStage && <circle cx="50" cy="50" r="49" fill="url(#avatar-bg-soft)" />}

        {/* 2. Character Body & Head Silhouette (Bigger round head + shoulders) */}
        <path
          d="M 8 98 C 10 74 34 68 40 60 C 24 54 20 44 20 34 C 20 18 33 10 50 10 C 67 10 80 18 80 34 C 80 44 76 54 60 60 C 66 68 90 74 92 98 Z"
          fill={baseColor}
          stroke="#0f172a"
          strokeWidth="3.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Subtle Chin/Neck Crease shadow */}
        <path
          d="M 42 60 Q 50 65 58 60"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />

        {/* 3. Beard (behind mouth/moustache for natural layering) */}
        {renderBeard(norm.beard)}

        {/* 4. Eyebrows (rendered with clear forehead margin below any hat) */}
        {renderEyebrows(norm.eyebrows)}

        {/* 5. Eye shapes */}
        {renderEyes(norm.eyes)}

        {/* 6. Mouth */}
        {renderMouth(norm.mouth)}

        {/* 7. Moustache (over mouth) */}
        {renderMoustache(norm.moustache)}

        {/* 8. Hat (rendered on top of head, sitting cleanly above eyebrows) */}
        {renderHat(norm.hat)}
      </svg>
    </div>
  );
}

export default memo(AvatarComponent);
