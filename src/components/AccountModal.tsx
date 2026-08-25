import React, { useState, useEffect } from 'react';
import { Building2, X, Globe, MapPin, User, Tag, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { Account, AccountFormData, AccountTier, AccountStatus } from '../types.ts';
import { INDUSTRY_OPTIONS, AE_OPTIONS } from '../data/initialAccountsData.ts';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: AccountFormData, id?: string) => Promise<void>;
  account?: Account | null;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  account,
}) => {
  const isEdit = Boolean(account);

  const [formData, setFormData] = useState<AccountFormData>({
    code: '',
    name: '',
    industry: 'Banking & Financial Services',
    tier: 'Tier-1',
    website: '',
    address: '',
    city: 'Jakarta',
    country: 'Indonesia',
    assignedAeId: 'usr_ae_01',
    status: 'Active',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (account) {
      setFormData({
        code: account.code || '',
        name: account.name || '',
        industry: account.industry || 'Banking & Financial Services',
        tier: account.tier || 'Tier-1',
        website: account.website || '',
        address: account.address || '',
        city: account.city || 'Jakarta',
        country: account.country || 'Indonesia',
        assignedAeId: account.assignedAeId || 'usr_ae_01',
        status: account.status || 'Active',
      });
    } else {
      // Auto generate code suggestion for new account
      const rand = Math.floor(100 + Math.random() * 900);
      setFormData({
        code: `ACC-ENT-${rand}`,
        name: '',
        industry: 'Banking & Financial Services',
        tier: 'Tier-1',
        website: '',
        address: '',
        city: 'Jakarta',
        country: 'Indonesia',
        assignedAeId: 'usr_ae_01',
        status: 'Active',
      });
    }
    setErrorMessage(null);
  }, [account, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMessage('Account Name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setErrorMessage('Account Code is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSave(formData, account?.id);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">
                {isEdit ? `Edit Account: ${account?.name}` : 'Create New Enterprise Account'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEdit ? 'Update enterprise dossier, buying tier, and CRM details' : 'Register a new enterprise client in the CRM repository'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Account Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Account Code <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. ACC-BNK-001"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* Account Tier */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Strategic Tier <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value as AccountTier })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
              >
                <option value="Strategic">Strategic Tier (Top Enterprise)</option>
                <option value="Tier-1">Tier-1 Enterprise</option>
                <option value="Tier-2">Tier-2 Commercial</option>
                <option value="SMB">SMB / Mid-Market</option>
              </select>
            </div>
          </div>

          {/* Account Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Account / Organization Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. PT Bank Central Asia Tbk"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Industry */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Industry Vertical <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                {INDUSTRY_OPTIONS.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Lifecycle Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as AccountStatus })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              >
                <option value="Active">Active (Engaged Customer)</option>
                <option value="Prospect">Prospect (Pipeline Inbound)</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Website */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Corporate Website
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://company.co.id"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Assigned AE */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Assigned Account Executive (AE)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={formData.assignedAeId}
                  onChange={(e) => setFormData({ ...formData, assignedAeId: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  {AE_OPTIONS.map((ae) => (
                    <option key={ae.id} value={ae.id}>
                      {ae.name} ({ae.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Address & City */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Headquarters Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, Building, Floor"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Jakarta Selatan"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-60"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>{isEdit ? 'Save Changes' : 'Create Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
