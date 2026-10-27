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
  { id: 'x_x', label: 'X_X' },
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
  { id: 'soulpatch', label: 'Soul Patch' },
  { id: 'pointed', label: 'Wizard' },
];

// Helper to determine if a hex color is relatively light
function isLightColor(hex) {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return false;
  const c = hex.substring(1);
  const rgb = parseInt(c.length === 3 ? c.split('').map(x => x + x).join('') : c, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 140;
}

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
  return {
    color: raw.color || '#f5c6a5',
    hat: raw.hat || 'none',
    eyebrows: raw.eyebrows || 'natural',
    eyes: raw.eyes || 'normal',
    mouth: raw.mouth || 'smile',
    moustache: raw.moustache || 'none',
    beard: raw.beard || 'none',
  };
}

// ── SVG Renderers for Parts (0-100 coordinate space) ──

function renderHat(style) {
  switch (style) {
    case 'cap':
      return (
        <g id="hat-cap">
          <path
            d="M 25 24 C 25 11 37 7 50 7 C 63 7 75 11 75 24 Z"
            fill="#ef4444"
            stroke="#0f172a"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <circle cx="50" cy="7" r="2.8" fill="#fbbf24" stroke="#0f172a" strokeWidth="2" />
          {/* Visor Brim */}
          <path
            d="M 22 24 Q 50 19 82 26 C 78 30 64 32 50 29 C 36 26 22 29 22 24 Z"
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
          <circle cx="50" cy="5" r="5" fill="#f59e0b" stroke="#0f172a" strokeWidth="2.5" />
          <path
            d="M 24 24 C 24 10 38 7 50 7 C 62 7 76 10 76 24 Z"
            fill="#3b82f6"
            stroke="#0f172a"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <path d="M 37 11 Q 35 18 34 24" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" />
          <path d="M 50 8 L 50 24" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" />
          <path d="M 63 11 Q 65 18 66 24" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" />
          <path
            d="M 21 21 Q 50 23 79 21 L 78 28 Q 50 30 22 28 Z"
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
          <ellipse cx="50" cy="22" rx="34" ry="5.5" fill="#1e293b" stroke="#0f172a" strokeWidth="3" />
          <path
            d="M 31 22 L 33 4 L 67 4 L 69 22 Z"
            fill="#1e293b"
            stroke="#0f172a"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <ellipse cx="50" cy="4.5" rx="17" ry="2.5" fill="#334155" stroke="#0f172a" strokeWidth="2" />
          <path d="M 31.8 17 L 68.2 17 L 69 22 L 31 22 Z" fill="#e11d48" stroke="#0f172a" strokeWidth="1.6" />
        </g>
      );
    case 'cowboy':
      return (
        <g id="hat-cowboy">
          <path
            d="M 10 22 Q 30 18 50 20 Q 70 18 90 22 Q 73 29 50 26 Q 27 29 10 22 Z"
            fill="#854d0e"
            stroke="#0f172a"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M 28 20 C 28 6 36 8 43 13 C 48 15 52 15 57 13 C 64 8 72 6 72 20 Z"
            fill="#a16207"
            stroke="#0f172a"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M 28 18 Q 50 20 72 18 L 72 21 Q 50 23 28 21 Z" fill="#451a03" />
        </g>
      );
    case 'crown':
      return (
        <g id="hat-crown">
          <path
            d="M 24 22 L 23 9 L 36 17 L 50 7 L 64 17 L 77 9 L 76 22 Z"
            fill="#fbbf24"
            stroke="#0f172a"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M 24 21 L 76 21 L 75 26 L 25 26 Z" fill="#f59e0b" stroke="#0f172a" strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="50" cy="15" r="3" fill="#ef4444" stroke="#0f172a" strokeWidth="1.5" />
          <circle cx="34" cy="18" r="2.2" fill="#3b82f6" stroke="#0f172a" strokeWidth="1.2" />
          <circle cx="66" cy="18" r="2.2" fill="#10b981" stroke="#0f172a" strokeWidth="1.2" />
        </g>
      );
    case 'party':
      return (
        <g id="hat-party">
          <path
            d="M 50 3 L 29 25 Q 50 28 71 25 Z"
            fill="#ec4899"
            stroke="#0f172a"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M 43 11 L 57 11 Q 50 14 43 11 Z" fill="#fbbf24" />
          <path d="M 36 18 L 64 18 Q 50 22 36 18 Z" fill="#06b6d4" />
          <circle cx="50" cy="3" r="4.5" fill="#facc15" stroke="#0f172a" strokeWidth="2" />
        </g>
      );
    case 'headband':
      return (
        <g id="hat-headband">
          <path
            d="M 24 21 Q 50 24 76 21 L 76 27 Q 50 30 24 27 Z"
            fill="#ef4444"
            stroke="#0f172a"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          <rect x="42" y="22" width="16" height="6" rx="2" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.5" />
          <circle cx="44" cy="25" r="0.8" fill="#64748b" />
          <circle cx="56" cy="25" r="0.8" fill="#64748b" />
          <path d="M 24 24 C 18 26 15 32 10 38 L 14 38 C 18 33 21 28 25 26 Z" fill="#dc2626" stroke="#0f172a" strokeWidth="1.5" />
        </g>
      );
    case 'viking':
      return (
        <g id="hat-viking">
          <path
            d="M 26 18 C 16 16 10 9 8 3 C 14 8 22 13 27 15 Z"
            fill="#fef08a"
            stroke="#0f172a"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M 74 18 C 84 16 90 9 92 3 C 86 8 78 13 73 15 Z"
            fill="#fef08a"
            stroke="#0f172a"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M 24 23 C 24 10 36 7 50 7 C 64 7 76 10 76 23 Z"
            fill="#64748b"
            stroke="#0f172a"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <path d="M 23 21 Q 50 23 77 21 L 76 26 Q 50 28 24 26 Z" fill="#475569" stroke="#0f172a" strokeWidth="2" />
          <circle cx="50" cy="24" r="1.5" fill="#f8fafc" />
        </g>
      );
    case 'chef':
      return (
        <g id="hat-chef">
          <path
            d="M 32 20 C 23 18 19 8 27 4 C 32 -1 44 -1 48 3 C 52 -1 64 -1 68 4 C 76 8 73 18 68 20 Z"
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <path
            d="M 31 19 L 69 19 L 68 25 L 32 25 Z"
            fill="#f1f5f9"
            stroke="#0f172a"
            strokeWidth="2.5"
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
        <g stroke={strokeColor} strokeWidth="3.2" strokeLinecap="round" fill="none">
          <path d="M 28 26 Q 36 19 43 25" />
          <path d="M 57 25 Q 64 19 72 26" />
        </g>
      );
    case 'angry':
      return (
        <g stroke={strokeColor} strokeWidth="3.6" strokeLinecap="round" fill="none">
          <path d="M 28 23 L 44 29" />
          <path d="M 72 23 L 56 29" />
        </g>
      );
    case 'bushy':
      return (
        <g fill={strokeColor}>
          <path d="M 27 26 Q 36 20 44 26 C 42 29 29 30 27 26 Z" />
          <path d="M 56 26 Q 64 20 73 26 C 71 30 58 30 56 26 Z" />
        </g>
      );
    case 'sad':
      return (
        <g stroke={strokeColor} strokeWidth="3.2" strokeLinecap="round" fill="none">
          <path d="M 29 29 Q 36 23 43 23" />
          <path d="M 57 23 Q 64 23 71 29" />
        </g>
      );
    case 'unibrow':
      return (
        <path
          d="M 27 27 Q 38 21 50 26 Q 62 21 73 27"
          stroke={strokeColor}
          strokeWidth="3.8"
          strokeLinecap="round"
          fill="none"
        />
      );
    case 'raised':
      return (
        <g stroke={strokeColor} strokeWidth="3.2" strokeLinecap="round" fill="none">
          <path d="M 28 27 Q 36 24 43 27" />
          <path d="M 57 21 Q 65 14 73 21" />
        </g>
      );
    case 'natural':
    default:
      return (
        <g stroke={strokeColor} strokeWidth="3.2" strokeLinecap="round" fill="none">
          <path d="M 28 26 Q 36 23 43 26" />
          <path d="M 57 26 Q 64 23 72 26" />
        </g>
      );
  }
}

function renderEyes(style) {
  switch (style) {
    case 'x_x':
      return (
        <g stroke="#0f172a" strokeWidth="3.6" strokeLinecap="round">
          {/* Left X */}
          <path d="M 31 33 L 41 43" />
          <path d="M 41 33 L 31 43" />
          {/* Right X */}
          <path d="M 59 33 L 69 43" />
          <path d="M 69 33 L 59 43" />
        </g>
      );
    case 'dot':
      return (
        <g>
          {/* Subtle eye backing for visibility on dark/neon colors */}
          <circle cx="36" cy="38" r="4.6" fill="#ffffff" />
          <circle cx="36" cy="38" r="3.2" fill="#0f172a" />
          <circle cx="64" cy="38" r="4.6" fill="#ffffff" />
          <circle cx="64" cy="38" r="3.2" fill="#0f172a" />
        </g>
      );
    case 'girlie':
      return (
        <g>
          {/* Left Eye */}
          <ellipse cx="36" cy="39" rx="6.5" ry="7.5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
          <circle cx="36" cy="39" r="4.5" fill="#0f172a" />
          <circle cx="34.5" cy="37" r="2.2" fill="#ffffff" />
          <circle cx="38" cy="41" r="1.1" fill="#ffffff" />
          {/* Left Lashes */}
          <path d="M 28 35 Q 36 27 44 34" stroke="#0f172a" strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <path d="M 44 34 L 47 31" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 42 37 L 46 36" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />

          {/* Right Eye */}
          <ellipse cx="64" cy="39" rx="6.5" ry="7.5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
          <circle cx="64" cy="39" r="4.5" fill="#0f172a" />
          <circle cx="62.5" cy="37" r="2.2" fill="#ffffff" />
          <circle cx="66" cy="41" r="1.1" fill="#ffffff" />
          {/* Right Lashes */}
          <path d="M 56 34 Q 64 27 72 35" stroke="#0f172a" strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <path d="M 72 34 L 75 31" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 70 37 L 74 36" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case 'cool':
      return (
        <g>
          {/* Sunglasses */}
          <path
            d="M 23 34 L 47 34 C 47 43 42 47 35 47 C 28 47 23 43 23 34 Z"
            fill="#0f172a"
            stroke="#ffffff"
            strokeWidth="1.6"
          />
          <path
            d="M 53 34 L 77 34 C 77 43 72 47 65 47 C 58 47 53 43 53 34 Z"
            fill="#0f172a"
            stroke="#ffffff"
            strokeWidth="1.6"
          />
          <path d="M 46 36 L 54 36" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M 27 36 L 33 44" stroke="rgba(255,255,255,0.5)" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M 57 36 L 63 44" stroke="rgba(255,255,255,0.5)" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      );
    case 'happy':
      return (
        <g stroke="#0f172a" strokeWidth="3.6" strokeLinecap="round" fill="none">
          <path d="M 28 39 Q 36 32 44 39" />
          <path d="M 56 39 Q 64 32 72 39" />
        </g>
      );
    case 'wink':
      return (
        <g>
          <circle cx="36" cy="38" r="5.5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
          <circle cx="37" cy="38" r="2.4" fill="#0f172a" />
          <circle cx="38" cy="37" r="1" fill="#ffffff" />
          <path d="M 56 39 Q 64 32 72 39" stroke="#0f172a" strokeWidth="3.6" strokeLinecap="round" fill="none" />
        </g>
      );
    case 'wide':
      return (
        <g>
          <ellipse cx="36" cy="38" rx="7.5" ry="8.5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
          <circle cx="36.5" cy="38" r="3.6" fill="#0f172a" />
          <circle cx="38" cy="36" r="1.5" fill="#ffffff" />

          <ellipse cx="64" cy="38" rx="7.5" ry="8.5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
          <circle cx="63.5" cy="38" r="3.6" fill="#0f172a" />
          <circle cx="65" cy="36" r="1.5" fill="#ffffff" />
        </g>
      );
    case 'sleepy':
      return (
        <g stroke="#0f172a" strokeWidth="3.4" strokeLinecap="round" fill="none">
          <path d="M 28 39 L 44 39" />
          <path d="M 56 39 L 72 39" />
          <circle cx="36" cy="40" r="2" fill="#0f172a" stroke="none" />
          <circle cx="64" cy="40" r="2" fill="#0f172a" stroke="none" />
        </g>
      );
    case 'sparkle':
      return (
        <g fill="#0f172a">
          <path d="M 36 31 Q 36 38 43 38 Q 36 38 36 45 Q 36 38 29 38 Q 36 38 36 31 Z" />
          <path d="M 64 31 Q 64 38 71 38 Q 64 38 64 45 Q 64 38 57 38 Q 64 38 64 31 Z" />
        </g>
      );
    case 'glasses':
      return (
        <g>
          <circle cx="36" cy="38" r="4.2" fill="#ffffff" />
          <circle cx="36.5" cy="38" r="2.2" fill="#0f172a" />
          <circle cx="64" cy="38" r="4.2" fill="#ffffff" />
          <circle cx="63.5" cy="38" r="2.2" fill="#0f172a" />
          <circle cx="36" cy="38" r="8.5" fill="none" stroke="#0f172a" strokeWidth="2.5" />
          <circle cx="64" cy="38" r="8.5" fill="none" stroke="#0f172a" strokeWidth="2.5" />
          <path d="M 44.5 38 L 55.5 38" stroke="#0f172a" strokeWidth="2.5" />
          <path d="M 18 38 L 27.5 38" stroke="#0f172a" strokeWidth="2.2" />
          <path d="M 72.5 38 L 82 38" stroke="#0f172a" strokeWidth="2.2" />
        </g>
      );
    case 'monocle':
      return (
        <g>
          <circle cx="36" cy="38" r="5.5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
          <circle cx="37" cy="38" r="2.5" fill="#0f172a" />
          <circle cx="64" cy="38" r="5.5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
          <circle cx="65" cy="38" r="2.5" fill="#0f172a" />
          <circle cx="64" cy="38" r="8.8" fill="rgba(255,255,255,0.2)" stroke="#fbbf24" strokeWidth="2.5" />
          <path d="M 64 47 Q 70 58 75 68" fill="none" stroke="#fbbf24" strokeWidth="1.6" strokeDasharray="2,2" />
        </g>
      );
    case 'normal':
    default:
      return (
        <g>
          <circle cx="36" cy="38" r="5.8" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
          <circle cx="37" cy="38" r="2.8" fill="#0f172a" />
          <circle cx="38" cy="36.5" r="1.1" fill="#ffffff" />

          <circle cx="64" cy="38" r="5.8" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
          <circle cx="63" cy="38" r="2.8" fill="#0f172a" />
          <circle cx="64" cy="36.5" r="1.1" fill="#ffffff" />
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
            d="M 36 50 Q 50 63 64 50 Z"
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M 38 52 Q 50 57 62 52" stroke="#94a3b8" strokeWidth="1.4" fill="none" />
        </g>
      );
    case 'open':
      return (
        <g>
          <path
            d="M 36 49 Q 50 67 64 49 Z"
            fill="#e11d48"
            stroke="#0f172a"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          <path d="M 43 58 Q 50 54 57 58 Q 50 64 43 58 Z" fill="#fda4af" />
          <path d="M 38 50 Q 50 54 62 50" stroke="#ffffff" strokeWidth="2.2" fill="none" />
        </g>
      );
    case 'surprised':
      return (
        <ellipse
          cx="50"
          cy="52"
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
          d="M 39 52 Q 52 51 63 47"
          stroke="#0f172a"
          strokeWidth="3.4"
          strokeLinecap="round"
          fill="none"
        />
      );
    case 'tongue':
      return (
        <g>
          <path d="M 37 50 Q 50 57 63 50" stroke="#0f172a" strokeWidth="3.2" strokeLinecap="round" fill="none" />
          <path
            d="M 46 52 C 46 61 54 61 54 52 Z"
            fill="#fb7185"
            stroke="#0f172a"
            strokeWidth="2"
          />
          <path d="M 50 52 L 50 57" stroke="#e11d48" strokeWidth="1.2" />
        </g>
      );
    case 'neutral':
      return (
        <path
          d="M 39 52 L 61 52"
          stroke="#0f172a"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
      );
    case 'frown':
      return (
        <path
          d="M 37 54 Q 50 46 63 54"
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
          d="M 37 49 Q 50 59 63 49"
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
          d="M 50 46 C 45 43 36 42 30 47 C 34 51 44 52 50 49 C 56 52 66 51 70 47 C 64 42 55 43 50 46 Z"
          fill="#1e293b"
          stroke="#0f172a"
          strokeWidth="1.8"
        />
      );
    case 'handlebar':
      return (
        <path
          d="M 50 47 Q 40 44 28 48 Q 22 51 21 46 Q 24 42 34 43 Q 45 44 50 47 Q 55 44 66 43 Q 76 42 79 46 Q 78 51 72 48 Q 60 44 50 47 Z"
          fill="#1e293b"
          stroke="#0f172a"
          strokeWidth="1.8"
        />
      );
    case 'pencil':
      return (
        <g stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round">
          <path d="M 36 46 Q 44 47 48 46" />
          <path d="M 52 46 Q 56 47 64 46" />
        </g>
      );
    case 'chevron':
      return (
        <path
          d="M 50 45 L 32 51 C 34 54 43 53 50 51 C 57 53 66 54 68 51 Z"
          fill="#1e293b"
          stroke="#0f172a"
          strokeWidth="1.8"
        />
      );
    case 'stubble':
      return (
        <g fill="#0f172a" opacity="0.65">
          <circle cx="38" cy="46" r="0.9" />
          <circle cx="43" cy="45" r="0.9" />
          <circle cx="48" cy="46" r="0.9" />
          <circle cx="52" cy="46" r="0.9" />
          <circle cx="57" cy="45" r="0.9" />
          <circle cx="62" cy="46" r="0.9" />
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
          d="M 44 54 Q 50 52 56 54 L 53 63 Q 50 66 47 63 Z"
          fill="#1e293b"
          stroke="#0f172a"
          strokeWidth="1.5"
        />
      );
    case 'full':
      return (
        <path
          d="M 27 42 C 25 55 36 64 50 64 C 64 64 75 55 73 42 C 68 53 60 56 50 56 C 40 56 32 53 27 42 Z"
          fill="#1e293b"
          stroke="#0f172a"
          strokeWidth="2"
        />
      );
    case 'chinstrap':
      return (
        <path
          d="M 27 41 C 26 51 38 58 50 58 C 62 58 74 51 73 41 C 70 48 60 54 50 54 C 40 54 30 48 27 41 Z"
          fill="#1e293b"
          stroke="#0f172a"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      );
    case 'soulpatch':
      return (
        <path
          d="M 48 54 L 52 54 L 51 59 L 49 59 Z"
          fill="#0f172a"
        />
      );
    case 'pointed':
      return (
        <path
          d="M 43 54 Q 50 53 57 54 L 50 68 Z"
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
  const isLight = isLightColor(baseColor);

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
          {/* Subtle gradient depth for avatar background / frame */}
          <radialGradient id="avatar-bg-soft" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#251648" />
            <stop offset="100%" stopColor="#150a2b" />
          </radialGradient>
        </defs>

        {/* 1. Backdrop circle for circular profile badges / cards when NOT in stage mode */}
        {!isStage && <circle cx="50" cy="50" r="49" fill="url(#avatar-bg-soft)" />}

        {/* 2. Character Body & Head Silhouette (Skribbl doodle style) */}
        <path
          d="M 12 97 C 14 74 36 67 42 58 C 30 54 26 44 26 36 C 26 21 37 12 50 12 C 63 12 74 21 74 36 C 74 44 70 54 58 58 C 64 67 86 74 88 97 Z"
          fill={baseColor}
          stroke="#0f172a"
          strokeWidth="3.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Subtle Chin/Neck Crease shadow */}
        <path
          d="M 43 56 Q 50 61 57 56"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />

        {/* 3. Beard (behind mouth/moustache for natural layering) */}
        {renderBeard(norm.beard)}

        {/* 4. Eyebrows */}
        {renderEyebrows(norm.eyebrows)}

        {/* 5. Eye shapes */}
        {renderEyes(norm.eyes)}

        {/* 6. Mouth */}
        {renderMouth(norm.mouth)}

        {/* 7. Moustache (over mouth) */}
        {renderMoustache(norm.moustache)}

        {/* 8. Hat (rendered on top of head) */}
        {renderHat(norm.hat)}
      </svg>
    </div>
  );
}

export default memo(AvatarComponent);
