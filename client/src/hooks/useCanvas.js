import { useCanvas } from '../hooks/useCanvas';  // one level up, not two
import { useRef, useEffect, useCallback } from 'react';

export function useCanvas(socket, roomId, isDrawer) {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const history = useRef([]); // For undo/redo — stores canvas image data snapshots

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    // Support both mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDraw = useCallback((e) => {
    if (!isDrawer) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    isDrawing.current = true;
    const pos = getPos(e, canvas);
    lastPos.current = pos;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, [isDrawer]);

  const draw = useCallback((e, tool, color, size) => {
    if (!isDrawer || !isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);

    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
    }

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    // Emit to server — the server will broadcast to all other players
    socket.emit('drawing', {
      roomId,
      from: lastPos.current,
      to: pos,
      tool,
      color,
      size
    });

    lastPos.current = pos;
  }, [isDrawer, socket, roomId]);

  const endDraw = useCallback(() => {
    if (!isDrawer || !isDrawing.current) return;
    isDrawing.current = false;
    // Save snapshot for undo
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    history.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (history.current.length > 30) history.current.shift(); // limit memory
  }, [isDrawer]);

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    history.current.pop();
    const last = history.current[history.current.length - 1];
    if (last) {
      ctx.putImageData(last, 0, 0);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    socket.emit('canvasState', { roomId, state: canvas.toDataURL() });
  }, [socket, roomId]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    history.current = [];
    socket.emit('clearCanvas', { roomId });
  }, [socket, roomId]);

  // Listen for other players' drawing events
  useEffect(() => {
    if (!socket) return;

    socket.on('drawing', ({ from, to, tool, color, size }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color;
      }
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    });

    socket.on('clearCanvas', () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // When a new player joins mid-game, send them the current canvas state
    socket.on('canvasState', ({ state }) => {
      const canvas = canvasRef.current;
      const img = new Image();
      img.src = state;
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
      };
    });

    return () => {
      socket.off('drawing');
      socket.off('clearCanvas');
      socket.off('canvasState');
    };
  }, [socket]);

  return { canvasRef, startDraw, draw, endDraw, undo, clearCanvas };
}