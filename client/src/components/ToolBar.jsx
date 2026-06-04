/**
 * client/src/components/canvas/ToolBar.jsx
 *
 * The drawing toolbar displayed above the canvas for the designated drawer only.
 *
 * Props received from DrawingCanvas.jsx:
 *   tool      {string}   — currently active tool key
 *   setTool   {function} — updates active tool in DrawingCanvas state
 *   size      {number}   — current brush/stroke size in pixels
 *   setSize   {function} — updates size in DrawingCanvas state
 *   onUndo    {function} — calls useCanvas.undo()
 *   onClear   {function} — calls useCanvas.clearCanvas()
 *
 * Tools provided:
 *   brush  — freehand pencil stroke
 *   eraser — removes pixels (destination-out composite)
 *   fill   — flood-fill a bounded area
 *   rect   — draws a hollow rectangle
 *   circle — draws a hollow ellipse
 *   line   — draws a straight line
 *
 * Size slider: 2 px – 60 px
 * Undo button: steps back one stroke snapshot
 * Clear button: wipes the entire canvas (with confirmation prompt)
 */

import { useState } from 'react';

// ─── Tool Definitions ─────────────────────────────────────────────────────────
// Each entry defines the tool's key, display label, and SVG icon path.
// Keeping this as data makes it easy to add new tools without changing JSX.

const TOOLS = [
  {
    key: 'brush',
    label: 'Brush',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
        <path d="M3 17c0-2 4-8 9-13" />
        <path d="M12 4c1.5 1.5 4 4.5 4 7 0 2-1.5 3.5-3 4s-3 .5-4 2c-.5 1-1 2-3 2-1.5 0-2.5-1-2.5-2.5C3.5 15 5 14 6 13" />
      </svg>
    ),
  },
  {
    key: 'eraser',
    label: 'Eraser',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
        <path d="M20 20H7L3 16l10-10 7 7-1.5 1.5" />
        <path d="M6.0 11.0 L13.0 18.0" />
      </svg>
    ),
  },
  {
    key: 'fill',
    label: 'Fill',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
        <path d="M19 11L8.93 2.36a1 1 0 00-1.41.15L3 8l8 8" />
        <path d="M19 11c.5.83.5 2.17 0 3-1 1.67-3 1.67-4 0-.5-.83-.5-2.17 0-3 1-1.67 3-1.67 4 0z" />
        <line x1="3" y1="21" x2="21" y2="21" />
      </svg>
    ),
  },
  {
    key: 'rect',
    label: 'Rectangle',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
    ),
  },
  {
    key: 'circle',
    label: 'Circle',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
  {
    key: 'line',
    label: 'Line',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
        <line x1="4" y1="20" x2="20" y2="4" />
      </svg>
    ),
  },
];

// ─── Size Presets ─────────────────────────────────────────────────────────────
// Quick-select buttons for common sizes so the drawer doesn't have to drag
// the slider for typical stroke widths.

const SIZE_PRESETS = [
  { label: 'XS', value: 3 },
  { label: 'S',  value: 6 },
  { label: 'M',  value: 12 },
  { label: 'L',  value: 24 },
  { label: 'XL', value: 48 },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ToolBar({ tool, setTool, size, setSize, onUndo, onClear }) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Confirmation flow for clearing the entire canvas prevents accidental wipes
  const handleClearRequest = () => setShowClearConfirm(true);
  const handleClearConfirm = () => {
    onClear();
    setShowClearConfirm(false);
  };
  const handleClearCancel = () => setShowClearConfirm(false);

  return (
    <div className="toolbar" role="toolbar" aria-label="Drawing tools">

      {/* ── Tool Buttons ──────────────────────────────────────────────────── */}
      <div className="toolbar__group toolbar__tools" role="group" aria-label="Tool selection">
        {TOOLS.map(({ key, label, icon }) => (
          <button
            key={key}
            className={`toolbar__tool-btn ${tool === key ? 'toolbar__tool-btn--active' : ''}`}
            onClick={() => setTool(key)}
            title={label}
            aria-label={label}
            aria-pressed={tool === key}
            type="button"
          >
            {icon}
            <span className="toolbar__tool-label">{label}</span>
          </button>
        ))}
      </div>

      <div className="toolbar__divider" aria-hidden="true" />

      {/* ── Size Controls ─────────────────────────────────────────────────── */}
      <div className="toolbar__group toolbar__sizes" role="group" aria-label="Brush size">
        <span className="toolbar__group-label">Size</span>

        {/* Quick preset buttons */}
        <div className="toolbar__size-presets">
          {SIZE_PRESETS.map(({ label, value }) => (
            <button
              key={label}
              className={`toolbar__size-preset ${size === value ? 'toolbar__size-preset--active' : ''}`}
              onClick={() => setSize(value)}
              title={`${value}px`}
              aria-label={`Size ${label}, ${value} pixels`}
              aria-pressed={size === value}
              type="button"
            >
              {/* Visual dot preview — scales with preset size */}
              <span
                className="toolbar__size-dot"
                style={{
                  width:  Math.max(4, Math.min(value * 0.6, 20)),
                  height: Math.max(4, Math.min(value * 0.6, 20)),
                }}
                aria-hidden="true"
              />
              <span className="toolbar__size-preset-label">{label}</span>
            </button>
          ))}
        </div>

        {/* Fine-grained slider for any size between 2 and 60 */}
        <div className="toolbar__slider-row">
          <input
            type="range"
            min="2"
            max="60"
            value={size}
            onChange={e => setSize(Number(e.target.value))}
            className="toolbar__size-slider"
            aria-label={`Brush size: ${size} pixels`}
            aria-valuemin={2}
            aria-valuemax={60}
            aria-valuenow={size}
          />
          <span className="toolbar__size-readout" aria-live="polite">{size}px</span>
        </div>
      </div>

      <div className="toolbar__divider" aria-hidden="true" />

      {/* ── Action Buttons ────────────────────────────────────────────────── */}
      <div className="toolbar__group toolbar__actions" role="group" aria-label="Canvas actions">
        {/* Undo */}
        <button
          className="toolbar__action-btn toolbar__action-btn--undo"
          onClick={onUndo}
          title="Undo last stroke (Ctrl+Z)"
          aria-label="Undo last stroke"
          type="button"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <polyline points="9 14 4 9 9 4" />
            <path d="M20 20v-7a4 4 0 00-4-4H4" />
          </svg>
          Undo
        </button>

        {/* Clear — shows confirmation panel */}
        {!showClearConfirm ? (
          <button
            className="toolbar__action-btn toolbar__action-btn--clear"
            onClick={handleClearRequest}
            title="Clear entire canvas"
            aria-label="Clear canvas"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
            Clear
          </button>
        ) : (
          <div className="toolbar__confirm" role="alertdialog" aria-label="Confirm canvas clear">
            <span className="toolbar__confirm-text">Clear all?</span>
            <button
              className="toolbar__confirm-btn toolbar__confirm-btn--yes"
              onClick={handleClearConfirm}
              type="button"
              aria-label="Yes, clear canvas"
            >
              Yes
            </button>
            <button
              className="toolbar__confirm-btn toolbar__confirm-btn--no"
              onClick={handleClearCancel}
              type="button"
              aria-label="Cancel, keep drawing"
            >
              No
            </button>
          </div>
        )}
      </div>

    </div>
  );
}