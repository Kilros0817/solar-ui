'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useConnection } from 'wagmi';
import { getContractById, getCurrentUserProfile } from '@/utils/subgraph';
import { useUser } from './UserContext';
import { useDivisionLeaderSections } from './DivisionLeaderSectionsContext';
import { useDivisionMemberClauses } from './DivisionMemberClausesContext';
import { USER_ROLE } from '@/utils/constants';

export type ContractDoc = Awaited<ReturnType<typeof getContractById>>;
export type DivisionProfile = { dcategory: number } | null | undefined;

interface ContractDocContextType {
  docs: Record<string, ContractDoc | null>;
  profile: DivisionProfile;
  loadingDocId: string | null;
  loadingProfile: boolean;
  error: string | null;
  loadDoc: (contractId: string) => Promise<void>;
  getDoc: (contractId: string) => ContractDoc | undefined | null;
  refetchDoc: (contractId: string) => Promise<void>;
}

const ContractDocContext = createContext<ContractDocContextType | undefined>(undefined);

export function ContractDocProvider({ children }: { children: React.ReactNode }) {
  const { userRole } = useUser();
  const { address } = useConnection();
  const leaderSections = useDivisionLeaderSections();
  const memberClauses = useDivisionMemberClauses();
  const [docs, setDocs] = useState<Record<string, ContractDoc | null>>({});
  const [profile, setProfile] = useState<DivisionProfile>(undefined);
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDivisionUser = userRole === USER_ROLE.DIVISION_LEADER || userRole === USER_ROLE.DIVISION_MEMBER;

  useEffect(() => {
    if (!address || !isDivisionUser) return;
    let cancelled = false;
    setLoadingProfile(true);
    setError(null);
    getCurrentUserProfile(address)
      .then((p) => {
        if (cancelled) return;
        if (p?.dcategory != null && Number(p.dcategory) !== 0) {
          setProfile({ dcategory: Number(p.dcategory) });
        } else {
          setProfile(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('Failed to load division profile:', e);
          setError(e instanceof Error ? e.message : 'Failed to load profile');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false);
      });
    return () => {
      cancelled = true;
    };
  }, [address, isDivisionUser]);

  const loadDoc = useCallback(
    async (contractId: string) => {
      if (!contractId) return;

      if (userRole === USER_ROLE.DIVISION_LEADER) {
        if (leaderSections.loading) return;
        const doc = leaderSections.getDocFromSections(contractId) as ContractDoc | null;
        setDocs((prev) => ({ ...prev, [contractId]: doc ?? null }));
        return;
      }

      if (userRole === USER_ROLE.DIVISION_MEMBER) {
        if (memberClauses.loading) return;
        const doc = memberClauses.getDocFromClauses(contractId) as ContractDoc | null;
        setDocs((prev) => ({ ...prev, [contractId]: doc ?? null }));
        return;
      }

      if (docs[contractId] !== undefined) return;
      setLoadingDocId(contractId);
      setError(null);
      try {
        const doc = await getContractById(contractId);
        setDocs((prev) => ({ ...prev, [contractId]: doc }));
      } catch (e) {
        console.error('Failed to load contract doc:', e);
        setError(e instanceof Error ? e.message : 'Failed to load contract');
        setDocs((prev) => ({ ...prev, [contractId]: null }));
      } finally {
        setLoadingDocId(null);
      }
    },
    [docs, userRole, leaderSections.loading, leaderSections.getDocFromSections, memberClauses.loading, memberClauses.getDocFromClauses]
  );

  const getDoc = useCallback(
    (contractId: string): ContractDoc | undefined | null => docs[contractId],
    [docs]
  );

  const refetchDoc = useCallback(
    async (contractId: string) => {
      if (!contractId) return;

      if (userRole === USER_ROLE.DIVISION_LEADER) {
        await leaderSections.refetch();
        const doc = leaderSections.getDocFromSections(contractId) as ContractDoc | null;
        setDocs((prev) => ({ ...prev, [contractId]: doc ?? null }));
        return;
      }

      if (userRole === USER_ROLE.DIVISION_MEMBER) {
        await memberClauses.refetch();
        const doc = memberClauses.getDocFromClauses(contractId) as ContractDoc | null;
        setDocs((prev) => ({ ...prev, [contractId]: doc ?? null }));
        return;
      }

      setLoadingDocId(contractId);
      setError(null);
      try {
        const doc = await getContractById(contractId);
        setDocs((prev) => ({ ...prev, [contractId]: doc }));
      } catch (e) {
        console.error('Failed to refetch contract doc:', e);
        setError(e instanceof Error ? e.message : 'Failed to refetch contract');
        setDocs((prev) => ({ ...prev, [contractId]: null }));
      } finally {
        setLoadingDocId(null);
      }
    },
    [userRole, leaderSections.refetch, leaderSections.getDocFromSections, memberClauses.refetch, memberClauses.getDocFromClauses]
  );

  const value: ContractDocContextType = {
    docs,
    profile,
    loadingDocId,
    loadingProfile,
    error,
    loadDoc,
    getDoc,
    refetchDoc,
  };

  return (
    <ContractDocContext.Provider value={value}>
      {children}
    </ContractDocContext.Provider>
  );
}

export function useContractDoc() {
  const context = useContext(ContractDocContext);
  if (context === undefined) {
    throw new Error('useContractDoc must be used within a ContractDocProvider');
  }
  return context;
}
