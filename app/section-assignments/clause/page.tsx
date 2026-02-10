'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConfig, useConnection } from 'wagmi';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ArrowLeft, FileText, Loader2, CheckCircle, XCircle, UserPlus } from 'lucide-react';
import { useContractDoc } from '@/app/contexts/ContractDocContext';
import { useContracts } from '@/app/contexts/ContractsContext';
import { useSubgraphRefresh } from '@/app/contexts/SubgraphRefreshContext';
import { useAssignment } from '@/app/contexts/AssignmentContext';
import { DIVISION_LABELS, USER_ROLE, URLs } from '@/utils/constants';
import { useUser } from '@/app/contexts/UserContext';
import { approveClauseWithSectionUpdate } from '@/utils/utility';
import { rejectClause, reassignClause } from '@/utils/interact';
import { toast } from 'sonner';
import type { DocSection } from '@/app/data/interfaces';

export default function SectionAssignmentsClausePage() {
  const router = useRouter();
  const config = useConfig();
  const { address } = useConnection();
  const { userRole } = useUser();
  const { selectedContractId, selectedSectionIndex, selectedClauseIndex, selectedClauseCid, selectedFromRoute } = useAssignment();
  const { profile, loadDoc, getDoc, loadingDocId, loadingProfile, error: contextError, refetchDoc } = useContractDoc();
  const { refetch: refetchContracts } = useContracts();
  const { refresh: refreshSubgraph } = useSubgraphRefresh();
  const contractId = selectedContractId ?? '';
  const sectionIndex = selectedSectionIndex ?? -1;
  const clauseIndex = selectedClauseIndex ?? -1;
  const [sectionName, setSectionName] = useState('');
  const [clauseContent, setClauseContent] = useState('');
  const [contentLoaded, setContentLoaded] = useState(false);
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | 'reassign' | null>(null);

  useEffect(() => {
    if (userRole !== null && userRole !== USER_ROLE.DIVISION_LEADER) {
      router.replace('/my-contracts');
      return;
    }
  }, [userRole, router]);

  useEffect(() => {
    if (!selectedContractId || selectedSectionIndex == null || selectedSectionIndex < 0 || selectedClauseIndex == null || selectedClauseIndex < 0) {
      router.replace('/section-assignments');
      return;
    }
    loadDoc(selectedContractId);
  }, [selectedContractId, selectedSectionIndex, selectedClauseIndex, loadDoc, router]);

  useEffect(() => {
    setContentLoaded(false);
  }, [contractId, sectionIndex, clauseIndex, selectedClauseCid]);

  const doc = contractId ? getDoc(contractId) : undefined;
  const loading =
    loadingDocId === contractId ||
    (contractId && doc === undefined) ||
    (profile === undefined && loadingProfile);
  const notInDivision = profile === null && !loadingProfile;
  const docNotFound = contractId && doc === null;
  const error = contextError ?? (notInDivision ? 'You are not assigned to a division.' : docNotFound ? 'Contract not found.' : null);

  useEffect(() => {
    if (!doc || sectionIndex < 0 || clauseIndex < 0 || contentLoaded) return;

    if (selectedClauseCid) {
      setSectionName(`Section ${sectionIndex + 1}`);
      fetch(`${URLs.TBGateWay}${selectedClauseCid}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const content = typeof data?.clauseContent === 'string' ? data.clauseContent : '';
          setClauseContent(content);
        })
        .catch(() => setClauseContent(''))
        .finally(() => setContentLoaded(true));
      return;
    }

    const sectionAt = doc.sections?.[sectionIndex] as { cid?: string } | undefined;
    const sectionCid = sectionAt?.cid;
    if (!sectionCid) {
      setSectionName(`Section ${sectionIndex + 1}`);
      setClauseContent('');
      setContentLoaded(true);
      return;
    }
    fetch(`${URLs.TBGateWay}${sectionCid}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const section = data as DocSection | null;
        if (section?.sectionContent?.[clauseIndex]) {
          const clause = section.sectionContent[clauseIndex];
          setSectionName(section.sectionName ?? `Section ${sectionIndex + 1}`);
          setClauseContent(clause.clauseContent ?? '');
        } else {
          setSectionName(`Section ${sectionIndex + 1}`);
          setClauseContent('');
        }
      })
      .catch(() => {
        setSectionName(`Section ${sectionIndex + 1}`);
        setClauseContent('');
      })
      .finally(() => setContentLoaded(true));
  }, [doc, sectionIndex, clauseIndex, contentLoaded, selectedClauseCid]);

  const contractTitle = doc?.title ?? 'Untitled';
  const divisionLabel = profile ? (DIVISION_LABELS[profile.dcategory] ?? `Division #${profile.dcategory}`) : '';

  const rawSections = doc?.sections ?? [];
  const sectionAt = rawSections[sectionIndex];
  const clauseAt = sectionAt?.clauses?.[clauseIndex];
  const clauseIdOnChain = clauseAt?.id != null ? Number(clauseAt.id) : NaN;

  const handleApprove = async () => {
    const sectionCid = (sectionAt as { cid?: string } | undefined)?.cid;
    if (!config || !address || !sectionCid || Number.isNaN(clauseIdOnChain)) {
      toast.error('Missing data to approve');
      return;
    }
    setActionLoading('approve');
    try {
      const res = await fetch(`${URLs.TBGateWay}${sectionCid}`);
      const section = res.ok ? (await res.json()) : null;
      if (!section?.sectionName) {
        toast.error('Could not load section data');
        return;
      }
      const ok = await approveClauseWithSectionUpdate(
        config,
        address,
        clauseIdOnChain,
        { sectionName: section.sectionName, sectionContent: section.sectionContent ?? [] },
        clauseIndex,
        clauseContent,
      );
      if (ok) {
        toast.success('Clause approved');
        router.back();
        setTimeout(async () => {
          await refetchDoc(contractId);
          await refetchContracts();
          refreshSubgraph();
        }, 3000);
      } else {
        toast.error('Failed to approve clause');
      }
    } catch (e) {
      console.error('Approve error:', e);
      toast.error(e instanceof Error ? e.message : 'Failed to approve clause');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!config || !address || Number.isNaN(clauseIdOnChain)) {
      toast.error('Missing data to reject');
      return;
    }
    setActionLoading('reject');
    try {
      const ok = await rejectClause(config, address, clauseIdOnChain);
      if (ok) {
        toast.success('Clause rejected');
        router.back();
        setTimeout(async () => {
          await refetchDoc(contractId);
          await refetchContracts();
          refreshSubgraph();
        }, 3000);
      } else {
        toast.error('Failed to reject clause');
      }
    } catch (e) {
      console.error('Reject error:', e);
      toast.error(e instanceof Error ? e.message : 'Failed to reject clause');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReassign = async () => {
    if (!config || !address || Number.isNaN(clauseIdOnChain)) {
      toast.error('Missing data to reassign');
      return;
    }
    setActionLoading('reassign');
    try {
      const ok = await reassignClause(config, address, clauseIdOnChain);
      if (ok) {
        toast.success('Clause reassigned');
        router.back();
        setTimeout(async () => {
          await refetchDoc(contractId);
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
      setActionLoading(null);
    }
  };

  if (userRole !== null && userRole !== USER_ROLE.DIVISION_LEADER) {
    return null;
  }

  if (loading || !contentLoaded) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-brand-secondary/10 flex items-center justify-center shrink-0">
          <FileText className="h-6 w-6 text-brand-secondary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{contractTitle}</h1>
          <p className="text-muted-foreground">{divisionLabel}</p>
          <p className="text-sm text-muted-foreground mt-1">{sectionName} — Clause {clauseIndex + 1}</p>
        </div>
      </div>

      <Card className="gap-2">
        <CardHeader>
          <CardTitle className="text-lg">View clause content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            id="clause-content"
            value={clauseContent}
            readOnly
            rows={8}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[160px]"
            placeholder="Enter clause content..."
          />
          {selectedFromRoute === 'review' && (
            <div className="flex items-center gap-3 pt-2 border-t">
              <Button
                variant="default"
                className="gap-2"
                disabled={actionLoading !== null}
                onClick={handleApprove}
              >
                {actionLoading === 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {actionLoading === 'approve' ? 'Approving...' : 'Approve'}
              </Button>
              <Button
                variant="outline"
                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                disabled={actionLoading !== null}
                onClick={handleReject}
              >
                {actionLoading === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                {actionLoading === 'reject' ? 'Rejecting...' : 'Reject'}
              </Button>
            </div>
          )}
          {selectedFromRoute === 'rejected' && (
            <div className="flex items-center gap-3 pt-2 border-t">
              <Button
                variant="outline"
                className="gap-2 cursor-pointer"
                disabled={actionLoading !== null}
                onClick={handleReassign}
              >
                {actionLoading === 'reassign' ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                {actionLoading === 'reassign' ? 'Reassigning...' : 'Reassign'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
