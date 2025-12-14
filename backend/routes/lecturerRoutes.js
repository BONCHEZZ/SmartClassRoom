const express = require('express');
const router = express.Router();
const auth = require('../utils/authMiddleware');
const ClassSession = require('../models/ClassSession');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const crypto = require('crypto');

// Get Lecturer Dashboard Data
router.get('/dashboard', auth, async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const user = await User.findById(lecturerId).select('-password');

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const classes = await ClassSession.find({
      lecturer: lecturerId
    }).sort({ startTime: 1 });

    res.json({
      user,
      schedule: classes
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// NEWLY MODIFIED CODE
// Start Class (Lecturer Check-In) & Generate QR
router.post('/class/:id/start', auth, async (req, res) => {
  try {
    const classId = req.params.id;
    const lecturerId = req.user.id;

    const classSession = await ClassSession.findById(classId);
    if (!classSession) return res.status(404).json({ error: 'Class not found' });
    if (classSession.lecturer.toString() !== lecturerId) return res.status(403).json({ error: 'You are not authorized to start this class' });
    if (classSession.status !== 'upcoming') return res.status(400).json({ error: `Class is already ${classSession.status}` });
    
    const now = new Date();
    const scheduledStart = new Date(classSession.startTime);
    const lateThresholdMinutes = 5; 
    const isLate = (now - scheduledStart) > lateThresholdMinutes * 60 * 1000;

    // Generate secure QR token
    const token = crypto.randomBytes(8).toString('hex');
    const expires = new Date(now.getTime() + 15 * 60 * 1000); // QR expires in 15 mins

    classSession.status = 'ongoing';
    classSession.actualStart = now;
    classSession.lecturerCheckInTime = now;
    classSession.lecturerLate = isLate;
    classSession.qrToken = token;
    classSession.qrExpires = expires;

    // Create attendance record for the lecturer
    await Attendance.create({
      user: lecturerId,
      classSession: classId,
      role: 'lecturer',
      status: isLate ? 'late' : 'present',
      late: isLate,
      timestamp: now
    });
    
    await classSession.save();

    // Emit notifications
    const io = req.app.get('io');
    io.to(classId).emit('classStarted', { classId, actualStart: now, lecturerLate: isLate });
    if (isLate) {
      io.to(classId).emit('lecturerLate', { classId, lecturerName: req.user.name, lateBy: Math.round((now - scheduledStart) / 60000) });
    }

    res.json({
      message: 'Class started successfully',
      classSession,
      qrPayload: `${classId}|${token}`
    });

  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Attendance already recorded for this session.' });
    console.error(err);
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
    // NEWLY ADDED CODE: Notify students class has ended
    const io = req.app.get('io');
    io.to(req.params.id).emit('classEnded', { classId: req.params.id });
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
    const io = req.app.get('io');
    io.to(req.params.id).emit('classCancelled', { classId: req.params.id });
    res.json(cls);
  }
  catch (err) {
    res.status(500).json({ error: 'Failed to cancel class' });
  }
});


// Get Live Attendance Count for a class
router.get('/class/:id/attendance', auth, async (req, res) => {
  const count = await Attendance.countDocuments({ classSession: req.params.id, role: 'student', status: { $in: ['present', 'late'] } });
  res.json({ count });
});

module.exports = router;