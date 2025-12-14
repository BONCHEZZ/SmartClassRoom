const Attendance = require('../models/Attendance');
const ClassSession = require('../models/ClassSession');

// Mark attendance for a student by scanning QR.
// Expects body: { qrCode: "<classId>|<token>" }
// Uses req.user.id (from auth middleware) as userId.
const markAttendance = async (req, res, io) => {
  try {
    // MODIFIED: Use a generic 'userId'
    const userId = req.user && req.user.id ? req.user.id : null;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { qrCode } = req.body;
    if (!qrCode) return res.status(400).json({ error: 'qrCode is required' });

    let [classId, token] = qrCode.split('|');
    classId = classId && classId.trim();

    const cls = await ClassSession.findById(classId);
    if (!cls) return res.status(404).json({ error: 'Class session not found' });
    
    // NEWLY ADDED CODE: Check if the class is actually ongoing
    if (cls.status !== 'ongoing') {
      return res.status(400).json({ error: 'Class is not active for attendance.' });
    }

    const now = new Date();

    if (!cls.qrToken || !cls.qrExpires) {
        return res.status(400).json({ error: 'Attendance is not currently active for this class.' });
    }
    if (token !== cls.qrToken) {
        return res.status(400).json({ error: 'Invalid QR code.' });
    }
    if (now > cls.qrExpires) {
        return res.status(410).json({ error: 'QR code has expired.' });
    }

    // MODIFIED: Prevent duplicate scans using the new unique index
    const existing = await Attendance.findOne({ classSession: cls._id, user: userId });
    if (existing) return res.status(409).json({ error: 'Already checked in' });

    const scheduled = cls.startTime || cls.actualStart || now;
    const lateThresholdMinutes = 10;
    const isLate = (now - new Date(scheduled)) > lateThresholdMinutes * 60 * 1000;

    // MODIFIED: Create attendance record with the new schema
    const newAttendance = new Attendance({
      classSession: cls._id,
      user: userId,
      role: 'student',
      timestamp: now,
      status: isLate ? 'late' : 'present',
      late: isLate
    });
    await newAttendance.save();

    // MODIFIED: Emit with new data structure
    try { 
      const payload = { classId: cls._id.toString(), userId, timestamp: now, late: isLate };
      if (io) io.to(cls._id.toString()).emit('attendanceUpdated', payload);
      else if (global && global.io) global.io.to(cls._id.toString()).emit('attendanceUpdated', payload);
    } catch (e) { console.error('Socket emit failed', e); }

    return res.status(201).json({ message: 'Attendance marked', late: isLate });
  } catch (error) {
    // MODIFIED: Better error handling for duplicate key
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Already checked in.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

const getAttendance = async (req, res) => {
  try {
    const q = {};
    // MODIFIED: Query by classSession instead of classId
    if (req.params.id) q.classSession = req.params.id;
    const attendanceRecords = await Attendance.find(q).populate('user', 'name regNo').sort({ timestamp: -1 });
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
