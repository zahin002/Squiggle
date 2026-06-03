module.exports = (io) => {
  // Drawing events are handled on the global `io` object
  // Each socket has already joined its room via gameEvents.js

  io.on('connection', (socket) => {

    // Core drawing event — received from drawer, broadcast to everyone else
    socket.on('drawing', (data) => {
      // socket.to() = broadcast to everyone in the room EXCEPT the sender
      // This prevents the drawer from receiving their own events (they already drew locally)
      socket.to(data.roomId).emit('drawing', data);
    });

    socket.on('clearCanvas', ({ roomId }) => {
      socket.to(roomId).emit('clearCanvas');
    });

    // When a new player joins, the drawer sends their current canvas state
    socket.on('requestCanvasState', ({ roomId }) => {
      const { rooms } = require('./roomStore');
      const room = rooms.get(roomId);
      if (!room || !room.currentDrawer) return;

      // Ask the current drawer to send their canvas to the requester
      io.to(room.currentDrawer.socketId).emit('sendCanvasStateTo', {
        targetSocketId: socket.id
      });
    });

    // Drawer sends canvas state to a specific new joiner
    socket.on('canvasStateFor', ({ targetSocketId, state }) => {
      io.to(targetSocketId).emit('canvasState', { state });
    });

    // Shape drawing (sent as complete shape data, not stroke-by-stroke)
    socket.on('drawShape', (data) => {
      // data = { roomId, shapeType, startX, startY, endX, endY, color, size }
      socket.to(data.roomId).emit('drawShape', data);
    });

    // Fill tool event
    socket.on('fillArea', (data) => {
      // data = { roomId, x, y, color }
      socket.to(data.roomId).emit('fillArea', data);
    });
  });
};