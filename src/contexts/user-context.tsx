"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth, useFirestore, useUser as useFirebaseAuth } from '@/firebase'; // Renamed useUser to useFirebaseAuth to avoid conflict
import { doc, getDoc } from 'firebase/firestore';

type UserType = "student" | "campus_staff" | "administrator" | "technician";

interface User {
  uid: string | null;
  name: string;
  email: string;
  userType: UserType | null;
  photo: string | null;
  cardGenerated: boolean;
  studentNumber?: string;
  courseCode?: string;
  campusName?: string;
  workId?: string;
  department?: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  setPhoto: (photo: string) => void;
  setCardGenerated: (generated: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user: authUser, isUserLoading: isAuthLoading } = useFirebaseAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncUser = async () => {
      if (isAuthLoading) {
        setLoading(true);
        return;
      }
      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const userDocRef = doc(firestore, 'userProfiles', authUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setUser({
          uid: authUser.uid,
          name: `${userData.firstName} ${userData.lastName}`,
          email: userData.email,
          userType: userData.userType,
          photo: userData.profilePicture || null,
          cardGenerated: !!userData.profilePicture,
          studentNumber: userData.studentNumber,
          courseCode: userData.courseCode,
          campusName: userData.campusName,
          workId: userData.workId,
          department: userData.department,
        });
      } else {
        // Handle case where user exists in Auth but not Firestore
        setUser(null);
      }
      setLoading(false);
    };

    syncUser();
  }, [authUser, firestore, isAuthLoading]);
  
  const logout = () => {
    // Firebase auth logout is handled by the header button.
    // This context will automatically update when authUser changes.
    setUser(null);
  };

  const setPhoto = (photo: string) => {
    setUser(prev => (prev ? { ...prev, photo } : null));
     // Here you would also update the user's profilePicture in Firestore
  };
  
  const setCardGenerated = (generated: boolean) => {
    setUser(prev => (prev ? { ...prev, cardGenerated: generated } : null));
  }

  return (
    <UserContext.Provider value={{ user, loading, logout, setPhoto, setCardGenerated }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
