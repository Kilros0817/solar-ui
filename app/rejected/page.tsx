'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContractList } from '@/app/components/ContractList';
import { ContractDetails } from '@/app/components/ContractDetails';
import { useUser } from '@/app/contexts/UserContext';
import { USER_ROLE } from '@/utils/constants';

export default function RejectedPage() {
  const router = useRouter();
  const { userRole } = useUser();
  const [selectedContract, setSelectedContract] = useState<number | null>(null);

  useEffect(() => {
    if (userRole === null) {
      router.push('/login');
    } else if (userRole === USER_ROLE.NO_ROLE) {
      router.push('/register');
    } else if (userRole !== USER_ROLE.LEGAL_TEAM) {
      router.replace('/my-contracts');
    }
  }, [userRole, router]);

  if (userRole === null || userRole === USER_ROLE.NO_ROLE || userRole !== USER_ROLE.LEGAL_TEAM) {
    return null;
  }

  if (selectedContract != null) {
    return (
      <ContractDetails
        contractId={selectedContract}
        onBack={() => setSelectedContract(null)}
      />
    );
  }

  return (
    <ContractList
      title="Rejected"
      filterStatus="rejected"
      onCreateContract={() => {}}
      onViewContract={(contractId) => setSelectedContract(contractId)}
      showCreateButton={false}
      showCreateWhenEmpty={false}
      emptySubtext="No rejected contracts."
    />
  );
}
