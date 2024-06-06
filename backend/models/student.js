const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  photos: [{ type: String }], // base64 encoded image
  studentId: { type: String, required: true },
  faceDescriptor: { type: [[Number]], required: false } // Array of arrays of numbers
});

module.exports = mongoose.model('Student', StudentSchema);
