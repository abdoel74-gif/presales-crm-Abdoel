import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  Building2,
  DollarSign,
  UserCheck,
  Calendar,
  Layers,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Opportunity, OpportunityFormData, OpportunityDbStage, Account } from '../types.ts';
import { STAGE_CONFIG, SA_OPTIONS } from '../data/initialOpportunitiesData.ts';
import { AccountsService } from '../lib/accounts-service.ts';

interface OpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: OpportunityFormData, accountMeta?: { name: string; industry: string; tier: any }) => Promise<void>;
  opportunity?: Opportunity | null;
  defaultAccountId?: string;
}

export const OpportunityModal: React.FC<OpportunityModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  opportunity,
  defaultAccountId,
}) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<OpportunityFormData>({
    accountId: defaultAccountId || '',
    code: '',
    title: '',
    stage: 'Prospecting',
    dealValue: 5000000000,
    currency: 'IDR',
    probability: 20,
    leadSource: 'Partner RFP Invitation',
    targetCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    assignedAeId: 'usr_ae_01',
    assignedSaId: 'usr_sa_01',
    meddpiccScore: 0,
    meddpiccData: {},
  });

  useEffect(() => {
    if (isOpen) {
      loadAccountsList();
      if (opportunity) {
        setFormData({
          accountId: opportunity.accountId,
          code: opportunity.code,
          title: opportunity.title,
          stage: opportunity.stage,
          dealValue: opportunity.dealValue,
          currency: opportunity.currency,
          probability: opportunity.probability,
          leadSource: opportunity.leadSource || 'Partner RFP Invitation',
          targetCloseDate: opportunity.targetCloseDate || '',
          assignedAeId: opportunity.assignedAeId,
          assignedSaId: opportunity.assignedSaId,
          meddpiccScore: opportunity.meddpiccScore,
          meddpiccData: opportunity.meddpiccData || {},
          lossReason: opportunity.lossReason,
        });
      } else {
        const randNum = Math.floor(100 + Math.random() * 900);
        setFormData({
          accountId: defaultAccountId || '',
          code: `OPP-2026-${randNum}`,
          title: '',
          stage: 'Prospecting',
          dealValue: 5000000000,
          currency: 'IDR',
          probability: 20,
          leadSource: 'Partner RFP Invitation',
          targetCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          assignedAeId: 'usr_ae_01',
          assignedSaId: 'usr_sa_01',
          meddpiccScore: 0,
          meddpiccData: {},
        });
      }
      setError(null);
    }
  }, [isOpen, opportunity, defaultAccountId]);

  const loadAccountsList = async () => {
    setLoadingAccounts(true);
    const res = await AccountsService.getAccounts({ limit: 100 });
    setAccounts(res.data);
    if (!formData.accountId && res.data.length > 0 && !defaultAccountId) {
      setFormData((prev) => ({ ...prev, accountId: res.data[0].id }));
    }
    setLoadingAccounts(false);
  };

  const handleStageChange = (newStage: OpportunityDbStage) => {
    const stageConf = STAGE_CONFIG.find((c) => c.key === newStage);
    setFormData((prev) => ({
      ...prev,
      stage: newStage,
      probability: stageConf ? stageConf.defaultProbability : prev.probability,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Opportunity title is required');
      return;
    }
    if (!formData.accountId) {
      setError('Target account must be selected');
      return;
    }

    const selectedAcc = accounts.find((a) => a.id === formData.accountId);

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(formData, selectedAcc ? { name: selectedAcc.name, industry: selectedAcc.industry, tier: selectedAcc.tier } : undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save opportunity');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div id="opportunity-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div id="opportunity-modal-container" className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-600/20 text-blue-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {opportunity ? 'Edit Sales Opportunity' : 'New Sales Opportunity & Pipeline Deal'}
              </h2>
              <p className="text-xs text-slate-500">
                Enterprise Presales OS &bull; MEDDPICC Qualification Matrix
              </p>
            </div>
          </div>
          <button
            id="close-opportunity-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Opportunity Code
              </label>
              <input
                id="opp-code-input"
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-mono focus:outline-none"
                placeholder="OPP-2026-001"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Client / Target Account <span className="text-rose-500">*</span>
              </label>
              <select
                id="opp-account-select"
                value={formData.accountId}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                disabled={loadingAccounts}
              >
                <option value="">-- Select Target Account --</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.tier} - {acc.industry})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Opportunity Deal Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="opp-title-input"
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Hybrid Cloud Datacenter Modernization & DR Sizing"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Pipeline Stage Gate
              </label>
              <select
                id="opp-stage-select"
                value={formData.stage}
                onChange={(e) => handleStageChange(e.target.value as OpportunityDbStage)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {STAGE_CONFIG.map((cfg) => (
                  <option key={cfg.key} value={cfg.key}>
                    {cfg.label} (Prob: {cfg.defaultProbability}%)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Estimated Deal Value (IDR)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                  Rp
                </div>
                <input
                  id="opp-deal-value-input"
                  type="number"
                  min="0"
                  step="50000000"
                  value={formData.dealValue}
                  onChange={(e) => setFormData({ ...formData, dealValue: Number(e.target.value) })}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Value: Rp {(formData.dealValue / 1_000_000_000).toFixed(2)} Miliar
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Win Probability (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="opp-probability-slider"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.probability}
                  onChange={(e) => setFormData({ ...formData, probability: Number(e.target.value) })}
                  className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-bold text-blue-700 w-9 text-right">
                  {formData.probability}%
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Close Date
              </label>
              <input
                id="opp-close-date-input"
                type="date"
                value={formData.targetCloseDate}
                onChange={(e) => setFormData({ ...formData, targetCloseDate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Lead Source
              </label>
              <select
                id="opp-lead-source-select"
                value={formData.leadSource}
                onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Partner RFP Invitation">Partner RFP Invitation</option>
                <option value="Executive Inbound / CTO Referral">Executive Referral</option>
                <option value="Existing Account Expansion">Account Expansion</option>
                <option value="Government e-Procurement Tender">Govt e-Procurement</option>
                <option value="Direct Sales Outbound">Direct Outbound</option>
                <option value="Marketing / Event Lead">Marketing Event</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Assigned Sales Executive (AE)
              </label>
              <select
                id="opp-assigned-ae-select"
                value={formData.assignedAeId}
                onChange={(e) => setFormData({ ...formData, assignedAeId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="usr_ae_01">Rian Hidayat (Senior AE - Financial Services)</option>
                <option value="usr_ae_02">Nadia Safitri (Enterprise AE - Telco & Gov)</option>
                <option value="usr_ae_03">Budi Santoso (Commercial AE - Manufacturing)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Assigned Solutions Architect (SA)
              </label>
              <select
                id="opp-assigned-sa-select"
                value={formData.assignedSaId || ''}
                onChange={(e) => setFormData({ ...formData, assignedSaId: e.target.value || undefined })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">-- Unassigned (Requires Presales Lead) --</option>
                {SA_OPTIONS.map((sa) => (
                  <option key={sa.id} value={sa.id}>
                    {sa.name} ({sa.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formData.stage === 'Closed_Lost' && (
            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-rose-800">
                Reason for Lost Deal (Post-Mortem Analysis)
              </label>
              <input
                id="opp-loss-reason-input"
                type="text"
                value={formData.lossReason || ''}
                onChange={(e) => setFormData({ ...formData, lossReason: e.target.value })}
                placeholder="e.g. Competitor undercut price by 25%; customer delayed project budget to FY27"
                className="w-full px-3 py-2 text-sm bg-white border border-rose-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              id="cancel-opp-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-opp-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Saving Deal...</span>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  <span>{opportunity ? 'Update Opportunity' : 'Create Pipeline Deal'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
