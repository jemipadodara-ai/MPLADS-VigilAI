import React, { useState } from 'react';
import { MPLADProject, RiskLevel } from '../../types';
import { RiskBadge } from '../RiskBadge';
import { RiskScore } from '../RiskScore';
import { ProjectTable } from '../ProjectTable';
import { ShieldAlert, AlertOctagon, AlertTriangle, CheckCircle, Search, Filter } from 'lucide-react';

interface RiskCenterViewProps {
  projects: MPLADProject[];
  onSelectProject: (p: MPLADProject) => void;
}

export const RiskCenterView: React.FC<RiskCenterViewProps> = ({
  projects,
  onSelectProject,
}) => {
  const [selectedRiskTier, setSelectedRiskTier] = useState<RiskLevel | 'All'>('All');
  const [invFilter, setInvFilter] = useState<string>('All');
  const [search, setSearch] = useState('');

  // Counts
  const critical = projects.filter((p) => p.riskLevel === 'Critical');
  const high = projects.filter((p) => p.riskLevel === 'High');
  const medium = projects.filter((p) => p.riskLevel === 'Medium');
  const low = projects.filter((p) => p.riskLevel === 'Low');

  // Filtered
  const filtered = [...projects]
    .filter((p) => {
      if (selectedRiskTier !== 'All' && p.riskLevel !== selectedRiskTier) return false;
      if (invFilter !== 'All' && (p.investigationStatus || 'New') !== invFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const text = `${p.workCode} ${p.title} ${p.district} ${p.state} ${p.contractorName} ${p.mainAnomaly}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => (b.overallRiskScore || 0) - (a.overallRiskScore || 0));

  return (
    <div className="space-y-6">
      {/* Top Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Vigilance Risk Center
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time multi-factor anomaly scoring & human inspection triage
          </p>
        </div>

        <div className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          Total Flagged: <strong className="text-slate-900">{critical.length + high.length}</strong> high-priority works
        </div>
      </div>

      {/* Top 4 Risk Severity Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Critical */}
        <div
          onClick={() => setSelectedRiskTier(selectedRiskTier === 'Critical' ? 'All' : 'Critical')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            selectedRiskTier === 'Critical'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/20'
              : 'bg-white border-slate-200 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Critical Risk
            </span>
            <AlertOctagon className="w-5 h-5 text-rose-600" />
          </div>
          <div className="mt-2 text-3xl font-black text-rose-950 font-mono">
            {critical.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Score 81–100 • Multiple critical breaches
          </div>
        </div>

        {/* High */}
        <div
          onClick={() => setSelectedRiskTier(selectedRiskTier === 'High' ? 'All' : 'High')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            selectedRiskTier === 'High'
              ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-400/20'
              : 'bg-white border-slate-200 hover:border-orange-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-700">
              High Risk
            </span>
            <ShieldAlert className="w-5 h-5 text-orange-600" />
          </div>
          <div className="mt-2 text-3xl font-black text-orange-950 font-mono">
            {high.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Score 61–80 • Financial or milestone delays
          </div>
        </div>

        {/* Medium */}
        <div
          onClick={() => setSelectedRiskTier(selectedRiskTier === 'Medium' ? 'All' : 'Medium')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            selectedRiskTier === 'Medium'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Medium Risk
            </span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="mt-2 text-3xl font-black text-amber-950 font-mono">
            {medium.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Score 31–60 • Minor variances / data issues
          </div>
        </div>

        {/* Low */}
        <div
          onClick={() => setSelectedRiskTier(selectedRiskTier === 'Low' ? 'All' : 'Low')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            selectedRiskTier === 'Low'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/20'
              : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Low Risk
            </span>
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-2 text-3xl font-black text-emerald-950 font-mono">
            {low.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Score 0–30 • Verified guideline compliant
          </div>
        </div>
      </div>

      {/* Control Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search risk records by project, contractor, district..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
          />
        </div>

        {/* Investigation status filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] font-semibold text-slate-500 mr-1 whitespace-nowrap">
            Investigation:
          </span>
          {['All', 'New', 'Under Review', 'Verified', 'Dismissed'].map((st) => (
            <button
              key={st}
              onClick={() => setInvFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                invFilter === st
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Table sorted by risk descending */}
      <ProjectTable
        projects={filtered}
        onSelectProject={onSelectProject}
        pageSize={10}
      />
    </div>
  );
};
