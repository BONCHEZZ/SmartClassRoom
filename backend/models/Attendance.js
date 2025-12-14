const mongoose = require('mongoose');


const AttendanceSchema = new mongoose.Schema({
	studentId: String,
	classId: String,
	timestamp: { type: Date, default: Date.now },
	status: String,
	late: { type: Boolean, default: false }
});


module.exports = mongoose.model('Attendance', AttendanceSchema);