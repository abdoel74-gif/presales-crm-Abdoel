import React, { useState, useEffect } from 'react';
import { X, LifeBuoy, Plus, Server, Building2, User, Clock, AlertTriangle } from 'lucide-react';
import {
  TicketFormData,
  TicketPriority,
  TicketCategory,
  UserProfile,
  AssetRecord,
} from '../types.ts';
import { INITIAL_ACCOUNTS } from '../data/initialAccountsData.ts';
import { AssetsTicketsService, getSlaHoursForPriority } from '../lib/assets-tickets-service.ts';

interface CreateTicketModalProps {
  currentProfile?: UserProfile;
  prefillAssetId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  currentProfile,
  prefillAssetId,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('INCIDENT');
  const [priority, setPriority] = useState<TicketPriority>('URGENT_24H');
  const [accountId, setAccountId] = useState(INITIAL_ACCOUNTS[0]?.id || 'acc_01');
  const [assetId, setAssetId] = useState(prefillAssetId || '');
  const [reporterName, setReporterName] = useState('Budi Santoso');
  const [reporterEmail, setReporterEmail] = useState('budi.santoso@bankmandiri.co.id');
  const [reporterPhone, setReporterPhone] = useState('+62 811-9876-5432');
  const [assigneeName, setAssigneeName] = useState(currentProfile?.name || 'Abdoel');
  const [tagInput, setTagInput] = useState('Production, HighAvailability');
  const [availableAssets, setAvailableAssets] = useState<AssetRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadAssets() {
      const { data } = await AssetsTicketsService.getAssets();
      setAvailableAssets(data);
      if (prefillAssetId) {
        const found = data.find((a) => a.id === prefillAssetId);
        if (found) {
          setAccountId(found.accountId);
          setTitle(`Hardware Incident: ${found.name} (${found.assetTag})`);
        }
      }
    }
    loadAssets();
  }, [prefillAssetId]);

  const selectedAccount = INITIAL_ACCOUNTS.find((a) => a.id === accountId);
  const accountAssets = availableAssets.filter((a) => a.accountId === accountId);
  const slaHours = getSlaHoursForPriority(priority);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const formData: TicketFormData = {
      title,
      description,
      category,
      priority,
      accountId,
      accountName: selectedAccount?.name || 'Enterprise Customer',
      assetId: assetId || undefined,
      assigneeName,
      reporterName,
      reporterEmail,
      reporterPhone,
      tags: tags.length > 0 ? tags : [category, priority],
    };

    await AssetsTicketsService.createTicket(formData, currentProfile);
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
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Create Technical Support / Incident Ticket
              </h2>
              <p className="text-xs text-slate-400">
                Dispatch support request with guaranteed SLA tracking, customer notification, and asset linking.
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-slate-800 text-xs">
          {/* Priority & Category & SLA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ticket Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="INCIDENT">INCIDENT (Production Down/Degraded)</option>
                <option value="HARDWARE_RMA">HARDWARE RMA (Component Failure)</option>
                <option value="CHANGE_REQUEST">CHANGE REQUEST (Config/Firmware)</option>
                <option value="PERFORMANCE_TUNING">PERFORMANCE TUNING</option>
                <option value="POST_SALES_COMMISSIONING">POST SALES COMMISSIONING</option>
                <option value="PRESALES_INQUIRY">PRESALES TECHNICAL INQUIRY</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Severity & Priority SLA</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-rose-700"
              >
                <option value="URGENT_24H">URGENT (24-Hour SLA Guarantee)</option>
                <option value="HIGH_48H">HIGH (48-Hour SLA)</option>
                <option value="MEDIUM">MEDIUM (72-Hour SLA)</option>
                <option value="LOW">LOW (120-Hour Standard Inquiry)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">SLA Target Resolution</label>
              <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-indigo-900">{slaHours} Hours Maximum</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-700">
              Ticket Subject / Issue Summary <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. FortiGate 600F Cluster Failover Triggered on Port 4"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              required
            />
          </div>

          {/* Customer & Asset Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Customer Account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
              >
                {INITIAL_ACCOUNTS.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Linked Customer Hardware / Asset</label>
              <select
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
              >
                <option value="">General / Non-Asset Issue</option>
                {accountAssets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.assetTag} - {a.name} (S/N: {a.serialNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-700">
              Detailed Problem Description & Diagnostic Logs <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail error codes, LED indicators, impact on production traffic, and troubleshooting steps already attempted..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              required
            />
          </div>

          {/* Reporter & Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Reporter / Customer SPOC</label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Reporter Email</label>
              <input
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Phone (WhatsApp SLA Alerts)</label>
              <input
                type="text"
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
              />
            </div>
          </div>

          {/* Assignee & Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Assigned Solutions Architect</label>
              <input
                type="text"
                value={assigneeName}
                onChange={(e) => setAssigneeName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Tags (comma-separated)</label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Firewall, Datacenter, Urgent"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
              />
            </div>
          </div>

          {/* Actions */}
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
              {isSubmitting ? 'Opening Ticket...' : 'Dispatch Ticket to Tech Desk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
