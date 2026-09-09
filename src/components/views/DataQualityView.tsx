import React, { useState, useMemo } from 'react';
import { MPLADProject, DataQualityIssue } from '../../types';
import { validateProjectData } from '../../utils/anomalyEngine';
import { INITIAL_PROJECTS } from '../../data/mpladsData';
import { DatabaseZap, AlertTriangle, CheckCircle2, Search, Filter, ShieldAlert } from 'lucide-react';

interface DataQualityViewProps {
  projects: MPLADProject[];
  onSelectProject: (p: MPLADProject) => void;
}

export const DataQualityView: React.FC<DataQualityViewProps> = ({
  projects,
  onSelectProject,
}) => {
  const [selectedIssueType, setSelectedIssueType] = useState<string>('All');
  const [search, setSearch] = useState('');

  // Fall back cleanly to baseline dataset if empty
  const effectiveProjects = projects && projects.length > 0 ? projects : INITIAL_PROJECTS;

  // Collect all data quality issues from all projects
  const allIssues: DataQualityIssue[] = useMemo(() => {
    const issues: DataQualityIssue[] = [];
    effectiveProjects.forEach((p) => {
      const { detailedIssues } = validateProjectData(p);
      issues.push(...detailedIssues);
    });
    return issues;
  }, [effectiveProjects]);

  const totalRecords = effectiveProjects.length;
  const missingFields = allIssues.filter((i) => i.issueType === 'Missing Field').length;
  const invalidDates = allIssues.filter((i) => i.issueType === 'Invalid Date').length;
  const negativeAmounts = allIssues.filter((i) => i.issueType === 'Negative Amount').length;
  const invalidPercentages = allIssues.filter(
    (i) => i.issueType === 'Completion Exceeds 100%'
  ).length;

  const filteredIssues = allIssues.filter((i) => {
    if (selectedIssueType !== 'All' && i.issueType !== selectedIssueType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const text = `${i.workCode} ${i.projectTitle} ${i.district} ${i.field} ${i.issueType} ${i.description}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Data Quality & Integrity Audit
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Automated validation checks across MoSPI e-SAKSHI data pipelines
          </p>
        </div>

        <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold">
          Observational Audit Only (Non-destructive)
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Issues Flagged
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {allIssues.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across {totalRecords} monitored records
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Missing Mandatory Fields
          </div>
          <div className="text-2xl font-black text-orange-600 font-mono mt-1">
            {missingFields}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            E.g. blank contractor / missing title
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Invalid Date Orders
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono mt-1">
            {invalidDates}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Target date precedes sanction
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Invalid Percentages / Values
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono mt-1">
            {negativeAmounts + invalidPercentages}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Negative balances or &gt;100%
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search flagged issues by project, work code or field..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['All', 'Missing Field', 'Invalid Date', 'Completion Exceeds 100%', 'Negative Amount'].map(
            (t) => (
              <button
                key={t}
                onClick={() => setSelectedIssueType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedIssueType === t
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {t}
              </button>
            )
          )}
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {filteredIssues.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-800">No Data Issues Found</div>
            <div className="text-xs text-slate-500 mt-0.5">
              All monitored project records passed the selected validation rules.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Work Code & Project</th>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4">Field</th>
                  <th className="py-3 px-4">Issue Type</th>
                  <th className="py-3 px-4">Current Value</th>
                  <th className="py-3 px-4">Auditor Note</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIssues.map((issue) => {
                  const matchingProj = projects.find((p) => p.id === issue.projectId);
                  return (
                    <tr
                      key={issue.id}
                      onClick={() => matchingProj && onSelectProject(matchingProj)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs">
                        <div className="font-mono text-[11px] text-blue-700 font-bold">
                          {issue.workCode || issue.projectId || 'ID Missing'}
                        </div>
                        <div className="truncate text-slate-800 mt-0.5">
                          {issue.projectTitle || (issue.workCode || issue.projectId ? 'Untitled Project' : 'Untitled Project (ID Missing)')}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                        {issue.district}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 whitespace-nowrap">
                        {issue.field}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-semibold border border-amber-200 text-[11px]">
                          {issue.issueType}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {String(issue.currentValue || 'N/A')}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 max-w-sm">
                        {issue.description}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (matchingProj) onSelectProject(matchingProj);
                          }}
                          className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                        >
                          Inspect Record
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
