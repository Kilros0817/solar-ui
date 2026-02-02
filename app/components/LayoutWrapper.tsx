'use client'

import { usePathname, useRouter } from 'next/navigation';
import { useConnection } from 'wagmi';
import { ContractHeader } from './ContractHeader';
import { ContractSidebar } from './ContractSidebar';
import { PagePreloader } from './PagePreloader';
import { useUser } from '../contexts/UserContext';
import { USER_ROLE } from '@/utils/constants';
import { getWeb3AuthInstance } from '@/utils/Web3AuthStore';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { userRole } = useUser();
  const { isConnected, address } = useConnection();
  const web3Auth = getWeb3AuthInstance();
  
  // Pages that don't need header and sidebar
  const noLayoutPages = ['/login', '/register'];
  const shouldShowLayout = !noLayoutPages.includes(pathname);

  if (!shouldShowLayout) {
    return <>{children}</>;
  }

  // Show preloader if connections are active but userRole is still being fetched
  const isLoading = (web3Auth?.connected || isConnected) && userRole === null && address;

  // Handle sidebar tab changes
  const handleTabChange = (tab: string) => {
    const routeMap: Record<string, string> = {
      'dashboard': '/dashboard',
      'my-contracts': '/my-contracts',
      'pending': '/pending',
      'review': '/review',
      'approved': '/approved',
      'esigned': '/esigned',
      'templates': '/templates',
      'incoming': '/incoming',
      'assigned-work': '/assigned-work',
      'team-assignments': '/team-assignments',
      'my-assignments': '/my-assignments',
      'pending-users': '/pending-users',
      'team': '/divisions',
    };

    const route = routeMap[tab];
    if (route && route !== pathname) {
      router.push(route);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background relative overflow-hidden">
      {isLoading && <PagePreloader />}
      <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${isLoading ? 'blur-sm pointer-events-none' : ''}`}>
        <div className="shrink-0">
          <ContractHeader />
        </div>
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <ContractSidebar 
            activeTab=""
            onTabChange={handleTabChange} 
          />
          <main className="flex-1 min-h-0 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

