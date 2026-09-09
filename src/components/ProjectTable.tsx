import React, { useState } from 'react';
import { MPLADProject } from '../types';
import { RiskBadge } from './RiskBadge';
import { ChevronRight, ChevronLeft, ArrowUpRight, AlertTriangle } from 'lucide-react';

interface ProjectTableProps {
  projects: MPLADProject[];
  onSelectProject: (project: MPLADProject) => void;
  pageSize?: number;
}

export const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  onSelectProject,
  pageSize = 10,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(projects.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const currentProjects = projects.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-2xs">
        <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-slate-800">No Projects Found</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          No project records matched your search query and filter criteria. Try resetting the filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between">
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Project & Work Code</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">District / MP</th>
              <th className="py-3 px-4 text-right">Financials (₹L)</th>
              <th className="py-3 px-4 text-center">Progress</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-center">Risk Score</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {currentProjects.map((p) => {
              const spentPct =
                p.sanctionedAmountLakhs > 0
                  ? Math.round((p.expenditureAmountLakhs / p.sanctionedAmountLakhs) * 100)
                  : 0;

              return (
                <tr
                  key={p.id}
                  onClick={() => onSelectProject(p)}
                  className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                >
                  {/* Work Code & Title */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-blue-700">
                      <span>{p.workCode || p.id || 'ID Missing'}</span>
                      {p.investigationStatus && p.investigationStatus !== 'New' && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-700 font-sans font-medium">
                          {p.investigationStatus}
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-slate-900 line-clamp-1 mt-0.5 group-hover:text-blue-700 transition-colors">
                      {p.title || (p.workCode || p.id ? 'Untitled Project' : 'Untitled Project (ID Missing)')}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">
                      Agency: {p.implementingAgency || 'District Council'}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                      {p.category}
                    </span>
                  </td>

                  {/* District / MP */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-medium text-slate-800">{p.district || p.constituency}</div>
                    <div className="text-[11px] text-slate-500">{p.mpName || 'MP Office'}</div>
                  </td>

                  {/* Financials */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono">
                    <div className="font-bold text-slate-900">
                      ₹{p.sanctionedAmountLakhs.toFixed(1)}L
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Spent: ₹{p.expenditureAmountLakhs.toFixed(1)}L ({spentPct}%)
                    </div>
                  </td>

                  {/* Progress */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[120px]">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            p.completionPercentage >= 100
                              ? 'bg-emerald-500'
                              : p.completionPercentage < 40
                              ? 'bg-rose-500'
                              : 'bg-blue-600'
                          }`}
                          style={{ width: `${Math.min(100, p.completionPercentage)}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-700 text-[11px]">
                        {p.completionPercentage}%
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium ${
                        p.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : p.status === 'Delayed' || p.status === 'Stalled'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>

                  {/* Risk Score */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="inline-flex flex-col items-center">
                      <span className="font-bold text-slate-900 text-xs">
                        {p.overallRiskScore || p.riskScore || 0}
                        <span className="text-slate-400 font-normal text-[10px]">/100</span>
                      </span>
                      <RiskBadge
                        level={p.riskLevel || 'Low'}
                        size="xs"
                        className="mt-0.5 scale-90 origin-center"
                      />
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProject(p);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
                      title="Inspect project details"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing <span className="font-semibold text-slate-800">{startIndex + 1}</span> to{' '}
          <span className="font-semibold text-slate-800">
            {Math.min(projects.length, startIndex + pageSize)}
          </span>{' '}
          of <span className="font-semibold text-slate-800">{projects.length}</span> records
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-2.5 font-semibold text-slate-700">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
