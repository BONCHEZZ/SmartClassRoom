const ClassSession = require('../models/ClassSession');
const User = require('../models/User');

const createClassSession = async (req, res) => {
  try {
    const { unit, course, startTime, endTime, room, startDate, start_time } = req.body;
    // Use authenticated user as lecturer
    const lecturerId = req.user && req.user.id ? req.user.id : undefined;

    // Allow two formats: (1) separate date + time fields (startDate + start_time)
    // or (2) a single ISO-like startTime string
    let parsedStart = null;
    if (startDate && (start_time || startTime)) {
      const timePart = start_time || startTime;
      // timePart expected like "HH:MM"
      const [hh, mm] = timePart.split(':').map(Number);
      const [y, m, d] = startDate.split('-').map(Number);
      // month is 0-based in Date constructor
      parsedStart = new Date(y, m - 1, d, hh || 0, mm || 0);
    } else if (startTime) {
      parsedStart = new Date(startTime);
    }

    if (!unit || !parsedStart) return res.status(400).json({ error: 'unit and start time are required' });

    const parsedEnd = endTime ? new Date(endTime) : undefined;

    // Fetch lecturer name for backwards-compatibility and display
    let lecturerName = undefined;
    if (lecturerId) {
      try {
        const u = await User.findById(lecturerId).select('name');
        lecturerName = u && u.name ? u.name : undefined;
      } catch (e) {
        // ignore
      }
    }

    const newClassSession = new ClassSession({
      unit,
      course,
      startTime: parsedStart,
      endTime: parsedEnd,
      room,
      lecturer: lecturerId,
      lecturerName,
      status: 'upcoming'
    });

    await newClassSession.save();
    // Notify enrolled students (by unit or course)
    try {
      const User = require('../models/User');
      const notif = {
        title: 'New Class Added',
        message: `A new class for ${unit} has been scheduled at ${newClassSession.startTime.toLocaleString()}`
      };
      // match users enrolled in either the unit or course
      await User.updateMany(
        { enrolledCourses: { $in: [unit, course] } },
        { $push: { notifications: notif } }
      );
    } catch (e) {
      console.error('Failed to notify students', e);
    }

    res.status(201).json({ message: 'Class session created successfully', classSession: newClassSession });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

const getAllClassSessions = async (req, res) => {
  try {
    // If a lecturer requests, return only their classes; admins can request all
    if (req.user && req.user.role === 'lecturer') {
      const classSessions = await ClassSession.find({ lecturer: req.user.id }).sort({ startTime: -1 });
      return res.status(200).json(classSessions);
    }

    const classSessions = await ClassSession.find().sort({ startTime: -1 });
    res.status(200).json(classSessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

const getClassSessionById = async (req, res) => {
  try {
    const classSession = await ClassSession.findById(req.params.id);
    if (!classSession) {
      return res.status(404).json({ error: 'Class session not found' });
    }
    res.status(200).json(classSession);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

const updateClassSession = async (req, res) => {
  try {
    const { unit, course, startTime, endTime, room, status } = req.body;
    const updates = { unit, course, room, status };
    if (startTime) updates.startTime = new Date(startTime);
    if (endTime) updates.endTime = new Date(endTime);

    const updatedClassSession = await ClassSession.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );
    if (!updatedClassSession) {
      return res.status(404).json({ error: 'Class session not found' });
    }
    res.status(200).json({ message: 'Class session updated successfully', classSession: updatedClassSession });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

const deleteClassSession = async (req, res) => {
  try {
    const deletedClassSession = await ClassSession.findByIdAndDelete(req.params.id);
    if (!deletedClassSession) {
      return res.status(404).json({ error: 'Class session not found' });
    }
    res.status(200).json({ message: 'Class session deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = {
  createClassSession,
  getAllClassSessions,
  getClassSessionById,
  updateClassSession,
  deleteClassSession,
};
