'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AssignmentContextType {
  selectedContractId: string | null;
  selectedSectionIndex: number | null;
  selectedClauseIndex: number | null;
  selectedClauseCid: string | null;
  selectedFromRoute: 'clauses' | 'review' | 'approved' | null;
  setSelectedContract: (contractId: string | null) => void;
  setSelectedSection: (sectionIndex: number | null) => void;
  setSelectedClause: (clauseIndex: number | null) => void;
  setSelection: (contractId: string | null, sectionIndex: number | null, clauseIndex?: number | null, clauseCid?: string | null, fromRoute?: 'clauses' | 'review' | 'approved' | null) => void;
}

const AssignmentContext = createContext<AssignmentContextType | undefined>(undefined);

export function AssignmentProvider({ children }: { children: ReactNode }) {
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number | null>(null);
  const [selectedClauseIndex, setSelectedClauseIndex] = useState<number | null>(null);
  const [selectedClauseCid, setSelectedClauseCid] = useState<string | null>(null);
  const [selectedFromRoute, setSelectedFromRoute] = useState<'clauses' | 'review' | 'approved' | null>(null);

  const setSelectedContract = useCallback((contractId: string | null) => {
    setSelectedContractId(contractId);
    setSelectedSectionIndex(null);
    setSelectedClauseIndex(null);
    setSelectedClauseCid(null);
    setSelectedFromRoute(null);
  }, []);

  const setSelectedSection = useCallback((sectionIndex: number | null) => {
    setSelectedSectionIndex(sectionIndex);
    setSelectedClauseIndex(null);
    setSelectedClauseCid(null);
  }, []);

  const setSelectedClause = useCallback((clauseIndex: number | null) => {
    setSelectedClauseIndex(clauseIndex);
    setSelectedClauseCid(null);
  }, []);

  const setSelection = useCallback((contractId: string | null, sectionIndex: number | null, clauseIndex?: number | null, clauseCid?: string | null, fromRoute?: 'clauses' | 'review' | 'approved' | null) => {
    setSelectedContractId(contractId);
    setSelectedSectionIndex(sectionIndex);
    setSelectedClauseIndex(clauseIndex ?? null);
    setSelectedClauseCid(clauseCid ?? null);
    setSelectedFromRoute(fromRoute ?? null);
  }, []);

  const value: AssignmentContextType = {
    selectedContractId,
    selectedSectionIndex,
    selectedClauseIndex,
    selectedClauseCid,
    selectedFromRoute,
    setSelectedContract,
    setSelectedSection,
    setSelectedClause,
    setSelection,
  };

  return (
    <AssignmentContext.Provider value={value}>
      {children}
    </AssignmentContext.Provider>
  );
}

export function useAssignment() {
  const context = useContext(AssignmentContext);
  if (context === undefined) {
    throw new Error('useAssignment must be used within an AssignmentProvider');
  }
  return context;
}
