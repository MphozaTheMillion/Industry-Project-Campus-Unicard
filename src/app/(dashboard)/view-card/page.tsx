'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { IdCard } from '@/components/id-card';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/user-context';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function ViewCardPage() {
  const router = useRouter();
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="w-full max-w-sm h-[450px] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-2">
          Your Digital ID Card
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Present this card for verification on campus.
        </p>

        {user?.photo ? (
          <IdCard />
        ) : (
          <div className="text-center p-8 border-2 border-dashed rounded-lg">
            <p className="mb-4 text-muted-foreground">You haven't created a card yet.</p>
            <Button asChild>
                <Link href="/create-card">Create Your Card Now</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
