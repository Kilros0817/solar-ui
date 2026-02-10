'use client'

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Building2,
  AlertCircle,
  Eye
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { useState } from 'react';
import { USER_ROLE } from '@/utils/constants';
import type { SectionReviewTabProps } from '../data/interfaces';

export function SectionReviewTab({
  sections,
  onApprove,
  onReject,
  userRole,
  processingSectionId = null,
}: SectionReviewTabProps) {
  const [expandedDivisions, setExpandedDivisions] = useState<Record<string, boolean>>({});

  const getSectionStatusBadge = (statusNum?: number) => {
    switch (statusNum) {
      case 0:
        return (
          <Badge className="bg-slate-100 text-slate-800 border-slate-200">
            <Clock className="h-3 w-3 mr-1" />
            Assigned
          </Badge>
        );
      case 1:
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
            <Clock className="h-3 w-3 mr-1" />
            Review
          </Badge>
        );
      case 2:
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 3:
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-800 border-slate-200">
            <Clock className="h-3 w-3 mr-1" />
            Assigned
          </Badge>
        );
    }
  };

  const toggleDivision = (division: string) => {
    setExpandedDivisions({ ...expandedDivisions, [division]: !expandedDivisions[division] });
  };

  // Show message for non-legal team members, but still allow tab to be visible
  const isLegalTeam = userRole === USER_ROLE.LEGAL_TEAM;
  
  if (!isLegalTeam) {
    return (
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="text-center text-muted-foreground py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Section review is only available for legal team members.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="flex gap-4">
        <Card className="flex-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sections</p>
                <p className="text-2xl font-bold">{sections.reduce((sum, div) => sum + div.sections.length, 0)}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-amber-600">
                  {sections.reduce((sum, div) => sum + div.sections.filter(s => s.statusNum === 0).length, 0)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Review</p>
                <p className="text-2xl font-bold text-orange-600">
                  {sections.reduce((sum, div) => sum + div.sections.filter(s => s.statusNum === 1).length, 0)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {sections.reduce((sum, div) => sum + div.sections.filter(s => s.status === 'approved').length, 0)}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {sections.reduce((sum, div) => sum + div.sections.filter(s => s.status === 'rejected').length, 0)}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sections by Division */}
      <div className="space-y-4">
        {sections.map((divisionSection) => (
          <Card key={divisionSection.division} className="overflow-hidden">
            <Collapsible 
              open={expandedDivisions[divisionSection.division] !== false}
              onOpenChange={() => toggleDivision(divisionSection.division)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-secondary/10 rounded-lg flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-brand-secondary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{divisionSection.division}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {divisionSection.sections.length} {divisionSection.sections.length === 1 ? 'section' : 'sections'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  {divisionSection.sections.map((section) => (
                    <div 
                      key={section.id} 
                      className={`border rounded-lg p-4 space-y-3 ${
                        section.status === 'approved' ? 'bg-green-50/50 border-green-200' :
                        section.status === 'rejected' ? 'bg-red-50/50 border-red-200' :
                        'bg-orange-50/50 border-orange-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{section.name}</h4>
                            {getSectionStatusBadge(section.statusNum)}
                          </div>
                          {section.divisionLeaderName && (
                            <p className="text-sm text-muted-foreground mb-3">
                              Division leader: {section.divisionLeaderName}
                            </p>
                          )}
                          <div className="bg-white rounded p-3 border max-h-32 overflow-y-auto">
                            <p className="text-sm leading-relaxed line-clamp-3">{section.content}</p>
                          </div>
                        </div>
                      </div>

                      {section.status === 'pending' && section.statusNum === 1 && (
                        <div className="flex items-end gap-2 pt-2 border-t">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="approve"
                              onClick={() => onApprove?.(section.id)}
                              disabled={processingSectionId === section.id}
                              className="cursor-pointer"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              {processingSectionId === section.id ? 'Processing...' : 'Approve'}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => onReject?.(section.id, '')}
                              disabled={processingSectionId === section.id}
                              className="cursor-pointer"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}

                      {section.status === 'rejected' && section.comments && (
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                          <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</p>
                          <p className="text-sm text-red-700">{section.comments}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      {sections.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No sections have been submitted yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

