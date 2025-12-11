import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, MapPin, FileText } from "lucide-react";
import CameraView from "./components/CameraView";
import AlbumModal from "./components/AlbumModal";
import { useTimeTracking } from "../../utils/useTimeTracking";
import "../../css/pages/PrototypePage.css";
import "../../css/pages/Prototype1.css";
import { AiOutlineClose } from "react-icons/ai";

function Prototype1({
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
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Initialize time tracking
  const { startInstructionsTimer, stopInstructionsTimer, getFinalTimeData } =
    useTimeTracking("Prototype1");

  // Start timer for instructions since they show by default
  useEffect(() => {
    if (showInstructions) {
      startInstructionsTimer();
    }
  }, []); // Only run on mount

  const prototypeNum = 1;
  const title = "Baseline";
  const instructions =
    "Take photos of your fossil specimen or object. You can add or delete images before submitting. When you're done, submit your final choice of images via the album icon.";

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
      feedback: null,
      metrics: null,
    };
    setCapturedImages([...capturedImages, newImage]);
  };

  const deleteImage = (id) => {
    setCapturedImages(capturedImages.filter((img) => img.id !== id));
  };

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

  const endTesting = async () => {
    if (capturedImages.length === 0) {
      alert("Please capture at least one image before ending the test");
      return;
    }

    setIsSaving(true);
    try {
      // Get final time data
      const timeData = getFinalTimeData();

      // Save to parent state with time data and flashlight usage; App will submit all prototypes when done
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
            <p className="modal-text">{instructions}</p>
            <div className="instruction-tips">
              <p className="instruction-tips-intro">
                Here are some tips for a good identification:
              </p>
              <ul className="instruction-tips-list">
                <li>Photograph one object per photo</li>
                <li>Place a scale bar/ruler next to the object</li>
                <li>
                  Photograph the object against a plain, high-contrast
                  background
                </li>
                <li>Take the photo from directly above the object</li>
                <li>Ensure good lighting with minimal shadows</li>
              </ul>
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

export default Prototype1;
