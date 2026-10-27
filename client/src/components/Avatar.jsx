import { memo } from 'react';

// Preset color palette for avatar skin/background
export const AVATAR_COLOR_PRESETS = [
  '#1a64ff', // Blue
  '#7c4dff', // Purple
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#3b82f6', // Indigo
  '#64748b', // Slate
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
  { id: 'happy', label: 'Happy' },
  { id: 'wink', label: 'Wink' },
  { id: 'wide', label: 'Wide' },
  { id: 'cool', label: 'Sunglasses' },
  { id: 'sleepy', label: 'Sleepy' },
  { id: 'sparkle', label: 'Starry' },
  { id: 'glasses', label: 'Glasses' },
  { id: 'monocle', label: 'Monocle' },
];

export const MOUTH_OPTIONS = [
  { id: 'smile', label: 'Smile' },
  { id: 'grin', label: 'Grin' },
  { id: 'open', label: 'Laugh' },
  { id: 'smirk', label: 'Smirk' },
  { id: 'surprised', label: 'Surprised' },
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

// Helper to randomly pick an element from an array
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Generate a random avatar configuration
export function getRandomAvatar(currentColor) {
  return {
    color: currentColor && Math.random() > 0.4 ? currentColor : pickRandom(AVATAR_COLOR_PRESETS),
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
      color: '#1a64ff',
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
      color: raw.startsWith('#') ? raw : '#1a64ff',
      eyebrows: 'natural',
      eyes: 'normal',
      mouth: 'smile',
      moustache: 'none',
      beard: 'none',
    };
  }
  return {
    color: raw.color || '#1a64ff',
    eyebrows: raw.eyebrows || 'natural',
    eyes: raw.eyes || 'normal',
    mouth: raw.mouth || 'smile',
    moustache: raw.moustache || 'none',
    beard: raw.beard || 'none',
  };
}

// ── SVG Renderers for Parts (0-100 coordinate space) ──

function renderEyebrows(style) {
  switch (style) {
    case 'arched':
      return (
        <g stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M 26 31 Q 34 23 42 29" />
          <path d="M 58 29 Q 66 23 74 31" />
        </g>
      );
    case 'angry':
      return (
        <g stroke="#ffffff" strokeWidth="3.4" strokeLinecap="round" fill="none">
          <path d="M 26 27 L 42 34" />
          <path d="M 74 27 L 58 34" />
        </g>
      );
    case 'bushy':
      return (
        <g fill="#ffffff">
          <path d="M 25 31 Q 34 24 43 31 C 41 34 27 35 25 31 Z" />
          <path d="M 57 31 Q 66 24 75 31 C 73 35 59 35 57 31 Z" />
        </g>
      );
    case 'sad':
      return (
        <g stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M 27 34 Q 34 27 42 27" />
          <path d="M 58 27 Q 66 27 73 34" />
        </g>
      );
    case 'unibrow':
      return (
        <path
          d="M 25 32 Q 36 26 50 31 Q 64 26 75 32"
          stroke="#ffffff"
          strokeWidth="3.6"
          strokeLinecap="round"
          fill="none"
        />
      );
    case 'raised':
      return (
        <g stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none">
          {/* Left eyebrow normal */}
          <path d="M 26 32 Q 34 28 42 32" />
          {/* Right eyebrow high arched */}
          <path d="M 58 25 Q 66 18 74 25" />
        </g>
      );
    case 'natural':
    default:
      return (
        <g stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M 26 31 Q 34 27 42 31" />
          <path d="M 58 31 Q 66 27 74 31" />
        </g>
      );
  }
}

function renderEyes(style) {
  switch (style) {
    case 'happy':
      return (
        <g stroke="#ffffff" strokeWidth="3.4" strokeLinecap="round" fill="none">
          <path d="M 27 45 Q 34 38 41 45" />
          <path d="M 59 45 Q 66 38 73 45" />
        </g>
      );
    case 'wink':
      return (
        <g>
          {/* Left eye open */}
          <circle cx="34" cy="44" r="5" fill="#ffffff" />
          <circle cx="36" cy="42" r="1.8" fill="#0f172a" />
          <circle cx="37" cy="41" r="0.8" fill="#ffffff" />
          {/* Right eye wink */}
          <path d="M 58 45 Q 66 38 74 45" stroke="#ffffff" strokeWidth="3.4" strokeLinecap="round" fill="none" />
        </g>
      );
    case 'wide':
      return (
        <g>
          <ellipse cx="34" cy="44" rx="7" ry="8" fill="#ffffff" />
          <circle cx="35" cy="44" r="3.5" fill="#0f172a" />
          <circle cx="36.5" cy="42" r="1.5" fill="#ffffff" />

          <ellipse cx="66" cy="44" rx="7" ry="8" fill="#ffffff" />
          <circle cx="65" cy="44" r="3.5" fill="#0f172a" />
          <circle cx="66.5" cy="42" r="1.5" fill="#ffffff" />
        </g>
      );
    case 'cool':
      return (
        <g>
          {/* Sleek sunglasses */}
          <path
            d="M 22 40 L 46 40 C 46 48 42 53 34 53 C 26 53 22 48 22 40 Z"
            fill="#0f172a"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <path
            d="M 54 40 L 78 40 C 78 48 74 53 66 53 C 58 53 54 48 54 40 Z"
            fill="#0f172a"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          {/* Bridge */}
          <path d="M 45 42 L 55 42" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          {/* Sheen */}
          <path d="M 26 42 L 32 50" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 58 42 L 64 50" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      );
    case 'sleepy':
      return (
        <g stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M 27 45 L 41 45" />
          <path d="M 59 45 L 73 45" />
          <circle cx="34" cy="46" r="2.5" fill="#ffffff" stroke="none" />
          <circle cx="66" cy="46" r="2.5" fill="#ffffff" stroke="none" />
        </g>
      );
    case 'sparkle':
      return (
        <g fill="#ffffff">
          {/* Left star */}
          <path d="M 34 37 Q 34 44 41 44 Q 34 44 34 51 Q 34 44 27 44 Q 34 44 34 37 Z" />
          {/* Right star */}
          <path d="M 66 37 Q 66 44 73 44 Q 66 44 66 51 Q 66 44 59 44 Q 66 44 66 37 Z" />
        </g>
      );
    case 'glasses':
      return (
        <g>
          {/* Eyes behind */}
          <circle cx="34" cy="44" r="4" fill="#ffffff" />
          <circle cx="35" cy="44" r="2" fill="#0f172a" />
          <circle cx="66" cy="44" r="4" fill="#ffffff" />
          <circle cx="65" cy="44" r="2" fill="#0f172a" />
          {/* Frames */}
          <circle cx="34" cy="44" r="8" fill="none" stroke="#ffffff" strokeWidth="2" />
          <circle cx="66" cy="44" r="8" fill="none" stroke="#ffffff" strokeWidth="2" />
          <path d="M 42 44 L 58 44" stroke="#ffffff" strokeWidth="2" />
          <path d="M 18 44 L 26 44" stroke="#ffffff" strokeWidth="1.8" />
          <path d="M 74 44 L 82 44" stroke="#ffffff" strokeWidth="1.8" />
        </g>
      );
    case 'monocle':
      return (
        <g>
          {/* Left eye normal */}
          <circle cx="34" cy="44" r="5" fill="#ffffff" />
          <circle cx="35" cy="44" r="2.2" fill="#0f172a" />
          {/* Right eye with gold monocle */}
          <circle cx="66" cy="44" r="5" fill="#ffffff" />
          <circle cx="67" cy="44" r="2.2" fill="#0f172a" />
          <circle cx="66" cy="44" r="8.5" fill="rgba(255,255,255,0.15)" stroke="#fbbf24" strokeWidth="2" />
          {/* Monocle cord */}
          <path d="M 66 52.5 Q 72 65 76 75" fill="none" stroke="#fbbf24" strokeWidth="1.4" strokeDasharray="1.5,1.5" />
        </g>
      );
    case 'normal':
    default:
      return (
        <g>
          <circle cx="34" cy="44" r="5.5" fill="#ffffff" />
          <circle cx="35.5" cy="44" r="2.6" fill="#0f172a" />
          <circle cx="36.5" cy="42.5" r="1" fill="#ffffff" />

          <circle cx="66" cy="44" r="5.5" fill="#ffffff" />
          <circle cx="64.5" cy="44" r="2.6" fill="#0f172a" />
          <circle cx="65.5" cy="42.5" r="1" fill="#ffffff" />
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
            d="M 34 62 Q 50 78 66 62 Z"
            fill="#ffffff"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M 37 65 Q 50 71 63 65" stroke="#cbd5e1" strokeWidth="1.2" fill="none" />
        </g>
      );
    case 'open':
      return (
        <g>
          <path
            d="M 35 61 Q 50 82 65 61 Z"
            fill="#e11d48"
            stroke="#ffffff"
            strokeWidth="2"
          />
          {/* Tongue */}
          <path d="M 43 72 Q 50 67 57 72 Q 50 78 43 72 Z" fill="#fda4af" />
          {/* Teeth */}
          <path d="M 37 62 Q 50 66 63 62" stroke="#ffffff" strokeWidth="2" fill="none" />
        </g>
      );
    case 'smirk':
      return (
        <path
          d="M 38 65 Q 52 64 64 59"
          stroke="#ffffff"
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
        />
      );
    case 'surprised':
      return (
        <ellipse
          cx="50"
          cy="66"
          rx="6"
          ry="8"
          fill="#0f172a"
          stroke="#ffffff"
          strokeWidth="2.5"
        />
      );
    case 'tongue':
      return (
        <g>
          <path d="M 36 63 Q 50 71 64 63" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Tongue sticking out */}
          <path
            d="M 46 66 C 46 75 54 75 54 66 Z"
            fill="#fb7185"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <path d="M 50 66 L 50 72" stroke="#f43f5e" strokeWidth="1" />
        </g>
      );
    case 'neutral':
      return (
        <path
          d="M 37 66 L 63 66"
          stroke="#ffffff"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      );
    case 'frown':
      return (
        <path
          d="M 36 68 Q 50 59 64 68"
          stroke="#ffffff"
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
        />
      );
    case 'smile':
    default:
      return (
        <path
          d="M 36 62 Q 50 74 64 62"
          stroke="#ffffff"
          strokeWidth="3.4"
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
          d="M 50 57 C 45 54 36 53 30 58 C 34 62 44 63 50 60 C 56 63 66 62 70 58 C 64 53 55 54 50 57 Z"
          fill="#1e293b"
          stroke="#ffffff"
          strokeWidth="1"
        />
      );
    case 'handlebar':
      return (
        <path
          d="M 50 58 Q 40 55 28 59 Q 22 62 21 57 Q 24 53 34 54 Q 45 55 50 58 Q 55 55 66 54 Q 76 53 79 57 Q 78 62 72 59 Q 60 55 50 58 Z"
          fill="#1e293b"
          stroke="#ffffff"
          strokeWidth="1"
        />
      );
    case 'pencil':
      return (
        <g stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round">
          <path d="M 36 57 Q 44 58 48 57" />
          <path d="M 52 57 Q 56 58 64 57" />
        </g>
      );
    case 'chevron':
      return (
        <path
          d="M 50 56 L 31 63 C 33 66 43 65 50 63 C 57 65 67 66 69 63 Z"
          fill="#1e293b"
          stroke="#ffffff"
          strokeWidth="1"
        />
      );
    case 'stubble':
      return (
        <g fill="#ffffff" opacity="0.75">
          <circle cx="38" cy="57" r="0.9" />
          <circle cx="43" cy="56" r="0.9" />
          <circle cx="48" cy="57" r="0.9" />
          <circle cx="52" cy="57" r="0.9" />
          <circle cx="57" cy="56" r="0.9" />
          <circle cx="62" cy="57" r="0.9" />
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
        <g>
          {/* Small chin goatee */}
          <path
            d="M 44 72 Q 50 70 56 72 L 53 84 Q 50 87 47 84 Z"
            fill="#1e293b"
            stroke="#ffffff"
            strokeWidth="1"
          />
        </g>
      );
    case 'full':
      return (
        <path
          d="M 22 55 Q 18 78 35 90 Q 50 96 65 90 Q 82 78 78 55 Q 72 68 62 70 Q 50 74 38 70 Q 28 68 22 55 Z"
          fill="#1e293b"
          stroke="#ffffff"
          strokeWidth="1.2"
        />
      );
    case 'chinstrap':
      return (
        <path
          d="M 20 54 Q 18 78 35 89 Q 50 94 65 89 Q 82 78 80 54 Q 76 74 65 82 Q 50 86 35 82 Q 24 74 20 54 Z"
          fill="#1e293b"
          stroke="#ffffff"
          strokeWidth="1"
        />
      );
    case 'soulpatch':
      return (
        <path
          d="M 48 71 L 52 71 L 51 77 L 49 77 Z"
          fill="#ffffff"
        />
      );
    case 'pointed':
      return (
        <path
          d="M 43 72 Q 50 71 57 72 L 50 93 Z"
          fill="#1e293b"
          stroke="#ffffff"
          strokeWidth="1"
        />
      );
    case 'none':
    default:
      return null;
  }
}

function AvatarComponent({ avatar, size = 48, className = '', username = '' }) {
  const norm = normalizeAvatar(avatar);

  const fallbackInitial = username
    ? username.charAt(0).toUpperCase()
    : 'P';

  const baseColor = norm.color || '#1a64ff';

  return (
    <div
      className={`squiggle-avatar-wrap ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        boxShadow: `0 4px 16px ${baseColor}44`,
        flexShrink: 0,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        style={{
          borderRadius: '50%',
          display: 'block',
          overflow: 'hidden',
        }}
      >
        <defs>
          <linearGradient id={`avatar-bg-${baseColor.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={baseColor} />
            <stop offset="100%" stopColor="#4338ca" />
          </linearGradient>
          <radialGradient id="avatar-glow" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
          </radialGradient>
        </defs>

        {/* 1. Base / Face Circle */}
        <circle
          cx="50"
          cy="50"
          r="47"
          fill={`url(#avatar-bg-${baseColor.replace('#', '')})`}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="2.5"
        />
        {/* Soft lighting highlight */}
        <circle cx="50" cy="50" r="47" fill="url(#avatar-glow)" />

        {/* 2. Beard (rendered behind mouth/moustache for natural layering) */}
        {renderBeard(norm.beard)}

        {/* 3. Eyebrows */}
        {renderEyebrows(norm.eyebrows)}

        {/* 4. Eye shapes */}
        {renderEyes(norm.eyes)}

        {/* 5. Mouth */}
        {renderMouth(norm.mouth)}

        {/* 6. Moustache (rendered over mouth) */}
        {renderMoustache(norm.moustache)}
      </svg>
    </div>
  );
}

export default memo(AvatarComponent);
