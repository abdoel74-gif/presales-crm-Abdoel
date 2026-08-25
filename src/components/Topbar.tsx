import React, { useState } from 'react';
import {
  Search,
  Bell,
  MessageSquare,
  Shield,
  ChevronDown,
  Globe,
  Plus,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { UserProfile, UserRole } from '../types.ts';

interface TopbarProps {
  currentUser: UserProfile;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currency: 'IDR' | 'USD';
  setCurrency: (c: 'IDR' | 'USD') => void;
  onOpenNewRequest: () => void;
  onOpenWhatsAppDrawer: () => void;
  onOpenAuthModal?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentUser,
  currentRole,
  setCurrentRole,
  currency,
  setCurrency,
  onOpenNewRequest,
  onOpenWhatsAppDrawer,
  onOpenAuthModal,
}) => {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const roleLabels: Record<UserRole, { title: string; color: string }> = {
    [UserRole.SUPER_ADMIN]: { title: 'Super Admin (All Access)', color: 'bg-rose-500/10 text-rose-700 border-rose-200' },
    [UserRole.SALES_DIRECTOR]: { title: 'Sales Director', color: 'bg-purple-500/10 text-purple-700 border-purple-200' },
    [UserRole.SOLUTIONS_ARCHITECT]: { title: 'Solutions Architect (SA)', color: 'bg-indigo-500/10 text-indigo-700 border-indigo-200' },
    [UserRole.ACCOUNT_EXECUTIVE]: { title: 'Account Executive (AE)', color: 'bg-blue-500/10 text-blue-700 border-blue-200' },
    [UserRole.PRESALES_LEAD]: { title: 'Presales Team Lead', color: 'bg-amber-500/10 text-amber-700 border-amber-200' },
    [UserRole.DELIVERY_PM]: { title: 'Delivery Project Manager', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' },
  };

  return (
    <header
      id="main-topbar"
      className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-10"
    >
      {/* Search & Breadcrumb Area */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="global-search-input"
            placeholder="Search accounts, opportunities, RFPs, BOQs (Press ⌘K)..."
            className="w-full pl-9 pr-14 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 border border-slate-300">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Currency Switcher */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setCurrency('IDR')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              currency === 'IDR'
                ? 'bg-white text-slate-800 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            IDR (Rp)
          </button>
          <button
            onClick={() => setCurrency('USD')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              currency === 'USD'
                ? 'bg-white text-slate-800 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            USD ($)
          </button>
        </div>

        {/* WhatsApp Gateway Status Button */}
        <button
          id="btn-whatsapp-gateway"
          onClick={onOpenWhatsAppDrawer}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors text-xs font-medium"
        >
          <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span>WA Gateway</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        </button>

        {/* Quick Action: New Presales Request */}
        <button
          id="btn-new-presales-request"
          onClick={onOpenNewRequest}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-xs shadow-indigo-500/30 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Request</span>
        </button>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-slate-200" />

        {/* RBAC Role Switcher Preview */}
        <div className="relative">
          <button
            id="btn-role-switcher"
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${roleLabels[currentRole].color}`}
          >
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[130px]">{roleLabels[currentRole].title}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {roleDropdownOpen && (
            <div
              id="role-dropdown-menu"
              className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                Simulate RBAC Role (Supabase RLS)
              </div>
              {Object.values(UserRole).map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    setCurrentRole(role);
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    currentRole === role ? 'font-semibold text-indigo-600 bg-indigo-50/50' : 'text-slate-700'
                  }`}
                >
                  <span>{roleLabels[role].title}</span>
                  {currentRole === role && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            id="btn-notifications"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-800">Recent Alerts</span>
                <span className="text-[10px] text-indigo-600 font-medium cursor-pointer">Mark all read</span>
              </div>
              <div className="mt-2 space-y-2 text-xs">
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="font-medium text-amber-900">SLA Warning: Bank Mandiri</div>
                  <div className="text-[11px] text-amber-700 mt-0.5">Sizing calculation required within 8h.</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="font-medium text-slate-800">BOQ Approved: PT Telco</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Sales Director approved 28% margin quote.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & SSO Login Trigger */}
        <button
          type="button"
          onClick={onOpenAuthModal}
          className="flex items-center gap-2.5 pl-1 p-1 rounded-xl hover:bg-slate-100 transition-colors text-left"
          title="Manage Supabase Auth Session & Profile"
        >
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100"
          />
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-slate-800 leading-none">{currentUser.name}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{currentUser.department}</div>
          </div>
        </button>
      </div>
    </header>
  );
};
