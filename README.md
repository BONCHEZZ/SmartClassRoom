# ClassTrack AI - Real-Time Attendance System

## 🎯 Overview
ClassTrack AI is a secure, real-time, AI-powered attendance tracking platform that prevents fraud through:
- Time-bound QR codes (25-second expiry)
- Device fingerprinting & geolocation validation
- AI behavioral analysis & fraud detection
- Real-time WebSocket communication

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB
- Redis (optional, falls back gracefully)

### Installation
```bash
cd backend
npm install
npm start
```

### Environment Variables
```env
MONGO_URL=your_mongodb_connection
JWT_SECRET=your_jwt_secret
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 🔐 Security Features

### QR Code Security
- JWT-signed tokens with 25-second expiry
- Single-use tokens stored in Redis
- Cryptographically secure UUID generation
- Anti-screenshot/forwarding protection

### Fraud Detection
- Device fingerprinting (browser + OS + screen)
- GPS location validation with configurable radius
- AI risk scoring (0-100) based on behavioral patterns
- Real-time suspicious activity detection

### Access Control
- Role-based authentication (student/lecturer/admin)
- Rate limiting (5 scans/minute, 5 logins/15min)
- JWT token validation on all endpoints

## 🧠 AI Features

### Student Analytics
- Attendance pattern learning
- Risk level assessment (low/medium/high)
- Dropout prediction algorithms
- Optimal notification timing

### Fraud Detection Engine
- Device reuse detection
- Location clustering analysis
- Time pattern anomaly detection
- Proxy attendance identification

## 📱 Usage Flow

### For Lecturers
1. Navigate to QR Display page
2. Click "Start Attendance" (sets GPS location)
3. QR code auto-refreshes every 25 seconds
4. Monitor real-time attendance feed
5. Click "End Attendance" when done

### For Students
1. Open QR Scanner page
2. Allow camera & location permissions
3. Scan lecturer's live QR code
4. System validates location, device, timing
5. Instant feedback on attendance status

## 🔧 API Endpoints

### Attendance
- `POST /api/attendance/scan` - Scan QR attendance
- `GET /api/attendance/:id` - Get class attendance

### Classes
- `POST /api/classes/start-attendance` - Start attendance session
- `POST /api/classes/refresh-qr/:id` - Refresh QR token
- `POST /api/classes/end-attendance/:id` - End attendance session

### Timetable
- `POST /api/timetable/upload` - Upload timetable data

## 🛡️ Anti-Fraud Measures

### Prevented Attacks
✅ QR screenshot sharing
✅ Token forwarding/reuse
✅ Location spoofing
✅ Device impersonation
✅ Proxy attendance
✅ Time manipulation

### Detection Methods
- Real-time token validation
- Geofencing with GPS accuracy
- Device fingerprint uniqueness
- Behavioral pattern analysis
- IP correlation checks

## 📊 Real-Time Features
- WebSocket attendance updates
- Live QR code refresh
- Instant fraud alerts
- Real-time analytics dashboard
- Push notifications

## 🔄 Automated Features
- Weekly class generation from timetable
- Expired token cleanup (cron jobs)
- AI model training on attendance patterns
- Smart notification scheduling
- Risk score recalculation

## 🎛️ Configuration
- QR expiry time: 25 seconds (configurable)
- Location radius: 50 meters (configurable)
- Rate limits: 5 requests/minute (configurable)
- AI risk threshold: 50/100 (configurable)

## 📈 Monitoring
- Attendance success rates
- Fraud detection accuracy
- System performance metrics
- User behavior analytics
- Security incident logs