const Attendance = require('../models/Attendance');
const AIAnalytics = require('../models/AIAnalytics');
const geolib = require('geolib');

class AIEngine {
  static calculateFraudRisk(attendanceData, userAnalytics) {
    let riskScore = 0;
    const { deviceFingerprint, location, scanDelay } = attendanceData;
    
    if (userAnalytics?.deviceHistory?.length > 3) riskScore += 30;
    if (scanDelay > 25000) riskScore += 20;
    if (userAnalytics?.fraudIndicators?.locationInconsistency > 0.3) riskScore += 15;
    
    return Math.min(riskScore, 100);
  }
  
  static async updateUserAnalytics(userId, attendanceData) {
    let analytics = await AIAnalytics.findOne({ user: userId });
    if (!analytics) analytics = new AIAnalytics({ user: userId, type: 'student' });
    
    analytics.attendancePattern.totalClasses += 1;
    if (attendanceData.status === 'present') analytics.attendancePattern.attendedClasses += 1;
    if (attendanceData.late) analytics.attendancePattern.lateArrivals += 1;
    
    analytics.attendancePattern.attendanceRate = 
      (analytics.attendancePattern.attendedClasses / analytics.attendancePattern.totalClasses) * 100;
    
    const existingDevice = analytics.deviceHistory.find(d => d.fingerprint === attendanceData.deviceFingerprint);
    if (existingDevice) {
      existingDevice.lastSeen = new Date();
      existingDevice.usageCount += 1;
    } else {
      analytics.deviceHistory.push({
        fingerprint: attendanceData.deviceFingerprint,
        firstSeen: new Date(),
        lastSeen: new Date(),
        usageCount: 1
      });
    }
    
    if (attendanceData.location) {
      analytics.locationHistory.push({
        latitude: attendanceData.location.latitude,
        longitude: attendanceData.location.longitude,
        accuracy: attendanceData.location.accuracy,
        timestamp: new Date(),
        classSession: attendanceData.classSessionId
      });
      if (analytics.locationHistory.length > 20) {
        analytics.locationHistory = analytics.locationHistory.slice(-20);
      }
    }
    
    const rate = analytics.attendancePattern.attendanceRate;
    analytics.attendancePattern.riskLevel = rate < 60 ? 'high' : rate < 80 ? 'medium' : 'low';
    
    await analytics.save();
    return analytics;
  }
  
  static validateLocation(studentLocation, classLocation, allowedRadius = 50) {
    if (!studentLocation || !classLocation) return false;
    const distance = geolib.getDistance(
      { latitude: studentLocation.latitude, longitude: studentLocation.longitude },
      { latitude: classLocation.latitude, longitude: classLocation.longitude }
    );
    return distance <= allowedRadius;
  }
  
  static generateDeviceFingerprint(userAgent, screenResolution, timezone, language) {
    const crypto = require('crypto');
    const fingerprint = `${userAgent}|${screenResolution}|${timezone}|${language}`;
    return crypto.createHash('sha256').update(fingerprint).digest('hex').substring(0, 16);
  }
}

module.exports = AIEngine;