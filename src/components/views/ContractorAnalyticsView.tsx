import React, { useState } from 'react';
import { MPLADProject, ContractorProfile } from '../../types';
import { ProjectTable } from '../ProjectTable';
import { Building2, Search, AlertTriangle, CheckCircle2, ChevronRight, ShieldCheck } from 'lucide-react';

interface ContractorAnalyticsViewProps {
  projects: MPLADProject[];
  contractors: ContractorProfile[];
  onSelectProject: (p: MPLADProject) => void;
}

export const ContractorAnalyticsView: React.FC<ContractorAnalyticsViewProps> = ({
  projects,
  contractors,
  onSelectProject,
}) => {
  const [selectedContractor, setSelectedContractor] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Dynamically compute contractor stats from the active projects list
  const contractorStatsMap = new Map<string, {
    name: string;
    totalWorks: number;
    totalValueLakhs: number;
    completed: number;
    delayed: number;
    highRisk: number;
    districts: Set<string>;
    riskIndicator?: string;
  }>();

  // Populate from real projects
  projects.forEach((p) => {
    const name = p.contractorName || 'Tender Open';
    if (!contractorStatsMap.has(name)) {
      contractorStatsMap.set(name, {
        name,
        totalWorks: 0,
        totalValueLakhs: 0,
        completed: 0,
        delayed: 0,
        highRisk: 0,
        districts: new Set(),
      });
    }
    const c = contractorStatsMap.get(name)!;
    c.totalWorks += 1;
    c.totalValueLakhs += p.sanctionedAmountLakhs || 0;
    if (p.status === 'Completed') c.completed += 1;
    if (p.status === 'Delayed' || p.status === 'Stalled') c.delayed += 1;
    if (p.riskLevel === 'High' || p.riskLevel === 'Critical') c.highRisk += 1;
    if (p.district) c.districts.add(p.district);
  });

  // Augment with predefined contractor profile signals if available
  const contractorList = Array.from(contractorStatsMap.values()).map((c) => {
    const profile = contractors.find(
      (cp) => cp.name.toLowerCase() === c.name.toLowerCase()
    );

    let riskIndicator = profile?.riskIndicator;
    if (!riskIndicator) {
      if (c.highRisk >= 2) {
        riskIndicator = 'High Risk Clustering Indicator';
      } else if (c.totalWorks >= 3 && c.districts.size === 1) {
        riskIndicator = 'Unusual District Market Concentration';
      } else if (c.delayed > 1) {
        riskIndicator = 'Multiple Project Delay Patterns';
      }
    }

    return {
      ...c,
      riskIndicator,
      gstin: profile?.gstin || 'GST-TBD',
    };
  });

  // Filter
  const filteredContractors = contractorList.filter((c) => {
    if (!search.trim()) return true;
    return c.name.toLowerCase().includes(search.toLowerCase());
  }).sort((a, b) => b.highRisk - a.highRisk || b.totalWorks - a.totalWorks);

  // Filtered projects for selected contractor
  const contractorProjects = selectedContractor
    ? projects.filter(
        (p) => (p.contractorName || '').toLowerCase() === selectedContractor.toLowerCase()
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Contractor Procurement & Risk Analytics
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Procurement concentration, single-bid tendencies, and execution reliability audit
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search contractor or agency..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200/90 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs font-medium"
          />
        </div>
      </div>

      {/* Contractor Analytics Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Contractor / Agency</th>
                <th className="py-3 px-4 text-center">Total Works</th>
                <th className="py-3 px-4 text-right">Value (₹ Lakhs)</th>
                <th className="py-3 px-4 text-center">Completed</th>
                <th className="py-3 px-4 text-center">Delayed</th>
                <th className="py-3 px-4 text-center">High Risk</th>
                <th className="py-3 px-4">Risk Indicator</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContractors.map((c) => {
                const isSelected = selectedContractor === c.name;
                return (
                  <tr
                    key={c.name}
                    onClick={() =>
                      setSelectedContractor(isSelected ? null : c.name)
                    }
                    className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <div>{c.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            Districts: {Array.from(c.districts).join(', ') || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {c.totalWorks}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{c.totalValueLakhs.toFixed(1)}L
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                        {c.completed}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                          c.delayed > 0
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {c.delayed}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                          c.highRisk > 0
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {c.highRisk}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {c.riskIndicator ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>{c.riskIndicator}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Normal Profile</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedContractor(isSelected ? null : c.name);
                        }}
                        className="text-xs text-blue-700 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                      >
                        <span>{isSelected ? 'Hide' : 'Projects'}</span>
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-transform ${
                            isSelected ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Contractor Associated Projects */}
      {selectedContractor && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Projects Awarded to <span className="text-blue-700">{selectedContractor}</span> ({contractorProjects.length})
            </h3>
            <button
              onClick={() => setSelectedContractor(null)}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Clear selection
            </button>
          </div>

          <ProjectTable
            projects={contractorProjects}
            onSelectProject={onSelectProject}
            pageSize={6}
          />
        </div>
      )}
    </div>
  );
};
