import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  Building2,
  Calendar,
  CheckCircle2,
  Circle,
  AlertCircle,
  Edit,
  Trash2,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Award,
  Users,
  FileSpreadsheet,
  ArrowUpRight,
  Calculator,
  ReceiptText,
} from 'lucide-react';
import { Opportunity, OpportunityDbStage, MeddpiccData, UserRole } from '../types.ts';
import { STAGE_CONFIG } from '../data/initialOpportunitiesData.ts';
import { OpportunitiesService } from '../lib/opportunities-service.ts';

interface OpportunityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: Opportunity | null;
  onEdit: (opp: Opportunity) => void;
  onDelete: (id: string) => void;
  onOpportunityUpdated: (updated: Opportunity) => void;
  currentRole: UserRole;
}

export const OpportunityDetailModal: React.FC<OpportunityDetailModalProps> = ({
  isOpen,
  onClose,
  opportunity,
  onEdit,
  onDelete,
  onOpportunityUpdated,
  currentRole,
}) => {
  const [activeTab, setActiveTab] = useState<'meddpicc' | 'overview' | 'presales'>('meddpicc');
  const [meddpiccData, setMeddpiccData] = useState<MeddpiccData>({});
  const [isSavingMeddpicc, setIsSavingMeddpicc] = useState(false);
  const [isChangingStage, setIsChangingStage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (opportunity) {
      setMeddpiccData(opportunity.meddpiccData || {});
      setShowDeleteConfirm(false);
    }
  }, [opportunity]);

  if (!isOpen || !opportunity) return null;

  const currentStageIndex = STAGE_CONFIG.findIndex((c) => c.key === opportunity.stage);
  const meddpiccScore = OpportunitiesService.calculateMeddpiccScore(meddpiccData);

  const handleStageSelect = async (newStage: OpportunityDbStage) => {
    setIsChangingStage(true);
    const res = await OpportunitiesService.updateStage(opportunity.id, newStage);
    if (res.data) {
      onOpportunityUpdated(res.data);
    }
    setIsChangingStage(false);
  };

  const handleMeddpiccFieldChange = (field: keyof MeddpiccData, val: any) => {
    setMeddpiccData((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handleSaveMeddpicc = async () => {
    setIsSavingMeddpicc(true);
    const score = OpportunitiesService.calculateMeddpiccScore(meddpiccData);
    const res = await OpportunitiesService.updateOpportunity(opportunity.id, {
      meddpiccData,
      meddpiccScore: score,
    });
    if (res.data) {
      onOpportunityUpdated(res.data);
    }
    setIsSavingMeddpicc(false);
  };

  const meddpiccSections = [
    {
      code: 'M',
      title: 'Metrics',
      subtitle: 'Quantifiable business & financial impact',
      textField: 'metrics' as keyof MeddpiccData,
      checkField: 'metricsQualified' as keyof MeddpiccData,
      placeholder: 'e.g. 40% reduction in downtime, IDR 4.2B yearly power savings...',
      tip: 'What is the economic value we create for the customer? (ROI, KPI, SLA)',
    },
    {
      code: 'E',
      title: 'Economic Buyer',
      subtitle: 'Person with discretionary budget authority',
      textField: 'economicBuyer' as keyof MeddpiccData,
      checkField: 'economicBuyerQualified' as keyof MeddpiccData,
      placeholder: 'e.g. Bambang Suryono (CTO) holds discretionary CAPEX budget...',
      tip: 'Do we have direct access to the person who can say YES when everyone says no?',
    },
    {
      code: 'D',
      title: 'Decision Criteria',
      subtitle: 'Technical, architectural, and commercial criteria',
      textField: 'decisionCriteria' as keyof MeddpiccData,
      checkField: 'decisionCriteriaQualified' as keyof MeddpiccData,
      placeholder: 'e.g. Sub-ms latency, Nutanix AHV/VMware dual support, ISO 27001...',
      tip: 'What formal matrix is the customer using to compare solutions?',
    },
    {
      code: 'D',
      title: 'Decision Process',
      subtitle: 'Evaluation timeline, POC gates, and approvals',
      textField: 'decisionProcess' as keyof MeddpiccData,
      checkField: 'decisionProcessQualified' as keyof MeddpiccData,
      placeholder: 'e.g. Sizing signoff -> SOW review -> Board procurement committee...',
      tip: 'What steps must happen sequentially for the deal to be awarded?',
    },
    {
      code: 'P',
      title: 'Paper Process',
      subtitle: 'Procurement, legal contract, MSA, and PO timing',
      textField: 'paperProcess' as keyof MeddpiccData,
      checkField: 'paperProcessQualified' as keyof MeddpiccData,
      placeholder: 'e.g. Vendor registration complete; 30-day payment term agreed...',
      tip: 'How does legal and procurement actually process the purchase order?',
    },
    {
      code: 'I',
      title: 'Identified Pain',
      subtitle: 'Critical business issue driving urgency',
      textField: 'identifiedPain' as keyof MeddpiccData,
      checkField: 'identifiedPainQualified' as keyof MeddpiccData,
      placeholder: 'e.g. Legacy SAN bottleneck causing daily batch job failures...',
      tip: 'What severe pain happens if the customer chooses to do nothing?',
    },
    {
      code: 'C',
      title: 'Champion',
      subtitle: 'Internal influential advocate for our solution',
      textField: 'champion' as keyof MeddpiccData,
      checkField: 'championQualified' as keyof MeddpiccData,
      placeholder: 'e.g. Irwan Setiawan (Head of Infrastructure) backing our design...',
      tip: 'Does the champion have power, influence, and personal skin in the game?',
    },
    {
      code: 'C',
      title: 'Competition',
      subtitle: 'Alternative vendors and do-nothing threats',
      textField: 'competition' as keyof MeddpiccData,
      checkField: 'competitionQualified' as keyof MeddpiccData,
      placeholder: 'e.g. Dell VxRail and HPE SimpliVity submitting counter-bids...',
      tip: 'What rival solutions or internal DIY approaches are being evaluated?',
    },
  ];

  return (
    <div id="opp-detail-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div id="opp-detail-modal-container" className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-blue-400 font-semibold bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/60">
                  {opportunity.code}
                </span>
                <span className="text-xs text-slate-400">&bull;</span>
                <span className="text-xs text-slate-300 font-medium">
                  {opportunity.accountName}
                </span>
              </div>
              <h2 className="text-base font-bold text-white leading-tight mt-0.5">
                {opportunity.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="edit-opp-from-detail-btn"
              onClick={() => {
                onClose();
                onEdit(opportunity);
              }}
              className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-xs flex items-center gap-1.5 font-medium border border-slate-700"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Deal</span>
            </button>
            <button
              id="close-opp-detail-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stage Progression Stepper Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Pipeline Stage Gate Progression
            </span>
            <span className="text-xs font-semibold text-blue-700">
              Current: {STAGE_CONFIG.find((c) => c.key === opportunity.stage)?.label || opportunity.stage} ({opportunity.probability}% Win Prob)
            </span>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-8 gap-1.5">
            {STAGE_CONFIG.map((cfg, idx) => {
              const isCurrent = cfg.key === opportunity.stage;
              const isPast = idx < currentStageIndex;
              return (
                <button
                  key={cfg.key}
                  id={`stage-step-${cfg.key}`}
                  disabled={isChangingStage}
                  onClick={() => handleStageSelect(cfg.key as OpportunityDbStage)}
                  className={`px-2 py-1.5 rounded-lg text-left transition-all text-xs border ${
                    isCurrent
                      ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-xs ring-2 ring-blue-500/20'
                      : isPast
                      ? 'bg-blue-50 text-blue-800 font-medium border-blue-200 hover:bg-blue-100'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate text-[11px] font-semibold">{cfg.shortLabel}</span>
                    {isCurrent ? (
                      <CheckCircle2 className="w-3 h-3 text-white shrink-0 ml-1" />
                    ) : isPast ? (
                      <CheckCircle2 className="w-3 h-3 text-blue-600 shrink-0 ml-1" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Deal Quick Metrics Strip */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 shrink-0">
          <div className="border-r border-slate-100 pr-3">
            <p className="text-[11px] font-semibold uppercase text-slate-400">Deal Value</p>
            <p className="text-sm font-bold text-slate-900">
              Rp {(opportunity.dealValue / 1_000_000_000).toFixed(2)} Miliar
            </p>
          </div>

          <div className="border-r border-slate-100 pr-3">
            <p className="text-[11px] font-semibold uppercase text-slate-400">Target Close</p>
            <p className="text-sm font-bold text-slate-800">
              {opportunity.targetCloseDate ? new Date(opportunity.targetCloseDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Q4 2026'}
            </p>
          </div>

          <div className="border-r border-slate-100 pr-3">
            <p className="text-[11px] font-semibold uppercase text-slate-400">Account Executive</p>
            <p className="text-sm font-bold text-slate-800 truncate">
              {opportunity.assignedAeName || 'Rian Hidayat'}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase text-slate-400">Lead Architect (SA)</p>
            <p className="text-sm font-bold text-slate-800 truncate">
              {opportunity.assignedSaName || 'Abdoel'}
            </p>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex gap-4">
            <button
              id="tab-meddpicc-btn"
              onClick={() => setActiveTab('meddpicc')}
              className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'meddpicc'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>MEDDPICC Qualification Worksheet</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                meddpiccScore >= 80 ? 'bg-emerald-100 text-emerald-800' : meddpiccScore >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {meddpiccScore}% Score
              </span>
            </button>

            <button
              id="tab-overview-btn"
              onClick={() => setActiveTab('overview')}
              className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Account & Stakeholder Context</span>
            </button>

            <button
              id="tab-presales-btn"
              onClick={() => setActiveTab('presales')}
              className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'presales'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Presales Sizing & BOQ Linking</span>
            </button>
          </div>

          {activeTab === 'meddpicc' && (
            <button
              id="save-meddpicc-top-btn"
              onClick={handleSaveMeddpicc}
              disabled={isSavingMeddpicc}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSavingMeddpicc ? 'Saving...' : 'Save Worksheet'}
            </button>
          )}
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {activeTab === 'meddpicc' && (
            <div className="space-y-4">
              {/* MEDDPICC Header Explainer */}
              <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl text-white flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-300" />
                    <h3 className="font-bold text-sm">MEDDPICC Deal Health & Rigor Engine</h3>
                  </div>
                  <p className="text-xs text-blue-200 mt-1 max-w-xl">
                    Tick qualified checkpoints when evidence is validated with economic buyers and champions. Deals above 80% have a 92% win rate.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-white">{meddpiccScore}%</div>
                  <p className="text-[11px] font-semibold text-blue-200">
                    {meddpiccScore >= 80 ? 'HIGH CONFIDENCE' : meddpiccScore >= 50 ? 'MODERATE RISK' : 'UNQUALIFIED'}
                  </p>
                </div>
              </div>

              {/* 8 MEDDPICC Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {meddpiccSections.map((sec) => {
                  const isChecked = Boolean((meddpiccData as any)[sec.checkField]);
                  const textVal = (meddpiccData as any)[sec.textField] || '';

                  return (
                    <div
                      key={sec.title}
                      className={`p-4 rounded-xl border transition-all ${
                        isChecked
                          ? 'bg-white border-blue-200 shadow-xs'
                          : 'bg-white/80 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-md font-bold text-xs flex items-center justify-center ${
                            isChecked ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {sec.code}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{sec.title}</h4>
                            <p className="text-[11px] text-slate-400">{sec.subtitle}</p>
                          </div>
                        </div>

                        <label className="flex items-center gap-1.5 cursor-pointer select-none bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 text-xs">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleMeddpiccFieldChange(sec.checkField, e.target.checked)}
                            className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer"
                          />
                          <span className={`text-[11px] font-bold ${isChecked ? 'text-blue-700' : 'text-slate-500'}`}>
                            {isChecked ? 'Qualified' : 'Pending'}
                          </span>
                        </label>
                      </div>

                      <textarea
                        rows={2}
                        value={textVal}
                        onChange={(e) => handleMeddpiccFieldChange(sec.textField, e.target.value)}
                        placeholder={sec.placeholder}
                        className="w-full px-3 py-2 text-xs bg-slate-50/60 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white resize-none"
                      />
                      <p className="text-[10px] text-slate-400 mt-1 italic">&bull; {sec.tip}</p>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Action */}
              <div className="flex justify-end pt-2">
                <button
                  id="save-meddpicc-bottom-btn"
                  onClick={handleSaveMeddpicc}
                  disabled={isSavingMeddpicc}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingMeddpicc ? (
                    <span>Saving Worksheet...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save MEDDPICC Worksheet ({meddpiccScore}% Score)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Target Account Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Account Name</span>
                    <span className="text-sm font-bold text-slate-800">{opportunity.accountName}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Industry</span>
                    <span className="text-sm font-bold text-slate-800">{opportunity.accountIndustry || 'General Enterprise'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Account Tier</span>
                    <span className="inline-block px-2 py-0.5 text-xs font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      {opportunity.accountTier || 'Strategic'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Commercial Strategy & Pipeline Source
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Lead Source</span>
                    <span className="text-xs font-semibold text-slate-800">{opportunity.leadSource || 'Partner RFP Invitation'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Probability / Confidence</span>
                    <span className="text-xs font-bold text-blue-700">{opportunity.probability}%</span>
                  </div>
                  {opportunity.lossReason && (
                    <div className="md:col-span-2 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                      <span className="text-xs font-bold text-rose-800 block">Loss Reason / Post-Mortem:</span>
                      <p className="text-xs text-rose-700 mt-0.5">{opportunity.lossReason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'presales' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Technical Sizing Project Link</h4>
                      <p className="text-xs text-slate-500">
                        Linked hardware Bill-of-Materials, hypervisor workloads, and rack topology.
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Ready for Architecture Review
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assigned Solutions Architect:</span>
                    <span className="font-bold text-slate-800">{opportunity.assignedSaName || 'Abdoel'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimated Target BOM Hardware:</span>
                    <span className="font-bold text-slate-800">Rp {(opportunity.dealValue * 0.75 / 1_000_000_000).toFixed(2)} Miliar</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimated Services & Implementation SOW:</span>
                    <span className="font-bold text-slate-800">Rp {(opportunity.dealValue * 0.25 / 1_000_000_000).toFixed(2)} Miliar</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-100/80 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div>
            {!showDeleteConfirm ? (
              <button
                id="open-delete-opp-btn"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs font-medium text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Opportunity</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-rose-700">Confirm delete?</span>
                <button
                  id="confirm-delete-opp-btn"
                  onClick={() => {
                    onDelete(opportunity.id);
                    onClose();
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md"
                >
                  Yes, Delete
                </button>
                <button
                  id="cancel-delete-opp-btn"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              id="close-opp-footer-btn"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-200/70 rounded-xl border border-slate-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
