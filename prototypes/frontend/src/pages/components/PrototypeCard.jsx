import React from 'react';
import { Camera, Check } from 'lucide-react';

function ProtocolCard({ number, title, description, onClick, isCompleted }) {
  return (
    <button 
      onClick={onClick} 
      className={`protocol-card ${isCompleted ? 'completed' : ''}`}
      disabled={isCompleted}
    >
      {isCompleted && (
        <div className="completion-indicator">
          <Check className="check-icon" />
        </div>
      )}
      <div className="protocol-number">{number}</div>
      <h3 className="protocol-title">{title}</h3>
      <p className="protocol-desc">{description}</p>
      {isCompleted && <span className="completed-text">Completed</span>}
    </button>
  );
}

export default ProtocolCard;