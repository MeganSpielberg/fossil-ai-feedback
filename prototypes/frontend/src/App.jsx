import React, { useState } from 'react';
import HomePage from './pages/HomePage';
import Prototype1 from './pages/prototypes/Prototype1';
import Prototype2 from './pages/prototypes/Prototype2';
import Prototype3 from './pages/prototypes/Prototype3';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [submissionDetails, setSubmissionDetails] = useState({
    title: '',
    location: ''
  });
  const [currentSubmissionId, setCurrentSubmissionId] = useState(null);
  const [completedPrototypes, setCompletedPrototypes] = useState([]);

  const startNewSubmission = (prototypeNum) => {
    if (completedPrototypes.includes(prototypeNum)) {
      alert(`Prototype ${prototypeNum} has already been completed for this submission`);
      return;
    }

    if (!submissionDetails.title.trim() || !submissionDetails.location.trim()) {
      alert('Please enter both Title/Name and Location before starting');
      return;
    }
    
    if (!currentSubmissionId) {
      const submissionId = `${Date.now()}_${submissionDetails.title.replace(/[^a-zA-Z0-9]/g, '_')}`;
      setCurrentSubmissionId(submissionId);
    }
    
    setCurrentPage(`prototype${prototypeNum}`);
  };

  const markPrototypeComplete = (prototypeNum) => {
    const newCompleted = [...completedPrototypes, prototypeNum];
    setCompletedPrototypes(newCompleted);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage 
            submissionDetails={submissionDetails}
            setSubmissionDetails={setSubmissionDetails}
            startNewSubmission={startNewSubmission}
            completedPrototypes={completedPrototypes}
          />
        );
      case 'prototype1':
        return (
          <Prototype1
            setCurrentPage={setCurrentPage}
            submissionId={currentSubmissionId}
            submissionDetails={submissionDetails}
            markPrototypeComplete={markPrototypeComplete}
          />
        );
      case 'prototype2':
        return (
          <Prototype2
            setCurrentPage={setCurrentPage}
            submissionId={currentSubmissionId}
            submissionDetails={submissionDetails}
            markPrototypeComplete={markPrototypeComplete}
          />
        );
      case 'prototype3':
        return (
          <Prototype3
            setCurrentPage={setCurrentPage}
            submissionId={currentSubmissionId}
            submissionDetails={submissionDetails}
            markPrototypeComplete={markPrototypeComplete}
          />
        );
      default:
        return (
          <HomePage 
            submissionDetails={submissionDetails}
            setSubmissionDetails={setSubmissionDetails}
            startNewSubmission={startNewSubmission}
            completedPrototypes={completedPrototypes}
          />
        );
    }
  };

  return (
    <div className="app-container">
      {renderPage()}
    </div>
  );
}

export default App;