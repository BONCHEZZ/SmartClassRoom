const mongoose = require('mongoose');


const AttendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classSession: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSession', required: true },
  role: { type: String, enum: ['student', 'lecturer'], required: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['present', 'absent', 'late'], required: true },
  late: { type: Boolean, default: false },
  // ClassTrack AI security features
  deviceFingerprint: { type: String },
  ipAddress: { type: String },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    accuracy: { type: Number }
  },
  qrTokenUsed: { type: String },
  scanDelay: { type: Number }, // milliseconds from QR generation
  aiRiskScore: { type: Number, default: 0 }, // 0-100 fraud risk
  validationFlags: {
    locationValid: { type: Boolean, default: true },
    deviceValid: { type: Boolean, default: true },
    timeValid: { type: Boolean, default: true },
    tokenValid: { type: Boolean, default: true }
  }
}, { timestamps: true });


// NEWLY ADDED CODE
// Prevent a user from having more than one attendance record for the same class session.
AttendanceSchema.index({ user: 1, classSession: 1 }, { unique: true });


module.exports = mongoose.model('Attendance', AttendanceSchema);