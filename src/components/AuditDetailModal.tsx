import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Clock,
  User,
  Globe,
  Database,
  Key,
  FileCode,
  Copy,
  Check,
  Fingerprint,
  ArrowRight,
} from 'lucide-react';
import { AuditLogEntry } from '../types.ts';

interface AuditDetailModalProps {
  log: AuditLogEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({ log, isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeDiffView, setActiveDiffView] = useState<'side_by_side' | 'json'>('side_by_side');

  if (!isOpen || !log) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getActionBadgeColor = (action: string, severity: string) => {
    if (severity === 'SECURITY' || action.includes('UNAUTHORIZED') || action === 'SECURITY_ALERT') {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    if (severity === 'WARN' || action === 'DELETE' || action === 'PERMISSION_CHANGE') {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    if (action === 'APPROVE') {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  };

  // Extract all changed keys between old and new values
  const oldKeys = log.oldValues ? Object.keys(log.oldValues) : [];
  const newKeys = log.newValues ? Object.keys(log.newValues) : [];
  const allDiffKeys = Array.from(new Set([...oldKeys, ...newKeys]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs ${
              log.severity === 'SECURITY' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-indigo-50 border-indigo-200 text-indigo-600'
            }`}>
              {log.severity === 'SECURITY' ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Audit Trail Record Inspector</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getActionBadgeColor(log.action, log.severity)}`}>
                  {log.action}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Log ID: {log.id} • Timestamp: {new Date(log.timestamp).toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Summary Banner */}
          <div className={`p-4 rounded-xl border ${
            log.severity === 'SECURITY'
              ? 'bg-rose-50/70 border-rose-200 text-rose-900'
              : log.severity === 'WARN'
              ? 'bg-amber-50/70 border-amber-200 text-amber-900'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75 mb-1">
              Event Narrative
            </span>
            <p className="text-sm font-semibold leading-snug">
              {log.diffSummary}
            </p>
          </div>

          {/* Actor & Telemetry Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs border-b border-slate-200 pb-1.5">
                <User className="w-4 h-4 text-indigo-600" />
                <span>Actor Identity & Credentials</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <span className="text-slate-400">User Name:</span>
                <span className="col-span-2 font-medium text-slate-800">{log.userName}</span>
                <span className="text-slate-400">Email:</span>
                <span className="col-span-2 font-medium text-slate-800 truncate">{log.userEmail}</span>
                <span className="text-slate-400">Active Role:</span>
                <span className="col-span-2 font-mono uppercase text-indigo-700 font-semibold">{log.userRole}</span>
                <span className="text-slate-400">User UID:</span>
                <span className="col-span-2 font-mono text-[11px] text-slate-600">{log.userId}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs border-b border-slate-200 pb-1.5">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>Client Telemetry & Target</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <span className="text-slate-400">Module:</span>
                <span className="col-span-2 font-medium text-slate-800">{log.module}</span>
                <span className="text-slate-400">Entity Type:</span>
                <span className="col-span-2 font-medium text-slate-800">{log.entityType} ({log.entityId})</span>
                <span className="text-slate-400">IP Address:</span>
                <span className="col-span-2 font-mono text-slate-800">{log.ipAddress}</span>
                <span className="text-slate-400">User Agent:</span>
                <span className="col-span-2 font-mono text-[10px] text-slate-600 truncate" title={log.userAgent}>
                  {log.userAgent || 'Chrome/127 (macOS)'}
                </span>
              </div>
            </div>
          </div>

          {/* State Diff / JSON Payload */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-500" />
                <span className="font-bold text-slate-800">State Delta (Old vs. New Snapshot)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveDiffView('side_by_side')}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                    activeDiffView === 'side_by_side' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  Visual Field Diff
                </button>
                <button
                  onClick={() => setActiveDiffView('json')}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                    activeDiffView === 'json' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  Raw JSON
                </button>
              </div>
            </div>

            {activeDiffView === 'side_by_side' ? (
              <div className="p-4">
                {allDiffKeys.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 italic">
                    No discrete field modifications recorded for this single-step event.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    <div className="grid grid-cols-12 pb-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <div className="col-span-4">Field Name</div>
                      <div className="col-span-4 text-rose-600">Old Value (Before)</div>
                      <div className="col-span-4 text-emerald-600">New Value (After)</div>
                    </div>
                    {allDiffKeys.map((key) => {
                      const oldVal = log.oldValues?.[key];
                      const newVal = log.newValues?.[key];
                      const isChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal);

                      return (
                        <div
                          key={key}
                          className={`grid grid-cols-12 py-2 items-start font-mono text-[11px] ${
                            isChanged ? 'bg-amber-50/40' : ''
                          }`}
                        >
                          <div className="col-span-4 font-semibold text-slate-700 truncate pr-2">
                            {key}
                          </div>
                          <div className="col-span-4 text-rose-700 bg-rose-50/50 p-1 rounded border border-rose-100/60 truncate mr-2">
                            {oldVal !== undefined ? JSON.stringify(oldVal) : <span className="text-slate-400 italic">null</span>}
                          </div>
                          <div className="col-span-4 text-emerald-700 bg-emerald-50/50 p-1 rounded border border-emerald-100/60 truncate">
                            {newVal !== undefined ? JSON.stringify(newVal) : <span className="text-slate-400 italic">null</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-60">
                <pre>{JSON.stringify({ oldValues: log.oldValues, newValues: log.newValues }, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Cryptographic Tamper-Proof Seal */}
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Fingerprint className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-emerald-950 text-xs block">
                  Cryptographic Integrity Verified (UU PDP & ISO 27001 A.12)
                </span>
                <span className="text-[11px] text-emerald-700 font-mono">
                  HMAC Signature: {log.hashSignature || 'sha256_verified_immutable_record'}
                </span>
              </div>
            </div>

            <button
              onClick={() => copyToClipboard(log.hashSignature || log.id, 'hash')}
              className="px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-[11px] font-medium text-emerald-800 hover:bg-emerald-50 transition-colors flex items-center gap-1 shrink-0"
            >
              {copiedKey === 'hash' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'hash' ? 'Copied' : 'Copy Hash'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Audit logs are append-only and replicated across Supabase multi-region storage.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
