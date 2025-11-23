"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react';

type UserType = "student" | "staff";

interface User {
  name: string;
  email: string;
  userType: UserType;
  photo: string | null;
  cardGenerated: boolean;
}

interface UserContextType {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  login: (name: string, email: string, userType: UserType) => void;
  logout: () => void;
  setPhoto: (photo: string) => void;
  setCardGenerated: (generated: boolean) => void;
}

const defaultUser: User = {
    name: 'Jane Doe',
    email: 'jane.doe@university.edu',
    userType: 'student',
    photo: null,
    cardGenerated: false,
};


const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(defaultUser);

  const login = (name: string, email: string, userType: UserType) => {
    setUser({ name, email, userType, photo: null, cardGenerated: false });
  };

  const logout = () => {
    setUser(defaultUser);
  };

  const setPhoto = (photo: string) => {
    setUser(prev => ({ ...prev, photo }));
  };
  
  const setCardGenerated = (generated: boolean) => {
    setUser(prev => ({ ...prev, cardGenerated: generated }));
  }

  return (
    <UserContext.Provider value={{ user, setUser, login, logout, setPhoto, setCardGenerated }}>
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
