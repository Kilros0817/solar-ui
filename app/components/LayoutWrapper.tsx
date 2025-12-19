'use client'

import { usePathname, useRouter } from 'next/navigation';
import { ContractHeader } from './ContractHeader';
import { ContractSidebar } from './ContractSidebar';
import { useUser } from '../contexts/UserContext';
import { USER_ROLE } from '@/utils/constants';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { userRole } = useUser();
  
  // Pages that don't need header and sidebar
  const noLayoutPages = ['/login', '/register'];
  const shouldShowLayout = !noLayoutPages.includes(pathname);

  if (!shouldShowLayout) {
    return <>{children}</>;
  }

  // Handle sidebar tab changes
  const handleTabChange = (tab: string) => {
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
      'team': userRole === USER_ROLE.ADMIN ? '/user-management' : '/divisions',
    };

    const route = routeMap[tab];
    if (route && route !== pathname) {
      router.push(route);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <ContractHeader />
      <div className="flex-1 flex">
        <ContractSidebar 
          activeTab=""
          onTabChange={handleTabChange} 
        />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

