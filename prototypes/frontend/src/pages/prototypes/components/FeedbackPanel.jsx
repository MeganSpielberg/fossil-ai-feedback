import React from "react";
import { FileText } from "lucide-react";

function FeedbackPanel({ feedback, metrics }) {
  if (!feedback || feedback.length === 0) return null;

  return (
    <div className="feedback-panel">
      <div className="feedback-header">
        <FileText className="feedback-icon" />
        <h3>Image Analysis Feedback</h3>
      </div>

      <ul className="feedback-list">
        {feedback.map((item, idx) => (
          <li
            key={idx}
            className={`feedback-item ${item.type === "success" ? "success" : "warning"}`}
          >
            <span className="feedback-icon-emoji">
              {item.type === "success" ? "✅" : "⚠️"}
            </span>
            <span className="feedback-message">{item.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FeedbackPanel;
