const express = require('express');
const http = require('http');
const cors = require('cors');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);
const io = socketIO(server, { cors: { origin: '*' } });

// expose io globally for lightweight emit usage in controllers/routes
global.io = io;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/attendance', require('./routes/attendanceRoutes')(io));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/lecturer', require('./routes/lecturerRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Socket.io connection
io.on('connection', socket => {
  console.log('Client connected');

  socket.on('joinClass', (classId) => {
    socket.join(classId);
    console.log(`Client joined class room: ${classId}`);
  });

  socket.on('classUpdate', data => {
    socket.broadcast.emit('notifyStudents', data);
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
      server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.error('MongoDB connection error:', err));
}