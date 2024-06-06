import React, { useState, useEffect } from 'react';
import Camera from './components/CameraC';
import StudentList from './components/StudentsList';
import axios from 'axios';

const App = () => {
  const [students, setStudents] = useState([]);

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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
      <Camera onStudentAdded={handleStudentAdded} />
      <StudentList students={students} />
    </div>
  );
};

export default App;
