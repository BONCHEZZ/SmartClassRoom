const mongoose = require('mongoose');


const ClassSessionSchema = new mongoose.Schema({
  unit: { type: String, required: true },
  course: { type: String },
  lecturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lecturerName: { type: String },
  startTime: { type: Date, required: true },
  // actualStart: the real time the class was started (set when lecturer starts class)
  actualStart: { type: Date },
  // lecturer check-in metadata
  lecturerCheckInTime: { type: Date },
  lecturerLate: { type: Boolean, default: false },
  // QR token for time-bound attendance marking (ephemeral)
  qrToken: { type: String },
  qrExpires: { type: Date },
  endTime: { type: Date },
  room: { type: String },
  status: { type: String, default: 'upcoming' }
});

module.exports = mongoose.model('ClassSession', ClassSessionSchema);