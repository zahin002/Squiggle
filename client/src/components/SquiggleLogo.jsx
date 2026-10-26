// client/src/components/SquiggleLogo.jsx
import React from 'react';

/**
 * The official Squiggle gradient wave mark SVG.
 */
export function SquiggleLogoMark({ size = 32, id = 'sqGrad', className = '' }) {
  return (
    <svg
      className={`squiggle-brand-mark ${className}`}
      viewBox="0 0 100 100"
      fill="none"
      stroke={`url(#${id})`}
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0
      }}
      aria-label="Squiggle Brand Mark"
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c4dff" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <path d="M10 60 C 10 20, 50 20, 40 50 C 30 80, 70 80, 60 50 C 50 20, 90 20, 90 60" />
    </svg>
  );
}

/**
 * The official Squiggle full brand (wave mark + gradient text).
 */
export default function SquiggleLogo({ size = 28, fontSize = '1.35rem', id = 'sqFullGrad', className = '' }) {
  return (
    <div
      className={`squiggle-full-brand ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        userSelect: 'none'
      }}
    >
      <SquiggleLogoMark size={size} id={id} />
      <span
        className="squiggle-brand-title"
        style={{
          fontFamily: "'Fredoka', 'Nunito', sans-serif",
          fontSize,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #7c4dff, #38bdf8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.5px',
          display: 'inline-block',
          lineHeight: 1.25,
          paddingBottom: '0.18em',
          marginBottom: '-0.18em'
        }}
      >
        Squiggle
      </span>
    </div>
  );
}
