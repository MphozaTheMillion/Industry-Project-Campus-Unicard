"use client"

import Link from 'next/link';
import { CreditCard, Eye, LogIn, ArrowRight } from 'lucide-react';
import { useUser } from '@/contexts/user-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const ActionCard = ({ href, icon, title, shortDescription, longDescription }: { href: string; icon: React.ReactNode; title: string; shortDescription: string; longDescription: string }) => (
    <Link href={href} className="block group">
        <Card className="hover:shadow-xl hover:border-primary/50 transition-all duration-300 h-full flex flex-col">
            <CardContent className="p-6 flex-grow">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg text-primary">
                            {icon}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">{title}</h3>
                            <p className="text-sm text-muted-foreground">{shortDescription}</p>
                        </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-muted-foreground mt-4 text-sm">
                    {longDescription}
                </p>
            </CardContent>
        </Card>
    </Link>
);

export default function DashboardPage() {
  const { user, loading } = useUser();
  
  if (loading) {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-6 w-3/4" />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                <Skeleton className="h-56 w-full" />
                <Skeleton className="h-56 w-full" />
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
  
  return (
    <div className="space-y-8">
        <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-foreground">Welcome, {user.name.split(' ')[0]}!</h1>
            <p className="text-muted-foreground md:text-lg">Manage your digital ID card from here.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
           <ActionCard 
                href="/dashboard/create-card"
                icon={<CreditCard className="h-6 w-6" />}
                title="Create Digital Card"
                shortDescription="Get your new ID card."
                longDescription="Use your device's camera to take a professional photo and generate your new digital ID card."
           />
           <ActionCard 
                href="/dashboard/view-card"
                icon={<Eye className="h-6 w-6" />}
                title="View Digital Card"
                shortDescription="Display your current ID."
                longDescription="Display your existing digital ID card. You can show this card for verification on campus."
           />
        </div>
    </div>
  );
}
