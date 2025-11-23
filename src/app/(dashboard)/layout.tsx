'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, CreditCard, Eye } from 'lucide-react';
import { UserProvider } from '@/contexts/user-context';
import { DashboardHeader } from '@/components/dashboard-header';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const menuItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutGrid,
    },
    {
      href: '/create-card',
      label: 'Create Card',
      icon: CreditCard,
    },
    {
      href: '/view-card',
      label: 'View Card',
      icon: Eye,
    },
  ];

  return (
    <UserProvider>
      <div className="flex h-screen flex-col">
        <header className="flex h-16 items-center justify-between border-b px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Logo />
            <nav className="hidden items-center gap-4 md:flex">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary',
                    pathname === item.href
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
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
