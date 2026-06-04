'use client'

import { createPortal } from 'react-dom';
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
  UserPlus,
  RefreshCw,
  Loader2,
  History,
  RotateCcw,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { useState, useCallback } from 'react';
import { USER_ROLE, CONTRACT_STATUS, URLs } from '@/utils/constants';
import { getSectionHistories, getClauseHistories } from '@/utils/subgraph';
import { formatSectionHistoryReadable, formatClauseHistoryReadable } from '@/utils/utility';
import { toast } from 'sonner';
import type { DocSection } from '@/app/data/interfaces';
import type { SectionReviewTabProps } from '../data/interfaces';
import { RejectReasonDialog } from './RejectReasonDialog';
import { ClauseLexicalEditor } from './editor/ClauseLexicalEditor';

type SectionHistoryItem = { type?: string; id?: string; date?: string | number; cid?: string | null };
type ClauseHistoryItem = { type?: string; id?: string; date?: string | number; cid?: string | null };

export function SectionReviewTab({
  sections,
  onApprove,
  onReject,
  userRole,
  processingSectionId = null,
  contractStatus,
}: SectionReviewTabProps) {
  const [expandedDivisions, setExpandedDivisions] = useState<Record<string, boolean>>({});
  const [rejectSectionId, setRejectSectionId] = useState<string | null>(null);
  const [sectionHistorySectionId, setSectionHistorySectionId] = useState<string | null>(null);
  const [sectionHistories, setSectionHistories] = useState<SectionHistoryItem[]>([]);
  const [loadingSectionHistories, setLoadingSectionHistories] = useState(false);
  const [loadingViewHistoryCid, setLoadingViewHistoryCid] = useState<string | null>(null);
  const [sectionIdViewingPast, setSectionIdViewingPast] = useState<string | null>(null);
  const [pastSectionDisplay, setPastSectionDisplay] = useState<{ sectionName: string; content: string } | null>(null);
  const [pastSectionDisplayKey, setPastSectionDisplayKey] = useState(0);
  const [clauseHistoryClauseId, setClauseHistoryClauseId] = useState<string | null>(null);
  const [clauseHistories, setClauseHistories] = useState<ClauseHistoryItem[]>([]);
  const [loadingClauseHistories, setLoadingClauseHistories] = useState(false);
  const [clauseHistoryPreviewContent, setClauseHistoryPreviewContent] = useState<string | null>(null);
  const [loadingClauseHistoryCid, setLoadingClauseHistoryCid] = useState<string | null>(null);
  const [clauseHistoryPreviewKey, setClauseHistoryPreviewKey] = useState(0);

  const openClauseHistoryModal = useCallback(async (onChainClauseId: string) => {
    setClauseHistoryClauseId(onChainClauseId);
    setClauseHistoryPreviewContent(null);
    setLoadingClauseHistories(true);
    setClauseHistories([]);
    try {
      const list = await getClauseHistories(onChainClauseId);
      const sorted = Array.isArray(list)
        ? [...list].sort((a, b) => {
          const da = a.date != null ? Number(a.date) : 0;
          const db = b.date != null ? Number(b.date) : 0;
          return da - db;
        })
        : [];
      setClauseHistories(sorted);
    } catch (e) {
      console.error('Failed to load clause histories:', e);
      toast.error('Failed to load history');
      setClauseHistories([]);
    } finally {
      setLoadingClauseHistories(false);
    }
  }, []);

  const handleViewClauseHistoryCid = useCallback(async (cid: string) => {
    if (!cid || loadingClauseHistoryCid) return;
    setLoadingClauseHistoryCid(cid);
    try {
      const res = await fetch(`${URLs.TBGateWay}${cid}`);
      const data = res.ok ? await res.json() : null;
      const content = typeof data?.clauseContent === 'string' ? data.clauseContent : '';
      setClauseHistoryPreviewContent(content);
      setClauseHistoryPreviewKey((k) => k + 1);
    } catch (e) {
      console.error('Failed to load clause history content:', e);
      toast.error('Failed to load content from history');
    } finally {
      setLoadingClauseHistoryCid(null);
    }
  }, [loadingClauseHistoryCid]);

  const openSectionHistoryModal = useCallback(async (sectionId: string) => {
    setSectionHistorySectionId(sectionId);
    setLoadingSectionHistories(true);
    setSectionHistories([]);
    try {
      const list = await getSectionHistories(sectionId);
      const sorted = Array.isArray(list)
        ? [...list].sort((a, b) => {
          const da = a.date != null ? Number(a.date) : 0;
          const db = b.date != null ? Number(b.date) : 0;
          return da - db;
        })
        : [];
      setSectionHistories(sorted);
    } catch (e) {
      console.error('Failed to load section histories:', e);
      toast.error('Failed to load history');
      setSectionHistories([]);
    } finally {
      setLoadingSectionHistories(false);
    }
  }, []);


  const handleViewSectionHistoryCid = useCallback(async (cid: string) => {
    const sectionId = sectionHistorySectionId;
    if (!cid || !sectionId || loadingViewHistoryCid) return;
    setLoadingViewHistoryCid(cid);
    try {
      const res = await fetch(`${URLs.TBGateWay}${cid}`);
      const data = res.ok ? (await res.json()) : null;
      const section = data as DocSection | null;
      const sectionName = section?.sectionName ?? 'Section';
      const sectionContent = section?.sectionContent ?? [];
      const contentPreview = sectionContent
        .filter((c) => c?.clauseContent != null)
        .map((c) => (c as { clauseContent: string }).clauseContent)
        .join('\n\n');
      setSectionIdViewingPast(sectionId);
      setPastSectionDisplay({ sectionName, content: contentPreview || 'No content.' });
      setPastSectionDisplayKey((k) => k + 1);
      setSectionHistorySectionId(null);
    } catch (e) {
      console.error('Failed to load section from history:', e);
      toast.error('Failed to load content');
    } finally {
      setLoadingViewHistoryCid(null);
    }
  }, [loadingViewHistoryCid, sectionHistorySectionId]);

  const goToCurrentSection = useCallback(() => {
    setSectionIdViewingPast(null);
    setPastSectionDisplay(null);
    setPastSectionDisplayKey((k) => k + 1);
  }, []);

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

  const canAccessSectionReview = userRole === USER_ROLE.LEGAL_TEAM || userRole === USER_ROLE.ADMIN;
  const isReadOnly = userRole === USER_ROLE.ADMIN;

  if (!canAccessSectionReview) {
    return (
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="text-center text-muted-foreground py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Section review is only available for legal team members and admins.</p>
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
                      className={`border rounded-lg p-4 space-y-3 ${section.status === 'approved' ? 'bg-green-50/50 border-green-200' :
                        section.status === 'rejected' ? 'bg-red-50/50 border-red-200' :
                          'bg-orange-50/50 border-orange-200'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h4 className="font-semibold">
                              {sectionIdViewingPast === section.id && pastSectionDisplay
                                ? pastSectionDisplay.sectionName
                                : section.name}
                            </h4>
                            {getSectionStatusBadge(section.statusNum)}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 h-8 shrink-0"
                              onClick={() => openSectionHistoryModal(section.id)}
                              title="View section history"
                            >
                              <History className="h-3.5 w-3.5" />
                              History
                            </Button>
                            {sectionIdViewingPast === section.id && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1.5 h-8 shrink-0"
                                onClick={goToCurrentSection}
                                title="View current version of section"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Go to current
                              </Button>
                            )}
                          </div>
                          {section.divisionLeaderName && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {section.division} Leader: {section.divisionLeaderName}
                            </p>
                          )}
                          <div className="bg-white rounded p-3 border max-h-32 overflow-y-auto">
                            {(() => {
                              const viewingPast = sectionIdViewingPast === section.id && pastSectionDisplay;
                              if (viewingPast) {
                                const blocks = (pastSectionDisplay.content ?? '').split(/\n\n+/).filter((b) => b.trim());
                                if (blocks.length === 0) {
                                  return <p className="text-sm leading-relaxed text-muted-foreground">No content</p>;
                                }
                                return (
                                  <div className="space-y-3">
                                    {blocks.map((block, i) => (
                                      <div key={i} className="text-sm leading-[1.7]">
                                        <ClauseLexicalEditor
                                          key={`section-${section.id}-past-${pastSectionDisplayKey}-${i}`}
                                          initialContent={block}
                                          readOnly
                                          className="text-sm"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                              if (section.clauseBlocks && section.clauseBlocks.length > 0) {
                                return (
                                  <div className="space-y-3">
                                    {section.clauseBlocks.map((block, i) => {
                                      const assignedName = block.assignedTo
                                        ? [block.assignedTo.firstName, block.assignedTo.lastName].filter(Boolean).join(' ').trim()
                                        : null;
                                      const displayName = assignedName && assignedName.length > 0 ? assignedName : 'Unassigned';
                                      return (
                                        <div key={i} className="text-sm leading-[1.7]">
                                          <div className='flex flex-row justify-between'>
                                            <div className="bg-red-600 text-muted-foreground px-3 py-2 rounded mb-2 font-semibold text-xs">
                                              {displayName}
                                            </div>
                                            {block.onChainClauseId && userRole === USER_ROLE.ADMIN && (
                                              <div className="flex justify-end mb-1">
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="sm"
                                                  className="gap-1.5 h-8 shrink-0"
                                                  onClick={() => openClauseHistoryModal(block.onChainClauseId!)}
                                                  title="View clause history"
                                                >
                                                  <History className="h-3.5 w-3.5" />
                                                  Clause history
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                          <ClauseLexicalEditor
                                            key={`section-${section.id}-clause-${i}`}
                                            initialContent={block.clauseContent}
                                            readOnly
                                            className="text-sm"
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              }
                              const blocks = (section.content ?? '').split(/\n\n+/).filter((b) => b.trim());
                              if (blocks.length === 0) {
                                return <p className="text-sm leading-relaxed text-muted-foreground">No content</p>;
                              }
                              return (
                                <div className="space-y-3">
                                  {blocks.map((block, i) => (
                                    <div key={i} className="text-sm leading-[1.7]">
                                      <ClauseLexicalEditor
                                        key={`section-${section.id}-current-${i}`}
                                        initialContent={block}
                                        readOnly
                                        className="text-sm"
                                      />
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-end gap-2 pt-2 border-t">
                        {!isReadOnly && sectionIdViewingPast !== section.id && (section.status === 'review' || section.status === 'approved') && (
                          <div className="flex gap-2">
                            {section.status === 'review' && (
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
                            )}
                            {contractStatus === 0 || contractStatus === 3 && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setRejectSectionId(section.id)}
                                disabled={processingSectionId === section.id}
                                className="cursor-pointer"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
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

      {typeof document !== 'undefined' &&
        sectionHistorySectionId !== null &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="section-history-modal-title"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/70" onClick={() => setSectionHistorySectionId(null)} />
            <div
              className="relative z-10 w-sm rounded-lg border bg-background p-6 shadow-lg max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="section-history-modal-title" className="text-lg font-semibold leading-none tracking-tight mb-4">
                Section history
              </h2>
              {loadingSectionHistories ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : sectionHistories.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No history for this section.</p>
              ) : (
                <ul className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-1">
                  {sectionHistories.map((h, i) => (
                    <li key={h.id ?? i} className="text-sm rounded-md border bg-muted/30 px-3 py-2">
                      {h.cid ? (
                        <button
                          type="button"
                          onClick={() => handleViewSectionHistoryCid(h.cid!)}
                          disabled={!!loadingViewHistoryCid}
                          className="clause-history-link text-left w-full text-foreground cursor-pointer"
                        >
                          {loadingViewHistoryCid === h.cid ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                              {formatSectionHistoryReadable(h)}
                            </span>
                          ) : (
                            formatSectionHistoryReadable(h)
                          )}
                        </button>
                      ) : (
                        <span className="text-foreground">{formatSectionHistoryReadable(h)}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex justify-end mt-4 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setSectionHistorySectionId(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {typeof document !== 'undefined' &&
        clauseHistoryClauseId !== null &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="clause-history-modal-title"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/70"
              onClick={() => {
                setClauseHistoryClauseId(null);
                setClauseHistoryPreviewContent(null);
              }}
            />
            <div
              className="relative z-10 w-sm rounded-lg border bg-background p-6 shadow-lg max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="clause-history-modal-title" className="text-lg font-semibold leading-none tracking-tight mb-4">
                Clause history
              </h2>
              {clauseHistoryPreviewContent !== null ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 self-start mb-3"
                    onClick={() => setClauseHistoryPreviewContent(null)}
                  >
                    <RotateCcw className="h-4 w-4 shrink-0" />
                    Back to list
                  </Button>
                  <div className="rounded-md border border-input bg-muted/30 p-3 flex-1 min-h-0 overflow-y-auto [&_.clause-editor-container]:min-h-0 [&_.clause-editor-inner]:min-h-0">
                    <ClauseLexicalEditor
                      key={`clause-history-preview-${clauseHistoryPreviewKey}`}
                      initialContent={clauseHistoryPreviewContent}
                      readOnly
                      className="text-sm"
                    />
                  </div>
                </>
              ) : loadingClauseHistories ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : clauseHistories.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No history for this clause.</p>
              ) : (
                <ul className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-1">
                  {clauseHistories.map((h, i) => {
                    const description = formatClauseHistoryReadable(h);
                    const hasCid = !!h.cid;
                    const isLoading = hasCid && loadingClauseHistoryCid === h.cid;
                    return (
                      <li key={h.id ?? i} className="text-sm rounded-md border bg-muted/30 px-3 py-2">
                        {hasCid ? (
                          <button
                            type="button"
                            onClick={() => handleViewClauseHistoryCid(h.cid!)}
                            disabled={!!loadingClauseHistoryCid}
                            className="clause-history-link text-left w-full text-foreground cursor-pointer"
                            title="View content at this point in history"
                          >
                            {isLoading ? (
                              <span className="inline-flex items-center gap-1.5">
                                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                                {description}
                              </span>
                            ) : (
                              description
                            )}
                          </button>
                        ) : (
                          <span className="text-foreground">{description}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="flex justify-end mt-4 pt-2 border-t shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setClauseHistoryClauseId(null);
                    setClauseHistoryPreviewContent(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <RejectReasonDialog
        open={rejectSectionId !== null}
        onOpenChange={(open) => !open && setRejectSectionId(null)}
        title="Reject section"
        description="Please provide a reason for rejecting this section."
        placeholder="Enter rejection reason..."
        submitLabel="Reject section"
        isSubmitting={rejectSectionId !== null && processingSectionId === rejectSectionId}
        onSubmit={async (reason) => {
          if (rejectSectionId) onReject?.(rejectSectionId, reason);
        }}
      />
    </div>
  );
}

