'use client'

import { useEffect, useState } from 'react';
import { useConnection } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Users, Building2, Loader2, RefreshCw, Copy, Check, AlertCircle } from 'lucide-react';
import { DIVISION_LABELS } from '@/utils/constants';
import { getCurrentUserProfile, getDivisionMembersByDivisionId } from '@/utils/subgraph';
import { copyAddressToClipboard } from '@/utils/utility';

type Member = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

const getDisplayName = (m: Member) => `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim();
const getInitials = (m: Member) => {
  const first = (m.firstName || '').trim();
  const last = (m.lastName || '').trim();
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase() || '?';
};
const formatAddress = (addr?: string) => {
  if (!addr) return '';
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

export function MyTeam() {
  const { address } = useConnection();
  const [members, setMembers] = useState<Member[]>([]);
  const [divisionLabel, setDivisionLabel] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTeam = async () => {
    if (!address) {
      setLoading(false);
      setError('Not connected');
      return;
    }
    setError(null);
    try {
      const profile = await getCurrentUserProfile(address);
      if (!profile) {
        setError('Could not load your profile.');
        setMembers([]);
        setDivisionLabel('');
        return;
      }
      const dcategory = profile.dcategory != null ? Number(profile.dcategory) : 0;
      if (!dcategory || dcategory === 0) {
        setError('You are not assigned to a division.');
        setMembers([]);
        setDivisionLabel('');
        return;
      }
      setDivisionLabel(DIVISION_LABELS[dcategory] ?? `Division #${dcategory}`);
      const list = await getDivisionMembersByDivisionId(dcategory);
      setMembers(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Failed to load team:', e);
      setError('Failed to load team members.');
      setMembers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [address]);

  const handleRefresh = () => {
    setRefreshing(true);
    setLoading(true);
    fetchTeam();
  };

  const handleCopyAddress = async (addr: string) => {
    const ok = await copyAddressToClipboard(addr);
    if (ok) {
      setCopiedAddress(addr);
      setTimeout(() => setCopiedAddress(null), 2000);
    }
  };

  if (loading && !refreshing) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Team</h1>
            <p className="text-muted-foreground mt-1">Division members in your division</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Team</h1>
          <p className="text-muted-foreground mt-1">
            Division members in {divisionLabel}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-secondary/10 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-brand-secondary" />
            </div>
            <div>
              <CardTitle className="text-lg">{divisionLabel}</CardTitle>
              <CardDescription>
                {members.length} {members.length === 1 ? 'member' : 'members'} in your division
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">No members yet</p>
              <p className="text-xs text-muted-foreground">
                There are no division members in your division.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
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
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
