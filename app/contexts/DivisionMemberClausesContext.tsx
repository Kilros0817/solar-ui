'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useConnection } from 'wagmi';
import { getContractsByDivisionMember } from '@/utils/subgraph';
import { useUser } from './UserContext';
import { useSubgraphRefresh } from './SubgraphRefreshContext';
import { USER_ROLE } from '@/utils/constants';

export type ClauseFromMember = Awaited<ReturnType<typeof getContractsByDivisionMember>>[number];

type SectionLike = ClauseFromMember['section'] & { clauses: ClauseFromMember[] };
type DocLike = NonNullable<ClauseFromMember['section']>['doc'] & { sections: SectionLike[] };

interface DivisionMemberClausesContextType {
  clauses: ClauseFromMember[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** Build a doc-like object from clauses for the given contract. */
  getDocFromClauses: (contractId: string) => DocLike | null;
  /** Get section index and clause index for a clause id within a contract. */
  getIndicesForClause: (contractId: string, clauseId: string) => { sectionIndex: number; clauseIndex: number } | null;
}

const DivisionMemberClausesContext = createContext<DivisionMemberClausesContextType | undefined>(undefined);

export function DivisionMemberClausesProvider({ children }: { children: React.ReactNode }) {
  const { userRole } = useUser();
  const { address } = useConnection();
  const { refreshCounter } = useSubgraphRefresh();
  const [clauses, setClauses] = useState<ClauseFromMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClauses = useCallback(async () => {
    if (!address || userRole !== USER_ROLE.DIVISION_MEMBER) return;
    setLoading(true);
    setError(null);
    try {
      const list = await getContractsByDivisionMember(address);
      setClauses(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Failed to load clauses:', e);
      setError(e instanceof Error ? e.message : 'Failed to load clauses');
      setClauses([]);
    } finally {
      setLoading(false);
    }
  }, [address, userRole]);

  useEffect(() => {
    if (userRole !== USER_ROLE.DIVISION_MEMBER || !address) {
      setClauses([]);
      setError(null);
      return;
    }
    fetchClauses();
  }, [userRole, address, refreshCounter, fetchClauses]);

  const getDocFromClauses = useCallback(
    (contractId: string): DocLike | null => {
      const forContract = clauses.filter((c) => String(c.section?.doc?.id) === String(contractId));
      if (forContract.length === 0) return null;
      const bySection = new Map<string, ClauseFromMember[]>();
      forContract.forEach((c) => {
        const sid = String(c.section?.id ?? '');
        if (!bySection.has(sid)) bySection.set(sid, []);
        bySection.get(sid)!.push(c);
      });
      const sectionIds = Array.from(bySection.keys()).sort();
      const sections: SectionLike[] = sectionIds.map((sid) => {
        const sectionClauses = bySection.get(sid)!;
        const first = sectionClauses[0];
        const section = first?.section;
        return { ...section, clauses: sectionClauses } as SectionLike;
      });
      const doc = forContract[0]?.section?.doc;
      if (!doc) return null;
      return { ...doc, sections };
    },
    [clauses]
  );

  const getIndicesForClause = useCallback(
    (contractId: string, clauseId: string): { sectionIndex: number; clauseIndex: number } | null => {
      const doc = getDocFromClauses(contractId);
      if (!doc) return null;
      for (let sectionIndex = 0; sectionIndex < doc.sections.length; sectionIndex++) {
        const sec = doc.sections[sectionIndex];
        const clauseIndex = (sec.clauses ?? []).findIndex((c) => String((c as { id?: string }).id) === String(clauseId));
        if (clauseIndex >= 0) return { sectionIndex, clauseIndex };
      }
      return null;
    },
    [getDocFromClauses]
  );

  const value: DivisionMemberClausesContextType = {
    clauses,
    loading,
    error,
    refetch: fetchClauses,
    getDocFromClauses,
    getIndicesForClause,
  };

  return (
    <DivisionMemberClausesContext.Provider value={value}>
      {children}
    </DivisionMemberClausesContext.Provider>
  );
}

export function useDivisionMemberClauses() {
  const context = useContext(DivisionMemberClausesContext);
  if (context === undefined) {
    throw new Error('useDivisionMemberClauses must be used within a DivisionMemberClausesProvider');
  }
  return context;
}
