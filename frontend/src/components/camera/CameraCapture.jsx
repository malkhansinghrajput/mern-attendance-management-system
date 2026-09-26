import { useEffect } from 'react';
import { useCamera } from '../../hooks/useCamera';
import Button from '../common/Button';
import '../../styles/components.css';

/**
 * CameraCapture — live camera capture component.
 * Uses getUserMedia — NO <input type="file"> allowed.
 * Calls onCapture(blob) when user confirms a photo.
 */
const CameraCapture = ({ onCapture, onReset, autoOpen = true }) => {
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

  // Auto-open camera on mount if requested
  useEffect(() => {
    if (autoOpen && !isOpen && !capturedPreview) {
      openCamera();
    }
    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, [autoOpen, openCamera, stopCamera]);

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
          <span style={{ fontSize: '0.85rem' }}>{error}</span>
        </div>
      )}

      {/* Camera / Preview Container */}
      <div className="camera-container" style={{ position: 'relative', minHeight: '260px', backgroundColor: '#0b0b14' }}>
        {/* Hidden canvas for taking snapshot */}
        <canvas ref={canvasRef} style={{ display: 'none' }} aria-hidden="true" />

        {/* Video Element — ALWAYS kept in DOM so stream attaches immediately */}
        <video
          ref={videoRef}
          className="camera-video"
          autoPlay
          playsInline
          muted
          aria-label="Live camera preview"
          style={{
            display: isOpen && !capturedPreview ? 'block' : 'none',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: 'var(--radius-lg)',
          }}
        />

        {/* Live Indicator Overlay */}
        {isOpen && !capturedPreview && (
          <>
            <div className="camera-overlay" aria-hidden="true" />
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600,
              }}
            >
              <span className="status-dot active" />
              LIVE CAMERA
            </div>
          </>
        )}

        {/* Loading Spinner */}
        {isLoading && !capturedPreview && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', background: 'rgba(15,15,26,0.9)' }}>
            <div className="spinner spinner-md spinner-primary" />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Accessing camera...</p>
          </div>
        )}

        {/* Idle State (when camera is closed and no photo taken) */}
        {!isOpen && !capturedPreview && !isLoading && (
          <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📷</div>
            <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Click below to start your camera</p>
            <Button variant="primary" size="sm" onClick={openCamera}>
              📷 Start Camera
            </Button>
          </div>
        )}

        {/* Captured Photo Preview */}
        {capturedPreview && (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <img
              src={capturedPreview}
              alt="Captured selfie preview"
              style={{
                width: '100%',
                height: '100%',
                maxHeight: '320px',
                objectFit: 'cover',
                borderRadius: 'var(--radius-lg)',
                display: 'block',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(4px)',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                color: '#60a5fa',
                fontWeight: 600,
              }}
            >
              📸 PHOTO CAPTURED
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {isOpen && !capturedPreview && (
          <>
            <Button variant="success" size="lg" onClick={capturePhoto} id="btn-capture-photo">
              📸 Capture Photo
            </Button>
            <Button variant="ghost" onClick={stopCamera} id="btn-close-camera">
              ✕ Cancel
            </Button>
          </>
        )}

        {capturedPreview && (
          <>
            <Button variant="success" size="lg" onClick={handleConfirm} id="btn-confirm-photo">
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
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-success)', margin: 0 }}>
          ✅ Photo captured! Click <strong>"Use This Photo"</strong> to proceed.
        </p>
      )}
    </div>
  );
};

export default CameraCapture;

