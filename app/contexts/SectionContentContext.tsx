'use client'

import React, { createContext, useContext, useCallback, useState, useRef } from 'react';
import { getContractById } from '@/utils/subgraph';
import { URLs } from '@/utils/constants';
import { useUser } from './UserContext';
import { useDivisionLeaderSections } from './DivisionLeaderSectionsContext';
import { USER_ROLE } from '@/utils/constants';

export type SectionContentItem = {
  sectionName: string;
  sectionContent: Array<{ clauseId: string; clauseContent: string }>;
};

interface SectionContentContextType {
  /** Total number of clauses from section content (IPFS). Cached by sectionId. */
  getTotalClauses: (sectionId: string) => number | undefined;
  /** Cached section content for reuse (sectionName + sectionContent). */
  getSectionContent: (sectionId: string) => SectionContentItem | undefined;
  /**
   * Load section content from IPFS (via doc cid), resolve section index from doc,
   * then cache total clauses and optional content. Returns total clause count.
   */
  loadSectionContent: (sectionId: string, docId: string) => Promise<number>;
  /** Clear cache (e.g. on logout). */
  clearCache: () => void;
}

const SectionContentContext = createContext<SectionContentContextType | undefined>(undefined);

export function SectionContentProvider({ children }: { children: React.ReactNode }) {
  const { userRole } = useUser();
  const leaderSections = useDivisionLeaderSections();
  const [totalBySectionId, setTotalBySectionId] = useState<Record<string, number>>({});
  const [contentBySectionId, setContentBySectionId] = useState<Record<string, SectionContentItem>>({});
  const inFlightRef = useRef<Record<string, Promise<number>>>({});

  const getTotalClauses = useCallback(
    (sectionId: string): number | undefined => totalBySectionId[sectionId],
    [totalBySectionId]
  );

  const getSectionContent = useCallback(
    (sectionId: string): SectionContentItem | undefined => contentBySectionId[sectionId],
    [contentBySectionId]
  );

  const loadSectionContent = useCallback(
    async (sectionId: string, docId: string): Promise<number> => {
      const cached = totalBySectionId[sectionId];
      if (cached !== undefined) return cached;
      const existing = inFlightRef.current[sectionId];
      if (existing) return existing;

      if (userRole === USER_ROLE.DIVISION_LEADER) {
        const section = leaderSections.sections.find((s) => String(s.id) === String(sectionId));
        if (!section) {
          setTotalBySectionId((prev) => ({ ...prev, [sectionId]: 0 }));
          return 0;
        }
        const sectionCid = (section as { cid?: string }).cid;
        if (sectionCid) {
          const promise = (async () => {
            try {
              const res = await fetch(`${URLs.TBGateWay}${sectionCid}`);
              const data = res.ok ? await res.json() : null;
              const sectionContent = data?.sectionContent?.filter((c: { clauseContent?: string }) => c.clauseContent) ?? [];
              const total = sectionContent.length;
              setTotalBySectionId((prev) => ({ ...prev, [sectionId]: total }));
              setContentBySectionId((prev) => ({
                ...prev,
                [sectionId]: {
                  sectionName: data?.sectionName ?? `Section ${sectionId}`,
                  sectionContent,
                },
              }));
              return total;
            } catch (e) {
              console.error('Failed to load section content:', e);
              setTotalBySectionId((prev) => ({ ...prev, [sectionId]: 0 }));
              return 0;
            } finally {
              delete inFlightRef.current[sectionId];
            }
          })();
          inFlightRef.current[sectionId] = promise;
          return promise;
        }
        const fromSubgraph = (section as { clauses?: unknown[] })?.clauses?.length ?? 0;
        setTotalBySectionId((prev) => ({ ...prev, [sectionId]: fromSubgraph }));
        return fromSubgraph;
      }

      const promise = (async () => {
      try {
        const doc = await getContractById(docId);
        if (!doc?.sections) {
          setTotalBySectionId((prev) => ({ ...prev, [sectionId]: 0 }));
          return 0;
        }
        const sectionIndex = (doc.sections as Array<{ id?: string }>).findIndex(
          (s) => String(s.id) === String(sectionId)
        );
        if (sectionIndex < 0) {
          setTotalBySectionId((prev) => ({ ...prev, [sectionId]: 0 }));
          return 0;
        }
        const cid = (doc as { cid?: string }).cid;
        if (!cid) {
          const fromSubgraph = (doc.sections[sectionIndex] as { clauses?: unknown[] })?.clauses?.length ?? 0;
          setTotalBySectionId((prev) => ({ ...prev, [sectionId]: fromSubgraph }));
          return fromSubgraph;
        }
        const res = await fetch(`${URLs.TBGateWay}${cid}`);
        const data = res.ok ? await res.json() : null;
        const sections = data?.sections ?? [];
        const sectionData = sections[sectionIndex];
        const sectionContent = sectionData?.sectionContent?.filter((c: { clauseContent?: string }) => c.clauseContent) ?? [];
        const total = sectionContent.length;
        setTotalBySectionId((prev) => ({ ...prev, [sectionId]: total }));
        setContentBySectionId((prev) => ({
          ...prev,
          [sectionId]: {
            sectionName: sectionData?.sectionName ?? `Section ${sectionIndex + 1}`,
            sectionContent,
          },
        }));
        return total;
      } catch (e) {
        console.error('Failed to load section content:', e);
        setTotalBySectionId((prev) => ({ ...prev, [sectionId]: 0 }));
        return 0;
      } finally {
        delete inFlightRef.current[sectionId];
      }
    })();
      inFlightRef.current[sectionId] = promise;
      return promise;
    },
    [totalBySectionId, userRole, leaderSections.sections]
  );

  const clearCache = useCallback(() => {
    setTotalBySectionId({});
    setContentBySectionId({});
  }, []);

  const value: SectionContentContextType = {
    getTotalClauses,
    getSectionContent,
    loadSectionContent,
    clearCache,
  };

  return (
    <SectionContentContext.Provider value={value}>
      {children}
    </SectionContentContext.Provider>
  );
}

export function useSectionContent() {
  const context = useContext(SectionContentContext);
  if (context === undefined) {
    throw new Error('useSectionContent must be used within a SectionContentProvider');
  }
  return context;
}
