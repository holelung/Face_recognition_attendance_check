const express = require('express');
const router = express.Router();
const Student = require('../models/student');
const Attendance = require('../models/attendance');

// Get all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find();
    console.log(students);
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new student
router.post('/', async (req, res) => {
    const { name, photos, studentId, faceDescriptor } = req.body;
    
  
    const newStudent = new Student({ name, photos, studentId, faceDescriptor });
    try {
      const savedStudent = await newStudent.save();
      res.status(201).json(savedStudent);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
  

// Update an existing student
router.put('/:studentId/update', async (req, res) => {
    const { photo, faceDescriptor } = req.body;
    try {
      const student = await Student.findOne({ studentId: req.params.studentId });
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
  
      student.photos.push(photo);
      student.faceDescriptor.push(faceDescriptor);
      const updatedStudent = await student.save();
      res.json(updatedStudent);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

// Add a photo to an existing student
router.put('/:id/photos', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if photo and faceDescriptors are present in the request body
    if (!req.body.photo || !req.body.faceDescriptors) {
      return res.status(400).json({ message: 'Photo and faceDescriptors are required' });
    }

    student.photos.push(req.body.photo);
    student.faceDescriptors.push(req.body.faceDescriptors);
    await student.save();
    res.json(student);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 출석 체크
router.post('/:studentId/attendance', async (req, res) => {
    const { studentId } = req.params;
    const { date } = req.body;
  
    try {
      const student = await Student.findOne({ studentId });
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
  
      const attendance = new Attendance({
        studentId,
        date: date || new Date(), // 현재 날짜를 기본값으로 사용
      });
  
      const savedAttendance = await attendance.save();
      res.status(201).json(savedAttendance);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
module.exports = router;
