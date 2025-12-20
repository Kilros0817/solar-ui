'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PendingUsers } from '../components/PendingUsers';
import { useUser } from '../contexts/UserContext';
import { USER_ROLE } from '@/utils/constants';

export default function PendingUsersPage() {
  const router = useRouter();
  const { userRole } = useUser();

  // Redirect if not admin
  useEffect(() => {
    if (userRole === null) {
      router.push('/login');
    } else if (userRole === USER_ROLE.NO_ROLE) {
      router.push('/register');
    } else if (userRole !== USER_ROLE.ADMIN) {
      router.push('/dashboard');
    }
  }, [userRole, router]);

  // Don't render if redirecting
  if (userRole === null || userRole === USER_ROLE.NO_ROLE || userRole !== USER_ROLE.ADMIN) {
    return null;
  }

  return <PendingUsers />;
}

