'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AssignmentContextType {
  selectedContractId: string | null;
  selectedSectionIndex: number | null;
  setSelectedContract: (contractId: string | null) => void;
  setSelectedSection: (sectionIndex: number | null) => void;
  setSelection: (contractId: string | null, sectionIndex: number | null) => void;
}

const AssignmentContext = createContext<AssignmentContextType | undefined>(undefined);

export function AssignmentProvider({ children }: { children: ReactNode }) {
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number | null>(null);

  const setSelectedContract = useCallback((contractId: string | null) => {
    setSelectedContractId(contractId);
    setSelectedSectionIndex(null);
  }, []);

  const setSelectedSection = useCallback((sectionIndex: number | null) => {
    setSelectedSectionIndex(sectionIndex);
  }, []);

  const setSelection = useCallback((contractId: string | null, sectionIndex: number | null) => {
    setSelectedContractId(contractId);
    setSelectedSectionIndex(sectionIndex);
  }, []);

  const value: AssignmentContextType = {
    selectedContractId,
    selectedSectionIndex,
    setSelectedContract,
    setSelectedSection,
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
