import React, { useState } from 'react';
import {
  X,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Calendar,
  DollarSign,
  User,
  Building,
  ArrowRight,
  Printer,
  Download,
  Share2,
  Edit3,
  Save,
  Plus,
  Trash2,
  Send,
  Sparkles,
} from 'lucide-react';
import {
  SowDocument,
  SowStatus,
  SowDeliverable,
  SowRaciItem,
  SowTimelinePhase,
  SowPaymentMilestone,
  UserProfile,
  UserRole,
} from '../types.ts';
import { SowHandoverService } from '../lib/sow-handover-service.ts';

interface SowDetailModalProps {
  sow: SowDocument;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedSow: SowDocument) => void;
  currentUserRole?: UserRole;
  currentProfile?: UserProfile;
  currency?: 'IDR' | 'USD';
}

export const SowDetailModal: React.FC<SowDetailModalProps> = ({
  sow,
  isOpen,
  onClose,
  onUpdated,
  currentUserRole,
  currentProfile,
  currency = 'IDR',
}) => {
  const [activeTab, setActiveTab] = useState<
    'scope' | 'deliverables' | 'raci' | 'timeline' | 'commercial' | 'governance' | 'preview'
  >('scope');
  const [isEditing, setIsEditing] = useState(false);
  const [executiveSummary, setExecutiveSummary] = useState(sow.executiveSummary);
  const [projectBackground, setProjectBackground] = useState(sow.projectBackground);
  const [inScopeItems, setInScopeItems] = useState<string[]>(sow.scopeInScope || []);
  const [outScopeItems, setOutScopeItems] = useState<string[]>(sow.scopeOutOfScope || []);
  const [newInScopeText, setNewInScopeText] = useState('');
  const [newOutScopeText, setNewOutScopeText] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const formatCurrency = (valIDR: number, valUSD?: number) => {
    if (currency === 'USD' && valUSD) {
      return `$${valUSD.toLocaleString('en-US')}`;
    }
    return `IDR ${(valIDR || 0).toLocaleString('id-ID')}`;
  };

  const getStatusBadge = (status: SowStatus) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-semibold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Approved for Submission</span>;
      case 'CLIENT_SIGNED':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 border border-blue-300 rounded-full text-xs font-semibold flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Client Signed (Executed)</span>;
      case 'LEGAL_SALES_REVIEW':
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-xs font-semibold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Legal & Sales Review</span>;
      case 'INTERNAL_REVIEW':
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 border border-purple-300 rounded-full text-xs font-semibold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Internal Presales Review</span>;
      case 'REJECTED':
        return <span className="px-3 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded-full text-xs font-semibold flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Rejected / Needs Revision</span>;
      case 'DRAFT':
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-300 rounded-full text-xs font-semibold flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Draft SOW</span>;
    }
  };

  const handleSaveScopeEdits = async () => {
    setIsSubmitting(true);
    const { data, error } = await SowHandoverService.updateSowDocument(sow.id, {
      executiveSummary,
      projectBackground,
      scopeInScope: inScopeItems,
      scopeOutOfScope: outScopeItems,
    });
    setIsSubmitting(false);
    if (data) {
      onUpdated(data);
      setIsEditing(false);
      setStatusMessage('SOW scope baseline updated successfully.');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleStatusTransition = async (newStatus: SowStatus) => {
    setIsSubmitting(true);
    const { data, error } = await SowHandoverService.transitionSowStatus(sow.id, newStatus, currentProfile);
    setIsSubmitting(false);
    if (data) {
      onUpdated(data);
      setStatusMessage(`SOW status moved to ${newStatus}.`);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleSignApproval = async (approvalId: string, status: 'APPROVED' | 'REJECTED') => {
    if (!currentProfile) return;
    setIsSubmitting(true);
    const { data, error } = await SowHandoverService.signGovernanceApproval(
      sow.id,
      approvalId,
      currentProfile,
      status
    );
    setIsSubmitting(false);
    if (data) {
      onUpdated(data);
      setStatusMessage(`Governance signature recorded.`);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleAddInScope = () => {
    if (!newInScopeText.trim()) return;
    setInScopeItems([...inScopeItems, newInScopeText.trim()]);
    setNewInScopeText('');
  };

  const handleRemoveInScope = (index: number) => {
    setInScopeItems(inScopeItems.filter((_, i) => i !== index));
  };

  const handleAddOutScope = () => {
    if (!newOutScopeText.trim()) return;
    setOutScopeItems([...outScopeItems, newOutScopeText.trim()]);
    setNewOutScopeText('');
  };

  const handleRemoveOutScope = (index: number) => {
    setOutScopeItems(outScopeItems.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700">
                  {sow.documentNumber}
                </span>
                <span className="text-xs text-slate-400 font-mono">Ver {sow.version}</span>
                {getStatusBadge(sow.status)}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5 flex items-center gap-2">
                {sow.opportunityTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('preview')}
              className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Print / PDF View</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Context Bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Customer Account</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              {sow.accountName}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Customer Signer SPOC</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              {sow.customerContactName}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Total Contract Value</span>
            <span className="font-bold text-blue-700 mt-0.5 block">
              {formatCurrency(sow.commercialTerms.totalContractValueIDR, sow.commercialTerms.totalContractValueUSD)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Author & Architect</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">
              {sow.createdByName}
            </span>
          </div>
        </div>

        {/* Status Alert Banner */}
        {statusMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs font-medium text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {statusMessage}
          </div>
        )}

        {/* Nav Tabs */}
        <div className="px-6 border-b border-slate-200 bg-white flex space-x-1 sm:space-x-4 overflow-x-auto text-xs font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('scope')}
            className={`py-3 px-2 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'scope'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            1. Scope & Background
          </button>
          <button
            onClick={() => setActiveTab('deliverables')}
            className={`py-3 px-2 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'deliverables'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            2. Deliverables ({sow.deliverables?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('raci')}
            className={`py-3 px-2 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'raci'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            3. RACI Matrix ({sow.raciMatrix?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-2 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'timeline'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            4. Timeline & Gantt
          </button>
          <button
            onClick={() => setActiveTab('commercial')}
            className={`py-3 px-2 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'commercial'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            5. Commercial & Milestones
          </button>
          <button
            onClick={() => setActiveTab('governance')}
            className={`py-3 px-2 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'governance'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            6. Governance & Sign-Off ({sow.governanceApprovals?.filter((a) => a.status === 'APPROVED').length || 0}/{sow.governanceApprovals?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-3 px-2 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'preview'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Printer className="w-4 h-4" />
            7. Client PDF Preview
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          
          {/* TAB 1: SCOPE & BACKGROUND */}
          {activeTab === 'scope' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Scope Definition & Project Context
                </h3>
                <div>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveScopeEdits}
                        disabled={isSubmitting}
                        className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save Scope
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Scope Baseline
                    </button>
                  )}
                </div>
              </div>

              {/* Executive Summary & Background */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 text-blue-700">
                    <Sparkles className="w-3.5 h-3.5" />
                    Executive Summary
                  </h4>
                  {isEditing ? (
                    <textarea
                      value={executiveSummary}
                      onChange={(e) => setExecutiveSummary(e.target.value)}
                      rows={5}
                      className="w-full text-xs text-slate-800 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-sans"
                    />
                  ) : (
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {executiveSummary}
                    </p>
                  )}
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 text-indigo-700">
                    <Building className="w-3.5 h-3.5" />
                    Project Background & Objectives
                  </h4>
                  {isEditing ? (
                    <textarea
                      value={projectBackground}
                      onChange={(e) => setProjectBackground(e.target.value)}
                      rows={5}
                      className="w-full text-xs text-slate-800 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-sans"
                    />
                  ) : (
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {projectBackground}
                    </p>
                  )}
                </div>
              </div>

              {/* In Scope vs Out of Scope */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* In Scope */}
                <div className="bg-emerald-50/40 p-5 rounded-xl border border-emerald-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      In-Scope Deliverables & Commitments
                    </h4>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {inScopeItems.length} Items
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {inScopeItems.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-800 bg-white p-2.5 rounded-lg border border-emerald-100 shadow-xs">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="flex-1">{item}</span>
                        {isEditing && (
                          <button
                            onClick={() => handleRemoveInScope(idx)}
                            className="text-slate-400 hover:text-rose-600 p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  {isEditing && (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={newInScopeText}
                        onChange={(e) => setNewInScopeText(e.target.value)}
                        placeholder="Add new in-scope item..."
                        className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddInScope()}
                      />
                      <button
                        onClick={handleAddInScope}
                        className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>
                  )}
                </div>

                {/* Out of Scope */}
                <div className="bg-rose-50/40 p-5 rounded-xl border border-rose-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      Explicit Out-of-Scope Exclusions
                    </h4>
                    <span className="text-[11px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                      {outScopeItems.length} Exclusions
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {outScopeItems.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-800 bg-white p-2.5 rounded-lg border border-rose-100 shadow-xs">
                        <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                          ×
                        </span>
                        <span className="flex-1 text-slate-700">{item}</span>
                        {isEditing && (
                          <button
                            onClick={() => handleRemoveOutScope(idx)}
                            className="text-slate-400 hover:text-rose-600 p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  {isEditing && (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={newOutScopeText}
                        onChange={(e) => setNewOutScopeText(e.target.value)}
                        placeholder="Add out-of-scope exclusion..."
                        className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddOutScope()}
                      />
                      <button
                        onClick={handleAddOutScope}
                        className="px-2.5 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-medium hover:bg-rose-700 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Acceptance Criteria & Assumptions */}
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5 text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  General Acceptance Criteria
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sow.acceptanceCriteria?.map((ac, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{ac}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DELIVERABLES */}
          {activeTab === 'deliverables' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Project Deliverables & Phase Gate Criteria
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Formal contractual deliverables mapped to project milestones and acceptance conditions.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {sow.deliverables?.map((del, idx) => (
                  <div key={del.id || idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono text-[11px] font-bold rounded">
                          {del.phase}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">{del.title}</h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {del.ownerRole}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {del.estDurationDays} Days
                        </span>
                        <span className="flex items-center gap-1 font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold">
                          <Calendar className="w-3 h-3 text-blue-500" />
                          Target: {del.targetCompletionDate}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                      {del.description}
                    </p>
                    <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200/60 text-xs text-emerald-950 flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-emerald-900">Acceptance Criteria: </span>
                        {del.acceptanceCriteria}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: RACI MATRIX */}
          {activeTab === 'raci' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  RACI Governance Matrix (Responsible, Accountable, Consulted, Informed)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Establishes clear operational roles between vendor engineering teams and customer stakeholder groups.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-semibold">
                      <th className="p-3 border-r border-slate-800">Project Activity / Workstream</th>
                      <th className="p-3 text-center bg-blue-950 text-blue-200 border-r border-slate-800">
                        <span className="block font-bold">R</span>
                        <span className="text-[10px] font-normal text-blue-300">Responsible</span>
                      </th>
                      <th className="p-3 text-center bg-emerald-950 text-emerald-200 border-r border-slate-800">
                        <span className="block font-bold">A</span>
                        <span className="text-[10px] font-normal text-emerald-300">Accountable</span>
                      </th>
                      <th className="p-3 text-center bg-purple-950 text-purple-200 border-r border-slate-800">
                        <span className="block font-bold">C</span>
                        <span className="text-[10px] font-normal text-purple-300">Consulted</span>
                      </th>
                      <th className="p-3 text-center bg-amber-950 text-amber-200">
                        <span className="block font-bold">I</span>
                        <span className="text-[10px] font-normal text-amber-300">Informed</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sow.raciMatrix?.map((raci, idx) => (
                      <tr key={raci.id || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-medium text-slate-900 border-r border-slate-200">
                          {raci.activity}
                        </td>
                        <td className="p-3 text-center text-slate-700 bg-blue-50/20 border-r border-slate-200 font-medium">
                          {raci.responsible}
                        </td>
                        <td className="p-3 text-center text-slate-900 bg-emerald-50/20 border-r border-slate-200 font-bold">
                          {raci.accountable}
                        </td>
                        <td className="p-3 text-center text-slate-700 bg-purple-50/20 border-r border-slate-200">
                          {raci.consulted}
                        </td>
                        <td className="p-3 text-center text-slate-600 bg-amber-50/20">
                          {raci.informed}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: TIMELINE & GANTT */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Project Phasing & Milestone Gantt Schedule
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sequential timeline stages from architecture discovery to production hypercare.
                </p>
              </div>

              <div className="space-y-3">
                {sow.projectTimeline?.map((phase, idx) => (
                  <div key={phase.id || idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center font-mono">
                          {phase.phaseNumber}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">{phase.name}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          phase.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : phase.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {phase.status}
                        </span>
                        <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {phase.durationWeeks} Weeks
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        Gate Milestone: <strong className="text-slate-900">{phase.milestoneDeliverable}</strong>
                      </span>
                      <span className="font-mono text-slate-500 text-[11px]">
                        {phase.startDate} → {phase.endDate}
                      </span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          phase.status === 'Completed'
                            ? 'bg-emerald-500 w-full'
                            : phase.status === 'In Progress'
                            ? 'bg-blue-500 w-1/2'
                            : 'bg-slate-300 w-0'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: COMMERCIAL & MILESTONES */}
          {activeTab === 'commercial' && (
            <div className="space-y-6">
              <div className="bg-linear-to-r from-blue-900 to-indigo-950 p-5 rounded-2xl text-white shadow-md flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-blue-300 font-semibold">
                    Total Contract Value (Approved BOQ Snapshot)
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                    {formatCurrency(sow.commercialTerms.totalContractValueIDR, sow.commercialTerms.totalContractValueUSD)}
                  </div>
                </div>
                <div className="flex gap-4 text-xs">
                  <div className="bg-white/10 px-3 py-2 rounded-xl backdrop-blur-xs">
                    <span className="text-blue-200 block">Warranty Period</span>
                    <span className="font-bold text-white text-sm">{sow.commercialTerms.warrantyPeriodMonths} Months</span>
                  </div>
                  <div className="bg-white/10 px-3 py-2 rounded-xl backdrop-blur-xs">
                    <span className="text-blue-200 block">Critical SLA</span>
                    <span className="font-bold text-white text-sm">{sow.commercialTerms.slaResolutionHours} Hours</span>
                  </div>
                </div>
              </div>

              {/* Payment Milestones Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="px-4 py-3 bg-slate-900 text-white font-bold text-xs flex justify-between items-center">
                  <span>Structured Payment Billing Milestones</span>
                  <span className="text-blue-300 font-mono">100% Total Allocation</span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Milestone Stage</th>
                      <th className="p-3 text-center">Billing %</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3">Trigger / Acceptance Criteria</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sow.commercialTerms.paymentMilestones?.map((pm, idx) => (
                      <tr key={pm.id || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-semibold text-slate-900 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-mono text-[10px]">
                            {idx + 1}
                          </span>
                          {pm.milestoneName}
                        </td>
                        <td className="p-3 text-center font-bold text-blue-700 font-mono">
                          {pm.percentage}%
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900 font-mono">
                          {formatCurrency(pm.amountIDR, pm.amountUSD)}
                        </td>
                        <td className="p-3 text-slate-600 text-xs">
                          {pm.triggerCriteria}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Change Request & Legal Terms */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-blue-700">
                  <ShieldCheck className="w-4 h-4" />
                  Change Management & Legal Clauses
                </h4>
                <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
                  <p><strong>Project Change Requests (PCR): </strong>{sow.commercialTerms.changeRequestTerms}</p>
                  <p><strong>Confidentiality: </strong>{sow.commercialTerms.confidentialityClause}</p>
                  <p><strong>Governing Law: </strong>{sow.commercialTerms.governingLaw}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: GOVERNANCE & SIGN-OFF */}
          {activeTab === 'governance' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Multi-Party Governance & Approval Workflows
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enforces strict role-based audit signoffs before final submission and client contract execution.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sow.governanceApprovals?.map((appr) => {
                  const isApproved = appr.status === 'APPROVED';
                  const isRejected = appr.status === 'REJECTED';
                  return (
                    <div
                      key={appr.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isApproved
                          ? 'bg-emerald-50/40 border-emerald-300'
                          : isRejected
                          ? 'bg-rose-50/40 border-rose-300'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          {appr.role}
                        </span>
                        {isApproved ? (
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Signed & Approved
                          </span>
                        ) : isRejected ? (
                          <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-full text-[11px] font-bold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Rejected
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[11px] font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Awaiting Sign-Off
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-700 mb-2">
                        <span className="text-slate-400">Designated Signer: </span>
                        <span className="font-semibold text-slate-900">{appr.userName}</span>
                      </div>

                      {appr.signedAt && (
                        <div className="text-[11px] font-mono text-slate-500 mb-2">
                          Signed at: {new Date(appr.signedAt).toLocaleString()}
                        </div>
                      )}

                      {appr.comments && (
                        <p className="text-xs text-slate-600 bg-white/80 p-2 rounded border border-slate-200 italic mb-3">
                          "{appr.comments}"
                        </p>
                      )}

                      {/* Interactive Sign-off buttons for authorized roles */}
                      {!isApproved && (
                        <div className="mt-3 flex gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => handleSignApproval(appr.id, 'APPROVED')}
                            disabled={isSubmitting}
                            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Sign
                          </button>
                          <button
                            onClick={() => handleSignApproval(appr.id, 'REJECTED')}
                            disabled={isSubmitting}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-xs border border-rose-200 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Status Action Buttons */}
              <div className="bg-slate-900 p-4 rounded-xl text-white flex flex-wrap items-center justify-between gap-3 mt-6">
                <div>
                  <span className="text-xs text-slate-400 block">SOW Workflow Status</span>
                  <span className="font-bold text-sm text-white">{sow.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  {sow.status === 'DRAFT' && (
                    <button
                      onClick={() => handleStatusTransition('INTERNAL_REVIEW')}
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" /> Submit for Internal Review
                    </button>
                  )}
                  {sow.status === 'INTERNAL_REVIEW' && (
                    <button
                      onClick={() => handleStatusTransition('LEGAL_SALES_REVIEW')}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Clock className="w-3.5 h-3.5" /> Submit to Legal & Sales
                    </button>
                  )}
                  {sow.status === 'LEGAL_SALES_REVIEW' && (
                    <button
                      onClick={() => handleStatusTransition('APPROVED')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve for Client Signature
                    </button>
                  )}
                  {sow.status === 'APPROVED' && (
                    <button
                      onClick={() => handleStatusTransition('CLIENT_SIGNED')}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Mark Client Executed
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: CLIENT PDF PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-6 bg-white p-8 rounded-2xl border border-slate-300 shadow-lg text-slate-800">
              <div className="flex items-center justify-between border-b border-slate-300 pb-6">
                <div>
                  <span className="text-xs font-mono font-bold text-blue-700 tracking-widest uppercase">
                    ENTERPRISE STATEMENT OF WORK
                  </span>
                  <h1 className="text-xl font-bold text-slate-950 mt-1">{sow.opportunityTitle}</h1>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Doc ID: {sow.documentNumber} | Version: {sow.version} | Date: {sow.createdAt.split('T')[0]}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <span className="font-bold text-slate-900 block">{sow.accountName}</span>
                  <span className="text-slate-500 block">Attn: {sow.customerContactName}</span>
                  <span className="text-slate-500 block">{sow.customerContactEmail}</span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-950 uppercase tracking-wider mb-2">1. Executive Summary</h3>
                <p className="text-xs text-slate-700 leading-relaxed">{sow.executiveSummary}</p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-950 uppercase tracking-wider mb-2">2. Scope of Work</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <h4 className="text-[11px] font-bold text-emerald-800 uppercase mb-2">In-Scope Items</h4>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-slate-700">
                      {sow.scopeInScope.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <h4 className="text-[11px] font-bold text-rose-800 uppercase mb-2">Out-of-Scope Items</h4>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-slate-700">
                      {sow.scopeOutOfScope.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-950 uppercase tracking-wider mb-2">3. Commercial Investment & Payment Terms</h3>
                <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center text-xs">
                  <span>Grand Total Contract Investment</span>
                  <span className="text-base font-bold text-blue-300 font-mono">
                    {formatCurrency(sow.commercialTerms.totalContractValueIDR, sow.commercialTerms.totalContractValueUSD)}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-300 pt-6 grid grid-cols-2 gap-8 text-xs">
                <div className="border border-slate-300 p-4 rounded-xl">
                  <span className="text-slate-400 block mb-6">Signed on behalf of Vendor:</span>
                  <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-slate-900">
                    {sow.createdByName}
                  </div>
                  <span className="text-slate-500">Solutions Architect / Presales</span>
                </div>
                <div className="border border-slate-300 p-4 rounded-xl">
                  <span className="text-slate-400 block mb-6">Signed on behalf of Customer:</span>
                  <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-slate-900">
                    {sow.customerContactName}
                  </div>
                  <span className="text-slate-500">{sow.customerContactRole || 'Authorized Representative'}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-mono">
            Last modified: {new Date(sow.updatedAt).toLocaleString()}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
