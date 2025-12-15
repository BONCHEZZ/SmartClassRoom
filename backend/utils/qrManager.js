const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const { getRedisClient } = require('../config/redis');

class QRManager {
  static async generateSecureQR(classSessionId, lecturerId) {
    const tokenId = uuidv4();
    const issuedAt = Date.now();
    const expiresAt = issuedAt + (25 * 1000); // 25 seconds
    
    const payload = {
      tokenId,
      classSessionId,
      lecturerId,
      issuedAt,
      expiresAt,
      type: 'attendance_qr'
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30s' });
    
    // Store in Redis with 30-second expiry
    const redis = getRedisClient();
    if (redis) {
      await redis.setEx(`qr:${tokenId}`, 30, JSON.stringify({
        classSessionId,
        lecturerId,
        issuedAt,
        used: false
      }));
    }
    
    return { token, tokenId, expiresAt };
  }
  
  static async validateQRToken(token, deviceFingerprint, location, ipAddress) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { tokenId, classSessionId, lecturerId, issuedAt } = decoded;
      
      const redis = getRedisClient();
      if (!redis) throw new Error('Redis unavailable');
      
      const tokenData = await redis.get(`qr:${tokenId}`);
      if (!tokenData) throw new Error('Token expired or invalid');
      
      const parsedData = JSON.parse(tokenData);
      if (parsedData.used) throw new Error('Token already used');
      
      // Mark as used
      await redis.setEx(`qr:${tokenId}`, 30, JSON.stringify({...parsedData, used: true}));
      
      const scanDelay = Date.now() - issuedAt;
      
      return {
        valid: true,
        classSessionId,
        lecturerId,
        tokenId,
        scanDelay,
        deviceFingerprint,
        location,
        ipAddress
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
  
  static async generateQRImage(token) {
    try {
      const qrDataURL = await QRCode.toDataURL(token, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      });
      return qrDataURL;
    } catch (error) {
      throw new Error('QR generation failed');
    }
  }
  
  static async cleanupExpiredTokens() {
    // Redis handles TTL automatically, but we can add cleanup logic here
    console.log('QR token cleanup completed');
  }
}

module.exports = QRManager;