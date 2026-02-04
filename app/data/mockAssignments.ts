// Centralized mock data for assignments
import type { Assignment } from './interfaces';

export type { Assignment };

// Division Lead - Incoming assignments from Legal
export const divisionLeadIncoming: Assignment[] = [
  {
    id: 1,
    contractName: 'Enterprise Software License Agreement',
    sectionName: 'Payment Terms',
    assignedBy: 'Sarah Chen (Legal)',
    assignedDate: '2025-12-04 10:30 AM',
    dueDate: '2025-12-10',
    priority: 'high',
    status: 'new',
  },
  {
    id: 2,
    contractName: 'Vendor Service Agreement',
    sectionName: 'Service Level Requirements',
    assignedBy: 'Sarah Chen (Legal)',
    assignedDate: '2025-12-04 09:15 AM',
    dueDate: '2025-12-12',
    priority: 'medium',
    status: 'new',
  },
  {
    id: 3,
    contractName: 'Partnership Agreement',
    sectionName: 'Revenue Sharing Clause',
    assignedBy: 'Sarah Chen (Legal)',
    assignedDate: '2025-12-03 04:45 PM',
    dueDate: '2025-12-15',
    priority: 'low',
    status: 'viewed',
  },
];

// Division Lead - Work assigned to them (in progress)
export const divisionLeadAssignedWork: Assignment[] = [
  {
    id: 4,
    contractName: 'SaaS Agreement',
    sectionName: 'Compliance Requirements',
    assignedBy: 'Sarah Chen (Legal)',
    assignedDate: '2025-12-01 02:00 PM',
    dueDate: '2025-12-08',
    priority: 'high',
    status: 'in-progress',
  },
  {
    id: 5,
    contractName: 'Marketing Partnership',
    sectionName: 'Budget Allocation',
    assignedBy: 'Sarah Chen (Legal)',
    assignedDate: '2025-11-30 11:00 AM',
    dueDate: '2025-12-09',
    priority: 'medium',
    status: 'in-progress',
  },
  {
    id: 6,
    contractName: 'Data Processing Agreement',
    sectionName: 'Security Standards',
    assignedBy: 'Sarah Chen (Legal)',
    assignedDate: '2025-11-28 03:30 PM',
    dueDate: '2025-12-11',
    priority: 'high',
    status: 'in-progress',
  },
  {
    id: 7,
    contractName: 'Maintenance Contract',
    sectionName: 'Response Time Guarantees',
    assignedBy: 'Sarah Chen (Legal)',
    assignedDate: '2025-11-27 10:15 AM',
    dueDate: '2025-12-13',
    priority: 'low',
    status: 'in-progress',
  },
];

// Division Lead - Assignments distributed to team members
export const divisionLeadTeamAssignments: Assignment[] = [
  {
    id: 8,
    contractName: 'Enterprise Software License Agreement',
    sectionName: 'Payment Terms',
    clauseName: 'Payment Schedule',
    assignedBy: 'Jennifer Taylor (Division Lead)',
    assignedDate: '2025-12-04 02:30 PM',
    dueDate: '2025-12-10',
    priority: 'high',
    status: 'new',
    assignedTo: 'David Kim',
  },
  {
    id: 9,
    contractName: 'Enterprise Software License Agreement',
    sectionName: 'Payment Terms',
    clauseName: 'Late Payment Penalties',
    assignedBy: 'Jennifer Taylor (Division Lead)',
    assignedDate: '2025-12-04 02:30 PM',
    dueDate: '2025-12-10',
    priority: 'high',
    status: 'new',
    assignedTo: 'David Kim',
  },
  {
    id: 10,
    contractName: 'SaaS Agreement',
    sectionName: 'Compliance Requirements',
    clauseName: 'Data Protection Standards',
    assignedBy: 'Jennifer Taylor (Division Lead)',
    assignedDate: '2025-12-02 09:00 AM',
    dueDate: '2025-12-08',
    priority: 'high',
    status: 'in-progress',
    assignedTo: 'Emily Martinez',
  },
  {
    id: 11,
    contractName: 'SaaS Agreement',
    sectionName: 'Compliance Requirements',
    clauseName: 'Audit Requirements',
    assignedBy: 'Jennifer Taylor (Division Lead)',
    assignedDate: '2025-12-02 09:00 AM',
    dueDate: '2025-12-08',
    priority: 'medium',
    status: 'in-progress',
    assignedTo: 'Emily Martinez',
  },
  {
    id: 12,
    contractName: 'Marketing Partnership',
    sectionName: 'Budget Allocation',
    clauseName: 'Quarterly Budget Review',
    assignedBy: 'Jennifer Taylor (Division Lead)',
    assignedDate: '2025-11-30 01:30 PM',
    dueDate: '2025-12-09',
    priority: 'medium',
    status: 'in-progress',
    assignedTo: 'James Wilson',
  },
];

// Division Member - Incoming assignments from Division Lead
export const divisionMemberIncoming: Assignment[] = [
  {
    id: 8,
    contractName: 'Enterprise Software License Agreement',
    sectionName: 'Payment Terms',
    clauseName: 'Payment Schedule',
    assignedBy: 'Jennifer Taylor (Division Lead)',
    assignedDate: '2025-12-04 02:30 PM',
    dueDate: '2025-12-10',
    priority: 'high',
    status: 'new',
  },
  {
    id: 9,
    contractName: 'Enterprise Software License Agreement',
    sectionName: 'Payment Terms',
    clauseName: 'Late Payment Penalties',
    assignedBy: 'Jennifer Taylor (Division Lead)',
    assignedDate: '2025-12-04 02:30 PM',
    dueDate: '2025-12-10',
    priority: 'high',
    status: 'new',
  },
  {
    id: 13,
    contractName: 'Vendor Service Agreement',
    sectionName: 'Service Level Requirements',
    clauseName: 'Response Time Requirements',
    assignedBy: 'Jennifer Taylor (Division Lead)',
    assignedDate: '2025-12-04 11:00 AM',
    dueDate: '2025-12-12',
    priority: 'medium',
    status: 'viewed',
  },
];

// Division Member - Assignments they're working on
export const divisionMemberAssignments: Assignment[] = [
  {
    id: 14,
    contractName: 'SaaS Agreement',
    sectionName: 'Compliance Requirements',
    clauseName: 'Security Audit Procedures',
    assignedBy: 'Jennifer Taylor (Division Lead)',
    assignedDate: '2025-12-01 10:00 AM',
    dueDate: '2025-12-08',
    priority: 'high',
    status: 'in-progress',
  },
  {
    id: 15,
    contractName: 'Marketing Partnership',
    sectionName: 'Budget Allocation',
    clauseName: 'Annual Budget Cap',
    assignedBy: 'Jennifer Taylor (Division Lead)',
    assignedDate: '2025-11-29 02:15 PM',
    dueDate: '2025-12-09',
    priority: 'medium',
    status: 'in-progress',
  },
  {
    id: 16,
    contractName: 'Data Processing Agreement',
    sectionName: 'Security Standards',
    clauseName: 'Encryption Requirements',
    assignedBy: 'Jennifer Taylor (Division Lead)',
    assignedDate: '2025-11-28 11:30 AM',
    dueDate: '2025-12-11',
    priority: 'high',
    status: 'in-progress',
  },
  {
    id: 17,
    contractName: 'Maintenance Contract',
    sectionName: 'Response Time Guarantees',
    clauseName: 'Emergency Response SLA',
    assignedBy: 'Jennifer Taylor (Division Lead)',
    assignedDate: '2025-11-27 03:00 PM',
    dueDate: '2025-12-13',
    priority: 'low',
    status: 'in-progress',
  },
  {
    id: 18,
    contractName: 'Franchise Agreement',
    sectionName: 'Royalty Payments',
    clauseName: 'Payment Frequency',
    assignedBy: 'Jennifer Taylor (Division Lead)',
    assignedDate: '2025-11-25 09:45 AM',
    dueDate: '2025-12-14',
    priority: 'medium',
    status: 'in-progress',
  },
  {
    id: 19,
    contractName: 'Partnership MOU',
    sectionName: 'Collaboration Terms',
    clauseName: 'IP Ownership',
    assignedBy: 'Jennifer Taylor (Division Lead)',
    assignedDate: '2025-11-24 04:20 PM',
    dueDate: '2025-12-16',
    priority: 'low',
    status: 'in-progress',
  },
];

// Helper functions
export const getNewAssignmentsCount = (assignments: Assignment[]) => {
  return assignments.filter(a => a.status === 'new').length;
};

export const getInProgressCount = (assignments: Assignment[]) => {
  return assignments.filter(a => a.status === 'in-progress').length;
};
