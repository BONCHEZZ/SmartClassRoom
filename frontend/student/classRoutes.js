const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const ClassSession = require('../models/ClassSession');

// Get all classes (for student dashboard available list)
router.get('/', protect, async (req, res) => {
    const classes = await ClassSession.find().populate('lecturer', 'name').sort({ startTime: 1 });
    res.json(classes);
});

router.post('/', protect, async (req, res) => {
  try {
    const { course, unit, startDate, start_time, room } = req.body;
    // Combine date and time
    const startDateTime = new Date(`${startDate}T${start_time}`);
    
    const newClass = await ClassSession.create({
        course, unit, room,
        startTime: startDateTime,
        lecturer: req.user._id
    });
    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
    await ClassSession.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

module.exports = router;