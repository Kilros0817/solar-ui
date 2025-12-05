import { 
  FileText
} from 'lucide-react';

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  lastUsed: string | null;
  usageCount: number;
  icon: any;
  isBlank: boolean;
  createdDate: string;
  lastModified: string;
  createdBy: string;
  tags: string[];
  estimatedTime: string;
  complexity: 'simple' | 'moderate' | 'complex';
  status: 'active' | 'draft' | 'deprecated';
}

export const contractTemplates: ContractTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Document',
    description: 'Start with a completely blank contract document',
    category: 'Custom',
    lastUsed: null,
    usageCount: 0,
    icon: FileText,
    isBlank: true,
    createdDate: '2024-01-01',
    lastModified: '2024-01-01',
    createdBy: 'System',
    tags: ['custom', 'blank'],
    estimatedTime: '30-60 min',
    complexity: 'simple',
    status: 'active'
  },
  {
    id: 'software-license',
    name: 'Software License Agreement',
    description: 'Standard software licensing terms for enterprise clients',
    category: 'Technology',
    lastUsed: '2024-12-01',
    usageCount: 15,
    icon: FileText,
    isBlank: false,
    createdDate: '2024-03-15',
    lastModified: '2024-11-28',
    createdBy: 'Sarah Johnson',
    tags: ['software', 'licensing', 'enterprise', 'SaaS'],
    estimatedTime: '45-90 min',
    complexity: 'moderate',
    status: 'active'
  },
  {
    id: 'service-agreement',
    name: 'Service Level Agreement',
    description: 'Professional services agreement with SLA terms',
    category: 'Services',
    lastUsed: '2024-11-28',
    usageCount: 8,
    icon: FileText,
    isBlank: false,
    createdDate: '2024-02-20',
    lastModified: '2024-11-25',
    createdBy: 'Mike Chen',
    tags: ['services', 'SLA', 'professional', 'support'],
    estimatedTime: '60-120 min',
    complexity: 'moderate',
    status: 'active'
  },
  {
    id: 'partnership',
    name: 'Partnership Agreement',
    description: 'Business partnership and collaboration agreement',
    category: 'Business',
    lastUsed: '2024-11-25',
    usageCount: 12,
    icon: FileText,
    isBlank: false,
    createdDate: '2024-01-10',
    lastModified: '2024-11-20',
    createdBy: 'Emma Davis',
    tags: ['partnership', 'collaboration', 'business', 'joint-venture'],
    estimatedTime: '90-180 min',
    complexity: 'complex',
    status: 'active'
  },
  {
    id: 'consulting',
    name: 'Consulting Agreement',
    description: 'Independent contractor and consulting services',
    category: 'Services',
    lastUsed: '2024-11-20',
    usageCount: 22,
    icon: FileText,
    isBlank: false,
    createdDate: '2024-02-05',
    lastModified: '2024-11-18',
    createdBy: 'Alex Rodriguez',
    tags: ['consulting', 'contractor', 'independent', 'services'],
    estimatedTime: '30-60 min',
    complexity: 'simple',
    status: 'active'
  },
  {
    id: 'vendor',
    name: 'Vendor Agreement',
    description: 'Supply chain and vendor relationship contract',
    category: 'Procurement',
    lastUsed: '2024-11-15',
    usageCount: 6,
    icon: FileText,
    isBlank: false,
    createdDate: '2024-04-12',
    lastModified: '2024-11-10',
    createdBy: 'Sarah Johnson',
    tags: ['vendor', 'procurement', 'supply-chain', 'purchasing'],
    estimatedTime: '45-90 min',
    complexity: 'moderate',
    status: 'active'
  },
  {
    id: 'employment',
    name: 'Employment Contract',
    description: 'Standard employment agreement template',
    category: 'HR',
    lastUsed: '2024-11-10',
    usageCount: 18,
    icon: FileText,
    isBlank: false,
    createdDate: '2024-01-20',
    lastModified: '2024-11-05',
    createdBy: 'Emma Davis',
    tags: ['employment', 'HR', 'hiring', 'full-time'],
    estimatedTime: '30-45 min',
    complexity: 'simple',
    status: 'active'
  },
  {
    id: 'nda',
    name: 'Non-Disclosure Agreement',
    description: 'Confidentiality and non-disclosure terms',
    category: 'Legal',
    lastUsed: '2024-12-05',
    usageCount: 31,
    icon: FileText,
    isBlank: false,
    createdDate: '2024-01-05',
    lastModified: '2024-12-01',
    createdBy: 'Mike Chen',
    tags: ['NDA', 'confidentiality', 'non-disclosure', 'privacy'],
    estimatedTime: '15-30 min',
    complexity: 'simple',
    status: 'active'
  },
  {
    id: 'international',
    name: 'International Sales Agreement',
    description: 'Cross-border sales and distribution contract',
    category: 'Sales',
    lastUsed: '2024-10-28',
    usageCount: 4,
    icon: FileText,
    isBlank: false,
    createdDate: '2024-06-15',
    lastModified: '2024-10-25',
    createdBy: 'Alex Rodriguez',
    tags: ['international', 'sales', 'distribution', 'cross-border'],
    estimatedTime: '120-240 min',
    complexity: 'complex',
    status: 'active'
  },
  {
    id: 'maintenance',
    name: 'Maintenance & Support Agreement',
    description: 'Ongoing maintenance and technical support contract',
    category: 'Technology',
    lastUsed: '2024-11-12',
    usageCount: 9,
    icon: FileText,
    isBlank: false,
    createdDate: '2024-05-08',
    lastModified: '2024-11-08',
    createdBy: 'Sarah Johnson',
    tags: ['maintenance', 'support', 'technical', 'ongoing'],
    estimatedTime: '60-90 min',
    complexity: 'moderate',
    status: 'active'
  }
];

export const templateCategories = [
  'All Templates',
  'Technology', 
  'Services', 
  'Business', 
  'Procurement', 
  'HR', 
  'Legal',
  'Sales',
  'Custom'
];

export const complexityColors = {
  simple: 'bg-green-100 text-green-800 border-green-200',
  moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  complex: 'bg-red-100 text-red-800 border-red-200'
};

export const statusColors = {
  active: 'bg-green-100 text-green-800 border-green-200',
  draft: 'bg-blue-100 text-blue-800 border-blue-200',
  deprecated: 'bg-gray-100 text-gray-800 border-gray-200'
};