import { useEffect } from 'react';
import { useCamera } from '../../hooks/useCamera';
import Button from '../common/Button';
import '../../styles/components.css';

/**
 * CameraCapture — live camera capture component.
 * Uses getUserMedia — NO <input type="file"> allowed.
 * Calls onCapture(blob) when user confirms a photo.
 */
const CameraCapture = ({ onCapture, onReset }) => {
  const {
    videoRef,
    canvasRef,
    isOpen,
    capturedBlob,
    capturedPreview,
    error,
    isLoading,
    openCamera,
    capturePhoto,
    retakePhoto,
    stopCamera,
    reset,
  } = useCamera();

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const handleConfirm = () => {
    if (capturedBlob) {
      onCapture(capturedBlob);
    }
  };

  const handleReset = () => {
    reset();
    if (onReset) onReset();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <span>🚫</span>
          <span>{error}</span>
        </div>
      )}

      {/* Camera / Preview Area */}
      <div className="camera-container">
        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="camera-canvas" aria-hidden="true" />

        {!isOpen && !capturedPreview && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📷</div>
            <p style={{ fontSize: '0.875rem' }}>Camera preview will appear here</p>
          </div>
        )}

        {isOpen && !capturedPreview && (
          <>
            <video
              ref={videoRef}
              className="camera-video"
              autoPlay
              playsInline
              muted
              aria-label="Live camera preview"
            />
            <div className="camera-overlay" aria-hidden="true" />
          </>
        )}

        {capturedPreview && (
          <img
            src={capturedPreview}
            alt="Captured selfie preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-lg)' }}
          />
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {!isOpen && !capturedPreview && (
          <Button
            variant="primary"
            onClick={openCamera}
            loading={isLoading}
            id="btn-open-camera"
          >
            📷 Open Camera
          </Button>
        )}

        {isOpen && !capturedPreview && (
          <>
            <Button variant="success" onClick={capturePhoto} id="btn-capture-photo">
              📸 Capture
            </Button>
            <Button variant="ghost" onClick={stopCamera} id="btn-close-camera">
              ✕ Cancel
            </Button>
          </>
        )}

        {capturedPreview && (
          <>
            <Button variant="success" onClick={handleConfirm} id="btn-confirm-photo">
              ✅ Use This Photo
            </Button>
            <Button variant="ghost" onClick={retakePhoto} id="btn-retake-photo">
              🔄 Retake
            </Button>
          </>
        )}

        {(capturedPreview || isOpen) && (
          <Button variant="ghost" size="sm" onClick={handleReset} id="btn-reset-camera">
            Reset
          </Button>
        )}
      </div>

      {capturedPreview && (
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-success)' }}>
          ✅ Photo captured. Click "Use This Photo" to confirm or "Retake" to try again.
        </p>
      )}
    </div>
  );
};

export default CameraCapture;
