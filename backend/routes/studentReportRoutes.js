const express = require('express');
const router = express.Router();

const submitReport = async (req, res) => {
  res.json({ message: 'Report submitted successfully' });
};

const getReports = async (req, res) => {
  res.json([]);
};

const updateReportStatus = async (req, res) => {
  res.json({ message: 'Report updated successfully' });
};

router.post('/submit', submitReport);
router.get('/', getReports);
router.put('/:id/status', updateReportStatus);

module.exports = router;