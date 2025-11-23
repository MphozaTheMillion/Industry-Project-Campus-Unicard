'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, VideoOff, Loader2, Smile, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { verifyLiveness } from '@/ai/flows/verify-liveness-flow';

interface LivenessCheckProps {
  originalPhoto: string;
  onCompletion: (success: boolean) => void;
  onStatusChange: (status: 'verifying' | 'idle') => void;
}

const LIVENESS_STEPS = [
  {
    prompt: "Look straight at the camera and hold a neutral expression.",
    action: "neutral",
    duration: 3000,
  },
  {
    prompt: "Now, please blink your eyes.",
    action: "blink",
    duration: 2000,
  },
  {
    prompt: "Finally, turn your head slightly to the right.",
    action: "turn_right",
    duration: 3000,
  },
];

export function LivenessCheck({ originalPhoto, onCompletion, onStatusChange }: LivenessCheckProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1); // -1 means not started

  const capturedImages = useRef<Record<string, string>>({});

  const startCamera = useCallback(async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraReady(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access the camera. Please grant permission and ensure a camera is connected.");
      setIsCameraReady(false);
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [startCamera]);

  const captureFrame = (): string | null => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        return canvas.toDataURL('image/jpeg');
      }
    }
    return null;
  };

  const runLivenessSteps = useCallback(async () => {
    setIsProcessing(true);
    for (let i = 0; i < LIVENESS_STEPS.length; i++) {
      setCurrentStepIndex(i);
      await new Promise(resolve => setTimeout(resolve, LIVENESS_STEPS[i].duration));
      const image = captureFrame();
      if (image) {
        capturedImages.current[LIVENESS_STEPS[i].action] = image;
      } else {
        setError("Failed to capture image. Please try again.");
        setIsProcessing(false);
        onCompletion(false);
        return;
      }
    }

    onStatusChange('verifying');
    const result = await verifyLiveness({
      originalPhotoDataUri: originalPhoto,
      neutralPhotoDataUri: capturedImages.current.neutral,
      blinkPhotoDataUri: capturedImages.current.blink,
      turnRightPhotoDataUri: capturedImages.current.turn_right,
    });

    onCompletion(result.isLive && result.isSamePerson);
    setIsProcessing(false);

  }, [onCompletion, onStatusChange, originalPhoto]);


  if (error) {
    return (
      <Alert variant="destructive">
        <VideoOff className="h-4 w-4" />
        <AlertTitle>Camera Error</AlertTitle>
        <AlertDescription>
          {error}
          <Button variant="secondary" size="sm" onClick={startCamera} className="mt-4">
            Retry Camera
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const currentStep = LIVENESS_STEPS[currentStepIndex];
  const progress = currentStepIndex >= 0 ? ((currentStepIndex + 1) / LIVENESS_STEPS.length) * 100 : 0;

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <CardTitle>Liveness Verification</CardTitle>
        <CardDescription>Please follow the instructions on the screen to verify your identity.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden border">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            onCanPlay={() => setIsCameraReady(true)}
          />
          {!isCameraReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="mt-2">Starting camera...</p>
            </div>
          )}
           {isProcessing && currentStep && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white p-4 text-center">
              <p className="text-2xl font-bold">{currentStep.prompt}</p>
            </div>
          )}
        </div>
        
        {isProcessing ? (
          <div className="space-y-2">
             <Progress value={progress} className="w-full" />
             <p className="text-center text-sm text-muted-foreground">Step {currentStepIndex + 1} of {LIVENESS_STEPS.length}</p>
          </div>
        ) : (
          <Button onClick={runLivenessSteps} disabled={!isCameraReady || isProcessing} className="w-full">
            Start Verification <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
}
