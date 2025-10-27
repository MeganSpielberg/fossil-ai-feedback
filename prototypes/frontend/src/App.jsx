import React, { useState, useRef, useEffect } from 'react';
import { Camera, Home, ImageIcon, ChevronLeft } from 'lucide-react';

const API_URL = 'http://localhost:8080';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/images`);
      const data = await response.json();
      setImages(data.images || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage setCurrentPage={setCurrentPage} images={images} />;
      case 'prototype1':
        return <PrototypePage 
          title="Prototype 1" 
          instructions="Take a photo of the object from the front view. Ensure good lighting and center the object in frame."
          setCurrentPage={setCurrentPage}
        />;
      case 'prototype2':
        return <PrototypePage 
          title="Prototype 2" 
          instructions="Capture a close-up shot. Focus on details and maintain a stable position while taking the photo."
          setCurrentPage={setCurrentPage}
        />;
      case 'prototype3':
        return <PrototypePage 
          title="Prototype 3" 
          instructions="Take a wide-angle shot including the surrounding context. Step back to capture the full scene."
          setCurrentPage={setCurrentPage}
        />;
      default:
        return <HomePage setCurrentPage={setCurrentPage} images={images} />;
    }
  };

  return (
    <div className="app-container">
      {renderPage()}
    </div>
  );
}

function HomePage({ setCurrentPage, images }) {
  return (
    <div className="home-page">
      <div className="home-card">
        <div className="home-header">
          <Home className="home-icon" />
          <h1>Camera Prototype App</h1>
        </div>
        <p className="home-description">
          Select a prototype to start capturing images. Each prototype has specific instructions for optimal results.
        </p>

        <div className="prototype-grid">
          <PrototypeCard
            number={1}
            title="Front View"
            description="Standard front-facing captures"
            onClick={() => setCurrentPage('prototype1')}
          />
          <PrototypeCard
            number={2}
            title="Close-Up"
            description="Detailed close-up shots"
            onClick={() => setCurrentPage('prototype2')}
          />
          <PrototypeCard
            number={3}
            title="Wide Angle"
            description="Contextual wide shots"
            onClick={() => setCurrentPage('prototype3')}
          />
        </div>

        <div className="saved-images-section">
          <div className="saved-images-header">
            <ImageIcon className="section-icon" />
            <h2>Saved Images</h2>
          </div>
          {images.length > 0 ? (
            <div className="images-grid">
              {images.map((img, idx) => (
                <div key={idx} className="image-item">
                  <ImageIcon className="image-placeholder-icon" />
                  <p className="image-name">{img}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-images">No images saved yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PrototypeCard({ number, title, description, onClick }) {
  return (
    <button onClick={onClick} className="prototype-card">
      <div className="prototype-card-icon">
        <Camera />
      </div>
      <h3>Prototype {number}</h3>
      <p className="prototype-card-title">{title}</p>
      <p className="prototype-card-desc">{description}</p>
    </button>
  );
}

function PrototypePage({ title, instructions, setCurrentPage }) {
  const [stream, setStream] = useState(null);
  const [capturedImages, setCapturedImages] = useState([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
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
      
      // Use setTimeout to ensure the video element is rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().then(() => {
            console.log('Camera started successfully');
            console.log('Stream:', mediaStream);
            console.log('Video element:', videoRef.current);
          }).catch(err => {
            console.error('Error playing video:', err);
          });
        } else {
          console.error('Video ref is null');
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
      
      const imageData = canvas.toDataURL('image/jpeg');
      const newImage = {
        id: Date.now(),
        data: imageData,
        timestamp: new Date().toLocaleString()
      };
      setCapturedImages([...capturedImages, newImage]);
      
      sendImageToBackend(imageData);
    }
  };

  const sendImageToBackend = async (imageData) => {
    try {
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('image', blob, `image_${Date.now()}.jpg`);
      
      await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });
      
      console.log('Image sent to backend successfully');
    } catch (error) {
      console.error('Error sending image to backend:', error);
    }
  };

  const deleteImage = (id) => {
    setCapturedImages(capturedImages.filter(img => img.id !== id));
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
          <button onClick={() => { stopCamera(); setCurrentPage('home'); }} className="back-button">
            <ChevronLeft />
            <span>Back to Home</span>
          </button>
          <h1>{title}</h1>
          <div style={{ width: '132px' }}></div>
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