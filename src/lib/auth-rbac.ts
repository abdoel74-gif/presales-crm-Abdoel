import { UserRole } from '../types.ts';

export type AppPermissionModule = 
  | 'dashboard'
  | 'accounts'
  | 'opportunities'
  | 'presales-queue'
  | 'sizing-engine'
  | 'boq-pricing'
  | 'sow-builder'
  | 'handover'
  | 'assets-poc'
  | 'tech-desk'
  | 'whatsapp-gateway'
  | 'audit-rbac';

export type AppAction = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export';

export interface UserRoleRecord {
  role: UserRole;
  roleTitle: string;
  permissions: {
    [module in AppPermissionModule]?: AppAction[];
  };
}

/**
 * Standard enterprise role-permission matrix reflecting multi-tenant RBAC policies
 */
export const ROLE_PERMISSIONS: Record<UserRole, Record<AppPermissionModule, AppAction[]>> = {
  [UserRole.SUPER_ADMIN]: {
    'dashboard': ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    'accounts': ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    'opportunities': ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    'presales-queue': ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    'sizing-engine': ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    'boq-pricing': ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    'sow-builder': ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    'handover': ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    'assets-poc': ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    'tech-desk': ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    'whatsapp-gateway': ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    'audit-rbac': ['view', 'create', 'edit', 'delete', 'approve', 'export'],
  },
  [UserRole.SALES_DIRECTOR]: {
    'dashboard': ['view', 'export'],
    'accounts': ['view', 'create', 'edit', 'export'],
    'opportunities': ['view', 'create', 'edit', 'approve', 'export'],
    'presales-queue': ['view', 'create', 'edit', 'approve', 'export'],
    'sizing-engine': ['view', 'export'],
    'boq-pricing': ['view', 'approve', 'export'],
    'sow-builder': ['view', 'approve', 'export'],
    'handover': ['view', 'approve'],
    'assets-poc': ['view'],
    'tech-desk': ['view'],
    'whatsapp-gateway': ['view', 'create'],
    'audit-rbac': ['view', 'export'],
  },
  [UserRole.SOLUTIONS_ARCHITECT]: {
    'dashboard': ['view'],
    'accounts': ['view'],
    'opportunities': ['view'],
    'presales-queue': ['view', 'edit', 'export'],
    'sizing-engine': ['view', 'create', 'edit', 'export'],
    'boq-pricing': ['view', 'create', 'edit', 'export'],
    'sow-builder': ['view', 'create', 'edit', 'export'],
    'handover': ['view', 'create', 'edit'],
    'assets-poc': ['view', 'edit'],
    'tech-desk': ['view', 'create', 'edit'],
    'whatsapp-gateway': ['view'],
    'audit-rbac': [],
  },
  [UserRole.ACCOUNT_EXECUTIVE]: {
    'dashboard': ['view'],
    'accounts': ['view', 'create', 'edit'],
    'opportunities': ['view', 'create', 'edit'],
    'presales-queue': ['view', 'create'],
    'sizing-engine': ['view'],
    'boq-pricing': ['view'],
    'sow-builder': ['view'],
    'handover': ['view'],
    'assets-poc': ['view'],
    'tech-desk': ['view', 'create'],
    'whatsapp-gateway': ['view'],
    'audit-rbac': [],
  },
  [UserRole.PRESALES_LEAD]: {
    'dashboard': ['view', 'export'],
    'accounts': ['view'],
    'opportunities': ['view', 'export'],
    'presales-queue': ['view', 'create', 'edit', 'approve', 'export'],
    'sizing-engine': ['view', 'create', 'edit', 'export'],
    'boq-pricing': ['view', 'create', 'edit', 'approve', 'export'],
    'sow-builder': ['view', 'create', 'edit', 'approve', 'export'],
    'handover': ['view', 'create', 'edit', 'approve'],
    'assets-poc': ['view', 'create', 'edit'],
    'tech-desk': ['view', 'create', 'edit'],
    'whatsapp-gateway': ['view', 'create'],
    'audit-rbac': ['view'],
  },
  [UserRole.DELIVERY_PM]: {
    'dashboard': ['view'],
    'accounts': ['view'],
    'opportunities': ['view'],
    'presales-queue': ['view'],
    'sizing-engine': ['view'],
    'boq-pricing': ['view'],
    'sow-builder': ['view'],
    'handover': ['view', 'edit', 'approve', 'export'],
    'assets-poc': ['view', 'create', 'edit', 'export'],
    'tech-desk': ['view', 'create', 'edit'],
    'whatsapp-gateway': ['view'],
    'audit-rbac': [],
  },
};

/**
 * Authorization engine to determine if user role is allowed to perform action on a module
 */
export function can(role: UserRole | string | null | undefined, moduleName: AppPermissionModule, action: AppAction = 'view'): boolean {
  if (!role) return false;
  const userRole = role as UserRole;
  const modulePermissions = ROLE_PERMISSIONS[userRole]?.[moduleName];
  if (!modulePermissions) return false;
  return modulePermissions.includes(action);
}

/**
 * Module metadata for access control rules & descriptions
 */
export const MODULE_ACCESS_DESCRIPTIONS: Record<AppPermissionModule, { title: string; minRequiredRoles: string; description: string }> = {
  'dashboard': {
    title: 'Executive Dashboard',
    minRequiredRoles: 'All authenticated personnel',
    description: 'Real-time overview of deal pipeline, presales workload metrics, and SLA status.',
  },
  'accounts': {
    title: 'Accounts & Stakeholder Buying Centers',
    minRequiredRoles: 'Account Executives, Sales Directors, Super Admins',
    description: 'Enterprise company dossiers, customer hierarchies, and stakeholder mapping.',
  },
  'opportunities': {
    title: 'Opportunity Pipeline & MEDDPICC',
    minRequiredRoles: 'Sales Team, Solutions Architects, Super Admins',
    description: 'Deal qualification, revenue forecasting, MEDDPICC framework metrics.',
  },
  'presales-queue': {
    title: 'Presales Request & RFP Queue',
    minRequiredRoles: 'Solutions Architects, Presales Leads, Sales Directors',
    description: 'Technical request triage, RFP parsing, SLA turnaround countdowns.',
  },
  'sizing-engine': {
    title: 'Technical Sizing & Topology Calculator',
    minRequiredRoles: 'Solutions Architects, Presales Leads, Super Admins',
    description: 'Compute, high-IOPS storage, and network resource capacity planning.',
  },
  'boq-pricing': {
    title: 'Dynamic BOQ & Multi-Currency Pricing',
    minRequiredRoles: 'Solutions Architects (Edit), Presales Leads & Directors (Approve)',
    description: 'Bill of Quantities pricing builder with gross margin floor guards.',
  },
  'sow-builder': {
    title: 'Statement of Work (SOW) Generator',
    minRequiredRoles: 'Solutions Architects (Author), Presales Lead/Director (Sign-off)',
    description: 'Contract scope clauses, deliverables, RACI matrix, and Gemini scope draft.',
  },
  'handover': {
    title: 'Project Handover (Sales → Delivery PM)',
    minRequiredRoles: 'Delivery PMs, Presales Leads, Sales Directors',
    description: 'Post-sales project transition with scope baseline lock and milestone handoffs.',
  },
  'assets-poc': {
    title: 'Demo Assets & POC Loaner Hardware',
    minRequiredRoles: 'Delivery PMs, Solutions Architects, Presales Leads',
    description: 'Field demonstration hardware tracking, loan durations, and return SLAs.',
  },
  'tech-desk': {
    title: 'RFP Knowledge Base & Technical Desk',
    minRequiredRoles: 'All Technical Staff & Sales Representatives',
    description: 'RFP question-and-answer library and technical clarification tickets.',
  },
  'whatsapp-gateway': {
    title: 'WhatsApp Business API Gateway',
    minRequiredRoles: 'Presales Leads, Sales Directors, Super Admins',
    description: 'Automated SLA notifications, approval dispatches, and webhook logs.',
  },
  'audit-rbac': {
    title: 'Audit Trail & Supabase RLS Governance',
    minRequiredRoles: 'Super Admins & Sales Directors Only',
    description: 'Immutable system audit logs, user session tracking, and RLS policy validation.',
  },
};
