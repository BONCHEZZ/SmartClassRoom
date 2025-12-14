const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  classId: String,
  studentId: String,
  status: { type: String, enum: ['present', 'absent', 'excused'] },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Attendance', AttendanceSchema);