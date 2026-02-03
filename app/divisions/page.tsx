'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TeamManagement } from '../components/TeamManagement';
import { MyTeam } from '../components/MyTeam';
import { useUser } from '../contexts/UserContext';
import { USER_ROLE } from '@/utils/constants';

export default function DivisionsPage() {
  const router = useRouter();
  const { userRole } = useUser();

  const canAccessTeam =
    userRole === USER_ROLE.DIVISION_LEADER ||
    userRole === USER_ROLE.LEGAL_TEAM ||
    userRole === USER_ROLE.ADMIN;

  useEffect(() => {
    if (userRole === null) {
      router.push('/login');
    } else if (userRole === USER_ROLE.NO_ROLE) {
      router.push('/register');
    } else if (userRole != null && !canAccessTeam) {
      router.push('/dashboard');
    }
  }, [userRole, canAccessTeam, router]);

  if (userRole === null || userRole === USER_ROLE.NO_ROLE) {
    return null;
  }
  if (!canAccessTeam) {
    return null;
  }

  if (userRole === USER_ROLE.DIVISION_LEADER) {
    return <MyTeam />;
  }
  return <TeamManagement userRole={userRole} />;
}

