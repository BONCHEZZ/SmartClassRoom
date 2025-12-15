const User = require('../models/User');
const ClassSession = require('../models/ClassSession');
const AIAnalytics = require('../models/AIAnalytics');

class NotificationEngine {
  static async sendNotification(userId, title, message, type = 'info') {
    await User.findByIdAndUpdate(userId, {
      $push: {
        notifications: { title, message, type, createdAt: new Date() }
      }
    });
  }
  
  static async notifyClassStarting(classSession) {
    const students = await User.find({ 
      enrolledCourses: classSession.course,
      role: 'student' 
    });
    
    for (const student of students) {
      const analytics = await AIAnalytics.findOne({ user: student._id });
      const optimalTime = analytics?.predictions?.optimalNotificationTime || 15;
      
      await this.sendNotification(
        student._id,
        'Class Starting Soon',
        `${classSession.unit} starts in ${optimalTime} minutes in ${classSession.room}`,
        'reminder'
      );
    }
  }
  
  static async notifyAttendanceOpen(classSessionId, io) {
    const classSession = await ClassSession.findById(classSessionId);
    io.to(classSessionId).emit('attendanceOpen', {
      message: 'Attendance is now open',
      classSession: classSession.unit,
      room: classSession.room
    });
  }
  
  static async notifyLowAttendance(classSessionId, attendanceCount, expectedCount) {
    const classSession = await ClassSession.findById(classSessionId).populate('lecturer');
    if (attendanceCount < expectedCount * 0.6) {
      await this.sendNotification(
        classSession.lecturer._id,
        'Low Attendance Alert',
        `Only ${attendanceCount}/${expectedCount} students present in ${classSession.unit}`,
        'warning'
      );
    }
  }
}

module.exports = NotificationEngine;