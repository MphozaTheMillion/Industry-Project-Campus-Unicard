
'use client';

import Link from 'next/link';
import { ArrowRight, CreditCard, Eye, Lock } from 'lucide-react';
import { useUser } from '@/contexts/user-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, addYears } from 'date-fns';

function DashboardCard({
  href,
  icon,
  title,
  subtitle,
  description,
  disabled = false,
  disabledReason,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const content = (
      <Card className={`h-full transition-all ${disabled ? 'bg-muted/50' : 'group-hover:shadow-md group-hover:-translate-y-1'}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${disabled ? 'bg-muted' : 'bg-secondary'}`}>
                {icon}
              </div>
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription>{subtitle}</CardDescription>
            </div>
            {!disabled && <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />}
          </div>
        </CardHeader>
        <div className="p-6 pt-0 text-sm text-muted-foreground">
           {disabled ? disabledReason : description}
        </div>
      </Card>
  );
  
  if (disabled) {
    return <div className="cursor-not-allowed">{content}</div>
  }

  return (
    <Link href={href} className="group block">
     {content}
    </Link>
  );
}

export default function DashboardPage() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-6 w-80 mb-10" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      </div>
    );
  }

  const isCreateCardDisabled = () => {
    if (!user?.cardGenerated || !user?.cardIssueDate) {
      return false;
    }
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return user.cardIssueDate > oneYearAgo;
  };

  const getNextCardCreationDate = () => {
    if (!user?.cardIssueDate) return '';
    const nextDate = addYears(user.cardIssueDate, 1);
    return format(nextDate, 'MMMM d, yyyy');
  }

  const createCardDisabled = isCreateCardDisabled();

  return (
    <main className="flex-1 animate-in fade-in duration-500">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Welcome, {user?.name || 'User'}!
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Manage your digital ID card from here.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <DashboardCard
            href="/create-card"
            icon={createCardDisabled ? <Lock className="h-6 w-6 text-muted-foreground" /> : <CreditCard className="h-6 w-6 text-primary" />}
            title="Create Digital Card"
            subtitle={createCardDisabled ? 'Unavailable' : 'Get your new ID card.'}
            description="Use your device's camera to take a professional photo and generate your new digital ID card."
            disabled={createCardDisabled}
            disabledReason={`You can create a new card on ${getNextCardCreationDate()}.`}
          />
          <DashboardCard
            href="/view-card"
            icon={<Eye className="h-6 w-6 text-primary" />}
            title="View Digital Card"
            subtitle="Display your current ID."
            description="Display your existing digital ID card. You can show this card for verification on campus."
          />
        </div>
      </div>
    </main>
  );
}
