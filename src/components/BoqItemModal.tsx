import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  ReceiptText,
  DollarSign,
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  BoqItem,
  BoqItemFormData,
  SizingCategory,
  ProductCatalogItem,
  PresalesRequest,
  UserRole,
} from '../types.ts';
import { VendorCatalogModal } from './VendorCatalogModal.tsx';

interface BoqItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BoqItemFormData) => void;
  item?: BoqItem | null;
  activeRequests: PresalesRequest[];
  defaultRequestId?: string;
  currentRole: UserRole;
}

const BOQ_CATEGORIES: SizingCategory[] = [
  'Compute / Server',
  'Enterprise Storage (SAN/NAS)',
  'Core & Edge Networking',
  'Next-Gen Firewall & Security',
  'Virtualization & Cloud Platform',
  'Backup & Disaster Recovery',
  'Professional Services & Migration',
];

export const BoqItemModal: React.FC<BoqItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  item,
  activeRequests,
  defaultRequestId,
  currentRole,
}) => {
  const isCommercialAuthorized =
    currentRole === UserRole.SUPER_ADMIN ||
    currentRole === UserRole.SALES_DIRECTOR ||
    currentRole === UserRole.PRESALES_LEAD ||
    currentRole === UserRole.SOLUTIONS_ARCHITECT;

  const [requestId, setRequestId] = useState<string>(defaultRequestId || activeRequests[0]?.id || 'req-001');
  const [category, setCategory] = useState<SizingCategory>('Compute / Server');
  const [vendor, setVendor] = useState<string>('Dell Technologies');
  const [partNumber, setPartNumber] = useState<string>('');
  const [itemDescription, setItemDescription] = useState<string>('');
  const [technicalSpecs, setTechnicalSpecs] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>('Units');
  const [warrantyYears, setWarrantyYears] = useState<number>(3);
  const [deliveryLeadTimeWeeks, setDeliveryLeadTimeWeeks] = useState<number>(4);
  const [isOptional, setIsOptional] = useState<boolean>(false);

  // Pricing
  const [unitListPriceIDR, setUnitListPriceIDR] = useState<number>(245000000);
  const [vendorDiscountPct, setVendorDiscountPct] = useState<number>(35);
  const [unitCostIDR, setUnitCostIDR] = useState<number>(159250000);
  const [marginPct, setMarginPct] = useState<number>(22);
  const [unitSellingPriceIDR, setUnitSellingPriceIDR] = useState<number>(204166667);
  const [notes, setNotes] = useState<string>('');

  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  useEffect(() => {
    if (item) {
      setRequestId(item.requestId);
      setCategory(item.category);
      setVendor(item.vendor);
      setPartNumber(item.partNumber);
      setItemDescription(item.itemDescription);
      setTechnicalSpecs(item.technicalSpecs || '');
      setQuantity(item.quantity);
      setUnit(item.unit || 'Units');
      setWarrantyYears(item.warrantyYears || 3);
      setDeliveryLeadTimeWeeks(item.deliveryLeadTimeWeeks || 4);
      setIsOptional(Boolean(item.isOptional));
      setUnitListPriceIDR(item.unitListPriceIDR);
      setVendorDiscountPct(item.vendorDiscountPct);
      setUnitCostIDR(item.unitCostIDR);
      setMarginPct(item.marginPct);
      setUnitSellingPriceIDR(item.unitSellingPriceIDR);
      setNotes(item.notes || '');
    } else {
      setRequestId(defaultRequestId || activeRequests[0]?.id || 'req-001');
      setCategory('Compute / Server');
      setVendor('Dell Technologies');
      setPartNumber('');
      setItemDescription('');
      setTechnicalSpecs('');
      setQuantity(1);
      setUnit('Units');
      setWarrantyYears(3);
      setDeliveryLeadTimeWeeks(4);
      setIsOptional(false);
      setUnitListPriceIDR(245000000);
      setVendorDiscountPct(35);
      setUnitCostIDR(159250000);
      setMarginPct(22);
      setUnitSellingPriceIDR(204166667);
      setNotes('');
    }
  }, [item, isOpen, defaultRequestId, activeRequests]);

  // Recalculate cost when list price or discount changes
  const handleListPriceChange = (price: number) => {
    setUnitListPriceIDR(price);
    const cost = Math.round(price * (1 - vendorDiscountPct / 100));
    setUnitCostIDR(cost);
    setUnitSellingPriceIDR(Math.round(cost / (1 - marginPct / 100)));
  };

  const handleDiscountChange = (disc: number) => {
    setVendorDiscountPct(disc);
    const cost = Math.round(unitListPriceIDR * (1 - disc / 100));
    setUnitCostIDR(cost);
    setUnitSellingPriceIDR(Math.round(cost / (1 - marginPct / 100)));
  };

  const handleMarginChange = (margin: number) => {
    setMarginPct(margin);
    setUnitSellingPriceIDR(Math.round(unitCostIDR / (1 - margin / 100)));
  };

  const handleSellingPriceChange = (sellPrice: number) => {
    setUnitSellingPriceIDR(sellPrice);
    if (sellPrice > 0 && unitCostIDR > 0) {
      const computedMargin = Number((((sellPrice - unitCostIDR) / sellPrice) * 100).toFixed(1));
      setMarginPct(computedMargin);
    }
  };

  if (!isOpen) return null;

  const handleSelectFromCatalog = (product: ProductCatalogItem) => {
    setCategory(product.category);
    setVendor(product.vendor);
    setPartNumber(product.partNumber);
    setItemDescription(product.name);
    setTechnicalSpecs(product.specsSummary);
    setUnit(product.unit);
    setWarrantyYears(product.warrantyYears);
    setDeliveryLeadTimeWeeks(product.leadTimeWeeks);
    setUnitListPriceIDR(product.unitListPriceIDR);
    setVendorDiscountPct(product.standardDiscountPct);
    setUnitCostIDR(product.standardCostIDR);
    setMarginPct(product.standardMarginPct);
    setUnitSellingPriceIDR(Math.round(product.standardCostIDR / (1 - product.standardMarginPct / 100)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const req = activeRequests.find((r) => r.id === requestId);

    const formData: BoqItemFormData = {
      requestId,
      opportunityId: req?.opportunityId,
      sizingItemId: item?.sizingItemId,
      category,
      vendor,
      partNumber,
      itemDescription,
      technicalSpecs,
      quantity,
      unit,
      warrantyYears,
      deliveryLeadTimeWeeks,
      isOptional,
      unitListPriceIDR,
      vendorDiscountPct,
      unitCostIDR,
      marginPct,
      unitSellingPriceIDR,
      notes,
    };

    onSave(formData);
    onClose();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <>
      <div
        id="boq-item-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      >
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ReceiptText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {item ? 'Edit Dynamic BOQ Line Item' : 'Add BOQ Commercial Line Item'}
                </h2>
                <p className="text-xs text-slate-400">
                  Configure part numbers, delivery lead times, discounts, and margins
                </p>
              </div>
            </div>
            <button
              id="close-boq-modal-btn"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Helper Action Bar */}
          <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Catalog Auto-Fill:
            </span>
            <button
              type="button"
              id="boq-pick-catalog-btn"
              onClick={() => setIsCatalogOpen(true)}
              className="text-xs font-semibold px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Package className="w-3.5 h-3.5" /> Pick from Hardware Catalog
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Request Linkage & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Presales Request <span className="text-red-400">*</span>
                </label>
                <select
                  id="boq-request-select"
                  value={requestId}
                  onChange={(e) => setRequestId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                >
                  {activeRequests.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.requestCode} - {r.accountName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  BOQ Category <span className="text-red-400">*</span>
                </label>
                <select
                  id="boq-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SizingCategory)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {BOQ_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Vendor, PN, Description */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Vendor</label>
                <input
                  id="boq-vendor-input"
                  type="text"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-300 block mb-1">Part Number (PN)</label>
                <input
                  id="boq-part-number-input"
                  type="text"
                  placeholder="e.g. DELL-R760-2U-2P"
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Commercial Line Description <span className="text-red-400">*</span>
              </label>
              <input
                id="boq-description-input"
                type="text"
                placeholder="e.g. Dell PowerEdge R760 Rack Server (2x Intel Xeon Gold 6430, 512GB RAM)"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Technical Specifications & Scope
              </label>
              <textarea
                id="boq-specs-textarea"
                rows={2}
                placeholder="Hardware specs, processor model, RAM bus speed, warranty level..."
                value={technicalSpecs}
                onChange={(e) => setTechnicalSpecs(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Quantity, Unit, Lead Time, Warranty */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Quantity</label>
                <input
                  id="boq-qty-input"
                  type="number"
                  min={1}
                  max={500}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                >
                  <option value="Units">Units</option>
                  <option value="Licenses">Licenses</option>
                  <option value="Ports">Ports</option>
                  <option value="Man-Days">Man-Days</option>
                  <option value="Years">Years</option>
                  <option value="Lot">Lot</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Warranty (Years)</label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={warrantyYears}
                  onChange={(e) => setWarrantyYears(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Lead Time (Wks)</label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={deliveryLeadTimeWeeks}
                  onChange={(e) => setDeliveryLeadTimeWeeks(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                />
              </div>
            </div>

            {/* Optional Item Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <div>
                <span className="text-xs font-semibold text-white">Optional Add-On Item</span>
                <p className="text-[11px] text-slate-400">
                  Optional items are displayed separately and excluded from base grand total
                </p>
              </div>
              <input
                id="boq-optional-checkbox"
                type="checkbox"
                checked={isOptional}
                onChange={(e) => setIsOptional(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 bg-slate-800"
              />
            </div>

            {/* Commercial Pricing Matrix (Role Protected) */}
            {isCommercialAuthorized && (
              <div className="bg-slate-950/60 p-4 rounded-xl border border-emerald-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" /> Commercial Cost & Margin Calculations
                  </h4>
                  <span className="text-[10px] text-slate-400">Auto-Calculates Extended Totals</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Unit List Price (MSRP)</label>
                    <input
                      id="boq-list-price-input"
                      type="number"
                      min={0}
                      step={100000}
                      value={unitListPriceIDR}
                      onChange={(e) => handleListPriceChange(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Vendor Discount %</label>
                    <input
                      id="boq-discount-input"
                      type="number"
                      min={0}
                      max={90}
                      step={1}
                      value={vendorDiscountPct}
                      onChange={(e) => handleDiscountChange(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Unit Purchase Cost (Net)</label>
                    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-400 font-bold">
                      {formatCurrency(unitCostIDR)}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Target Margin %</label>
                    <input
                      id="boq-margin-input"
                      type="number"
                      min={1}
                      max={90}
                      step={0.5}
                      value={marginPct}
                      onChange={(e) => handleMarginChange(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] text-slate-400 block mb-1">Unit Selling Price (Customer)</label>
                    <input
                      id="boq-selling-price-input"
                      type="number"
                      min={0}
                      step={100000}
                      value={unitSellingPriceIDR}
                      onChange={(e) => handleSellingPriceChange(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-emerald-500/40 rounded-lg px-2.5 py-1.5 text-xs font-bold text-emerald-400 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-900 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Extended Cost ({quantity}x)</span>
                    <span className="font-mono font-bold text-slate-200">{formatCurrency(unitCostIDR * quantity)}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Extended Selling Price</span>
                    <span className="font-mono font-bold text-emerald-400">{formatCurrency(unitSellingPriceIDR * quantity)}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Gross Profit Margin</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {formatCurrency((unitSellingPriceIDR - unitCostIDR) * quantity)} ({marginPct}%)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Internal Notes & Remarks</label>
              <input
                id="boq-notes-input"
                type="text"
                placeholder="Distributor quotation reference, special deal registration code..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
                id="save-boq-item-btn"
                type="submit"
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {item ? 'Save BOQ Changes' : 'Add to BOQ'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Catalog Modal */}
      <VendorCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onSelectProduct={handleSelectFromCatalog}
        initialCategory={category}
      />
    </>
  );
};
