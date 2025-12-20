'use client'

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Users, 
  UserPlus, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  Search,
  MoreVertical,
  X,
  Eye
} from 'lucide-react';
import { Input } from './ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { DIVISION_CATEGORY, DIVISION_LABELS, USER_ROLE } from '@/utils/constants';

// Mock data for current division leaders (will be replaced with actual data later)
const mockDivisionLeaders: Record<number, { name: string; email: string; address: string } | null> = {
  [DIVISION_CATEGORY.LEGAL]: { name: 'Sarah Chen', email: 'sarah.chen@company.com', address: '0x1234...5678' },
  [DIVISION_CATEGORY.PROJECT_MANAGEMENT]: { name: 'Michael Rodriguez', email: 'michael.r@company.com', address: '0xabcd...efgh' },
  [DIVISION_CATEGORY.PRECONSTRUCTION]: null,
  [DIVISION_CATEGORY.ESTIMATING]: { name: 'Jennifer Taylor', email: 'jennifer.t@company.com', address: '0x9876...4321' },
  [DIVISION_CATEGORY.FINANCE]: null,
  [DIVISION_CATEGORY.ACCOUNTING]: null,
  [DIVISION_CATEGORY.RISK_MANAGEMENT]: null,
  [DIVISION_CATEGORY.INSURANCE]: null,
  [DIVISION_CATEGORY.SAFETY]: null,
};

// Mock data for division members (will be replaced with actual data later)
const mockDivisionMembers: Record<number, { name: string; email: string; address: string }[]> = {
  [DIVISION_CATEGORY.LEGAL]: [
    { name: 'David Kim', email: 'david.kim@company.com', address: '0x1111...2222' },
    { name: 'Emma Wilson', email: 'emma.wilson@company.com', address: '0x3333...4444' },
  ],
  [DIVISION_CATEGORY.PROJECT_MANAGEMENT]: [
    { name: 'James Brown', email: 'james.brown@company.com', address: '0x5555...6666' },
    { name: 'Lisa Anderson', email: 'lisa.anderson@company.com', address: '0x7777...8888' },
    { name: 'Robert Lee', email: 'robert.lee@company.com', address: '0x9999...aaaa' },
  ],
  [DIVISION_CATEGORY.PRECONSTRUCTION]: [],
  [DIVISION_CATEGORY.ESTIMATING]: [
    { name: 'Maria Garcia', email: 'maria.garcia@company.com', address: '0xbbbb...cccc' },
  ],
  [DIVISION_CATEGORY.FINANCE]: [],
  [DIVISION_CATEGORY.ACCOUNTING]: [],
  [DIVISION_CATEGORY.RISK_MANAGEMENT]: [],
  [DIVISION_CATEGORY.INSURANCE]: [],
  [DIVISION_CATEGORY.SAFETY]: [],
};


const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
};

interface TeamManagementProps {
  userRole: number | null;
}

export function TeamManagement({ userRole }: TeamManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<number | null>(null);
  const [viewingMembers, setViewingMembers] = useState<number | null>(null);

  // Leader assignment is disabled for now (will be added later)
  const canAssignLeaders = false;

  // Get all divisions except NO_DIVISION
  const divisions = Object.entries(DIVISION_CATEGORY)
    .filter(([_, value]) => value !== DIVISION_CATEGORY.NO_DIVISION)
    .map(([_, value]) => Number(value))
    .sort((a, b) => a - b);

  // Filter divisions based on search
  const filteredDivisions = divisions.filter((division) => {
    if (!searchQuery) return true;
    const label = DIVISION_LABELS[division];
    const leader = mockDivisionLeaders[division];
    return (
      label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leader?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leader?.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

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
            <Badge variant="outline" className="px-4 py-2">
              {filteredDivisions.length} {filteredDivisions.length === 1 ? 'Division' : 'Divisions'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Divisions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDivisions.map((division) => {
          const leader = mockDivisionLeaders[division];
          const hasLeader = leader !== null;

          return (
            <Card key={division} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-brand-secondary/10 rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-brand-secondary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{DIVISION_LABELS[division]}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Division #{division}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canAssignLeaders && (
                        <DropdownMenuItem onClick={() => setSelectedDivision(division)}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          {hasLeader ? 'Change Leader' : 'Assign Leader'}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => setViewingMembers(division)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Members
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasLeader ? (
                  <>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`/avatars/${leader.name.toLowerCase().replace(' ', '-')}.jpg`} />
                        <AvatarFallback className="bg-brand-secondary/10 text-brand-secondary">
                          {getInitials(leader.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{leader.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{leader.email}</p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">{leader.address}</span>
                    </div>
                    <div className={`flex items-center gap-2 ${canAssignLeaders ? 'flex-col' : ''}`}>
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
                          View Members ({mockDivisionMembers[division]?.length || 0})
                        </Button>
                      </div>
                      {canAssignLeaders && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDivision(division)}
                          className="w-full"
                        >
                          <UserPlus className="mr-2 h-3 w-3" />
                          Change Leader
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-3">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium mb-1">No Leader Assigned</p>
                      <p className="text-xs text-muted-foreground mb-4">
                        {canAssignLeaders 
                          ? 'Assign a division leader to manage this division'
                          : 'Only administrators can assign division leaders'}
                      </p>
                      {canAssignLeaders && (
                        <Button
                          onClick={() => setSelectedDivision(division)}
                          size="sm"
                          className="w-full mb-2"
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Assign Leader
                        </Button>
                      )}
                      {mockDivisionMembers[division] && mockDivisionMembers[division].length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingMembers(division)}
                          className="w-full"
                        >
                          <Eye className="mr-2 h-3 w-3" />
                          View Members ({mockDivisionMembers[division].length})
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Assign Leader Modal/Dialog (placeholder - will be implemented later) */}
      {selectedDivision && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                Assign Division Leader - {DIVISION_LABELS[selectedDivision]}
              </CardTitle>
              <CardDescription>
                Select a user to assign as division leader for this division
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  Leader assignment functionality will be implemented here
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedDivision(null)}
                >
                  Cancel
                </Button>
                <Button className="flex-1" disabled>
                  Assign Leader
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Members Modal */}
      {viewingMembers !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] flex flex-col border-2 border-border shadow-2xl">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {DIVISION_LABELS[viewingMembers]} - Team Members
                  </CardTitle>
                  <CardDescription className="mt-1">
                    View all members in this division (Read-only)
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
              {mockDivisionMembers[viewingMembers] && mockDivisionMembers[viewingMembers].length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="outline" className="px-3 py-1.5">
                      {mockDivisionMembers[viewingMembers].length} {mockDivisionMembers[viewingMembers].length === 1 ? 'Member' : 'Members'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {mockDivisionMembers[viewingMembers].map((member, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border hover:bg-muted/70 transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={`/avatars/${member.name.toLowerCase().replace(' ', '-')}.jpg`} />
                          <AvatarFallback className="bg-brand-secondary/10 text-brand-secondary">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{member.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-mono text-muted-foreground">{member.address}</p>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            Member
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

