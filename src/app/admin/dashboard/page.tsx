
'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button";
import { UserX, CheckCircle, Ban, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';

type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: string;
  lastLogin?: { seconds: number; nanoseconds: number; } | Date | string;
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
  const { user: adminUser, isUserLoading: isAdminLoading } = useUser();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (isAdminLoading || !firestore || !adminUser) {
        setLoading(false);
        return;
    }

    const fetchAllUsersWithStatus = async () => {
      setLoading(true);
      setError(null);
      try {
        const profileDocs = await getDocs(collection(firestore, 'userProfiles'));
        const profiles = profileDocs.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserProfile[];

        const usersWithStatus = await Promise.all(
          profiles.map(async (user) => {
            const cardDocRef = doc(firestore, 'userProfiles', user.id, 'digitalIdCards', 'main');
            try {
              const cardDocSnap = await getDoc(cardDocRef);
              if (cardDocSnap.exists()) {
                return { ...user, cardStatus: cardDocSnap.data().cardStatus };
              }
            } catch (e) {
              // This is a nested error, we can log it but won't block the main user list
              console.error(`Failed to fetch card for user ${user.id}`, e);
            }
            return user;
          })
        );
        setUsers(usersWithStatus);
      } catch (serverError: any) {
         const permissionError = new FirestorePermissionError({
             path: 'userProfiles',
             operation: 'list',
         });
         errorEmitter.emit('permission-error', permissionError);
         setError(permissionError); // Set local error state for UI feedback
      } finally {
        setLoading(false);
      }
    };

    fetchAllUsersWithStatus();
  }, [adminUser, isAdminLoading, firestore]);

  const handleRemoveUser = async (userToRemove: UserProfile) => {
    if (!firestore) return;

    try {
      const batch = writeBatch(firestore);

      const userProfileRef = doc(firestore, "userProfiles", userToRemove.id);
      batch.delete(userProfileRef);

      const emailLockRef = doc(firestore, "emails", userToRemove.email);
      batch.delete(emailLockRef);
      
      const cardDocRef = doc(firestore, 'userProfiles', userToRemove.id, 'digitalIdCards', 'main');
      // It's okay if the card doesn't exist, so we don't need to check. A delete on a non-existent doc is a no-op.
      batch.delete(cardDocRef);

      await batch.commit();

      setUsers(prevUsers => prevUsers.filter(u => u.id !== userToRemove.id));

      toast({
        title: "User Removed",
        description: `${userToRemove.firstName} ${userToRemove.lastName}'s data has been removed.`,
      });

    } catch (error) {
       const permissionError = new FirestorePermissionError({
         path: `userProfiles/${userToRemove.id}`, 
         operation: 'delete',
       });
       errorEmitter.emit('permission-error', permissionError);
       toast({
         variant: "destructive",
         title: "Removal Failed",
         description: "Could not remove the user's data. Please check permissions.",
       });
    }
  };
  
  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    // Check if it's a Firestore Timestamp
    if (date.seconds) {
      // Compatibility with both Firebase v8 (toDate) and v9 (no direct toDate on plain object)
      return format(new Date(date.seconds * 1000), 'PPp');
    }
    if (date instanceof Date) {
      return format(date, 'PPp');
    }
    // Try parsing if it's a string
    try {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        return format(parsedDate, 'PPp');
      }
    } catch (e) {}
    return 'Invalid Date';
  }
  
  const pageIsLoading = loading || isAdminLoading;

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
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>User Type</TableHead>
                  <TableHead>Card Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Remove User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageIsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Loading users...</TableCell>
                  </TableRow>
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium whitespace-nowrap">{user.firstName} {user.lastName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="capitalize whitespace-nowrap">{user.userType.replace('_', ' ')}</TableCell>
                      <TableCell>
                        <StatusBadge status={user.cardStatus} />
                      </TableCell>
                       <TableCell className="whitespace-nowrap">{formatDate(user.lastLogin)}</TableCell>
                       <TableCell>
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm" disabled={user.id === adminUser?.uid}>
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Remove
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                          This action cannot be undone. This will permanently delete the user's
                                          data from the database, but it will <span className="font-semibold">not</span> delete their login credentials.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleRemoveUser(user)} className="bg-destructive hover:bg-destructive/90">
                                          Continue
                                      </AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                       </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      {error ? "You don't have permission to view users." : "No users found."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
