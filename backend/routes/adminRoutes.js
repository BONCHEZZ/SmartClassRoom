const express = require('express');
const router = express.Router();
const auth = require('../utils/authMiddleware');
const User = require('../models/User');
const ClassSession = require('../models/ClassSession');
const Attendance = require('../models/Attendance');
const { getLecturerReliabilityScore, getStudentAbsenteeismRisk } = require('../controllers/aiController');


// 1. Institution Overview Stats
router.get('/dashboard', auth, async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalLecturers = await User.countDocuments({ role: 'lecturer' });
    
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

// NEWLY ADDED CODE: Comprehensive, filterable attendance log endpoint
router.get('/attendance-logs', auth, async (req, res) => {
    try {
        const { role, startDate, endDate, course, unit } = req.query;
        let { page = 1, limit = 20 } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);

        let attendanceQuery = {};
        if (role) attendanceQuery.role = role;
        if (startDate || endDate) {
            attendanceQuery.timestamp = {};
            if (startDate) attendanceQuery.timestamp.$gte = new Date(startDate);
            if (endDate) attendanceQuery.timestamp.$lte = new Date(endDate);
        }

        let classQuery = {};
        if (course) classQuery.course = course;
        if (unit) classQuery.unit = unit;

        const classIds = await ClassSession.find(classQuery).select('_id');
        if (course || unit) {
            attendanceQuery.classSession = { $in: classIds.map(c => c._id) };
        }

        const attendanceRecords = await Attendance.find(attendanceQuery)
            .populate('user', 'name email regNo pfNumber')
            .populate('classSession', 'unit course startTime')
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        
        const totalRecords = await Attendance.countDocuments(attendanceQuery);

        res.json({
            records: attendanceRecords,
            totalPages: Math.ceil(totalRecords / limit),
            currentPage: page,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});


// MODIFIED: Now includes lecturer reliability score
router.get('/lecturers', auth, async (req, res) => {
  try {
    const lecturers = await User.find({ role: 'lecturer' }).select('name email pfNumber department courseTeaching').lean();
    
    const lecturersWithReliability = await Promise.all(lecturers.map(async (lecturer) => {
        const totalClasses = await ClassSession.countDocuments({ lecturer: lecturer._id, status: { $in: ['completed', 'ongoing'] } });
        const onTimeRecords = await Attendance.countDocuments({ user: lecturer._id, role: 'lecturer', late: false });
        let reliabilityScore = 100;
        if (totalClasses > 0) {
            reliabilityScore = Math.round((onTimeRecords / totalClasses) * 100);
        }
        return { ...lecturer, reliabilityScore };
    }));

    res.json(lecturersWithReliability);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// MODIFIED: Now includes student risk score from AI controller logic
router.get('/students', auth, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password').lean();
    
    const studentsWithRisk = await Promise.all(students.map(async (s) => {
        const enrolledCourses = s.enrolledCourses || [];
        const totalClasses = await ClassSession.countDocuments({ 
            $or: [{ course: { $in: enrolledCourses } }, { unit: { $in: enrolledCourses } }],
            status: { $in: ['completed', 'ongoing'] }
        });
        const attendanceRecords = await Attendance.countDocuments({ user: s._id });
        const missedClasses = totalClasses - attendanceRecords;
        let risk = 'Low';
        if (totalClasses > 0) {
            const missedPercentage = (missedClasses / totalClasses) * 100;
            if (missedPercentage > 50) risk = 'High';
            else if (missedPercentage > 20) risk = 'Medium';
        }
        return { ...s, risk, attendanceCount: attendanceRecords };
    }));

    res.json(studentsWithRisk);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});


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
