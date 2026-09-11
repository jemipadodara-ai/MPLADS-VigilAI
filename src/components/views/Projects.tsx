import React, { useState, useMemo } from 'react';
import {
  Search,
  RotateCcw,
  ArrowRight,
  FileDown,
  Info,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { MPLADProject } from '../../types';
import { computeProjectRisk, exportProjectsToCSV } from '../../utils/riskEngine';
import { exportFilteredProjectsToWord } from '../../utils/docxExport';
import { RiskBadge } from '../RiskBadge';

interface ProjectsViewProps {
  projects: MPLADProject[];
  onInspectProject: (project: MPLADProject) => void;
}

export const Projects: React.FC<ProjectsViewProps> = ({ projects, onInspectProject }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWard, setSelectedWard] = useState('All');
  const [selectedRisk, setSelectedRisk] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'risk' | 'budget' | 'progress'>('risk');
  const [isExportingWord, setIsExportingWord] = useState(false);

  // Extract unique wards / constituencies for the dropdown
  const uniqueWards = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.constituency) set.add(p.constituency);
      if (p.district) set.add(p.district);
    });
    return Array.from(set).sort();
  }, [projects]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        // Search query
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          const matchTitle = (p.title || '').toLowerCase().includes(q);
          const matchCode = (p.workCode || p.id || '').toLowerCase().includes(q);
          const matchWard = (p.constituency || p.district || '').toLowerCase().includes(q);
          const matchContractor = (p.contractorName || '').toLowerCase().includes(q);
          const matchCategory = (p.category || '').toLowerCase().includes(q);
          if (!matchTitle && !matchCode && !matchWard && !matchContractor && !matchCategory) {
            return false;
          }
        }

        // Ward filter
        if (selectedWard !== 'All') {
          if (p.constituency !== selectedWard && p.district !== selectedWard) {
            return false;
          }
        }

        // Standardized Risk Level filter: High, Medium, Low
        if (selectedRisk !== 'All') {
          const risk = computeProjectRisk(p);
          if (risk.riskLevel !== selectedRisk) {
            return false;
          }
        }

        // Status filter
        if (selectedStatus !== 'All') {
          if (p.status !== selectedStatus) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'risk') {
          return computeProjectRisk(b).riskScore - computeProjectRisk(a).riskScore;
        }
        if (sortBy === 'budget') {
          return (b.sanctionedAmountLakhs || 0) - (a.sanctionedAmountLakhs || 0);
        }
        if (sortBy === 'progress') {
          return (a.completionPercentage || 0) - (b.completionPercentage || 0);
        }
        return 0;
      });
  }, [projects, searchTerm, selectedWard, selectedRisk, selectedStatus, sortBy]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedWard('All');
    setSelectedRisk('All');
    setSelectedStatus('All');
    setSortBy('risk');
  };

  const handleExportCSV = () => {
    const filename = `mplads_projects_${selectedRisk !== 'All' ? selectedRisk.toLowerCase() + '_' : ''}${new Date().toISOString().slice(0, 10)}.csv`;
    exportProjectsToCSV(filteredProjects, filename);
  };

  const handleExportWord = async () => {
    try {
      setIsExportingWord(true);
      await exportFilteredProjectsToWord(filteredProjects, {
        state: selectedWard !== 'All' ? selectedWard : undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
        riskLevel: selectedRisk !== 'All' ? selectedRisk : undefined,
      });
    } catch (err) {
      console.error('Word export error:', err);
    } finally {
      setIsExportingWord(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. Header Banner & Filter Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold uppercase tracking-wider">
                Works Registry
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 text-xs font-medium">
                {projects.length} Total Monitored Works
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Projects Master Registry
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Filterable registry of sanctioned infrastructure works with risk tiers, expenditure, and detailed risk reasons.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <span className="text-xs font-semibold text-slate-500 mr-1">
              Showing <strong className="text-slate-900 font-mono">{filteredProjects.length}</strong> of {projects.length} works
            </span>

            {/* Export Word Report Button */}
            <button
              id="projects-export-word-btn"
              onClick={handleExportWord}
              disabled={isExportingWord || filteredProjects.length === 0}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Download filtered project records as real Microsoft Word document (.docx)"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>{isExportingWord ? 'Exporting...' : 'Export Word Report'}</span>
            </button>

            {/* Export CSV Button */}
            <button
              id="projects-export-csv-btn"
              onClick={handleExportCSV}
              disabled={filteredProjects.length === 0}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Export filtered project records as CSV"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 2. Header Filters: Search, Ward dropdown, Risk Level, Status filter */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="projects-search-input"
              type="text"
              placeholder="Search by code, title, ward, contractor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Ward Dropdown */}
          <div className="lg:col-span-3">
            <select
              id="projects-ward-filter"
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Districts / Constituencies</option>
              {uniqueWards.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Level Filter (All, High, Medium, Low) */}
          <div className="lg:col-span-2">
            <select
              id="projects-risk-filter"
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer font-medium"
            >
              <option value="All">All Risk Levels</option>
              <option value="High">High Risk (70-100)</option>
              <option value="Medium">Medium Risk (40-69)</option>
              <option value="Low">Low Risk (0-39)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-2">
            <select
              id="projects-status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Delayed">Delayed</option>
              <option value="Completed">Completed</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Sanctioned">Sanctioned</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="lg:col-span-1 flex justify-end">
            <button
              id="projects-reset-filters-btn"
              onClick={handleResetFilters}
              title="Reset all filters"
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Clean Projects Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredProjects.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No matching projects found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search query, location selection, or risk filter.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="py-3.5 px-4 sm:px-6">Project Reference &amp; Title</th>
                  <th className="py-3.5 px-4">Sanctioned Budget</th>
                  <th className="py-3.5 px-4">Expenditure</th>
                  <th className="py-3.5 px-4 min-w-[130px]">Progress</th>
                  <th className="py-3.5 px-4">Risk Level</th>
                  <th className="py-3.5 px-4 min-w-[260px]">Main Risk Reason</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map((project) => {
                  const risk = computeProjectRisk(project);
                  const isHigh = risk.riskLevel === 'High';
                  const isMedium = risk.riskLevel === 'Medium';
                  const riskReason = risk.primaryReason;

                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-slate-50 transition-colors group cursor-pointer"
                      onClick={() => onInspectProject(project)}
                    >
                      {/* Project Reference Code & Title */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="space-y-0.5 max-w-xs sm:max-w-sm">
                          <span className="font-mono text-[10px] text-slate-400 font-semibold">
                            {project.workCode || project.id}
                          </span>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {project.title}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <span className="font-medium text-slate-700">
                              {project.district || project.constituency}
                            </span>
                            <span>•</span>
                            <span className="text-slate-400 truncate max-w-[140px]">
                              {project.contractorName || 'Assigned Vendor'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Sanctioned Budget */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap font-mono">
                        ₹{(project.sanctionedAmountLakhs || 0).toFixed(2)} Lakh
                      </td>

                      {/* Expenditure */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                        <span className="font-semibold text-slate-800">
                          ₹{(project.expenditureAmountLakhs || 0).toFixed(2)} Lakh
                        </span>
                        {project.sanctionedAmountLakhs ? (
                          <div className="text-[10px] text-slate-400 font-sans">
                            {Math.round(
                              ((project.expenditureAmountLakhs || 0) /
                                project.sanctionedAmountLakhs) *
                                100
                            )}% disbursed
                          </div>
                        ) : null}
                      </td>

                      {/* Progress */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                            <span>{project.completionPercentage || 0}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full"
                              style={{ width: `${project.completionPercentage || 0}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Risk Level & Score Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <RiskBadge level={risk.riskLevel} size="sm" />
                          <span className="font-mono text-xs font-bold text-slate-700">
                            {risk.riskScore}/100
                          </span>
                        </div>
                      </td>

                      {/* Main Risk Reason */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-1.5 max-w-md">
                          <span
                            className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                              isHigh ? 'bg-rose-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                          />
                          <span className="text-xs text-slate-700 leading-snug font-medium">
                            {riskReason}
                          </span>
                        </div>
                      </td>

                      {/* View Details Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectProject(project);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer shadow-2xs"
                          title="Open project details"
                        >
                          <span>View Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
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

      {/* Monitoring Note */}
      <div className="bg-slate-100/80 rounded-2xl border border-slate-200 p-4 sm:p-5 text-xs text-slate-600 space-y-1">
        <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Project Data &amp; Monitoring Notes</span>
        </div>
        <p className="text-slate-500 leading-relaxed text-[11px]">
          Risk scores and flags assist in identifying projects that may require field verification or administrative review. A flagged risk indicator does not by itself imply wrongdoing.
        </p>
      </div>
    </div>
  );
};

export default Projects;
