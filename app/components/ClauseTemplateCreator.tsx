import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import type { ClauseTemplateCreatorProps } from '../data/interfaces';

export function ClauseTemplateCreator({ onClose, onSave, editingClause }: ClauseTemplateCreatorProps) {
  const [name, setName] = useState(editingClause?.name || '');
  const [description, setDescription] = useState(editingClause?.description || '');
  const [content, setContent] = useState(editingClause?.content || '');
  const [category, setCategory] = useState(editingClause?.category || '');

  const categories = ['Legal', 'Risk Management', 'Compliance', 'Administrative'];

  const handleSave = async () => {
    if (name && description && content && category) {
      try {
        await onSave({
          name,
          description,
          content,
          category,
          ...(editingClause?.id && { templateId: editingClause.id }),
        });
        onClose();
      } catch {
        // Error shown by parent; keep modal open for retry
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-8">
      <Card className="w-full max-w-3xl mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{editingClause ? 'Edit Clause Template' : 'Create New Clause Template'}</CardTitle>
            <CardDescription>
              {editingClause ? 'Update this reusable clause template' : 'Manually create a reusable clause that can be used in section templates'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Clause Name*</Label>
              <Input
                id="name"
                placeholder="e.g., Force Majeure, Confidentiality, etc."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description*</Label>
              <Input
                id="description"
                placeholder="Brief description of what this clause covers"
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

            <div className="space-y-2">
              <Label htmlFor="content">Clause Content*</Label>
              <Textarea
                id="content"
                placeholder="Type the full clause text here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="resize-none font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {content.length} characters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={!name || !description || !content || !category}
              className="bg-brand-secondary hover:bg-[var(--brand-secondary-hover)] text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Clause Template
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}