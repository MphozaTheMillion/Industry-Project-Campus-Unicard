
'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, UserX, CheckCircle, Ban } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: string;
  cardStatus?: 'active' | 'suspended' | 'revoked';
};

function StatusBadge({ status }: { status: UserProfile['cardStatus'] }) {
  const statusMap = {
    active: { variant: 'default', label: 'Active', icon: <CheckCircle className="h-3 w-3" /> },
    suspended: { variant: 'secondary', label: 'Suspended', icon: <Ban className="h-3 w-3" /> },
    revoked: { variant: 'destructive', label: 'Revoked', icon: <UserX className="h-3 w-3" /> },
  };

  const currentStatus = status && statusMap[status] ? statusMap[status] : { variant: 'outline', label: 'No Card', icon: null };
  
  const badgeVariant = currentStatus.variant as "default" | "secondary" | "destructive" | "outline" | null | undefined;


  return (
    <Badge variant={badgeVariant} className="flex items-center gap-1 w-fit">
      {currentStatus.icon}
      <span>{currentStatus.label}</span>
    </Badge>
  );
}

export default function AdminDashboardPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const profilesCollection = useMemoFirebase(() => {
    return firestore ? collection(firestore, 'userProfiles') : null;
  }, [firestore]);

  const { data: userProfiles, isLoading: profilesLoading } = useCollection<UserProfile>(profilesCollection);

  useEffect(() => {
    if (profilesLoading || !userProfiles || !firestore) return;

    const fetchAllUsersWithStatus = async () => {
      setLoading(true);
      const usersWithStatus = await Promise.all(
        userProfiles.map(async (user) => {
          // The digitalIdCard is stored with a fixed ID 'main' inside a subcollection
          const cardDocRef = doc(firestore, 'userProfiles', user.id, 'digitalIdCards', 'main');
          try {
            const cardDocSnap = await getDoc(cardDocRef);
            if (cardDocSnap.exists()) {
              return { ...user, cardStatus: cardDocSnap.data().cardStatus };
            }
          } catch (e) {
            console.error(`Failed to fetch card for user ${user.id}`, e);
          }
          return user; // Return user even if card status fetch fails
        })
      );
      setUsers(usersWithStatus);
      setLoading(false);
    };

    fetchAllUsersWithStatus();
  }, [userProfiles, profilesLoading, firestore]);

  const handleUpdateStatus = async (userId: string, status: 'suspended' | 'revoked') => {
    if (!firestore) return;
    const cardDocRef = doc(firestore, 'userProfiles', userId, 'digitalIdCards', 'main');
    try {
      await updateDoc(cardDocRef, { cardStatus: status });
      setUsers(prevUsers =>
        prevUsers.map(u => (u.id === userId ? { ...u, cardStatus: status } : u))
      );
      toast({
        title: "Status Updated",
        description: `User's card has been ${status}.`,
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update the user's card status. The user may not have a card yet.",
      });
    }
  };
  
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          User Management
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          View and manage all registered users in the system.
        </p>
      </div>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>User Type</TableHead>
                <TableHead>Card Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Loading users...</TableCell>
                </TableRow>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="capitalize">{user.userType.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <StatusBadge status={user.cardStatus} />
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(user.id, 'suspended')}
                            disabled={user.cardStatus === 'suspended' || !user.cardStatus}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Suspend Card
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(user.id, 'revoked')}
                            disabled={user.cardStatus === 'revoked' || !user.cardStatus}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Revoke Card
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">No users found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
