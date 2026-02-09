'use client'

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { ArrowLeft, FileText, Loader2, Eye, Pencil, ClipboardList } from 'lucide-react';
import { useUser } from '@/app/contexts/UserContext';
import { useAssignment } from '@/app/contexts/AssignmentContext';
import { useDivisionMemberClauses } from '@/app/contexts/DivisionMemberClausesContext';
import { USER_ROLE, URLs } from '@/utils/constants';
import { formatRelativeDate } from '@/utils/utility';

type ClauseWithSection = {
  id: string;
  cid?: string;
  status?: number;
  assignedAt?: string;
  section?: {
    id: string;
    doc?: { id: string; title?: string; client?: { firstName?: string; lastName?: string } };
  };
};

export default function ClauseAssignmentsClausesPage() {
  const router = useRouter();
  const { userRole } = useUser();
  const { selectedContractId, setSelection } = useAssignment();
  const { clauses: allClauses, loading, getDocFromClauses, getIndicesForClause } = useDivisionMemberClauses();
  const [clauseContents, setClauseContents] = useState<Record<string, string>>({});

  const clauses = useMemo(
    () =>
      selectedContractId
        ? allClauses.filter((c) => String(c.section?.doc?.id) === String(selectedContractId))
        : [],
    [allClauses, selectedContractId]
  );

  const doc = useMemo(
    () => (selectedContractId ? getDocFromClauses(selectedContractId) : null),
    [selectedContractId, getDocFromClauses]
  );

  const contractTitle = doc?.title ?? 'Untitled';
  const clientName = doc?.client
    ? [doc.client.firstName, doc.client.lastName].filter(Boolean).join(' ').trim() || '—'
    : '—';

  const indicesMap = useMemo(() => {
    const map: Record<string, { sectionIndex: number; clauseIndex: number }> = {};
    if (!selectedContractId) return map;
    clauses.forEach((c) => {
      const idx = getIndicesForClause(selectedContractId, c.id);
      if (idx) map[c.id] = idx;
    });
    return map;
  }, [selectedContractId, clauses, getIndicesForClause]);

  useEffect(() => {
    if (userRole !== null && userRole !== USER_ROLE.DIVISION_MEMBER) {
      router.replace('/my-contracts');
      return;
    }
  }, [userRole, router]);

  useEffect(() => {
    if (!selectedContractId) {
      router.replace('/clause-assignments');
      return;
    }
  }, [selectedContractId, router]);

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
          const content = typeof data?.clauseContent === 'string' ? data.clauseContent : '';
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

  const handleWorkOn = (clause: ClauseWithSection) => {
    const idx = indicesMap[clause.id];
    if (!idx) return;
    setSelection(selectedContractId, idx.sectionIndex, idx.clauseIndex, null, 'clauses');
    router.push('/clause-assignments/clause');
  };

  const handleView = (clause: ClauseWithSection) => {
    const idx = indicesMap[clause.id];
    if (!idx) return;
    setSelection(selectedContractId, idx.sectionIndex, idx.clauseIndex, clause.cid ?? null, 'clauses');
    router.push('/clause-assignments/clause');
  };

  const statusLabel = (status: number) => {
    switch (status) {
      case 0: return 'Assigned';
      case 1: return 'Submitted';
      case 2: return 'Approved';
      case 3: return 'Rejected';
      default: return 'Unknown';
    }
  };

  const statusVariant = (status: number): 'secondary' | 'default' | 'destructive' | 'outline' => {
    switch (status) {
      case 2: return 'default';
      case 3: return 'destructive';
      default: return 'secondary';
    }
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

  return (
    <div className="p-6 space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.push('/clause-assignments')}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Clause Assignments
      </Button>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-brand-secondary/10 flex items-center justify-center shrink-0">
          <FileText className="h-6 w-6 text-brand-secondary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{contractTitle}</h1>
          <p className="text-muted-foreground">{clientName}</p>
          <p className="text-sm text-muted-foreground mt-1">Your assigned clauses</p>
        </div>
      </div>

      {clauses.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="font-medium">No clauses assigned</p>
            <p className="text-sm text-muted-foreground">
              Clauses assigned to you for this contract will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {clauses.map((clause) => {
            const status = typeof clause.status === 'number' ? clause.status : 0;
            const isPending = status === 0;
            const content = clause.cid
              ? (clauseContents[clause.id] ?? 'Loading...')
              : 'Click Work on to edit clause';
            const assignedTs = typeof clause.assignedAt === 'number'
              ? clause.assignedAt
              : typeof clause.assignedAt === 'string'
                ? Number(clause.assignedAt) || undefined
                : undefined;

            return (
              <Card
                key={clause.id}
                className="rounded-lg border bg-muted/30 hover:border-brand-secondary/50 transition-colors"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusVariant(status)} className={status === 2 ? 'bg-green-600' : ''}>
                      {statusLabel(status)}
                    </Badge>
                  </div>
                  <p
                    className="text-sm text-foreground line-clamp-2"
                    title={clauseContents[clause.id] || undefined}
                  >
                    {content}
                  </p>
                  {assignedTs != null && (
                    <p className="text-xs text-muted-foreground">
                      Assigned: {formatRelativeDate(assignedTs)}
                    </p>
                  )}
                  <div className="pt-2 border-t">
                    {isPending ? (
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => handleWorkOn(clause)}
                        disabled={!indicesMap[clause.id]}
                      >
                        <Pencil className="h-4 w-4" />
                        Work on
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 cursor-pointer"
                        onClick={() => handleView(clause)}
                        disabled={!indicesMap[clause.id]}
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
