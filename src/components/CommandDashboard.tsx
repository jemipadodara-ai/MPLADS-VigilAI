import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  ArrowRight,
  Filter,
  IndianRupee,
  Layers,
  ChevronRight,
  Sparkles,
  Search,
  Building2,
  Scale,
  Clock,
} from 'lucide-react';
import { motion } from 'motion/react';
import { MPLADProject, ConstituencySummary } from '../types';

interface CommandDashboardProps {
  projects: MPLADProject[];
  constituencies: ConstituencySummary[];
  onSelectProject: (project: MPLADProject) => void;
  onNavigateToTab: (tab: string) => void;
  onSelectArea: (area: string) => void;
}

export const CommandDashboard: React.FC<CommandDashboardProps> = ({
  projects = [],
  constituencies = [],
  onSelectProject,
  onNavigateToTab,
  onSelectArea,
}) => {
  const safeProjects = projects || [];
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const criticalProjects = safeProjects.filter((p) => (p.riskLevel || '').toUpperCase() === 'CRITICAL');
  const highRiskProjects = safeProjects.filter((p) => (p.riskLevel || '').toUpperCase() === 'HIGH');
  const mediumProjects = safeProjects.filter((p) => (p.riskLevel || '').toUpperCase() === 'MEDIUM');
  const cleanProjects = safeProjects.filter((p) => (p.riskLevel || '').toUpperCase() === 'LOW');

  // Filtered projects for the Risk & Reason board
  const filteredProjects = safeProjects.filter((p) => {
    const matchesSearch =
      (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.constituency || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.contractorName || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'critical') return (p.riskLevel || '').toUpperCase() === 'CRITICAL';
    if (filterType === 'high') return (p.riskLevel || '').toUpperCase() === 'HIGH' || (p.riskLevel || '').toUpperCase() === 'CRITICAL';
    if (filterType === 'clean') return (p.riskLevel || '').toUpperCase() === 'LOW';
    if (filterType === 'duplicates') {
      return (p.anomalyFlags || p.detectedAnomalies || []).some(
        (a: any) => a.type === 'DUPLICATE_WORK' || a.type === 'GEOTAG_MISMATCH'
      );
    }
    if (filterType === 'slicing') {
      return (p.anomalyFlags || p.detectedAnomalies || []).some(
        (a: any) => a.type === 'TENDER_SLICING' || a.type === 'CONTRACTOR_CARTEL'
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Welcome & System Status Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">National MPLADS Vigilance Radar</h1>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
              Live Audit Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Continuous forensic scanning across parliamentary works for duplicate sanctions, split tenders,
            unauthorized private property assets, and contractor cartels under MoSPI 2023 Guidelines.
          </p>
        </div>

        {/* Quick Area Shortcuts */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
            Areas:
          </span>
          {constituencies.map((c) => (
            <button
              key={c.constituency}
              onClick={() => onSelectArea(c.constituency)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition-colors border border-slate-200 whitespace-nowrap flex items-center gap-1"
            >
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>{c.constituency}</span>
              {c.criticalAnomalies > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Top Scannable Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Metric 1 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Critical Risks</span>
            <div className="p-1 rounded-md bg-red-50 text-red-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-red-600">{criticalProjects.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Requires immediate statutory notice</p>
        </motion.div>

        {/* Metric 2 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>High Risk Anomalies</span>
            <div className="p-1 rounded-md bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">{highRiskProjects.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Tender slicing & cartel signals</p>
        </motion.div>

        {/* Metric 3 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Clean / Safe Works</span>
            <div className="p-1 rounded-md bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">{cleanProjects.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Verified guidelines compliance</p>
        </motion.div>

        {/* Metric 4 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Total Works Scanned</span>
            <div className="p-1 rounded-md bg-indigo-50 text-indigo-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{projects.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Across 5 Lok Sabha constituencies</p>
        </motion.div>
      </div>

      {/* Main Feature Requested: Risk & Reason on the Front! */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Controls & Filter Header */}
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Risk & Reason Front Board</span>
              <span className="text-xs font-normal text-slate-500">
                ({filteredProjects.length} works shown)
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect the exact risk level and primary reason for every flagged work at a glance
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search works, area, contractor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-60 pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1 overflow-x-auto bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filterType === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('critical')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filterType === 'critical'
                    ? 'bg-white text-red-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Critical
              </button>
              <button
                onClick={() => setFilterType('duplicates')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filterType === 'duplicates'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Twin / Geo
              </button>
              <button
                onClick={() => setFilterType('slicing')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filterType === 'slicing'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Slicing
              </button>
              <button
                onClick={() => setFilterType('clean')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filterType === 'clean'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Clean
              </button>
            </div>
          </div>
        </div>

        {/* Project Cards: Risk & Reason Front and Center */}
        <div className="p-5 space-y-3.5">
          {filteredProjects.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No works match the selected search or filter.
            </div>
          ) : (
            filteredProjects.map((p, index) => {
              const flags = p.anomalyFlags || p.detectedAnomalies || [];
              const primaryAnomaly = flags[0];
              const isClean = p.riskLevel === 'Low';
              const reasonText = isClean
                ? 'Work passed all MoSPI parameter verifications. Open competitive tender, valid geotagging, citizen board present.'
                : primaryAnomaly
                ? `${primaryAnomaly.title}: ${primaryAnomaly.description}`
                : 'Under forensic review for procedural non-compliance.';

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 hover:border-indigo-300 hover:shadow-xs transition-all bg-white group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Left: Work Details + Risk & Reason */}
                    <div className="space-y-2.5 flex-1">
                      {/* Top Tag Row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => onSelectArea(p.constituency)}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                          title="Open Area Dashboard"
                        >
                          <MapPin className="w-3 h-3 text-indigo-600" />
                          <span>{p.constituency}</span>
                          <ChevronRight className="w-2.5 h-2.5" />
                        </button>

                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {p.category}
                        </span>

                        <span className="text-xs font-mono text-slate-400">
                          {p.workCode}
                        </span>

                        <span className="text-xs font-bold text-slate-700 ml-auto lg:ml-0">
                          ₹{p.sanctionedAmountLakhs.toFixed(2)} Lakhs
                        </span>
                      </div>

                      {/* Work Title */}
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                        {p.title}
                      </h3>

                      {/* FRONT AND CENTER: The Risk & Reason Box */}
                      <div
                        className={`p-3.5 rounded-xl border text-xs leading-relaxed transition-all ${
                          p.riskLevel === 'Critical'
                            ? 'bg-red-50/80 text-red-950 border-red-200'
                            : p.riskLevel === 'High'
                            ? 'bg-amber-50/80 text-amber-950 border-amber-200'
                            : p.riskLevel === 'Medium'
                            ? 'bg-yellow-50/80 text-yellow-950 border-yellow-200'
                            : 'bg-emerald-50/80 text-emerald-950 border-emerald-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold mb-1">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              p.riskLevel === 'Critical'
                                ? 'bg-red-600 animate-pulse'
                                : p.riskLevel === 'High'
                                ? 'bg-amber-600'
                                : p.riskLevel === 'Medium'
                                ? 'bg-yellow-600'
                                : 'bg-emerald-600'
                            }`}
                          />
                          <span className="uppercase text-[11px] tracking-wider">
                            Risk Reason:
                          </span>
                          {primaryAnomaly?.ruleReference && (
                            <span className="text-[10px] font-normal text-slate-500 ml-auto hidden sm:inline">
                              Ref: {String(primaryAnomaly.ruleReference).split(',')[0]}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-800 text-xs font-medium">
                          {reasonText}
                        </p>
                      </div>

                      {/* Implementation info */}
                      <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-0.5 flex-wrap">
                        <span>Agency: <strong className="text-slate-700">{p.implementingAgency}</strong></span>
                        <span>•</span>
                        <span>Contractor: <strong className="text-slate-700">{p.contractorName}</strong></span>
                        <span>•</span>
                        <span>Tender: <strong className="text-slate-700">{p.tenderType}</strong></span>
                      </div>
                    </div>

                    {/* Right: Badge & Actions */}
                    <div className="flex lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {/* Risk Score Pill */}
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                            p.riskLevel === 'Critical'
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : p.riskLevel === 'High'
                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : p.riskLevel === 'Medium'
                              ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              p.riskLevel === 'Critical'
                                ? 'bg-red-600'
                                : p.riskLevel === 'High'
                                ? 'bg-amber-600'
                                : p.riskLevel === 'Medium'
                                ? 'bg-yellow-600'
                                : 'bg-emerald-600'
                            }`}
                          />
                          <span>{p.riskLevel} Risk</span>
                          <span className="font-mono text-[11px] opacity-80">
                            ({p.overallRiskScore}/100)
                          </span>
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectArea(p.constituency)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                          Area Info
                        </button>

                        <button
                          onClick={() => onSelectProject(p)}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1"
                        >
                          <span>Full Audit</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Constituencies Quick Cards (Space/Area Selector) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Constituency & Space Dashboards
            </h3>
            <p className="text-xs text-slate-500">
              Select any area to view its dedicated balance, works breakdown, and SC/ST quotas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {constituencies.map((c) => (
            <motion.div
              key={c.constituency}
              whileHover={{ y: -2 }}
              onClick={() => onSelectArea(c.constituency)}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between gap-3 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                      {c.constituency}
                    </h4>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {c.state} • {c.mpName}
                  </div>
                </div>

                {c.criticalAnomalies > 0 ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                    {c.criticalAnomalies} Critical
                  </span>
                ) : (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Compliant
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px]">Sanctioned</span>
                  <div className="font-bold text-slate-800">
                    ₹{(c.sanctionedLakhs / 100).toFixed(2)} Cr
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Utilization</span>
                  <div className="font-bold text-slate-800">{c.utilizationRate}%</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-indigo-600 pt-1 group-hover:translate-x-0.5 transition-transform">
                <span>Open {c.constituency} Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
