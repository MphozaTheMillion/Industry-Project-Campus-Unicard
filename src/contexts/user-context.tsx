
"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth, useFirestore, useUser as useFirebaseAuth } from '@/firebase'; // Renamed useUser to useFirebaseAuth to avoid conflict
import { doc, getDoc, getDocs, collection, query, limit, Timestamp } from 'firebase/firestore';

type UserType = "student" | "campus_staff" | "administrator" | "technician";

interface User {
  uid: string | null;
  name: string;
  email: string;
  userType: UserType | null;
  photo: string | null;
  cardGenerated: boolean;
  cardIssueDate: Date | null;
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
  setCardData: (data: { photo: string; cardGenerated: boolean; cardIssueDate: Date; }) => void;
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
      try {
        const userDocRef = doc(firestore, 'userProfiles', authUser.uid);
        const cardCollRef = collection(firestore, 'userProfiles', authUser.uid, 'digitalIdCards');
        const cardQuery = query(cardCollRef, limit(1));

        const [userDocSnap, cardSnapshot] = await Promise.all([
            getDoc(userDocRef),
            getDocs(cardQuery)
        ]);

        let cardData = null;
        if (!cardSnapshot.empty) {
            cardData = cardSnapshot.docs[0].data();
        }

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const issueDate = cardData?.cardIssueDate instanceof Timestamp 
            ? cardData.cardIssueDate.toDate() 
            : null;

          setUser({
            uid: authUser.uid,
            name: `${userData.firstName} ${userData.lastName}`,
            email: userData.email,
            userType: userData.userType,
            photo: userData.profilePicture || null,
            cardGenerated: !!userData.profilePicture,
            cardIssueDate: issueDate,
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
      } catch (e) {
          console.error("Failed to sync user data:", e);
          setUser(null);
      } finally {
        setLoading(false);
      }
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
  };
  
  const setCardGenerated = (generated: boolean) => {
    setUser(prev => (prev ? { ...prev, cardGenerated: generated } : null));
  }

  const setCardData = (data: { photo: string; cardGenerated: boolean; cardIssueDate: Date; }) => {
    setUser(prev => (prev ? { ...prev, ...data } : null));
  };

  return (
    <UserContext.Provider value={{ user, loading, logout, setPhoto, setCardGenerated, setCardData }}>
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
