'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { 
  ArrowLeft,
  Clock,
  CheckCircle,
  Building,
  X,
  FileText,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Eye
} from 'lucide-react';
import { ContractTemplate } from '../data/templates';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';
import { DIVISION_CATEGORY } from '@/utils/constants';

interface ContractCreationProps {
  onBack: () => void;
  onCreateContract: (contractData: any) => void;
  selectedTemplate: ContractTemplate;
}

export function ContractCreation({ onBack, onCreateContract, selectedTemplate }: ContractCreationProps) {
  const [contractDetails, setContractDetails] = useState({
    title: '',
    client: '',
    description: '',
    value: '',
    assignee: '',
    priority: 'medium',
    involvedDivisions: [] as string[],
    contractSections: [] as Array<{
      id: string;
      name: string;
      versionId: string;
      versionName: string;
      assignedDivision: string | null;
    }>
  });

  const [openSectionType, setOpenSectionType] = useState<string | null>(null);

  const formatCurrency = (value: string) => {
    // Remove all non-digit characters
    const numericValue = value.replace(/\D/g, '');
    
    // If empty, return empty string
    if (!numericValue) return '';
    
    // Convert to number and format with commas
    const number = parseInt(numericValue, 10);
    return `$${number.toLocaleString('en-US')}`;
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatCurrency(inputValue);
    setContractDetails({...contractDetails, value: formattedValue});
  };

  // Division labels mapping
  const divisionLabels: Record<number, string> = {
    [DIVISION_CATEGORY.LEGAL]: 'Legal',
    [DIVISION_CATEGORY.PROJECT_MANAGEMENT]: 'Project Management',
    [DIVISION_CATEGORY.PRECONSTRUCTION]: 'Preconstruction',
    [DIVISION_CATEGORY.ESTIMATING]: 'Estimating',
    [DIVISION_CATEGORY.FINANCE]: 'Finance',
    [DIVISION_CATEGORY.ACCOUNTING]: 'Accounting',
    [DIVISION_CATEGORY.RISK_MANAGEMENT]: 'Risk Management',
    [DIVISION_CATEGORY.INSURANCE]: 'Insurance',
    [DIVISION_CATEGORY.SAFETY]: 'Safety',
  };

  // Get all divisions except NO_DIVISION
  const availableDivisions = Object.entries(DIVISION_CATEGORY)
    .filter(([_, value]) => value !== DIVISION_CATEGORY.NO_DIVISION)
    .map(([_, value]) => divisionLabels[value as number])
    .filter(Boolean); // Remove any undefined values

  const defaultContractSections = [
    'Terms & Conditions',
    'Pricing & Payment Terms',
    'Technical Specifications',
    'Legal Compliance',
    'Delivery & Timeline',
    'Termination Clauses',
    'Intellectual Property',
    'Data Privacy & Security',
    'Service Level Agreements',
    'Liability & Insurance'
  ];

  // Section library with different versions for each section type
  const sectionLibrary: Record<string, Array<{
    id: string;
    name: string;
    description: string;
    content: string;
    usageCount: number;
  }>> = {
    'Terms & Conditions': [
      {
        id: 'tc-v1',
        name: 'Standard Terms',
        description: 'General terms for standard business agreements',
        content: 'This version includes standard terms and conditions covering general business agreements, including payment terms, delivery obligations, and basic warranties. Suitable for most commercial contracts.',
        usageCount: 145
      },
      {
        id: 'tc-v2',
        name: 'Enterprise Terms',
        description: 'Comprehensive terms for enterprise-level deals',
        content: 'Enhanced terms designed for large enterprise agreements with extended warranty provisions, detailed service levels, escalation procedures, and comprehensive liability clauses. Includes performance guarantees and audit rights.',
        usageCount: 89
      },
      {
        id: 'tc-v3',
        name: 'Simplified Terms',
        description: 'Streamlined terms for quick agreements',
        content: 'A concise version with essential terms only, ideal for straightforward transactions, small-value contracts, or recurring agreements with established partners. Minimizes legal complexity while maintaining protection.',
        usageCount: 67
      }
    ],
    'Pricing & Payment Terms': [
      {
        id: 'pp-v1',
        name: 'Fixed Price',
        description: 'Single upfront or milestone-based payments',
        content: 'Fixed pricing structure with defined payment schedule. Includes provisions for milestone-based payments, late payment penalties, and early payment discounts. Clear pricing breakdown and invoicing requirements.',
        usageCount: 203
      },
      {
        id: 'pp-v2',
        name: 'Subscription Model',
        description: 'Recurring payments with auto-renewal',
        content: 'Subscription-based pricing with monthly or annual billing cycles. Includes automatic renewal clauses, price adjustment mechanisms, usage-based pricing tiers, and cancellation policies with notice periods.',
        usageCount: 124
      },
      {
        id: 'pp-v3',
        name: 'Performance-Based',
        description: 'Variable pricing tied to outcomes',
        content: 'Performance-based pricing with variable components tied to specific KPIs and deliverables. Includes bonus structures, penalty clauses for underperformance, and detailed measurement criteria.',
        usageCount: 56
      }
    ],
    'Technical Specifications': [
      {
        id: 'ts-v1',
        name: 'High-Level Requirements',
        description: 'General technical requirements and standards',
        content: 'Broad technical specifications covering system requirements, compatibility standards, integration points, and general performance criteria. Suitable for service-based agreements.',
        usageCount: 112
      },
      {
        id: 'ts-v2',
        name: 'Detailed Specifications',
        description: 'Comprehensive technical documentation',
        content: 'Detailed technical requirements including architecture diagrams, API specifications, data formats, security protocols, performance benchmarks, and testing criteria. Ideal for complex technical implementations.',
        usageCount: 78
      },
      {
        id: 'ts-v3',
        name: 'SaaS Platform Specs',
        description: 'Cloud platform and SaaS requirements',
        content: 'Technical specifications tailored for SaaS platforms, including uptime guarantees, scalability requirements, data residency, backup procedures, and disaster recovery plans.',
        usageCount: 94
      }
    ],
    'Legal Compliance': [
      {
        id: 'lc-v1',
        name: 'Standard Compliance',
        description: 'Basic regulatory compliance requirements',
        content: 'Standard compliance provisions covering general business regulations, anti-corruption laws, export controls, and basic industry standards. Includes representation and warranty clauses.',
        usageCount: 156
      },
      {
        id: 'lc-v2',
        name: 'GDPR & Privacy',
        description: 'Enhanced data protection compliance',
        content: 'Comprehensive data protection and privacy compliance including GDPR, CCPA, and other data protection regulations. Covers data processing agreements, subject rights, breach notification, and cross-border transfers.',
        usageCount: 132
      },
      {
        id: 'lc-v3',
        name: 'Industry-Specific',
        description: 'Specialized regulatory requirements',
        content: 'Industry-specific compliance provisions tailored to regulated sectors (healthcare, finance, etc.). Includes HIPAA, SOX, PCI-DSS, and other sector-specific requirements with audit and reporting obligations.',
        usageCount: 71
      }
    ],
    'Delivery & Timeline': [
      {
        id: 'dt-v1',
        name: 'Fixed Timeline',
        description: 'Definite delivery dates and milestones',
        content: 'Fixed delivery schedule with specific dates, milestones, and deadlines. Includes provisions for delays, force majeure, and remedies for late delivery. Clear acceptance criteria for each milestone.',
        usageCount: 187
      },
      {
        id: 'dt-v2',
        name: 'Agile/Iterative',
        description: 'Sprint-based delivery schedule',
        content: 'Flexible, sprint-based delivery model with iterative releases. Includes sprint planning, review cycles, backlog management, and continuous delivery provisions. Suitable for software development projects.',
        usageCount: 98
      },
      {
        id: 'dt-v3',
        name: 'Best Efforts',
        description: 'Target dates with flexibility',
        content: 'Target delivery dates with built-in flexibility. Emphasizes best efforts commitment with regular progress reporting. Includes provisions for scope changes and timeline adjustments based on circumstances.',
        usageCount: 63
      }
    ],
    'Termination Clauses': [
      {
        id: 'term-v1',
        name: 'Standard Termination',
        description: 'Balanced termination rights',
        content: 'Balanced termination provisions with notice periods, termination for cause, and convenience termination options. Includes wind-down procedures, transition assistance, and final payment terms.',
        usageCount: 201
      },
      {
        id: 'term-v2',
        name: 'Customer-Favorable',
        description: 'Enhanced customer exit rights',
        content: 'Customer-favorable termination terms with shorter notice periods, liberal termination for convenience, and flexible exit provisions. Includes data portability and minimal termination fees.',
        usageCount: 87
      },
      {
        id: 'term-v3',
        name: 'Vendor-Favorable',
        description: 'Restrictive termination conditions',
        content: 'Vendor-favorable terms with longer notice periods, limited termination rights, and substantial termination fees. Emphasizes commitment period and penalties for early termination.',
        usageCount: 54
      }
    ],
    'Intellectual Property': [
      {
        id: 'ip-v1',
        name: 'Customer Ownership',
        description: 'Customer owns all deliverables',
        content: 'Full transfer of IP rights to customer for all work product and deliverables. Vendor retains only pre-existing IP and general methodologies. Includes work-for-hire provisions.',
        usageCount: 143
      },
      {
        id: 'ip-v2',
        name: 'Shared IP Rights',
        description: 'Joint ownership of developed IP',
        content: 'Shared intellectual property rights with clear allocation between customer-specific and general use components. Includes cross-licensing provisions and rights to derivative works.',
        usageCount: 76
      },
      {
        id: 'ip-v3',
        name: 'License Model',
        description: 'Vendor retains IP, customer gets license',
        content: 'Vendor retains ownership of all IP with customer receiving a license to use. Defines scope of license (exclusive/non-exclusive), permitted uses, and any restrictions or limitations.',
        usageCount: 119
      }
    ],
    'Data Privacy & Security': [
      {
        id: 'dps-v1',
        name: 'Standard Security',
        description: 'Basic security and privacy requirements',
        content: 'Standard security provisions including encryption, access controls, security incident procedures, and basic privacy protections. Suitable for non-sensitive business data.',
        usageCount: 167
      },
      {
        id: 'dps-v2',
        name: 'Enhanced Security',
        description: 'Comprehensive security framework',
        content: 'Comprehensive security requirements including ISO 27001 compliance, regular penetration testing, security audits, detailed incident response, and enhanced encryption standards. For handling sensitive data.',
        usageCount: 112
      },
      {
        id: 'dps-v3',
        name: 'Zero Trust Model',
        description: 'Advanced zero-trust security architecture',
        content: 'Advanced security provisions based on zero-trust principles. Includes continuous verification, micro-segmentation, least privilege access, comprehensive logging, and real-time threat detection.',
        usageCount: 45
      }
    ],
    'Service Level Agreements': [
      {
        id: 'sla-v1',
        name: 'Basic SLA',
        description: 'Standard availability and support',
        content: 'Basic SLA with 99% uptime guarantee, business hours support, and standard response times. Includes basic performance metrics and service credits for downtime.',
        usageCount: 178
      },
      {
        id: 'sla-v2',
        name: 'Enterprise SLA',
        description: 'Premium service levels with 24/7 support',
        content: 'Enterprise-grade SLA with 99.9% uptime, 24/7 premium support, dedicated account management, priority response times, and comprehensive service credits. Includes escalation procedures.',
        usageCount: 134
      },
      {
        id: 'sla-v3',
        name: 'Mission Critical',
        description: 'Maximum uptime and rapid response',
        content: 'Mission-critical SLA with 99.99% uptime guarantee, instant response times, dedicated support team, proactive monitoring, and substantial penalties for service failures. For business-critical systems.',
        usageCount: 61
      }
    ],
    'Liability & Insurance': [
      {
        id: 'li-v1',
        name: 'Balanced Liability',
        description: 'Mutual liability caps and limitations',
        content: 'Balanced liability provisions with reciprocal caps (typically 12 months fees), standard indemnification, and reasonable insurance requirements. Excludes liability for consequential damages.',
        usageCount: 192
      },
      {
        id: 'li-v2',
        name: 'Limited Liability',
        description: 'Vendor-favorable liability limitations',
        content: 'Vendor-favorable liability caps (typically 3-6 months fees) with broad exclusions and limited indemnification. Minimal insurance requirements and extensive liability limitations.',
        usageCount: 83
      },
      {
        id: 'li-v3',
        name: 'Uncapped Liability',
        description: 'No caps for certain breach types',
        content: 'Comprehensive liability with uncapped exposure for IP infringement, data breaches, confidentiality violations, and gross negligence. Substantial insurance requirements and broad indemnification.',
        usageCount: 58
      }
    ]
  };

  const addContractSection = (sectionName: string, versionId: string, versionName: string) => {
    const newSection = {
      id: Date.now().toString(),
      name: sectionName,
      versionId: versionId,
      versionName: versionName,
      assignedDivision: null
    };
    setContractDetails({
      ...contractDetails,
      contractSections: [...contractDetails.contractSections, newSection]
    });
    // Close the section type after adding
    setOpenSectionType(null);
  };

  const removeContractSection = (sectionId: string) => {
    setContractDetails({
      ...contractDetails,
      contractSections: contractDetails.contractSections.filter(section => section.id !== sectionId)
    });
  };

  const toggleDivisionForSection = (sectionId: string, division: string) => {
    setContractDetails({
      ...contractDetails,
      contractSections: contractDetails.contractSections.map(section => {
        if (section.id === sectionId) {
          // Set to null if clicking the same division (to deselect), otherwise set the new division
          const assignedDivision = section.assignedDivision === division ? null : division;
          return { ...section, assignedDivision };
        }
        return section;
      })
    });
  };

  const handleCreateContract = () => {
    const newContract = {
      template: selectedTemplate,
      details: contractDetails,
      createdAt: new Date().toISOString(),
      status: 'draft'
    };
    onCreateContract(newContract);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Template Library
        </Button>
        <div>
          <h1>Contract Details</h1>
          <p className="text-muted-foreground">
            Configure your new contract based on: {selectedTemplate.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Contract Title</Label>
                <Input
                  id="title"
                  placeholder="Enter contract title..."
                  value={contractDetails.title}
                  onChange={(e) => setContractDetails({...contractDetails, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client">Client/Company</Label>
                <Input
                  id="client"
                  placeholder="Enter client or company name..."
                  value={contractDetails.client}
                  onChange={(e) => setContractDetails({...contractDetails, client: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the contract..."
                  value={contractDetails.description}
                  onChange={(e) => setContractDetails({...contractDetails, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Contract Value</Label>
                  <Input
                    id="value"
                    placeholder="$0.00"
                    value={contractDetails.value}
                    onChange={handleValueChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select 
                    value={contractDetails.priority} 
                    onValueChange={(value) => setContractDetails({...contractDetails, priority: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* TODO: Assign To field - Hidden for now, will be used later if needed */}
              {/* <div className="space-y-2">
                <Label htmlFor="assignee">Assign To</Label>
                <Select 
                  value={contractDetails.assignee} 
                  onValueChange={(value) => setContractDetails({...contractDetails, assignee: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sarah-johnson">Sarah Johnson</SelectItem>
                    <SelectItem value="mike-chen">Mike Chen</SelectItem>
                    <SelectItem value="emma-davis">Emma Davis</SelectItem>
                    <SelectItem value="alex-rodriguez">Alex Rodriguez</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}

              <div className="space-y-2">
                <Label htmlFor="divisions">Involved Divisions</Label>
                <Select 
                  onValueChange={(value) => {
                    if (!contractDetails.involvedDivisions.includes(value)) {
                      setContractDetails({
                        ...contractDetails, 
                        involvedDivisions: [...contractDetails.involvedDivisions, value]
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select divisions to involve" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDivisions
                      .filter(division => !contractDetails.involvedDivisions.includes(division))
                      .map(division => (
                        <SelectItem key={division} value={division}>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            {division}
                          </div>
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
                
                {contractDetails.involvedDivisions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {contractDetails.involvedDivisions.map(division => (
                      <Badge key={division} variant="secondary" className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {division}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => {
                            setContractDetails({
                              ...contractDetails,
                              involvedDivisions: contractDetails.involvedDivisions.filter(d => d !== division)
                            });
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {contractDetails.involvedDivisions.length > 0 && (
                <div className="space-y-4 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Contract Sections</Label>
                      <p className="text-sm text-muted-foreground">
                        Assign divisions to specific contract sections
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {contractDetails.contractSections.map((section) => (
                      <div key={section.id} className="border rounded-lg p-4 space-y-3 brand-accent-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="font-medium">{section.name}</span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {section.versionName}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeContractSection(section.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-sm">Assigned Division:</Label>
                            {section.assignedDivision ? (
                              <Badge
                                variant="default"
                                className="flex items-center gap-1 w-fit"
                              >
                                <Building className="h-3 w-3" />
                                {section.assignedDivision}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 hover:bg-transparent ml-1"
                                  onClick={() => toggleDivisionForSection(section.id, section.assignedDivision!)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">
                                No division assigned to this section
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm">{section.assignedDivision ? 'Change Division:' : 'Select Division:'}</Label>
                            <Select
                              value={section.assignedDivision || ''}
                              onValueChange={(value) => {
                                if (value !== section.assignedDivision) {
                                  toggleDivisionForSection(section.id, value);
                                }
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a division" />
                              </SelectTrigger>
                              <SelectContent>
                                {contractDetails.involvedDivisions.map(division => (
                                  <SelectItem key={division} value={division}>
                                    <div className="flex items-center gap-2">
                                      <Building className="h-4 w-4" />
                                      {division}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="space-y-2">
                      <Label className="text-sm">Add Section:</Label>
                      <div className="space-y-3">
                        {defaultContractSections
                          .filter(sectionName => !contractDetails.contractSections.some(s => s.name === sectionName))
                          .map((sectionName) => {
                            const isOpen = openSectionType === sectionName;
                            const versions = sectionLibrary[sectionName] || [];
                            
                            return (
                              <div key={sectionName} className={`border rounded-lg overflow-hidden transition-all ${isOpen ? 'shadow-md bg-accent/50' : 'bg-card shadow-sm'}`}>
                                <button
                                  onClick={() => setOpenSectionType(isOpen ? null : sectionName)}
                                  className={`w-full p-4 flex items-center justify-between hover:bg-accent transition-colors ${isOpen ? 'bg-accent border-b' : ''}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded ${isOpen ? 'bg-brand-primary/30' : 'bg-muted'}`}>
                                      <FileText className="h-4 w-4 text-foreground" />
                                    </div>
                                    <span className="text-sm font-medium">{sectionName}</span>
                                  </div>
                                  {isOpen ? (
                                    <ChevronDown className="h-4 w-4 text-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </button>
                                
                                {isOpen && (
                                  <div className="p-4 space-y-3 bg-background">
                                    <p className="text-xs text-muted-foreground font-medium">
                                      Select a version to add to your contract:
                                    </p>
                                    {versions.map((version) => (
                                      <HoverCard key={version.id} openDelay={200}>
                                        <HoverCardTrigger asChild>
                                          <button
                                            onClick={() => addContractSection(sectionName, version.id, version.name)}
                                            className="w-full p-4 text-left border rounded-lg hover:bg-brand-primary/10 hover:border-brand-secondary transition-all group bg-card shadow-sm"
                                          >
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                  <span className="text-sm font-medium">{version.name}</span>
                                                  <Eye className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                                  {version.description}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                  <Badge variant="outline" className="text-xs">
                                                    Used {version.usageCount}x
                                                  </Badge>
                                                </div>
                                              </div>
                                              <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                            </div>
                                          </button>
                                        </HoverCardTrigger>
                                        <HoverCardContent className="w-96" side="right">
                                          <div className="space-y-2">
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
                                              <span className="text-xs text-muted-foreground">
                                                Used in {version.usageCount} contracts
                                              </span>
                                              <span className="text-xs text-brand-secondary font-medium">
                                                Hover to preview
                                              </span>
                                            </div>
                                          </div>
                                        </HoverCardContent>
                                      </HoverCard>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Selected Template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <selectedTemplate.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedTemplate.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedTemplate.category}</p>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {selectedTemplate.description}
                </p>

                {!selectedTemplate.isBlank && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Used {selectedTemplate.usageCount} times</span>
                    </div>
                    {selectedTemplate.lastUsed && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <span>Last used {selectedTemplate.lastUsed}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 space-y-2">
                <Button 
                  className="w-full brand-focus" 
                  style={{ backgroundColor: 'var(--brand-secondary)', color: 'white' }}
                  onClick={handleCreateContract}
                  disabled={!contractDetails.title || !contractDetails.client}
                >
                  Create Contract
                </Button>
                <Button variant="outline" className="w-full">
                  Preview Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}