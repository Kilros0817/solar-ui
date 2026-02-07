'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ContractList } from '@/app/components/ContractList';
import { useUser } from '@/app/contexts/UserContext';
import { useAssignment } from '@/app/contexts/AssignmentContext';
import { USER_ROLE } from '@/utils/constants';

export default function SectionAssignmentsRejectedPage() {
  const router = useRouter();
  const { userRole } = useUser();
  const { setSelectedContract } = useAssignment();

  useEffect(() => {
    if (userRole !== null && userRole !== USER_ROLE.DIVISION_LEADER) {
      if (userRole === USER_ROLE.DIVISION_MEMBER) {
        router.replace('/clause-assignments');
      } else {
        router.replace('/my-contracts');
      }
    }
  }, [userRole, router]);

  if (userRole !== USER_ROLE.DIVISION_LEADER) {
    return null;
  }

  const onViewContract = (contractId: number) => {
    setSelectedContract(String(contractId));
  };

  return (
    <ContractList
      title="Rejected"
      onCreateContract={() => {}}
      onViewContract={onViewContract}
      getViewPath={() => '/section-assignments'}
      showCreateButton={false}
      showCreateWhenEmpty={false}
    />
  );
}
