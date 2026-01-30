'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NewContractContextType {
  templateId: string | null;
  setTemplateId: (id: string | null) => void;
  from: string;
  setFrom: (from: string) => void;
}

const NewContractContext = createContext<NewContractContextType | undefined>(undefined);

export function NewContractProvider({ children }: { children: ReactNode }) {
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [from, setFrom] = useState<string>('dashboard');

  return (
    <NewContractContext.Provider value={{ templateId, setTemplateId, from, setFrom }}>
      {children}
    </NewContractContext.Provider>
  );
}

export function useNewContract() {
  const context = useContext(NewContractContext);
  if (context === undefined) {
    throw new Error('useNewContract must be used within a NewContractProvider');
  }
  return context;
}
