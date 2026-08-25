import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building,
  User,
  Calendar,
  DollarSign,
  FileText,
  Plus,
  Trash2,
  Printer,
  Sparkles,
  ArrowRight,
  Lock,
  Layers,
  Send,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import {
  ProjectHandover,
  HandoverStatus,
  HandoverChecklistItem,
  HandoverRiskItem,
  HandoverTechnicalArtifact,
  UserProfile,
  UserRole,
} from '../types.ts';
import { SowHandoverService } from '../lib/sow-handover-service.ts';

interface HandoverDetailModalProps {
  handover: ProjectHandover;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updated: ProjectHandover) => void;
  currentUserRole?: UserRole;
  currentProfile?: UserProfile;
  currency?: 'IDR' | 'USD';
  onSendWhatsAppPing?: (phone: string, text: string) => void;
}

export const HandoverDetailModal: React.FC<HandoverDetailModalProps> = ({
  handover,
  isOpen,
  onClose,
  onUpdated,
  currentUserRole,
  currentProfile,
  currency = 'IDR',
  onSendWhatsAppPing,
}) => {
  const [activeTab, setActiveTab] = useState<
    'baseline' | 'checklist' | 'risks' | 'artifacts' | 'governance' | 'export'
  >('checklist');

  // Risk addition state
  const [newRiskDesc, setNewRiskDesc] = useState('');
  const [newRiskImpact, setNewRiskImpact] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [newRiskProb, setNewRiskProb] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [newRiskMitigation, setNewRiskMitigation] = useState('');
  const [newRiskContingency, setNewRiskContingency] = useState('');
  const [newRiskOwner, setNewRiskOwner] = useState(handover.assignedPmName);
  const [isAddingRisk, setIsAddingRisk] = useState(false);

  // Signoff comments state
  const [signoffComments, setSignoffComments] = useState('');
  const [kickoffDateInput, setKickoffDateInput] = useState(handover.targetKickoffDate);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const formatCurrency = (valIDR: number, valUSD?: number) => {
    if (currency === 'USD' && valUSD) {
      return `$${valUSD.toLocaleString('en-US')}`;
    }
    return `IDR ${(valIDR || 0).toLocaleString('id-ID')}`;
  };

  const getStatusBadge = (status: HandoverStatus) => {
    switch (status) {
      case 'OFFICIALLY_HANDED_OVER':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-semibold flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Officially Handed Over</span>;
      case 'ACCEPTANCE_SIGN_OFF':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 border border-blue-300 rounded-full text-xs font-semibold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Acceptance Sign-Off</span>;
      case 'REVIEW_IN_PROGRESS':
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-xs font-semibold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Review in Progress</span>;
      case 'PENDING_KICKOFF':
      default:
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 border border-purple-300 rounded-full text-xs font-semibold flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Pending Kickoff</span>;
    }
  };

  const handleToggleChecklist = async (itemId: string, currentCompleted: boolean) => {
    setIsSubmitting(true);
    const { data } = await SowHandoverService.updateHandoverChecklistItem(
      handover.id,
      itemId,
      !currentCompleted,
      undefined,
      currentProfile
    );
    setIsSubmitting(false);
    if (data) {
      onUpdated(data);
      setStatusMessage('Checklist updated & readiness score recalculated.');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleAddRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRiskDesc.trim()) return;

    setIsSubmitting(true);
    const { data } = await SowHandoverService.addHandoverRisk(handover.id, {
      riskDescription: newRiskDesc.trim(),
      impact: newRiskImpact,
      probability: newRiskProb,
      mitigationStrategy: newRiskMitigation.trim() || 'Active monitoring by project delivery team.',
      contingencyPlan: newRiskContingency.trim() || 'Escalate to project steering committee.',
      owner: newRiskOwner,
      status: 'OPEN',
    });
    setIsSubmitting(false);

    if (data) {
      onUpdated(data);
      setNewRiskDesc('');
      setNewRiskMitigation('');
      setNewRiskContingency('');
      setIsAddingRisk(false);
      setStatusMessage('Project risk logged to registry.');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleGovernanceSign = async (role: 'SA' | 'SALES' | 'PM') => {
    if (!currentProfile) return;
    setIsSubmitting(true);
    const { data } = await SowHandoverService.signHandoverGovernance(
      handover.id,
      role,
      currentProfile,
      signoffComments,
      kickoffDateInput
    );
    setIsSubmitting(false);

    if (data) {
      onUpdated(data);
      setSignoffComments('');
      setStatusMessage(`Handover signoff completed for ${role}.`);
      setTimeout(() => setStatusMessage(null), 3000);

      // Trigger WhatsApp notification if PM signed
      if (role === 'PM' && onSendWhatsAppPing && handover.customerSpocPhone) {
        onSendWhatsAppPing(
          handover.customerSpocPhone,
          `*Project Handover Complete*: Delivery PM ${currentProfile.name} has officially accepted ownership of project "${handover.opportunityTitle}". Kickoff planned on ${kickoffDateInput}.`
        );
      }
    }
  };

  // Group checklist by category
  const categories = Array.from(new Set(handover.checklist?.map((c) => c.category) || []));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700">
                  {handover.handoverCode}
                </span>
                {getStatusBadge(handover.status)}
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {handover.handoverReadinessScore}% Ready
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5 flex items-center gap-2">
                {handover.opportunityTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('export')}
              className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Print Handover Dossier</span>
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
              {handover.accountName}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Assigned Delivery PM</span>
            <span className="font-bold text-blue-700 flex items-center gap-1 mt-0.5">
              <User className="w-3.5 h-3.5 text-blue-500" />
              {handover.assignedPmName}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Won Deal Value</span>
            <span className="font-bold text-emerald-700 mt-0.5 block">
              {formatCurrency(handover.dealValueIDR, handover.dealValueUSD)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Target Kickoff</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              {handover.targetKickoffDate}
            </span>
          </div>
        </div>

        {/* Readiness Barometer Strip */}
        <div className="px-6 py-2 bg-slate-900/90 text-white flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Sales-to-Delivery Readiness Barometer:</span>
            <div className="w-48 sm:w-64 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
              <div
                className={`h-full rounded-full transition-all ${
                  handover.handoverReadinessScore >= 85
                    ? 'bg-emerald-500'
                    : handover.handoverReadinessScore >= 60
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${handover.handoverReadinessScore}%` }}
              />
            </div>
            <span className="font-bold font-mono text-emerald-400">
              {handover.handoverReadinessScore}%
            </span>
          </div>

          <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
            {handover.checklist?.filter((c) => c.completed).length}/{handover.checklist?.length} Verifications Completed
          </div>
        </div>

        {/* Status Message Alert */}
        {statusMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs font-medium text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {statusMessage}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 bg-white flex space-x-2 sm:space-x-4 overflow-x-auto text-xs font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`py-3 px-2 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'checklist'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            1. Pre-Delivery Checklist ({handover.checklist?.filter((c) => c.completed).length}/{handover.checklist?.length})
          </button>
          <button
            onClick={() => setActiveTab('baseline')}
            className={`py-3 px-2 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'baseline'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            2. Scope & Baseline Locking
          </button>
          <button
            onClick={() => setActiveTab('risks')}
            className={`py-3 px-2 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'risks'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            3. Risk Registry ({handover.riskRegistry?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('artifacts')}
            className={`py-3 px-2 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'artifacts'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            4. Artifacts & Blueprint ({handover.artifacts?.length || 0})
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
            5. Tri-Party Governance Sign-Off
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`py-3 px-2 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'export'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Printer className="w-4 h-4" />
            6. Handover Dossier Print
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          
          {/* TAB 1: PRE-DELIVERY CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    5-Pillar Pre-Delivery Verification Checklist
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Structured stage-gate checklist ensuring full commercial, architectural, and site readiness before kickoff.
                  </p>
                </div>
              </div>

              {categories.map((category) => {
                const catItems = handover.checklist?.filter((c) => c.category === category) || [];
                const catCompleted = catItems.filter((c) => c.completed).length;

                return (
                  <div key={category} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        {category}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {catCompleted}/{catItems.length} Verified
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {catItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-3"
                        >
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => handleToggleChecklist(item.id, item.completed)}
                            disabled={isSubmitting}
                            className="w-4 h-4 mt-0.5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                          />
                          <div className="flex-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className={`font-medium ${item.completed ? 'text-slate-900' : 'text-slate-700'}`}>
                                {item.item}
                              </span>
                              {item.required && (
                                <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded ml-2 shrink-0">
                                  Required Gate
                                </span>
                              )}
                            </div>

                            {item.notes && (
                              <p className="text-[11px] text-slate-500 italic mt-1">
                                Note: {item.notes}
                              </p>
                            )}

                            {item.completed && item.verifiedBy && (
                              <div className="text-[10px] font-mono text-emerald-700 mt-1 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Verified by {item.verifiedBy} at {item.verifiedAt ? new Date(item.verifiedAt).toLocaleString() : 'Recent'}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: SCOPE & BASELINE LOCKING */}
          {activeTab === 'baseline' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-300">
                    Scope & Architecture Baseline Guardian
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The delivery baseline prevents unmonitored scope creep. Any subsequent architectural additions require formal Project Change Requests (PCR).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-blue-700">
                    Confirmed Architecture Blueprint
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {handover.scopeBaseline.confirmedArchitecture}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-emerald-700">
                    Baseline Metrics & Readiness
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block font-medium">Estimated Duration</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {handover.scopeBaseline.estimatedDeliveryDurationWeeks} Weeks
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block font-medium">Site Readiness</span>
                      <span className="font-bold text-emerald-700 text-sm">
                        {handover.scopeBaseline.siteReadinessStatus}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block font-medium">BOQ Margin Lock</span>
                      <span className="font-bold text-blue-700 text-sm">
                        {handover.scopeBaseline.billOfQuantitiesApproved ? 'Approved & Locked' : 'Pending'}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block font-medium">SOW Execution</span>
                      <span className="font-bold text-blue-700 text-sm">
                        {handover.scopeBaseline.sowApprovedAndSigned ? 'Signed & Attached' : 'Approved'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Contract Clauses */}
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 text-indigo-700">
                  Special Contractual & Penalty Clauses
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {handover.scopeBaseline.specialContractClauses || 'Standard vendor terms and SLA conditions apply.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: RISK REGISTRY */}
          {activeTab === 'risks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Project Risk Registry & Mitigation Matrix
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Proactive mitigation plans and contingency triggers for delivery risks.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingRisk(!isAddingRisk)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Log New Risk
                </button>
              </div>

              {/* Add Risk Form */}
              {isAddingRisk && (
                <form onSubmit={handleAddRisk} className="bg-rose-50/50 p-4 rounded-xl border border-rose-200 space-y-3 text-xs">
                  <h4 className="font-bold text-rose-900 uppercase tracking-wider text-[11px]">
                    Log New Delivery Risk
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 font-medium mb-1">Risk Description</label>
                      <input
                        type="text"
                        value={newRiskDesc}
                        onChange={(e) => setNewRiskDesc(e.target.value)}
                        placeholder="e.g. Customs clearance delays for NVMe chassis..."
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Impact Level</label>
                      <select
                        value={newRiskImpact}
                        onChange={(e) => setNewRiskImpact(e.target.value as any)}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                      >
                        <option value="CRITICAL">CRITICAL</option>
                        <option value="HIGH">HIGH</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="LOW">LOW</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Probability</label>
                      <select
                        value={newRiskProb}
                        onChange={(e) => setNewRiskProb(e.target.value as any)}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                      >
                        <option value="HIGH">HIGH</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="LOW">LOW</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Mitigation Strategy</label>
                      <input
                        type="text"
                        value={newRiskMitigation}
                        onChange={(e) => setNewRiskMitigation(e.target.value)}
                        placeholder="Preventative actions..."
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Contingency Plan</label>
                      <input
                        type="text"
                        value={newRiskContingency}
                        onChange={(e) => setNewRiskContingency(e.target.value)}
                        placeholder="Fallback if risk triggers..."
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingRisk(false)}
                      className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg"
                    >
                      Save Risk Item
                    </button>
                  </div>
                </form>
              )}

              {/* Risks List */}
              <div className="space-y-3">
                {handover.riskRegistry?.map((risk) => (
                  <div key={risk.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          risk.impact === 'CRITICAL'
                            ? 'bg-rose-600 text-white'
                            : risk.impact === 'HIGH'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          Impact: {risk.impact}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold font-mono">
                          Probability: {risk.probability}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          risk.status === 'MITIGATED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {risk.status}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        Owner: <strong className="text-slate-800">{risk.owner}</strong>
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900">{risk.riskDescription}</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                        <span className="font-bold text-emerald-900 block mb-0.5">Mitigation Strategy:</span>
                        <span className="text-slate-700">{risk.mitigationStrategy}</span>
                      </div>
                      <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-100">
                        <span className="font-bold text-amber-900 block mb-0.5">Contingency Plan:</span>
                        <span className="text-slate-700">{risk.contingencyPlan}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ARTIFACTS & BLUEPRINT */}
          {activeTab === 'artifacts' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Technical Artifacts, Blueprints & SOW Documents
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Archived architectural blueprints, BOQ spreadsheets, and executed legal contracts passed from Presales to PM.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {handover.artifacts?.map((art) => (
                  <div key={art.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono text-[10px] font-bold rounded">
                          {art.type}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">{art.version}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2">{art.title}</h4>
                      <span className="text-[11px] text-slate-400 font-mono block mt-1">
                        {art.fileName || 'document.pdf'} • {art.fileSize || '3.5 MB'}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500">By {art.uploadedBy}</span>
                      <span className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer">
                        View File
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: TRI-PARTY GOVERNANCE SIGN-OFF */}
          {activeTab === 'governance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Tri-Party Handover Governance Sign-Off
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Formally transfers accountability from Presales Architect & Sales AE to the Project Delivery Manager.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Solutions Architect Signoff */}
                <div className={`p-4 rounded-xl border transition-all ${
                  handover.saSignOff?.isSigned ? 'bg-emerald-50/40 border-emerald-300' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 uppercase">1. Solutions Architect</span>
                    {handover.saSignOff?.isSigned ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Signed
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-700 mb-1">
                    <span className="text-slate-400">Architect: </span>
                    <strong>{handover.assignedSaName}</strong>
                  </div>
                  {handover.saSignOff?.signedAt && (
                    <div className="text-[10px] font-mono text-slate-500 mb-2">
                      Signed: {new Date(handover.saSignOff.signedAt).toLocaleString()}
                    </div>
                  )}
                  {handover.saSignOff?.comments && (
                    <p className="text-[11px] text-slate-600 italic bg-white/80 p-2 rounded border border-slate-200 mb-3">
                      "{handover.saSignOff.comments}"
                    </p>
                  )}
                  {!handover.saSignOff?.isSigned && (
                    <button
                      onClick={() => handleGovernanceSign('SA')}
                      disabled={isSubmitting}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Sign as SA
                    </button>
                  )}
                </div>

                {/* 2. Sales AE Signoff */}
                <div className={`p-4 rounded-xl border transition-all ${
                  handover.salesSignOff?.isSigned ? 'bg-emerald-50/40 border-emerald-300' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 uppercase">2. Account Executive (Sales)</span>
                    {handover.salesSignOff?.isSigned ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Signed
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-700 mb-1">
                    <span className="text-slate-400">AE: </span>
                    <strong>{handover.assignedAeName}</strong>
                  </div>
                  {handover.salesSignOff?.signedAt && (
                    <div className="text-[10px] font-mono text-slate-500 mb-2">
                      Signed: {new Date(handover.salesSignOff.signedAt).toLocaleString()}
                    </div>
                  )}
                  {handover.salesSignOff?.comments && (
                    <p className="text-[11px] text-slate-600 italic bg-white/80 p-2 rounded border border-slate-200 mb-3">
                      "{handover.salesSignOff.comments}"
                    </p>
                  )}
                  {!handover.salesSignOff?.isSigned && (
                    <button
                      onClick={() => handleGovernanceSign('SALES')}
                      disabled={isSubmitting}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Sign as Sales AE
                    </button>
                  )}
                </div>

                {/* 3. Delivery Project Manager Signoff */}
                <div className={`p-4 rounded-xl border transition-all ${
                  handover.pmSignOff?.isSigned ? 'bg-emerald-50/40 border-emerald-300' : 'bg-white border-blue-200 shadow-xs'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 uppercase">3. Delivery PM (Acceptance)</span>
                    {handover.pmSignOff?.isSigned ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Project Accepted
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
                        Action Required
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-700 mb-1">
                    <span className="text-slate-400">Assigned PM: </span>
                    <strong>{handover.assignedPmName}</strong>
                  </div>
                  {handover.pmSignOff?.signedAt && (
                    <div className="text-[10px] font-mono text-slate-500 mb-2">
                      Accepted: {new Date(handover.pmSignOff.signedAt).toLocaleString()}
                    </div>
                  )}

                  {!handover.pmSignOff?.isSigned && (
                    <div className="space-y-2 mt-2">
                      <div>
                        <label className="block text-[10px] text-slate-600 font-bold mb-0.5">
                          Confirm Kickoff Date
                        </label>
                        <input
                          type="date"
                          value={kickoffDateInput}
                          onChange={(e) => setKickoffDateInput(e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-300 rounded"
                        />
                      </div>
                      <button
                        onClick={() => handleGovernanceSign('PM')}
                        disabled={isSubmitting}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 shadow-xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Accept Project Handover
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PRINT DOSSIER */}
          {activeTab === 'export' && (
            <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-md text-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-300 pb-6">
                <div>
                  <span className="text-xs font-mono font-bold text-blue-700 tracking-widest uppercase">
                    PROJECT HANDOVER DOSSIER (SALES → DELIVERY PM)
                  </span>
                  <h1 className="text-xl font-bold text-slate-950 mt-1">{handover.opportunityTitle}</h1>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Handover ID: {handover.handoverCode} | Date: {handover.handoverDate} | Status: {handover.status}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <span className="font-bold text-slate-900 block">{handover.accountName}</span>
                  <span className="text-slate-500 block">Assigned PM: {handover.assignedPmName}</span>
                  <span className="text-slate-500 block">Architect: {handover.assignedSaName}</span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-950 uppercase tracking-wider mb-2">Scope & Architecture Baseline</h3>
                <p className="text-xs text-slate-700 leading-relaxed">{handover.scopeBaseline.confirmedArchitecture}</p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-950 uppercase tracking-wider mb-2">5-Pillar Verification Summary</h3>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  <div className="flex justify-between font-bold mb-2">
                    <span>Overall Handover Readiness</span>
                    <span className="text-emerald-700 font-mono">{handover.handoverReadinessScore}% Complete</span>
                  </div>
                  <ul className="space-y-1 text-slate-700">
                    {handover.checklist.map((c) => (
                      <li key={c.id} className="flex items-center gap-2">
                        {c.completed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span>{c.item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="border-t border-slate-300 pt-6 grid grid-cols-3 gap-4 text-xs">
                <div className="border border-slate-200 p-3 rounded-lg text-center">
                  <span className="text-slate-400 block mb-3">1. Solutions Architect</span>
                  <span className="font-bold text-slate-900 block">{handover.assignedSaName}</span>
                  <span className="text-[10px] text-emerald-600 font-mono">
                    {handover.saSignOff?.isSigned ? 'SIGNED' : 'PENDING'}
                  </span>
                </div>
                <div className="border border-slate-200 p-3 rounded-lg text-center">
                  <span className="text-slate-400 block mb-3">2. Account Executive</span>
                  <span className="font-bold text-slate-900 block">{handover.assignedAeName}</span>
                  <span className="text-[10px] text-emerald-600 font-mono">
                    {handover.salesSignOff?.isSigned ? 'SIGNED' : 'PENDING'}
                  </span>
                </div>
                <div className="border border-slate-200 p-3 rounded-lg text-center">
                  <span className="text-slate-400 block mb-3">3. Delivery PM</span>
                  <span className="font-bold text-slate-900 block">{handover.assignedPmName}</span>
                  <span className="text-[10px] text-emerald-600 font-mono">
                    {handover.pmSignOff?.isSigned ? 'OFFICIALLY ACCEPTED' : 'PENDING'}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-mono">
            Handover ID: {handover.handoverCode}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
