const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['missed_class', 'lecturer_late', 'other'], required: true },
  course: { type: String, required: true },
  description: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);