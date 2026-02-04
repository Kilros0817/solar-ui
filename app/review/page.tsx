'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContractList } from '../components/ContractList';
import { ContractDetails } from '../components/ContractDetails';
import { useUser } from '../contexts/UserContext';
import { useNewContract } from '../contexts/NewContractContext';
import { USER_ROLE } from '@/utils/constants';

export default function ReviewPage() {
  const router = useRouter();
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
      setFrom('review');
      router.push('/new-contract');
    }
  };

  if (selectedContract) {
    return <ContractDetails contractId={selectedContract} onBack={() => setSelectedContract(null)} />;
  }

  const canCreateContract = userRole === USER_ROLE.LEGAL_TEAM;

  return (
    <ContractList
      title="Review"
      filterStatus="division-request"
      onCreateContract={handleCreateContract}
      onViewContract={(contractId) => setSelectedContract(contractId)}
      showCreateButton={canCreateContract}
      showCreateWhenEmpty={false}
    />
  );
}
