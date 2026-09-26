import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook for managing live camera capture via getUserMedia.
 * Handles the full camera lifecycle: open → stream attachment → capture → cleanup.
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

  // Helper to attach stream to video element
  const attachStreamToVideo = useCallback((stream) => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch((e) => {
          console.warn('Auto-play was prevented:', e);
        });
      };
      // Trigger play directly as well
      videoRef.current.play().catch(() => {});
    }
  }, []);

  // Whenever isOpen or stream changes, ensure video stream is attached
  useEffect(() => {
    if (isOpen && streamRef.current && videoRef.current) {
      attachStreamToVideo(streamRef.current);
    }
  }, [isOpen, attachStreamToVideo]);

  /**
   * Opens the camera and starts live stream.
   */
  const openCamera = useCallback(async () => {
    setError(null);
    setCapturedBlob(null);
    setCapturedPreview(null);
    setIsLoading(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Your browser does not support camera capture. Please use Chrome, Edge, or Firefox.');
      setIsLoading(false);
      return;
    }

    try {
      // First set isOpen so the video element is mounted in DOM
      setIsOpen(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      attachStreamToVideo(stream);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      setIsOpen(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings (look for camera icon in address bar).');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found on this device. Please connect a webcam.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is in use by another application. Please close other apps using the camera.');
      } else {
        setError(`Camera error: ${err.message || 'Unable to access camera'}`);
      }
    }
  }, [attachStreamToVideo]);

  /**
   * Captures the current video frame and converts to a Blob.
   */
  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      setError('Camera is not ready. Please try again.');
      return;
    }

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror the captured image horizontally to match the selfie view
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, width, height);

    // Get base64 preview immediately for UI
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPreview(dataUrl);

    // Convert to Blob for upload
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
        } else {
          // Fallback if toBlob fails
          const byteString = atob(dataUrl.split(',')[1]);
          const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const fallbackBlob = new Blob([ab], { type: mimeString });
          setCapturedBlob(fallbackBlob);
        }
        stopCamera();
      },
      'image/jpeg',
      0.85
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
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore error
        }
      });
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

