import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Plus,
  Search,
  Filter,
  Package,
  Layers,
  ArrowRight,
  Server,
  HardDrive,
  Shield,
  Network,
  Database,
  Cpu,
  Zap,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Trash2,
  Edit,
  Sparkles,
  ExternalLink,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import {
  SizingItem,
  SizingItemFormData,
  SizingCategory,
  PresalesRequest,
  UserRole,
} from '../types.ts';
import { SizingBoqService } from '../lib/sizing-boq-service.ts';
import { PresalesService } from '../lib/presales-service.ts';
import { SizingItemModal } from './SizingItemModal.tsx';
import { SizingCalculatorModal } from './SizingCalculatorModal.tsx';
import { VendorCatalogModal } from './VendorCatalogModal.tsx';

interface SizingEngineViewProps {
  currentRole: UserRole;
  currency: 'IDR' | 'USD';
  onNavigateToBoq?: (requestId?: string) => void;
  onSendWhatsAppAlert?: (phone: string, text: string) => void;
}

const CATEGORIES: (SizingCategory | 'ALL')[] = [
  'ALL',
  'Compute / Server',
  'Enterprise Storage (SAN/NAS)',
  'Core & Edge Networking',
  'Next-Gen Firewall & Security',
  'Virtualization & Cloud Platform',
  'Backup & Disaster Recovery',
  'Professional Services & Migration',
];

export const SizingEngineView: React.FC<SizingEngineViewProps> = ({
  currentRole,
  currency,
  onNavigateToBoq,
  onSendWhatsAppAlert,
}) => {
  const [activeRequests, setActiveRequests] = useState<PresalesRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<SizingCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [sizingItems, setSizingItems] = useState<SizingItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SizingItem | null>(null);
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);

  // Load Presales Requests & Sizing Data
  const loadData = async () => {
    setIsLoading(true);
    const [reqRes, sizeRes] = await Promise.all([
      PresalesService.getPresalesRequests(),
      SizingBoqService.getSizingItems({
        requestId: selectedRequestId !== 'ALL' ? selectedRequestId : undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        search: searchQuery || undefined,
      }),
    ]);

    if (reqRes.data) {
      setActiveRequests(reqRes.data);
    }
    if (sizeRes.data) {
      setSizingItems(sizeRes.data);
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

  // Convert selected or single item to Dynamic BOQ
  const handleConvertToBoq = async (itemIds?: string[]) => {
    const ids = itemIds || (selectedItemIds.length > 0 ? selectedItemIds : undefined);
    const targetRequestId = selectedRequestId !== 'ALL' ? selectedRequestId : sizingItems[0]?.requestId || 'req-001';

    const result = await SizingBoqService.convertSizingToBoq(targetRequestId, ids);
    if (result.error) {
      showNotification(result.error, 'error');
    } else {
      showNotification(`Successfully pushed ${result.convertedCount} sizing workload(s) to Dynamic BOQ Builder!`, 'success');
      setSelectedItemIds([]);
      loadData();
      if (onNavigateToBoq) {
        setTimeout(() => onNavigateToBoq(targetRequestId), 1200);
      }
    }
  };

  const handleSaveItem = async (formData: SizingItemFormData) => {
    if (editingItem) {
      const res = await SizingBoqService.updateSizingItem(editingItem.id, formData);
      if (res.data) {
        showNotification('Sizing workload updated successfully.', 'success');
        loadData();
      }
    } else {
      const res = await SizingBoqService.createSizingItem(formData);
      if (res.data) {
        showNotification('New sizing workload created.', 'success');
        loadData();
      }
    }
    setEditingItem(null);
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this sizing workload?')) {
      await SizingBoqService.deleteSizingItem(id);
      showNotification('Sizing workload deleted.', 'info');
      loadData();
    }
  };

  // Capacity Totals
  const totalvCPUs = sizingItems.reduce((acc, i) => acc + (i.sizingParameters?.totalvCPUs || 0), 0);
  const totalRamGb = sizingItems.reduce((acc, i) => acc + (i.sizingParameters?.targetRamGb || 0), 0);
  const totalRawStorageTb = sizingItems.reduce((acc, i) => acc + (i.sizingParameters?.rawCapacityTb || 0), 0);
  const totalRU = sizingItems.reduce((acc, i) => acc + (i.sizingParameters?.rackUnitsRu || 0), 0);
  const totalPowerWatts = sizingItems.reduce((acc, i) => acc + (i.sizingParameters?.powerConsumptionWatts || 0), 0);
  const convertedCount = sizingItems.filter((i) => i.boqConverted).length;

  const formatCurrency = (idr: number, usd: number) => {
    if (currency === 'USD') {
      return `$${usd.toLocaleString()}`;
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(idr);
  };

  return (
    <div id="sizing-engine-view" className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden select-none">
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

      {/* Main Top Header */}
      <div className="p-6 border-b border-slate-800/80 bg-slate-900/40 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  Technical Sizing Engine
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-medium">
                    Step 18 Architecture
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Multi-category infrastructure sizing, hardware vendor selection, redundancy modeling, and BOQ conversion
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="open-sizing-calc-main-btn"
              onClick={() => setIsCalculatorModalOpen(true)}
              className="text-xs font-semibold px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Calculator className="w-3.5 h-3.5 text-cyan-400" /> Sizing Calculator
            </button>

            <button
              id="open-catalog-main-btn"
              onClick={() => setIsCatalogModalOpen(true)}
              className="text-xs font-semibold px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5 text-indigo-400" /> Vendor Catalog
            </button>

            {onNavigateToBoq && (
              <button
                id="navigate-to-boq-btn"
                onClick={() => onNavigateToBoq(selectedRequestId !== 'ALL' ? selectedRequestId : undefined)}
                className="text-xs font-semibold px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl transition-all flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Dynamic BOQ Builder
              </button>
            )}

            <button
              id="add-sizing-workload-btn"
              onClick={() => {
                setEditingItem(null);
                setIsItemModalOpen(true);
              }}
              className="text-xs font-semibold px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Sizing Workload
            </button>
          </div>
        </div>

        {/* Capacity & Topology Telemetry Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5">
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Total vCPUs</span>
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono mt-1">{totalvCPUs}</div>
            <div className="text-[10px] text-slate-500">Virtual compute cores</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Cluster RAM</span>
              <Server className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono mt-1">{totalRamGb} GB</div>
            <div className="text-[10px] text-cyan-400">DDR5 Enterprise RAM</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Raw Storage</span>
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono mt-1">{totalRawStorageTb} TB</div>
            <div className="text-[10px] text-emerald-400">NVMe & SAN Array</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Datacenter RU</span>
              <Layers className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono mt-1">{totalRU} RU</div>
            <div className="text-[10px] text-slate-500">Rack space footprint</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Nominal Power</span>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono mt-1">{totalPowerWatts} W</div>
            <div className="text-[10px] text-slate-500">Heat / PDU load</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>BOQ Conversion</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono mt-1">
              {convertedCount}/{sizingItems.length}
            </div>
            <div className="text-[10px] text-emerald-400">
              {sizingItems.length > 0 ? Math.round((convertedCount / sizingItems.length) * 100) : 0}% synced to BOQ
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-900/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Request Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Request:</span>
            <select
              id="sizing-request-filter"
              value={selectedRequestId}
              onChange={(e) => setSelectedRequestId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Active Requests ({activeRequests.length})</option>
              {activeRequests.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.requestCode} - {r.accountName}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="sizing-search-input"
              type="text"
              placeholder="Search component, vendor, model, justification..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Batch Convert to BOQ Button */}
        {selectedItemIds.length > 0 && (
          <button
            id="batch-convert-boq-btn"
            onClick={() => handleConvertToBoq(selectedItemIds)}
            className="text-xs font-semibold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/20 animate-in fade-in"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Convert Selected ({selectedItemIds.length}) to BOQ
          </button>
        )}
      </div>

      {/* Category Pills Bar */}
      <div className="px-6 py-2 border-b border-slate-800/60 bg-slate-950 flex items-center gap-1.5 overflow-x-auto shrink-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-xs px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {cat === 'ALL' ? 'All Architecture Domains' : cat}
          </button>
        ))}
      </div>

      {/* Main Sizing Workloads List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
            <p className="text-xs">Loading Technical Sizing Topology...</p>
          </div>
        ) : sizingItems.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
            <Calculator className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No Sizing Workloads Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Start building your technical architecture sizing for compute, all-flash storage, leaf/spine networking, or next-gen firewalls.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => setIsCalculatorModalOpen(true)}
                className="text-xs font-semibold px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors"
              >
                Run Sizing Calculator
              </button>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setIsItemModalOpen(true);
                }}
                className="text-xs font-semibold px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors"
              >
                Add Custom Workload
              </button>
            </div>
          </div>
        ) : (
          sizingItems.map((item) => {
            const isSelected = selectedItemIds.includes(item.id);
            const p = item.sizingParameters || {};

            return (
              <div
                key={item.id}
                id={`sizing-card-${item.id}`}
                className={`bg-slate-900/80 border rounded-2xl p-5 transition-all duration-200 space-y-4 hover:border-slate-700 ${
                  isSelected ? 'border-indigo-500/80 bg-slate-900/90 shadow-lg shadow-indigo-500/10' : 'border-slate-800'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItemIds([...selectedItemIds, item.id]);
                        } else {
                          setSelectedItemIds(selectedItemIds.filter((id) => id !== item.id));
                        }
                      }}
                      className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                          {item.category}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {item.vendor}
                        </span>
                        {item.partNumber && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                            PN: {item.partNumber}
                          </span>
                        )}
                        <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/20">
                          {item.redundancy}
                        </span>
                        {item.boqConverted ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Synced to BOQ
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-medium">
                            Draft Sizing
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white mt-1.5 flex items-center gap-2">
                        {item.componentName}
                        <span className="text-xs font-normal text-slate-400">({item.quantity}x {item.model})</span>
                      </h3>
                    </div>
                  </div>

                  {/* Actions & Pricing */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <div className="text-right mr-2">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Est. Unit MSRP</div>
                      <div className="text-xs font-bold text-white font-mono">
                        {formatCurrency(item.estimatedUnitPriceIDR, item.estimatedUnitPriceUSD)}
                      </div>
                    </div>

                    {!item.boqConverted && (
                      <button
                        id={`convert-to-boq-btn-${item.id}`}
                        onClick={() => handleConvertToBoq([item.id])}
                        className="text-xs font-semibold px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg transition-colors flex items-center gap-1"
                        title="Generate commercial BOQ line item"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" /> Push to BOQ
                      </button>
                    )}

                    <button
                      id={`edit-sizing-btn-${item.id}`}
                      onClick={() => {
                        setEditingItem(item);
                        setIsItemModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                      title="Edit Sizing Workload"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      id={`delete-sizing-btn-${item.id}`}
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                      title="Delete Sizing Workload"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sizing Parameters Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 pt-1 text-xs">
                  {p.totalvCPUs && (
                    <div className="bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 block">Compute</span>
                      <span className="font-mono font-semibold text-slate-200">{p.totalvCPUs} vCPUs ({p.oversubscriptionRatio || '1:2'})</span>
                    </div>
                  )}
                  {p.targetRamGb && (
                    <div className="bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 block">Memory</span>
                      <span className="font-mono font-semibold text-slate-200">{p.targetRamGb} GB RAM</span>
                    </div>
                  )}
                  {p.rawCapacityTb && (
                    <div className="bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 block">Storage</span>
                      <span className="font-mono font-semibold text-slate-200">{p.rawCapacityTb} TB Raw ({p.raidType || 'Flash'})</span>
                    </div>
                  )}
                  {p.workloadIopsTarget && (
                    <div className="bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 block">IOPS Target</span>
                      <span className="font-mono font-semibold text-cyan-400">{p.workloadIopsTarget.toLocaleString()} IOPS</span>
                    </div>
                  )}
                  {p.rackUnitsRu && (
                    <div className="bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 block">RU Footprint</span>
                      <span className="font-mono font-semibold text-slate-200">{p.rackUnitsRu} Rack Units</span>
                    </div>
                  )}
                  {p.powerConsumptionWatts && (
                    <div className="bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 block">Power Draw</span>
                      <span className="font-mono font-semibold text-amber-400">{p.powerConsumptionWatts} Watts</span>
                    </div>
                  )}
                </div>

                {/* Technical Justification Box */}
                <div className="bg-slate-950/40 rounded-xl p-3.5 border border-slate-800/60 space-y-1.5">
                  <div className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Architecture & Sizing Justification:
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.technicalJustification}</p>
                  {item.complianceNotes && (
                    <div className="text-[11px] text-emerald-400/90 pt-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{item.complianceNotes}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sizing Workload Modal */}
      <SizingItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        item={editingItem}
        activeRequests={activeRequests}
        defaultRequestId={selectedRequestId !== 'ALL' ? selectedRequestId : activeRequests[0]?.id}
      />

      {/* Sizing Calculator Modal */}
      <SizingCalculatorModal
        isOpen={isCalculatorModalOpen}
        onClose={() => setIsCalculatorModalOpen(false)}
        onApplyCalculations={(calcCategory, params, justification) => {
          setEditingItem(null);
          setIsCalculatorModalOpen(false);
          setIsItemModalOpen(true);
        }}
      />

      {/* Vendor Catalog Quick Selector */}
      <VendorCatalogModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        onSelectProduct={(product) => {
          setIsCatalogModalOpen(false);
          setEditingItem(null);
          setIsItemModalOpen(true);
        }}
      />
    </div>
  );
};
