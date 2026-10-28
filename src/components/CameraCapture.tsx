import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Upload, Check, AlertCircle } from 'lucide-react';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
  title?: string;
  aspectRatio?: 'card' | 'passport';
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Scan Document',
  aspectRatio = 'card',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen && !previewImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, previewImage]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: unknown) {
      console.warn('Camera stream could not start:', err);
      setCameraError(
        'Camera is unavailable or permission was denied. You can select an image file from your device below.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const handleSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreviewImage(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setPreviewImage(result);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (previewImage) {
      onCapture(previewImage);
      handleClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    setPreviewImage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#1A1E24] border border-[#323945] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#282F3A] bg-[#14171D]">
          <div className="flex items-center gap-2 text-white font-medium">
            <Camera className="w-4 h-4 text-blue-400" />
            <span>{title}</span>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-[#242A35] hover:bg-[#303846] flex items-center justify-center text-gray-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport / Preview Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[280px]">
          {previewImage ? (
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <img
                src={previewImage}
                alt="Document snapshot"
                className="max-h-[380px] max-w-full rounded-xl object-contain shadow-lg"
              />
            </div>
          ) : (
            <>
              {cameraActive ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Card Cutout Guide Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                    <div
                      className={`border-2 border-dashed border-blue-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] ${
                        aspectRatio === 'card'
                          ? 'w-full max-w-[340px] aspect-[1.58/1]'
                          : 'w-full max-w-[320px] aspect-[1.42/1]'
                      }`}
                    >
                      <div className="absolute top-2 left-2 text-[10px] uppercase font-mono tracking-wider bg-blue-500/80 text-white px-2 py-0.5 rounded">
                        Align {aspectRatio === 'card' ? 'Card Edges' : 'Passport Page'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm">
                  {cameraError ? (
                    <div className="flex flex-col items-center gap-3 text-gray-300">
                      <AlertCircle className="w-10 h-10 text-amber-400" />
                      <p className="text-xs text-gray-400">{cameraError}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                      <p className="text-xs text-gray-400">Initializing Pixel camera...</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Action Controls Footer */}
        <div className="p-4 bg-[#14171D] border-t border-[#282F3A] flex items-center justify-between gap-3">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#222832] hover:bg-[#2C3442] text-xs font-medium text-gray-200 transition"
          >
            <Upload className="w-4 h-4 text-gray-300" />
            <span>Upload Photo</span>
          </button>

          {previewImage ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPreviewImage(null);
                  startCamera();
                }}
                className="px-3.5 py-2.5 rounded-xl bg-[#222832] hover:bg-[#2C3442] text-xs font-medium text-gray-300 transition"
              >
                Retake
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Use Photo</span>
              </button>
            </div>
          ) : (
            cameraActive && (
              <button
                type="button"
                onClick={handleSnap}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg transition active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>Capture</span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
