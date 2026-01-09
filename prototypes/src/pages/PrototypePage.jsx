import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  ChevronLeft,
  Save,
  MapPin,
  FileText,
  ImageIcon,
} from "lucide-react";
import { analyzeImage } from "../api.jsx";

function PrototypePage({
  title,
  prototypeNum,
  instructions,
  setCurrentPage,
  submissionDetails,
  savePrototypeImages,
}) {
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
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      setIsCameraActive(true);
      setStream(mediaStream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current
            .play()
            .catch((err) => console.error("Video play error:", err));
        }
      }, 100);
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Could not access camera: " + error.message);
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  }, [stream]);

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL("image/jpeg", 0.9);

    let feedback = null;
    let metrics = null;

    if (prototypeNum === 2) {
      try {
        const analysisResult = await analyzeImage(imageData);
        feedback = analysisResult.feedback;
        metrics = analysisResult.metrics;
      } catch (error) {
        console.error("Error analyzing image:", error);
        feedback = [{ type: "warning", message: "Could not analyze image" }];
      }
    }

    const newImage = {
      id: Date.now(),
      data: imageData,
      timestamp: new Date().toLocaleString(),
      feedback,
      metrics,
    };
    setCapturedImages([...capturedImages, newImage]);
  };

  const deleteImage = (id) => {
    setCapturedImages(capturedImages.filter((img) => img.id !== id));
  };

  const endTesting = async () => {
    if (capturedImages.length === 0) {
      alert("Please capture at least one image before ending the test");
      return;
    }

    setIsSaving(true);
    try {
      await savePrototypeImages(prototypeNum, capturedImages);
      alert(`Saved ${capturedImages.length} images for prototype ${prototypeNum}`);
      stopCamera();
    } catch (error) {
      console.error("Error saving images:", error);
      alert("Error saving images: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => () => stopCamera(), [stopCamera]);

  const latestImage = capturedImages[capturedImages.length - 1];

  return (
    <div className="capture-page">
      {/* HEADER */}
      <div className="capture-header">
        <button
          onClick={() => {
            if (
              capturedImages.length > 0 &&
              !confirm("Unsaved images will be lost. Go back?")
            )
              return;
            stopCamera();
            setCurrentPage("home");
          }}
          className="back-btn"
        >
          <ChevronLeft />
        </button>
        <div className="header-info">
          <h1 className="capture-title">{title}</h1>
          <p className="capture-subtitle">Prototype {prototypeNum}</p>
        </div>
        <div style={{ width: "40px" }}></div>
      </div>

      {/* SPECIMEN INFO */}
      <div className="specimen-info">
        <div className="info-item">
          <FileText className="info-icon" />
          <span>{submissionDetails.title}</span>
        </div>
        <div className="info-item">
          <MapPin className="info-icon" />
          <span>{submissionDetails.location}</span>
        </div>
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
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-feed"
            />
          ) : (
            <div className="camera-inactive">
              <Camera className="camera-icon-large" />
              <p>Camera Inactive</p>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* CAMERA CONTROLS */}
        {isCameraActive && (
          <div
            className={`camera-controls ${
              capturedImages.length > 0 ? "shift-up" : ""
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
              <li
                key={idx}
                className={`feedback-item ${
                  item.type === "success" ? "success" : "warning"
                }`}
              >
                {item.type === "success" ? "✅" : "⚠️"} {item.message}
              </li>
            ))}
          </ul>

          {latestImage.metrics && (
            <div className="metrics-grid">
              {Object.entries(latestImage.metrics).map(([key, val]) => (
                <div key={key} className="metric-box">
                  <span className="metric-key">{key.replace(/_/g, " ")}</span>
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
                <button
                  onClick={() => deleteImage(img.id)}
                  className="delete-btn"
                >
                  ×
                </button>
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
            <span>
              {isSaving
                ? "Saving Documentation..."
                : `Save ${capturedImages.length} Image${
                    capturedImages.length > 1 ? "s" : ""
                  }`}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

export default PrototypePage;
