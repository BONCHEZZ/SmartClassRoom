const express = require('express');
const router = express.Router();

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(403).json({ error: 'No token' });
  next();
};

const startAttendance = async (req, res) => {
  res.json({ message: 'Start attendance endpoint working' });
};

const refreshQR = async (req, res) => {
  res.json({ message: 'Refresh QR endpoint working' });
};

const endAttendance = async (req, res) => {
  res.json({ message: 'End attendance endpoint working' });
};

const getAllClassSessions = async (req, res) => {
  res.json({ message: 'Get all classes endpoint working' });
};

router.post('/start-attendance', authMiddleware, startAttendance);
router.post('/refresh-qr/:classSessionId', authMiddleware, refreshQR);
router.post('/end-attendance/:classSessionId', authMiddleware, endAttendance);
router.get('/', authMiddleware, getAllClassSessions);

module.exports = router;