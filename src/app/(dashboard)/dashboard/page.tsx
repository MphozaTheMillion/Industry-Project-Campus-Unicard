'use client';

import Link from 'next/link';
import { ArrowRight, CreditCard, Eye } from 'lucide-react';
import { useUser } from '@/contexts/user-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function DashboardCard({
  href,
  icon,
  title,
  subtitle,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full transition-all group-hover:shadow-md group-hover:-translate-y-1">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                {icon}
              </div>
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription>{subtitle}</CardDescription>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
        </CardHeader>
        <div className="p-6 pt-0 text-sm text-muted-foreground">
          {description}
        </div>
      </Card>
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

  return (
    <main className="flex-1 animate-in fade-in duration-500">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Welcome, {user?.name.split(' ')[0] || 'User'}!
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Manage your digital ID card from here.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <DashboardCard
            href="/dashboard/create-card"
            icon={<CreditCard className="h-6 w-6 text-primary" />}
            title="Create Digital Card"
            subtitle="Get your new ID card."
            description="Use your device's camera to take a professional photo and generate your new digital ID card."
          />
          <DashboardCard
            href="/dashboard/view-card"
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
