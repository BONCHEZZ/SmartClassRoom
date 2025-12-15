const Attendance = require('../models/Attendance');
const ClassSession = require('../models/ClassSession');
const User = require('../models/User');

const generateAttendanceReport = async (req, res) => {
  try {
    const lecturerId = req.user?.id;
    const { classId, startDate, endDate } = req.query;

    let query = {};
    if (classId) {
      const classSession = await ClassSession.findById(classId);
      if (!classSession || classSession.lecturer.toString() !== lecturerId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      query.classSession = classId;
    } else {
      const lecturerClasses = await ClassSession.find({ lecturer: lecturerId }).select('_id');
      query.classSession = { $in: lecturerClasses.map(c => c._id) };
    }

    if (startDate && endDate) {
      query.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('user', 'name regNo email')
      .populate('classSession', 'unit course startTime room')
      .sort({ timestamp: -1 });

    const summary = {
      totalRecords: attendanceRecords.length,
      presentCount: attendanceRecords.filter(r => r.status === 'present').length,
      lateCount: attendanceRecords.filter(r => r.late).length,
      averageRiskScore: attendanceRecords.reduce((sum, r) => sum + (r.aiRiskScore || 0), 0) / attendanceRecords.length || 0
    };

    res.json({
      summary,
      records: attendanceRecords,
      generatedAt: new Date()
    });

  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = { generateAttendanceReport };