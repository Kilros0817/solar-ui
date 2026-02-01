'use client'

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Clock, 
  CheckCircle, 
  Archive,
  FolderOpen,
  Users,
  Search,
  Bell,
  ClipboardList,
  UserCheck,
  FileEdit,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useUser, UserRole } from '../contexts/UserContext';
import { USER_ROLE, DIVISION_LABELS } from '@/utils/constants';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { getContractCounts } from '../data/mockContracts';
import type { Contract } from '../data/mockContracts';
import { getAllContracts } from '@/utils/subgraph';
import {
  divisionLeadIncoming,
  divisionLeadAssignedWork,
  divisionLeadTeamAssignments,
  divisionMemberIncoming,
  divisionMemberAssignments,
  getNewAssignmentsCount,
} from '../data/mockAssignments';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
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
  };
};

export function ContractSidebar({ activeTab, onTabChange }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { userRole, setUserRole } = useUser();
  const [contracts, setContracts] = useState<Contract[]>([]);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const docs = await getAllContracts();
        setContracts(Array.isArray(docs) ? docs.map(mapDocumentToContract) : []);
      } catch (e) {
        console.error('Failed to fetch contracts for sidebar:', e);
        setContracts([]);
      }
    };
    fetchContracts();
  }, []);

  // Map routes to tab IDs
  const routeToTabMap: Record<string, string> = {
    '/dashboard': 'dashboard',
    '/my-contracts': 'my-contracts',
    '/pending': 'pending',
    '/approved': 'approved',
    '/templates': 'templates',
    '/incoming': 'incoming',
    '/assigned-work': 'assigned-work',
    '/team-assignments': 'team-assignments',
    '/my-assignments': 'my-assignments',
    '/divisions': 'team',
    '/pending-users': 'pending-users',
  };

  // Get current tab from pathname
  const currentTab = routeToTabMap[pathname] || activeTab;

  // Define menu items based on user role (contract counts from subgraph)
  const counts = getContractCounts(contracts);
  const getMenuItems = () => {
    // Legal Division - Full access (current UI)
    if (userRole === USER_ROLE.LEGAL_TEAM) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, count: null },
        { id: 'my-contracts', label: 'My Contracts', icon: FileText, count: counts.all },
        { id: 'pending', label: 'Pending Review', icon: Clock, count: counts.pending },
        { id: 'approved', label: 'Approved', icon: CheckCircle, count: counts.approved },
        { id: 'templates', label: 'Template Library', icon: FolderOpen, count: null },
        { id: 'team', label: 'Team', icon: Users, count: null },
      ];
    }

    // Division Lead - Assigned sections and team management
    if (userRole === USER_ROLE.DIVISION_LEADER) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, count: null },
        { id: 'incoming', label: 'Incoming', icon: Bell, count: getNewAssignmentsCount(divisionLeadIncoming) },
        { id: 'my-contracts', label: 'My Contracts', icon: FileText, count: counts.all },
        { id: 'pending', label: 'Pending Review', icon: Clock, count: counts.pending },
        { id: 'approved', label: 'Approved', icon: CheckCircle, count: counts.approved },
        { id: 'assigned-work', label: 'Assigned Work', icon: ClipboardList, count: divisionLeadAssignedWork.length },
        { id: 'team-assignments', label: 'Team Assignments', icon: UserCheck, count: divisionLeadTeamAssignments.length },
        { id: 'templates', label: 'Division Templates', icon: FolderOpen, count: null },
        { id: 'team', label: 'My Team', icon: Users, count: null },
      ];
    }

    // Division Member - Only assigned work
    if (userRole === USER_ROLE.DIVISION_MEMBER) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, count: null },
        { id: 'incoming', label: 'Incoming', icon: Bell, count: getNewAssignmentsCount(divisionMemberIncoming) },
        { id: 'my-contracts', label: 'My Contracts', icon: FileText, count: counts.all },
        { id: 'pending', label: 'Pending Review', icon: Clock, count: counts.pending },
        { id: 'approved', label: 'Approved', icon: CheckCircle, count: counts.approved },
        { id: 'my-assignments', label: 'My Assignments', icon: ClipboardList, count: divisionMemberAssignments.length },
        { id: 'templates', label: 'Division Templates', icon: FolderOpen, count: null },
      ];
    }

    // Administrator - System management
    if (userRole === USER_ROLE.ADMIN) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, count: null },
        { id: 'my-contracts', label: 'All Contracts', icon: FileText, count: counts.all },
        { id: 'templates', label: 'All Templates', icon: FolderOpen, count: null },
        { id: 'pending-users', label: 'Pending Users', icon: Users, count: null },
        { id: 'team', label: 'Team', icon: Users, count: null },
      ];
    }

    // Default fallback
    return [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, count: null },
    ];
  };

  const menuItems = getMenuItems();

  const getRoleLabel = () => {
    switch (userRole) {
      case USER_ROLE.LEGAL_TEAM:
        return 'Legal Platform';
      case USER_ROLE.DIVISION_LEADER:
        return 'Division Lead';
      case USER_ROLE.DIVISION_MEMBER:
        return 'Division Member';
      case USER_ROLE.ADMIN:
        return 'Admin Portal';
      case USER_ROLE.CLIENT:
        return 'Client Portal';
      default:
        return 'Platform';
    }
  };

  const roleOptions = [
    { value: USER_ROLE.LEGAL_TEAM as UserRole, label: 'Legal Division' },
    { value: USER_ROLE.DIVISION_LEADER as UserRole, label: 'Division Lead' },
    { value: USER_ROLE.DIVISION_MEMBER as UserRole, label: 'Division Member' },
    { value: USER_ROLE.ADMIN as UserRole, label: 'Administrator' },
  ];

  return (
    <aside className="w-64 border-r bg-card h-full flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <FileText className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold">ContractFlow</h2>
            <p className="text-xs text-muted-foreground">{getRoleLabel()}</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = currentTab === item.id;
          const handleClick = () => {
            // Navigate to routes for tabs
            const routeMap: Record<string, string> = {
              'dashboard': '/dashboard',
              'my-contracts': '/my-contracts',
              'pending': '/pending',
              'approved': '/approved',
              'templates': '/templates',
              'incoming': '/incoming',
              'assigned-work': '/assigned-work',
              'team-assignments': '/team-assignments',
              'my-assignments': '/my-assignments',
              'pending-users': '/pending-users',
              'team': '/divisions',
            };
            const route = routeMap[item.id];
            if (route) {
              router.push(route);
            } else {
              // Fallback to onTabChange for backward compatibility
              onTabChange(item.id);
            }
          };

          return (
            <Button
              key={item.id}
              variant={isActive ? "secondary" : "ghost"}
              className={`w-full justify-start h-10 ${isActive ? 'bg-brand-primary/20 border-brand-secondary/60' : 'brand-hover'}`}
              onClick={handleClick}
            >
              <item.icon className="h-4 w-4 mr-3" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.count && (
                <Badge variant="secondary" className="ml-auto">
                  {item.count}
                </Badge>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Role Switcher for Testing */}
      <div className="p-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <RefreshCw className="h-3 w-3 mr-2" />
              Switch Role
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Demo - Switch Role</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {roleOptions.map((role) => (
              <DropdownMenuItem
                key={role.value}
                onClick={() => {
                  setUserRole(role.value);
                  onTabChange('dashboard'); // Reset to dashboard when switching roles
                }}
                className="cursor-pointer"
              >
                {role.label}
                {userRole === role.value && (
                  <CheckCircle className="ml-auto h-4 w-4 text-brand-secondary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}