import React, { useState, useEffect } from "react";
import HomePage from "./pages/HomePage";
import Prototype1 from "./pages/prototypes/Prototype1";
import Prototype2 from "./pages/prototypes/Prototype2";
import Prototype3 from "./pages/prototypes/Prototype3";
import { submitAllImages } from "./api.jsx";
import { getTestingOrder, incrementOrderCompletion } from "./utils/supabase";

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [submissionDetails, setSubmissionDetails] = useState({
    username: "",
    title: "",
    location: "",
  });
  const [currentSubmissionId, setCurrentSubmissionId] = useState(null);
  const [completedPrototypes, setCompletedPrototypes] = useState([]);
  // store captured images per prototype until final submission
  const [imagesByPrototype, setImagesByPrototype] = useState({});
  // store time spent data per prototype
  const [timeSpentData, setTimeSpentData] = useState({});
  // store flashlight usage per prototype
  const [flashlightData, setFlashlightData] = useState({});
  // store the testing order assigned to this session
  const [testingOrder, setTestingOrder] = useState(null);
  const [testingOrderId, setTestingOrderId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch testing order on app initialization
  useEffect(() => {
    const fetchTestingOrder = async () => {
      try {
        const order = await getTestingOrder();
        setTestingOrder(order.order_sequence.split(","));
        setTestingOrderId(order.id);
      } catch (err) {
        console.error("Error fetching testing order:", err);
        alert("Error loading testing order: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTestingOrder();
  }, []);

  const startNewSubmission = (prototypeNum) => {
    if (completedPrototypes.includes(prototypeNum)) {
      alert(
        `Prototype ${prototypeNum} has already been completed for this submission`
      );
      return;
    }

    if (!submissionDetails.username.trim() || !submissionDetails.title.trim() || !submissionDetails.location.trim()) {
      alert("Please enter Username, Title/Name, and Location before starting");
      return;
    }

    // Enforce the testing order: can only start if it's the next in sequence
    const nextPrototypeIndex = completedPrototypes.length;
    const nextPrototypeInOrder = testingOrder ? parseInt(testingOrder[nextPrototypeIndex].replace("p", "")) : null;
    
    if (prototypeNum !== nextPrototypeInOrder) {
      alert(
        `Please complete Prototype ${nextPrototypeInOrder} next according to your assigned testing order.`
      );
      return;
    }

    if (!currentSubmissionId) {
      const submissionId = `${Date.now()}_${submissionDetails.title.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}`;
      setCurrentSubmissionId(submissionId);
    }

    setCurrentPage(`prototype${prototypeNum}`);
  };

  const markPrototypeComplete = (prototypeNum) => {
    const newCompleted = [...completedPrototypes, prototypeNum];
    setCompletedPrototypes(newCompleted);
  };

  // Save images from a prototype into App state. When all three prototypes are
  // present, send a single combined submission to backend.
  const savePrototypeImages = async (prototypeNum, capturedImages, timeData = null, flashlightUsed = false) => {
    const key = `p${prototypeNum}`;
    const newMap = { ...imagesByPrototype, [key]: capturedImages };
    setImagesByPrototype(newMap);

    // Update time spent data if provided
    let newTimeSpentData = { ...timeSpentData };
    if (timeData) {
      newTimeSpentData[key] = timeData;
      setTimeSpentData(newTimeSpentData);
    }

    // Update flashlight data
    let newFlashlightData = { ...flashlightData, [key]: flashlightUsed };
    setFlashlightData(newFlashlightData);

    // Calculate what the new completed list would be
    const newCompleted = [...completedPrototypes, prototypeNum];

    // If all three prototypes completed, submit once
    if (newCompleted.includes(1) && newCompleted.includes(2) && newCompleted.includes(3)) {
      try {
        // Wait for backend submission with the updated time data and flashlight data
        await submitAllImages(currentSubmissionId, submissionDetails, newMap, testingOrderId, newTimeSpentData, newFlashlightData);
        
        // Only mark as complete after successful submission
        setCompletedPrototypes(newCompleted);
        
        alert("All prototypes submitted successfully!");
        
        // Increment the testing order completion count
        if (testingOrderId) {
          await incrementOrderCompletion(testingOrderId);
        }
        
        // Navigate to home to show completion card
        // Keep completedPrototypes so HomePage shows the completion card
        // Only reset when user starts a new submission
        setCurrentPage("home");
      } catch (err) {
        console.error("Error submitting all images:", err);
        alert("Error submitting all images: " + err.message);
        // Don't mark as complete or navigate away on error
        // User can retry or go back manually
      }
    } else {
      // Not all done yet — mark as complete and navigate back to home so user can start next prototype
      setCompletedPrototypes(newCompleted);
      setCurrentPage("home");
    }
  };


  // Reset submission state when user starts a new submission
  const handleNewSubmission = (prototypeNum) => {
    // Only allow new submission if all previous ones are complete or this is the first
    if (completedPrototypes.length === 3) {
      // User has completed all prototypes, allow them to start fresh
      setCurrentSubmissionId(null);
      setCompletedPrototypes([]);
      setImagesByPrototype({});
      setTimeSpentData({});
      setFlashlightData({});
      setSubmissionDetails({ username: "", title: "", location: "" });
    }
    startNewSubmission(prototypeNum);
  };

  const renderPage = () => {
    if (loading) {
      return (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontSize: "1.2rem",
          color: "#666",
        }}>
          Loading testing order...
        </div>
      );
    }

    switch (currentPage) {
      case "home":
        return (
          <HomePage
            submissionDetails={submissionDetails}
            setSubmissionDetails={setSubmissionDetails}
            startNewSubmission={handleNewSubmission}
            completedPrototypes={completedPrototypes}
            testingOrder={testingOrder}
          />
        );
      case "prototype1":
        return (
          <Prototype1
            setCurrentPage={setCurrentPage}
            submissionId={currentSubmissionId}
            submissionDetails={submissionDetails}
            markPrototypeComplete={markPrototypeComplete}
            savePrototypeImages={savePrototypeImages}
          />
        );
      case "prototype2":
        return (
          <Prototype2
            setCurrentPage={setCurrentPage}
            submissionId={currentSubmissionId}
            submissionDetails={submissionDetails}
            markPrototypeComplete={markPrototypeComplete}
            savePrototypeImages={savePrototypeImages}
          />
        );
      case "prototype3":
        return (
          <Prototype3
            setCurrentPage={setCurrentPage}
            submissionId={currentSubmissionId}
            submissionDetails={submissionDetails}
            markPrototypeComplete={markPrototypeComplete}
            savePrototypeImages={savePrototypeImages}
          />
        );
      default:
        return (
          <HomePage
            submissionDetails={submissionDetails}
            setSubmissionDetails={setSubmissionDetails}
            startNewSubmission={startNewSubmission}
            completedPrototypes={completedPrototypes}
            testingOrder={testingOrder}
          />
        );
    }
  };

  return <div className="app-container">{renderPage()}</div>;
}

export default App;
