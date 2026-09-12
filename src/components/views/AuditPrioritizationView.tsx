import React, { useState, useMemo, useEffect } from 'react';
import { MPLADProject, DecisionCase } from '../../types';
import { generateDecisionCases, rankAuditQueue, RankedAuditItem } from '../../utils/decisionEngine';
import { PriorityBadge, ResponsibleAuthorityBadge, CaseStatusBadge } from '../shared/StatusBadges';
import {
  ListOrdered,
  AlertOctagon,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Calendar,
  Layers,
  FileCheck2,
  Building,
} from 'lucide-react';

interface AuditPrioritizationViewProps {
  projects: MPLADProject[];
  onInspectProject: (project: MPLADProject) => void;
  onAssignInspection?: (caseItem: DecisionCase) => void;
  currentUser?: any;
}

export const AuditPrioritizationView: React.FC<AuditPrioritizationViewProps> = ({
  projects,
  onInspectProject,
  onAssignInspection,
}) => {
  const cases = useMemo(() => generateDecisionCases(projects), [projects]);
  const rankedQueue = useMemo(() => rankAuditQueue(cases), [cases]);

  const [topLimit, setTopLimit] = useState<number>(15);
  const [mlScores, setMlScores] = React.useState<Record<string, any>>({});
  const [mlLoading, setMlLoading] = React.useState(false);

  useEffect(() => {
    if (projects.length === 0) return;
    setMlLoading(true);
    fetch('/api/ml/predict/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projects: projects.slice(0, 30) }),
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.results) {
          const map: Record<string, any> = {};
          data.results.forEach((r: any) => { map[r.projectId] = r; });
          setMlScores(map);
        }
      })
      .catch(err => console.warn('Audit ML batch notice:', err))
      .finally(() => setMlLoading(false));
  }, [projects]);

  const displayedItems = useMemo(() => {
    return rankedQueue.slice(0, topLimit);
  }, [rankedQueue, topLimit]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
              Resource Allocation Intelligence
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Vigilance & Field Officer Inspection Queue
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            AI AUDIT PRIORITIZATION QUEUE
            {mlLoading && <span className="text-xs text-slate-400 animate-pulse">Loading ML scores...</span>}
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-3xl">
            Optimizes scarce field inspection capacity. Ranks thousands of active works into a defensible, multi-factor audit priority queue with explicit mathematical justification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-bold text-slate-500 uppercase">Display Depth:</div>
          <div className="flex items-center gap-1">
            {[10, 15, 25, 50].map((num) => (
              <button
                key={num}
                onClick={() => setTopLimit(num)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  topLimit === num
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Top {num}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Multi-factor formula banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700">
        <div className="flex items-center justify-between gap-2 mb-2 font-bold text-slate-900 uppercase tracking-wider text-[11px]">
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            Weighted Statutory Audit Priority Formula
          </span>
          <span className="text-indigo-700 font-mono">Score out of 100</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center">
          <div className="p-2 rounded bg-white border border-slate-200">
            <span className="font-bold text-slate-900 block">35% Weight</span>
            <span className="text-[10px] text-slate-500">Composite Risk Score</span>
          </div>
          <div className="p-2 rounded bg-white border border-slate-200">
            <span className="font-bold text-slate-900 block">20% Weight</span>
            <span className="text-[10px] text-slate-500">Financial Exposure</span>
          </div>
          <div className="p-2 rounded bg-white border border-slate-200">
            <span className="font-bold text-slate-900 block">15% Weight</span>
            <span className="text-[10px] text-slate-500">Fund vs Physical Lag</span>
          </div>
          <div className="p-2 rounded bg-white border border-slate-200">
            <span className="font-bold text-slate-900 block">10% Weight</span>
            <span className="text-[10px] text-slate-500">Milestone Delay Days</span>
          </div>
          <div className="p-2 rounded bg-white border border-slate-200">
            <span className="font-bold text-slate-900 block">10% Weight</span>
            <span className="text-[10px] text-slate-500">Citizen Grievances</span>
          </div>
          <div className="p-2 rounded bg-white border border-slate-200">
            <span className="font-bold text-slate-900 block">10% Weight</span>
            <span className="text-[10px] text-slate-500">Vendor Concentration</span>
          </div>
        </div>
      </div>

      {/* Ranked Queue Items */}
      <div className="space-y-4">
        {displayedItems.map((item) => {
          const c = item.caseItem;
          const projectObj = projects.find((p) => p.id === c.projectId || p.workCode === c.projectId);

          return (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300"
            >
              {/* Header with Rank Badge */}
              <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100">
                <div className="flex items-start gap-3.5 flex-1">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 ${
                      item.rank <= 3
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : item.rank <= 10
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-slate-100 text-slate-800 border border-slate-200'
                    }`}
                  >
                    #{item.rank}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {c.id}
                      </span>
                      <PriorityBadge priority={c.priority} />
                      <CaseStatusBadge status={c.caseStatus} />
                      <ResponsibleAuthorityBadge authority={c.responsibleAuthority} />
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {c.projectTitle}
                    </h3>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                      <span>📍 {c.location}</span>
                      <span>• Contractor: <strong className="text-slate-800">{c.contractorName}</strong></span>
                      <span>• Sanction: ₹{c.sanctionedLakhs} L</span>
                    </div>
                  </div>
                </div>

                {/* Audit Priority Score Pill */}
                <div className="flex items-center gap-4 shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Audit Score</div>
                    <div className="text-xl font-black text-rose-800">{item.auditScore} / 100</div>
                    <div className="text-[10px] font-semibold text-slate-500">Calculated Priority</div>
                  </div>
                  <div className="h-8 w-px bg-slate-200"></div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Exposure At Risk</div>
                    <div className="text-lg font-black text-slate-900">₹{c.financialExposureLakhs} L</div>
                    <div className="text-[10px] text-slate-500">{c.physicalProgressPct}% verified</div>
                  </div>
                </div>
              </div>

              {/* Comparative Explanation Bar (Required by PRD: Explains why Project A ranks above B) */}
              <div className="px-5 py-3 bg-amber-50/40 border-b border-amber-100/60 text-xs text-amber-950 flex items-start gap-2.5">
                <AlertOctagon className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="font-bold text-amber-900 mr-1.5">Ranking Justification:</strong>
                  {item.comparisonVsNext}
                </div>
              </div>

              {/* Sub-Score Factor Breakdown */}
              <div className="p-4 bg-slate-50/50 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                {item.rankDrivers.map((driver, dIdx) => (
                  <div key={dIdx} className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-500 truncate">{driver.label}</div>
                    <div className="font-bold text-slate-800 mt-0.5">
                      {driver.score} / {driver.max} pts
                    </div>
                  </div>
                ))}
              </div>

              {/* ML Intelligence Badges */}
              {mlScores[c.projectId] && (
                <div className="px-5 py-2 bg-indigo-50/40 border-t border-indigo-100/60 flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    ML Anomaly: {mlScores[c.projectId].anomaly?.level || 'N/A'}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-50 text-orange-700">
                    ML Risk: {mlScores[c.projectId].riskFusion?.finalRiskScore || 'N/A'}/100
                  </span>
                </div>
              )}

              {/* Action Bar */}
              <div className="px-5 py-3 bg-white flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                <div className="text-xs text-slate-600">
                  Recommended Intervention: <strong className="text-indigo-700">{c.interventionType}</strong>
                </div>

                <div className="flex items-center gap-2">
                  {projectObj && (
                    <button
                      onClick={() => onInspectProject(projectObj)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      View Full File
                    </button>
                  )}
                  <button
                    onClick={() => onAssignInspection && onAssignInspection(c)}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Dispatch Field Inspector</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
