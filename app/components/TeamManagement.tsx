'use client'

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  Users,
  Building2,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Search,
  MoreVertical,
  X,
  Eye,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Input } from './ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { DIVISION_CATEGORY, DIVISION_LABELS, USER_ROLE } from '@/utils/constants';
import { getAllDivisionLeadersAndMembers, getAllMemebers } from '@/utils/subgraph';
import { copyAddressToClipboard } from '@/utils/utility';
import type { DivisionUser, DivisionGroup, TeamManagementProps } from '../data/interfaces';

const getDisplayName = (u: DivisionUser) => `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();

const getInitials = (u: DivisionUser) => {
  const first = (u.firstName || '').trim();
  const last = (u.lastName || '').trim();
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase() || '?';
};

const formatAddress = (addr?: string) => {
  if (!addr) return '';
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const getDivisionLabel = (division: number) => {
  // In this project, legal division users can have dcategory = 0.
  if (division === 0) return 'Legal Team';
  return DIVISION_LABELS[division] ?? `Division #${division}`;
};

export function TeamManagement({ userRole }: TeamManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingMembers, setViewingMembers] = useState<number | null>(null);
  const [divisionGroups, setDivisionGroups] = useState<Record<number, DivisionGroup>>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Leader assignment is disabled for now (will be added later)
  const canAssignLeaders = false;

  const fetchDivisions = async () => {
    if (userRole !== USER_ROLE.ADMIN && userRole !== USER_ROLE.LEGAL_TEAM) return;
    setLoading(true);
    try {
      const grouped =
        userRole === USER_ROLE.ADMIN
          ? await getAllMemebers()
          : await getAllDivisionLeadersAndMembers();
      setDivisionGroups(grouped || {});
    } catch (e) {
      console.error('Failed to load divisions:', e);
      setDivisionGroups({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDivisions();
  }, [userRole]);

  const handleRefresh = async () => {
    if (userRole !== USER_ROLE.ADMIN && userRole !== USER_ROLE.LEGAL_TEAM) return;
    setRefreshing(true);
    await fetchDivisions();
    setRefreshing(false);
  };

  const divisions = useMemo(() => {
    const keys = Object.keys(divisionGroups).map((k) => Number(k));
    // fallback: show fixed divisions if subgraph returns empty, to keep UI predictable
    if (keys.length === 0) {
      return Object.entries(DIVISION_CATEGORY)
        .filter(([_, value]) => value !== DIVISION_CATEGORY.NO_DIVISION)
        .map(([_, value]) => Number(value))
        .sort((a, b) => a - b);
    }
    return keys.sort((a, b) => a - b);
  }, [divisionGroups]);

  // Filter divisions based on search
  const filteredDivisions = divisions.filter((division) => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    const label = getDivisionLabel(division).toLowerCase();
    const group = divisionGroups[division];
    const leader = group?.leader ?? null;
    const members = group?.members ?? [];
    const leaderMatch =
      leader &&
      (getDisplayName(leader).toLowerCase().includes(term) || (leader.email ?? '').toLowerCase().includes(term));
    const memberMatch = members.some(
      (m) =>
        getDisplayName(m).toLowerCase().includes(term) || (m.email ?? '').toLowerCase().includes(term)
    );
    return label.includes(term) || !!leaderMatch || memberMatch;
  });

  const handleCopyAddress = async (address: string) => {
    const ok = await copyAddressToClipboard(address);
    if (ok) {
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage division leaders and team assignments
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search divisions or leaders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Badge variant="outline" className="px-4 py-2">
              {filteredDivisions.length} {filteredDivisions.length === 1 ? 'Division' : 'Divisions'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Divisions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <Card className="lg:col-span-3">
            <CardContent className="py-12 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : (
          filteredDivisions.map((division) => {
            const group = divisionGroups[division] ?? { leader: null, members: [] };
            const leader = group.leader;
            const hasLeader = !!leader;
            const memberCount = group.members?.length ?? 0;
            const isLegalTeam = division === 0;

            return (
              <Card key={division} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-brand-secondary/10 rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-brand-secondary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{getDivisionLabel(division)}</CardTitle>
                        {division > 0 && (
                          <CardDescription className="text-xs mt-1">
                            Division #{division}
                          </CardDescription>
                        )}
                        {isLegalTeam && memberCount > 0 && (
                          <CardDescription className="text-xs mt-1">
                            {memberCount} {memberCount === 1 ? 'leader' : 'leaders'}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    {division > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canAssignLeaders && (
                            <DropdownMenuItem disabled>
                              Leader assignment (coming soon)
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setViewingMembers(division)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Members
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    {isLegalTeam && memberCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingMembers(division)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View all
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLegalTeam ? (
                    memberCount > 0 ? (
                      <div className="space-y-2 overflow-y-auto overflow-x-hidden pr-1" style={{ maxHeight: '9rem' }}>
                        {group.members.map((member, idx) => (
                          <div key={member.id ?? idx} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg shrink-0">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-brand-secondary/10 text-brand-secondary">
                                {getInitials(member)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{getDisplayName(member)}</p>
                              <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                              <span className="font-mono">{formatAddress(member.id)}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyAddress(member.id)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                title="Copy address"
                                aria-label="Copy address"
                              >
                                {copiedAddress === member.id ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <div className="bg-muted rounded-full flex items-center justify-center mb-3">
                          <AlertCircle className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium mb-1">No legal team members</p>
                        <p className="text-xs text-muted-foreground">
                          No users with Legal Team role assigned yet.
                        </p>
                      </div>
                    )
                  ) : hasLeader ? (
                    <>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-brand-secondary/10 text-brand-secondary">
                            {getInitials(leader)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{getDisplayName(leader)}</p>
                          <p className="text-xs text-muted-foreground truncate">{leader.email}</p>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">{formatAddress(leader.id)}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyAddress(leader.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Copy address"
                          aria-label="Copy address"
                        >
                          {copiedAddress === leader.id ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 w-full">
                        <Badge variant="outline" className="flex-1 justify-center py-1.5">
                          <Users className="mr-2 h-3 w-3" />
                          Leader Assigned
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingMembers(division)}
                          className="flex-1"
                        >
                          <Eye className="mr-2 h-3 w-3" />
                          View Members ({memberCount})
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <div className="bg-muted rounded-full flex items-center justify-center mb-3">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium mb-1">No Leader Assigned</p>
                      <p className="text-xs text-muted-foreground mb-4">
                        Leader assignment is disabled for now.
                      </p>
                      {memberCount > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingMembers(division)}
                          className="w-full"
                        >
                          <Eye className="mr-2 h-3 w-3" />
                          View Members ({memberCount})
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* View Members Modal */}
      {viewingMembers !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] flex flex-col border-2 border-border shadow-2xl">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {getDivisionLabel(viewingMembers)} - {viewingMembers === 0 ? 'Leaders' : 'Team Members'}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {viewingMembers === 0
                      ? 'Legal team leaders (read-only)'
                      : 'View all members in this division (Read-only)'}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewingMembers(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4">
              {(divisionGroups[viewingMembers]?.members?.length ?? 0) > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="outline" className="px-3 py-1.5">
                      {divisionGroups[viewingMembers].members.length}{' '}
                      {viewingMembers === 0
                        ? (divisionGroups[viewingMembers].members.length === 1 ? 'Leader' : 'Leaders')
                        : (divisionGroups[viewingMembers].members.length === 1 ? 'Member' : 'Members')}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {divisionGroups[viewingMembers].members.map((member, index) => (
                      <div
                        key={member.id ?? index}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border hover:bg-muted/70 transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-brand-secondary/10 text-brand-secondary">
                            {getInitials(member)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{getDisplayName(member)}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <p className="text-xs font-mono text-muted-foreground">{formatAddress(member.id)}</p>
                            <button
                              type="button"
                              onClick={() => handleCopyAddress(member.id)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              title="Copy address"
                              aria-label="Copy address"
                            >
                              {copiedAddress === member.id ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {viewingMembers === 0 ? 'Legal team leader' : 'Member'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-3">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium mb-1">No Members Yet</p>
                  <p className="text-xs text-muted-foreground">
                    This division has no members. Division leader can add members.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

