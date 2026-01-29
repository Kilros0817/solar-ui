import { ClauseTemplateCreator } from './ClauseTemplateCreator';
import { SectionTemplateCreator } from './SectionTemplateCreator';
import { ContractTemplateCreator } from './ContractTemplateCreator';
import {
  ContractTemplatePreviewModal,
  SectionTemplatePreviewModal,
  ClauseTemplatePreviewModal,
} from './TemplatePreviewModals';
import { ConfirmDialog } from './ConfirmDialog';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Eye,
  Plus,
  Layers,
  Text,
  Edit,
  Trash2,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from './ui/dropdown-menu';
import { useUser } from '../contexts/UserContext';
import { USER_ROLE, URLs } from '@/utils/constants';
import { ContractTemplate } from '../data/templates';

interface TemplateLibraryProps {
  onSelectContractTemplate?: (template: ContractTemplate) => void;
}

type EditingContract = ContractTemplate & { selectedSections?: { sectionName: string; versionId: string }[] };

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
  const [previewType, setPreviewType] = useState<'contract' | 'section' | 'clause'>('contract');
  const [deleteTemplate, setDeleteTemplate] = useState<ContractTemplate | null>(null);
  const [deleteClauseToConfirm, setDeleteClauseToConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deleteSectionToConfirm, setDeleteSectionToConfirm] = useState<{ id: string; name: string; sectionName: string } | null>(null);
  const [editingClause, setEditingClause] = useState<any>(null);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [editingContract, setEditingContract] = useState<EditingContract | null>(null);

  // Contract Templates (fetched from solar-server)
  const [contractTemplates, setContractTemplates] = useState<ContractTemplate[]>([]);

  // Section Templates (fetched from solar-server)
  const [sectionTemplates, setSectionTemplates] = useState<Record<string, Array<{ id: string; sectionName?: string; name: string; description: string; content: string; category: string; clauseIds?: string[] }>>>({});

  // Clause Templates (fetched from solar-server)
  const [clauseTemplates, setClauseTemplates] = useState<Array<{ id: string; name: string; description: string; content: string; category: string }>>([]);

  useEffect(() => {
    const fetchClauseTemplates = async () => {
      try {
        const res = await fetch(`${URLs.ClauseAPI}?limit=200`);
        const data = await res.json();
        if (res.ok && data.items) {
          setClauseTemplates(
            data.items.map((item: { templateId: string; name: string; description: string; content: string; category: string }) => ({
              id: item.templateId,
              name: item.name,
              description: item.description,
              content: item.content,
              category: item.category,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to fetch clause templates:', err);
        toast.error('Failed to load clause templates');
      }
    };
    fetchClauseTemplates();
  }, []);

  const fetchContractTemplates = async () => {
    try {
      const res = await fetch(`${URLs.ContractAPI}?limit=200`);
      const data = await res.json();
      if (res.ok && data.items) {
        setContractTemplates(
          data.items.map((item: { id?: string; templateId?: string; name: string; description: string; category: string; createdDate?: string; lastModified?: string; createdBy?: string; sectionIds?: string[] }) => ({
            id: item.id ?? item.templateId ?? '',
            name: item.name,
            description: item.description,
            category: item.category,
            icon: FileText,
            createdDate: item.createdDate ?? new Date().toISOString(),
            lastModified: item.lastModified ?? new Date().toISOString(),
            createdBy: item.createdBy ?? 'System',
            sectionIds: item.sectionIds ?? [],
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch contract templates:', err);
      toast.error('Failed to load contract templates');
    }
  };

  useEffect(() => {
    fetchContractTemplates();
  }, []);

  const fetchSectionTemplates = async () => {
    try {
      const res = await fetch(`${URLs.SectionAPI}?limit=200`);
      const data = await res.json();
      if (res.ok && data.items) {
        const grouped: Record<string, Array<{ id: string; sectionName: string; name: string; description: string; content: string; category: string; clauseIds: string[] }>> = {};
        for (const item of data.items as Array<{ templateId: string; sectionName: string; name: string; description: string; content: string; category: string; clauseIds?: string[] }>) {
          const version = {
            id: item.templateId,
            sectionName: item.sectionName,
            name: item.name,
            description: item.description,
            content: item.content ?? '',
            category: item.category,
            clauseIds: item.clauseIds ?? [],
          };
          if (!grouped[item.sectionName]) grouped[item.sectionName] = [];
          grouped[item.sectionName].push(version);
        }
        setSectionTemplates(grouped);
      }
    } catch (err) {
      console.error('Failed to fetch section templates:', err);
      toast.error('Failed to load section templates');
    }
  };

  useEffect(() => {
    fetchSectionTemplates();
  }, []);

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
                           version.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (version.content ?? '').toLowerCase().includes(searchQuery.toLowerCase());
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

  const handleSaveClause = async (clause: { name: string; description: string; content: string; category: string; templateId?: string }) => {
    if (clause.templateId) {
      // Edit: call solar-server PUT API
      const res = await fetch(`${URLs.ClauseAPI}/${clause.templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: clause.name, description: clause.description, content: clause.content, category: clause.category }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update clause template');
      }
      const data = await res.json();
      setClauseTemplates((prev) =>
        prev.map((c) => (c.id === clause.templateId ? { ...c, name: data.item.name, description: data.item.description, content: data.item.content, category: data.item.category } : c))
      );
      toast.success(`Clause template "${clause.name}" updated successfully`);
      setEditingClause(null);
      setShowClauseCreator(false);
    } else {
      // Create: call solar-server POST API
      const templateId = `c-${Date.now()}`;
      const res = await fetch(`${URLs.ClauseAPI}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          name: clause.name,
          description: clause.description,
          content: clause.content,
          category: clause.category,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create clause template');
      }
      const data = await res.json();
      setClauseTemplates((prev) => [
        ...prev,
        {
          id: data.item.templateId,
          name: data.item.name,
          description: data.item.description,
          content: data.item.content,
          category: data.item.category,
        },
      ]);
      toast.success(`Clause template "${clause.name}" created successfully`);
      setShowClauseCreator(false);
    }
  };

  const handleSaveSection = async (section: { sectionName: string; versionName: string; description: string; category: string; selectedClauses: Array<{ id: string }> }) => {
    const sectionName = section.sectionName || editingSection?.sectionName || 'Custom Section';
    const clauseIds = section.selectedClauses.map((c) => c.id);

    if (editingSection?.id) {
      const res = await fetch(`${URLs.SectionAPI}/${editingSection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionName,
          name: section.versionName,
          description: section.description,
          category: section.category,
          clauseIds,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update section template');
      }
      await fetchSectionTemplates();
      toast.success(`Section template "${section.versionName}" updated successfully!`);
      setEditingSection(null);
      setShowSectionCreator(false);
    } else {
      const templateId = `section-${Date.now()}`;
      const res = await fetch(`${URLs.SectionAPI}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          sectionName,
          name: section.versionName,
          description: section.description,
          category: section.category,
          clauseIds,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create section template');
      }
      await fetchSectionTemplates();
      toast.success(`Section template "${section.versionName}" created successfully!`);
      setEditingSection(null);
      setShowSectionCreator(false);
    }
  };

  const handleSaveContract = async (contract: any) => {
    try {
      const sectionIds = (contract.selectedSections ?? []).map((s: { versionId: string }) => s.versionId);
      if (editingContract) {
        const res = await fetch(`${URLs.ContractAPI}/${editingContract.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: contract.name,
            description: contract.description,
            category: contract.category,
            sectionIds,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to update contract template');
        }
        await fetchContractTemplates();
        toast.success(`Contract template "${contract.name}" updated successfully.`);
        setEditingContract(null);
      } else {
        const templateId = `contract-${Date.now()}`;
        const res = await fetch(`${URLs.ContractAPI}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId,
            name: contract.name,
            description: contract.description,
            category: contract.category,
            createdBy: 'System',
            sectionIds,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to create contract template');
        }
        await fetchContractTemplates();
        toast.success(`Contract template "${contract.name}" created successfully.`);
      }
    } catch (err) {
      console.error('Save contract error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save contract template');
      throw err;
    }
  };

  const handlePreviewTemplate = (template: ContractTemplate) => {
    setPreviewTemplate(template);
    setPreviewType('contract');
  };

  const handleDeleteTemplate = (template: ContractTemplate) => {
    setDeleteTemplate(template);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTemplate) return;
    try {
      const res = await fetch(`${URLs.ContractAPI}/${deleteTemplate.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete contract template');
      }
      await fetchContractTemplates();
      toast.success(`Template "${deleteTemplate.name}" deleted successfully.`);
    } catch (err) {
      console.error('Delete contract error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete contract template');
    } finally {
      setDeleteTemplate(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteTemplate(null);
    setDeleteClauseToConfirm(null);
    setDeleteSectionToConfirm(null);
  };

  const handleConfirmDeleteClause = async () => {
    if (!deleteClauseToConfirm) return;
    try {
      const res = await fetch(`${URLs.ClauseAPI}/${deleteClauseToConfirm.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete clause template');
      }
      setClauseTemplates((prev) => prev.filter((c) => c.id !== deleteClauseToConfirm.id));
      toast.success(`Clause template "${deleteClauseToConfirm.name}" deleted successfully`);
    } catch (err) {
      console.error('Delete clause error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete clause template');
    } finally {
      setDeleteClauseToConfirm(null);
    }
  };

  const handleConfirmDeleteSection = async () => {
    if (!deleteSectionToConfirm) return;
    try {
      const res = await fetch(`${URLs.SectionAPI}/${deleteSectionToConfirm.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete section template');
      }
      setSectionTemplates((prev) => {
        const versions = (prev[deleteSectionToConfirm.sectionName] ?? []).filter((v) => v.id !== deleteSectionToConfirm.id);
        if (versions.length === 0) {
          const next = { ...prev };
          delete next[deleteSectionToConfirm.sectionName];
          return next;
        }
        return { ...prev, [deleteSectionToConfirm.sectionName]: versions };
      });
      toast.success(`Section template "${deleteSectionToConfirm.name}" deleted successfully`);
    } catch (err) {
      console.error('Delete section error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete section template');
    } finally {
      setDeleteSectionToConfirm(null);
    }
  };

  const handlePreviewSection = (section: any) => {
    setPreviewTemplate(section);
    setPreviewType('section');
  };

  const handleEditSection = (section: any) => {
    const sectionName = section.sectionName ?? Object.entries(sectionTemplates).find(([, versions]) => versions.some((v) => v.id === section.id))?.[0];
    const selectedClauses = (section.clauseIds ?? []).map((cid: string) => clauseTemplates.find((c) => c.id === cid)).filter(Boolean);
    setEditingSection({
      ...section,
      sectionName,
      selectedClauses,
    });
    setShowSectionCreator(true);
    toast.info(`Editing: ${section.name}`);
  };

  const handleDeleteSection = (section: any) => {
    setDeleteSectionToConfirm({ id: section.id, name: section.name, sectionName: section.sectionName ?? '' });
  };

  const handlePreviewClause = (clause: any) => {
    setPreviewTemplate(clause);
    setPreviewType('clause');
  };

  const handleEditClause = (clause: any) => {
    console.log('Edit clause:', clause);
    setEditingClause(clause);
    setShowClauseCreator(true);
    toast.info(`Editing: ${clause.name}`);
    // In a real app, this would open an edit modal
  };

  const handleDeleteClause = (clause: any) => {
    setDeleteClauseToConfirm({ id: clause.id, name: clause.name });
  };

  const handleEditContract = (contract: ContractTemplate) => {
    // Convert sectionIds to selectedSections for the creator
    const selectedSections = (contract.sectionIds ?? []).map((sectionId) => {
      for (const [sectionName, versions] of Object.entries(sectionTemplates)) {
        const version = versions.find((v) => v.id === sectionId);
        if (version) return { sectionName, versionId: sectionId };
      }
      return null;
    }).filter((s): s is { sectionName: string; versionId: string } => s !== null);
    setEditingContract({ ...contract, selectedSections });
    setShowContractCreator(true);
    toast.info(`Editing: ${contract.name}`);
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
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => {
                            if (onSelectContractTemplate) {
                              onSelectContractTemplate(template);
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
                <Button onClick={() => { setEditingSection(null); setShowSectionCreator(true); }} className="bg-brand-secondary hover:bg-[var(--brand-secondary-hover)] text-white border-brand-secondary">
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingSection({ sectionName });
                          setShowSectionCreator(true);
                        }}
                      >
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
                          <div className="flex items-center mt-3 mb-3">
                            <Badge variant="outline" className="text-xs">
                              {version.category}
                            </Badge>
                          </div>
                          <div className="flex gap-2 pt-2 border-t">
                            <Button size="sm" variant="outline" className="flex-1 text-xs h-8" onClick={() => handlePreviewSection(version)}>
                              <Eye className="h-3 w-3 mr-1" />
                              Preview
                            </Button>
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
                <Button onClick={() => { setEditingClause(null); setShowClauseCreator(true); }} className="bg-brand-secondary hover:bg-[var(--brand-secondary-hover)] text-white border-brand-secondary">
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
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        <Button size="sm" variant="outline" className="flex-1 text-xs h-8" onClick={() => handlePreviewClause(clause)}>
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
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

    {/* Template Preview Modals */}
    {previewTemplate && previewType === 'contract' && (
      <ContractTemplatePreviewModal
        template={previewTemplate as ContractTemplate}
        sectionTemplates={sectionTemplates}
        onClose={() => setPreviewTemplate(null)}
      />
    )}
    {previewTemplate && previewType === 'section' && (
      <SectionTemplatePreviewModal
        template={previewTemplate as { id: string; name: string; sectionName?: string; description?: string; content?: string; clauseIds?: string[] }}
        onClose={() => setPreviewTemplate(null)}
      />
    )}
    {previewTemplate && previewType === 'clause' && (
      <ClauseTemplatePreviewModal
        template={previewTemplate as { id: string; name: string; description?: string; content?: string; category?: string }}
        onClose={() => setPreviewTemplate(null)}
      />
    )}

    {/* Confirm Delete Dialogs */}
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
    {deleteClauseToConfirm && (
      <ConfirmDialog
        title="Delete Clause Template"
        description={`Are you sure you want to delete the clause template "${deleteClauseToConfirm.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleConfirmDeleteClause}
        onCancel={handleCancelDelete}
      />
    )}
    {deleteSectionToConfirm && (
      <ConfirmDialog
        title="Delete Section Template"
        description={`Are you sure you want to delete the section version "${deleteSectionToConfirm.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleConfirmDeleteSection}
        onCancel={handleCancelDelete}
      />
    )}
    </>
  );
}