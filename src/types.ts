export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  SALES_DIRECTOR = 'sales_director',
  SOLUTIONS_ARCHITECT = 'solutions_architect',
  ACCOUNT_EXECUTIVE = 'account_executive',
  PRESALES_LEAD = 'presales_lead',
  DELIVERY_PM = 'delivery_pm',
}

export enum OpportunityStage {
  PROSPECTING = 'Prospecting',
  QUALIFICATION = 'Qualification (MEDDPICC)',
  TECHNICAL_SIZING = 'Technical Sizing & Architecture',
  PROPOSAL_BOQ = 'Proposal & BOQ Draft',
  POC_POV = 'POC / Demonstration',
  NEGOTIATION = 'Commercial Negotiation',
  CLOSED_WON = 'Closed Won (Handover)',
  CLOSED_LOST = 'Closed Lost',
}

export enum PresalesStatus {
  UNASSIGNED = 'Unassigned',
  IN_ANALYSIS = 'In Architecture Analysis',
  SIZING_IN_PROGRESS = 'Sizing & Topology in Progress',
  BOQ_SUBMITTED = 'BOQ & Pricing Submitted',
  SOW_REVIEW = 'SOW Review',
  APPROVED = 'Approved for Submission',
  COMPLETED = 'Completed',
}

export enum PriorityLevel {
  URGENT = 'Urgent (24h SLA)',
  HIGH = 'High (48h SLA)',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  department: string;
}

export interface OpportunityItem {
  id: string;
  code: string;
  title: string;
  accountName: string;
  industry: string;
  dealValue: number; // in IDR
  currency: 'IDR' | 'USD';
  stage: OpportunityStage;
  probability: number;
  assignedAE: string;
  assignedSA?: string;
  meddpiccScore: number; // 0 - 100
  rfpDueDate?: string;
  createdAt: string;
}

export interface PresalesTask {
  id: string;
  requestCode: string;
  opportunityTitle: string;
  accountName: string;
  status: PresalesStatus;
  priority: PriorityLevel;
  techDomain: string[]; // e.g. ['Cloud Infra', 'Cybersecurity', 'SD-WAN']
  leadArchitect: string;
  sizingWorkloadsCount: number;
  boqMargin: number; // Percentage
  slaDueHours: number;
  slaBreached: boolean;
  pocRequired: boolean;
}

export interface POCTrackerItem {
  id: string;
  code: string;
  customerName: string;
  solutionName: string;
  leadEngineer: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  milestonesCompleted: number;
  totalMilestones: number;
  loanerEquipment: string[];
  status: 'In Progress' | 'Evaluating' | 'Success Criteria Met' | 'Returned';
}

export interface WhatsAppNotification {
  id: string;
  recipientName: string;
  recipientPhone: string;
  recipientRole?: string;
  type: 'APPROVAL_REQUEST' | 'SLA_ALERT' | 'STAGE_UPDATE' | 'HANDOVER_PING';
  messagePreview?: string;
  message?: string;
  timestamp: string;
  status: 'Delivered' | 'Read' | 'Pending';
}

export interface MetricSummary {
  totalPipelineValue: number;
  activePresalesDeals: number;
  winRatePct: number;
  avgSlaTurnaroundDays: number;
  pendingApprovalsCount: number;
  activePocCount: number;
}

// -------------------------------------------------------------------------
// ACCOUNTS & STAKEHOLDERS (CRM)
// -------------------------------------------------------------------------
export type AccountTier = 'Strategic' | 'Enterprise' | 'Tier-1' | 'Tier-2' | 'Mid-Market' | 'SMB';
export type AccountStatus = 'Active' | 'Prospect' | 'Inactive';

export type DecisionRole = 
  | 'Economic Buyer' 
  | 'Champion' 
  | 'Technical Evaluator' 
  | 'Influencer' 
  | 'Gatekeeper';

export interface Contact {
  id: string;
  accountId: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  decisionRole?: DecisionRole;
  isPrimary: boolean;
  createdAt?: string;
}

export interface Account {
  id: string;
  companyId?: string;
  code: string;
  name: string;
  industry: string;
  tier: AccountTier;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  assignedAeId?: string;
  assignedAeName?: string;
  assignedAeEmail?: string;
  status: AccountStatus;
  contactsCount?: number;
  opportunitiesCount?: number;
  totalDealValue?: number; // Sum of opportunities in IDR
  contacts?: Contact[];
  createdAt: string;
  updatedAt?: string;
}

export interface AccountFormData {
  code: string;
  name: string;
  industry: string;
  tier: AccountTier;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  assignedAeId?: string;
  status: AccountStatus;
}

export interface ContactFormData {
  accountId: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  decisionRole: DecisionRole;
  isPrimary: boolean;
}

// -------------------------------------------------------------------------
// OPPORTUNITIES & PIPELINE (MEDDPICC)
// -------------------------------------------------------------------------
export type OpportunityDbStage =
  | 'Prospecting'
  | 'Qualification'
  | 'Technical_Sizing'
  | 'Proposal_BOQ'
  | 'POC_POV'
  | 'Negotiation'
  | 'Closed_Won'
  | 'Closed_Lost';

export interface MeddpiccData {
  metrics?: string;
  metricsQualified?: boolean;
  economicBuyer?: string;
  economicBuyerQualified?: boolean;
  decisionCriteria?: string;
  decisionCriteriaQualified?: boolean;
  decisionProcess?: string;
  decisionProcessQualified?: boolean;
  paperProcess?: string;
  paperProcessQualified?: boolean;
  identifiedPain?: string;
  identifiedPainQualified?: boolean;
  champion?: string;
  championQualified?: boolean;
  competition?: string;
  competitionQualified?: boolean;
}

export interface Opportunity {
  id: string;
  companyId?: string;
  accountId: string;
  accountName?: string;
  accountIndustry?: string;
  accountTier?: AccountTier;
  code: string;
  title: string;
  stage: OpportunityDbStage;
  dealValue: number;
  currency: 'IDR' | 'USD';
  probability: number;
  leadSource?: string;
  targetCloseDate?: string;
  assignedAeId: string;
  assignedAeName?: string;
  assignedAeEmail?: string;
  assignedSaId?: string;
  assignedSaName?: string;
  assignedSaEmail?: string;
  meddpiccScore: number;
  meddpiccData?: MeddpiccData;
  lossReason?: string;
  presalesRequestsCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface OpportunityFormData {
  accountId: string;
  code: string;
  title: string;
  stage: OpportunityDbStage;
  dealValue: number;
  currency: 'IDR' | 'USD';
  probability: number;
  leadSource?: string;
  targetCloseDate?: string;
  assignedAeId: string;
  assignedSaId?: string;
  meddpiccScore?: number;
  meddpiccData?: MeddpiccData;
  lossReason?: string;
}

// -------------------------------------------------------------------------
// PRESALES REQUEST & WORKSPACE (STEPS 14 & 15)
// -------------------------------------------------------------------------
export type PresalesRequestDbStatus =
  | 'Unassigned'
  | 'In_Analysis'
  | 'Sizing_In_Progress'
  | 'BOQ_Submitted'
  | 'SOW_Review'
  | 'Approved'
  | 'Completed'
  | 'Cancelled';

export type PresalesPriorityDb = 'Urgent' | 'High' | 'Medium' | 'Low';

export type PresalesRequestType =
  | 'Technical_Sizing'
  | 'BOQ_Pricing'
  | 'RFP_Response'
  | 'POC_Proposal'
  | 'Solution_Design_HLD'
  | 'SOW_Scope_Document';

export type RequirementComplianceStatus =
  | 'Compliant'
  | 'Partial'
  | 'Non_Compliant'
  | 'Not_Applicable';

export type GapSeverity = 'Critical' | 'Major' | 'Minor' | 'Info';
export type GapResolutionStatus = 'Identified' | 'Mitigated' | 'Accepted_Risk' | 'Waived';

export interface TechnicalRequirement {
  id: string;
  requestId: string;
  category:
    | 'Compute & Hypervisor'
    | 'Storage & IOPS'
    | 'Network & Security'
    | 'High Availability & DR'
    | 'Compliance & Governance'
    | 'Cloud & API Integration'
    | 'SLA & Support Matrix';
  requirementText: string;
  complianceStatus: RequirementComplianceStatus;
  proposedSolution?: string;
  notes?: string;
}

export interface GapAnalysisItem {
  id: string;
  requestId: string;
  area: string;
  customerRequirement: string;
  ourCapability: string;
  severity: GapSeverity;
  mitigationStrategy: string;
  status: GapResolutionStatus;
}

export interface PresalesTimelineEvent {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: string;
  notes?: string;
}

export interface PresalesRequest {
  id: string;
  companyId?: string;
  requestCode: string;
  title: string;
  requestType: PresalesRequestType;
  accountId: string;
  accountName?: string;
  accountIndustry?: string;
  accountTier?: AccountTier;
  opportunityId?: string;
  opportunityCode?: string;
  opportunityTitle?: string;
  dealValue?: number;
  currency?: 'IDR' | 'USD';
  status: PresalesRequestDbStatus;
  priority: PresalesPriorityDb;
  techDomains: string[];
  assignedAeId: string;
  assignedAeName?: string;
  assignedAeEmail?: string;
  assignedSaId?: string;
  assignedSaName?: string;
  assignedSaEmail?: string;
  assignedSaAvatar?: string;
  deadlineDate: string;
  slaHoursTotal: number;
  slaHoursRemaining: number;
  slaBreached: boolean;
  pocRequired: boolean;
  sizingWorkloadsCount: number;
  estimatedBoqValue?: number;
  targetMarginPct?: number;
  scopeDescription: string;
  technicalNotes?: string;
  requirementsCount?: number;
  compliantCount?: number;
  gapsCount?: number;
  requirements?: TechnicalRequirement[];
  gapAnalysis?: GapAnalysisItem[];
  timeline?: PresalesTimelineEvent[];
  createdAt: string;
  updatedAt?: string;
}

export interface PresalesRequestFormData {
  requestCode: string;
  title: string;
  requestType: PresalesRequestType;
  accountId: string;
  opportunityId?: string;
  priority: PresalesPriorityDb;
  techDomains: string[];
  assignedAeId: string;
  assignedSaId?: string;
  deadlineDate: string;
  slaHoursTotal: number;
  pocRequired: boolean;
  sizingWorkloadsCount?: number;
  estimatedBoqValue?: number;
  targetMarginPct?: number;
  scopeDescription: string;
  technicalNotes?: string;
}

export interface SolutionsArchitectProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  specializations: string[];
  activeRequestsCount: number;
  maxCapacity: number;
  utilizationPct: number;
  avgTurnaroundHours: number;
  slaOnTimeRatePct: number;
}

// -------------------------------------------------------------------------
// STEP 18: TECHNICAL SIZING ENGINE TYPES
// -------------------------------------------------------------------------
export type SizingCategory =
  | 'Compute / Server'
  | 'Enterprise Storage (SAN/NAS)'
  | 'Core & Edge Networking'
  | 'Next-Gen Firewall & Security'
  | 'Virtualization & Cloud Platform'
  | 'Backup & Disaster Recovery'
  | 'Professional Services & Migration';

export type SizingRedundancy =
  | 'Standalone (1.0)'
  | 'N+1 Redundancy'
  | '2N High Availability'
  | 'Active-Active Cluster'
  | 'Multi-AZ / Geo-Redundant';

export interface SizingParameters {
  // Compute
  totalvCPUs?: number;
  oversubscriptionRatio?: string; // e.g., "1:3", "1:4"
  targetRamGb?: number;
  ramHeadroomPct?: number; // e.g., 20%
  nodeCount?: number;
  cpuArchitecture?: string; // e.g., "Intel Xeon Gold 6430", "AMD EPYC 9354"
  
  // Storage
  usableCapacityTb?: number;
  rawCapacityTb?: number;
  raidType?: 'RAID 10' | 'RAID 5' | 'RAID 6' | 'Erasure Coding 4+2' | 'None';
  dedupCompressionRatio?: string; // e.g., "2.5:1", "3.0:1"
  workloadIopsTarget?: number;
  storageTier?: 'All-NVMe SSD' | 'Hybrid Flash/SAS' | 'Cold Archive HDD';
  annualGrowthPct?: number;

  // Network & Security
  throughputGbps?: number;
  concurrentSessions?: number;
  sslInspectionRequired?: boolean;
  portRequirements10G?: number;
  portRequirements25G?: number;
  portRequirements100G?: number;

  // Backup & DR
  totalProtectedDataTb?: number;
  dailyChangeRatePct?: number;
  retentionDaysLocal?: number;
  retentionDaysCloud?: number;
  targetRpoMinutes?: number;
  targetRtoMinutes?: number;

  // Physical specs
  rackUnitsRu?: number;
  powerConsumptionWatts?: number;
}

export interface SizingItem {
  id: string;
  requestId: string;
  requestCode?: string;
  opportunityId?: string;
  opportunityTitle?: string;
  accountName?: string;
  category: SizingCategory;
  componentName: string;
  vendor: string;
  model: string;
  partNumber?: string;
  quantity: number;
  redundancy: SizingRedundancy;
  sizingParameters: SizingParameters;
  technicalJustification: string;
  complianceNotes?: string;
  estimatedUnitPriceIDR: number;
  estimatedUnitPriceUSD: number;
  boqConverted?: boolean;
  boqItemId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SizingItemFormData {
  requestId: string;
  opportunityId?: string;
  category: SizingCategory;
  componentName: string;
  vendor: string;
  model: string;
  partNumber?: string;
  quantity: number;
  redundancy: SizingRedundancy;
  sizingParameters: SizingParameters;
  technicalJustification: string;
  complianceNotes?: string;
  estimatedUnitPriceIDR: number;
  estimatedUnitPriceUSD?: number;
}

// -------------------------------------------------------------------------
// STEP 19: DYNAMIC BOQ & PRICING ENGINE TYPES
// -------------------------------------------------------------------------
export type BoqApprovalStatus =
  | 'DRAFT'
  | 'PENDING_DIRECTOR_APPROVAL'
  | 'APPROVED'
  | 'REJECTED';

export interface BoqItem {
  id: string;
  boqId?: string;
  requestId: string;
  requestCode?: string;
  opportunityId?: string;
  opportunityTitle?: string;
  accountName?: string;
  sizingItemId?: string; // Link to Sizing Item if generated from Sizing
  category: SizingCategory;
  vendor: string;
  partNumber: string;
  itemDescription: string;
  technicalSpecs?: string;
  quantity: number;
  unit: string; // 'Units', 'Licenses', 'Ports', 'Man-Days', 'Years'
  warrantyYears: number;
  deliveryLeadTimeWeeks: number;
  isOptional: boolean;

  // Commercial Pricing Attributes (Role Protected)
  unitListPriceIDR: number;
  vendorDiscountPct: number; // e.g., 40% off list
  unitCostIDR: number; // Net purchase cost to company
  marginPct: number; // e.g., 25% target margin
  unitSellingPriceIDR: number; // Selling price to customer
  
  // Extended Totals
  extendedCostIDR: number; // unitCostIDR * quantity
  extendedSellingPriceIDR: number; // unitSellingPriceIDR * quantity
  grossMarginIDR: number; // extendedSellingPriceIDR - extendedCostIDR
  
  // USD Equivalence (Dynamic FX)
  unitCostUSD?: number;
  unitSellingPriceUSD?: number;
  extendedCostUSD?: number;
  extendedSellingPriceUSD?: number;
  grossMarginUSD?: number;

  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BoqItemFormData {
  requestId: string;
  opportunityId?: string;
  sizingItemId?: string;
  category: SizingCategory;
  vendor: string;
  partNumber: string;
  itemDescription: string;
  technicalSpecs?: string;
  quantity: number;
  unit: string;
  warrantyYears: number;
  deliveryLeadTimeWeeks: number;
  isOptional: boolean;
  unitListPriceIDR: number;
  vendorDiscountPct: number;
  unitCostIDR: number;
  marginPct: number;
  unitSellingPriceIDR: number;
  notes?: string;
}

export interface BoqSummary {
  requestId: string;
  requestCode: string;
  opportunityTitle: string;
  accountName: string;
  itemCount: number;
  optionalItemCount: number;
  totalListPriceIDR: number;
  totalCostIDR: number;
  totalSellingPriceIDR: number;
  totalGrossMarginIDR: number;
  blendedMarginPct: number;
  vatTaxPct: number; // e.g. 11% PPN Indonesia
  vatTaxAmountIDR: number;
  grandTotalIDR: number;
  
  // USD equivalents
  totalCostUSD: number;
  totalSellingPriceUSD: number;
  totalGrossMarginUSD: number;
  grandTotalUSD: number;

  approvalStatus: BoqApprovalStatus;
  directorApprovalRequired: boolean; // true if blended margin < 18% or deal > 1B IDR
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  commercialRevisionNotes?: string;
  updatedAt: string;
}

// -------------------------------------------------------------------------
// VENDOR HARDWARE & SOFTWARE PRODUCT CATALOG
// -------------------------------------------------------------------------
export interface ProductCatalogItem {
  id: string;
  category: SizingCategory;
  vendor: string;
  model: string;
  partNumber: string;
  name: string;
  description: string;
  unitListPriceIDR: number;
  unitListPriceUSD: number;
  standardDiscountPct: number;
  standardCostIDR: number;
  standardMarginPct: number;
  specsSummary: string;
  unit: string;
  warrantyYears: number;
  leadTimeWeeks: number;
  inStock: boolean;
  recommendedFor: string[];
}

// -------------------------------------------------------------------------
// STEP 22: STATEMENT OF WORK (SOW) ADMIN TYPES
// -------------------------------------------------------------------------
export type SowStatus =
  | 'DRAFT'
  | 'INTERNAL_REVIEW'
  | 'LEGAL_SALES_REVIEW'
  | 'APPROVED'
  | 'CLIENT_SIGNED'
  | 'REJECTED';

export interface SowDeliverable {
  id: string;
  phase: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  estDurationDays: number;
  targetCompletionDate: string;
  ownerRole: string;
}

export interface SowRaciItem {
  id: string;
  activity: string;
  responsible: string; // e.g., "Lead Solutions Architect"
  accountable: string; // e.g., "Customer IT Director"
  consulted: string;   // e.g., "Infrastructure Team"
  informed: string;    // e.g., "PMO & CISO"
}

export interface SowTimelinePhase {
  id: string;
  phaseNumber: number;
  name: string;
  durationWeeks: number;
  startDate: string;
  endDate: string;
  milestoneDeliverable: string;
  status: 'Pending' | 'In Progress' | 'Completed';
}

export interface SowPaymentMilestone {
  id: string;
  milestoneName: string;
  percentage: number;
  amountIDR: number;
  amountUSD?: number;
  triggerCriteria: string;
}

export interface SowGovernanceApproval {
  id: string;
  role: 'Lead Architect' | 'Presales Lead' | 'Sales Director' | 'Legal Counsel' | 'Customer Authorized Signer';
  userName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  signedAt?: string;
  comments?: string;
}

export interface SowDocument {
  id: string;
  documentNumber: string; // e.g., "SOW-2026-0042"
  requestId: string;
  requestCode?: string;
  opportunityId: string;
  opportunityCode?: string;
  opportunityTitle: string;
  accountId: string;
  accountName: string;
  customerContactName: string;
  customerContactEmail: string;
  customerContactRole?: string;
  version: string; // e.g., "v1.0", "v1.1"
  status: SowStatus;
  
  // Scope Definition
  executiveSummary: string;
  projectBackground: string;
  scopeInScope: string[];
  scopeOutOfScope: string[];
  deliverables: SowDeliverable[];
  raciMatrix: SowRaciItem[];
  projectTimeline: SowTimelinePhase[];
  
  // Commercial & Legal Terms
  commercialTerms: {
    totalContractValueIDR: number;
    totalContractValueUSD?: number;
    paymentMilestones: SowPaymentMilestone[];
    warrantyPeriodMonths: number;
    slaResolutionHours: number;
    changeRequestTerms: string;
    confidentialityClause?: string;
    governingLaw?: string;
  };
  
  // BOQ Snapshot (Summary from Presales BOQ)
  boqSnapshot: {
    totalHardwareItems: number;
    totalSoftwareLicenses: number;
    totalServicesManDays: number;
    grandTotalIDR: number;
    grandTotalUSD?: number;
  };

  acceptanceCriteria: string[];
  clientAssumptions: string[];
  governanceApprovals: SowGovernanceApproval[];
  
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface SowFormData {
  requestId: string;
  opportunityId: string;
  opportunityTitle: string;
  accountId: string;
  accountName: string;
  customerContactName: string;
  customerContactEmail: string;
  customerContactRole?: string;
  version: string;
  executiveSummary: string;
  projectBackground: string;
  scopeInScope: string[];
  scopeOutOfScope: string[];
  deliverables: SowDeliverable[];
  raciMatrix: SowRaciItem[];
  projectTimeline: SowTimelinePhase[];
  commercialTerms: {
    totalContractValueIDR: number;
    totalContractValueUSD?: number;
    paymentMilestones: SowPaymentMilestone[];
    warrantyPeriodMonths: number;
    slaResolutionHours: number;
    changeRequestTerms: string;
    confidentialityClause?: string;
    governingLaw?: string;
  };
  acceptanceCriteria: string[];
  clientAssumptions: string[];
}

export interface SowStatsSummary {
  totalSows: number;
  draftCount: number;
  internalReviewCount: number;
  legalReviewCount: number;
  approvedCount: number;
  clientSignedCount: number;
  totalContractValueIDR: number;
  totalContractValueUSD: number;
  avgTurnaroundDays: number;
}

// -------------------------------------------------------------------------
// STEP 23: PROJECT HANDOVER (SALES → DELIVERY PM) TYPES
// -------------------------------------------------------------------------
export type HandoverStatus =
  | 'PENDING_KICKOFF'
  | 'REVIEW_IN_PROGRESS'
  | 'ACCEPTANCE_SIGN_OFF'
  | 'OFFICIALLY_HANDED_OVER'
  | 'REJECTED_NEEDS_INFO';

export type HandoverChecklistCategory =
  | 'Commercial & Scope'
  | 'Architecture & BOQ'
  | 'Customer & Site Readiness'
  | 'Risks & Dependencies'
  | 'Governance & Legal';

export interface HandoverChecklistItem {
  id: string;
  category: HandoverChecklistCategory;
  item: string;
  required: boolean;
  completed: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

export interface HandoverRiskItem {
  id: string;
  riskDescription: string;
  impact: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  probability: 'HIGH' | 'MEDIUM' | 'LOW';
  mitigationStrategy: string;
  contingencyPlan: string;
  owner: string;
  status: 'OPEN' | 'MITIGATED' | 'ACCEPTED';
}

export interface HandoverTechnicalArtifact {
  id: string;
  title: string;
  type: 'SOW' | 'BOQ' | 'Topology Diagram' | 'LLD/HLD' | 'Vendor Quotation' | 'Customer Contract' | 'Architecture Blueprint';
  fileName?: string;
  fileSize?: string;
  version: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface ProjectHandover {
  id: string;
  handoverCode: string; // e.g., "HND-2026-0018"
  opportunityId: string;
  opportunityCode?: string;
  opportunityTitle: string;
  accountId: string;
  accountName: string;
  accountIndustry?: string;
  dealValueIDR: number;
  dealValueUSD?: number;
  sowId?: string;
  sowNumber?: string;
  requestId?: string;
  requestCode?: string;
  
  // Key Stakeholders
  assignedAeId: string;
  assignedAeName: string;
  assignedAeEmail: string;
  assignedSaId: string;
  assignedSaName: string;
  assignedSaEmail: string;
  assignedPmId: string;
  assignedPmName: string;
  assignedPmEmail: string;
  customerSpocName: string;
  customerSpocEmail: string;
  customerSpocPhone?: string;

  status: HandoverStatus;
  handoverReadinessScore: number; // 0 to 100%
  handoverDate: string;
  targetKickoffDate: string;
  targetGoLiveDate: string;

  // Scope & Baseline Locking
  scopeBaseline: {
    confirmedArchitecture: string;
    totalMilestonesCount: number;
    billOfQuantitiesApproved: boolean;
    sowApprovedAndSigned: boolean;
    siteReadinessStatus: 'Ready' | 'Partial' | 'Pending Assessment';
    estimatedDeliveryDurationWeeks: number;
    specialContractClauses?: string;
  };

  checklist: HandoverChecklistItem[];
  riskRegistry: HandoverRiskItem[];
  artifacts: HandoverTechnicalArtifact[];

  // 3-Party Governance Sign-Off
  saSignOff: {
    isSigned: boolean;
    signedBy?: string;
    signedAt?: string;
    comments?: string;
  };
  salesSignOff: {
    isSigned: boolean;
    signedBy?: string;
    signedAt?: string;
    comments?: string;
  };
  pmSignOff: {
    isSigned: boolean;
    signedBy?: string;
    signedAt?: string;
    comments?: string;
    plannedKickoffDate?: string;
  };

  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HandoverFormData {
  opportunityId: string;
  opportunityTitle: string;
  accountId: string;
  accountName: string;
  dealValueIDR: number;
  sowId?: string;
  sowNumber?: string;
  assignedAeName: string;
  assignedSaName: string;
  assignedPmName: string;
  customerSpocName: string;
  customerSpocEmail: string;
  customerSpocPhone?: string;
  targetKickoffDate: string;
  targetGoLiveDate: string;
  confirmedArchitecture: string;
  siteReadinessStatus: 'Ready' | 'Partial' | 'Pending Assessment';
  estimatedDeliveryDurationWeeks: number;
  specialContractClauses?: string;
}

export interface HandoverStatsSummary {
  totalHandovers: number;
  pendingKickoffCount: number;
  inReviewCount: number;
  awaitingSignOffCount: number;
  officiallyHandedOverCount: number;
  averageReadinessScorePct: number;
  totalDeliveryPipelineValueIDR: number;
  totalDeliveryPipelineValueUSD: number;
  highRiskProjectsCount: number;
}

// -------------------------------------------------------------------------
// STEP 25 & 26: ASSET INVENTORY, POC LOANERS, TECH DESK & RFP KNOWLEDGE TYPES
// -------------------------------------------------------------------------
export type AssetCategory =
  | 'Hardware'
  | 'Software/License'
  | 'Network Appliance'
  | 'Cloud/Virtual Instance'
  | 'Demo/POC Loaner';

export type AssetStatus =
  | 'OPERATIONAL'
  | 'IN_MAINTENANCE'
  | 'LOANED_OUT'
  | 'STANDBY_STOCK'
  | 'DEPRECATED'
  | 'DISPOSED';

export type WarrantyStatus =
  | 'ACTIVE'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'LIFETIME'
  | 'NO_WARRANTY';

export interface AssetLoanerDetails {
  isLoaner: boolean;
  pocId?: string;
  borrowerEngineer: string;
  borrowerPhone?: string;
  checkoutDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  condition: 'Mint / Like New' | 'Good' | 'Minor Wear' | 'Needs Repair';
  notes?: string;
}

export interface AssetMaintenanceLog {
  id: string;
  assetId: string;
  date: string;
  technicianName: string;
  type: 'Preventive' | 'Firmware Update' | 'Hardware Repair' | 'Inspection' | 'RMA Replacement';
  description: string;
  costIDR?: number;
  status: 'Completed' | 'Pending Parts' | 'Scheduled';
}

export interface AssetRecord {
  id: string;
  companyId?: string;
  assetTag: string; // e.g. "AST-2026-0042"
  name: string;
  category: AssetCategory;
  vendor: string;
  modelNumber: string;
  serialNumber: string;
  macAddress?: string;
  ipAddress?: string;
  
  // Linkages
  accountId: string;
  accountName: string;
  opportunityId?: string;
  opportunityTitle?: string;
  handoverId?: string;
  handoverCode?: string;

  // Physical Location & Environment
  siteLocation: string; // e.g. "DCI Indonesia Data Center (JK1), Rack 14B"
  rackUnit?: string; // e.g. "U22 - U24"
  datacenterZone?: string;

  // Status & Lifecycle
  status: AssetStatus;
  warrantyStatus: WarrantyStatus;
  purchaseDate: string;
  warrantyExpiryDate: string;
  costIDR: number;
  costUSD?: number;
  supportContractTier?: string; // e.g. "24x7 4h On-Site Support"
  contractNumber?: string;

  // Demo / POC Loaner Details
  loanerDetails?: AssetLoanerDetails;
  maintenanceLogs?: AssetMaintenanceLog[];

  notes?: string;
  qrCodeTag?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetFormData {
  name: string;
  category: AssetCategory;
  vendor: string;
  modelNumber: string;
  serialNumber: string;
  macAddress?: string;
  ipAddress?: string;
  accountId: string;
  accountName: string;
  opportunityId?: string;
  handoverId?: string;
  siteLocation: string;
  rackUnit?: string;
  status: AssetStatus;
  purchaseDate: string;
  warrantyExpiryDate: string;
  costIDR: number;
  supportContractTier?: string;
  contractNumber?: string;
  isLoaner?: boolean;
  borrowerEngineer?: string;
  borrowerPhone?: string;
  expectedReturnDate?: string;
  condition?: 'Mint / Like New' | 'Good' | 'Minor Wear' | 'Needs Repair';
  notes?: string;
}

export interface AssetStatsSummary {
  totalAssets: number;
  activeOperationalCount: number;
  expiringSoonWarrantiesCount: number;
  expiredWarrantiesCount: number;
  activePocLoanersCount: number;
  inMaintenanceCount: number;
  totalAssetValueIDR: number;
  totalAssetValueUSD: number;
}

// -------------------------------------------------------------------------
// STEP 26: TECH DESK & RFP KNOWLEDGE BASE TYPES
// -------------------------------------------------------------------------
export type TicketPriority =
  | 'URGENT_24H'
  | 'HIGH_48H'
  | 'MEDIUM'
  | 'LOW';

export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'PENDING_CUSTOMER'
  | 'RESOLVED'
  | 'CLOSED';

export type TicketCategory =
  | 'INCIDENT'
  | 'CHANGE_REQUEST'
  | 'HARDWARE_RMA'
  | 'PRESALES_INQUIRY'
  | 'PERFORMANCE_TUNING'
  | 'POST_SALES_COMMISSIONING';

export interface TicketAttachment {
  name: string;
  url: string;
  size?: string;
  type?: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  isInternalNote: boolean;
  message: string;
  attachments?: TicketAttachment[];
  createdAt: string;
}

export interface TechTicket {
  id: string;
  companyId?: string;
  ticketNumber: string; // e.g. "TCK-2026-0381"
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;

  // Linkages
  accountId: string;
  accountName: string;
  assetId?: string;
  assetName?: string;
  assetSerialNumber?: string;
  assetTag?: string;
  opportunityId?: string;
  handoverId?: string;

  // People & Assignment
  assigneeId?: string;
  assigneeName?: string;
  assigneeRole?: string;
  assigneeEmail?: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone?: string;

  // SLA & Deadlines
  slaHours: number;
  slaDueDate: string;
  isSlaBreached: boolean;
  responseSlaMinutes?: number;
  firstRespondedAt?: string;

  // Resolution
  resolutionSummary?: string;
  rootCause?: string;
  resolvedAt?: string;
  closedAt?: string;

  comments: TicketComment[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketFormData {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  accountId: string;
  accountName: string;
  assetId?: string;
  handoverId?: string;
  assigneeName?: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone?: string;
  tags?: string[];
}

export interface TicketStatsSummary {
  totalTickets: number;
  openCount: number;
  inProgressCount: number;
  pendingCustomerCount: number;
  resolvedCount: number;
  urgentBreachRiskCount: number;
  slaBreachedCount: number;
  avgResolutionTimeHours: number;
}

export interface RfpKnowledgeItem {
  id: string;
  companyId?: string;
  code: string; // e.g. "KB-SEC-042"
  category: string;
  question: string;
  answer: string;
  confidenceScore: number; // 0-100
  lastVerifiedBy: string;
  lastVerifiedDate: string;
  tags: string[];
  usageCount: number;
}

// -------------------------------------------------------------------------
// STEP 31 & 32: AUDIT LOGS & ROLE-BASED UI SECURITY TESTING
// -------------------------------------------------------------------------

export type AuditActionType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'ASSIGN'
  | 'APPROVE'
  | 'REJECT'
  | 'STATUS_CHANGE'
  | 'PERMISSION_CHANGE'
  | 'EXPORT'
  | 'SECURITY_ALERT'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT';

export type AuditSeverity = 'INFO' | 'WARN' | 'CRITICAL' | 'SECURITY';

export interface AuditLogEntry {
  id: string;
  companyId?: string;
  action: AuditActionType;
  module: string; // e.g. 'accounts', 'opportunities', 'presales-queue', 'sizing-engine', 'boq-pricing', 'sow-builder', 'handover', 'assets-poc', 'tech-desk', 'audit-rbac', 'auth'
  entityType: string; // e.g. 'Account', 'Opportunity', 'PresalesTask', 'BoqDocument', 'SowDocument', 'ProjectHandover', 'AssetRecord', 'TechTicket', 'UserRole', 'AuthSession'
  entityId: string;
  entityName: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole | string;
  ipAddress: string;
  userAgent?: string;
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  diffSummary?: string;
  metadata?: Record<string, any>;
  severity: AuditSeverity;
  timestamp: string; // ISO 8601
  hashSignature?: string; // Tamper-evident checksum
}

export interface AuditLogFilter {
  action?: string;
  module?: string;
  severity?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
}

export interface RbacSecurityTestResult {
  testId: string;
  testName: string;
  category: 'MODULE_ACCESS' | 'ACTION_EXECUTION' | 'DIRECT_URL_INJECTION' | 'RLS_ISOLATION' | 'PRIVILEGE_ESCALATION';
  role: UserRole;
  module: string;
  action: string;
  expectedAllowed: boolean;
  actualAllowed: boolean;
  passed: boolean;
  statusCode: number; // 200 (Allowed) or 403 (Forbidden)
  details: string;
  timestamp: string;
}

export interface SecurityTestSummary {
  totalTests: number;
  passedCount: number;
  failedCount: number;
  passRatePct: number;
  vulnerabilitiesFound: number;
  lastRunTimestamp: string;
  complianceStatus: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';
}



