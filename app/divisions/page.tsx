'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TeamManagement } from '../components/TeamManagement';
import { useUser } from '../contexts/UserContext';
import { USER_ROLE } from '@/utils/constants';

export default function DivisionsPage() {
  const router = useRouter();
  const { userRole } = useUser();

  // Redirect if not legal team or admin
  useEffect(() => {
    if (userRole === null) {
      router.push('/login');
    } else if (userRole === USER_ROLE.NO_ROLE) {
      router.push('/register');
    } else if (userRole !== USER_ROLE.LEGAL_TEAM && userRole !== USER_ROLE.ADMIN) {
      router.push('/dashboard');
    }
  }, [userRole, router]);

  // Don't render if redirecting
  if (userRole === null || userRole === USER_ROLE.NO_ROLE || (userRole !== USER_ROLE.LEGAL_TEAM && userRole !== USER_ROLE.ADMIN)) {
    return null;
  }

  return <TeamManagement userRole={userRole} />;
}

