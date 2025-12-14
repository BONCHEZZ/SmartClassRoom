// NEWLY ADDED FILE
const express = require('express');
const router = express.Router();
const auth = require('../utils/authMiddleware');
const { getStudentAbsenteeismRisk, getLecturerReliabilityScore } = require('../controllers/aiController');

// Newly Added Code
// This file defines the API routes for accessing AI insights.

// GET student absenteeism risk
router.get('/student/:studentId/risk', auth, getStudentAbsenteeismRisk);

// GET lecturer reliability score
router.get('/lecturer/:lecturerId/reliability', auth, getLecturerReliabilityScore);

module.exports = router;
