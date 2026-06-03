import { useState } from 'react';
import { useCanvas } from '../hooks/useCanvas';
import ToolBar from './ToolBar';
import ColorPicker from './ColorPicker';

export default function DrawingCanvas({ socket, roomId, isDrawer }) {
  const [tool, setTool] = useState('brush'); // 'brush' | 'eraser' | 'fill' | 'rect' | etc
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(5);
  const { canvasRef, startDraw, draw, endDraw, undo, clearCanvas } = useCanvas(socket, roomId, isDrawer);

  return (
    <div className="canvas-container">
      {isDrawer && (
        <ToolBar
          tool={tool} setTool={setTool}
          size={size} setSize={setSize}
          onUndo={undo} onClear={clearCanvas}
        />
      )}
      <canvas
        ref={canvasRef}
        width={800} height={600}
        className="drawing-canvas"
        style={{ cursor: isDrawer ? 'crosshair' : 'default' }}
        onMouseDown={startDraw}
        onMouseMove={e => draw(e, tool, color, size)}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={e => draw(e, tool, color, size)}
        onTouchEnd={endDraw}
      />
      {isDrawer && <ColorPicker color={color} setColor={setColor} />}
    </div>
  );
}