
'use client';

import { UserProvider } from '@/contexts/user-context';
import { DashboardHeader } from '@/components/dashboard-header';
import { Logo } from '@/components/logo';

export default function TechnicianDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <div className="flex h-screen flex-col">
        <header className="flex h-16 items-center justify-between border-b px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Logo />
             <p className="text-lg font-semibold text-foreground">Technician Portal</p>
          </div>
          <DashboardHeader />
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/40">
          {children}
        </main>
      </div>
    </UserProvider>
  );
}
