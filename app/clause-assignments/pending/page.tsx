'use client'

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { USER_ROLE } from '@/utils/constants';
import { useUser } from '@/app/contexts/UserContext';
import { useAssignment } from '@/app/contexts/AssignmentContext';
import { useDivisionMemberClauses } from '@/app/contexts/DivisionMemberClausesContext';
import { FileText, Loader2, Pencil } from 'lucide-react';

type PendingClauseMember = {
  id: string;
  status: number;
  section: { id: string; doc: { id: string; title?: string } };
};

export default function ClauseAssignmentsPendingPage() {
  const router = useRouter();
  const { userRole } = useUser();
  const { setSelection } = useAssignment();
  const { clauses: allClauses, loading, getIndicesForClause } = useDivisionMemberClauses();
  const [workingId, setWorkingId] = useState<string | null>(null);

  const pendingMember = useMemo(
    () => allClauses.filter((c) => (c as { status?: number }).status === 0) as PendingClauseMember[],
    [allClauses]
  );

  const divisionLabel = '';

  useEffect(() => {
    if (userRole === null) {
      router.push('/login');
    } else if (userRole === USER_ROLE.NO_ROLE) {
      router.push('/register');
    } else if (userRole !== null && userRole !== USER_ROLE.DIVISION_MEMBER) {
      router.replace('/clause-assignments');
    }
  }, [userRole, router]);

  const handleWorkOnMember = (item: PendingClauseMember) => {
    const contractId = item.section?.doc?.id;
    const clauseId = item.id;
    if (!contractId || !clauseId) return;
    setWorkingId(item.id);
    const idx = getIndicesForClause(contractId, clauseId);
    if (!idx) {
      setWorkingId(null);
      return;
    }
    setSelection(contractId, idx.sectionIndex, idx.clauseIndex, null, 'pending');
    router.push('/clause-assignments/clause');
    setWorkingId(null);
  };

  if (userRole === null || userRole === USER_ROLE.NO_ROLE || userRole !== USER_ROLE.DIVISION_MEMBER) {
    return null;
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pending</h1>
        <p className="text-muted-foreground mt-1">
          Clauses not submitted yet (status: Assigned) {divisionLabel ? `— ${divisionLabel}` : ''}
        </p>
      </div>

      {pendingMember.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="font-medium">No pending clauses</p>
            <p className="text-sm text-muted-foreground">
              Clauses with status Assigned (not yet submitted) will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, 400px)' }}>
          {pendingMember.map((item) => (
            <Card key={item.id} className="flex flex-col w-full">
              <CardContent className="p-4 flex flex-col gap-3 flex-1">
                <span className="font-medium text-sm truncate">
                  {item.section?.doc?.title ?? 'Untitled'}
                </span>
                <p className="text-xs text-muted-foreground">Section ID: {item.section?.id ?? '—'}</p>
                <p className="text-xs text-muted-foreground">Clause ID: {item.id ?? '—'}</p>
                <div className="flex justify-end mt-auto pt-2 border-t">
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-1.5 shrink-0"
                    disabled={workingId === item.id}
                    onClick={() => handleWorkOnMember(item)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {workingId === item.id ? 'Opening...' : 'Work on'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
