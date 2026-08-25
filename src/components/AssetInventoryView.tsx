import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Search,
  Plus,
  Filter,
  RefreshCw,
  Server,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Calendar,
  Download,
  Barcode,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Wrench,
  Clock,
  Send,
} from 'lucide-react';
import {
  AssetRecord,
  AssetStatsSummary,
  AssetCategory,
  AssetStatus,
  WarrantyStatus,
  UserRole,
  UserProfile,
} from '../types.ts';
import { AssetsTicketsService } from '../lib/assets-tickets-service.ts';
import { INITIAL_ACCOUNTS } from '../data/initialAccountsData.ts';
import { AssetDetailModal } from './AssetDetailModal.tsx';
import { CreateAssetModal } from './CreateAssetModal.tsx';

interface AssetInventoryViewProps {
  currentRole: UserRole;
  currentProfile?: UserProfile;
  currency: 'IDR' | 'USD';
  onNavigateToTechDesk?: (assetId?: string) => void;
  onSendWhatsAppAlert?: (phone: string, text: string) => void;
}

export const AssetInventoryView: React.FC<AssetInventoryViewProps> = ({
  currentRole,
  currentProfile,
  currency,
  onNavigateToTechDesk,
  onSendWhatsAppAlert,
}) => {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [stats, setStats] = useState<AssetStatsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AssetStatus>('ALL');
  const [warrantyFilter, setWarrantyFilter] = useState<'ALL' | WarrantyStatus>('ALL');
  const [accountFilter, setAccountFilter] = useState<string>('ALL');
  const [activeQuickTab, setActiveQuickTab] = useState<'ALL' | 'PRODUCTION' | 'LOANERS' | 'EXPIRING' | 'MAINTENANCE'>('ALL');

  // Modals
  const [selectedAsset, setSelectedAsset] = useState<AssetRecord | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createIsLoaner, setCreateIsLoaner] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    let isLoanerOnly = activeQuickTab === 'LOANERS';
    let computedWarranty = warrantyFilter;
    let computedStatus = statusFilter;

    if (activeQuickTab === 'EXPIRING') {
      computedWarranty = 'EXPIRING_SOON';
    } else if (activeQuickTab === 'MAINTENANCE') {
      computedStatus = 'IN_MAINTENANCE';
    } else if (activeQuickTab === 'PRODUCTION') {
      computedStatus = 'OPERATIONAL';
    }

    const { data } = await AssetsTicketsService.getAssets({
      search: searchQuery,
      category: categoryFilter,
      status: computedStatus,
      warrantyStatus: computedWarranty,
      accountId: accountFilter,
      isLoanerOnly,
    });

    const summary = await AssetsTicketsService.getAssetStatsSummary();
    setAssets(data);
    setStats(summary);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, categoryFilter, statusFilter, warrantyFilter, accountFilter, activeQuickTab]);

  const formatCurrency = (valIDR: number) => {
    if (currency === 'USD') {
      return `$${Math.round(valIDR / 15300).toLocaleString('en-US')}`;
    }
    return `Rp ${(valIDR / 1_000_000).toFixed(1)}M`;
  };

  const formatTotalValue = (valIDR: number) => {
    if (currency === 'USD') {
      return `$${(valIDR / 15300 / 1_000_000).toFixed(2)}M`;
    }
    return `Rp ${(valIDR / 1_000_000_000).toFixed(2)} Miliar`;
  };

  const getStatusBadgeClass = (st: AssetStatus) => {
    switch (st) {
      case 'OPERATIONAL':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'IN_MAINTENANCE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LOANED_OUT':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold';
      case 'STANDBY_STOCK':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DEPRECATED':
      case 'DISPOSED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getWarrantyBadge = (wStatus: WarrantyStatus) => {
    switch (wStatus) {
      case 'ACTIVE':
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>;
      case 'EXPIRING_SOON':
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-800 border border-amber-400 animate-pulse">Expiring &lt;60d</span>;
      case 'EXPIRED':
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/15 text-rose-800 border border-rose-300">Expired</span>;
      default:
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">Standard</span>;
    }
  };

  const handleExportCSV = () => {
    const headers = ['Asset Tag', 'Name', 'Category', 'Vendor', 'Model', 'Serial Number', 'Account', 'Site Location', 'Rack', 'Status', 'Warranty Expiry', 'Cost IDR'];
    const rows = assets.map((a) => [
      a.assetTag,
      `"${a.name.replace(/"/g, '""')}"`,
      a.category,
      a.vendor,
      a.modelNumber,
      a.serialNumber,
      `"${a.accountName.replace(/"/g, '""')}"`,
      `"${a.siteLocation.replace(/"/g, '""')}"`,
      a.rackUnit || '',
      a.status,
      a.warrantyExpiryDate,
      a.costIDR,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PresalesOS_Asset_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Asset Inventory CSV exported successfully.');
  };

  const handleDispatchWarrantyReminder = (asset: AssetRecord) => {
    if (onSendWhatsAppAlert) {
      onSendWhatsAppAlert(
        '+62 811-9876-5432',
        `⚠️ [WARRANTY EXPIRATION ALERT] Asset ${asset.assetTag} (${asset.name}) for customer ${asset.accountName} expires on ${asset.warrantyExpiryDate}. OEM renewal quote requested.`
      );
      showToast(`WhatsApp reminder dispatched for ${asset.assetTag}`);
    }
  };

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
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Enterprise Asset Inventory & POC Demo Tracker
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                Step 25
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Complete hardware/software lifecycle tracking linked to customers, opportunities, serial numbers, warranty timers, and datacenter rack units.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>

          <button
            onClick={() => {
              setCreateIsLoaner(true);
              setIsCreateModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
          >
            <Boxes className="w-3.5 h-3.5" />
            Checkout Demo POC
          </button>

          <button
            onClick={() => {
              setCreateIsLoaner(false);
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Register Asset
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Tracked Assets</span>
            <Server className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.totalAssets ?? 0}</div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span className="font-semibold text-emerald-600">{stats?.activeOperationalCount ?? 0}</span> Operational
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">POC Demo Loaners</span>
            <Boxes className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-700">{stats?.activePocLoanersCount ?? 0}</div>
          <div className="text-[11px] text-indigo-600 font-medium">In customer lab testing</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Expiring Warranties (&lt;60d)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats?.expiringSoonWarrantiesCount ?? 0}</div>
          <div className="text-[11px] text-amber-700 font-medium">OEM Renewal Required</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">In Maintenance / RMA</span>
            <Wrench className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{stats?.inMaintenanceCount ?? 0}</div>
          <div className="text-[11px] text-slate-500">Service Tickets Active</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Capitalized Value</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{formatTotalValue(stats?.totalAssetValueIDR ?? 0)}</div>
          <div className="text-[11px] text-slate-500">Hardware & Licenses</div>
        </div>
      </div>

      {/* Quick Filter Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveQuickTab('ALL')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeQuickTab === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Assets ({stats?.totalAssets ?? 0})
        </button>

        <button
          onClick={() => setActiveQuickTab('PRODUCTION')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeQuickTab === 'PRODUCTION'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Production Deployments ({stats?.activeOperationalCount ?? 0})
        </button>

        <button
          onClick={() => setActiveQuickTab('LOANERS')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeQuickTab === 'LOANERS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Demo & POC Loaners ({stats?.activePocLoanersCount ?? 0})
        </button>

        <button
          onClick={() => setActiveQuickTab('EXPIRING')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeQuickTab === 'EXPIRING'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Expiring Warranties
          {stats && stats.expiringSoonWarrantiesCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
              {stats.expiringSoonWarrantiesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveQuickTab('MAINTENANCE')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeQuickTab === 'MAINTENANCE'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Maintenance & Repair ({stats?.inMaintenanceCount ?? 0})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by serial #, tag, model, customer, IP..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end text-xs">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="ALL">All Categories</option>
            <option value="Hardware">Hardware / Servers</option>
            <option value="Network Appliance">Network & Security</option>
            <option value="Software/License">Software / Licenses</option>
            <option value="Demo/POC Loaner">Demo / POC Loaners</option>
          </select>

          {/* Customer Account Filter */}
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="px-2.5 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="ALL">All Customer Accounts</option>
            {INITIAL_ACCOUNTS.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>

          {/* Warranty Filter */}
          <select
            value={warrantyFilter}
            onChange={(e) => setWarrantyFilter(e.target.value as any)}
            className="px-2.5 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="ALL">All Warranty States</option>
            <option value="ACTIVE">Active Warranty</option>
            <option value="EXPIRING_SOON">Expiring Soon (&lt;60d)</option>
            <option value="EXPIRED">Expired Warranty</option>
          </select>

          <button
            onClick={loadData}
            title="Refresh Registry"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Asset Table / Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
            <div className="text-xs font-semibold">Loading Asset Inventory...</div>
          </div>
        ) : assets.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Boxes className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-800">No matching assets found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search terms or filters, or register a new hardware asset.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('ALL');
                setStatusFilter('ALL');
                setWarrantyFilter('ALL');
                setAccountFilter('ALL');
                setActiveQuickTab('ALL');
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
                  <th className="py-3 px-4">Asset Tag & Serial #</th>
                  <th className="py-3 px-4">Equipment & Vendor</th>
                  <th className="py-3 px-4">Customer & Project</th>
                  <th className="py-3 px-4">Site Location & Rack</th>
                  <th className="py-3 px-4">Status & Health</th>
                  <th className="py-3 px-4">Warranty Due</th>
                  <th className="py-3 px-4 text-right">Value</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                {assets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                    onClick={() => setSelectedAsset(asset)}
                  >
                    {/* Tag & Serial */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="font-mono text-xs font-bold text-indigo-700 px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100">
                          {asset.assetTag}
                        </span>
                        <div className="font-mono text-[11px] text-slate-500 tracking-tight">
                          S/N: {asset.serialNumber}
                        </div>
                      </div>
                    </td>

                    {/* Equipment & Vendor */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 line-clamp-1">{asset.name}</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="font-medium text-slate-700">{asset.vendor}</span>
                          <span>•</span>
                          <span>{asset.category}</span>
                        </div>
                      </div>
                    </td>

                    {/* Customer & Project */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-900 truncate max-w-[180px]">
                          {asset.accountName}
                        </div>
                        {asset.opportunityTitle && (
                          <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                            {asset.opportunityTitle}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Site Location & Rack */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="text-slate-800 font-medium truncate max-w-[190px]">
                          {asset.siteLocation}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500">
                          {asset.rackUnit || 'Shelf / Desk'}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold border ${getStatusBadgeClass(asset.status)}`}>
                          {asset.status}
                        </span>
                        {asset.loanerDetails?.isLoaner && (
                          <div className="text-[10px] text-indigo-600 font-semibold">
                            Borrower: {asset.loanerDetails.borrowerEngineer}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Warranty */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {getWarrantyBadge(asset.warrantyStatus)}
                        <div className="text-[11px] text-slate-500">{asset.warrantyExpiryDate}</div>
                      </div>
                    </td>

                    {/* Cost */}
                    <td className="py-3 px-4 text-right">
                      <div className="font-bold text-slate-900">{formatCurrency(asset.costIDR)}</div>
                      <div className="text-[10px] text-slate-400">{currency}</div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        {asset.warrantyStatus === 'EXPIRING_SOON' && (
                          <button
                            onClick={() => handleDispatchWarrantyReminder(asset)}
                            title="Send Expiry Reminder (WhatsApp)"
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedAsset(asset)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          currentRole={currentRole}
          currency={currency}
          onClose={() => setSelectedAsset(null)}
          onRefresh={loadData}
          onSendWhatsAppAlert={onSendWhatsAppAlert}
          onOpenCreateTicket={(ast) => {
            if (onNavigateToTechDesk) {
              onNavigateToTechDesk(ast.id);
            }
          }}
        />
      )}

      {/* Create Asset Modal */}
      {isCreateModalOpen && (
        <CreateAssetModal
          currentProfile={currentProfile}
          currency={currency}
          prefillIsLoaner={createIsLoaner}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            showToast('New asset successfully added to inventory.');
            loadData();
          }}
        />
      )}
    </div>
  );
};
