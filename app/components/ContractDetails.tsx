import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ContractDocumentTemplate } from './ContractDocumentTemplate';
import { SectionReviewTab } from './SectionReviewTab';
import { 
  CheckCircle, 
  AlertTriangle,
  User,
  Calendar,
  DollarSign,
  Building,
  ArrowLeft
} from 'lucide-react';
import { getAllContracts } from '@/utils/subgraph';
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
  showApproveActions?: boolean;
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

export function ContractDetails({ contractId = 1, onBack, showApproveActions = true }: ContractDetailsProps) {
  const [foundContract, setFoundContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [docContent, setDocContent] = useState<ContractDocPayload | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const { userRole } = useUser();

  useEffect(() => {
    const fetchContract = async () => {
      setLoading(true);
      try {
        const docs = await getAllContracts();
        const contracts = Array.isArray(docs) ? docs.map(mapDocumentToContract) : [];
        const contract = contracts.find(c => c.id === contractId) || contracts[0];
        setFoundContract(contract ?? null);
      } catch (e) {
        console.error('Failed to fetch contract:', e);
        setFoundContract(null);
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

  const contract = foundContract ? {
    id: foundContract.id,
    title: docContent?.contractTitle ? `${docContent.contractTitle}` : `${foundContract.title}`,
    client: docContent?.client ?? foundContract.client,
    status: foundContract.status,
    category: docContent?.category ?? foundContract.category,
    createdDate: foundContract.createdAt ? formatRelativeDate(foundContract.createdAt) : '—',
    description: docContent?.description ?? `Comprehensive agreement for ${foundContract.client} regarding ${foundContract.title.toLowerCase()}.`,
    involvedDivisions: docContent?.category ? [docContent.category] : foundContract.category ? [foundContract.category] : ['Legal', 'Finance', 'IT/Technology', 'Procurement', 'Sales'],
    value: docContent?.price ?? '—',
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 h-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sections">Section Review</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contract Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{contract.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Contract Value:</span>
                      <p className="text-lg font-semibold text-green-600">{contract.value}</p>
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>
                      <p>{contract.createdDate}</p>
                    </div>
                    {/* TODO: Version field - Hidden for now, will be used later if needed */}
                    {/* <div>
                      <span className="font-medium">Version:</span>
                      <p>{contract.version}</p>
                    </div> */}
                  </div>
                  
                  <div className="pt-4 border-t">
                    <span className="font-medium">Involved Divisions:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {contract.involvedDivisions.map((division) => (
                        <Badge key={division} variant="outline" className="text-xs">
                          {division}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Document View</CardTitle>
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

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge className={getStatusColor(contract.status)}>
                {CONTRACT_STATUS_LABELS[contract.status] ?? 'Unknown'}
              </Badge>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{contract.value}</span>
                </div>
              </div>

              {showApproveActions && (
                <div className="pt-4 space-y-2">
                  <Button className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Contract
                  </Button>
                  <Button variant="outline" className="w-full">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Request Changes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Involved Divisions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contract.involvedDivisions.map((division) => (
                <div key={division} className="flex items-center gap-3 p-2 border rounded-lg">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{division}</span>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full mt-2">
                Add Division
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {['Sarah Johnson', 'Mike Chen', 'Emma Davis'].map((member) => (
                <div key={member} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{member}</span>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full mt-2">
                Add Member
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}