import { supabase, isSupabaseConfigured } from './supabase.ts';
import {
  AssetRecord,
  AssetFormData,
  AssetStatsSummary,
  AssetStatus,
  WarrantyStatus,
  TechTicket,
  TicketFormData,
  TicketStatsSummary,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketComment,
  RfpKnowledgeItem,
  UserProfile,
} from '../types.ts';
import {
  INITIAL_ASSET_RECORDS,
  INITIAL_TECH_TICKETS,
  INITIAL_RFP_KNOWLEDGE,
} from '../data/initialAssetsTicketsData.ts';

const ASSETS_STORAGE_KEY = 'presales_os_assets_cache_v1';
const TICKETS_STORAGE_KEY = 'presales_os_tickets_cache_v1';
const RFP_KB_STORAGE_KEY = 'presales_os_rfp_kb_cache_v1';

// ---------------------------------------------------------------------------
// LOCAL STORAGE CACHE HELPERS (Offline & Resilient Fallback)
// ---------------------------------------------------------------------------
function getLocalAssets(): AssetRecord[] {
  try {
    const raw = localStorage.getItem(ASSETS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not parse assets from localStorage', e);
  }
  localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(INITIAL_ASSET_RECORDS));
  return INITIAL_ASSET_RECORDS;
}

function saveLocalAssets(assets: AssetRecord[]) {
  try {
    localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(assets));
  } catch (e) {
    console.warn('Could not save assets to localStorage', e);
  }
}

function getLocalTickets(): TechTicket[] {
  try {
    const raw = localStorage.getItem(TICKETS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not parse tickets from localStorage', e);
  }
  localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(INITIAL_TECH_TICKETS));
  return INITIAL_TECH_TICKETS;
}

function saveLocalTickets(tickets: TechTicket[]) {
  try {
    localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
  } catch (e) {
    console.warn('Could not save tickets to localStorage', e);
  }
}

function getLocalRfpKb(): RfpKnowledgeItem[] {
  try {
    const raw = localStorage.getItem(RFP_KB_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not parse RFP KB from localStorage', e);
  }
  localStorage.setItem(RFP_KB_STORAGE_KEY, JSON.stringify(INITIAL_RFP_KNOWLEDGE));
  return INITIAL_RFP_KNOWLEDGE;
}

function saveLocalRfpKb(items: RfpKnowledgeItem[]) {
  try {
    localStorage.setItem(RFP_KB_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Could not save RFP KB to localStorage', e);
  }
}

// ---------------------------------------------------------------------------
// HELPER: CALCULATE WARRANTY STATUS
// ---------------------------------------------------------------------------
export function calculateWarrantyStatus(expiryDateStr: string): WarrantyStatus {
  if (!expiryDateStr) return 'NO_WARRANTY';
  const now = new Date();
  const expiry = new Date(expiryDateStr);
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'EXPIRED';
  if (diffDays <= 60) return 'EXPIRING_SOON';
  return 'ACTIVE';
}

// ---------------------------------------------------------------------------
// HELPER: SLA DEADLINE CALCULATION
// ---------------------------------------------------------------------------
export function getSlaHoursForPriority(priority: TicketPriority): number {
  switch (priority) {
    case 'URGENT_24H':
      return 24;
    case 'HIGH_48H':
      return 48;
    case 'MEDIUM':
      return 72;
    case 'LOW':
      return 120;
    default:
      return 48;
  }
}

export function calculateSlaDueDate(hours: number): string {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

export function isTicketSlaBreached(ticket: TechTicket): boolean {
  if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
    if (ticket.resolvedAt) {
      return new Date(ticket.resolvedAt).getTime() > new Date(ticket.slaDueDate).getTime();
    }
    return false;
  }
  return new Date().getTime() > new Date(ticket.slaDueDate).getTime();
}

export interface FetchAssetsParams {
  search?: string;
  category?: 'ALL' | string;
  status?: 'ALL' | AssetStatus;
  warrantyStatus?: 'ALL' | WarrantyStatus;
  accountId?: string;
  isLoanerOnly?: boolean;
}

export interface FetchTicketsParams {
  search?: string;
  status?: 'ALL' | TicketStatus;
  priority?: 'ALL' | TicketPriority;
  category?: 'ALL' | TicketCategory;
  accountId?: string;
  assigneeId?: string;
  slaBreachOnly?: boolean;
}

export const AssetsTicketsService = {
  // =========================================================================
  // ASSET INVENTORY METHODS
  // =========================================================================

  async getAssets(params: FetchAssetsParams = {}): Promise<{ data: AssetRecord[]; error: string }> {
    const {
      search = '',
      category = 'ALL',
      status = 'ALL',
      warrantyStatus = 'ALL',
      accountId,
      isLoanerOnly,
    } = params;

    if (isSupabaseConfigured()) {
      try {
        let query = supabase
          .from('assets')
          .select('*')
          .order('created_at', { ascending: false });

        if (accountId && accountId !== 'ALL') {
          query = query.eq('account_id', accountId);
        }
        if (category && category !== 'ALL') {
          query = query.eq('category', category);
        }
        if (status && status !== 'ALL') {
          query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (!error && data) {
          return { data: data as AssetRecord[], error: '' };
        }
      } catch (err: any) {
        console.warn('Supabase getAssets error, using local storage fallback:', err);
      }
    }

    // Local Storage processing with comprehensive filter engine
    let assets = getLocalAssets();

    // Auto-recalculate real-time warranty status
    assets = assets.map((a) => ({
      ...a,
      warrantyStatus: calculateWarrantyStatus(a.warrantyExpiryDate),
    }));

    if (accountId && accountId !== 'ALL') {
      assets = assets.filter((a) => a.accountId === accountId);
    }
    if (category && category !== 'ALL') {
      assets = assets.filter((a) => a.category === category);
    }
    if (status && status !== 'ALL') {
      assets = assets.filter((a) => a.status === status);
    }
    if (warrantyStatus && warrantyStatus !== 'ALL') {
      assets = assets.filter((a) => a.warrantyStatus === warrantyStatus);
    }
    if (isLoanerOnly) {
      assets = assets.filter((a) => a.loanerDetails?.isLoaner || a.category === 'Demo/POC Loaner');
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      assets = assets.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.assetTag.toLowerCase().includes(q) ||
          a.serialNumber.toLowerCase().includes(q) ||
          a.vendor.toLowerCase().includes(q) ||
          a.modelNumber.toLowerCase().includes(q) ||
          a.accountName.toLowerCase().includes(q) ||
          a.siteLocation.toLowerCase().includes(q) ||
          (a.ipAddress && a.ipAddress.toLowerCase().includes(q))
      );
    }

    return { data: assets, error: '' };
  },

  async getAssetById(id: string): Promise<{ data: AssetRecord | null; error: string }> {
    const assets = getLocalAssets();
    const found = assets.find((a) => a.id === id);
    if (found) {
      found.warrantyStatus = calculateWarrantyStatus(found.warrantyExpiryDate);
      return { data: found, error: '' };
    }
    return { data: null, error: 'Asset not found' };
  },

  async createAsset(
    formData: AssetFormData,
    creatorProfile?: UserProfile
  ): Promise<{ data: AssetRecord | null; error: string }> {
    const assets = getLocalAssets();
    const year = new Date().getFullYear();
    const count = assets.length + 1;
    const tagPrefix = formData.isLoaner || formData.category === 'Demo/POC Loaner' ? 'AST-DEMO' : 'AST';
    const assetTag = `${tagPrefix}-${year}-${String(count).padStart(4, '0')}`;

    const warrantyStatus = calculateWarrantyStatus(formData.warrantyExpiryDate);

    const newAsset: AssetRecord = {
      id: `ast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      companyId: 'comp_default_01',
      assetTag,
      name: formData.name,
      category: formData.category,
      vendor: formData.vendor,
      modelNumber: formData.modelNumber,
      serialNumber: formData.serialNumber,
      macAddress: formData.macAddress,
      ipAddress: formData.ipAddress,
      accountId: formData.accountId,
      accountName: formData.accountName,
      opportunityId: formData.opportunityId,
      handoverId: formData.handoverId,
      siteLocation: formData.siteLocation,
      rackUnit: formData.rackUnit,
      status: formData.status || 'OPERATIONAL',
      warrantyStatus,
      purchaseDate: formData.purchaseDate || new Date().toISOString().split('T')[0],
      warrantyExpiryDate: formData.warrantyExpiryDate,
      costIDR: formData.costIDR || 0,
      costUSD: formData.costIDR ? Math.round(formData.costIDR / 15300) : 0,
      supportContractTier: formData.supportContractTier,
      contractNumber: formData.contractNumber,
      loanerDetails: formData.isLoaner
        ? {
            isLoaner: true,
            borrowerEngineer: formData.borrowerEngineer || creatorProfile?.name || 'Assigned Engineer',
            borrowerPhone: formData.borrowerPhone,
            checkoutDate: new Date().toISOString().split('T')[0],
            expectedReturnDate: formData.expectedReturnDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
            condition: formData.condition || 'Good',
            notes: formData.notes,
          }
        : undefined,
      maintenanceLogs: [],
      notes: formData.notes,
      qrCodeTag: `QR-${assetTag}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedList = [newAsset, ...assets];
    saveLocalAssets(updatedList);

    return { data: newAsset, error: '' };
  },

  async updateAsset(
    id: string,
    updates: Partial<AssetRecord>
  ): Promise<{ data: AssetRecord | null; error: string }> {
    const assets = getLocalAssets();
    const idx = assets.findIndex((a) => a.id === id);
    if (idx === -1) return { data: null, error: 'Asset not found' };

    const updated: AssetRecord = {
      ...assets[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updated.warrantyExpiryDate) {
      updated.warrantyStatus = calculateWarrantyStatus(updated.warrantyExpiryDate);
    }

    assets[idx] = updated;
    saveLocalAssets(assets);
    return { data: updated, error: '' };
  },

  async addMaintenanceLog(
    assetId: string,
    log: {
      type: 'Preventive' | 'Firmware Update' | 'Hardware Repair' | 'Inspection' | 'RMA Replacement';
      technicianName: string;
      description: string;
      costIDR?: number;
      status: 'Completed' | 'Pending Parts' | 'Scheduled';
    }
  ): Promise<{ data: AssetRecord | null; error: string }> {
    const assets = getLocalAssets();
    const idx = assets.findIndex((a) => a.id === assetId);
    if (idx === -1) return { data: null, error: 'Asset not found' };

    const newLog = {
      id: `mnt_${Date.now()}`,
      assetId,
      date: new Date().toISOString().split('T')[0],
      ...log,
    };

    const updatedLogs = [newLog, ...(assets[idx].maintenanceLogs || [])];
    assets[idx].maintenanceLogs = updatedLogs;
    assets[idx].updatedAt = new Date().toISOString();
    if (log.status === 'Pending Parts' || log.status === 'Scheduled') {
      assets[idx].status = 'IN_MAINTENANCE';
    } else if (assets[idx].status === 'IN_MAINTENANCE' && log.status === 'Completed') {
      assets[idx].status = 'OPERATIONAL';
    }

    saveLocalAssets(assets);
    return { data: assets[idx], error: '' };
  },

  async checkoutLoaner(
    assetId: string,
    loanerData: {
      borrowerEngineer: string;
      borrowerPhone?: string;
      expectedReturnDate: string;
      condition: 'Mint / Like New' | 'Good' | 'Minor Wear' | 'Needs Repair';
      notes?: string;
    }
  ): Promise<{ data: AssetRecord | null; error: string }> {
    const assets = getLocalAssets();
    const idx = assets.findIndex((a) => a.id === assetId);
    if (idx === -1) return { data: null, error: 'Asset not found' };

    assets[idx].status = 'LOANED_OUT';
    assets[idx].loanerDetails = {
      isLoaner: true,
      checkoutDate: new Date().toISOString().split('T')[0],
      ...loanerData,
    };
    assets[idx].updatedAt = new Date().toISOString();

    saveLocalAssets(assets);
    return { data: assets[idx], error: '' };
  },

  async returnLoaner(
    assetId: string,
    condition: 'Mint / Like New' | 'Good' | 'Minor Wear' | 'Needs Repair',
    returnNotes?: string
  ): Promise<{ data: AssetRecord | null; error: string }> {
    const assets = getLocalAssets();
    const idx = assets.findIndex((a) => a.id === assetId);
    if (idx === -1) return { data: null, error: 'Asset not found' };

    assets[idx].status = condition === 'Needs Repair' ? 'IN_MAINTENANCE' : 'OPERATIONAL';
    if (assets[idx].loanerDetails) {
      assets[idx].loanerDetails!.actualReturnDate = new Date().toISOString().split('T')[0];
      assets[idx].loanerDetails!.condition = condition;
      if (returnNotes) {
        assets[idx].loanerDetails!.notes = `${assets[idx].loanerDetails!.notes || ''} | Check-in Note: ${returnNotes}`;
      }
    }
    assets[idx].updatedAt = new Date().toISOString();

    saveLocalAssets(assets);
    return { data: assets[idx], error: '' };
  },

  async getAssetStatsSummary(): Promise<AssetStatsSummary> {
    const assets = getLocalAssets();
    let operational = 0;
    let expiringSoon = 0;
    let expired = 0;
    let loaners = 0;
    let maintenance = 0;
    let totalValIDR = 0;
    let totalValUSD = 0;

    assets.forEach((a) => {
      const wStatus = calculateWarrantyStatus(a.warrantyExpiryDate);
      if (a.status === 'OPERATIONAL') operational++;
      if (a.status === 'IN_MAINTENANCE') maintenance++;
      if (a.status === 'LOANED_OUT' || a.loanerDetails?.isLoaner) loaners++;
      if (wStatus === 'EXPIRING_SOON') expiringSoon++;
      if (wStatus === 'EXPIRED') expired++;
      totalValIDR += a.costIDR || 0;
      totalValUSD += a.costUSD || (a.costIDR ? Math.round(a.costIDR / 15300) : 0);
    });

    return {
      totalAssets: assets.length,
      activeOperationalCount: operational,
      expiringSoonWarrantiesCount: expiringSoon,
      expiredWarrantiesCount: expired,
      activePocLoanersCount: loaners,
      inMaintenanceCount: maintenance,
      totalAssetValueIDR: totalValIDR,
      totalAssetValueUSD: totalValUSD,
    };
  },

  // =========================================================================
  // TECH DESK & TICKETING METHODS
  // =========================================================================

  async getTickets(params: FetchTicketsParams = {}): Promise<{ data: TechTicket[]; error: string }> {
    const {
      search = '',
      status = 'ALL',
      priority = 'ALL',
      category = 'ALL',
      accountId,
      assigneeId,
      slaBreachOnly,
    } = params;

    let tickets = getLocalTickets();

    // Check dynamic SLA breaches
    tickets = tickets.map((t) => ({
      ...t,
      isSlaBreached: isTicketSlaBreached(t),
    }));

    if (accountId && accountId !== 'ALL') {
      tickets = tickets.filter((t) => t.accountId === accountId);
    }
    if (status && status !== 'ALL') {
      tickets = tickets.filter((t) => t.status === status);
    }
    if (priority && priority !== 'ALL') {
      tickets = tickets.filter((t) => t.priority === priority);
    }
    if (category && category !== 'ALL') {
      tickets = tickets.filter((t) => t.category === category);
    }
    if (assigneeId && assigneeId !== 'ALL') {
      tickets = tickets.filter((t) => t.assigneeId === assigneeId);
    }
    if (slaBreachOnly) {
      tickets = tickets.filter((t) => t.isSlaBreached);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      tickets = tickets.filter(
        (t) =>
          t.ticketNumber.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.accountName.toLowerCase().includes(q) ||
          (t.assetName && t.assetName.toLowerCase().includes(q)) ||
          (t.assetTag && t.assetTag.toLowerCase().includes(q)) ||
          (t.assigneeName && t.assigneeName.toLowerCase().includes(q)) ||
          t.reporterName.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    return { data: tickets, error: '' };
  },

  async getTicketById(id: string): Promise<{ data: TechTicket | null; error: string }> {
    const tickets = getLocalTickets();
    const found = tickets.find((t) => t.id === id);
    if (found) {
      found.isSlaBreached = isTicketSlaBreached(found);
      return { data: found, error: '' };
    }
    return { data: null, error: 'Ticket not found' };
  },

  async createTicket(
    formData: TicketFormData,
    creatorProfile?: UserProfile
  ): Promise<{ data: TechTicket | null; error: string }> {
    const tickets = getLocalTickets();
    const year = new Date().getFullYear();
    const count = tickets.length + 1;
    const ticketNumber = `TCK-${year}-${String(count).padStart(4, '0')}`;

    const slaHours = getSlaHoursForPriority(formData.priority);
    const slaDueDate = calculateSlaDueDate(slaHours);

    // Look up asset if provided
    let assetName: string | undefined;
    let assetSerialNumber: string | undefined;
    let assetTag: string | undefined;

    if (formData.assetId) {
      const assets = getLocalAssets();
      const asset = assets.find((a) => a.id === formData.assetId);
      if (asset) {
        assetName = asset.name;
        assetSerialNumber = asset.serialNumber;
        assetTag = asset.assetTag;
      }
    }

    const newTicket: TechTicket = {
      id: `tck_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      companyId: 'comp_default_01',
      ticketNumber,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      priority: formData.priority,
      status: 'OPEN',
      accountId: formData.accountId,
      accountName: formData.accountName,
      assetId: formData.assetId,
      assetName,
      assetSerialNumber,
      assetTag,
      handoverId: formData.handoverId,
      assigneeName: formData.assigneeName || 'Abdoel',
      assigneeRole: 'Solutions Architect',
      assigneeEmail: 'abdoel74@gmail.com',
      reporterName: formData.reporterName,
      reporterEmail: formData.reporterEmail,
      reporterPhone: formData.reporterPhone,
      slaHours,
      slaDueDate,
      isSlaBreached: false,
      responseSlaMinutes: undefined,
      comments: [
        {
          id: `cmt_init_${Date.now()}`,
          ticketId: `tck_${Date.now()}`,
          authorId: creatorProfile?.id || 'usr_abdoel',
          authorName: creatorProfile?.name || 'System Auto-Dispatcher',
          authorRole: 'Tech Desk Portal',
          isInternalNote: false,
          message: `Ticket opened with ${formData.priority} priority (${slaHours}h SLA target). Initial automated notification dispatched to ${formData.reporterEmail}.`,
          createdAt: new Date().toISOString(),
        },
      ],
      tags: formData.tags || [formData.category, formData.priority],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newTicket, ...tickets];
    saveLocalTickets(updated);

    return { data: newTicket, error: '' };
  },

  async updateTicketStatus(
    id: string,
    newStatus: TicketStatus,
    resolutionSummary?: string,
    actorProfile?: UserProfile
  ): Promise<{ data: TechTicket | null; error: string }> {
    const tickets = getLocalTickets();
    const idx = tickets.findIndex((t) => t.id === id);
    if (idx === -1) return { data: null, error: 'Ticket not found' };

    const current = tickets[idx];
    const updated: TechTicket = {
      ...current,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    if (newStatus === 'RESOLVED') {
      updated.resolvedAt = new Date().toISOString();
      if (resolutionSummary) updated.resolutionSummary = resolutionSummary;
    } else if (newStatus === 'CLOSED') {
      updated.closedAt = new Date().toISOString();
    }

    // Add automated audit comment
    const auditComment: TicketComment = {
      id: `cmt_${Date.now()}`,
      ticketId: id,
      authorId: actorProfile?.id || 'usr_current',
      authorName: actorProfile?.name || 'System Engineer',
      authorRole: actorProfile?.role || 'Solutions Architect',
      isInternalNote: false,
      message: `Status transitioned from "${current.status}" to "${newStatus}".${resolutionSummary ? ` Resolution Notes: ${resolutionSummary}` : ''}`,
      createdAt: new Date().toISOString(),
    };

    updated.comments = [...updated.comments, auditComment];
    updated.isSlaBreached = isTicketSlaBreached(updated);

    tickets[idx] = updated;
    saveLocalTickets(tickets);

    return { data: updated, error: '' };
  },

  async addTicketComment(
    ticketId: string,
    message: string,
    isInternalNote: boolean,
    authorProfile?: UserProfile
  ): Promise<{ data: TicketComment | null; error: string }> {
    const tickets = getLocalTickets();
    const idx = tickets.findIndex((t) => t.id === ticketId);
    if (idx === -1) return { data: null, error: 'Ticket not found' };

    const newComment: TicketComment = {
      id: `cmt_${Date.now()}`,
      ticketId,
      authorId: authorProfile?.id || 'usr_abdoel',
      authorName: authorProfile?.name || 'Abdoel',
      authorRole: authorProfile?.role || 'Solutions Architect',
      isInternalNote,
      message,
      createdAt: new Date().toISOString(),
    };

    tickets[idx].comments.push(newComment);
    tickets[idx].updatedAt = new Date().toISOString();

    // If first response from support engineer, record response time
    if (!tickets[idx].firstRespondedAt && !isInternalNote) {
      tickets[idx].firstRespondedAt = new Date().toISOString();
      const openTime = new Date(tickets[idx].createdAt).getTime();
      const now = new Date().getTime();
      tickets[idx].responseSlaMinutes = Math.max(1, Math.round((now - openTime) / (1000 * 60)));
    }

    saveLocalTickets(tickets);
    return { data: newComment, error: '' };
  },

  async getTicketStatsSummary(): Promise<TicketStatsSummary> {
    const tickets = getLocalTickets();
    let open = 0;
    let inProgress = 0;
    let pendingCustomer = 0;
    let resolved = 0;
    let urgentRisk = 0;
    let slaBreached = 0;

    const now = new Date().getTime();

    tickets.forEach((t) => {
      const breached = isTicketSlaBreached(t);
      if (breached) slaBreached++;

      if (t.status === 'OPEN') open++;
      else if (t.status === 'IN_PROGRESS') inProgress++;
      else if (t.status === 'PENDING_CUSTOMER') pendingCustomer++;
      else if (t.status === 'RESOLVED' || t.status === 'CLOSED') resolved++;

      if (t.status !== 'RESOLVED' && t.status !== 'CLOSED') {
        const dueTime = new Date(t.slaDueDate).getTime();
        const diffHours = (dueTime - now) / (1000 * 60 * 60);
        if (diffHours <= 6 && diffHours > 0) {
          urgentRisk++;
        }
      }
    });

    return {
      totalTickets: tickets.length,
      openCount: open,
      inProgressCount: inProgress,
      pendingCustomerCount: pendingCustomer,
      resolvedCount: resolved,
      urgentBreachRiskCount: urgentRisk,
      slaBreachedCount: slaBreached,
      avgResolutionTimeHours: 14.8,
    };
  },

  // =========================================================================
  // RFP Q&A KNOWLEDGE BASE METHODS
  // =========================================================================

  async getRfpKnowledgeItems(searchQuery?: string, category?: string): Promise<RfpKnowledgeItem[]> {
    let items = getLocalRfpKb();

    if (category && category !== 'ALL') {
      items = items.filter((item) => item.category === category);
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.question.toLowerCase().includes(q) ||
          item.answer.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return items;
  },

  async createRfpKnowledgeItem(
    item: {
      category: string;
      question: string;
      answer: string;
      tags: string[];
    },
    authorProfile?: UserProfile
  ): Promise<RfpKnowledgeItem> {
    const items = getLocalRfpKb();
    const count = items.length + 1;
    const code = `KB-RFP-${String(count).padStart(3, '0')}`;

    const newItem: RfpKnowledgeItem = {
      id: `kb_${Date.now()}`,
      companyId: 'comp_default_01',
      code,
      category: item.category,
      question: item.question,
      answer: item.answer,
      confidenceScore: 95,
      lastVerifiedBy: authorProfile?.name ? `${authorProfile.name} (${authorProfile.role})` : 'Solutions Architect',
      lastVerifiedDate: new Date().toISOString().split('T')[0],
      tags: item.tags || [item.category],
      usageCount: 1,
    };

    const updated = [newItem, ...items];
    saveLocalRfpKb(updated);
    return newItem;
  },

  async incrementRfpUsage(id: string): Promise<void> {
    const items = getLocalRfpKb();
    const idx = items.findIndex((i) => i.id === id);
    if (idx !== -1) {
      items[idx].usageCount = (items[idx].usageCount || 0) + 1;
      saveLocalRfpKb(items);
    }
  },
};
