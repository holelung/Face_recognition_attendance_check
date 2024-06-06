const express = require('express');
const router = express.Router();
const Student = require('../models/student');

// Get all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find();
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

module.exports = router;
