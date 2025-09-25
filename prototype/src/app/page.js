"use client";
import { useRef, useState } from "react";

export default function Home() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [captured, setCaptured] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [streaming, setStreaming] = useState(false);

  // Start webcam
  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Wait for videoRef to be available
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreaming(true);
      }
    }
  };

  // Capture image
  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");
    setCaptured(dataUrl);
    simulateFeedback();
  };

  // Simulate AI feedback
  const simulateFeedback = () => {
    // Random feedback for prototype
    const feedbacks = [
      "Good lighting!",
      "Try centering the object.",
      "Image is a bit blurry.",
      "Perfect capture!",
      "Move closer to the object.",
    ];
    setFeedback(feedbacks[Math.floor(Math.random() * feedbacks.length)]);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-2xl font-bold mb-2">AI Feedback Image Capture Prototype</h1>
      <div className="flex flex-col items-center gap-4">
        <video
          ref={videoRef}
          autoPlay
          className="rounded shadow-lg w-[320px] h-[240px]"
          style={{ display: streaming ? "block" : "none" }}
        />
        {!streaming && (
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={startCamera}
          >
            Start Camera
          </button>
        )}
        {streaming && (
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mt-2"
            onClick={captureImage}
          >
            Capture Image
          </button>
        )}
        <canvas ref={canvasRef} style={{ display: "none" }} />
        {captured && (
          <div className="flex flex-col items-center gap-2 mt-4">
            <img src={captured} alt="Captured" className="rounded shadow w-[320px] h-auto" />
            <div className="text-lg font-semibold text-purple-700">Feedback: {feedback}</div>
          </div>
        )}
      </div>
    </div>
  );
}
