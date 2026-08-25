import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Search,
  Plus,
  Filter,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Download,
  Kanban,
  List,
  Server,
  Building2,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  Send,
  User,
} from 'lucide-react';
import {
  TechTicket,
  TicketStatsSummary,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  UserRole,
  UserProfile,
} from '../types.ts';
import { AssetsTicketsService, isTicketSlaBreached } from '../lib/assets-tickets-service.ts';
import { INITIAL_ACCOUNTS } from '../data/initialAccountsData.ts';
import { TicketDetailModal } from './TicketDetailModal.tsx';
import { CreateTicketModal } from './CreateTicketModal.tsx';
import { RfpKnowledgeModal } from './RfpKnowledgeModal.tsx';

interface TechDeskViewProps {
  currentRole: UserRole;
  currentProfile?: UserProfile;
  initialAssetIdFilter?: string;
  onNavigateToAsset?: (assetId: string) => void;
  onSendWhatsAppAlert?: (phone: string, text: string) => void;
}

export const TechDeskView: React.FC<TechDeskViewProps> = ({
  currentRole,
  currentProfile,
  initialAssetIdFilter,
  onNavigateToAsset,
  onSendWhatsAppAlert,
}) => {
  const [tickets, setTickets] = useState<TechTicket[]>([]);
  const [stats, setStats] = useState<TicketStatsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // View mode
  const [viewMode, setViewMode] = useState<'LIST' | 'KANBAN'>('LIST');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | TicketPriority>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | TicketCategory>('ALL');
  const [accountFilter, setAccountFilter] = useState<string>('ALL');
  const [slaBreachOnly, setSlaBreachOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'BREACHED' | 'RESOLVED'>('ALL');

  // Modals
  const [selectedTicket, setSelectedTicket] = useState<TechTicket | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isKbOpen, setIsKbOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    let computedStatus = statusFilter;
    let computedSla = slaBreachOnly;

    if (activeTab === 'OPEN') computedStatus = 'OPEN';
    else if (activeTab === 'IN_PROGRESS') computedStatus = 'IN_PROGRESS';
    else if (activeTab === 'RESOLVED') computedStatus = 'RESOLVED';
    else if (activeTab === 'BREACHED') computedSla = true;

    const { data } = await AssetsTicketsService.getTickets({
      search: searchQuery,
      status: computedStatus,
      priority: priorityFilter,
      category: categoryFilter,
      accountId: accountFilter,
      slaBreachOnly: computedSla,
    });

    const summary = await AssetsTicketsService.getTicketStatsSummary();
    setTickets(data);
    setStats(summary);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, statusFilter, priorityFilter, categoryFilter, accountFilter, slaBreachOnly, activeTab]);

  const getPriorityBadge = (p: TicketPriority) => {
    switch (p) {
      case 'URGENT_24H':
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/15 text-rose-800 border border-rose-400 animate-pulse">URGENT (24h)</span>;
      case 'HIGH_48H':
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-500/15 text-amber-800 border border-amber-400">HIGH (48h)</span>;
      case 'MEDIUM':
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">MEDIUM (72h)</span>;
      case 'LOW':
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200">LOW</span>;
      default:
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">Standard</span>;
    }
  };

  const getStatusBadge = (s: TicketStatus) => {
    switch (s) {
      case 'OPEN':
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200">OPEN</span>;
      case 'IN_PROGRESS':
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">IN PROGRESS</span>;
      case 'PENDING_CUSTOMER':
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200">PENDING INFO</span>;
      case 'RESOLVED':
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">RESOLVED</span>;
      case 'CLOSED':
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 border border-slate-200">CLOSED</span>;
      default:
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{s}</span>;
    }
  };

  const handleExportCSV = () => {
    const headers = ['Ticket Number', 'Title', 'Category', 'Priority', 'Status', 'Account', 'Asset', 'Assignee', 'Reporter', 'SLA Due Date', 'Created At'];
    const rows = tickets.map((t) => [
      t.ticketNumber,
      `"${t.title.replace(/"/g, '""')}"`,
      t.category,
      t.priority,
      t.status,
      `"${t.accountName.replace(/"/g, '""')}"`,
      `"${(t.assetName || '').replace(/"/g, '""')}"`,
      `"${t.assigneeName || ''}"`,
      `"${t.reporterName}"`,
      t.slaDueDate,
      t.createdAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PresalesOS_TechDesk_Tickets_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Support Tickets exported to CSV.');
  };

  const kanbanColumns: { status: TicketStatus; label: string; bg: string }[] = [
    { status: 'OPEN', label: 'Open Queue', bg: 'border-t-rose-500' },
    { status: 'IN_PROGRESS', label: 'In Progress (Diagnosis/Fix)', bg: 'border-t-indigo-600' },
    { status: 'PENDING_CUSTOMER', label: 'Pending Customer Info', bg: 'border-t-amber-500' },
    { status: 'RESOLVED', label: 'Resolved & Verified', bg: 'border-t-emerald-500' },
    { status: 'CLOSED', label: 'Closed / Archived', bg: 'border-t-slate-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Tech Desk & Technical Support Hub
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                Step 26
              </span>
            </div>
            <p className="text-xs text-slate-500">
              SLA-driven technical support, hardware RMA diagnostics, RFP knowledge assistance, and post-sales incident resolution.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsKbOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            RFP Q&A Knowledge
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Open Support Ticket
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Active Tickets</span>
            <LifeBuoy className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.totalTickets ?? 0}</div>
          <div className="text-[11px] text-slate-500">
            <span className="font-semibold text-rose-600">{stats?.openCount ?? 0} Open</span> • <span className="font-semibold text-indigo-600">{stats?.inProgressCount ?? 0} In Progress</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">SLA Breach Risk (&lt;6h)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats?.urgentBreachRiskCount ?? 0}</div>
          <div className="text-[11px] text-amber-700 font-medium">Expiring Soon Priority</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">SLA Breached Count</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700">{stats?.slaBreachedCount ?? 0}</div>
          <div className="text-[11px] text-rose-600 font-medium">Escalated to Management</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Resolved Tickets</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{stats?.resolvedCount ?? 0}</div>
          <div className="text-[11px] text-emerald-600">Resolution SLA 98.4%</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Avg Resolution Time</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.avgResolutionTimeHours ?? 14.8}h</div>
          <div className="text-[11px] text-slate-500">Target SLA &lt; 24h</div>
        </div>
      </div>

      {/* Quick Navigation Tabs & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Tickets ({stats?.totalTickets ?? 0})
          </button>

          <button
            onClick={() => setActiveTab('OPEN')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'OPEN'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Open Queue ({stats?.openCount ?? 0})
          </button>

          <button
            onClick={() => setActiveTab('IN_PROGRESS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'IN_PROGRESS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            In Progress ({stats?.inProgressCount ?? 0})
          </button>

          <button
            onClick={() => setActiveTab('BREACHED')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'BREACHED'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            SLA Breached
            {stats && stats.slaBreachedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                {stats.slaBreachedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('RESOLVED')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'RESOLVED'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Resolved ({stats?.resolvedCount ?? 0})
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('LIST')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'LIST'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Table View
          </button>
          <button
            onClick={() => setViewMode('KANBAN')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'KANBAN'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            Kanban Board
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ticket #, subject, customer, asset..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-2.5 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT_24H">Urgent (24h SLA)</option>
            <option value="HIGH_48H">High (48h SLA)</option>
            <option value="MEDIUM">Medium (72h SLA)</option>
            <option value="LOW">Low (120h SLA)</option>
          </select>

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-2.5 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="ALL">All Categories</option>
            <option value="INCIDENT">Incidents</option>
            <option value="HARDWARE_RMA">Hardware RMA</option>
            <option value="CHANGE_REQUEST">Change Requests</option>
            <option value="PRESALES_INQUIRY">Presales Inquiries</option>
          </select>

          {/* Customer */}
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="px-2.5 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="ALL">All Customers</option>
            {INITIAL_ACCOUNTS.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>

          <button
            onClick={loadData}
            title="Refresh Tickets"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Area (Table vs Kanban) */}
      {viewMode === 'LIST' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
              <div className="text-xs font-semibold">Loading Technical Tickets...</div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <LifeBuoy className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-800">No support tickets match your filters</div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setPriorityFilter('ALL');
                  setCategoryFilter('ALL');
                  setAccountFilter('ALL');
                  setActiveTab('ALL');
                }}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Ticket # & Priority</th>
                    <th className="py-3 px-4">Subject & Scope</th>
                    <th className="py-3 px-4">Customer & Reporter</th>
                    <th className="py-3 px-4">Linked Asset</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">SLA Target Due</th>
                    <th className="py-3 px-4">Assignee</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                  {tickets.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                      onClick={() => setSelectedTicket(t)}
                    >
                      {/* Ticket # & Priority */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <span className="font-mono text-xs font-bold text-indigo-700 px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100">
                            {t.ticketNumber}
                          </span>
                          <div>{getPriorityBadge(t.priority)}</div>
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 line-clamp-1">{t.title}</div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <span className="font-medium text-slate-700">{t.category}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <MessageSquare className="w-3 h-3" />
                              {t.comments.length}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-900 truncate max-w-[170px]">{t.accountName}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[170px]">{t.reporterName}</div>
                        </div>
                      </td>

                      {/* Linked Asset */}
                      <td className="py-3 px-4">
                        {t.assetName ? (
                          <div className="space-y-0.5">
                            <div className="text-slate-800 font-medium truncate max-w-[180px]">{t.assetName}</div>
                            {t.assetTag && (
                              <span className="font-mono text-[11px] text-indigo-600 font-bold">{t.assetTag}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">General Inquiry</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {getStatusBadge(t.status)}
                          {t.isSlaBreached && (
                            <div className="text-[10px] font-bold text-rose-600">SLA BREACHED</div>
                          )}
                        </div>
                      </td>

                      {/* SLA Due */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="font-medium text-slate-800 text-[11px]">
                            {new Date(t.slaDueDate).toLocaleDateString()} {new Date(t.slaDueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-[10px] text-slate-500">{t.slaHours}h Target</div>
                        </div>
                      </td>

                      {/* Assignee */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{t.assigneeName || 'Abdoel'}</div>
                        <div className="text-[11px] text-indigo-600">{t.assigneeRole || 'Solutions Architect'}</div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedTicket(t)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
                        >
                          View Thread
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {kanbanColumns.map((col) => {
            const colTickets = tickets.filter((t) => t.status === col.status);
            return (
              <div key={col.status} className="bg-slate-100/70 rounded-2xl border border-slate-200/80 p-3 space-y-3 flex flex-col min-h-[500px]">
                <div className={`p-2.5 bg-white rounded-xl border-t-4 ${col.bg} border-x border-b border-slate-200 shadow-xs flex items-center justify-between`}>
                  <span className="font-bold text-xs text-slate-800 tracking-tight">{col.label}</span>
                  <span className="text-[11px] font-bold px-2 py-0.2 rounded-full bg-slate-100 text-slate-700">
                    {colTickets.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[70vh]">
                  {colTickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className="p-3.5 rounded-xl bg-white border border-slate-200/90 hover:border-indigo-400 shadow-xs cursor-pointer transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {t.ticketNumber}
                        </span>
                        {getPriorityBadge(t.priority)}
                      </div>

                      <h4 className="font-bold text-slate-900 text-xs line-clamp-2 leading-snug">{t.title}</h4>

                      <div className="text-[11px] text-slate-500 space-y-0.5">
                        <div className="font-semibold text-slate-700 truncate">{t.accountName}</div>
                        {t.assetName && (
                          <div className="text-indigo-600 truncate text-[10px]">
                            {t.assetTag || 'Asset'}: {t.assetName}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                        <div className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{new Date(t.slaDueDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1 font-medium">
                          <MessageSquare className="w-3 h-3 text-slate-400" />
                          <span>{t.comments.length}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          currentRole={currentRole}
          currentProfile={currentProfile}
          onClose={() => setSelectedTicket(null)}
          onRefresh={loadData}
          onSendWhatsAppAlert={onSendWhatsAppAlert}
        />
      )}

      {/* Create Ticket Modal */}
      {isCreateOpen && (
        <CreateTicketModal
          currentProfile={currentProfile}
          prefillAssetId={initialAssetIdFilter}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => {
            showToast('Support ticket dispatched successfully.');
            loadData();
          }}
        />
      )}

      {/* RFP Knowledge Base Modal */}
      {isKbOpen && (
        <RfpKnowledgeModal
          currentProfile={currentProfile}
          onClose={() => setIsKbOpen(false)}
        />
      )}
    </div>
  );
};
