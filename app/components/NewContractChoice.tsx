import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { FileText, Library, ArrowRight } from 'lucide-react';
import type { NewContractChoiceProps } from '../data/interfaces';

export function NewContractChoice({ onSelectBlank, onSelectTemplate, onBack }: NewContractChoiceProps) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1>Create New Contract</h1>
        <p className="text-muted-foreground">Choose how you'd like to start your new contract</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {/* Blank Contract Option */}
        <Card className="brand-hover cursor-pointer transition-all" onClick={onSelectBlank}>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-lg bg-brand-primary">
                <FileText className="h-6 w-6 text-brand-secondary" />
              </div>
              <CardTitle>Blank Contract</CardTitle>
            </div>
            <CardDescription>
              Start from scratch and build your contract from the ground up with full customization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground mb-4">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-brand-secondary" />
                Complete flexibility and control
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-brand-secondary" />
                Choose your own sections
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-brand-secondary" />
                Perfect for unique agreements
              </li>
            </ul>
            <Button className="w-full bg-brand-secondary hover:bg-[var(--brand-secondary-hover)] text-white border-brand-secondary">
              Start Blank
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* From Template Option */}
        <Card className="brand-hover cursor-pointer transition-all" onClick={onSelectTemplate}>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-lg bg-brand-primary">
                <Library className="h-6 w-6 text-brand-secondary" />
              </div>
              <CardTitle>From Template</CardTitle>
            </div>
            <CardDescription>
              Choose from pre-built templates to speed up contract creation with proven structures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground mb-4">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-brand-secondary" />
                Pre-configured sections
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-brand-secondary" />
                Industry best practices
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-brand-secondary" />
                Faster creation process
              </li>
            </ul>
            <Button className="w-full bg-brand-secondary hover:bg-[var(--brand-secondary-hover)] text-white border-brand-secondary">
              Browse Templates
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
