import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  MapPin,
  FileText,
  HelpCircle,
  Sun,
  Droplet,
  Zap,
} from "lucide-react";
import { AiOutlineClose } from "react-icons/ai";
import { analyzeImage } from "../../api";
import CameraView from "./components/CameraView";
import AlbumModal from "./components/AlbumModal";
import { useTimeTracking } from "../../utils/useTimeTracking";
import "../../css/pages/PrototypePage.css";
import "../../css/pages/Prototype3.css";

/**
 * Prototype 3.
 *
 * Real time feedback.
 * While the camera is active we periodically capture a frame, run local analysis,
 * and update the on screen indicator.
 */

function Prototype3({
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
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [realtimeFeedback, setRealtimeFeedback] = useState(null);
  const analysisIntervalRef = useRef(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showAlbum, setShowAlbum] = useState(false);
  const previousMetricsRef = useRef(null);

  // Track time spent in instructions and active use.
  const { startInstructionsTimer, stopInstructionsTimer, getFinalTimeData } =
    useTimeTracking("Prototype3");

  // Start the instructions timer since the modal is open by default.
  useEffect(() => {
    startInstructionsTimer();
  }, [startInstructionsTimer]);

  const prototypeNum = 3;
  const title = "Real-time feedback";
  const instructions =
    "Capture multiple photos of your fossil specimen while receiving live feedback. When finished open the album icon to submit your final selection.";

  const analyzeFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg", 0.5);

    // Capture a frame for analysis.

    try {
      const data = await analyzeImage(imageData);

      // Reduce flicker by only updating when a rating changes.
      const prev = previousMetricsRef.current;
      if (prev) {
        const currentRatings = [
          data.metrics?.lighting_rating,
          data.metrics?.sharpness_rating,
          data.metrics?.contrast_rating,
        ];
        const prevRatings = [
          prev.lighting_rating,
          prev.sharpness_rating,
          prev.contrast_rating,
        ];

        // Only update if at least one rating changed.
        const ratingsChanged = currentRatings.some(
          (r, i) => r !== prevRatings[i]
        );
        if (!ratingsChanged) {
          // Keep previous feedback to avoid flicker.
          return;
        }
      }

      previousMetricsRef.current = data.metrics;
      setRealtimeFeedback(data.feedback);
    } catch (err) {
      console.error("Realtime feedback error:", err);
    }
  };

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
  // Set the video element source as soon as the stream is available.
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
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
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
          // Track that flashlight was used at least once.
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
    const newImage = {
      id: Date.now(),
      data: imageData,
      timestamp: new Date().toLocaleString(),
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
      // Get final time data.
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

  // Start or stop real time analysis when the camera is active.
  useEffect(() => {
    if (isCameraActive) {
      analysisIntervalRef.current = setInterval(analyzeFrame, 1000);
    } else {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
    }
    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
    };
  }, [isCameraActive]);

  useEffect(() => () => stopCamera(), [stopCamera]);

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
                {" "}
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
                    Use a flat, solid background color that is opposite in tone
                    to the fossil (dark fossil on light background, light fossil
                    on dark). Avoid patterns and glare.
                  </p>
                </div>
                <div className="improvement-tip-card">
                  <strong className="improvement-tip-title">
                    📸 Angles & Detail
                  </strong>
                  <p className="improvement-tip-text">
                    Capture at least three different angles plus one close-up.
                    Rotate the fossil between shots to reveal its form.
                  </p>
                </div>
                <div className="improvement-tip-card">
                  <strong className="improvement-tip-title">
                    📏 Size Reference
                  </strong>
                  <p className="improvement-tip-text">
                    Add a coin, ruler, or scale bar in one photo to communicate
                    size.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HELP OVERLAY - Icon Guide */}
      {showHelp && (
        <div className="modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Feedback Icons Guide</h3>
              <button
                className="modal-close"
                onClick={() => setShowHelp(false)}
              >
                <AiOutlineClose />
              </button>
            </div>
            <div className="help-modal-body">
              <div className="help-icon-row">
                <Sun size={28} color="var(--secondary)" />
                <div>
                  <strong className="help-icon-title">Lighting</strong>
                  <div className="help-icon-description">
                    Indicates if the image is too dark or properly lit
                  </div>
                </div>
              </div>
              <div className="help-icon-row">
                <Zap size={28} color="var(--secondary)" />
                <div>
                  <strong className="help-icon-title">Sharpness</strong>
                  <div className="help-icon-description">
                    Shows if the image is in focus or blurry
                  </div>
                </div>
              </div>
              <div className="help-icon-row">
                <Droplet size={28} color="var(--secondary)" />
                <div>
                  <strong className="help-icon-title">Contrast</strong>
                  <div className="help-icon-description">
                    Measures detail visibility and dynamic range
                  </div>
                </div>
              </div>
              <div className="help-color-guide">
                <strong className="help-color-guide-title">Icon Colors:</strong>
                <div className="help-color-list">
                  <div>
                    🟢 <span className="color-green">Green</span> = Good quality
                  </div>
                  <div>
                    🟡 <span className="color-orange">Orange</span> = Needs
                    improvement
                  </div>
                  <div>
                    🔴 <span className="color-red">Red</span> = Poor quality
                  </div>
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
        showAlbumButton={true}
        capturedCount={capturedImages.length}
        onAlbumClick={() => setShowAlbum(true)}
        showGuide={true}
        overlay={
          isCameraActive && realtimeFeedback ? (
            <div className="realtime-overlay-container">
              <div className="realtime-overlay-header">
                <span className="realtime-overlay-title">Quality</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHelp(true);
                  }}
                  className="realtime-help-button"
                >
                  <HelpCircle size={18} />
                </button>
              </div>
              <div className="realtime-icons-grid">
                {(() => {
                  // Map feedback messages to the three icon buckets.
                  const lightingFeedback = realtimeFeedback.find(
                    (f) =>
                      f.message.toLowerCase().includes("lighting") ||
                      f.message.toLowerCase().includes("dark")
                  );
                  const sharpnessFeedback = realtimeFeedback.find(
                    (f) =>
                      f.message.toLowerCase().includes("sharp") ||
                      f.message.toLowerCase().includes("blur") ||
                      f.message.toLowerCase().includes("focus")
                  );
                  const contrastFeedback = realtimeFeedback.find((f) =>
                    f.message.toLowerCase().includes("contrast")
                  );

                  const getColor = (feedback) => {
                    if (!feedback) return "#888";
                    if (feedback.type === "success") return "#4caf50";
                    if (feedback.type === "warning") return "#ef5350";
                    return "#ffb74d";
                  };

                  return (
                    <>
                      <div className="realtime-icon-item">
                        <Sun
                          size={32}
                          color={getColor(lightingFeedback)}
                          strokeWidth={2.5}
                        />
                        <span className="realtime-icon-label">Light</span>
                      </div>
                      <div className="realtime-icon-item">
                        <Zap
                          size={32}
                          color={getColor(sharpnessFeedback)}
                          strokeWidth={2.5}
                        />
                        <span className="realtime-icon-label">Sharp</span>
                      </div>
                      <div className="realtime-icon-item">
                        <Droplet
                          size={32}
                          color={getColor(contrastFeedback)}
                          strokeWidth={2.5}
                        />
                        <span className="realtime-icon-label">Contrast</span>
                      </div>
                    </>
                  );
                })()}
              </div>
              {/* Removed static hints; guidance moved to instructions modal */}
            </div>
          ) : null
        }
      />

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

export default Prototype3;
