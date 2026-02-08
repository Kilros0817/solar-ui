'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface SubgraphRefreshContextType {
  refreshCounter: number;
  refresh: () => void;
}

const SubgraphRefreshContext = createContext<SubgraphRefreshContextType | undefined>(undefined);

export function SubgraphRefreshProvider({ children }: { children: ReactNode }) {
  const [refreshCounter, setRefreshCounter] = useState(0);

  const refresh = useCallback(() => {
    setRefreshCounter((c) => c + 1);
  }, []);

  const value: SubgraphRefreshContextType = {
    refreshCounter,
    refresh,
  };

  return (
    <SubgraphRefreshContext.Provider value={value}>
      {children}
    </SubgraphRefreshContext.Provider>
  );
}

export function useSubgraphRefresh() {
  const context = useContext(SubgraphRefreshContext);
  if (context === undefined) {
    throw new Error('useSubgraphRefresh must be used within a SubgraphRefreshProvider');
  }
  return context;
}
