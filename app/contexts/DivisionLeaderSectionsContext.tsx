'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useConnection } from 'wagmi';
import { getSectionsByDivisionLeader } from '@/utils/postgres';
import { useUser } from './UserContext';
import { usePostgresRefresh } from './PostgresRefreshContext';
import { USER_ROLE } from '@/utils/constants';

export type SectionFromLeader = Awaited<ReturnType<typeof getSectionsByDivisionLeader>>[number];

type DocLike = {
  id: string;
  title?: string;
  category?: string;
  status?: number;
  client?: { id?: string; firstName?: string; lastName?: string; email?: string };
  createdAt?: number;
  sections: SectionFromLeader[];
};

interface DivisionLeaderSectionsContextType {
  sections: SectionFromLeader[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** Build a doc-like object from sections for the given contract (for use with ContractDocContext). */
  getDocFromSections: (contractId: string) => DocLike | null;
  /** Get section index for a contract's section (stable order by section id). */
  getSectionIndex: (contractId: string, sectionId: string) => number;
}

const DivisionLeaderSectionsContext = createContext<DivisionLeaderSectionsContextType | undefined>(undefined);

export function DivisionLeaderSectionsProvider({ children }: { children: React.ReactNode }) {
  const { userRole } = useUser();
  const { address } = useConnection();
  const { refreshCounter } = usePostgresRefresh();
  const [sections, setSections] = useState<SectionFromLeader[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSections = useCallback(async () => {
    if (!address || userRole !== USER_ROLE.DIVISION_LEADER) return;
    setLoading(true);
    setError(null);
    try {
      const list = await getSectionsByDivisionLeader(address.toLowerCase());
      setSections(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Failed to load sections:', e);
      setError(e instanceof Error ? e.message : 'Failed to load sections');
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, [address, userRole]);

  useEffect(() => {
    if (userRole !== USER_ROLE.DIVISION_LEADER || !address) {
      setSections([]);
      setError(null);
      return;
    }
    fetchSections();
  }, [userRole, address, refreshCounter, fetchSections]);

  const getDocFromSections = useCallback(
    (contractId: string): DocLike | null => {
      const forContract = sections.filter((s) => String(s.doc?.id) === String(contractId));
      if (forContract.length === 0) return null;
      const sorted = [...forContract].sort((a, b) => String(a.id).localeCompare(String(b.id)));
      const doc = sorted[0].doc;
      if (!doc) return null;
      return { ...doc, sections: sorted };
    },
    [sections]
  );

  const getSectionIndex = useCallback(
    (contractId: string, sectionId: string): number => {
      const forContract = sections.filter((s) => String(s.doc?.id) === String(contractId));
      const sorted = [...forContract].sort((a, b) => String(a.id).localeCompare(String(b.id)));
      const idx = sorted.findIndex((s) => String(s.id) === String(sectionId));
      return idx >= 0 ? idx : -1;
    },
    [sections]
  );

  const value: DivisionLeaderSectionsContextType = {
    sections,
    loading,
    error,
    refetch: fetchSections,
    getDocFromSections,
    getSectionIndex,
  };

  return (
    <DivisionLeaderSectionsContext.Provider value={value}>
      {children}
    </DivisionLeaderSectionsContext.Provider>
  );
}

export function useDivisionLeaderSections() {
  const context = useContext(DivisionLeaderSectionsContext);
  if (context === undefined) {
    throw new Error('useDivisionLeaderSections must be used within a DivisionLeaderSectionsProvider');
  }
  return context;
}
