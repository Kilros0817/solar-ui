import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
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
  Building
} from 'lucide-react';

export function ContractDetails() {
  const [newComment, setNewComment] = useState('');

  const contract = {
    id: 1,
    title: 'Software License Agreement - TechCorp Solutions',
    client: 'TechCorp Solutions Inc.',
    status: 'pending',
    priority: 'high',
    value: '$125,000',
    dueDate: '2024-12-15',
    assignee: 'Sarah Johnson',
    createdDate: '2024-11-15',
    version: '2.1',
    description: 'Comprehensive software licensing agreement for enterprise-level deployment of our SaaS platform including premium support and customization services.',
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
        <div>
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="versions">Versions</TabsTrigger>
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
                    <div>
                      <span className="font-medium">Version:</span>
                      <p>{contract.version}</p>
                    </div>
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
                  <div className="border rounded-lg p-4 bg-muted/30 h-64 flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Document preview will appear here</p>
                      <Button variant="outline" className="mt-4">
                        <Eye className="h-4 w-4 mr-2" />
                        Full Preview
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
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

            <TabsContent value="versions" className="space-y-4">
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
                {contract.status}
              </Badge>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Assigned to {contract.assignee}</span>
                </div>
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