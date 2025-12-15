const mongoose = require('mongoose');

const TimetableSchema = new mongoose.Schema({
  course: { type: String, required: true },
  unit: { type: String, required: true },
  lecturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0=Sunday, 6=Saturday
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true }, // "11:00"
  room: { type: String, required: true },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    radius: { type: Number, default: 50 }
  },
  semester: { type: String, required: true },
  academicYear: { type: String, required: true },
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  active: { type: Boolean, default: true }
}, { timestamps: true });

// Compound index to prevent duplicate timetable entries
TimetableSchema.index({ course: 1, unit: 1, dayOfWeek: 1, startTime: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', TimetableSchema);