import { useState, useEffect, useMemo, useCallback } from 'react';
import { useConfig, useConnection } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ContractDocumentTemplate } from './ContractDocumentTemplate';
import { SectionReviewTab } from './SectionReviewTab';
import { SignaturePad } from './SignaturePad';
import { ArrowLeft, FileText, Calendar, DollarSign, Tag, ClipboardList, Building2, Send, Loader2, Check, X, RefreshCw } from 'lucide-react';
import { getContractById } from '@/utils/subgraph';
import { legalReviewSection, reassignSection, submitDocToClient, clientReview, clientReassignDoc, legalEsign, clientEsign } from '@/utils/interact';
import { uploadContractToPinata, uploadSignatureToPinata } from '@/utils/utility';
import type { Contract, ContractDocPayload, ContractDetailsProps } from '../data/interfaces';
import type { DivisionSection } from '../data/interfaces';
import { useUser } from '../contexts/UserContext';
import { useSubgraphRefresh } from '../contexts/SubgraphRefreshContext';
import { USER_ROLE, CONTRACT_STATUS, CONTRACT_STATUS_LABELS, DIVISION_LABELS, URLs } from '@/utils/constants';
import { formatRelativeDate } from '@/utils/utility';
import { toast } from 'sonner';

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

const sectionStatusToReviewStatus = (status: number): 'pending' | 'approved' | 'rejected' => {
  if (status === 2) return 'approved';
  if (status === 3) return 'rejected';
  return 'pending'; // 0 = not submitted, 1 = in review
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
  const [clientReassigning, setClientReassigning] = useState(false);
  const [esignSignatureDataUrl, setEsignSignatureDataUrl] = useState<string | null>(null);
  const [esignSubmitting, setEsignSubmitting] = useState(false);
  const { userRole } = useUser();
  const { refresh: refreshSubgraph } = useSubgraphRefresh();

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

  // Load section content by section CID (for Section Review tab – subgraph sections)
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

  // All sections approved by legal (status 2) → can submit to client
  const allSectionsApproved = useMemo(() => {
    const sections = rawDocument?.sections ?? [];
    return sections.length > 0 && sections.every((s: { status?: number }) => (s.status ?? 0) === 2);
  }, [rawDocument?.sections]);

  // Section Review tab: build from subgraph sections, grouped by division
  const sectionsByDivision: DivisionSection[] = useMemo(() => {
    const sections = rawDocument?.sections ?? [];
    if (sections.length === 0) return [];
    const byDivision: Record<string, Array<{ id: string; name: string; content: string; status: 'pending' | 'approved' | 'rejected'; statusNum?: number; submittedBy: string; submittedDate: string; division: string; divisionLeaderName?: string }>> = {};
    for (const sec of sections) {
      const dcat = sec?.divisionLeader?.dcategory;
      const divisionLabel = dcat != null && Number(dcat) > 0 ? (DIVISION_LABELS[Number(dcat)] ?? `Division ${dcat}`) : 'Contract';
      const leader = sec?.divisionLeader as { firstName?: string; lastName?: string } | undefined;
      const divisionLeaderName = leader
        ? [leader.firstName, leader.lastName].filter(Boolean).join(' ').trim() || undefined
        : undefined;
      const contentMap = sectionContentBySectionId[sec.id];
      if (!byDivision[divisionLabel]) byDivision[divisionLabel] = [];
      const statusNum = typeof sec.status === 'number' ? sec.status : 0;
      byDivision[divisionLabel].push({
        id: String(sec.id),
        name: contentMap?.sectionName ?? `Section ${sec.id}`,
        content: contentMap?.content ?? '',
        status: sectionStatusToReviewStatus(statusNum),
        statusNum,
        submittedBy: '—',
        submittedDate: '—',
        division: divisionLabel,
        divisionLeaderName: divisionLeaderName || undefined,
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
      const success = await legalReviewSection(config, address, sectionIdNum, true, newDocCid);
      if (success) {
        toast.success('Section approved');
        setTimeout(async () => {
          refreshSubgraph();
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
      const success = await legalReviewSection(config, address, sectionIdNum, false, '');
      if (success) {
        toast.success('Section rejected');
        setTimeout(async () => {
          refreshSubgraph();
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
      // Reconstruct doc from section contents (order from subgraph), then upload to get new CID
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
          refreshSubgraph();
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

  const handleReassignSection = async (sectionId: string) => {
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
      const success = await reassignSection(config, address, sectionIdNum);
      if (success) {
        toast.success('Section reassigned');
        setTimeout(async () => {
          refreshSubgraph();
          await fetchContract();
        }, 4000);
      } else {
        toast.error('Failed to reassign section');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to reassign section');
    } finally {
      setReviewActionSectionId(null);
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
      const success = await clientReview(config, address, docIdNum, true);
      if (success) {
        toast.success('Contract approved');
        setTimeout(async () => {
          refreshSubgraph();
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

  const handleClientReject = async () => {
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
      const success = await clientReview(config, address, docIdNum, false);
      if (success) {
        toast.success('Contract rejected');
        setTimeout(async () => {
          refreshSubgraph();
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
          refreshSubgraph();
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

  const handleClientReassign = async () => {
    if (!config || !address) {
      toast.error('Wallet not connected');
      return;
    }
    const docIdNum = Number(contractId);
    if (Number.isNaN(docIdNum)) {
      toast.error('Invalid contract');
      return;
    }
    setClientReassigning(true);
    try {
      const success = await clientReassignDoc(config, address, docIdNum);
      if (success) {
        toast.success('Contract reassigned');
        setTimeout(async () => {
          refreshSubgraph();
          await fetchContract();
        }, 4000);
      } else {
        toast.error('Failed to reassign contract');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to reassign contract');
    } finally {
      setClientReassigning(false);
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
    createdDate: foundContract.createdAt ? formatRelativeDate(foundContract.createdAt) : '—',
    description: docContent?.description ?? `Comprehensive agreement for ${foundContract.client} regarding ${foundContract.title.toLowerCase()}.`,
    value: docContent?.price ?? '—',
    involvedDivisions: involvedDivisions.length > 0 ? involvedDivisions : (foundContract.category ? [foundContract.category] : []),
  } : null;

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-orange-100 text-orange-800 border-orange-200';
      case 1: return 'bg-blue-100 text-blue-800 border-blue-200';
      case 2: return 'bg-green-100 text-green-800 border-green-200';
      case 3: return 'bg-red-100 text-red-800 border-red-200';
      case 4: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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
        {/* Client: overview only, no tabs. Legal/others: full tabs with Overview, Section Review, Activity */}
        {userRole === USER_ROLE.CLIENT ? (
          <div className="space-y-6">
            {/* Overview content for client (no tabs) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <ClipboardList className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Status</span>
                </div>
                <Badge className={getStatusColor(contract.status)}>
                  {CONTRACT_STATUS_LABELS[contract.status] ?? 'Unknown'}
                </Badge>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Tag className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Category</span>
                </div>
                <p className="font-medium">{contract.category || '—'}</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Value</span>
                </div>
                <p className="font-semibold text-green-600">{contract.value}</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Created</span>
                </div>
                <p className="font-medium">{contract.createdDate}</p>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Building2 className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Involved Divisions</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {contract.involvedDivisions.length > 0 ? (
                  contract.involvedDivisions.map((division: string) => (
                    <Badge key={division} variant="secondary" className="text-xs">
                      {division}
                    </Badge>
                  ))
                ) : (
                  <p className="font-medium text-muted-foreground">—</p>
                )}
              </div>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{contract.description}</p>
              </CardContent>
            </Card>
            <div className="flex justify-center">
              <Card className="w-full max-w-3xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Document View
                  </CardTitle>
                  {contract.status === CONTRACT_STATUS.DIVISION_REQUEST && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-2 bg-green-600 hover:bg-green-700"
                        disabled={clientReviewAction !== null}
                        onClick={handleClientApprove}
                      >
                        {clientReviewAction === 'approve' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        {clientReviewAction === 'approve' ? 'Approving...' : 'Approve'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                        disabled={clientReviewAction !== null}
                        onClick={handleClientReject}
                      >
                        {clientReviewAction === 'reject' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        {clientReviewAction === 'reject' ? 'Rejecting...' : 'Reject'}
                      </Button>
                    </div>
                  )}
                  {contract.status === CONTRACT_STATUS.REJECTED && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 shrink-0"
                      disabled={clientReassigning}
                      onClick={handleClientReassign}
                    >
                      {clientReassigning ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      {clientReassigning ? 'Reassigning...' : 'Reassign'}
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {docLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : docError ? (
                    <p className="text-muted-foreground py-6 text-center">{docError}</p>
                  ) : docContent ? (
                    <ContractDocumentTemplate
                      title={contract.title}
                      client={contract.client}
                      value={contract.value}
                      createdDate={contract.createdDate}
                      docContent={docContent}
                      showSignatureSection={contract.status === CONTRACT_STATUS.APPROVED || contract.status === CONTRACT_STATUS.ESIGNED}
                      licensorSignature={rawDocument?.legalESign ?? null}
                      licenseeSignature={rawDocument?.clientESign ?? null}
                      gatewayBaseUrl={URLs.TBGateWay}
                      licensorSlot={contract.status === CONTRACT_STATUS.APPROVED && userRole === USER_ROLE.LEGAL_TEAM && !rawDocument?.legalESign?.cid ? (
                        <div className="space-y-2">
                          <SignaturePad onSignatureChange={setEsignSignatureDataUrl} />
                          <Button
                            variant="default"
                            size="sm"
                            className="gap-2"
                            disabled={!esignSignatureDataUrl || esignSubmitting}
                            onClick={() => handleEsignSubmit(true)}
                          >
                            {esignSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            {esignSubmitting ? 'Submitting...' : 'Sign'}
                          </Button>
                        </div>
                      ) : undefined}
                      licenseeSlot={contract.status === CONTRACT_STATUS.APPROVED && userRole === USER_ROLE.CLIENT && !rawDocument?.clientESign?.cid ? (
                        <div className="space-y-2">
                          <SignaturePad onSignatureChange={setEsignSignatureDataUrl} />
                          <Button
                            variant="default"
                            size="sm"
                            className="gap-2"
                            disabled={!esignSignatureDataUrl || esignSubmitting}
                            onClick={() => handleEsignSubmit(false)}
                          >
                            {esignSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            {esignSubmitting ? 'Submitting...' : 'Sign'}
                          </Button>
                        </div>
                      ) : undefined}
                    />
                  ) : foundContract?.cid ? (
                    <p className="text-muted-foreground py-6 text-center">Document content unavailable</p>
                  ) : (
                    <ContractDocumentTemplate
                      title={contract.title}
                      client={contract.client}
                      value={contract.value}
                      createdDate={contract.createdDate}
                      showSignatureSection={contract.status === CONTRACT_STATUS.APPROVED || contract.status === CONTRACT_STATUS.ESIGNED}
                      licensorSignature={rawDocument?.legalESign ?? null}
                      licenseeSignature={rawDocument?.clientESign ?? null}
                      gatewayBaseUrl={URLs.TBGateWay}
                      licensorSlot={contract.status === CONTRACT_STATUS.APPROVED && userRole === USER_ROLE.LEGAL_TEAM && !rawDocument?.legalESign?.cid ? (
                        <div className="space-y-2">
                          <SignaturePad onSignatureChange={setEsignSignatureDataUrl} />
                          <Button variant="default" size="sm" className="gap-2" disabled={!esignSignatureDataUrl || esignSubmitting} onClick={() => handleEsignSubmit(true)}>
                            {esignSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            {esignSubmitting ? 'Submitting...' : 'Sign'}
                          </Button>
                        </div>
                      ) : undefined}
                      licenseeSlot={contract.status === CONTRACT_STATUS.APPROVED && userRole === USER_ROLE.CLIENT && !rawDocument?.clientESign?.cid ? (
                        <div className="space-y-2">
                          <SignaturePad onSignatureChange={setEsignSignatureDataUrl} />
                          <Button variant="default" size="sm" className="gap-2" disabled={!esignSignatureDataUrl || esignSubmitting} onClick={() => handleEsignSubmit(false)}>
                            {esignSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            {esignSubmitting ? 'Submitting...' : 'Sign'}
                          </Button>
                        </div>
                      ) : undefined}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 h-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sections">Section Review</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <ClipboardList className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Status</span>
                  </div>
                  <Badge className={getStatusColor(contract.status)}>
                    {CONTRACT_STATUS_LABELS[contract.status] ?? 'Unknown'}
                  </Badge>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Tag className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Category</span>
                  </div>
                  <p className="font-medium">{contract.category || '—'}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Value</span>
                  </div>
                  <p className="font-semibold text-green-600">{contract.value}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Created</span>
                  </div>
                  <p className="font-medium">{contract.createdDate}</p>
                </div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Building2 className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Involved Divisions</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {contract.involvedDivisions.length > 0 ? (
                    contract.involvedDivisions.map((division: string) => (
                      <Badge key={division} variant="secondary" className="text-xs">
                        {division}
                      </Badge>
                    ))
                  ) : (
                    <p className="font-medium text-muted-foreground">—</p>
                  )}
                </div>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{contract.description}</p>
                </CardContent>
              </Card>
              <div className="flex justify-center">
                <Card className="w-full max-w-3xl">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Document View
                    </CardTitle>
                    {userRole === USER_ROLE.LEGAL_TEAM && allSectionsApproved && foundContract?.status === CONTRACT_STATUS.PENDING && foundContract?.cid?.trim() && (
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-2 bg-green-600 hover:bg-green-700 shrink-0"
                        disabled={submittingToClient}
                        onClick={handleSubmitToClient}
                      >
                        {submittingToClient ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        {submittingToClient ? 'Submitting...' : 'Submit to Client'}
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {docLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                      </div>
                    ) : docError ? (
                      <p className="text-muted-foreground py-6 text-center">{docError}</p>
                    ) : docContent ? (
                      <ContractDocumentTemplate
                        title={contract.title}
                        client={contract.client}
                        value={contract.value}
                        createdDate={contract.createdDate}
                        docContent={docContent}
                        showSignatureSection={contract.status === CONTRACT_STATUS.APPROVED || contract.status === CONTRACT_STATUS.ESIGNED}
                        licensorSignature={rawDocument?.legalESign ?? null}
                        licenseeSignature={rawDocument?.clientESign ?? null}
                        gatewayBaseUrl={URLs.TBGateWay}
                        licensorSlot={contract.status === CONTRACT_STATUS.APPROVED && userRole === USER_ROLE.LEGAL_TEAM && !rawDocument?.legalESign?.cid ? (
                          <div className="space-y-2">
                            <SignaturePad onSignatureChange={setEsignSignatureDataUrl} />
                            <Button variant="default" size="sm" className="gap-2" disabled={!esignSignatureDataUrl || esignSubmitting} onClick={() => handleEsignSubmit(true)}>
                              {esignSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                              {esignSubmitting ? 'Submitting...' : 'Sign'}
                            </Button>
                          </div>
                        ) : undefined}
                        licenseeSlot={contract.status === CONTRACT_STATUS.APPROVED && userRole === USER_ROLE.CLIENT && !rawDocument?.clientESign?.cid ? (
                          <div className="space-y-2">
                            <SignaturePad onSignatureChange={setEsignSignatureDataUrl} />
                            <Button variant="default" size="sm" className="gap-2" disabled={!esignSignatureDataUrl || esignSubmitting} onClick={() => handleEsignSubmit(false)}>
                              {esignSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                              {esignSubmitting ? 'Submitting...' : 'Sign'}
                            </Button>
                          </div>
                        ) : undefined}
                      />
                    ) : foundContract?.cid ? (
                      <p className="text-muted-foreground py-6 text-center">Document content unavailable</p>
                    ) : (
                      <ContractDocumentTemplate
                        title={contract.title}
                        client={contract.client}
                        value={contract.value}
                        createdDate={contract.createdDate}
                        showSignatureSection={contract.status === CONTRACT_STATUS.APPROVED || contract.status === CONTRACT_STATUS.ESIGNED}
                        licensorSignature={rawDocument?.legalESign ?? null}
                        licenseeSignature={rawDocument?.clientESign ?? null}
                        gatewayBaseUrl={URLs.TBGateWay}
                        licensorSlot={contract.status === CONTRACT_STATUS.APPROVED && userRole === USER_ROLE.LEGAL_TEAM && !rawDocument?.legalESign?.cid ? (
                          <div className="space-y-2">
                            <SignaturePad onSignatureChange={setEsignSignatureDataUrl} />
                            <Button variant="default" size="sm" className="gap-2" disabled={!esignSignatureDataUrl || esignSubmitting} onClick={() => handleEsignSubmit(true)}>
                              {esignSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                              {esignSubmitting ? 'Submitting...' : 'Sign'}
                            </Button>
                          </div>
                        ) : undefined}
                        licenseeSlot={contract.status === CONTRACT_STATUS.APPROVED && userRole === USER_ROLE.CLIENT && !rawDocument?.clientESign?.cid ? (
                          <div className="space-y-2">
                            <SignaturePad onSignatureChange={setEsignSignatureDataUrl} />
                            <Button variant="default" size="sm" className="gap-2" disabled={!esignSignatureDataUrl || esignSubmitting} onClick={() => handleEsignSubmit(false)}>
                              {esignSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                              {esignSubmitting ? 'Submitting...' : 'Sign'}
                            </Button>
                          </div>
                        ) : undefined}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="sections" className="space-y-4">
              <SectionReviewTab
                sections={sectionsByDivision}
                onApprove={handleApproveSection}
                onReject={handleRejectSection}
                onReassign={handleReassignSection}
                userRole={userRole ?? 0}
                processingSectionId={reviewActionSectionId}
              />
            </TabsContent>
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Activity timeline will be displayed here</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}