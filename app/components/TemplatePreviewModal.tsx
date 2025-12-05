import { X, FileText, Layers, Text, FileCheck, Users, Calendar, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

interface TemplatePreviewModalProps {
  template: any;
  type: 'contract' | 'section' | 'clause';
  onClose: () => void;
  onUse?: () => void;
}

export function TemplatePreviewModal({ template, type, onClose, onUse }: TemplatePreviewModalProps) {
  const getIcon = () => {
    if (type === 'contract') return <FileText className="h-5 w-5" />;
    if (type === 'section') return <Layers className="h-5 w-5" />;
    return <Text className="h-5 w-5" />;
  };

  // Sample sections for contract templates (in a real app, this would come from the template data)
  const getSampleSections = () => {
    if (template.category === 'Services') {
      return [
        { name: 'Scope of Services', description: 'Detailed description of services to be provided' },
        { name: 'Pricing & Payment Terms', description: 'Payment schedule and pricing structure' },
        { name: 'Service Level Agreements', description: 'Performance standards and guarantees' },
        { name: 'Intellectual Property', description: 'Ownership and licensing of work product' },
        { name: 'Termination Clauses', description: 'Conditions for ending the agreement' },
        { name: 'Liability & Insurance', description: 'Liability limitations and insurance requirements' },
      ];
    } else if (template.category === 'Legal') {
      return [
        { name: 'Confidentiality Obligation', description: 'Non-disclosure requirements' },
        { name: 'Permitted Use', description: 'Allowed uses of confidential information' },
        { name: 'Term & Duration', description: 'How long the agreement remains in effect' },
        { name: 'Return of Materials', description: 'Requirements for returning confidential materials' },
        { name: 'Liability & Insurance', description: 'Consequences of breach' },
      ];
    } else if (template.category === 'HR') {
      return [
        { name: 'Position & Duties', description: 'Job title and responsibilities' },
        { name: 'Compensation & Benefits', description: 'Salary, bonuses, and benefits package' },
        { name: 'Work Schedule', description: 'Hours and location requirements' },
        { name: 'Confidentiality & IP', description: 'Protection of company information' },
        { name: 'Termination Clauses', description: 'Employment termination conditions' },
      ];
    } else if (template.category === 'Technology') {
      return [
        { name: 'Service Description', description: 'Software features and functionality' },
        { name: 'Pricing & Payment Terms', description: 'Subscription fees and payment terms' },
        { name: 'Service Level Agreements', description: 'Uptime and performance guarantees' },
        { name: 'Data Privacy & Security', description: 'Data protection and security measures' },
        { name: 'Support & Maintenance', description: 'Customer support and updates' },
      ];
    } else {
      return [
        { name: 'Terms & Conditions', description: 'General terms governing the agreement' },
        { name: 'Pricing & Payment Terms', description: 'Financial arrangements' },
        { name: 'Delivery & Performance', description: 'Obligations and timelines' },
        { name: 'Termination Clauses', description: 'Exit provisions' },
      ];
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-brand-primary/20 border border-brand-secondary/20">
              {type === 'contract' && template.icon ? (
                <template.icon className="h-6 w-6 text-brand-secondary" />
              ) : (
                getIcon()
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
        <CardContent className="flex-1 overflow-hidden pt-6">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-6">
              {/* Metadata Section */}
              <div className="flex flex-wrap items-center gap-4">
                <Badge variant="outline" className="text-sm px-3 py-1">
                  {template.category}
                </Badge>
                {template.usageCount !== undefined && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>Used {template.usageCount} times</span>
                  </div>
                )}
                {template.lastUsed && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Last used {template.lastUsed}</span>
                  </div>
                )}
              </div>

              {type === 'clause' && (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-brand-secondary" />
                      Clause Content
                    </h4>
                    <div className="bg-muted/50 p-4 rounded-lg border">
                      <p className="text-sm leading-relaxed">{template.content}</p>
                    </div>
                  </div>
                </div>
              )}

              {type === 'section' && (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-brand-secondary" />
                      Section Content
                    </h4>
                    <div className="bg-muted/50 p-4 rounded-lg border">
                      <p className="text-sm leading-relaxed">{template.content}</p>
                    </div>
                  </div>
                </div>
              )}

              {type === 'contract' && (
                <>
                  {/* Overview */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-brand-secondary" />
                        Template Overview
                      </h4>
                      <div className="bg-muted/50 p-4 rounded-lg border space-y-3">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Purpose</p>
                          <p className="text-sm leading-relaxed">
                            This template provides a comprehensive framework for creating a {template.name.toLowerCase()}. 
                            It includes pre-configured sections with multiple version options, allowing you to customize 
                            the contract to match your specific needs.
                          </p>
                        </div>
                        
                        {!template.isBlank && (
                          <>
                            <Separator />
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">Best For</p>
                              <p className="text-sm leading-relaxed">
                                {template.category === 'Services' && 'Professional service engagements, consulting projects, and ongoing service relationships.'}
                                {template.category === 'Legal' && 'Protecting confidential information, trade secrets, and proprietary data in business relationships.'}
                                {template.category === 'HR' && 'Full-time, part-time, and contract employment relationships with clear terms and conditions.'}
                                {template.category === 'Technology' && 'Cloud-based software services, subscription models, and digital product licensing.'}
                                {template.category === 'Procurement' && 'Supplier relationships, vendor management, and ongoing procurement needs.'}
                                {template.category === 'Business' && 'Strategic partnerships, joint ventures, and collaborative business arrangements.'}
                                {template.category === 'Real Estate' && 'Commercial property leasing, office space, retail locations, and warehouse facilities.'}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Included Sections */}
                  {!template.isBlank && (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Layers className="h-4 w-4 text-brand-secondary" />
                          Included Sections ({getSampleSections().length})
                        </h4>
                        <div className="space-y-2">
                          {getSampleSections().map((section, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-brand-secondary/20"
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
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Key Features */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-brand-secondary" />
                        Key Features
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-brand-primary/5 border border-brand-secondary/10">
                          <p className="text-sm font-medium mb-1">✓ Multiple Section Versions</p>
                          <p className="text-xs text-muted-foreground">
                            Choose from different versions of each section to match your specific requirements
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-brand-primary/5 border border-brand-secondary/10">
                          <p className="text-sm font-medium mb-1">✓ Pre-Built Clauses</p>
                          <p className="text-xs text-muted-foreground">
                            Industry-standard clauses vetted for common use cases
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-brand-primary/5 border border-brand-secondary/10">
                          <p className="text-sm font-medium mb-1">✓ Customizable Structure</p>
                          <p className="text-xs text-muted-foreground">
                            Add, remove, or reorder sections to fit your needs
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-brand-primary/5 border border-brand-secondary/10">
                          <p className="text-sm font-medium mb-1">✓ Collaboration Ready</p>
                          <p className="text-xs text-muted-foreground">
                            Built-in commenting and version control for team collaboration
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
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
            {type === 'contract' && !template.isBlank && `${getSampleSections().length} sections included`}
          </p>
        </div>
      </Card>
    </div>
  );
}