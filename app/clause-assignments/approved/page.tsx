'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConnection } from 'wagmi';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { FileText, Loader2, Eye, ClipboardList } from 'lucide-react';
import { getContractsByDivisionMember, getContractById } from '@/utils/subgraph';
import { useUser } from '@/app/contexts/UserContext';
import { useAssignment } from '@/app/contexts/AssignmentContext';
import { useSubgraphRefresh } from '@/app/contexts/SubgraphRefreshContext';
import { USER_ROLE, URLs } from '@/utils/constants';

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

export default function ClauseAssignmentsApprovedPage() {
  const router = useRouter();
  const { address } = useConnection();
  const { userRole } = useUser();
  const { setSelection } = useAssignment();
  const { refreshCounter } = useSubgraphRefresh();
  const [loading, setLoading] = useState(true);
  const [clauses, setClauses] = useState<ClauseWithSection[]>([]);
  const [clauseContents, setClauseContents] = useState<Record<string, string>>({});
  const [navigatingClauseId, setNavigatingClauseId] = useState<string | null>(null);

  useEffect(() => {
    if (userRole !== null && userRole !== USER_ROLE.DIVISION_MEMBER) {
      router.replace('/my-contracts');
      return;
    }
  }, [userRole, router]);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getContractsByDivisionMember(address)
      .then((list) => {
        if (cancelled) return;
        const arr = Array.isArray(list) ? list : [];
        const status2 = arr.filter((c: ClauseWithSection) => c.status === 2);
        setClauses(status2);
      })
      .catch(() => {
        if (!cancelled) setClauses([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [address, refreshCounter]);

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

  const handleViewClause = async (clause: ClauseWithSection) => {
    const docId = clause.section?.doc?.id;
    const sectionId = clause.section?.id;
    if (!docId || !sectionId) return;
    setNavigatingClauseId(clause.id);
    try {
      const doc = await getContractById(docId);
      if (!doc?.sections) {
        setNavigatingClauseId(null);
        return;
      }
      const sectionIndex = doc.sections.findIndex(
        (s: { id?: string }) => String(s.id) === String(sectionId)
      );
      if (sectionIndex < 0) {
        setNavigatingClauseId(null);
        return;
      }
      const section = doc.sections[sectionIndex] as { clauses?: Array<{ id?: string }> };
      const clauseIndex = (section.clauses ?? []).findIndex(
        (c: { id?: string }) => String(c.id) === String(clause.id)
      );
      if (clauseIndex < 0) {
        setNavigatingClauseId(null);
        return;
      }
      setSelection(docId, sectionIndex, clauseIndex, clause.cid ?? null, 'approved');
      router.push('/clause-assignments/clause');
    } finally {
      setNavigatingClauseId(null);
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
