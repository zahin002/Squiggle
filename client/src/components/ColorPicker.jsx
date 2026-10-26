import { useCallback } from 'react';

const PALETTE = [
  // Row 1 (11 colors)
  '#ffffff', '#c1c1c1', '#ef130b', '#ff7100', '#ffe400', '#00cc00', '#00b2ff', '#231fd3', '#a300ba', '#d37caa', '#a0522d',
  // Row 2 (11 colors)
  '#000000', '#4c4c4c', '#740b07', '#c23800', '#e8a200', '#005510', '#00569e', '#0e0865', '#550069', '#a75574', '#63300d',
];

export default function ColorPicker({ color, setColor }) {
  const selectColor = useCallback(
    (newColor) => {
      if (newColor === color) return;
      setColor(newColor);
    },
    [color, setColor]
  );

  const isActive = (c) => c.toLowerCase() === color.toLowerCase();

  return (
    <div className="color-picker-compact" role="group" aria-label="Color selection">
      {/* Current Active Color Box */}
      <div className="active-color-preview" style={{ backgroundColor: color }} title={`Active color: ${color}`}>
        <input
          type="color"
          value={color}
          onChange={(e) => selectColor(e.target.value)}
          className="custom-color-input"
          title="Custom color picker"
        />
      </div>

      {/* 2-Row Color Palette Grid */}
      <div className="palette-grid-compact" role="listbox" aria-label="Color palette">
        {PALETTE.map((c) => (
          <button
            key={c}
            className={`color-swatch-compact ${isActive(c) ? 'active' : ''}`}
            style={{ backgroundColor: c }}
            onClick={() => selectColor(c)}
            title={c.toUpperCase()}
            type="button"

          >
            {isActive(c) && <span className="swatch-check">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}