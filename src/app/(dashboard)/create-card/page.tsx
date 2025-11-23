'use client';

import { useState } from 'react';
import { Camera, ArrowLeft, User, Smile, Eye, Glasses, VenetianMask } from 'lucide-react';
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
import { doc, updateDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const validationRules = [
  { text: 'Photo is from the neck up', icon: <User className="h-5 w-5 text-green-500" /> },
  { text: 'Look at the camera with a neutral expression', icon: <Smile className="h-5 w-5 text-green-500" /> },
  { text: 'Eyes are open and clearly visible', icon: <Eye className="h-5 w-5 text-green-500" /> },
  { text: 'No hats or glasses', icon: <Glasses className="h-5 w-5 text-red-500" /> },
  { text: 'No shadows or reflections', icon: <VenetianMask className="h-5 w-5 text-red-500" /> },
];


export default function CreateCardPage() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { user, setPhoto, setCardGenerated } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handlePhotoCapture = (imageSrc: string) => {
    setPhoto(imageSrc);
    setCapturedImage(imageSrc);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setPhoto(null);
  };

  const handleSave = async () => {
    if (!capturedImage || !user?.uid) return;

    setIsSaving(true);
    try {
      const userDocRef = doc(firestore, 'userProfiles', user.uid);
      await updateDoc(userDocRef, {
        profilePicture: capturedImage,
      });

      setCardGenerated(true);

      toast({
        title: 'Success!',
        description: 'Your digital ID card has been created.',
      });
      router.push('/dashboard/view-card');
    } catch (error) {
      console.error('Error saving photo:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save your photo. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

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
                  <Image
                    src={capturedImage}
                    alt="Captured profile"
                    width={1280}
                    height={720}
                    className="rounded-lg border"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" onClick={handleRetake}>Retake Photo</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
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
                    <IdCard />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
