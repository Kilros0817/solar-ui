'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useDisconnect } from 'wagmi';
import { getWeb3AuthInstance } from '@/utils/Web3AuthStore';
import { USER_ROLE } from '@/utils/constants';
import type { UserRole, UserInfo, UserContextType } from '../data/interfaces';

export type { UserRole, UserInfo };

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userName, setUserName] = useState('');
  const { mutateAsync: disconnectAsync } = useDisconnect();

  const handleSetUserRole = (role: UserRole) => {
    setUserRole(role);
    // Role-based default names (e.g. for demo role switcher)
    const defaultName = (() => {
      switch (role) {
        case USER_ROLE.LEGAL_TEAM: return 'Sarah Chen';
        case USER_ROLE.DIVISION_LEADER: return 'Jennifer Taylor';
        case USER_ROLE.DIVISION_MEMBER: return 'David Kim';
        case USER_ROLE.ADMIN: return 'Admin User';
        case USER_ROLE.CLIENT: return 'Client';
        default: return '';
      }
    })();
    setUserName(defaultName);
  };

  const handleSetUserInfo = ({ role, firstName, lastName }: UserInfo) => {
    setUserRole(role);
    const name = [firstName, lastName].filter(Boolean).join(' ').trim();
    setUserName(name || (() => {
      switch (role) {
        case USER_ROLE.LEGAL_TEAM: return 'Legal Team';
        case USER_ROLE.DIVISION_LEADER: return 'Division Lead';
        case USER_ROLE.DIVISION_MEMBER: return 'Division Member';
        case USER_ROLE.ADMIN: return 'Administrator';
        case USER_ROLE.CLIENT: return 'Client';
        default: return 'User';
      }
    })());
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
    try {
      await disconnectAsync();
      // Wait a bit more to ensure wagmi state updates
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error('Error disconnecting from wagmi:', error);
    }
  };

  return (
    <UserContext.Provider value={{ userRole, setUserRole: handleSetUserRole, setUserInfo: handleSetUserInfo, userName, logout }}>
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
