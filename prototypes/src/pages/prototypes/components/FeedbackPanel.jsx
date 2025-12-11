import React from "react";
import { FileText } from "lucide-react";
import "../../../css/components/FeedbackPanel.css";

function FeedbackPanel({ feedback, children, compact = false }) {
  if (!feedback || feedback.length === 0) return null;

  const panelClass = compact ? "feedback-panel compact" : "feedback-panel";

  return (
    <div className={panelClass}>
      <div className="feedback-header">
        <FileText className="feedback-icon" />
        <h3>Image Analysis Feedback</h3>
      </div>

      {children}

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
