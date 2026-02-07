'use client'

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useConnection } from 'wagmi';
import {
  LayoutDashboard,
  FileText,
  Clock,
  CheckCircle,
  Archive,
  FolderOpen,
  Users,
  Search,
  ClipboardList,
  FileEdit,
  BarChart3,
  RefreshCw,
  FileSearch,
  PenLine,
  UserPlus,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useUser, UserRole } from '../contexts/UserContext';
import { useContracts } from '../contexts/ContractsContext';
import { USER_ROLE } from '@/utils/constants';
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
import { getContractCounts } from '../data/interfaces';
import type { SidebarProps } from '../data/interfaces';
import { getContractsByDivisionMember } from '@/utils/subgraph';

export function ContractSidebar({ activeTab, onTabChange }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { address } = useConnection();
  const { userRole, setUserRole } = useUser();
  const { contracts } = useContracts();
  const [divisionMemberCounts, setDivisionMemberCounts] = useState<{
    all: number;
    pending: number;
    review: number;
    approved: number;
    rejected: number;
  } | null>(null);

  useEffect(() => {
    if (userRole !== USER_ROLE.DIVISION_MEMBER || !address) {
      setDivisionMemberCounts(null);
      return;
    }
    let cancelled = false;
    getContractsByDivisionMember(address)
      .then((clauses) => {
        if (cancelled) return;
        const list = Array.isArray(clauses) ? clauses : [];
        const counts = {
          all: list.length,
          pending: list.filter((c: { status?: number }) => c.status === 0).length,
          review: list.filter((c: { status?: number }) => c.status === 1).length,
          approved: list.filter((c: { status?: number }) => c.status === 2).length,
          rejected: list.filter((c: { status?: number }) => c.status === 3).length,
        };
        setDivisionMemberCounts(counts);
      })
      .catch(() => {
        if (!cancelled) {
          setDivisionMemberCounts({
            all: 0,
            pending: 0,
            review: 0,
            approved: 0,
            rejected: 0,
          });
        }
      });
    return () => { cancelled = true; };
  }, [userRole, address]);

  // Map routes to tab IDs (for active state)
  const routeToTabMap: Record<string, string> = {
    '/dashboard': 'dashboard',
    '/my-contracts': 'my-contracts',
    '/pending': 'pending',
    '/clause-assignments/pending': 'pending',
    '/section-assignments/unallocated': 'internal-unallocated',
    '/section-assignments/pending': 'internal-pending',
    '/section-assignments/review': 'internal-review',
    '/section-assignments/approved': 'internal-approved',
    '/section-assignments/rejected': 'internal-rejected',
    '/review': 'review',
    '/approved': 'approved',
    '/esigned': 'esigned',
    '/templates': 'templates',
    '/clause-assignments': 'clause-assignments',
    '/clause-assignments/review': 'review',
    '/clause-assignments/clauses': 'clause-assignments',
    '/clause-assignments/clause': 'review',
    '/clause-assignments/approved': 'approved',
    '/clause-assignments/rejected': 'rejected-tasks',
    '/section-assignments': 'internal-all',
    '/section-assignments/section': 'internal-all',
    '/section-assignments/clause': 'internal-all',
    '/legal-review': 'legal-all',
    '/legal-review/pending': 'legal-pending',
    '/legal-review/review': 'legal-review-tab',
    '/legal-review/approved': 'legal-approved',
    '/legal-review/rejected': 'legal-rejected',
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
        { id: 'my-contracts', label: 'All Contracts', icon: FileText, count: counts.all },
        { id: 'pending', label: 'Pending', icon: Clock, count: counts.pending },
        { id: 'review', label: 'Review', icon: FileSearch, count: counts.divisionRequest },
        { id: 'approved', label: 'Approved', icon: CheckCircle, count: counts.approved },
        { id: 'esigned', label: 'Esigned', icon: PenLine, count: counts.completed },
        { id: 'templates', label: 'Template Library', icon: FolderOpen, count: null },
        { id: 'team', label: 'Team', icon: Users, count: null },
      ];
    }

    // Division Lead - Internal Review + Legal Review with submenus
    if (userRole === USER_ROLE.DIVISION_LEADER) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, count: null },
        { type: 'header', label: 'Internal Review' },
        { type: 'item', id: 'internal-all', label: 'All', route: '/section-assignments', icon: ClipboardList, count: counts.all },
        { type: 'item', id: 'internal-unallocated', label: 'Unallocated', route: '/section-assignments/unallocated', icon: UserPlus, count: null },
        { type: 'item', id: 'internal-pending', label: 'Pending', route: '/section-assignments/pending', icon: Clock, count: counts.pending },
        { type: 'item', id: 'internal-review', label: 'Review', route: '/section-assignments/review', icon: FileSearch, count: counts.divisionRequest },
        { type: 'item', id: 'internal-approved', label: 'Approved', route: '/section-assignments/approved', icon: CheckCircle, count: counts.approved },
        { type: 'item', id: 'internal-rejected', label: 'Rejected', route: '/section-assignments/rejected', icon: Archive, count: null },
        { type: 'header', label: 'Legal Review' },
        { type: 'item', id: 'legal-all', label: 'All sections', route: '/legal-review', icon: FileText, count: null },
        { type: 'item', id: 'legal-pending', label: 'Pending', route: '/legal-review/pending', icon: Clock, count: counts.pending },
        { type: 'item', id: 'legal-review-tab', label: 'Review', route: '/legal-review/review', icon: FileSearch, count: counts.divisionRequest },
        { type: 'item', id: 'legal-approved', label: 'Approved', route: '/legal-review/approved', icon: CheckCircle, count: counts.approved },
        { type: 'item', id: 'legal-rejected', label: 'Rejected', route: '/legal-review/rejected', icon: Archive, count: null },
        { id: 'templates', label: 'Division Templates', icon: FolderOpen, count: null },
        { id: 'team', label: 'My Team', icon: Users, count: null },
      ];
    }

    // Division Member - Clause assignments from getContractsByDivisionMember
    // Clause Assignments = all; Pending = status 0; Review = status 1; Approved = status 2; Rejected = status 3
    if (userRole === USER_ROLE.DIVISION_MEMBER) {
      const dm = divisionMemberCounts;
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, count: null },
        { id: 'clause-assignments', label: 'Clause Assignments', icon: ClipboardList, count: dm?.all ?? null },
        { id: 'pending', label: 'Pending', icon: Clock, count: dm?.pending ?? null },
        { id: 'review', label: 'Review', icon: FileSearch, count: dm?.review ?? null },
        { id: 'approved', label: 'Approved', icon: CheckCircle, count: dm?.approved ?? null },
        { id: 'rejected-tasks', label: 'Rejected', icon: Archive, count: dm?.rejected ?? null },
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
    <aside className="w-64 border-r bg-card h-full min-h-0 flex flex-col shrink-0">
      <div className="p-6 border-b shrink-0">
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
      
      <nav className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1">
        {menuItems.map((item, index) => {
          // Division Leader: grouped menu (header or submenu item)
          if ('type' in item && item.type === 'header') {
            return (
              <div
                key={`header-${index}-${item.label}`}
                className="pt-3 pb-1.5 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider first:pt-0"
              >
                {item.label}
              </div>
            );
          }
          if ('type' in item && item.type === 'item') {
            const sub = item as { id: string; route: string; label: string; icon: typeof ClipboardList; count: number | null };
            const isActive = currentTab === sub.id;
            const Icon = sub.icon;
            return (
              <Button
                key={sub.id}
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start h-10 ml-4 pl-3 ${isActive ? 'bg-brand-primary/20 border-brand-secondary/60' : 'brand-hover'}`}
                onClick={() => router.push(sub.route)}
              >
                <Icon className="h-4 w-4 mr-3 shrink-0" />
                <span className="flex-1 text-left">{sub.label}</span>
                {sub.count != null && sub.count > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {sub.count}
                  </Badge>
                )}
              </Button>
            );
          }

          // Flat menu (other roles or DL dashboard/templates/team)
          const flatItem = item as { id: string; label: string; icon: typeof LayoutDashboard; count: number | null };
          const isActive = currentTab === flatItem.id;
          const handleClick = () => {
            const pendingRoute =
              userRole === USER_ROLE.DIVISION_MEMBER
                ? '/clause-assignments/pending'
                : '/pending';
            const reviewRoute =
              userRole === USER_ROLE.DIVISION_MEMBER
                ? '/clause-assignments/review'
                : '/review';
            const approvedRoute =
              userRole === USER_ROLE.DIVISION_MEMBER
                ? '/clause-assignments/approved'
                : '/approved';
            const routeMap: Record<string, string> = {
              'dashboard': '/dashboard',
              'my-contracts': '/my-contracts',
              'pending': pendingRoute,
              'review': reviewRoute,
              'approved': approvedRoute,
              'esigned': '/esigned',
              'templates': '/templates',
              'clause-assignments': '/clause-assignments',
              'rejected-tasks': '/clause-assignments/rejected',
              'pending-users': '/pending-users',
              'team': '/divisions',
            };
            const route = routeMap[flatItem.id];
            if (route) {
              router.push(route);
            } else {
              onTabChange(flatItem.id);
            }
          };

          const FlatIcon = flatItem.icon;
          return (
            <Button
              key={flatItem.id}
              variant={isActive ? "secondary" : "ghost"}
              className={`w-full justify-start h-10 ${isActive ? 'bg-brand-primary/20 border-brand-secondary/60' : 'brand-hover'}`}
              onClick={handleClick}
            >
              <FlatIcon className="h-4 w-4 mr-3" />
              <span className="flex-1 text-left">{flatItem.label}</span>
              {flatItem.count != null && flatItem.count > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {flatItem.count}
                </Badge>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Role Switcher for Testing */}
      <div className="p-4 border-t shrink-0 mt-auto">
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