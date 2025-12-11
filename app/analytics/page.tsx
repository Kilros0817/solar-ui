'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContractHeader } from '../components/ContractHeader';
import { ContractSidebar } from '../components/ContractSidebar';
import { useUser } from '../contexts/UserContext';
import { USER_ROLE } from '@/utils/constants';

export default function AnalyticsPage() {
  const router = useRouter();
  const { userRole } = useUser();
  const [activeTab, setActiveTab] = useState('analytics');

  useEffect(() => {
    if (userRole === null) {
      router.push('/login');
    } else if (userRole === USER_ROLE.NO_ROLE) {
      router.push('/register');
    }
  }, [userRole, router]);

  if (userRole === null || userRole === USER_ROLE.NO_ROLE) {
    return null;
  }

  const handleTabChange = (tab: string) => {
    if (tab === 'team' && userRole === USER_ROLE.LEGAL_TEAM) {
      router.push('/divisions');
      return;
    }
    const routeMap: Record<string, string> = {
      'dashboard': '/dashboard',
      'my-contracts': '/my-contracts',
      'pending': '/pending',
      'approved': '/approved',
      'templates': '/templates',
      'analytics': '/analytics',
      'incoming': '/incoming',
      'assigned-work': '/assigned-work',
      'team-assignments': '/team-assignments',
      'my-assignments': '/my-assignments',
      'settings': '/settings',
    };
    const route = routeMap[tab];
    if (route) {
      router.push(route);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <ContractHeader />
      <div className="flex-1 flex">
        <ContractSidebar activeTab={activeTab} onTabChange={handleTabChange} />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <h1>{userRole === USER_ROLE.ADMIN ? 'System Analytics' : 'Analytics'}</h1>
            <p className="text-muted-foreground">Contract analytics will be displayed here</p>
          </div>
        </main>
      </div>
    </div>
  );
}

