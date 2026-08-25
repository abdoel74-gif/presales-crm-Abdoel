import React from 'react';
import {
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Boxes,
  ArrowUpRight,
  Calculator,
  ReceiptText,
  FileCheck2,
  Cpu,
  Layers,
  ShieldAlert,
  ChevronRight,
  Send,
  Sparkles,
} from 'lucide-react';
import {
  MetricSummary,
  PresalesTask,
  OpportunityItem,
  POCTrackerItem,
  WhatsAppNotification,
  PresalesStatus,
  PriorityLevel,
  UserRole,
} from '../types.ts';

interface DashboardViewProps {
  metrics: MetricSummary;
  presalesTasks: PresalesTask[];
  opportunities: OpportunityItem[];
  pocItems: POCTrackerItem[];
  waNotifications: WhatsAppNotification[];
  currency: 'IDR' | 'USD';
  onNavigateTab: (tabId: string) => void;
  onOpenNewRequest: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  presalesTasks,
  opportunities,
  pocItems,
  waNotifications,
  currency,
  onNavigateTab,
  onOpenNewRequest,
}) => {
  const formatCurrency = (val: number) => {
    if (currency === 'USD') {
      const usdVal = val / 15800;
      return `$${(usdVal / 1000000).toFixed(2)}M`;
    }
    return `Rp ${(val / 1000000000).toFixed(1)} Miliar`;
  };

  const getStatusBadge = (status: PresalesStatus) => {
    switch (status) {
      case PresalesStatus.SIZING_IN_PROGRESS:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case PresalesStatus.BOQ_SUBMITTED:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case PresalesStatus.SOW_REVIEW:
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case PresalesStatus.IN_ANALYSIS:
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case PriorityLevel.URGENT:
        return 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
      case PriorityLevel.HIGH:
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Welcome Action Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl text-white border border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Live Operations
            </span>
            <span className="text-xs text-slate-400">Quarter 3 FY2026</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Enterprise Presales Command Center
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            Real-time pipeline tracking, technical sizing engine, dynamic BOQ/SOW generation, and WhatsApp automated approval workflows.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigateTab('sizing-engine')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 transition-all"
          >
            <Calculator className="w-4 h-4 text-indigo-300" />
            <span>Launch Sizing</span>
          </button>
          <button
            onClick={onOpenNewRequest}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Create Presales Request</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Pipeline Value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-medium">Total Pipeline</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 tracking-tight">
            {formatCurrency(metrics.totalPipelineValue)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>+14.2% vs last month</span>
          </div>
        </div>

        {/* Card 2: Active Presales */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-medium">Active Requests</span>
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 tracking-tight">
            {metrics.activePresalesDeals} <span className="text-xs font-normal text-slate-400">Deals</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            4 in architecture sizing
          </div>
        </div>

        {/* Card 3: Win Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-medium">Presales Win Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 tracking-tight">
            {metrics.winRatePct}%
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            +3.5% post-POC conversion
          </div>
        </div>

        {/* Card 4: SLA Turnaround */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-medium">Avg SLA Turnaround</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 tracking-tight">
            {metrics.avgSlaTurnaroundDays} <span className="text-xs font-normal text-slate-400">Days</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Target SLA: ≤ 3.0 Days
          </div>
        </div>

        {/* Card 5: Pending BOQ Approvals */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-medium">Pending Approvals</span>
            <ReceiptText className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 tracking-tight">
            {metrics.pendingApprovalsCount} <span className="text-xs font-normal text-slate-400">Quotes</span>
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">
            2 require Director override
          </div>
        </div>

        {/* Card 6: Active POCs */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-medium">POCs In Field</span>
            <Boxes className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 tracking-tight">
            {metrics.activePocCount} <span className="text-xs font-normal text-slate-400">Active</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            12 loaner hardware units
          </div>
        </div>
      </div>

      {/* Main Grid: Presales Queue & Opportunities Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Presales Priority Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Active Presales Queue & Technical Sizing Requests
                </h2>
              </div>
              <button
                onClick={() => onNavigateTab('presales-queue')}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
              >
                <span>View Full Queue</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {presalesTasks.map((task) => (
                <div
                  key={task.id}
                  id={`presales-task-row-${task.id}`}
                  className="p-4 hover:bg-slate-50/70 transition-colors space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-500">
                          {task.requestCode}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${getPriorityBadge(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${getStatusBadge(
                            task.status
                          )}`}
                        >
                          {task.status}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 mt-1">
                        {task.opportunityTitle}
                      </h3>
                      <p className="text-xs text-slate-500">{task.accountName}</p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => onNavigateTab('sizing-engine')}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1 transition-colors"
                      >
                        <Cpu className="w-3.5 h-3.5 text-slate-500" />
                        <span>Sizing ({task.sizingWorkloadsCount} VMs)</span>
                      </button>
                      <button
                        onClick={() => onNavigateTab('boq-pricing')}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1 transition-colors"
                      >
                        <ReceiptText className="w-3.5 h-3.5 text-indigo-600" />
                        <span>BOQ ({task.boqMargin}%)</span>
                      </button>
                    </div>
                  </div>

                  {/* Tags & SLA info */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-slate-400">Domains:</span>
                      {task.techDomain.map((domain, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium"
                        >
                          {domain}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <div>
                        Architect: <strong className="text-slate-700">{task.leadArchitect}</strong>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <Clock className="w-3 h-3" />
                        <span>SLA Due: {task.slaDueHours}h</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Opportunities Pipeline Table (MEDDPICC) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Opportunity Pipeline & MEDDPICC Qualification
                </h2>
              </div>
              <button
                onClick={() => onNavigateTab('opportunities')}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
              >
                <span>Pipeline View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Code / Opportunity</th>
                    <th className="px-4 py-3">Account & Industry</th>
                    <th className="px-4 py-3">Deal Value</th>
                    <th className="px-4 py-3">Stage</th>
                    <th className="px-4 py-3">MEDDPICC</th>
                    <th className="px-4 py-3">Lead SA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {opportunities.slice(0, 4).map((opp) => (
                    <tr key={opp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div className="font-mono text-[11px] text-slate-400">{opp.code}</div>
                        <div className="font-semibold text-slate-900">{opp.title}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{opp.accountName}</div>
                        <div className="text-[11px] text-slate-400">{opp.industry}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {formatCurrency(opp.dealValue)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-medium inline-block">
                          {opp.stage}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-14 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full"
                              style={{ width: `${opp.meddpiccScore}%` }}
                            />
                          </div>
                          <span className="font-mono font-medium text-[11px] text-slate-700">
                            {opp.meddpiccScore}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{opp.assignedSA || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: POC Tracker & WhatsApp Realtime Stream */}
        <div className="space-y-4">
          {/* POC & POV Tracker Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-cyan-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Active POC / POV Tracker
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('assets-poc')}
                className="text-[11px] text-indigo-600 font-semibold hover:underline"
              >
                Manage
              </button>
            </div>

            <div className="space-y-3">
              {pocItems.map((poc) => (
                <div
                  key={poc.id}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900 truncate">
                      {poc.customerName}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        poc.status === 'Success Criteria Met'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {poc.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 font-medium">
                    {poc.solutionName}
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span>Milestones: {poc.milestonesCompleted} of {poc.totalMilestones}</span>
                      <span className="font-semibold text-amber-700">{poc.daysRemaining} days left</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-cyan-600 h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(poc.milestonesCompleted / poc.totalMilestones) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Loaner Equipment */}
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span className="text-slate-400">Loaner Units: </span>
                    {poc.loanerEquipment.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp Automated Notification Feed */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  WhatsApp Gateway Activity
                </h3>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                Webhook Active
              </span>
            </div>

            <div className="space-y-2.5">
              {waNotifications.map((wa) => (
                <div
                  key={wa.id}
                  className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-800 truncate">
                      {wa.recipientName}
                    </span>
                    <span className="text-[10px] text-slate-400">{wa.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                    {wa.messagePreview}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 font-mono">
                    <span>{wa.recipientPhone}</span>
                    <span className="text-emerald-600 font-medium">✓✓ {wa.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
