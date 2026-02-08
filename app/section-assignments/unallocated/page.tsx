'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConnection } from 'wagmi';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Loader2, FileText, ClipboardList, Eye, Search } from 'lucide-react';
import { getSectionsByDivisionLeader, getContractById } from '@/utils/subgraph';
import { useAssignment } from '@/app/contexts/AssignmentContext';
import { useSectionContent } from '@/app/contexts/SectionContentContext';
import { USER_ROLE } from '@/utils/constants';
import { useUser } from '@/app/contexts/UserContext';

type ClauseFromApi = {
  id: string;
  cid?: string;
  status?: number;
  assignedAt?: number;
  divisionMember?: { id: string; firstName?: string; lastName?: string; email?: string } | null;
};

type SectionFromApi = {
  id: string;
  clauses?: ClauseFromApi[];
  doc?: {
    id: string;
    title?: string;
    client?: { firstName?: string; lastName?: string; email?: string };
  };
};

function getClientLabel(doc: SectionFromApi['doc']) {
  if (!doc?.client) return '—';
  const c = doc.client;
  const name = [c.firstName, c.lastName].filter(Boolean).join(' ').trim();
  return name || (c as { email?: string }).email || '—';
}

function isUnallocated(clause: ClauseFromApi) {
  return !clause.divisionMember || !clause.divisionMember.id;
}

export default function SectionAssignmentsUnallocatedPage() {
  const router = useRouter();
  const { address } = useConnection();
  const { userRole } = useUser();
  const { setSelectedContract, setSelectedSection } = useAssignment();
  const { loadSectionContent } = useSectionContent();
  const [sections, setSections] = useState<SectionFromApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingId, setViewingId] = useState<string | null>(null);

  useEffect(() => {
    if (userRole !== null && userRole !== USER_ROLE.DIVISION_LEADER) {
      if (userRole === USER_ROLE.DIVISION_MEMBER) {
        router.replace('/clause-assignments');
      } else {
        router.replace('/my-contracts');
      }
      return;
    }
  }, [userRole, router]);

  useEffect(() => {
    if (!address || userRole !== USER_ROLE.DIVISION_LEADER) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getSectionsByDivisionLeader(address.toLowerCase())
      .then((list) => {
        if (cancelled) return;
        setSections(Array.isArray(list) ? list : []);
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('Failed to load sections:', e);
          setSections([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [address, userRole]);

  // Load section content into context so total/unallocated are available elsewhere
  useEffect(() => {
    if (sections.length === 0) return;
    sections.forEach((section) => {
      const docId = section.doc?.id;
      if (docId) loadSectionContent(section.id, docId);
    });
  }, [sections, loadSectionContent]);

  // Flatten to unallocated clauses with section + doc context
  const unallocatedItems: Array<{ clause: ClauseFromApi; section: SectionFromApi }> = [];
  sections.forEach((section) => {
    (section.clauses ?? []).filter(isUnallocated).forEach((clause) => {
      unallocatedItems.push({ clause, section });
    });
  });

  const filteredItems = unallocatedItems.filter(({ section }) => {
    const title = (section.doc?.title ?? '').toLowerCase();
    const client = getClientLabel(section.doc).toLowerCase();
    return title.includes(searchTerm.toLowerCase()) || client.includes(searchTerm.toLowerCase());
  });

  const handleViewSection = async (section: SectionFromApi) => {
    const docId = section.doc?.id;
    const sectionId = section.id;
    if (!docId) return;
    setViewingId(sectionId);
    try {
      const doc = await getContractById(docId);
      if (!doc?.sections) {
        setViewingId(null);
        return;
      }
      const sectionIndex = (doc.sections as Array<{ id?: string }>).findIndex(
        (s) => String(s.id) === String(sectionId)
      );
      if (sectionIndex < 0) {
        setViewingId(null);
        return;
      }
      setSelectedContract(docId);
      setSelectedSection(sectionIndex);
      router.push('/section-assignments/section');
    } catch (e) {
      console.error('Failed to open section:', e);
    } finally {
      setViewingId(null);
    }
  };

  if (userRole !== USER_ROLE.DIVISION_LEADER) {
    return null;
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Unallocated</h1>
        <p className="text-muted-foreground mt-1">
          Clauses not yet assigned to a division member. Open the section to assign.
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-md border border-input bg-input-background px-3 h-10 max-w-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 focus-within:ring-offset-2 transition-colors outline-none">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          placeholder="Search by contract or client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 p-0 h-auto min-w-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent shadow-none"
        />
      </div>

      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">No unallocated clauses</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {searchTerm
                ? 'No unallocated clauses match your search.'
                : 'All clauses in your sections are allocated to division members.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {filteredItems.map(({ clause, section }) => {
            const contractTitle = section.doc?.title ?? 'Untitled';
            const client = getClientLabel(section.doc);
            const isViewing = viewingId === section.id;

            return (
              <Card key={`${section.id}-${clause.id}`} className="flex flex-col">
                <CardContent className="p-4 flex flex-col gap-3 flex-1">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Contract
                    </p>
                    <p className="font-medium truncate" title={contractTitle}>
                      {contractTitle}
                    </p>
                    <p className="text-sm text-muted-foreground truncate" title={client}>
                      {client}
                    </p>
                  </div>
                  <div className="border-t pt-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Section
                    </p>
                    <p className="text-sm text-muted-foreground">Section ID: {section.id}</p>
                  </div>
                  <div className="border-t pt-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Clause
                    </p>
                    <p className="text-sm">Clause ID: {clause.id}</p>
                    {clause.cid && (
                      <p className="text-xs text-muted-foreground truncate" title={clause.cid}>
                        CID: {clause.cid}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end mt-auto pt-2 border-t">
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-1.5 cursor-pointer"
                      disabled={isViewing}
                      onClick={() => handleViewSection(section)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {isViewing ? 'Opening...' : 'View section'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
