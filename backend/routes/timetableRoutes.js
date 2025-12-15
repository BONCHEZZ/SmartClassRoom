const express = require('express');
const { uploadTimetable } = require('../controllers/timetableController');
const { verifyToken } = require('../utils/authMiddleware');
const router = express.Router();

router.post('/upload', verifyToken, uploadTimetable);

module.exports = router;