import React, { useEffect } from 'react';

const StudentList = ({ students }) => {
  useEffect(() => {
    console.log('Student list updated:', students);
  }, [students]);

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
