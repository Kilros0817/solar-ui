// Centralized mock data for contracts across all components

export interface Contract {
  id: number;
  name: string;
  client: string;
  status: 'draft' | 'pending' | 'approved' | 'revision' | 'archived';
  lastModified: string;
  owner: string;
  priority?: 'high' | 'medium' | 'low';
  value?: string;
}

// Legal division - sees all contracts
export const allContracts: Contract[] = [
  { id: 1, name: 'Software License Agreement', client: 'TechCorp Inc.', status: 'approved', lastModified: '2 days ago', owner: 'Sarah Johnson', value: '$125,000' },
  { id: 2, name: 'Service Agreement', client: 'InnovateLabs', status: 'pending', lastModified: '1 day ago', owner: 'Mike Chen', priority: 'high', value: '$85,000' },
];

// Division Lead - sees only contracts assigned to their division
export const divisionLeadContracts: Contract[] = [
  { id: 1, name: 'Software License Agreement', client: 'TechCorp Inc.', status: 'approved', lastModified: '2 days ago', owner: 'Jennifer Taylor', value: '$125,000' },
  { id: 2, name: 'Service Agreement', client: 'InnovateLabs', status: 'pending', lastModified: '1 day ago', owner: 'Jennifer Taylor', priority: 'high', value: '$85,000' },
];

// Division Member - sees only contracts assigned to them
export const divisionMemberContracts: Contract[] = [
  { id: 1, name: 'Software License Agreement', client: 'TechCorp Inc.', status: 'approved', lastModified: '2 days ago', owner: 'David Kim', value: '$125,000' },
  { id: 2, name: 'Service Agreement', client: 'InnovateLabs', status: 'pending', lastModified: '1 day ago', owner: 'David Kim', priority: 'high', value: '$85,000' },
];

// Project Owner - sees only contracts they own/sponsor
export const ownerContracts: Contract[] = [
  { id: 1, name: 'Software License Agreement', client: 'TechCorp Inc.', status: 'approved', lastModified: '2 days ago', owner: 'Michael Roberts', value: '$250,000' },
  { id: 2, name: 'Service Agreement', client: 'InnovateLabs', status: 'pending', lastModified: '1 day ago', owner: 'Michael Roberts', priority: 'high', value: '$85,000' },
];

// Helper functions to get counts
export const getContractsByStatus = (contracts: Contract[], status: string) => {
  if (status === 'all') return contracts;
  return contracts.filter(c => c.status === status);
};

export const getContractCounts = (contracts: Contract[]) => {
  return {
    all: contracts.length,
    draft: contracts.filter(c => c.status === 'draft').length,
    pending: contracts.filter(c => c.status === 'pending').length,
    approved: contracts.filter(c => c.status === 'approved').length,
    revision: contracts.filter(c => c.status === 'revision').length,
    archived: contracts.filter(c => c.status === 'archived').length,
  };
};