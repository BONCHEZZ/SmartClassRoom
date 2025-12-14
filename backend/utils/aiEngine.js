exports.predictAbsenteeism = records => {
const missed = records.filter(r => r.status === 'absent').length;
if (missed > 3) return 'High Risk';
if (missed > 1) return 'Medium Risk';
return 'Low Risk';
};


exports.predictCancellation = lecturerLogs => {
const late = lecturerLogs.filter(l => l === 'late').length;
return late > 2 ? 'Likely Cancelled' : 'On Schedule';
};