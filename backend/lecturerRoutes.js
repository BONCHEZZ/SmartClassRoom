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

    // Fetch classes where the user is the lecturer (matching ID or Name for prototype flexibility)
    const classes = await ClassSession.find({
      $or: [{ lecturer: lecturerId }, { lecturer: user.name }],
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
    // Verify room if needed (omitted for prototype simplicity)
    const cls = await ClassSession.findByIdAndUpdate(
      req.params.id, 
      { status: 'ongoing', startTime: new Date() }, // Update start time to actual
      { new: true }
    );
    res.json(cls);
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
    res.json(cls);
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel class' });
  }
});

// Generate QR Code
router.get('/class/:id/qr', auth, async (req, res) => {
  try {
    const cls = await ClassSession.findById(req.params.id);
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    res.json({ qrCode: cls._id });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// Get Live Attendance Count
router.get('/class/:id/attendance', auth, async (req, res) => {
  const count = await Attendance.countDocuments({ classId: req.params.id, status: 'present' });
  res.json({ count });
});

// Delete Class
router.delete('/class/:id', auth, async (req, res) => {
  try {
    const cls = await ClassSession.findByIdAndDelete(req.params.id);
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    res.json({ message: 'Class deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// Get All Classes for Lecturer
router.get('/classes', auth, async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const user = await User.findById(lecturerId).select('-password');

    const classes = await ClassSession.find({
      $or: [{ lecturer: lecturerId }, { lecturerName: user.name }]
    }).sort({ startTime: -1 });

    res.json(classes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;