"use client"

import { useState } from 'react';
import { Camera, CheckCircle, RefreshCw } from 'lucide-react';

import { useUser } from '@/contexts/user-context';
import { IdCard } from '@/components/id-card';
import { CameraCapture } from '@/components/camera-capture';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type CreationStep = 'capture' | 'preview' | 'generated';

export default function DashboardPage() {
  const { user, setPhoto, setCardGenerated } = useUser();
  const [step, setStep] = useState<CreationStep>(user.cardGenerated ? 'generated' : 'capture');
  const [capturedImage, setCapturedImage] = useState<string | null>(user.photo);

  const handleCapture = (imageSrc: string) => {
    setCapturedImage(imageSrc);
    setStep('preview');
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setStep('capture');
  };

  const handleGenerateCard = () => {
    if (capturedImage) {
      setPhoto(capturedImage);
      setCardGenerated(true);
      setStep('generated');
    }
  };

  const renderContent = () => {
    if (step === 'generated' || user.cardGenerated) {
      return (
        <div className="flex flex-col items-center gap-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold font-headline text-primary">Your Digital ID Card</h1>
                <p className="text-muted-foreground mt-2">Here is your official digital ID. You can now use it to access campus services.</p>
            </div>
            <IdCard />
        </div>
      );
    }
    
    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl font-headline">Create Your Digital ID</CardTitle>
                <CardDescription>Follow the steps below to generate your secure digital ID card.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {/* Step 1: Capture Photo */}
                    <div>
                        <div className="flex items-center gap-4">
                            <div className={`flex items-center justify-center h-10 w-10 rounded-full ${step === 'capture' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                <Camera className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Step 1: Take Your Photo</h3>
                                <p className="text-sm text-muted-foreground">
                                    {step !== 'capture' ? "Photo captured successfully." : "Position your face in the center of the frame."}
                                </p>
                            </div>
                            {step !== 'capture' && <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />}
                        </div>
                        {step === 'capture' && (
                            <div className="pl-14 pt-4">
                                <CameraCapture onCapture={handleCapture} />
                            </div>
                        )}
                    </div>
                    {/* Step 2: Preview & Generate */}
                    {step === 'preview' && (
                        <div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground">
                                    <CheckCircle className="h-5 w-5" />
                                </div>
                                <h3 className="font-semibold">Step 2: Preview and Generate</h3>
                            </div>
                            <div className="pl-14 pt-4 space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Looks great! If you're happy with your photo, generate your ID card.
                                </p>
                                {capturedImage && (
                                    <img src={capturedImage} alt="Captured photo" className="rounded-lg border shadow-sm w-full max-w-xs mx-auto" />
                                )}
                                <div className="flex justify-center gap-4">
                                    <Button variant="outline" onClick={handleRetake}>
                                        <RefreshCw className="mr-2 h-4 w-4" /> Retake
                                    </Button>
                                    <Button onClick={handleGenerateCard}>Generate ID Card</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
  };

  return (
    <div>
      {renderContent()}
    </div>
  );
}
