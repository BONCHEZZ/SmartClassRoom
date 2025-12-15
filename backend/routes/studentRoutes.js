const express = require('express');
const router = express.Router();

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(403).json({ error: 'No token' });
  next();
};

const getDashboard = async (req, res) => {
  res.json({ message: 'Student dashboard endpoint working' });
};

const updateProfile = async (req, res) => {
  res.json({ message: 'Profile update endpoint working' });
};

const enrollCourse = async (req, res) => {
  res.json({ message: 'Course enrollment endpoint working' });
};

const submitReport = async (req, res) => {
  res.json({ message: 'Report submission endpoint working' });
};

router.get('/dashboard', authMiddleware, getDashboard);
router.put('/profile', authMiddleware, updateProfile);
router.post('/enroll', authMiddleware, enrollCourse);
router.post('/report', authMiddleware, submitReport);

module.exports = router;