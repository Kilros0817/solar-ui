'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MyAssignments } from '../components/MyAssignments';
import { useUser } from '../contexts/UserContext';
import { USER_ROLE } from '@/utils/constants';

export default function MyAssignmentsPage() {
  const router = useRouter();
  const { userRole } = useUser();

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

  return <MyAssignments />;
}

