// NEW FILE: backend/models/Report.js
// Minimal Report model used by report submission endpoint
const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  course: { type: String, required: true },
  description: { type: String },
  status: { type: String, default: 'new' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', ReportSchema);
