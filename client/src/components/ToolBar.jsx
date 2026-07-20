import { useState } from 'react';

const TOOLS = [
  {
    key: 'brush',
    label: 'Brush',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M3 17c0-2 4-8 9-13" />
        <path d="M12 4c1.5 1.5 4 4.5 4 7 0 2-1.5 3.5-3 4s-3 .5-4 2c-.5 1-1 2-3 2-1.5 0-2.5-1-2.5-2.5C3.5 15 5 14 6 13" />
      </svg>
    ),
  },
  {
    key: 'fill',
    label: 'Fill Area',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M19.2 11.4L12.6 4.8a1.5 1.5 0 0 0-2.1 0l-7 7a1.5 1.5 0 0 0 0 2.1l6.6 6.6a1.5 1.5 0 0 0 2.1 0l7-7a1.5 1.5 0 0 0 0-2.1zM11.6 19L5 12.4l7-7L18.6 12l-7 7z"/>
        <path d="M19 16.5c-1 0-2 .8-2 2s1 2.5 2 3.5c1-1 2-2.3 2-3.5s-1-2-2-2z"/>
      </svg>
    ),
  },
  {
    key: 'eraser',
    label: 'Eraser',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M20 20H7L3 16l10-10 7 7-1.5 1.5" />
        <path d="M6.0 11.0 L13.0 18.0" />
      </svg>
    ),
  },
];

const SHAPES = [
  {
    key: 'rect',
    label: 'Rectangle',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
        <rect x="4" y="4" width="16" height="16" rx="2" />
      </svg>
    ),
  },
  {
    key: 'circle',
    label: 'Circle',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
        <circle cx="12" cy="12" r="8" />
      </svg>
    ),
  },
  {
    key: 'line',
    label: 'Line',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
        <line x1="4" y1="20" x2="20" y2="4" />
      </svg>
    ),
  },
  {
    key: 'oval',
    label: 'Oval',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
        <ellipse cx="12" cy="12" rx="9" ry="5" />
      </svg>
    ),
  },
  {
    key: 'arrow_single',
    label: 'Arrow',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <line x1="4" y1="12" x2="20" y2="12" />
        <polyline points="14 6 20 12 14 18" />
      </svg>
    ),
  },
  {
    key: 'squircle',
    label: 'Squircle',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
        <rect x="4" y="4" width="16" height="16" rx="6" />
      </svg>
    ),
  },
];

const SIZE_PRESETS = [
  { label: 'S', value: 4, dot: 6 },
  { label: 'M', value: 10, dot: 10 },
  { label: 'L', value: 20, dot: 14 },
  { label: 'XL', value: 36, dot: 18 },
];

export default function ToolBar({ tool, setTool, size, setSize, onUndo, onClear }) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showShapesMenu, setShowShapesMenu] = useState(false);

  const isShapeActive = SHAPES.some((s) => s.key === tool);
  const activeShape = SHAPES.find((s) => s.key === tool) || SHAPES[0];

  return (
    <div className="toolbar-compact" role="toolbar" aria-label="Drawing tools">
      {/* 1. Main Tools (Brush, Fill, Eraser) */}
      <div className="tool-group">
        {TOOLS.map(({ key, label, icon }) => (
          <button
            key={key}
            className={`tool-btn-compact ${tool === key ? 'active' : ''}`}
            onClick={() => {
              setTool(key);
              setShowShapesMenu(false);
            }}
            title={label}
            type="button"
          >
            {icon}
          </button>
        ))}

        {/* Shapes Trigger */}
        <div style={{ position: 'relative' }}>
          <button
            className={`tool-btn-compact ${isShapeActive ? 'active' : ''}`}
            onClick={() => setShowShapesMenu(!showShapesMenu)}
            title={isShapeActive ? activeShape.label : 'Shapes'}
            type="button"
          >
            {isShapeActive ? activeShape.icon : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16">
                <rect x="4" y="4" width="16" height="16" rx="3" />
              </svg>
            )}
          </button>

          {/* Icon-Only Shapes Dropdown Grid with Hover Tooltips */}
          {showShapesMenu && (
            <div className="shapes-dropdown-grid">
              {SHAPES.map(({ key, label, icon }) => (
                <button
                  key={key}
                  className={`shape-grid-item ${tool === key ? 'active' : ''}`}
                  onClick={() => {
                    setTool(key);
                    setShowShapesMenu(false);
                  }}
                  title={label}
                  type="button"
                >
                  {icon}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="toolbar-divider" />

      {/* 2. Brush Size Presets (Perfect Circles) */}
      <div className="tool-group size-group">
        {SIZE_PRESETS.map(({ label, value, dot }) => (
          <button
            key={label}
            className={`size-preset-btn ${size === value ? 'active' : ''}`}
            onClick={() => setSize(value)}
            title={`Size ${value}px`}
            type="button"
          >
            <span className="size-dot-preview" style={{ width: dot, height: dot }} />
          </button>
        ))}
      </div>

      <div className="toolbar-divider" />

      {/* 3. Action Buttons (Undo & Clear) */}
      <div className="tool-group action-group">
        <button className="action-btn-compact undo" onClick={onUndo} title="Undo stroke (Ctrl+Z)" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <polyline points="9 14 4 9 9 4" />
            <path d="M20 20v-7a4 4 0 00-4-4H4" />
          </svg>
        </button>

        {!showClearConfirm ? (
          <button className="action-btn-compact clear" onClick={() => setShowClearConfirm(true)} title="Clear Canvas" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </button>
        ) : (
          <div className="clear-confirm-inline">
            <span>Clear?</span>
            <button
              className="confirm-yes"
              onClick={() => {
                onClear();
                setShowClearConfirm(false);
              }}
              type="button"
            >
              ✓
            </button>
            <button className="confirm-no" onClick={() => setShowClearConfirm(false)} type="button">
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}