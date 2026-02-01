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
import { USER_ROLE, CONTRACT_STATUS_LABELS, DIVISION_LABELS } from '@/utils/constants';

interface ContractDetailsProps {
  contractId?: number;
  onBack?: () => void;
}

const formatRelativeDate = (dateStr: string | number) => {
  if (dateStr === undefined || dateStr === null || dateStr === '') return '';
  const date = typeof dateStr === 'number' ? new Date(dateStr * 1000) : new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
};

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
  };
};

export function ContractDetails({ contractId = 1, onBack }: ContractDetailsProps) {
  const [foundContract, setFoundContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
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

  // Mock sections data grouped by division
  const mockSectionsByDivision = [
    {
      division: 'Finance',
      sections: [
        {
          id: 'finance-1',
          name: 'Pricing & Payment Terms',
          content: 'The total contract value for this agreement is $125,000, payable according to the following schedule: Initial payment of 50% ($62,500) due upon execution of this Agreement. Remaining balance of 50% ($62,500) due upon completion of implementation. All payments shall be made within thirty (30) days of invoice date.',
          status: 'pending' as const,
          submittedBy: 'Jennifer Taylor',
          submittedDate: '2 days ago',
          division: 'Finance'
        },
        {
          id: 'finance-2',
          name: 'Budget Allocation',
          content: 'Budget allocation across different project phases: Phase 1 (40%), Phase 2 (35%), Phase 3 (25%). Each phase requires separate approval before proceeding.',
          status: 'approved' as const,
          submittedBy: 'Jennifer Taylor',
          submittedDate: '5 days ago',
          division: 'Finance'
        }
      ]
    },
    {
      division: 'Legal',
      sections: [
        {
          id: 'legal-1',
          name: 'Terms & Conditions',
          content: 'This Software License Agreement ("Agreement") is entered into between TechCorp Solutions Inc. ("Licensee") and the software provider ("Licensor") effective as of the date of execution. The Licensor grants to the Licensee a non-exclusive, non-transferable license to use the Software in accordance with the terms and conditions set forth herein.',
          status: 'approved' as const,
          submittedBy: 'Sarah Johnson',
          submittedDate: '1 week ago',
          division: 'Legal'
        }
      ]
    },
    {
      division: 'Project Management',
      sections: [
        {
          id: 'pm-1',
          name: 'Service Level Agreement',
          content: 'The Licensor commits to maintaining the Software with an uptime availability of 99.9% measured on a monthly basis, excluding scheduled maintenance windows. Support services will be provided during standard business hours (9:00 AM - 6:00 PM EST, Monday through Friday).',
          status: 'pending' as const,
          submittedBy: 'Michael Rodriguez',
          submittedDate: '1 day ago',
          division: 'Project Management'
        },
        {
          id: 'pm-2',
          name: 'Project Timeline',
          content: 'Project timeline includes three main phases: Phase 1 (Weeks 1-4): Initial setup and configuration. Phase 2 (Weeks 5-8): Core implementation and testing. Phase 3 (Weeks 9-12): Final integration and deployment.',
          status: 'rejected' as const,
          submittedBy: 'Michael Rodriguez',
          submittedDate: '3 days ago',
          division: 'Project Management',
          comments: 'Timeline is too aggressive. Please revise with more realistic deadlines and buffer time for unexpected issues.'
        }
      ]
    },
    {
      division: 'Risk Management',
      sections: [
        {
          id: 'risk-1',
          name: 'Liability & Insurance',
          content: 'The Licensor\'s total liability under this Agreement shall not exceed the total fees paid by the Licensee in the twelve (12) months preceding the claim. Neither party shall be liable for indirect, incidental, special, or consequential damages.',
          status: 'pending' as const,
          submittedBy: 'David Kim',
          submittedDate: '4 hours ago',
          division: 'Risk Management'
        }
      ]
    }
  ];

  const handleApproveSection = (sectionId: string) => {
    console.log('Approving section:', sectionId);
    // In a real app, this would make an API call
  };

  const handleRejectSection = (sectionId: string, reason: string) => {
    console.log('Rejecting section:', sectionId, 'Reason:', reason);
    // In a real app, this would make an API call
  };

  // Map contract data to the format needed
  const contract = foundContract ? {
    id: foundContract.id,
    title: `${foundContract.title} - ${foundContract.client}`,
    client: foundContract.client,
    status: foundContract.status,
    category: foundContract.category,
    dueDate: '2024-12-15',
    createdDate: foundContract.createdAt ? formatRelativeDate(foundContract.createdAt) : '—',
    version: '2.1',
    description: `Comprehensive agreement for ${foundContract.client} regarding ${foundContract.title.toLowerCase()}.`,
    involvedDivisions: foundContract.category ? [foundContract.category] : ['Legal', 'Finance', 'IT/Technology', 'Procurement', 'Sales'],
    value: '—'
  } : null;

  const versions = [
    {
      version: '2.1',
      date: '2024-12-08',
      author: 'Sarah Johnson',
      changes: 'Updated pricing structure and added data retention policy',
      current: true
    },
    {
      version: '2.0',
      date: '2024-12-05',
      author: 'Mike Chen',
      changes: 'Legal review completed, liability clauses updated',
      current: false
    },
    {
      version: '1.3',
      date: '2024-12-01',
      author: 'Emma Davis',
      changes: 'Initial draft with standard terms and conditions',
      current: false
    }
  ];

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
                      <span className="font-medium">Due Date:</span>
                      <p>{contract.dueDate}</p>
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
                  <CardTitle>Document Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <ContractDocumentTemplate
                    title={contract.title}
                    client={contract.client}
                    value={contract.value}
                    createdDate={contract.createdDate}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sections" className="space-y-4">
              <SectionReviewTab
                sections={mockSectionsByDivision}
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
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Due {contract.dueDate}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{contract.value}</span>
                </div>
              </div>

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