import React, { useState, useEffect } from 'react';
import Camera from './components/CameraC';
import StudentList from './components/StudentsList';
import axios from 'axios';

const App = () => {
  const [students, setStudents] = useState([]);
  const [checkedStudent, setCheckedStudent] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/students');
        setStudents(response.data);
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };

    fetchStudents();
  }, []);

  const handleStudentAdded = (newStudent) => {
    setStudents(prevStudents => [...prevStudents, newStudent]);
  };

  const handleStudentUpdated = (updatedStudent) => {
    setStudents(prevStudents => {
      const studentIndex = prevStudents.findIndex(student => student._id === updatedStudent._id);
      if (studentIndex !== -1) {
        const updatedStudents = [...prevStudents];
        updatedStudents[studentIndex] = updatedStudent;
        return updatedStudents;
      } else {
        return [...prevStudents, updatedStudent];
      }
    });
  };

  const handleCheckAttendance = (studentId) => {
    setCheckedStudent(studentId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
      <Camera 
        onStudentAdded={handleStudentAdded} 
        onStudentUpdated={handleStudentUpdated} 
        checkAttendance={handleCheckAttendance}
      />
      <StudentList 
        students={students} 
        checkAttendance={checkedStudent}/>
    </div>
  );
};

export default App;
