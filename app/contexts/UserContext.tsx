'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useDisconnect } from 'wagmi';
import { getWeb3AuthInstance } from '@/utils/Web3AuthStore';
import { USER_ROLE } from '@/utils/constants';

export type UserRole = number | null;

interface UserContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  userName: string;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userName, setUserName] = useState('');
  const { mutate: disconnect } = useDisconnect();

  const handleSetUserRole = (role: UserRole) => {
    setUserRole(role);
    // Set default names based on role
    switch (role) {
      case USER_ROLE.LEGAL_TEAM:
        setUserName('Sarah Chen');
        break;
      case USER_ROLE.PROJECT_OWNER:
        setUserName('Michael Rodriguez');
        break;
      case USER_ROLE.DIVISION_LEADER:
        setUserName('Jennifer Taylor');
        break;
      case USER_ROLE.DIVISION_MEMBER:
        setUserName('David Kim');
        break;
      case USER_ROLE.ADMIN:
        setUserName('Admin User');
        break;
      default:
        setUserName('');
    }
  };

  const logout = async () => {
    // Clear user state first to prevent auto-login
    setUserRole(null);
    setUserName('');
    
    // Disconnect from Web3Auth
    const web3Auth = getWeb3AuthInstance();
    if (web3Auth?.connected) {
      try {
        await web3Auth.logout();
        // Wait a bit to ensure Web3Auth state updates
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Error disconnecting from Web3Auth:', error);
      }
    }
    
    // Disconnect from wagmi
    disconnect();
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
