import { X, FileText, Layers } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ContractTemplate } from '../../data/templates';

interface ContractTemplatePreviewModalProps {
  template: ContractTemplate;
  onClose: () => void;
  onUse?: () => void;
}

// Sample sections for contract templates (in a real app, this would come from the template data)
function getSampleSections(category: string) {
  if (category === 'Services') {
    return [
      { name: 'Scope of Services', description: 'Detailed description of services to be provided' },
      { name: 'Pricing & Payment Terms', description: 'Payment schedule and pricing structure' },
      { name: 'Service Level Agreements', description: 'Performance standards and guarantees' },
      { name: 'Intellectual Property', description: 'Ownership and licensing of work product' },
      { name: 'Termination Clauses', description: 'Conditions for ending the agreement' },
      { name: 'Liability & Insurance', description: 'Liability limitations and insurance requirements' },
    ];
  } else if (category === 'Legal') {
    return [
      { name: 'Confidentiality Obligation', description: 'Non-disclosure requirements' },
      { name: 'Permitted Use', description: 'Allowed uses of confidential information' },
      { name: 'Term & Duration', description: 'How long the agreement remains in effect' },
      { name: 'Return of Materials', description: 'Requirements for returning confidential materials' },
      { name: 'Liability & Insurance', description: 'Consequences of breach' },
    ];
  } else if (category === 'HR') {
    return [
      { name: 'Position & Duties', description: 'Job title and responsibilities' },
      { name: 'Compensation & Benefits', description: 'Salary, bonuses, and benefits package' },
      { name: 'Work Schedule', description: 'Hours and location requirements' },
      { name: 'Confidentiality & IP', description: 'Protection of company information' },
      { name: 'Termination Clauses', description: 'Employment termination conditions' },
    ];
  } else if (category === 'Technology') {
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
}

export function ContractTemplatePreviewModal({ template, onClose, onUse }: ContractTemplatePreviewModalProps) {
  const sections = getSampleSections(template.category);

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
                      Included Sections ({sections.length})
                    </h4>
                    <div
                      className="h-64 overflow-y-auto rounded-lg border p-2 shrink-0"
                    >
                      <div className="space-y-2 pr-1">
                        {sections.map((section, index) => (
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
            {!template.isBlank && `${sections.length} sections included`}
          </p>
        </div>
      </Card>
    </div>
  );
}
