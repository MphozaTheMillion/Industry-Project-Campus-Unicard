import { DashboardHeader } from "@/components/dashboard-header";
import { UserProvider } from "@/contexts/user-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <div className="flex flex-col min-h-screen bg-background">
        <DashboardHeader />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {children}
        </main>
      </div>
    </UserProvider>
  );
}
