import React, { useState, useRef, useEffect } from 'react';
import { Camera, Home, ImageIcon, ChevronLeft, Save } from 'lucide-react';

const API_URL = 'http://localhost:8080';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [submissionDetails, setSubmissionDetails] = useState({
    title: '',
    location: ''
  });
  const [currentSubmissionId, setCurrentSubmissionId] = useState(null);
  const [completedPrototypes, setCompletedPrototypes] = useState([]);

  const startNewSubmission = (prototypeNum) => {
    if (completedPrototypes.includes(prototypeNum)) {
      alert(`Prototype ${prototypeNum} has already been completed for this submission`);
      return;
    }

    if (!submissionDetails.title.trim() || !submissionDetails.location.trim()) {
      alert('Please enter both Title/Name and Location before starting');
      return;
    }
    
    if (!currentSubmissionId) {
      const submissionId = `${Date.now()}_${submissionDetails.title.replace(/[^a-zA-Z0-9]/g, '_')}`;
      setCurrentSubmissionId(submissionId);
    }
    
    setCurrentPage(`prototype${prototypeNum}`);
  };

  const markPrototypeComplete = (prototypeNum) => {
    console.log('Marking prototype complete:', prototypeNum);
    console.log('Current completed:', completedPrototypes);
    const newCompleted = [...completedPrototypes, prototypeNum];
    console.log('New completed:', newCompleted);
    setCompletedPrototypes(newCompleted);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage 
            submissionDetails={submissionDetails}
            setSubmissionDetails={setSubmissionDetails}
            startNewSubmission={startNewSubmission}
            completedPrototypes={completedPrototypes}
          />
        );
      case 'prototype1':
        return (
          <PrototypePage 
            title="Prototype 1" 
            prototypeNum={1}
            instructions="Take a photo of the object from the front view. Ensure good lighting and center the object in frame."
            setCurrentPage={setCurrentPage}
            submissionId={currentSubmissionId}
            submissionDetails={submissionDetails}
            markPrototypeComplete={markPrototypeComplete}
          />
        );
      case 'prototype2':
        return (
          <PrototypePage 
            title="Prototype 2" 
            prototypeNum={2}
            instructions="Capture a close-up shot. Focus on details and maintain a stable position while taking the photo."
            setCurrentPage={setCurrentPage}
            submissionId={currentSubmissionId}
            submissionDetails={submissionDetails}
            markPrototypeComplete={markPrototypeComplete}
          />
        );
      case 'prototype3':
        return (
          <PrototypePage 
            title="Prototype 3" 
            prototypeNum={3}
            instructions="Take a wide-angle shot including the surrounding context. Step back to capture the full scene."
            setCurrentPage={setCurrentPage}
            submissionId={currentSubmissionId}
            submissionDetails={submissionDetails}
            markPrototypeComplete={markPrototypeComplete}
          />
        );
      default:
        return (
          <HomePage 
            submissionDetails={submissionDetails}
            setSubmissionDetails={setSubmissionDetails}
            startNewSubmission={startNewSubmission}
            completedPrototypes={completedPrototypes}
          />
        );
    }
  };

  return (
    <div className="app-container">
      {renderPage()}
    </div>
  );
}

function HomePage({ submissionDetails, setSubmissionDetails, startNewSubmission, completedPrototypes }) {
  return (
    <div className="home-page">
      <div className="home-card">
        <div className="home-header">
          <Home className="home-icon" />
          <h1>Camera Prototype App</h1>
        </div>
        <p className="home-description">
          Enter submission details and select a prototype to start capturing images.
        </p>

        <div className="submission-form">
          <h2>Submission Details</h2>
          <div className="form-group">
            <label htmlFor="title">Title/Name of Fossil Find</label>
            <input
              id="title"
              type="text"
              placeholder="e.g., Trilobite Sample A"
              value={submissionDetails.title}
              onChange={(e) => setSubmissionDetails({...submissionDetails, title: e.target.value})}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              id="location"
              type="text"
              placeholder="e.g., Site 5, Grid B3"
              value={submissionDetails.location}
              onChange={(e) => setSubmissionDetails({...submissionDetails, location: e.target.value})}
              className="form-input"
            />
          </div>
        </div>

        <div className="prototype-grid">
          <PrototypeCard
            number={1}
            title="Front View"
            description="Standard front-facing captures"
            onClick={() => startNewSubmission(1)}
            isCompleted={completedPrototypes.includes(1)}
          />
          <PrototypeCard
            number={2}
            title="Close-Up"
            description="Detailed close-up shots"
            onClick={() => startNewSubmission(2)}
            isCompleted={completedPrototypes.includes(2)}
          />
          <PrototypeCard
            number={3}
            title="Wide Angle"
            description="Contextual wide shots"
            onClick={() => startNewSubmission(3)}
            isCompleted={completedPrototypes.includes(3)}
          />
        </div>
      </div>
    </div>
  );
}

function PrototypeCard({ number, title, description, onClick, isCompleted }) {
  return (
    <button 
      onClick={onClick} 
      className={`prototype-card ${isCompleted ? 'completed' : ''}`}
      disabled={isCompleted}
    >
      <div className="prototype-card-icon">
        <Camera />
      </div>
      <h3>Prototype {number}</h3>
      <p className="prototype-card-title">{title}</p>
      <p className="prototype-card-desc">{description}</p>
      {isCompleted && <p className="completion-badge">✓ Completed</p>}
    </button>
  );
}

function PrototypePage({ title, prototypeNum, instructions, setCurrentPage, submissionId, submissionDetails, markPrototypeComplete }) {
  const [stream, setStream] = useState(null);
  const [capturedImages, setCapturedImages] = useState([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setIsCameraActive(true);
      setStream(mediaStream);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().then(() => {
            console.log('Camera started successfully');
          }).catch(err => {
            console.error('Error playing video:', err);
          });
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera: ' + error.message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      const newImage = {
        id: Date.now(),
        data: imageData,
        timestamp: new Date().toLocaleString()
      };
      setCapturedImages([...capturedImages, newImage]);
    }
  };

  const deleteImage = (id) => {
    setCapturedImages(capturedImages.filter(img => img.id !== id));
  };

  const endTesting = async () => {
    if (capturedImages.length === 0) {
      alert('Please capture at least one image before ending the test');
      return;
    }

    setIsSaving(true);
    
    try {
      const formData = new FormData();
      formData.append('submission_id', submissionId);
      formData.append('title', submissionDetails.title);
      formData.append('location', submissionDetails.location);
      formData.append('prototype', `p${prototypeNum}`);
      
      for (let i = 0; i < capturedImages.length; i++) {
        const response = await fetch(capturedImages[i].data);
        const blob = await response.blob();
        formData.append('images', blob, `image_${i}.jpg`);
      }
      
      const uploadResponse = await fetch(`${API_URL}/api/submit`, {
        method: 'POST',
        body: formData
      });
      
      if (uploadResponse.ok) {
        alert(`Successfully saved ${capturedImages.length} images!`);
        markPrototypeComplete(prototypeNum);
        stopCamera();
        setCurrentPage('home');
      } else {
        const error = await uploadResponse.json();
        alert('Error saving images: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving images:', error);
      alert('Error saving images: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="prototype-page">
      <div className="prototype-container">
        <div className="prototype-header">
          <button
            onClick={() => {
              if (capturedImages.length > 0) {
                if (confirm('You have unsaved images. Are you sure you want to go back?')) {
                  stopCamera();
                  setCurrentPage('home');
                }
              } else {
                stopCamera();
                setCurrentPage('home');
              }
            }}
            className="back-button"
          >
            <ChevronLeft />
            <span>Back to Home</span>
          </button>
          <h1>{title}</h1>
          <div style={{ width: '132px' }}></div>
        </div>

        <div className="submission-info-box">
          <div>
            <strong>Title:</strong> {submissionDetails.title}
          </div>
          <div>
            <strong>Location:</strong> {submissionDetails.location}
          </div>
        </div>

        <div className="instructions-box">
          <h2>
            <span className="instruction-dot"></span>
            Instructions
          </h2>
          <p>{instructions}</p>
        </div>

        <div className="camera-layout">
          <div className="camera-section">
            <div className="camera-view">
              {isCameraActive ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className="video-element" 
                />
              ) : (
                <div className="camera-placeholder">
                  <Camera className="placeholder-icon" />
                  <p>Camera not active</p>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div className="camera-controls">
              {!isCameraActive ? (
                <button onClick={startCamera} className="btn-start">
                  <Camera />
                  <span>Start Camera</span>
                </button>
              ) : (
                <>
                  <button onClick={captureImage} className="btn-capture">
                    <Camera />
                    <span>Capture Image</span>
                  </button>
                  <button onClick={stopCamera} className="btn-stop">
                    Stop Camera
                  </button>
                </>
              )}
            </div>

            {capturedImages.length > 0 && (
              <button 
                onClick={endTesting} 
                className="btn-end-testing"
                disabled={isSaving}
              >
                <Save />
                <span>{isSaving ? 'Saving...' : `End Testing & Save ${capturedImages.length} Images`}</span>
              </button>
            )}
          </div>

          <div className="sidebar">
            <h3 className="sidebar-header">
              <ImageIcon />
              <span>Captured Images ({capturedImages.length})</span>
            </h3>
            <div className="captured-images-list">
              {capturedImages.length === 0 ? (
                <p className="no-captures">No images captured yet</p>
              ) : (
                capturedImages.map((img) => (
                  <div key={img.id} className="captured-image">
                    <img src={img.data} alt="Captured" />
                    <div className="image-footer">
                      <span className="timestamp">{img.timestamp}</span>
                      <button onClick={() => deleteImage(img.id)} className="btn-delete">
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;