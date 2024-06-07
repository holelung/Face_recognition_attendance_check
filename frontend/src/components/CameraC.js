import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import './Camera.css';

const Camera = ({ onStudentAdded }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState({ name: '', studentId: '', photo: '', descriptor: [] });
  const [unknownPhotos, setUnknownPhotos] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [processedDescriptors, setProcessedDescriptors] = useState(new Set());
  const [faceMatcher, setFaceMatcher] = useState(null);

  useEffect(() => {
    const loadModelsAndStudents = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');

        const response = await axios.get('http://localhost:5001/api/students');
        setStudents(response.data);

        if (response.data.length > 0) {
          const labeledDescriptors = response.data
            .filter(student => student.faceDescriptor && student.faceDescriptor.length > 0)
            .map(student => {
              const descriptors = student.faceDescriptor.map(fd => new Float32Array(fd));
              return new faceapi.LabeledFaceDescriptors(student.name, descriptors);
            });

          if (labeledDescriptors.length > 0) {
            const matcher = new faceapi.FaceMatcher(labeledDescriptors);
            setFaceMatcher(matcher);
          }
        }

        setModelsLoaded(true);
      } catch (error) {
        console.error('Error loading models or fetching students:', error);
      }
    };

    loadModelsAndStudents();
  }, []);

  const findBestMatch = (queryDescriptor) => {
    if (!faceMatcher) {
      return { label: 'unknown', distance: Infinity };
    }

    try {
      const bestMatch = faceMatcher.findBestMatch(queryDescriptor);
      return bestMatch;
    } catch (error) {
      console.error('Error finding best match:', error);
      return { label: 'unknown', distance: Infinity };
    }
  };

  // 캡처 기능 클릭 -> 얼굴 인식 및 데이터 비교
  const handleCapture = async () => {
    const video = webcamRef.current.video;

    if (video) {
      const displaySize = {
        width: video.videoWidth,
        height: video.videoHeight,
      };

      faceapi.matchDimensions(canvasRef.current, displaySize);

      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();
      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      const context = canvasRef.current.getContext('2d');
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);

      if (resizedDetections.length > 0) {
        const bestMatch = findBestMatch(resizedDetections[0].descriptor);

        // 크롭된 얼굴 이미지 생성
        const box = resizedDetections[0].detection.box;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = box.width;
        canvas.height = box.height;
        context.drawImage(
          video,
          box.x, box.y, box.width, box.height,
          0, 0, box.width, box.height
        );
        const croppedFace = canvas.toDataURL('image/jpeg');
        // 일치하는 학생이 없을 경우
        if (bestMatch.label === 'unknown') {
          const descriptorKey = JSON.stringify(resizedDetections[0].descriptor);
          if (!processedDescriptors.has(descriptorKey)) {
            setProcessedDescriptors((prev) => new Set(prev).add(descriptorKey));
            setUnknownPhotos((prev) => [
              ...prev,
              { id: descriptorKey, photo: croppedFace, descriptor: resizedDetections[0].descriptor },
            ]);
          }
        } else { // 일치하는 학생이 있을 경우
          const existingStudent = students.find(student => student.name === bestMatch.label);
          if (existingStudent) {
            try {
              const response = await axios.put(`http://localhost:5001/api/students/${existingStudent.studentId}/update`, {
                photo: croppedFace,
                faceDescriptor: Array.from(resizedDetections[0].descriptor) // Float32Array를 일반 배열로 변환
              });
              console.log('Student updated successfully:', response.data);
              setStudents(students.map(student => student._id === response.data._id ? response.data : student));
              setNewStudent({ name: '', studentId: '', photo: '', descriptor: [] });
              setUnknownPhotos(unknownPhotos.filter(photo => photo.photo !== newStudent.photo));
        
              // Update faceMatcher with new data
              const updatedDescriptors = students
                .filter(student => student.faceDescriptor && student.faceDescriptor.length > 0)
                .map(student => {
                  const descriptors = student.faceDescriptor.map(fd => new Float32Array(fd));
                  return new faceapi.LabeledFaceDescriptors(student.name, descriptors);
                });
        
              if (updatedDescriptors.length > 0) {
                const matcher = new faceapi.FaceMatcher(updatedDescriptors);
                setFaceMatcher(matcher);
              }
        
            } catch (error) {
              console.error('Error updating student:', error);
            }
          }
          setSelectedStudent(bestMatch.label);
        }
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStudent({ ...newStudent, [name]: value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
  
    // Check if the student already exists
    const existingStudent = students.find(student => student.studentId === newStudent.studentId);
    if (existingStudent) {
      // Update the existing student
      try {
        const response = await axios.put(`http://localhost:5001/api/students/${existingStudent.studentId}/update`, {
          photo: newStudent.photo,
          faceDescriptor: Array.from(newStudent.descriptor) // Float32Array를 일반 배열로 변환
        });
        console.log('Student updated successfully:', response.data);
        setStudents(students.map(student => student._id === response.data._id ? response.data : student));
        setNewStudent({ name: '', studentId: '', photo: '', descriptor: [] });
        setUnknownPhotos(unknownPhotos.filter(photo => photo.photo !== newStudent.photo));
  
        // Update faceMatcher with new data
        const updatedDescriptors = students
          .filter(student => student.faceDescriptor && student.faceDescriptor.length > 0)
          .map(student => {
            const descriptors = student.faceDescriptor.map(fd => new Float32Array(fd));
            return new faceapi.LabeledFaceDescriptors(student.name, descriptors);
          });
  
        if (updatedDescriptors.length > 0) {
          const matcher = new faceapi.FaceMatcher(updatedDescriptors);
          setFaceMatcher(matcher);
        }
  
      } catch (error) {
        console.error('Error updating student:', error);
      }
    } else {
      // Add a new student
      try {
        const newStudentData = {
          name: newStudent.name,
          studentId: newStudent.studentId,
          photos: [newStudent.photo],
          faceDescriptor: Array.from(newStudent.descriptor) // Float32Array를 일반 배열로 변환
        };
  
        console.log('Submitting new student:', newStudentData); // 디버깅 정보 추가
  
        const response = await axios.post('http://localhost:5001/api/students', newStudentData);
        console.log('New student added successfully:', response.data);
        setStudents([...students, response.data]);
        setNewStudent({ name: '', studentId: '', photo: '', descriptor: [] });
        setUnknownPhotos(unknownPhotos.filter(photo => photo.photo !== newStudent.photo));
  
        // Update faceMatcher with new data
        const updatedDescriptors = [...students, response.data]
          .filter(student => student.faceDescriptor && student.faceDescriptor.length > 0)
          .map(student => {
            const descriptors = student.faceDescriptor.map(fd => new Float32Array(fd));
            return new faceapi.LabeledFaceDescriptors(student.name, descriptors);
          });
  
        if (updatedDescriptors.length > 0) {
          const matcher = new faceapi.FaceMatcher(updatedDescriptors);
          setFaceMatcher(matcher);
        }
        onStudentAdded(response.data);
      } catch (error) {
        console.error('Error adding new student:', error);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {modelsLoaded ? (
        <>
          <div className="camera-container">
            <Webcam
              ref={webcamRef}
              audio={false}
              width={720}
              height={560}
              screenshotFormat="image/jpeg"
              className="webcam-video"
            />
            <canvas
              ref={canvasRef}
              width={720}
              height={560}
              className="overlay-canvas"
            />
          </div>
          <button onClick={handleCapture}>Capture</button>
          <div>
            {unknownPhotos.map(photo => (
              <div key={photo.id}>
                <img src={photo.photo} alt="Unknown" width="100" />
                <button onClick={() => setNewStudent({ ...newStudent, photo: photo.photo, descriptor: photo.descriptor })}>Identify</button>
              </div>
            ))}
          </div>
          {selectedStudent && (
            <div>
              <h3>Matched Student: {selectedStudent}</h3>
            </div>
          )}
          {newStudent.photo && (
            <form onSubmit={handleFormSubmit} style={{ marginTop: '10px' }}>
              <input
                type="text"
                name="name"
                placeholder="Enter student name"
                value={newStudent.name}
                onChange={handleInputChange}
                required
              />
              <input
                type="text"
                name="studentId"
                placeholder="Enter student ID"
                value={newStudent.studentId}
                onChange={handleInputChange}
                required
              />
              <button type="submit">Save New Student</button>
            </form>
          )}
        </>
      ) : (
        <div>Loading models...</div>
      )}
    </div>
  );
};

export default Camera;
