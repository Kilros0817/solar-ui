'use client'

import { usePathname, useRouter } from 'next/navigation';
import { useConnection } from 'wagmi';
import { ContractHeader } from './ContractHeader';
import { ContractSidebar } from './ContractSidebar';
import { PagePreloader } from './PagePreloader';
import { useUser } from '../contexts/UserContext';
import { USER_ROLE } from '@/utils/constants';
import { getWeb3AuthInstance } from '@/utils/Web3AuthStore';
import type { LayoutWrapperProps } from '../data/interfaces';

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
    const pendingRoute =
      userRole === USER_ROLE.DIVISION_MEMBER
        ? '/clause-assignments/pending'
        : '/pending';
    const reviewRoute =
      userRole === USER_ROLE.DIVISION_MEMBER
        ? '/clause-assignments/review'
        : '/review';
    const approvedRoute =
      userRole === USER_ROLE.DIVISION_MEMBER
        ? '/clause-assignments/approved'
        : '/approved';
    const routeMap: Record<string, string> = {
      'dashboard': '/dashboard',
      'my-contracts': '/my-contracts',
      'pending': pendingRoute,
      'review': reviewRoute,
      'approved': approvedRoute,
      'esigned': '/esigned',
      'templates': '/templates',
      'clause-assignments': '/clause-assignments',
      'section-assignments': '/section-assignments',
      'rejected-tasks': '/clause-assignments/rejected',
      'pending-users': '/pending-users',
      'team': '/divisions',
      // Division Leader Internal Review
      'internal-all': '/section-assignments',
      'internal-pending': '/section-assignments/pending',
      'internal-review': '/section-assignments/review',
      'internal-approved': '/section-assignments/approved',
      'internal-rejected': '/section-assignments/rejected',
      // Division Leader Legal Review
      'legal-all': '/legal-review',
      'legal-pending': '/legal-review/pending',
      'legal-review-tab': '/legal-review/review',
      'legal-approved': '/legal-review/approved',
      'legal-rejected': '/legal-review/rejected',
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

