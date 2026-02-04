import { X, FileText, Layers } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card';
import { ContractTemplate } from '../../data/templates';
import type { SectionInfo, ContractTemplatePreviewModalProps } from '../../data/interfaces';

function resolveSections(
  sectionIds: string[],
  sectionTemplates: Record<string, Array<{ id: string; name: string; description: string; content?: string }>>
): SectionInfo[] {
  const result: SectionInfo[] = [];
  for (const id of sectionIds) {
    for (const [sectionName, versions] of Object.entries(sectionTemplates)) {
      const version = versions.find((v) => v.id === id);
      if (version) {
        result.push({
          name: `${sectionName} – ${version.name}`,
          description: version.description,
          content: version.content ?? '',
        });
        break;
      }
    }
  }
  return result;
}

function SectionContentPreview({ name, content }: { name: string; content: string }) {
  const blocks = (content || '').split(/\n\n+/).filter((b) => b.trim());
  const hasMultipleBlocks = blocks.length > 1;

  return (
    <div className="space-y-3">
      <p className="font-medium text-sm">{name}</p>
      <div className="space-y-4">
        {blocks.length > 0 ? (
          blocks.map((block, i) => (
            <div
              key={i}
              className={
                hasMultipleBlocks
                  ? 'flex flex-row gap-2 border-l-2 border-brand-secondary/20 pl-3'
                  : ''
              }
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
          <p className="text-sm leading-relaxed text-muted-foreground">No content available.</p>
        )}
      </div>
    </div>
  );
}

export function ContractTemplatePreviewModal({ template, onClose, onUse, sectionTemplates = {} }: ContractTemplatePreviewModalProps) {
  const sections = resolveSections(template.sectionIds ?? [], sectionTemplates);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-brand-primary/20 border border-brand-secondary/20">
              {template.icon ? (
                <template.icon className="h-6 w-6 text-brand-secondary" />
              ) : (
                <FileText className="h-6 w-6 text-brand-secondary" />
              )}
            </div>
            <div>
              <CardTitle className="text-xl">{template.name}</CardTitle>
              <CardDescription className="mt-1">{template.description}</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="min-h-0 overflow-y-auto">
          <div className="pr-4">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <Badge variant="outline" className="text-sm px-3 py-1">
                  {template.category}
                </Badge>
              </div>

              {/* Included Sections */}
              {sections.length > 0 && (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Layers className="h-4 w-4 text-brand-secondary" />
                      Included Sections ({sections.length})
                    </h4>
                    <div
                      className="h-64 overflow-y-auto rounded-lg border p-2 shrink-0"
                    >
                      <div className="space-y-2 pr-1">
                        {sections.map((section, index) => (
                          <HoverCard key={index} openDelay={200} closeDelay={100}>
                            <HoverCardTrigger asChild>
                              <div
                                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-brand-secondary/20 cursor-pointer"
                              >
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary/20 text-brand-secondary text-xs font-medium shrink-0 mt-0.5">
                                  {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">{section.name}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {section.description}
                                  </p>
                                </div>
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent
                              side="right"
                              align="start"
                              className="w-96 max-h-80 overflow-y-auto"
                            >
                              <SectionContentPreview name={section.name} content={section.content} />
                            </HoverCardContent>
                          </HoverCard>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <div className="border-t p-4 flex items-center gap-3">
          {onUse && (
            <Button
              onClick={onUse}
              className="bg-brand-secondary hover:bg-[var(--brand-secondary-hover)] text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Use This Template
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <p className="text-xs text-muted-foreground ml-auto">
            {sections.length > 0 && `${sections.length} sections included`}
          </p>
        </div>
      </Card>
    </div>
  );
}
