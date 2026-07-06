'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConnection } from 'wagmi';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { FileText, Loader2, Eye, ClipboardList, AlertCircle } from 'lucide-react';
import { getCurrentUserProfile, getClausesByDivisionMember } from '@/utils/postgres';
import { CONTRACT_STATUS_LABELS, DIVISION_LABELS, USER_ROLE } from '@/utils/constants';
import { formatRelativeDate } from '@/utils/utility';
import { useUser } from '@/app/contexts/UserContext';
import { useAssignment } from '@/app/contexts/AssignmentContext';
import type { ContractAssignment } from '../data/interfaces';

export function MyAssignments() {
  const router = useRouter();
  const { address } = useConnection();
  const { userRole } = useUser();
  const { setSelectedContract } = useAssignment();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [divisionLabel, setDivisionLabel] = useState('');
  const [contracts, setContracts] = useState<ContractAssignment[]>([]);

  useEffect(() => {
    if (userRole !== null && userRole !== USER_ROLE.DIVISION_MEMBER) {
      router.replace('/my-contracts');
      return;
    }
  }, [userRole, router]);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const profile = await getCurrentUserProfile(address);
        if (!profile?.dcategory || Number(profile.dcategory) === 0) {
          setError('You are not assigned to a division.');
          setContracts([]);
          setLoading(false);
          return;
        }
        const memberDcategory = Number(profile.dcategory);
        setDivisionLabel(DIVISION_LABELS[memberDcategory] ?? `Division #${memberDcategory}`);

        const clauses = await getClausesByDivisionMember(address);
        const list = Array.isArray(clauses) ? clauses : [];
        type DocFromClause = { id: string; title?: string; client?: { firstName?: string; lastName?: string }; category?: number; createdAt?: number | string; status?: number };
        const byDocId = new Map<string, { title: string; client: string; category?: string; assignedClauseCount: number; createdAt?: number; status?: number }>();
        list.forEach((c: { section?: { doc?: DocFromClause } }) => {
          const doc = c.section?.doc;
          if (!doc?.id) return;
          const existing = byDocId.get(doc.id);
          const client = doc.client;
          const clientName = client
            ? [client.firstName, client.lastName].filter(Boolean).join(' ').trim() || '—'
            : '—';
          const createdAt = typeof doc.createdAt === 'number' ? doc.createdAt : typeof doc.createdAt === 'string' ? (Number(doc.createdAt) || undefined) : undefined;
          const status = typeof doc.status === 'number' ? doc.status : undefined;
          const category = doc.category != null ? (DIVISION_LABELS[doc.category] ?? String(doc.category)) : undefined;
          if (existing) {
            existing.assignedClauseCount += 1;
          } else {
            byDocId.set(doc.id, {
              title: doc.title || 'Untitled',
              client: clientName,
              category,
              assignedClauseCount: 1,
              createdAt,
              status,
            });
          }
        });
        const withSectionsForDivision: ContractAssignment[] = Array.from(byDocId.entries()).map(([id, v]) => ({
          id,
          title: v.title,
          client: v.client,
          sectionCount: 0,
          assignedClauseCount: v.assignedClauseCount,
          category: v.category,
          createdAt: v.createdAt,
          status: v.status,
        }));
        setContracts(withSectionsForDivision);
      } catch (e) {
        console.error('Failed to load assignments:', e);
        setError('Failed to load assignments.');
        setContracts([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [address]);

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-orange-100 text-orange-800 border-orange-200';
      case 1: return 'bg-blue-100 text-blue-800 border-blue-200';
      case 2: return 'bg-green-100 text-green-800 border-green-200';
      case 3: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (userRole !== null && userRole !== USER_ROLE.DIVISION_MEMBER) {
    return null;
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">My Assignments</h1>
        <p className="text-muted-foreground">Sections and clauses assigned to your division</p>
        <Card>
          <CardContent className="py-12 flex items-center justify-center gap-3 text-muted-foreground">
            <AlertCircle className="h-10 w-10" />
            <span>{error}</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Assignments</h1>
        <p className="text-muted-foreground mt-1">
          Contracts with sections assigned to your division ({divisionLabel})
        </p>
      </div>

      {contracts.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="font-medium">No assignments yet</p>
            <p className="text-sm text-muted-foreground">
              When your division is assigned contract sections, they will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="font-semibold py-4">Contract</TableHead>
                <TableHead className="font-semibold py-4">Client</TableHead>
                <TableHead className="font-semibold py-4">Category</TableHead>
                <TableHead className="font-semibold py-4">Status</TableHead>
                <TableHead className="font-semibold py-4">Assigned clauses</TableHead>
                <TableHead className="font-semibold py-4">Created</TableHead>
                <TableHead className="w-[50px] py-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium py-4">{c.title}</TableCell>
                  <TableCell className="text-muted-foreground py-4">{c.client || '—'}</TableCell>
                  <TableCell className="text-muted-foreground py-4">{c.category || '—'}</TableCell>
                  <TableCell className="py-4">
                    {c.status != null ? (
                      <Badge className={getStatusColor(c.status)}>
                        {CONTRACT_STATUS_LABELS[c.status] ?? 'Unknown'}
                      </Badge>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="py-4">{c.assignedClauseCount ?? 0}</TableCell>
                  <TableCell className="text-muted-foreground py-4">
                    {c.createdAt != null ? formatRelativeDate(c.createdAt) : '—'}
                  </TableCell>
                  <TableCell className="py-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => {
                        setSelectedContract(String(c.id));
                        router.push('/clause-assignments/clauses');
                      }}
                      title="View assignments"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
