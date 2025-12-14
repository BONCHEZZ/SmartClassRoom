module.exports = {
  predictAbsenteeism: (attendanceRecords) => {
    if (!attendanceRecords || attendanceRecords.length === 0) return 'Low Risk';
    
    const missed = attendanceRecords.filter(a => a.status !== 'present').length;
    const total = attendanceRecords.length;
    const percentage = (missed / total) * 100;
    
    if (percentage > 50) return 'High Risk';
    if (percentage > 20) return 'Medium Risk';
    return 'Low Risk';
  }
};