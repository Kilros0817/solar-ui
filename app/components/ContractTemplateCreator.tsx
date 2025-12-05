import { useState } from 'react';
import { X, Save, Trash2, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';

interface SectionTemplate {
  sectionName: string;
  versions: {
    id: string;
    name: string;
    description: string;
    category: string;
  }[];
}

interface ContractTemplateCreatorProps {
  onClose: () => void;
  onSave: (contract: {
    name: string;
    description: string;
    category: string;
    selectedSections: { sectionName: string; versionId: string }[];
  }) => void;
  availableSections: SectionTemplate[];
  editingContract?: any;
}

export function ContractTemplateCreator({ onClose, onSave, availableSections, editingContract }: ContractTemplateCreatorProps) {
  const [name, setName] = useState(editingContract?.name || '');
  const [description, setDescription] = useState(editingContract?.description || '');
  const [category, setCategory] = useState(editingContract?.category || '');
  const [selectedSections, setSelectedSections] = useState<{ sectionName: string; versionId: string }[]>(editingContract?.selectedSections || []);
  const [expandedPreview, setExpandedPreview] = useState(false);

  const categories = ['Services', 'Legal', 'HR', 'Technology', 'Procurement', 'Business', 'Real Estate'];
  
  const toggleSection = (sectionName: string, versionId: string) => {
    setSelectedSections(prev => {
      const existingIndex = prev.findIndex(s => s.sectionName === sectionName);
      if (existingIndex >= 0) {
        // If same version, remove it. If different version, replace it
        if (prev[existingIndex].versionId === versionId) {
          return prev.filter((_, i) => i !== existingIndex);
        } else {
          const newSections = [...prev];
          newSections[existingIndex] = { sectionName, versionId };
          return newSections;
        }
      } else {
        return [...prev, { sectionName, versionId }];
      }
    });
  };

  const removeSection = (sectionName: string) => {
    setSelectedSections(prev => prev.filter(s => s.sectionName !== sectionName));
  };

  const isSectionSelected = (sectionName: string) => {
    return selectedSections.some(s => s.sectionName === sectionName);
  };

  const getSelectedVersionId = (sectionName: string) => {
    return selectedSections.find(s => s.sectionName === sectionName)?.versionId;
  };

  const handleSave = () => {
    if (name && description && category && selectedSections.length > 0) {
      onSave({
        name,
        description,
        category,
        selectedSections
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-8">
      <Card className="w-full max-w-5xl mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Create New Contract Template</CardTitle>
            <CardDescription>
              Build a contract by selecting section templates
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column: Contract Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Contract Template Name*</Label>
                <Input
                  id="name"
                  placeholder="e.g., Service Agreement, NDA"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description*</Label>
                <Input
                  id="description"
                  placeholder="Brief description of this contract type"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category*</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Sections Preview */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label>Selected Sections ({selectedSections.length})</Label>
                  {selectedSections.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedPreview(!expandedPreview)}
                    >
                      {expandedPreview ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Collapse
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Expand
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <div className="border rounded-lg p-3 bg-muted/30 max-h-80 overflow-y-auto">
                  {selectedSections.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No sections selected yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedSections.map((section, index) => {
                        const sectionData = availableSections.find(s => s.sectionName === section.sectionName);
                        const version = sectionData?.versions.find(v => v.id === section.versionId);
                        return (
                          <div key={section.sectionName} className="flex items-start gap-2 text-sm">
                            <Badge variant="outline" className="mt-0.5 shrink-0">
                              {index + 1}
                            </Badge>
                            <div className="flex-1">
                              <p className="font-medium">{section.sectionName}</p>
                              {expandedPreview && version && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Version: {version.name} - {version.description}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 shrink-0"
                              onClick={() => removeSection(section.sectionName)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Available Sections */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Available Section Templates</Label>
                <div className="border rounded-lg max-h-[600px] overflow-y-auto">
                  {availableSections.map((section) => {
                    const isSelected = isSectionSelected(section.sectionName);
                    const selectedVersionId = getSelectedVersionId(section.sectionName);

                    return (
                      <div
                        key={section.sectionName}
                        className="p-3 border-b last:border-b-0"
                      >
                        <div className="flex items-start gap-3 mb-2">
                          <Layers className="h-4 w-4 text-muted-foreground mt-1" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{section.sectionName}</p>
                            <p className="text-xs text-muted-foreground">
                              {section.versions.length} version{section.versions.length !== 1 ? 's' : ''} available
                            </p>
                          </div>
                          {isSelected && (
                            <Badge className="bg-brand-secondary text-white">Selected</Badge>
                          )}
                        </div>
                        <div className="ml-7 space-y-1">
                          {section.versions.map((version) => (
                            <div
                              key={version.id}
                              className={`p-2 rounded hover:bg-muted/50 transition-colors cursor-pointer ${
                                selectedVersionId === version.id ? 'bg-brand-primary/10 border border-brand-secondary' : ''
                              }`}
                              onClick={() => toggleSection(section.sectionName, version.id)}
                            >
                              <div className="flex items-start gap-2">
                                <Checkbox
                                  checked={selectedVersionId === version.id}
                                  onCheckedChange={() => toggleSection(section.sectionName, version.id)}
                                  className="mt-0.5"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex-1">
                                  <p className="text-xs font-medium">{version.name}</p>
                                  <p className="text-xs text-muted-foreground">{version.description}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={!name || !description || !category || selectedSections.length === 0}
              className="bg-brand-secondary hover:bg-[var(--brand-secondary-hover)] text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Contract Template
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {selectedSections.length === 0 && (
              <p className="text-sm text-muted-foreground ml-2">
                Select at least one section to continue
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}