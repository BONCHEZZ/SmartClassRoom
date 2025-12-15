const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Attendance = require('../models/Attendance');
const ClassSession = require('../models/ClassSession');

router.post('/mark', protect, async (req, res) => {
  const { qrCode } = req.body; // Expected format: "classId|qrToken"
  
  try {
    const [classId, token] = qrCode.split('|');
    
    const session = await ClassSession.findById(classId);
    if (!session) return res.status(404).json({ error: 'Class not found' });

    // 1. Time-Bound/Session Validation
    if (session.status !== 'ongoing') {
        return res.status(400).json({ error: 'Class is not currently active' });
    }
    if (session.qrToken && session.qrToken !== token) {
        return res.status(400).json({ error: 'Invalid or expired QR code' });
    }

    // 2. Prevent Duplicates
    const existing = await Attendance.findOne({ classSession: classId, user: req.user._id });
    if (existing) {
        return res.status(400).json({ error: 'You have already checked in' });
    }

    // 3. Mark Attendance
    await Attendance.create({
        classSession: classId,
        user: req.user._id,
        role: 'student',
        status: 'present'
    });

    // Real-time update to lecturer
    req.app.get('io').emit('attendanceUpdated', { classId });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;