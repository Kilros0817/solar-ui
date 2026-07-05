'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface PostgresRefreshContextType {
  refreshCounter: number;
  refresh: () => void;
}

const PostgresRefreshContext = createContext<PostgresRefreshContextType | undefined>(undefined);

export function PostgresRefreshProvider({ children }: { children: ReactNode }) {
  const [refreshCounter, setRefreshCounter] = useState(0);

  const refresh = useCallback(() => {
    setRefreshCounter((c) => c + 1);
  }, []);

  const value: PostgresRefreshContextType = {
    refreshCounter,
    refresh,
  };

  return (
    <PostgresRefreshContext.Provider value={value}>
      {children}
    </PostgresRefreshContext.Provider>
  );
}

export function usePostgresRefresh() {
  const context = useContext(PostgresRefreshContext);
  if (context === undefined) {
    throw new Error('usePostgresRefresh must be used within a PostgresRefreshProvider');
  }
  return context;
}
