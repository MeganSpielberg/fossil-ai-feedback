import React from 'react';
import { FileText } from 'lucide-react';

function FeedbackPanel({ feedback, metrics }) {
  if (!feedback) return null;

  return (
    <div className="feedback-panel">
      <div className="feedback-header">
        <FileText className="feedback-icon" />
        <h3>Image Analysis Feedback</h3>
      </div>

      <ul className="feedback-list">
        {feedback.map((item, idx) => (
          <li key={idx} className={`feedback-item ${item.type === 'success' ? 'success' : 'warning'}`}>
            {item.type === 'success' ? '✅' : '⚠️'} {item.message}
          </li>
        ))}
      </ul>

      {metrics && (
        <div className="metrics-grid">
          {Object.entries(metrics).map(([key, val]) => (
            <div key={key} className="metric-box">
              <span className="metric-key">{key.replace(/_/g, ' ')}</span>
              <span className="metric-value">{val}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FeedbackPanel;