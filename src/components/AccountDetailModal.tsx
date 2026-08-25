import React, { useState, useEffect } from 'react';
import {
  Building2,
  X,
  Globe,
  MapPin,
  User,
  Users,
  Plus,
  Trash2,
  Mail,
  Phone,
  Briefcase,
  TrendingUp,
  Shield,
  Star,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Account, Contact, ContactFormData, DecisionRole } from '../types.ts';
import { OpportunitiesService } from '../lib/opportunities-service.ts';
import { Opportunity } from '../types.ts';
import { STAGE_CONFIG } from '../data/initialOpportunitiesData.ts';
import { accountsService } from '../lib/accounts-service.ts';

interface AccountDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
  onRefreshAccount: (accountId: string) => Promise<void>;
  onEditAccount: (account: Account) => void;
}

export const AccountDetailModal: React.FC<AccountDetailModalProps> = ({
  isOpen,
  onClose,
  account,
  onRefreshAccount,
  onEditAccount,
}) => {
  const [activeTab, setActiveTab] = useState<'stakeholders' | 'overview' | 'opportunities'>('stakeholders');
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [contactForm, setContactForm] = useState<ContactFormData>({
    accountId: account?.id || '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    department: '',
    decisionRole: 'Champion',
    isPrimary: false,
  });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [accountOpportunities, setAccountOpportunities] = useState<Opportunity[]>([]);
  const [loadingOpps, setLoadingOpps] = useState(false);

  useEffect(() => {
    if (isOpen && account && activeTab === 'opportunities') {
      loadAccountOpportunities();
    }
  }, [isOpen, account?.id, activeTab]);

  const loadAccountOpportunities = async () => {
    if (!account) return;
    setLoadingOpps(true);
    const res = await OpportunitiesService.getOpportunities({ accountId: account.id });
    setAccountOpportunities(res.data);
    setLoadingOpps(false);
  };

  if (!isOpen || !account) return null;

  const contacts = account.contacts || [];

  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.firstName.trim()) {
      setContactError('First Name is required.');
      return;
    }

    setIsSubmittingContact(true);
    setContactError(null);

    try {
      await accountsService.createContact({
        ...contactForm,
        accountId: account.id,
      });
      await onRefreshAccount(account.id);
      setIsAddingContact(false);
      setContactForm({
        accountId: account.id,
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        jobTitle: '',
        department: '',
        decisionRole: 'Champion',
        isPrimary: false,
      });
    } catch (err: any) {
      setContactError(err.message || 'Failed to add contact.');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (confirm('Are you sure you want to remove this stakeholder from the buying center?')) {
      await accountsService.deleteContact(contactId, account.id);
      await onRefreshAccount(account.id);
    }
  };

  const getDecisionRoleBadge = (role?: DecisionRole) => {
    switch (role) {
      case 'Economic Buyer':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Champion':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Technical Evaluator':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Influencer':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Gatekeeper':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'Strategic':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Tier-1':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Tier-2':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Dossier */}
        <div className="bg-slate-900 px-6 py-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 font-bold text-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg tracking-tight">{account.name}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getTierBadge(account.tier)}`}>
                  {account.tier}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  {account.code}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>{account.industry}</span>
                <span>•</span>
                <span>{account.city || 'Indonesia'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEditAccount(account)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
            >
              Edit Account
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 bg-slate-50 flex items-center gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('stakeholders')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'stakeholders'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Buying Center Stakeholders ({contacts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Organization Dossier</span>
          </button>
          <button
            onClick={() => setActiveTab('opportunities')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'opportunities'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Opportunities ({account.opportunitiesCount || 0})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: BUYING CENTER STAKEHOLDERS */}
          {activeTab === 'stakeholders' && (
            <div className="space-y-6">
              {/* Header & Add Button */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Stakeholder Decision Matrix (MEDDPICC)</h3>
                  <p className="text-xs text-slate-500">
                    Map organizational power, champions, economic buyers, and technical evaluators.
                  </p>
                </div>
                {!isAddingContact && (
                  <button
                    onClick={() => setIsAddingContact(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Stakeholder</span>
                  </button>
                )}
              </div>

              {/* Add Contact Inline Card */}
              {isAddingContact && (
                <form
                  onSubmit={handleAddContactSubmit}
                  className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 space-y-4 animate-in fade-in zoom-in-98 duration-150"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                    <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-indigo-600" />
                      <span>New Stakeholder Profile</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingContact(false)}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                  </div>

                  {contactError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{contactError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        value={contactForm.firstName}
                        onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                        placeholder="e.g. Hendra"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={contactForm.lastName}
                        onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                        placeholder="e.g. Gunawan"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Job Title</label>
                      <input
                        type="text"
                        value={contactForm.jobTitle}
                        onChange={(e) => setContactForm({ ...contactForm, jobTitle: e.target.value })}
                        placeholder="e.g. Head of IT Infrastructure"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="hendra.g@company.co.id"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Phone / WhatsApp</label>
                      <input
                        type="tel"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        placeholder="+62 812-xxxx-xxxx"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Decision Role (MEDDPICC)</label>
                      <select
                        value={contactForm.decisionRole}
                        onChange={(e) => setContactForm({ ...contactForm, decisionRole: e.target.value as DecisionRole })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                      >
                        <option value="Champion">Champion (Internal Advocate)</option>
                        <option value="Economic Buyer">Economic Buyer (Budget Authority)</option>
                        <option value="Technical Evaluator">Technical Evaluator (Architecture Sign-off)</option>
                        <option value="Influencer">Influencer</option>
                        <option value="Gatekeeper">Gatekeeper (Procurement / Legal)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contactForm.isPrimary}
                        onChange={(e) => setContactForm({ ...contactForm, isPrimary: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Set as Primary Contact for this Account</span>
                    </label>

                    <button
                      type="submit"
                      disabled={isSubmittingContact}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {isSubmittingContact ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>Save Stakeholder</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Contacts Grid */}
              {contacts.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h4 className="text-xs font-bold text-slate-700">No stakeholders registered yet</h4>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                    Map out key decision makers, champions, and evaluators to qualify MEDDPICC deal readiness.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-xs text-slate-900">
                                {contact.firstName} {contact.lastName}
                              </h4>
                              {contact.isPrimary && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                  Primary
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {contact.jobTitle || 'Executive'} {contact.department ? `• ${contact.department}` : ''}
                            </p>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getDecisionRoleBadge(contact.decisionRole)}`}>
                            {contact.decisionRole || 'Stakeholder'}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                          {contact.email && (
                            <div className="flex items-center gap-2 truncate">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{contact.email}</span>
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end">
                        <button
                          onClick={() => handleDeleteContact(contact.id)}
                          className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: OVERVIEW DOSSIER */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Metadata */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>Enterprise Details</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block">Industry</span>
                      <span className="font-semibold text-slate-800">{account.industry}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block">Account Tier</span>
                      <span className="font-semibold text-indigo-700">{account.tier}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block">Status</span>
                      <span className="font-semibold text-emerald-700">{account.status}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block">Assigned AE</span>
                      <span className="font-semibold text-slate-800">{account.assignedAeName || 'Rian Hidayat'}</span>
                    </div>
                  </div>
                </div>

                {/* Location & Web */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    <span>Location & Channels</span>
                  </h4>
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block">Address</span>
                      <span className="font-medium text-slate-700">{account.address || 'Central Headquarters'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block">City & Region</span>
                      <span className="font-medium text-slate-700">{account.city || 'Jakarta'}, {account.country || 'Indonesia'}</span>
                    </div>
                    {account.website && (
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-semibold block">Website</span>
                        <a
                          href={account.website}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-indigo-600 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <span>{account.website}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LINKED OPPORTUNITIES */}
          {activeTab === 'opportunities' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500">Total Lifetime Deal Value</span>
                  <div className="text-lg font-bold text-slate-900 font-mono">
                    Rp {((account.totalDealValue || 0) / 1000000000).toFixed(2)} Miliar
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">Opportunities Count</span>
                  <div className="text-lg font-bold text-indigo-600">
                    {accountOpportunities.length || account.opportunitiesCount || 0} Deals
                  </div>
                </div>
              </div>

              {loadingOpps ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Loading account opportunities...
                </div>
              ) : accountOpportunities.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                  No opportunities linked to this account yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {accountOpportunities.map((opp) => {
                    const stageConf = STAGE_CONFIG.find((c) => c.key === opp.stage);
                    return (
                      <div
                        key={opp.id}
                        className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 transition-colors flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                              {opp.code}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                                stageConf?.bgLight || 'bg-slate-100'
                              } ${stageConf?.color || 'text-slate-700'}`}
                            >
                              {stageConf?.shortLabel || opp.stage}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900">{opp.title}</h4>
                          <p className="text-[11px] text-slate-500">
                            AE: {opp.assignedAeName || 'Rian Hidayat'} &bull; SA: {opp.assignedSaName || 'Abdoel'} &bull; Target: {opp.targetCloseDate || 'Q4 2026'}
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-900 font-mono">
                            Rp {(opp.dealValue / 1_000_000_000).toFixed(2)} M
                          </div>
                          <span className="text-[10px] font-semibold text-emerald-600">
                            MEDDPICC: {opp.meddpiccScore}% ({opp.probability}% Win)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
