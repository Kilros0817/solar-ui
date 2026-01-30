'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../contexts/UserContext'
import { useNewContract } from '../contexts/NewContractContext'
import { Dashboard } from '../components/Dashboard'
import { ContractDetails } from '../components/ContractDetails'
import { USER_ROLE } from '@/utils/constants'
import { useConnection } from 'wagmi';
import { getWeb3AuthInstance } from '@/utils/Web3AuthStore';

export default function DashboardPage() {
  const router = useRouter();
  const { userRole } = useUser();
  const { setFrom } = useNewContract();
  const { isConnected } = useConnection();
  const web3Auth = getWeb3AuthInstance();
  const [selectedContract, setSelectedContract] = useState<number | null>(null)

  useEffect(() => {
    if (!web3Auth?.connected && !isConnected) {
      router.push('/login');
      return;
    }
    if (userRole === USER_ROLE.NO_ROLE) {
      router.push('/register');
    }
  }, [userRole, isConnected, web3Auth?.connected, router]);

  if (!web3Auth?.connected && !isConnected) {
    return null;
  }
  if (userRole === USER_ROLE.NO_ROLE) {
    return null;
  }

  const handleCreateContract = () => {
    if (userRole === USER_ROLE.LEGAL_TEAM) {
      setFrom('dashboard');
      router.push('/new-contract');
    }
  };

  if (selectedContract) {
    return <ContractDetails contractId={selectedContract} onBack={() => setSelectedContract(null)} />
  }

  return <Dashboard onCreateContract={handleCreateContract} />
}
