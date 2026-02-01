// Centralized mock data for contracts across all components
// Status: 0=PENDING, 1=DIVISION_REQUEST, 2=APPROVED, 3=COMPLETED

const STATUS_LABEL_TO_NUM: Record<string, number> = {
  pending: 0,
  'division-request': 1,
  approved: 2,
  completed: 3,
};

export interface Contract {
  id: number;
  title: string;
  client: string;
  status: number; // 0-based from subgraph: PENDING, DIVISION_REQUEST, APPROVED, COMPLETED
  createdAt: number;
  category: string; // division category from subgraph
  cid?: string; // IPFS CID for document content
}

// Helper functions to get counts (status is number: 0=PENDING, 1=DIVISION_REQUEST, 2=APPROVED, 3=COMPLETED)
export const getContractsByStatus = (contracts: Contract[], status: string) => {
  if (status === 'all') return contracts;
  const statusNum = STATUS_LABEL_TO_NUM[status.toLowerCase()] ?? parseInt(status, 10);
  if (isNaN(statusNum)) return contracts;
  return contracts.filter(c => c.status === statusNum);
};

export const getContractCounts = (contracts: Contract[]) => {
  return {
    all: contracts.length,
    pending: contracts.filter(c => c.status === 0).length,
    divisionRequest: contracts.filter(c => c.status === 1).length,
    approved: contracts.filter(c => c.status === 2).length,
    completed: contracts.filter(c => c.status === 3).length,
  };
};