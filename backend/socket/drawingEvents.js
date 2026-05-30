const { getRoom, setRoom } = require('./roomStore');

module.exports = (io, socket) => {

  // ─── DRAW START (mouse down) ──────────────────────────────
  socket.on('draw:start', (data) => {
    const roomCode = socket.data.roomCode;
    const room = getRoom(roomCode);
    if (!room) return;

    // Only the current drawer can draw
    if (room.currentDrawer !== socket.id) return;

    room.canvasState.push({ type: 'start', ...data });
    setRoom(roomCode, room);

    socket.to(roomCode).emit('draw:start', data);
  });

  // ─── DRAW MOVE (mouse moving while held) ──────────────────
  socket.on('draw:move', (data) => {
    const roomCode = socket.data.roomCode;
    const room = getRoom(roomCode);
    if (!room || room.currentDrawer !== socket.id) return;

    room.canvasState.push({ type: 'move', ...data });
    setRoom(roomCode, room);

    socket.to(roomCode).emit('draw:move', data);
  });

  // ─── DRAW END (mouse up) ──────────────────────────────────
  socket.on('draw:end', (data) => {
    const roomCode = socket.data.roomCode;
    const room = getRoom(roomCode);
    if (!room || room.currentDrawer !== socket.id) return;

    room.canvasState.push({ type: 'end', ...data });
    setRoom(roomCode, room);

    socket.to(roomCode).emit('draw:end', data);
  });

  // ─── DRAW UNDO ────────────────────────────────────────────
  socket.on('draw:undo', () => {
    const roomCode = socket.data.roomCode;
    const room = getRoom(roomCode);
    if (!room || room.currentDrawer !== socket.id) return;

    // Remove everything from the last 'start' onward
    const lastStartIndex = room.canvasState.map(e => e.type).lastIndexOf('start');
    if (lastStartIndex !== -1) {
      room.canvasState = room.canvasState.slice(0, lastStartIndex);
    }
    setRoom(roomCode, room);

    socket.to(roomCode).emit('draw:undo');
  });

  // ─── DRAW CLEAR (full canvas wipe) ───────────────────────
  socket.on('draw:clear', () => {
    const roomCode = socket.data.roomCode;
    const room = getRoom(roomCode);
    if (!room || room.currentDrawer !== socket.id) return;

    room.canvasState = [];
    setRoom(roomCode, room);

    socket.to(roomCode).emit('draw:clear');
  });

  // ─── DRAW SHAPE (circle, rect, triangle, arrow) ───────────
  socket.on('draw:shape', (data) => {
    const roomCode = socket.data.roomCode;
    const room = getRoom(roomCode);
    if (!room || room.currentDrawer !== socket.id) return;

    room.canvasState.push({ type: 'shape', ...data });
    setRoom(roomCode, room);

    socket.to(roomCode).emit('draw:shape', data);
  });

};