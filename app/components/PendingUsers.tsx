'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Users, 
  CheckCircle2, 
  X,
  XCircle,
  Search,
  Copy,
  Check,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Input } from './ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useConnection, useConfig } from 'wagmi';
import { toast } from 'sonner';
import { acceptRegisterRequest, declineRegisterRequest } from '@/utils/interact';
import { useSubgraphRefresh } from '@/app/contexts/SubgraphRefreshContext';
import { USER_ROLE, DIVISION_CATEGORY, ROLE_LABELS, DIVISION_LABELS } from '@/utils/constants';
import { getPendingUsers } from '@/utils/subgraph';
import { copyAddressToClipboard } from '@/utils/utility';
import type { PendingUser } from '../data/interfaces';

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
};

const formatAddress = (addr: string): string => {
  if (!addr) return '';
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

export function PendingUsers() {
  const { address, isConnected } = useConnection();
  const config = useConfig();
  const { refresh: refreshSubgraph } = useSubgraphRefresh();
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, number>>({});
  const [selectedDivisions, setSelectedDivisions] = useState<Record<string, number>>({});
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch pending users function (silent = true skips loading state for background refetch)
  const fetchPendingUsers = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const requests = await getPendingUsers();
      setPendingUsers(requests);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast.error('Failed to load pending users');
      // For development, use mock data
      setPendingUsers([
        {
          id: '0x1234567890123456789012345678901234567890',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
        },
        {
          id: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
        },
      ]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    if (isConnected && config) {
      fetchPendingUsers();
    }
  }, [isConnected, config]);

  // Handle manual refresh
  const handleRefresh = async () => {
    if (!isConnected || !config) {
      toast.error('Wallet not connected');
      return;
    }
    setRefreshing(true);
    await fetchPendingUsers();
    setRefreshing(false);
    toast.success('Pending registrations refreshed');
  };

  // Filter users based on search
  const filteredUsers = pendingUsers.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.id.toLowerCase().includes(query)
    );
  });

  const handleCopyAddress = async (address: string) => {
    const success = await copyAddressToClipboard(address);
    if (success) {
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    }
  };

  const handleApprove = async (userAddress: string) => {
    if (!config || !address) {
      toast.error('Wallet not connected');
      return;
    }

    const role = selectedRoles[userAddress];
    const division = selectedDivisions[userAddress];

    if (!role || role === USER_ROLE.NO_ROLE) {
      toast.error('Please select a role');
      return;
    }

    // Division is required for division-related roles (not for Client)
    if (
      role !== USER_ROLE.CLIENT &&
      (role === USER_ROLE.DIVISION_MEMBER || role === USER_ROLE.DIVISION_LEADER) &&
      (!division || division === DIVISION_CATEGORY.NO_DIVISION)
    ) {
      toast.error('Please select a division');
      return;
    }

    setProcessingUser(userAddress);
    try {
      const result = await acceptRegisterRequest(
        config,
        address,
        userAddress,
        role,
        role === USER_ROLE.CLIENT ? DIVISION_CATEGORY.NO_DIVISION : (division || DIVISION_CATEGORY.NO_DIVISION)
      );

      if (result) {
        toast.success('User approved successfully');
        setPendingUsers((prev) => prev.filter((u) => u.id !== userAddress));
        setSelectedRoles((prev) => {
          const newRoles = { ...prev };
          delete newRoles[userAddress];
          return newRoles;
        });
        setSelectedDivisions((prev) => {
          const newDivisions = { ...prev };
          delete newDivisions[userAddress];
          return newDivisions;
        });
        setTimeout(async () => {
          refreshSubgraph();
          await fetchPendingUsers(true);
        }, 4000);
      } else {
        toast.error('Failed to approve user');
      }
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Failed to approve user. Please try again.');
    } finally {
      setProcessingUser(null);
    }
  };

  const handleDecline = async (userAddress: string) => {
    if (!config || !address) {
      toast.error('Wallet not connected');
      return;
    }

    setProcessingUser(userAddress);
    try {
      const result = await declineRegisterRequest(
        config,
        address,
        userAddress
      );

      if (result) {
        toast.success('User declined successfully');
        setPendingUsers((prev) => prev.filter((u) => u.id !== userAddress));
        setSelectedRoles((prev) => {
          const newRoles = { ...prev };
          delete newRoles[userAddress];
          return newRoles;
        });
        setSelectedDivisions((prev) => {
          const newDivisions = { ...prev };
          delete newDivisions[userAddress];
          return newDivisions;
        });
        setTimeout(async () => {
          refreshSubgraph();
          await fetchPendingUsers(true);
        }, 4000);
      } else {
        toast.error('Failed to decline user');
      }
    } catch (error) {
      console.error('Error declining user:', error);
      toast.error('Failed to decline user. Please try again.');
    } finally {
      setProcessingUser(null);
    }
  };

  const roleOptions = [
    { value: USER_ROLE.DIVISION_MEMBER, label: ROLE_LABELS[USER_ROLE.DIVISION_MEMBER] },
    { value: USER_ROLE.DIVISION_LEADER, label: ROLE_LABELS[USER_ROLE.DIVISION_LEADER] },
    { value: USER_ROLE.LEGAL_TEAM, label: ROLE_LABELS[USER_ROLE.LEGAL_TEAM] },
    { value: USER_ROLE.CLIENT, label: ROLE_LABELS[USER_ROLE.CLIENT] },
  ];

  const divisionOptions = Object.entries(DIVISION_CATEGORY)
    .filter(([_, value]) => value !== DIVISION_CATEGORY.NO_DIVISION)
    .map(([key, value]) => ({
      value: Number(value),
      label: DIVISION_LABELS[Number(value)] || key,
    }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pending Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage pending user registrations and assign roles
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {pendingUsers.length} Pending
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Registrations</CardTitle>
              <CardDescription>
                Review and approve user registration requests
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No users found matching your search' : 'No pending registrations'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Division</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(user.firstName, user.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {formatAddress(user.id)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyAddress(user.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Copy address"
                        >
                          {copiedAddress === user.id ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={selectedRoles[user.id]?.toString() || ''}
                        onValueChange={(value) =>
                          setSelectedRoles((prev) => ({
                            ...prev,
                            [user.id]: Number(value),
                          }))
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={selectedDivisions[user.id]?.toString() || ''}
                        onValueChange={(value) =>
                          setSelectedDivisions((prev) => ({
                            ...prev,
                            [user.id]: Number(value),
                          }))
                        }
                          disabled={
                            !selectedRoles[user.id] ||
                            selectedRoles[user.id] === USER_ROLE.LEGAL_TEAM ||
                            selectedRoles[user.id] === USER_ROLE.CLIENT
                          }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select division" />
                        </SelectTrigger>
                        <SelectContent>
                          {divisionOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          onClick={() => handleApprove(user.id)}
                          disabled={
                            processingUser === user.id ||
                            !selectedRoles[user.id] ||
                            selectedRoles[user.id] === USER_ROLE.NO_ROLE ||
                            (selectedRoles[user.id] !== USER_ROLE.CLIENT &&
                              (selectedRoles[user.id] === USER_ROLE.DIVISION_MEMBER ||
                                selectedRoles[user.id] === USER_ROLE.DIVISION_LEADER) &&
                              (!selectedDivisions[user.id] ||
                                selectedDivisions[user.id] === DIVISION_CATEGORY.NO_DIVISION))
                          }
                          size="sm"
                          variant="default"
                          className="h-8 w-8 p-0"
                          title="Approve"
                        >
                          {processingUser === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          onClick={() => handleDecline(user.id)}
                          disabled={processingUser === user.id}
                          size="sm"
                          variant="destructive"
                          className="h-8 w-8 p-0"
                          title="Decline"
                        >
                          {processingUser === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

