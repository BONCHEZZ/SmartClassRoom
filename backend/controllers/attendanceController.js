const Attendance = require('../models/Attendance');
const ClassSession = require('../models/ClassSession');
const QRManager = require('../utils/qrManager');
const AIEngine = require('../utils/aiEngine');
const NotificationEngine = require('../utils/notificationEngine');
const { qrScanLimiter } = require('../middleware/rateLimiter');

const scanQRAttendance = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { 
      qrToken, 
      deviceFingerprint, 
      location, 
      userAgent, 
      screenResolution, 
      timezone, 
      language 
    } = req.body;

    if (!qrToken || !deviceFingerprint || !location) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // Generate device fingerprint
    const calculatedFingerprint = AIEngine.generateDeviceFingerprint(
      userAgent, screenResolution, timezone, language
    );

    if (calculatedFingerprint !== deviceFingerprint) {
      return res.status(400).json({ error: 'Device fingerprint mismatch' });
    }

    // Validate QR token
    const validation = await QRManager.validateQRToken(
      qrToken, deviceFingerprint, location, req.ip
    );

    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const classSession = await ClassSession.findById(validation.classSessionId);
    if (!classSession || !classSession.attendanceActive) {
      return res.status(400).json({ error: 'Attendance not active' });
    }

    // Validate location
    const locationValid = AIEngine.validateLocation(
      location, classSession.location, classSession.location.radius
    );

    // Check for existing attendance
    const existing = await Attendance.findOne({ 
      classSession: validation.classSessionId, 
      user: userId 
    });
    if (existing) return res.status(409).json({ error: 'Already checked in' });

    // Determine if late
    const now = new Date();
    const scheduled = classSession.startTime;
    const isLate = (now - new Date(scheduled)) > 10 * 60 * 1000; // 10 minutes

    // Create attendance record
    const attendanceData = {
      user: userId,
      classSession: validation.classSessionId,
      role: 'student',
      status: isLate ? 'late' : 'present',
      late: isLate,
      deviceFingerprint,
      ipAddress: req.ip,
      location,
      qrTokenUsed: validation.tokenId,
      scanDelay: validation.scanDelay,
      validationFlags: {
        locationValid,
        deviceValid: true,
        timeValid: validation.scanDelay <= 30000,
        tokenValid: true
      }
    };

    // Update AI analytics and calculate risk score
    const userAnalytics = await AIEngine.updateUserAnalytics(userId, attendanceData);
    attendanceData.aiRiskScore = AIEngine.calculateFraudRisk(attendanceData, userAnalytics);

    const attendance = new Attendance(attendanceData);
    await attendance.save();

    // Update class analytics
    await ClassSession.findByIdAndUpdate(validation.classSessionId, {
      $inc: {
        'aiAnalytics.actualAttendance': 1,
        'aiAnalytics.lateArrivals': isLate ? 1 : 0,
        'aiAnalytics.suspiciousScans': attendanceData.aiRiskScore > 50 ? 1 : 0
      }
    });

    // Real-time notification
    const io = req.app.get('io');
    io.to(validation.classSessionId).emit('attendanceMarked', {
      userId,
      timestamp: now,
      late: isLate,
      riskScore: attendanceData.aiRiskScore
    });

    res.status(201).json({ 
      message: 'Attendance marked successfully',
      late: isLate,
      riskScore: attendanceData.aiRiskScore,
      locationValid
    });

  } catch (error) {
    console.error('Attendance scan error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

const getAttendance = async (req, res) => {
  try {
    const q = {};
    if (req.params.id) q.classSession = req.params.id;
    const attendanceRecords = await Attendance.find(q)
      .populate('user', 'name regNo')
      .sort({ timestamp: -1 });
    res.status(200).json(attendanceRecords);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = {
  scanQRAttendance,
  getAttendance
};