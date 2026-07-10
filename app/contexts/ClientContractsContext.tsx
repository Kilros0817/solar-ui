'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useConnection } from 'wagmi';
import { getContractsByClient } from '@/utils/postgres';
import { useUser } from './UserContext';
import { usePostgresRefresh } from './PostgresRefreshContext';
import { USER_ROLE } from '@/utils/constants';
import type { Contract } from '../data/interfaces';

function mapDocToContract(doc: Record<string, unknown>, index: number): Contract {
  const id = /^\d+$/.test(String(doc.id)) ? parseInt(String(doc.id), 10) : index + 1;
  const status = typeof doc.status === 'number' ? doc.status : 0;
  const cat = doc.category;
  const category = typeof cat === 'string' ? cat : typeof cat === 'number' ? String(cat) : '';
  const rawCreated = doc.created_at;
  const created_at =
    typeof rawCreated === 'number'
      ? rawCreated
      : typeof rawCreated === 'string'
        ? /^\d+$/.test(rawCreated)
          ? parseInt(rawCreated, 10)
          : Date.parse(rawCreated) || 0
        : 0;
  return {
    id,
    title: (doc.title as string) || 'Untitled',
    client: '',
    category,
    status,
    created_at,
    cid: typeof doc.cid === 'string' ? doc.cid : undefined,
  };
}

export function getClientContractCounts(contracts: Contract[]) {
  return {
    all: contracts.length,
    pending: contracts.filter((c) => c.status === 0).length,
    review: contracts.filter((c) => c.status === 1).length,
    approved: contracts.filter((c) => c.status === 2).length,
    rejected: contracts.filter((c) => c.status === 3).length,
    esigned: contracts.filter((c) => c.status === 4).length,
  };
}

interface ClientContractsContextType {
  contracts: Contract[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const ClientContractsContext = createContext<ClientContractsContextType | undefined>(undefined);

export function ClientContractsProvider({ children }: { children: React.ReactNode }) {
  const { userRole } = useUser();
  const { address } = useConnection();
  const { refreshCounter } = usePostgresRefresh();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = useCallback(async () => {
    if (userRole !== USER_ROLE.CLIENT || !address) {
      setContracts([]);
      return;
    }
    setLoading(true);
    setError(null);
    setContracts([]);
    try {
      const docs = await getContractsByClient(address.toLowerCase());
      const list = Array.isArray(docs) ? docs : [];
      setContracts(list.map((d: Record<string, unknown>, i: number) => mapDocToContract(d, i)));
    } catch (e) {
      console.error('Failed to load client contracts', e);
      setError(e instanceof Error ? e.message : 'Failed to load contracts');
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, [userRole, address]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts, refreshCounter]);

  const value: ClientContractsContextType = {
    contracts,
    loading,
    error,
    refetch: fetchContracts,
  };

  return (
    <ClientContractsContext.Provider value={value}>
      {children}
    </ClientContractsContext.Provider>
  );
}

export function useClientContracts() {
  const context = useContext(ClientContractsContext);
  if (context === undefined) {
    throw new Error('useClientContracts must be used within a ClientContractsProvider');
  }
  return context;
}
