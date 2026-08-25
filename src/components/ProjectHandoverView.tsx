import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building,
  User,
  Calendar,
  DollarSign,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Zap,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  ProjectHandover,
  HandoverStatus,
  HandoverStatsSummary,
  UserRole,
  UserProfile,
} from '../types.ts';
import { INITIAL_OPPORTUNITY_RECORDS } from '../data/initialOpportunitiesData.ts';
import { SowHandoverService } from '../lib/sow-handover-service.ts';
import { HandoverDetailModal } from './HandoverDetailModal.tsx';

interface ProjectHandoverViewProps {
  currentRole: UserRole;
  currentProfile?: UserProfile;
  currency?: 'IDR' | 'USD';
  onNavigateToSow?: (sowId?: string) => void;
  onSendWhatsAppAlert?: (phone: string, message: string) => void;
}

export const ProjectHandoverView: React.FC<ProjectHandoverViewProps> = ({
  currentRole,
  currentProfile,
  currency = 'IDR',
  onNavigateToSow,
  onSendWhatsAppAlert,
}) => {
  const [handovers, setHandovers] = useState<ProjectHandover[]>([]);
  const [stats, setStats] = useState<HandoverStatsSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<HandoverStatus | 'ALL'>('ALL');
  const [selectedHandover, setSelectedHandover] = useState<ProjectHandover | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const { data } = await SowHandoverService.getProjectHandovers({
      search: searchQuery,
      status: statusFilter,
    });
    setHandovers(data || []);

    const summary = await SowHandoverService.getHandoverStatsSummary();
    setStats(summary);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const formatCurrency = (valIDR: number, valUSD?: number) => {
    if (currency === 'USD' && valUSD) {
      return `$${valUSD.toLocaleString('en-US')}`;
    }
    return `IDR ${(valIDR || 0).toLocaleString('id-ID')}`;
  };

  const getStatusBadge = (status: HandoverStatus) => {
    switch (status) {
      case 'OFFICIALLY_HANDED_OVER':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[11px] font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Handed Over</span>;
      case 'ACCEPTANCE_SIGN_OFF':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 border border-blue-300 rounded-full text-[11px] font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Acceptance Sign-Off</span>;
      case 'REVIEW_IN_PROGRESS':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-[11px] font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Reviewing</span>;
      case 'PENDING_KICKOFF':
      default:
        return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 border border-purple-300 rounded-full text-[11px] font-bold flex items-center gap-1"><Layers className="w-3 h-3" /> Pending Kickoff</span>;
    }
  };

  // Check for WON opportunities without handover packages
  const wonOpportunitiesWithoutHandover = INITIAL_OPPORTUNITY_RECORDS.filter(
    (opp) =>
      opp.stage === 'Closed_Won' &&
      !handovers.some((h) => h.opportunityId === opp.id)
  );

  const handleCreateHandoverForWonOpp = async (opp: any) => {
    setIsLoading(true);
    const { data } = await SowHandoverService.createHandoverFromOpportunity(
      opp,
      null,
      currentProfile ? { id: currentProfile.id, name: currentProfile.name, email: currentProfile.email } : undefined
    );
    setIsLoading(false);

    if (data) {
      setStatusMessage(`Handover package ${data.handoverCode} generated for ${opp.title}.`);
      loadData();
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  Project Handover & PM Delivery Onboarding Hub
                </h1>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-bold font-mono">
                  STEP 23
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated Sales-to-Delivery transition, 5-pillar verification checklist, risk registry & tri-party governance
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* WON Opportunities Auto-Trigger Banner */}
      {wonOpportunitiesWithoutHandover.length > 0 && (
        <div className="bg-linear-to-r from-emerald-900 to-teal-950 p-5 rounded-2xl text-white shadow-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Won Deals Ready for Delivery Handover ({wonOpportunitiesWithoutHandover.length})</span>
                <span className="px-2 py-0.5 rounded bg-emerald-800 text-emerald-200 text-[10px] font-mono font-semibold">
                  AUTOMATION TRIGGER
                </span>
              </h3>
              <p className="text-xs text-emerald-200 mt-0.5">
                Closed Won opportunities detected. Generate comprehensive handover packages with attached SOW & BOQ baselines.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {wonOpportunitiesWithoutHandover.map((opp) => (
              <button
                key={opp.id}
                onClick={() => handleCreateHandoverForWonOpp(opp)}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Initialize Handover: {opp.code}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status Alert Banner */}
      {statusMessage && (
        <div className="bg-emerald-50 border border-emerald-200 px-6 py-2.5 rounded-xl text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {statusMessage}
        </div>
      )}

      {/* KPI Metric Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Packages
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {stats.totalHandovers}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Delivery Dossiers</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-purple-500 uppercase tracking-wider block">
              Pending Kickoff
            </span>
            <div className="text-2xl font-black text-purple-700 mt-1">
              {stats.pendingKickoffCount}
            </div>
            <span className="text-[10px] text-purple-600 mt-0.5 block">Checklist in flight</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider block">
              In Review
            </span>
            <div className="text-2xl font-black text-amber-700 mt-1">
              {stats.reviewInProgressCount}
            </div>
            <span className="text-[10px] text-amber-600 mt-0.5 block">PM deep review</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wider block">
              Sign-Off Ready
            </span>
            <div className="text-2xl font-black text-blue-700 mt-1">
              {stats.acceptanceSignoffCount}
            </div>
            <span className="text-[10px] text-blue-600 mt-0.5 block">Tri-party review</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider block">
              Handed Over
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {stats.officiallyHandedOverCount}
            </div>
            <span className="text-[10px] text-emerald-600 mt-0.5 block">In Delivery Exec</span>
          </div>

          <div className="bg-linear-to-br from-slate-900 to-blue-950 p-4 rounded-xl text-white shadow-xs">
            <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider block">
              Handover Value
            </span>
            <div className="text-lg sm:text-xl font-black text-white mt-1">
              {formatCurrency(stats.totalHandoverValueIDR, stats.totalHandoverValueUSD)}
            </div>
            <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">
              Avg Readiness: {stats.avgReadinessScore}%
            </span>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search handover #, account, project..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </form>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs font-medium text-slate-600 pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              All Packages ({handovers.length})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING_KICKOFF')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === 'PENDING_KICKOFF'
                  ? 'bg-purple-700 text-white font-bold'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-800'
              }`}
            >
              Pending Kickoff
            </button>
            <button
              onClick={() => setStatusFilter('REVIEW_IN_PROGRESS')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === 'REVIEW_IN_PROGRESS'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800'
              }`}
            >
              Reviewing
            </button>
            <button
              onClick={() => setStatusFilter('ACCEPTANCE_SIGN_OFF')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === 'ACCEPTANCE_SIGN_OFF'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-800'
              }`}
            >
              Sign-Off
            </button>
            <button
              onClick={() => setStatusFilter('OFFICIALLY_HANDED_OVER')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === 'OFFICIALLY_HANDED_OVER'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
              }`}
            >
              Handed Over
            </button>
          </div>
        </div>
      </div>

      {/* Handover Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {handovers.map((handover) => {
          const completedChecks = handover.checklist?.filter((c) => c.completed).length || 0;
          const totalChecks = handover.checklist?.length || 0;

          return (
            <div
              key={handover.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div>
                {/* Card Top Header */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {handover.handoverCode}
                  </span>
                  {getStatusBadge(handover.status)}
                </div>

                {/* Card Content */}
                <div className="p-5 space-y-3">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      {handover.accountName}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mt-0.5">
                      {handover.opportunityTitle}
                    </h3>
                  </div>

                  {/* Stakeholder Team Badges */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Assigned PM</span>
                      <span className="font-bold text-slate-900 flex items-center gap-1 truncate mt-0.5">
                        <User className="w-3 h-3 text-blue-600 shrink-0" />
                        {handover.assignedPmName}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Solutions Architect</span>
                      <span className="font-semibold text-slate-700 flex items-center gap-1 truncate mt-0.5">
                        <User className="w-3 h-3 text-indigo-600 shrink-0" />
                        {handover.assignedSaName}
                      </span>
                    </div>
                  </div>

                  {/* Readiness Barometer */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Handover Readiness
                      </span>
                      <span className="font-bold font-mono text-emerald-700">
                        {handover.handoverReadinessScore}% ({completedChecks}/{totalChecks})
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          handover.handoverReadinessScore >= 85
                            ? 'bg-emerald-500'
                            : handover.handoverReadinessScore >= 60
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${handover.handoverReadinessScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Risk & Target Kickoff */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500 text-[11px] flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Kickoff: <strong className="text-slate-800">{handover.targetKickoffDate}</strong>
                    </span>
                    <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                      {handover.riskRegistry?.length || 0} Risks Logged
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase">Deal Value</span>
                  <span className="text-xs font-black text-emerald-700 font-mono">
                    {formatCurrency(handover.dealValueIDR, handover.dealValueUSD)}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setSelectedHandover(handover);
                    setIsDetailOpen(true);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                >
                  <span>Inspect Handover</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Handover Detail Modal */}
      {selectedHandover && (
        <HandoverDetailModal
          handover={selectedHandover}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedHandover(null);
          }}
          onUpdated={(updated) => {
            setSelectedHandover(updated);
            loadData();
          }}
          currentUserRole={currentRole}
          currentProfile={currentProfile}
          currency={currency}
          onSendWhatsAppPing={onSendWhatsAppAlert}
        />
      )}

    </div>
  );
};
