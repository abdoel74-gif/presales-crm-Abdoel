import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  DollarSign,
  Award,
  Users,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  MoreVertical,
  Calendar,
  Building2,
  FileSpreadsheet,
  Trash2,
  Edit,
  ExternalLink,
  RefreshCw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  BarChart3,
  Percent,
} from 'lucide-react';
import {
  Opportunity,
  OpportunityFormData,
  OpportunityDbStage,
  UserRole,
  Account,
} from '../types.ts';
import { STAGE_CONFIG, SA_OPTIONS } from '../data/initialOpportunitiesData.ts';
import { OpportunitiesService, FetchOpportunitiesParams, PipelineMetrics } from '../lib/opportunities-service.ts';
import { SowHandoverService } from '../lib/sow-handover-service.ts';
import { OpportunityModal } from './OpportunityModal.tsx';
import { OpportunityDetailModal } from './OpportunityDetailModal.tsx';

interface PipelineViewProps {
  currentRole: UserRole;
  currency?: 'IDR' | 'USD';
}

export const PipelineView: React.FC<PipelineViewProps> = ({
  currentRole,
  currency = 'IDR',
}) => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<OpportunityDbStage | 'ALL'>('ALL');
  const [selectedAe, setSelectedAe] = useState<string>('ALL');
  const [selectedSa, setSelectedSa] = useState<string>('ALL');
  const [minDealValue, setMinDealValue] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'dealValue' | 'probability' | 'meddpiccScore' | 'createdAt'>('dealValue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [detailOpportunity, setDetailOpportunity] = useState<Opportunity | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadOpportunities();
  }, [selectedStage, selectedAe, selectedSa, sortBy, sortOrder]);

  const loadOpportunities = async () => {
    setLoading(true);
    const params: FetchOpportunitiesParams = {
      search: searchQuery || undefined,
      stage: selectedStage,
      assignedAeId: selectedAe !== 'ALL' ? selectedAe : undefined,
      assignedSaId: selectedSa !== 'ALL' ? selectedSa : undefined,
      minDealValue: minDealValue > 0 ? minDealValue : undefined,
      sortBy,
      sortOrder,
    };

    const res = await OpportunitiesService.getOpportunities(params);
    setOpportunities(res.data);
    setLoading(false);
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleCreateOrUpdate = async (
    formData: OpportunityFormData,
    accountMeta?: { name: string; industry: string; tier: any }
  ) => {
    if (editingOpportunity) {
      const res = await OpportunitiesService.updateOpportunity(editingOpportunity.id, formData);
      if (res.data) {
        showToast(`Opportunity "${res.data.title}" updated successfully`);
        setEditingOpportunity(null);
        loadOpportunities();
      }
    } else {
      const res = await OpportunitiesService.createOpportunity(formData, accountMeta);
      if (res.data) {
        showToast(`Deal "${res.data.title}" created successfully in pipeline`);
        setIsNewModalOpen(false);
        loadOpportunities();
      }
    }
  };

  const handleQuickStageMove = async (
    opp: Opportunity,
    direction: 'next' | 'prev'
  ) => {
    const currentIndex = STAGE_CONFIG.findIndex((c) => c.key === opp.stage);
    if (currentIndex === -1) return;

    let targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex < 0 || targetIndex >= STAGE_CONFIG.length) return;

    const targetStage = STAGE_CONFIG[targetIndex].key as OpportunityDbStage;
    const res = await OpportunitiesService.updateStage(opp.id, targetStage);
    if (res.data) {
      if (targetStage === 'Closed_Won') {
        // Automatically trigger Step 23 Project Handover generation
        await SowHandoverService.createHandoverFromOpportunity(opp);
        showToast(`Stage updated to Closed Won! Project Handover package generated for PM Delivery.`);
      } else {
        showToast(`Stage updated to ${STAGE_CONFIG[targetIndex].shortLabel}`);
      }
      loadOpportunities();
    }
  };

  const handleDelete = async (id: string) => {
    const res = await OpportunitiesService.deleteOpportunity(id);
    if (res.success) {
      showToast('Opportunity removed from pipeline');
      loadOpportunities();
    }
  };

  // Pipeline metrics calculation
  const metrics: PipelineMetrics = useMemo(() => {
    return OpportunitiesService.calculatePipelineMetrics(opportunities);
  }, [opportunities]);

  // Group opportunities by stage for Kanban
  const kanbanColumns = useMemo(() => {
    return STAGE_CONFIG.map((cfg) => {
      const stageDeals = opportunities.filter((o) => o.stage === cfg.key);
      const stageValue = stageDeals.reduce((sum, o) => sum + o.dealValue, 0);
      return {
        ...cfg,
        deals: stageDeals,
        totalValue: stageValue,
      };
    });
  }, [opportunities]);

  const filteredDeals = useMemo(() => {
    if (!searchQuery.trim()) return opportunities;
    const q = searchQuery.toLowerCase();
    return opportunities.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        o.code.toLowerCase().includes(q) ||
        (o.accountName && o.accountName.toLowerCase().includes(q))
    );
  }, [opportunities, searchQuery]);

  return (
    <div id="pipeline-view-root" className="space-y-6">
      {/* Toast Notification Banner */}
      {statusMessage && (
        <div
          id="pipeline-toast"
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header & Primary Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Sales Pipeline & Opportunity Engine
              </h1>
              <p className="text-xs text-slate-500">
                MEDDPICC Qualified Stages &bull; Multi-Tenant Supabase RLS &bull; Presales Architecture Linking
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              id="view-kanban-toggle"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
            </button>
            <button
              id="view-table-toggle"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Data Grid</span>
            </button>
          </div>

          <button
            id="refresh-pipeline-btn"
            onClick={loadOpportunities}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors"
            title="Refresh from Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            id="create-new-opp-btn"
            onClick={() => {
              setEditingOpportunity(null);
              setIsNewModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Opportunity</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Dashboard Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Pipeline</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-black text-slate-900">
            Rp {(metrics.totalPipelineValue / 1_000_000_000).toFixed(1)} M
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            Active unclosed deals
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Weighted Forecast</span>
            <BarChart3 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-lg font-black text-indigo-900">
            Rp {(metrics.weightedPipelineValue / 1_000_000_000).toFixed(1)} M
          </div>
          <span className="text-[10px] text-indigo-600/70 font-medium">
            Probability weighted
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">MEDDPICC Rigor</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-emerald-900">
            {metrics.avgMeddpiccScore}%
          </div>
          <span className="text-[10px] text-emerald-600/70 font-medium">
            Avg qualification score
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Win Rate</span>
            <Percent className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg font-black text-amber-900">
            {metrics.winRatePct}%
          </div>
          <span className="text-[10px] text-amber-600/70 font-medium">
            Closed deal ratio
          </span>
        </div>

        <div className="col-span-2 md:col-span-1 p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Deals</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg font-black text-slate-900">
            {metrics.totalDealsCount}
          </div>
          <span className="text-[10px] text-purple-600/70 font-medium">
            In active workflow
          </span>
        </div>
      </div>

      {/* Filters & Search Control Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="pipeline-search-input"
              type="text"
              placeholder="Search opportunity code, title, or target account name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
            />
          </div>

          {/* Stage Filter */}
          <div className="w-full md:w-52">
            <select
              id="filter-stage-select"
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="ALL">All Stages ({opportunities.length})</option>
              {STAGE_CONFIG.map((cfg) => (
                <option key={cfg.key} value={cfg.key}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>

          {/* AE Filter */}
          <div className="w-full md:w-48">
            <select
              id="filter-ae-select"
              value={selectedAe}
              onChange={(e) => setSelectedAe(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="ALL">All Account Executives</option>
              <option value="usr_ae_01">Rian Hidayat</option>
              <option value="usr_ae_02">Nadia Safitri</option>
              <option value="usr_ae_03">Budi Santoso</option>
            </select>
          </div>

          {/* SA Filter */}
          <div className="w-full md:w-48">
            <select
              id="filter-sa-select"
              value={selectedSa}
              onChange={(e) => setSelectedSa(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="ALL">All Solutions Architects</option>
              {SA_OPTIONS.map((sa) => (
                <option key={sa.id} value={sa.id}>
                  {sa.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main View: Kanban Board or Data Grid */}
      {viewMode === 'kanban' ? (
        /* KANBAN BOARD */
        <div id="pipeline-kanban-board" className="flex gap-4 overflow-x-auto pb-6 pt-1">
          {kanbanColumns.map((col) => (
            <div
              key={col.key}
              id={`kanban-col-${col.key}`}
              className="w-80 shrink-0 flex flex-col bg-slate-100/70 rounded-2xl border border-slate-200/90 overflow-hidden max-h-[75vh]"
            >
              {/* Column Header */}
              <div className={`px-4 py-3 border-b border-slate-200/80 bg-white shrink-0`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{col.shortLabel}</span>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {col.deals.length}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    Rp {(col.totalValue / 1_000_000_000).toFixed(1)}B
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      col.key === 'Closed_Won'
                        ? 'bg-emerald-500'
                        : col.key === 'Closed_Lost'
                        ? 'bg-rose-500'
                        : 'bg-blue-500'
                    }`}
                    style={{
                      width: `${
                        metrics.totalPipelineValue > 0
                          ? Math.min(100, (col.totalValue / metrics.totalPipelineValue) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Column Cards Container */}
              <div className="p-3 space-y-3 overflow-y-auto flex-1">
                {col.deals.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                    No deals in this stage
                  </div>
                ) : (
                  col.deals.map((opp) => (
                    <div
                      key={opp.id}
                      id={`deal-card-${opp.id}`}
                      className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                      onClick={() => setDetailOpportunity(opp)}
                    >
                      {/* Card Top Strip */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {opp.code}
                        </span>
                        <div className="flex items-center gap-1">
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                              opp.meddpiccScore >= 80
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : opp.meddpiccScore >= 50
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            M: {opp.meddpiccScore}%
                          </span>
                        </div>
                      </div>

                      {/* Card Title & Account */}
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                        {opp.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate mb-3 flex items-center gap-1">
                        <Building2 className="w-3 h-3 shrink-0 text-slate-400" />
                        <span>{opp.accountName}</span>
                      </p>

                      {/* Card Economics */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between mb-3">
                        <span className="text-xs font-extrabold text-slate-900">
                          Rp {(opp.dealValue / 1_000_000_000).toFixed(2)}M
                        </span>
                        <span className="text-[11px] font-semibold text-blue-700">
                          {opp.probability}% Prob
                        </span>
                      </div>

                      {/* Card Bottom Meta & Stage Transition Controls */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span className="truncate max-w-[120px]">
                          AE: {opp.assignedAeName?.split(' ')[0] || 'Rian'}
                        </span>

                        <div
                          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            id={`move-prev-${opp.id}`}
                            onClick={() => handleQuickStageMove(opp, 'prev')}
                            title="Move to previous stage"
                            className="p-1 hover:bg-slate-100 text-slate-600 rounded"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`move-next-${opp.id}`}
                            onClick={() => handleQuickStageMove(opp, 'next')}
                            title="Advance to next stage"
                            className="p-1 hover:bg-slate-100 text-blue-600 font-bold rounded"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* DATA GRID / TABLE VIEW */
        <div id="pipeline-data-grid" className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  <th className="px-4 py-3.5">Opportunity & Code</th>
                  <th className="px-4 py-3.5">Account</th>
                  <th className="px-4 py-3.5">Stage</th>
                  <th className="px-4 py-3.5">Deal Value (IDR)</th>
                  <th className="px-4 py-3.5">Win Prob</th>
                  <th className="px-4 py-3.5">MEDDPICC</th>
                  <th className="px-4 py-3.5">Assigned AE / SA</th>
                  <th className="px-4 py-3.5">Target Close</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 text-xs">
                {filteredDeals.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                      No matching opportunities found. Try adjusting filters or create a new deal.
                    </td>
                  </tr>
                ) : (
                  filteredDeals.map((opp) => {
                    const stageConf = STAGE_CONFIG.find((c) => c.key === opp.stage);

                    return (
                      <tr
                        key={opp.id}
                        id={`table-row-${opp.id}`}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => setDetailOpportunity(opp)}
                      >
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60 block w-max mb-0.5">
                            {opp.code}
                          </span>
                          <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {opp.title}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-slate-800 block truncate max-w-[160px]">
                            {opp.accountName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {opp.accountTier || 'Tier-1'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-lg ${
                              stageConf?.bgLight || 'bg-slate-100'
                            } ${stageConf?.color || 'text-slate-700'} border ${
                              stageConf?.borderLight || 'border-slate-200'
                            }`}
                          >
                            {stageConf?.shortLabel || opp.stage}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          Rp {(opp.dealValue / 1_000_000_000).toFixed(2)} M
                        </td>

                        <td className="px-4 py-3.5 font-semibold text-blue-700">
                          {opp.probability}%
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  opp.meddpiccScore >= 80
                                    ? 'bg-emerald-500'
                                    : opp.meddpiccScore >= 50
                                    ? 'bg-amber-500'
                                    : 'bg-slate-400'
                                }`}
                                style={{ width: `${opp.meddpiccScore}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700">
                              {opp.meddpiccScore}%
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="text-slate-800 font-medium block">
                            AE: {opp.assignedAeName || 'Rian Hidayat'}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            SA: {opp.assignedSaName || 'Abdoel'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-slate-600 font-medium">
                          {opp.targetCloseDate
                            ? new Date(opp.targetCloseDate).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Q4 2026'}
                        </td>

                        <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`edit-table-opp-${opp.id}`}
                              onClick={() => {
                                setEditingOpportunity(opp);
                                setIsNewModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit Opportunity"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`delete-table-opp-${opp.id}`}
                              onClick={() => handleDelete(opp.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Opportunity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* Opportunity Modal (Create/Edit) */}
      <OpportunityModal
        isOpen={isNewModalOpen || Boolean(editingOpportunity)}
        onClose={() => {
          setIsNewModalOpen(false);
          setEditingOpportunity(null);
        }}
        onSubmit={handleCreateOrUpdate}
        opportunity={editingOpportunity}
      />

      {/* Opportunity Detail & MEDDPICC Deep-Dive Modal */}
      <OpportunityDetailModal
        isOpen={Boolean(detailOpportunity)}
        onClose={() => setDetailOpportunity(null)}
        opportunity={detailOpportunity}
        onEdit={(opp) => {
          setEditingOpportunity(opp);
          setIsNewModalOpen(true);
        }}
        onDelete={handleDelete}
        onOpportunityUpdated={(updated) => {
          setDetailOpportunity(updated);
          loadOpportunities();
        }}
        currentRole={currentRole}
      />
    </div>
  );
};
