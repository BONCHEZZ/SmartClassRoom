const mongoose = require('mongoose');

const StudentReportSchema = new mongoose.Schema({
  type: { type: String, enum: ['technical', 'lecturer', 'system', 'other'], required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['pending', 'reviewing', 'resolved'], default: 'pending' },
  classSession: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSession' },
  submittedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
  adminNotes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('StudentReport', StudentReportSchema);