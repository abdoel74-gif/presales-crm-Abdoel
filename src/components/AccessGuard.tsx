import React, { useEffect, useRef } from 'react';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../lib/AuthContext.tsx';
import { AppPermissionModule, AppAction, MODULE_ACCESS_DESCRIPTIONS } from '../lib/auth-rbac.ts';
import { UserRole } from '../types.ts';
import { logAuditAction } from '../lib/audit-service.ts';

interface AccessGuardProps {
  module: AppPermissionModule;
  action?: AppAction;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  onBackToDashboard?: () => void;
}

export const AccessGuard: React.FC<AccessGuardProps> = ({
  module,
  action = 'view',
  fallback,
  children,
  onBackToDashboard,
}) => {
  const { currentRole, canAccess, profile, setCurrentRole } = useAuth();
  const allowed = canAccess(module, action as AppAction);
  const loggedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!allowed) {
      const logKey = `${currentRole}:${module}:${action}`;
      if (loggedRef.current !== logKey) {
        loggedRef.current = logKey;
        // Log unauthorized attempt to audit log
        logAuditAction({
          action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          module,
          entityType: 'SecurityPolicy',
          entityId: `sec-pol-${module}-${action}`,
          entityName: `${module} (${action})`,
          userProfile: profile,
          userRole: currentRole,
          oldValues: null,
          newValues: { attemptedRoute: `/${module}`, attemptedAction: action, activeRole: currentRole },
          diffSummary: `AccessGuard blocked direct URL / module access to [${module}] for role [${currentRole}] (HTTP 403 Forbidden).`,
          severity: 'SECURITY',
        });
      }
    }
  }, [allowed, currentRole, module, action, profile]);

  if (allowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const moduleInfo = MODULE_ACCESS_DESCRIPTIONS[module] || {
    title: module,
    minRequiredRoles: 'Elevated administrative roles',
    description: 'This module is protected under company Row-Level Security and Role-Based Access Control policies.',
  };

  return (
    <div className="min-h-[520px] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-rose-200/80 overflow-hidden text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Top Danger Bar */}
        <div className="h-2 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600" />

        <div className="p-8">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600 mb-5 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100/80 text-rose-800 text-xs font-semibold uppercase tracking-wider mb-3">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Access Restricted (RBAC Gate)</span>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Unauthorized: {moduleInfo.title}
          </h2>

          <p className="text-xs text-slate-600 leading-relaxed mb-6">
            Your current role (<strong className="text-slate-800 uppercase font-mono">{currentRole}</strong>) lacks permission to <strong>{action}</strong> this module.
          </p>

          {/* Module Requirements Box */}
          <div className="text-left bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 space-y-2">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Required Roles</span>
              <span className="text-xs font-medium text-indigo-700">{moduleInfo.minRequiredRoles}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Module Description</span>
              <span className="text-xs text-slate-600">{moduleInfo.description}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Authenticated as:</span>
              <span className="font-semibold text-slate-700">{profile?.name} ({profile?.email})</span>
            </div>
          </div>

          {/* Quick RBAC Switcher for Review/Testing */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 mb-6 text-left">
            <div className="text-[11px] font-semibold text-indigo-900 mb-1.5 flex items-center justify-between">
              <span>Switch Simulated Role to Test Access:</span>
              <span className="text-[10px] text-indigo-600 font-mono">SUPABASE RLS</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setCurrentRole(UserRole.SUPER_ADMIN)}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-[11px] font-medium hover:bg-indigo-700 transition-colors text-center"
              >
                Super Admin (Unlock All)
              </button>
              <button
                onClick={() => setCurrentRole(UserRole.SALES_DIRECTOR)}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-[11px] font-medium hover:bg-slate-50 transition-colors text-center"
              >
                Sales Director
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3">
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Dashboard</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
