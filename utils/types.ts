export type ClauseWithSection = {
  id: string;
  cid?: string;
  status?: number;
  assignedAt?: string;
  doc?: {
    id: string;
    title?: string;
    status?: number;
    client?: { firstName?: string; lastName?: string };
  };
  section?: {
    id: string;
    status?: number;
  };
};

export type PendingClauseMember = {
  id: string;
  status: number;
  doc: { id: string; title?: string };
  section: { id: string };
};

export type DivisionMember = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

export type ReviewClauseLeader = {
  id: string;
  cid?: string | null;
  status: number;
  sectionId: string;
  doc: { id: string; title?: string };
  section: { id: string };
  divisionMember?: DivisionMember | null;
};

export type ApprovedClauseLeader = {
  id: string;
  cid?: string | null;
  status: number;
  sectionId: string;
  section: { id: string; doc: { id: string; title?: string } };
  divisionMember?: DivisionMember | null;
};

export type RejectedClauseLeader = {
  id: string;
  cid?: string | null;
  status: number;
  sectionId: string;
  section: { id: string; doc: { id: string; title?: string } };
  divisionMember?: DivisionMember | null;
};

export type PendingClauseLeader = {
  id: string;
  cid?: string | null;
  status: number;
  sectionId: string;
  section: { id: string; doc: { id: string; title?: string } };
  divisionMember?: DivisionMember | null;
};

export type ClauseWithStatus = {
  id: string;
  status: number;
  cid?: string | null;
  division_member?: DivisionMember | null;
};
