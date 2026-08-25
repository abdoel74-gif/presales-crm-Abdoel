import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Building,
  DollarSign,
  User,
  ArrowRight,
  Printer,
  ChevronRight,
  Download,
  Share2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  SowDocument,
  SowStatus,
  SowStatsSummary,
  UserRole,
  UserProfile,
} from '../types.ts';
import { SowHandoverService } from '../lib/sow-handover-service.ts';
import { SowDetailModal } from './SowDetailModal.tsx';
import { CreateSowModal } from './CreateSowModal.tsx';

interface SowAdminViewProps {
  currentRole: UserRole;
  currentProfile?: UserProfile;
  currency?: 'IDR' | 'USD';
  onNavigateToHandover?: (oppId?: string) => void;
  onNavigateToBoq?: (reqId?: string) => void;
  onSendWhatsAppAlert?: (phone: string, message: string) => void;
}

export const SowAdminView: React.FC<SowAdminViewProps> = ({
  currentRole,
  currentProfile,
  currency = 'IDR',
  onNavigateToHandover,
  onNavigateToBoq,
  onSendWhatsAppAlert,
}) => {
  const [sows, setSows] = useState<SowDocument[]>([]);
  const [stats, setStats] = useState<SowStatsSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SowStatus | 'ALL'>('ALL');
  const [selectedSow, setSelectedSow] = useState<SowDocument | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const { data } = await SowHandoverService.getSowDocuments({
      search: searchQuery,
      status: statusFilter,
    });
    setSows(data || []);

    const summary = await SowHandoverService.getSowStatsSummary();
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

  const getStatusBadge = (status: SowStatus) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[11px] font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Approved</span>;
      case 'CLIENT_SIGNED':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 border border-blue-300 rounded-full text-[11px] font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Client Signed</span>;
      case 'LEGAL_SALES_REVIEW':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-[11px] font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Legal & Sales Review</span>;
      case 'INTERNAL_REVIEW':
        return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 border border-purple-300 rounded-full text-[11px] font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Internal Review</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded-full text-[11px] font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Rejected</span>;
      case 'DRAFT':
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-300 rounded-full text-[11px] font-bold flex items-center gap-1"><FileText className="w-3 h-3" /> Draft</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  Statement of Work (SOW) Admin & Scope Guardian
                </h1>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-bold font-mono">
                  STEP 22
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Contractual scope baseline, RACI governance, milestone deliverables, and client-ready legal clauses
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
          
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Generate SOW
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total SOWs
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {stats.totalSows}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Active Document Vault</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Drafts
            </span>
            <div className="text-2xl font-black text-slate-700 mt-1">
              {stats.draftCount}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Authoring in progress</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider block">
              Under Review
            </span>
            <div className="text-2xl font-black text-amber-700 mt-1">
              {stats.internalReviewCount + stats.legalReviewCount}
            </div>
            <span className="text-[10px] text-amber-600 mt-0.5 block">Presales & Legal check</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider block">
              Approved
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {stats.approvedCount}
            </div>
            <span className="text-[10px] text-emerald-600 mt-0.5 block">Ready for client signature</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wider block">
              Client Signed
            </span>
            <div className="text-2xl font-black text-blue-700 mt-1">
              {stats.clientSignedCount}
            </div>
            <span className="text-[10px] text-blue-600 mt-0.5 block">Legally executed</span>
          </div>

          <div className="bg-linear-to-br from-blue-900 to-indigo-950 p-4 rounded-xl text-white shadow-xs">
            <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider block">
              SOW Value Pipeline
            </span>
            <div className="text-lg sm:text-xl font-black text-white mt-1">
              {formatCurrency(stats.totalContractValueIDR, stats.totalContractValueUSD)}
            </div>
            <span className="text-[10px] text-blue-200 mt-0.5 block">Avg Turnaround: {stats.avgTurnaroundDays}d</span>
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
              placeholder="Search SOW #, account, project..."
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
              All SOWs ({sows.length})
            </button>
            <button
              onClick={() => setStatusFilter('DRAFT')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === 'DRAFT'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Drafts
            </button>
            <button
              onClick={() => setStatusFilter('INTERNAL_REVIEW')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === 'INTERNAL_REVIEW'
                  ? 'bg-purple-700 text-white font-bold'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-800'
              }`}
            >
              Internal Review
            </button>
            <button
              onClick={() => setStatusFilter('LEGAL_SALES_REVIEW')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === 'LEGAL_SALES_REVIEW'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800'
              }`}
            >
              Legal & Sales
            </button>
            <button
              onClick={() => setStatusFilter('APPROVED')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === 'APPROVED'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatusFilter('CLIENT_SIGNED')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === 'CLIENT_SIGNED'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-800'
              }`}
            >
              Signed
            </button>
          </div>
        </div>
      </div>

      {/* SOW Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sows.map((sow) => {
          const approvedSignaturesCount = sow.governanceApprovals?.filter((a) => a.status === 'APPROVED').length || 0;
          const totalSignaturesCount = sow.governanceApprovals?.length || 0;

          return (
            <div
              key={sow.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div>
                {/* Card Top Banner */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {sow.documentNumber}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 font-semibold">{sow.version}</span>
                  </div>
                  {getStatusBadge(sow.status)}
                </div>

                {/* Card Content */}
                <div className="p-5 space-y-3">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      {sow.accountName}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mt-0.5">
                      {sow.opportunityTitle}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {sow.executiveSummary}
                  </p>

                  {/* Scope Metrics */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">In-Scope</span>
                      <span className="font-bold text-slate-800">{sow.scopeInScope?.length || 0} items</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Deliverables</span>
                      <span className="font-bold text-slate-800">{sow.deliverables?.length || 0} gates</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Milestones</span>
                      <span className="font-bold text-slate-800">{sow.projectTimeline?.length || 0} phases</span>
                    </div>
                  </div>

                  {/* Governance Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-blue-600" />
                        Governance Signoffs
                      </span>
                      <span className="font-bold text-slate-700 font-mono">
                        {approvedSignaturesCount}/{totalSignaturesCount} Signed
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all"
                        style={{
                          width: `${totalSignaturesCount > 0 ? (approvedSignaturesCount / totalSignaturesCount) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase">Contract Value</span>
                  <span className="text-xs font-black text-slate-900 font-mono">
                    {formatCurrency(sow.commercialTerms.totalContractValueIDR, sow.commercialTerms.totalContractValueUSD)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setSelectedSow(sow);
                      setIsDetailOpen(true);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <span>Inspect SOW</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SOW Detail Modal */}
      {selectedSow && (
        <SowDetailModal
          sow={selectedSow}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedSow(null);
          }}
          onUpdated={(updated) => {
            setSelectedSow(updated);
            loadData();
          }}
          currentUserRole={currentRole}
          currentProfile={currentProfile}
          currency={currency}
        />
      )}

      {/* Create SOW Modal */}
      <CreateSowModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => loadData()}
        currentProfile={currentProfile}
      />

    </div>
  );
};
