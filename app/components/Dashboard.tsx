import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Users,
  Calendar,
  Eye,
  DollarSign
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useContracts } from '../contexts/ContractsContext';
import type { DashboardProps } from '../data/interfaces';
import { USER_ROLE } from '@/utils/constants';

export function Dashboard({ onCreateContract }: DashboardProps) {
  const { userRole, userName } = useUser();
  const { contracts } = useContracts();

  // Division-specific stats (from postgres data)
  const pendingCount = contracts.filter(c => c.status === 0).length;
  const approvedCount = contracts.filter(c => c.status === 2).length;
  const divisionRequestCount = contracts.filter(c => c.status === 1).length;

  const getDivisionStats = () => {
    if (userRole === USER_ROLE.DIVISION_LEADER) {
      return [
        { title: 'Total Contracts', value: contracts.length.toString(), change: '—', icon: FileText, color: 'text-blue-600' },
        { title: 'Pending Review', value: pendingCount.toString(), change: '—', icon: Clock, color: 'text-orange-600' },
        { title: 'Approved This Month', value: approvedCount.toString(), change: '—', icon: CheckCircle, color: 'text-green-600' },
        { title: 'Division Request', value: divisionRequestCount.toString(), change: '—', icon: AlertTriangle, color: 'text-red-600' }
      ];
    }

    if (userRole === USER_ROLE.DIVISION_MEMBER) {
      return [
        { title: 'Total Contracts', value: contracts.length.toString(), change: '—', icon: FileText, color: 'text-blue-600' },
        { title: 'Pending Review', value: pendingCount.toString(), change: '—', icon: Clock, color: 'text-orange-600' },
        { title: 'Approved This Month', value: approvedCount.toString(), change: '—', icon: CheckCircle, color: 'text-green-600' },
        { title: 'Division Request', value: divisionRequestCount.toString(), change: '—', icon: AlertTriangle, color: 'text-red-600' }
      ];
    }

    // Legal and other roles
    return [
      { title: 'Total Contracts', value: contracts.length.toString(), change: '—', icon: FileText, color: 'text-blue-600' },
      { title: 'Pending Review', value: pendingCount.toString(), change: '—', icon: Clock, color: 'text-orange-600' },
      { title: 'Approved This Month', value: approvedCount.toString(), change: '—', icon: CheckCircle, color: 'text-green-600' },
      { title: 'Division Request', value: divisionRequestCount.toString(), change: '—', icon: AlertTriangle, color: 'text-red-600' }
    ];
  };

  const stats = getDivisionStats();

  // Division-specific recent activity
  const getDivisionActivity = () => {
    if (userRole === USER_ROLE.DIVISION_LEADER) {
      return [
        {
          id: 1,
          action: 'Section assigned to David Kim',
          contract: 'Enterprise Software License - Payment Terms',
          user: 'You',
          time: '1 hour ago',
          status: 'review'
        },
        {
          id: 2,
          action: 'Section completed by Emily Martinez',
          contract: 'Vendor Agreement - Compliance Requirements',
          user: 'Emily Martinez',
          time: '3 hours ago',
          status: 'approved'
        },
        {
          id: 3,
          action: 'New section assigned from Legal',
          contract: 'Partnership Agreement - Revenue Sharing',
          user: 'Sarah Chen (Legal)',
          time: '5 hours ago',
          status: 'comment'
        },
        {
          id: 4,
          action: 'Section revision requested',
          contract: 'Service Agreement - SLA Terms',
          user: 'James Wilson',
          time: '1 day ago',
          status: 'revision'
        }
      ];
    }

    if (userRole === USER_ROLE.DIVISION_MEMBER) {
      return [
        {
          id: 1,
          action: 'Clause completed',
          contract: 'Enterprise Software License - Payment Schedule',
          user: 'You',
          time: '2 hours ago',
          status: 'approved'
        },
        {
          id: 2,
          action: 'New clause assigned',
          contract: 'Vendor Agreement - Uptime Guarantees',
          user: 'Jennifer Taylor (Division Lead)',
          time: '4 hours ago',
          status: 'comment'
        },
        {
          id: 3,
          action: 'Revision requested',
          contract: 'Partnership Agreement - Quarterly Distribution',
          user: 'Jennifer Taylor (Division Lead)',
          time: '6 hours ago',
          status: 'revision'
        },
        {
          id: 4,
          action: 'Clause approved',
          contract: 'Client Service Agreement - Notice Period',
          user: 'Jennifer Taylor (Division Lead)',
          time: '1 day ago',
          status: 'approved'
        }
      ];
    }

    // Legal and other roles - original activity
    return [
      {
        id: 1,
        action: 'Contract approved',
        contract: 'Software License Agreement - TechCorp',
        user: 'Sarah Johnson',
        time: '2 hours ago',
        status: 'approved'
      },
      {
        id: 2,
        action: 'New comment added',
        contract: 'Service Agreement - InnovateLabs',
        user: 'Mike Chen',
        time: '4 hours ago',
        status: 'comment'
      },
      {
        id: 3,
        action: 'Contract submitted for review',
        contract: 'Partnership Agreement - GlobalTech',
        user: 'Emma Davis',
        time: '6 hours ago',
        status: 'review'
      },
      {
        id: 4,
        action: 'Contract revision requested',
        contract: 'Consulting Agreement - StartupXYZ',
        user: 'Alex Rodriguez',
        time: '1 day ago',
        status: 'revision'
      }
    ];
  };

  const recentActivity = getDivisionActivity();

  // Division-specific deadlines
  const getDivisionDeadlines = () => {
    if (userRole === USER_ROLE.DIVISION_LEADER) {
      return [
        {
          id: 1,
          contract: 'Enterprise License - Payment Terms Section',
          deadline: 'Dec 10, 2025',
          daysLeft: 6,
          priority: 'high'
        },
        {
          id: 2,
          contract: 'Vendor Agreement - Compliance Section',
          deadline: 'Dec 15, 2025',
          daysLeft: 11,
          priority: 'medium'
        },
        {
          id: 3,
          contract: 'Partnership Agreement - Revenue Sharing',
          deadline: 'Dec 20, 2025',
          daysLeft: 16,
          priority: 'low'
        }
      ];
    }

    if (userRole === USER_ROLE.DIVISION_MEMBER) {
      return [
        {
          id: 1,
          contract: 'Enterprise License - Payment Schedule Clause',
          deadline: 'Dec 10, 2025',
          daysLeft: 6,
          priority: 'high'
        },
        {
          id: 2,
          contract: 'Vendor Agreement - Uptime Guarantees Clause',
          deadline: 'Dec 8, 2025',
          daysLeft: 4,
          priority: 'high'
        },
        {
          id: 3,
          contract: 'Partnership Agreement - Distribution Clause',
          deadline: 'Dec 15, 2025',
          daysLeft: 11,
          priority: 'medium'
        }
      ];
    }

    // Legal and other roles - original deadlines
    return [
      {
        id: 1,
        contract: 'Enterprise License - MegaCorp',
        deadline: 'Dec 15, 2024',
        daysLeft: 7,
        priority: 'high'
      },
      {
        id: 2,
        contract: 'Vendor Agreement - SupplyChain Inc',
        deadline: 'Dec 22, 2024',
        daysLeft: 14,
        priority: 'medium'
      },
      {
        id: 3,
        contract: 'Marketing Partnership - BrandCo',
        deadline: 'Jan 5, 2025',
        daysLeft: 28,
        priority: 'low'
      }
    ];
  };

  const upcomingDeadlines = getDivisionDeadlines();

  const getWelcomeMessage = () => {
    const firstName = userName.split(' ')[0];
    if (userRole === USER_ROLE.DIVISION_LEADER) {
      return `Welcome back, ${firstName}. Here's your team's workload overview.`;
    }
    if (userRole === USER_ROLE.DIVISION_MEMBER) {
      return `Welcome back, ${firstName}. Here's your assignment overview.`;
    }
    return `Welcome back, ${firstName}. Here's your contract overview.`;
  };

  const showCreateButton = userRole === USER_ROLE.LEGAL_TEAM;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted-foreground">{getWelcomeMessage()}</p>
        </div>
        {showCreateButton && (
          <Button onClick={onCreateContract} className="bg-brand-secondary hover:bg-[var(--brand-secondary-hover)] text-white border-brand-secondary">
            <FileText className="h-4 w-4 mr-2" />
            New Contract
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-semibold mt-1">{stat.value}</p>
                  <div className="flex items-center mt-2 text-sm">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                    <span className="text-green-600">{stat.change}</span>
                    {stat.change !== '—' && stat.change !== 'N/A' && (
                      <span className="text-muted-foreground ml-1">vs last month</span>
                    )}
                  </div>
                </div>
                <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg brand-hover transition-colors">
                <div className="flex-shrink-0 mt-1">
                  {activity.status === 'approved' && <CheckCircle className="h-4 w-4 text-green-600" />}
                  {activity.status === 'comment' && <Users className="h-4 w-4 text-blue-600" />}
                  {activity.status === 'review' && <Eye className="h-4 w-4 text-orange-600" />}
                  {activity.status === 'revision' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground truncate">{activity.contract}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.user} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-4">
              View All Activity
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingDeadlines.map((deadline) => (
              <div key={deadline.id} className="p-3 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">{deadline.contract}</p>
                  <Badge 
                    variant={deadline.priority === 'high' ? 'destructive' : 
                            deadline.priority === 'medium' ? 'default' : 'secondary'}
                  >
                    {deadline.priority}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Due: {deadline.deadline}</span>
                  <span className="font-medium">{deadline.daysLeft} days left</span>
                </div>
                <Progress 
                  value={Math.max(0, 100 - (deadline.daysLeft * 2))} 
                  className="mt-2"
                />
              </div>
            ))}
            <Button variant="outline" className="w-full mt-4">
              View All Deadlines
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
