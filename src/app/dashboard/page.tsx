"use client"

import Link from 'next/link';
import { CreditCard, Eye, LogIn } from 'lucide-react';
import { useUser } from '@/contexts/user-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, loading } = useUser();
  
  if (loading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-6 w-1/2" />
            <div className="grid md:grid-cols-2 gap-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-full">
        <h1 className="text-2xl font-bold mb-2">You are not logged in</h1>
        <p className="text-muted-foreground mb-4">Please log in to access your dashboard.</p>
        <Button asChild>
          <Link href="/login"><LogIn className="mr-2 h-4 w-4" /> Login</Link>
        </Button>
      </div>
    )
  }

  // Fallback for unexpected user types, though the login logic should prevent this.
  if (user.userType !== 'student' && user.userType !== 'campus_staff') {
    return (
        <div className="text-center">
            <h1 className="text-3xl font-bold font-headline">Welcome, {user.name}</h1>
            <p className="text-muted-foreground mt-2">Your dashboard is under construction.</p>
        </div>
    )
  }

  return (
    <div className="space-y-6">
        <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold font-headline">Welcome, {user.name}</h1>
            <p className="text-muted-foreground md:text-lg">Manage your digital ID and access campus services.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <CreditCard className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>Create Digital Card</CardTitle>
                    <CardDescription>Generate your new secure digital ID card by taking a photo.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full">
                        <Link href="/dashboard/create-card">Create Your Card</Link>
                    </Button>
                </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <Eye className="h-8 w-8 text-accent mb-2" />
                    <CardTitle>View Digital Card</CardTitle>
                    <CardDescription>Display your existing digital ID card for verification and access.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full" variant="secondary">
                        <Link href="/dashboard/view-card">View Your Card</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
