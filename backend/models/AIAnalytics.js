const mongoose = require('mongoose');

const AIAnalyticsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['student', 'lecturer'], required: true },
  
  // Student AI Analytics
  attendancePattern: {
    totalClasses: { type: Number, default: 0 },
    attendedClasses: { type: Number, default: 0 },
    lateArrivals: { type: Number, default: 0 },
    attendanceRate: { type: Number, default: 0 },
    riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' }
  },
  
  // Behavioral Analysis
  deviceHistory: [{
    fingerprint: String,
    firstSeen: Date,
    lastSeen: Date,
    usageCount: { type: Number, default: 1 }
  }],
  
  locationHistory: [{
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    timestamp: Date,
    classSession: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSession' }
  }],
  
  // AI Predictions
  predictions: {
    nextClassAttendance: { type: Number, default: 0.5 }, // probability 0-1
    riskOfDropout: { type: Number, default: 0 },
    optimalNotificationTime: { type: Number, default: 30 } // minutes before class
  },
  
  // Fraud Detection
  fraudIndicators: {
    deviceReuse: { type: Number, default: 0 },
    locationInconsistency: { type: Number, default: 0 },
    timePatternAnomaly: { type: Number, default: 0 },
    proxyAttendanceRisk: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('AIAnalytics', AIAnalyticsSchema);