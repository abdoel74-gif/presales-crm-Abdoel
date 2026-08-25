import { supabase, isSupabaseConfigured } from './supabase.ts';
import {
  SowDocument,
  SowFormData,
  SowStatus,
  SowStatsSummary,
  ProjectHandover,
  HandoverFormData,
  HandoverStatus,
  HandoverStatsSummary,
  HandoverChecklistItem,
  HandoverRiskItem,
  HandoverTechnicalArtifact,
  Opportunity,
  PresalesRequest,
  UserProfile,
  UserRole,
} from '../types.ts';
import { INITIAL_SOW_DOCUMENTS } from '../data/initialSowData.ts';
import { INITIAL_HANDOVER_PACKAGES } from '../data/initialHandoverData.ts';

const SOW_STORAGE_KEY = 'presales_os_sow_documents_v1';
const HANDOVER_STORAGE_KEY = 'presales_os_project_handovers_v1';

// ---------------------------------------------------------------------------
// LocalStorage Persistence Helpers
// ---------------------------------------------------------------------------
function getLocalSows(): SowDocument[] {
  try {
    const raw = localStorage.getItem(SOW_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not load SOWs from localStorage', e);
  }
  localStorage.setItem(SOW_STORAGE_KEY, JSON.stringify(INITIAL_SOW_DOCUMENTS));
  return INITIAL_SOW_DOCUMENTS;
}

function saveLocalSows(docs: SowDocument[]) {
  try {
    localStorage.setItem(SOW_STORAGE_KEY, JSON.stringify(docs));
  } catch (e) {
    console.warn('Could not save SOWs to localStorage', e);
  }
}

function getLocalHandovers(): ProjectHandover[] {
  try {
    const raw = localStorage.getItem(HANDOVER_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not load Handovers from localStorage', e);
  }
  localStorage.setItem(HANDOVER_STORAGE_KEY, JSON.stringify(INITIAL_HANDOVER_PACKAGES));
  return INITIAL_HANDOVER_PACKAGES;
}

function saveLocalHandovers(handovers: ProjectHandover[]) {
  try {
    localStorage.setItem(HANDOVER_STORAGE_KEY, JSON.stringify(handovers));
  } catch (e) {
    console.warn('Could not save Handovers to localStorage', e);
  }
}

// ---------------------------------------------------------------------------
// SOW & Handover Service Engine
// ---------------------------------------------------------------------------
export const SowHandoverService = {
  // =========================================================================
  // STEP 22: STATEMENT OF WORK (SOW) METHODS
  // =========================================================================

  /**
   * Fetch all SOW documents with optional search and status filter
   */
  async getSowDocuments(params: {
    search?: string;
    status?: SowStatus | 'ALL';
    accountId?: string;
    opportunityId?: string;
  } = {}): Promise<{ data: SowDocument[]; error: string | null }> {
    try {
      if (isSupabaseConfigured()) {
        let query = supabase.from('sow_documents').select('*');
        if (params.status && params.status !== 'ALL') {
          query = query.eq('status', params.status);
        }
        if (params.accountId) {
          query = query.eq('account_id', params.accountId);
        }
        if (params.opportunityId) {
          query = query.eq('opportunity_id', params.opportunityId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return { data: data as unknown as SowDocument[], error: null };
        }
      }

      // Local storage fallback
      let items = getLocalSows();
      if (params.status && params.status !== 'ALL') {
        items = items.filter((s) => s.status === params.status);
      }
      if (params.accountId) {
        items = items.filter((s) => s.accountId === params.accountId);
      }
      if (params.opportunityId) {
        items = items.filter((s) => s.opportunityId === params.opportunityId);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        items = items.filter(
          (s) =>
            s.documentNumber.toLowerCase().includes(q) ||
            s.opportunityTitle.toLowerCase().includes(q) ||
            s.accountName.toLowerCase().includes(q) ||
            s.customerContactName.toLowerCase().includes(q) ||
            s.executiveSummary.toLowerCase().includes(q)
        );
      }
      return { data: items, error: null };
    } catch (err: any) {
      return { data: getLocalSows(), error: err.message || 'Error fetching SOWs' };
    }
  },

  /**
   * Fetch single SOW document by ID
   */
  async getSowById(id: string): Promise<{ data: SowDocument | null; error: string | null }> {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.from('sow_documents').select('*').eq('id', id).single();
        if (!error && data) {
          return { data: data as unknown as SowDocument, error: null };
        }
      }
      const items = getLocalSows();
      const found = items.find((s) => s.id === id) || null;
      return { data: found, error: found ? null : 'SOW document not found' };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  /**
   * Auto-synthesize a new SOW document from Presales Request, Opportunity, and BOQ data
   */
  async createSowFromPresalesData(
    formData: SowFormData,
    userProfile?: UserProfile
  ): Promise<{ data: SowDocument | null; error: string | null }> {
    try {
      const sows = getLocalSows();
      const nextNum = sows.length + 42;
      const documentNumber = `SOW-2026-${String(nextNum).padStart(4, '0')}`;
      const now = new Date().toISOString();

      const newSow: SowDocument = {
        id: `sow_${Date.now()}`,
        documentNumber,
        requestId: formData.requestId,
        requestCode: `REQ-${formData.requestId.replace('req_', '')}`,
        opportunityId: formData.opportunityId,
        opportunityTitle: formData.opportunityTitle,
        accountId: formData.accountId,
        accountName: formData.accountName,
        customerContactName: formData.customerContactName || 'Customer Contact',
        customerContactEmail: formData.customerContactEmail || 'contact@client.com',
        customerContactRole: formData.customerContactRole || 'Project Sponsor',
        version: formData.version || 'v1.0',
        status: 'DRAFT',
        executiveSummary: formData.executiveSummary || 'Executive overview of architecture deliverables and service milestones.',
        projectBackground: formData.projectBackground || 'Detailed customer project goals and technical objectives.',
        scopeInScope: formData.scopeInScope.length > 0 ? formData.scopeInScope : [
          'Solution architecture design, topology validation, and LLD sign-off.',
          'Physical staging, deployment, and configuration of all BOQ items.',
          'Comprehensive UAT testing, runbook delivery, and admin knowledge transfer.',
        ],
        scopeOutOfScope: formData.scopeOutOfScope.length > 0 ? formData.scopeOutOfScope : [
          'Facilities civil works, primary power grid provisioning, and physical cooling infrastructure.',
          'Software licenses not itemized in the accompanying approved BOQ schedule.',
        ],
        deliverables: formData.deliverables.length > 0 ? formData.deliverables : [
          {
            id: `del_${Date.now()}_1`,
            phase: 'Phase 1: Discovery & Architecture',
            title: 'High-Level & Low-Level Design (HLD/LLD) Dossier',
            description: 'Final architecture specifications and configuration matrices.',
            acceptanceCriteria: 'Formal signoff by Lead Architect and Customer Technical Lead.',
            estDurationDays: 14,
            targetCompletionDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
            ownerRole: 'Principal Solutions Architect',
          },
          {
            id: `del_${Date.now()}_2`,
            phase: 'Phase 2: Deployment & Configuration',
            title: 'Infrastructure Deployment & Functional Testing',
            description: 'Turnkey deployment and cluster configuration.',
            acceptanceCriteria: 'Passes 100% automated health checks.',
            estDurationDays: 21,
            targetCompletionDate: new Date(Date.now() + 35 * 86400000).toISOString().split('T')[0],
            ownerRole: 'Senior Implementation Engineer',
          },
        ],
        raciMatrix: formData.raciMatrix.length > 0 ? formData.raciMatrix : [
          {
            id: `raci_${Date.now()}_1`,
            activity: 'Datacenter Site Space, Power & Cooling',
            responsible: 'Customer Facilities Team',
            accountable: formData.customerContactName || 'Customer Sponsor',
            consulted: 'Vendor Solutions Architect',
            informed: 'Delivery Project Manager',
          },
          {
            id: `raci_${Date.now()}_2`,
            activity: 'Low-Level Design (LLD) Approval',
            responsible: 'Vendor Solutions Architect',
            accountable: formData.customerContactName || 'Customer Sponsor',
            consulted: 'Security & Network Team',
            informed: 'Sales Director',
          },
          {
            id: `raci_${Date.now()}_3`,
            activity: 'Final Acceptance & Project Closure',
            responsible: 'Vendor Delivery PM & Customer Lead',
            accountable: formData.customerContactName || 'Customer Sponsor',
            consulted: 'Audit & Compliance',
            informed: 'Executive Management',
          },
        ],
        projectTimeline: formData.projectTimeline.length > 0 ? formData.projectTimeline : [
          {
            id: `pt_${Date.now()}_1`,
            phaseNumber: 1,
            name: 'Discovery, Planning & LLD Approval',
            durationWeeks: 2,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
            milestoneDeliverable: 'Approved LLD Document',
            status: 'In Progress',
          },
          {
            id: `pt_${Date.now()}_2`,
            phaseNumber: 2,
            name: 'Staging, Deployment & Commissioning',
            durationWeeks: 3,
            startDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
            endDate: new Date(Date.now() + 36 * 86400000).toISOString().split('T')[0],
            milestoneDeliverable: 'Infrastructure Online & Commissioned',
            status: 'Pending',
          },
        ],
        commercialTerms: formData.commercialTerms || {
          totalContractValueIDR: 10000000000,
          totalContractValueUSD: 645161,
          paymentMilestones: [
            {
              id: 'pm_auto_1',
              milestoneName: 'Contract Signing & Down Payment',
              percentage: 30,
              amountIDR: 3000000000,
              amountUSD: 193548,
              triggerCriteria: 'Execution of SOW and PO issuance.',
            },
            {
              id: 'pm_auto_2',
              milestoneName: 'Hardware Staging & Commissioning',
              percentage: 50,
              amountIDR: 5000000000,
              amountUSD: 322580,
              triggerCriteria: 'Delivery and successful initial test verification.',
            },
            {
              id: 'pm_auto_3',
              milestoneName: 'Final UAT Signoff',
              percentage: 20,
              amountIDR: 2000000000,
              amountUSD: 129032,
              triggerCriteria: 'Signed UAT certificate and As-Built handover.',
            },
          ],
          warrantyPeriodMonths: 36,
          slaResolutionHours: 4,
          changeRequestTerms: 'Scope revisions managed via formal Project Change Request (PCR).',
          confidentialityClause: 'Strict confidentiality applies under mutual NDA.',
          governingLaw: 'Governed under the laws of the Republic of Indonesia.',
        },
        boqSnapshot: {
          totalHardwareItems: 8,
          totalSoftwareLicenses: 10,
          totalServicesManDays: 30,
          grandTotalIDR: formData.commercialTerms?.totalContractValueIDR || 10000000000,
          grandTotalUSD: formData.commercialTerms?.totalContractValueUSD || 645161,
        },
        acceptanceCriteria: formData.acceptanceCriteria.length > 0 ? formData.acceptanceCriteria : [
          'All deployed hardware and software pass functional load tests.',
          'Complete As-Built documentation delivered.',
          'Customer administrator training completed.',
        ],
        clientAssumptions: formData.clientAssumptions.length > 0 ? formData.clientAssumptions : [
          'Customer provides rack space, power, cooling, and remote VPN access.',
          'Customer engineering team attends scheduled cutover windows.',
        ],
        governanceApprovals: [
          {
            id: `gov_${Date.now()}_1`,
            role: 'Lead Architect',
            userName: userProfile?.name || 'Solutions Architect',
            status: 'APPROVED',
            signedAt: now,
            comments: 'Initial scope, topology, and deliverable schedule generated.',
          },
          {
            id: `gov_${Date.now()}_2`,
            role: 'Presales Lead',
            userName: 'Hendra Gunawan',
            status: 'PENDING',
          },
          {
            id: `gov_${Date.now()}_3`,
            role: 'Sales Director',
            userName: 'Marcus Vance',
            status: 'PENDING',
          },
          {
            id: `gov_${Date.now()}_4`,
            role: 'Legal Counsel',
            userName: 'Devi Kartika, SH',
            status: 'PENDING',
          },
          {
            id: `gov_${Date.now()}_5`,
            role: 'Customer Authorized Signer',
            userName: formData.customerContactName || 'Customer Sponsor',
            status: 'PENDING',
          },
        ],
        createdById: userProfile?.id || 'usr_sa_01',
        createdByName: userProfile?.name || 'Abdoel',
        createdAt: now,
        updatedAt: now,
      };

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('sow_documents').insert([newSow]);
        } catch (e) {
          console.warn('Supabase insert SOW failed, saved to local cache', e);
        }
      }

      sows.unshift(newSow);
      saveLocalSows(sows);
      return { data: newSow, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to create SOW document' };
    }
  },

  /**
   * Update SOW document details
   */
  async updateSowDocument(
    id: string,
    updates: Partial<SowDocument>
  ): Promise<{ data: SowDocument | null; error: string | null }> {
    try {
      const sows = getLocalSows();
      const idx = sows.findIndex((s) => s.id === id);
      if (idx === -1) return { data: null, error: 'SOW document not found' };

      const updated = {
        ...sows[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      sows[idx] = updated;
      saveLocalSows(sows);

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('sow_documents').update(updated).eq('id', id);
        } catch (e) {
          console.warn('Supabase update SOW failed', e);
        }
      }

      return { data: updated, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  /**
   * Transition SOW status through governance workflow
   */
  async transitionSowStatus(
    id: string,
    newStatus: SowStatus,
    userProfile?: UserProfile,
    comments?: string
  ): Promise<{ data: SowDocument | null; error: string | null }> {
    try {
      const sows = getLocalSows();
      const idx = sows.findIndex((s) => s.id === id);
      if (idx === -1) return { data: null, error: 'SOW document not found' };

      const targetSow = sows[idx];
      const now = new Date().toISOString();

      // Update governance approvals where matching
      const updatedApprovals = targetSow.governanceApprovals.map((appr) => {
        if (newStatus === 'APPROVED' && (appr.role === 'Sales Director' || appr.role === 'Presales Lead')) {
          return { ...appr, status: 'APPROVED' as const, signedAt: now, comments: comments || appr.comments };
        }
        if (newStatus === 'CLIENT_SIGNED' && appr.role === 'Customer Authorized Signer') {
          return { ...appr, status: 'APPROVED' as const, signedAt: now, comments: comments || 'Contract executed.' };
        }
        return appr;
      });

      const updated: SowDocument = {
        ...targetSow,
        status: newStatus,
        governanceApprovals: updatedApprovals,
        updatedAt: now,
      };

      sows[idx] = updated;
      saveLocalSows(sows);

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('sow_documents').update({ status: newStatus, updated_at: now }).eq('id', id);
        } catch (e) {
          console.warn('Supabase status transition failed', e);
        }
      }

      return { data: updated, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  /**
   * Record digital signature on SOW governance approval
   */
  async signGovernanceApproval(
    sowId: string,
    approvalId: string,
    userProfile: UserProfile,
    status: 'APPROVED' | 'REJECTED',
    comments?: string
  ): Promise<{ data: SowDocument | null; error: string | null }> {
    try {
      const sows = getLocalSows();
      const idx = sows.findIndex((s) => s.id === sowId);
      if (idx === -1) return { data: null, error: 'SOW not found' };

      const sow = sows[idx];
      const now = new Date().toISOString();

      const newApprovals = sow.governanceApprovals.map((appr) => {
        if (appr.id === approvalId) {
          return {
            ...appr,
            status,
            userName: userProfile.name,
            signedAt: now,
            comments: comments || (status === 'APPROVED' ? 'Approved through digital governance signoff.' : 'Rejected with remarks.'),
          };
        }
        return appr;
      });

      // Check if all internal approvals are signed
      const internalAllApproved = newApprovals
        .filter((a) => a.role !== 'Customer Authorized Signer')
        .every((a) => a.status === 'APPROVED');

      let nextStatus = sow.status;
      if (status === 'REJECTED') {
        nextStatus = 'REJECTED';
      } else if (internalAllApproved && sow.status !== 'CLIENT_SIGNED') {
        nextStatus = 'APPROVED';
      }

      const updated: SowDocument = {
        ...sow,
        status: nextStatus,
        governanceApprovals: newApprovals,
        updatedAt: now,
      };

      sows[idx] = updated;
      saveLocalSows(sows);
      return { data: updated, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  /**
   * Get SOW analytics stats
   */
  async getSowStatsSummary(): Promise<SowStatsSummary> {
    const sows = getLocalSows();
    const draftCount = sows.filter((s) => s.status === 'DRAFT').length;
    const internalReviewCount = sows.filter((s) => s.status === 'INTERNAL_REVIEW').length;
    const legalReviewCount = sows.filter((s) => s.status === 'LEGAL_SALES_REVIEW').length;
    const approvedCount = sows.filter((s) => s.status === 'APPROVED').length;
    const clientSignedCount = sows.filter((s) => s.status === 'CLIENT_SIGNED').length;

    const totalContractValueIDR = sows.reduce((acc, s) => acc + (s.commercialTerms?.totalContractValueIDR || 0), 0);
    const totalContractValueUSD = sows.reduce((acc, s) => acc + (s.commercialTerms?.totalContractValueUSD || 0), 0);

    return {
      totalSows: sows.length,
      draftCount,
      internalReviewCount,
      legalReviewCount,
      approvedCount,
      clientSignedCount,
      totalContractValueIDR,
      totalContractValueUSD,
      avgTurnaroundDays: 4.8,
    };
  },

  // =========================================================================
  // STEP 23: PROJECT HANDOVER (SALES → DELIVERY PM) METHODS
  // =========================================================================

  /**
   * Fetch all Project Handover packages
   */
  async getProjectHandovers(params: {
    search?: string;
    status?: HandoverStatus | 'ALL';
    accountId?: string;
    opportunityId?: string;
    assignedPmId?: string;
  } = {}): Promise<{ data: ProjectHandover[]; error: string | null }> {
    try {
      if (isSupabaseConfigured()) {
        let query = supabase.from('project_handovers').select('*');
        if (params.status && params.status !== 'ALL') {
          query = query.eq('status', params.status);
        }
        if (params.accountId) {
          query = query.eq('account_id', params.accountId);
        }
        if (params.opportunityId) {
          query = query.eq('opportunity_id', params.opportunityId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return { data: data as unknown as ProjectHandover[], error: null };
        }
      }

      let items = getLocalHandovers();
      if (params.status && params.status !== 'ALL') {
        items = items.filter((h) => h.status === params.status);
      }
      if (params.accountId) {
        items = items.filter((h) => h.accountId === params.accountId);
      }
      if (params.opportunityId) {
        items = items.filter((h) => h.opportunityId === params.opportunityId);
      }
      if (params.assignedPmId) {
        items = items.filter((h) => h.assignedPmId === params.assignedPmId);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        items = items.filter(
          (h) =>
            h.handoverCode.toLowerCase().includes(q) ||
            h.opportunityTitle.toLowerCase().includes(q) ||
            h.accountName.toLowerCase().includes(q) ||
            h.assignedPmName.toLowerCase().includes(q) ||
            h.assignedSaName.toLowerCase().includes(q) ||
            h.assignedAeName.toLowerCase().includes(q)
        );
      }
      return { data: items, error: null };
    } catch (err: any) {
      return { data: getLocalHandovers(), error: err.message };
    }
  },

  /**
   * Fetch single Handover package by ID
   */
  async getHandoverById(id: string): Promise<{ data: ProjectHandover | null; error: string | null }> {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.from('project_handovers').select('*').eq('id', id).single();
        if (!error && data) {
          return { data: data as unknown as ProjectHandover, error: null };
        }
      }
      const items = getLocalHandovers();
      const found = items.find((h) => h.id === id) || null;
      return { data: found, error: found ? null : 'Handover package not found' };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  /**
   * AUTOMATED TRIGGER: Create Project Handover dossier when Opportunity reaches CLOSED_WON
   */
  async createHandoverFromOpportunity(
    opportunity: Opportunity,
    sowDoc?: SowDocument | null,
    pmProfile?: { id: string; name: string; email: string }
  ): Promise<{ data: ProjectHandover | null; error: string | null }> {
    try {
      const handovers = getLocalHandovers();
      const existing = handovers.find((h) => h.opportunityId === opportunity.id);
      if (existing) {
        return { data: existing, error: null }; // Already created
      }

      const nextCode = `HND-2026-${String(handovers.length + 4).padStart(4, '0')}`;
      const now = new Date().toISOString();
      const kickoffDate = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];
      const goLiveDate = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];

      const defaultChecklist: HandoverChecklistItem[] = [
        {
          id: `chk_${Date.now()}_1`,
          category: 'Commercial & Scope',
          item: 'Official Customer Purchase Order verified against BOQ and archived in billing system.',
          required: true,
          completed: true,
          verifiedBy: opportunity.assignedAeName || 'Account Executive',
          verifiedAt: now,
          notes: 'PO verified matching opportunity deal value.',
        },
        {
          id: `chk_${Date.now()}_2`,
          category: 'Commercial & Scope',
          item: 'Executed Statement of Work (SOW) signed by authorized customer signer.',
          required: true,
          completed: sowDoc?.status === 'CLIENT_SIGNED' || sowDoc?.status === 'APPROVED',
          verifiedBy: sowDoc?.governanceApprovals?.[0]?.userName || 'Solutions Architect',
          verifiedAt: now,
          notes: sowDoc ? `Linked to ${sowDoc.documentNumber} (${sowDoc.version})` : 'Awaiting final countersignature.',
        },
        {
          id: `chk_${Date.now()}_3`,
          category: 'Architecture & BOQ',
          item: 'Final Bill of Quantities (BOQ) validated with hardware vendors & distributors.',
          required: true,
          completed: true,
          verifiedBy: opportunity.assignedSaName || 'Solutions Architect',
          verifiedAt: now,
          notes: 'Vendor lead times and discount authorizations confirmed.',
        },
        {
          id: `chk_${Date.now()}_4`,
          category: 'Architecture & BOQ',
          item: 'High-Level Design (HLD) & Network Topology Blueprint signed off by Presales Lead.',
          required: true,
          completed: true,
          verifiedBy: opportunity.assignedSaName || 'Solutions Architect',
          verifiedAt: now,
          notes: 'Technical sizing parameters reconciled.',
        },
        {
          id: `chk_${Date.now()}_5`,
          category: 'Customer & Site Readiness',
          item: 'Datacenter site audit completed (Rack space, 32A power, cooling, cabling path).',
          required: true,
          completed: false,
          notes: 'Site inspection scheduled with customer facilities team.',
        },
        {
          id: `chk_${Date.now()}_6`,
          category: 'Risks & Dependencies',
          item: 'Third-party delivery risks and SLA constraints documented in Project Risk Registry.',
          required: true,
          completed: true,
          verifiedBy: opportunity.assignedSaName || 'Solutions Architect',
          verifiedAt: now,
          notes: 'Initial risk mitigations formulated.',
        },
        {
          id: `chk_${Date.now()}_7`,
          category: 'Governance & Legal',
          item: 'Tri-party signoff (Sales AE, Solutions Architect, Delivery PM) executed.',
          required: true,
          completed: false,
          notes: 'Awaiting Delivery PM final acceptance review.',
        },
      ];

      const initialRisks: HandoverRiskItem[] = [
        {
          id: `rsk_${Date.now()}_1`,
          riskDescription: 'Hardware delivery lead times from global vendor factory may face customs clearance delays.',
          impact: 'HIGH',
          probability: 'MEDIUM',
          mitigationStrategy: 'Place immediate back-to-back PO with tier-1 distributor with prioritized freight tracking.',
          contingencyPlan: 'Begin staging software VMs and network routing topologies in advance on lab hardware.',
          owner: pmProfile?.name || 'Reza Fahlevi, PMP',
          status: 'OPEN',
        },
        {
          id: `rsk_${Date.now()}_2`,
          riskDescription: 'Customer maintenance window constraints may restrict production migration to weekend slots.',
          impact: 'MEDIUM',
          probability: 'HIGH',
          mitigationStrategy: 'Establish dry-run simulation cutover drills 2 weeks prior to live cutover.',
          contingencyPlan: 'Allocate 2 back-to-back weekend cutover slots with on-site OEM vendor standby.',
          owner: opportunity.assignedSaName || 'Abdoel',
          status: 'OPEN',
        },
      ];

      const initialArtifacts: HandoverTechnicalArtifact[] = [
        {
          id: `art_${Date.now()}_1`,
          title: `${opportunity.accountName} - Architecture & Sizing Blueprint`,
          type: 'Architecture Blueprint',
          fileName: `HLD_${opportunity.code}.pdf`,
          fileSize: '4.8 MB',
          version: 'v1.0',
          uploadedAt: now,
          uploadedBy: opportunity.assignedSaName || 'Abdoel',
        },
        {
          id: `art_${Date.now()}_2`,
          title: `Final Commercial BOQ - ${opportunity.code}`,
          type: 'BOQ',
          fileName: `BOQ_${opportunity.code}_Final.xlsx`,
          fileSize: '2.1 MB',
          version: 'v1.2',
          uploadedAt: now,
          uploadedBy: opportunity.assignedAeName || 'Rian Hidayat',
        },
      ];

      if (sowDoc) {
        initialArtifacts.push({
          id: `art_${Date.now()}_3`,
          title: `Executed SOW (${sowDoc.documentNumber})`,
          type: 'SOW',
          fileName: `${sowDoc.documentNumber}_Final.pdf`,
          fileSize: '5.4 MB',
          version: sowDoc.version,
          uploadedAt: now,
          uploadedBy: sowDoc.createdByName,
        });
      }

      // Calculate initial readiness score
      const completedCount = defaultChecklist.filter((c) => c.completed).length;
      const readinessScore = Math.round((completedCount / defaultChecklist.length) * 100);

      const newHandover: ProjectHandover = {
        id: `hnd_${Date.now()}`,
        handoverCode: nextCode,
        opportunityId: opportunity.id,
        opportunityCode: opportunity.code,
        opportunityTitle: opportunity.title,
        accountId: opportunity.accountId,
        accountName: opportunity.accountName,
        accountIndustry: opportunity.accountIndustry,
        dealValueIDR: opportunity.dealValue,
        dealValueUSD: Math.round(opportunity.dealValue / 15500),
        sowId: sowDoc?.id,
        sowNumber: sowDoc?.documentNumber,
        assignedAeId: opportunity.assignedAeId || 'usr_ae_01',
        assignedAeName: opportunity.assignedAeName || 'Rian Hidayat',
        assignedAeEmail: opportunity.assignedAeEmail || 'rian.hidayat@enterprise.com',
        assignedSaId: opportunity.assignedSaId || 'usr_sa_01',
        assignedSaName: opportunity.assignedSaName || 'Abdoel',
        assignedSaEmail: opportunity.assignedSaEmail || 'abdoel74@gmail.com',
        assignedPmId: pmProfile?.id || 'usr_pm_01',
        assignedPmName: pmProfile?.name || 'Reza Fahlevi, PMP',
        assignedPmEmail: pmProfile?.email || 'reza.fahlevi@enterprise.com',
        customerSpocName: sowDoc?.customerContactName || 'Customer Technical Director',
        customerSpocEmail: sowDoc?.customerContactEmail || 'director@client.com',
        customerSpocPhone: '+62 811-2233-4455',
        status: 'REVIEW_IN_PROGRESS',
        handoverReadinessScore: readinessScore,
        handoverDate: now.split('T')[0],
        targetKickoffDate: kickoffDate,
        targetGoLiveDate: goLiveDate,
        scopeBaseline: {
          confirmedArchitecture: sowDoc?.projectBackground || 'Comprehensive turnkey infrastructure upgrade and cloud migration.',
          totalMilestonesCount: sowDoc?.projectTimeline?.length || 4,
          billOfQuantitiesApproved: true,
          sowApprovedAndSigned: Boolean(sowDoc && sowDoc.status === 'CLIENT_SIGNED'),
          siteReadinessStatus: 'Ready',
          estimatedDeliveryDurationWeeks: 12,
          specialContractClauses: sowDoc?.commercialTerms?.changeRequestTerms || 'Standard PCR procedure applies with 30-day payment milestone terms.',
        },
        checklist: defaultChecklist,
        riskRegistry: initialRisks,
        artifacts: initialArtifacts,
        saSignOff: {
          isSigned: true,
          signedBy: opportunity.assignedSaName || 'Abdoel',
          signedAt: now,
          comments: 'Architecture and sizing verified ready for delivery execution.',
        },
        salesSignOff: {
          isSigned: true,
          signedBy: opportunity.assignedAeName || 'Rian Hidayat',
          signedAt: now,
          comments: 'Deal won and PO verified against commercial margins.',
        },
        pmSignOff: {
          isSigned: false,
          comments: 'Initiating project baseline schedule and delivery engineer allocation.',
        },
        notes: `Automated Project Handover package initialized upon Opportunity WON (${opportunity.code}).`,
        createdAt: now,
        updatedAt: now,
      };

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('project_handovers').insert([newHandover]);
        } catch (e) {
          console.warn('Supabase handover insert error', e);
        }
      }

      handovers.unshift(newHandover);
      saveLocalHandovers(handovers);
      return { data: newHandover, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to initialize handover package' };
    }
  },

  /**
   * Update Checklist Item status and recalculate readiness score
   */
  async updateHandoverChecklistItem(
    handoverId: string,
    itemId: string,
    completed: boolean,
    notes?: string,
    userProfile?: UserProfile
  ): Promise<{ data: ProjectHandover | null; error: string | null }> {
    try {
      const handovers = getLocalHandovers();
      const idx = handovers.findIndex((h) => h.id === handoverId);
      if (idx === -1) return { data: null, error: 'Handover not found' };

      const h = handovers[idx];
      const now = new Date().toISOString();

      const updatedChecklist = h.checklist.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            completed,
            verifiedBy: completed ? userProfile?.name || 'Verified Engineer' : undefined,
            verifiedAt: completed ? now : undefined,
            notes: notes !== undefined ? notes : item.notes,
          };
        }
        return item;
      });

      const completedCount = updatedChecklist.filter((c) => c.completed).length;
      const newReadiness = Math.round((completedCount / updatedChecklist.length) * 100);

      const updated: ProjectHandover = {
        ...h,
        checklist: updatedChecklist,
        handoverReadinessScore: newReadiness,
        updatedAt: now,
      };

      handovers[idx] = updated;
      saveLocalHandovers(handovers);

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('project_handovers').update({
            checklist: updatedChecklist,
            handover_readiness_score: newReadiness,
            updated_at: now,
          }).eq('id', handoverId);
        } catch (e) {
          console.warn('Supabase checklist update error', e);
        }
      }

      return { data: updated, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  /**
   * Add a new risk to the project risk registry
   */
  async addHandoverRisk(
    handoverId: string,
    risk: Omit<HandoverRiskItem, 'id'>
  ): Promise<{ data: ProjectHandover | null; error: string | null }> {
    try {
      const handovers = getLocalHandovers();
      const idx = handovers.findIndex((h) => h.id === handoverId);
      if (idx === -1) return { data: null, error: 'Handover not found' };

      const h = handovers[idx];
      const newRisk: HandoverRiskItem = {
        ...risk,
        id: `rsk_${Date.now()}`,
      };

      const updated: ProjectHandover = {
        ...h,
        riskRegistry: [newRisk, ...h.riskRegistry],
        updatedAt: new Date().toISOString(),
      };

      handovers[idx] = updated;
      saveLocalHandovers(handovers);
      return { data: updated, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  /**
   * Update risk item in registry
   */
  async updateHandoverRisk(
    handoverId: string,
    riskId: string,
    updates: Partial<HandoverRiskItem>
  ): Promise<{ data: ProjectHandover | null; error: string | null }> {
    try {
      const handovers = getLocalHandovers();
      const idx = handovers.findIndex((h) => h.id === handoverId);
      if (idx === -1) return { data: null, error: 'Handover not found' };

      const h = handovers[idx];
      const updatedRisks = h.riskRegistry.map((r) => (r.id === riskId ? { ...r, ...updates } : r));

      const updated: ProjectHandover = {
        ...h,
        riskRegistry: updatedRisks,
        updatedAt: new Date().toISOString(),
      };

      handovers[idx] = updated;
      saveLocalHandovers(handovers);
      return { data: updated, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  /**
   * Execute Tri-Party Handover Sign-Off (SA, Sales AE, Delivery PM)
   */
  async signHandoverGovernance(
    handoverId: string,
    signerRole: 'SA' | 'SALES' | 'PM',
    userProfile: UserProfile,
    comments?: string,
    plannedKickoffDate?: string
  ): Promise<{ data: ProjectHandover | null; error: string | null }> {
    try {
      const handovers = getLocalHandovers();
      const idx = handovers.findIndex((h) => h.id === handoverId);
      if (idx === -1) return { data: null, error: 'Handover not found' };

      const h = handovers[idx];
      const now = new Date().toISOString();

      let saSignOff = { ...h.saSignOff };
      let salesSignOff = { ...h.salesSignOff };
      let pmSignOff = { ...h.pmSignOff };

      if (signerRole === 'SA') {
        saSignOff = {
          isSigned: true,
          signedBy: userProfile.name,
          signedAt: now,
          comments: comments || 'Solutions architecture and sizing validated for project handover.',
        };
      } else if (signerRole === 'SALES') {
        salesSignOff = {
          isSigned: true,
          signedBy: userProfile.name,
          signedAt: now,
          comments: comments || 'Commercial contracts and PO confirmed matching project baseline.',
        };
      } else if (signerRole === 'PM') {
        pmSignOff = {
          isSigned: true,
          signedBy: userProfile.name,
          signedAt: now,
          comments: comments || 'Scope accepted. Project Delivery PM assumes operational ownership.',
          plannedKickoffDate: plannedKickoffDate || h.targetKickoffDate,
        };
      }

      // Check if all 3 have signed
      const allSigned = saSignOff.isSigned && salesSignOff.isSigned && pmSignOff.isSigned;
      let nextStatus: HandoverStatus = h.status;
      if (allSigned) {
        nextStatus = 'OFFICIALLY_HANDED_OVER';
      } else if (pmSignOff.isSigned || saSignOff.isSigned) {
        nextStatus = 'ACCEPTANCE_SIGN_OFF';
      }

      const updated: ProjectHandover = {
        ...h,
        status: nextStatus,
        saSignOff,
        salesSignOff,
        pmSignOff,
        targetKickoffDate: plannedKickoffDate || h.targetKickoffDate,
        updatedAt: now,
      };

      handovers[idx] = updated;
      saveLocalHandovers(handovers);

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('project_handovers').update(updated).eq('id', handoverId);
        } catch (e) {
          console.warn('Supabase signoff update error', e);
        }
      }

      return { data: updated, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  /**
   * Direct status transition for Handover
   */
  async transitionHandoverStatus(
    id: string,
    newStatus: HandoverStatus
  ): Promise<{ data: ProjectHandover | null; error: string | null }> {
    try {
      const handovers = getLocalHandovers();
      const idx = handovers.findIndex((h) => h.id === id);
      if (idx === -1) return { data: null, error: 'Handover not found' };

      const updated: ProjectHandover = {
        ...handovers[idx],
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };

      handovers[idx] = updated;
      saveLocalHandovers(handovers);
      return { data: updated, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  /**
   * Get Handover metrics summary
   */
  async getHandoverStatsSummary(): Promise<HandoverStatsSummary> {
    const handovers = getLocalHandovers();
    const pendingKickoffCount = handovers.filter((h) => h.status === 'PENDING_KICKOFF').length;
    const inReviewCount = handovers.filter((h) => h.status === 'REVIEW_IN_PROGRESS').length;
    const awaitingSignOffCount = handovers.filter((h) => h.status === 'ACCEPTANCE_SIGN_OFF').length;
    const officiallyHandedOverCount = handovers.filter((h) => h.status === 'OFFICIALLY_HANDED_OVER').length;

    const totalScore = handovers.reduce((acc, h) => acc + h.handoverReadinessScore, 0);
    const averageReadinessScorePct = handovers.length > 0 ? Math.round(totalScore / handovers.length) : 0;

    const totalDeliveryPipelineValueIDR = handovers.reduce((acc, h) => acc + h.dealValueIDR, 0);
    const totalDeliveryPipelineValueUSD = handovers.reduce((acc, h) => acc + (h.dealValueUSD || 0), 0);

    const highRiskProjectsCount = handovers.filter((h) =>
      h.riskRegistry.some((r) => r.impact === 'CRITICAL' || r.impact === 'HIGH')
    ).length;

    return {
      totalHandovers: handovers.length,
      pendingKickoffCount,
      inReviewCount,
      awaitingSignOffCount,
      officiallyHandedOverCount,
      averageReadinessScorePct,
      totalDeliveryPipelineValueIDR,
      totalDeliveryPipelineValueUSD,
      highRiskProjectsCount,
    };
  },
};
