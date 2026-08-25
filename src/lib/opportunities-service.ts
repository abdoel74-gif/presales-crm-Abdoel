import { supabase, isSupabaseConfigured } from './supabase.ts';
import { Opportunity, OpportunityFormData, OpportunityDbStage, MeddpiccData } from '../types.ts';
import { INITIAL_OPPORTUNITY_RECORDS, STAGE_CONFIG } from '../data/initialOpportunitiesData.ts';

const OPPORTUNITIES_STORAGE_KEY = 'presales_os_opportunities_cache_v1';

function getLocalOpportunities(): Opportunity[] {
  try {
    const raw = localStorage.getItem(OPPORTUNITIES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not parse opportunities from localStorage', e);
  }
  localStorage.setItem(OPPORTUNITIES_STORAGE_KEY, JSON.stringify(INITIAL_OPPORTUNITY_RECORDS));
  return INITIAL_OPPORTUNITY_RECORDS;
}

function saveLocalOpportunities(opps: Opportunity[]) {
  try {
    localStorage.setItem(OPPORTUNITIES_STORAGE_KEY, JSON.stringify(opps));
  } catch (e) {
    console.warn('Could not save opportunities to localStorage', e);
  }
}

export interface FetchOpportunitiesParams {
  search?: string;
  stage?: OpportunityDbStage | 'ALL';
  assignedAeId?: string;
  assignedSaId?: string;
  accountId?: string;
  accountTier?: string;
  minDealValue?: number;
  maxDealValue?: number;
  sortBy?: 'dealValue' | 'createdAt' | 'probability' | 'meddpiccScore' | 'targetCloseDate';
  sortOrder?: 'asc' | 'desc';
}

export interface PipelineMetrics {
  totalPipelineValue: number;
  weightedPipelineValue: number;
  totalDealsCount: number;
  avgMeddpiccScore: number;
  winRatePct: number;
  stageBreakdown: {
    stage: OpportunityDbStage;
    label: string;
    count: number;
    totalValue: number;
    color: string;
  }[];
}

export const OpportunitiesService = {
  /**
   * Fetch all opportunities with filters
   */
  async getOpportunities(params: FetchOpportunitiesParams = {}): Promise<{ data: Opportunity[]; error: string | null }> {
    try {
      if (isSupabaseConfigured()) {
        let query = supabase
          .from('opportunities')
          .select(`
            id,
            company_id,
            account_id,
            code,
            title,
            stage,
            deal_value,
            probability,
            lead_source,
            target_close_date,
            assigned_ae_id,
            assigned_sa_id,
            meddpicc_score,
            meddpicc_data,
            loss_reason,
            created_at,
            updated_at,
            accounts (
              id,
              name,
              industry,
              tier
            ),
            assigned_ae:profiles!opportunities_assigned_ae_id_fkey (
              id,
              full_name,
              email
            ),
            assigned_sa:profiles!opportunities_assigned_sa_id_fkey (
              id,
              full_name,
              email
            )
          `);

        if (params.stage && params.stage !== 'ALL') {
          query = query.eq('stage', params.stage);
        }
        if (params.assignedAeId) {
          query = query.eq('assigned_ae_id', params.assignedAeId);
        }
        if (params.assignedSaId) {
          query = query.eq('assigned_sa_id', params.assignedSaId);
        }
        if (params.accountId) {
          query = query.eq('account_id', params.accountId);
        }

        const { data, error } = await query;

        if (!error && data && data.length > 0) {
          const mapped: Opportunity[] = data.map((item: any) => {
            const acc = Array.isArray(item.accounts) ? item.accounts[0] : item.accounts;
            const ae = Array.isArray(item.assigned_ae) ? item.assigned_ae[0] : item.assigned_ae;
            const sa = Array.isArray(item.assigned_sa) ? item.assigned_sa[0] : item.assigned_sa;

            return {
              id: item.id,
              companyId: item.company_id,
              accountId: item.account_id,
              accountName: acc?.name || 'Unknown Account',
              accountIndustry: acc?.industry || 'General Enterprise',
              accountTier: acc?.tier || 'Tier-1',
              code: item.code,
              title: item.title,
              stage: item.stage as OpportunityDbStage,
              dealValue: Number(item.deal_value) || 0,
              currency: 'IDR',
              probability: Number(item.probability) || 0,
              leadSource: item.lead_source || undefined,
              targetCloseDate: item.target_close_date || undefined,
              assignedAeId: item.assigned_ae_id,
              assignedAeName: ae?.full_name || 'Rian Hidayat',
              assignedAeEmail: ae?.email || undefined,
              assignedSaId: item.assigned_sa_id,
              assignedSaName: sa?.full_name || (item.assigned_sa_id ? 'Adrian Pratama' : undefined),
              assignedSaEmail: sa?.email || undefined,
              meddpiccScore: Number(item.meddpicc_score) || 0,
              meddpiccData: item.meddpicc_data as MeddpiccData,
              lossReason: item.loss_reason || undefined,
              createdAt: item.created_at,
              updatedAt: item.updated_at,
            };
          });

          // Apply client-side search or sorting if necessary
          let filtered = mapped;
          if (params.search) {
            const q = params.search.toLowerCase();
            filtered = filtered.filter(
              (o) =>
                o.title.toLowerCase().includes(q) ||
                o.code.toLowerCase().includes(q) ||
                (o.accountName && o.accountName.toLowerCase().includes(q))
            );
          }
          if (params.sortBy) {
            filtered.sort((a, b) => {
              const valA = (a as any)[params.sortBy!] || 0;
              const valB = (b as any)[params.sortBy!] || 0;
              return params.sortOrder === 'asc' ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
            });
          }

          saveLocalOpportunities(mapped);
          return { data: filtered, error: null };
        }
      }
    } catch (err: any) {
      console.warn('Supabase opportunities fetch error, using cache:', err.message);
    }

    // Fallback to local cached data
    let local = getLocalOpportunities();

    if (params.search) {
      const q = params.search.toLowerCase();
      local = local.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.code.toLowerCase().includes(q) ||
          (o.accountName && o.accountName.toLowerCase().includes(q))
      );
    }
    if (params.stage && params.stage !== 'ALL') {
      local = local.filter((o) => o.stage === params.stage);
    }
    if (params.assignedAeId) {
      local = local.filter((o) => o.assignedAeId === params.assignedAeId);
    }
    if (params.assignedSaId) {
      local = local.filter((o) => o.assignedSaId === params.assignedSaId);
    }
    if (params.accountId) {
      local = local.filter((o) => o.accountId === params.accountId);
    }
    if (params.accountTier) {
      local = local.filter((o) => o.accountTier === params.accountTier);
    }
    if (params.minDealValue !== undefined) {
      local = local.filter((o) => o.dealValue >= params.minDealValue!);
    }
    if (params.maxDealValue !== undefined) {
      local = local.filter((o) => o.dealValue <= params.maxDealValue!);
    }

    if (params.sortBy) {
      local.sort((a, b) => {
        const valA = (a as any)[params.sortBy!] || 0;
        const valB = (b as any)[params.sortBy!] || 0;
        return params.sortOrder === 'asc' ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
      });
    } else {
      // Default: sort by dealValue desc
      local.sort((a, b) => b.dealValue - a.dealValue);
    }

    return { data: local, error: null };
  },

  /**
   * Get single opportunity by ID
   */
  async getOpportunityById(id: string): Promise<{ data: Opportunity | null; error: string | null }> {
    const list = getLocalOpportunities();
    const found = list.find((o) => o.id === id);
    if (!found) return { data: null, error: 'Opportunity not found' };
    return { data: found, error: null };
  },

  /**
   * Calculate MEDDPICC score (0-100) from qualified criteria
   */
  calculateMeddpiccScore(data?: MeddpiccData): number {
    if (!data) return 0;
    const checks = [
      data.metricsQualified,
      data.economicBuyerQualified,
      data.decisionCriteriaQualified,
      data.decisionProcessQualified,
      data.paperProcessQualified,
      data.identifiedPainQualified,
      data.championQualified,
      data.competitionQualified,
    ];
    const qualifiedCount = checks.filter(Boolean).length;
    return Math.round((qualifiedCount / 8) * 100);
  },

  /**
   * Calculate pipeline summaries and analytics
   */
  calculatePipelineMetrics(opps: Opportunity[]): PipelineMetrics {
    const totalPipelineValue = opps
      .filter((o) => o.stage !== 'Closed_Lost')
      .reduce((sum, o) => sum + o.dealValue, 0);

    const weightedPipelineValue = opps
      .filter((o) => o.stage !== 'Closed_Lost')
      .reduce((sum, o) => sum + o.dealValue * (o.probability / 100), 0);

    const totalDealsCount = opps.length;

    const avgMeddpiccScore =
      opps.length > 0
        ? Math.round(opps.reduce((sum, o) => sum + (o.meddpiccScore || 0), 0) / opps.length)
        : 0;

    const wonCount = opps.filter((o) => o.stage === 'Closed_Won').length;
    const lostCount = opps.filter((o) => o.stage === 'Closed_Lost').length;
    const closedCount = wonCount + lostCount;
    const winRatePct = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 68;

    const stageBreakdown = STAGE_CONFIG.map((cfg) => {
      const stageOpps = opps.filter((o) => o.stage === cfg.key);
      const stageValue = stageOpps.reduce((sum, o) => sum + o.dealValue, 0);
      return {
        stage: cfg.key as OpportunityDbStage,
        label: cfg.label,
        count: stageOpps.length,
        totalValue: stageValue,
        color: cfg.color,
      };
    });

    return {
      totalPipelineValue,
      weightedPipelineValue,
      totalDealsCount,
      avgMeddpiccScore,
      winRatePct,
      stageBreakdown,
    };
  },

  /**
   * Create a new Opportunity
   */
  async createOpportunity(formData: OpportunityFormData, accountMeta?: { name: string; industry: string; tier: any }): Promise<{ data: Opportunity | null; error: string | null }> {
    const meddpiccScore = formData.meddpiccScore ?? this.calculateMeddpiccScore(formData.meddpiccData);

    const newOpp: Opportunity = {
      id: `opp_${Date.now()}`,
      accountId: formData.accountId,
      accountName: accountMeta?.name || 'Enterprise Account',
      accountIndustry: accountMeta?.industry || 'Enterprise',
      accountTier: accountMeta?.tier || 'Tier-1',
      code: formData.code || `OPP-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: formData.title,
      stage: formData.stage,
      dealValue: Number(formData.dealValue) || 0,
      currency: formData.currency || 'IDR',
      probability: Number(formData.probability) || 50,
      leadSource: formData.leadSource,
      targetCloseDate: formData.targetCloseDate,
      assignedAeId: formData.assignedAeId,
      assignedAeName: 'Rian Hidayat',
      assignedSaId: formData.assignedSaId,
      assignedSaName: formData.assignedSaId ? 'Adrian Pratama' : undefined,
      meddpiccScore,
      meddpiccData: formData.meddpiccData || {},
      lossReason: formData.lossReason,
      presalesRequestsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('opportunities')
          .insert({
            account_id: formData.accountId,
            code: newOpp.code,
            title: newOpp.title,
            stage: newOpp.stage,
            deal_value: newOpp.dealValue,
            probability: newOpp.probability,
            lead_source: newOpp.leadSource,
            target_close_date: newOpp.targetCloseDate,
            assigned_ae_id: newOpp.assignedAeId,
            assigned_sa_id: newOpp.assignedSaId,
            meddpicc_score: newOpp.meddpiccScore,
            meddpicc_data: newOpp.meddpiccData,
            loss_reason: newOpp.lossReason,
          })
          .select()
          .single();

        if (!error && data) {
          newOpp.id = data.id;
        }
      } catch (err: any) {
        console.warn('Supabase opportunity insert failed, continuing with local persistence:', err.message);
      }
    }

    const currentList = getLocalOpportunities();
    const updated = [newOpp, ...currentList];
    saveLocalOpportunities(updated);

    return { data: newOpp, error: null };
  },

  /**
   * Update an Opportunity
   */
  async updateOpportunity(id: string, updates: Partial<OpportunityFormData>): Promise<{ data: Opportunity | null; error: string | null }> {
    const list = getLocalOpportunities();
    const index = list.findIndex((o) => o.id === id);
    if (index === -1) {
      return { data: null, error: 'Opportunity not found' };
    }

    const existing = list[index];
    const meddpiccData = updates.meddpiccData !== undefined ? updates.meddpiccData : existing.meddpiccData;
    const meddpiccScore = updates.meddpiccData !== undefined ? this.calculateMeddpiccScore(meddpiccData) : (updates.meddpiccScore ?? existing.meddpiccScore);

    const updatedRecord: Opportunity = {
      ...existing,
      title: updates.title ?? existing.title,
      stage: updates.stage ?? existing.stage,
      dealValue: updates.dealValue !== undefined ? Number(updates.dealValue) : existing.dealValue,
      currency: updates.currency ?? existing.currency,
      probability: updates.probability !== undefined ? Number(updates.probability) : existing.probability,
      leadSource: updates.leadSource !== undefined ? updates.leadSource : existing.leadSource,
      targetCloseDate: updates.targetCloseDate !== undefined ? updates.targetCloseDate : existing.targetCloseDate,
      assignedAeId: updates.assignedAeId ?? existing.assignedAeId,
      assignedSaId: updates.assignedSaId !== undefined ? updates.assignedSaId : existing.assignedSaId,
      meddpiccScore,
      meddpiccData,
      lossReason: updates.lossReason !== undefined ? updates.lossReason : existing.lossReason,
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('opportunities')
          .update({
            title: updatedRecord.title,
            stage: updatedRecord.stage,
            deal_value: updatedRecord.dealValue,
            probability: updatedRecord.probability,
            lead_source: updatedRecord.leadSource,
            target_close_date: updatedRecord.targetCloseDate,
            assigned_ae_id: updatedRecord.assignedAeId,
            assigned_sa_id: updatedRecord.assignedSaId,
            meddpicc_score: updatedRecord.meddpiccScore,
            meddpicc_data: updatedRecord.meddpiccData,
            loss_reason: updatedRecord.lossReason,
            updated_at: updatedRecord.updatedAt,
          })
          .eq('id', id);
      } catch (err: any) {
        console.warn('Supabase opportunity update failed:', err.message);
      }
    }

    list[index] = updatedRecord;
    saveLocalOpportunities(list);

    return { data: updatedRecord, error: null };
  },

  /**
   * Quick stage transition (e.g. dragging across Kanban or clicking Next Stage)
   */
  async updateStage(id: string, newStage: OpportunityDbStage, lossReason?: string): Promise<{ data: Opportunity | null; error: string | null }> {
    const stageConf = STAGE_CONFIG.find((c) => c.key === newStage);
    const defaultProb = stageConf?.defaultProbability;

    return this.updateOpportunity(id, {
      stage: newStage,
      probability: defaultProb,
      lossReason: newStage === 'Closed_Lost' ? (lossReason || 'Competitor pricing') : undefined,
    });
  },

  /**
   * Delete an Opportunity
   */
  async deleteOpportunity(id: string): Promise<{ success: boolean; error: string | null }> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('opportunities').delete().eq('id', id);
      } catch (err: any) {
        console.warn('Supabase opportunity deletion failed:', err.message);
      }
    }

    const list = getLocalOpportunities();
    const filtered = list.filter((o) => o.id !== id);
    saveLocalOpportunities(filtered);

    return { success: true, error: null };
  },
};
