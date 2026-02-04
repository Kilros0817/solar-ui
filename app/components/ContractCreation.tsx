'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { 
  ArrowLeft,
  Building,
  X,
  FileText,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Eye,
  Loader2
} from 'lucide-react';
import { ContractTemplate } from '../data/templates';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';
import { useConnection, useConfig } from 'wagmi';
import { DIVISION_LABELS, URLs } from '@/utils/constants';
import { getAllDivisionLeaders, getAllClients } from '@/utils/subgraph';
import { createContract } from '@/utils/interact';
import { toast } from 'sonner';
import { useContracts } from '../contexts/ContractsContext';
import type { ContractCreationProps } from '../data/interfaces';

export function ContractCreation({ onBack, selectedTemplate }: ContractCreationProps) {
  const { address } = useConnection();
  const { refetch } = useContracts();
  const config = useConfig();
  const baseCategories = ['Services', 'Legal', 'HR', 'Technology', 'Procurement', 'Business', 'Real Estate', 'General', 'Custom'];
  const templateCategory = selectedTemplate.category || 'Custom';
  const CONTRACT_CATEGORIES = baseCategories.includes(templateCategory)
    ? baseCategories
    : [templateCategory, ...baseCategories];

  const [contractDetails, setContractDetails] = useState({
    title: '',
    client: '',
    description: '',
    value: '',
    category: selectedTemplate.category || 'Custom',
    assignee: '',
    contractSections: [] as Array<{
      id: string;
      name: string;
      versionId: string;
      versionName: string;
      assignedDivision: string | null;
    }>
  });

  const [openSectionType, setOpenSectionType] = useState<string | null>(null);
  const [availableDivisions, setAvailableDivisions] = useState<{id: string, dcategory: number}[]>([]);
  const [clients, setClients] = useState<Array<{ id: string; firstName: string; lastName: string; email: string }>>([]);
  const [sectionLibrary, setSectionLibrary] = useState<Record<string, Array<{ id: string; name: string; description: string; content: string; clauseIds?: string[] }>>>({});
  const [clauseMap, setClauseMap] = useState<Record<string, string>>({});
  const [sectionsLoaded, setSectionsLoaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    getAllDivisionLeaders().then((leaders) => {
      setAvailableDivisions(Array.isArray(leaders) ? leaders : []);
    });
  }, []);

  useEffect(() => {
    getAllClients().then((list) => {
      setClients(Array.isArray(list) ? list : []);
    });
  }, []);

  useEffect(() => {
    const fetchClauses = async () => {
      try {
        const res = await fetch(`${URLs.ClauseAPI}?limit=200`);
        const data = await res.json();
        if (res.ok && data.items) {
          const map: Record<string, string> = {};
          for (const item of data.items as Array<{ templateId: string; content: string }>) {
            map[item.templateId] = item.content ?? '';
          }
          setClauseMap(map);
        }
      } catch (err) {
        console.error('Failed to fetch clause templates:', err);
      }
    };
    fetchClauses();
  }, []);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await fetch(`${URLs.SectionAPI}?limit=200`);
        const data = await res.json();
        if (res.ok && data.items) {
          const grouped: Record<string, Array<{ id: string; name: string; description: string; content: string; clauseIds?: string[] }>> = {};
          for (const item of data.items as Array<{ templateId: string; sectionName: string; name: string; description: string; content?: string; clauseIds?: string[] }>) {
            const version = {
              id: item.templateId,
              name: item.name,
              description: item.description ?? '',
              content: item.content ?? '',
              clauseIds: item.clauseIds ?? [],
            };
            const key = item.sectionName;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(version);
          }
          setSectionLibrary(grouped);
        }
      } catch (err) {
        console.error('Failed to fetch section templates:', err);
      } finally {
        setSectionsLoaded(true);
      }
    };
    fetchSections();
  }, []);

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

  const defaultContractSections = Object.keys(sectionLibrary).sort();

  // Build map from version id to section info for resolving template sectionIds
  const versionIdToSection = useMemo(() => {
    const map: Record<string, { sectionName: string; versionId: string; versionName: string }> = {};
    for (const [sectionName, versions] of Object.entries(sectionLibrary)) {
      for (const v of versions) {
        map[v.id] = { sectionName, versionId: v.id, versionName: v.name };
      }
    }
    return map;
  }, [sectionLibrary]);

  // Sync category when selectedTemplate changes
  useEffect(() => {
    setContractDetails((prev) => ({ ...prev, category: selectedTemplate.category || 'Custom' }));
  }, [selectedTemplate.category]);

  // Initialize contract sections from template when sections are loaded. Blank template = no sections.
  const hasInitializedSections = useRef(false);
  useEffect(() => {
    if (!sectionsLoaded || hasInitializedSections.current) return;
    const sectionIds = selectedTemplate.sectionIds ?? [];
    if (sectionIds.length > 0) {
      hasInitializedSections.current = true;
      const sections = sectionIds
        .map((versionId) => {
          const info = versionIdToSection[versionId];
          if (!info) return null;
          return {
            id: `${versionId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name: info.sectionName,
            versionId: info.versionId,
            versionName: info.versionName,
            assignedDivision: null as string | null,
          };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null);
      setContractDetails((prev) => ({ ...prev, contractSections: sections }));
    } else {
      hasInitializedSections.current = true;
    }
  }, [sectionsLoaded, selectedTemplate.sectionIds, versionIdToSection]);

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

  const handleCreateContract = async () => {
    setIsUploading(true);
    const date = new Date().toISOString();
    const sectionsToUpload: Array<{
      sectionName: string;
      assignedDivisionLeaderAddress: string;
      assignedDivisionName: string;
      date: string;
      sectionContent: Array<{ clauseId: string; clauseContent: string }>;
    }> = [];

    for (const section of contractDetails.contractSections) {
      const division = availableDivisions.find((d) => d.dcategory.toString() === section.assignedDivision);
      if (!division) continue;

      const version = sectionLibrary[section.name]?.find((v) => v.id === section.versionId);
      const clauseIds = version?.clauseIds ?? [];
      const sectionContent = clauseIds.map((clauseId) => ({
        clauseId,
        clauseContent: clauseMap[clauseId] ?? '',
      }));

      sectionsToUpload.push({
        sectionName: section.name,
        assignedDivisionLeaderAddress: division.id,
        assignedDivisionName: DIVISION_LABELS[division.dcategory] ?? '',
        date,
        sectionContent,
      });
    }

    const selectedClient = clients.find((c) => c.id === contractDetails.client);
    const contractPayload = {
      contractTitle: contractDetails.title,
      client: selectedClient?.firstName ?? contractDetails.client,
      description: contractDetails.description,
      price: contractDetails.value,
      category: contractDetails.category,
      sections: sectionsToUpload.map((s) => ({ sectionName: s.sectionName, sectionContent: s.sectionContent })),
    };

    try {
      // 1. Upload contract first
      const contractRes = await fetch(`${URLs.UploadAPI}/contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract: contractPayload }),
      });
      const contractData = await contractRes.json();
      if (!contractRes.ok) throw new Error(contractData.error || 'Failed to upload contract');
      const docCid = contractData.cid;

      // 2. Upload sections (if any)
      let divisionLeaders: string[] = [];
      let sectionCids: string[] = [];
      if (sectionsToUpload.length > 0) {
        const sectionsRes = await fetch(`${URLs.UploadAPI}/sections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sections: sectionsToUpload }),
        });
        const sectionsData = await sectionsRes.json();
        if (!sectionsRes.ok) throw new Error(sectionsData.error || 'Failed to upload sections');
        const sectionCidPairs = sectionsData.sectionCids ?? [];
        divisionLeaders = sectionCidPairs.map((p: { divisionLeaderAddress: string }) => p.divisionLeaderAddress);
        sectionCids = sectionCidPairs.map((p: { cid: string }) => p.cid);
      }

      // 3. Create contract on-chain
      if (!config || !address) throw new Error('Wallet not connected');
      const clientAddress = contractDetails.client;
      const cLabel = contractDetails.category ?? '';
      const success = await createContract(
        config,
        address,
        clientAddress,
        cLabel,
        contractDetails.title,
        docCid,
        divisionLeaders,
        sectionCids
      );

      if (success) {
        toast.success('Contract created successfully');
        await new Promise((r) => setTimeout(r, 3000));
        await refetch();
      } else {
        throw new Error('Failed to create contract on-chain');
      }
    } catch (err) {
      console.error('Create contract error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create contract');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 relative">
      {isUploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-brand-primary" />
            <p className="text-sm text-muted-foreground">Uploading contract...</p>
          </div>
        </div>
      )}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Client/Company</Label>
                  <Select
                    value={contractDetails.client}
                    onValueChange={(value) => setContractDetails({ ...contractDetails, client: value })}
                  >
                    <SelectTrigger id="client">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.firstName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={contractDetails.category}
                    onValueChange={(value) => setContractDetails({ ...contractDetails, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTRACT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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

              <div className="space-y-2">
                <Label htmlFor="value">Contract Value</Label>
                <Input
                  id="value"
                  placeholder="$0.00"
                  value={contractDetails.value}
                  onChange={handleValueChange}
                />
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
                    {contractDetails.contractSections.map((section) => {
                      const version = sectionLibrary[section.name]?.find((v) => v.id === section.versionId);
                      const content = version?.content ?? '';
                      const blocks = content.split(/\n\n+/).filter((b) => b.trim());
                      const hasMultipleBlocks = blocks.length > 1;
                      return (
                      <div key={section.id} className="border rounded-lg p-4 space-y-3 brand-accent-shadow">
                        <div className="flex items-center justify-between">
                          <HoverCard openDelay={200} closeDelay={100}>
                            <HoverCardTrigger asChild>
                              <div className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div className="min-w-0">
                                  <span className="font-medium">{section.name}</span>
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {section.versionName}
                                  </Badge>
                                </div>
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent side="right" align="start" className="w-96 max-h-80 overflow-y-auto">
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm">{section.name} – {section.versionName}</h4>
                                <div className="space-y-4">
                                  {blocks.length > 0 ? (
                                    blocks.map((block, i) => (
                                      <div
                                        key={i}
                                        className={hasMultipleBlocks ? 'flex flex-row gap-2 border-l-2 border-brand-secondary/20 pl-3' : ''}
                                      >
                                        {hasMultipleBlocks && (
                                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-primary/20 text-xs font-medium text-brand-secondary">
                                            {i + 1}
                                          </div>
                                        )}
                                        <div className="text-sm leading-[1.7] text-foreground whitespace-pre-line">
                                          {block.trim()}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-muted-foreground">No content</p>
                                  )}
                                </div>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
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
                                { DIVISION_LABELS[Number(section.assignedDivision)] }
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
                                {availableDivisions.map(division => (
                                  <SelectItem key={division.id} value={division.dcategory.toString()}>
                                    <div className="flex items-center gap-2">
                                      <Building className="h-4 w-4" />
                                      {DIVISION_LABELS[division.dcategory]}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    );
                    })}

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
                                              </div>
                                              <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                            </div>
                                          </button>
                                        </HoverCardTrigger>
                                        <HoverCardContent className="w-96 max-h-80 overflow-y-auto" side="right">
                                          <div className="space-y-2">
                                            <div>
                                              <h4 className="font-medium">{version.name}</h4>
                                              <p className="text-sm text-muted-foreground">{version.description}</p>
                                            </div>
                                            <div className="pt-2 border-t">
                                              <p className="text-xs font-medium text-muted-foreground mb-2">Content Preview:</p>
                                              <div className="space-y-4">
                                                {(() => {
                                                  const blocks = (version.content ?? '').split(/\n\n+/).filter((b) => b.trim());
                                                  const hasMultiple = blocks.length > 1;
                                                  return blocks.length > 0 ? (
                                                    blocks.map((block, i) => (
                                                      <div
                                                        key={i}
                                                        className={hasMultiple ? 'flex flex-row gap-2 border-l-2 border-brand-secondary/20 pl-3' : ''}
                                                      >
                                                        {hasMultiple && (
                                                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-primary/20 text-xs font-medium text-brand-secondary">
                                                            {i + 1}
                                                          </div>
                                                        )}
                                                        <div className="text-sm leading-[1.7] text-foreground whitespace-pre-line">
                                                          {block.trim()}
                                                        </div>
                                                      </div>
                                                    ))
                                                  ) : (
                                                    <p className="text-sm text-muted-foreground">No content</p>
                                                  );
                                                })()}
                                              </div>
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
                  <div>
                    <p className="font-medium">{selectedTemplate.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedTemplate.category}</p>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {selectedTemplate.description}
                </p>
              </div>

              <div className="pt-4">
                <Button 
                  className="w-full brand-focus" 
                  style={{ backgroundColor: 'var(--brand-secondary)', color: 'white' }}
                  onClick={handleCreateContract}
                  disabled={
                    isUploading ||
                    !contractDetails.title ||
                    !contractDetails.client ||
                    contractDetails.contractSections.some((s) => !s.assignedDivision)
                  }
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Contract'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}