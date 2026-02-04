'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConnection } from 'wagmi';
import { ContractList } from '../components/ContractList';
import { ContractDetails } from '../components/ContractDetails';
import { useUser } from '../contexts/UserContext';
import { useNewContract } from '../contexts/NewContractContext';
import { USER_ROLE } from '@/utils/constants';

export default function MyContractsPage() {
  const router = useRouter();
  const { address } = useConnection();
  const { userRole } = useUser();
  const { setFrom } = useNewContract();
  const [selectedContract, setSelectedContract] = useState<number | null>(null);

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

  const handleCreateContract = () => {
    if (userRole === USER_ROLE.LEGAL_TEAM) {
      setFrom('my-contracts');
      router.push('/new-contract');
    }
  };

  const isDivisionLeader = userRole === USER_ROLE.DIVISION_LEADER;
  const viewPath = isDivisionLeader ? (id: number) => `/contract/${id}/assignments` : undefined;

  if (selectedContract && !isDivisionLeader) {
    return <ContractDetails contractId={selectedContract} onBack={() => setSelectedContract(null)} />;
  }

  const title =
    userRole === USER_ROLE.LEGAL_TEAM
      ? 'All Contracts'
      : userRole === USER_ROLE.ADMIN
        ? 'All Contracts'
        : userRole === USER_ROLE.DIVISION_LEADER
          ? 'All Assignments'
          : 'My Contracts';

  const canCreateContract = userRole === USER_ROLE.LEGAL_TEAM;

  return (
    <ContractList
      title={title}
      onCreateContract={handleCreateContract}
      onViewContract={(contractId) => setSelectedContract(contractId)}
      getViewPath={viewPath}
      divisionLeaderAddress={isDivisionLeader ? address ?? null : undefined}
      showCreateButton={canCreateContract}
    />
  );
}

