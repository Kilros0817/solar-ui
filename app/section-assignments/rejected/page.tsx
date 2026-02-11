'use client'

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useConfig, useConnection } from 'wagmi';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { reassignClause } from '@/utils/interact';
import { DIVISION_LABELS, USER_ROLE } from '@/utils/constants';
import { useUser } from '@/app/contexts/UserContext';
import { useAssignment } from '@/app/contexts/AssignmentContext';
import { useDivisionLeaderSections } from '@/app/contexts/DivisionLeaderSectionsContext';
import { useContractDoc } from '@/app/contexts/ContractDocContext';
import { useContracts } from '@/app/contexts/ContractsContext';
import { useSubgraphRefresh } from '@/app/contexts/SubgraphRefreshContext';
import { FileText, Loader2, Eye, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

type RejectedClauseLeader = {
  id: string;
  cid?: string | null;
  status: number;
  sectionId: string;
  section: { id: string; doc: { id: string; title?: string } };
  divisionMember?: { id: string; firstName?: string; lastName?: string; email?: string } | null;
};

function getMemberLabel(m: RejectedClauseLeader['divisionMember']): string {
  if (!m) return '—';
  const name = [m.firstName, m.lastName].filter(Boolean).join(' ').trim();
  return name || m.email || m.id || '—';
}

export default function SectionAssignmentsRejectedPage() {
  const router = useRouter();
  const config = useConfig();
  const { address } = useConnection();
  const { userRole } = useUser();
  const { setSelection } = useAssignment();
  const { refetchDoc } = useContractDoc();
  const { refetch: refetchContracts } = useContracts();
  const { refresh: refreshSubgraph } = useSubgraphRefresh();
  const { sections, loading, getDocFromSections, getSectionIndex } = useDivisionLeaderSections();
  const [divisionLabel, setDivisionLabel] = useState('');
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [reassigningId, setReassigningId] = useState<string | null>(null);

  const clauses = useMemo(() => {
    const flat: RejectedClauseLeader[] = [];
    sections.forEach((sec) => {
      const sectionId = sec.id;
      const doc = sec.doc;
      (sec.clauses ?? []).forEach((c) => {
        if (c.status === 3) {
          flat.push({
            id: c.id,
            cid: (c as { cid?: string | null }).cid ?? null,
            status: 3,
            sectionId,
            section: { id: sectionId, doc: doc ?? { id: '', title: '' } },
            divisionMember: (c as { divisionMember?: RejectedClauseLeader['divisionMember'] }).divisionMember ?? null,
          });
        }
      });
    });
    return flat;
  }, [sections]);

  useEffect(() => {
    if (userRole !== null && userRole !== USER_ROLE.DIVISION_LEADER) {
      if (userRole === USER_ROLE.DIVISION_MEMBER) {
        router.replace('/clause-assignments');
      } else {
        router.replace('/my-contracts');
      }
      return;
    }
  }, [userRole, router]);

  useEffect(() => {
    if (userRole === USER_ROLE.DIVISION_LEADER && sections.length > 0 && !divisionLabel) {
      const dcat = (sections[0] as { divisionLeader?: { dcategory?: number } })?.divisionLeader?.dcategory;
      if (dcat != null) setDivisionLabel(DIVISION_LABELS[dcat] ?? `Division #${dcat}`);
    }
  }, [userRole, sections, divisionLabel]);

  const handleReassign = async (item: RejectedClauseLeader) => {
    if (!config || !address) {
      toast.error('Wallet not connected');
      return;
    }
    const clauseId = Number(item.id);
    if (Number.isNaN(clauseId)) {
      toast.error('Invalid clause');
      return;
    }
    setReassigningId(item.id);
    try {
      const ok = await reassignClause(config, address, clauseId);
      if (ok) {
        toast.success('Clause reassigned');
        setTimeout(async () => {
          const contractId = item.section?.doc?.id;
          if (contractId) await refetchDoc(contractId);
          await refetchContracts();
          refreshSubgraph();
        }, 3000);
      } else {
        toast.error('Failed to reassign clause');
      }
    } catch (e) {
      console.error('Reassign error:', e);
      toast.error(e instanceof Error ? e.message : 'Failed to reassign clause');
    } finally {
      setReassigningId(null);
    }
  };

  const handleViewClause = (item: RejectedClauseLeader) => {
    const contractId = item.section?.doc?.id;
    const sectionId = item.section?.id;
    const clauseId = item.id;
    if (!contractId || !sectionId || !clauseId) return;
    setWorkingId(item.id);
    const doc = getDocFromSections(contractId);
    const secIdx = getSectionIndex(contractId, sectionId);
    if (!doc || secIdx < 0) {
      setWorkingId(null);
      return;
    }
    const sec = doc.sections[secIdx];
    const clauseIdx = (sec?.clauses ?? []).findIndex((c) => String((c as { id?: string }).id) === String(clauseId));
    if (clauseIdx < 0) {
      setWorkingId(null);
      return;
    }
    setSelection(contractId, secIdx, clauseIdx, item.cid ?? null, 'rejected');
    router.push('/section-assignments/clause');
    setWorkingId(null);
  };

  if (userRole !== USER_ROLE.DIVISION_LEADER) {
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
        <h1 className="text-3xl font-bold">Rejected</h1>
        <p className="text-muted-foreground mt-1">
          Clauses you rejected {divisionLabel ? `— ${divisionLabel}` : ''}
        </p>
      </div>

      {clauses.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="font-medium">No rejected clauses</p>
            <p className="text-sm text-muted-foreground">
              Clauses you reject will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {clauses.map((item) => {
            const sec = sections.find((s) => String(s.id) === String(item.sectionId));
            const sectionStatus = typeof (sec as { status?: number })?.status === 'number' ? (sec as { status: number }).status : 0;
            const showReassign = sectionStatus === 0;
            return (
            <Card key={item.id} className="flex flex-col w-full">
              <CardContent className="p-4 flex flex-col gap-3 flex-1">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Document
                  </p>
                  <p className="font-medium text-sm truncate" title={item.section?.doc?.title ?? 'Untitled'}>
                    {item.section?.doc?.title ?? 'Untitled'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Section ID
                  </p>
                  <p className="text-sm text-muted-foreground">{item.section?.id ?? '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Division member
                  </p>
                  <p className="text-sm text-muted-foreground">{getMemberLabel(item.divisionMember)}</p>
                </div>
                <div className="flex justify-end gap-2 mt-auto pt-2 border-t">
                  {showReassign && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 shrink-0 cursor-pointer"
                    disabled={reassigningId === item.id}
                    onClick={() => handleReassign(item)}
                  >
                    {reassigningId === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="h-3.5 w-3.5" />
                    )}
                    {reassigningId === item.id ? 'Reassigning...' : 'Reassign'}
                  </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 shrink-0 cursor-pointer"
                    disabled={workingId === item.id}
                    onClick={() => handleViewClause(item)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {workingId === item.id ? 'Opening...' : 'View'}
                  </Button>
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
