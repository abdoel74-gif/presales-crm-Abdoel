import React, { useState } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
  Info,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { ProductCatalogItem, SizingCategory } from '../types.ts';
import { ENTERPRISE_PRODUCT_CATALOG } from '../data/initialCatalogData.ts';

interface VendorCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: ProductCatalogItem) => void;
  initialCategory?: SizingCategory;
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

const VENDORS = ['ALL', 'Dell Technologies', 'HPE', 'Cisco', 'Pure Storage', 'Fortinet', 'Palo Alto Networks', 'Broadcom / VMware', 'Nutanix', 'Veeam Software', 'Presales Engineering Services'];

export const VendorCatalogModal: React.FC<VendorCatalogModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  initialCategory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<SizingCategory | 'ALL'>(initialCategory || 'ALL');
  const [selectedVendor, setSelectedVendor] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredCatalog = ENTERPRISE_PRODUCT_CATALOG.filter((item) => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (selectedVendor !== 'ALL' && item.vendor !== selectedVendor) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        item.name.toLowerCase().includes(q) ||
        item.model.toLowerCase().includes(q) ||
        item.partNumber.toLowerCase().includes(q) ||
        item.vendor.toLowerCase().includes(q) ||
        item.specsSummary.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div
      id="vendor-catalog-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Enterprise Product & Hardware Catalog
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                  Direct Vendor Feeds
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Select pre-validated vendor appliances, enterprise storage, licenses, and professional services
              </p>
            </div>
          </div>
          <button
            id="close-vendor-catalog-btn"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters bar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/50 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="catalog-search-input"
              type="text"
              placeholder="Search vendor, model, part number, specs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Vendor Filter */}
          <select
            id="catalog-vendor-filter"
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {VENDORS.map((v) => (
              <option key={v} value={v}>
                {v === 'ALL' ? 'All Vendors' : v}
              </option>
            ))}
          </select>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat === 'ALL' ? 'All Categories' : cat.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredCatalog.length === 0 ? (
            <div className="py-16 text-center">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-300">No Catalog Products Found</h3>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or vendor filter</p>
            </div>
          ) : (
            filteredCatalog.map((item) => (
              <div
                key={item.id}
                id={`catalog-card-${item.id}`}
                className="bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                      {item.vendor}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      PN: {item.partNumber}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-400">
                      {item.category}
                    </span>
                    {item.inStock && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Stocked
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                    {item.name}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-mono text-cyan-400 bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-800/30">
                      <Sparkles className="w-3 h-3" /> {item.specsSummary}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" /> Lead Time: {item.leadTimeWeeks} Wks
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-slate-500" /> {item.warrantyYears}-Yr Warranty
                    </span>
                  </div>
                </div>

                <div className="flex md:flex-col items-end justify-between md:justify-center shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <div className="text-right">
                    <div className="text-[11px] text-slate-500">List Price (MSRP)</div>
                    <div className="text-sm font-bold text-white font-mono">{formatIDR(item.unitListPriceIDR)}</div>
                    <div className="text-[10px] text-emerald-400">Std Disc: {item.standardDiscountPct}% | Marg: {item.standardMarginPct}%</div>
                  </div>

                  <button
                    id={`select-product-btn-${item.id}`}
                    onClick={() => {
                      onSelectProduct(item);
                      onClose();
                    }}
                    className="mt-2 text-xs font-semibold px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                  >
                    Select Item
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {filteredCatalog.length} vendor items</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
