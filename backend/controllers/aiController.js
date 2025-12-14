// NEWLY ADDED FILE
const Attendance = require('../models/Attendance');
const ClassSession = require('../models/ClassSession');
const User = require('../models/User');
const { predictAbsenteeism } = require('../utils/aiEngine');

// Newly Added Code
// This controller provides endpoints for AI-driven insights.

const getStudentAbsenteeismRisk = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Find all classes the student is enrolled in
    const enrolledCourses = student.enrolledCourses || [];
    const totalClasses = await ClassSession.countDocuments({ 
        $or: [{ course: { $in: enrolledCourses } }, { unit: { $in: enrolledCourses } }],
        status: { $in: ['completed', 'ongoing'] }
    });

    // Find all attendance records for the student
    const attendanceRecords = await Attendance.find({ user: studentId });
    const attendedClasses = attendanceRecords.length;

    const missedClasses = totalClasses - attendedClasses;

    // A simple rule-based prediction
    let risk = 'Low';
    if (totalClasses > 0) {
        const missedPercentage = (missedClasses / totalClasses) * 100;
        if (missedPercentage > 50) {
            risk = 'High';
        } else if (missedPercentage > 20) {
            risk = 'Medium';
        }
    }

    res.json({
      studentId,
      risk,
      attendedClasses,
      totalClasses,
      missedClasses
    });

  } catch (error) {
    console.error(`Error getting student risk: ${error.message}`);
    res.status(500).json({ error: 'Server Error' });
  }
};

const getLecturerReliabilityScore = async (req, res) => {
    try {
        const { lecturerId } = req.params;

        const lecturer = await User.findById(lecturerId);
        if (!lecturer || lecturer.role !== 'lecturer') {
            return res.status(404).json({ error: 'Lecturer not found' });
        }

        // Get all classes taught by the lecturer
        const totalClasses = await ClassSession.countDocuments({ lecturer: lecturerId, status: { $in: ['completed', 'ongoing'] } });
        
        // Get all on-time attendance records for the lecturer
        const onTimeRecords = await Attendance.countDocuments({ user: lecturerId, role: 'lecturer', late: false });

        let reliabilityScore = 100;
        if (totalClasses > 0) {
            reliabilityScore = Math.round((onTimeRecords / totalClasses) * 100);
        }

        res.json({
            lecturerId,
            reliabilityScore,
            totalClasses,
            onTimeClasses: onTimeRecords
        });

    } catch (error) {
        console.error(`Error getting lecturer reliability: ${error.message}`);
        res.status(500).json({ error: 'Server Error' });
    }
};

module.exports = {
  getStudentAbsenteeismRisk,
  getLecturerReliabilityScore,
};
