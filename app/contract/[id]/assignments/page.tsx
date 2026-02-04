'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useConnection } from 'wagmi';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ArrowLeft, FileText, Loader2, ClipboardList, Building2, Eye } from 'lucide-react';
import { getContractById, getCurrentUserProfile } from '@/utils/subgraph';
import { DIVISION_LABELS, USER_ROLE, URLs } from '@/utils/constants';
import { useUser } from '@/app/contexts/UserContext';
import type { SectionWithDivision } from '@/app/data/interfaces';

export default function ContractAssignmentsPage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useConnection();
  const { userRole } = useUser();
  const contractId = params.id ? String(params.id) : '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contractTitle, setContractTitle] = useState('');
  const [contractClient, setContractClient] = useState('');
  const [divisionLabel, setDivisionLabel] = useState('');
  const [sections, setSections] = useState<Array<{ index: number; name: string }>>([]);

  useEffect(() => {
    const allowed = userRole === USER_ROLE.DIVISION_LEADER || userRole === USER_ROLE.DIVISION_MEMBER;
    if (userRole !== null && !allowed) {
      router.replace('/my-contracts');
      return;
    }
  }, [userRole, router]);

  useEffect(() => {
    if (!contractId || !address) {
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
        const client = doc.client;
        const clientName = client
          ? [client.firstName, client.lastName].filter(Boolean).join(' ') || (client as { email?: string }).email || ''
          : '';
        setContractTitle(doc.title || 'Untitled');
        setContractClient(clientName);

        const rawSections: SectionWithDivision[] = (doc.sections ?? []).map((s: any, i: number) => ({
          index: i,
          divisionLeader: s?.divisionLeader,
        }));
        const mySections = rawSections.filter(
          (s) => s.divisionLeader?.dcategory != null && Number(s.divisionLeader.dcategory) === leaderDcategory
        );

        if (doc.cid) {
          try {
            const res = await fetch(`${URLs.TBGateWay}${doc.cid}`);
            if (res.ok) {
              const data = await res.json();
              setSections(
                mySections.map((s) => ({
                  index: s.index,
                  name: data.sections?.[s.index]?.sectionName ?? `Section ${s.index + 1}`,
                }))
              );
            } else {
              setSections(mySections.map((s) => ({ index: s.index, name: `Section ${s.index + 1}` })));
            }
          } catch {
            setSections(mySections.map((s) => ({ index: s.index, name: `Section ${s.index + 1}` })));
          }
        } else {
          setSections(mySections.map((s) => ({ index: s.index, name: `Section ${s.index + 1}` })));
        }
      } catch (e) {
        console.error('Failed to load contract assignments:', e);
        setError('Failed to load contract.');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [contractId, address]);

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
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 cursor-pointer"
                    onClick={() => router.push(`/contract/${contractId}/assignments/section/${s.index}`)}
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
