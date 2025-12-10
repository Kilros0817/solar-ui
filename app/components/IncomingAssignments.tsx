import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Clock, User, Bell, CheckCircle2 } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { USER_ROLE } from '@/utils/constants';
import { useState } from 'react';
import {
  divisionLeadIncoming as initialDivisionLeadIncoming,
  divisionMemberIncoming as initialDivisionMemberIncoming,
  Assignment,
} from '../data/mockAssignments';

export function IncomingAssignments() {
  const { userRole } = useUser();

  const initialAssignments = userRole === USER_ROLE.DIVISION_LEADER ? initialDivisionLeadIncoming : initialDivisionMemberIncoming;
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  
  const newCount = assignments.filter((a) => a.status === 'new').length;

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

  const handleAccept = (id: number) => {
    console.log('Accepting assignment:', id);
    // Mark as viewed and accepted
    setAssignments(prev => 
      prev.map(a => a.id === id ? { ...a, status: 'viewed' } : a)
    );
    // In a real app, this would update the assignment status and navigate to work area
  };

  const handleViewDetails = (id: number) => {
    console.log('Viewing assignment details:', id);
    // Mark as viewed when user clicks View Details
    setAssignments(prev => 
      prev.map(a => a.id === id ? { ...a, status: 'viewed' } : a)
    );
    // In a real app, this would navigate to assignment details
  };

  const handleMarkAllViewed = () => {
    setAssignments(prev => 
      prev.map(a => ({ ...a, status: 'viewed' }))
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl">Incoming Assignments</h1>
            {newCount > 0 && (
              <Badge className="bg-brand-secondary text-white">
                {newCount} New
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {userRole === USER_ROLE.DIVISION_LEADER 
              ? 'New sections assigned to you from the Legal division'
              : 'New clauses assigned to you by your Division Lead'}
          </p>
        </div>
        {newCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllViewed}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mark All as Viewed
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {assignments.map((assignment) => (
          <Card 
            key={assignment.id} 
            className={`hover:shadow-md transition-shadow ${assignment.status === 'new' ? 'border-brand-secondary border-2' : ''}`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {assignment.status === 'new' && (
                      <Bell className="h-4 w-4 text-brand-secondary animate-pulse" />
                    )}
                    <CardTitle className="text-lg">
                      {'clauseName' in assignment ? assignment.clauseName : assignment.sectionName}
                    </CardTitle>
                    <Badge className={getPriorityColor(assignment.priority)}>
                      {assignment.priority}
                    </Badge>
                    {assignment.status === 'new' && (
                      <Badge className="bg-brand-secondary text-white">NEW</Badge>
                    )}
                  </div>
                  <CardDescription>
                    {'clauseName' in assignment 
                      ? `${assignment.sectionName} · ${assignment.contractName}`
                      : assignment.contractName}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Assignment Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <div>
                      <div className="text-xs text-muted-foreground">Assigned by</div>
                      <div className="font-medium text-foreground">{assignment.assignedBy}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <div>
                      <div className="text-xs text-muted-foreground">Due date</div>
                      <div className="font-medium text-foreground">{assignment.dueDate}</div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground border-t pt-2">
                  Assigned: {assignment.assignedDate}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    className="bg-brand-secondary hover:bg-brand-secondary/90"
                    onClick={() => handleAccept(assignment.id)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Accept & Start Work
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleViewDetails(assignment.id)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {assignments.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">All caught up!</h3>
            <p className="text-muted-foreground">
              You don't have any new incoming assignments at the moment.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}