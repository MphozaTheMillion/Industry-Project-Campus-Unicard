
'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@/contexts/user-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Wifi, Server, Camera, ShieldCheck, GitCommit, AlertCircle, RefreshCw, Database } from 'lucide-react';
import { cn } from '@/lib/utils';


const StatusIndicator = ({ status }: { status: 'operational' | 'degraded' | 'down' }) => {
  return (
    <div className="flex items-center gap-2">
      <span className={cn(
        "h-3 w-3 rounded-full",
        {
          'bg-green-500': status === 'operational',
          'bg-yellow-500': status === 'degraded',
          'bg-red-500': status === 'down',
        }
      )} />
      <span className="capitalize text-sm">{status}</span>
    </div>
  )
}

type ServiceStatus = {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency: number;
  icon: React.ReactNode;
};

export default function TechnicianDashboardPage() {
  const { user, loading: userLoading } = useUser();
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshStatuses = () => {
    setLoading(true);
    // Simulate fetching data
    setTimeout(() => {
      setServices([
        { name: 'Authentication Service', status: 'operational', latency: Math.floor(Math.random() * 50) + 10, icon: <ShieldCheck className="h-5 w-5 text-primary" /> },
        { name: 'Firestore Database', status: 'operational', latency: Math.floor(Math.random() * 100) + 20, icon: <Database className="h-5 w-5 text-primary" /> },
        { name: 'Liveness Check API', status: 'operational', latency: Math.floor(Math.random() * 200) + 50, icon: <Camera className="h-5 w-5 text-primary" /> },
        { name: 'Access Scanners Gateway', status: 'degraded', latency: Math.floor(Math.random() * 300) + 150, icon: <Wifi className="h-5 w-5 text-primary" /> },
        { name: 'Deployment Service', status: 'operational', latency: 0, icon: <GitCommit className="h-5 w-5 text-primary" /> },
      ]);
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    refreshStatuses();
  }, []);
  
  const pageIsLoading = userLoading || loading;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            System Health Monitoring
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Real-time status of all core digital services for UniCard.
          </p>
        </div>
        <Button onClick={refreshStatuses} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Core Services Status</CardTitle>
            <CardDescription>Monitoring authentication, database, and other key backend services.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Latency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageIsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  services.map(service => (
                    <TableRow key={service.name}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {service.icon}
                          {service.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusIndicator status={service.status} />
                      </TableCell>
                      <TableCell className="text-right font-mono">{service.latency > 0 ? `${service.latency}ms` : 'N/A'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
           <Card>
              <CardHeader>
                <CardTitle>Deployment Verification</CardTitle>
                <CardDescription>Status of the latest code deployments.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <GitCommit className="h-5 w-5" />
                    <span className="font-medium">Main Branch Deployment</span>
                  </div>
                  <Badge variant="default" className="bg-green-600">Successful</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Last checked: Just now. No new deployments detected.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security & Diagnostics</CardTitle>
                <CardDescription>Key information for tracing operational issues.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current Auth UID:</span>
                  {userLoading ? <Skeleton className="h-5 w-48" /> : <span className="font-mono">{user?.uid || 'Not authenticated'}</span>}
                </div>
                <Button variant="outline" className="w-full">Run Full Diagnostic</Button>
              </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}
