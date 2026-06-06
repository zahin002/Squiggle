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
    socket.on('drawShape', (data) => {
      socket.to(data.roomId).emit('drawShape', data);
    });
    socket.on('fillArea', (data) => {
      socket.to(data.roomId).emit('fillArea', data);
    });
    socket.on('requestCanvasState', ({ roomId }) => {
      socket.to(roomId).emit('sendCanvasStateTo', { targetSocketId: socket.id });
    });
    socket.on('canvasStateFor', ({ targetSocketId, state }) => {
      io.to(targetSocketId).emit('canvasState', { state });
    });
  });
};