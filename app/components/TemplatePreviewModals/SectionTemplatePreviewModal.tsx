import { X, Layers, FileCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import type { SectionTemplatePreview, SectionTemplatePreviewModalProps } from '../../data/interfaces';

export function SectionTemplatePreviewModal({ template, onClose, onUse }: SectionTemplatePreviewModalProps) {
  const blocks = template.content
    ?.split(/\n\n+/)
    .filter((b: string) => b.trim()) ?? [];
  const hasMultipleClauses = blocks.length > 1;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-brand-primary/20 border border-brand-secondary/20">
              <Layers className="h-6 w-6 text-brand-secondary" />
            </div>
            <div>
              <CardTitle className="text-xl">{template.name}</CardTitle>
              <CardDescription className="mt-1">
                {template.description || template.sectionName || 'Section template'}
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
              {template.sectionName && (
                <div className="flex flex-wrap items-center gap-4">
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    {template.sectionName}
                  </Badge>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-brand-secondary" />
                    Section Content
                  </h4>
                  <div className="bg-muted/50 p-4 rounded-lg border">
                    <div className="space-y-4 max-w-3xl">
                      {blocks.length > 0 ? (
                        blocks.map((block: string, index: number) => (
                          <div
                            key={index}
                            className={
                              hasMultipleClauses
                                ? 'flex flex-row gap-2 border-l-2 border-brand-secondary/20 pl-3'
                                : ''
                            }
                          >
                            {hasMultipleClauses && (
                              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-primary/20 text-xs font-medium text-brand-secondary">
                                {index + 1}
                              </div>
                            )}
                            <div className="text-sm leading-[1.7] text-foreground whitespace-pre-line">
                              {block.trim()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm leading-relaxed text-muted-foreground">No content</p>
                      )}
                    </div>
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
              <Layers className="h-4 w-4 mr-2" />
              Use This Section
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
