import { useState } from 'react';
import { X, Save, Plus, Trash2, Text, ChevronDown, ChevronUp } from 'lucide-react';
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
import { ClauseLexicalEditor } from './editor/ClauseLexicalEditor';
import type { ClauseTemplate, SectionTemplateCreatorProps } from '../data/interfaces';

export function SectionTemplateCreator({ onClose, onSave, availableClauses, editingSection }: SectionTemplateCreatorProps) {
  const [sectionName, setSectionName] = useState(editingSection?.sectionName || '');
  const [versionName, setVersionName] = useState(editingSection?.name || '');
  const [description, setDescription] = useState(editingSection?.description || '');
  const [category, setCategory] = useState(editingSection?.category || '');
  const [selectedClauseIds, setSelectedClauseIds] = useState<string[]>(() => {
    // If editing, extract the clause IDs from the editing section
    if (editingSection?.selectedClauses) {
      return editingSection.selectedClauses.map((c: ClauseTemplate) => c.id);
    }
    return [];
  });
  const [expandedPreview, setExpandedPreview] = useState(false);

  const categories = ['General', 'Enterprise', 'SMB', 'Pricing', 'Legal', 'Compliance', 'Service'];

  const selectedClauses = availableClauses.filter(clause => 
    selectedClauseIds.includes(clause.id)
  );

  const toggleClause = (clauseId: string) => {
    setSelectedClauseIds(prev =>
      prev.includes(clauseId)
        ? prev.filter(id => id !== clauseId)
        : [...prev, clauseId]
    );
  };

  const handleSave = async () => {
    if (sectionName && versionName && description && category && selectedClauses.length > 0) {
      try {
        await onSave({
          sectionName,
          versionName,
          description,
          category,
          selectedClauses
        });
        onClose();
      } catch {
        // Error shown by parent; keep modal open for retry
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-8">
      <Card className="w-full max-w-5xl mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{editingSection?.id ? 'Edit Section Template' : editingSection?.sectionName ? 'Add Version' : 'Create New Section Template'}</CardTitle>
            <CardDescription>
              Build a section by selecting and combining clause templates
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column: Section Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sectionName">Section Name*</Label>
                <Input
                  id="sectionName"
                  placeholder="e.g., Terms & Conditions, Pricing & Payment"
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  readOnly={!!(editingSection?.sectionName && !editingSection?.id)}
                  className={editingSection?.sectionName && !editingSection?.id ? 'bg-muted' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="versionName">Version Name*</Label>
                <Input
                  id="versionName"
                  placeholder="e.g., Standard, Enterprise, Premium"
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description*</Label>
                <Input
                  id="description"
                  placeholder="Brief description of this section version"
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

              {/* Selected Clauses Preview */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label>Selected Clauses ({selectedClauses.length})</Label>
                  {selectedClauses.length > 0 && (
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
                          Expand Preview
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <div className="border rounded-lg p-3 bg-muted/30 max-h-80 overflow-y-auto">
                  {selectedClauses.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No clauses selected yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedClauses.map((clause, index) => (
                        <div key={clause.id} className="flex items-start gap-2 text-sm">
                          <Badge variant="outline" className="mt-0.5 shrink-0">
                            {index + 1}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-medium">{clause.name}</p>
                            {expandedPreview && (
                              <div className="text-xs text-muted-foreground mt-1 leading-relaxed [&_.min-h-\[120px\]]:min-h-0">
                                <ClauseLexicalEditor
                                  initialContent={clause.content ?? ''}
                                  readOnly
                                />
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 shrink-0"
                            onClick={() => toggleClause(clause.id)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Available Clauses */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Available Clause Templates</Label>
                <div className="border rounded-lg max-h-[600px] overflow-y-auto">
                  {availableClauses.map((clause) => (
                    <div
                      key={clause.id}
                      className={`p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer ${
                        selectedClauseIds.includes(clause.id) ? 'bg-brand-primary/10' : ''
                      }`}
                      onClick={() => toggleClause(clause.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedClauseIds.includes(clause.id)}
                          onCheckedChange={() => toggleClause(clause.id)}
                          className="mt-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Text className="h-3 w-3 text-muted-foreground" />
                            <p className="font-medium text-sm">{clause.name}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {clause.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {clause.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={!sectionName || !versionName || !description || !category || selectedClauses.length === 0}
              className="bg-brand-secondary hover:bg-[var(--brand-secondary-hover)] text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Section Template
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {selectedClauses.length === 0 && (
              <p className="text-sm text-muted-foreground ml-2">
                Select at least one clause to continue
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
