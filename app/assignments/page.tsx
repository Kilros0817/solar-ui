'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConnection } from 'wagmi';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { ArrowLeft, FileText, Loader2, ClipboardList, Building2, Eye, Pencil } from 'lucide-react';
import { useContractDoc } from '@/app/contexts/ContractDocContext';
import { useAssignment } from '@/app/contexts/AssignmentContext';
import { DIVISION_LABELS, USER_ROLE, URLs } from '@/utils/constants';
import { formatRelativeDate } from '@/utils/utility';
import { useUser } from '@/app/contexts/UserContext';
import type { SectionWithDivision } from '@/app/data/interfaces';

/** Single assignment for division member: one clause assigned to them */
export type MemberAssignmentBox = {
  sectionId: string;
  sectionIndex: number;
  clauseIndex: number;
  sectionName: string;
  status: number;
  clauseContent: string;
  clauseId?: string;
  assignedAt?: number | string;
};

export default function AssignmentsPage() {
  const router = useRouter();
  const { address } = useConnection();
  const { userRole } = useUser();
  const { selectedContractId, setSelectedSection, setSelectedClause } = useAssignment();
  const { profile, loadDoc, getDoc, loadingDocId, loadingProfile, error: contextError } = useContractDoc();
  const contractId = selectedContractId ?? '';
  const [sections, setSections] = useState<
    Array<{
      index: number;
      name: string;
      totalClauses: number;
      assignedCount: number;
      submittedCount: number;
      approvedCount: number;
      rejectedCount: number;
    }>
  >([]);
  const [sectionNamesLoaded, setSectionNamesLoaded] = useState(false);
  /** Division member: flat list of clause assignments to show as boxes */
  const [memberAssignments, setMemberAssignments] = useState<MemberAssignmentBox[]>([]);
  const [memberAssignmentsLoaded, setMemberAssignmentsLoaded] = useState(false);

  useEffect(() => {
    const allowed = userRole === USER_ROLE.DIVISION_LEADER || userRole === USER_ROLE.DIVISION_MEMBER;
    if (userRole !== null && !allowed) {
      router.replace('/my-contracts');
      return;
    }
  }, [userRole, router]);

  useEffect(() => {
    if (!selectedContractId) {
      const fallback = userRole === USER_ROLE.DIVISION_MEMBER ? '/my-assignments' : '/my-contracts';
      router.replace(fallback);
      return;
    }
    loadDoc(selectedContractId);
  }, [selectedContractId, loadDoc, router, userRole]);

  useEffect(() => {
    setSectionNamesLoaded(false);
    setMemberAssignmentsLoaded(false);
  }, [contractId]);

  if (!selectedContractId) {
    return null;
  }

  const doc = contractId ? getDoc(contractId) : undefined;
  const isDivisionMember = userRole === USER_ROLE.DIVISION_MEMBER;
  const loading =
    loadingDocId === contractId ||
    (contractId && doc === undefined) ||
    (profile === undefined && loadingProfile) ||
    (isDivisionMember && doc != null && !memberAssignmentsLoaded);
  const notInDivision = profile === null && !loadingProfile;
  const docNotFound = contractId && doc === null;
  const error = contextError ?? (notInDivision ? 'You are not assigned to a division.' : docNotFound ? 'Contract not found.' : null);

  useEffect(() => {
    if (!doc || !profile || sectionNamesLoaded) return;
    const leaderDcategory = profile.dcategory;
    const rawSections: SectionWithDivision[] = (doc.sections ?? []).map((s: any, i: number) => ({
      index: i,
      divisionLeader: s?.divisionLeader,
    }));
    let mySections = rawSections.filter(
      (s) => s.divisionLeader?.dcategory != null && Number(s.divisionLeader.dcategory) === leaderDcategory
    );
    if (userRole === USER_ROLE.DIVISION_MEMBER && address) {
      const memberAddressLower = String(address).toLowerCase();
      mySections = mySections.filter((s) => {
        const sectionAt = (doc as any).sections?.[s.index];
        const clauses = sectionAt?.clauses ?? [];
        return clauses.some(
          (c: { divisionMember?: { id?: string } }) =>
            String(c.divisionMember?.id ?? '').toLowerCase() === memberAddressLower
        );
      });
    }

    const getClauseCounts = (sectionIndex: number) => {
      const sectionAt = (doc as any).sections?.[sectionIndex];
      const clauses = sectionAt?.clauses ?? [];
      const total = clauses.length;
      let assigned = 0;
      let submitted = 0;
      let approved = 0;
      let rejected = 0;
      clauses.forEach((c: { status?: number }) => {
        const s = typeof c.status === 'number' ? c.status : 0;
        if (s === 0) assigned++;
        else if (s === 1) submitted++;
        else if (s === 2) approved++;
        else if (s === 3) rejected++;
      });
      return { total, assigned, submitted, approved, rejected };
    };

    if (doc.cid) {
      fetch(`${URLs.TBGateWay}${doc.cid}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          setSections(
            mySections.map((s) => {
              const counts = getClauseCounts(s.index);
              const totalFromDoc = data?.sections?.[s.index]?.sectionContent?.length ?? counts.total;
              const total = counts.total > 0 ? counts.total : totalFromDoc;
              return {
                index: s.index,
                name: data?.sections?.[s.index]?.sectionName ?? `Section ${s.index + 1}`,
                totalClauses: total,
                assignedCount: counts.assigned,
                submittedCount: counts.submitted,
                approvedCount: counts.approved,
                rejectedCount: counts.rejected,
              };
            })
          );
        })
        .catch(() =>
          setSections(
            mySections.map((s) => {
              const counts = getClauseCounts(s.index);
              return {
                index: s.index,
                name: `Section ${s.index + 1}`,
                totalClauses: counts.total,
                assignedCount: counts.assigned,
                submittedCount: counts.submitted,
                approvedCount: counts.approved,
                rejectedCount: counts.rejected,
              };
            })
          )
        )
        .finally(() => setSectionNamesLoaded(true));
    } else {
      setSections(
        mySections.map((s) => {
          const counts = getClauseCounts(s.index);
          return {
            index: s.index,
            name: `Section ${s.index + 1}`,
            totalClauses: counts.total,
            assignedCount: counts.assigned,
            submittedCount: counts.submitted,
            approvedCount: counts.approved,
            rejectedCount: counts.rejected,
          };
        })
      );
      setSectionNamesLoaded(true);
    }
  }, [doc, profile, sectionNamesLoaded, userRole, address]);

  // Division member: build flat list of assignment boxes (section id, status, clause data)
  useEffect(() => {
    if (userRole !== USER_ROLE.DIVISION_MEMBER || !doc || !profile || !address || memberAssignmentsLoaded) return;
    const memberAddressLower = String(address).toLowerCase();
    const leaderDcategory = profile.dcategory;
    type DocSection = { id?: string; divisionLeader?: { dcategory?: number }; clauses?: Array<{ status?: number; assignedAt?: number | string; divisionMember?: { id?: string } }> };
    const rawSections = (doc as { sections?: DocSection[] }).sections ?? [];

    const buildBoxes = (ipfsSections: Array<{ sectionName?: string; sectionContent?: Array<{ clauseId?: string; clauseContent?: string }> }>) => {
      const boxes: MemberAssignmentBox[] = [];
      rawSections.forEach((sec, sectionIndex) => {
        if (sec?.divisionLeader?.dcategory == null || Number(sec.divisionLeader.dcategory) !== leaderDcategory) return;
        const sectionId = sec?.id ?? `section-${sectionIndex}`;
        const sectionName = ipfsSections[sectionIndex]?.sectionName ?? `Section ${sectionIndex + 1}`;
        const clauseContents = ipfsSections[sectionIndex]?.sectionContent ?? [];
        (sec.clauses ?? []).forEach((c, clauseIndex) => {
          if (String(c.divisionMember?.id ?? '').toLowerCase() !== memberAddressLower) return;
          const content = clauseContents[clauseIndex];
          boxes.push({
            sectionId: String(sectionId),
            sectionIndex,
            clauseIndex,
            sectionName,
            status: typeof c.status === 'number' ? c.status : 0,
            clauseContent: content?.clauseContent ?? '',
            clauseId: content?.clauseId,
            assignedAt: c.assignedAt,
          });
        });
      });
      setMemberAssignments(boxes);
      setMemberAssignmentsLoaded(true);
    };

    if (doc.cid) {
      fetch(`${URLs.TBGateWay}${doc.cid}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const ipfsSections = data?.sections ?? [];
          buildBoxes(ipfsSections);
        })
        .catch(() => {
          buildBoxes([]);
        });
    } else {
      buildBoxes([]);
    }
  }, [doc, profile, userRole, address, memberAssignmentsLoaded]);

  const contractTitle = doc?.title ?? 'Untitled';
  const client = doc?.client;
  const contractClient = client
    ? [client.firstName, client.lastName].filter(Boolean).join(' ') || (client as { email?: string }).email || ''
    : '';
  const divisionLabel = profile ? (DIVISION_LABELS[profile.dcategory] ?? `Division #${profile.dcategory}`) : '';

  const handleViewSection = (index: number) => {
    setSelectedSection(index);
    router.push('/assignments/section');
  };

  const isDivisionUser = userRole === USER_ROLE.DIVISION_LEADER || userRole === USER_ROLE.DIVISION_MEMBER;
  if (userRole !== null && !isDivisionUser) {
    return null;
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const backHref = userRole === USER_ROLE.DIVISION_MEMBER ? '/my-assignments' : '/my-contracts';
  const backLabel = userRole === USER_ROLE.DIVISION_MEMBER ? 'Back to My Assignments' : 'Back to All Assignments';

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <Button variant="ghost" onClick={() => router.push(backHref)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Button>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  const statusLabel = (status: number) => {
    switch (status) {
      case 0: return 'Assigned';
      case 1: return 'Submitted';
      case 2: return 'Approved';
      case 3: return 'Rejected';
      default: return 'Unknown';
    }
  };

  const statusVariant = (status: number): 'secondary' | 'default' | 'destructive' | 'outline' => {
    switch (status) {
      case 2: return 'default';
      case 3: return 'destructive';
      default: return 'secondary';
    }
  };

  // Division member: assignment boxes (section id, status, clause data)
  if (isDivisionMember) {
    return (
      <div className="p-6 space-y-6">
        <Button variant="ghost" onClick={() => router.push(backHref)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-brand-secondary/10 flex items-center justify-center shrink-0">
            <FileText className="h-6 w-6 text-brand-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{contractTitle}</h1>
            <p className="text-muted-foreground">{contractClient || '—'}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your assigned clauses in <span className="font-medium text-foreground">{divisionLabel}</span>
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-medium">Assignments</h2>
          {memberAssignments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No clause assignments for this contract.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, 400px)' }}>
              {memberAssignments.map((a, idx) => {
                const assignedTs = typeof a.assignedAt === 'number' ? a.assignedAt : typeof a.assignedAt === 'string' ? (Number(a.assignedAt) || undefined) : undefined;
                const clausePreview = (a.clauseContent || '—').replace(/\s+/g, ' ').trim();
                const clauseEllipsis = clausePreview.length > 120 ? clausePreview.slice(0, 120) + '...' : clausePreview;
                return (
                  <Card key={`${a.sectionId}-${idx}`} className="flex flex-col w-full">
                    <CardContent className="p-4 flex flex-col gap-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-sm">{a.sectionName}</span>
                        <Badge variant={statusVariant(a.status)} className={a.status === 2 ? 'bg-green-600 shrink-0' : 'shrink-0'}>
                          {statusLabel(a.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3.75rem]">
                        {clauseEllipsis}
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-2 border-t">
                        <span className="text-xs text-muted-foreground">
                          Assigned: {assignedTs != null ? formatRelativeDate(assignedTs) : '—'}
                        </span>
                        <Button
                          variant="default"
                          size="sm"
                          className="gap-1.5 shrink-0"
                          onClick={() => {
                            setSelectedSection(a.sectionIndex);
                            setSelectedClause(a.clauseIndex);
                            router.push('/assignments/clause');
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Work on
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Division leader: section list
  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" onClick={() => router.push(backHref)} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Button>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-brand-secondary/10 flex items-center justify-center shrink-0">
          <FileText className="h-6 w-6 text-brand-secondary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{contractTitle}</h1>
          <p className="text-muted-foreground">{contractClient || '—'}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Sections assigned to <span className="font-medium text-foreground">{divisionLabel}</span>
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Your division&apos;s sections
          </CardTitle>
          <CardDescription>
            Contract sections assigned to your division for review
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sections.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center">
              No sections are assigned to your division for this contract.
            </p>
          ) : (
            <ul className="space-y-3">
              {sections.map((s) => (
                <li
                  key={s.index}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-brand-secondary/10 flex items-center justify-center shrink-0">
                    <ClipboardList className="h-5 w-5 text-brand-secondary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">Section {s.index + 1}</p>
                    <div className="flex flex-row gap-2 mt-1.5 text-xs text-muted-foreground">
                      <span className="text-blue-600">Total: {s.totalClauses}</span>
                      <span className="text-yellow-600">Assigned: {s.assignedCount}</span>
                      <span className="text-orange-600">Submitted: {s.submittedCount}</span>
                      <span className="text-green-600">Approved: {s.approvedCount}</span>
                      <span className="text-red-600">Rejected: {s.rejectedCount}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 cursor-pointer"
                    onClick={() => handleViewSection(s.index)}
                    title="View section"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
