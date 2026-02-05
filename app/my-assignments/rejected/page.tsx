'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConnection } from 'wagmi';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { ArrowLeft, FileText, Loader2, Pencil, AlertCircle } from 'lucide-react';
import { getCurrentUserProfile, getContractsByDivisionMember, getContractById } from '@/utils/subgraph';
import { DIVISION_LABELS, USER_ROLE } from '@/utils/constants';
import { useUser } from '@/app/contexts/UserContext';
import { useAssignment } from '@/app/contexts/AssignmentContext';

type RejectedClause = {
  id: string;
  status: number;
  section: { id: string; doc: { id: string; title?: string } };
};

export default function RejectedTasksPage() {
  const router = useRouter();
  const { address } = useConnection();
  const { userRole } = useUser();
  const { setSelection } = useAssignment();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [divisionLabel, setDivisionLabel] = useState('');
  const [rejected, setRejected] = useState<RejectedClause[]>([]);
  const [workingOnId, setWorkingOnId] = useState<string | null>(null);

  useEffect(() => {
    if (userRole !== null && userRole !== USER_ROLE.DIVISION_MEMBER) {
      router.replace('/my-assignments');
      return;
    }
  }, [userRole, router]);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const profile = await getCurrentUserProfile(address);
        if (!profile?.dcategory || Number(profile.dcategory) === 0) {
          setError('You are not assigned to a division.');
          setRejected([]);
          setLoading(false);
          return;
        }
        const memberDcategory = Number(profile.dcategory);
        setDivisionLabel(DIVISION_LABELS[memberDcategory] ?? `Division #${memberDcategory}`);

        const clauses = await getContractsByDivisionMember(address);
        const list = Array.isArray(clauses) ? clauses : [];
        const rejectedOnly = list.filter((c: { status?: number }) => c.status === 3) as RejectedClause[];
        setRejected(rejectedOnly);
      } catch (e) {
        console.error('Failed to load rejected tasks:', e);
        setError('Failed to load rejected tasks.');
        setRejected([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [address]);

  const handleWorkOn = async (item: RejectedClause) => {
    const contractId = item.section?.doc?.id;
    const sectionId = item.section?.id;
    const clauseId = item.id;
    if (!contractId || !sectionId || !clauseId) return;
    setWorkingOnId(item.id);
    try {
      const doc = await getContractById(contractId);
      const sections = (doc as { sections?: Array<{ id?: string; clauses?: Array<{ id?: string }> }> })?.sections ?? [];
      const secIdx = sections.findIndex((s) => String(s.id) === String(sectionId));
      if (secIdx < 0) {
        setWorkingOnId(null);
        return;
      }
      const clauseIdx = sections[secIdx]?.clauses?.findIndex((c) => String(c.id) === String(clauseId)) ?? -1;
      if (clauseIdx < 0) {
        setWorkingOnId(null);
        return;
      }
      setSelection(contractId, secIdx, clauseIdx);
      router.push('/assignments/clause');
    } catch (e) {
      console.error('Failed to open clause:', e);
    } finally {
      setWorkingOnId(null);
    }
  };

  if (userRole !== null && userRole !== USER_ROLE.DIVISION_MEMBER) {
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
        <h1 className="text-3xl font-bold">Rejected</h1>
        <Card>
          <CardContent className="py-12 flex items-center justify-center gap-3 text-muted-foreground">
            <AlertCircle className="h-10 w-10" />
            <span>{error}</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" onClick={() => router.push('/my-assignments')} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to My Assignments
      </Button>

      <div>
        <h1 className="text-3xl font-bold">Rejected</h1>
        <p className="text-muted-foreground mt-1">
          Clauses returned for revision ({divisionLabel})
        </p>
      </div>

      {rejected.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="font-medium">No rejected clauses</p>
            <p className="text-sm text-muted-foreground">
              Clauses rejected by your division leader will appear here for you to revise and resubmit.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, 400px)' }}>
          {rejected.map((item) => (
            <Card key={item.id} className="flex flex-col w-full">
              <CardContent className="p-4 flex flex-col gap-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {item.section?.doc?.title ?? 'Untitled'}
                  </span>
                  <Badge variant="destructive" className="shrink-0">
                    Rejected
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Section ID: {item.section?.id ?? '—'}
                </p>
                <div className="flex justify-end mt-auto pt-2 border-t">
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-1.5 shrink-0"
                    disabled={workingOnId === item.id}
                    onClick={() => handleWorkOn(item)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {workingOnId === item.id ? 'Opening...' : 'Work on'}
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
