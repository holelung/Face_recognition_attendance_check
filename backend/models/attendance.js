const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  date: { type: Date, required: true },
  status: { type: String, default: 'present' },
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
