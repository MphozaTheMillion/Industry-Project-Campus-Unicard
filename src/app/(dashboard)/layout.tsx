'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Grid, LayoutGrid, CreditCard, Eye } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { UserProvider } from '@/contexts/user-context';
import { DashboardHeader } from '@/components/dashboard-header';
import { Logo } from '@/components/logo';

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
      href: '/dashboard/create-card',
      label: 'Create Card',
      icon: CreditCard,
    },
    {
      href: '/dashboard/view-card',
      label: 'View Card',
      icon: Eye,
    },
  ];

  return (
    <UserProvider>
      <SidebarProvider>
        <div className="flex h-screen flex-col">
          <header className="flex h-16 items-center justify-between border-b px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <Logo />
            </div>
            <DashboardHeader />
          </header>
          <div className="flex flex-1 overflow-hidden">
            <Sidebar
              variant="sidebar"
              collapsible="icon"
              className="hidden md:flex"
            >
              <SidebarContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.label}>
                      <Link href={item.href}>
                        <SidebarMenuButton
                          isActive={pathname === item.href}
                          tooltip={item.label}
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarContent>
            </Sidebar>

            <SidebarInset className="max-h-[calc(100vh-4rem)] flex-1 overflow-y-auto bg-background">
              {children}
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    </UserProvider>
  );
}
