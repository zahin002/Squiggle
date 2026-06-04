module.exports = (io) => {
  io.on('connection', (socket) => {
    socket.on('drawing', (data) => {
      socket.to(data.roomId).emit('drawing', data);
    });
    socket.on('clearCanvas', ({ roomId }) => {
      socket.to(roomId).emit('clearCanvas');
    });
    socket.on('canvasState', ({ roomId, state }) => {
      socket.to(roomId).emit('canvasState', { state });
    });
    socket.on('requestCanvasState', ({ roomId }) => {
      socket.to(roomId).emit('sendCanvasState', { requesterId: socket.id });
    });
  });
};