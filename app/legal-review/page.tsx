'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ContractList } from '@/app/components/ContractList';
import { useUser } from '@/app/contexts/UserContext';
import { useAssignment } from '@/app/contexts/AssignmentContext';
import { USER_ROLE } from '@/utils/constants';

export default function LegalReviewAllPage() {
  const router = useRouter();
  const { userRole } = useUser();
  const { setSelectedContract } = useAssignment();

  const canAccessLegalReview = userRole === USER_ROLE.LEGAL_TEAM || userRole === USER_ROLE.DIVISION_LEADER;
  useEffect(() => {
    if (userRole !== null && !canAccessLegalReview) {
      if (userRole === USER_ROLE.DIVISION_MEMBER) {
        router.replace('/clause-assignments');
      } else {
        router.replace('/my-contracts');
      }
    }
  }, [userRole, canAccessLegalReview, router]);

  if (!canAccessLegalReview) {
    return null;
  }

  const onViewContract = (contractId: number) => {
    setSelectedContract(String(contractId));
  };

  return (
    <ContractList
      title="All sections (Legal Review)"
      onCreateContract={() => {}}
      onViewContract={onViewContract}
      getViewPath={() => '/section-assignments'}
      showCreateButton={false}
      showCreateWhenEmpty={false}
    />
  );
}
