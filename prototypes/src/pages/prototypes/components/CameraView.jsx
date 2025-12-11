import React, { useEffect, useState } from "react";
import { Camera, Images } from "lucide-react";
import "../../../css/components/CameraView.css";

function CameraView({
  isCameraActive,
  videoRef,
  canvasRef,
  onStartCamera,
  onCapture,
  overlay,
  onToggleTorch, 
  isTorchOn,
  paused = false,
  showAlbumButton = false,
  capturedCount = 0,
  onAlbumClick,
  showGuide = false,
}) {
  const [captureFlash, setCaptureFlash] = useState(false);

  const handleCapture = () => {
    // Trigger visual flash effect
    setCaptureFlash(true);
    setTimeout(() => setCaptureFlash(false), 300);

    // Call the original capture handler
    onCapture();
  };

  // Pause/resume the video element based on `paused` prop
  useEffect(() => {
    const video = videoRef?.current;
    if (!video || !isCameraActive) return;
    try {
      if (paused) {
        video.pause();
      } else {
        const playPromise = video.play();
        if (playPromise && typeof playPromise.then === "function") {
          playPromise.catch(() => {});
        }
      }
    } catch (e) {
      // no-op; pausing might not be supported in some states
    }
  }, [paused, isCameraActive, videoRef]);

  return (
    <div className="camera-container">
      <div className="viewfinder">
        {isCameraActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-feed"
            />
            {captureFlash && <div className="capture-flash" />}
            {paused && <div className="camera-paused-overlay" />}
            {/* Composition guide to help users center the object */}
            {showGuide && <div className="composition-guide"></div>}
          </>
        ) : (
          <div className="camera-inactive">
            <Camera className="camera-icon-large" />
            <p>Camera Inactive</p>
          </div>
        )}

        {/* Insert overlay here so it sits on top of the video */}
        {overlay && <div className="overlay-container">{overlay}</div>}
      </div>

      <canvas ref={canvasRef} className="camera-canvas-hidden" />

      {/* CAMERA CONTROLS */}
      {isCameraActive && !paused && (
        <div className="camera-controls">
          {showAlbumButton && (
            <button
              onClick={onAlbumClick}
              className={`album-btn ${capturedCount > 0 ? 'album-btn-active' : 'album-btn-empty'}`}
              title="View captured images"
            >
              <Images size={28} />
              {capturedCount > 0 && (
                <span className="album-badge">{capturedCount}</span>
              )}
            </button>
          )}
          <button onClick={handleCapture} className="capture-btn">
            <div className="capture-ring"></div>
          </button>
          <button
            onClick={onToggleTorch}
            className={`torch-btn ${isTorchOn ? "torch-btn-active" : "torch-btn-inactive"}`}
            title={isTorchOn ? "Turn flash off" : "Turn flash on"}
          >
            {isTorchOn ? "💡" : "🔦"}
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
