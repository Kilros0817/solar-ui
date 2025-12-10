'use client'

import { useState } from 'react';
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
  Settings,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useUser, UserRole } from '../contexts/UserContext';
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
import { 
  allContracts, 
  divisionLeadContracts, 
  divisionMemberContracts,
  ownerContracts,
  getContractCounts 
} from '../data/mockContracts';
import {
  divisionLeadIncoming,
  divisionLeadAssignedWork,
  divisionLeadTeamAssignments,
  divisionMemberIncoming,
  divisionMemberAssignments,
  getNewAssignmentsCount,
  getInProgressCount,
} from '../data/mockAssignments';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ContractSidebar({ activeTab, onTabChange }: SidebarProps) {
  const { userRole, setUserRole } = useUser();

  // Define menu items based on user role
  const getMenuItems = () => {
    // Legal Division - Full access (current UI)
    if (userRole === USER_ROLE.LEGAL_TEAM) {
      const counts = getContractCounts(allContracts);
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, count: null },
        { id: 'my-contracts', label: 'My Contracts', icon: FileText, count: counts.all },
        { id: 'pending', label: 'Pending Review', icon: Clock, count: counts.pending },
        { id: 'approved', label: 'Approved', icon: CheckCircle, count: counts.approved },
        { id: 'templates', label: 'Template Library', icon: FolderOpen, count: null },
        { id: 'team', label: 'Team', icon: Users, count: null },
        { id: 'analytics', label: 'Analytics', icon: BarChart3, count: null },
      ];
    }

    // Division Lead - Assigned sections and team management
    if (userRole === USER_ROLE.DIVISION_LEADER) {
      const counts = getContractCounts(divisionLeadContracts);
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, count: null },
        { id: 'incoming', label: 'Incoming', icon: Bell, count: getNewAssignmentsCount(divisionLeadIncoming) }, // New incoming assignments
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
      const counts = getContractCounts(divisionMemberContracts);
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, count: null },
        { id: 'incoming', label: 'Incoming', icon: Bell, count: getNewAssignmentsCount(divisionMemberIncoming) }, // New incoming assignments
        { id: 'my-contracts', label: 'My Contracts', icon: FileText, count: counts.all },
        { id: 'pending', label: 'Pending Review', icon: Clock, count: counts.pending },
        { id: 'approved', label: 'Approved', icon: CheckCircle, count: counts.approved },
        { id: 'my-assignments', label: 'My Assignments', icon: ClipboardList, count: divisionMemberAssignments.length },
        { id: 'templates', label: 'Division Templates', icon: FolderOpen, count: null },
      ];
    }

    // Owner - High-level overview
    if (userRole === USER_ROLE.PROJECT_OWNER) {
      const counts = getContractCounts(ownerContracts);
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, count: null },
        { id: 'my-contracts', label: 'My Contracts', icon: FileText, count: counts.all },
        { id: 'pending', label: 'Pending Review', icon: Clock, count: counts.pending },
        { id: 'approved', label: 'Approved', icon: CheckCircle, count: counts.approved },
      ];
    }

    // Administrator - System management
    if (userRole === USER_ROLE.ADMIN) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, count: null },
        { id: 'my-contracts', label: 'All Contracts', icon: FileText, count: 42 },
        { id: 'templates', label: 'All Templates', icon: FolderOpen, count: null },
        { id: 'team', label: 'User Management', icon: Users, count: null },
        { id: 'analytics', label: 'System Analytics', icon: BarChart3, count: null },
        { id: 'settings', label: 'Settings', icon: Settings, count: null },
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
      case USER_ROLE.PROJECT_OWNER:
        return 'Owner Portal';
      case USER_ROLE.ADMIN:
        return 'Admin Portal';
      default:
        return 'Platform';
    }
  };

  const roleOptions = [
    { value: USER_ROLE.LEGAL_TEAM as UserRole, label: 'Legal Division' },
    { value: USER_ROLE.DIVISION_LEADER as UserRole, label: 'Division Lead' },
    { value: USER_ROLE.DIVISION_MEMBER as UserRole, label: 'Division Member' },
    { value: USER_ROLE.PROJECT_OWNER as UserRole, label: 'Owner' },
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
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant={activeTab === item.id ? "secondary" : "ghost"}
            className={`w-full justify-start h-10 ${activeTab === item.id ? 'bg-brand-primary/20 border-brand-secondary/60' : 'brand-hover'}`}
            onClick={() => onTabChange(item.id)}
          >
            <item.icon className="h-4 w-4 mr-3" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.count && (
              <Badge variant="secondary" className="ml-auto">
                {item.count}
              </Badge>
            )}
          </Button>
        ))}
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