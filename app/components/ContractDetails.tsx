import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ContractDocumentTemplate } from './ContractDocumentTemplate';
import { SectionReviewTab } from './SectionReviewTab';
import { 
  FileText, 
  Download, 
  Edit, 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Send,
  Eye,
  User,
  Calendar,
  DollarSign,
  Building,
  ArrowLeft
} from 'lucide-react';
import { allContracts, divisionLeadContracts, divisionMemberContracts, ownerContracts, Contract } from '../data/mockContracts';
import { useUser } from '../contexts/UserContext';
import { USER_ROLE } from '@/utils/constants';

interface ContractDetailsProps {
  contractId?: number;
  onBack?: () => void;
}

export function ContractDetails({ contractId = 1, onBack }: ContractDetailsProps) {
  const [newComment, setNewComment] = useState('');
  const { userRole } = useUser();

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

  // Get contracts based on role
  const getContractsForRole = (): Contract[] => {
    switch (userRole) {
      case USER_ROLE.LEGAL_TEAM:
        return allContracts;
      case USER_ROLE.DIVISION_LEADER:
        return divisionLeadContracts;
      case USER_ROLE.DIVISION_MEMBER:
        return divisionMemberContracts;
      case USER_ROLE.PROJECT_OWNER:
        return ownerContracts;
      default:
        return allContracts;
    }
  };

  // Find the contract by ID
  const contracts = getContractsForRole();
  const foundContract = contracts.find(c => c.id === contractId) || contracts[0];

  // Map contract data to the format needed
  const contract = {
    id: foundContract.id,
    title: `${foundContract.name} - ${foundContract.client}`,
    client: foundContract.client,
    status: foundContract.status,
    priority: foundContract.priority || 'medium',
    value: foundContract.value || '$125,000', // Default value for display
    dueDate: '2024-12-15',
    assignee: foundContract.owner,
    createdDate: foundContract.lastModified,
    version: '2.1',
    description: `Comprehensive agreement for ${foundContract.client} regarding ${foundContract.name.toLowerCase()}.`,
    involvedDivisions: ['Legal', 'Finance', 'IT/Technology', 'Procurement', 'Sales']
  };

  const comments = [
    {
      id: 1,
      user: 'Mike Chen',
      avatar: '/avatar-mike.jpg',
      time: '2 hours ago',
      content: 'I\'ve reviewed the pricing section and it looks good. However, we should clarify the data retention policy in section 4.2.',
      type: 'comment'
    },
    {
      id: 2,
      user: 'Emma Davis',
      avatar: '/avatar-emma.jpg',
      time: '4 hours ago',
      content: 'The liability clauses have been updated according to legal review. Please check sections 7.1 and 7.2.',
      type: 'update'
    },
    {
      id: 3,
      user: 'Alex Rodriguez',
      avatar: '/avatar-alex.jpg',
      time: '1 day ago',
      content: 'Client has requested modifications to the termination clause. I\'ll schedule a call to discuss the changes.',
      type: 'comment'
    }
  ];

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'review': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'requires-action': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      // In a real app, this would make an API call
      console.log('Adding comment:', newComment);
      setNewComment('');
    }
  };

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
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-5 h-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sections">Section Review</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              {/* TODO: Versions tab - Hidden for now, will be used later if needed */}
              {/* <TabsTrigger value="versions">Versions</TabsTrigger> */}
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

            <TabsContent value="comments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Comments & Discussion
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 p-4 border rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.avatar} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{comment.user}</span>
                          <span className="text-xs text-muted-foreground">{comment.time}</span>
                          {comment.type === 'update' && (
                            <Badge variant="secondary" className="text-xs">Update</Badge>
                          )}
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="mb-2"
                    />
                    <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                      <Send className="h-4 w-4 mr-2" />
                      Add Comment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TODO: Versions tab content - Hidden for now, will be used later if needed */}
            {/* <TabsContent value="versions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Version History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {versions.map((version) => (
                    <div key={version.version} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">Version {version.version}</span>
                          {version.current && (
                            <Badge variant="default">Current</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{version.changes}</p>
                        <p className="text-xs text-muted-foreground">
                          {version.author} • {version.date}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent> */}

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
                {contract.status}
              </Badge>
              
              <div className="space-y-3">
                {/* TODO: Assign To field - Hidden for now, will be used later if needed */}
                {/* <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Assigned to {contract.assignee}</span>
                </div> */}
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