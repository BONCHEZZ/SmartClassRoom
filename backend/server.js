const express = require('express');
const http = require('http');
const cors = require('cors');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const cron = require('node-cron');
const { connectRedis } = require('./config/redis');
const QRManager = require('./utils/qrManager');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);
const io = socketIO(server, { cors: { origin: '*' } });

app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Redis (optional)
connectRedis().catch(err => console.warn('Starting without Redis'));

// Cleanup expired QR tokens every minute
cron.schedule('* * * * *', () => {
  QRManager.cleanupExpiredTokens();
});

// Routes
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/lecturer', require('./routes/lecturerRoutes'));
// app.use('/api/admin', require('./routes/adminRoutes'));
// app.use('/api/ai', require('./routes/aiRoutes'));
// app.use('/api/timetable', require('./routes/timetableRoutes'));
app.use('/api/reports', require('./routes/studentReportRoutes'));

// Socket.io connection
io.on('connection', socket => {
  console.log('Client connected');

  socket.on('joinClass', (classId) => {
    socket.join(classId);
    console.log(`Client joined class room: ${classId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});


// Export the app for testing purposes
module.exports = app;

// Conditional server start (only if server.js is run directly)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  const MONGO_URI = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/smarttrack';
  console.log(`Connecting to MongoDB at: ${MONGO_URI.includes('127.0.0.1') ? 'Localhost' : 'Atlas Cloud'}`);
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('MongoDB Connected');
      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`\nError: Port ${PORT} is already in use.`);
          console.error(`To fix, stop the other server or run: npx kill-port ${PORT}\n`);
          process.exit(1);
        }
      });
      server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.error('MongoDB connection error:', err));
}
