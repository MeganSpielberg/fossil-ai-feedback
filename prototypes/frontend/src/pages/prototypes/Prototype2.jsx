import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, MapPin, FileText } from "lucide-react";
import { analyzeImage, submitImages } from "../../api";
import CameraView from "./components/CameraView";
import FeedbackPanel from "./components/FeedbackPanel";
import ImageReview from "./components/ImageReview";

function Prototype2({
  setCurrentPage,
  submissionId,
  submissionDetails,
  markPrototypeComplete,
}) {
  const [stream, setStream] = useState(null);
  const [capturedImages, setCapturedImages] = useState([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const prototypeNum = 2;
  const title = "Post-capture feedback";
  const instructions =
    "Focus on distinctive features and textures. Get as close as possible while maintaining sharp focus. Document unique characteristics.";

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

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  };

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

    try {
      const analysisResult = await analyzeImage(imageData);
      feedback = analysisResult.feedback;
      metrics = analysisResult.metrics;
    } catch (error) {
      console.error("Error analyzing image:", error);
      feedback = [{ type: "warning", message: "Could not analyze image" }];
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
      await submitImages(
        submissionId,
        submissionDetails,
        prototypeNum,
        capturedImages
      );
      alert(`Successfully saved ${capturedImages.length} images!`);
      markPrototypeComplete(prototypeNum);
      stopCamera();
      setCurrentPage("home");
    } catch (error) {
      console.error("Error saving images:", error);
      alert("Error saving images: " + error.message);
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
      <CameraView
        isCameraActive={isCameraActive}
        videoRef={videoRef}
        canvasRef={canvasRef}
        onStartCamera={startCamera}
        onCapture={captureImage}
      />

      {/* FEEDBACK */}
      {latestImage && latestImage.feedback && (
        <FeedbackPanel
          feedback={latestImage.feedback}
          metrics={latestImage.metrics}
        />
      )}

      {/* CAPTURED IMAGES */}
      <ImageReview
        capturedImages={capturedImages}
        onDeleteImage={deleteImage}
        onEndTesting={endTesting}
        isSaving={isSaving}
        disabled={latestImage && !latestImage.feedback}
      />
    </div>
  );
}

export default Prototype2;
