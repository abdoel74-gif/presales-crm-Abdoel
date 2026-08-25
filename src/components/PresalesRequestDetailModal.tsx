import React, { useState } from 'react';
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
  CheckCircle2,
  AlertCircle,
  FileText,
  Plus,
  Trash2,
  Edit2,
  Check,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  User,
  Calculator,
  ReceiptText,
  FileCheck2,
  Activity,
  History,
} from 'lucide-react';
import {
  PresalesRequest,
  PresalesRequestDbStatus,
  TechnicalRequirement,
  GapAnalysisItem,
  RequirementComplianceStatus,
  GapSeverity,
  GapResolutionStatus,
  UserRole,
} from '../types.ts';
import { PresalesService } from '../lib/presales-service.ts';
import {
  PRESALES_STATUS_CONFIG,
  PRESALES_PRIORITY_CONFIG,
  PRESALES_REQUEST_TYPES,
  SOLUTIONS_ARCHITECTS_POOL,
} from '../data/initialPresalesData.ts';
import { useAuth } from '../lib/AuthContext.tsx';

interface PresalesRequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: PresalesRequest | null;
  onUpdateRequest: (updated: PresalesRequest) => void;
  onOpenEditModal: (req: PresalesRequest) => void;
  onNavigateToModule?: (moduleId: string) => void;
}

export const PresalesRequestDetailModal: React.FC<PresalesRequestDetailModalProps> = ({
  isOpen,
  onClose,
  request,
  onUpdateRequest,
  onOpenEditModal,
  onNavigateToModule,
}) => {
  const { currentRole, profile } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'gaps' | 'assignment' | 'timeline'>('overview');

  // New Requirement Form state
  const [showAddReqModal, setShowAddReqModal] = useState(false);
  const [reqCategory, setReqCategory] = useState<TechnicalRequirement['category']>('Compute & Hypervisor');
  const [reqText, setReqText] = useState('');
  const [reqStatus, setReqStatus] = useState<RequirementComplianceStatus>('Compliant');
  const [reqSolution, setReqSolution] = useState('');
  const [reqNotes, setReqNotes] = useState('');

  // New Gap Form state
  const [showAddGapModal, setShowAddGapModal] = useState(false);
  const [gapArea, setGapArea] = useState('');
  const [gapCustomerReq, setGapCustomerReq] = useState('');
  const [gapCapability, setGapCapability] = useState('');
  const [gapSeverity, setGapSeverity] = useState<GapSeverity>('Major');
  const [gapMitigation, setGapMitigation] = useState('');
  const [gapResolution, setGapResolution] = useState<GapResolutionStatus>('Identified');

  // Status transition state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<PresalesRequestDbStatus>('In_Analysis');
  const [statusNotes, setStatusNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // SA Reassignment state
  const [reassignSaId, setReassignSaId] = useState('');

  if (!isOpen || !request) return null;

  const currentStatusConf = PRESALES_STATUS_CONFIG.find((s) => s.key === request.status);
  const priorityConf = PRESALES_PRIORITY_CONFIG[request.priority];
  const typeConf = PRESALES_REQUEST_TYPES[request.requestType];

  // Calculate SLA countdown
  const slaPctConsumed = Math.min(
    100,
    Math.round(((request.slaHoursTotal - request.slaHoursRemaining) / request.slaHoursTotal) * 100)
  );

  // Quick Advance Status Handler
  const handleAdvanceStatus = async (newStatus: PresalesRequestDbStatus, noteText: string) => {
    setIsProcessing(true);
    try {
      const res = await PresalesService.advancePresalesStatus(request.id, newStatus, noteText, profile);
      if (res.data) {
        onUpdateRequest(res.data);
      }
      setShowStatusModal(false);
      setStatusNotes('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Add Requirement Handler
  const handleAddRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqText.trim()) return;

    setIsProcessing(true);
    try {
      await PresalesService.addRequirement(
        request.id,
        {
          category: reqCategory,
          requirementText: reqText.trim(),
          complianceStatus: reqStatus,
          proposedSolution: reqSolution.trim() || undefined,
          notes: reqNotes.trim() || undefined,
        },
        profile
      );

      const refreshed = await PresalesService.getPresalesRequestById(request.id);
      if (refreshed.data) onUpdateRequest(refreshed.data);

      setShowAddReqModal(false);
      setReqText('');
      setReqSolution('');
      setReqNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick Update Requirement Status
  const handleUpdateReqStatus = async (reqId: string, newStatus: RequirementComplianceStatus) => {
    try {
      await PresalesService.updateRequirement(request.id, reqId, { complianceStatus: newStatus });
      const refreshed = await PresalesService.getPresalesRequestById(request.id);
      if (refreshed.data) onUpdateRequest(refreshed.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Requirement Handler
  const handleDeleteRequirement = async (reqId: string) => {
    try {
      await PresalesService.deleteRequirement(request.id, reqId);
      const refreshed = await PresalesService.getPresalesRequestById(request.id);
      if (refreshed.data) onUpdateRequest(refreshed.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Add Gap Handler
  const handleAddGap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gapArea.trim() || !gapCustomerReq.trim()) return;

    setIsProcessing(true);
    try {
      await PresalesService.addGapAnalysisItem(
        request.id,
        {
          area: gapArea.trim(),
          customerRequirement: gapCustomerReq.trim(),
          ourCapability: gapCapability.trim(),
          severity: gapSeverity,
          mitigationStrategy: gapMitigation.trim(),
          status: gapResolution,
        },
        profile
      );

      const refreshed = await PresalesService.getPresalesRequestById(request.id);
      if (refreshed.data) onUpdateRequest(refreshed.data);

      setShowAddGapModal(false);
      setGapArea('');
      setGapCustomerReq('');
      setGapCapability('');
      setGapMitigation('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete Gap Handler
  const handleDeleteGap = async (gapId: string) => {
    try {
      await PresalesService.deleteGapAnalysisItem(request.id, gapId);
      const refreshed = await PresalesService.getPresalesRequestById(request.id);
      if (refreshed.data) onUpdateRequest(refreshed.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Reassign SA Handler
  const handleReassignArchitect = async (saId: string) => {
    if (!saId) return;
    setIsProcessing(true);
    try {
      const res = await PresalesService.assignSolutionsArchitect(
        request.id,
        saId,
        `Assigned by ${profile?.name || 'Presales Lead'}`,
        profile
      );
      if (res.data) onUpdateRequest(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const getComplianceBadge = (status: RequirementComplianceStatus) => {
    switch (status) {
      case 'Compliant':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Partial':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Non_Compliant':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Not_Applicable':
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getSeverityBadge = (sev: GapSeverity) => {
    switch (sev) {
      case 'Critical':
        return 'bg-rose-50 text-rose-700 border-rose-300 font-bold';
      case 'Major':
        return 'bg-amber-50 text-amber-700 border-amber-300 font-semibold';
      case 'Minor':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Info':
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {request.requestCode}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${currentStatusConf?.bgLight} ${currentStatusConf?.color}`}>
                {currentStatusConf?.label || request.status}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${priorityConf.bgLight} ${priorityConf.color}`}>
                {priorityConf.label}
              </span>
              {request.pocRequired && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Boxes className="w-3 h-3" />
                  <span>POC Loaner Required</span>
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">{request.title}</h2>
            <p className="text-xs text-slate-300 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <strong>{request.accountName}</strong> ({request.accountIndustry || 'Enterprise'})
              </span>
              {request.opportunityCode && (
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{request.opportunityCode} &bull; Rp {((request.dealValue || 0) / 1_000_000_000).toFixed(1)}B</span>
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenEditModal(request)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
            <button
              onClick={() => {
                setTargetStatus(request.status);
                setShowStatusModal(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Advance Status</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SLA Countdown Bar */}
        <div className="px-6 py-2 bg-slate-950/90 text-xs text-slate-300 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Clock className={`w-3.5 h-3.5 ${request.slaHoursRemaining <= 12 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
              <span className="font-semibold">
                SLA Countdown: <strong className={request.slaHoursRemaining <= 12 ? 'text-rose-400 font-mono' : 'text-amber-300 font-mono'}>{request.slaHoursRemaining} Hours Remaining</strong>
              </span>
            </div>
            <span className="text-slate-500">&bull;</span>
            <span className="text-slate-400">
              Total SLA: {request.slaHoursTotal}h &bull; Target Deadline: <strong>{request.deadlineDate}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">{slaPctConsumed}% Elapsed</span>
            <div className="w-24 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  request.slaHoursRemaining <= 12 ? 'bg-rose-500' : request.slaHoursRemaining <= 24 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${slaPctConsumed}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'border-indigo-600 text-indigo-600 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Overview & Scope</span>
            </button>
            <button
              onClick={() => setActiveTab('requirements')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'requirements'
                  ? 'border-indigo-600 text-indigo-600 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Technical Requirements</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-mono">
                {request.requirements?.length || 0}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('gaps')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'gaps'
                  ? 'border-indigo-600 text-indigo-600 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Gap Analysis</span>
              {(request.gapAnalysis?.length || 0) > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900 font-mono font-bold">
                  {request.gapAnalysis?.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('assignment')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'assignment'
                  ? 'border-indigo-600 text-indigo-600 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Architect Workload</span>
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'border-indigo-600 text-indigo-600 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Timeline</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <span>Type: <strong>{typeConf?.label || request.requestType}</strong></span>
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: OVERVIEW & SCOPE */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[11px] text-slate-500 font-medium block">Estimated BOQ / Deal</span>
                  <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                    Rp {((request.estimatedBoqValue || request.dealValue || 0) / 1_000_000_000).toFixed(2)} M
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    Target Margin: {request.targetMarginPct || 25}%
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[11px] text-slate-500 font-medium block">Sizing Workloads</span>
                  <div className="text-lg font-bold text-indigo-600 font-mono mt-0.5">
                    {request.sizingWorkloadsCount || 10} VMs / Nodes
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Calculated in Sizing Engine
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[11px] text-slate-500 font-medium block">Account Executive (Sales)</span>
                  <div className="text-xs font-bold text-slate-900 mt-1">
                    {request.assignedAeName || 'Rian Hidayat'}
                  </div>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {request.assignedAeEmail || 'ae@enterprise.com'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[11px] text-slate-500 font-medium block">Lead Solutions Architect</span>
                  <div className="text-xs font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                    {request.assignedSaName ? (
                      <span className="text-indigo-700 font-semibold">{request.assignedSaName}</span>
                    ) : (
                      <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        Unassigned
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {request.assignedSaEmail || 'Awaiting assignment'}
                  </span>
                </div>
              </div>

              {/* Scope Description & Technical Notes */}
              <div className="space-y-4">
                <div className="p-4.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Scope & Technical Objectives</span>
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {request.scopeDescription}
                  </p>
                </div>

                {request.technicalNotes && (
                  <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/70 space-y-1.5">
                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Technical Constraints & OEM Notes</span>
                    </h4>
                    <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-line">
                      {request.technicalNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Technology Domains */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Target Technology Architecture Stacks
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {request.techDomains.map((dom) => (
                    <span
                      key={dom}
                      className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80"
                    >
                      {dom}
                    </span>
                  ))}
                </div>
              </div>

              {/* Presales Engine Quick Actions */}
              <div className="p-4.5 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold flex items-center gap-1.5 text-indigo-300">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Presales Engineering Workflows</span>
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Launch integrated tooling to compute specs, build BOQ SKUs, or generate client SOW
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <button
                    onClick={() => onNavigateToModule && onNavigateToModule('sizing-engine')}
                    className="p-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 transition-colors flex items-center gap-2.5 text-left text-xs font-semibold text-white"
                  >
                    <Calculator className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <span className="block">Technical Sizing Engine</span>
                      <span className="text-[10px] text-slate-400 font-normal">vCPU / IOPS / RAM</span>
                    </div>
                  </button>

                  <button
                    onClick={() => onNavigateToModule && onNavigateToModule('boq-pricing')}
                    className="p-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 transition-colors flex items-center gap-2.5 text-left text-xs font-semibold text-white"
                  >
                    <ReceiptText className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="block">Dynamic BOQ & Pricing</span>
                      <span className="text-[10px] text-slate-400 font-normal">Line-item rate cards</span>
                    </div>
                  </button>

                  <button
                    onClick={() => onNavigateToModule && onNavigateToModule('sow-builder')}
                    className="p-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 transition-colors flex items-center gap-2.5 text-left text-xs font-semibold text-white"
                  >
                    <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="block">SOW & Scope Generator</span>
                      <span className="text-[10px] text-slate-400 font-normal">RACI & Milestones</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TECHNICAL REQUIREMENTS MATRIX */}
          {activeTab === 'requirements' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Customer RFP & Architecture Requirement Checklist
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Verify compliance score, propose technical solutions, and record benchmark proofs
                  </p>
                </div>

                <button
                  onClick={() => setShowAddReqModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Requirement</span>
                </button>
              </div>

              {/* Requirement Items List */}
              {(!request.requirements || request.requirements.length === 0) ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl space-y-2">
                  <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">No technical requirements added yet.</p>
                  <button
                    onClick={() => setShowAddReqModal(true)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    + Add first RFP requirement
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {request.requirements.map((req, idx) => (
                    <div
                      key={req.id}
                      className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              REQ #{idx + 1}
                            </span>
                            <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              {req.category}
                            </span>
                          </div>
                          <h5 className="text-xs font-bold text-slate-900 leading-snug">
                            {req.requirementText}
                          </h5>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Compliance Status Selector */}
                          <select
                            value={req.complianceStatus}
                            onChange={(e) =>
                              handleUpdateReqStatus(req.id, e.target.value as RequirementComplianceStatus)
                            }
                            className={`text-xs font-bold px-2 py-1 rounded-lg border focus:outline-none ${getComplianceBadge(
                              req.complianceStatus
                            )}`}
                          >
                            <option value="Compliant">✓ Compliant</option>
                            <option value="Partial">⚠ Partial</option>
                            <option value="Non_Compliant">✕ Non-Compliant</option>
                            <option value="Not_Applicable">N/A</option>
                          </select>

                          <button
                            onClick={() => handleDeleteRequirement(req.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {req.proposedSolution && (
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs space-y-1">
                          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                            Proposed Architecture Solution:
                          </span>
                          <p className="text-slate-800">{req.proposedSolution}</p>
                        </div>
                      )}

                      {req.notes && (
                        <div className="text-[11px] text-slate-500 italic pl-1 border-l-2 border-slate-200">
                          Proof / Notes: {req.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GAP ANALYSIS */}
          {activeTab === 'gaps' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Technical Gap Analysis & Risk Mitigation Register</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Track architectural constraints, OEM limitations, and contractual trade-offs
                  </p>
                </div>

                <button
                  onClick={() => setShowAddGapModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Gap / Risk</span>
                </button>
              </div>

              {(!request.gapAnalysis || request.gapAnalysis.length === 0) ? (
                <div className="p-8 text-center border border-dashed border-emerald-200 bg-emerald-50/40 rounded-xl space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs text-emerald-900 font-bold">No architectural gaps or non-compliance logged.</p>
                  <p className="text-[11px] text-emerald-700">All customer specifications are 100% matched by standard capability.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {request.gapAnalysis.map((gap) => (
                    <div
                      key={gap.id}
                      className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getSeverityBadge(gap.severity)}`}>
                              {gap.severity} Severity
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              Status: {gap.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <h5 className="text-xs font-bold text-slate-900 mt-1">{gap.area}</h5>
                        </div>

                        <button
                          onClick={() => handleDeleteGap(gap.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-200/60">
                          <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block mb-0.5">
                            Customer Requirement / Penalty Ask:
                          </span>
                          <p className="text-rose-950">{gap.customerRequirement}</p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-0.5">
                            Our Current Capability / OEM Constraint:
                          </span>
                          <p className="text-slate-800">{gap.ourCapability}</p>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200/80 text-xs">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-0.5">
                          Mitigation Strategy & Workaround:
                        </span>
                        <p className="text-emerald-950 font-medium">{gap.mitigationStrategy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ARCHITECT WORKLOAD & ASSIGNMENT */}
          {activeTab === 'assignment' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Current Solutions Architecture Lead
                </h4>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm">
                      {request.assignedSaName ? request.assignedSaName.charAt(0) : '?'}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">
                        {request.assignedSaName || 'Unassigned Queue'}
                      </h5>
                      <p className="text-[11px] text-slate-500">
                        {request.assignedSaEmail || 'Awaiting Presales Lead assignment'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Lead SA
                  </span>
                </div>
              </div>

              {/* SA Pool Workload List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Solutions Architects Capacity Matrix
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SOLUTIONS_ARCHITECTS_POOL.map((sa) => {
                    const isCurrent = sa.id === request.assignedSaId;
                    return (
                      <div
                        key={sa.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isCurrent
                            ? 'bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={sa.avatarUrl}
                              alt={sa.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <h5 className="text-xs font-bold text-slate-900">{sa.name}</h5>
                              <p className="text-[10px] text-slate-500">{sa.email}</p>
                            </div>
                          </div>

                          {!isCurrent ? (
                            <button
                              onClick={() => handleReassignArchitect(sa.id)}
                              disabled={isProcessing}
                              className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 text-slate-700 text-[11px] font-semibold transition-all shadow-2xs"
                            >
                              Assign SA
                            </button>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">
                              Active Lead
                            </span>
                          )}
                        </div>

                        {/* Capacity meter */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600">Active Load</span>
                            <span className="font-bold text-slate-900 font-mono">
                              {sa.activeRequestsCount}/{sa.maxCapacity} Requests ({sa.utilizationPct}%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                sa.utilizationPct > 80 ? 'bg-amber-500' : 'bg-indigo-600'
                              }`}
                              style={{ width: `${sa.utilizationPct}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                            <span>SLA On-Time: <strong>{sa.slaOnTimeRatePct}%</strong></span>
                            <span>Avg Turnaround: <strong>{sa.avgTurnaroundHours}h</strong></span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Presales Request Audit & SLA Event Log
              </h4>

              {(!request.timeline || request.timeline.length === 0) ? (
                <p className="text-xs text-slate-400">No activity recorded yet.</p>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {request.timeline.map((event) => (
                    <div key={event.id} className="relative space-y-1">
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-indigo-100" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{event.action}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(event.timestamp).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        By <strong>{event.actorName}</strong> ({event.actorRole})
                      </p>
                      {event.notes && (
                        <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                          {event.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <span>Created: {new Date(request.createdAt).toLocaleDateString()}</span>
            <span>&bull;</span>
            <span>Last Updated: {new Date(request.updatedAt || request.createdAt).toLocaleDateString()}</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>

      {/* SUB-MODAL: ADVANCE STATUS */}
      {showStatusModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Advance Presales Stage</h3>
                <p className="text-xs text-slate-500">Record milestone transition & audit notes</p>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Presales Stage
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as PresalesRequestDbStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {PRESALES_STATUS_CONFIG.map((st) => (
                    <option key={st.key} value={st.key}>
                      {st.label} ({st.description})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Transition Notes / Sign-off Comments
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Sizing calculations approved; BOQ v1 ready with 25% margin floor..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAdvanceStatus(targetStatus, statusNotes)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700"
              >
                {isProcessing ? 'Updating...' : 'Confirm Stage Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL: ADD TECHNICAL REQUIREMENT */}
      {showAddReqModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Add Technical Requirement</h3>
                <p className="text-xs text-slate-500">Add RFP clause or customer architecture specification</p>
              </div>
              <button
                onClick={() => setShowAddReqModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRequirement} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={reqCategory}
                    onChange={(e) => setReqCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                  >
                    <option value="Compute & Hypervisor">Compute & Hypervisor</option>
                    <option value="Storage & IOPS">Storage & IOPS</option>
                    <option value="Network & Security">Network & Security</option>
                    <option value="High Availability & DR">High Availability & DR</option>
                    <option value="Compliance & Governance">Compliance & Governance</option>
                    <option value="Cloud & API Integration">Cloud & API Integration</option>
                    <option value="SLA & Support Matrix">SLA & Support Matrix</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Initial Compliance Status *
                  </label>
                  <select
                    value={reqStatus}
                    onChange={(e) => setReqStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold"
                  >
                    <option value="Compliant">✓ Compliant</option>
                    <option value="Partial">⚠ Partial</option>
                    <option value="Non_Compliant">✕ Non-Compliant</option>
                    <option value="Not_Applicable">N/A</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Requirement Specification Text *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Sub-millisecond latency at 120,000 sustained Random 8K IOPS with synchronous replication..."
                  value={reqText}
                  onChange={(e) => setReqText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Proposed Architecture Solution
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nutanix All-NVMe 4-node cluster with Metro Availability Witness"
                  value={reqSolution}
                  onChange={(e) => setReqSolution(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Verification Notes / Benchmark Evidence
                </label>
                <input
                  type="text"
                  placeholder="e.g. Verified with OEM sizing portal; test data in POC appendix A"
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddReqModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-xs"
                >
                  Save Requirement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: ADD GAP ANALYSIS ITEM */}
      {showAddGapModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Log Technical Gap / Risk</h3>
                <p className="text-xs text-slate-500">Record architectural mismatch and workaround</p>
              </div>
              <button
                onClick={() => setShowAddGapModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddGap} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Risk / Gap Area *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2-Hour Onsite SLA Penalty"
                    value={gapArea}
                    onChange={(e) => setGapArea(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Severity *
                  </label>
                  <select
                    value={gapSeverity}
                    onChange={(e) => setGapSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold"
                  >
                    <option value="Critical">Critical (Deal Blocker)</option>
                    <option value="Major">Major (High Impact)</option>
                    <option value="Minor">Minor (Manageable)</option>
                    <option value="Info">Info (Clarification)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Customer Requirement / Penalty Ask *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Customer demands 2-hour onsite hardware replacement penalty..."
                  value={gapCustomerReq}
                  onChange={(e) => setGapCustomerReq(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Our Capability / OEM Constraint *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OEM default support is 4-hour onsite response"
                  value={gapCapability}
                  onChange={(e) => setGapCapability(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mitigation Strategy & Workaround *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Add local partner 24x7 standby SLA rider with spare parts in Jakarta warehouse..."
                  value={gapMitigation}
                  onChange={(e) => setGapMitigation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddGapModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-lg bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 shadow-xs"
                >
                  Save Gap Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
