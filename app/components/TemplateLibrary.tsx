import { ClauseTemplateCreator } from './ClauseTemplateCreator';
import { SectionTemplateCreator } from './SectionTemplateCreator';
import { ContractTemplateCreator } from './ContractTemplateCreator';
import { TemplatePreviewModal } from './TemplatePreviewModal';
import { ConfirmDialog } from './ConfirmDialog';
import { toast } from 'sonner';
import { useState } from 'react';
import { 
  FileText, 
  Search, 
  Clock, 
  TrendingUp,
  Eye,
  Plus,
  Layers,
  Text,
  Edit,
  Copy,
  Trash2,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from './ui/dropdown-menu';
import { useUser } from '../contexts/UserContext';
import { USER_ROLE } from '@/utils/constants';
import { ContractTemplate } from '../data/templates';

interface TemplateLibraryProps {
  onSelectContractTemplate?: (template: ContractTemplate) => void;
}

export function TemplateLibrary({ onSelectContractTemplate }: TemplateLibraryProps) {
  const { userRole } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  // For division users, default to 'sections' tab since they can't access contracts
  const isDivisionUser = userRole === USER_ROLE.DIVISION_LEADER || userRole === USER_ROLE.DIVISION_MEMBER;
  const [activeTab, setActiveTab] = useState(isDivisionUser ? 'sections' : 'contracts');
  const [showClauseCreator, setShowClauseCreator] = useState(false);
  const [showSectionCreator, setShowSectionCreator] = useState(false);
  const [showContractCreator, setShowContractCreator] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<ContractTemplate | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<ContractTemplate | null>(null);
  const [editingClause, setEditingClause] = useState<any>(null);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [editingContract, setEditingContract] = useState<ContractTemplate | null>(null);

  // Contract Templates
  const [contractTemplates, setContractTemplates] = useState<ContractTemplate[]>([
    {
      id: 'blank',
      name: 'Blank Contract',
      description: 'Start from scratch with a blank document',
      category: 'General',
      icon: FileText,
      usageCount: 0,
      isBlank: true,
      lastUsed: null,
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      createdBy: 'System',
      tags: [],
      estimatedTime: '30-60 min',
      complexity: 'simple',
      status: 'active'
    },
    {
      id: 'service-agreement',
      name: 'Service Agreement',
      description: 'Standard service agreement for professional services',
      category: 'Services',
      icon: FileText,
      usageCount: 234,
      lastUsed: '2 days ago',
      isBlank: false,
      createdDate: '2024-01-15',
      lastModified: '2024-12-01',
      createdBy: 'System',
      tags: ['services', 'agreement'],
      estimatedTime: '45-90 min',
      complexity: 'moderate',
      status: 'active'
    },
    {
      id: 'nda',
      name: 'Non-Disclosure Agreement',
      description: 'Protect confidential information and trade secrets',
      category: 'Legal',
      icon: FileText,
      usageCount: 189,
      lastUsed: '1 week ago',
      isBlank: false,
      createdDate: '2024-01-10',
      lastModified: '2024-11-25',
      createdBy: 'System',
      tags: ['legal', 'nda', 'confidentiality'],
      estimatedTime: '30-60 min',
      complexity: 'simple',
      status: 'active'
    },
    {
      id: 'employment',
      name: 'Employment Contract',
      description: 'Comprehensive employment agreement template',
      category: 'HR',
      icon: FileText,
      usageCount: 156,
      lastUsed: '3 days ago',
      isBlank: false,
      createdDate: '2024-01-20',
      lastModified: '2024-11-28',
      createdBy: 'System',
      tags: ['hr', 'employment'],
      estimatedTime: '60-120 min',
      complexity: 'complex',
      status: 'active'
    },
    {
      id: 'saas-agreement',
      name: 'SaaS Agreement',
      description: 'Software as a Service subscription agreement',
      category: 'Technology',
      icon: FileText,
      usageCount: 143,
      lastUsed: '5 days ago',
      isBlank: false,
      createdDate: '2024-02-01',
      lastModified: '2024-11-26',
      createdBy: 'System',
      tags: ['saas', 'technology', 'subscription'],
      estimatedTime: '45-90 min',
      complexity: 'moderate',
      status: 'active'
    },
    {
      id: 'vendor-agreement',
      name: 'Vendor Agreement',
      description: 'Agreement with suppliers and vendors',
      category: 'Procurement',
      icon: FileText,
      usageCount: 127,
      lastUsed: '1 week ago',
      isBlank: false,
      createdDate: '2024-02-10',
      lastModified: '2024-11-24',
      createdBy: 'System',
      tags: ['procurement', 'vendor', 'supplier'],
      estimatedTime: '45-90 min',
      complexity: 'moderate',
      status: 'active'
    },
    {
      id: 'partnership',
      name: 'Partnership Agreement',
      description: 'Business partnership and collaboration agreement',
      category: 'Business',
      icon: FileText,
      usageCount: 98,
      lastUsed: '2 weeks ago',
      isBlank: false,
      createdDate: '2024-02-15',
      lastModified: '2024-11-20',
      createdBy: 'System',
      tags: ['partnership', 'business'],
      estimatedTime: '60-120 min',
      complexity: 'complex',
      status: 'active'
    },
    {
      id: 'consulting',
      name: 'Consulting Agreement',
      description: 'Independent contractor and consulting services',
      category: 'Services',
      icon: FileText,
      usageCount: 176,
      lastUsed: '4 days ago',
      isBlank: false,
      createdDate: '2024-02-20',
      lastModified: '2024-11-27',
      createdBy: 'System',
      tags: ['consulting', 'contractor', 'services'],
      estimatedTime: '30-60 min',
      complexity: 'simple',
      status: 'active'
    },
    {
      id: 'lease',
      name: 'Commercial Lease',
      description: 'Commercial property lease agreement',
      category: 'Real Estate',
      icon: FileText,
      usageCount: 87,
      lastUsed: '1 week ago',
      isBlank: false,
      createdDate: '2024-03-01',
      lastModified: '2024-11-24',
      createdBy: 'System',
      tags: ['lease', 'real-estate', 'commercial'],
      estimatedTime: '60-120 min',
      complexity: 'complex',
      status: 'active'
    },
    {
      id: 'license',
      name: 'License Agreement',
      description: 'Software or IP licensing agreement',
      category: 'Technology',
      icon: FileText,
      usageCount: 134,
      lastUsed: '6 days ago',
      isBlank: false,
      createdDate: '2024-03-15',
      lastModified: '2024-11-25',
      createdBy: 'System',
      tags: ['license', 'technology', 'ip'],
      estimatedTime: '45-90 min',
      complexity: 'moderate',
      status: 'active'
    }
  ]);

  // Section Templates
  const [sectionTemplates, setSectionTemplates] = useState({
    'Terms & Conditions': [
      {
        id: 'tc-v1',
        name: 'Standard Terms',
        description: 'General terms for standard business agreements',
        content: 'This version includes standard terms and conditions covering general business agreements, including payment terms, delivery obligations, and basic warranties. Suitable for most commercial contracts.',
        usageCount: 145,
        category: 'General'
      },
      {
        id: 'tc-v2',
        name: 'Enterprise Terms',
        description: 'Comprehensive terms for enterprise-level deals',
        content: 'Enhanced terms designed for large enterprise agreements with extended warranty provisions, detailed service levels, escalation procedures, and comprehensive liability clauses.',
        usageCount: 89,
        category: 'Enterprise'
      },
      {
        id: 'tc-v3',
        name: 'Simplified Terms',
        description: 'Streamlined terms for quick agreements',
        content: 'A concise version with essential terms only, ideal for straightforward transactions, small-value contracts, or recurring agreements with established partners.',
        usageCount: 67,
        category: 'SMB'
      }
    ],
    'Pricing & Payment Terms': [
      {
        id: 'pp-v1',
        name: 'Fixed Price',
        description: 'Single upfront or milestone-based payments',
        content: 'Fixed pricing structure with defined payment schedule. Includes provisions for milestone-based payments, late payment penalties, and early payment discounts.',
        usageCount: 203,
        category: 'Pricing'
      },
      {
        id: 'pp-v2',
        name: 'Subscription Model',
        description: 'Recurring payments with auto-renewal',
        content: 'Subscription-based pricing with monthly or annual billing cycles. Includes automatic renewal clauses, price adjustment mechanisms, and cancellation policies.',
        usageCount: 124,
        category: 'Pricing'
      },
      {
        id: 'pp-v3',
        name: 'Performance-Based',
        description: 'Variable pricing tied to outcomes',
        content: 'Performance-based pricing with variable components tied to specific KPIs and deliverables. Includes bonus structures and penalty clauses.',
        usageCount: 56,
        category: 'Pricing'
      }
    ],
    'Termination Clauses': [
      {
        id: 'term-v1',
        name: 'Standard Termination',
        description: 'Balanced termination rights',
        content: 'Balanced termination provisions with notice periods, termination for cause, and convenience termination options. Includes wind-down procedures and transition assistance.',
        usageCount: 201,
        category: 'Legal'
      },
      {
        id: 'term-v2',
        name: 'Customer-Favorable',
        description: 'Enhanced customer exit rights',
        content: 'Customer-favorable termination terms with shorter notice periods, liberal termination for convenience, and flexible exit provisions.',
        usageCount: 87,
        category: 'Legal'
      },
      {
        id: 'term-v3',
        name: 'Vendor-Favorable',
        description: 'Restrictive termination conditions',
        content: 'Vendor-favorable terms with longer notice periods, limited termination rights, and substantial termination fees.',
        usageCount: 54,
        category: 'Legal'
      }
    ],
    'Intellectual Property': [
      {
        id: 'ip-v1',
        name: 'Customer Ownership',
        description: 'Customer owns all deliverables',
        content: 'Full transfer of IP rights to customer for all work product and deliverables. Vendor retains only pre-existing IP and general methodologies.',
        usageCount: 143,
        category: 'Legal'
      },
      {
        id: 'ip-v2',
        name: 'Shared IP Rights',
        description: 'Joint ownership of developed IP',
        content: 'Shared intellectual property rights with clear allocation between customer-specific and general use components. Includes cross-licensing provisions.',
        usageCount: 76,
        category: 'Legal'
      },
      {
        id: 'ip-v3',
        name: 'License Model',
        description: 'Vendor retains IP, customer gets license',
        content: 'Vendor retains ownership of all IP with customer receiving a license to use. Defines scope of license and permitted uses.',
        usageCount: 119,
        category: 'Legal'
      }
    ],
    'Data Privacy & Security': [
      {
        id: 'dps-v1',
        name: 'Standard Security',
        description: 'Basic security and privacy requirements',
        content: 'Standard security provisions including encryption, access controls, security incident procedures, and basic privacy protections.',
        usageCount: 167,
        category: 'Compliance'
      },
      {
        id: 'dps-v2',
        name: 'Enhanced Security',
        description: 'Comprehensive security framework',
        content: 'Comprehensive security requirements including ISO 27001 compliance, penetration testing, security audits, and enhanced encryption standards.',
        usageCount: 112,
        category: 'Compliance'
      },
      {
        id: 'dps-v3',
        name: 'Zero Trust Model',
        description: 'Advanced zero-trust security architecture',
        content: 'Advanced security provisions based on zero-trust principles. Includes continuous verification, micro-segmentation, and least privilege access.',
        usageCount: 45,
        category: 'Compliance'
      }
    ],
    'Service Level Agreements': [
      {
        id: 'sla-v1',
        name: 'Basic SLA',
        description: 'Standard availability and support',
        content: 'Basic SLA with 99% uptime guarantee, business hours support, and standard response times. Includes basic performance metrics.',
        usageCount: 178,
        category: 'Service'
      },
      {
        id: 'sla-v2',
        name: 'Enterprise SLA',
        description: 'Premium service levels with 24/7 support',
        content: 'Enterprise-grade SLA with 99.9% uptime, 24/7 premium support, dedicated account management, and priority response times.',
        usageCount: 134,
        category: 'Service'
      },
      {
        id: 'sla-v3',
        name: 'Mission Critical',
        description: 'Maximum uptime and rapid response',
        content: 'Mission-critical SLA with 99.99% uptime guarantee, instant response times, dedicated support team, and proactive monitoring.',
        usageCount: 61,
        category: 'Service'
      }
    ],
    'Liability & Insurance': [
      {
        id: 'li-v1',
        name: 'Balanced Liability',
        description: 'Mutual liability caps and limitations',
        content: 'Balanced liability provisions with reciprocal caps, standard indemnification, and reasonable insurance requirements.',
        usageCount: 192,
        category: 'Legal'
      },
      {
        id: 'li-v2',
        name: 'Limited Liability',
        description: 'Vendor-favorable liability limitations',
        content: 'Vendor-favorable liability caps with broad exclusions and limited indemnification. Minimal insurance requirements.',
        usageCount: 83,
        category: 'Legal'
      },
      {
        id: 'li-v3',
        name: 'Uncapped Liability',
        description: 'No caps for certain breach types',
        content: 'Comprehensive liability with uncapped exposure for IP infringement, data breaches, and gross negligence. Substantial insurance requirements.',
        usageCount: 58,
        category: 'Legal'
      }
    ]
  });

  // Clause Templates
  const clauseTemplates = [
    {
      id: 'c1',
      name: 'Force Majeure',
      description: 'Protection for unforeseeable circumstances',
      content: 'Neither party shall be liable for any failure or delay in performing its obligations under this Agreement where such failure or delay results from any cause beyond the reasonable control of that party.',
      category: 'Risk Management',
      usageCount: 312
    },
    {
      id: 'c2',
      name: 'Confidentiality Obligation',
      description: 'Standard confidentiality requirements',
      content: 'Each party agrees to maintain the confidentiality of all Confidential Information disclosed by the other party and to use such information solely for the purposes of this Agreement.',
      category: 'Legal',
      usageCount: 289
    },
    {
      id: 'c3',
      name: 'Non-Solicitation',
      description: 'Prevent employee poaching',
      content: 'During the term of this Agreement and for a period of twelve (12) months thereafter, neither party shall directly or indirectly solicit for employment any employee of the other party.',
      category: 'Legal',
      usageCount: 156
    },
    {
      id: 'c4',
      name: 'Limitation of Liability',
      description: 'Cap on liability exposure',
      content: 'In no event shall either party\'s aggregate liability exceed the total amount paid under this Agreement in the twelve (12) months preceding the claim.',
      category: 'Risk Management',
      usageCount: 267
    },
    {
      id: 'c5',
      name: 'Governing Law',
      description: 'Jurisdiction and applicable law',
      content: 'This Agreement shall be governed by and construed in accordance with the laws of [Jurisdiction], without regard to its conflict of law provisions.',
      category: 'Legal',
      usageCount: 401
    },
    {
      id: 'c6',
      name: 'Assignment Rights',
      description: 'Control over contract assignment',
      content: 'Neither party may assign this Agreement without the prior written consent of the other party, except in the case of a merger or acquisition.',
      category: 'Legal',
      usageCount: 198
    },
    {
      id: 'c7',
      name: 'Audit Rights',
      description: 'Right to audit compliance',
      content: 'Customer shall have the right, upon reasonable notice, to audit Vendor\'s compliance with the terms of this Agreement, including security and data protection measures.',
      category: 'Compliance',
      usageCount: 134
    },
    {
      id: 'c8',
      name: 'Warranties & Representations',
      description: 'Standard business warranties',
      content: 'Each party represents and warrants that it has full power and authority to enter into this Agreement and that its performance will not violate any other agreement.',
      category: 'Legal',
      usageCount: 356
    },
    {
      id: 'c9',
      name: 'Indemnification',
      description: 'Mutual indemnification provisions',
      content: 'Each party agrees to indemnify and hold harmless the other party from any claims, damages, or expenses arising from its breach of this Agreement or negligent acts.',
      category: 'Risk Management',
      usageCount: 278
    },
    {
      id: 'c10',
      name: 'Data Protection',
      description: 'GDPR-compliant data handling',
      content: 'Vendor shall process personal data only in accordance with Customer\'s written instructions and comply with all applicable data protection laws including GDPR.',
      category: 'Compliance',
      usageCount: 223
    },
    {
      id: 'c11',
      name: 'Dispute Resolution',
      description: 'Escalation and arbitration process',
      content: 'Any disputes shall first be subject to good-faith negotiation. If unresolved within 30 days, disputes shall be resolved through binding arbitration.',
      category: 'Legal',
      usageCount: 187
    },
    {
      id: 'c12',
      name: 'Amendment Process',
      description: 'How to modify the agreement',
      content: 'This Agreement may only be amended by written agreement signed by authorized representatives of both parties.',
      category: 'Legal',
      usageCount: 245
    },
    {
      id: 'c13',
      name: 'Severability',
      description: 'Invalid provisions don\'t void contract',
      content: 'If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.',
      category: 'Legal',
      usageCount: 298
    },
    {
      id: 'c14',
      name: 'Entire Agreement',
      description: 'Supersedes prior agreements',
      content: 'This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements.',
      category: 'Legal',
      usageCount: 334
    },
    {
      id: 'c15',
      name: 'Notice Provisions',
      description: 'How to provide official notices',
      content: 'All notices under this Agreement shall be in writing and sent to the addresses specified herein via email or certified mail.',
      category: 'Administrative',
      usageCount: 267
    }
  ];

  const contractCategories = ['all', 'Services', 'Legal', 'HR', 'Technology', 'Procurement', 'Business', 'Real Estate'];
  const sectionCategories = ['all', 'General', 'Enterprise', 'SMB', 'Pricing', 'Legal', 'Compliance', 'Service'];
  const clauseCategories = ['all', 'Legal', 'Risk Management', 'Compliance', 'Administrative'];

  const filteredContractTemplates = contractTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredSectionTemplates = Object.entries(sectionTemplates).reduce((acc, [sectionName, versions]) => {
    const filteredVersions = versions.filter(version => {
      const matchesSearch = sectionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           version.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           version.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || version.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    if (filteredVersions.length > 0) {
      (acc as Record<string, typeof versions>)[sectionName] = filteredVersions;
    }
    return acc;
  }, {} as Record<string, typeof sectionTemplates[keyof typeof sectionTemplates]>);

  const filteredClauseTemplates = clauseTemplates.filter(clause => {
    const matchesSearch = clause.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         clause.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         clause.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || clause.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Prepare section data for contract creator
      const sectionDataForContractCreator = Object.entries(sectionTemplates).map(([sectionName, versions]) => ({
        sectionName,
        versions: versions.map((v: typeof versions[0]) => ({ id: v.id, name: v.name, description: v.description, category: v.category }))
      }));

  const handleSaveClause = (clause: any) => {
    console.log('New clause template:', clause);
    // In a real app, this would save to a database
  };

  const handleSaveSection = (section: any) => {
    console.log('New section template:', section);
    
    // Generate content from selected clauses
    const content = section.selectedClauses
      .map((clause: any) => clause.content)
      .join('\n\n');
    
    if (editingSection) {
      // Update existing section version
      setSectionTemplates(prev => {
        const sectionName = section.sectionName || editingSection.sectionName || 'Custom Section';
        
        if ((prev as Record<string, any>)[sectionName]) {
          return {
            ...prev,
            [sectionName]: ((prev as Record<string, any>)[sectionName] as typeof prev[keyof typeof prev]).map((v: any) => 
              v.id === editingSection.id 
                ? {
                    ...v,
                    name: section.versionName,
                    description: section.description,
                    content: content || 'No content provided',
                    category: section.category,
                    selectedClauses: section.selectedClauses,
                  }
                : v
            )
          };
        }
        return prev;
      });
      
      toast.success(`Section template "${section.versionName}" updated successfully!`);
      setEditingSection(null);
    } else {
      // Create new section version
      const newSectionVersion = {
        id: `section-${Date.now()}`,
        name: section.versionName,
        description: section.description,
        content: content || 'No content provided',
        usageCount: 0,
        category: section.category,
        selectedClauses: section.selectedClauses,
      };
      
      // Add to existing section or create new section group
      setSectionTemplates(prev => {
        const sectionName = section.sectionName || 'Custom Section';
        
        if ((prev as Record<string, any>)[sectionName]) {
          // Add to existing section group
          return {
            ...prev,
            [sectionName]: [...((prev as Record<string, any>)[sectionName] as typeof prev[keyof typeof prev]), newSectionVersion]
          };
        } else {
          // Create new section group
          return {
            ...prev,
            [sectionName]: [newSectionVersion]
          };
        }
      });
      
      toast.success(`Section template "${section.versionName}" created successfully!`);
    }
    
    setShowSectionCreator(false);
  };

  const handleSaveContract = (contract: any) => {
    console.log('New contract template:', contract);
    
    if (editingContract) {
      // Update existing contract
      setContractTemplates(prev => 
        prev.map(t => t.id === editingContract.id 
          ? {
              ...t,
              name: contract.name,
              description: contract.description,
              category: contract.category,
              icon: FileText,
              lastModified: new Date().toISOString(),
            }
          : t
        )
      );
      toast.success(`Contract template "${contract.name}" updated successfully.`);
      setEditingContract(null);
    } else {
      // Create new contract template
      const newContract: ContractTemplate = {
        id: `contract-${Date.now()}`,
        name: contract.name,
        description: contract.description,
        category: contract.category,
        icon: FileText,
        usageCount: 0,
        lastUsed: null,
        isBlank: false,
        createdDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        createdBy: 'System',
        tags: [],
        estimatedTime: '30-60 min',
        complexity: 'simple',
        status: 'active'
      };
      
      setContractTemplates(prev => [...prev, newContract]);
      toast.success(`Contract template "${contract.name}" created successfully.`);
    }
    
    setShowContractCreator(false);
  };

  const handlePreviewTemplate = (template: ContractTemplate) => {
    setPreviewTemplate(template);
  };

  const handleDeleteTemplate = (template: ContractTemplate) => {
    setDeleteTemplate(template);
  };

  const handleConfirmDelete = () => {
    if (deleteTemplate) {
      // In a real app, this would delete from a database
      toast.success(`Template "${deleteTemplate.name}" deleted successfully.`);
      setDeleteTemplate(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteTemplate(null);
  };

  const handlePreviewSection = (section: any) => {
    console.log('Preview section:', section);
    // In a real app, this would open a preview modal
  };

  const handleEditSection = (section: any) => {
    console.log('Edit section:', section);
    // Find which section name this version belongs to
    const sectionName = Object.entries(sectionTemplates).find(([name, versions]) => 
      versions.some(v => v.id === section.id)
    )?.[0];
    
    setEditingSection({
      ...section,
      sectionName: sectionName,
    });
    setShowSectionCreator(true);
    toast.info(`Editing: ${section.name}`);
  };

  const handleCopySection = (section: any) => {
    console.log('Copy section:', section);
    // In a real app, this would create a copy of the section
  };

  const handleDeleteSection = (section: any) => {
    console.log('Delete section:', section);
    // In a real app, this would delete the section
  };

  const handlePreviewClause = (clause: any) => {
    console.log('Preview clause:', clause);
    toast.info(`Previewing: ${clause.name}`);
    // In a real app, this would open a preview modal
  };

  const handleEditClause = (clause: any) => {
    console.log('Edit clause:', clause);
    setEditingClause(clause);
    setShowClauseCreator(true);
    toast.info(`Editing: ${clause.name}`);
    // In a real app, this would open an edit modal
  };

  const handleCopyClause = (clause: any) => {
    console.log('Copy clause:', clause);
    toast.success(`Created copy of "${clause.name}"`);
    // In a real app, this would create a copy of the clause
  };

  const handleDeleteClause = (clause: any) => {
    console.log('Delete clause:', clause);
    toast.success(`Deleted "${clause.name}"`);
    // In a real app, this would delete the clause
  };

  const handleEditContract = (contract: ContractTemplate) => {
    console.log('Edit contract:', contract);
    setEditingContract(contract);
    setShowContractCreator(true);
    toast.info(`Editing: ${contract.name}`);
    // In a real app, this would open an edit modal
  };

  return (
    <>
    <TooltipProvider>
      <div className="p-6 space-y-6">
        <div>
          <h1>Template Library</h1>
          <p className="text-muted-foreground">
            Manage and organize your contract, section, and clause templates
          </p>
        </div>

        {/* Creators */}
        {showClauseCreator && (
          <ClauseTemplateCreator
            onClose={() => {
              setShowClauseCreator(false);
              setEditingClause(null);
            }}
            onSave={handleSaveClause}
            editingClause={editingClause}
          />
        )}
        {showSectionCreator && (
          <SectionTemplateCreator
            onClose={() => {
              setShowSectionCreator(false);
              setEditingSection(null);
            }}
            onSave={handleSaveSection}
            availableClauses={clauseTemplates}
            editingSection={editingSection}
          />
        )}
        {showContractCreator && (
          <ContractTemplateCreator
            onClose={() => {
              setShowContractCreator(false);
              setEditingContract(null);
            }}
            onSave={handleSaveContract}
            availableSections={sectionDataForContractCreator}
            editingContract={editingContract}
          />
        )}

        <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setSelectedCategory('all'); }}>
          <TabsList className={`grid w-full max-w-md ${isDivisionUser ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {!isDivisionUser && (
              <TabsTrigger value="contracts" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Contract Templates
              </TabsTrigger>
            )}
            <TabsTrigger value="sections" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Section Templates
            </TabsTrigger>
            <TabsTrigger value="clauses" className="flex items-center gap-2">
              <Text className="h-4 w-4" />
              Clause Templates
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 space-y-4">
            {/* Search and Filter */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${activeTab}...`}
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Category:</span>
                <div className="flex flex-wrap gap-2">
                  {(activeTab === 'contracts' ? contractCategories : 
                    activeTab === 'sections' ? sectionCategories : 
                    clauseCategories).map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className={selectedCategory === category ? 'bg-brand-secondary hover:bg-[var(--brand-secondary-hover)] border-brand-secondary text-white' : ''}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Contract Templates Tab */}
            <TabsContent value="contracts" className="space-y-4 mt-6">
              <div className="flex justify-end mb-4">
                <Button onClick={() => setShowContractCreator(true)} className="bg-brand-secondary hover:bg-[var(--brand-secondary-hover)] text-white border-brand-secondary">
                  <Plus className="h-4 w-4 mr-2" />
                  New Contract Template
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredContractTemplates.map(template => (
                  <Card key={template.id} className="hover:shadow-lg transition-all group">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-muted group-hover:bg-brand-primary/20 transition-colors">
                            <template.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {template.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {template.description}
                      </p>
                      {!template.isBlank && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{template.lastUsed}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>{template.usageCount} uses</span>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => {
                            if (onSelectContractTemplate) {
                              // Convert to full ContractTemplate format
                              const fullTemplate: ContractTemplate = {
                                ...template,
                                lastUsed: template.lastUsed || null,
                                isBlank: template.isBlank || false,
                                createdDate: new Date().toISOString(),
                                lastModified: new Date().toISOString(),
                                createdBy: 'System',
                                tags: [],
                                estimatedTime: '30-60 min',
                                complexity: 'simple',
                                status: 'active'
                              };
                              onSelectContractTemplate(fullTemplate);
                            } else {
                              handlePreviewTemplate(template);
                            }
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {onSelectContractTemplate ? 'Use Template' : 'Preview'}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditContract(template)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => handleDeleteTemplate(template)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Section Templates Tab */}
            <TabsContent value="sections" className="space-y-6 mt-6">
              <div className="flex justify-end mb-4">
                <Button onClick={() => setShowSectionCreator(true)} className="bg-brand-secondary hover:bg-[var(--brand-secondary-hover)] text-white border-brand-secondary">
                  <Plus className="h-4 w-4 mr-2" />
                  New Section Template
                </Button>
              </div>
              {Object.entries(filteredSectionTemplates).map(([sectionName, versions]) => (
                <Card key={sectionName}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-brand-primary/20">
                          <Layers className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle>{sectionName}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {versions.length} version{versions.length !== 1 ? 's' : ''} available
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Version
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {versions.map(version => (
                        <div key={version.id} className="border rounded-lg p-4 hover:bg-brand-primary/5 hover:border-brand-secondary transition-all group relative">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="font-medium text-sm mb-1">{version.name}</div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {version.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3 mb-3">
                            <Badge variant="outline" className="text-xs">
                              {version.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {version.usageCount} uses
                            </span>
                          </div>
                          <div className="flex gap-2 pt-2 border-t">
                            <HoverCard openDelay={200}>
                              <HoverCardTrigger asChild>
                                <Button size="sm" variant="outline" className="flex-1 text-xs h-8" onClick={() => handlePreviewSection(version)}>
                                  <Eye className="h-3 w-3 mr-1" />
                                  Preview
                                </Button>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-96" side="right">
                                <div className="space-y-3">
                                  <div>
                                    <h4 className="font-medium">{version.name}</h4>
                                    <p className="text-sm text-muted-foreground">{version.description}</p>
                                  </div>
                                  <div className="pt-2 border-t">
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Content Preview:</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      {version.content}
                                    </p>
                                  </div>
                                  <div className="pt-2 border-t flex items-center justify-between">
                                    <Badge variant="outline" className="text-xs">{version.category}</Badge>
                                    <span className="text-xs text-muted-foreground">
                                      Used in {version.usageCount} contracts
                                    </span>
                                  </div>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" className="text-xs h-8">
                                  Actions
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditSection(version)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCopySection(version)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" onClick={() => handleDeleteSection(version)}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Clause Templates Tab */}
            <TabsContent value="clauses" className="space-y-4 mt-6">
              <div className="flex justify-end mb-4">
                <Button onClick={() => setShowClauseCreator(true)} className="bg-brand-secondary hover:bg-[var(--brand-secondary-hover)] text-white border-brand-secondary">
                  <Plus className="h-4 w-4 mr-2" />
                  New Clause Template
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredClauseTemplates.map(clause => (
                  <Card key={clause.id} className="hover:shadow-md transition-all group">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Text className="h-4 w-4 text-muted-foreground" />
                            <CardTitle className="text-sm">{clause.name}</CardTitle>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {clause.description}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {clause.content}
                      </p>
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="text-xs">
                          {clause.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {clause.usageCount} uses
                        </span>
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        <HoverCard openDelay={200}>
                          <HoverCardTrigger asChild>
                            <Button size="sm" variant="outline" className="flex-1 text-xs h-8" onClick={() => handlePreviewClause(clause)}>
                              <Eye className="h-3 w-3 mr-1" />
                              Preview
                            </Button>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-[500px]" side="right">
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-medium flex items-center gap-2">
                                  <Text className="h-4 w-4" />
                                  {clause.name}
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1">{clause.description}</p>
                              </div>
                              <div className="pt-2 border-t">
                                <p className="text-xs font-medium text-muted-foreground mb-2">Full Clause Text:</p>
                                <p className="text-sm text-foreground leading-relaxed bg-muted/50 p-3 rounded">
                                  {clause.content}
                                </p>
                              </div>
                              <div className="pt-2 border-t flex items-center justify-between">
                                <Badge variant="outline">{clause.category}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  Used in {clause.usageCount} contracts
                                </span>
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="text-xs h-8">
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClause(clause)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyClause(clause)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => handleDeleteClause(clause)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </TooltipProvider>

    {/* Template Preview Modal */}
    {previewTemplate && (
      <TemplatePreviewModal
        template={previewTemplate}
        type="contract"
        onClose={() => setPreviewTemplate(null)}
      />
    )}

    {/* Confirm Delete Dialog */}
    {deleteTemplate && (
      <ConfirmDialog
        title="Delete Template"
        description={`Are you sure you want to delete the template "${deleteTemplate.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    )}
    </>
  );
}