'use client'

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConfig, useConnection } from 'wagmi';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { createPortal } from 'react-dom';
import { ArrowLeft, FileText, Loader2, History, RotateCcw } from 'lucide-react';
import { useContractDoc } from '@/app/contexts/ContractDocContext';
import { useContracts } from '@/app/contexts/ContractsContext';
import { usePostgresRefresh } from '@/app/contexts/PostgresRefreshContext';
import { useAssignment } from '@/app/contexts/AssignmentContext';
import { DIVISION_LABELS, USER_ROLE, URLs } from '@/utils/constants';
import { useUser } from '@/app/contexts/UserContext';
import { submitClauseToLeader } from '@/utils/interact';
import { getClauseById, getClauseHistories } from '@/utils/postgres';
import { formatClauseHistoryReadable } from '@/utils/utility';
import { toast } from 'sonner';
import { RejectionReasonButton } from '@/app/components/RejectionReasonButton';
import { RejectionReasonModal } from '@/app/components/RejectionReasonModal';
import { ClauseLexicalEditor, serializeClauseContentToJson } from '@/app/components/editor/ClauseLexicalEditor';

type ClauseHistoryItem = { type?: string; id?: string; date?: string | number; cid?: string | null };

export default function ClauseAssignmentsClausePage() {
  const router = useRouter();
  const config = useConfig();
  const { address } = useConnection();
  const { userRole } = useUser();
  const { selectedContractId, selectedSectionIndex, selectedClauseIndex, selectedFromRoute } = useAssignment();
  const { profile, loadDoc, getDoc, loadingDocId, loadingProfile, error: contextError, refetchDoc } = useContractDoc();
  const { refetch: refetchContracts } = useContracts();
  const { refresh: refreshpostgres } = usePostgresRefresh();
  const contractId = selectedContractId ?? '';
  const sectionIndex = selectedSectionIndex ?? -1;
  const clauseIndex = selectedClauseIndex ?? -1;
  const [sectionName, setSectionName] = useState('');
  const [clauseContent, setClauseContent] = useState('');
  const [docClauseId, setDocClauseId] = useState<string>('');
  const [postgresClauseId, setpostgresClauseId] = useState<number | null>(null);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [contentVersion, setContentVersion] = useState(0);
  const [editorContentKey, setEditorContentKey] = useState('');
  const [baselineContentForHighlight, setBaselineContentForHighlight] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [histories, setHistories] = useState<ClauseHistoryItem[]>([]);
  const [loadingHistories, setLoadingHistories] = useState(false);
  const [loadingHistoryCid, setLoadingHistoryCid] = useState<string | null>(null);
  const [isViewingPastVersion, setIsViewingPastVersion] = useState(false);
  const currentClauseContentRef = useRef('');
  const currentDocClauseIdRef = useRef('');

  useEffect(() => {
    if (userRole !== null && userRole !== USER_ROLE.DIVISION_MEMBER) {
      router.replace('/my-contracts');
      return;
    }
  }, [userRole, router]);

  useEffect(() => {
    if (!selectedContractId || selectedSectionIndex == null || selectedSectionIndex < 0 || selectedClauseIndex == null || selectedClauseIndex < 0) {
      router.replace('/clause-assignments');
      return;
    }
    loadDoc(selectedContractId);
  }, [selectedContractId, selectedSectionIndex, selectedClauseIndex, loadDoc, router]);

  useEffect(() => {
    setContentLoaded(false);
    setBaselineContentForHighlight('');
  }, [contractId, sectionIndex, clauseIndex]);

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

    const sections = (doc as { sections?: Array<{ clauses?: Array<{ id?: string }> }> }).sections ?? [];
    const clauseAt = sections[sectionIndex]?.clauses?.[clauseIndex];
    const sgId = clauseAt?.id != null ? String(clauseAt.id) : null;
    if (sgId) setpostgresClauseId(Number(sgId));
    else setpostgresClauseId(null);

    setSectionName(`Section ${sectionIndex + 1}`);

    if (!sgId) {
      setClauseContent('');
      setContentVersion((v) => v + 1);
      setEditorContentKey('');
      setBaselineContentForHighlight('');
      currentClauseContentRef.current = '';
      currentDocClauseIdRef.current = '';
      setIsViewingPastVersion(false);
      setContentLoaded(true);
      return;
    }

    // Fetch clause CID by clause id, then fetch content from gateway
    getClauseById(sgId)
      .then((clause) => {
        const cid = clause?.cid ?? null;
        if (!cid) {
          setClauseContent('');
          setContentVersion((v) => v + 1);
          setEditorContentKey('');
          setBaselineContentForHighlight('');
          currentClauseContentRef.current = '';
          currentDocClauseIdRef.current = '';
          setIsViewingPastVersion(false);
          setContentLoaded(true);
          return;
        }
        return fetch(`${URLs.TBGateWay}${cid}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            const content = typeof data?.clauseContent === 'string' ? data.clauseContent : '';
            const clauseId = data?.clauseId ?? '';
            setClauseContent(content);
            setContentVersion((v) => v + 1);
            setDocClauseId(clauseId);
            setEditorContentKey('');
            setBaselineContentForHighlight(content);
            currentClauseContentRef.current = content;
            currentDocClauseIdRef.current = clauseId;
            setIsViewingPastVersion(false);
          });
      })
      .catch(() => {
        setClauseContent('');
        setContentVersion((v) => v + 1);
        setEditorContentKey('');
        setBaselineContentForHighlight('');
        currentClauseContentRef.current = '';
        currentDocClauseIdRef.current = '';
        setIsViewingPastVersion(false);
      })
      .finally(() => setContentLoaded(true));
  }, [doc, sectionIndex, clauseIndex, contentLoaded]);

  const contractTitle = doc?.title ?? 'Untitled';
  const divisionLabel = profile ? (DIVISION_LABELS[profile.dcategory] ?? `Division #${profile.dcategory}`) : '';

  const rawSectionsForClause = (doc as { sections?: Array<{ clauses?: Array<{ status?: number; rejectReason?: string }> }> })?.sections ?? [];
  const sectionAtForClause = rawSectionsForClause[sectionIndex];
  const clauseAt = sectionAtForClause?.clauses?.[clauseIndex];
  const clauseStatus = typeof (clauseAt as { status?: number })?.status === 'number' ? (clauseAt as { status: number }).status : 0;
  const isClauseRejected = clauseStatus === 3;
  const clauseRejectReason = (clauseAt as { rejectReason?: string })?.rejectReason ?? '';

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
      setContentVersion((v) => v + 1);
      setEditorContentKey(cid);
      setIsViewingPastVersion(true);
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
    setDocClauseId(currentDocClauseIdRef.current);
    setIsViewingPastVersion(false);
    setContentVersion((v) => v + 1);
    setEditorContentKey('current');
  };

  // Edit mode + Request Review: when from Clauses or Pending, and clause not yet submitted (no CID)
  const isEditMode = (selectedFromRoute === 'clauses' || selectedFromRoute === 'pending' || selectedFromRoute === "rejected") && (clauseStatus == 0 || clauseStatus == 3);
  const backHref = selectedFromRoute === 'clauses' ? '/clause-assignments/clauses' : selectedFromRoute === 'pending' ? '/clause-assignments/pending' : selectedFromRoute === 'review' ? '/clause-assignments/review' : selectedFromRoute === 'approved' ? '/clause-assignments/approved' : selectedFromRoute === 'rejected' ? '/clause-assignments/rejected' : '/clause-assignments';
  const backLabel = selectedFromRoute === 'clauses' ? 'Back to Clauses' : selectedFromRoute === 'pending' ? 'Back to Pending' : selectedFromRoute === 'review' ? 'Back to Review' : selectedFromRoute === 'approved' ? 'Back to Approved' : selectedFromRoute === 'rejected' ? 'Back to Rejected' : 'Back to Clause Assignments';

  const handleRequestReview = async () => {
    if (!config || !address || postgresClauseId == null) {
      toast.error('Missing wallet or clause data');
      return;
    }
    setSubmitting(true);
    try {
      // Omit assignedDate so same clause + member yields same CID (avoids double-assign / duplicate CIDs)
      const uploadRes = await fetch(`${URLs.UploadAPI}/clauses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clauses: [{
            clauseId: docClauseId,
            clauseContent,
            divisionMemberAddress: address.toLowerCase(),
          }],
        }),
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        toast.error(uploadData.error ?? 'Failed to upload clause');
        return;
      }
      const clauseCids = uploadData.clauseCids as string[];
      if (!Array.isArray(clauseCids) || clauseCids.length === 0) {
        toast.error('Invalid upload response');
        return;
      }
      const success = await submitClauseToLeader(config, address, postgresClauseId, clauseCids[0]);
      if (success) {
        toast.success('Clause submitted for review');
        router.push('/clause-assignments/clauses');
        setTimeout(async () => {
          refreshpostgres();
          await refetchDoc(contractId);
          await refetchContracts();
        }, 4000);
      } else {
        toast.error('Failed to submit clause');
      }
    } catch (e) {
      console.error('Request review error:', e);
      toast.error(e instanceof Error ? e.message : 'Failed to submit clause');
    } finally {
      setSubmitting(false);
    }
  };

  if (userRole !== null && userRole !== USER_ROLE.DIVISION_MEMBER) {
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
        <Button variant="ghost" onClick={() => router.push(backHref)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Button>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" onClick={() => router.push(backHref)} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
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
            <CardTitle className="text-lg">{isEditMode ? 'Edit clause content' : 'View clause content'}</CardTitle>
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
        <CardContent>
          <ClauseLexicalEditor
            key={`clause-editor-${contentVersion}-${editorContentKey}`}
            initialContent={clauseContent}
            readOnly={isViewingPastVersion || !isEditMode}
            baselineContent={isEditMode && !isViewingPastVersion ? baselineContentForHighlight : undefined}
            placeholder="Enter clause content..."
            onChange={isEditMode && !isViewingPastVersion ? (json) => setClauseContent(serializeClauseContentToJson(json)) : undefined}
          />
          {isEditMode && !isViewingPastVersion && (
            <div className="flex justify-end mt-2">
              <Button onClick={handleRequestReview} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Request Review'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {typeof document !== 'undefined' &&
        showRejectReasonModal && (
          <RejectionReasonModal
            isOpen={showRejectReasonModal}
            onClose={() => setShowRejectReasonModal(false)}
            reason={clauseRejectReason}
            title="Rejection reason"
          />
        )}

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
              <div className="flex justify-end mt-4 pt-3 border-t shrink-0">
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
