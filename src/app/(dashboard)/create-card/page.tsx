
'use client';

import { useState, useEffect } from 'react';
import { Camera, ArrowLeft, User, Smile, Eye, Glasses, VenetianMask, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { CameraCapture } from '@/components/camera-capture';
import { IdCard } from '@/components/id-card';
import { useUser } from '@/contexts/user-context';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { validatePhoto, type ValidatePhotoOutput } from '@/ai/flows/validate-photo-flow';

const validationRules = [
  { text: 'Photo is from the neck up', icon: <User className="h-5 w-5 text-green-500" /> },
  { text: 'Look at the camera with a neutral expression', icon: <Smile className="h-5 w-5 text-green-500" /> },
  { text: 'Eyes are open and clearly visible', icon: <Eye className="h-5 w-5 text-green-500" /> },
  { text: 'No hats or glasses', icon: <Glasses className="h-5 w-5 text-red-500" /> },
];


export default function CreateCardPage() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidatePhotoOutput | null>(null);
  const { user, loading, setCardData } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Prevent rendering the page and redirect if the card is still valid.
    // This logic is moved into useEffect to prevent "Cannot update a component while rendering" errors.
    if (!loading && user?.cardGenerated && user.cardIssueDate) {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      if (user.cardIssueDate > oneYearAgo) {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, router]);


  const handlePhotoCapture = async (imageSrc: string) => {
    setCapturedImage(imageSrc); // Show the captured image immediately
    setIsValidating(true);
    setValidationResult(null); // Clear previous results

    try {
      const result = await validatePhoto({ photoDataUri: imageSrc });
      setValidationResult(result);
    } catch (error) {
      console.error('Validation failed:', error);
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Could not validate the photo. Please try again.',
      });
      // Treat as invalid if the validation service fails
      setValidationResult({ isValid: false, issues: [{ code: 'NOT_A_PERSON', feedback: 'An unexpected error occurred during validation.' }] });
    } finally {
      setIsValidating(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setValidationResult(null);
  };

  const handleSave = async () => {
    if (!capturedImage || !user?.uid) return;

    setIsSaving(true);
    try {
      const batch = writeBatch(firestore);
      const userDocRef = doc(firestore, 'userProfiles', user.uid);
      const cardDocRef = doc(firestore, 'userProfiles', user.uid, 'digitalIdCards', 'main');

      const cardIssueDate = new Date();
      const cardExpiryDate = new Date(cardIssueDate.getFullYear() + 1, cardIssueDate.getMonth(), cardIssueDate.getDate());

      // 1. Update user profile with the new photo
      batch.update(userDocRef, {
        profilePicture: capturedImage,
      });

      // 2. Create or update the digital ID card document with issue/expiry dates
      batch.set(cardDocRef, {
        id: 'main',
        userProfileId: user.uid,
        cardIssueDate: serverTimestamp(),
        cardExpiryDate: cardExpiryDate,
        cardStatus: 'active',
      }, { merge: true });

      await batch.commit();

      // Explicitly update the context after successful save
      setCardData({
        photo: capturedImage,
        cardGenerated: true,
        cardIssueDate: cardIssueDate,
      });

      toast({
        title: 'Success!',
        description: 'Your digital ID card has been created.',
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving card:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save your card. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const isSaveDisabled = isSaving || isValidating || !validationResult?.isValid;

  // While loading or if the user will be redirected, show nothing.
  if (loading || (user?.cardGenerated && user.cardIssueDate && new Date(new Date().setFullYear(new Date().getFullYear() - 1)) < user.cardIssueDate)) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
       <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center">
                <Camera className="mr-3 h-6 w-6" />
                {capturedImage ? 'Review Your Photo' : 'Take Your Photo'}
              </CardTitle>
              <CardDescription>
                Follow the guidelines to ensure your photo is accepted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {capturedImage ? (
                 <div className="space-y-4">
                  <div className="relative">
                    <Image
                      src={capturedImage}
                      alt="Captured profile"
                      width={1280}
                      height={720}
                      className="rounded-lg border"
                    />
                    {isValidating && (
                      <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center rounded-lg">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="mt-2 text-muted-foreground">Validating photo...</p>
                      </div>
                    )}
                  </div>

                  {validationResult && !validationResult.isValid && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Photo Rejected</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc pl-5 space-y-1">
                          {validationResult.issues.map((issue) => (
                            <li key={issue.code}>{issue.feedback}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" onClick={handleRetake} disabled={isSaving || isValidating}>
                      Retake Photo
                    </Button>
                    <Button onClick={handleSave} disabled={isSaveDisabled}>
                       {isSaving ? 'Saving...' : 'Save & Generate Card'}
                    </Button>
                  </div>
                </div>
              ) : (
                <CameraCapture onCapture={handlePhotoCapture} />
              )}
            </CardContent>
          </Card>
        </div>
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Photo Guidelines</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {validationRules.map((rule, index) => (
                        <li key={index} className="flex items-center text-sm">
                            {rule.icon}
                            <span className="ml-3">{rule.text}</span>
                        </li>
                        ))}
                    </ul>
                    <Alert className="mt-6">
                        <AlertTitle>Why these rules?</AlertTitle>
                        <AlertDescription>
                            A clear, professional photo ensures your digital ID is valid for all campus services and verification purposes.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

            <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Card Preview</h3>
                <div className="flex justify-center md:justify-start">
                    <IdCard photoOverride={capturedImage} />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
