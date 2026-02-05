'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConnection } from 'wagmi';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { ContractList } from '../components/ContractList';
import { ContractDetails } from '../components/ContractDetails';
import { useUser } from '../contexts/UserContext';
import { useNewContract } from '../contexts/NewContractContext';
import { useAssignment } from '../contexts/AssignmentContext';
import { getCurrentUserProfile, getContractsByDivisionMember, getContractsByDivisionLeader, getContractById } from '@/utils/subgraph';
import { DIVISION_LABELS, USER_ROLE } from '@/utils/constants';
import { FileText, Loader2, Pencil, Eye } from 'lucide-react';

type PendingClauseMember = {
  id: string;
  status: number;
  section: { id: string; doc: { id: string; title?: string } };
};

type PendingClauseLeader = {
  id: string;
  status: number;
  sectionId: string;
  section: { id: string; doc: { id: string; title?: string } };
};

export default function PendingPage() {
  const router = useRouter();
  const { address } = useConnection();
  const { userRole } = useUser();
  const { setFrom, setSelectedContract } = useNewContract();
  const { setSelection } = useAssignment();
  const [loading, setLoading] = useState(true);
  const [pendingMember, setPendingMember] = useState<PendingClauseMember[]>([]);
  const [pendingLeader, setPendingLeader] = useState<PendingClauseLeader[]>([]);
  const [divisionLabel, setDivisionLabel] = useState('');
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [selectedContractDetails, setSelectedContractDetails] = useState<number | null>(null);

  useEffect(() => {
    if (userRole === null) {
      router.push('/login');
    } else if (userRole === USER_ROLE.NO_ROLE) {
      router.push('/register');
    }
  }, [userRole, router]);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }
    const run = async () => {
      setLoading(true);
      try {
        if (userRole === USER_ROLE.DIVISION_MEMBER) {
          const profile = await getCurrentUserProfile(address);
          if (profile?.dcategory) {
            setDivisionLabel(DIVISION_LABELS[profile.dcategory] ?? `Division #${profile.dcategory}`);
          }
          const clauses = await getContractsByDivisionMember(address);
          const list = Array.isArray(clauses) ? clauses : [];
          const pending = list.filter((c: { status?: number }) => c.status === 0) as PendingClauseMember[];
          setPendingMember(pending);
          setPendingLeader([]);
        } else if (userRole === USER_ROLE.DIVISION_LEADER) {
          const profile = await getCurrentUserProfile(address);
          if (profile?.dcategory) {
            setDivisionLabel(DIVISION_LABELS[profile.dcategory] ?? `Division #${profile.dcategory}`);
          }
          const sections = await getContractsByDivisionLeader(address);
          const list = Array.isArray(sections) ? sections : [];
          const flat: PendingClauseLeader[] = [];
          list.forEach((sec: { id: string; clauses?: Array<{ id: string; status?: number }>; doc?: { id: string; title?: string } }) => {
            const sectionId = sec.id;
            const doc = sec.doc;
            (sec.clauses ?? []).forEach((c: { id: string; status?: number }) => {
              if (c.status === 0) {
                flat.push({
                  id: c.id,
                  status: 0,
                  sectionId,
                  section: { id: sectionId, doc: doc ?? { id: '', title: '' } },
                });
              }
            });
          });
          setPendingLeader(flat);
          setPendingMember([]);
        } else {
          setPendingMember([]);
          setPendingLeader([]);
        }
      } catch (e) {
        console.error('Failed to load pending:', e);
        setPendingMember([]);
        setPendingLeader([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [address, userRole]);

  const handleWorkOnMember = async (item: PendingClauseMember) => {
    const contractId = item.section?.doc?.id;
    const sectionId = item.section?.id;
    const clauseId = item.id;
    if (!contractId || !sectionId || !clauseId) return;
    setWorkingId(item.id);
    try {
      const doc = await getContractById(contractId);
      const sections = (doc as { sections?: Array<{ id?: string; clauses?: Array<{ id?: string }> }> })?.sections ?? [];
      const secIdx = sections.findIndex((s) => String(s.id) === String(sectionId));
      if (secIdx < 0) return;
      const clauseIdx = sections[secIdx]?.clauses?.findIndex((c) => String(c.id) === String(clauseId)) ?? -1;
      if (clauseIdx < 0) return;
      setSelection(contractId, secIdx, clauseIdx);
      router.push('/assignments/clause');
    } catch (e) {
      console.error('Failed to open clause:', e);
    } finally {
      setWorkingId(null);
    }
  };

  const handleViewLeader = async (item: PendingClauseLeader) => {
    const contractId = item.section?.doc?.id;
    const sectionId = item.section?.id;
    const clauseId = item.id;
    if (!contractId || !sectionId || !clauseId) return;
    setWorkingId(item.id);
    try {
      const doc = await getContractById(contractId);
      const sections = (doc as { sections?: Array<{ id?: string; clauses?: Array<{ id?: string }> }> })?.sections ?? [];
      const secIdx = sections.findIndex((s) => String(s.id) === String(sectionId));
      if (secIdx < 0) return;
      const clauseIdx = sections[secIdx]?.clauses?.findIndex((c) => String(c.id) === String(clauseId)) ?? -1;
      if (clauseIdx < 0) return;
      setSelection(contractId, secIdx, clauseIdx);
      router.push('/assignments/clause');
    } catch (e) {
      console.error('Failed to open clause:', e);
    } finally {
      setWorkingId(null);
    }
  };

  const isDivisionMember = userRole === USER_ROLE.DIVISION_MEMBER;
  const isDivisionLeader = userRole === USER_ROLE.DIVISION_LEADER;
  const showClausePending = isDivisionMember || isDivisionLeader;
  const pendingList = isDivisionMember ? pendingMember : pendingLeader;

  if (userRole === null || userRole === USER_ROLE.NO_ROLE) {
    return null;
  }

  if (showClausePending) {
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

        {pendingList.length === 0 ? (
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
            {isDivisionMember &&
              (pendingList as PendingClauseMember[]).map((item) => (
                <Card key={item.id} className="flex flex-col w-full">
                  <CardContent className="p-4 flex flex-col gap-3 flex-1">
                    <span className="font-medium text-sm truncate">
                      {item.section?.doc?.title ?? 'Untitled'}
                    </span>
                    <p className="text-xs text-muted-foreground">Section ID: {item.section?.id ?? '—'}</p>
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
            {isDivisionLeader &&
              (pendingList as PendingClauseLeader[]).map((item) => (
                <Card key={item.id} className="flex flex-col w-full">
                  <CardContent className="p-4 flex flex-col gap-3 flex-1">
                    <span className="font-medium text-sm truncate">
                      {item.section?.doc?.title ?? 'Untitled'}
                    </span>
                    <p className="text-xs text-muted-foreground">Section ID: {item.section?.id ?? '—'}</p>
                    <div className="flex justify-end mt-auto pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 shrink-0"
                        disabled={workingId === item.id}
                        onClick={() => handleViewLeader(item)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {workingId === item.id ? 'Opening...' : 'View'}
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

  // Legal team / Admin: contract-level pending (existing behavior)
  const handleCreateContract = () => {
    if (userRole === USER_ROLE.LEGAL_TEAM) {
      setFrom('pending');
      router.push('/new-contract');
    }
  };

  const isDivisionLeaderForList = userRole === USER_ROLE.DIVISION_LEADER;
  if (selectedContractDetails != null && !isDivisionLeaderForList) {
    return (
      <ContractDetails
        contractId={selectedContractDetails}
        onBack={() => setSelectedContractDetails(null)}
      />
    );
  }

  const onViewContract = isDivisionLeaderForList
    ? (contractId: number) => setSelectedContract(String(contractId))
    : (contractId: number) => setSelectedContractDetails(contractId);

  return (
    <ContractList
      title="Pending"
      filterStatus="pending"
      onCreateContract={handleCreateContract}
      onViewContract={onViewContract}
      getViewPath={isDivisionLeaderForList ? () => '/assignments' : undefined}
      showCreateButton={userRole === USER_ROLE.LEGAL_TEAM}
      showCreateWhenEmpty={false}
    />
  );
}
