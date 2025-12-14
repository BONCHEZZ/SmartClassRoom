const express = require('express');
const router = express.Router();
const auth = require('../utils/authMiddleware');
const ClassSession = require('../models/ClassSession');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

// Get Lecturer Dashboard Data
router.get('/dashboard', auth, async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const user = await User.findById(lecturerId).select('-password');

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Fetch classes where the user is the lecturer. Support legacy documents that stored lecturer as name by
    // matching either `lecturer` ObjectId or `lecturerName` string
    const classes = await ClassSession.find({
      $or: [{ lecturer: lecturerId }, { lecturerName: user.name }],
      startTime: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ startTime: 1 });

    // Calculate Stats
    const totalClasses = classes.length;
    const nextClass = classes.find(c => c.status === 'upcoming' || c.status === 'delayed');
    
    // Mock Average Attendance (In production, aggregate from Attendance model)
    // Here we just count total 'present' records for this lecturer's classes
    const avgAttendance = 85; // Placeholder for complex aggregation

    res.json({
      user,
      stats: {
        totalClasses,
        avgAttendance,
        nextClass: nextClass ? nextClass.unit : 'None'
      },
      schedule: classes
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Start Class (Lecturer Check-In)
router.post('/class/:id/start', auth, async (req, res) => {
  try {
    // Mark actual start, compute lecturer lateness and set lecturer check-in metadata
    const clsBefore = await ClassSession.findById(req.params.id);
    if (!clsBefore) return res.status(404).json({ error: 'Class not found' });

    const actualStart = new Date();
    const scheduled = clsBefore.startTime || actualStart;
    const lateThresholdMinutes = 10;
    const lecturerLate = (actualStart - new Date(scheduled)) > lateThresholdMinutes * 60 * 1000;

    const updated = await ClassSession.findByIdAndUpdate(req.params.id, {
      status: 'ongoing',
      actualStart,
      lecturerCheckInTime: actualStart,
      lecturerLate
    }, { new: true });

    // Emit notification to students in class room
    try { if (global && global.io) global.io.to(req.params.id).emit('classStarted', { classId: req.params.id, actualStart, lecturerLate }); } catch(e){}

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to start class' });
  }
});

// End Class
router.post('/class/:id/end', auth, async (req, res) => {
  try {
    const cls = await ClassSession.findByIdAndUpdate(
      req.params.id, 
      { status: 'completed' }, 
      { new: true }
    );
    res.json(cls);
  } catch (err) {
    res.status(500).json({ error: 'Failed to end class' });
  }
});

// Cancel Class
router.post('/class/:id/cancel', auth, async (req, res) => {
  try {
    const cls = await ClassSession.findByIdAndUpdate(
      req.params.id, 
      { status: 'cancelled' }, 
      { new: true }
    );
    // Notify connected students via socket
    try { if (global && global.io) global.io.to(req.params.id).emit('classCancelled', { classId: req.params.id }); } catch(e){}
    res.json(cls);
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel class' });
  }
});

// Generate a time-bound QR token for this class
router.get('/class/:id/qr', auth, async (req, res) => {
  try {
    const cls = await ClassSession.findById(req.params.id);
    if (!cls) return res.status(404).json({ error: 'Class not found' });

    // Generate simple random token (prototype). In production use crypto and stronger tokens.
    const token = Math.random().toString(36).slice(2, 10);
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minute expiry

    cls.qrToken = token;
    cls.qrExpires = expires;
    await cls.save();

    // Return payload: classId|token
    return res.json({ qrPayload: `${cls._id.toString()}|${token}`, expires });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate QR' });
  }
});

// Get Live Attendance Count
router.get('/class/:id/attendance', auth, async (req, res) => {
  const count = await Attendance.countDocuments({ classId: req.params.id, status: 'present' });
  res.json({ count });
});

module.exports = router;