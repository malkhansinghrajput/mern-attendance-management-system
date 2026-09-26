import { useState, useRef, useCallback } from 'react';

/**
 * Hook for managing live camera capture via getUserMedia.
 * Handles the full camera lifecycle: open → capture → cleanup.
 */
export const useCamera = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [capturedPreview, setCapturedPreview] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Opens the camera and starts live stream.
   */
  const openCamera = useCallback(async () => {
    setError(null);
    setCapturedBlob(null);
    setCapturedPreview(null);
    setIsLoading(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Your browser does not support camera capture. Please use a modern browser.');
      setIsLoading(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      streamRef.current = stream;

      // Attach stream to video element on next tick
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setIsOpen(true);
        setIsLoading(false);
      }, 100);
    } catch (err) {
      setIsLoading(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is in use by another application. Please close it and try again.');
      } else {
        setError(`Camera error: ${err.message}`);
      }
    }
  }, []);

  /**
   * Captures the current video frame and converts to a Blob.
   */
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setCapturedPreview(canvas.toDataURL('image/jpeg', 0.8));
          stopCamera(); // Stop stream after capture
        }
      },
      'image/jpeg',
      0.8
    );
  }, []);

  /**
   * Retakes photo — clears capture and re-opens camera.
   */
  const retakePhoto = useCallback(() => {
    setCapturedBlob(null);
    setCapturedPreview(null);
    openCamera();
  }, [openCamera]);

  /**
   * Stops the camera stream and cleans up resources.
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsOpen(false);
  }, []);

  /**
   * Full reset — close camera, clear all state.
   */
  const reset = useCallback(() => {
    stopCamera();
    setCapturedBlob(null);
    setCapturedPreview(null);
    setError(null);
  }, [stopCamera]);

  return {
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
  };
};
