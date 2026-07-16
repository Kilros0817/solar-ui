'use client'

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useConfig, useConnection } from 'wagmi';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ArrowLeft, FileText, Loader2, CheckCircle, XCircle, History, RotateCcw } from 'lucide-react';
import { useContractDoc } from '@/app/contexts/ContractDocContext';
import { useContracts } from '@/app/contexts/ContractsContext';
import { usePostgresRefresh } from '@/app/contexts/PostgresRefreshContext';
import { useAssignment } from '@/app/contexts/AssignmentContext';
import { DIVISION_LABELS, USER_ROLE, URLs } from '@/utils/constants';
import { useUser } from '@/app/contexts/UserContext';
import { approveClauseWithSectionUpdate } from '@/utils/utility';
import { rejectClause } from '@/utils/interact';
import { getClauseHistories } from '@/utils/postgres';
import { formatClauseHistoryReadable } from '@/utils/utility';
import { toast } from 'sonner';
import type { DocSection } from '@/app/data/interfaces';
import { RejectReasonDialog } from '@/app/components/RejectReasonDialog';
import { RejectionReasonButton } from '@/app/components/RejectionReasonButton';
import { RejectionReasonModal } from '@/app/components/RejectionReasonModal';
import { ClauseLexicalEditor } from '@/app/components/editor/ClauseLexicalEditor';

type ClauseHistoryItem = { type?: string; id?: string; date?: string | number; cid?: string | null };

export default function SectionAssignmentsClausePage() {
  const router = useRouter();
  const config = useConfig();
  const { address } = useConnection();
  const { userRole } = useUser();
  const { selectedContractId, selectedSectionIndex, selectedClauseIndex, selectedClauseCid, selectedFromRoute } = useAssignment();
  const { profile, loadDoc, getDoc, loadingDocId, loadingProfile, error: contextError, refetchDoc } = useContractDoc();
  const { refetch: refetchContracts } = useContracts();
  const { refresh: refreshpostgres } = usePostgresRefresh();
  const contractId = selectedContractId ?? '';
  const sectionIndex = selectedSectionIndex ?? -1;
  const clauseIndex = selectedClauseIndex ?? -1;
  const [sectionName, setSectionName] = useState('');
  const [clauseContent, setClauseContent] = useState('');
  const [contentLoaded, setContentLoaded] = useState(false);
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | 'reassign' | null>(null);
  const [showRejectClauseDialog, setShowRejectClauseDialog] = useState(false);
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [histories, setHistories] = useState<ClauseHistoryItem[]>([]);
  const [loadingHistories, setLoadingHistories] = useState(false);
  const [loadingHistoryCid, setLoadingHistoryCid] = useState<string | null>(null);
  const [contentVersion, setContentVersion] = useState(0);
  const [isViewingPastVersion, setIsViewingPastVersion] = useState(false);
  const currentClauseContentRef = useRef('');

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
          currentClauseContentRef.current = content;
          setIsViewingPastVersion(false);
          setContentVersion((v) => v + 1);
        })
        .catch(() => {
          setClauseContent('');
          currentClauseContentRef.current = '';
          setIsViewingPastVersion(false);
          setContentVersion((v) => v + 1);
        })
        .finally(() => setContentLoaded(true));
      return;
    }

    const sectionAt = doc.sections?.[sectionIndex] as { cid?: string } | undefined;
    const sectionCid = sectionAt?.cid;
    if (!sectionCid) {
      setSectionName(`Section ${sectionIndex + 1}`);
      setClauseContent('');
      currentClauseContentRef.current = '';
      setIsViewingPastVersion(false);
      setContentVersion((v) => v + 1);
      setContentLoaded(true);
      return;
    }
    fetch(`${URLs.TBGateWay}${sectionCid}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const section = data as DocSection | null;
        if (section?.sectionContent?.[clauseIndex]) {
          const clause = section.sectionContent[clauseIndex];
          const content = clause.clauseContent ?? '';
          setSectionName(section.sectionName ?? `Section ${sectionIndex + 1}`);
          setClauseContent(content);
          currentClauseContentRef.current = content;
          setIsViewingPastVersion(false);
          setContentVersion((v) => v + 1);
        } else {
          setSectionName(`Section ${sectionIndex + 1}`);
          setClauseContent('');
          currentClauseContentRef.current = '';
          setIsViewingPastVersion(false);
          setContentVersion((v) => v + 1);
        }
      })
      .catch(() => {
        setSectionName(`Section ${sectionIndex + 1}`);
        setClauseContent('');
        currentClauseContentRef.current = '';
        setIsViewingPastVersion(false);
        setContentVersion((v) => v + 1);
      })
      .finally(() => setContentLoaded(true));
  }, [doc, sectionIndex, clauseIndex, contentLoaded, selectedClauseCid]);

  const contractTitle = doc?.title ?? 'Untitled';
  const divisionLabel = profile ? (DIVISION_LABELS[profile.dcategory] ?? `Division #${profile.dcategory}`) : '';

  const rawSections = doc?.sections ?? [];
  const sectionAt = rawSections[sectionIndex];
  const clauseAt = sectionAt?.clauses?.[clauseIndex];
  const clauseIdOnChain = clauseAt?.id != null ? Number(clauseAt.id) : NaN;
  const clauseStatus = typeof (clauseAt as { status?: number })?.status === 'number' ? (clauseAt as { status: number }).status : 0;
  const isClauseRejected = clauseStatus === 3;
  const clauseRejectReason = (clauseAt as { reject_reason?: string })?.reject_reason ?? '';
  const sectionStatus = typeof (sectionAt as { status?: number })?.status === 'number' ? (sectionAt as { status: number }).status : 0;
  const postgresClauseId = !Number.isNaN(clauseIdOnChain) ? clauseIdOnChain : null;

  const openHistoryModal = async () => {
    if (postgresClauseId == null) return;
    setShowHistoryModal(true);
    setLoadingHistories(true);
    setHistories([]);
    try {
      const list = await getClauseHistories(String(postgresClauseId));
      const sorted = Array.isArray(list)
        ? [...list].sort((a, b) => {
          const da = a.date != null ? Number(a.date) : 0;
          const db = b.date != null ? Number(b.date) : 0;
          return da - db; // chronological: oldest first
        })
        : [];
      setHistories(sorted);
    } catch (e) {
      console.error('Failed to load clause histories:', e);
      toast.error('Failed to load history');
      setHistories([]);
    } finally {
      setLoadingHistories(false);
    }
  };

  const handleViewHistoryCid = async (cid: string) => {
    if (!cid || loadingHistoryCid) return;
    setLoadingHistoryCid(cid);
    try {
      const res = await fetch(`${URLs.TBGateWay}${cid}`);
      const data = res.ok ? await res.json() : null;
      const content = typeof data?.clauseContent === 'string' ? data.clauseContent : '';
      setClauseContent(content);
      setIsViewingPastVersion(true);
      setContentVersion((v) => v + 1);
      setShowHistoryModal(false);
    } catch (e) {
      console.error('Failed to load history content:', e);
      toast.error('Failed to load content from history');
    } finally {
      setLoadingHistoryCid(null);
    }
  };

  const goToCurrentVersion = () => {
    setClauseContent(currentClauseContentRef.current);
    setIsViewingPastVersion(false);
    setContentVersion((v) => v + 1);
  };

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
        // WebSocket will handle refresh automatically via LeaderApprovedClause event
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

  const handleRejectWithReason = async (reason: string) => {
    if (!config || !address || Number.isNaN(clauseIdOnChain)) {
      toast.error('Missing data to reject');
      return;
    }
    setActionLoading('reject');
    try {
      const ok = await rejectClause(config, address, clauseIdOnChain, reason);
      if (ok) {
        toast.success('Clause rejected');
        setShowRejectClauseDialog(false);
        router.back();
        // WebSocket will handle refresh automatically via LeaderRejectedClause event
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
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-lg">View clause content</CardTitle>
            {postgresClauseId != null && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={openHistoryModal}
                  title="View clause history"
                >
                  <History className="h-4 w-4 shrink-0" />
                  <span>History</span>
                </Button>
                {isViewingPastVersion && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 shrink-0"
                    onClick={goToCurrentVersion}
                    title="View current version of clause"
                  >
                    <RotateCcw className="h-4 w-4 shrink-0" />
                    <span>Current version</span>
                  </Button>
                )}
              </>
            )}
            {isClauseRejected && (
              <RejectionReasonButton onClick={() => setShowRejectReasonModal(true)} />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ClauseLexicalEditor
            key={`section-assign-clause-${contentVersion}`}
            initialContent={clauseContent}
            readOnly
            placeholder="Clause content..."
            className="min-h-[160px]"
          />
          {selectedFromRoute && ['review', 'approved'].includes(selectedFromRoute) && !isViewingPastVersion && (
            <div className="flex items-center gap-3 pt-2 border-t">
              {selectedFromRoute === 'review' && (
                <Button
                  variant="default"
                  className="gap-2 cursor-pointer"
                  disabled={actionLoading !== null}
                  onClick={handleApprove}
                >
                  {actionLoading === 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  {actionLoading === 'approve' ? 'Approving...' : 'Approve'}
                </Button>
              )}
              {
                (sectionStatus == 0 || sectionStatus == 3) && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="gap-2 cursor-pointer"
                    disabled={actionLoading !== null}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowRejectClauseDialog(true);
                    }}
                  >
                    {actionLoading === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    {actionLoading === 'reject' ? 'Rejecting...' : 'Reject'}
                  </Button>
                )
              }
            </div>
          )}
        </CardContent>
      </Card>
      <RejectReasonDialog
        open={showRejectClauseDialog}
        onOpenChange={(open) => !open && setShowRejectClauseDialog(false)}
        title="Reject clause"
        description="Please provide a reason for rejecting this clause."
        placeholder="Enter rejection reason..."
        submitLabel="Reject clause"
        isSubmitting={actionLoading === 'reject'}
        onSubmit={handleRejectWithReason}
      />

      <RejectionReasonModal
        isOpen={showRejectReasonModal}
        onClose={() => setShowRejectReasonModal(false)}
        reason={clauseRejectReason}
        title="Rejection reason"
      />

      {typeof document !== 'undefined' &&
        showHistoryModal &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="clause-history-modal-title"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/70" onClick={() => setShowHistoryModal(false)} />
            <div
              className="relative z-10 w-sm rounded-lg border bg-background p-6 shadow-lg max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="clause-history-modal-title" className="text-lg font-semibold leading-none tracking-tight mb-4">
                Clause history
              </h2>
              {loadingHistories ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : histories.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No history for this clause.</p>
              ) : (
                <ul className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-1">
                  {histories.map((h, i) => {
                    const description = formatClauseHistoryReadable(h);
                    const hasCid = !!h.cid;
                    const isLoading = hasCid && loadingHistoryCid === h.cid;
                    return (
                      <li
                        key={h.id ?? i}
                        className="text-sm rounded-md border bg-muted/30 px-3 py-2"
                      >
                        {hasCid ? (
                          <button
                            type="button"
                            onClick={() => handleViewHistoryCid(h.cid!)}
                            disabled={!!loadingHistoryCid}
                            className="clause-history-link text-left w-full text-foreground cursor-pointer"
                            title="View content at this point in history"
                          >
                            {isLoading ? (
                              <span className="inline-flex items-center gap-1.5">
                                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                                {description}
                              </span>
                            ) : (
                              description
                            )}
                          </button>
                        ) : (
                          <span className="text-foreground">{description}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="flex justify-end mt-4 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setShowHistoryModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
