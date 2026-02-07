'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { Skeleton } from '@/app/components/ui/skeleton';
import { ArrowLeft, FileText, Loader2, ClipboardList, Building2, Eye, Search } from 'lucide-react';
import { useContractDoc } from '@/app/contexts/ContractDocContext';
import { useContracts } from '@/app/contexts/ContractsContext';
import { useAssignment } from '@/app/contexts/AssignmentContext';
import { DIVISION_LABELS, USER_ROLE, URLs, CONTRACT_STATUS_LABELS } from '@/utils/constants';
import { useUser } from '@/app/contexts/UserContext';
import { formatRelativeDate } from '@/utils/utility';
import type { SectionWithDivision } from '@/app/data/interfaces';
import type { ContractWithSections } from '@/app/data/interfaces';

function getStatusColor(status: number) {
  switch (status) {
    case 0: return 'bg-orange-100 text-orange-800 border-orange-200';
    case 1: return 'bg-blue-100 text-blue-800 border-blue-200';
    case 2: return 'bg-green-100 text-green-800 border-green-200';
    case 3: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function SectionAssignmentsContractList({ onSelectContract }: { onSelectContract: (contractId: number) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const { contracts, loading } = useContracts();

  const displayContracts = contracts.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.client || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Section Assignments</h1>
        <p className="text-muted-foreground mt-1">
          Select a contract to view and manage your division&apos;s section assignments.
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

      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
              </div>
            ))}
          </div>
        ) : displayContracts.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="font-semibold py-4">Contract Name</TableHead>
                <TableHead className="font-semibold py-4">Category</TableHead>
                <TableHead className="font-semibold py-4">Status</TableHead>
                <TableHead className="font-semibold py-4">Client</TableHead>
                <TableHead className="font-semibold py-4">Sections</TableHead>
                <TableHead className="font-semibold py-4">Created</TableHead>
                <TableHead className="w-[50px] py-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayContracts.map((contract: ContractWithSections) => (
                <TableRow
                  key={contract.id}
                  className="cursor-pointer group"
                  onClick={() => onSelectContract(contract.id)}
                >
                  <TableCell className="font-medium py-4">{contract.title}</TableCell>
                  <TableCell className="text-muted-foreground py-4">
                    {contract.category || '—'}
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge className={getStatusColor(contract.status)}>
                      {CONTRACT_STATUS_LABELS[contract.status] ?? 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">{contract.client || '—'}</TableCell>
                  <TableCell className="text-muted-foreground py-4">
                    {contract.sectionCount != null ? contract.sectionCount : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground py-4">
                    {contract.createdAt ? formatRelativeDate(contract.createdAt) : '—'}
                  </TableCell>
                  <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-pointer"
                      onClick={() => onSelectContract(contract.id)}
                      title="View sections"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="rounded-full bg-muted p-4 mb-4 mt-4">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">No contracts found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {searchTerm
                ? 'No contracts match your search. Try a different term.'
                : 'No contracts are assigned to your division yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SectionAssignmentsPage() {
  const router = useRouter();
  const { userRole } = useUser();
  const { selectedContractId, setSelectedContract, setSelectedSection } = useAssignment();
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
    if (selectedContractId) {
      loadDoc(selectedContractId);
    }
  }, [selectedContractId, loadDoc]);

  useEffect(() => {
    setSectionNamesLoaded(false);
  }, [contractId]);

  const doc = contractId ? getDoc(contractId) : undefined;
  const loading =
    loadingDocId === contractId ||
    (contractId && doc === undefined) ||
    (profile === undefined && loadingProfile);
  const notInDivision = profile === null && !loadingProfile;
  const docNotFound = contractId && doc === null;
  const error = contextError ?? (notInDivision ? 'You are not assigned to a division.' : docNotFound ? 'Contract not found.' : null);

  // Load section names/counts when doc and profile are ready (must run unconditionally for hooks order)
  useEffect(() => {
    if (!selectedContractId || !doc || !profile || sectionNamesLoaded || userRole !== USER_ROLE.DIVISION_LEADER) return;
    const leaderDcategory = profile.dcategory;
    const rawSections: SectionWithDivision[] = (doc.sections ?? []).map((s: any, i: number) => ({
      index: i,
      divisionLeader: s?.divisionLeader,
    }));
    const mySections = rawSections.filter(
      (s) => s.divisionLeader?.dcategory != null && Number(s.divisionLeader.dcategory) === leaderDcategory
    );

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
  }, [selectedContractId, doc, profile, sectionNamesLoaded, userRole]);

  const contractTitle = doc?.title ?? 'Untitled';

  // No contract selected: show contract list on this page (stay on /section-assignments)
  if (!selectedContractId) {
    return (
      <SectionAssignmentsContractList
        onSelectContract={(contractId) => setSelectedContract(String(contractId))}
      />
    );
  }
  const client = doc?.client;
  const contractClient = client
    ? [client.firstName, client.lastName].filter(Boolean).join(' ') || (client as { email?: string }).email || ''
    : '';
  const divisionLabel = profile ? (DIVISION_LABELS[profile.dcategory] ?? `Division #${profile.dcategory}`) : '';

  const handleViewSection = (index: number) => {
    setSelectedSection(index);
    router.push('/section-assignments/section');
  };

  if (userRole !== null && userRole !== USER_ROLE.DIVISION_LEADER) {
    return null;
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <Button variant="ghost" onClick={() => setSelectedContract(null)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to contract list
        </Button>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" onClick={() => setSelectedContract(null)} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to contract list
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
