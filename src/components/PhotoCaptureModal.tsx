'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Camera, X, RotateCcw, Check, Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface PhotoCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  title?: string;
  description?: string;
}

export function PhotoCaptureModal({
  isOpen,
  onClose,
  onCapture,
  title = 'Capture Photo',
  description = 'Please allow camera access to capture your photo for attendance.'
}: PhotoCaptureModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      resetCapture();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError(null);
      setPermissionDenied(false);
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }
      
      // Check if running on secure context (HTTPS or localhost)
      if (!window.isSecureContext && window.location.protocol !== 'https:' && !window.location.hostname.includes('localhost')) {
        throw new Error('Camera access requires HTTPS or localhost');
      }
      
      // Check existing permissions
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (permissionStatus.state === 'denied') {
          setPermissionDenied(true);
          setError('Camera permission was denied. Please enable it in your browser settings or use file upload instead.');
          toast.error('Camera permission denied', {
            description: 'You can upload a photo file instead.',
            duration: 5000
          });
          return;
        }
      } catch (permError) {
        // Permission query not supported, continue anyway
        console.log('Permission query not supported, continuing...');
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setPermissionDenied(true);
      
      let errorMessage = 'Unable to access camera. ';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage += 'Camera permission was denied. Please allow camera access in your browser settings or use file upload instead.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Camera is being used by another application.';
      } else {
        errorMessage += err.message || 'Please check your browser settings or use file upload instead.';
      }
      
      setError(errorMessage);
      toast.error('Camera access denied', {
        description: 'You can upload a photo file instead.',
        duration: 5000
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const resetCapture = () => {
    setCapturedPhoto(null);
    setPhotoFile(null);
    setError(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          setIsCapturing(false);
          toast.error('Failed to capture photo');
          return;
        }

        // Create file from blob
        const file = new File([blob], `attendance_${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });

        // Create preview URL
        const photoUrl = URL.createObjectURL(blob);
        setCapturedPhoto(photoUrl);
        setPhotoFile(file);
        setIsCapturing(false);
      }, 'image/jpeg', 0.9);
    } catch (err) {
      console.error('Error capturing photo:', err);
      toast.error('Failed to capture photo');
      setIsCapturing(false);
    }
  };

  const retakePhoto = () => {
    resetCapture();
    if (capturedPhoto) {
      URL.revokeObjectURL(capturedPhoto);
    }
  };

  const handleConfirm = () => {
    if (photoFile) {
      onCapture(photoFile);
      stopCamera();
      resetCapture();
      onClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    resetCapture();
    setShowFileUpload(false);
    setPermissionDenied(false);
    onClose();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Invalid file type', {
          description: 'Please select an image file (JPEG, PNG, etc.)'
        });
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File too large', {
          description: 'Please select an image smaller than 10MB'
        });
        return;
      }
      
      // Create preview
      const photoUrl = URL.createObjectURL(file);
      setCapturedPhoto(photoUrl);
      setPhotoFile(file);
      setShowFileUpload(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 mb-1">Camera Access Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
              {permissionDenied && (
                <div className="pt-2 border-t border-red-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowFileUpload(true);
                      setError(null);
                    }}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo Instead
                  </Button>
                </div>
              )}
            </div>
          ) : showFileUpload ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-3">
                  Select a photo from your device to upload for attendance verification.
                </p>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
                <p className="text-xs text-blue-600 mt-2">
                  Supported formats: JPEG, PNG, GIF, WebP (Max 10MB)
                </p>
              </div>
              {capturedPhoto && (
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <img
                    src={capturedPhoto}
                    alt="Selected photo"
                    className="w-full h-auto max-h-[400px] object-contain"
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              {!capturedPhoto ? (
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto max-h-[400px] object-contain"
                  />
                  {!stream && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                      <div className="text-white text-center">
                        <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Starting camera...</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <img
                    src={capturedPhoto}
                    alt="Captured photo"
                    className="w-full h-auto max-h-[400px] object-contain"
                  />
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isCapturing}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          
          {capturedPhoto ? (
            <>
              <Button
                variant="outline"
                onClick={retakePhoto}
                disabled={isCapturing}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isCapturing || !photoFile}
              >
                <Check className="h-4 w-4 mr-2" />
                Confirm
              </Button>
            </>
          ) : showFileUpload ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setShowFileUpload(false);
                  setError(null);
                  startCamera();
                }}
              >
                <Camera className="h-4 w-4 mr-2" />
                Try Camera Again
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setShowFileUpload(true);
                  stopCamera();
                }}
                disabled={isCapturing}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Instead
              </Button>
              <Button
                onClick={capturePhoto}
                disabled={!stream || isCapturing}
              >
                <Camera className="h-4 w-4 mr-2" />
                {isCapturing ? 'Capturing...' : 'Capture Photo'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


