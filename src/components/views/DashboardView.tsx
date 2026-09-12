import React, { useState, useMemo } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { MPLADProject, DiagnosticSummary } from '../../types';
import { validateProjectData } from '../../utils/anomalyEngine';
import { INITIAL_PROJECTS } from '../../data/mpladsData';
import { KPICard } from '../KPICard';
import { RiskBadge } from '../RiskBadge';
import { RiskScore } from '../RiskScore';
import {
  FolderGit2,
  IndianRupee,
  ShieldAlert,
  ClockAlert,
  ArrowRight,
  TrendingUp,
  Search,
  CheckCircle2,
  AlertTriangle,
  Activity,
  FileCheck2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface DashboardViewProps {
  projects: MPLADProject[];
  onSelectProject: (p: MPLADProject) => void;
  onNavigateToTab: (tab: any) => void;
  globalSearch: string;
  setGlobalSearch: (s: string) => void;
  diagnosticSummary?: DiagnosticSummary;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  onSelectProject,
  onNavigateToTab,
  globalSearch,
  setGlobalSearch,
  diagnosticSummary,
}) => {
  const { t } = useTranslation();
  const [showDiagnostics, setShowDiagnostics] = useState(true);

  // Fall back cleanly to authentic baseline dataset if empty
  const effectiveProjects = projects && projects.length > 0 ? projects : INITIAL_PROJECTS;

  // Dynamically calculate Data Quality Issues using the data quality validation engine
  // This guarantees 100% synchronization with DataQualityView
  const dynamicDqIssues = useMemo(() => {
    let count = 0;
    effectiveProjects.forEach((p) => {
      const { detailedIssues } = validateProjectData(p);
      count += detailedIssues.length;
    });
    return count;
  }, [effectiveProjects]);

  // Compute Key Performance Indicators
  const totalProjects = effectiveProjects.length;
  const totalSanctionedCr = (
    effectiveProjects.reduce((acc, p) => acc + (p.sanctionedAmountLakhs || 0), 0) / 100
  ).toFixed(2);
  const highOrCritical = effectiveProjects.filter(
    (p) => p.riskLevel === 'High' || p.riskLevel === 'Critical'
  ).length;
  const delayedOrStalled = effectiveProjects.filter(
    (p) => p.status === 'Delayed' || p.status === 'Stalled'
  ).length;

  // Risk Distribution Counts
  const criticalCount = effectiveProjects.filter((p) => p.riskLevel === 'Critical').length;
  const highCount = effectiveProjects.filter((p) => p.riskLevel === 'High').length;
  const mediumCount = effectiveProjects.filter((p) => p.riskLevel === 'Medium').length;
  const lowCount = effectiveProjects.filter((p) => p.riskLevel === 'Low').length;

  // Priority Investigations (Top 5 highest risk projects)
  const priorityInvestigations = [...effectiveProjects]
    .sort((a, b) => (b.overallRiskScore || 0) - (a.overallRiskScore || 0))
    .slice(0, 5);

  // Status breakdown
  const statusCounts: Record<string, number> = {};
  projects.forEach((p) => {
    const s = p.status || 'In Progress';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });

  // District risk distribution
  const districtRisk: Record<string, { high: number; total: number }> = {};
  projects.forEach((p) => {
    const d = p.district || p.constituency || 'Other';
    if (!districtRisk[d]) districtRisk[d] = { high: 0, total: 0 };
    districtRisk[d].total += 1;
    if (p.riskLevel === 'High' || p.riskLevel === 'Critical') {
      districtRisk[d].high += 1;
    }
  });

  const topDistricts = Object.entries(districtRisk)
    .sort((a, b) => b[1].high - a[1].high)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header & Global Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            MPLADS VigilAI
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            AI-Powered MPLAD Monitoring, Anomaly Detection & Risk Intelligence
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search project, district, MP, contractor or work code..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs font-medium"
          />
        </div>
      </div>

      {/* 4 Clean KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          id="kpi-total-projects"
          title="Monitored Projects"
          value={totalProjects}
          subtext="MoSPI e-SAKSHI synchronised"
          icon={<FolderGit2 className="w-5 h-5 text-blue-700" />}
          badge={{ text: 'Real Dataset', variant: 'neutral' }}
          onClick={() => onNavigateToTab('projects')}
        />
        <KPICard
          id="kpi-total-allocation"
          title="Sanctioned Allocation"
          value={`₹${totalSanctionedCr} Cr`}
          subtext="Across active parliamentary seats"
          icon={<IndianRupee className="w-5 h-5 text-emerald-700" />}
          badge={{ text: 'Disbursed 72%', variant: 'neutral' }}
        />
        <KPICard
          id="kpi-high-risk"
          title="High Risk Projects"
          value={highOrCritical}
          subtext="Requires human verification"
          icon={<ShieldAlert className="w-5 h-5 text-rose-600" />}
          badge={{ text: `${criticalCount} Critical`, variant: 'danger' }}
          onClick={() => onNavigateToTab('risk-center')}
        />
        <KPICard
          id="kpi-delayed"
          title="Delayed / Stalled"
          value={delayedOrStalled}
          subtext="Past scheduled target date"
          icon={<ClockAlert className="w-5 h-5 text-amber-600" />}
          badge={{ text: 'Execution Lag', variant: 'warning' }}
          onClick={() => onNavigateToTab('anomalies')}
        />
      </div>

      {/* PHASE 18: MPLADS Vigilance Anomaly Diagnostic Summary */}
      {diagnosticSummary && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-5 text-white shadow-xl border border-slate-700/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Audit &amp; Anomaly Engine Diagnostic Summary
                </h3>
              </div>
            </div>

            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700/80 transition-all self-start sm:self-auto"
            >
              <span>{showDiagnostics ? 'Collapse Audit Metrics' : 'Expand Audit Metrics'}</span>
              {showDiagnostics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {showDiagnostics && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-4">
              <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/50">
                <div className="text-[11px] font-medium text-slate-400">Projects Analyzed</div>
                <div className="text-xl font-black text-white font-mono mt-1">
                  {diagnosticSummary.totalRecords}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Full normalized dataset</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/50">
                <div className="text-[11px] font-medium text-slate-400">Valid Records</div>
                <div className="text-xl font-black text-emerald-400 font-mono mt-1">
                  {diagnosticSummary.validRecords}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Passes all quality checks</div>
              </div>

              <div
                id="dashboard-dq-issues-card"
                onClick={() => onNavigateToTab('data-quality')}
                className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/50 hover:border-amber-500/50 hover:bg-slate-800/90 transition-all cursor-pointer group"
                title="Click to view full Data Quality Audit report"
              >
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-medium text-slate-400 group-hover:text-amber-300 transition-colors">
                    Data Quality Issues
                  </div>
                  <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5" />
                </div>
                <div className="text-xl font-black text-amber-400 font-mono mt-1">
                  {dynamicDqIssues}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Fields needing review</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/50">
                <div className="text-[11px] font-medium text-slate-400">Financial Anomalies</div>
                <div className="text-xl font-black text-rose-400 font-mono mt-1">
                  {diagnosticSummary.financialAnomalies}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Spending vs progress</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/50">
                <div className="text-[11px] font-medium text-slate-400">Progress Anomalies</div>
                <div className="text-xl font-black text-orange-400 font-mono mt-1">
                  {diagnosticSummary.progressAnomalies}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Timeline milestones</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/50">
                <div className="text-[11px] font-medium text-slate-400">Cost Anomalies</div>
                <div className="text-xl font-black text-indigo-400 font-mono mt-1">
                  {diagnosticSummary.costAnomalies}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">&gt;1.6x category median</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/50">
                <div className="text-[11px] font-medium text-slate-400">Potential Duplicates</div>
                <div className="text-xl font-black text-pink-400 font-mono mt-1">
                  {diagnosticSummary.potentialDuplicates}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Co-location / keyword</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/50">
                <div className="text-[11px] font-medium text-slate-400">Contractor Indicators</div>
                <div className="text-xl font-black text-purple-400 font-mono mt-1">
                  {diagnosticSummary.contractorIndicators}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">&gt;35% district share</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/50">
                <div className="text-[11px] font-medium text-slate-400">High Risk (61–80)</div>
                <div className="text-xl font-black text-orange-400 font-mono mt-1">
                  {diagnosticSummary.highRiskProjects}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Requires audit review</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/50">
                <div className="text-[11px] font-medium text-slate-400">Critical Risk (81–100)</div>
                <div className="text-xl font-black text-rose-400 font-mono mt-1">
                  {diagnosticSummary.criticalProjects}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Immediate field audit</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Risk Overview Segment */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Risk Profile Breakdown
            </h3>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              Explainable Risk Distribution Index
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Total Monitored: <strong className="text-slate-800">{totalProjects}</strong> records
          </div>
        </div>

        {/* Multi-segment progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
          <div
            className="bg-rose-500 h-full transition-all"
            style={{ width: `${(criticalCount / (totalProjects || 1)) * 100}%` }}
            title={`Critical: ${criticalCount}`}
          />
          <div
            className="bg-orange-500 h-full transition-all"
            style={{ width: `${(highCount / (totalProjects || 1)) * 100}%` }}
            title={`High: ${highCount}`}
          />
          <div
            className="bg-amber-400 h-full transition-all"
            style={{ width: `${(mediumCount / (totalProjects || 1)) * 100}%` }}
            title={`Medium: ${mediumCount}`}
          />
          <div
            className="bg-emerald-500 h-full transition-all"
            style={{ width: `${(lowCount / (totalProjects || 1)) * 100}%` }}
            title={`Low: ${lowCount}`}
          />
        </div>

        {/* Legend stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <div>
              <span className="font-bold text-slate-900">{criticalCount}</span>{' '}
              <span className="text-slate-500">Critical (81–100)</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <div>
              <span className="font-bold text-slate-900">{highCount}</span>{' '}
              <span className="text-slate-500">High (61–80)</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div>
              <span className="font-bold text-slate-900">{mediumCount}</span>{' '}
              <span className="text-slate-500">Medium (31–60)</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <div>
              <span className="font-bold text-slate-900">{lowCount}</span>{' '}
              <span className="text-slate-500">Low (0–30)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Clean Visual Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Project Status Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t('Execution Status', 'Execution Status')}
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                {t('Project Status Overview', 'Project Status Overview')}
              </h4>
            </div>
            <span className="text-[11px] text-slate-500">{t('Active Works', 'Active Works')}</span>
          </div>

          <div className="space-y-2.5">
            {Object.entries(statusCounts).map(([status, count]) => {
              const pct = Math.round((count / (totalProjects || 1)) * 100);
              const colorClass =
                status === 'Completed'
                  ? 'bg-emerald-500'
                  : status === 'Delayed' || status === 'Stalled'
                  ? 'bg-rose-500'
                  : 'bg-blue-600';

              return (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{t(status, status)}</span>
                    <span className="font-bold text-slate-900">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colorClass}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: High Risk Distribution by District */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t('Geographic Clustering', 'Geographic Clustering')}
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                {t('High Risk Projects by District', 'High Risk Projects by District')}
              </h4>
            </div>
            <button
              onClick={() => onNavigateToTab('map')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1"
            >
              <span>{t('Map View', 'Map View')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {topDistricts.map(([district, data]) => {
              const highRatio = Math.round((data.high / (data.total || 1)) * 100);

              return (
                <div key={district} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{district}</span>
                    <span className="font-bold text-slate-900">
                      {data.high} {t('flagged', 'flagged')} / {data.total} {t('total', 'total')}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{ width: `${Math.min(100, highRatio)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Priority Investigations (Top 5 highest risk projects) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
              Vigilance Alert
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Priority Investigations (Highest Risk Works)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Top candidate projects requiring immediate physical inspection & voucher reconciliation
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('risk-center')}
            className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <span>View All Risk Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {priorityInvestigations.map((p) => (
            <div
              key={p.id}
              onClick={() => onSelectProject(p)}
              className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/70 p-2.5 rounded-xl transition-colors cursor-pointer group"
            >
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-blue-700">
                  <span>{p.workCode}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600 font-sans font-medium">{p.district || p.constituency}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 font-sans font-normal">MP: {p.mpName}</span>
                </div>
                <div className="font-bold text-slate-900 text-xs group-hover:text-blue-700 transition-colors">
                  {p.title}
                </div>
                {p.mainAnomaly && (
                  <div className="text-[11px] text-rose-700 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>{p.mainAnomaly}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right text-xs">
                  <div className="font-mono font-bold text-slate-900">
                    ₹{p.sanctionedAmountLakhs}L
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Progress: {p.completionPercentage}%
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <RiskScore score={p.overallRiskScore || 0} level={p.riskLevel} size="sm" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProject(p);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-semibold text-xs hover:bg-blue-100 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
