const express = require('express');
const router = express.Router();

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(403).json({ error: 'No token' });
  next();
};

const scanQRAttendance = async (req, res) => {
  res.json({ message: 'QR scan endpoint working' });
};

const getAttendance = async (req, res) => {
  res.json({ message: 'Get attendance endpoint working' });
};

router.post('/scan', authMiddleware, scanQRAttendance);
router.get('/:id', authMiddleware, getAttendance);

module.exports = router;