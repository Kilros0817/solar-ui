'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserManagement } from '../components/UserManagement';
import { ContractHeader } from '../components/ContractHeader';
import { ContractSidebar } from '../components/ContractSidebar';
import { useUser } from '../contexts/UserContext';
import { USER_ROLE } from '@/utils/constants';

export default function UserManagementPage() {
  const router = useRouter();
  const { userRole } = useUser();
  const [activeTab, setActiveTab] = useState('team');

  // Redirect if not admin
  useEffect(() => {
    if (userRole === null) {
      router.push('/login');
    } else if (userRole === USER_ROLE.NO_ROLE) {
      router.push('/register');
    } else if (userRole !== USER_ROLE.ADMIN) {
      router.push('/dashboard');
    }
  }, [userRole, router]);

  // Don't render if redirecting
  if (userRole === null || userRole === USER_ROLE.NO_ROLE || userRole !== USER_ROLE.ADMIN) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <ContractHeader />
      <div className="flex-1 flex">
        <ContractSidebar 
          activeTab={activeTab} 
          onTabChange={(tab) => {
            if (tab === 'team') {
              // Stay on user management page
              return;
            }
            // Navigate to dashboard for other tabs
            router.push('/dashboard');
          }} 
        />
        <main className="flex-1 overflow-auto">
          <UserManagement />
        </main>
      </div>
    </div>
  );
}

