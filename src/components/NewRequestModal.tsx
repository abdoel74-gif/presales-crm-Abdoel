import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { PresalesStatus, PriorityLevel, PresalesTask } from '../types.ts';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newTask: Partial<PresalesTask>) => void;
}

export const NewRequestModal: React.FC<NewRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [accountName, setAccountName] = useState('');
  const [opportunityTitle, setOpportunityTitle] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>(PriorityLevel.HIGH);
  const [techDomain, setTechDomain] = useState<string>('Hyperconverged Infra, Cloud Migration');
  const [pocRequired, setPocRequired] = useState(false);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName || !opportunityTitle) return;

    onSubmit({
      requestCode: `PSR-2026-${Math.floor(100 + Math.random() * 900)}`,
      opportunityTitle,
      accountName,
      status: PresalesStatus.IN_ANALYSIS,
      priority,
      techDomain: techDomain.split(',').map((s) => s.trim()),
      leadArchitect: 'Abdoel',
      sizingWorkloadsCount: 12,
      boqMargin: 25.0,
      slaDueHours: priority === PriorityLevel.URGENT ? 24 : 48,
      slaBreached: false,
      pocRequired,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Create Presales & Technical Sizing Request
            </h2>
            <p className="text-xs text-slate-500">
              Submit RFP, Sizing, or POC request for Solutions Architecture team
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Account / Customer Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Bank Central Asia Tbk, PT Pertamina"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Opportunity / Project Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Core Banking High-Availability Nutanix HCI Sizing"
              value={opportunityTitle}
              onChange={(e) => setOpportunityTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Priority SLA Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value={PriorityLevel.URGENT}>Urgent (24h SLA)</option>
                <option value={PriorityLevel.HIGH}>High (48h SLA)</option>
                <option value={PriorityLevel.MEDIUM}>Medium (72h SLA)</option>
                <option value={PriorityLevel.LOW}>Low</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                POC / Demo Required?
              </label>
              <div className="flex items-center h-[38px]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pocRequired}
                    onChange={(e) => setPocRequired(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="text-slate-700 font-medium">Require Loaner Hardware</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Technology Domains (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. HCI, Dell PowerEdge, VMware, SASE Fortinet"
              value={techDomain}
              onChange={(e) => setTechDomain(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Architecture / Sizing Notes
            </label>
            <textarea
              rows={3}
              placeholder="Provide VM specifications, IOPS requirements, network topology, or attach RFP documents..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-indigo-900 leading-tight">
              <strong>Gemini AI Auto-Dispatch:</strong> This request will automatically notify the Solutions Architect queue and trigger a WhatsApp notification to the assigned lead.
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-xs shadow-indigo-500/30 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Submit Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
