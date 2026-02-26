import { X, Text, FileCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ClauseLexicalEditor } from '../editor/ClauseLexicalEditor';
import type { ClauseTemplate, ClauseTemplatePreviewModalProps } from '../../data/interfaces';

export function ClauseTemplatePreviewModal({ template, onClose, onUse }: ClauseTemplatePreviewModalProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-brand-primary/20 border border-brand-secondary/20">
              <Text className="h-6 w-6 text-brand-secondary" />
            </div>
            <div>
              <CardTitle className="text-xl">{template.name}</CardTitle>
              <CardDescription className="mt-1">
                {template.description || 'Clause template'}
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full overflow-y-auto overflow-x-hidden pr-4">
            <div className="space-y-6">
              {template.category && (
                <div className="flex flex-wrap items-center gap-4">
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    {template.category}
                  </Badge>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-brand-secondary" />
                    Clause Content
                  </h4>
                  <div className="bg-muted/50 p-4 rounded-lg border">
                    {template.content ? (
                      <ClauseLexicalEditor
                        initialContent={template.content}
                        readOnly
                        className="text-sm"
                      />
                    ) : (
                      <p className="text-sm leading-relaxed text-muted-foreground">No content</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <div className="border-t p-4 flex items-center gap-3">
          {onUse && (
            <Button
              onClick={onUse}
              className="bg-brand-secondary hover:bg-[var(--brand-secondary-hover)] text-white"
            >
              <Text className="h-4 w-4 mr-2" />
              Use This Clause
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
