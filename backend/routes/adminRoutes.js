const express = require('express');
const router = express.Router();

router.get('/dashboard', (req, res) => {
  res.json({ message: 'Admin dashboard working' });
});

router.get('/lecturers', (req, res) => {
  res.json({ message: 'Get lecturers working' });
});

router.get('/students', (req, res) => {
  res.json({ message: 'Get students working' });
});

router.get('/attendance-logs', (req, res) => {
  res.json({ message: 'Get attendance logs working' });
});

module.exports = router;