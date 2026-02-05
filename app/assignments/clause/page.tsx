'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConfig, useConnection } from 'wagmi';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import { useContractDoc } from '@/app/contexts/ContractDocContext';
import { useAssignment } from '@/app/contexts/AssignmentContext';
import { DIVISION_LABELS, USER_ROLE, URLs } from '@/utils/constants';
import { useUser } from '@/app/contexts/UserContext';
import { submitClauseToLeader } from '@/utils/interact';
import { toast } from 'sonner';
import type { DocSection } from '@/app/data/interfaces';

export default function ClauseEditPage() {
  const router = useRouter();
  const config = useConfig();
  const { address } = useConnection();
  const { userRole } = useUser();
  const { selectedContractId, selectedSectionIndex, selectedClauseIndex } = useAssignment();
  const { profile, loadDoc, getDoc, loadingDocId, loadingProfile, error: contextError, refetchDoc } = useContractDoc();
  const contractId = selectedContractId ?? '';
  const sectionIndex = selectedSectionIndex ?? -1;
  const clauseIndex = selectedClauseIndex ?? -1;
  const [sectionName, setSectionName] = useState('');
  const [clauseContent, setClauseContent] = useState('');
  const [docClauseId, setDocClauseId] = useState<string>('');
  /** Subgraph Clause entity id (numeric) for submitClause contract call */
  const [subgraphClauseId, setSubgraphClauseId] = useState<number | null>(null);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const allowed = userRole === USER_ROLE.DIVISION_LEADER || userRole === USER_ROLE.DIVISION_MEMBER;
    if (userRole !== null && !allowed) {
      router.replace('/my-contracts');
      return;
    }
  }, [userRole, router]);

  useEffect(() => {
    if (!selectedContractId || selectedSectionIndex == null || selectedSectionIndex < 0 || selectedClauseIndex == null || selectedClauseIndex < 0) {
      router.replace('/assignments');
      return;
    }
    loadDoc(selectedContractId);
  }, [selectedContractId, selectedSectionIndex, selectedClauseIndex, loadDoc, router]);

  useEffect(() => {
    setContentLoaded(false);
  }, [contractId, sectionIndex, clauseIndex]);

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
    const rawSections = (doc as { sections?: Array<{ clauses?: Array<{ id?: string }> }> }).sections ?? [];
    const sectionAt = rawSections[sectionIndex];
    const clauseAt = sectionAt?.clauses?.[clauseIndex];
    const sgId = clauseAt?.id != null ? Number(clauseAt.id) : null;
    if (sgId != null && !Number.isNaN(sgId)) setSubgraphClauseId(sgId);
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
          setDocClauseId(clause.clauseId ?? '');
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
  }, [doc, sectionIndex, clauseIndex, contentLoaded]);

  const contractTitle = doc?.title ?? 'Untitled';
  const divisionLabel = profile ? (DIVISION_LABELS[profile.dcategory] ?? `Division #${profile.dcategory}`) : '';
  const isDivisionLeader = userRole === USER_ROLE.DIVISION_LEADER;
  const isDivisionMember = userRole === USER_ROLE.DIVISION_MEMBER;
  const backHref = isDivisionLeader ? '/assignments/section' : '/assignments';
  const backLabel = isDivisionLeader ? 'Back to section' : 'Back to Assignments';

  const handleRequestReview = async () => {
    if (!config || !address || subgraphClauseId == null) {
      toast.error('Missing wallet or clause data');
      return;
    }

    setSubmitting(true);
    try {
      const assignedDate = new Date().toISOString();
      const uploadRes = await fetch(`${URLs.UploadAPI}/clauses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clauses: [{
            clauseId: docClauseId,
            clauseContent,
            divisionMemberAddress: address.toLowerCase(),
            assignedDate,
          }],
        }),
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        toast.error(uploadData.error ?? 'Failed to upload clause');
        return;
      }
      const clauseCids = uploadData.clauseCids as string[];
      if (!Array.isArray(clauseCids) || clauseCids.length === 0) {
        toast.error('Invalid upload response');
        return;
      }

      const success = await submitClauseToLeader(config, address, subgraphClauseId, clauseCids[0]);
      if (success) {
        toast.success('Clause submitted for review');
        await refetchDoc(contractId);
        router.push('/assignments');
      } else {
        toast.error('Failed to submit clause');
      }
    } catch (e) {
      console.error('Request review error:', e);
      toast.error(e instanceof Error ? e.message : 'Failed to submit clause');
    } finally {
      setSubmitting(false);
    }
  };

  if (userRole !== null && !isDivisionMember && !isDivisionLeader) {
    router.replace('/assignments');
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
        <Button variant="ghost" onClick={() => router.push(backHref)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Button>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

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
          <p className="text-muted-foreground">{divisionLabel}</p>
          <p className="text-sm text-muted-foreground mt-1">{sectionName} — Clause {clauseIndex + 1}</p>
        </div>
      </div>

      <Card className="gap-2">
        <CardHeader>
          <CardTitle className="text-lg">{isDivisionLeader ? 'View clause content' : 'Edit clause content'}</CardTitle>
        </CardHeader>
        <CardContent className="">
            <textarea
              id="clause-content"
              value={clauseContent}
              onChange={(e) => !isDivisionLeader && setClauseContent(e.target.value)}
              readOnly={isDivisionLeader}
              rows={8}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[160px] "
              placeholder="Enter clause content..."
            />
          {isDivisionMember && (
            <div className="flex justify-end mt-2">
              <Button onClick={handleRequestReview} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Request Review'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
