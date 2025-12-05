import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Clock, User, CheckCircle2, AlertCircle } from 'lucide-react';

export function AssignedWork() {
  const assignedSections = [
    {
      id: 1,
      contractName: 'Enterprise Software License Agreement',
      sectionName: 'Payment Terms',
      assignedBy: 'Sarah Chen (Legal)',
      dueDate: '2025-12-10',
      status: 'pending',
      priority: 'high',
    },
    {
      id: 2,
      contractName: 'Vendor Service Agreement',
      sectionName: 'Compliance Requirements',
      assignedBy: 'Sarah Chen (Legal)',
      dueDate: '2025-12-08',
      status: 'in-progress',
      priority: 'medium',
    },
    {
      id: 3,
      contractName: 'Partnership Agreement',
      sectionName: 'Revenue Sharing Clause',
      assignedBy: 'Sarah Chen (Legal)',
      dueDate: '2025-12-15',
      status: 'pending',
      priority: 'low',
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl mb-2">Assigned Work</h1>
        <p className="text-muted-foreground">
          Sections assigned to you from the Legal division
        </p>
      </div>

      <div className="grid gap-4">
        {assignedSections.map((section) => (
          <Card key={section.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-1">{section.sectionName}</CardTitle>
                  <CardDescription>{section.contractName}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge className={getPriorityColor(section.priority)}>
                    {section.priority}
                  </Badge>
                  <Badge className={getStatusColor(section.status)}>
                    {section.status.replace('-', ' ')}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{section.assignedBy}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Due {section.dueDate}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">View Details</Button>
                  <Button size="sm" className="bg-brand-secondary hover:bg-brand-secondary/90">
                    Work on Section
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
