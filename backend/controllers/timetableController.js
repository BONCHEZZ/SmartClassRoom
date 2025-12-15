const Timetable = require('../models/Timetable');
const ClassSession = require('../models/ClassSession');
const User = require('../models/User');
const cron = require('node-cron');

const uploadTimetable = async (req, res) => {
  try {
    const { timetableData } = req.body; // Array of timetable entries
    
    const results = [];
    for (const entry of timetableData) {
      const { course, unit, lecturerEmail, dayOfWeek, startTime, endTime, room, location, semester, academicYear } = entry;
      
      const lecturer = await User.findOne({ email: lecturerEmail, role: 'lecturer' });
      if (!lecturer) {
        results.push({ error: `Lecturer not found: ${lecturerEmail}` });
        continue;
      }
      
      const timetableEntry = new Timetable({
        course,
        unit,
        lecturer: lecturer._id,
        dayOfWeek,
        startTime,
        endTime,
        room,
        location,
        semester,
        academicYear
      });
      
      await timetableEntry.save();
      results.push({ success: `Added ${unit} for ${lecturer.name}` });
    }
    
    res.json({ message: 'Timetable upload completed', results });
  } catch (error) {
    console.error('Timetable upload error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

const generateWeeklyClasses = async () => {
  try {
    const timetables = await Timetable.find({ active: true }).populate('lecturer');
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    for (const timetable of timetables) {
      const classDate = new Date(today);
      classDate.setDate(today.getDate() + (timetable.dayOfWeek - today.getDay() + 7) % 7);
      
      if (classDate <= nextWeek) {
        const [hours, minutes] = timetable.startTime.split(':');
        classDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const [endHours, endMinutes] = timetable.endTime.split(':');
        const endDate = new Date(classDate);
        endDate.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
        
        const existingClass = await ClassSession.findOne({
          unit: timetable.unit,
          startTime: classDate,
          lecturer: timetable.lecturer._id
        });
        
        if (!existingClass) {
          const classSession = new ClassSession({
            unit: timetable.unit,
            course: timetable.course,
            lecturer: timetable.lecturer._id,
            lecturerName: timetable.lecturer.name,
            startTime: classDate,
            endTime: endDate,
            room: timetable.room,
            location: timetable.location,
            status: 'upcoming'
          });
          
          await classSession.save();
        }
      }
    }
    
    console.log('Weekly classes generated successfully');
  } catch (error) {
    console.error('Error generating weekly classes:', error);
  }
};

// Schedule automatic class generation every Sunday at midnight
cron.schedule('0 0 * * 0', generateWeeklyClasses);

module.exports = {
  uploadTimetable,
  generateWeeklyClasses
};