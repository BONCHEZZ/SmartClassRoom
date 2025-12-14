const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../utils/authMiddleware');

const attendanceRoutes = (io) => {
  // Mark attendance (for students)
  router.post('/mark', authMiddleware, (req, res) => attendanceController.markAttendance(req, res, io));

  // Get attendance for a specific student/class (for lecturer/admin)
  router.get('/:id', authMiddleware, attendanceController.getAttendance);

  return router;
};

module.exports = attendanceRoutes;