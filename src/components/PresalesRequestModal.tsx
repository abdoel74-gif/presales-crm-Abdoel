import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Building2,
  TrendingUp,
  Clock,
  Send,
  Calendar,
  Layers,
  Cpu,
  Boxes,
  UserCheck,
  Calculator,
  ReceiptText,
  FileCheck2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  PresalesRequest,
  PresalesRequestFormData,
  PresalesRequestType,
  PresalesPriorityDb,
  Account,
  Opportunity,
  SolutionsArchitectProfile,
} from '../types.ts';
import { AccountsService } from '../lib/accounts-service.ts';
import { OpportunitiesService } from '../lib/opportunities-service.ts';
import { PresalesService } from '../lib/presales-service.ts';
import {
  PRESALES_PRIORITY_CONFIG,
  PRESALES_REQUEST_TYPES,
} from '../data/initialPresalesData.ts';
import { useAuth } from '../lib/AuthContext.tsx';

interface PresalesRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (request: PresalesRequest) => void;
  existingRequest?: PresalesRequest | null;
  defaultAccountId?: string;
  defaultOpportunityId?: string;
}

const COMMON_TECH_DOMAINS = [
  'HCI Nutanix',
  'VMware vSphere',
  'Active-Active DR',
  'All-Flash NVMe',
  'Zero-Trust SASE',
  'Fortinet NGFW',
  'Palo Alto Networks',
  'Kubernetes / OpenShift',
  'SAP HANA Certified',
  'Healthcare PACS DICOM',
  'Cloud Migration (AWS/GCP)',
  'Multi-Cloud SD-WAN',
];

export const PresalesRequestModal: React.FC<PresalesRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingRequest,
  defaultAccountId,
  defaultOpportunityId,
}) => {
  const { profile } = useAuth();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [architects, setArchitects] = useState<SolutionsArchitectProfile[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [requestType, setRequestType] = useState<PresalesRequestType>('Technical_Sizing');
  const [selectedAccountId, setSelectedAccountId] = useState(defaultAccountId || '');
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(defaultOpportunityId || '');
  const [priority, setPriority] = useState<PresalesPriorityDb>('High');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [selectedSaId, setSelectedSaId] = useState('');
  const [selectedTechDomains, setSelectedTechDomains] = useState<string[]>([]);
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [pocRequired, setPocRequired] = useState(false);
  const [sizingWorkloadsCount, setSizingWorkloadsCount] = useState<number>(10);
  const [estimatedBoqValue, setEstimatedBoqValue] = useState<number>(0);
  const [targetMarginPct, setTargetMarginPct] = useState<number>(25);
  const [scopeDescription, setScopeDescription] = useState('');
  const [technicalNotes, setTechnicalNotes] = useState('');
  const [sendWhatsAppAlert, setSendWhatsAppAlert] = useState(true);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      loadDependencies();
    }
  }, [isOpen]);

  const loadDependencies = async () => {
    setLoadingInitial(true);
    try {
      const [accRes, oppRes] = await Promise.all([
        AccountsService.getAccounts(),
        OpportunitiesService.getOpportunities(),
      ]);
      setAccounts(accRes.data);
      setOpportunities(oppRes.data);
      setArchitects(PresalesService.getSolutionsArchitects());

      if (existingRequest) {
        setTitle(existingRequest.title);
        setRequestType(existingRequest.requestType);
        setSelectedAccountId(existingRequest.accountId);
        setSelectedOpportunityId(existingRequest.opportunityId || '');
        setPriority(existingRequest.priority);
        setDeadlineDate(existingRequest.deadlineDate || '');
        setSelectedSaId(existingRequest.assignedSaId || '');
        setSelectedTechDomains(existingRequest.techDomains || []);
        setPocRequired(existingRequest.pocRequired || false);
        setSizingWorkloadsCount(existingRequest.sizingWorkloadsCount || 10);
        setEstimatedBoqValue(existingRequest.estimatedBoqValue || existingRequest.dealValue || 0);
        setTargetMarginPct(existingRequest.targetMarginPct || 25);
        setScopeDescription(existingRequest.scopeDescription || '');
        setTechnicalNotes(existingRequest.technicalNotes || '');
      } else {
        // Defaults for new request
        const defaultAccount = defaultAccountId || (accRes.data[0]?.id ?? '');
        setSelectedAccountId(defaultAccount);
        if (defaultOpportunityId) {
          setSelectedOpportunityId(defaultOpportunityId);
        }

        // Calculate default deadline (e.g. 2-3 business days ahead)
        const target = new Date();
        target.setDate(target.getDate() + 3);
        setDeadlineDate(target.toISOString().split('T')[0]);
        setSelectedTechDomains(['HCI Nutanix', 'Active-Active DR']);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInitial(false);
    }
  };

  // When account changes, filter opportunities and deal value
  useEffect(() => {
    if (selectedAccountId && !existingRequest) {
      const matchingOpps = opportunities.filter((o) => o.accountId === selectedAccountId);
      if (matchingOpps.length > 0 && !selectedOpportunityId) {
        setSelectedOpportunityId(matchingOpps[0].id);
        if (matchingOpps[0].dealValue) {
          setEstimatedBoqValue(matchingOpps[0].dealValue);
        }
      }
    }
  }, [selectedAccountId, opportunities]);

  if (!isOpen) return null;

  const handleToggleDomain = (domain: string) => {
    if (selectedTechDomains.includes(domain)) {
      setSelectedTechDomains(selectedTechDomains.filter((d) => d !== domain));
    } else {
      setSelectedTechDomains([...selectedTechDomains, domain]);
    }
  };

  const handleAddCustomDomain = () => {
    if (customDomainInput.trim() && !selectedTechDomains.includes(customDomainInput.trim())) {
      setSelectedTechDomains([...selectedTechDomains, customDomainInput.trim()]);
      setCustomDomainInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedAccountId) {
      setErrorMessage('Please fill in request title and select a customer account.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
      const selectedOpp = opportunities.find((o) => o.id === selectedOpportunityId);

      const formData: PresalesRequestFormData = {
        requestCode: existingRequest?.requestCode || `PSR-2026-${Math.floor(100 + Math.random() * 900)}`,
        title: title.trim(),
        requestType,
        accountId: selectedAccountId,
        opportunityId: selectedOpportunityId || undefined,
        priority,
        techDomains: selectedTechDomains,
        assignedAeId: profile?.id || 'usr_ae_01',
        assignedSaId: selectedSaId || undefined,
        deadlineDate,
        slaHoursTotal: PRESALES_PRIORITY_CONFIG[priority].defaultSlaHours,
        pocRequired,
        sizingWorkloadsCount,
        estimatedBoqValue,
        targetMarginPct,
        scopeDescription: scopeDescription.trim() || 'Technical architecture assessment and sizing.',
        technicalNotes: technicalNotes.trim(),
      };

      if (existingRequest) {
        const res = await PresalesService.updatePresalesRequest(existingRequest.id, formData, profile);
        if (res.error) throw new Error(res.error);
        if (res.data) onSuccess(res.data);
      } else {
        const res = await PresalesService.createPresalesRequest(
          formData,
          profile,
          selectedAccount
            ? { name: selectedAccount.name, industry: selectedAccount.industry, tier: selectedAccount.tier }
            : undefined,
          selectedOpp
            ? { code: selectedOpp.code, title: selectedOpp.title, dealValue: selectedOpp.dealValue }
            : undefined
        );
        if (res.error) throw new Error(res.error);
        if (res.data) onSuccess(res.data);
      }

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit presales request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedOppObj = opportunities.find((o) => o.id === selectedOpportunityId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-3xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">
                  {existingRequest ? 'Edit Presales Request' : 'Create Sales → Presales Request'}
                </h2>
                <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded bg-indigo-400/20 text-indigo-300 border border-indigo-400/30">
                  Step 14 &bull; Presales OS
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Dispatch RFP scoping, workload sizing, or BOQ drafting to Solutions Architecture
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Customer & Deal Linkage */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-3.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Customer Account & Pipeline Linkage</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Customer Account *
                </label>
                <select
                  required
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">-- Select Customer Account --</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.tier || 'Enterprise'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Linked Sales Opportunity
                </label>
                <select
                  value={selectedOpportunityId}
                  onChange={(e) => {
                    setSelectedOpportunityId(e.target.value);
                    const opp = opportunities.find((o) => o.id === e.target.value);
                    if (opp?.dealValue) {
                      setEstimatedBoqValue(opp.dealValue);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">-- No Direct Opportunity (Ad-Hoc Request) --</option>
                  {opportunities
                    .filter((o) => !selectedAccountId || o.accountId === selectedAccountId)
                    .map((opp) => (
                      <option key={opp.id} value={opp.id}>
                        {opp.code} - {opp.title} (Rp {(opp.dealValue / 1_000_000_000).toFixed(1)}B)
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {selectedOppObj && (
              <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span className="font-semibold text-slate-800">
                    Deal Value: Rp {(selectedOppObj.dealValue / 1_000_000_000).toFixed(2)} Miliar
                  </span>
                  <span className="text-[11px] text-slate-500">
                    &bull; Win Probability: {selectedOppObj.probability}% &bull; MEDDPICC: {selectedOppObj.meddpiccScore}%
                  </span>
                </div>
                <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-700 font-semibold">
                  Stage: {selectedOppObj.stage}
                </span>
              </div>
            )}
          </div>

          {/* Section 2: Request Scope & Classification */}
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Presales Request Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Core Banking Active-Active HCI Sizing & High-IOPS NVMe SAN SOW"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Scope / Deliverable Type *
                </label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as PresalesRequestType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {Object.entries(PRESALES_REQUEST_TYPES).map(([key, conf]) => (
                    <option key={key} value={key}>
                      {conf.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Priority & SLA Window *
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PresalesPriorityDb)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="Urgent">Urgent (24h Turnaround SLA)</option>
                  <option value="High">High (48h Turnaround SLA)</option>
                  <option value="Medium">Medium (72h Turnaround SLA)</option>
                  <option value="Low">Low (120h Standard Queue)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Target Submission Deadline</span>
                </label>
                <input
                  type="date"
                  required
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Solutions Architect Assignment */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Assigned Solutions Architect (SA Workload Balancing)</span>
              </h3>
              <span className="text-[10px] text-slate-500">
                Presales Lead can re-assign anytime
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assign Lead Solutions Architect
                </label>
                <select
                  value={selectedSaId}
                  onChange={(e) => setSelectedSaId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">-- Leave Unassigned (Queue for Presales Lead) --</option>
                  {architects.map((sa) => (
                    <option key={sa.id} value={sa.id}>
                      {sa.name} &bull; Load: {sa.activeRequestsCount}/{sa.maxCapacity} ({sa.utilizationPct}%) &bull; SLA: {sa.slaOnTimeRatePct}%
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-800">POC Hardware Loaner Required?</span>
                  <p className="text-[11px] text-slate-500">
                    Reserves demo hardware & loaner appliances
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={pocRequired}
                  onChange={(e) => setPocRequired(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Technology Domains Multi-Select */}
          <div className="space-y-2 text-xs">
            <label className="block font-semibold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                <span>Technology Domains & Solution Stacks</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                Click to toggle tags
              </span>
            </label>

            <div className="flex flex-wrap gap-1.5">
              {COMMON_TECH_DOMAINS.map((domain) => {
                const isSelected = selectedTechDomains.includes(domain);
                return (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => handleToggleDomain(domain)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-slate-100 text-slate-700 border-slate-200/80 hover:bg-slate-200'
                    }`}
                  >
                    {domain}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Add custom domain tag (e.g. Dell VxRail, Istio, Cisco ACI)..."
                value={customDomainInput}
                onChange={(e) => setCustomDomainInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomDomain();
                  }
                }}
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddCustomDomain}
                className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-semibold text-xs transition-colors"
              >
                Add Tag
              </button>
            </div>
          </div>

          {/* Section 5: Technical Details & Sizing Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Estimated Workload Count (VMs / Nodes)
              </label>
              <input
                type="number"
                min={1}
                value={sizingWorkloadsCount}
                onChange={(e) => setSizingWorkloadsCount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Estimated BOQ Value (IDR)
              </label>
              <input
                type="number"
                min={0}
                step={100000000}
                value={estimatedBoqValue}
                onChange={(e) => setEstimatedBoqValue(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Target Gross Margin (%)
              </label>
              <input
                type="number"
                min={5}
                max={60}
                step={0.5}
                value={targetMarginPct}
                onChange={(e) => setTargetMarginPct(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Section 6: Scope Description & Technical Notes */}
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Scope Description & Customer Objectives *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Describe current architecture pain points, modernization targets, high-availability parameters, or RPO/RTO goals..."
                value={scopeDescription}
                onChange={(e) => setScopeDescription(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Technical Notes, OEM Special Bids, or Constraints
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Must support existing 10GbE Cisco Nexus fabric, customer mandates FIPS 140-2 SED drives, OEM special bid discount requested..."
                value={technicalNotes}
                onChange={(e) => setTechnicalNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* WhatsApp Notification Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Send className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="text-emerald-950">
                <span className="font-bold">Automated WhatsApp SLA Alert:</span>
                <span className="text-emerald-800 block text-[11px]">
                  Instant push notification to assigned SA with request brief and countdown timer.
                </span>
              </div>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer text-emerald-900 font-semibold text-xs shrink-0">
              <input
                type="checkbox"
                checked={sendWhatsAppAlert}
                onChange={(e) => setSendWhatsAppAlert(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500"
              />
              <span>Send WhatsApp</span>
            </label>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>SLA Clock starts immediately upon submission ({PRESALES_PRIORITY_CONFIG[priority].defaultSlaHours}h)</span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Dispatching...' : existingRequest ? 'Update Request' : 'Dispatch to Presales'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
