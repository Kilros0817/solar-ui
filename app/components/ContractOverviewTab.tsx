'use client'

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Calendar, DollarSign, Tag, ClipboardList, Building2, FileText, Send, Loader2, Check, X, History } from 'lucide-react';
import { ContractDocumentTemplate } from './ContractDocumentTemplate';
import { SignaturePad } from './SignaturePad';
import { RejectionReasonButton } from './RejectionReasonButton';
import { RejectionReasonModal } from './RejectionReasonModal';
import { USER_ROLE, CONTRACT_STATUS, CONTRACT_STATUS_LABELS } from '@/utils/constants';
import type { ContractDocPayload } from '../data/interfaces';

interface ContractOverviewTabProps {
  contract: {
    id: number;
    title: string;
    client: string;
    status: number;
    category: string;
    createdDate: string;
    description: string;
    value: string;
    involvedDivisions: string[];
  };
  userRole: number | null;
  docLoading: boolean;
  docError: string | null;
  docContent: ContractDocPayload | null;
  foundContract: any;
  rawDocument: any;
  gatewayBaseUrl: string;
  // Client review actions
  clientReviewAction?: 'approve' | 'reject' | null;
  onClientApprove?: () => void;
  onClientReject?: () => void;
  // Legal team actions
  allSectionsApproved?: boolean;
  submittingToClient?: boolean;
  onSubmitToClient?: () => void;
  onOpenDocHistory?: () => void;
  // E-sign
  esignSignatureDataUrl?: string | null;
  onEsignSignatureChange?: (dataUrl: string | null) => void;
  esignSubmitting?: boolean;
  onEsignSubmit?: (asLicensor: boolean) => void;
}

export function ContractOverviewTab({
  contract,
  userRole,
  docLoading,
  docError,
  docContent,
  foundContract,
  rawDocument,
  gatewayBaseUrl,
  clientReviewAction,
  onClientApprove,
  onClientReject,
  allSectionsApproved,
  submittingToClient,
  onSubmitToClient,
  onOpenDocHistory,
  esignSignatureDataUrl,
  onEsignSignatureChange,
  esignSubmitting,
  onEsignSubmit,
}: ContractOverviewTabProps) {
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false);

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-orange-100 text-orange-800 border-orange-200';
      case 1: return 'bg-blue-100 text-blue-800 border-blue-200';
      case 2: return 'bg-green-100 text-green-800 border-green-200';
      case 3: return 'bg-red-100 text-red-800 border-red-200';
      case 4: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <ClipboardList className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Status</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={getStatusColor(contract.status)}>
              {CONTRACT_STATUS_LABELS[contract.status] ?? 'Unknown'}
            </Badge>
            {contract.status === CONTRACT_STATUS.REJECTED && rawDocument?.rejectReason && (
              <RejectionReasonButton onClick={() => setShowRejectReasonModal(true)} />
            )}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Tag className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Category</span>
          </div>
          <p className="font-medium">{contract.category || '—'}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Value</span>
          </div>
          <p className="font-semibold text-green-600">{contract.value}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Created</span>
          </div>
          <p className="font-medium">{contract.createdDate}</p>
        </div>
      </div>

      {/* Involved Divisions */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Building2 className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Involved Divisions</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {contract.involvedDivisions.length > 0 ? (
            contract.involvedDivisions.map((division: string) => (
              <Badge key={division} variant="secondary" className="text-xs">
                {division}
              </Badge>
            ))
          ) : (
            <p className="font-medium text-muted-foreground">—</p>
          )}
        </div>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">{contract.description}</p>
        </CardContent>
      </Card>

      {/* Document View */}
      <div className="flex justify-center">
        <Card className="w-full max-w-3xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Document View
            </CardTitle>
            <div className="flex items-center gap-2 shrink-0">
              {/* Legal/Admin: Document History + Submit to Client */}
              {(userRole === USER_ROLE.LEGAL_TEAM || userRole === USER_ROLE.ADMIN) && onOpenDocHistory && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={onOpenDocHistory}
                  title="View document history"
                >
                  <History className="h-4 w-4" />
                  Document history
                </Button>
              )}
              {userRole === USER_ROLE.LEGAL_TEAM &&
                allSectionsApproved &&
                (foundContract?.status === CONTRACT_STATUS.PENDING || foundContract?.status === CONTRACT_STATUS.REJECTED) &&
                onSubmitToClient && (
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-2 bg-green-600 hover:bg-green-700"
                    disabled={submittingToClient}
                    onClick={onSubmitToClient}
                  >
                    {submittingToClient ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {submittingToClient ? 'Submitting...' : 'Submit to Client'}
                  </Button>
                )}
              {/* Client: Approve/Reject */}
              {contract.status === CONTRACT_STATUS.REQUEST && userRole === USER_ROLE.CLIENT && onClientApprove && onClientReject && (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-2 bg-green-600 hover:bg-green-700"
                    disabled={clientReviewAction !== null}
                    onClick={onClientApprove}
                  >
                    {clientReviewAction === 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {clientReviewAction === 'approve' ? 'Approving...' : 'Approve'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    disabled={clientReviewAction !== null}
                    onClick={onClientReject}
                  >
                    {clientReviewAction === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    {clientReviewAction === 'reject' ? 'Rejecting...' : 'Reject'}
                  </Button>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {docLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : docError ? (
              <p className="text-muted-foreground py-6 text-center">{docError}</p>
            ) : docContent ? (
              <ContractDocumentTemplate
                title={contract.title}
                client={contract.client}
                value={contract.value}
                createdDate={contract.createdDate}
                docContent={docContent}
                showSignatureSection={contract.status === CONTRACT_STATUS.APPROVED || contract.status === CONTRACT_STATUS.ESIGNED}
                licensorSignature={rawDocument?.legalESign ?? null}
                licenseeSignature={rawDocument?.clientESign ?? null}
                gatewayBaseUrl={gatewayBaseUrl}
                disableHighlight={
                  userRole === USER_ROLE.CLIENT ||
                  (contract.status === CONTRACT_STATUS.APPROVED || contract.status === CONTRACT_STATUS.ESIGNED)
                }
                licensorSlot={
                  contract.status === CONTRACT_STATUS.APPROVED &&
                    userRole === USER_ROLE.LEGAL_TEAM &&
                    !rawDocument?.legalESign?.cid &&
                    onEsignSignatureChange &&
                    onEsignSubmit ? (
                    <div className="space-y-2">
                      <SignaturePad onSignatureChange={onEsignSignatureChange} />
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-2"
                        disabled={!esignSignatureDataUrl || esignSubmitting}
                        onClick={() => onEsignSubmit(true)}
                      >
                        {esignSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {esignSubmitting ? 'Submitting...' : 'Sign'}
                      </Button>
                    </div>
                  ) : undefined
                }
                licenseeSlot={
                  contract.status === CONTRACT_STATUS.APPROVED &&
                    userRole === USER_ROLE.CLIENT &&
                    !rawDocument?.clientESign?.cid &&
                    onEsignSignatureChange &&
                    onEsignSubmit ? (
                    <div className="space-y-2">
                      <SignaturePad onSignatureChange={onEsignSignatureChange} />
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-2"
                        disabled={!esignSignatureDataUrl || esignSubmitting}
                        onClick={() => onEsignSubmit(false)}
                      >
                        {esignSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {esignSubmitting ? 'Submitting...' : 'Sign'}
                      </Button>
                    </div>
                  ) : undefined
                }
              />
            ) : foundContract?.cid ? (
              <p className="text-muted-foreground py-6 text-center">Document content unavailable</p>
            ) : (
              <ContractDocumentTemplate
                title={contract.title}
                client={contract.client}
                value={contract.value}
                createdDate={contract.createdDate}
                showSignatureSection={contract.status === CONTRACT_STATUS.APPROVED || contract.status === CONTRACT_STATUS.ESIGNED}
                licensorSignature={rawDocument?.legalESign ?? null}
                licenseeSignature={rawDocument?.clientESign ?? null}
                gatewayBaseUrl={gatewayBaseUrl}
                disableHighlight={
                  userRole === USER_ROLE.CLIENT ||
                  (userRole === USER_ROLE.LEGAL_TEAM &&
                    (contract.status === CONTRACT_STATUS.APPROVED || contract.status === CONTRACT_STATUS.ESIGNED))
                }
                licensorSlot={
                  contract.status === CONTRACT_STATUS.APPROVED &&
                    userRole === USER_ROLE.LEGAL_TEAM &&
                    !rawDocument?.legalESign?.cid &&
                    onEsignSignatureChange &&
                    onEsignSubmit ? (
                    <div className="space-y-2">
                      <SignaturePad onSignatureChange={onEsignSignatureChange} />
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-2"
                        disabled={!esignSignatureDataUrl || esignSubmitting}
                        onClick={() => onEsignSubmit(true)}
                      >
                        {esignSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {esignSubmitting ? 'Submitting...' : 'Sign'}
                      </Button>
                    </div>
                  ) : undefined
                }
                licenseeSlot={
                  contract.status === CONTRACT_STATUS.APPROVED &&
                    userRole === USER_ROLE.CLIENT &&
                    !rawDocument?.clientESign?.cid &&
                    onEsignSignatureChange &&
                    onEsignSubmit ? (
                    <div className="space-y-2">
                      <SignaturePad onSignatureChange={onEsignSignatureChange} />
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-2"
                        disabled={!esignSignatureDataUrl || esignSubmitting}
                        onClick={() => onEsignSubmit(false)}
                      >
                        {esignSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {esignSubmitting ? 'Submitting...' : 'Sign'}
                      </Button>
                    </div>
                  ) : undefined
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rejection Reason Modal */}
      <RejectionReasonModal
        isOpen={showRejectReasonModal}
        onClose={() => setShowRejectReasonModal(false)}
        reason={rawDocument?.rejectReason}
      />
    </div>
  );
}
