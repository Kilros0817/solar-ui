'use client'

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Building2,
  AlertCircle,
  Eye
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { useState } from 'react';
import { USER_ROLE } from '@/utils/constants';

interface Section {
  id: string;
  name: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: string;
  submittedDate: string;
  division: string;
  comments?: string;
}

interface DivisionSection {
  division: string;
  sections: Section[];
}

interface SectionReviewTabProps {
  sections: DivisionSection[];
  onApprove?: (sectionId: string) => void;
  onReject?: (sectionId: string, reason: string) => void;
  userRole: number;
}

export function SectionReviewTab({ 
  sections, 
  onApprove, 
  onReject,
  userRole 
}: SectionReviewTabProps) {
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<Record<string, boolean>>({});
  const [expandedDivisions, setExpandedDivisions] = useState<Record<string, boolean>>({});

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const handleReject = (sectionId: string) => {
    const reason = rejectReasons[sectionId] || '';
    if (reason.trim()) {
      onReject?.(sectionId, reason);
      setShowRejectInput({ ...showRejectInput, [sectionId]: false });
      setRejectReasons({ ...rejectReasons, [sectionId]: '' });
    }
  };

  const toggleDivision = (division: string) => {
    setExpandedDivisions({ ...expandedDivisions, [division]: !expandedDivisions[division] });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
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
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-orange-600">
                  {sections.reduce((sum, div) => sum + div.sections.filter(s => s.status === 'pending').length, 0)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
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
        <Card>
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
                    <div className="flex items-center gap-2">
                      {getStatusBadge(
                        divisionSection.sections.every(s => s.status === 'approved') 
                          ? 'approved' 
                          : divisionSection.sections.some(s => s.status === 'pending')
                          ? 'pending'
                          : 'rejected'
                      )}
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
                            {getStatusBadge(section.status)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-xs">
                                {getInitials(section.submittedBy)}
                              </AvatarFallback>
                            </Avatar>
                            <span>Submitted by {section.submittedBy}</span>
                            <span>•</span>
                            <span>{section.submittedDate}</span>
                          </div>
                          <div className="bg-white rounded p-3 border max-h-32 overflow-y-auto">
                            <p className="text-sm leading-relaxed line-clamp-3">{section.content}</p>
                          </div>
                        </div>
                      </div>

                      {section.status === 'pending' && (
                        <div className="flex items-end gap-2 pt-2 border-t">
                          <div className="flex-1">
                            {showRejectInput[section.id] ? (
                              <div className="space-y-2">
                                <Textarea
                                  placeholder="Reason for rejection..."
                                  value={rejectReasons[section.id] || ''}
                                  onChange={(e) => setRejectReasons({ ...rejectReasons, [section.id]: e.target.value })}
                                  className="min-h-[80px]"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleReject(section.id)}
                                    disabled={!rejectReasons[section.id]?.trim()}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Confirm Reject
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setShowRejectInput({ ...showRejectInput, [section.id]: false });
                                      setRejectReasons({ ...rejectReasons, [section.id]: '' });
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => onApprove?.(section.id)}
                                  className="!bg-green-600 !hover:bg-green-700 !text-white !border-green-600 shadow-sm font-medium"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setShowRejectInput({ ...showRejectInput, [section.id]: true })}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {/* View full section */}}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Full
                                </Button>
                              </div>
                            )}
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

