import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Clock, User, CheckCircle2, FileText } from 'lucide-react';

export function MyAssignments() {
  const myAssignments = [
    {
      id: 1,
      contractName: 'Enterprise Software License Agreement',
      sectionName: 'Payment Terms',
      clauseName: 'Payment Schedule',
      assignedBy: 'Jennifer Taylor (Division Lead)',
      dueDate: '2025-12-10',
      status: 'in-progress',
      priority: 'high',
      progress: 60,
    },
    {
      id: 2,
      contractName: 'Enterprise Software License Agreement',
      sectionName: 'Payment Terms',
      clauseName: 'Late Payment Penalties',
      assignedBy: 'Jennifer Taylor (Division Lead)',
      dueDate: '2025-12-10',
      status: 'pending',
      priority: 'high',
      progress: 0,
    },
    {
      id: 3,
      contractName: 'Vendor Service Agreement',
      sectionName: 'Service Level Requirements',
      clauseName: 'Uptime Guarantees',
      assignedBy: 'Jennifer Taylor (Division Lead)',
      dueDate: '2025-12-08',
      status: 'in-progress',
      priority: 'medium',
      progress: 80,
    },
    {
      id: 4,
      contractName: 'Partnership Agreement',
      sectionName: 'Revenue Sharing',
      clauseName: 'Quarterly Distribution',
      assignedBy: 'Jennifer Taylor (Division Lead)',
      dueDate: '2025-12-15',
      status: 'pending',
      priority: 'low',
      progress: 0,
    },
    {
      id: 5,
      contractName: 'Client Service Agreement',
      sectionName: 'Termination Clause',
      clauseName: 'Notice Period',
      assignedBy: 'Jennifer Taylor (Division Lead)',
      dueDate: '2025-12-07',
      status: 'completed',
      priority: 'medium',
      progress: 100,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: myAssignments.length,
    pending: myAssignments.filter((a) => a.status === 'pending').length,
    inProgress: myAssignments.filter((a) => a.status === 'in-progress').length,
    completed: myAssignments.filter((a) => a.status === 'completed').length,
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl mb-2">My Assignments</h1>
        <p className="text-muted-foreground">
          Sections and clauses assigned to you by your Division Lead
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Total Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments List */}
      <div className="grid gap-4">
        {myAssignments.map((assignment) => (
          <Card key={assignment.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg">{assignment.clauseName}</CardTitle>
                    <Badge className={getPriorityColor(assignment.priority)}>
                      {assignment.priority}
                    </Badge>
                    <Badge className={getStatusColor(assignment.status)}>
                      {assignment.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  <CardDescription>
                    {assignment.sectionName} · {assignment.contractName}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Progress</span>
                    <span>{assignment.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-secondary transition-all"
                      style={{ width: `${assignment.progress}%` }}
                    />
                  </div>
                </div>

                {/* Details and Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{assignment.assignedBy}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Due {assignment.dueDate}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">View Details</Button>
                    {assignment.status !== 'completed' && (
                      <Button size="sm" className="bg-brand-secondary hover:bg-brand-secondary/90">
                        Continue Work
                      </Button>
                    )}
                    {assignment.status === 'completed' && (
                      <Button size="sm" variant="outline" className="text-green-600">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Completed
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
