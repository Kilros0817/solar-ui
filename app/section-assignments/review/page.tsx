'use client'

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { DIVISION_LABELS, USER_ROLE } from '@/utils/constants';
import { useUser } from '@/app/contexts/UserContext';
import { useAssignment } from '@/app/contexts/AssignmentContext';
import { useDivisionLeaderSections } from '@/app/contexts/DivisionLeaderSectionsContext';
import { FileText, Loader2, Eye } from 'lucide-react';

type ReviewClauseLeader = {
  id: string;
  cid?: string | null;
  status: number;
  sectionId: string;
  section: { id: string; doc: { id: string; title?: string } };
  divisionMember?: { id: string; firstName?: string; lastName?: string; email?: string } | null;
};

type ClauseWithStatus = { id: string; status: number; cid?: string | null; divisionMember?: ReviewClauseLeader['divisionMember'] };

function getMemberLabel(m: ReviewClauseLeader['divisionMember']): string {
  if (!m) return '—';
  const name = [m.firstName, m.lastName].filter(Boolean).join(' ').trim();
  return name || m.email || m.id || '—';
}

export default function SectionAssignmentsReviewPage() {
  const router = useRouter();
  const { userRole } = useUser();
  const { setSelection } = useAssignment();
  const { sections, loading, getDocFromSections, getSectionIndex } = useDivisionLeaderSections();
  const [divisionLabel, setDivisionLabel] = useState('');
  const [workingId, setWorkingId] = useState<string | null>(null);

  const reviewClauses = useMemo(() => {
    const flat: ReviewClauseLeader[] = [];
    sections.forEach((sec) => {
      const sectionId = sec.id;
      const doc = sec.doc;
      (sec.clauses ?? []).forEach((c: ClauseWithStatus) => {
        if (c.status === 1) {
          flat.push({
            id: c.id,
            cid: c.cid ?? null,
            status: 1,
            sectionId,
            section: { id: sectionId, doc: doc ?? { id: '', title: '' } },
            divisionMember: c.divisionMember ?? null,
          });
        }
      });
    });
    return flat;
  }, [sections]);

  useEffect(() => {
    if (userRole === USER_ROLE.DIVISION_LEADER && sections.length > 0 && !divisionLabel) {
      const dcat = (sections[0] as { divisionLeader?: { dcategory?: number } })?.divisionLeader?.dcategory;
      if (dcat != null) setDivisionLabel(DIVISION_LABELS[dcat] ?? `Division #${dcat}`);
    }
  }, [userRole, sections, divisionLabel]);

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

  const handleViewClause = (item: ReviewClauseLeader) => {
    const contractId = item.section?.doc?.id;
    const sectionId = item.section?.id;
    const clauseId = item.id;
    if (!contractId || !sectionId || !clauseId) return;
    setWorkingId(item.id);
    const doc = getDocFromSections(contractId);
    const secIdx = getSectionIndex(contractId, sectionId);
    if (!doc || secIdx < 0) {
      setWorkingId(null);
      return;
    }
    const sec = doc.sections[secIdx];
    const clauseIdx = (sec?.clauses ?? []).findIndex((c: { id?: string }) => String(c.id) === String(clauseId));
    if (clauseIdx < 0) {
      setWorkingId(null);
      return;
    }
    setSelection(contractId, secIdx, clauseIdx, item.cid ?? null, 'review');
    router.push('/section-assignments/clause');
    setWorkingId(null);
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
        <h1 className="text-3xl font-bold">Review</h1>
        <p className="text-muted-foreground mt-1">
          Submitted clauses awaiting your review {divisionLabel ? `— ${divisionLabel}` : ''}
        </p>
      </div>

      {reviewClauses.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="font-medium">No clauses in review</p>
            <p className="text-sm text-muted-foreground">
              Clauses with status Submitted will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {reviewClauses.map((item) => (
            <Card key={item.id} className="flex flex-col w-full">
              <CardContent className="p-4 flex flex-col gap-3 flex-1">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Document
                  </p>
                  <p className="font-medium text-sm truncate" title={item.section?.doc?.title ?? 'Untitled'}>
                    {item.section?.doc?.title ?? 'Untitled'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Section ID
                  </p>
                  <p className="text-sm text-muted-foreground">{item.section?.id ?? '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Division member
                  </p>
                  <p className="text-sm text-muted-foreground">{getMemberLabel(item.divisionMember)}</p>
                </div>
                <div className="flex justify-end mt-auto pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 shrink-0 cursor-pointer"
                    disabled={workingId === item.id}
                    onClick={() => handleViewClause(item)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {workingId === item.id ? 'Opening...' : 'View'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
