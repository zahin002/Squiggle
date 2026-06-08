/**
 * client/src/components/canvas/ColorPicker.jsx
 *
 * The color picker panel displayed below the canvas for the designated drawer only.
 *
 * Props received from DrawingCanvas.jsx:
 *   color    {string}   — currently selected hex color, e.g. '#FF0000'
 *   setColor {function} — updates active color in DrawingCanvas state
 *
 * Features:
 *   1. Palette of 30 curated game-appropriate colors (5 rows × 6 cols)
 *   2. Native <input type="color"> for precise custom color selection
 *   3. "Recent colors" row: last 6 colors used, persisted across the session
 *   4. Active color swatch showing current selection with its hex value
 *   5. Full keyboard accessibility — Tab navigates swatches, Enter/Space selects
 *
 * Color data is kept in this file as a constant so it never causes a re-render.
 */

import { useState, useCallback } from 'react';

// ─── Palette ──────────────────────────────────────────────────────────────────
// 30 colors: 5 rows of 6, ordered by hue family.
// Chosen to be visually distinct, look good on a white canvas, and cover all
// the hues a drawer might need for recognizable drawings.

const PALETTE = [
  // Top row
  '#ffffff', '#c1c1c1', '#ef130b', '#ff7100', '#ffe400', '#00cc00', '#00b2ff', '#231fd3', '#a300ba', '#d37caa', '#a0522d',
  // Bottom row
  '#000000', '#4c4c4c', '#740b07', '#c23800', '#e8a200', '#005510', '#00569e', '#0e0865', '#550069', '#a75574', '#63300d',
];

// Maximum recent colors to track
const MAX_RECENT = 6;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ColorPicker({ color, setColor }) {
  // Recent colors — starts empty, fills up as the drawer uses different colors
  const [recentColors, setRecentColors] = useState([]);

  // Called whenever a color is definitively chosen (palette click OR native picker)
  const selectColor = useCallback((newColor) => {
    if (newColor === color) return; // no change — don't re-render or pollute recents

    setColor(newColor);

    // Update recents: prepend new color, remove duplicates, cap at MAX_RECENT
    setRecentColors(prev => {
      const withoutDuplicate = prev.filter(c => c !== newColor);
      return [newColor, ...withoutDuplicate].slice(0, MAX_RECENT);
    });
  }, [color, setColor]);

  // Keyboard handler for palette swatches
  const handleSwatchKeyDown = useCallback((e, swatchColor) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectColor(swatchColor);
    }
  }, [selectColor]);
  // Whether a given swatch is the currently active one
  const isActive = (c) => c.toLowerCase() === color.toLowerCase();

  return (
    <div className="color-picker" role="group" aria-label="Color selection">
      
      {/* ── Main Palette Grid ───────────────────────────────────────────────── */}
      <div
        className="color-picker__palette"
        role="listbox"
        aria-label="Color palette"
        aria-multiselectable="false"
      >
        {PALETTE.map((c) => (
          <button
            key={c}
            className={`color-picker__swatch ${isActive(c) ? 'color-picker__swatch--active' : ''}`}
            style={{ backgroundColor: c }}
            onClick={() => selectColor(c)}
            onKeyDown={(e) => handleSwatchKeyDown(e, c)}
            title={c.toUpperCase()}
            aria-label={`Color ${c.toUpperCase()}`}
            aria-selected={isActive(c)}
            role="option"
            type="button"
          >
            {/* Active indicator ring — shown via CSS class, kept accessible */}
            {isActive(c) && (
              <span className="color-picker__swatch-check" aria-hidden="true">✓</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Extra Color Controls ───────────────────────────────────────────── */}
      <div className="color-picker__extras">
        
        {/* Active Color */}
        <div className="color-picker__active" title={`Current color: ${color}`}>
          <div
            className="color-picker__active-swatch"
            style={{ backgroundColor: color }}
            aria-label={`Selected color: ${color}`}
            role="img"
          />
          <span className="color-picker__active-hex">{color.toUpperCase()}</span>
        </div>

        {/* Custom Color */}
        <div className="color-picker__custom" title="Choose a custom color">
          <label
            htmlFor="color-picker-custom-input"
            className="color-picker__custom-label"
            aria-label="Custom color picker"
          >
            <svg
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              width="14" height="14" aria-hidden="true"
            >
              <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
              <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
              <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
              <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
            </svg>
            Custom
            <input
              id="color-picker-custom-input"
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              onBlur={e => selectColor(e.target.value)}
              className="color-picker__custom-input"
              aria-label="Custom color input"
            />
          </label>
        </div>

        {/* Recent Colors */}
        {recentColors.length > 0 && (
          <div className="color-picker__recents" role="group" aria-label="Recent colors">
            <span className="color-picker__section-label">Recent</span>
            <div className="color-picker__recent-row">
              {recentColors.map((c) => (
                <button
                  key={c}
                  className={`color-picker__swatch color-picker__swatch--recent ${isActive(c) ? 'color-picker__swatch--active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => selectColor(c)}
                  onKeyDown={(e) => handleSwatchKeyDown(e, c)}
                  title={`Recent: ${c.toUpperCase()}`}
                  aria-label={`Recent color ${c.toUpperCase()}`}
                  aria-selected={isActive(c)}
                  role="option"
                  type="button"
                />
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}