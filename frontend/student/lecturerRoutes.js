const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const ClassSession = require('../models/ClassSession');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// Get Dashboard Data
router.get('/dashboard', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const schedule = await ClassSession.find({ lecturer: req.user._id, startTime: { $gte: today } }).sort({ startTime: 1 });
    res.json({ user: req.user, schedule });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Classes (My Classes)
router.get('/classes', protect, async (req, res) => {
  const classes = await ClassSession.find({ lecturer: req.user._id }).sort({ startTime: -1 });
  res.json(classes);
});

// Start Class (Generates QR Token)
router.post('/class/:id/start', protect, async (req, res) => {
  try {
    const session = await ClassSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Class not found' });

    if (session.status === 'ongoing') {
       return res.status(400).json({ error: 'Class already started', qrPayload: `${session._id}|${session.qrToken}` });
    }

    session.status = 'ongoing';
    session.qrToken = Math.random().toString(36).substring(7); // Simple random token
    
    // Check for lateness (15 min buffer)
    const now = new Date();
    const start = new Date(session.startTime);
    if (now > new Date(start.getTime() + 15*60000)) {
        session.lecturerLate = true;
        // Notify students via Socket
        req.app.get('io').to(session._id.toString()).emit('lecturerLate', { classId: session._id, lecturerName: req.user.name });
    } else {
        req.app.get('io').to(session._id.toString()).emit('classStarted', { classId: session._id });
    }
    
    // Auto-mark lecturer attendance
    session.lecturerArrivalTime = now;
    await session.save();

    await Attendance.create({
        classSession: session._id,
        user: req.user._id,
        role: 'lecturer',
        status: session.lecturerLate ? 'late' : 'present'
    });

    res.json({ success: true, qrPayload: `${session._id}|${session.qrToken}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// End Class
router.post('/class/:id/end', protect, async (req, res) => {
    const session = await ClassSession.findById(req.params.id);
    if(session) {
        session.status = 'completed';
        await session.save();
        req.app.get('io').to(session._id.toString()).emit('classEnded', { classId: session._id });
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

// Live Attendance Count
router.get('/class/:id/attendance', protect, async (req, res) => {
    const count = await Attendance.countDocuments({ classSession: req.params.id, role: 'student' });
    res.json({ count });
});

module.exports = router;