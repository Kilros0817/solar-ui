'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'legal' | 'owner' | 'division-lead' | 'division-member' | 'administrator' | null;

interface UserContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  userName: string;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userName, setUserName] = useState('');

  const handleSetUserRole = (role: UserRole) => {
    setUserRole(role);
    // Set default names based on role
    switch (role) {
      case 'legal':
        setUserName('Sarah Chen');
        break;
      case 'owner':
        setUserName('Michael Rodriguez');
        break;
      case 'division-lead':
        setUserName('Jennifer Taylor');
        break;
      case 'division-member':
        setUserName('David Kim');
        break;
      case 'administrator':
        setUserName('Admin User');
        break;
      default:
        setUserName('');
    }
  };

  const logout = () => {
    setUserRole(null);
    setUserName('');
  };

  return (
    <UserContext.Provider value={{ userRole, setUserRole: handleSetUserRole, userName, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
