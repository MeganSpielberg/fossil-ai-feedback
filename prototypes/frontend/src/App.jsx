import React, { useState, useRef, useEffect } from 'react';
import { Camera, Home, ImageIcon, ChevronLeft, Save, MapPin, FileText, Check } from 'lucide-react';

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
            title="Front View" 
            prototypeNum={1}
            instructions="Position the fossil specimen flat and centered. Ensure even lighting across the entire surface. Take multiple angles if needed."
            setCurrentPage={setCurrentPage}
            submissionId={currentSubmissionId}
            submissionDetails={submissionDetails}
            markPrototypeComplete={markPrototypeComplete}
          />
        );
      case 'prototype2':
        return (
          <PrototypePage 
            title="Detail Shot" 
            prototypeNum={2}
            instructions="Focus on distinctive features and textures. Get as close as possible while maintaining sharp focus. Document unique characteristics."
            setCurrentPage={setCurrentPage}
            submissionId={currentSubmissionId}
            submissionDetails={submissionDetails}
            markPrototypeComplete={markPrototypeComplete}
          />
        );
      case 'prototype3':
        return (
          <PrototypePage 
            title="Context View" 
            prototypeNum={3}
            instructions="Include surrounding area and scale reference. Show the specimen in its discovery context. Capture the broader field site."
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
      <div className="home-header-section">
        <h1 className="app-title">Field Documentation</h1>
        <p className="app-subtitle">Fossil Discovery Protocol</p>
      </div>

      <div className="home-content">
        <div className="details-card">
          <h2 className="section-title">Specimen Information</h2>
          
          <div className="input-group">
            <label htmlFor="title" className="input-label">
              <FileText className="label-icon" />
              <span>Specimen Name</span>
            </label>
            <input
              id="title"
              type="text"
              placeholder="Enter specimen identifier"
              value={submissionDetails.title}
              onChange={(e) => setSubmissionDetails({...submissionDetails, title: e.target.value})}
              className="text-input"
            />
          </div>

          <div className="input-group">
            <label htmlFor="location" className="input-label">
              <MapPin className="label-icon" />
              <span>Discovery Location</span>
            </label>
            <input
              id="location"
              type="text"
              placeholder="Grid coordinates or site name"
              value={submissionDetails.location}
              onChange={(e) => setSubmissionDetails({...submissionDetails, location: e.target.value})}
              className="text-input"
            />
          </div>
        </div>

        <div className="protocol-section">
          <h2 className="section-title">Documentation Protocol</h2>
          <div className="protocol-grid">
            <ProtocolCard
              number={1}
              title="Front View"
              description="Standard specimen documentation"
              onClick={() => startNewSubmission(1)}
              isCompleted={completedPrototypes.includes(1)}
            />
            <ProtocolCard
              number={2}
              title="Detail Shot"
              description="Close-up feature capture"
              onClick={() => startNewSubmission(2)}
              isCompleted={completedPrototypes.includes(2)}
            />
            <ProtocolCard
              number={3}
              title="Context View"
              description="Field site documentation"
              onClick={() => startNewSubmission(3)}
              isCompleted={completedPrototypes.includes(3)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProtocolCard({ number, title, description, onClick, isCompleted }) {
  return (
    <button 
      onClick={onClick} 
      className={`protocol-card ${isCompleted ? 'completed' : ''}`}
      disabled={isCompleted}
    >
      {isCompleted && (
        <div className="completion-indicator">
          <Check className="check-icon" />
        </div>
      )}
      <div className="protocol-number">{number}</div>
      <h3 className="protocol-title">{title}</h3>
      <p className="protocol-desc">{description}</p>
      {isCompleted && <span className="completed-text">Completed</span>}
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
          videoRef.current.play().catch(err => console.error('Video play error:', err));
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

  const analyzeImage = async (imageData) => {
    const response = await fetch(`${API_URL}/api/analyze-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageData })
    });
    if (!response.ok) throw new Error('Failed to analyze image');
    return await response.json();
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.9);

    let feedback = null;
    let metrics = null;

    if (prototypeNum === 2) {
      try {
        const analysisResult = await analyzeImage(imageData);
        feedback = analysisResult.feedback;
        metrics = analysisResult.metrics;
      } catch (error) {
        console.error('Error analyzing image:', error);
        feedback = [{ type: 'warning', message: 'Could not analyze image' }];
      }
    }

    const newImage = {
      id: Date.now(),
      data: imageData,
      timestamp: new Date().toLocaleString(),
      feedback,
      metrics
    };
    setCapturedImages([...capturedImages, newImage]);
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

      const uploadResponse = await fetch(`${API_URL}/api/submit`, { method: 'POST', body: formData });
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

  useEffect(() => () => stopCamera(), []);

  const latestImage = capturedImages[capturedImages.length - 1];

  return (
    <div className="capture-page">
      {/* HEADER */}
      <div className="capture-header">
        <button
          onClick={() => {
            if (capturedImages.length > 0 && !confirm('Unsaved images will be lost. Go back?')) return;
            stopCamera();
            setCurrentPage('home');
          }}
          className="back-btn"
        >
          <ChevronLeft />
        </button>
        <div className="header-info">
          <h1 className="capture-title">{title}</h1>
          <p className="capture-subtitle">Protocol {prototypeNum}</p>
        </div>
        <div style={{ width: '40px' }}></div>
      </div>

      {/* SPECIMEN INFO */}
      <div className="specimen-info">
        <div className="info-item"><FileText className="info-icon" /><span>{submissionDetails.title}</span></div>
        <div className="info-item"><MapPin className="info-icon" /><span>{submissionDetails.location}</span></div>
      </div>

      {/* INSTRUCTIONS */}
      <div className="instructions-panel">
        <div className="instruction-header">Instructions</div>
        <p className="instruction-text">{instructions}</p>
      </div>

      {/* CAMERA */}
      <div className="camera-container">
        <div className="viewfinder">
          {isCameraActive ? (
            <video ref={videoRef} autoPlay playsInline muted className="camera-feed" />
          ) : (
            <div className="camera-inactive">
              <Camera className="camera-icon-large" />
              <p>Camera Inactive</p>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* CAMERA CONTROLS */}
        {isCameraActive && (
          <div
            className={`camera-controls ${
              capturedImages.length > 0 ? 'shift-up' : ''
            }`}
          >
            <button onClick={captureImage} className="capture-btn">
              <div className="capture-ring"></div>
            </button>
          </div>
        )}

        {!isCameraActive && (
          <div className="controls">
            <button onClick={startCamera} className="control-btn primary">
              <Camera />
              <span>Activate Camera</span>
            </button>
          </div>
        )}
      </div>

      {/* FEEDBACK (Prototype 2 only) */}
      {prototypeNum === 2 && latestImage && latestImage.feedback && (
        <div className="feedback-panel">
          <div className="feedback-header">
            <FileText className="feedback-icon" />
            <h3>Image Analysis Feedback</h3>
          </div>

          <ul className="feedback-list">
            {latestImage.feedback.map((item, idx) => (
              <li key={idx} className={`feedback-item ${item.type === 'success' ? 'success' : 'warning'}`}>
                {item.type === 'success' ? '✅' : '⚠️'} {item.message}
              </li>
            ))}
          </ul>

          {latestImage.metrics && (
            <div className="metrics-grid">
              {Object.entries(latestImage.metrics).map(([key, val]) => (
                <div key={key} className="metric-box">
                  <span className="metric-key">{key.replace(/_/g, ' ')}</span>
                  <span className="metric-value">{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CAPTURED IMAGES */}
      {capturedImages.length > 0 && (
        <div className="image-review">
          <div className="review-header">
            <ImageIcon className="review-icon" />
            <span>Captured Images ({capturedImages.length})</span>
          </div>
          <div className="thumbnail-grid">
            {capturedImages.map((img) => (
              <div key={img.id} className="thumbnail">
                <img src={img.data} alt="Captured" />
                <button onClick={() => deleteImage(img.id)} className="delete-btn">×</button>
              </div>
            ))}
          </div>

          <button
            onClick={endTesting}
            className="save-btn"
            disabled={
              isSaving ||
              (prototypeNum === 2 && latestImage && !latestImage.feedback)
            }
          >
            <Save />
            <span>{isSaving ? 'Saving Documentation...' : `Save ${capturedImages.length} Image${capturedImages.length > 1 ? 's' : ''}`}</span>
          </button>
        </div>
      )}
    </div>
  );
}


export default App;