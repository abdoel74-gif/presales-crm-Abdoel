import React, { useState } from 'react';
import { X, Boxes, Plus, Server, Building2, MapPin, ShieldCheck, DollarSign } from 'lucide-react';
import { AssetFormData, AssetCategory, AssetStatus, UserProfile } from '../types.ts';
import { INITIAL_ACCOUNTS } from '../data/initialAccountsData.ts';
import { INITIAL_OPPORTUNITY_RECORDS } from '../data/initialOpportunitiesData.ts';
import { AssetsTicketsService } from '../lib/assets-tickets-service.ts';

interface CreateAssetModalProps {
  currentProfile?: UserProfile;
  currency: 'IDR' | 'USD';
  onClose: () => void;
  onSuccess: () => void;
  prefillAccountId?: string;
  prefillIsLoaner?: boolean;
}

export const CreateAssetModal: React.FC<CreateAssetModalProps> = ({
  currentProfile,
  currency,
  onClose,
  onSuccess,
  prefillAccountId,
  prefillIsLoaner = false,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>(prefillIsLoaner ? 'Demo/POC Loaner' : 'Hardware');
  const [vendor, setVendor] = useState('Dell Technologies');
  const [modelNumber, setModelNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [accountId, setAccountId] = useState(prefillAccountId || INITIAL_ACCOUNTS[0]?.id || 'acc_01');
  const [opportunityId, setOpportunityId] = useState('');
  const [siteLocation, setSiteLocation] = useState('DCI Indonesia Datacenter (JK1), Cibitung');
  const [rackUnit, setRackUnit] = useState('Rack 14, U20-U22');
  const [status, setStatus] = useState<AssetStatus>(prefillIsLoaner ? 'LOANED_OUT' : 'OPERATIONAL');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [warrantyExpiryDate, setWarrantyExpiryDate] = useState(
    new Date(Date.now() + 365 * 3 * 86400000).toISOString().split('T')[0]
  );
  const [costIDR, setCostIDR] = useState(450000000);
  const [supportContractTier, setSupportContractTier] = useState('24x7 Mission Critical ProSupport');
  const [contractNumber, setContractNumber] = useState('');
  const [isLoaner, setIsLoaner] = useState(prefillIsLoaner);
  const [borrowerEngineer, setBorrowerEngineer] = useState(currentProfile?.name || 'Adrian Pratama');
  const [borrowerPhone, setBorrowerPhone] = useState('+62 812-3456-7890');
  const [expectedReturnDate, setExpectedReturnDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [condition, setCondition] = useState<'Mint / Like New' | 'Good' | 'Minor Wear' | 'Needs Repair'>('Good');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedAccount = INITIAL_ACCOUNTS.find((a) => a.id === accountId);
  const accountOpportunities = INITIAL_OPPORTUNITY_RECORDS.filter(
    (o) => o.accountId === accountId || o.accountName === selectedAccount?.name
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !serialNumber.trim()) return;

    setIsSubmitting(true);
    const formData: AssetFormData = {
      name,
      category,
      vendor,
      modelNumber,
      serialNumber,
      macAddress: macAddress || undefined,
      ipAddress: ipAddress || undefined,
      accountId,
      accountName: selectedAccount?.name || 'Enterprise Customer',
      opportunityId: opportunityId || undefined,
      siteLocation,
      rackUnit: rackUnit || undefined,
      status,
      purchaseDate,
      warrantyExpiryDate,
      costIDR,
      supportContractTier,
      contractNumber: contractNumber || `CTR-${vendor.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      isLoaner,
      borrowerEngineer: isLoaner ? borrowerEngineer : undefined,
      borrowerPhone: isLoaner ? borrowerPhone : undefined,
      expectedReturnDate: isLoaner ? expectedReturnDate : undefined,
      condition: isLoaner ? condition : undefined,
      notes,
    };

    await AssetsTicketsService.createAsset(formData, currentProfile);
    setIsSubmitting(false);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {isLoaner ? 'Register POC Demo Loaner Equipment' : 'Register Enterprise Hardware / Asset'}
              </h2>
              <p className="text-xs text-slate-400">
                Track customer infrastructure, serial numbers, warranty status, and datacenter rack placement.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-800 text-xs">
          {/* Category & Loaner Switch */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Asset Category</label>
              <select
                value={category}
                onChange={(e) => {
                  const val = e.target.value as AssetCategory;
                  setCategory(val);
                  if (val === 'Demo/POC Loaner') {
                    setIsLoaner(true);
                    setStatus('LOANED_OUT');
                  }
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="Hardware">Hardware Server / Storage</option>
                <option value="Network Appliance">Network & Security Appliance</option>
                <option value="Software/License">Software / Enterprise License</option>
                <option value="Cloud/Virtual Instance">Cloud / Virtual Instance</option>
                <option value="Demo/POC Loaner">Demo / POC Field Loaner</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vendor / OEM</label>
              <select
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="Dell Technologies">Dell Technologies</option>
                <option value="Fortinet">Fortinet</option>
                <option value="Cisco Systems">Cisco Systems</option>
                <option value="Nutanix">Nutanix</option>
                <option value="Palo Alto Networks">Palo Alto Networks</option>
                <option value="Hewlett Packard Enterprise">Hewlett Packard Enterprise (HPE)</option>
                <option value="Advantech">Advantech</option>
                <option value="Red Hat / IBM">Red Hat / IBM</option>
                <option value="VMware by Broadcom">VMware by Broadcom</option>
                <option value="Other OEM">Other Enterprise Vendor</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AssetStatus)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
              >
                <option value="OPERATIONAL">OPERATIONAL (In Production)</option>
                <option value="LOANED_OUT">LOANED_OUT (POC In Field)</option>
                <option value="STANDBY_STOCK">STANDBY_STOCK (Warehouse / Lab)</option>
                <option value="IN_MAINTENANCE">IN_MAINTENANCE</option>
              </select>
            </div>
          </div>

          {/* Core Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">
                Asset Name / Description <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dell PowerEdge R760 Dual-Xeon (128 Cores, 1TB RAM)"
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">
                Model Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value)}
                placeholder="e.g. R760-24NVMe-DualPlatinum"
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
                required
              />
            </div>
          </div>

          {/* Identification Specs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">
                Serial Number (S/N) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. SN-DELL-760-99812-ID"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Management IP Address</label>
              <input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="e.g. 10.120.40.15"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">MAC Address</label>
              <input
                type="text"
                value={macAddress}
                onChange={(e) => setMacAddress(e.target.value)}
                placeholder="e.g. 00:1E:67:8B:4F:1A"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase"
              />
            </div>
          </div>

          {/* Link to Customer & Opportunity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Customer Account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                {INITIAL_ACCOUNTS.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.industry})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Linked Opportunity / SOW</label>
              <select
                value={opportunityId}
                onChange={(e) => setOpportunityId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="">Direct Deployment / No Opportunity Link</option>
                {accountOpportunities.map((opp) => (
                  <option key={opp.id} value={opp.id}>
                    {opp.code} - {opp.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Physical Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Datacenter / Physical Site Location</label>
              <input
                type="text"
                value={siteLocation}
                onChange={(e) => setSiteLocation(e.target.value)}
                placeholder="e.g. DCI Indonesia Datacenter (JK1), Cibitung"
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Rack / Unit Position</label>
              <input
                type="text"
                value={rackUnit}
                onChange={(e) => setRackUnit(e.target.value)}
                placeholder="e.g. Rack DC-14, U22-U24"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
          </div>

          {/* Warranty & Financials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Purchase Date</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Warranty Expiry Date</label>
              <input
                type="date"
                value={warrantyExpiryDate}
                onChange={(e) => setWarrantyExpiryDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Capex Value (IDR)</label>
              <input
                type="number"
                value={costIDR}
                onChange={(e) => setCostIDR(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                step="1000000"
                required
              />
            </div>
          </div>

          {/* Support Contract Tier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Support Contract Tier</label>
              <input
                type="text"
                value={supportContractTier}
                onChange={(e) => setSupportContractTier(e.target.value)}
                placeholder="e.g. 24x7 Mission Critical ProSupport Plus"
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Contract Number / SLA Code</label>
              <input
                type="text"
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
                placeholder="e.g. DELL-MS-2026-9981"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
          </div>

          {/* Demo POC Loaner Section */}
          {isLoaner && (
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-900">POC Loaner Details</span>
                <span className="text-[11px] text-indigo-600 font-semibold">Demo Pool Tracking</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Borrower Engineer</label>
                  <input
                    type="text"
                    value={borrowerEngineer}
                    onChange={(e) => setBorrowerEngineer(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Borrower Phone (WA Alert)</label>
                  <input
                    type="text"
                    value={borrowerPhone}
                    onChange={(e) => setBorrowerPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Expected Return Date</label>
                  <input
                    type="date"
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-700">Special Notes & Configuration Details</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cluster node 1 in Active-Active deployment. Transceiver model: 100G-SR4."
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'Registering Asset...' : 'Register Asset in Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
