import React from 'react';
import { FiveQuestionModel, PriorityLevel, ResponsibleAuthority } from '../../types';
import { PriorityBadge, ResponsibleAuthorityBadge } from './StatusBadges';
import { HelpCircle, AlertTriangle, ShieldAlert, ArrowRight, FileCheck, CheckCircle2 } from 'lucide-react';

interface FiveQuestionCardProps {
  model: FiveQuestionModel;
  priority?: PriorityLevel;
  authority?: ResponsibleAuthority;
  riskScore?: number;
  financialExposureLakhs?: number;
  className?: string;
  onExecuteAction?: () => void;
  actionLabel?: string;
}

export const FiveQuestionCard: React.FC<FiveQuestionCardProps> = ({
  model,
  priority,
  authority,
  riskScore,
  financialExposureLakhs,
  className = '',
  onExecuteAction,
  actionLabel,
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100 ${className}`}
    >
      {/* Header bar */}
      <div className="bg-slate-50 px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
            5Q
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Explainable Decision Framework
          </span>
        </div>
        <div className="flex items-center gap-2">
          {priority && <PriorityBadge priority={priority} />}
          {authority && <ResponsibleAuthorityBadge authority={authority} />}
          {riskScore !== undefined && (
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold ${
                riskScore >= 75
                  ? 'bg-rose-100 text-rose-800'
                  : riskScore >= 50
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              Risk: {riskScore}/100
            </span>
          )}
        </div>
      </div>

      {/* 5 Questions Grid */}
      <div className="p-4 space-y-3.5 text-sm">
        {/* Q1. WHAT Happened */}
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
            1
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              WHAT Happened?
            </div>
            <p className="text-slate-900 font-semibold mt-0.5">{model.whatHappened}</p>
          </div>
        </div>

        {/* Q2. WHY is it unusual */}
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded bg-amber-100 text-amber-900 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
            2
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              WHY is it unusual?
            </div>
            <p className="text-slate-700 mt-0.5">{model.whyUnusual}</p>
          </div>
        </div>

        {/* Q3. HOW serious is it */}
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded bg-rose-100 text-rose-900 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
            3
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
              HOW serious is it?
            </div>
            <p className="text-slate-800 font-medium mt-0.5">{model.howSerious}</p>
            {financialExposureLakhs !== undefined && financialExposureLakhs > 0 && (
              <div className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-800 font-bold">
                Unverified Spending At Stake: ₹{financialExposureLakhs.toFixed(2)} Lakhs
              </div>
            )}
          </div>
        </div>

        {/* Q4. WHAT should the authority do next */}
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded bg-indigo-100 text-indigo-900 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
            4
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
              WHAT should the authority do next?
            </div>
            <p className="text-indigo-950 font-semibold mt-0.5">{model.whatNext}</p>
          </div>
        </div>

        {/* Q5. WHAT evidence is required */}
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-900 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
            5
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              WHAT evidence is required?
            </div>
            <ul className="mt-1 space-y-1">
              {(model?.evidenceRequired || []).map((ev, idx) => (
                <li key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{ev}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      {onExecuteAction && (
        <div className="bg-slate-50 px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs text-slate-500 italic">
            Human authorization required prior to regulatory enforcement.
          </span>
          <button
            onClick={onExecuteAction}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <span>{actionLabel || 'Proceed with Recommended Action'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
