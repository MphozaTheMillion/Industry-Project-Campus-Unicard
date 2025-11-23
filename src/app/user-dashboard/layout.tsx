
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, CreditCard, Eye, Lock } from 'lucide-react';
import { UserProvider, useUser } from '@/contexts/user-context';
import { DashboardHeader } from '@/components/dashboard-header';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

function NavLinks() {
  const pathname = usePathname();
  const { user, loading } = useUser();

  const isCreateCardDisabled = () => {
    if (!user?.cardGenerated || !user?.cardIssueDate) {
      return false;
    }
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return user.cardIssueDate > oneYearAgo;
  };
  
  const createCardDisabled = isCreateCardDisabled();

  const menuItems = [
    {
      href: '/user-dashboard',
      label: 'Dashboard',
      icon: LayoutGrid,
      disabled: false,
    },
    {
      href: '/user-dashboard/create-card',
      label: 'Create Card',
      icon: createCardDisabled ? Lock : CreditCard,
      disabled: createCardDisabled,
    },
    {
      href: '/user-dashboard/view-card',
      label: 'View Card',
      icon: Eye,
      disabled: false,
    },
  ];

  if (loading) {
      return (
        <div className="hidden items-center gap-4 md:flex">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
        </div>
      );
  }

  return (
    <nav className="hidden items-center gap-4 md:flex">
      {menuItems.map((item) => {
        const isCurrentPath = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.disabled ? '#' : item.href}
            className={cn(
              'flex items-center gap-2 text-sm font-medium transition-colors',
              item.disabled
                ? 'cursor-not-allowed text-muted-foreground/50'
                : 'hover:text-primary',
              isCurrentPath && !item.disabled
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
            aria-disabled={item.disabled}
            tabIndex={item.disabled ? -1 : undefined}
            onClick={(e) => {
              if (item.disabled) e.preventDefault();
            }}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function DashboardLayout({
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
            <NavLinks />
          </div>
          <DashboardHeader />
        </header>
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </UserProvider>
  );
}
