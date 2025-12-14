const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const authMiddleware = require('../utils/authMiddleware');

// Create a new class session (lecturer/admin)
router.post('/', authMiddleware, classController.createClassSession);

// Get all class sessions (for display)
router.get('/', authMiddleware, classController.getAllClassSessions);

// Get a single class session
router.get('/:id', authMiddleware, classController.getClassSessionById);

// Update a class session
router.put('/:id', authMiddleware, classController.updateClassSession);

// Delete a class session
router.delete('/:id', authMiddleware, classController.deleteClassSession);

module.exports = router;