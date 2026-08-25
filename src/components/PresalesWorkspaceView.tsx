import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Building2,
  Cpu,
  User,
  Layers,
  Boxes,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Sparkles,
  LayoutGrid,
  List,
  ShieldCheck,
  Send,
  MoreVertical,
  Activity,
  Calculator,
  ReceiptText,
  FileCheck2,
  RefreshCw,
} from 'lucide-react';
import {
  PresalesRequest,
  PresalesRequestDbStatus,
  PresalesPriorityDb,
  PresalesRequestType,
  SolutionsArchitectProfile,
  UserRole,
} from '../types.ts';
import { PresalesService, WorkspaceStats } from '../lib/presales-service.ts';
import {
  PRESALES_STATUS_CONFIG,
  PRESALES_PRIORITY_CONFIG,
  PRESALES_REQUEST_TYPES,
} from '../data/initialPresalesData.ts';
import { PresalesRequestModal } from './PresalesRequestModal.tsx';
import { PresalesRequestDetailModal } from './PresalesRequestDetailModal.tsx';
import { useAuth } from '../lib/AuthContext.tsx';

interface PresalesWorkspaceViewProps {
  currentRole: UserRole;
  currency?: 'IDR' | 'USD';
  onNavigateToModule?: (moduleId: string) => void;
  onSendWhatsAppPing?: (phone: string, text: string) => void;
}

export const PresalesWorkspaceView: React.FC<PresalesWorkspaceViewProps> = ({
  currentRole,
  currency = 'IDR',
  onNavigateToModule,
  onSendWhatsAppPing,
}) => {
  const { profile } = useAuth();

  const [requests, setRequests] = useState<PresalesRequest[]>([]);
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [loading, setLoading] = useState(false);

  // View Mode
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PresalesRequestDbStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<PresalesPriorityDb | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<PresalesRequestType | 'ALL'>('ALL');
  const [architectFilter, setArchitectFilter] = useState<string>('ALL');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [pocOnly, setPocOnly] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PresalesRequest | null>(null);
  const [editingRequest, setEditingRequest] = useState<PresalesRequest | null>(null);

  useEffect(() => {
    loadRequests();
  }, [searchQuery, statusFilter, priorityFilter, typeFilter, architectFilter, urgentOnly, pocOnly]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await PresalesService.getPresalesRequests({
        search: searchQuery,
        status: statusFilter,
        priority: priorityFilter,
        requestType: typeFilter,
        assignedSaId: architectFilter !== 'ALL' ? architectFilter : undefined,
        isUrgentOnly: urgentOnly,
        pocRequiredOnly: pocOnly,
      });
      setRequests(res.data);
      setStats(PresalesService.getWorkspaceStats());
    } catch (e) {
      console.error('Error loading presales workspace:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = (req: PresalesRequest) => {
    setSelectedRequest(req);
    setIsDetailModalOpen(true);
  };

  const handleOpenEdit = (req: PresalesRequest) => {
    setEditingRequest(req);
    setIsCreateModalOpen(true);
  };

  const handleRequestCreatedOrUpdated = (req: PresalesRequest) => {
    loadRequests();
    if (selectedRequest && selectedRequest.id === req.id) {
      setSelectedRequest(req);
    }

    if (onSendWhatsAppPing && req.assignedSaName) {
      onSendWhatsAppPing(
        '+62 812-3456-7890',
        `📋 [PRESALES UPDATE] Request ${req.requestCode} (${req.title}) stage updated to ${req.status}. SLA due in ${req.slaHoursRemaining}h.`
      );
    }
  };

  const handleQuickAdvance = async (e: React.MouseEvent, req: PresalesRequest, direction: 'next' | 'prev') => {
    e.stopPropagation();
    const currentConf = PRESALES_STATUS_CONFIG.find((s) => s.key === req.status);
    if (!currentConf) return;

    const validStages = PRESALES_STATUS_CONFIG.filter((s) => s.key !== 'Cancelled');
    const currentIndex = validStages.findIndex((s) => s.key === req.status);
    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (targetIndex >= 0 && targetIndex < validStages.length) {
      const nextStage = validStages[targetIndex].key;
      await PresalesService.advancePresalesStatus(
        req.id,
        nextStage,
        `Quick transition to ${validStages[targetIndex].label}`,
        profile
      );
      loadRequests();
    }
  };

  // Helper for status styling
  const getStatusConf = (st: PresalesRequestDbStatus) => {
    return PRESALES_STATUS_CONFIG.find((s) => s.key === st) || PRESALES_STATUS_CONFIG[0];
  };

  // Helper for priority styling
  const getPriorityConf = (pr: PresalesPriorityDb) => {
    return PRESALES_PRIORITY_CONFIG[pr] || PRESALES_PRIORITY_CONFIG.High;
  };

  const kanbanStages = PRESALES_STATUS_CONFIG.filter((s) => s.key !== 'Cancelled');

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
              <span>Presales Requests & Engineering Workspace</span>
            </h1>
            <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              Steps 14 & 15 &bull; Supabase RLS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dispatch, size, and govern RFP technical deliverables, SLA turnaround countdowns, and SA workload balancing
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Data Grid</span>
            </button>
          </div>

          <button
            onClick={() => {
              setEditingRequest(null);
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold flex items-center gap-2 shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Presales Request</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Dashboard Strip */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Active Presales Requests
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {stats.totalActiveRequests}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                {stats.unassignedCount} Unassigned
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {stats.sizingCount} in Sizing &bull; {stats.boqCount} in BOQ
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Urgent SLA Countdown Risk
            </span>
            <div className="flex items-baseline justify-between">
              <span className={`text-2xl font-black font-mono ${stats.urgentRiskCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {stats.urgentRiskCount} Deals
              </span>
              {stats.urgentRiskCount > 0 ? (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                  &lt; 24h Left
                </span>
              ) : (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  On Track
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Avg Turnaround: <strong>{stats.avgSlaTurnaroundHours}h</strong> ({stats.slaOnTimeRatePct}% On-Time)
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Scoping Pipeline Value
            </span>
            <div className="text-2xl font-black text-indigo-600 font-mono">
              Rp {(stats.totalScopingPipelineValue / 1_000_000_000).toFixed(1)} M
            </div>
            <p className="text-[11px] text-slate-500">
              Active engineering workload value
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Approved & Ready SOW
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-600 font-mono">
                {stats.approvedCount}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Tender Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Signed off by SA Lead & Sales Director
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Architecture Gaps Logged
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-amber-600 font-mono">
                {stats.totalGapsCount}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                Risk Register
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Trade-offs & OEM special bid items
            </p>
          </div>
        </div>
      )}

      {/* Solutions Architect Workload & Capacity Carousel */}
      {stats && (
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              <span>Solutions Architecture Workload Distribution & SLA Capacity</span>
            </h3>
            <span className="text-[11px] text-slate-500">
              Click architect to filter active queue
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.architects.map((sa) => {
              const isSelected = architectFilter === sa.id;
              return (
                <button
                  key={sa.id}
                  type="button"
                  onClick={() => setArchitectFilter(isSelected ? 'ALL' : sa.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500/20'
                      : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={sa.avatarUrl}
                        alt={sa.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{sa.name}</h4>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {sa.specializations[0]}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded">
                      {sa.activeRequestsCount}/{sa.maxCapacity}
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-1">
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          sa.utilizationPct > 80 ? 'bg-amber-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${sa.utilizationPct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Load: <strong>{sa.utilizationPct}%</strong></span>
                      <span>SLA: <strong>{sa.slaOnTimeRatePct}%</strong></span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Requests
          </button>
          {kanbanStages.map((st) => {
            const isSelected = statusFilter === st.key;
            return (
              <button
                key={st.key}
                onClick={() => setStatusFilter(st.key)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : `${st.bgLight} ${st.color} ${st.badgeBorder} hover:opacity-80`
                }`}
              >
                {st.shortLabel}
              </button>
            );
          })}
        </div>

        {/* Search, Dropdowns, and Quick Toggles */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search request code, title, customer, or tech tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Priorities</option>
              <option value="Urgent">Urgent (24h SLA)</option>
              <option value="High">High (48h SLA)</option>
              <option value="Medium">Medium (72h SLA)</option>
              <option value="Low">Low (120h SLA)</option>
            </select>

            {/* Request Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Scope Types</option>
              {Object.entries(PRESALES_REQUEST_TYPES).map(([key, conf]) => (
                <option key={key} value={key}>
                  {conf.label}
                </option>
              ))}
            </select>

            {/* Quick Urgent Filter */}
            <button
              onClick={() => setUrgentOnly(!urgentOnly)}
              className={`px-3 py-2 rounded-xl font-bold border transition-colors flex items-center gap-1.5 ${
                urgentOnly
                  ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Urgent SLA (&lt;24h)</span>
            </button>

            {/* Quick POC Filter */}
            <button
              onClick={() => setPocOnly(!pocOnly)}
              className={`px-3 py-2 rounded-xl font-bold border transition-colors flex items-center gap-1.5 ${
                pocOnly
                  ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>POC Loaners</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      {viewMode === 'kanban' ? (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start overflow-x-auto pb-4">
          {kanbanStages.map((stage) => {
            const stageRequests = requests.filter((r) => r.status === stage.key);
            const totalStageValue = stageRequests.reduce((sum, r) => sum + (r.dealValue || 0), 0);

            return (
              <div
                key={stage.key}
                className="bg-slate-50/80 rounded-2xl border border-slate-200/90 flex flex-col min-w-[280px] shrink-0 overflow-hidden"
              >
                {/* Column Header */}
                <div className={`p-3 border-b border-slate-200 bg-white ${stage.bgLight} space-y-1`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${stage.color} uppercase tracking-wider`}>
                      {stage.shortLabel}
                    </span>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200 shadow-2xs">
                      {stageRequests.length}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 font-semibold">
                    Rp {(totalStageValue / 1_000_000_000).toFixed(1)} M
                  </div>
                </div>

                {/* Column Cards List */}
                <div className="p-2.5 space-y-2.5 min-h-[400px]">
                  {stageRequests.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                      No requests in this stage
                    </div>
                  ) : (
                    stageRequests.map((req) => {
                      const prio = getPriorityConf(req.priority);
                      const isSlaCritical = req.slaHoursRemaining <= 12;

                      return (
                        <div
                          key={req.id}
                          onClick={() => handleOpenDetail(req)}
                          className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer space-y-2.5 group"
                        >
                          {/* Card Top: Code & Priority */}
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                              {req.requestCode}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${prio.bgLight} ${prio.color}`}>
                              {req.priority}
                            </span>
                          </div>

                          {/* Card Title & Customer */}
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
                              {req.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{req.accountName}</span>
                            </p>
                          </div>

                          {/* Domain Tags */}
                          <div className="flex flex-wrap gap-1">
                            {req.techDomains.slice(0, 2).map((dom) => (
                              <span
                                key={dom}
                                className="text-[9px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                              >
                                {dom}
                              </span>
                            ))}
                            {req.techDomains.length > 2 && (
                              <span className="text-[9px] text-slate-400 font-mono">
                                +{req.techDomains.length - 2}
                              </span>
                            )}
                          </div>

                          {/* SLA Countdown & Value Bar */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                              <Clock className={`w-3 h-3 ${isSlaCritical ? 'text-rose-500 animate-pulse' : 'text-amber-500'}`} />
                              <span className={`text-[11px] font-mono font-bold ${isSlaCritical ? 'text-rose-600' : 'text-slate-700'}`}>
                                {req.slaHoursRemaining}h left
                              </span>
                            </div>

                            <span className="font-mono text-[11px] font-bold text-slate-900">
                              Rp {((req.dealValue || 0) / 1_000_000_000).toFixed(1)}B
                            </span>
                          </div>

                          {/* Card Footer: SA Avatar & Advance Arrows */}
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1.5">
                              {req.assignedSaAvatar ? (
                                <img
                                  src={req.assignedSaAvatar}
                                  alt={req.assignedSaName}
                                  className="w-5 h-5 rounded-full object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600">
                                  ?
                                </div>
                              )}
                              <span className="text-[10px] text-slate-600 font-medium truncate max-w-[85px]">
                                {req.assignedSaName ? req.assignedSaName.split(' ')[0] : 'Unassigned'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => handleQuickAdvance(e, req, 'prev')}
                                title="Move Previous Stage"
                                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => handleQuickAdvance(e, req, 'next')}
                                title="Advance Next Stage"
                                className="p-1 rounded text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 font-bold"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* DATA GRID / TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="px-4 py-3.5">Request Code</th>
                  <th className="px-4 py-3.5">Customer & Title</th>
                  <th className="px-4 py-3.5">Stage / Status</th>
                  <th className="px-4 py-3.5">Priority</th>
                  <th className="px-4 py-3.5">SLA Countdown</th>
                  <th className="px-4 py-3.5">RFP Requirements</th>
                  <th className="px-4 py-3.5">Deal / BOQ Value</th>
                  <th className="px-4 py-3.5">Lead Architect</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-xs text-slate-400">
                      No presales requests match your search criteria.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => {
                    const stConf = getStatusConf(req.status);
                    const prioConf = getPriorityConf(req.priority);
                    const isSlaCritical = req.slaHoursRemaining <= 12;

                    return (
                      <tr
                        key={req.id}
                        onClick={() => handleOpenDetail(req)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
                            {req.requestCode}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 max-w-xs">
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-slate-900 leading-snug">{req.title}</h4>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <span>{req.accountName}</span>
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg ${stConf.bgLight} ${stConf.color}`}>
                            {stConf.shortLabel}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${prioConf.bgLight} ${prioConf.color}`}>
                            {req.priority}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Clock className={`w-3.5 h-3.5 ${isSlaCritical ? 'text-rose-500 animate-pulse' : 'text-amber-500'}`} />
                            <span className={`font-mono text-xs font-bold ${isSlaCritical ? 'text-rose-600' : 'text-slate-800'}`}>
                              {req.slaHoursRemaining}h remaining
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block">Due: {req.deadlineDate}</span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-600 font-semibold">
                              <span>{req.compliantCount || 0}/{req.requirementsCount || 0} Met</span>
                              {(req.gapsCount || 0) > 0 && (
                                <span className="text-amber-600 font-bold">
                                  {req.gapsCount} Gaps
                                </span>
                              )}
                            </div>
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{
                                  width: `${
                                    req.requirementsCount
                                      ? Math.round(((req.compliantCount || 0) / req.requirementsCount) * 100)
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                          Rp {((req.dealValue || req.estimatedBoqValue || 0) / 1_000_000_000).toFixed(2)} M
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            {req.assignedSaAvatar ? (
                              <img
                                src={req.assignedSaAvatar}
                                alt={req.assignedSaName}
                                className="w-6 h-6 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                ?
                              </div>
                            )}
                            <div>
                              <span className="font-semibold text-slate-900 block truncate max-w-[100px]">
                                {req.assignedSaName || 'Unassigned'}
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {req.assignedAeName?.split(' ')[0]} (AE)
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(req);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold transition-colors"
                          >
                            Open Dossier
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Creation & Edit Modal */}
      {isCreateModalOpen && (
        <PresalesRequestModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingRequest(null);
          }}
          onSuccess={handleRequestCreatedOrUpdated}
          existingRequest={editingRequest}
        />
      )}

      {/* Detail Dossier Modal */}
      {isDetailModalOpen && (
        <PresalesRequestDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
          onUpdateRequest={handleRequestCreatedOrUpdated}
          onOpenEditModal={handleOpenEdit}
          onNavigateToModule={onNavigateToModule}
        />
      )}
    </div>
  );
};
