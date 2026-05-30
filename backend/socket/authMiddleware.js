const jwt = require('jsonwebtoken');

const socketAuth = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      // Guest user — no token sent
      socket.data.user = {
        userId: `guest_${socket.id}`,
        username: socket.handshake.auth.username || 'Guest',
        isGuest: true
      };
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Match Alahi's structure — he stores id not userId in the token
      socket.data.user = {
        userId: decoded.id,
        username: decoded.username,
        isGuest: false
      };

      next();
    } catch (error) {
      next(new Error('Authentication failed — invalid token'));
    }
  });
};

module.exports = socketAuth;