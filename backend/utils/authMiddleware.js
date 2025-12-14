// backend/utils/authMiddleware.js
const jwt = require('jsonwebtoken');
const SECRET = 'smarttrack_secret';

module.exports = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(403).json({ error: 'No token' });

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
