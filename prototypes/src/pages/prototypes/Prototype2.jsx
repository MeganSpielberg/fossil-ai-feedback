import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, MapPin, FileText } from "lucide-react";
import { analyzeImage } from "../../api";
import CameraView from "./components/CameraView";
import FeedbackPanel from "./components/FeedbackPanel";
import AlbumModal from "./components/AlbumModal";
import { useTimeTracking } from "../../utils/useTimeTracking";
import "../../css/pages/PrototypePage.css";
import "../../css/pages/Prototype2.css";
import { AiOutlineClose } from "react-icons/ai";

function Prototype2({
  setCurrentPage,
  submissionDetails,
  savePrototypeImages,
}) {
  const [stream, setStream] = useState(null);
  const [capturedImages, setCapturedImages] = useState([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [flashlightUsed, setFlashlightUsed] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showAlbum, setShowAlbum] = useState(false);
  const [showPostOverlay, setShowPostOverlay] = useState(false);
  const [lastCaptured, setLastCaptured] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Initialize time tracking
  const { startInstructionsTimer, stopInstructionsTimer, getFinalTimeData } =
    useTimeTracking("Prototype2");

  // Start timer for instructions since they show by default
  useEffect(() => {
    if (showInstructions) {
      startInstructionsTimer();
    }
  }, []); // Only run on mount

  const prototypeNum = 2;
  const title = "Post-capture feedback";
  const instructions =
    "Capture multiple photos of your fossil specimen. After each shot you will see feedback to refine quality. When finished open the album icon to submit your final selection.";

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          focusMode: { ideal: "continuous" },
          focusDistance: { ideal: 0 },
          advanced: [
            { focusMode: "continuous" },
            { exposureMode: "continuous" },
            { whiteBalanceMode: "continuous" },
          ],
        },
      });
      setIsCameraActive(true);
      setStream(mediaStream);
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Could not access camera: " + error.message);
    }
  };
  // Set video source when stream is available - no delay
  useEffect(() => {
    if (stream && videoRef.current && isCameraActive) {
      videoRef.current.srcObject = stream;
      videoRef.current
        .play()
        .catch((err) => console.error("Video play error:", err));
    }
  }, [stream, isCameraActive]);
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  }, [stream]);

  const handleToggleTorch = async () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();
      if (capabilities.torch) {
        try {
          await videoTrack.applyConstraints({
            advanced: [{ torch: !isTorchOn }],
          });
          setIsTorchOn(!isTorchOn);
          // Track that flashlight was used at least once
          if (!isTorchOn) {
            setFlashlightUsed(true);
          }
        } catch (err) {
          alert("Could not toggle torch: " + err.message);
        }
      } else {
        alert("Torch not supported on this device.");
      }
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
    // Hold new image for review; only add if user clicks Keep
    setLastCaptured(newImage);
    setShowPostOverlay(true);
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
      // Get final time data
      const timeData = getFinalTimeData();

      await savePrototypeImages(
        prototypeNum,
        capturedImages,
        timeData,
        flashlightUsed
      );
      alert(
        `Saved ${capturedImages.length} images for prototype ${prototypeNum}`
      );
      stopCamera();
    } catch (error) {
      console.error("Error saving images:", error);
      alert("Error saving images: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => () => stopCamera(), [stopCamera]);

  const handleKeepImage = () => {
    if (lastCaptured) {
      setCapturedImages((prev) => {
        if (prev.some((img) => img.id === lastCaptured.id)) return prev;
        return [...prev, lastCaptured];
      });
      setLastCaptured(null);
    }
    setShowPostOverlay(false);
  };

  const handleDiscardImage = () => {
    // Close without adding
    setLastCaptured(null);
    setShowPostOverlay(false);
  };

  const handleOverlayBackgroundClick = () => {
    // If user dismisses without explicit choice, keep image by default
    if (lastCaptured) {
      setCapturedImages((prev) => {
        if (prev.some((img) => img.id === lastCaptured.id)) return prev;
        return [...prev, lastCaptured];
      });
      setLastCaptured(null);
    }
    setShowPostOverlay(false);
  };

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
        <div className="header-spacer"></div>
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
        <button
          className="instructions-btn"
          onClick={() => {
            setShowInstructions(true);
            startInstructionsTimer();
          }}
        >
          Instructions
        </button>
      </div>
      {/* INSTRUCTIONS MODAL */}
      {showInstructions && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowInstructions(false);
            stopInstructionsTimer();
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Instructions</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowInstructions(false);
                  stopInstructionsTimer();
                }}
              >
                <AiOutlineClose />
              </button>
            </div>
            <div className="instructions-modal-body">
              <p className="instructions-text">{instructions}</p>

              <h4 className="improvement-section-title">
                How to Improve Image Quality
              </h4>

              <div className="improvement-tips-container">
                <div className="improvement-tip-card">
                  <strong className="improvement-tip-title">💡 Lighting</strong>
                  <p className="improvement-tip-text">
                    If the image is too dark, try using the flashlight button or
                    move to a better-lit area.
                  </p>
                </div>

                <div className="improvement-tip-card">
                  <strong className="improvement-tip-title">
                    ⚡ Sharpness
                  </strong>
                  <p className="improvement-tip-text">
                    If the image is blurry, hold your phone steady or try
                    adjusting the distance to your specimen.
                  </p>
                </div>

                <div className="improvement-tip-card">
                  <strong className="improvement-tip-title">🎯 Contrast</strong>
                  <p className="improvement-tip-text">
                    Use a flat, solid background color that is the opposite in
                    tone to your fossil (e.g. dark fossil on light background,
                    light fossil on dark). Avoid patterns and glare.
                  </p>
                </div>
                <div className="improvement-tip-card">
                  <strong className="improvement-tip-title">
                    📸 Angles & Detail
                  </strong>
                  <p className="improvement-tip-text">
                    Take at least three different angles plus one close-up.
                    Rotate the fossil slightly between captures to reveal shape
                    and texture.
                  </p>
                </div>
                <div className="improvement-tip-card">
                  <strong className="improvement-tip-title">
                    📏 Size Reference
                  </strong>
                  <p className="improvement-tip-text">
                    Add a coin, ruler, or scale bar in one photo to provide size
                    context.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* CAMERA */}
      <CameraView
        isCameraActive={isCameraActive}
        videoRef={videoRef}
        canvasRef={canvasRef}
        onStartCamera={startCamera}
        onCapture={captureImage}
        onToggleTorch={handleToggleTorch}
        isTorchOn={isTorchOn}
        paused={showPostOverlay}
        showAlbumButton={true}
        capturedCount={capturedImages.length}
        onAlbumClick={() => setShowAlbum(true)}
        showGuide={true}
      />{" "}
      {/* POST-CAPTURE OVERLAY */}
      {showPostOverlay && lastCaptured && (
        <div className="modal-overlay" onClick={handleOverlayBackgroundClick}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Photo Feedback</h3>
              <button
                className="modal-close"
                onClick={handleOverlayBackgroundClick}
              >
                <AiOutlineClose />
              </button>
            </div>
            <div className="post-capture-modal-content">
              <img
                src={lastCaptured.data}
                alt="Captured"
                className="captured-image-preview"
              />
              <FeedbackPanel
                feedback={lastCaptured.feedback}
                metrics={lastCaptured.metrics}
              >
                {capturedImages.length < 3 && (
                  <div className="tip-box">
                    <div>
                      📸 Aim for three different angles and one close-up; rotate
                      the fossil between shots.
                    </div>
                    <div className="tip-divider">
                      📏 Add a coin or ruler for size reference in one photo.
                    </div>
                    <div className="tip-divider">
                      🎯 Use a solid contrasting background (dark vs light) for
                      clear edges.
                    </div>
                  </div>
                )}
              </FeedbackPanel>
              <div className="keep-discard-actions">
                <button className="discard-btn" onClick={handleDiscardImage}>
                  Discard
                </button>
                <button className="keep-btn" onClick={handleKeepImage}>
                  Keep
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ALBUM MODAL */}
      <AlbumModal
        isOpen={showAlbum}
        onClose={() => setShowAlbum(false)}
        capturedImages={capturedImages}
        onDeleteImage={deleteImage}
        onSubmit={endTesting}
        isSaving={isSaving}
      />
    </div>
  );
}

export default Prototype2;
