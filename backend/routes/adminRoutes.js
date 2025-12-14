const express = require('express');
const router = express.Router();
const auth = require('../utils/authMiddleware');
const User = require('../models/User');
const ClassSession = require('../models/ClassSession');
const Attendance = require('../models/Attendance');

// 1. Institution Overview Stats
router.get('/dashboard', auth, async (req, res) => {
  try {
    // Counts
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalLecturers = await User.countDocuments({ role: 'lecturer' });
    
    // Today's Classes
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const todaysClasses = await ClassSession.find({
      startTime: { $gte: startOfDay, $lte: endOfDay }
    });

    const classStats = {
      total: todaysClasses.length,
      ongoing: todaysClasses.filter(c => c.status === 'ongoing').length,
      completed: todaysClasses.filter(c => c.status === 'completed').length,
      cancelled: todaysClasses.filter(c => c.status === 'cancelled').length,
      upcoming: todaysClasses.filter(c => c.status === 'upcoming' || !c.status).length
    };

    res.json({
      counts: { students: totalStudents, lecturers: totalLecturers },
      classes: classStats
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// 2. Global Lecturer Management
router.get('/lecturers', auth, async (req, res) => {
  try {
    const lecturers = await User.find({ role: 'lecturer' }).select('name email pfNumber department courseTeaching').lean();
    // In a real app, you would aggregate their attendance/punctuality stats here
    res.json(lecturers);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// 3. Global Student Management
router.get('/students', auth, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password').lean();
    
    // Mock AI Risk Calculation for the list
    const studentsWithRisk = await Promise.all(students.map(async (s) => {
      const attendanceCount = await Attendance.countDocuments({ studentId: s._id, status: 'present' });
      // Simple threshold for prototype
      const risk = attendanceCount < 5 ? 'High' : 'Low'; 
      return { ...s, risk, attendanceCount };
    }));

    res.json(studentsWithRisk);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// 4. Assign Department (Example Action)
router.put('/user/:id/department', auth, async (req, res) => {
  try {
    const { department } = req.body;
    await User.findByIdAndUpdate(req.params.id, { department });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

module.exports = router;

// Lecturer attendance logs (filterable by date range)
router.get('/lecturer/:id/attendance', auth, async (req, res) => {
  try {
    const lecturerId = req.params.id;
    const { startDate, endDate } = req.query;
    const q = {};
    if (startDate || endDate) {
      q.timestamp = {};
      if (startDate) q.timestamp.$gte = new Date(startDate);
      if (endDate) q.timestamp.$lte = new Date(endDate);
    }

    // Find classes for lecturer
    const classes = await ClassSession.find({ $or: [{ lecturer: lecturerId }, { lecturerName: req.params.id }] });
    const classIds = classes.map(c => c._id.toString());

    const Attendance = require('../models/Attendance');
    const records = await Attendance.find({ classId: { $in: classIds }, ...(q.timestamp ? { timestamp: q.timestamp } : {}) }).sort({ timestamp: -1 });
    res.json({ classes, records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Class summary: student attendance per class
router.get('/class/:id/summary', auth, async (req, res) => {
  try {
    const classId = req.params.id;
    const Attendance = require('../models/Attendance');
    const attendanceRecords = await Attendance.find({ classId }).sort({ timestamp: -1 });
    const byStudent = {};
    attendanceRecords.forEach(a => {
      byStudent[a.studentId] = byStudent[a.studentId] || { present: 0, records: [] };
      if (a.status === 'present') byStudent[a.studentId].present++;
      byStudent[a.studentId].records.push(a);
    });
    res.json({ classId, attendanceSummary: byStudent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});
// Additional admin endpoints: lecturer attendance logs and class summary
// (Appended here to minimize file restructuring)
