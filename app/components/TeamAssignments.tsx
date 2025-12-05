import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Clock, Users, Plus } from 'lucide-react';

export function TeamAssignments() {
  const teamMembers = [
    { id: 1, name: 'David Kim', role: 'Division Member', avatar: 'DK', workload: 6 },
    { id: 2, name: 'Emily Martinez', role: 'Division Member', avatar: 'EM', workload: 4 },
    { id: 3, name: 'James Wilson', role: 'Division Member', avatar: 'JW', workload: 5 },
  ];

  const assignments = [
    {
      id: 1,
      contractName: 'Enterprise Software License Agreement',
      sectionName: 'Payment Terms',
      assignedTo: 'David Kim',
      dueDate: '2025-12-10',
      status: 'assigned',
    },
    {
      id: 2,
      contractName: 'Vendor Service Agreement',
      sectionName: 'Compliance Requirements',
      assignedTo: 'Emily Martinez',
      dueDate: '2025-12-08',
      status: 'in-progress',
    },
    {
      id: 3,
      contractName: 'Partnership Agreement',
      sectionName: 'Liability Clause',
      assignedTo: 'James Wilson',
      dueDate: '2025-12-12',
      status: 'assigned',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Team Assignments</h1>
          <p className="text-muted-foreground">
            Manage and distribute work to your team members
          </p>
        </div>
        <Button className="bg-brand-secondary hover:bg-brand-secondary/90">
          <Plus className="h-4 w-4 mr-2" />
          New Assignment
        </Button>
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {teamMembers.map((member) => (
          <Card key={member.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{member.avatar}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">{member.name}</CardTitle>
                  <CardDescription className="text-xs">{member.role}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Tasks</span>
                <Badge variant="secondary">{member.workload}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Active Assignments</CardTitle>
          <CardDescription>Current work distributed to team members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-medium">{assignment.sectionName}</h3>
                    <Badge variant={assignment.status === 'in-progress' ? 'default' : 'secondary'}>
                      {assignment.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{assignment.contractName}</p>
                </div>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{assignment.assignedTo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Due {assignment.dueDate}</span>
                  </div>
                  <Button variant="ghost" size="sm">View</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
