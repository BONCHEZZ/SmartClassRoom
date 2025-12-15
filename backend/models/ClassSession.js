const mongoose = require('mongoose');


const ClassSessionSchema = new mongoose.Schema({
  unit: { type: String, required: true },
  course: { type: String },
  lecturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lecturerName: { type: String },
  startTime: { type: Date, required: true },
  actualStart: { type: Date },
  lecturerCheckInTime: { type: Date },
  lecturerLate: { type: Boolean, default: false },
  qrToken: { type: String },
  qrExpires: { type: Date },
  endTime: { type: Date },
  room: { type: String },
  status: { type: String, default: 'upcoming' },
  // ClassTrack AI enhancements
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    radius: { type: Number, default: 50 } // meters
  },
  attendanceActive: { type: Boolean, default: false },
  attendanceStarted: { type: Date },
  attendanceEnded: { type: Date },
  aiAnalytics: {
    expectedStudents: { type: Number, default: 0 },
    actualAttendance: { type: Number, default: 0 },
    lateArrivals: { type: Number, default: 0 },
    suspiciousScans: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('ClassSession', ClassSessionSchema);