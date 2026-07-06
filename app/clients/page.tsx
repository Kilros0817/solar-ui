'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Users, Loader2, Search } from 'lucide-react';
import { useUser } from '@/app/contexts/UserContext';
import { USER_ROLE } from '@/utils/constants';
import { getAllClients } from '@/utils/postgres';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';

type ClientUser = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

export default function ClientsPage() {
  const router = useRouter();
  const { userRole } = useUser();
  const [clients, setClients] = useState<ClientUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const canAccess = userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.LEGAL_TEAM;

  useEffect(() => {
    if (userRole !== null && !canAccess) {
      router.replace('/dashboard');
      return;
    }
  }, [userRole, canAccess, router]);

  useEffect(() => {
    if (!canAccess) return;
    setLoading(true);
    getAllClients()
      .then((list) => setClients(Array.isArray(list) ? list : []))
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, [canAccess]);

  const filteredClients = clients.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const name = [c.firstName, c.lastName].filter(Boolean).join(' ').toLowerCase();
    const email = (c.email ?? '').toLowerCase();
    return name.includes(term) || email.includes(term) || (c.id ?? '').toLowerCase().includes(term);
  });

  if (userRole !== null && !canAccess) {
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
        <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Users with client role (role value 5)
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-md border border-input bg-input-background px-3 h-10 max-w-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 focus-within:ring-offset-2 transition-colors outline-none">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 p-0 h-auto min-w-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent shadow-none"
        />
      </div>

      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="font-medium">No clients found</p>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'No clients match your search.' : 'No users with client role exist yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="font-semibold py-4">Name</TableHead>
                <TableHead className="font-semibold py-4">Email</TableHead>
                <TableHead className="font-semibold py-4">Address (ID)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="py-4 font-medium">
                    {[c.firstName, c.lastName].filter(Boolean).join(' ') || '—'}
                  </TableCell>
                  <TableCell className="py-4 text-muted-foreground">{c.email ?? '—'}</TableCell>
                  <TableCell className="py-4 text-muted-foreground font-mono text-xs">
                    {c.id}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
