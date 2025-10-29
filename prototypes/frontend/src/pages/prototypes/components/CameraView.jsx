import React from 'react';
import { Camera } from 'lucide-react';

function CameraView({ 
  isCameraActive, 
  videoRef, 
  canvasRef, 
  onStartCamera, 
  onCapture 
}) {
  return (
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
        <div className="camera-controls">
          <button onClick={onCapture} className="capture-btn">
            <div className="capture-ring"></div>
          </button>
        </div>
      )}

      {!isCameraActive && (
        <div className="controls">
          <button onClick={onStartCamera} className="control-btn primary">
            <Camera />
            <span>Activate Camera</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default CameraView;