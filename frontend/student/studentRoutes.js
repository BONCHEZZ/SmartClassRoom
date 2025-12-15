const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const ClassSession = require('../models/ClassSession');
const Attendance = require('../models/Attendance');

router.get('/dashboard', protect, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0,0,0,0);
        
        // Fetch schedule (mocking enrollment by showing all classes for now)
        const schedule = await ClassSession.find({ startTime: { $gte: today } }).sort({ startTime: 1 });
        
        // Stats
        const attended = await Attendance.countDocuments({ user: req.user._id, role: 'student' });
        const total = await ClassSession.countDocuments({ status: 'completed' }); // Simplified
        const missed = total - attended;
        const pct = total === 0 ? 100 : Math.round((attended/total)*100);

        // History
        const history = await Attendance.find({ user: req.user._id }).populate('classSession').sort({ timestamp: -1 }).limit(5);

        // AI Insights (Inline for dashboard)
        let aiMessage = "Keep it up!";
        let risk = "Low Risk";
        if(pct < 75) { risk = "High Risk"; aiMessage = "Attendance critical!"; }

        res.json({
            user: req.user,
            schedule,
            stats: { attended, missed, attendancePct: pct },
            history,
            aiInsights: { riskLevel: risk, message: aiMessage }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;