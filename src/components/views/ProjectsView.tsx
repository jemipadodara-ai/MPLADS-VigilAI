import React, { useState, useMemo } from 'react';
import { MPLADProject, ProjectFilterState } from '../../types';
import { FilterBar } from '../FilterBar';
import { ProjectTable } from '../ProjectTable';
import { Download, RefreshCw } from 'lucide-react';

interface ProjectsViewProps {
  projects: MPLADProject[];
  onSelectProject: (p: MPLADProject) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  onSelectProject,
  onRefresh,
  isLoading,
}) => {
  const [filters, setFilters] = useState<ProjectFilterState>({
    searchQuery: '',
    state: '',
    district: '',
    mp: '',
    constituency: '',
    category: '',
    status: '',
    riskLevel: '',
  });

  // Unique options lists for dropdowns
  const statesList = useMemo(
    () => Array.from(new Set(projects.map((p) => p.state).filter(Boolean))).sort(),
    [projects]
  );
  const districtsList = useMemo(
    () =>
      Array.from(
        new Set(projects.map((p) => p.district || p.constituency).filter(Boolean))
      ).sort(),
    [projects]
  );
  const mpsList = useMemo(
    () => Array.from(new Set(projects.map((p) => p.mpName).filter(Boolean))).sort(),
    [projects]
  );
  const categoriesList = useMemo(
    () => Array.from(new Set(projects.map((p) => p.category).filter(Boolean))).sort(),
    [projects]
  );
  const statusesList = useMemo(
    () => Array.from(new Set(projects.map((p) => p.status).filter(Boolean))).sort(),
    [projects]
  );

  // Filtered dataset
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const text = `${p.workCode} ${p.title} ${p.district} ${p.constituency} ${p.state} ${p.mpName} ${p.contractorName} ${p.implementingAgency}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      if (filters.state && p.state !== filters.state) return false;
      if (
        filters.district &&
        p.district !== filters.district &&
        p.constituency !== filters.district
      )
        return false;
      if (filters.mp && p.mpName !== filters.mp) return false;
      if (filters.category && p.category !== filters.category) return false;
      if (filters.status && p.status !== filters.status) return false;
      if (filters.riskLevel && p.riskLevel !== filters.riskLevel) return false;

      return true;
    });
  }, [projects, filters]);

  const exportCSV = () => {
    const headers = [
      'Work Code',
      'Title',
      'Category',
      'District',
      'State',
      'MP Name',
      'Sanctioned (Lakhs)',
      'Expenditure (Lakhs)',
      'Completion (%)',
      'Status',
      'Risk Score',
      'Risk Level',
      'Main Anomaly',
    ];

    const rows = filteredProjects.map((p) => [
      `"${p.workCode}"`,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      `"${p.district || p.constituency}"`,
      `"${p.state}"`,
      `"${p.mpName}"`,
      p.sanctionedAmountLakhs,
      p.expenditureAmountLakhs,
      p.completionPercentage,
      `"${p.status}"`,
      p.overallRiskScore || 0,
      `"${p.riskLevel}"`,
      `"${(p.mainAnomaly || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `mplads_vigilai_projects_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">MPLAD Projects</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Verified master records synchronised from MoSPI e-SAKSHI portal
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3 py-2 bg-white border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Firestore</span>
          </button>

          <button
            onClick={exportCSV}
            className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        statesList={statesList}
        districtsList={districtsList}
        mpsList={mpsList}
        categoriesList={categoriesList}
        statusesList={statusesList}
        totalResults={filteredProjects.length}
      />

      {/* Project Table */}
      <ProjectTable
        projects={filteredProjects}
        onSelectProject={onSelectProject}
        pageSize={10}
      />
    </div>
  );
};
