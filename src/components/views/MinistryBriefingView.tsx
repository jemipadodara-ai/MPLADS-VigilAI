import React, { useMemo } from 'react';
import { MPLADProject, DecisionCase, MinistryRecommendation } from '../../types';
import {
  generateDecisionCases,
  calculateNationalRiskIndex,
  generateMinistryRecommendations,
} from '../../utils/decisionEngine';
import { PriorityBadge, ResponsibleAuthorityBadge } from '../shared/StatusBadges';
import {
  Building2,
  FileDown,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  FileText,
  Clock,
} from 'lucide-react';
import { exportMinistryBriefingDocx } from '../../utils/docxExport';

interface MinistryBriefingViewProps {
  projects: MPLADProject[];
  onNavigateToDecisionCenter: () => void;
}

export const MinistryBriefingView: React.FC<MinistryBriefingViewProps> = ({
  projects,
  onNavigateToDecisionCenter,
}) => {
  const cases = useMemo(() => generateDecisionCases(projects), [projects]);
  const nationalIndex = useMemo(() => calculateNationalRiskIndex(projects), [projects]);
  const recommendations = useMemo(() => generateMinistryRecommendations(cases), [cases]);

  // Executive summary metrics
  const stats = useMemo(() => {
    const totalWorks = projects.length;
    const totalSanctionedLakhs = projects.reduce((acc, p) => acc + (p.sanctionedAmountLakhs || 0), 0);
    const totalSpentLakhs = projects.reduce((acc, p) => acc + (p.expenditureAmountLakhs || 0), 0);
    const totalExposureLakhs = cases.reduce((acc, c) => acc + c.financialExposureLakhs, 0);
    const p0Count = cases.filter((c) => c.priority === 'P0').length;
    const p1Count = cases.filter((c) => c.priority === 'P1').length;

    return {
      totalWorks,
      totalSanctionedCr: (totalSanctionedLakhs / 100).toFixed(2),
      totalSpentCr: (totalSpentLakhs / 100).toFixed(2),
      totalExposureCr: (totalExposureLakhs / 100).toFixed(2),
      p0Count,
      p1Count,
    };
  }, [projects, cases]);

  const [isGeneratingReport, setIsGeneratingReport] = React.useState(false);
  const [ministerActions, setMinisterActions] = React.useState<any[]>([]);
  const [actionsLoading, setActionsLoading] = React.useState(false);

  React.useEffect(() => {
    setActionsLoading(true);
    fetch('/api/minister/actions')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.actions) {
          setMinisterActions(data.actions.slice(0, 10));
        }
      })
      .catch(err => console.warn('Minister actions fetch notice:', err))
      .finally(() => setActionsLoading(false));
  }, []);

  const handleExportDocx = async () => {
    try {
      await exportMinistryBriefingDocx(projects, {
        summaryCr: stats.totalSanctionedCr,
        exposureCr: stats.totalExposureCr,
        p0Count: stats.p0Count,
        nationalScore: nationalIndex.currentValue,
      });
    } catch (e) {
      console.error('Failed to export ministry briefing', e);
    }
  };

  const handleGenerateStatutoryReport = async () => {
    setIsGeneratingReport(true);
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: 'ministry_executive_brief',
          state: 'National / All States',
          timeRange: 'Q1-2026',
        }),
      });
      const data = await res.json();
      if (data && data.report) {
        const blob = new Blob([JSON.stringify(data.report, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `MoSPI_Statutory_Vigilance_Report_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to generate statutory report:', err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
              Executive Governance Dossier
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Prepared for Hon. Minister & Secretary (MoSPI)
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            EXECUTIVE VIGILANCE BRIEFING
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-3xl">
            High-level policy summary synthesizing portfolio integrity, systemic risk drivers, and targeted administrative interventions across Parliamentary Constituencies.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            onClick={handleGenerateStatutoryReport}
            disabled={isGeneratingReport}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span>{isGeneratingReport ? 'Generating Report...' : 'Generate MoSPI Audit Report (JSON)'}</span>
          </button>

          <button
            onClick={handleExportDocx}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-slate-300" />
            <span>Export Official Briefing (.docx)</span>
          </button>
        </div>
      </div>

      {/* 5-Minute Executive Briefing Synopsis Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-indigo-800/40 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-300" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              Executive Synopsis • 5-Minute Strategic Readout
            </span>
          </div>
          <span className="text-xs text-indigo-300 font-mono">
            Reporting Period: Q1 2026
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          <div>
            <div className="text-[11px] text-indigo-300 font-medium">Portfolio Envelope</div>
            <div className="text-2xl font-black text-white mt-1">₹{stats.totalSanctionedCr} Cr</div>
            <div className="text-[10px] text-indigo-200 mt-0.5">{stats.totalWorks} Monitored Assets</div>
          </div>
          <div>
            <div className="text-[11px] text-indigo-300 font-medium">National Risk Index</div>
            <div className="text-2xl font-black text-emerald-300 mt-1">
              {nationalIndex.currentValue} / 100
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
              -4.2 pts improvement
            </div>
          </div>
          <div>
            <div className="text-[11px] text-indigo-300 font-medium">P0 Urgent Interventions</div>
            <div className="text-2xl font-black text-rose-300 mt-1">{stats.p0Count} Works</div>
            <div className="text-[10px] text-rose-200 mt-0.5">Disbursement lead &gt; 25%</div>
          </div>
          <div>
            <div className="text-[11px] text-indigo-300 font-medium">Unverified Exposure</div>
            <div className="text-2xl font-black text-amber-300 mt-1">₹{stats.totalExposureCr} Cr</div>
            <div className="text-[10px] text-amber-200 mt-0.5">Subject to physical audit</div>
          </div>
        </div>
      </div>

      {/* 3-5 Priority Administrative Recommendations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            High-Priority Administrative Interventions for Ministry Action
          </h2>
          <button
            onClick={onNavigateToDecisionCenter}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Review Individual Cases in Decision Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {rec.id}
                  </span>
                  <PriorityBadge priority={rec.priority} />
                  <ResponsibleAuthorityBadge authority={rec.responsibleAuthority} />
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Financial Exposure: <strong className="text-rose-700">₹{rec.financialExposureLakhs} L</strong> across {rec.targetCount} works
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {rec.issue}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="font-bold text-slate-500 uppercase text-[10px]">1. Observed Evidence</div>
                  <p className="text-slate-800 leading-relaxed">{rec.evidence}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="font-bold text-slate-500 uppercase text-[10px]">2. Administrative Impact</div>
                  <p className="text-slate-800 leading-relaxed">{rec.impact}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-1">
                  <div className="font-bold text-indigo-700 uppercase text-[10px]">3. Recommended Directive</div>
                  <p className="text-indigo-950 font-semibold leading-relaxed">{rec.recommendedIntervention}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Minister Actions Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <span className="p-2 rounded-xl bg-indigo-600 text-white"><FileText className="w-4 h-4" /></span>
          <div>
            <h2 className="text-base font-bold text-slate-900">Live Ministerial Action Ledger</h2>
            <p className="text-xs text-slate-500">Statutory decisions persisted to database in real-time</p>
          </div>
          {actionsLoading && <span className="ml-auto text-xs text-slate-400 animate-pulse">Loading...</span>}
        </div>
        {ministerActions.length === 0 && !actionsLoading && (
          <div className="text-center py-6 text-slate-400 text-sm">No ministerial actions recorded yet. Use the Decision Center to execute directives.</div>
        )}
        <div className="space-y-3">
          {ministerActions.map((action: any) => (
            <div key={action.id || action.actionId} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{action.actionType}</span>
                <span className="text-[11px] text-slate-400 font-mono">{new Date(action.timestamp).toLocaleString('en-IN')}</span>
              </div>
              <div className="text-sm font-semibold text-slate-800">{action.projectTitle || action.caseId}</div>
              <div className="text-xs text-slate-600">{action.notes}</div>
              <div className="flex items-center gap-4 text-[11px] text-slate-500">
                <span>By: <strong>{action.ministerName}</strong> ({action.ministerRole})</span>
                {action.statutoryClause && <span>Clause: {action.statutoryClause}</span>}
              </div>
              {action.digitalSignature && (
                <div className="text-[10px] font-mono text-slate-400 truncate">Sig: {action.digitalSignature.slice(0, 50)}...</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
