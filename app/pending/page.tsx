'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContractList } from '../components/ContractList';
import { ContractDetails } from '../components/ContractDetails';
import { useUser } from '../contexts/UserContext';
import { useNewContract } from '../contexts/NewContractContext';
import { USER_ROLE } from '@/utils/constants';

export default function PendingPage() {
  const router = useRouter();
  const { userRole } = useUser();
  const { setFrom, setSelectedContract } = useNewContract();
  const [selectedContractDetails, setSelectedContractDetails] = useState<number | null>(null);

  useEffect(() => {
    if (userRole === null) {
      router.push('/login');
    } else if (userRole === USER_ROLE.NO_ROLE) {
      router.push('/register');
    }
  }, [userRole, router]);

  // Division member/leader: pending lives under assignments; redirect to the right route
  useEffect(() => {
    if (userRole === USER_ROLE.DIVISION_MEMBER) {
      router.replace('/clause-assignments/pending');
      return;
    }
    if (userRole === USER_ROLE.DIVISION_LEADER) {
      router.replace('/section-assignments/pending');
      return;
    }
  }, [userRole, router]);

  const handleCreateContract = () => {
    if (userRole === USER_ROLE.LEGAL_TEAM) {
      setFrom('pending');
      router.push('/new-contract');
    }
  };

  const isDivisionLeaderForList = userRole === USER_ROLE.DIVISION_LEADER;
  if (selectedContractDetails != null && !isDivisionLeaderForList) {
    return (
      <ContractDetails
        contractId={selectedContractDetails}
        onBack={() => setSelectedContractDetails(null)}
      />
    );
  }

  const onViewContract = isDivisionLeaderForList
    ? (contractId: number) => setSelectedContract(String(contractId))
    : (contractId: number) => setSelectedContractDetails(contractId);

  // Only Legal team (and similar) see this page; DM/DL are redirected above
  if (userRole === USER_ROLE.DIVISION_MEMBER || userRole === USER_ROLE.DIVISION_LEADER) {
    return null;
  }

  if (userRole === null || userRole === USER_ROLE.NO_ROLE) {
    return null;
  }

  return (
    <ContractList
      title="Pending"
      filterStatus="pending"
      onCreateContract={handleCreateContract}
      onViewContract={onViewContract}
      getViewPath={isDivisionLeaderForList ? () => '/section-assignments' : undefined}
      showCreateButton={userRole === USER_ROLE.LEGAL_TEAM}
      showCreateWhenEmpty={false}
    />
  );
}
