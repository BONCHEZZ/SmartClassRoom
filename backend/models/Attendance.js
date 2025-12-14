const mongoose = require('mongoose');


// NEWLY ADDED CODE
// A more robust attendance schema that supports both students and lecturers.
const AttendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classSession: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSession', required: true },
  role: { type: String, enum: ['student', 'lecturer'], required: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['present', 'absent', 'late'], required: true },
  late: { type: Boolean, default: false }
}, { timestamps: true });


// NEWLY ADDED CODE
// Prevent a user from having more than one attendance record for the same class session.
AttendanceSchema.index({ user: 1, classSession: 1 }, { unique: true });


module.exports = mongoose.model('Attendance', AttendanceSchema);