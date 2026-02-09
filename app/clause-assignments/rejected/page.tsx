'use client'

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { FileText, Loader2, Eye, ClipboardList, AlertCircle } from 'lucide-react';
import { USER_ROLE, URLs } from '@/utils/constants';
import { useUser } from '@/app/contexts/UserContext';
import { useAssignment } from '@/app/contexts/AssignmentContext';
import { useDivisionMemberClauses } from '@/app/contexts/DivisionMemberClausesContext';

type ClauseWithSection = {
  id: string;
  cid?: string;
  status?: number;
  assignedAt?: string;
  section?: {
    id: string;
    status?: number;
    doc?: {
      id: string;
      title?: string;
      status?: number;
      client?: { firstName?: string; lastName?: string };
    };
  };
};

export default function ClauseAssignmentsRejectedPage() {
  const router = useRouter();
  const { userRole } = useUser();
  const { setSelection } = useAssignment();
  const { clauses: allClauses, loading, getIndicesForClause } = useDivisionMemberClauses();
  const [clauseContents, setClauseContents] = useState<Record<string, string>>({});
  const [navigatingClauseId, setNavigatingClauseId] = useState<string | null>(null);

  const clauses = useMemo(
    () => allClauses.filter((c) => (c as ClauseWithSection).status === 3) as ClauseWithSection[],
    [allClauses]
  );

  const divisionLabel = '';
  const error: string | null = null;

  useEffect(() => {
    if (userRole !== null && userRole !== USER_ROLE.DIVISION_MEMBER) {
      router.replace('/my-contracts');
      return;
    }
  }, [userRole, router]);

  useEffect(() => {
    const withCid = clauses.filter((c) => c.cid);
    if (withCid.length === 0) return;
    let cancelled = false;
    const fetchAll = async () => {
      const next: Record<string, string> = {};
      for (const clause of withCid) {
        if (cancelled) return;
        try {
          const res = await fetch(`${URLs.TBGateWay}${clause.cid}`);
          if (!res.ok) continue;
          const data = await res.json();
          const content =
            typeof data?.clauseContent === 'string' ? data.clauseContent : '';
          next[clause.id] = content || '';
        } catch {
          next[clause.id] = '';
        }
      }
      if (!cancelled) setClauseContents((prev) => ({ ...prev, ...next }));
    };
    fetchAll();
    return () => { cancelled = true; };
  }, [clauses]);

  const handleViewClause = (clause: ClauseWithSection) => {
    const docId = clause.section?.doc?.id;
    if (!docId || !clause.id) return;
    setNavigatingClauseId(clause.id);
    const idx = getIndicesForClause(docId, clause.id);
    if (!idx) {
      setNavigatingClauseId(null);
      return;
    }
    setSelection(docId, idx.sectionIndex, idx.clauseIndex, clause.cid ?? null, 'rejected');
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

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Rejected</h1>
        <Card>
          <CardContent className="py-12 flex items-center justify-center gap-3 text-muted-foreground">
            <AlertCircle className="h-10 w-10" />
            <span>{error}</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  const contractTitle = (c: ClauseWithSection) =>
    c.section?.doc?.title ?? 'Untitled';
  const clientName = (c: ClauseWithSection) => {
    const client = c.section?.doc?.client;
    return client
      ? [client.firstName, client.lastName].filter(Boolean).join(' ').trim() || '—'
      : '—';
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Rejected</h1>
        <p className="text-muted-foreground mt-1">
          Clauses returned for revision {divisionLabel ? `— ${divisionLabel}` : ''}
        </p>
      </div>

      {clauses.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="font-medium">No rejected clauses</p>
            <p className="text-sm text-muted-foreground">
              Clauses rejected by your division leader will appear here for you to revise and resubmit.
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
                {clause.cid && (
                  <div className="rounded border bg-background/50 p-3">
                    <p
                      className="text-sm text-foreground line-clamp-2"
                      title={clauseContents[clause.id] || undefined}
                    >
                      {clauseContents[clause.id] ?? 'Loading...'}
                    </p>
                  </div>
                )}
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
