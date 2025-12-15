const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Attendance = require('../models/Attendance');
const ClassSession = require('../models/ClassSession');

// Simple Rule-Based AI
router.get('/insights', protect, async (req, res) => {
    // Calculate attendance percentage
    const totalClasses = await ClassSession.countDocuments({ status: 'completed' }); // Simplified
    const attended = await Attendance.countDocuments({ user: req.user._id, role: 'student' });
    
    let percentage = totalClasses === 0 ? 100 : Math.round((attended / totalClasses) * 100);
    
    let riskLevel = 'Low Risk';
    let message = 'Great job! Your attendance is on track.';
    
    if (percentage < 75) {
        riskLevel = 'Medium Risk';
        message = 'Warning: Your attendance is dropping below 75%.';
    }
    if (percentage < 50) {
        riskLevel = 'High Risk';
        message = 'CRITICAL: You are at risk of being barred from exams.';
    }

    res.json({ riskLevel, message, percentage });
});

module.exports = router;