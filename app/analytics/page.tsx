'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../contexts/UserContext';
import { USER_ROLE } from '@/utils/constants';

export default function AnalyticsPage() {
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

  return (
    <div className="p-6">
      <h1>{userRole === USER_ROLE.ADMIN ? 'System Analytics' : 'Analytics'}</h1>
      <p className="text-muted-foreground">Contract analytics will be displayed here</p>
    </div>
  );
}

