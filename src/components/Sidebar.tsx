import React from 'react';
import {
  LayoutDashboard,
  Building2,
  TrendingUp,
  FileSpreadsheet,
  Calculator,
  ReceiptText,
  FileCheck2,
  FolderSync,
  Boxes,
  LifeBuoy,
  MessageSquareCode,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Layers,
} from 'lucide-react';
import { UserRole } from '../types.ts';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentRole: UserRole;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
  roles?: UserRole[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const sections: NavSection[] = [
    {
      title: 'Core CRM Pipeline',
      items: [
        { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
        { id: 'accounts', label: 'Accounts & Stakeholders', icon: Building2, badge: '48' },
        { id: 'opportunities', label: 'Opportunities (MEDDPICC)', icon: TrendingUp, badge: 'Rp 48.5M' },
      ],
    },
    {
      title: 'Presales Engineering',
      items: [
        { id: 'presales-queue', label: 'Presales Requests & RFP', icon: FileSpreadsheet, badge: '4 Active', badgeColor: 'bg-amber-500/15 text-amber-600 border border-amber-500/20' },
        { id: 'sizing-engine', label: 'Technical Sizing Engine', icon: Calculator },
        { id: 'boq-pricing', label: 'Dynamic BOQ & Pricing', icon: ReceiptText },
        { id: 'sow-builder', label: 'SOW & Scope Generator', icon: FileCheck2 },
      ],
    },
    {
      title: 'Delivery & Post-Sales',
      items: [
        { id: 'handover', label: 'Project Handover (Sales→PM)', icon: FolderSync, badge: '1 New' },
        { id: 'assets-poc', label: 'Demo Assets & POC Loaners', icon: Boxes, badge: '7 In Field' },
        { id: 'tech-desk', label: 'RFP Knowledge & Tech Desk', icon: LifeBuoy },
      ],
    },
    {
      title: 'Integrations & Governance',
      items: [
        { id: 'whatsapp-gateway', label: 'WhatsApp Gateway API', icon: MessageSquareCode, badge: 'Live', badgeColor: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20' },
        { id: 'audit-rbac', label: 'Audit Trail & Supabase RLS', icon: ShieldCheck },
      ],
    },
  ];

  return (
    <aside
      id="main-sidebar"
      className="w-72 bg-slate-900 text-slate-300 flex flex-col h-screen shrink-0 border-r border-slate-800 select-none overflow-hidden"
    >
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base tracking-tight">Presales OS</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400">Enterprise CRM & Presales</p>
          </div>
        </div>
      </div>

      {/* Supabase Status Mini Banner */}
      <div className="mx-3 my-2.5 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-medium text-slate-300">Supabase RLS Active</span>
        </div>
        <span className="text-[10px] text-emerald-400 font-mono">200 OK</span>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            item.badgeColor ||
                            (isActive
                              ? 'bg-indigo-700 text-indigo-100'
                              : 'bg-slate-800 text-slate-400 border border-slate-700/60')
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-200" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* AI Assistant Quick Pill */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="p-2.5 rounded-lg bg-gradient-to-r from-indigo-950/80 to-slate-900 border border-indigo-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600/30 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-200">Gemini SOW Copilot</div>
              <div className="text-[10px] text-slate-400">Ready for RFP parsing</div>
            </div>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            ONLINE
          </span>
        </div>
      </div>
    </aside>
  );
};
