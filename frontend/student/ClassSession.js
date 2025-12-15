const mongoose = require('mongoose');

const classSessionSchema = new mongoose.Schema({
  course: String,
  unit: String,
  room: String,
  startTime: Date,
  endTime: Date, // Optional, can be calculated
  lecturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], default: 'upcoming' },
  qrToken: String, // For validating session-specific QR codes
  lecturerArrivalTime: Date,
  lecturerLate: { type: Boolean, default: false }
});

module.exports = mongoose.model('ClassSession', classSessionSchema);