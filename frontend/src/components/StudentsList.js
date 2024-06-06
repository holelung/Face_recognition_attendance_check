import React, { useEffect, useState } from 'react';
import axios from 'axios';

const StudentList = () => {
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

  return (
    <div>
      <h2>Registered Students</h2>
      <ul>
        {students.map(student => (
          <li key={student._id}>
            <p>{student.name}</p>
            {student.photos && student.photos.length > 0 && (
              <img src={student.photos[0]} alt={student.name} width="100" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StudentList;
