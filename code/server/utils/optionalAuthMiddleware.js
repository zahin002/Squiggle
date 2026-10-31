// server/utils/optionalAuthMiddleware.js
//
// Unlike authMiddleware (which rejects unauthenticated requests with 401),
// optionalAuthMiddleware sets req.user to null when no valid token is present
// and lets the request continue. The route handler then decides what permissions
// to grant based on whether req.user is null (guest) or populated (registered).

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null; // No token → guest
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, username }
    next();
  } catch {
    // Invalid / expired token → treat as guest rather than rejecting
    req.user = null;
    next();
  }
};