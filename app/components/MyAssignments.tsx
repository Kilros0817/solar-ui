'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConnection } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { FileText, Loader2, Eye, ClipboardList, AlertCircle } from 'lucide-react';
import { getCurrentUserProfile, getAllContracts, getContractById } from '@/utils/subgraph';
import { DIVISION_LABELS, USER_ROLE } from '@/utils/constants';
import { useUser } from '@/app/contexts/UserContext';

type ContractAssignment = {
  id: string;
  title: string;
  client: string;
  sectionCount: number;
};

export function MyAssignments() {
  const router = useRouter();
  const { address } = useConnection();
  const { userRole } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [divisionLabel, setDivisionLabel] = useState('');
  const [contracts, setContracts] = useState<ContractAssignment[]>([]);

  useEffect(() => {
    if (userRole !== null && userRole !== USER_ROLE.DIVISION_MEMBER) {
      router.replace('/my-contracts');
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
          setContracts([]);
          setLoading(false);
          return;
        }
        const memberDcategory = Number(profile.dcategory);
        setDivisionLabel(DIVISION_LABELS[memberDcategory] ?? `Division #${memberDcategory}`);

        const docs = await getAllContracts();
        const docList = Array.isArray(docs) ? docs.slice(0, 50) : [];
        const details = await Promise.all(docList.map((d: { id: string }) => getContractById(d.id)));
        const withSectionsForDivision: ContractAssignment[] = [];
        docList.forEach((_d: { id: string }, i: number) => {
          const doc = details[i];
          if (!doc?.sections) return;
          const sectionsForDivision = doc.sections.filter(
            (s: { divisionLeader?: { dcategory?: number } }) =>
              s?.divisionLeader?.dcategory != null && Number(s.divisionLeader.dcategory) === memberDcategory
          );
          if (sectionsForDivision.length === 0) return;
          const client = doc.client;
          const clientName = client
            ? [client.firstName, client.lastName].filter(Boolean).join(' ') || (client as { email?: string }).email || ''
            : '';
          withSectionsForDivision.push({
            id: String(doc.id),
            title: doc.title || 'Untitled',
            client: clientName,
            sectionCount: sectionsForDivision.length,
          });
        });
        setContracts(withSectionsForDivision);
      } catch (e) {
        console.error('Failed to load assignments:', e);
        setError('Failed to load assignments.');
        setContracts([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [address]);

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
        <h1 className="text-3xl font-bold">My Assignments</h1>
        <p className="text-muted-foreground">Sections and clauses assigned to your division</p>
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
      <div>
        <h1 className="text-3xl font-bold">My Assignments</h1>
        <p className="text-muted-foreground mt-1">
          Contracts with sections assigned to your division ({divisionLabel})
        </p>
      </div>

      {contracts.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="font-medium">No assignments yet</p>
            <p className="text-sm text-muted-foreground">
              When your division is assigned contract sections, they will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{contracts.length} contract{contracts.length !== 1 ? 's' : ''}</Badge>
          </div>
          <div className="grid gap-4">
            {contracts.map((c) => (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-brand-secondary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-brand-secondary" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-lg truncate">{c.title}</CardTitle>
                        <CardDescription className="truncate">{c.client || '—'}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline">{c.sectionCount} section{c.sectionCount !== 1 ? 's' : ''}</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => router.push(`/contract/${c.id}/assignments`)}
                        title="View sections"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
