import React, { useState } from "react";
import { FileText, MapPin, User } from "lucide-react";
import ProtocolCard from "./components/PrototypeCard";
import "../css/pages/HomePage.css";
import { AiOutlineClose } from "react-icons/ai";

function HomePage({
  submissionDetails,
  setSubmissionDetails,
  startNewSubmission,
  completedPrototypes,
  testingOrder,
}) {
  const [showGdprModal, setShowGdprModal] = useState(false);
  const inputsLocked = completedPrototypes.includes(1);

  // determine which prototypes to show based on testing order
  const prototypesToShow = [];

  if (testingOrder) {
    // Show completed prototypes in the order they were completed
    const sortedCompleted = [...completedPrototypes].sort((a, b) => a - b);
    for (const p of sortedCompleted) {
      if (!prototypesToShow.includes(p)) prototypesToShow.push(p);
    }

    // Add the next prototype to do based on testing order
    if (completedPrototypes.length < 3) {
      const nextPrototypeStr = testingOrder[completedPrototypes.length];
      const nextPrototypeNum = parseInt(nextPrototypeStr.replace("p", ""));
      if (!prototypesToShow.includes(nextPrototypeNum)) {
        prototypesToShow.push(nextPrototypeNum);
      }
    }
  }
  return (
    <div className="home-page">
      <div className="home-header-section">
        <h1 className="app-title">Fossil Submission App</h1>
        <p className="app-subtitle">Image Quality Feedback Mechanisms</p>
      </div>

      <div className="home-content">
        {completedPrototypes.length === 3 ? (
          <div className="completion-card">
            <div className="completion-icon">✓</div>
            <h2 className="completion-title">All Prototypes Completed!</h2>
            <p className="completion-message">
              Thank you for testing all three image capture prototypes. Your
              feedback is invaluable in helping us improve the fossil submission
              process.
            </p>
            <div className="completion-stats">
              <div className="stat-item">
                <span className="stat-number">3</span>
                <span className="stat-label">Prototypes Tested</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">✓</span>
                <span className="stat-label">Submission Complete</span>
              </div>
            </div>
            <div className="username-reminder">
              <h3 className="reminder-title">Your Username</h3>
              <p className="username-display">{submissionDetails.username}</p>
              <p className="reminder-text">
                Please remember this username for the survey
              </p>
            </div>
            <div className="survey-section">
              <h3 className="survey-title">One More Thing!</h3>
              <p className="survey-text">
                Please share your experience by completing our quick survey.
                Your insights will help us create better tools for fossil
                documentation.
              </p>
              <a
                href="https://forms.gle/PJ2m75dchjZBY1ad8"
                target="_blank"
                rel="noopener noreferrer"
                className="survey-button"
              >
                Complete Survey
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="welcome-card">
              <h2 className="welcome-title">Welcome!</h2>
              <p className="welcome-text">
                This app helps you submit fossil images while testing different
                feedback mechanisms. You'll capture photos using three different
                prototypes, each offering a different approach to image quality
                feedback. If you don't have a fossil specimen, feel free to use
                any object around you to test the prototypes.
              </p>
              <div className="instruction-steps">
                <div className="instruction-step">
                  <span className="step-number">1</span>
                  <span className="step-text">
                    Fill in your submission details below
                  </span>
                </div>
                <div className="instruction-step">
                  <span className="step-number">2</span>
                  <span className="step-text">
                    Complete all three prototypes in the order assigned to you
                  </span>
                </div>
                <div className="instruction-step">
                  <span className="step-number">3</span>
                  <span className="step-text">
                    Follow the on-screen guidance for each prototype
                  </span>
                </div>
              </div>
            </div>

            <div className="tips-card">
              <h3 className="tips-title">📸 Photography Tips</h3>
              <p className="tips-intro">
                For best results when photographing your specimen:
              </p>
              <ul className="tips-list">
                <li className="tip-item">
                  <strong>One object per photo</strong> Focus on a single
                  specimen
                </li>
                <li className="tip-item">
                  <strong>Include a scale reference</strong> Place a coin,
                  scale, ruler or your hand next to the object
                </li>
                <li className="tip-item">
                  <strong>Plain background</strong> Use a white or flat surface
                  with good contrast to your object's color.
                </li>
                <li className="tip-item">
                  <strong>Multiple angles and distances</strong> Capture photos
                  from different perspectives
                </li>
                <li className="tip-item">
                  <strong>Good lighting</strong> Ensure bright, even lighting
                  with minimal shadows
                </li>
                <li className="tip-item">
                  <strong>Hold steady</strong> Keep your phone still to avoid
                  blurry images
                </li>
              </ul>
            </div>

            <div className="details-card">
              <h2 className="section-title">Submission Information</h2>

              <div className="input-group">
                <label htmlFor="username" className="input-label">
                  <User className="label-icon" />
                  <span>Username</span>
                </label>
                <input
                  id="username"
                  type="text"
                  placeholder="Enter a username"
                  value={submissionDetails.username}
                  onChange={(e) =>
                    setSubmissionDetails({
                      ...submissionDetails,
                      username: e.target.value,
                    })
                  }
                  disabled={inputsLocked}
                  className="text-input"
                />
                <p className="input-hint">
                  You'll need this username for the survey at the end
                </p>
              </div>

              <div className="input-group">
                <label htmlFor="title" className="input-label">
                  <FileText className="label-icon" />
                  <span>Title</span>
                </label>
                <input
                  id="title"
                  type="text"
                  placeholder="Enter submission title"
                  value={submissionDetails.title}
                  onChange={(e) =>
                    setSubmissionDetails({
                      ...submissionDetails,
                      title: e.target.value,
                    })
                  }
                  disabled={inputsLocked}
                  className="text-input"
                />
              </div>

              <div className="input-group">
                <label htmlFor="location" className="input-label">
                  <MapPin className="label-icon" />
                  <span>Location</span>
                </label>
                <input
                  id="location"
                  type="text"
                  placeholder="Coordinates or location name"
                  value={submissionDetails.location}
                  onChange={(e) =>
                    setSubmissionDetails({
                      ...submissionDetails,
                      location: e.target.value,
                    })
                  }
                  disabled={inputsLocked}
                  className="text-input"
                />
              </div>
              {inputsLocked && (
                <div className="locked-note">
                  Submission details locked after starting the first prototype
                </div>
              )}
            </div>

            <div className="protocol-section">
              <h2 className="section-title">Prototypes</h2>
              <div className="protocol-grid">
                {prototypesToShow.map((num) => {
                  const props = {
                    1: {
                      title: "Baseline",
                      description: "Standard fossil photo capture",
                    },
                    2: {
                      title: "Post-capture Feedback",
                      description: "Detailed image analysis after capture",
                    },
                    3: {
                      title: "Real-time Feedback",
                      description: "Immediate feedback during capture",
                    },
                  }[num];

                  return (
                    <ProtocolCard
                      key={num}
                      number={num}
                      title={props.title}
                      description={props.description}
                      onClick={() => startNewSubmission(num)}
                      isCompleted={completedPrototypes.includes(num)}
                      disabled={false}
                    />
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="home-footer-section">
        <button onClick={() => setShowGdprModal(true)} className="gdpr-link">
          GDPR Compliance & Privacy Policy
        </button>
      </div>

      {/* GDPR MODAL */}
      {showGdprModal && (
        <div className="modal-overlay" onClick={() => setShowGdprModal(false)}>
          <div
            className="modal-content gdpr-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>GDPR Compliance & Privacy Policy</h3>
              <button
                className="modal-close"
                onClick={() => setShowGdprModal(false)}
              >
                <AiOutlineClose />
              </button>
            </div>
            <div className="modal-body">
              <h4>Data Collection and Usage</h4>
              <p>
                This research application is conducted by Fontys University of
                Applied Sciences. We collect and process the following data:
              </p>
              <ul>
                <li>Username (pseudonymized identifier)</li>
                <li>Submission title and location information</li>
                <li>Images uploaded through the application</li>
                <li>Interaction data with the three prototype interfaces</li>
              </ul>

              <h4>Purpose of Data Processing</h4>
              <p>
                The data collected is used solely for research purposes to
                evaluate and improve image quality feedback mechanisms for
                fossil documentation systems.
              </p>

              <h4>Data Storage and Security</h4>
              <p>
                All data is stored via Supabase on AWS EU-West servers and is
                protected in accordance with GDPR regulations. Your data will be
                retained only for the duration necessary to complete the
                research study.
              </p>

              <h4>Your Rights</h4>
              <p>Under GDPR, you have the right to:</p>
              <ul>
                <li>Access your personal data</li>
                <li>Request correction of your data</li>
                <li>Request deletion of your data</li>
                <li>Withdraw consent at any time</li>
              </ul>

              <h4>Contact Information</h4>
              <p>
                For questions about data privacy or to exercise your rights,
                please contact m.spielberg@student.fontys.nl
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
