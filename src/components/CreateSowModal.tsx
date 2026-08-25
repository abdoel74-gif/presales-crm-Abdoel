import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Building,
  DollarSign,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  SowFormData,
  SowDeliverable,
  SowRaciItem,
  SowTimelinePhase,
  Opportunity,
  PresalesRequest,
  UserProfile,
} from '../types.ts';
import { INITIAL_OPPORTUNITY_RECORDS } from '../data/initialOpportunitiesData.ts';
import { INITIAL_PRESALES_REQUESTS } from '../data/initialPresalesData.ts';
import { SowHandoverService } from '../lib/sow-handover-service.ts';

interface CreateSowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  currentProfile?: UserProfile;
}

export const CreateSowModal: React.FC<CreateSowModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  currentProfile,
}) => {
  const [selectedOppId, setSelectedOppId] = useState(INITIAL_OPPORTUNITY_RECORDS[0]?.id || '');
  const [selectedReqId, setSelectedReqId] = useState(INITIAL_PRESALES_REQUESTS[0]?.id || '');
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [projectBackground, setProjectBackground] = useState('');
  const [customerContactName, setCustomerContactName] = useState('Irwan Setiawan');
  const [customerContactEmail, setCustomerContactEmail] = useState('irwan.setiawan@bankmandiri.co.id');
  const [customerContactRole, setCustomerContactRole] = useState('Head of Cloud Infrastructure');
  const [inScopeItems, setInScopeItems] = useState<string[]>([
    'Physical staging and racking in datacenter server racks.',
    'Cluster initialization, OS deployment, and network IP fabric configuration.',
    'Workload migration, HA failover validation, and UAT signoff.',
    'Operational runbook handoff and 1-week hypercare standby.',
  ]);
  const [outScopeItems, setOutScopeItems] = useState<string[]>([
    'Civil works, building facility upgrades, and dedicated dark fiber trenching.',
    'Database application schema restructuring not related to platform virtualization.',
  ]);
  const [newInScope, setNewInScope] = useState('');
  const [newOutScope, setNewOutScope] = useState('');
  const [contractValueIDR, setContractValueIDR] = useState<number>(10000000000);
  const [warrantyMonths, setWarrantyMonths] = useState<number>(36);
  const [slaHours, setSlaHours] = useState<number>(4);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Synchronize when opportunity changes
  useEffect(() => {
    const opp = INITIAL_OPPORTUNITY_RECORDS.find((o) => o.id === selectedOppId);
    if (opp) {
      setExecutiveSummary(`Turnkey solution architecture, deployment, and operational commissioning for ${opp.title} at ${opp.accountName}.`);
      setProjectBackground(`Deliver enterprise high-availability infrastructure modernization aligning with ${opp.accountName} technical criteria and workload SLA requirements.`);
      setContractValueIDR(opp.dealValue || 10000000000);
    }
  }, [selectedOppId]);

  if (!isOpen) return null;

  const selectedOpp = INITIAL_OPPORTUNITY_RECORDS.find((o) => o.id === selectedOppId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpp) {
      setErrorMessage('Please select an opportunity');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const formData: SowFormData = {
      requestId: selectedReqId,
      opportunityId: selectedOpp.id,
      opportunityTitle: selectedOpp.title,
      accountId: selectedOpp.accountId,
      accountName: selectedOpp.accountName,
      customerContactName,
      customerContactEmail,
      customerContactRole,
      version: 'v1.0',
      executiveSummary,
      projectBackground,
      scopeInScope: inScopeItems,
      scopeOutOfScope: outScopeItems,
      deliverables: [
        {
          id: `del_${Date.now()}_1`,
          phase: 'Phase 1: Architecture & Site Readiness',
          title: 'High-Level & Low-Level Design (HLD/LLD) Dossier',
          description: 'Comprehensive network topology, cabling plan, and hypervisor cluster design signed off by Customer EA team.',
          acceptanceCriteria: 'Signed approval by Customer Lead Architect.',
          estDurationDays: 14,
          targetCompletionDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          ownerRole: 'Principal Solutions Architect',
        },
        {
          id: `del_${Date.now()}_2`,
          phase: 'Phase 2: Hardware Staging & Platform Build',
          title: 'Physical Staging, Burn-In Testing & Cluster Deployment',
          description: 'Delivery of hardware nodes, burn-in diagnostic checks, and cluster initialization.',
          acceptanceCriteria: 'Passes 100% diagnostic health checks.',
          estDurationDays: 21,
          targetCompletionDate: new Date(Date.now() + 35 * 86400000).toISOString().split('T')[0],
          ownerRole: 'Senior Implementation Engineer',
        },
        {
          id: `del_${Date.now()}_3`,
          phase: 'Phase 3: Production Cutover & UAT',
          title: 'Workload Cutover, Training & As-Built Handover',
          description: 'Production migration, administrator training, and final handover certificate.',
          acceptanceCriteria: 'Signed UAT certificate.',
          estDurationDays: 14,
          targetCompletionDate: new Date(Date.now() + 49 * 86400000).toISOString().split('T')[0],
          ownerRole: 'Delivery Project Manager',
        },
      ],
      raciMatrix: [
        {
          id: `raci_${Date.now()}_1`,
          activity: 'Datacenter Space, Power & Cooling Allocation',
          responsible: 'Customer Facilities Team',
          accountable: customerContactName,
          consulted: 'Vendor Solutions Architect',
          informed: 'Delivery Project Manager',
        },
        {
          id: `raci_${Date.now()}_2`,
          activity: 'Low-Level Design (LLD) & Configuration Approval',
          responsible: 'Vendor Solutions Architect',
          accountable: customerContactName,
          consulted: 'Network Security Team',
          informed: 'Sales Director',
        },
        {
          id: `raci_${Date.now()}_3`,
          activity: 'Final UAT Sign-Off & Project Acceptance',
          responsible: 'Vendor Delivery PM & Customer Lead',
          accountable: customerContactName,
          consulted: 'Audit & Compliance Division',
          informed: 'Executive Management',
        },
      ],
      projectTimeline: [
        {
          id: `pt_${Date.now()}_1`,
          phaseNumber: 1,
          name: 'Discovery, Planning & LLD Approval',
          durationWeeks: 2,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          milestoneDeliverable: 'Approved LLD Document',
          status: 'In Progress',
        },
        {
          id: `pt_${Date.now()}_2`,
          phaseNumber: 2,
          name: 'Hardware Staging, Deployment & Commissioning',
          durationWeeks: 3,
          startDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
          endDate: new Date(Date.now() + 36 * 86400000).toISOString().split('T')[0],
          milestoneDeliverable: 'Cluster Commissioning & Health Check Passed',
          status: 'Pending',
        },
        {
          id: `pt_${Date.now()}_3`,
          phaseNumber: 3,
          name: 'Workload Migration, UAT & Project Handover',
          durationWeeks: 2,
          startDate: new Date(Date.now() + 37 * 86400000).toISOString().split('T')[0],
          endDate: new Date(Date.now() + 51 * 86400000).toISOString().split('T')[0],
          milestoneDeliverable: 'Final Handover Certificate & As-Built Docs',
          status: 'Pending',
        },
      ],
      commercialTerms: {
        totalContractValueIDR: contractValueIDR,
        totalContractValueUSD: Math.round(contractValueIDR / 15500),
        paymentMilestones: [
          {
            id: `pm_${Date.now()}_1`,
            milestoneName: 'Contract Signing & Advance Payment',
            percentage: 30,
            amountIDR: Math.round(contractValueIDR * 0.3),
            amountUSD: Math.round((contractValueIDR * 0.3) / 15500),
            triggerCriteria: 'Contract execution and PO receipt.',
          },
          {
            id: `pm_${Date.now()}_2`,
            milestoneName: 'Hardware Staging & Cluster Commissioning',
            percentage: 50,
            amountIDR: Math.round(contractValueIDR * 0.5),
            amountUSD: Math.round((contractValueIDR * 0.5) / 15500),
            triggerCriteria: 'Hardware delivery to DC and initial commissioning.',
          },
          {
            id: `pm_${Date.now()}_3`,
            milestoneName: 'Final UAT Signoff & Project Handover',
            percentage: 20,
            amountIDR: Math.round(contractValueIDR * 0.2),
            amountUSD: Math.round((contractValueIDR * 0.2) / 15500),
            triggerCriteria: 'Final UAT certificate execution and As-Built handover.',
          },
        ],
        warrantyPeriodMonths: warrantyMonths,
        slaResolutionHours: slaHours,
        changeRequestTerms: 'Any modifications to scope or schedule must be approved via formal Project Change Request (PCR).',
        confidentialityClause: 'Strict confidentiality applies under executed Master Mutual NDA.',
        governingLaw: 'Governed under the laws of the Republic of Indonesia.',
      },
      acceptanceCriteria: [
        'All equipment operational in active cluster topology with zero alarm LEDs.',
        'High availability failover test successfully executed with no data loss.',
        'Customer administrator training completed for technical staff.',
        'Delivery of As-Built network topology diagrams and operations runbooks.',
      ],
      clientAssumptions: [
        'Customer provides rack space, power, cooling, and remote VPN access.',
        'Customer technical team attends scheduled cutover windows.',
      ],
    };

    const { data, error } = await SowHandoverService.createSowFromPresalesData(formData, currentProfile);
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error);
    } else {
      onCreated();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Generate Statement of Work (SOW)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Synthesize contractual scope, deliverables, RACI, timeline, and commercial terms from Presales & BOQ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-800 bg-slate-50/50">
          
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Opportunity & Presales Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Source Opportunity <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedOppId}
                onChange={(e) => setSelectedOppId(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {INITIAL_OPPORTUNITY_RECORDS.map((opp) => (
                  <option key={opp.id} value={opp.id}>
                    {opp.code} - {opp.title} ({opp.accountName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Presales Request Link <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedReqId}
                onChange={(e) => setSelectedReqId(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {INITIAL_PRESALES_REQUESTS.map((req) => (
                  <option key={req.id} value={req.id}>
                    {req.requestCode} - {req.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer Stakeholder Contact */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-blue-700">
              Customer Signer & Primary Technical SPOC
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Signer Name</label>
                <input
                  type="text"
                  value={customerContactName}
                  onChange={(e) => setCustomerContactName(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Signer Email</label>
                <input
                  type="email"
                  value={customerContactEmail}
                  onChange={(e) => setCustomerContactEmail(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Designation / Role</label>
                <input
                  type="text"
                  value={customerContactRole}
                  onChange={(e) => setCustomerContactRole(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Executive Summary & Background */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Executive Summary</label>
              <textarea
                value={executiveSummary}
                onChange={(e) => setExecutiveSummary(e.target.value)}
                rows={3}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Project Background & Customer Context</label>
              <textarea
                value={projectBackground}
                onChange={(e) => setProjectBackground(e.target.value)}
                rows={2}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Scope In / Out */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* In-Scope */}
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
              <h4 className="font-bold text-emerald-900 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                In-Scope Commitments ({inScopeItems.length})
              </h4>
              <ul className="space-y-1.5 mb-2 max-h-36 overflow-y-auto">
                {inScopeItems.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between bg-white p-1.5 rounded border border-emerald-100 text-[11px]">
                    <span className="truncate flex-1">{item}</span>
                    <button
                      type="button"
                      onClick={() => setInScopeItems(inScopeItems.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-600 p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newInScope}
                  onChange={(e) => setNewInScope(e.target.value)}
                  placeholder="Add scope item..."
                  className="flex-1 text-[11px] px-2 py-1 bg-white border border-slate-300 rounded"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newInScope.trim()) {
                        setInScopeItems([...inScopeItems, newInScope.trim()]);
                        setNewInScope('');
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newInScope.trim()) {
                      setInScopeItems([...inScopeItems, newInScope.trim()]);
                      setNewInScope('');
                    }
                  }}
                  className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-medium"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Out-of-Scope */}
            <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200">
              <h4 className="font-bold text-rose-900 mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                Out-of-Scope Exclusions ({outScopeItems.length})
              </h4>
              <ul className="space-y-1.5 mb-2 max-h-36 overflow-y-auto">
                {outScopeItems.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between bg-white p-1.5 rounded border border-rose-100 text-[11px]">
                    <span className="truncate flex-1">{item}</span>
                    <button
                      type="button"
                      onClick={() => setOutScopeItems(outScopeItems.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-600 p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newOutScope}
                  onChange={(e) => setNewOutScope(e.target.value)}
                  placeholder="Add exclusion..."
                  className="flex-1 text-[11px] px-2 py-1 bg-white border border-slate-300 rounded"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newOutScope.trim()) {
                        setOutScopeItems([...outScopeItems, newOutScope.trim()]);
                        setNewOutScope('');
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newOutScope.trim()) {
                      setOutScopeItems([...outScopeItems, newOutScope.trim()]);
                      setNewOutScope('');
                    }
                  }}
                  className="px-2 py-1 bg-rose-600 text-white rounded text-[11px] font-medium"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Commercial & Contract Terms */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-blue-700">
              Commercial Values & SLA Terms
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Contract Value (IDR)</label>
                <input
                  type="number"
                  value={contractValueIDR}
                  onChange={(e) => setContractValueIDR(Number(e.target.value))}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Warranty Period (Months)</label>
                <input
                  type="number"
                  value={warrantyMonths}
                  onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Critical SLA Resolution (Hours)</label>
                <input
                  type="number"
                  value={slaHours}
                  onChange={(e) => setSlaHours(Number(e.target.value))}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isSubmitting ? 'Generating SOW...' : 'Synthesize & Create SOW'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
