import React from 'react';
import { FileText, MapPin } from 'lucide-react';
import ProtocolCard from './components/PrototypeCard';

function HomePage({ submissionDetails, setSubmissionDetails, startNewSubmission, completedPrototypes }) {
  return (
    <div className="home-page">
      <div className="home-header-section">
        <h1 className="app-title">Fossil submission app</h1>
        <p className="app-subtitle">Image quality feedback mechanisms</p>
      </div>

      <div className="home-content">
        <div className="details-card">
          <h2 className="section-title">Submission Information</h2>
          
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
              onChange={(e) => setSubmissionDetails({...submissionDetails, title: e.target.value})}
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
              onChange={(e) => setSubmissionDetails({...submissionDetails, location: e.target.value})}
              className="text-input"
            />
          </div>
        </div>

        <div className="protocol-section">
          <h2 className="section-title">Prototypes</h2>
          <div className="protocol-grid">
            <ProtocolCard
              number={1}
              title="Baseline"
              description="Standard fossil photo capture"
              onClick={() => startNewSubmission(1)}
              isCompleted={completedPrototypes.includes(1)}
            />
            <ProtocolCard
              number={2}
              title="Post-capture Feedback"
              description="Detailed image analysis after capture"
              onClick={() => startNewSubmission(2)}
              isCompleted={completedPrototypes.includes(2)}
            />
            <ProtocolCard
              number={3}
              title="Real-time Feedback"
              description="Immediate feedback during capture"
              onClick={() => startNewSubmission(3)}
              isCompleted={completedPrototypes.includes(3)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;