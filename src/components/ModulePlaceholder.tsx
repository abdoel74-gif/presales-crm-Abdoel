import React from 'react';
import { Layers, ArrowLeft, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface ModulePlaceholderProps {
  title: string;
  category: string;
  description: string;
  stepNumber: string;
  onBackToDashboard: () => void;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  title,
  category,
  description,
  stepNumber,
  onBackToDashboard,
}) => {
  return (
    <div className="space-y-6 pb-12">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
                {category}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                {stepNumber}
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900">{title}</h1>
          </div>
        </div>

        <button
          onClick={onBackToDashboard}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Return to Dashboard
        </button>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center max-w-2xl mx-auto my-8 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
          <Layers className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">{title} Ready for Step Sequence</h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
            {description}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Supabase RLS & Backend Schema Integration:</span>
          </div>
          <ul className="text-slate-600 space-y-1 pl-5 list-disc text-[11px]">
            <li>Tables prepared for strict tenant isolation (`organization_id`).</li>
            <li>Role-based access matrix aligned with 54-step framework.</li>
            <li>Live PostgreSQL replication with real-time websocket CDC.</li>
          </ul>
        </div>

        <div className="pt-2">
          <button
            onClick={onBackToDashboard}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm transition-all"
          >
            Go Back to Executive Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
