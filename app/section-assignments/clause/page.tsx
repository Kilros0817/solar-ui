'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import { useContractDoc } from '@/app/contexts/ContractDocContext';
import { useAssignment } from '@/app/contexts/AssignmentContext';
import { DIVISION_LABELS, USER_ROLE, URLs } from '@/utils/constants';
import { useUser } from '@/app/contexts/UserContext';
import type { DocSection } from '@/app/data/interfaces';

export default function SectionAssignmentsClausePage() {
  const router = useRouter();
  const { userRole } = useUser();
  const { selectedContractId, selectedSectionIndex, selectedClauseIndex, selectedClauseCid } = useAssignment();
  const { profile, loadDoc, getDoc, loadingDocId, loadingProfile, error: contextError } = useContractDoc();
  const contractId = selectedContractId ?? '';
  const sectionIndex = selectedSectionIndex ?? -1;
  const clauseIndex = selectedClauseIndex ?? -1;
  const [sectionName, setSectionName] = useState('');
  const [clauseContent, setClauseContent] = useState('');
  const [contentLoaded, setContentLoaded] = useState(false);

  useEffect(() => {
    if (userRole !== null && userRole !== USER_ROLE.DIVISION_LEADER) {
      router.replace('/my-contracts');
      return;
    }
  }, [userRole, router]);

  useEffect(() => {
    if (!selectedContractId || selectedSectionIndex == null || selectedSectionIndex < 0 || selectedClauseIndex == null || selectedClauseIndex < 0) {
      router.replace('/section-assignments');
      return;
    }
    loadDoc(selectedContractId);
  }, [selectedContractId, selectedSectionIndex, selectedClauseIndex, loadDoc, router]);

  useEffect(() => {
    setContentLoaded(false);
  }, [contractId, sectionIndex, clauseIndex, selectedClauseCid]);

  const doc = contractId ? getDoc(contractId) : undefined;
  const loading =
    loadingDocId === contractId ||
    (contractId && doc === undefined) ||
    (profile === undefined && loadingProfile);
  const notInDivision = profile === null && !loadingProfile;
  const docNotFound = contractId && doc === null;
  const error = contextError ?? (notInDivision ? 'You are not assigned to a division.' : docNotFound ? 'Contract not found.' : null);

  useEffect(() => {
    if (!doc || sectionIndex < 0 || clauseIndex < 0 || contentLoaded) return;

    if (selectedClauseCid) {
      setSectionName(`Section ${sectionIndex + 1}`);
      fetch(`${URLs.TBGateWay}${selectedClauseCid}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const content = typeof data?.clauseContent === 'string' ? data.clauseContent : '';
          setClauseContent(content);
        })
        .catch(() => setClauseContent(''))
        .finally(() => setContentLoaded(true));
      return;
    }

    if (!doc.cid) {
      setSectionName(`Section ${sectionIndex + 1}`);
      setClauseContent('');
      setContentLoaded(true);
      return;
    }
    fetch(`${URLs.TBGateWay}${doc.cid}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const sections: DocSection[] = data?.sections ?? [];
        const section = sections[sectionIndex];
        if (section?.sectionContent?.[clauseIndex]) {
          const clause = section.sectionContent[clauseIndex];
          setSectionName(section.sectionName ?? `Section ${sectionIndex + 1}`);
          setClauseContent(clause.clauseContent ?? '');
        } else {
          setSectionName(`Section ${sectionIndex + 1}`);
          setClauseContent('');
        }
      })
      .catch(() => {
        setSectionName(`Section ${sectionIndex + 1}`);
        setClauseContent('');
      })
      .finally(() => setContentLoaded(true));
  }, [doc, sectionIndex, clauseIndex, contentLoaded, selectedClauseCid]);

  const contractTitle = doc?.title ?? 'Untitled';
  const divisionLabel = profile ? (DIVISION_LABELS[profile.dcategory] ?? `Division #${profile.dcategory}`) : '';

  if (userRole !== null && userRole !== USER_ROLE.DIVISION_LEADER) {
    return null;
  }

  if (loading || !contentLoaded) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <Button variant="ghost" onClick={() => router.push('/section-assignments/section')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to section
        </Button>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" onClick={() => router.push('/section-assignments/section')} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to section
      </Button>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-brand-secondary/10 flex items-center justify-center shrink-0">
          <FileText className="h-6 w-6 text-brand-secondary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{contractTitle}</h1>
          <p className="text-muted-foreground">{divisionLabel}</p>
          <p className="text-sm text-muted-foreground mt-1">{sectionName} — Clause {clauseIndex + 1}</p>
        </div>
      </div>

      <Card className="gap-2">
        <CardHeader>
          <CardTitle className="text-lg">View clause content</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            id="clause-content"
            value={clauseContent}
            readOnly
            rows={8}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[160px]"
            placeholder="Enter clause content..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
