import React, { useState, useEffect } from 'react';
import {
  X,
  Calculator,
  Package,
  Layers,
  Sparkles,
  Server,
  HardDrive,
  Shield,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import {
  SizingItem,
  SizingItemFormData,
  SizingCategory,
  SizingRedundancy,
  SizingParameters,
  ProductCatalogItem,
  PresalesRequest,
} from '../types.ts';
import { VendorCatalogModal } from './VendorCatalogModal.tsx';
import { SizingCalculatorModal } from './SizingCalculatorModal.tsx';

interface SizingItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SizingItemFormData) => void;
  item?: SizingItem | null;
  activeRequests: PresalesRequest[];
  defaultRequestId?: string;
}

const SIZING_CATEGORIES: SizingCategory[] = [
  'Compute / Server',
  'Enterprise Storage (SAN/NAS)',
  'Core & Edge Networking',
  'Next-Gen Firewall & Security',
  'Virtualization & Cloud Platform',
  'Backup & Disaster Recovery',
  'Professional Services & Migration',
];

const REDUNDANCY_OPTIONS: SizingRedundancy[] = [
  'Standalone (1.0)',
  'N+1 Redundancy',
  '2N High Availability',
  'Active-Active Cluster',
  'Multi-AZ / Geo-Redundant',
];

export const SizingItemModal: React.FC<SizingItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  item,
  activeRequests,
  defaultRequestId,
}) => {
  const [requestId, setRequestId] = useState<string>(defaultRequestId || activeRequests[0]?.id || 'req-001');
  const [category, setCategory] = useState<SizingCategory>('Compute / Server');
  const [componentName, setComponentName] = useState<string>('');
  const [vendor, setVendor] = useState<string>('Dell Technologies');
  const [model, setModel] = useState<string>('');
  const [partNumber, setPartNumber] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [redundancy, setRedundancy] = useState<SizingRedundancy>('N+1 Redundancy');
  const [estimatedUnitPriceIDR, setEstimatedUnitPriceIDR] = useState<number>(150000000);
  const [technicalJustification, setTechnicalJustification] = useState<string>('');
  const [complianceNotes, setComplianceNotes] = useState<string>('');

  // Parameters
  const [totalvCPUs, setTotalvCPUs] = useState<number>(64);
  const [targetRamGb, setTargetRamGb] = useState<number>(512);
  const [usableCapacityTb, setUsableCapacityTb] = useState<number>(45);
  const [rawCapacityTb, setRawCapacityTb] = useState<number>(45);
  const [workloadIopsTarget, setWorkloadIopsTarget] = useState<number>(200000);
  const [rackUnitsRu, setRackUnitsRu] = useState<number>(2);
  const [powerConsumptionWatts, setPowerConsumptionWatts] = useState<number>(750);

  // Sub modals
  const [isCatalogOpen, setIsCatalogOpen] = useState<boolean>(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);

  useEffect(() => {
    if (item) {
      setRequestId(item.requestId);
      setCategory(item.category);
      setComponentName(item.componentName);
      setVendor(item.vendor);
      setModel(item.model);
      setPartNumber(item.partNumber || '');
      setQuantity(item.quantity);
      setRedundancy(item.redundancy);
      setEstimatedUnitPriceIDR(item.estimatedUnitPriceIDR);
      setTechnicalJustification(item.technicalJustification);
      setComplianceNotes(item.complianceNotes || '');

      const p = item.sizingParameters || {};
      setTotalvCPUs(p.totalvCPUs || 64);
      setTargetRamGb(p.targetRamGb || 512);
      setUsableCapacityTb(p.usableCapacityTb || 45);
      setRawCapacityTb(p.rawCapacityTb || 45);
      setWorkloadIopsTarget(p.workloadIopsTarget || 200000);
      setRackUnitsRu(p.rackUnitsRu || 2);
      setPowerConsumptionWatts(p.powerConsumptionWatts || 750);
    } else {
      // Default new item values
      setRequestId(defaultRequestId || activeRequests[0]?.id || 'req-001');
      setCategory('Compute / Server');
      setComponentName('');
      setVendor('Dell Technologies');
      setModel('');
      setPartNumber('');
      setQuantity(2);
      setRedundancy('N+1 Redundancy');
      setEstimatedUnitPriceIDR(245000000);
      setTechnicalJustification('');
      setComplianceNotes('Meets technical specifications and SLA requirements.');
    }
  }, [item, isOpen, defaultRequestId, activeRequests]);

  if (!isOpen) return null;

  const handleSelectFromCatalog = (product: ProductCatalogItem) => {
    setCategory(product.category);
    setVendor(product.vendor);
    setModel(product.model);
    setPartNumber(product.partNumber);
    setComponentName(product.name);
    setEstimatedUnitPriceIDR(product.unitListPriceIDR);
    setTechnicalJustification(`Configured using certified ${product.vendor} ${product.model}. Specs: ${product.specsSummary}.`);
    setComplianceNotes(`Meets enterprise compliance standards for ${product.recommendedFor.join(', ')}.`);
  };

  const handleApplyCalculations = (
    calcCategory: SizingCategory,
    params: SizingParameters,
    justification: string
  ) => {
    setCategory(calcCategory);
    setTechnicalJustification(justification);
    if (params.totalvCPUs) setTotalvCPUs(params.totalvCPUs);
    if (params.targetRamGb) setTargetRamGb(params.targetRamGb);
    if (params.usableCapacityTb) setUsableCapacityTb(params.usableCapacityTb);
    if (params.rawCapacityTb) setRawCapacityTb(params.rawCapacityTb);
    if (params.workloadIopsTarget) setWorkloadIopsTarget(params.workloadIopsTarget);
    if (params.rackUnitsRu) setRackUnitsRu(params.rackUnitsRu);
    if (params.powerConsumptionWatts) setPowerConsumptionWatts(params.powerConsumptionWatts);
    if (params.nodeCount) setQuantity(params.nodeCount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const req = activeRequests.find((r) => r.id === requestId);

    const sizingParams: SizingParameters = {
      totalvCPUs,
      targetRamGb,
      usableCapacityTb,
      rawCapacityTb,
      workloadIopsTarget,
      rackUnitsRu,
      powerConsumptionWatts,
      nodeCount: quantity,
    };

    const formData: SizingItemFormData = {
      requestId,
      opportunityId: req?.opportunityId,
      category,
      componentName: componentName || `${vendor} ${model}`,
      vendor,
      model,
      partNumber,
      quantity,
      redundancy,
      sizingParameters: sizingParams,
      technicalJustification,
      complianceNotes,
      estimatedUnitPriceIDR,
    };

    onSave(formData);
    onClose();
  };

  return (
    <>
      <div
        id="sizing-item-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      >
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {item ? 'Edit Technical Sizing Workload' : 'Add Technical Sizing Workload'}
                </h2>
                <p className="text-xs text-slate-400">
                  Define architecture specifications, redundancy, and technical justifications
                </p>
              </div>
            </div>
            <button
              id="close-sizing-modal-btn"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Helper Action Bar */}
          <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Fast Specification Tools:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="open-catalog-quick-btn"
                onClick={() => setIsCatalogOpen(true)}
                className="text-xs font-semibold px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Package className="w-3.5 h-3.5" /> Pick from Catalog
              </button>
              <button
                type="button"
                id="open-calc-quick-btn"
                onClick={() => setIsCalculatorOpen(true)}
                className="text-xs font-semibold px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Calculator className="w-3.5 h-3.5" /> Run Sizing Calculator
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Request Linkage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Presales Request Linkage <span className="text-red-400">*</span>
                </label>
                <select
                  id="sizing-request-select"
                  value={requestId}
                  onChange={(e) => setRequestId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                >
                  {activeRequests.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.requestCode} - {r.accountName} ({r.title})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Architecture Category <span className="text-red-400">*</span>
                </label>
                <select
                  id="sizing-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SizingCategory)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {SIZING_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Component Name & Vendor */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Workload / Component Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="sizing-component-name-input"
                  type="text"
                  placeholder="e.g. Primary Compute Virtualization Cluster"
                  value={componentName}
                  onChange={(e) => setComponentName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Vendor / OEM</label>
                <input
                  id="sizing-vendor-input"
                  type="text"
                  placeholder="e.g. Dell Technologies"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Model & Part Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Model / Appliance Tier</label>
                <input
                  id="sizing-model-input"
                  type="text"
                  placeholder="e.g. PowerEdge R760 Rack Server"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Vendor Part Number (PN)</label>
                <input
                  id="sizing-pn-input"
                  type="text"
                  placeholder="e.g. DELL-R760-2U-2P"
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Quantity, Redundancy, Est Unit Price */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Quantity (Units / Nodes)
                </label>
                <input
                  id="sizing-qty-input"
                  type="number"
                  min={1}
                  max={100}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Redundancy / HA</label>
                <select
                  id="sizing-redundancy-select"
                  value={redundancy}
                  onChange={(e) => setRedundancy(e.target.value as SizingRedundancy)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {REDUNDANCY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Est. Unit Price (MSRP IDR)</label>
                <input
                  id="sizing-price-input"
                  type="number"
                  min={0}
                  step={1000000}
                  value={estimatedUnitPriceIDR}
                  onChange={(e) => setEstimatedUnitPriceIDR(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Sizing Parameters Grid */}
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Capacity & Physical Parameters
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Total vCPUs</label>
                  <input
                    type="number"
                    value={totalvCPUs}
                    onChange={(e) => setTotalvCPUs(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">RAM (GB)</label>
                  <input
                    type="number"
                    value={targetRamGb}
                    onChange={(e) => setTargetRamGb(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Storage Usable (TB)</label>
                  <input
                    type="number"
                    value={usableCapacityTb}
                    onChange={(e) => setUsableCapacityTb(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Datacenter RU</label>
                  <input
                    type="number"
                    value={rackUnitsRu}
                    onChange={(e) => setRackUnitsRu(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Technical Justification */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Technical Sizing Justification <span className="text-red-400">*</span>
              </label>
              <textarea
                id="sizing-justification-textarea"
                rows={3}
                placeholder="Detail the architecture rationale, oversubscription formulas, failure tolerance, and performance headroom..."
                value={technicalJustification}
                onChange={(e) => setTechnicalJustification(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            {/* Compliance & Standards Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Compliance & Regulatory Notes
              </label>
              <input
                id="sizing-compliance-input"
                type="text"
                placeholder="e.g. Complies with OJK Reg 38/POJK.03/2016 and Tier-3 Uptime resilience"
                value={complianceNotes}
                onChange={(e) => setComplianceNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                id="save-sizing-item-btn"
                type="submit"
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {item ? 'Save Sizing Changes' : 'Create Sizing Workload'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Embedded Sub-Modals */}
      <VendorCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onSelectProduct={handleSelectFromCatalog}
        initialCategory={category}
      />

      <SizingCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        onApplyCalculations={handleApplyCalculations}
        initialCategory={category}
      />
    </>
  );
};
