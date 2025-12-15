const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  classSession: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSession' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: { type: String, enum: ['student', 'lecturer'] },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['present', 'late', 'absent'], default: 'present' }
});

module.exports = mongoose.model('Attendance', attendanceSchema);