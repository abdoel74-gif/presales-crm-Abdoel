import React, { useState } from 'react';
import {
  X,
  Boxes,
  Building2,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Server,
  Cpu,
  MapPin,
  Barcode,
  Wrench,
  RotateCcw,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Plus,
  Send,
} from 'lucide-react';
import { AssetRecord, AssetStatus, WarrantyStatus, UserRole } from '../types.ts';
import { AssetsTicketsService } from '../lib/assets-tickets-service.ts';

interface AssetDetailModalProps {
  asset: AssetRecord;
  currentRole: UserRole;
  currency: 'IDR' | 'USD';
  onClose: () => void;
  onRefresh: () => void;
  onSendWhatsAppAlert?: (phone: string, text: string) => void;
  onOpenCreateTicket?: (asset: AssetRecord) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  currentRole,
  currency,
  onClose,
  onRefresh,
  onSendWhatsAppAlert,
  onOpenCreateTicket,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'maintenance' | 'loaner'>('overview');
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [logType, setLogType] = useState<'Preventive' | 'Firmware Update' | 'Hardware Repair' | 'Inspection' | 'RMA Replacement'>('Preventive');
  const [logTech, setLogTech] = useState('Abdoel');
  const [logDesc, setLogDesc] = useState('');
  const [logStatus, setLogStatus] = useState<'Completed' | 'Pending Parts' | 'Scheduled'>('Completed');
  const [isReturningLoaner, setIsReturningLoaner] = useState(false);
  const [returnCondition, setReturnCondition] = useState<'Mint / Like New' | 'Good' | 'Minor Wear' | 'Needs Repair'>('Good');
  const [returnNotes, setReturnNotes] = useState('');

  const formatCurrency = (valIDR: number) => {
    if (currency === 'USD') {
      return `$${Math.round(valIDR / 15300).toLocaleString('en-US')}`;
    }
    return `Rp ${(valIDR / 1_000_000).toFixed(1)}M`;
  };

  const getStatusBadge = (status: AssetStatus) => {
    switch (status) {
      case 'OPERATIONAL':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'IN_MAINTENANCE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LOANED_OUT':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
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
        return { label: 'Active Warranty', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-300' };
      case 'EXPIRING_SOON':
        return { label: 'Expiring Soon (<60d)', color: 'bg-amber-500/15 text-amber-800 border-amber-400 font-semibold animate-pulse' };
      case 'EXPIRED':
        return { label: 'Warranty Expired', color: 'bg-rose-500/15 text-rose-800 border-rose-300 font-semibold' };
      default:
        return { label: 'Standard Support', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logDesc.trim()) return;

    await AssetsTicketsService.addMaintenanceLog(asset.id, {
      type: logType,
      technicianName: logTech,
      description: logDesc,
      status: logStatus,
    });

    setIsAddingLog(false);
    setLogDesc('');
    onRefresh();
  };

  const handleReturnLoaner = async () => {
    await AssetsTicketsService.returnLoaner(asset.id, returnCondition, returnNotes);
    setIsReturningLoaner(false);
    onRefresh();
    if (onSendWhatsAppAlert && asset.loanerDetails?.borrowerPhone) {
      onSendWhatsAppAlert(
        asset.loanerDetails.borrowerPhone,
        `✅ [POC ASSET RETURNED] Asset ${asset.assetTag} (${asset.name}) has been checked in with condition: ${returnCondition}.`
      );
    }
  };

  const warrantyInfo = getWarrantyBadge(asset.warrantyStatus);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {asset.assetTag}
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${getStatusBadge(asset.status)}`}>
                  {asset.status}
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${warrantyInfo.color}`}>
                  {warrantyInfo.label}
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
                {asset.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'overview'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Overview & Ownership
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`py-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'specs'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Technical Specifications & Site Rack
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'maintenance'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Maintenance History
              {asset.maintenanceLogs && asset.maintenanceLogs.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-bold">
                  {asset.maintenanceLogs.length}
                </span>
              )}
            </button>
            {(asset.loanerDetails?.isLoaner || asset.category === 'Demo/POC Loaner') && (
              <button
                onClick={() => setActiveTab('loaner')}
                className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'loaner'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                POC Loaner Tracker
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                  Field Loan
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onOpenCreateTicket && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCreateTicket(asset);
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 flex items-center gap-1.5 transition-colors"
              >
                <Wrench className="w-3.5 h-3.5" />
                Report Tech Incident
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top Quick Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Vendor & Category</span>
                  <div className="font-bold text-slate-900 text-sm truncate">{asset.vendor}</div>
                  <div className="text-xs text-indigo-600 font-medium">{asset.category}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Assigned Customer</span>
                  <div className="font-bold text-slate-900 text-sm truncate">{asset.accountName}</div>
                  <div className="text-xs text-slate-500 truncate">{asset.opportunityTitle || 'Direct Deployment'}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Asset Valuation</span>
                  <div className="font-bold text-slate-900 text-sm">{formatCurrency(asset.costIDR)}</div>
                  <div className="text-xs text-slate-500">Capex Value</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Warranty Expiry</span>
                  <div className="font-bold text-slate-900 text-sm">{asset.warrantyExpiryDate}</div>
                  <div className={`text-xs font-semibold ${asset.warrantyStatus === 'EXPIRING_SOON' ? 'text-amber-600' : asset.warrantyStatus === 'EXPIRED' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {asset.warrantyStatus}
                  </div>
                </div>
              </div>

              {/* Deployment & Location Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    Datacenter & Physical Site Location
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Site Location:</span>
                      <span className="font-medium text-slate-800 text-right">{asset.siteLocation}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Rack / Unit Position:</span>
                      <span className="font-mono font-medium text-slate-800">{asset.rackUnit || 'Standard Wall / Shelf'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Datacenter Zone:</span>
                      <span className="font-medium text-slate-800">{asset.datacenterZone || 'Core Production'}</span>
                    </div>
                    {asset.handoverCode && (
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Linked PM Handover:</span>
                        <span className="font-mono text-indigo-600 font-bold">{asset.handoverCode}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Support & Service Level Contract
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Support Tier:</span>
                      <span className="font-medium text-slate-800">{asset.supportContractTier || 'Standard Manufacturer'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Contract Ref #:</span>
                      <span className="font-mono font-medium text-slate-800">{asset.contractNumber || 'CTR-2026-DEFAULT'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Purchase Date:</span>
                      <span className="font-medium text-slate-800">{asset.purchaseDate}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">QR Asset Tag:</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 font-semibold">{asset.qrCodeTag || `QR-${asset.assetTag}`}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {asset.notes && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Engineering Notes & History</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{asset.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  Hardware & Identification Parameters
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 space-y-1">
                    <span className="text-slate-500">Model Number:</span>
                    <div className="font-mono font-bold text-slate-900 text-sm">{asset.modelNumber}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 space-y-1">
                    <span className="text-slate-500">Serial Number (S/N):</span>
                    <div className="font-mono font-bold text-indigo-700 text-sm">{asset.serialNumber}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 space-y-1">
                    <span className="text-slate-500">Management IP Address:</span>
                    <div className="font-mono font-semibold text-slate-900">{asset.ipAddress || 'Not Assigned / DHCP'}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 space-y-1">
                    <span className="text-slate-500">Hardware MAC Address:</span>
                    <div className="font-mono font-semibold text-slate-900">{asset.macAddress || 'N/A (Virtual / License)'}</div>
                  </div>
                </div>
              </div>

              {/* Barcode / Tag view */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Barcode className="w-8 h-8 text-slate-700" />
                  <div>
                    <div className="font-mono text-sm font-bold text-slate-900">{asset.assetTag}</div>
                    <div className="text-[11px] text-slate-500">Serial: {asset.serialNumber}</div>
                  </div>
                </div>
                <button
                  onClick={() => alert(`Tag ${asset.assetTag} verified in local registry.`)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Print Barcode Label
                </button>
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Preventive Maintenance & Repair Logs
                  </h3>
                  <p className="text-xs text-slate-500">Audit logs of all technician dispatches, firmware updates, and RMA actions.</p>
                </div>
                <button
                  onClick={() => setIsAddingLog(true)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Log Maintenance Activity
                </button>
              </div>

              {isAddingLog && (
                <form onSubmit={handleAddMaintenance} className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900">Record New Maintenance Activity</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingLog(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Maintenance Type</label>
                      <select
                        value={logType}
                        onChange={(e) => setLogType(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                      >
                        <option value="Preventive">Preventive Inspection</option>
                        <option value="Firmware Update">Firmware Update</option>
                        <option value="Hardware Repair">Hardware Repair</option>
                        <option value="RMA Replacement">RMA Replacement</option>
                        <option value="Inspection">Site Audit</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Technician Name</label>
                      <input
                        type="text"
                        value={logTech}
                        onChange={(e) => setLogTech(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                        placeholder="Engineer name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Status</label>
                      <select
                        value={logStatus}
                        onChange={(e) => setLogStatus(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                      >
                        <option value="Completed">Completed</option>
                        <option value="Pending Parts">Pending Parts</option>
                        <option value="Scheduled">Scheduled</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Activity Description & Resolution</label>
                    <textarea
                      rows={2}
                      value={logDesc}
                      onChange={(e) => setLogDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
                      placeholder="e.g. Replaced faulty fan module #3, verified air flow and temperatures."
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                    >
                      Save Maintenance Record
                    </button>
                  </div>
                </form>
              )}

              {/* Maintenance List */}
              {(!asset.maintenanceLogs || asset.maintenanceLogs.length === 0) ? (
                <div className="p-8 rounded-xl border border-dashed border-slate-300 text-center space-y-2 bg-slate-50">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <div className="text-xs font-bold text-slate-700">No Historical Maintenance Issues</div>
                  <p className="text-xs text-slate-500">Asset is operating in pristine condition with 100% health score.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {asset.maintenanceLogs.map((log) => (
                    <div key={log.id} className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                            {log.type}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            log.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {log.status}
                          </span>
                          <span className="text-[11px] text-slate-400">{log.date}</span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium">{log.description}</p>
                        <div className="text-[11px] text-slate-500">Technician: {log.technicianName}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'loaner' && asset.loanerDetails && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                      POC Demo Equipment Loan Tracker
                    </span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-600 text-white">
                    Status: {asset.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-white border border-indigo-100">
                    <span className="text-slate-500">Borrower Engineer:</span>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">{asset.loanerDetails.borrowerEngineer}</div>
                    {asset.loanerDetails.borrowerPhone && (
                      <div className="text-[11px] text-indigo-600">{asset.loanerDetails.borrowerPhone}</div>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-indigo-100">
                    <span className="text-slate-500">Checkout Date:</span>
                    <div className="font-semibold text-slate-900 text-sm mt-0.5">{asset.loanerDetails.checkoutDate}</div>
                    <div className="text-[11px] text-slate-500">Target Return: {asset.loanerDetails.expectedReturnDate}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-indigo-100">
                    <span className="text-slate-500">Hardware Condition:</span>
                    <div className="font-bold text-emerald-700 text-sm mt-0.5">{asset.loanerDetails.condition}</div>
                    <div className="text-[11px] text-slate-500">{asset.loanerDetails.actualReturnDate ? `Returned: ${asset.loanerDetails.actualReturnDate}` : 'Currently in customer lab'}</div>
                  </div>
                </div>

                {asset.loanerDetails.notes && (
                  <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-indigo-100">
                    <span className="font-bold text-slate-800">Field Purpose:</span> {asset.loanerDetails.notes}
                  </p>
                )}

                {/* Return button if currently loaned out */}
                {asset.status === 'LOANED_OUT' && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setIsReturningLoaner(true)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 flex items-center gap-1.5 shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Check-In & Return Loaner Hardware
                    </button>
                  </div>
                )}
              </div>

              {isReturningLoaner && (
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Confirm Hardware Return & Condition Audit
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Inspected Condition</label>
                      <select
                        value={returnCondition}
                        onChange={(e) => setReturnCondition(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                      >
                        <option value="Mint / Like New">Mint / Like New</option>
                        <option value="Good">Good (Ready for next POC)</option>
                        <option value="Minor Wear">Minor Wear (Cosmetic only)</option>
                        <option value="Needs Repair">Needs Repair (Move to Maintenance)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Check-in Audit Notes</label>
                      <input
                        type="text"
                        value={returnNotes}
                        onChange={(e) => setReturnNotes(e.target.value)}
                        placeholder="All cables, power bricks, and transceivers accounted for."
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setIsReturningLoaner(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReturnLoaner}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                    >
                      Confirm Hardware Check-in
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Created: {new Date(asset.createdAt).toLocaleDateString()}</span>
            <span>•</span>
            <span>Last Updated: {new Date(asset.updatedAt).toLocaleDateString()}</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
