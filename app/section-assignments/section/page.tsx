'use client'

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useConfig, useConnection } from 'wagmi';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { ArrowLeft, FileText, Loader2, UserPlus, History, RotateCcw, AlertCircle } from 'lucide-react';
import { getDivisionMembersByDivisionId, getSectionHistories, getClauseHistories } from '@/utils/subgraph';
import { assignClausesToMembers, reassignClause } from '@/utils/interact';
import { useContractDoc } from '@/app/contexts/ContractDocContext';
import { useContracts } from '@/app/contexts/ContractsContext';
import { useSubgraphRefresh } from '@/app/contexts/SubgraphRefreshContext';
import { useAssignment } from '@/app/contexts/AssignmentContext';
import { useSectionContent } from '@/app/contexts/SectionContentContext';
import { DIVISION_LABELS, USER_ROLE, URLs } from '@/utils/constants';
import { useUser } from '@/app/contexts/UserContext';
import { formatSectionHistoryReadable, formatClauseHistoryReadable } from '@/utils/utility';
import { toast } from 'sonner';
import type { Clause, DocSection, DivisionMember } from '@/app/data/interfaces';
import { ClauseLexicalEditor } from '@/app/components/editor/ClauseLexicalEditor';

type SectionHistoryItem = { type?: string; id?: string; date?: string | number; cid?: string | null };
type ClauseHistoryItem = { type?: string; id?: string; date?: string | number; cid?: string | null };

const getMemberLabel = (m: DivisionMember) =>
  [m.firstName, m.lastName].filter(Boolean).join(' ').trim() || m.email || m.id;

const getAssignedMemberLabel = (member: { firstName?: string; lastName?: string; email?: string } | null | undefined) =>
  member
    ? [member.firstName, member.lastName].filter(Boolean).join(' ').trim() || member.email || '—'
    : '—';

export default function SectionAssignmentsSectionPage() {
  const router = useRouter();
  const config = useConfig();
  const { address } = useConnection();
  const { userRole } = useUser();
  const { selectedContractId, selectedSectionIndex, setSelection } = useAssignment();
  const { profile, loadDoc, getDoc, loadingDocId, loadingProfile, error: contextError, refetchDoc } = useContractDoc();
  const { refetch: refetchContracts } = useContracts();
  const { refresh: refreshSubgraph } = useSubgraphRefresh();
  const { loadSectionContent, getSectionContent } = useSectionContent();
  const contractId = selectedContractId ?? '';
  const sectionIndex = selectedSectionIndex ?? -1;
  const [sectionName, setSectionName] = useState('');
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [members, setMembers] = useState<DivisionMember[]>([]);
  const [clauseAssignments, setClauseAssignments] = useState<Record<string, string>>({});
  const [assigning, setAssigning] = useState(false);
  const [sectionIdFromSubgraph, setSectionIdFromSubgraph] = useState<number | null>(null);
  const [sectionContentLoaded, setSectionContentLoaded] = useState(false);
  const [clauseContentOverrides, setClauseContentOverrides] = useState<Record<number, string>>({});
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [histories, setHistories] = useState<SectionHistoryItem[]>([]);
  const [loadingHistories, setLoadingHistories] = useState(false);
  const [loadingHistoryCid, setLoadingHistoryCid] = useState<string | null>(null);
  const [reassigningClauseId, setReassigningClauseId] = useState<number | null>(null);
  const [isViewingPastVersion, setIsViewingPastVersion] = useState(false);
  const [sectionHistoryViewCid, setSectionHistoryViewCid] = useState<string | null>(null);
  const [showClauseHistoryModal, setShowClauseHistoryModal] = useState(false);
  const [clauseHistoryClauseId, setClauseHistoryClauseId] = useState<number | null>(null);
  const [clauseHistories, setClauseHistories] = useState<ClauseHistoryItem[]>([]);
  const [loadingClauseHistories, setLoadingClauseHistories] = useState(false);
  const [loadingClauseHistoryCid, setLoadingClauseHistoryCid] = useState<string | null>(null);
  const [clauseHistoryPreviewContent, setClauseHistoryPreviewContent] = useState<string | null>(null);
  const [clauseHistoryPreviewKey, setClauseHistoryPreviewKey] = useState(0);
  const [showSectionRejectModal, setShowSectionRejectModal] = useState(false);
  const currentSectionNameRef = useRef('');
  const currentClausesRef = useRef<Clause[]>([]);

  const canAccessSection = userRole === USER_ROLE.DIVISION_LEADER || userRole === USER_ROLE.LEGAL_TEAM;
  const isDivisionLeader = userRole === USER_ROLE.DIVISION_LEADER;
  useEffect(() => {
    if (userRole !== null && !canAccessSection) {
      router.replace('/my-contracts');
      return;
    }
  }, [userRole, canAccessSection, router]);

  useEffect(() => {
    if (!selectedContractId || selectedSectionIndex == null || selectedSectionIndex < 0) {
      router.replace('/section-assignments');
      return;
    }
    loadDoc(selectedContractId);
  }, [selectedContractId, selectedSectionIndex, loadDoc, router]);

  useEffect(() => {
    setSectionIdFromSubgraph(null);
    setSectionContentLoaded(false);
    setClauseContentOverrides({});
    setSectionHistoryViewCid(null);
  }, [contractId, sectionIndex]);

  const doc = contractId ? getDoc(contractId) : undefined;
  const loading =
    loadingDocId === contractId ||
    (contractId && doc === undefined) ||
    (profile === undefined && loadingProfile);

  const notInDivision = profile === null && !loadingProfile;
  const docNotFound = contractId && doc === null;
  const rawSections = doc?.sections ?? [];
  const sectionAt = rawSections[sectionIndex];
  const sectionRejectReason = (sectionAt as { rejectReason?: string } | undefined)?.rejectReason ?? '';
  const leaderDcategory = profile?.dcategory ?? 0;
  const sectionDcategory =
    sectionAt?.divisionLeader?.dcategory != null ? Number(sectionAt.divisionLeader.dcategory) : null;
  const sectionNotForDivision =
    isDivisionLeader && doc && profile != null && sectionDcategory !== leaderDcategory;

  const error =
    contextError ??
    (notInDivision ? 'You are not assigned to a division.' : null) ??
    (docNotFound ? 'Contract not found.' : null) ??
    (sectionNotForDivision ? 'This section is not assigned to your division.' : null);

  const contractTitle = doc?.title ?? 'Untitled';
  const divisionLabel = profile ? (DIVISION_LABELS[profile.dcategory] ?? `Division #${profile.dcategory}`) : '';
  const sectionClausesFromSubgraph = sectionAt?.clauses ?? [];

  useEffect(() => {
    if (!doc || profile == null || sectionIndex < 0 || !isDivisionLeader) return;
    const leaderDcategoryNum = profile.dcategory;
    getDivisionMembersByDivisionId(leaderDcategoryNum).then((memberList) => {
      setMembers(Array.isArray(memberList) ? memberList : []);
    });
  }, [doc, profile, sectionIndex, isDivisionLeader]);

  useEffect(() => {
    if (!doc || sectionIndex < 0) return;
    const rawSections = doc.sections ?? [];
    const sec = rawSections[sectionIndex];
    const subgraphSectionId = sec?.id != null ? Number(sec.id) : null;
    if (subgraphSectionId != null && !Number.isNaN(subgraphSectionId)) {
      setSectionIdFromSubgraph(subgraphSectionId);
    }
  }, [doc, sectionIndex]);

  useEffect(() => {
    if (!doc || sectionContentLoaded) return;
    const sectionId = doc.sections?.[sectionIndex]?.id != null ? String(doc.sections[sectionIndex].id) : null;
    if (sectionId && contractId) loadSectionContent(sectionId, contractId);
  }, [doc, sectionIndex, contractId, loadSectionContent]);

  useEffect(() => {
    if (!doc || sectionContentLoaded) return;
    const sectionId = doc.sections?.[sectionIndex]?.id != null ? String(doc.sections[sectionIndex].id) : null;
    const sectionAt = doc.sections?.[sectionIndex] as { cid?: string } | undefined;
    const sectionCid = sectionAt?.cid;
    const cached = sectionId ? getSectionContent(sectionId) : undefined;
    if (cached) {
      const name = cached.sectionName;
      const clauseList = cached.sectionContent?.map((c) => ({ clauseId: c.clauseId, clauseContent: c.clauseContent ?? '' })) ?? [];
      setSectionName(name);
      setClauses(clauseList);
      currentSectionNameRef.current = name;
      currentClausesRef.current = clauseList;
      setIsViewingPastVersion(false);
      setSectionContentLoaded(true);
      return;
    }
    if (sectionCid) {
      fetch(`${URLs.TBGateWay}${sectionCid}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const section = data as DocSection | null;
          if (section?.sectionContent) {
            const name = section.sectionName ?? `Section ${sectionIndex + 1}`;
            const clauseList = section.sectionContent.filter((c) => c.clauseContent).map((c) => ({ clauseId: c.clauseId, clauseContent: c.clauseContent ?? '' }));
            setSectionName(name);
            setClauses(clauseList);
            currentSectionNameRef.current = name;
            currentClausesRef.current = clauseList;
            setIsViewingPastVersion(false);
          } else {
            setSectionName(`Section ${sectionIndex + 1}`);
            setClauses([]);
            currentSectionNameRef.current = `Section ${sectionIndex + 1}`;
            currentClausesRef.current = [];
            setIsViewingPastVersion(false);
          }
        })
        .catch(() => {
          setSectionName(`Section ${sectionIndex + 1}`);
          setClauses([]);
          currentSectionNameRef.current = `Section ${sectionIndex + 1}`;
          currentClausesRef.current = [];
          setIsViewingPastVersion(false);
        })
        .finally(() => setSectionContentLoaded(true));
      return;
    }
    const docCid = (doc as { cid?: string }).cid;
    if (!docCid) {
      setSectionName(`Section ${sectionIndex + 1}`);
      setClauses([]);
      currentSectionNameRef.current = `Section ${sectionIndex + 1}`;
      currentClausesRef.current = [];
      setIsViewingPastVersion(false);
      setSectionContentLoaded(true);
      return;
    }
    fetch(`${URLs.TBGateWay}${docCid}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const sections: DocSection[] = data?.sections ?? [];
        const section = sections[sectionIndex];
        if (section) {
          const name = section.sectionName ?? `Section ${sectionIndex + 1}`;
          const clauseList = section.sectionContent?.filter((c) => c.clauseContent) ?? [];
          setSectionName(name);
          setClauses(clauseList);
          currentSectionNameRef.current = name;
          currentClausesRef.current = clauseList;
          setIsViewingPastVersion(false);
        } else {
          setSectionName(`Section ${sectionIndex + 1}`);
          setClauses([]);
          currentSectionNameRef.current = `Section ${sectionIndex + 1}`;
          currentClausesRef.current = [];
          setIsViewingPastVersion(false);
        }
      })
      .catch(() => {
        setSectionName(`Section ${sectionIndex + 1}`);
        setClauses([]);
        currentSectionNameRef.current = `Section ${sectionIndex + 1}`;
        currentClausesRef.current = [];
        setIsViewingPastVersion(false);
      })
      .finally(() => setSectionContentLoaded(true));
  }, [doc, sectionIndex, sectionContentLoaded, getSectionContent]);

  const openHistoryModal = async () => {
    if (sectionIdFromSubgraph == null) return;
    setShowHistoryModal(true);
    setLoadingHistories(true);
    setHistories([]);
    try {
      const list = await getSectionHistories(String(sectionIdFromSubgraph));
      const sorted = Array.isArray(list)
        ? [...list].sort((a, b) => {
            const da = a.date != null ? Number(a.date) : 0;
            const db = b.date != null ? Number(b.date) : 0;
            return da - db; // chronological: oldest first
          })
        : [];
      setHistories(sorted);
    } catch (e) {
      console.error('Failed to load section histories:', e);
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
      const section = data as DocSection | null;
      if (section?.sectionContent) {
        const name = section.sectionName ?? `Section ${sectionIndex + 1}`;
        const clauseList = section.sectionContent.filter((c) => c.clauseContent).map((c) => ({ clauseId: c.clauseId, clauseContent: c.clauseContent ?? '' }));
        setSectionName(name);
        setClauses(clauseList);
        setClauseContentOverrides({});
        setSectionHistoryViewCid(cid);
        setIsViewingPastVersion(true);
      } else {
        setSectionName(section?.sectionName ?? `Section ${sectionIndex + 1}`);
        setClauses([]);
        setClauseContentOverrides({});
        setSectionHistoryViewCid(cid);
        setIsViewingPastVersion(true);
      }
    } catch (e) {
      console.error('Failed to load section history content:', e);
      toast.error('Failed to load content from history');
    } finally {
      setLoadingHistoryCid(null);
    }
  };

  const goToCurrentVersion = () => {
    setSectionName(currentSectionNameRef.current);
    setClauses(currentClausesRef.current);
    setSectionHistoryViewCid(null);
    setIsViewingPastVersion(false);
  };

  const openClauseHistoryModal = async (clauseIdOnChain: number) => {
    if (Number.isNaN(clauseIdOnChain)) return;
    setClauseHistoryClauseId(clauseIdOnChain);
    setShowClauseHistoryModal(true);
    setClauseHistoryPreviewContent(null);
    setLoadingClauseHistories(true);
    setClauseHistories([]);
    try {
      const list = await getClauseHistories(String(clauseIdOnChain));
      const sorted = Array.isArray(list)
        ? [...list].sort((a, b) => {
            const da = a.date != null ? Number(a.date) : 0;
            const db = b.date != null ? Number(b.date) : 0;
            return da - db;
          })
        : [];
      setClauseHistories(sorted);
    } catch (e) {
      console.error('Failed to load clause histories:', e);
      toast.error('Failed to load history');
      setClauseHistories([]);
    } finally {
      setLoadingClauseHistories(false);
    }
  };

  const handleViewClauseHistoryCid = async (cid: string) => {
    if (!cid || loadingClauseHistoryCid) return;
    setLoadingClauseHistoryCid(cid);
    try {
      const res = await fetch(`${URLs.TBGateWay}${cid}`);
      const data = res.ok ? await res.json() : null;
      const content = typeof data?.clauseContent === 'string' ? data.clauseContent : '';
      setClauseHistoryPreviewContent(content);
      setClauseHistoryPreviewKey((k) => k + 1);
    } catch (e) {
      console.error('Failed to load clause history content:', e);
      toast.error('Failed to load content from history');
    } finally {
      setLoadingClauseHistoryCid(null);
    }
  };

  const handleReassignClause = async (clauseIdOnChain: number) => {
    if (!config || !address) {
      toast.error('Missing wallet connection');
      return;
    }
    setReassigningClauseId(clauseIdOnChain);
    try {
      const ok = await reassignClause(config, address, clauseIdOnChain);
      if (ok) {
        toast.success('Clause reassigned');
        setTimeout(async () => {
          refreshSubgraph();
          await refetchDoc(contractId);
          await refetchContracts();
        }, 4000);
      } else {
        toast.error('Failed to reassign clause');
      }
    } catch (e) {
      console.error('Reassign error:', e);
      toast.error(e instanceof Error ? e.message : 'Failed to reassign clause');
    } finally {
      setReassigningClauseId(null);
    }
  };

  // For allocated clauses (have division member), load content from clause CID; unallocated use section CID content already in clauses
  useEffect(() => {
    if (!sectionContentLoaded || !doc || sectionIndex < 0) return;
    const rawSections = doc.sections ?? [];
    const sec = rawSections[sectionIndex];
    const subgraphClauses = (sec?.clauses ?? []) as Array<{ id?: string; cid?: string | null; divisionMember?: unknown }>;
    const toFetch: { index: number; cid: string }[] = [];
    subgraphClauses.forEach((c, i) => {
      if (c?.divisionMember != null && c?.cid) {
        toFetch.push({ index: i, cid: c.cid });
      }
    });
    if (toFetch.length === 0) return;
    let cancelled = false;
    toFetch.forEach(({ index, cid }) => {
      fetch(`${URLs.TBGateWay}${cid}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (cancelled) return;
          const content = typeof data?.clauseContent === 'string' ? data.clauseContent : '';
          setClauseContentOverrides((prev) => ({ ...prev, [index]: content }));
        })
        .catch(() => {
          if (!cancelled) setClauseContentOverrides((prev) => ({ ...prev, [index]: '' }));
        });
    });
    return () => { cancelled = true; };
  }, [doc, sectionIndex, sectionContentLoaded]);

  const handleAssign = async () => {
    if (!config || !address || clauses.length === 0 || sectionIdFromSubgraph == null) return;
    setAssigning(true);
    try {
      // Only assigned clauses: build (memberAddress, payload) for clauses that have a member selected
      const assigned: Array<{ memberAddress: string; clause: Clause }> = [];
      for (const c of clauses) {
        const memberId = clauseAssignments[c.clauseId];
        if (!memberId) continue;
        const member = members.find((m) => m.id === memberId);
        const memberAddress = member?.id;
        if (!memberAddress) continue;
        assigned.push({ memberAddress, clause: c });
      }

      if (assigned.length === 0) {
        toast.error('Select at least one member for a clause');
        setAssigning(false);
        return;
      }

      // Omit assignedDate so same clause + member yields same CID and avoids double-assign issues
      const clausePayloads = assigned.map(({ memberAddress, clause }) => ({
        clauseId: clause.clauseId,
        clauseContent: clause.clauseContent,
        divisionMemberAddress: memberAddress,
      }));

      const uploadRes = await fetch(`${URLs.UploadAPI}/clauses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clauses: clausePayloads }),
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        toast.error(uploadData.error ?? 'Failed to upload clause assignments');
        return;
      }
      const clauseCids = uploadData.clauseCids as string[];
      if (!Array.isArray(clauseCids) || clauseCids.length !== assigned.length) {
        toast.error('Invalid response from upload');
        return;
      }

      const divisionMembers = assigned.map((a) => a.memberAddress);
      const sectionId = sectionIdFromSubgraph;
      const success = await assignClausesToMembers(
        config,
        address,
        sectionId,
        divisionMembers,
        clauseCids
      );
      if (success) {
        toast.success('Assignments submitted successfully');
        setTimeout(async () => {
          refreshSubgraph();
          await refetchDoc(contractId);
          await refetchContracts();
        }, 4000);
      } else {
        toast.error('Failed to submit assignments');
      }
    } catch (e) {
      console.error('Assign error:', e);
      toast.error(e instanceof Error ? e.message : 'Failed to submit assignments');
    } finally {
      setAssigning(false);
    }
  };

  if (userRole !== null && !canAccessSection) {
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
        <Button variant="ghost" onClick={() => router.push('/section-assignments')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to sections
        </Button>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" onClick={() => router.push('/section-assignments')} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to sections
      </Button>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-brand-secondary/10 flex items-center justify-center shrink-0">
          <FileText className="h-6 w-6 text-brand-secondary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{contractTitle}</p>
          <p className="text-xs text-muted-foreground">{divisionLabel}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-xl">{sectionName}</CardTitle>
            {sectionIdFromSubgraph != null && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={openHistoryModal}
                  title="View section history"
                >
                  <History className="h-4 w-4 shrink-0" />
                  <span>History</span>
                </Button>
                {isDivisionLeader && !!sectionRejectReason.trim() && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 shrink-0"
                    onClick={() => setShowSectionRejectModal(true)}
                    title="View section rejection reason"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                    <span className="text-red-700">Reject reason</span>
                  </Button>
                )}
                {isViewingPastVersion && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 shrink-0"
                    onClick={goToCurrentVersion}
                    title="View current version of section"
                  >
                    <RotateCcw className="h-4 w-4 shrink-0" />
                    <span>Current version</span>
                  </Button>
                )}
              </>
            )}
          </div>
          <p className="text-sm text-muted-foreground">Section {sectionIndex + 1}</p>
        </CardHeader>
        <CardContent>
          {clauses.length === 0 ? (
            <p className="text-muted-foreground py-4">No content available for this section.</p>
          ) : (
            <div className="space-y-4">
              {clauses.map((clause, i) => {
                const clauseData = sectionClausesFromSubgraph[i];
                const assignedMember = clauseData?.divisionMember;
                const assignedLabel = getAssignedMemberLabel(assignedMember);
                const clauseStatus = typeof clauseData?.status === 'number' ? clauseData.status : undefined;
                const clauseIdOnChain = clauseData?.id != null ? Number(clauseData.id) : NaN;
                const isAssignedOrSubmitted = clauseStatus === 0 || clauseStatus === 1;
                const isApprovedOrRejected = clauseStatus === 2 || clauseStatus === 3;
                const showAssignDropdown = isDivisionLeader && !isViewingPastVersion && !isAssignedOrSubmitted && !isApprovedOrRejected;
                const sectionStatus = typeof sectionAt?.status === 'number' ? sectionAt.status : 0;
                const canReassignSectionClauses = sectionStatus === 0;
                const showReassignButton =
                  isDivisionLeader &&
                  !isViewingPastVersion &&
                  canReassignSectionClauses &&
                  (clauseStatus === 2 || clauseStatus === 3) &&
                  !Number.isNaN(clauseIdOnChain);
                const statusLabel =
                  clauseStatus === 0
                    ? 'Assigned'
                    : clauseStatus === 1
                      ? 'Submitted'
                      : clauseStatus === 2
                        ? 'Approved'
                        : clauseStatus === 3
                          ? 'Rejected'
                          : null;
                return (
                  <div
                    key={clause.clauseId || i}
                    className="rounded-lg border bg-muted/30 p-4 min-w-0"
                  >
                    {isDivisionLeader && !Number.isNaN(clauseIdOnChain) && !isViewingPastVersion && (
                      <div className="flex justify-end pb-2 border-b">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 cursor-pointer mb-2"
                          onClick={() => openClauseHistoryModal(clauseIdOnChain)}
                          title="View clause history"
                        >
                          <History className="h-4 w-4 shrink-0" />
                          <span>History</span>
                        </Button>
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="rounded-md border border-input bg-background/50 p-3 min-h-[4rem] [&_.clause-editor-container]:min-h-0 [&_.clause-editor-inner]:min-h-0">
                        <ClauseLexicalEditor
                          key={`section-clause-${i}-${isViewingPastVersion ? `past-${sectionHistoryViewCid ?? ''}` : (clauseContentOverrides[i] !== undefined ? 'override' : 'section')}`}
                          initialContent={
                            isViewingPastVersion
                              ? (clause.clauseContent ?? '')
                              : (clauseContentOverrides[i] !== undefined
                                  ? clauseContentOverrides[i]
                                  : clause.clauseContent ?? '')
                          }
                          readOnly
                          className="text-sm"
                        />
                      </div>
                    <p className="text-xs text-muted-foreground">
                      Assigned to: <span className="font-medium text-foreground">{assignedLabel}</span>
                    </p>
                    {(statusLabel || showReassignButton) && (
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t justify-between">
                        {statusLabel ? (
                          <Badge
                            variant={
                              clauseStatus === 2
                                ? 'destructive'
                                : clauseStatus === 3
                                  ? 'destructive'
                                  : 'secondary'
                            }
                            className={clauseStatus === 2 ? 'bg-green-600' : ''}
                          >
                            {statusLabel}
                          </Badge>
                        ) : (
                          <span />
                        )}
                        {showReassignButton && (
                          <Button
                            variant="reassign"
                            size="sm"
                            className="gap-1.5 cursor-pointer shrink-0"
                            disabled={reassigningClauseId === clauseIdOnChain}
                            onClick={() => handleReassignClause(clauseIdOnChain)}
                          >
                            {reassigningClauseId === clauseIdOnChain ? (
                              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                            ) : (
                              <UserPlus className="h-4 w-4 shrink-0" />
                            )}
                            <span>{reassigningClauseId === clauseIdOnChain ? 'Reassigning...' : 'Reassign'}</span>
                          </Button>
                        )}
                      </div>
                    )}
                    {showAssignDropdown && (
                      <div className="flex items-center gap-3 pt-2 border-t">
                        <UserPlus className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Assign to</Label>
                            <Select
                              value={clauseAssignments[clause.clauseId] ?? (assignedMember?.id ?? 'unassigned')}
                              onValueChange={(v) =>
                                setClauseAssignments((prev) => ({
                                  ...prev,
                                  [clause.clauseId]: v === 'unassigned' ? '' : v,
                                }))
                              }
                            >
                              <SelectTrigger className="mt-1 max-w-[240px]">
                                <SelectValue placeholder="Select member" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {members.map((m) => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {getMemberLabel(m)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {(() => {
        if (!isDivisionLeader) return null;
        const allClausesAssigned =
          clauses.length > 0 &&
          clauses.every((_, i) => sectionClausesFromSubgraph[i]?.divisionMember != null);
        const showAssignButton = !allClausesAssigned;
        if (!showAssignButton) return null;
        return (
          <div className="flex justify-end">
            <Button
              onClick={handleAssign}
              disabled={assigning || clauses.length === 0 || sectionIdFromSubgraph == null}
              className="bg-brand-secondary hover:bg-[var(--brand-secondary-hover)] text-white"
            >
              {assigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Assign'
              )}
            </Button>
          </div>
        );
      })()}

      {typeof document !== 'undefined' &&
        showHistoryModal &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="section-history-modal-title"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/70" onClick={() => setShowHistoryModal(false)} />
            <div
              className="relative z-10 w-sm rounded-lg border bg-background p-6 shadow-lg max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="section-history-modal-title" className="text-lg font-semibold leading-none tracking-tight mb-4">
                Section history
              </h2>
              {loadingHistories ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : histories.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No history for this section.</p>
              ) : (
                <ul className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-1">
                  {histories.map((h, i) => {
                    const description = formatSectionHistoryReadable(h);
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

      {typeof document !== 'undefined' &&
        showSectionRejectModal &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="section-reject-reason-modal-title"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/70"
              onClick={() => setShowSectionRejectModal(false)}
            />
            <div
              className="relative z-10 w-sm rounded-lg border bg-background p-6 shadow-lg max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id="section-reject-reason-modal-title"
                className="text-lg font-semibold leading-none tracking-tight mb-4 flex items-center gap-2"
              >
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                <span>Section rejection reason</span>
              </h2>
              <div className="flex-1 min-h-0 overflow-y-auto">
                <p className="text-sm text-red-700 whitespace-pre-wrap">
                  {sectionRejectReason || 'No rejection reason provided.'}
                </p>
              </div>
              <div className="flex justify-end mt-4 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSectionRejectModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {typeof document !== 'undefined' &&
        showClauseHistoryModal &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="clause-history-modal-title"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/70"
              onClick={() => {
                setShowClauseHistoryModal(false);
                setClauseHistoryPreviewContent(null);
              }}
            />
            <div
              className="relative z-10 w-sm rounded-lg border bg-background p-6 shadow-lg max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="clause-history-modal-title" className="text-lg font-semibold leading-none tracking-tight mb-4">
                Clause history
              </h2>
              {clauseHistoryPreviewContent !== null ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 self-start mb-3"
                    onClick={() => setClauseHistoryPreviewContent(null)}
                  >
                    <ArrowLeft className="h-4 w-4 shrink-0" />
                    Back to list
                  </Button>
                  <div className="rounded-md border border-input bg-muted/30 p-3 flex-1 min-h-0 overflow-y-auto [&_.clause-editor-container]:min-h-0 [&_.clause-editor-inner]:min-h-0">
                    <ClauseLexicalEditor
                      key={`clause-history-preview-${clauseHistoryPreviewKey}`}
                      initialContent={clauseHistoryPreviewContent}
                      readOnly
                      className="text-sm"
                    />
                  </div>
                </>
              ) : loadingClauseHistories ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : clauseHistories.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No history for this clause.</p>
              ) : (
                <ul className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-1">
                  {clauseHistories.map((h, i) => {
                    const description = formatClauseHistoryReadable(h);
                    const hasCid = !!h.cid;
                    const isLoading = hasCid && loadingClauseHistoryCid === h.cid;
                    return (
                      <li
                        key={h.id ?? i}
                        className="text-sm rounded-md border bg-muted/30 px-3 py-2"
                      >
                        {hasCid ? (
                          <button
                            type="button"
                            onClick={() => handleViewClauseHistoryCid(h.cid!)}
                            disabled={!!loadingClauseHistoryCid}
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowClauseHistoryModal(false);
                    setClauseHistoryPreviewContent(null);
                  }}
                >
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
