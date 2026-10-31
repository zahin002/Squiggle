import { useState } from 'react';
import {
  FaPaintBrush,
  FaFillDrip,
  FaEraser,
  FaShapes,
  FaUndo,
  FaTrashAlt,
  FaRegSquare,
  FaRegCircle,
  FaSlash,
  FaArrowRight,
  FaCheck,
  FaTimes
} from 'react-icons/fa';

const TOOLS = [
  {
    key: 'brush',
    label: 'Brush',
    icon: <FaPaintBrush size={17} />,
  },
  {
    key: 'fill',
    label: 'Fill Area',
    icon: <FaFillDrip size={17} />,
  },
  {
    key: 'eraser',
    label: 'Eraser',
    icon: <FaEraser size={17} />,
  },
];

const SHAPES = [
  {
    key: 'rect',
    label: 'Rectangle',
    icon: <FaRegSquare size={16} />,
  },
  {
    key: 'circle',
    label: 'Circle',
    icon: <FaRegCircle size={16} />,
  },
  {
    key: 'line',
    label: 'Line',
    icon: <FaSlash size={15} />,
  },
  {
    key: 'oval',
    label: 'Oval',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="17" height="17">
        <ellipse cx="12" cy="12" rx="9" ry="5" />
      </svg>
    ),
  },
  {
    key: 'arrow_single',
    label: 'Arrow',
    icon: <FaArrowRight size={16} />,
  },
  {
    key: 'squircle',
    label: 'Squircle',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="17" height="17">
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
            {isShapeActive ? activeShape.icon : <FaShapes size={17} />}
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
          <FaUndo size={16} />
        </button>

        {!showClearConfirm ? (
          <button className="action-btn-compact clear" onClick={() => setShowClearConfirm(true)} title="Clear Canvas" type="button">
            <FaTrashAlt size={16} />
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
              title="Confirm clear"
            >
              <FaCheck size={11} />
            </button>
            <button
              className="confirm-no"
              onClick={() => setShowClearConfirm(false)}
              type="button"
              title="Cancel"
            >
              <FaTimes size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}