'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RegistrationPage } from '../components/RegistrationPage';
import { useUser } from '../contexts/UserContext';
import { USER_ROLE } from '@/utils/constants';

export default function RegisterPage() {
  const router = useRouter();
  const { userRole, setUserRole } = useUser();

  // Redirect if not in registration state
  useEffect(() => {
    if (userRole === null) {
      router.push('/login');
    } else if (userRole !== USER_ROLE.NO_ROLE) {
      router.push('/dashboard');
    }
  }, [userRole, router]);

  // Don't render if redirecting
  if (userRole === null || userRole !== USER_ROLE.NO_ROLE) {
    return null;
  }

  return (
    <RegistrationPage 
      onComplete={(role) => {
        // Update user role after registration is complete
        setUserRole(role);
        router.push('/dashboard');
      }}
    />
  );
}

