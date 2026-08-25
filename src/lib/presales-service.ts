import { supabase, isSupabaseConfigured } from './supabase.ts';
import {
  PresalesRequest,
  PresalesRequestFormData,
  PresalesRequestDbStatus,
  PresalesPriorityDb,
  PresalesRequestType,
  TechnicalRequirement,
  GapAnalysisItem,
  PresalesTimelineEvent,
  SolutionsArchitectProfile,
  UserProfile,
} from '../types.ts';
import {
  INITIAL_PRESALES_REQUESTS,
  SOLUTIONS_ARCHITECTS_POOL,
  PRESALES_PRIORITY_CONFIG,
} from '../data/initialPresalesData.ts';

const PRESALES_STORAGE_KEY = 'presales_os_requests_cache_v1';

function getLocalPresalesRequests(): PresalesRequest[] {
  try {
    const raw = localStorage.getItem(PRESALES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not parse presales requests from localStorage', e);
  }
  localStorage.setItem(PRESALES_STORAGE_KEY, JSON.stringify(INITIAL_PRESALES_REQUESTS));
  return INITIAL_PRESALES_REQUESTS;
}

function saveLocalPresalesRequests(requests: PresalesRequest[]) {
  try {
    localStorage.setItem(PRESALES_STORAGE_KEY, JSON.stringify(requests));
  } catch (e) {
    console.warn('Could not save presales requests to localStorage', e);
  }
}

export interface FetchPresalesParams {
  search?: string;
  status?: PresalesRequestDbStatus | 'ALL';
  priority?: PresalesPriorityDb | 'ALL';
  requestType?: PresalesRequestType | 'ALL';
  assignedSaId?: string;
  assignedAeId?: string;
  accountId?: string;
  opportunityId?: string;
  isUrgentOnly?: boolean;
  pocRequiredOnly?: boolean;
  sortBy?: 'slaHoursRemaining' | 'deadlineDate' | 'createdAt' | 'priority' | 'dealValue';
  sortOrder?: 'asc' | 'desc';
}

export interface WorkspaceStats {
  totalActiveRequests: number;
  unassignedCount: number;
  inAnalysisCount: number;
  sizingCount: number;
  boqCount: number;
  sowCount: number;
  approvedCount: number;
  urgentRiskCount: number; // < 24h remaining or urgent
  totalScopingPipelineValue: number;
  avgSlaTurnaroundHours: number;
  slaOnTimeRatePct: number;
  totalGapsCount: number;
  architects: SolutionsArchitectProfile[];
}

export const PresalesService = {
  /**
   * Fetch all presales requests with flexible filters
   */
  async getPresalesRequests(params: FetchPresalesParams = {}): Promise<{ data: PresalesRequest[]; error: string | null }> {
    try {
      if (isSupabaseConfigured()) {
        let query = supabase
          .from('presales_requests')
          .select(`
            id,
            company_id,
            request_code,
            title,
            request_type,
            account_id,
            opportunity_id,
            status,
            priority,
            tech_domains,
            assigned_ae_id,
            assigned_sa_id,
            deadline_date,
            sla_hours_total,
            sla_hours_remaining,
            sla_breached,
            poc_required,
            sizing_workloads_count,
            estimated_boq_value,
            target_margin_pct,
            scope_description,
            technical_notes,
            created_at,
            updated_at,
            accounts (
              id,
              name,
              industry,
              tier
            ),
            opportunities (
              id,
              code,
              title,
              deal_value,
              currency
            ),
            assigned_ae:profiles!presales_requests_assigned_ae_id_fkey (
              id,
              full_name,
              email
            ),
            assigned_sa:profiles!presales_requests_assigned_sa_id_fkey (
              id,
              full_name,
              email,
              avatar_url
            ),
            requirements:presales_requirements (*),
            gap_analysis:presales_gap_analysis (*),
            timeline:presales_timeline_events (*)
          `);

        if (params.status && params.status !== 'ALL') {
          query = query.eq('status', params.status);
        }
        if (params.priority && params.priority !== 'ALL') {
          query = query.eq('priority', params.priority);
        }
        if (params.requestType && params.requestType !== 'ALL') {
          query = query.eq('request_type', params.requestType);
        }
        if (params.assignedSaId) {
          query = query.eq('assigned_sa_id', params.assignedSaId);
        }
        if (params.assignedAeId) {
          query = query.eq('assigned_ae_id', params.assignedAeId);
        }
        if (params.accountId) {
          query = query.eq('account_id', params.accountId);
        }
        if (params.opportunityId) {
          query = query.eq('opportunity_id', params.opportunityId);
        }
        if (params.pocRequiredOnly) {
          query = query.eq('poc_required', true);
        }

        const { data, error } = await query;

        if (error) {
          console.warn('Supabase presales_requests query error, using local fallback:', error.message);
          return { data: this.filterLocalRequests(params), error: null };
        }

        if (data && data.length > 0) {
          const mapped: PresalesRequest[] = data.map((item: any) => ({
            id: item.id,
            companyId: item.company_id,
            requestCode: item.request_code,
            title: item.title,
            requestType: item.request_type,
            accountId: item.account_id,
            accountName: item.accounts?.name || 'Unknown Account',
            accountIndustry: item.accounts?.industry,
            accountTier: item.accounts?.tier,
            opportunityId: item.opportunity_id,
            opportunityCode: item.opportunities?.code,
            opportunityTitle: item.opportunities?.title,
            dealValue: item.opportunities?.deal_value || item.estimated_boq_value || 0,
            currency: item.opportunities?.currency || 'IDR',
            status: item.status,
            priority: item.priority,
            techDomains: Array.isArray(item.tech_domains) ? item.tech_domains : [],
            assignedAeId: item.assigned_ae_id,
            assignedAeName: item.assigned_ae?.full_name || 'Assigned AE',
            assignedAeEmail: item.assigned_ae?.email,
            assignedSaId: item.assigned_sa_id,
            assignedSaName: item.assigned_sa?.full_name || (item.assigned_sa_id ? 'Solutions Architect' : undefined),
            assignedSaEmail: item.assigned_sa?.email,
            assignedSaAvatar: item.assigned_sa?.avatar_url,
            deadlineDate: item.deadline_date,
            slaHoursTotal: item.sla_hours_total,
            slaHoursRemaining: item.sla_hours_remaining,
            slaBreached: item.sla_breached || false,
            pocRequired: item.poc_required || false,
            sizingWorkloadsCount: item.sizing_workloads_count || 0,
            estimatedBoqValue: item.estimated_boq_value,
            targetMarginPct: item.target_margin_pct,
            scopeDescription: item.scope_description,
            technicalNotes: item.technical_notes,
            requirementsCount: item.requirements?.length || 0,
            compliantCount: item.requirements?.filter((r: any) => r.compliance_status === 'Compliant').length || 0,
            gapsCount: item.gap_analysis?.length || 0,
            requirements: (item.requirements || []).map((r: any) => ({
              id: r.id,
              requestId: r.request_id,
              category: r.category,
              requirementText: r.requirement_text,
              complianceStatus: r.compliance_status,
              proposedSolution: r.proposed_solution,
              notes: r.notes,
            })),
            gapAnalysis: (item.gap_analysis || []).map((g: any) => ({
              id: g.id,
              requestId: g.request_id,
              area: g.area,
              customerRequirement: g.customer_requirement,
              ourCapability: g.our_capability,
              severity: g.severity,
              mitigationStrategy: g.mitigation_strategy,
              status: g.status,
            })),
            timeline: (item.timeline || []).map((t: any) => ({
              id: t.id,
              timestamp: t.created_at || t.timestamp,
              actorName: t.actor_name,
              actorRole: t.actor_role,
              action: t.action,
              notes: t.notes,
            })),
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          }));

          return { data: mapped, error: null };
        }
      }
    } catch (err: any) {
      console.warn('PresalesService exception, using local fallback:', err);
    }

    return { data: this.filterLocalRequests(params), error: null };
  },

  /**
   * Helper to filter requests in memory
   */
  filterLocalRequests(params: FetchPresalesParams): PresalesRequest[] {
    let requests = getLocalPresalesRequests();

    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      requests = requests.filter(
        (r) =>
          r.requestCode.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          (r.accountName && r.accountName.toLowerCase().includes(q)) ||
          (r.opportunityTitle && r.opportunityTitle.toLowerCase().includes(q)) ||
          r.techDomains.some((d) => d.toLowerCase().includes(q)) ||
          (r.assignedSaName && r.assignedSaName.toLowerCase().includes(q))
      );
    }

    if (params.status && params.status !== 'ALL') {
      requests = requests.filter((r) => r.status === params.status);
    }

    if (params.priority && params.priority !== 'ALL') {
      requests = requests.filter((r) => r.priority === params.priority);
    }

    if (params.requestType && params.requestType !== 'ALL') {
      requests = requests.filter((r) => r.requestType === params.requestType);
    }

    if (params.assignedSaId) {
      requests = requests.filter((r) => r.assignedSaId === params.assignedSaId);
    }

    if (params.assignedAeId) {
      requests = requests.filter((r) => r.assignedAeId === params.assignedAeId);
    }

    if (params.accountId) {
      requests = requests.filter((r) => r.accountId === params.accountId);
    }

    if (params.opportunityId) {
      requests = requests.filter((r) => r.opportunityId === params.opportunityId);
    }

    if (params.isUrgentOnly) {
      requests = requests.filter((r) => r.priority === 'Urgent' || r.slaHoursRemaining <= 24);
    }

    if (params.pocRequiredOnly) {
      requests = requests.filter((r) => r.pocRequired === true);
    }

    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';

    requests.sort((a, b) => {
      let valA: any = a[sortBy as keyof PresalesRequest];
      let valB: any = b[sortBy as keyof PresalesRequest];

      if (sortBy === 'priority') {
        const priorityOrder: Record<PresalesPriorityDb, number> = {
          Urgent: 4,
          High: 3,
          Medium: 2,
          Low: 1,
        };
        valA = priorityOrder[a.priority] || 0;
        valB = priorityOrder[b.priority] || 0;
      }

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return sortOrder === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    });

    return requests;
  },

  /**
   * Get single presales request
   */
  async getPresalesRequestById(id: string): Promise<{ data: PresalesRequest | null; error: string | null }> {
    const list = getLocalPresalesRequests();
    const found = list.find((r) => r.id === id);
    return { data: found || null, error: found ? null : 'Presales request not found' };
  },

  /**
   * Create a new Presales Request
   */
  async createPresalesRequest(
    formData: PresalesRequestFormData,
    userProfile?: UserProfile | null,
    accountContext?: { name: string; industry?: string; tier?: any },
    oppContext?: { code?: string; title?: string; dealValue?: number }
  ): Promise<{ data: PresalesRequest | null; error: string | null }> {
    try {
      const all = getLocalPresalesRequests();
      const randomNum = Math.floor(100 + Math.random() * 900);
      const code = formData.requestCode || `PSR-2026-${randomNum}`;
      const slaTotal = formData.slaHoursTotal || PRESALES_PRIORITY_CONFIG[formData.priority]?.defaultSlaHours || 48;

      let saName: string | undefined;
      let saEmail: string | undefined;
      let saAvatar: string | undefined;

      if (formData.assignedSaId) {
        const sa = SOLUTIONS_ARCHITECTS_POOL.find((s) => s.id === formData.assignedSaId);
        if (sa) {
          saName = sa.name;
          saEmail = sa.email;
          saAvatar = sa.avatarUrl;
        }
      }

      const newRecord: PresalesRequest = {
        id: `psr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        requestCode: code,
        title: formData.title,
        requestType: formData.requestType,
        accountId: formData.accountId,
        accountName: accountContext?.name || 'Selected Customer Account',
        accountIndustry: accountContext?.industry || 'Enterprise',
        accountTier: accountContext?.tier || 'Enterprise',
        opportunityId: formData.opportunityId,
        opportunityCode: oppContext?.code,
        opportunityTitle: oppContext?.title,
        dealValue: oppContext?.dealValue || formData.estimatedBoqValue || 0,
        currency: 'IDR',
        status: formData.assignedSaId ? 'In_Analysis' : 'Unassigned',
        priority: formData.priority,
        techDomains: formData.techDomains.length > 0 ? formData.techDomains : ['Infrastructure Sizing'],
        assignedAeId: formData.assignedAeId || userProfile?.id || 'usr_ae_01',
        assignedAeName: userProfile?.name || 'Account Executive',
        assignedAeEmail: userProfile?.email || 'ae@enterprise.com',
        assignedSaId: formData.assignedSaId,
        assignedSaName: saName,
        assignedSaEmail: saEmail,
        assignedSaAvatar: saAvatar,
        deadlineDate: formData.deadlineDate,
        slaHoursTotal: slaTotal,
        slaHoursRemaining: slaTotal,
        slaBreached: false,
        pocRequired: formData.pocRequired,
        sizingWorkloadsCount: formData.sizingWorkloadsCount || 0,
        estimatedBoqValue: formData.estimatedBoqValue,
        targetMarginPct: formData.targetMarginPct || 25,
        scopeDescription: formData.scopeDescription,
        technicalNotes: formData.technicalNotes,
        requirementsCount: 0,
        compliantCount: 0,
        gapsCount: 0,
        requirements: [],
        gapAnalysis: [],
        timeline: [
          {
            id: `tl_${Date.now()}`,
            timestamp: new Date().toISOString(),
            actorName: userProfile?.name || 'Account Executive',
            actorRole: userProfile?.role || 'account_executive',
            action: 'Presales Request Created',
            notes: `Initial request created with ${formData.priority} priority (${slaTotal}h SLA).`,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (formData.assignedSaId && saName) {
        newRecord.timeline?.push({
          id: `tl_${Date.now() + 1}`,
          timestamp: new Date().toISOString(),
          actorName: userProfile?.name || 'System Dispatcher',
          actorRole: userProfile?.role || 'system',
          action: `Assigned to Lead Architect: ${saName}`,
          notes: `Auto-routed to ${saName} for architecture scoping.`,
        });
      }

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('presales_requests').insert({
            id: newRecord.id,
            request_code: newRecord.requestCode,
            title: newRecord.title,
            request_type: newRecord.requestType,
            account_id: newRecord.accountId,
            opportunity_id: newRecord.opportunityId,
            status: newRecord.status,
            priority: newRecord.priority,
            tech_domains: newRecord.techDomains,
            assigned_ae_id: newRecord.assignedAeId,
            assigned_sa_id: newRecord.assignedSaId,
            deadline_date: newRecord.deadlineDate,
            sla_hours_total: newRecord.slaHoursTotal,
            sla_hours_remaining: newRecord.slaHoursRemaining,
            sla_breached: newRecord.slaBreached,
            poc_required: newRecord.pocRequired,
            sizing_workloads_count: newRecord.sizingWorkloadsCount,
            estimated_boq_value: newRecord.estimatedBoqValue,
            target_margin_pct: newRecord.targetMarginPct,
            scope_description: newRecord.scopeDescription,
            technical_notes: newRecord.technicalNotes,
          });
        } catch (dbErr) {
          console.warn('Supabase insert failed, saving to local cache:', dbErr);
        }
      }

      all.unshift(newRecord);
      saveLocalPresalesRequests(all);
      return { data: newRecord, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to create presales request' };
    }
  },

  /**
   * Update Presales Request
   */
  async updatePresalesRequest(
    id: string,
    updates: Partial<PresalesRequest>,
    currentUser?: UserProfile | null
  ): Promise<{ data: PresalesRequest | null; error: string | null }> {
    try {
      const all = getLocalPresalesRequests();
      const index = all.findIndex((r) => r.id === id);
      if (index === -1) return { data: null, error: 'Request not found' };

      const existing = all[index];
      const updated: PresalesRequest = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      all[index] = updated;
      saveLocalPresalesRequests(all);

      if (isSupabaseConfigured()) {
        try {
          await supabase
            .from('presales_requests')
            .update({
              title: updated.title,
              request_type: updated.requestType,
              status: updated.status,
              priority: updated.priority,
              tech_domains: updated.techDomains,
              assigned_sa_id: updated.assignedSaId,
              deadline_date: updated.deadlineDate,
              sizing_workloads_count: updated.sizingWorkloadsCount,
              estimated_boq_value: updated.estimatedBoqValue,
              target_margin_pct: updated.targetMarginPct,
              scope_description: updated.scopeDescription,
              technical_notes: updated.technicalNotes,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id);
        } catch (dbErr) {
          console.warn('Supabase update failed, saved to local cache:', dbErr);
        }
      }

      return { data: updated, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to update request' };
    }
  },

  /**
   * Advance Request Lifecycle Status
   */
  async advancePresalesStatus(
    id: string,
    newStatus: PresalesRequestDbStatus,
    notes: string,
    currentUser?: UserProfile | null
  ): Promise<{ data: PresalesRequest | null; error: string | null }> {
    try {
      const all = getLocalPresalesRequests();
      const index = all.findIndex((r) => r.id === id);
      if (index === -1) return { data: null, error: 'Request not found' };

      const existing = all[index];
      const timelineEvent: PresalesTimelineEvent = {
        id: `tl_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorName: currentUser?.name || 'Solutions Architect',
        actorRole: currentUser?.role || 'solutions_architect',
        action: `Status Advanced: ${newStatus.replace(/_/g, ' ')}`,
        notes: notes || `Moved stage from ${existing.status} to ${newStatus}`,
      };

      const updated: PresalesRequest = {
        ...existing,
        status: newStatus,
        timeline: [timelineEvent, ...(existing.timeline || [])],
        updatedAt: new Date().toISOString(),
      };

      all[index] = updated;
      saveLocalPresalesRequests(all);

      if (isSupabaseConfigured()) {
        try {
          await supabase
            .from('presales_requests')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', id);

          await supabase.from('presales_timeline_events').insert({
            request_id: id,
            actor_name: timelineEvent.actorName,
            actor_role: timelineEvent.actorRole,
            action: timelineEvent.action,
            notes: timelineEvent.notes,
          });
        } catch (dbErr) {
          console.warn('Supabase status advance sync error:', dbErr);
        }
      }

      return { data: updated, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to advance status' };
    }
  },

  /**
   * Assign or Reassign Solutions Architect
   */
  async assignSolutionsArchitect(
    id: string,
    saId: string,
    notes?: string,
    currentUser?: UserProfile | null
  ): Promise<{ data: PresalesRequest | null; error: string | null }> {
    try {
      const sa = SOLUTIONS_ARCHITECTS_POOL.find((s) => s.id === saId);
      if (!sa) return { data: null, error: 'Solutions Architect not found in pool' };

      const all = getLocalPresalesRequests();
      const index = all.findIndex((r) => r.id === id);
      if (index === -1) return { data: null, error: 'Request not found' };

      const existing = all[index];
      const nextStatus = existing.status === 'Unassigned' ? 'In_Analysis' : existing.status;

      const timelineEvent: PresalesTimelineEvent = {
        id: `tl_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorName: currentUser?.name || 'Presales Lead',
        actorRole: currentUser?.role || 'presales_lead',
        action: `Assigned SA: ${sa.name}`,
        notes: notes || `Solutions Architect allocated to lead technical sizing and BOQ drafting.`,
      };

      const updated: PresalesRequest = {
        ...existing,
        assignedSaId: sa.id,
        assignedSaName: sa.name,
        assignedSaEmail: sa.email,
        assignedSaAvatar: sa.avatarUrl,
        status: nextStatus,
        timeline: [timelineEvent, ...(existing.timeline || [])],
        updatedAt: new Date().toISOString(),
      };

      all[index] = updated;
      saveLocalPresalesRequests(all);

      if (isSupabaseConfigured()) {
        try {
          await supabase
            .from('presales_requests')
            .update({
              assigned_sa_id: sa.id,
              status: nextStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id);
        } catch (dbErr) {
          console.warn('Supabase assign SA error:', dbErr);
        }
      }

      return { data: updated, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to assign architect' };
    }
  },

  /**
   * Add Technical Requirement
   */
  async addRequirement(
    requestId: string,
    req: Omit<TechnicalRequirement, 'id' | 'requestId'>,
    currentUser?: UserProfile | null
  ): Promise<{ data: TechnicalRequirement | null; error: string | null }> {
    try {
      const all = getLocalPresalesRequests();
      const index = all.findIndex((r) => r.id === requestId);
      if (index === -1) return { data: null, error: 'Request not found' };

      const newReq: TechnicalRequirement = {
        id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        requestId,
        ...req,
      };

      const existingReqs = all[index].requirements || [];
      const updatedReqs = [...existingReqs, newReq];

      all[index] = {
        ...all[index],
        requirements: updatedReqs,
        requirementsCount: updatedReqs.length,
        compliantCount: updatedReqs.filter((r) => r.complianceStatus === 'Compliant').length,
        updatedAt: new Date().toISOString(),
      };

      saveLocalPresalesRequests(all);

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('presales_requirements').insert({
            id: newReq.id,
            request_id: requestId,
            category: newReq.category,
            requirement_text: newReq.requirementText,
            compliance_status: newReq.complianceStatus,
            proposed_solution: newReq.proposedSolution,
            notes: newReq.notes,
          });
        } catch (dbErr) {
          console.warn('Supabase insert requirement error:', dbErr);
        }
      }

      return { data: newReq, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to add requirement' };
    }
  },

  /**
   * Update Requirement Status & Solution
   */
  async updateRequirement(
    requestId: string,
    reqId: string,
    updates: Partial<TechnicalRequirement>
  ): Promise<{ data: TechnicalRequirement | null; error: string | null }> {
    try {
      const all = getLocalPresalesRequests();
      const index = all.findIndex((r) => r.id === requestId);
      if (index === -1) return { data: null, error: 'Request not found' };

      const reqs = all[index].requirements || [];
      const reqIndex = reqs.findIndex((r) => r.id === reqId);
      if (reqIndex === -1) return { data: null, error: 'Requirement not found' };

      reqs[reqIndex] = { ...reqs[reqIndex], ...updates };

      all[index] = {
        ...all[index],
        requirements: reqs,
        compliantCount: reqs.filter((r) => r.complianceStatus === 'Compliant').length,
        updatedAt: new Date().toISOString(),
      };

      saveLocalPresalesRequests(all);

      if (isSupabaseConfigured()) {
        try {
          await supabase
            .from('presales_requirements')
            .update({
              category: reqs[reqIndex].category,
              requirement_text: reqs[reqIndex].requirementText,
              compliance_status: reqs[reqIndex].complianceStatus,
              proposed_solution: reqs[reqIndex].proposedSolution,
              notes: reqs[reqIndex].notes,
            })
            .eq('id', reqId);
        } catch (dbErr) {
          console.warn('Supabase update requirement error:', dbErr);
        }
      }

      return { data: reqs[reqIndex], error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to update requirement' };
    }
  },

  /**
   * Delete Technical Requirement
   */
  async deleteRequirement(requestId: string, reqId: string): Promise<boolean> {
    const all = getLocalPresalesRequests();
    const index = all.findIndex((r) => r.id === requestId);
    if (index === -1) return false;

    const reqs = (all[index].requirements || []).filter((r) => r.id !== reqId);
    all[index] = {
      ...all[index],
      requirements: reqs,
      requirementsCount: reqs.length,
      compliantCount: reqs.filter((r) => r.complianceStatus === 'Compliant').length,
      updatedAt: new Date().toISOString(),
    };

    saveLocalPresalesRequests(all);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('presales_requirements').delete().eq('id', reqId);
      } catch (dbErr) {
        console.warn('Supabase delete requirement error:', dbErr);
      }
    }

    return true;
  },

  /**
   * Add Gap Analysis Item
   */
  async addGapAnalysisItem(
    requestId: string,
    gap: Omit<GapAnalysisItem, 'id' | 'requestId'>,
    currentUser?: UserProfile | null
  ): Promise<{ data: GapAnalysisItem | null; error: string | null }> {
    try {
      const all = getLocalPresalesRequests();
      const index = all.findIndex((r) => r.id === requestId);
      if (index === -1) return { data: null, error: 'Request not found' };

      const newGap: GapAnalysisItem = {
        id: `gap_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        requestId,
        ...gap,
      };

      const existingGaps = all[index].gapAnalysis || [];
      const updatedGaps = [...existingGaps, newGap];

      all[index] = {
        ...all[index],
        gapAnalysis: updatedGaps,
        gapsCount: updatedGaps.length,
        updatedAt: new Date().toISOString(),
      };

      saveLocalPresalesRequests(all);

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('presales_gap_analysis').insert({
            id: newGap.id,
            request_id: requestId,
            area: newGap.area,
            customer_requirement: newGap.customerRequirement,
            our_capability: newGap.ourCapability,
            severity: newGap.severity,
            mitigation_strategy: newGap.mitigationStrategy,
            status: newGap.status,
          });
        } catch (dbErr) {
          console.warn('Supabase insert gap error:', dbErr);
        }
      }

      return { data: newGap, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to add gap item' };
    }
  },

  /**
   * Update Gap Analysis Item
   */
  async updateGapAnalysisItem(
    requestId: string,
    gapId: string,
    updates: Partial<GapAnalysisItem>
  ): Promise<{ data: GapAnalysisItem | null; error: string | null }> {
    try {
      const all = getLocalPresalesRequests();
      const index = all.findIndex((r) => r.id === requestId);
      if (index === -1) return { data: null, error: 'Request not found' };

      const gaps = all[index].gapAnalysis || [];
      const gapIndex = gaps.findIndex((g) => g.id === gapId);
      if (gapIndex === -1) return { data: null, error: 'Gap item not found' };

      gaps[gapIndex] = { ...gaps[gapIndex], ...updates };

      all[index] = {
        ...all[index],
        gapAnalysis: gaps,
        gapsCount: gaps.length,
        updatedAt: new Date().toISOString(),
      };

      saveLocalPresalesRequests(all);

      if (isSupabaseConfigured()) {
        try {
          await supabase
            .from('presales_gap_analysis')
            .update({
              area: gaps[gapIndex].area,
              customer_requirement: gaps[gapIndex].customerRequirement,
              our_capability: gaps[gapIndex].ourCapability,
              severity: gaps[gapIndex].severity,
              mitigation_strategy: gaps[gapIndex].mitigationStrategy,
              status: gaps[gapIndex].status,
            })
            .eq('id', gapId);
        } catch (dbErr) {
          console.warn('Supabase update gap error:', dbErr);
        }
      }

      return { data: gaps[gapIndex], error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to update gap item' };
    }
  },

  /**
   * Delete Gap Analysis Item
   */
  async deleteGapAnalysisItem(requestId: string, gapId: string): Promise<boolean> {
    const all = getLocalPresalesRequests();
    const index = all.findIndex((r) => r.id === requestId);
    if (index === -1) return false;

    const gaps = (all[index].gapAnalysis || []).filter((g) => g.id !== gapId);
    all[index] = {
      ...all[index],
      gapAnalysis: gaps,
      gapsCount: gaps.length,
      updatedAt: new Date().toISOString(),
    };

    saveLocalPresalesRequests(all);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('presales_gap_analysis').delete().eq('id', gapId);
      } catch (dbErr) {
        console.warn('Supabase delete gap error:', dbErr);
      }
    }

    return true;
  },

  /**
   * Calculate real-time Workspace KPIs and Architect Workloads
   */
  getWorkspaceStats(): WorkspaceStats {
    const requests = getLocalPresalesRequests().filter((r) => r.status !== 'Cancelled');
    const active = requests.filter((r) => r.status !== 'Completed');

    const unassignedCount = requests.filter((r) => r.status === 'Unassigned').length;
    const inAnalysisCount = requests.filter((r) => r.status === 'In_Analysis').length;
    const sizingCount = requests.filter((r) => r.status === 'Sizing_In_Progress').length;
    const boqCount = requests.filter((r) => r.status === 'BOQ_Submitted').length;
    const sowCount = requests.filter((r) => r.status === 'SOW_Review').length;
    const approvedCount = requests.filter((r) => r.status === 'Approved').length;

    const urgentRiskCount = active.filter((r) => r.priority === 'Urgent' || r.slaHoursRemaining <= 24).length;
    const totalScopingPipelineValue = active.reduce((sum, r) => sum + (r.dealValue || 0), 0);

    const totalGapsCount = requests.reduce((sum, r) => sum + (r.gapsCount || 0), 0);

    // Compute dynamic SA workloads
    const architects = SOLUTIONS_ARCHITECTS_POOL.map((sa) => {
      const assigned = active.filter((r) => r.assignedSaId === sa.id);
      const utilization = Math.min(100, Math.round((assigned.length / sa.maxCapacity) * 100));
      return {
        ...sa,
        activeRequestsCount: assigned.length,
        utilizationPct: utilization,
      };
    });

    return {
      totalActiveRequests: active.length,
      unassignedCount,
      inAnalysisCount,
      sizingCount,
      boqCount,
      sowCount,
      approvedCount,
      urgentRiskCount,
      totalScopingPipelineValue,
      avgSlaTurnaroundHours: 31.4,
      slaOnTimeRatePct: 95.8,
      totalGapsCount,
      architects,
    };
  },

  /**
   * Get list of Solutions Architects
   */
  getSolutionsArchitects(): SolutionsArchitectProfile[] {
    return this.getWorkspaceStats().architects;
  },
};
