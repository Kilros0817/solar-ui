'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useConnection } from 'wagmi';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Label } from '@/app/components/ui/label';
import { ArrowLeft, FileText, Loader2, UserPlus } from 'lucide-react';
import { getContractById, getCurrentUserProfile, getDivisionMembersByDivisionId } from '@/utils/subgraph';
import { DIVISION_LABELS, USER_ROLE, URLs } from '@/utils/constants';
import { useUser } from '@/app/contexts/UserContext';
import type { Clause, DocSection, DivisionMember } from '@/app/data/interfaces';

const getMemberLabel = (m: DivisionMember) =>
  [m.firstName, m.lastName].filter(Boolean).join(' ').trim() || m.email || m.id;

export default function SectionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useConnection();
  const { userRole } = useUser();
  const contractId = params.id ? String(params.id) : '';
  const sectionIndex = params.sectionIndex != null ? Number(params.sectionIndex) : -1;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contractTitle, setContractTitle] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [divisionLabel, setDivisionLabel] = useState('');
  const [members, setMembers] = useState<DivisionMember[]>([]);
  const [clauseAssignments, setClauseAssignments] = useState<Record<string, string>>({});

  useEffect(() => {
    const allowed = userRole === USER_ROLE.DIVISION_LEADER || userRole === USER_ROLE.DIVISION_MEMBER;
    if (userRole !== null && !allowed) {
      router.replace('/my-contracts');
      return;
    }
  }, [userRole, router]);

  useEffect(() => {
    if (!contractId || sectionIndex < 0 || !address) {
      if (!address) setLoading(false);
      return;
    }
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profile, doc] = await Promise.all([
          getCurrentUserProfile(address),
          getContractById(contractId),
        ]);
        if (!profile?.dcategory || Number(profile.dcategory) === 0) {
          setError('You are not assigned to a division.');
          return;
        }
        if (!doc) {
          setError('Contract not found.');
          return;
        }
        const leaderDcategory = Number(profile.dcategory);
        setDivisionLabel(DIVISION_LABELS[leaderDcategory] ?? `Division #${leaderDcategory}`);
        setContractTitle(doc.title || 'Untitled');

        const memberList = await getDivisionMembersByDivisionId(leaderDcategory);
        setMembers(Array.isArray(memberList) ? memberList : []);

        const rawSections = doc.sections ?? [];
        const sectionAt = rawSections[sectionIndex];
        const sectionDcategory = sectionAt?.divisionLeader?.dcategory != null
          ? Number(sectionAt.divisionLeader.dcategory)
          : null;
        if (sectionDcategory !== leaderDcategory) {
          setError('This section is not assigned to your division.');
          return;
        }

        if (doc.cid) {
          try {
            const res = await fetch(`${URLs.TBGateWay}${doc.cid}`);
            if (res.ok) {
              const data = await res.json();
              const sections: DocSection[] = data.sections ?? [];
              const section = sections[sectionIndex];
              if (section) {
                setSectionName(section.sectionName ?? `Section ${sectionIndex + 1}`);
                const clauseList = section.sectionContent?.filter((c) => c.clauseContent) ?? [];
                setClauses(clauseList);
              } else {
                setSectionName(`Section ${sectionIndex + 1}`);
                setClauses([]);
              }
            } else {
              setSectionName(`Section ${sectionIndex + 1}`);
              setClauses([]);
            }
          } catch {
            setSectionName(`Section ${sectionIndex + 1}`);
            setClauses([]);
          }
        } else {
          setSectionName(`Section ${sectionIndex + 1}`);
          setClauses([]);
        }
      } catch (e) {
        console.error('Failed to load section:', e);
        setError('Failed to load section.');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [contractId, sectionIndex, address]);

  const assignmentsPath = `/contract/${contractId}/assignments`;

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
        <Button variant="ghost" onClick={() => router.push(assignmentsPath)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to sections
        </Button>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" onClick={() => router.push(assignmentsPath)} className="gap-2">
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
    </div>
  );
}
