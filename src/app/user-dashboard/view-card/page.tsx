
'use client';

import { useState } from 'react';
import { ArrowLeft, UserCheck, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { IdCard } from '@/components/id-card';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/user-context';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { LivenessCheck } from '@/components/liveness-check';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

type VerificationStatus = 'unverified' | 'verifying' | 'successful' | 'failed';

export default function ViewCardPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('unverified');
  const [showLivenessCheck, setShowLivenessCheck] = useState(false);


  const handleVerificationComplete = (success: boolean) => {
    if (success) {
      setVerificationStatus('successful');
    } else {
      setVerificationStatus('failed');
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="w-full max-w-sm h-[450px] rounded-2xl" />
        </div>
      );
    }
    
    if (!user?.photo) {
       return (
          <div className="text-center p-8 border-2 border-dashed rounded-lg">
            <p className="mb-4 text-muted-foreground">You haven't created a card yet.</p>
            <Button asChild>
                <Link href="/user-dashboard/create-card">Create Your Card Now</Link>
            </Button>
          </div>
        );
    }
    
    if (!showLivenessCheck) {
      return (
        <Card className="w-full max-w-lg text-center">
            <CardHeader>
              <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                  <UserCheck className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="mt-4">Identity Verification Required</CardTitle>
              <CardDescription>To keep your account secure, we need to quickly verify it's you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="text-left bg-muted p-4 rounded-md border text-sm">
                  <h4 className="font-semibold mb-2">You will be asked to:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Look straight at the camera.</li>
                      <li>Blink your eyes.</li>
                      <li>Turn your head to the right.</li>
                  </ul>
              </div>
              <Button onClick={() => setShowLivenessCheck(true)} size="lg" className="w-full">
                Begin Verification
              </Button>
            </CardContent>
          </Card>
      );
    }

    switch (verificationStatus) {
      case 'unverified':
      case 'verifying':
        return (
          <LivenessCheck
            originalPhoto={user.photo}
            onCompletion={handleVerificationComplete}
            onStatusChange={(status) => {
              if (status === 'verifying') {
                setVerificationStatus('verifying');
              }
            }}
          />
        );
      case 'failed':
        return (
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto bg-destructive/10 rounded-full p-3 w-fit">
                <ShieldAlert className="h-10 w-10 text-destructive" />
              </div>
              <CardTitle className="mt-4">Verification Failed</CardTitle>
              <CardDescription>We couldn't verify your identity. Please ensure you are in a well-lit area and follow the prompts carefully.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setVerificationStatus('unverified')}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        );
      case 'successful':
        return (
          <>
            <div className="flex flex-col items-center justify-center animate-in fade-in duration-500">
              <div className="text-center mb-8">
                 <div className="mx-auto bg-green-100 rounded-full p-3 w-fit mb-4">
                    <UserCheck className="h-10 w-10 text-green-600" />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    Verification Successful
                  </h1>
                  <p className="text-lg text-muted-foreground mt-2">
                    Your Digital ID Card is ready to view.
                  </p>
              </div>
              <IdCard />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="flex flex-col items-center justify-center">
        {renderContent()}
      </div>
    </div>
  );
}
