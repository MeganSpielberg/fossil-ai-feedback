/**
 * Main application component.
 *
 * Responsibilities:
 * - Fetch the assigned testing order from Supabase on startup.
 * - Collect submission details on the Home page.
 * - Enforce prototype completion order.
 * - Hold captured images, time tracking data, and flashlight usage until final upload.
 * - Submit one combined record set to Supabase after all three prototypes are completed.
 */
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
  // Captured images per prototype. Kept in memory until final submission.
  const [imagesByPrototype, setImagesByPrototype] = useState({});
  // Time tracking data per prototype.
  const [timeSpentData, setTimeSpentData] = useState({});
  // Flashlight usage per prototype.
  const [flashlightData, setFlashlightData] = useState({});
  // Testing order assigned to this session.
  const [testingOrder, setTestingOrder] = useState(null);
  const [testingOrderId, setTestingOrderId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch testing order on app initialization.
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

  /**
   * Start one prototype for the current submission.
   * Enforces that the user can only start the next prototype in their assigned order.
   */
  const startNewSubmission = (prototypeNum) => {
    if (completedPrototypes.includes(prototypeNum)) {
      alert(
        `Prototype ${prototypeNum} has already been completed for this submission`
      );
      return;
    }

    if (
      !submissionDetails.username.trim() ||
      !submissionDetails.title.trim() ||
      !submissionDetails.location.trim()
    ) {
      alert("Please enter Username, Title/Name, and Location before starting");
      return;
    }

    // Enforce the testing order: can only start if it's the next in sequence
    const nextPrototypeIndex = completedPrototypes.length;
    const nextPrototypeInOrder = testingOrder
      ? parseInt(testingOrder[nextPrototypeIndex].replace("p", ""))
      : null;
    
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

  /**
   * Save one prototype's images into App state.
   *
   * After the third prototype is saved, this will upload all images and create all
   * related database rows in Supabase via `submitAllImages`.
   */
  const savePrototypeImages = async (
    prototypeNum,
    capturedImages,
    timeData = null,
    flashlightUsed = false
  ) => {
    const key = `p${prototypeNum}`;
    const newMap = { ...imagesByPrototype, [key]: capturedImages };
    setImagesByPrototype(newMap);

    // Update time spent data if provided
    let newTimeSpentData = { ...timeSpentData };
    if (timeData) {
      newTimeSpentData[key] = timeData;
      setTimeSpentData(newTimeSpentData);
    }

    // Update flashlight data.
    let newFlashlightData = { ...flashlightData, [key]: flashlightUsed };
    setFlashlightData(newFlashlightData);

    // Calculate what the new completed list would be.
    const newCompleted = [...completedPrototypes, prototypeNum];

    // If all three prototypes are completed, submit once.
    if (
      newCompleted.includes(1) &&
      newCompleted.includes(2) &&
      newCompleted.includes(3)
    ) {
      try {
        // Upload images and create all rows in Supabase.
        await submitAllImages(
          currentSubmissionId,
          submissionDetails,
          newMap,
          testingOrderId,
          newTimeSpentData,
          newFlashlightData
        );
        
        // Only mark as complete after successful submission
        setCompletedPrototypes(newCompleted);
        
        alert("All prototypes submitted successfully!");
        
        // Increment the testing order completion count.
        if (testingOrderId) {
          await incrementOrderCompletion(testingOrderId);
        }
        
        // Navigate to Home to show the completion card.
        // Keep completedPrototypes so HomePage can show the completion card.
        // Reset happens when the user starts a new submission.
        setCurrentPage("home");
      } catch (err) {
        console.error("Error submitting all images:", err);
        alert("Error submitting all images: " + err.message);
        // Do not mark as complete or navigate away on error.
        // The user can retry or go back manually.
      }
    } else {
      // Not all done yet. Mark as complete and go back to Home so the user can start the next prototype.
      setCompletedPrototypes(newCompleted);
      setCurrentPage("home");
    }
  };


  // Reset submission state when the user starts a new submission.
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
