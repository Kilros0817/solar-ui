'use client';

import { useState, useEffect } from 'react';
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
import { FileText, Search, Eye, Pencil } from 'lucide-react';
import { getAllContracts } from '@/utils/subgraph';
import { getContractsByStatus } from '../data/mockContracts';
import type { Contract } from '../data/mockContracts';
import { CONTRACT_STATUS_LABELS, DIVISION_LABELS } from '@/utils/constants';

interface ContractListProps {
  title: string;
  filterStatus?: string;
  onCreateContract: () => void;
  onViewContract?: (contractId: number) => void;
}

const formatRelativeDate = (dateStr: number) => {
  return (new Date(dateStr * 1000)).toLocaleDateString();
};

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

export function ContractList({ title, filterStatus, onCreateContract, onViewContract }: ContractListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true);
      try {
        const docs = await getAllContracts();
        setContracts(Array.isArray(docs) ? docs.map(mapDocumentToContract) : []);
      } catch (e) {
        console.error('Failed to fetch contracts:', e);
        setContracts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, []);

  let displayContracts = contracts;

  // Apply status filter
  if (filterStatus && filterStatus !== 'all') {
    displayContracts = getContractsByStatus(contracts, filterStatus);
  }

  // Apply search filter
  displayContracts = displayContracts.filter(contract => {
    const matchesSearch = contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.client.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-orange-100 text-orange-800 border-orange-200';
      case 1: return 'bg-blue-100 text-blue-800 border-blue-200';
      case 2: return 'bg-green-100 text-green-800 border-green-200';
      case 3: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track your contracts
          </p>
        </div>
        <Button
          onClick={onCreateContract}
          className="bg-brand-secondary hover:bg-[var(--brand-secondary-hover)] shrink-0"
        >
          <FileText className="h-4 w-4 mr-2" />
          Create New Contract
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-md border border-input bg-input-background px-3 h-10 max-w-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 focus-within:ring-offset-2 transition-colors outline-none">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          placeholder="Search by contract or client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 p-0 h-auto min-w-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent shadow-none"
        />
      </div>

      {/* Table */}
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
                <TableHead className="font-semibold py-4">Client</TableHead>
                <TableHead className="font-semibold py-4">Created</TableHead>
                <TableHead className="w-[50px] py-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayContracts.map((contract) => (
                <TableRow
                  key={contract.id}
                  className="cursor-pointer group"
                  onClick={() => router.push(`/contract/${contract.id}`)}
                >
                  <TableCell className="font-medium py-4">{contract.title}</TableCell>
                  <TableCell className="text-muted-foreground py-4">
                    {contract.category || '—'}
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge className={getStatusColor(contract.status)}>
                      {CONTRACT_STATUS_LABELS[contract.status] ?? 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">{contract.client || '—'}</TableCell>
                  <TableCell className="text-muted-foreground py-4">
                    {contract.createdAt ? formatRelativeDate(contract.createdAt) : '—'}
                  </TableCell>
                  <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 cursor-pointer"
                        onClick={() => router.push(`/contract/${contract.id}`)}
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">No contracts found</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              {searchTerm
                ? 'No contracts match your search. Try a different term.'
                : 'Get started by creating your first contract.'}
            </p>
            {!searchTerm && (
              <Button onClick={onCreateContract}>Create New Contract</Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}