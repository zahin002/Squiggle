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
 * The official Squiggle full brand wordmark image (transparent 3D neon logo).
 */
export default function SquiggleLogo({ height = 34, size, fontSize, id, className = '', alt = 'Squiggle' }) {
  const actualHeight = height || (size ? size * 1.2 : 34);
  return (
    <img
      src="/squiggle-wordmark.png"
      alt={alt}
      className={`squiggle-full-brand ${className}`}
      style={{
        height: typeof actualHeight === 'number' ? `${actualHeight}px` : actualHeight,
        width: 'auto',
        display: 'inline-block',
        verticalAlign: 'middle',
        objectFit: 'contain',
        userSelect: 'none',
        transition: 'transform 0.25s ease, filter 0.25s ease'
      }}
    />
  );
}
