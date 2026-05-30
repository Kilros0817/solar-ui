// Centralized interfaces and types for solar-ui
import type React from 'react';

// --- Contract ---
// Doc status: 0=PENDING, 1=DIVISION_REQUEST, 2=APPROVED, 3=REJECTED, 4=ESIGNED
export interface Contract {
  id: number;
  title: string;
  client: string;
  status: number;
  createdAt: number;
  category: string;
  cid?: string;
}

export type ContractWithSections = Contract & { sectionCount?: number };

export interface ContractListProps {
  title: string;
  filterStatus?: string;
  onCreateContract: () => void;
  onViewContract?: (contractId: number) => void;
  getViewPath?: (contractId: number) => string;
  divisionLeaderAddress?: string | null;
  showCreateButton?: boolean;
  showCreateWhenEmpty?: boolean;
  /** Override empty state subtext when no contracts (e.g. "No rejected contracts."). */
  emptySubtext?: string;
}

export interface ContractDocPayload {
  contractTitle?: string;
  client?: string;
  description?: string;
  price?: string;
  category?: string;
  sections?: Array<{
    sectionName: string;
    sectionContent: Array<{ clauseId: string; clauseContent: string }>;
  }>;
}

export interface ContractDetailsProps {
  contractId?: number;
  onBack?: () => void;
}

export interface ContractCreationProps {
  onBack: () => void;
  selectedTemplate: ContractTemplate;
}

export type ContractAssignment = {
  id: string;
  title: string;
  client: string;
  sectionCount: number;
  /** For division member: number of clauses assigned to them in this contract */
  assignedClauseCount?: number;
  /** Contract category (e.g. division label) */
  category?: string;
  /** Contract created date (Unix seconds or number) */
  createdAt?: number;
  /** Contract status (0=PENDING, 1=REQUEST, 2=APPROVED, 3=REJECTED, 4=ESIGNED) */
  status?: number;
};

// --- Contract Template ---
export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: React.ComponentType<{ className?: string }>;
  createdDate: string;
  lastModified: string;
  createdBy: string;
  sectionIds: string[];
}

export interface ESignSignature {
  cid: string;
  date?: string | number;
}

export interface ContractDocumentTemplateProps {
  title: string;
  client: string;
  value: string;
  createdDate: string;
  docContent?: ContractDocContent;
  /** When true, show Licensor/Licensee signature section (only when contract is approved by client). */
  showSignatureSection?: boolean;
  licensorSignature?: ESignSignature | null;
  licenseeSignature?: ESignSignature | null;
  gatewayBaseUrl?: string;
  /** Slot for Licensor column when no signature yet (e.g. SignaturePad + Sign button for legal team). */
  licensorSlot?: React.ReactNode;
  /** Slot for Licensee column when no signature yet (e.g. SignaturePad + Sign button for client). */
  licenseeSlot?: React.ReactNode;
  /** When true, hide clause highlight styling (used for client-facing view). */
  disableHighlight?: boolean;
}

export interface ContractTemplatePreviewModalProps {
  template: ContractTemplate;
  onClose: () => void;
  onUse?: () => void;
  sectionTemplates?: Record<string, Array<{ id: string; name: string; description: string; content?: string }>>;
}

export type EditingContract = ContractTemplate & { selectedSections?: { sectionName: string; versionId: string }[] };

// --- Document / Section ---
export interface Clause {
  clauseId: string;
  clauseContent: string;
}

export interface DocSection {
  sectionName: string;
  sectionContent?: Clause[];
}

export interface ContractDocContent {
  contractTitle?: string;
  client?: string;
  description?: string;
  price?: string;
  category?: string;
  sections?: DocSection[];
}

export type SectionWithDivision = {
  index: number;
  divisionLeader?: { dcategory?: number; firstName?: string; lastName?: string };
};

/** Section status values */
export type SectionStatus = 'pending' | 'review' | 'approved' | 'rejected';

/** One clause block in a section (for Section Review clause history). */
export interface SectionClauseBlock {
  /** On-chain clause id when clause has been assigned; absent for unassigned. */
  onChainClauseId?: string;
  clauseContent: string;
}

export interface Section {
  id: string;
  name: string;
  content: string;
  status: SectionStatus;
  /** Raw section status from subgraph: 0 = Pending, 1 = Review, 2 = Approved, 3 = Rejected */
  statusNum?: number;
  submittedBy: string;
  submittedDate: string;
  division: string;
  /** Division leader display name (from subgraph) */
  divisionLeaderName?: string;
  comments?: string;
  /** Per-clause blocks with on-chain id when available (for clause history in Section Review). */
  clauseBlocks?: SectionClauseBlock[];
}

export interface DivisionSection {
  division: string;
  sections: Section[];
}

export interface SectionReviewTabProps {
  sections: DivisionSection[];
  onApprove?: (sectionId: string) => void;
  onReject?: (sectionId: string, reason: string) => void;
  onReassign?: (sectionId: string) => void;
  userRole: number;
  processingSectionId?: string | null;
  /** When PENDING, legal can reassign approved sections (before submit to client). */
  contractStatus?: number;
}

export interface SectionTemplateWithVersions {
  sectionName: string;
  versions: { id: string; name: string; description: string; category: string }[];
}

export interface SectionTemplatePreview {
  id: string;
  name: string;
  sectionName?: string;
  description?: string;
  content?: string;
  clauseIds?: string[];
  [key: string]: unknown;
}

export type EditingSection = {
  id?: string;
  sectionName: string;
  name: string;
  description: string;
  category: string;
  selectedClauses?: ClauseTemplate[];
};

export interface SectionTemplateCreatorProps {
  onClose: () => void;
  onSave: (section: {
    sectionName: string;
    versionName: string;
    description: string;
    category: string;
    selectedClauses: ClauseTemplate[];
  }) => void | Promise<void>;
  availableClauses: ClauseTemplate[];
  editingSection?: EditingSection | null;
}

export interface SectionTemplatePreviewModalProps {
  template: SectionTemplatePreview;
  onClose: () => void;
  onUse?: () => void;
}

export interface SectionInfo {
  name: string;
  description: string;
  content: string;
}

// --- Clause Template ---
export interface ClauseTemplate {
  id: string;
  name: string;
  description?: string;
  content?: string;
  category?: string;
  [key: string]: unknown;
}

export interface ClauseTemplateCreatorProps {
  onClose: () => void;
  onSave: (clause: {
    name: string;
    description: string;
    content: string;
    category: string;
    templateId?: string;
  }) => void | Promise<void>;
  editingClause?: {
    id?: string;
    name: string;
    description: string;
    content: string;
    category: string;
  } | null;
}

export interface ClauseTemplatePreviewModalProps {
  template: ClauseTemplate;
  onClose: () => void;
  onUse?: () => void;
}

// --- Contract Template Creator ---
export interface ContractTemplateCreatorProps {
  onClose: () => void;
  onSave: (contract: {
    name: string;
    description: string;
    category: string;
    selectedSections: { sectionName: string; versionId: string }[];
  }) => void | Promise<void>;
  availableSections: SectionTemplateWithVersions[];
  editingContract?: EditingContract | null;
}

// --- Assignment ---
export interface Assignment {
  id: number;
  contractName: string;
  sectionName?: string;
  clauseName?: string;
  assignedBy: string;
  assignedDate: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'new' | 'viewed' | 'in-progress' | 'completed';
  assignedTo?: string;
}

// --- User / Division ---
export type UserRole = number | null;

export interface UserInfo {
  role: UserRole;
  firstName?: string;
  lastName?: string;
}

export interface UserContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  setUserInfo: (info: UserInfo) => void;
  userName: string;
  logout: () => Promise<void>;
}

export interface DivisionUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dcategory?: number;
  role?: number;
}

export interface DivisionGroup {
  leader: DivisionUser | null;
  members: DivisionUser[];
}

export interface PendingUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export type DivisionMember = { id: string; firstName?: string; lastName?: string; email?: string };

export type Member = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

// --- Layout / Provider ---
export interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export interface LayoutWrapperProps {
  children: React.ReactNode;
}

export interface DashboardProps {
  onCreateContract: () => void;
}

export interface TBProviderProps {
  children: React.ReactNode;
}

export interface NewContractChoiceProps {
  onSelectBlank: () => void;
  onSelectTemplate: () => void;
  onBack: () => void;
}

export interface NewContractContextType {
  templateId: string | null;
  setTemplateId: (id: string | null) => void;
  from: string;
  setFrom: (from: string) => void;
}

export interface TemplateLibraryProps {
  onSelectContractTemplate?: (template: ContractTemplate) => void;
}

export interface TeamManagementProps {
  userRole: number | null;
}

export interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
}

// Contract status helpers (used with Contract)
const STATUS_LABEL_TO_NUM: Record<string, number> = {
  pending: 0,
  'division-request': 1,
  approved: 2,
  rejected: 3,
  esigned: 4,
  completed: 4,
};

export const getContractsByStatus = (contracts: Contract[], status: string) => {
  if (status === 'all') return contracts;
  const statusNum = STATUS_LABEL_TO_NUM[status.toLowerCase()] ?? parseInt(status, 10);
  if (isNaN(statusNum)) return contracts;
  return contracts.filter((c) => c.status === statusNum);
};

export const getContractCounts = (contracts: Contract[]) => {
  return {
    all: contracts.length,
    pending: contracts.filter((c) => c.status === 0).length,
    divisionRequest: contracts.filter((c) => c.status === 1).length,
    approved: contracts.filter((c) => c.status === 2).length,
    rejected: contracts.filter((c) => c.status === 3).length,
    esigned: contracts.filter((c) => c.status === 4).length,
    /** @deprecated Use esigned (status 4) */
    completed: contracts.filter((c) => c.status === 4).length,
  };
};
