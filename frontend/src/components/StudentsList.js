import React, { useEffect, useState } from 'react';

const StudentList = ({ students, checkAttendance }) => {
    const [attendance, setAttendance] = useState({});

  useEffect(() => {
    console.log('Student list updated:', students);
  }, [students]);

  useEffect(() => {
    if (checkAttendance && !attendance[checkAttendance]) {
      const updatedAttendance = { ...attendance, [checkAttendance]: true };
      setAttendance(updatedAttendance);
    }
  }, [checkAttendance])

  return (
    <div>
      <h2>Registered Students</h2>
      <ul>
        {students.map(student => (
          <li key={student._id}>
            <p>{student.name} / {student.studentId}</p>
            {student.photos && student.photos.length > 0 && (
              <img src={student.photos.slice(-1)[0]} alt={student.name} width="100" />
            )}
            {attendance[student.studentId] && <span>출석 체크!</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StudentList;
