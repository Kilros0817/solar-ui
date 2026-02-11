'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Skeleton } from './ui/skeleton';
import { FileText, Search, Eye } from 'lucide-react';
import { useClientContracts } from '../contexts/ClientContractsContext';
import { CONTRACT_STATUS_LABELS } from '@/utils/constants';
import { formatRelativeDate } from '@/utils/utility';
import type { Contract } from '../data/interfaces';

const CLIENT_STATUS_LABELS: Record<number, string> = {
  0: CONTRACT_STATUS_LABELS[0] ?? 'Pending',
  1: CONTRACT_STATUS_LABELS[1] ?? 'Request',
  2: CONTRACT_STATUS_LABELS[2] ?? 'Approved',
  3: CONTRACT_STATUS_LABELS[3] ?? 'Rejected',
  4: 'ESigned',
};

export function ClientContractsList({
  title,
  statusFilter,
}: {
  title: string;
  statusFilter: number | null;
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const { contracts, loading } = useClientContracts();

  let displayContracts: Contract[] =
    statusFilter !== null ? contracts.filter((c) => c.status === statusFilter) : contracts;

  displayContracts = displayContracts.filter((contract) => {
    const term = searchTerm.toLowerCase();
    return (
      contract.title.toLowerCase().includes(term) ||
      (contract.category && String(contract.category).toLowerCase().includes(term))
    );
  });

  const handleView = (contractId: number) => {
    router.push(`/contract/${contractId}`);
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 1:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 2:
        return 'bg-green-100 text-green-800 border-green-200';
      case 3:
        return 'bg-red-100 text-red-800 border-red-200';
      case 4:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">Contracts where you are the client</p>
      </div>

      <div className="flex items-center gap-2 rounded-md border border-input bg-input-background px-3 h-10 max-w-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 focus-within:ring-offset-2 transition-colors outline-none">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          placeholder="Search by contract or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 p-0 h-auto min-w-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent shadow-none"
        />
      </div>

      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
              </div>
            ))}
          </div>
        ) : displayContracts.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="font-semibold py-4">Contract Name</TableHead>
                <TableHead className="font-semibold py-4">Category</TableHead>
                <TableHead className="font-semibold py-4">Status</TableHead>
                <TableHead className="font-semibold py-4">Created</TableHead>
                <TableHead className="w-[50px] py-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayContracts.map((contract) => (
                <TableRow
                  key={contract.id}
                  className="cursor-pointer group"
                  onClick={() => handleView(contract.id)}
                >
                  <TableCell className="font-medium py-4">{contract.title}</TableCell>
                  <TableCell className="text-muted-foreground py-4">
                    {contract.category || '—'}
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge className={getStatusColor(contract.status)}>
                      {CLIENT_STATUS_LABELS[contract.status] ?? 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground py-4">
                    {contract.createdAt ? formatRelativeDate(contract.createdAt) : '—'}
                  </TableCell>
                  <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-pointer"
                      onClick={() => handleView(contract.id)}
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="rounded-full bg-muted p-4 mb-4 mt-4">
              <FileText className="text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">No contracts found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {searchTerm
                ? 'No contracts match your search.'
                : 'Contracts where you are the client will appear here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
