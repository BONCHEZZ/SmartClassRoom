const StudentReport = require('../models/StudentReport');

const submitReport = async (req, res) => {
  try {
    const { type, subject, description, priority, classSession } = req.body;
    
    const report = new StudentReport({
      type,
      subject,
      description,
      priority: priority || 'medium',
      classSession
    });
    
    await report.save();
    res.status(201).json({ message: 'Report submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit report' });
  }
};

const getReports = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    
    const reports = await StudentReport.find(query)
      .populate('classSession', 'unit course startTime')
      .sort({ submittedAt: -1 });
    
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

const updateReportStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const updates = { status };
    
    if (adminNotes) updates.adminNotes = adminNotes;
    if (status === 'resolved') updates.resolvedAt = new Date();
    
    await StudentReport.findByIdAndUpdate(req.params.id, updates);
    res.json({ message: 'Report updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update report' });
  }
};

module.exports = { submitReport, getReports, updateReportStatus };