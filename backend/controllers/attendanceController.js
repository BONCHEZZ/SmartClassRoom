const Attendance = require('../models/Attendance');
const ClassSession = require('../models/ClassSession');

// Mark attendance for a student by scanning QR.
// Expects body: { qrCode: "<classId>|<token>" }
// Uses req.user.id (from auth middleware) as studentId.
const markAttendance = async (req, res, io) => {
  try {
    const studentId = req.user && req.user.id ? req.user.id : null;
    if (!studentId) return res.status(401).json({ error: 'Unauthorized' });

    const { qrCode } = req.body;
    if (!qrCode) return res.status(400).json({ error: 'qrCode is required' });

    // Parse QR payload: allow formats like "classId|token" or plain classId
    let [classId, token] = qrCode.split('|');
    classId = classId && classId.trim();

    const cls = await ClassSession.findById(classId);
    if (!cls) return res.status(404).json({ error: 'Class session not found' });

    const now = new Date();

    // Validate token if class has a token
    if (cls.qrToken) {
      if (!token || token !== cls.qrToken) {
        return res.status(400).json({ error: 'Invalid or missing QR token' });
      }
      if (cls.qrExpires && now > cls.qrExpires) {
        return res.status(410).json({ error: 'QR token expired' });
      }
    } else {
      // Backwards compatibility: allow marking only for ongoing classes or within a 30-minute window
      const windowStart = cls.actualStart || cls.startTime;
      const windowEnd = new Date((windowStart || now).getTime() + 30 * 60 * 1000);
      if (now < windowStart || now > windowEnd) {
        return res.status(400).json({ error: 'Attendance not allowed at this time' });
      }
    }

    // Prevent duplicate scans
    const existing = await Attendance.findOne({ classId: cls._id.toString(), studentId, status: 'present' });
    if (existing) return res.status(409).json({ error: 'Already checked in' });

    // Determine lateness for student relative to scheduled startTime
    const scheduled = cls.startTime || cls.actualStart || now;
    const lateThresholdMinutes = 10; // configurable threshold
    const isLate = (now - new Date(scheduled)) > lateThresholdMinutes * 60 * 1000;

    const newAttendance = new Attendance({ classId: cls._id.toString(), studentId, timestamp: now, status: 'present', late: isLate });
    await newAttendance.save();

    // Emit a real-time update to the specific class session room
    try { if (io) io.to(cls._id.toString()).emit('attendanceUpdated', { classId: cls._id.toString(), studentId, timestamp: now, late: isLate });
      else if (global && global.io) global.io.to(cls._id.toString()).emit('attendanceUpdated', { classId: cls._id.toString(), studentId, timestamp: now, late: isLate });
    } catch (e) { console.error('Socket emit failed', e); }

    return res.status(201).json({ message: 'Attendance marked', late: isLate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

const getAttendance = async (req, res) => {
  try {
    // If :id provided treat it as classId; otherwise return all
    const q = {};
    if (req.params.id) q.classId = req.params.id;
    const attendanceRecords = await Attendance.find(q).sort({ timestamp: -1 });
    res.status(200).json(attendanceRecords);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = {
  markAttendance,
  getAttendance,
};
