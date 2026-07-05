import { useState, useEffect, useMemo, useCallback } from 'react';
import { useConfig, useConnection } from 'wagmi';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ContractDocumentTemplate } from './ContractDocumentTemplate';
import { ContractOverviewTab } from './ContractOverviewTab';
import { SectionReviewTab } from './SectionReviewTab';
import { RejectReasonDialog } from './RejectReasonDialog';
import { createPortal } from 'react-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getContractById, getContractHistories } from '@/utils/postgres';
import { legalApproveSection, legalRejectSection, submitDocToClient, clientReview, legalEsign, clientEsign } from '@/utils/interact';
import { uploadContractToPinata, uploadSignatureToPinata } from '@/utils/utility';
import type { Contract, ContractDocPayload, ContractDetailsProps, SectionStatus } from '../data/interfaces';
import type { DivisionSection, Section } from '../data/interfaces';
import { useUser } from '../contexts/UserContext';
import { usePostgresRefresh } from '../contexts/PostgresRefreshContext';
import { USER_ROLE, DIVISION_LABELS, URLs } from '@/utils/constants';
import { formatRelativeDate, formatDocHistoryReadable } from '@/utils/utility';
import { toast } from 'sonner';

type DocHistoryItem = { type?: string; id?: string; date?: string | number; cid?: string | null };

const mapDocumentToContract = (doc: any, index: number): Contract => {
  const client = doc.client;
  const clientName = client ? [client.firstName, client.lastName].filter(Boolean).join(' ') || client.email || '' : '';
  const id = /^\d+$/.test(String(doc.id)) ? parseInt(String(doc.id), 10) : index + 1;
  const status = typeof doc.status === 'number' ? doc.status : 0;
  const cat = doc.category;
  const category = typeof cat === 'number' ? (DIVISION_LABELS[cat] ?? String(cat)) : (cat ?? '');
  return {
    id,
    title: doc.title || 'Untitled',
    client: clientName,
    category,
    status,
    createdAt: doc.createdAt ?? '',
    cid: doc.cid ?? undefined,
  };
};

const sectionStatusToReviewStatus = (status: number): SectionStatus => {
  if (status === 1) return 'review';
  if (status === 2) return 'approved';
  if (status === 3) return 'rejected';
  return 'pending';
};

export function ContractDetails({ contractId = 1, onBack }: ContractDetailsProps) {
  const config = useConfig();
  const { address } = useConnection();
  const [foundContract, setFoundContract] = useState<Contract | null>(null);
  const [rawDocument, setRawDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [docContent, setDocContent] = useState<ContractDocPayload | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [sectionContentBySectionId, setSectionContentBySectionId] = useState<
    Record<string, { sectionName: string; content: string; sectionContent: Array<{ clauseId: string; clauseContent: string }> }>
  >({});
  const [reviewActionSectionId, setReviewActionSectionId] = useState<string | null>(null);
  const [submittingToClient, setSubmittingToClient] = useState(false);
  const [clientReviewAction, setClientReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [esignSignatureDataUrl, setEsignSignatureDataUrl] = useState<string | null>(null);
  const [esignSubmitting, setEsignSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showRejectContractDialog, setShowRejectContractDialog] = useState(false);
  const [showDocHistoryModal, setShowDocHistoryModal] = useState(false);
  const [docHistories, setDocHistories] = useState<DocHistoryItem[]>([]);
  const [loadingDocHistories, setLoadingDocHistories] = useState(false);
  const [viewHistoryDocContent, setViewHistoryDocContent] = useState<ContractDocPayload | null>(null);
  const [loadingViewHistoryCid, setLoadingViewHistoryCid] = useState<string | null>(null);
  const { userRole } = useUser();
  const { refresh: refreshpostgres } = usePostgresRefresh();

  const fetchContract = useCallback(async () => {
    setLoading(true);
    try {
      const doc = await getContractById(contractId);
      setRawDocument(doc ?? null);
      const contract = doc ? mapDocumentToContract(doc, 0) : null;
      setFoundContract(contract);
    } catch (e) {
      console.error('Failed to fetch contract:', e);
      setFoundContract(null);
      setRawDocument(null);
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  useEffect(() => {
    if (!foundContract?.cid) {
      setDocContent(null);
      setDocError(null);
      return;
    }
    const url = `${URLs.TBGateWay}${foundContract.cid}`;
    const fetchDoc = async () => {
      setDocLoading(true);
      setDocError(null);
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch document: ${res.status}`);
        const data = await res.json();
        setDocContent(data as ContractDocPayload);
      } catch (e) {
        console.error('Failed to fetch doc content:', e);
        setDocError(e instanceof Error ? e.message : 'Failed to load document');
        setDocContent(null);
      } finally {
        setDocLoading(false);
      }
    };
    fetchDoc();
  }, [foundContract?.cid]);

  // Load section content by section CID (for Section Review tab â€“ postgres sections)
  useEffect(() => {
    const sections = rawDocument?.sections ?? [];
    if (sections.length === 0) {
      setSectionContentBySectionId({});
      return;
    }
    let cancelled = false;
    const next: Record<string, { sectionName: string; content: string; sectionContent: Array<{ clauseId: string; clauseContent: string }> }> = {};
    Promise.all(
      sections.map(async (sec: { id: string; cid?: string | null }) => {
        if (!sec.cid?.trim()) return;
        try {
          const res = await fetch(`${URLs.TBGateWay}${sec.cid}`);
          if (!res.ok || cancelled) return;
          const data = await res.json();
          const name = data?.sectionName ?? `Section ${sec.id}`;
          const sectionContent = (data?.sectionContent ?? []).map(
            (c: { clauseId?: string; clauseContent?: string }) => ({
              clauseId: typeof c?.clauseId === 'string' ? c.clauseId : '',
              clauseContent: typeof c?.clauseContent === 'string' ? c.clauseContent : '',
            })
          );
          const content = sectionContent.map((c: { clauseContent: string }) => c.clauseContent).filter(Boolean).join('\n\n');
          next[sec.id] = { sectionName: name, content, sectionContent };
        } catch {
          // ignore
        }
      })
    ).then(() => {
      if (!cancelled) setSectionContentBySectionId((prev) => ({ ...prev, ...next }));
    });
    return () => { cancelled = true; };
  }, [rawDocument?.sections]);

  // All sections approved by legal (status 2) â†’ can submit to client
  const allSectionsApproved = useMemo(() => {
    const sections = rawDocument?.sections ?? [];
    return sections.length > 0 && sections.every((s: { status?: number }) => (s.status ?? 0) === 2);
  }, [rawDocument?.sections]);

  // Section Review tab: build from postgres sections, grouped by division
  const sectionsByDivision: DivisionSection[] = useMemo(() => {
    const sections = rawDocument?.sections ?? [];
    if (sections.length === 0) return [];
    const byDivision: Record<string, Section[]> = {};
    for (const sec of sections) {
      const dcat = sec?.divisionLeader?.dcategory;
      const divisionLabel = dcat != null && Number(dcat) > 0 ? (DIVISION_LABELS[Number(dcat)] ?? `Division ${dcat}`) : 'Contract';
      const leader = sec?.divisionLeader as { firstName?: string; lastName?: string } | undefined;
      const divisionLeaderName = leader
        ? [leader.firstName, leader.lastName].filter(Boolean).join(' ').trim() || undefined
        : undefined;
      const contentMap = sectionContentBySectionId[sec.id];
      const postgresClauses = (sec as { clauses?: Array<{ id?: string; divisionMember?: { id?: string; firstName?: string; lastName?: string; email?: string } }> })?.clauses ?? [];
      const sectionContent = contentMap?.sectionContent ?? [];
      const clauseBlocks = sectionContent.map(
        (c: { clauseId: string; clauseContent: string }, i: number) => {
          const clause = postgresClauses[i];
          const divisionMember = clause?.divisionMember;
          return {
            onChainClauseId: clause?.id != null ? String(clause.id) : undefined,
            clauseContent: c.clauseContent ?? '',
            assignedTo: divisionMember ? {
              firstName: divisionMember.firstName,
              lastName: divisionMember.lastName,
              email: divisionMember.email,
            } : undefined,
          };
        }
      );
      if (!byDivision[divisionLabel]) byDivision[divisionLabel] = [];
      const statusNum = typeof sec.status === 'number' ? sec.status : 0;
      const rejectReason = (sec as { rejectReason?: string })?.rejectReason;
      byDivision[divisionLabel].push({
        id: String(sec.id),
        name: contentMap?.sectionName ?? `Section ${sec.id}`,
        content: contentMap?.content ?? '',
        status: sectionStatusToReviewStatus(statusNum),
        statusNum,
        submittedBy: 'â€”',
        submittedDate: 'â€”',
        division: divisionLabel,
        divisionLeaderName: divisionLeaderName || undefined,
        comments: rejectReason && rejectReason.trim() ? rejectReason : undefined,
        clauseBlocks: clauseBlocks.length > 0 ? clauseBlocks : undefined,
      });
    }
    return Object.entries(byDivision).map(([division, secs]) => ({ division, sections: secs }));
  }, [rawDocument?.sections, sectionContentBySectionId]);

  const handleApproveSection = async (sectionId: string) => {
    if (!config || !address) {
      toast.error('Wallet not connected');
      return;
    }
    const sectionIdNum = Number(sectionId);
    if (Number.isNaN(sectionIdNum)) {
      toast.error('Invalid section');
      return;
    }
    if (!docContent) {
      toast.error('Document content not loaded');
      return;
    }
    setReviewActionSectionId(sectionId);
    try {
      const rawSections = rawDocument?.sections ?? [];
      const sectionIndex = rawSections.findIndex((s: { id: string }) => String(s.id) === String(sectionId));
      const currentSections = docContent.sections ?? [];
      const approvedSectionData = sectionContentBySectionId[sectionId];
      const newSections =
        sectionIndex >= 0 && approvedSectionData?.sectionContent?.length
          ? currentSections.map((sec, i) =>
              i === sectionIndex
                ? { sectionName: approvedSectionData.sectionName, sectionContent: approvedSectionData.sectionContent }
                : sec
            )
          : currentSections;
      const newDocPayload = {
        contractTitle: docContent.contractTitle,
        client: docContent.client,
        description: docContent.description,
        price: docContent.price,
        category: docContent.category,
        sections: newSections,
      };
      const newDocCid = await uploadContractToPinata(newDocPayload);
      const success = await legalApproveSection(config, address, sectionIdNum, newDocCid);
      if (success) {
        toast.success('Section approved');
        setTimeout(async () => {
          refreshpostgres();
          await fetchContract();
        }, 4000);
      } else {
        toast.error('Failed to approve section');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to approve section');
    } finally {
      setReviewActionSectionId(null);
    }
  };

  const handleRejectSection = async (sectionId: string, reason: string) => {
    if (!config || !address) {
      toast.error('Wallet not connected');
      return;
    }
    const sectionIdNum = Number(sectionId);
    if (Number.isNaN(sectionIdNum)) {
      toast.error('Invalid section');
      return;
    }
    setReviewActionSectionId(sectionId);
    try {
      const success = await legalRejectSection(config, address, sectionIdNum, reason);
      if (success) {
        toast.success('Section rejected');
        setTimeout(async () => {
          refreshpostgres();
          await fetchContract();
        }, 4000);
      } else {
        toast.error('Failed to reject section');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to reject section');
    } finally {
      setReviewActionSectionId(null);
    }
  };

  const handleSubmitToClient = async () => {
    if (!config || !address) {
      toast.error('Wallet not connected');
      return;
    }
    const docIdNum = Number(contractId);
    if (Number.isNaN(docIdNum)) {
      toast.error('Invalid contract');
      return;
    }
    const sections = rawDocument?.sections ?? [];
    if (sections.length === 0) {
      toast.error('No sections to submit');
      return;
    }
    setSubmittingToClient(true);
    try {
      // Reconstruct doc from section contents (order from postgres), then upload to get new CID
      const reconstructedSections = sections.map((sec: { id: string }, idx: number) => {
        const contentMap = sectionContentBySectionId[sec.id];
        if (contentMap?.sectionContent?.length) {
          return {
            sectionName: contentMap.sectionName,
            sectionContent: contentMap.sectionContent,
          };
        }
        const fromDoc = docContent?.sections?.[idx];
        if (fromDoc) {
          return {
            sectionName: fromDoc.sectionName,
            sectionContent: fromDoc.sectionContent ?? [],
          };
        }
        return { sectionName: `Section ${sec.id}`, sectionContent: [] };
      });
      const payload = {
        contractTitle: docContent?.contractTitle ?? foundContract?.title ?? 'Untitled',
        client: docContent?.client ?? foundContract?.client ?? '',
        description: docContent?.description ?? '',
        price: docContent?.price ?? '',
        category: docContent?.category ?? foundContract?.category ?? '',
        sections: reconstructedSections,
      };
      const newCid = await uploadContractToPinata(payload);
      const success = await submitDocToClient(config, address, docIdNum, newCid);
      if (success) {
        toast.success('Contract submitted to client');
        setTimeout(async () => {
          refreshpostgres();
          await fetchContract();
        }, 4000);
      } else {
        toast.error('Failed to submit to client');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to submit to client');
    } finally {
      setSubmittingToClient(false);
    }
  };

  const openDocHistoryModal = async () => {
    setShowDocHistoryModal(true);
    setLoadingDocHistories(true);
    setDocHistories([]);
    setViewHistoryDocContent(null);
    try {
      const list = await getContractHistories(String(contractId));
      const sorted = Array.isArray(list)
        ? [...list].sort((a, b) => {
            const da = a.date != null ? Number(a.date) : 0;
            const db = b.date != null ? Number(b.date) : 0;
            return da - db;
          })
        : [];
      setDocHistories(sorted);
    } catch (e) {
      console.error('Failed to load document histories:', e);
      toast.error('Failed to load history');
      setDocHistories([]);
    } finally {
      setLoadingDocHistories(false);
    }
  };

  const handleViewDocHistoryCid = async (cid: string) => {
    if (!cid || loadingViewHistoryCid) return;
    setLoadingViewHistoryCid(cid);
    try {
      const res = await fetch(`${URLs.TBGateWay}${cid}`);
      const data = res.ok ? await res.json() : null;
      setViewHistoryDocContent(data as ContractDocPayload);
    } catch (e) {
      console.error('Failed to load document from history:', e);
      toast.error('Failed to load content');
    } finally {
      setLoadingViewHistoryCid(null);
    }
  };

  const handleClientApprove = async () => {
    if (!config || !address) {
      toast.error('Wallet not connected');
      return;
    }
    const docIdNum = Number(contractId);
    if (Number.isNaN(docIdNum)) {
      toast.error('Invalid contract');
      return;
    }
    setClientReviewAction('approve');
    try {
      const success = await clientReview(config, address, docIdNum, true, '');
      if (success) {
        toast.success('Contract approved');
        setTimeout(async () => {
          refreshpostgres();
          await fetchContract();
        }, 4000);
      } else {
        toast.error('Failed to approve contract');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to approve contract');
    } finally {
      setClientReviewAction(null);
    }
  };

  const handleClientRejectWithReason = async (reason: string) => {
    if (!config || !address) {
      toast.error('Wallet not connected');
      return;
    }
    const docIdNum = Number(contractId);
    if (Number.isNaN(docIdNum)) {
      toast.error('Invalid contract');
      return;
    }
    setClientReviewAction('reject');
    try {
      const success = await clientReview(config, address, docIdNum, false, reason);
      if (success) {
        toast.success('Contract rejected');
        setShowRejectContractDialog(false);
        setTimeout(async () => {
          refreshpostgres();
          await fetchContract();
        }, 4000);
      } else {
        toast.error('Failed to reject contract');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to reject contract');
    } finally {
      setClientReviewAction(null);
    }
  };

  const handleEsignSubmit = async (asLicensor: boolean) => {
    if (!config || !address) {
      toast.error('Wallet not connected');
      return;
    }
    if (!esignSignatureDataUrl) {
      toast.error('Please draw your signature first');
      return;
    }
    const docIdNum = Number(contractId);
    if (Number.isNaN(docIdNum)) {
      toast.error('Invalid contract');
      return;
    }
    setEsignSubmitting(true);
    try {
      const cid = await uploadSignatureToPinata(esignSignatureDataUrl);
      const success = asLicensor
        ? await legalEsign(config, address, docIdNum, cid)
        : await clientEsign(config, address, docIdNum, cid);
      if (success) {
        toast.success(asLicensor ? 'Licensor signature submitted' : 'Licensee signature submitted');
        setEsignSignatureDataUrl(null);
        setTimeout(async () => {
          refreshpostgres();
          await fetchContract();
        }, 4000);
      } else {
        toast.error('Failed to submit signature');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to submit signature');
    } finally {
      setEsignSubmitting(false);
    }
  };

  const involvedDivisions = (rawDocument?.sections ?? [])
    .map((s: any) => s?.divisionLeader?.dcategory)
    .filter((dc: unknown) => dc !== undefined && dc !== null && Number(dc) > 0)
    .filter((dc: unknown, i: number, arr: unknown[]) => arr.indexOf(dc) === i)
    .map((dc: unknown) => DIVISION_LABELS[Number(dc)] ?? String(dc));

  const contract = foundContract ? {
    id: foundContract.id,
    title: docContent?.contractTitle ? `${docContent.contractTitle}` : `${foundContract.title}`,
    client: docContent?.client ?? foundContract.client,
    status: foundContract.status,
    category: docContent?.category ?? foundContract.category,
    createdDate: foundContract.createdAt ? formatRelativeDate(foundContract.createdAt) : 'â€”',
    description: docContent?.description ?? `Comprehensive agreement for ${foundContract.client} regarding ${foundContract.title.toLowerCase()}.`,
    value: docContent?.price ?? 'â€”',
    involvedDivisions: involvedDivisions.length > 0 ? involvedDivisions : (foundContract.category ? [foundContract.category] : []),
  } : null;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-6 space-y-6">
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contracts
          </Button>
        )}
        <p className="text-muted-foreground">Contract not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {onBack && (
            <Button variant="ghost" onClick={onBack} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contracts
            </Button>
          )}
          <h1>{contract.title}</h1>
          <p className="text-muted-foreground">{contract.client}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Client: overview only, no tabs. Admin: overview only (Section Review not available). Legal/Division Leader: full tabs */}
        {userRole === USER_ROLE.CLIENT ? (
          <ContractOverviewTab
            contract={contract}
            userRole={userRole}
            docLoading={docLoading}
            docError={docError}
            docContent={docContent}
            foundContract={foundContract}
            rawDocument={rawDocument}
            gatewayBaseUrl={URLs.TBGateWay}
            clientReviewAction={clientReviewAction}
            onClientApprove={handleClientApprove}
            onClientReject={() => setShowRejectContractDialog(true)}
            esignSignatureDataUrl={esignSignatureDataUrl}
            onEsignSignatureChange={setEsignSignatureDataUrl}
            esignSubmitting={esignSubmitting}
            onEsignSubmit={handleEsignSubmit}
          />
        ) : userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.LEGAL_TEAM ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sections">Section Review</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-6">
              <ContractOverviewTab
                contract={contract}
                userRole={userRole}
                docLoading={docLoading}
                docError={docError}
                docContent={docContent}
                foundContract={foundContract}
                rawDocument={rawDocument}
                gatewayBaseUrl={URLs.TBGateWay}
                allSectionsApproved={allSectionsApproved}
                submittingToClient={submittingToClient}
                onSubmitToClient={userRole === USER_ROLE.LEGAL_TEAM ? handleSubmitToClient : undefined}
                onOpenDocHistory={openDocHistoryModal}
                esignSignatureDataUrl={esignSignatureDataUrl}
                onEsignSignatureChange={setEsignSignatureDataUrl}
                esignSubmitting={esignSubmitting}
                onEsignSubmit={handleEsignSubmit}
              />
            </TabsContent>
            <TabsContent value="sections" className="space-y-4">
              <SectionReviewTab
                sections={sectionsByDivision}
                onApprove={handleApproveSection}
                onReject={handleRejectSection}
                userRole={userRole ?? 0}
                processingSectionId={reviewActionSectionId}
                contractStatus={contract.status}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <ContractOverviewTab
            contract={contract}
            userRole={userRole}
            docLoading={docLoading}
            docError={docError}
            docContent={docContent}
            foundContract={foundContract}
            rawDocument={rawDocument}
            gatewayBaseUrl={URLs.TBGateWay}
            esignSignatureDataUrl={esignSignatureDataUrl}
            onEsignSignatureChange={setEsignSignatureDataUrl}
            esignSubmitting={esignSubmitting}
            onEsignSubmit={handleEsignSubmit}
          />
        )}
      </div>

      {typeof document !== 'undefined' &&
        showDocHistoryModal &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="doc-history-modal-title"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/70" onClick={() => setShowDocHistoryModal(false)} />
            <div
              className="relative z-10 w-sm rounded-lg border bg-background p-6 shadow-lg max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="doc-history-modal-title" className="text-lg font-semibold leading-none tracking-tight mb-4">
                Document history
              </h2>
              {loadingDocHistories ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : docHistories.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No history for this document.</p>
              ) : (
                <ul className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-1">
                  {docHistories.map((h, i) => (
                    <li key={h.id ?? i} className="text-sm rounded-md border bg-muted/30 px-3 py-2">
                      {h.cid ? (
                        <button
                          type="button"
                          onClick={() => handleViewDocHistoryCid(h.cid!)}
                          disabled={!!loadingViewHistoryCid}
                          className="clause-history-link text-left w-full text-foreground cursor-pointer"
                        >
                          {loadingViewHistoryCid === h.cid ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                              {formatDocHistoryReadable(h)}
                            </span>
                          ) : (
                            formatDocHistoryReadable(h)
                          )}
                        </button>
                      ) : (
                        <span className="text-foreground">{formatDocHistoryReadable(h)}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex justify-end mt-4 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setShowDocHistoryModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {typeof document !== 'undefined' &&
        viewHistoryDocContent &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="doc-history-content-modal-title"
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/70" onClick={() => setViewHistoryDocContent(null)} />
            <div
              className="relative z-10 w-full max-w-3xl max-h-[90vh] rounded-lg border bg-background shadow-lg flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b shrink-0">
                <h2 id="doc-history-content-modal-title" className="text-lg font-semibold">
                  Document at this point in history
                </h2>
                <Button type="button" variant="outline" size="sm" onClick={() => setViewHistoryDocContent(null)}>
                  Close
                </Button>
              </div>
              <div className="overflow-y-auto flex-1 p-4 min-h-0">
                <ContractDocumentTemplate
                  title={viewHistoryDocContent.contractTitle ?? contract?.title ?? 'Untitled'}
                  client={viewHistoryDocContent.client ?? contract?.client ?? ''}
                  value={contract?.value ?? ''}
                  createdDate={contract?.createdDate ?? ''}
                  docContent={viewHistoryDocContent}
                  showSignatureSection={false}
                  gatewayBaseUrl={URLs.TBGateWay}
                  disableHighlight
                />
              </div>
            </div>
          </div>,
          document.body
        )}

      <RejectReasonDialog
        open={showRejectContractDialog}
        onOpenChange={setShowRejectContractDialog}
        title="Reject contract"
        description="Please provide a reason for rejecting this contract review."
        placeholder="Enter rejection reason..."
        submitLabel="Reject contract"
        isSubmitting={clientReviewAction === 'reject'}
        onSubmit={handleClientRejectWithReason}
      />
    </div>
  );
}
