import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ContractDocumentTemplate } from './ContractDocumentTemplate';
import { SectionReviewTab } from './SectionReviewTab';
import { ArrowLeft, FileText, Calendar, DollarSign, Tag, ClipboardList, Building2 } from 'lucide-react';
import { getContractById } from '@/utils/subgraph';
import type { Contract } from '../data/mockContracts';
import { useUser } from '../contexts/UserContext';
import { USER_ROLE, CONTRACT_STATUS_LABELS, DIVISION_LABELS, URLs } from '@/utils/constants';
import { formatRelativeDate } from '@/utils/utility';

interface ContractDocPayload {
  contractTitle?: string;
  client?: string;
  description?: string;
  price?: string;
  category?: string;
  sections?: Array<{
    sectionName: string;
    sectionContent: Array<{ clauseId: string; clauseContent: string }>;
  }>;
}

interface ContractDetailsProps {
  contractId?: number;
  onBack?: () => void;
}

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

export function ContractDetails({ contractId = 1, onBack }: ContractDetailsProps) {
  const [foundContract, setFoundContract] = useState<Contract | null>(null);
  const [rawDocument, setRawDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [docContent, setDocContent] = useState<ContractDocPayload | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const { userRole } = useUser();

  useEffect(() => {
    const fetchContract = async () => {
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
    };
    fetchContract();
  }, [contractId]);

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

  const sectionsByDivision = docContent?.sections?.length
    ? [{
        division: foundContract?.category || 'Contract',
        sections: docContent.sections.map((s, i) => ({
          id: `section-${i}`,
          name: s.sectionName,
          content: s.sectionContent?.map((c) => c.clauseContent).filter(Boolean).join('\n\n') || '',
          status: 'pending' as const,
          submittedBy: '—',
          submittedDate: '—',
          division: foundContract?.category || 'Contract',
        })),
      }]
    : [];

  const handleApproveSection = (sectionId: string) => {
    console.log('Approving section:', sectionId);
    // In a real app, this would make an API call
  };

  const handleRejectSection = (sectionId: string, reason: string) => {
    console.log('Rejecting section:', sectionId, 'Reason:', reason);
    // In a real app, this would make an API call
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
      case 3: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
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
        {/* Main Content */}
        <div className="space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 h-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sections">Section Review</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* Row 1: Status, Category, Value, Created */}
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

              {/* Row 2: Involved Divisions */}
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

              {/* Description */}
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
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Document View
                    </CardTitle>
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
                    />
                  ) : foundContract?.cid ? (
                    <p className="text-muted-foreground py-6 text-center">Document content unavailable</p>
                  ) : (
                    <ContractDocumentTemplate
                      title={contract.title}
                      client={contract.client}
                      value={contract.value}
                      createdDate={contract.createdDate}
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
                userRole={userRole || 0}
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
        </div>
      </div>
    </div>
  );
}