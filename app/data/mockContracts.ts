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
  { id: 1, name: 'Software License Agreement', client: 'TechCorp Inc.', status: 'approved', lastModified: '2 days ago', owner: 'Sarah Johnson' },
  { id: 2, name: 'Service Agreement', client: 'InnovateLabs', status: 'pending', lastModified: '1 day ago', owner: 'Mike Chen', priority: 'high' },
  { id: 3, name: 'Partnership Agreement', client: 'GlobalTech', status: 'pending', lastModified: '3 hours ago', owner: 'Emma Davis', priority: 'medium' },
  { id: 4, name: 'Consulting Agreement', client: 'StartupXYZ', status: 'revision', lastModified: '5 days ago', owner: 'Alex Rodriguez' },
  { id: 5, name: 'NDA Agreement', client: 'SecureSystems', status: 'approved', lastModified: '1 week ago', owner: 'Sarah Johnson' },
  { id: 6, name: 'Employment Contract', client: 'Internal HR', status: 'draft', lastModified: '2 hours ago', owner: 'Mike Chen' },
  { id: 7, name: 'Vendor Agreement', client: 'SupplyChain Inc', status: 'approved', lastModified: '3 days ago', owner: 'Emma Davis' },
  { id: 8, name: 'SaaS Agreement', client: 'CloudProvider', status: 'pending', lastModified: '1 day ago', owner: 'Sarah Johnson', priority: 'high' },
  { id: 9, name: 'License Renewal', client: 'TechCorp Inc.', status: 'approved', lastModified: '1 week ago', owner: 'Alex Rodriguez' },
  { id: 10, name: 'Marketing Partnership', client: 'BrandCo', status: 'pending', lastModified: '4 hours ago', owner: 'Mike Chen', priority: 'medium' },
  { id: 11, name: 'Data Processing Agreement', client: 'Analytics Pro', status: 'approved', lastModified: '5 days ago', owner: 'Emma Davis' },
  { id: 12, name: 'Maintenance Contract', client: 'FacilityMgmt', status: 'pending', lastModified: '2 days ago', owner: 'Sarah Johnson' },
  { id: 13, name: 'Distribution Agreement', client: 'LogisticsHub', status: 'approved', lastModified: '1 week ago', owner: 'Alex Rodriguez' },
  { id: 14, name: 'Joint Venture Agreement', client: 'PartnerCorp', status: 'draft', lastModified: '6 hours ago', owner: 'Mike Chen' },
  { id: 15, name: 'Franchise Agreement', client: 'RetailGroup', status: 'pending', lastModified: '3 days ago', owner: 'Emma Davis', priority: 'low' },
];

// Division Lead - sees only contracts assigned to their division
export const divisionLeadContracts: Contract[] = [
  { id: 2, name: 'Service Agreement', client: 'InnovateLabs', status: 'pending', lastModified: '1 day ago', owner: 'Jennifer Taylor', priority: 'high' },
  { id: 3, name: 'Partnership Agreement', client: 'GlobalTech', status: 'pending', lastModified: '3 hours ago', owner: 'Jennifer Taylor', priority: 'medium' },
  { id: 8, name: 'SaaS Agreement', client: 'CloudProvider', status: 'pending', lastModified: '1 day ago', owner: 'Jennifer Taylor', priority: 'high' },
  { id: 10, name: 'Marketing Partnership', client: 'BrandCo', status: 'approved', lastModified: '4 hours ago', owner: 'Jennifer Taylor', priority: 'medium' },
  { id: 11, name: 'Data Processing Agreement', client: 'Analytics Pro', status: 'approved', lastModified: '5 days ago', owner: 'Jennifer Taylor' },
  { id: 12, name: 'Maintenance Contract', client: 'FacilityMgmt', status: 'pending', lastModified: '2 days ago', owner: 'Jennifer Taylor' },
  { id: 15, name: 'Franchise Agreement', client: 'RetailGroup', status: 'approved', lastModified: '3 days ago', owner: 'Jennifer Taylor', priority: 'low' },
  { id: 16, name: 'Enterprise License', client: 'MegaCorp', status: 'approved', lastModified: '1 week ago', owner: 'Jennifer Taylor' },
  { id: 17, name: 'Vendor Service Contract', client: 'SupplyPartner', status: 'approved', lastModified: '4 days ago', owner: 'Jennifer Taylor' },
  { id: 18, name: 'Consulting Services', client: 'AdvisoryFirm', status: 'approved', lastModified: '2 weeks ago', owner: 'Jennifer Taylor' },
  { id: 19, name: 'Software Subscription', client: 'DevTools Inc', status: 'approved', lastModified: '1 week ago', owner: 'Jennifer Taylor' },
  { id: 20, name: 'Partnership MOU', client: 'AllianceGroup', status: 'pending', lastModified: '5 hours ago', owner: 'Jennifer Taylor', priority: 'medium' },
];

// Division Member - sees only contracts assigned to them
export const divisionMemberContracts: Contract[] = [
  { id: 2, name: 'Service Agreement', client: 'InnovateLabs', status: 'pending', lastModified: '1 day ago', owner: 'David Kim', priority: 'high' },
  { id: 8, name: 'SaaS Agreement', client: 'CloudProvider', status: 'pending', lastModified: '1 day ago', owner: 'David Kim', priority: 'high' },
  { id: 10, name: 'Marketing Partnership', client: 'BrandCo', status: 'approved', lastModified: '4 hours ago', owner: 'David Kim', priority: 'medium' },
  { id: 11, name: 'Data Processing Agreement', client: 'Analytics Pro', status: 'approved', lastModified: '5 days ago', owner: 'David Kim' },
  { id: 15, name: 'Franchise Agreement', client: 'RetailGroup', status: 'approved', lastModified: '3 days ago', owner: 'David Kim', priority: 'low' },
  { id: 16, name: 'Enterprise License', client: 'MegaCorp', status: 'approved', lastModified: '1 week ago', owner: 'David Kim' },
  { id: 17, name: 'Vendor Service Contract', client: 'SupplyPartner', status: 'approved', lastModified: '4 days ago', owner: 'David Kim' },
  { id: 20, name: 'Partnership MOU', client: 'AllianceGroup', status: 'pending', lastModified: '5 hours ago', owner: 'David Kim', priority: 'medium' },
];

// Project Owner - sees only contracts they own/sponsor
export const ownerContracts: Contract[] = [
  { id: 1, name: 'Software License Agreement', client: 'TechCorp Inc.', status: 'approved', lastModified: '2 days ago', owner: 'Michael Roberts', value: '$250,000' },
  { id: 3, name: 'Partnership Agreement', client: 'GlobalTech', status: 'pending', lastModified: '3 hours ago', owner: 'Michael Roberts', priority: 'high', value: '$500,000' },
  { id: 7, name: 'Vendor Agreement', client: 'SupplyChain Inc', status: 'approved', lastModified: '3 days ago', owner: 'Michael Roberts', value: '$75,000' },
  { id: 8, name: 'SaaS Agreement', client: 'CloudProvider', status: 'pending', lastModified: '1 day ago', owner: 'Michael Roberts', priority: 'medium', value: '$180,000' },
  { id: 9, name: 'License Renewal', client: 'TechCorp Inc.', status: 'approved', lastModified: '1 week ago', owner: 'Michael Roberts', value: '$250,000' },
  { id: 14, name: 'Joint Venture Agreement', client: 'PartnerCorp', status: 'pending', lastModified: '6 hours ago', owner: 'Michael Roberts', priority: 'high', value: '$1,200,000' },
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