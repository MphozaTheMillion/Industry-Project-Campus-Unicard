"use client"

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void;
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user' 
        },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      if (err instanceof DOMException) {
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
              setError("Camera permission denied. Please allow camera access in your browser settings.");
          } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
              setError("No camera found. Please ensure a camera is connected and enabled.");
          } else {
              setError("An error occurred while accessing the camera.");
          }
      } else {
        setError("An unknown error occurred while accessing the camera.");
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        // Set canvas dimensions to match video to maintain aspect ratio
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        onCapture(dataUrl);
        stopCamera();
      }
    }
  };

  if (error) {
    return (
        <Alert variant="destructive">
            <VideoOff className="h-4 w-4" />
            <AlertTitle>Camera Error</AlertTitle>
            <AlertDescription>
                {error}
                <Button variant="secondary" size="sm" onClick={startCamera} className="mt-4">
                    Retry
                </Button>
            </AlertDescription>
        </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden border">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {!stream && (
            <div className="absolute inset-0 flex items-center justify-center">
                <p>Starting camera...</p>
            </div>
        )}
      </div>
      <Button onClick={handleCapture} disabled={!stream} className="w-full">
        <Camera className="mr-2 h-4 w-4" />
        Take Photo
      </Button>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
