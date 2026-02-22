'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClientContractsList } from '../../components/ClientContractsList';
import { useUser } from '../../contexts/UserContext';
import { USER_ROLE } from '@/utils/constants';

export default function ClientContractsESignedPage() {
  const router = useRouter();
  const { userRole } = useUser();

  useEffect(() => {
    if (userRole !== null && userRole !== USER_ROLE.CLIENT) {
      router.replace('/my-contracts');
      return;
    }
  }, [userRole, router]);

  if (userRole !== USER_ROLE.CLIENT) {
    return null;
  }

  return <ClientContractsList title="ESigned" statusFilter={4} fromRoute="client-esigned" />;
}
