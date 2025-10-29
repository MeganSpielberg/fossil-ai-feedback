import React from "react";
import { ImageIcon, Save } from "lucide-react";

function ImageReview({
  capturedImages,
  onDeleteImage,
  onEndTesting,
  isSaving,
  disabled,
}) {
  if (capturedImages.length === 0) return null;

  return (
    <div className="image-review">
      <div className="review-header">
        <ImageIcon className="review-icon" />
        <span>Captured Images ({capturedImages.length})</span>
      </div>
      <div className="thumbnail-grid">
        {capturedImages.map((img) => (
          <div key={img.id} className="thumbnail">
            <img src={img.data} alt="Captured" />
            <button
              onClick={() => onDeleteImage(img.id)}
              className="delete-btn"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={onEndTesting}
        className="save-btn"
        disabled={disabled || isSaving}
      >
        <Save />
        <span>
          {isSaving
            ? "Saving Documentation..."
            : `Save ${capturedImages.length} Image${
                capturedImages.length > 1 ? "s" : ""
              }`}
        </span>
      </button>
    </div>
  );
}

export default ImageReview;
