'use client'

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { FileText, Loader2, Eye, ClipboardList } from 'lucide-react';
import { useUser } from '@/app/contexts/UserContext';
import { useAssignment } from '@/app/contexts/AssignmentContext';
import { useDivisionMemberClauses } from '@/app/contexts/DivisionMemberClausesContext';
import { USER_ROLE } from '@/utils/constants';

type ClauseWithSection = {
  id: string;
  cid?: string;
  status?: number;
  assignedAt?: string;
  doc?: {
    id: string;
    title?: string;
    status?: number;
    client?: { firstName?: string; lastName?: string };
  };
  section?: {
    id: string;
    status?: number;
  };
};

export default function ClauseAssignmentsReviewPage() {
  const router = useRouter();
  const { userRole } = useUser();
  const { setSelection } = useAssignment();
  const { clauses: allClauses, loading, getIndicesForClause } = useDivisionMemberClauses();
  const [navigatingClauseId, setNavigatingClauseId] = useState<string | null>(null);

  const clauses = useMemo(
    () => allClauses.filter((c) => (c as ClauseWithSection).status === 1) as ClauseWithSection[],
    [allClauses]
  );

  useEffect(() => {
    if (userRole !== null && userRole !== USER_ROLE.DIVISION_MEMBER) {
      router.replace('/my-contracts');
      return;
    }
  }, [userRole, router]);

  const handleViewClause = (clause: ClauseWithSection) => {
    const docId = clause.doc?.id;
    if (!docId || !clause.id) return;
    setNavigatingClauseId(clause.id);
    const idx = getIndicesForClause(docId, clause.id);
    if (!idx) {
      setNavigatingClauseId(null);
      return;
    }
    setSelection(docId, idx.sectionIndex, idx.clauseIndex, clause.cid ?? null, 'review');
    router.push('/clause-assignments/clause');
    setNavigatingClauseId(null);
  };

  if (userRole !== null && userRole !== USER_ROLE.DIVISION_MEMBER) {
    return null;
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const contractTitle = (c: ClauseWithSection) =>
    c.doc?.title ?? 'Untitled';

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Review</h1>
        <p className="text-muted-foreground mt-1">
          Clauses submitted for review (status: Submitted)
        </p>
      </div>

      {clauses.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="font-medium">No clauses in review</p>
            <p className="text-sm text-muted-foreground">
              Clauses you submit for review will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, 400px)' }}>
          {clauses.map((clause) => (
            <Card key={clause.id} className="flex flex-col w-full">
              <CardContent className="p-4 flex flex-col gap-3 flex-1">
                <span className="font-medium text-sm truncate">
                  {contractTitle(clause)}
                </span>
                <p className="text-xs text-muted-foreground">Section ID: {clause.section?.id ?? '—'} / Clause ID: {clause.id ?? '—'}</p>
                <div className="flex justify-end mt-auto pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 shrink-0"
                    disabled={navigatingClauseId === clause.id}
                    onClick={() => handleViewClause(clause)}
                  >
                    {navigatingClauseId === clause.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                    {navigatingClauseId === clause.id ? 'Opening...' : 'View'}
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
