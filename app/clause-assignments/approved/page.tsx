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
import { ClauseWithSection } from '@/utils/types';


export default function ClauseAssignmentsApprovedPage() {
  const router = useRouter();
  const { userRole } = useUser();
  const { setSelection } = useAssignment();
  const { clauses: allClauses, loading, getIndicesForClause } = useDivisionMemberClauses();
  const [navigatingClauseId, setNavigatingClauseId] = useState<string | null>(null);

  const clauses = useMemo(
    () => allClauses.filter((c) => Number((c as ClauseWithSection).status) === 2) as ClauseWithSection[],
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
    setSelection(docId, idx.sectionIndex, idx.clauseIndex, clause.cid ?? null, 'approved');
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
  const clientName = (c: ClauseWithSection) => {
    const client = c.doc?.client;
    return client
      ? [client.firstName, client.lastName].filter(Boolean).join(' ').trim() || '—'
      : '—';
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Approved</h1>
        <p className="text-muted-foreground mt-1">
          Clauses approved by your division leader (status: Approved)
        </p>
      </div>

      {clauses.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="font-medium">No approved clauses</p>
            <p className="text-sm text-muted-foreground">
              Clauses approved by your division leader will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {clauses.map((clause) => (
            <Card
              key={clause.id}
              className="rounded-lg border bg-muted/30 hover:border-brand-secondary/50 transition-colors"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-secondary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-brand-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {contractTitle(clause)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Client: {clientName(clause)}
                    </p>
                  </div>
                </div>
                <div className="rounded border bg-background/50 p-3 text-sm text-muted-foreground">
                  <span>
                    Section ID: <span className="font-medium text-foreground">{clause.section?.id ?? '—'}</span>
                  </span>
                  <span className="mx-2 text-muted-foreground">•</span>
                  <span>
                    Clause ID: <span className="font-medium text-foreground">{clause.id}</span>
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 cursor-pointer"
                    onClick={() => handleViewClause(clause)}
                    disabled={navigatingClauseId === clause.id}
                  >
                    {navigatingClauseId === clause.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    View
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
