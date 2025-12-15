const ClassSession = require('../models/ClassSession');
const QRManager = require('../utils/qrManager');
const NotificationEngine = require('../utils/notificationEngine');

const startAttendance = async (req, res) => {
  try {
    const { classSessionId, location } = req.body;
    const lecturerId = req.user?.id;

    const classSession = await ClassSession.findById(classSessionId);
    if (!classSession || classSession.lecturer.toString() !== lecturerId) {
      return res.status(404).json({ error: 'Class session not found' });
    }

    // Update class with location and start attendance
    await ClassSession.findByIdAndUpdate(classSessionId, {
      attendanceActive: true,
      attendanceStarted: new Date(),
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        radius: location.radius || 50
      },
      status: 'ongoing'
    });

    // Generate first QR token
    const { token, tokenId, expiresAt } = await QRManager.generateSecureQR(classSessionId, lecturerId);
    const qrImage = await QRManager.generateQRImage(token);

    // Notify students
    const io = req.app.get('io');
    await NotificationEngine.notifyAttendanceOpen(classSessionId, io);

    res.json({
      message: 'Attendance started',
      qrImage,
      tokenId,
      expiresAt
    });

  } catch (error) {
    console.error('Start attendance error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

const refreshQR = async (req, res) => {
  try {
    const { classSessionId } = req.params;
    const lecturerId = req.user?.id;

    const classSession = await ClassSession.findById(classSessionId);
    if (!classSession || classSession.lecturer.toString() !== lecturerId || !classSession.attendanceActive) {
      return res.status(400).json({ error: 'Cannot refresh QR' });
    }

    const { token, tokenId, expiresAt } = await QRManager.generateSecureQR(classSessionId, lecturerId);
    const qrImage = await QRManager.generateQRImage(token);

    // Broadcast new QR to connected clients
    const io = req.app.get('io');
    io.to(classSessionId).emit('qrRefresh', { qrImage, tokenId, expiresAt });

    res.json({ qrImage, tokenId, expiresAt });

  } catch (error) {
    console.error('QR refresh error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

const endAttendance = async (req, res) => {
  try {
    const { classSessionId } = req.params;
    const lecturerId = req.user?.id;

    const classSession = await ClassSession.findById(classSessionId);
    if (!classSession || classSession.lecturer.toString() !== lecturerId) {
      return res.status(404).json({ error: 'Class session not found' });
    }

    await ClassSession.findByIdAndUpdate(classSessionId, {
      attendanceActive: false,
      attendanceEnded: new Date(),
      status: 'completed'
    });

    const io = req.app.get('io');
    io.to(classSessionId).emit('attendanceClosed', { message: 'Attendance is now closed' });

    res.json({ message: 'Attendance ended successfully' });

  } catch (error) {
    console.error('End attendance error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

const getAllClassSessions = async (req, res) => {
  try {
    if (req.user?.role === 'lecturer') {
      const classSessions = await ClassSession.find({ lecturer: req.user.id }).sort({ startTime: -1 });
      return res.status(200).json(classSessions);
    }
    const classSessions = await ClassSession.find().sort({ startTime: -1 });
    res.status(200).json(classSessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = {
  startAttendance,
  refreshQR,
  endAttendance,
  getAllClassSessions
};