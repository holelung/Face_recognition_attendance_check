import React from 'react';
import Camera from './components/CameraC';
import StudentList from './components/StudentsList';

const App = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
      <Camera />
      <StudentList />
    </div>
  );
};

export default App;
