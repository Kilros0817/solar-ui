'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from './contexts/UserContext';
import { USER_ROLE } from '@/utils/constants';

export default function Home() {
  const router = useRouter();
  const { userRole } = useUser();

  useEffect(() => {
    // Redirect based on user state
    if (userRole === null) {
      router.push('/login');
    } else if (userRole === USER_ROLE.NO_ROLE) {
      router.push('/register');
    } else {
      router.push('/dashboard');
    }
  }, [userRole, router]);

  // Show loading or nothing while redirecting
  return null;
}

