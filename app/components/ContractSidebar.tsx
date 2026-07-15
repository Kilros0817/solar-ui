'use client'

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Clock,
  CheckCircle,
  Archive,
  FolderOpen,
  Users,
  ClipboardList,
  RefreshCw,
  FileSearch,
  PenLine,
  UserPlus,
  LogOut,
  BarChart2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useUser } from '../contexts/UserContext';
import { useContracts } from '../contexts/ContractsContext';
import { USER_ROLE } from '@/utils/constants';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { getContractCounts } from '../data/interfaces';
import { useDivisionLeaderSections } from '@/app/contexts/DivisionLeaderSectionsContext';
import { useDivisionMemberClauses } from '@/app/contexts/DivisionMemberClausesContext';
import { useClientContracts, getClientContractCounts } from '@/app/contexts/ClientContractsContext';
import { useSectionContent } from '@/app/contexts/SectionContentContext';
import { useAssignment } from '@/app/contexts/AssignmentContext';
import { usePostgresRefresh } from '@/app/contexts/PostgresRefreshContext';

export function ContractSidebar({ activeTab }: { activeTab: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { userRole, logout } = useUser();
  const { selectedFromRoute } = useAssignment();
  const { contracts, refetch: refetchContracts } = useContracts();
  const leaderSections = useDivisionLeaderSections();
  const memberClauses = useDivisionMemberClauses();
  const clientContracts = useClientContracts();
  const { loadSectionContent, getTotalClauses } = useSectionContent();
  const { refresh: refreshpostgres } = usePostgresRefresh();
  const [refreshing, setRefreshing] = useState(false);

  const divisionMemberCounts =
    userRole === USER_ROLE.DIVISION_MEMBER && memberClauses.clauses.length >= 0
      ? (() => {
          const list = memberClauses.clauses;
          return {
            all: list.length,
            pending: list.filter((c) => (c as { status?: number }).status === 0).length,
            review: list.filter((c) => (c as { status?: number }).status === 1).length,
            approved: list.filter((c) => (c as { status?: number }).status === 2).length,
            rejected: list.filter((c) => (c as { status?: number }).status === 3).length,
          };
        })()
      : null;

  const divisionLeaderClauseCounts =
    userRole === USER_ROLE.DIVISION_LEADER && leaderSections.sections.length >= 0
      ? (() => {
          let pending = 0,
            review = 0,
            approved = 0,
            rejected = 0;
          leaderSections.sections.forEach((sec) => {
            (sec.clauses ?? []).forEach((c: { status?: number }) => {
              const s = typeof c.status === 'number' ? c.status : 0;
              if (s === 0) pending++;
              else if (s === 1) review++;
              else if (s === 2) approved++;
              else if (s === 3) rejected++;
            });
          });
          return { pending, review, approved, rejected };
        })()
      : null;

  const divisionLeaderSections = leaderSections.sections;

  const clientCounts =
    userRole === USER_ROLE.CLIENT && clientContracts.contracts.length >= 0
      ? getClientContractCounts(clientContracts.contracts)
      : null;

  // For division leaders, compute section-level status counts for Legal Review menu.
  // "Ready to Submit" = status 0 and all clauses approved (total === approved).
  const divisionLeaderSectionStatusCounts =
    userRole === USER_ROLE.DIVISION_LEADER && divisionLeaderSections.length >= 0
      ? (() => {
          let ready = 0;
          let review = 0;
          let approved = 0;
          divisionLeaderSections.forEach((sec) => {
            const s = typeof (sec as { status?: number }).status === 'number'
              ? (sec as { status: number }).status
              : 0;
            if (s === 1) review++;
            else if (s === 2) approved++;
            else {
              const clauses = sec.clauses ?? [];
              let approvedCount = 0;
              clauses.forEach((c: { status?: number }) => {
                const cs = typeof c.status === 'number' ? c.status : 0;
                if (cs === 2) approvedCount++;
              });
              const total = getTotalClauses(sec.id) ?? clauses.length;
              if (total > 0 && approvedCount === total) ready++;
            }
          });
          return { ready, review, approved };
        })()
      : null;

  // Load section content (IPFS) so we can compute unallocated = totalFromContent - postgres count
  useEffect(() => {
    if (userRole !== USER_ROLE.DIVISION_LEADER || !divisionLeaderSections.length) return;
    divisionLeaderSections.forEach((sec) => {
      const docId = (sec as { doc?: { id: string } }).doc?.id;
      if (docId) loadSectionContent(sec.id, docId);
    });
  }, [userRole, divisionLeaderSections, loadSectionContent]);

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
    '/clause-assignments/approved': 'approved',
    '/clause-assignments/rejected': 'rejected-tasks',
    '/section-assignments': 'internal-all',
    '/section-assignments/section': 'internal-all',
    '/section-assignments/clause': 'internal-all',
    '/legal-review': 'legal-pending',
    '/legal-review/pending': 'legal-pending',
    '/legal-review/review': 'legal-review-tab',
    '/legal-review/approved': 'legal-approved',
    '/rejected': 'legal-rejected',
    '/divisions': 'team',
    '/clients': 'clients',
    '/pending-users': 'pending-users',
    '/analytics': 'analytics',
    '/client-contracts': 'client-my-contracts',
    '/client-contracts/pending': 'client-pending',
    '/client-contracts/review': 'client-review',
    '/client-contracts/approved': 'client-approved',
    '/client-contracts/rejected': 'client-rejected',
    '/client-contracts/esigned': 'client-esigned',
  };

  // Get current tab from pathname; when on clause view, use the menu they came from
  const fromRouteToTabMember: Record<string, string> = {
    clauses: 'clause-assignments',
    pending: 'pending',
    review: 'review',
    approved: 'approved',
    rejected: 'rejected-tasks',
  };
  const fromRouteToTabLeader: Record<string, string> = {
    unallocated: 'internal-unallocated',
    pending: 'internal-pending',
    review: 'internal-review',
    approved: 'internal-approved',
    rejected: 'internal-rejected',
    'legal-pending': 'legal-pending',
    'legal-review-tab': 'legal-review-tab',
    'legal-approved': 'legal-approved',
    'legal-rejected': 'legal-rejected',
  };
  const fromRouteToTabLegal: Record<string, string> = {
    pending: 'pending',
    review: 'review',
    approved: 'approved',
    'legal-rejected': 'legal-rejected',
  };
  const fromRouteToTabClient: Record<string, string> = {
    'client-my-contracts': 'client-my-contracts',
    'client-pending': 'client-pending',
    'client-review': 'client-review',
    'client-approved': 'client-approved',
    'client-rejected': 'client-rejected',
    'client-esigned': 'client-esigned',
  };
  const isContractViewPath = pathname.startsWith('/contract/');
  const currentTab =
    pathname === '/clause-assignments/clause' &&
    userRole === USER_ROLE.DIVISION_MEMBER &&
    selectedFromRoute &&
    fromRouteToTabMember[selectedFromRoute]
      ? fromRouteToTabMember[selectedFromRoute]
      : (pathname === '/section-assignments/clause' || pathname === '/section-assignments/section') &&
          userRole === USER_ROLE.DIVISION_LEADER &&
          selectedFromRoute &&
          fromRouteToTabLeader[selectedFromRoute]
        ? fromRouteToTabLeader[selectedFromRoute]
        : isContractViewPath &&
          userRole === USER_ROLE.LEGAL_TEAM &&
          selectedFromRoute &&
          fromRouteToTabLegal[selectedFromRoute]
        ? fromRouteToTabLegal[selectedFromRoute]
        : isContractViewPath &&
          userRole === USER_ROLE.CLIENT &&
          selectedFromRoute &&
          fromRouteToTabClient[selectedFromRoute]
        ? fromRouteToTabClient[selectedFromRoute]
        : routeToTabMap[pathname] || activeTab;

  // Define menu items based on user role (contract counts from postgres)
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
        { id: 'legal-rejected', label: 'Rejected', icon: Archive, count: counts.rejected },
        { id: 'esigned', label: 'Esigned', icon: PenLine, count: counts.esigned },
        { id: 'templates', label: 'Template Library', icon: FolderOpen, count: null },
        { id: 'clients', label: 'Clients', icon: Users, count: null },
        { id: 'team', label: 'Team', icon: Users, count: null },
      ];
    }

    // Division Lead - Internal Review + Legal Review with submenus (clause counts for Internal Review)
    if (userRole === USER_ROLE.DIVISION_LEADER) {
      const dlCounts = divisionLeaderClauseCounts;
      const dlSectionStatus = divisionLeaderSectionStatusCounts;
      const unallocatedCount =
        divisionLeaderSections.length > 0 &&
        divisionLeaderSections.some((sec) => getTotalClauses(sec.id) !== undefined)
          ? divisionLeaderSections.reduce<number>((sum, sec) => {
              const totalFromContent = getTotalClauses(sec.id);
              if (totalFromContent === undefined) return sum;
              const fromPostgres = (sec.clauses ?? []).length;
              return sum + Math.max(0, totalFromContent - fromPostgres);
            }, 0)
          : null;
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, count: null },
        { type: 'header', label: 'Internal Review' },
        { type: 'item', id: 'internal-all', label: 'All Sections', route: '/section-assignments', icon: ClipboardList, count: divisionLeaderSections.length },
        { type: 'item', id: 'internal-unallocated', label: 'Unallocated', route: '/section-assignments/unallocated', icon: UserPlus, count: unallocatedCount },
        { type: 'item', id: 'internal-pending', label: 'Pending', route: '/section-assignments/pending', icon: Clock, count: dlCounts?.pending ?? null },
        { type: 'item', id: 'internal-review', label: 'Review', route: '/section-assignments/review', icon: FileSearch, count: dlCounts?.review ?? null },
        { type: 'item', id: 'internal-approved', label: 'Approved', route: '/section-assignments/approved', icon: CheckCircle, count: dlCounts?.approved ?? null },
        { type: 'item', id: 'internal-rejected', label: 'Rejected', route: '/section-assignments/rejected', icon: Archive, count: dlCounts?.rejected ?? null },
        { type: 'header', label: 'Legal Review' },
        {
          type: 'item',
          id: 'legal-pending',
          label: 'Ready to Submit',
          route: '/legal-review/pending',
          icon: Clock,
          count: dlSectionStatus?.ready ?? null,
        },
        {
          type: 'item',
          id: 'legal-review-tab',
          label: 'Review',
          route: '/legal-review/review',
          icon: FileSearch,
          count: dlSectionStatus?.review ?? null,
        },
        {
          type: 'item',
          id: 'legal-approved',
          label: 'Approved',
          route: '/legal-review/approved',
          icon: CheckCircle,
          count: dlSectionStatus?.approved ?? null,
        },
        { id: 'templates', label: 'Division Templates', icon: FolderOpen, count: null },
        { id: 'team', label: 'My Team', icon: Users, count: null },
      ];
    }

    // Division Member - Clause assignments from getClausesByDivisionMember
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
        { id: 'clients', label: 'Clients', icon: Users, count: null },
        { id: 'team', label: 'Team', icon: Users, count: null },
        { id: 'analytics', label: 'Analytics', icon: BarChart2, count: null },
      ];
    }

    // Client - contracts where I am the client (getContractsByClient)
    if (userRole === USER_ROLE.CLIENT) {
      const cc = clientCounts;
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, count: null },
        { id: 'client-my-contracts', label: 'My Contracts', icon: FileText, count: cc?.all ?? null },
        { id: 'client-pending', label: 'Pending', icon: Clock, count: cc?.pending ?? null },
        { id: 'client-review', label: 'Review', icon: FileSearch, count: cc?.review ?? null },
        { id: 'client-approved', label: 'Approved', icon: CheckCircle, count: cc?.approved ?? null },
        { id: 'client-rejected', label: 'Rejected', icon: Archive, count: cc?.rejected ?? null },
        { id: 'client-esigned', label: 'ESigned', icon: PenLine, count: cc?.esigned ?? null },
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

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      refreshpostgres();
      await Promise.all([
        refetchContracts(),
        (userRole === USER_ROLE.DIVISION_LEADER || userRole === USER_ROLE.LEGAL_TEAM)
          ? leaderSections.refetch()
          : Promise.resolve(),
        userRole === USER_ROLE.DIVISION_MEMBER ? memberClauses.refetch() : Promise.resolve(),
        userRole === USER_ROLE.CLIENT ? clientContracts.refetch() : Promise.resolve(),
      ]);
    } catch (e) {
      console.error('Refresh failed:', e);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <aside className="w-64 border-r bg-card h-full min-h-0 flex flex-col shrink-0">
      <div className="p-6 border-b shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">ContractFlow</h2>
            <p className="text-xs text-muted-foreground">{getRoleLabel()}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh data"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </Button>
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
              'legal-rejected': '/rejected',
              'esigned': '/esigned',
              'templates': '/templates',
              'clause-assignments': '/clause-assignments',
              'rejected-tasks': '/clause-assignments/rejected',
              'clients': '/clients',
              'pending-users': '/pending-users',
              'analytics': '/analytics',
              'team': '/divisions',
              'client-my-contracts': '/client-contracts',
              'client-pending': '/client-contracts/pending',
              'client-review': '/client-contracts/review',
              'client-approved': '/client-contracts/approved',
              'client-rejected': '/client-contracts/rejected',
              'client-esigned': '/client-contracts/esigned',
            };
            const route = routeMap[flatItem.id];
            if (route) {
              router.push(route);
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

      {/* Log out */}
      <div className="p-4 border-t shrink-0 mt-auto">
        <Button variant="outline" size="sm" className="w-full cursor-pointer" onClick={logout}>
          <LogOut className="h-3 w-3 mr-2" />
          Log out
        </Button>
      </div>
    </aside>
  );
}
