const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

router.get('/lecturers', protect, async (req, res) => {
    const lecturers = await User.find({ role: 'lecturer' });
    // Calculate reliability (mock logic)
    const data = lecturers.map(l => ({ ...l._doc, reliabilityScore: 85 }));
    res.json(data);
});

router.get('/students', protect, async (req, res) => {
    const students = await User.find({ role: 'student' });
    const data = students.map(s => ({ ...s._doc, risk: 'Low', attendanceCount: 10 }));
    res.json(data);
});

router.get('/attendance-logs', protect, async (req, res) => {
    const { role, page = 1, limit = 15 } = req.query;
    const query = {};
    if(role) query.role = role;
    
    const logs = await Attendance.find(query)
        .populate('user', 'name')
        .populate('classSession', 'unit')
        .sort({ timestamp: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
        
    const count = await Attendance.countDocuments(query);
    res.json({ records: logs, totalPages: Math.ceil(count / limit), currentPage: page });
});

module.exports = router;