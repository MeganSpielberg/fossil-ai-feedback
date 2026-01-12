import React from "react";
import { X, Check } from "lucide-react";
import "../../../css/components/AlbumModal.css";

/**
 * Album modal.
 *
 * Shows captured images, lets the user delete images, and triggers final submit.
 */

function AlbumModal({
  isOpen,
  onClose,
  capturedImages,
  onDeleteImage,
  onSubmit,
  isSaving
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="album-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="album-modal-header">
          <h3>Captured Images ({capturedImages.length})</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="album-modal-body">
          {capturedImages.length === 0 ? (
            <p className="album-empty-message">No images captured yet</p>
          ) : (
            <div className="album-grid">
              {capturedImages.map((img) => (
                <div key={img.id} className="album-item">
                  <img src={img.data} alt="Captured" className="album-image" />
                  <button
                    className="album-delete-btn"
                    onClick={() => onDeleteImage(img.id)}
                    title="Delete image"
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="album-modal-footer">
          <button
            className="album-submit-btn"
            onClick={onSubmit}
            disabled={isSaving || capturedImages.length === 0}
          >
            <Check size={20} />
            {isSaving ? "Saving..." : `Submit ${capturedImages.length} Image${capturedImages.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AlbumModal;
