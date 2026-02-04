'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConfig, useConnection } from 'wagmi';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Label } from '@/app/components/ui/label';
import { ArrowLeft, FileText, Loader2, UserPlus } from 'lucide-react';
import { getDivisionMembersByDivisionId } from '@/utils/subgraph';
import { assignClausesToMembers } from '@/utils/interact';
import { useContractDoc } from '@/app/contexts/ContractDocContext';
import { useAssignment } from '@/app/contexts/AssignmentContext';
import { DIVISION_LABELS, USER_ROLE, URLs } from '@/utils/constants';
import { useUser } from '@/app/contexts/UserContext';
import { toast } from 'sonner';
import { zeroAddress } from 'viem';
import type { Clause, DocSection, DivisionMember } from '@/app/data/interfaces';

const getMemberLabel = (m: DivisionMember) =>
  [m.firstName, m.lastName].filter(Boolean).join(' ').trim() || m.email || m.id;

export default function AssignmentSectionPage() {
  const router = useRouter();
  const config = useConfig();
  const { address } = useConnection();
  const { userRole } = useUser();
  const { selectedContractId, selectedSectionIndex } = useAssignment();
  const { profile, loadDoc, getDoc, loadingDocId, loadingProfile, error: contextError, refetchDoc } = useContractDoc();
  const contractId = selectedContractId ?? '';
  const sectionIndex = selectedSectionIndex ?? -1;
  const [sectionName, setSectionName] = useState('');
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [members, setMembers] = useState<DivisionMember[]>([]);
  const [clauseAssignments, setClauseAssignments] = useState<Record<string, string>>({});
  const [assigning, setAssigning] = useState(false);
  const [sectionIdFromSubgraph, setSectionIdFromSubgraph] = useState<number | null>(null);
  const [sectionContentLoaded, setSectionContentLoaded] = useState(false);

  useEffect(() => {
    const allowed = userRole === USER_ROLE.DIVISION_LEADER || userRole === USER_ROLE.DIVISION_MEMBER;
    if (userRole !== null && !allowed) {
      router.replace('/my-contracts');
      return;
    }
  }, [userRole, router]);

  useEffect(() => {
    if (!selectedContractId || selectedSectionIndex == null || selectedSectionIndex < 0) {
      router.replace('/assignments');
      return;
    }
    loadDoc(selectedContractId);
  }, [selectedContractId, selectedSectionIndex, loadDoc, router]);

  useEffect(() => {
    setSectionIdFromSubgraph(null);
    setSectionContentLoaded(false);
  }, [contractId, sectionIndex]);

  const doc = contractId ? getDoc(contractId) : undefined;
  const loading =
    loadingDocId === contractId ||
    (contractId && doc === undefined) ||
    (profile === undefined && loadingProfile);

  const notInDivision = profile === null && !loadingProfile;
  const docNotFound = contractId && doc === null;
  const rawSections = doc?.sections ?? [];
  const sectionAt = rawSections[sectionIndex];
  const leaderDcategory = profile?.dcategory ?? 0;
  const sectionDcategory =
    sectionAt?.divisionLeader?.dcategory != null ? Number(sectionAt.divisionLeader.dcategory) : null;
  const sectionNotForDivision =
    doc && profile != null && sectionDcategory !== leaderDcategory;

  const error =
    contextError ??
    (notInDivision ? 'You are not assigned to a division.' : null) ??
    (docNotFound ? 'Contract not found.' : null) ??
    (sectionNotForDivision ? 'This section is not assigned to your division.' : null);

  const contractTitle = doc?.title ?? 'Untitled';
  const divisionLabel = profile ? (DIVISION_LABELS[profile.dcategory] ?? `Division #${profile.dcategory}`) : '';

  useEffect(() => {
    if (!doc || profile == null || sectionIndex < 0) return;
    const leaderDcategoryNum = profile.dcategory;
    getDivisionMembersByDivisionId(leaderDcategoryNum).then((memberList) => {
      setMembers(Array.isArray(memberList) ? memberList : []);
    });
  }, [doc, profile, sectionIndex]);

  useEffect(() => {
    if (!doc || sectionIndex < 0) return;
    const rawSections = doc.sections ?? [];
    const sec = rawSections[sectionIndex];
    const subgraphSectionId = sec?.id != null ? Number(sec.id) : null;
    if (subgraphSectionId != null && !Number.isNaN(subgraphSectionId)) {
      setSectionIdFromSubgraph(subgraphSectionId);
    }
  }, [doc, sectionIndex]);

  useEffect(() => {
    if (!doc || sectionContentLoaded) return;
    if (!doc.cid) {
      setSectionName(`Section ${sectionIndex + 1}`);
      setClauses([]);
      setSectionContentLoaded(true);
      return;
    }
    fetch(`${URLs.TBGateWay}${doc.cid}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const sections: DocSection[] = data?.sections ?? [];
        const section = sections[sectionIndex];
        if (section) {
          setSectionName(section.sectionName ?? `Section ${sectionIndex + 1}`);
          setClauses(section.sectionContent?.filter((c) => c.clauseContent) ?? []);
        } else {
          setSectionName(`Section ${sectionIndex + 1}`);
          setClauses([]);
        }
      })
      .catch(() => {
        setSectionName(`Section ${sectionIndex + 1}`);
        setClauses([]);
      })
      .finally(() => setSectionContentLoaded(true));
  }, [doc, sectionIndex, sectionContentLoaded]);

  const handleAssign = async () => {
    if (!config || !address || clauses.length === 0 || sectionIdFromSubgraph == null) return;
    setAssigning(true);
    const assignedDate = new Date().toISOString();
    try {
      const divisionMembers = clauses.map((c) => {
        const memberId = clauseAssignments[c.clauseId];
        if (!memberId) return zeroAddress;
        const member = members.find((m) => m.id === memberId);
        return member?.id ?? zeroAddress;
      });

      const clausePayloads = clauses.map((c) => {
        const memberId = clauseAssignments[c.clauseId];
        const divisionMemberAddress = memberId
          ? (members.find((m) => m.id === memberId)?.id ?? zeroAddress)
          : zeroAddress;
        return {
          clauseId: c.clauseId,
          clauseContent: c.clauseContent,
          divisionMemberAddress,
          assignedDate,
        };
      });

      const uploadRes = await fetch(`${URLs.UploadAPI}/clauses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clauses: clausePayloads }),
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        toast.error(uploadData.error ?? 'Failed to upload clause assignments');
        return;
      }
      const clauseCids = uploadData.clauseCids as string[];
      if (!Array.isArray(clauseCids) || clauseCids.length !== clauses.length) {
        toast.error('Invalid response from upload');
        return;
      }

      const sectionId = sectionIdFromSubgraph;
      const success = await assignClausesToMembers(
        config,
        address,
        sectionId,
        divisionMembers,
        clauseCids
      );
      if (success) {
        toast.success('Assignments submitted successfully');
        await refetchDoc(contractId);
      } else {
        toast.error('Failed to submit assignments');
      }
    } catch (e) {
      console.error('Assign error:', e);
      toast.error(e instanceof Error ? e.message : 'Failed to submit assignments');
    } finally {
      setAssigning(false);
    }
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

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <Button variant="ghost" onClick={() => router.push('/assignments')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to sections
        </Button>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" onClick={() => router.push('/assignments')} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to sections
      </Button>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-brand-secondary/10 flex items-center justify-center shrink-0">
          <FileText className="h-6 w-6 text-brand-secondary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{contractTitle}</p>
          <p className="text-xs text-muted-foreground">{divisionLabel}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{sectionName}</CardTitle>
          <p className="text-sm text-muted-foreground">Section {sectionIndex + 1}</p>
        </CardHeader>
        <CardContent>
          {clauses.length === 0 ? (
            <p className="text-muted-foreground py-4">No content available for this section.</p>
          ) : (
            <div className="space-y-4">
              {clauses.map((clause, i) => (
                <div
                  key={clause.clauseId || i}
                  className="rounded-lg border bg-muted/30 p-4 space-y-3"
                >
                  <p className="text-sm leading-relaxed text-foreground">
                    {clause.clauseContent}
                  </p>
                  {userRole === USER_ROLE.DIVISION_LEADER && (
                    <div className="flex items-center gap-3 pt-2 border-t">
                      <UserPlus className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Label className="text-xs text-muted-foreground">Assign to</Label>
                        <Select
                          value={clauseAssignments[clause.clauseId] ?? 'unassigned'}
                          onValueChange={(v) =>
                            setClauseAssignments((prev) => ({
                              ...prev,
                              [clause.clauseId]: v === 'unassigned' ? '' : v,
                            }))
                          }
                        >
                          <SelectTrigger className="mt-1 max-w-[240px]">
                            <SelectValue placeholder="Select member" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {members.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {getMemberLabel(m)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {userRole === USER_ROLE.DIVISION_LEADER && (
        <div className="flex justify-end">
          <Button
            onClick={handleAssign}
            disabled={assigning || clauses.length === 0 || sectionIdFromSubgraph == null}
            className="bg-brand-secondary hover:bg-[var(--brand-secondary-hover)] text-white"
          >
            {assigning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
