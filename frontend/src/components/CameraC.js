import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import './Camera.css';

const Camera = () => {
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
        if (bestMatch.label === 'unknown') {
          const descriptorKey = JSON.stringify(resizedDetections[0].descriptor);
          if (!processedDescriptors.has(descriptorKey)) {
            setProcessedDescriptors((prev) => new Set(prev).add(descriptorKey));
            setUnknownPhotos((prev) => [
              ...prev,
              { id: descriptorKey, photo: webcamRef.current.getScreenshot(), descriptor: resizedDetections[0].descriptor },
            ]);
          }
        } else {
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
  
    // Convert Float32Array to regular array
    const descriptorArray = Array.from(newStudent.descriptor);
  
    // Log the newStudent object to inspect its structure before sending
    console.log('Submitting new student:', { ...newStudent, descriptor: descriptorArray });
  
    try {
      const response = await axios.post('http://localhost:5001/api/students', {
        name: newStudent.name,
        studentId: newStudent.studentId,
        photos: [newStudent.photo],
        faceDescriptor: descriptorArray
      });
  
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
  
    } catch (error) {
      console.error('Error adding new student:', error);
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