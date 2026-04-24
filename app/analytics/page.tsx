'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../contexts/UserContext';
import { USER_ROLE } from '@/utils/constants';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { getWeb3AuthInstance } from '@/utils/Web3AuthStore';
import { useConnection } from 'wagmi';

export default function AnalyticsPage() {
  const router = useRouter();
  const { userRole } = useUser();
  const { isConnected } = useConnection();
  const web3Auth = getWeb3AuthInstance();

  useEffect(() => {
    if (!web3Auth?.connected && !isConnected) {
      router.push('/login');
      return;
    }
    if (userRole !== null && userRole !== USER_ROLE.ADMIN) {
      router.push('/dashboard');
    }
  }, [userRole, isConnected, web3Auth?.connected, router]);

  if (!web3Auth?.connected && !isConnected) return null;
  if (userRole !== USER_ROLE.ADMIN) return null;

  return <AnalyticsDashboard />;
}
