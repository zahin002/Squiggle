/**
 * client/src/components/canvas/DrawingCanvas.jsx
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT CHANGED vs the previous version
 * ─────────────────────────────────────────────────────────────────────────────
 * OLD DrawingCanvas.jsx:
 *   - Imported ToolBar and ColorPicker but their files didn't exist yet
 *   - Only handled 'brush' and 'eraser' tools via useCanvas
 *   - No shape tools (rect, circle, line)
 *   - No fill tool
 *   - No keyboard shortcuts
 *
 * NEW DrawingCanvas.jsx:
 *   - ToolBar.jsx and ColorPicker.jsx are now fully implemented
 *   - Shape tools (rect, circle, line) rendered with a preview ghost while
 *     dragging, emitted as 'drawShape' on mouseUp
 *   - Fill tool emits 'fillArea' + applies flood-fill locally
 *   - Keyboard shortcut: Ctrl+Z for undo
 *   - Cursor changes per active tool
 *   - All drawing paths go through useCanvas (freehand) OR shape handlers
 *     (shapes/fill) defined in this file
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Props:
 *   socket   {object}  Socket.IO client instance
 *   roomId   {string}  Current room ID
 *   isDrawer {boolean} Whether this client is the designated drawer this round
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useCanvas } from '../../hooks/useCanvas';
import ToolBar from './ToolBar';
import ColorPicker from './ColorPicker';

// ─── Cursor map ───────────────────────────────────────────────────────────────
// Maps tool keys to appropriate CSS cursor values so the drawer gets visual
// feedback about which tool is active.

const TOOL_CURSORS = {
  brush:  'crosshair',
  eraser: 'cell',
  fill:   'copy',
  rect:   'crosshair',
  circle: 'crosshair',
  line:   'crosshair',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function DrawingCanvas({ socket, roomId, isDrawer }) {
  // ── Tool / Color / Size state ─────────────────────────────────────────────
  const [tool, setTool]   = useState('brush');
  const [color, setColor] = useState('#000000');
  const [size, setSize]   = useState(5);

  // ── Shape drawing state ───────────────────────────────────────────────────
  // Shapes (rect, circle, line) are drawn by recording startPos on mouseDown,
  // rendering a live "ghost" on mouseMoveShape, then emitting + finalising on mouseUp.
  const isShapeDrawing  = useRef(false);
  const shapeStartPos   = useRef({ x: 0, y: 0 });
  // We keep a snapshot of the canvas BEFORE the shape preview begins so we can
  // restore it on each mousemove before re-drawing the ghost.
  const preShapeSnapshot = useRef(null);

  // ── Canvas hook (freehand brush + eraser + undo + clear + socket listeners) ─
  const {
    canvasRef,
    startDraw,
    draw,
    endDraw,
    undo,
    clearCanvas,
  } = useCanvas(socket, roomId, isDrawer);

  // ─── Keyboard shortcut: Ctrl+Z / Cmd+Z → undo ────────────────────────────
  useEffect(() => {
    if (!isDrawer) return;

    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isDrawer, undo]);

  // ─── Additional socket listeners for shapes + fill ────────────────────────
  // useCanvas already listens for 'drawing', 'clearCanvas', 'canvasState'.
  // Here we add listeners for 'drawShape' and 'fillArea' received from others.
  useEffect(() => {
    if (!socket) return;

    // Someone else drew a shape — render it on our canvas
    socket.on('drawShape', ({ shapeType, startX, startY, endX, endY, color: c, size: s }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      renderShape(canvas.getContext('2d'), shapeType, startX, startY, endX, endY, c, s);
    });

    // Someone else used fill — apply flood-fill on our canvas
    socket.on('fillArea', ({ x, y, color: fillColor }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      applyFloodFill(canvas, Math.round(x), Math.round(y), fillColor);
    });

    return () => {
      socket.off('drawShape');
      socket.off('fillArea');
    };
  }, [socket, canvasRef]);

  // ─── Coordinate helper ────────────────────────────────────────────────────
  const getPos = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top)  * (canvas.height / rect.height),
    };
  }, [canvasRef]);

  // ─── Mouse / Touch event handlers ─────────────────────────────────────────
  // We intercept events before passing them to useCanvas hooks so we can
  // route shape and fill tools through their own code paths.

  const handleMouseDown = useCallback((e) => {
    if (!isDrawer) return;

    if (tool === 'fill') {
      // Fill tool: act immediately on mouseDown, no drag
      const canvas = canvasRef.current;
      if (!canvas) return;
      const pos = getPos(e);
      applyFloodFill(canvas, Math.round(pos.x), Math.round(pos.y), color);
      // Emit so other players see it
      socket.emit('fillArea', { roomId, x: pos.x, y: pos.y, color });
      // Save snapshot for undo
      const ctx = canvas.getContext('2d');
      // We piggyback on useCanvas's history by emitting canvasState
      socket.emit('canvasState', { roomId, state: canvas.toDataURL() });
      return;
    }

    if (['rect', 'circle', 'line'].includes(tool)) {
      // Shape tools: record start, take pre-draw snapshot
      const pos = getPos(e);
      shapeStartPos.current = pos;
      isShapeDrawing.current = true;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      preShapeSnapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return;
    }

    // Freehand brush / eraser — delegate to useCanvas
    startDraw(e);
  }, [isDrawer, tool, color, socket, roomId, getPos, canvasRef, startDraw]);

  const handleMouseMove = useCallback((e) => {
    if (!isDrawer) return;

    if (['rect', 'circle', 'line'].includes(tool) && isShapeDrawing.current) {
      // Live shape preview: restore pre-shape canvas, then draw ghost
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (preShapeSnapshot.current) {
        ctx.putImageData(preShapeSnapshot.current, 0, 0);
      }
      const pos = getPos(e);
      const { x: sx, y: sy } = shapeStartPos.current;
      // Draw ghost at reduced opacity to indicate "in progress"
      ctx.globalAlpha = 0.75;
      renderShape(ctx, tool, sx, sy, pos.x, pos.y, color, size);
      ctx.globalAlpha = 1;
      return;
    }

    // Freehand brush / eraser — delegate to useCanvas
    draw(e, tool, color, size);
  }, [isDrawer, tool, color, size, getPos, canvasRef, draw]);

  const handleMouseUp = useCallback((e) => {
    if (!isDrawer) return;

    if (['rect', 'circle', 'line'].includes(tool) && isShapeDrawing.current) {
      isShapeDrawing.current = false;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Restore pre-shape canvas so the final shape is drawn cleanly at full opacity
      if (preShapeSnapshot.current) {
        ctx.putImageData(preShapeSnapshot.current, 0, 0);
      }

      const pos = getPos(e);
      const { x: sx, y: sy } = shapeStartPos.current;

      // Only emit + draw if the user actually dragged (not a misclick)
      const moved = Math.abs(pos.x - sx) > 3 || Math.abs(pos.y - sy) > 3;
      if (moved) {
        ctx.globalAlpha = 1;
        renderShape(ctx, tool, sx, sy, pos.x, pos.y, color, size);
        socket.emit('drawShape', {
          roomId,
          shapeType: tool,
          startX: sx,
          startY: sy,
          endX: pos.x,
          endY: pos.y,
          color,
          size,
        });
        // Snapshot for undo
        socket.emit('canvasState', { roomId, state: canvas.toDataURL() });
      }

      preShapeSnapshot.current = null;
      return;
    }

    // Freehand brush / eraser — delegate to useCanvas
    endDraw();
  }, [isDrawer, tool, color, size, socket, roomId, getPos, canvasRef, endDraw]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="canvas-container">

      {/* ToolBar: only visible to the drawer */}
      {isDrawer && (
        <ToolBar
          tool={tool}
          setTool={setTool}
          size={size}
          setSize={setSize}
          onUndo={undo}
          onClear={clearCanvas}
        />
      )}

      {/* The HTML5 canvas — 800×600 logical pixels, scales via CSS */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="drawing-canvas"
        style={{ cursor: isDrawer ? (TOOL_CURSORS[tool] || 'crosshair') : 'default' }}
        /* Mouse events */
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        /* Touch events (mobile drawing) */
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        aria-label={isDrawer ? 'Drawing canvas — you are the drawer' : 'Drawing canvas — watch and guess'}
        role="img"
      />

      {/* ColorPicker: only visible to the drawer */}
      {isDrawer && (
        <ColorPicker color={color} setColor={setColor} />
      )}

    </div>
  );
}

// ─── Shape Rendering ──────────────────────────────────────────────────────────
// Pure canvas-API drawing functions.
// Called both locally (while dragging) and when receiving 'drawShape' from server.
// Must be identical in both cases so all clients see the same result.

/**
 * Render a shape onto a 2D canvas context.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {'rect'|'circle'|'line'} shapeType
 * @param {number} startX
 * @param {number} startY
 * @param {number} endX
 * @param {number} endY
 * @param {string} color - CSS color string
 * @param {number} size  - stroke width in pixels
 */
function renderShape(ctx, shapeType, startX, startY, endX, endY, color, size) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = color;
  ctx.lineWidth   = size;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';

  ctx.beginPath();

  if (shapeType === 'rect') {
    const w = endX - startX;
    const h = endY - startY;
    ctx.strokeRect(startX, startY, w, h);

  } else if (shapeType === 'circle') {
    // Draw an ellipse bounded by the drag rectangle
    const cx = (startX + endX) / 2;
    const cy = (startY + endY) / 2;
    const rx = Math.abs(endX - startX) / 2;
    const ry = Math.abs(endY - startY) / 2;
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

  } else if (shapeType === 'line') {
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  ctx.restore();
}

// ─── Flood Fill ───────────────────────────────────────────────────────────────
// Scanline flood-fill algorithm.
// Applied locally and on every other client when 'fillArea' is received.
// The fill is done entirely in pixel-space using ImageData.

/**
 * Hex color string → [r, g, b, a] array.
 * @param {string} hex - e.g. '#FF0000' or '#F00'
 * @returns {[number,number,number,number]}
 */
function hexToRgba(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('');
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
    255,
  ];
}

/**
 * Check if two RGBA tuples are "close enough" to be considered the same color.
 * A tolerance of 30 handles antialiased edges without leaking through clean boundaries.
 */
function colorClose(a, b, tolerance = 30) {
  return (
    Math.abs(a[0] - b[0]) <= tolerance &&
    Math.abs(a[1] - b[1]) <= tolerance &&
    Math.abs(a[2] - b[2]) <= tolerance &&
    Math.abs(a[3] - b[3]) <= tolerance
  );
}

/**
 * Scanline flood-fill on an HTML5 canvas.
 *
 * Algorithm:
 *   1. Read pixel at (x, y) — this is the "target" color
 *   2. If target == fill color, nothing to do
 *   3. Use a stack-based scanline approach:
 *      - For each row segment, fill leftward and rightward
 *      - Push unfilled rows above and below each filled segment
 *   This is O(n) where n = number of pixels filled and avoids recursion stack overflow.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {number} startX  - click x (integer)
 * @param {number} startY  - click y (integer)
 * @param {string} fillHex - target fill color hex string
 */
function applyFloodFill(canvas, startX, startY, fillHex) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Bounds check
  if (startX < 0 || startY < 0 || startX >= width || startY >= height) return;

  // Helper: pixel index in the flat data array
  const idx = (x, y) => (y * width + x) * 4;

  // Get target color at click point
  const i0 = idx(startX, startY);
  const target = [data[i0], data[i0 + 1], data[i0 + 2], data[i0 + 3]];

  // Resolve fill color
  const fill = hexToRgba(fillHex);

  // If target is already the fill color, nothing to do
  if (colorClose(target, fill, 5)) return;

  /**
   * Set one pixel in imageData.data to the fill color.
   * @param {number} x
   * @param {number} y
   */
  function setPixel(x, y) {
    const i = idx(x, y);
    data[i]     = fill[0];
    data[i + 1] = fill[1];
    data[i + 2] = fill[2];
    data[i + 3] = fill[3];
  }

  /**
   * Check if a pixel matches the target color.
   * @param {number} x
   * @param {number} y
   * @returns {boolean}
   */
  function matchesTarget(x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) return false;
    const i = idx(x, y);
    return colorClose(
      [data[i], data[i + 1], data[i + 2], data[i + 3]],
      target
    );
  }

  // Scanline stack: each entry = [x, y, scanLeft, scanRight, direction]
  // direction: +1 = scan downward row, -1 = scan upward row
  const stack = [[startX, startY]];
  const visited = new Uint8Array(width * height); // tracks visited pixels

  while (stack.length > 0) {
    let [x, y] = stack.pop();

    // Find leftmost pixel of this scanline that matches target
    while (x > 0 && matchesTarget(x - 1, y)) x--;

    let spanAbove = false;
    let spanBelow = false;

    // Fill rightward along this scanline
    while (x < width && matchesTarget(x, y)) {
      const vi = y * width + x;
      if (visited[vi]) { x++; continue; }
      visited[vi] = 1;
      setPixel(x, y);

      // Check row above
      if (y > 0) {
        if (matchesTarget(x, y - 1) && !visited[(y - 1) * width + x]) {
          if (!spanAbove) {
            stack.push([x, y - 1]);
            spanAbove = true;
          }
        } else {
          spanAbove = false;
        }
      }

      // Check row below
      if (y < height - 1) {
        if (matchesTarget(x, y + 1) && !visited[(y + 1) * width + x]) {
          if (!spanBelow) {
            stack.push([x, y + 1]);
            spanBelow = true;
          }
        } else {
          spanBelow = false;
        }
      }

      x++;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}