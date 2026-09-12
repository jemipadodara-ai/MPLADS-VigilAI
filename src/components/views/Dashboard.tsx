import React, { useState, useMemo } from 'react';
import {
  IndianRupee,
  AlertTriangle,
  ArrowRight,
  Clock,
  Activity,
  FileDown,
  Building,
  CheckCircle2,
  ChevronRight,
  MapPin,
  FolderGit2,
  Users,
} from 'lucide-react';
import { MPLADProject, ConstituencySummary } from '../../types';
import { computeProjectRisk } from '../../utils/riskEngine';
import { exportSingleProjectToWord } from '../../utils/docxExport';
import { RiskBadge } from '../RiskBadge';
import { useTranslation } from '../../i18n/LanguageContext';

interface DashboardProps {
  projects: MPLADProject[];
  constituencies?: ConstituencySummary[];
  onInspectProject: (project: MPLADProject) => void;
  onNavigateToProjects: () => void;
  onNavigateToContractors?: () => void;
  onRefreshData?: () => void;
  isRefreshing?: boolean;
  userRole?: string;
  userEmail?: string | null;
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  onInspectProject,
  onNavigateToProjects,
  onNavigateToContractors,
}) => {
  const { t } = useTranslation();
  const [exportingId, setExportingId] = useState<string | null>(null);

  // Highest-risk projects first
  const highRiskProjects = useMemo(() => {
    return [...projects]
      .filter((p) => computeProjectRisk(p).riskLevel === 'High')
      .sort((a, b) => computeProjectRisk(b).riskScore - computeProjectRisk(a).riskScore);
  }, [projects]);

  // Priority attention list (High risk, then medium risk)
  const attentionProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => computeProjectRisk(b).riskScore - computeProjectRisk(a).riskScore)
      .slice(0, 6);
  }, [projects]);

  // Overall counts for quick summary
  const totalWorksCount = projects.length;
  const totalSanctionedCr = useMemo(() => {
    const totalLakhs = projects.reduce((acc, p) => acc + (p.sanctionedAmountLakhs || 0), 0);
    return (totalLakhs / 100).toFixed(2);
  }, [projects]);

  const handleExportWord = async (e: React.MouseEvent, project: MPLADProject) => {
    e.stopPropagation();
    try {
      setExportingId(project.id);
      await exportSingleProjectToWord(project);
    } catch (err) {
      console.error('Word export failed:', err);
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. Page Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <span>{t('Risk Monitoring', 'Risk Monitoring')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('Government Project Risk Dashboard', 'Government Project Risk Dashboard')}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed font-normal">
            {t('See which government projects may need attention and understand the reasons behind each risk.', 'See which government projects may need attention and understand the reasons behind each risk.')}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {onNavigateToContractors && (
            <button
              id="dashboard-contractors-btn"
              onClick={onNavigateToContractors}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4 text-indigo-600" />
              <span>{t('Contractors', 'Contractors')}</span>
            </button>
          )}

          <button
            id="dashboard-all-projects-btn"
            onClick={onNavigateToProjects}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-xs inline-flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>{t('Projects Registry', 'Projects Registry')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FIRST IMPORTANT SECTION: PROJECTS THAT NEED ATTENTION                 */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{t('Priority Monitoring', 'Priority Monitoring')}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t('Projects That Need Attention', 'Projects That Need Attention')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {t('Projects exhibiting significant cost overruns, timeline delays, or low physical progress.', 'Projects exhibiting significant cost overruns, timeline delays, or low physical progress.')}
            </p>
          </div>

          <button
            onClick={onNavigateToProjects}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>{t('View All Projects', 'View All Projects')}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Priority Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {attentionProjects.map((project) => {
            const risk = computeProjectRisk(project);
            const isHigh = risk.riskLevel === 'High';
            const spent = project.expenditureAmountLakhs || 0;
            const sanctioned = project.sanctionedAmountLakhs || 0;
            const progress = project.completionPercentage || 0;
            const overrun = risk.evidence.costOverrunPct;

            return (
              <div
                key={project.id}
                onClick={() => onInspectProject(project)}
                className={`bg-white rounded-3xl border p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group ${
                  isHigh
                    ? 'border-rose-200 hover:border-rose-300 ring-1 ring-rose-500/10'
                    : 'border-amber-200 hover:border-amber-300 ring-1 ring-amber-500/10'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Bar: Risk Level & Score */}
                  <div className="flex items-center justify-between gap-2">
                    <RiskBadge level={risk.riskLevel} size="md" />
                    <div className="flex items-center gap-1 font-mono text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                      <span>{t('Score:', 'Score:')}</span>
                      <span className={isHigh ? 'text-rose-600 font-bold' : 'text-amber-600 font-bold'}>
                        {risk.riskScore}
                      </span>
                      <span className="text-slate-400">/100</span>
                    </div>
                  </div>

                  {/* Project Name & Location */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                      {project.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {project.district || project.constituency}, {project.state}
                      </span>
                    </div>
                  </div>

                  {/* Why is this project flagged? */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-slate-400" />
                      <span>{t('Why is this project flagged?', 'Why is this project flagged?')}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 leading-snug">
                      {risk.primaryReason}
                    </p>
                  </div>

                  {/* Evidence Section */}
                  <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {t('Risk Evidence', 'Risk Evidence')}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">{t('Approved', 'Approved')}</span>
                        <strong className="text-slate-900 font-mono text-xs">
                          ₹{sanctioned.toFixed(2)} {t('common.lakhs', 'Lakh')}
                        </strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">{t('Expenditure', 'Expenditure')}</span>
                        <strong className="text-slate-900 font-mono text-xs">
                          ₹{spent.toFixed(2)} {t('common.lakhs', 'Lakh')}
                        </strong>
                        {overrun > 0 && (
                          <span className="text-[10px] font-bold text-rose-600 block">
                            +{overrun}% {t('Overrun', 'Overrun')}
                          </span>
                        )}
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">{t('Progress', 'Progress')}</span>
                        <strong className="text-slate-900 font-mono text-xs">
                          {progress}% {t('Done', 'Done')}
                        </strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">{t('Timeline', 'Timeline')}</span>
                        <strong className="text-slate-900 text-xs">
                          {risk.evidence.isDelayed ? `${risk.evidence.delayDays}d ${t('Overdue', 'Overdue')}` : t('On Time', 'On Time')}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions: View Details & Export Word */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleExportWord(e, project)}
                    disabled={exportingId === project.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                    title={t('Export Word', 'Export Word report (.docx)')}
                  >
                    <FileDown className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{exportingId === project.id ? t('Exporting...', 'Exporting...') : t('Export Word', 'Export Word')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onInspectProject(project)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span>{t('View Details', 'View Details')}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SUMMARY METRICS (SIMPLE & CLEAR)                                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            {t('Total Monitored Projects', 'Total Monitored Projects')}
          </span>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {totalWorksCount}
          </div>
          <p className="text-xs text-slate-500 font-medium">{t('In public works registry', 'In public works registry')}</p>
        </div>

        <div className="bg-white rounded-2xl border border-rose-200 p-5 shadow-2xs space-y-2 bg-rose-50/20">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
            {t('High-Risk Projects', 'High-Risk Projects')}
          </span>
          <div className="text-3xl font-black text-rose-600 font-mono">
            {highRiskProjects.length}
          </div>
          <p className="text-xs text-rose-600 font-medium">{t('Requiring immediate review', 'Requiring immediate review')}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            {t('Total Sanctioned Outlay', 'Total Sanctioned Outlay')}
          </span>
          <div className="text-3xl font-black text-slate-900 font-mono">
            ₹{totalSanctionedCr} {t('common.crores', 'Cr')}
          </div>
          <p className="text-xs text-slate-500 font-medium">{t('Cumulative approved funds', 'Cumulative approved funds')}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            {t('Average Physical Progress', 'Average Physical Progress')}
          </span>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {totalWorksCount > 0
              ? Math.round(
                  projects.reduce((acc, p) => acc + (p.completionPercentage || 0), 0) /
                    totalWorksCount
                )
              : 0}
            %
          </div>
          <p className="text-xs text-slate-500 font-medium">{t('Across all active works', 'Across all active works')}</p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. OVERVIEW TABLE OF FLAGGED PROJECTS                                    */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              {t('All Monitored Projects Ranked by Risk', 'All Monitored Projects Ranked by Risk')}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {t('Ranked overview of projects with explicit risk reasons and current delivery status.', 'Ranked overview of projects with explicit risk reasons and current delivery status.')}
            </p>
          </div>

          <button
            onClick={onNavigateToProjects}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>{t('Open Full Registry', 'Open Full Registry')}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="py-3.5 px-4 sm:px-6">{t('Project Title & ID', 'Project Title & ID')}</th>
                <th className="py-3.5 px-4">{t('Risk Level & Score', 'Risk Level & Score')}</th>
                <th className="py-3.5 px-4 min-w-[240px]">{t('Main Risk Reason', 'Main Risk Reason')}</th>
                <th className="py-3.5 px-4">{t('Approved / Spent', 'Approved / Spent')}</th>
                <th className="py-3.5 px-4">{t('Physical Progress', 'Physical Progress')}</th>
                <th className="py-3.5 px-4 text-right">{t('Actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects
                .slice()
                .sort((a, b) => computeProjectRisk(b).riskScore - computeProjectRisk(a).riskScore)
                .slice(0, 10)
                .map((project) => {
                  const risk = computeProjectRisk(project);
                  const isHigh = risk.riskLevel === 'High';

                  return (
                    <tr
                      key={project.id}
                      onClick={() => onInspectProject(project)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      {/* Project Title & ID */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="space-y-0.5 max-w-xs">
                          <span className="font-mono text-[10px] text-slate-400 font-semibold">
                            {project.workCode || project.id}
                          </span>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {project.title}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {project.district || project.constituency}, {project.state}
                          </div>
                        </div>
                      </td>

                      {/* Risk Level & Score */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <RiskBadge level={risk.riskLevel} size="sm" />
                          <span className="font-mono text-xs font-bold text-slate-700">
                            {risk.riskScore}/100
                          </span>
                        </div>
                      </td>

                      {/* Main Risk Reason */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                              isHigh ? 'bg-rose-500' : 'bg-amber-500'
                            }`}
                          />
                          <span className="text-xs text-slate-700 font-medium leading-snug">
                            {risk.primaryReason}
                          </span>
                        </div>
                      </td>

                      {/* Approved vs Spent */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">
                          ₹{(project.expenditureAmountLakhs || 0).toFixed(1)}L
                        </div>
                        <div className="text-[10px] text-slate-400">
                          of ₹{(project.sanctionedAmountLakhs || 0).toFixed(1)}L
                        </div>
                      </td>

                      {/* Physical Progress */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full"
                              style={{ width: `${project.completionPercentage || 0}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-slate-800">
                            {project.completionPercentage || 0}%
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleExportWord(e, project)}
                            disabled={exportingId === project.id}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title={t('Export Word', 'Export Word report')}
                          >
                            <FileDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onInspectProject(project)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white transition-colors"
                          >
                            {t('View Details', 'Details')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Disclaimer / Notes */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 leading-relaxed">
        <strong>Monitoring Note:</strong> Risk indicators highlight projects with unusual expenditure, timeline delays, or low progress to help prioritize review. A flagged indicator does not by itself establish wrongdoing.
      </div>
    </div>
  );
};

export default Dashboard;
