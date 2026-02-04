'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useConnection } from 'wagmi';
import { getAllContracts, getContractsByDivisionLeader } from '@/utils/subgraph';
import { useUser } from './UserContext';
import { USER_ROLE } from '@/utils/constants';
import { DIVISION_LABELS } from '@/utils/constants';
import type { ContractWithSections } from '../data/interfaces';

function mapDocToContract(doc: Record<string, unknown>, index: number, sectionCount?: number): ContractWithSections {
  const client = doc.client as { firstName?: string; lastName?: string; email?: string } | undefined;
  const clientName = client
    ? [client.firstName, client.lastName].filter(Boolean).join(' ') || client.email || ''
    : '';
  const id = /^\d+$/.test(String(doc.id)) ? parseInt(String(doc.id), 10) : index + 1;
  const status = typeof doc.status === 'number' ? doc.status : 0;
  const cat = doc.category;
  const category =
    typeof cat === 'number' ? (DIVISION_LABELS[cat] ?? String(cat)) : (cat ?? '');
  const rawCreated = doc.createdAt;
  const createdAt =
    typeof rawCreated === 'number'
      ? rawCreated
      : typeof rawCreated === 'string'
        ? /^\d+$/.test(rawCreated)
          ? parseInt(rawCreated, 10)
          : Date.parse(rawCreated) || 0
        : 0;

  const c: ContractWithSections = {
    id,
    title: (doc.title as string) || 'Untitled',
    client: clientName,
    category: typeof category === 'string' ? category : String(category),
    status,
    createdAt,
  };
  if (sectionCount != null) c.sectionCount = sectionCount;
  return c;
}

interface ContractsContextType {
  contracts: ContractWithSections[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const ContractsContext = createContext<ContractsContextType | undefined>(undefined);

export function ContractsProvider({ children }: { children: React.ReactNode }) {
  const { userRole } = useUser();
  const { address } = useConnection();
  const [contracts, setContracts] = useState<ContractWithSections[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = useCallback(async () => {
    const isDivisionLeader = userRole === USER_ROLE.DIVISION_LEADER;
    const hasAddress = !!address;
    if (userRole == null) return;
    if (isDivisionLeader && !hasAddress) return;

    setLoading(true);
    setError(null);
    try {
      if (isDivisionLeader && address) {
        const sections = await getContractsByDivisionLeader(address.toLowerCase());
        const seen = new Set<string>();
        const docs: Record<string, unknown>[] = [];
        (sections || []).forEach((s: { doc?: { id: string; sections?: unknown[] } }) => {
          if (s?.doc?.id && !seen.has(s.doc.id)) {
            seen.add(s.doc.id);
            docs.push(s.doc as Record<string, unknown>);
          }
        });
        setContracts(
          docs.map((d, i) =>
            mapDocToContract(d, i, (d.sections as unknown[])?.length)
          )
        );
      } else {
        const docs = await getAllContracts();
        const list = Array.isArray(docs) ? docs : [];
        setContracts(
          list.map((d: Record<string, unknown>, i: number) =>
            mapDocToContract(d, i, (d.sections as unknown[])?.length)
          )
        );
      }
    } catch (e) {
      console.error('Failed to fetch contracts:', e);
      setError(e instanceof Error ? e.message : 'Failed to load contracts');
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, [userRole, address]);

  useEffect(() => {
    if (userRole == null) return;
    if (userRole === USER_ROLE.DIVISION_LEADER && !address) return;
    fetchContracts();
  }, [userRole, address, fetchContracts]);

  const value: ContractsContextType = {
    contracts,
    loading,
    error,
    refetch: fetchContracts,
  };

  return (
    <ContractsContext.Provider value={value}>
      {children}
    </ContractsContext.Provider>
  );
}

export function useContracts() {
  const context = useContext(ContractsContext);
  if (context === undefined) {
    throw new Error('useContracts must be used within a ContractsProvider');
  }
  return context;
}
