const express = require('express');
const router = express.Router();
const auth = require('../utils/authMiddleware');
const Attendance = require('../models/Attendance');
const ClassSession = require('../models/ClassSession');
const User = require('../models/User');
const aiEngine = require('../utils/aiEngine');

// Get Dashboard Data
router.get('/dashboard', auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // 1. Fetch User Details
    const user = await User.findById(studentId).select('-password');

    // 2. Today's Schedule
    const todaysClasses = await ClassSession.find({
      startTime: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ startTime: 1 });

    // 3. Attendance Stats & History
    const allAttendance = await Attendance.find({ studentId }).sort({ timestamp: -1 });
    const totalAttended = allAttendance.filter(a => a.status === 'present').length;
    
    // Estimate total classes (In a real app, this would be based on enrollment)
    // Here we count all past sessions as the denominator for the prototype
    const totalClasses = await ClassSession.countDocuments({ startTime: { $lt: new Date() } });
    
    const attendancePct = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 100;

    // 4. AI Insights
    const riskLevel = aiEngine.predictAbsenteeism(allAttendance);
    let aiMessage = "Your attendance is on track. Keep it up!";
    if (riskLevel === 'High Risk') aiMessage = "Warning: You are at high risk of falling below 75%. Attend next 3 classes.";
    if (riskLevel === 'Medium Risk') aiMessage = "Caution: You have missed a few classes recently.";

    // 5. Course-wise Breakdown (Aggregation)
    // Group attendance by classId/Unit. For prototype, we map manually.
    const courseStats = {}; 
    // This would require more complex aggregation in production

    res.json({
      user,
      stats: {
        attendancePct,
        totalClasses,
        attended: totalAttended,
        missed: totalClasses - totalAttended
      },
      schedule: todaysClasses,
      history: allAttendance.slice(0, 5), // Last 5 records
      aiInsights: {
        riskLevel,
        message: aiMessage
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Update Profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, password } = req.body;
    const updateData = { name };
    // In real app, hash password before saving if changed
    await User.findByIdAndUpdate(req.user.id, updateData);
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

module.exports = router;