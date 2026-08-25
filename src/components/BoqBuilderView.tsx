import React, { useState, useEffect } from 'react';
import {
  ReceiptText,
  Plus,
  Search,
  Filter,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  Percent,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Trash2,
  Edit,
  Sparkles,
  Download,
  Share2,
  RefreshCw,
  Eye,
  Lock,
  MessageSquareCode,
  Check,
  X,
  Sliders,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  BoqItem,
  BoqItemFormData,
  BoqSummary,
  BoqApprovalStatus,
  SizingCategory,
  PresalesRequest,
  UserRole,
} from '../types.ts';
import { SizingBoqService } from '../lib/sizing-boq-service.ts';
import { PresalesService } from '../lib/presales-service.ts';
import { BoqItemModal } from './BoqItemModal.tsx';
import { VendorCatalogModal } from './VendorCatalogModal.tsx';

interface BoqBuilderViewProps {
  currentRole: UserRole;
  currency: 'IDR' | 'USD';
  initialRequestId?: string;
  onNavigateToSizing?: (requestId?: string) => void;
  onSendWhatsAppAlert?: (phone: string, text: string) => void;
}

export const BoqBuilderView: React.FC<BoqBuilderViewProps> = ({
  currentRole,
  currency: appCurrency,
  initialRequestId,
  onNavigateToSizing,
  onSendWhatsAppAlert,
}) => {
  const isCommercialClearance =
    currentRole === UserRole.SUPER_ADMIN ||
    currentRole === UserRole.SALES_DIRECTOR ||
    currentRole === UserRole.PRESALES_LEAD ||
    currentRole === UserRole.SOLUTIONS_ARCHITECT;

  const isSalesDirectorOrAdmin =
    currentRole === UserRole.SUPER_ADMIN || currentRole === UserRole.SALES_DIRECTOR;

  const [activeRequests, setActiveRequests] = useState<PresalesRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string>(initialRequestId || 'req-001');
  const [viewMode, setViewMode] = useState<'COMMERCIAL' | 'TECHNICAL'>(
    isCommercialClearance ? 'COMMERCIAL' : 'TECHNICAL'
  );
  const [currencyMode, setCurrencyMode] = useState<'IDR' | 'USD'>(appCurrency);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<SizingCategory | 'ALL'>('ALL');
  const [includeOptional, setIncludeOptional] = useState<boolean>(true);

  const [boqItems, setBoqItems] = useState<BoqItem[]>([]);
  const [boqSummary, setBoqSummary] = useState<BoqSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Global Margin Slider state
  const [globalMargin, setGlobalMargin] = useState<number>(25);
  const [isGlobalMarginOpen, setIsGlobalMarginOpen] = useState(false);

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BoqItem | null>(null);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvalDecision, setApprovalDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [approvalNotes, setApprovalNotes] = useState('');

  // Load Presales Requests & BOQ Items
  const loadData = async () => {
    setIsLoading(true);
    const [reqRes, boqRes] = await Promise.all([
      PresalesService.getPresalesRequests(),
      SizingBoqService.getBoqItems({
        requestId: selectedRequestId !== 'ALL' ? selectedRequestId : undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        search: searchQuery || undefined,
      }),
    ]);

    if (reqRes.data) {
      setActiveRequests(reqRes.data);
      if (!selectedRequestId && reqRes.data.length > 0) {
        setSelectedRequestId(reqRes.data[0].id);
      }
    }

    if (boqRes.data) {
      setBoqItems(boqRes.data);
    }

    if (selectedRequestId && selectedRequestId !== 'ALL') {
      const summary = SizingBoqService.getBoqSummary(selectedRequestId);
      setBoqSummary(summary);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedRequestId, selectedCategory, searchQuery]);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Inline Margin Quick Adjustment
  const handleInlineMarginChange = async (itemId: string, newMarginPct: number) => {
    const res = await SizingBoqService.updateBoqItem(itemId, { marginPct: newMarginPct });
    if (res.data) {
      // update state
      setBoqItems((prev) => prev.map((item) => (item.id === itemId ? res.data! : item)));
      if (selectedRequestId) {
        setBoqSummary(SizingBoqService.getBoqSummary(selectedRequestId));
      }
    }
  };

  // Apply Global Margin Batch
  const handleApplyGlobalMargin = async () => {
    setIsLoading(true);
    for (const item of boqItems) {
      await SizingBoqService.updateBoqItem(item.id, { marginPct: globalMargin });
    }
    showNotification(`Updated target margin to ${globalMargin}% across all items.`, 'success');
    setIsGlobalMarginOpen(false);
    loadData();
  };

  const handleSaveItem = async (formData: BoqItemFormData) => {
    if (editingItem) {
      const res = await SizingBoqService.updateBoqItem(editingItem.id, formData);
      if (res.data) {
        showNotification('BOQ line item updated.', 'success');
        loadData();
      }
    } else {
      const res = await SizingBoqService.createBoqItem(formData);
      if (res.data) {
        showNotification('New BOQ line item added.', 'success');
        loadData();
      }
    }
    setEditingItem(null);
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this line item from the BOQ?')) {
      await SizingBoqService.deleteBoqItem(id);
      showNotification('BOQ line item deleted.', 'info');
      loadData();
    }
  };

  const handleExportCsv = () => {
    const csvContent = SizingBoqService.exportBoqToCsv(boqItems, viewMode === 'COMMERCIAL' && isCommercialClearance);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BOQ_${boqSummary?.requestCode || 'Export'}_${viewMode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification(`Exported ${boqItems.length} items to CSV (${viewMode} View)`, 'success');
  };

  // Approval Submission & Actions
  const handleSubmitForApproval = async () => {
    if (!selectedRequestId) return;
    const res = await SizingBoqService.updateBoqApproval(
      selectedRequestId,
      'PENDING_DIRECTOR_APPROVAL',
      undefined,
      'Submitted by Solutions Architect for Commercial Review.'
    );
    setBoqSummary(res.data);
    showNotification('BOQ submitted for Sales Director approval.', 'info');

    if (onSendWhatsAppAlert) {
      onSendWhatsAppAlert(
        '+62 811-9876-5432',
        `📋 [BOQ APPROVAL REQUEST] ${res.data.requestCode} (${res.data.accountName}) has been submitted for review. Total: ${formatCurrency(res.data.grandTotalIDR, res.data.grandTotalUSD)} | Blended Margin: ${res.data.blendedMarginPct}%`
      );
    }
  };

  const handleExecuteApproval = async () => {
    if (!selectedRequestId) return;
    const status: BoqApprovalStatus = approvalDecision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const res = await SizingBoqService.updateBoqApproval(
      selectedRequestId,
      status,
      currentRole === UserRole.SALES_DIRECTOR ? 'Sales Director' : 'Super Admin',
      approvalNotes
    );
    setBoqSummary(res.data);
    setApprovalModalOpen(false);
    showNotification(`BOQ ${status === 'APPROVED' ? 'Approved' : 'Rejected'}.`, status === 'APPROVED' ? 'success' : 'error');

    if (onSendWhatsAppAlert) {
      onSendWhatsAppAlert(
        '+62 812-3456-7890',
        `✅ [BOQ ${status}] ${res.data.requestCode} for ${res.data.accountName} was ${status.toLowerCase()} by Sales Director. Notes: ${approvalNotes || 'None'}`
      );
    }
  };

  // Currency Formatter Helper
  const formatCurrency = (idr: number, usd?: number) => {
    if (currencyMode === 'USD' && usd !== undefined) {
      return `$${usd.toLocaleString()}`;
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(idr);
  };

  // Group items by Category
  const categoriesInBoq = Array.from(new Set(boqItems.map((b) => b.category)));

  return (
    <div id="boq-builder-view" className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden select-none">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in slide-in-from-top duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
              : notification.type === 'error'
              ? 'bg-rose-950/90 text-rose-300 border-rose-500/40'
              : 'bg-indigo-950/90 text-indigo-300 border-indigo-500/40'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          {notification.message}
        </div>
      )}

      {/* Main Header */}
      <div className="p-6 border-b border-slate-800/80 bg-slate-900/40 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ReceiptText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    Dynamic BOQ & Pricing Builder
                  </h1>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                    Step 19 Engine
                  </span>
                  {boqSummary?.approvalStatus === 'APPROVED' && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approved by Director
                    </span>
                  )}
                  {boqSummary?.approvalStatus === 'PENDING_DIRECTOR_APPROVAL' && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Pending Director Approval
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Commercial Bill of Quantities, role-separated technical vs pricing matrix, gross margin controls, and multi-tier governance
                </p>
              </div>
            </div>
          </div>

          {/* Controls & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
              <button
                id="technical-view-tab"
                onClick={() => setViewMode('TECHNICAL')}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === 'TECHNICAL'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Technical View
              </button>

              <button
                id="commercial-view-tab"
                onClick={() => {
                  if (isCommercialClearance) {
                    setViewMode('COMMERCIAL');
                  } else {
                    showNotification('Commercial View restricted to Finance, Sales Director & Presales Leads.', 'error');
                  }
                }}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === 'COMMERCIAL'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isCommercialClearance
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 cursor-not-allowed'
                }`}
                title={!isCommercialClearance ? 'Access Restricted by RBAC' : 'View Commercial Pricing & Margins'}
              >
                {!isCommercialClearance ? <Lock className="w-3.5 h-3.5 text-slate-500" /> : <DollarSign className="w-3.5 h-3.5" />}
                Commercial View
              </button>
            </div>

            {/* Currency FX Toggle */}
            <button
              id="currency-toggle-btn"
              onClick={() => setCurrencyMode(currencyMode === 'IDR' ? 'USD' : 'IDR')}
              className="text-xs font-semibold px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all font-mono"
            >
              {currencyMode === 'IDR' ? '🇮🇩 IDR (Rp)' : '🇺🇸 USD ($)'}
            </button>

            {/* Export CSV */}
            <button
              id="export-boq-csv-btn"
              onClick={handleExportCsv}
              className="text-xs font-semibold px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" /> Export CSV
            </button>

            {/* Add Line Item */}
            <button
              id="add-boq-item-btn"
              onClick={() => {
                setEditingItem(null);
                setIsItemModalOpen(true);
              }}
              className="text-xs font-semibold px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Line Item
            </button>
          </div>
        </div>

        {/* Commercial Summary Banner */}
        {boqSummary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5">
            {/* Total Cost (Commercial only) */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Total Net Cost</span>
                <Lock className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div className="text-base font-bold text-white font-mono mt-1">
                {viewMode === 'COMMERCIAL' && isCommercialClearance
                  ? formatCurrency(boqSummary.totalCostIDR, boqSummary.totalCostUSD)
                  : '••••••••••'}
              </div>
              <div className="text-[10px] text-slate-500">Distributor Net Purchase</div>
            </div>

            {/* Total Selling Price */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Selling Subtotal</span>
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-base font-bold text-emerald-400 font-mono mt-1">
                {formatCurrency(boqSummary.totalSellingPriceIDR, boqSummary.totalSellingPriceUSD)}
              </div>
              <div className="text-[10px] text-slate-500">{boqSummary.itemCount} Core Line Items</div>
            </div>

            {/* Gross Profit Margin */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Gross Margin</span>
                <Percent className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-base font-bold text-cyan-400 font-mono mt-1">
                {viewMode === 'COMMERCIAL' && isCommercialClearance
                  ? formatCurrency(boqSummary.totalGrossMarginIDR, boqSummary.totalGrossMarginUSD)
                  : '••••••••••'}
              </div>
              <div className="text-[10px] text-slate-500">Projected Profit</div>
            </div>

            {/* Blended Margin % */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Blended Margin %</span>
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div
                className={`text-lg font-bold font-mono mt-1 ${
                  boqSummary.blendedMarginPct >= 22
                    ? 'text-emerald-400'
                    : boqSummary.blendedMarginPct >= 18
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {viewMode === 'COMMERCIAL' && isCommercialClearance
                  ? `${boqSummary.blendedMarginPct}%`
                  : '••••'}
              </div>
              <div className="text-[10px] text-slate-400">
                {boqSummary.blendedMarginPct < 18 ? '⚠️ Below 18% Target' : '✅ Healthy Margin'}
              </div>
            </div>

            {/* VAT PPN 11% */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>PPN Tax ({boqSummary.vatTaxPct}%)</span>
                <ReceiptText className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-base font-bold text-slate-300 font-mono mt-1">
                {formatCurrency(boqSummary.vatTaxAmountIDR)}
              </div>
              <div className="text-[10px] text-slate-500">Govt Mandatory VAT</div>
            </div>

            {/* Grand Total */}
            <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/40 p-3 rounded-xl">
              <div className="flex items-center justify-between text-[11px] text-emerald-300 font-semibold">
                <span>Grand Total (Inc. Tax)</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-base font-bold text-emerald-300 font-mono mt-1">
                {formatCurrency(boqSummary.grandTotalIDR, boqSummary.grandTotalUSD)}
              </div>
              <div className="text-[10px] text-emerald-400/80">Final Quotation Value</div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Governance Bar */}
      <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-900/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Request Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Presales Request:</span>
            <select
              id="boq-request-filter"
              value={selectedRequestId}
              onChange={(e) => setSelectedRequestId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {activeRequests.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.requestCode} - {r.accountName} ({r.title})
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[180px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="boq-search-input"
              type="text"
              placeholder="Search part number, item, vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Global Target Margin Adjuster */}
          {isCommercialClearance && (
            <div className="relative">
              <button
                id="global-margin-toggle-btn"
                onClick={() => setIsGlobalMarginOpen(!isGlobalMarginOpen)}
                className="text-xs font-semibold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5" /> Batch Margin Adjust
              </button>

              {isGlobalMarginOpen && (
                <div className="absolute top-full mt-2 left-0 z-30 w-72 bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Batch Target Margin %</span>
                    <span className="text-xs font-mono text-cyan-400 font-bold">{globalMargin}%</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={60}
                    step={1}
                    value={globalMargin}
                    onChange={(e) => setGlobalMargin(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setIsGlobalMarginOpen(false)}
                      className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      id="apply-global-margin-btn"
                      onClick={handleApplyGlobalMargin}
                      className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow"
                    >
                      Apply All Items
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Approval Governance Actions */}
        <div className="flex items-center gap-2">
          {boqSummary?.approvalStatus !== 'APPROVED' && (
            <button
              id="submit-boq-approval-btn"
              onClick={handleSubmitForApproval}
              className="text-xs font-semibold px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" /> Submit for Approval
            </button>
          )}

          {isSalesDirectorOrAdmin && boqSummary?.approvalStatus === 'PENDING_DIRECTOR_APPROVAL' && (
            <button
              id="director-approve-modal-btn"
              onClick={() => {
                setApprovalDecision('APPROVE');
                setApprovalModalOpen(true);
              }}
              className="text-xs font-semibold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-md shadow-emerald-600/20 transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Review & Approve BOQ
            </button>
          )}
        </div>
      </div>

      {/* Main BOQ Table Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-500" />
            <p className="text-xs">Calculating Commercial BOQ Matrix...</p>
          </div>
        ) : boqItems.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
            <ReceiptText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No BOQ Line Items Available</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Convert technical sizing workloads or manually add hardware, software licenses, and professional services line items.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              {onNavigateToSizing && (
                <button
                  onClick={() => onNavigateToSizing(selectedRequestId)}
                  className="text-xs font-semibold px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors"
                >
                  Import from Sizing Engine
                </button>
              )}
              <button
                onClick={() => {
                  setEditingItem(null);
                  setIsItemModalOpen(true);
                }}
                className="text-xs font-semibold px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors"
              >
                Add Manual Line Item
              </button>
            </div>
          </div>
        ) : (
          categoriesInBoq.map((cat) => {
            const itemsInCat = boqItems.filter((b) => b.category === cat);
            const catCost = itemsInCat.filter((b) => !b.isOptional).reduce((s, i) => s + i.extendedCostIDR, 0);
            const catSelling = itemsInCat.filter((b) => !b.isOptional).reduce((s, i) => s + i.extendedSellingPriceIDR, 0);
            const catMargin = catSelling - catCost;
            const catMarginPct = catSelling > 0 ? Number(((catMargin / catSelling) * 100).toFixed(1)) : 0;

            return (
              <div key={cat} className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                {/* Category Group Header */}
                <div className="px-5 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">{cat}</h3>
                    <span className="text-[11px] text-slate-500">({itemsInCat.length} items)</span>
                  </div>

                  {viewMode === 'COMMERCIAL' && isCommercialClearance && (
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="text-slate-400">
                        Cost: <span className="text-slate-200">{formatCurrency(catCost)}</span>
                      </span>
                      <span className="text-slate-400">
                        Selling: <span className="text-emerald-400 font-bold">{formatCurrency(catSelling)}</span>
                      </span>
                      <span className="text-cyan-400 font-semibold">Margin: {catMarginPct}%</span>
                    </div>
                  )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/40 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800/80">
                      <tr>
                        <th className="px-4 py-2.5">Item & Specifications</th>
                        <th className="px-3 py-2.5">Part Number</th>
                        <th className="px-3 py-2.5 text-center">Qty</th>
                        <th className="px-3 py-2.5 text-center">Lead Time</th>
                        <th className="px-3 py-2.5 text-center">Warranty</th>

                        {viewMode === 'COMMERCIAL' && isCommercialClearance ? (
                          <>
                            <th className="px-3 py-2.5 text-right">Unit Net Cost</th>
                            <th className="px-3 py-2.5 text-center">Margin %</th>
                            <th className="px-3 py-2.5 text-right">Unit Sell Price</th>
                            <th className="px-3 py-2.5 text-right">Ext. Sell Price</th>
                            <th className="px-3 py-2.5 text-right">Gross Margin</th>
                          </>
                        ) : (
                          <th className="px-4 py-2.5 text-right">Scope Status</th>
                        )}
                        <th className="px-3 py-2.5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {itemsInCat.map((item) => (
                        <tr
                          key={item.id}
                          id={`boq-row-${item.id}`}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            item.isOptional ? 'bg-indigo-950/10' : ''
                          }`}
                        >
                          {/* Item & Specs */}
                          <td className="px-4 py-3 max-w-sm">
                            <div className="flex items-start gap-2">
                              {item.isOptional && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 uppercase mt-0.5">
                                  Optional
                                </span>
                              )}
                              <div>
                                <div className="font-semibold text-white">{item.itemDescription}</div>
                                {item.technicalSpecs && (
                                  <div className="text-[11px] text-slate-400 line-clamp-1">{item.technicalSpecs}</div>
                                )}
                                {item.notes && <div className="text-[10px] text-amber-400/90 mt-0.5">{item.notes}</div>}
                              </div>
                            </div>
                          </td>

                          {/* Part Number */}
                          <td className="px-3 py-3 font-mono text-[11px] text-slate-300">
                            {item.partNumber}
                            <span className="text-[10px] text-slate-500 block">{item.vendor}</span>
                          </td>

                          {/* Quantity */}
                          <td className="px-3 py-3 text-center font-mono font-bold text-slate-200">
                            {item.quantity} <span className="text-[10px] text-slate-500 font-normal">{item.unit}</span>
                          </td>

                          {/* Lead time */}
                          <td className="px-3 py-3 text-center text-slate-400">{item.deliveryLeadTimeWeeks} Wks</td>

                          {/* Warranty */}
                          <td className="px-3 py-3 text-center text-slate-400">{item.warrantyYears} Yrs</td>

                          {/* Commercial Columns */}
                          {viewMode === 'COMMERCIAL' && isCommercialClearance ? (
                            <>
                              {/* Unit Cost */}
                              <td className="px-3 py-3 text-right font-mono text-slate-300">
                                {formatCurrency(item.unitCostIDR, item.unitCostUSD)}
                              </td>

                              {/* Target Margin % Slider/Input */}
                              <td className="px-3 py-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <input
                                    id={`margin-slider-${item.id}`}
                                    type="number"
                                    min={1}
                                    max={90}
                                    step={1}
                                    value={item.marginPct}
                                    onChange={(e) => handleInlineMarginChange(item.id, Number(e.target.value))}
                                    className="w-14 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-cyan-300 font-mono text-center focus:outline-none focus:border-cyan-500"
                                  />
                                  <span className="text-slate-500">%</span>
                                </div>
                              </td>

                              {/* Unit Sell Price */}
                              <td className="px-3 py-3 text-right font-mono text-emerald-400 font-medium">
                                {formatCurrency(item.unitSellingPriceIDR, item.unitSellingPriceUSD)}
                              </td>

                              {/* Extended Sell Price */}
                              <td className="px-3 py-3 text-right font-mono font-bold text-emerald-400">
                                {formatCurrency(item.extendedSellingPriceIDR, item.extendedSellingPriceUSD)}
                              </td>

                              {/* Gross Margin */}
                              <td className="px-3 py-3 text-right font-mono text-cyan-400">
                                {formatCurrency(item.grossMarginIDR, item.grossMarginUSD)}
                              </td>
                            </>
                          ) : (
                            <td className="px-4 py-3 text-right">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Active In Scope
                              </span>
                            </td>
                          )}

                          {/* Row Actions */}
                          <td className="px-3 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                id={`edit-boq-item-${item.id}`}
                                onClick={() => {
                                  setEditingItem(item);
                                  setIsItemModalOpen(true);
                                }}
                                className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors"
                                title="Edit Item"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`delete-boq-item-${item.id}`}
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 rounded bg-slate-800 text-rose-400 hover:text-rose-300 transition-colors"
                                title="Delete Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* BOQ Item Create/Edit Modal */}
      <BoqItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        item={editingItem}
        activeRequests={activeRequests}
        defaultRequestId={selectedRequestId !== 'ALL' ? selectedRequestId : activeRequests[0]?.id}
        currentRole={currentRole}
      />

      {/* Approval Modal */}
      {approvalModalOpen && (
        <div
          id="approval-decision-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" /> Sales Director BOQ Review
              </h3>
              <button onClick={() => setApprovalModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="text-slate-400">Request: <span className="text-white font-semibold">{boqSummary?.requestCode}</span></div>
                <div className="text-slate-400">Account: <span className="text-white font-semibold">{boqSummary?.accountName}</span></div>
                <div className="text-slate-400">Grand Total: <span className="text-emerald-400 font-mono font-bold">{formatCurrency(boqSummary?.grandTotalIDR || 0)}</span></div>
                <div className="text-slate-400">Blended Margin: <span className="text-cyan-400 font-mono font-bold">{boqSummary?.blendedMarginPct}%</span></div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setApprovalDecision('APPROVE')}
                    className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                      approvalDecision === 'APPROVE'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Approve Quotation
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalDecision('REJECT')}
                    className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                      approvalDecision === 'REJECT'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Reject & Request Revision
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Reviewer Notes</label>
                <textarea
                  rows={3}
                  placeholder="Approval confirmation or revision requirements..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setApprovalModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                id="confirm-approval-decision-btn"
                onClick={handleExecuteApproval}
                className={`px-4 py-2 rounded-lg text-white text-xs font-bold transition-colors ${
                  approvalDecision === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                Confirm {approvalDecision === 'APPROVE' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
