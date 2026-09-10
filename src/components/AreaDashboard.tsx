import React, { useState } from 'react';
import {
  MapPin,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Users,
  IndianRupee,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronDown,
  Building2,
  FileCheck,
  TrendingUp,
  FileSpreadsheet,
  ArrowRight,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MPLADProject, ConstituencySummary, ContractorProfile } from '../types';

interface AreaDashboardProps {
  areaName: string;
  constituencies: ConstituencySummary[];
  projects: MPLADProject[];
  contractors: ContractorProfile[];
  onSelectArea: (area: string) => void;
  onBackToOverview: () => void;
  onSelectProject: (project: MPLADProject) => void;
}

export const AreaDashboard: React.FC<AreaDashboardProps> = ({
  areaName,
  constituencies = [],
  projects = [],
  contractors = [],
  onSelectArea,
  onBackToOverview,
  onSelectProject,
}) => {
  const safeProjects = projects || [];
  const safeConstituencies = constituencies || [];
  const safeContractors = contractors || [];
  const [activeFilter, setActiveFilter] = useState<'all' | 'flagged' | 'clean'>('all');

  const currentConstituency =
    safeConstituencies.find((c) => c.constituency.toLowerCase() === areaName.toLowerCase()) ||
    safeConstituencies[0] || { constituency: areaName };

  const areaProjects = safeProjects.filter(
    (p) => currentConstituency?.constituency && (p.constituency || '').toLowerCase() === currentConstituency.constituency.toLowerCase()
  );

  const flaggedProjects = areaProjects.filter((p) => (p.anomalyFlags || []).length > 0 || (p.detectedAnomalies || []).length > 0);
  const criticalProjects = areaProjects.filter((p) => (p.riskLevel || '').toUpperCase() === 'CRITICAL');
  const cleanProjects = areaProjects.filter((p) => (p.anomalyFlags || []).length === 0 && (p.detectedAnomalies || []).length === 0);

  const displayedProjects =
    activeFilter === 'flagged'
      ? flaggedProjects
      : activeFilter === 'clean'
      ? cleanProjects
      : areaProjects;

  // Key contractors active in this constituency
  const areaContractors = safeContractors.filter((c) =>
    currentConstituency?.constituency && (c.constituenciesCovered || []).includes(currentConstituency.constituency)
  );

  // Area Risk summary logic
  let areaRiskTone = 'Low';
  let areaPrimaryReason = 'All works conform to statutory MoSPI guidelines without spatial duplicates or cartel flags.';

  if (criticalProjects.length > 0) {
    areaRiskTone = 'Critical';
    const primaryAnom = (criticalProjects[0].anomalyFlags || criticalProjects[0].detectedAnomalies || [])[0];
    areaPrimaryReason = `${criticalProjects[0].title}: ${primaryAnom?.title || 'Severe anomaly detected'} (${primaryAnom?.description || 'Violates guidelines'}).`;
  } else if (flaggedProjects.length > 0) {
    areaRiskTone = 'High';
    const primaryAnom = (flaggedProjects[0].anomalyFlags || flaggedProjects[0].detectedAnomalies || [])[0];
    areaPrimaryReason = `${flaggedProjects[0].title}: ${primaryAnom?.title || 'Procedural irregularity'} (${primaryAnom?.description || 'Under review'}).`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Top Bar with Navigation & Area Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToOverview}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <div className="h-5 w-px bg-slate-200" />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600 shrink-0" />
                <span>{currentConstituency.constituency}</span>
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {currentConstituency.state}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Representative: <span className="font-semibold text-slate-700">{currentConstituency.mpName}</span> ({currentConstituency.mpType})
            </p>
          </div>
        </div>

        {/* Quick Area Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium whitespace-nowrap">Switch Area:</label>
          <div className="relative">
            <select
              value={currentConstituency.constituency}
              onChange={(e) => onSelectArea(e.target.value)}
              aria-label="Switch Area"
              className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {constituencies.map((c) => (
                <option key={c.constituency} value={c.constituency}>
                  {c.constituency} ({c.state})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Prominent Area Risk & Reason Banner */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          areaRiskTone === 'Critical'
            ? 'bg-red-50/70 border-red-200'
            : areaRiskTone === 'High'
            ? 'bg-amber-50/70 border-amber-200'
            : 'bg-emerald-50/70 border-emerald-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                areaRiskTone === 'Critical'
                  ? 'bg-red-100 text-red-600'
                  : areaRiskTone === 'High'
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              {areaRiskTone === 'Critical' ? (
                <ShieldAlert className="w-6 h-6" />
              ) : areaRiskTone === 'High' ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    areaRiskTone === 'Critical'
                      ? 'bg-red-600 text-white'
                      : areaRiskTone === 'High'
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {areaRiskTone} Area Risk
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  {flaggedProjects.length} of {areaProjects.length} works flagged with irregularities
                </span>
              </div>

              {/* Primary Area Reason clearly presented */}
              <div className="mt-2 text-sm text-slate-900 font-medium">
                <span className="font-bold text-slate-700 mr-1.5">Primary Reason:</span>
                <span>{areaPrimaryReason}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
            <div className="text-right">
              <div className="text-xs text-slate-500">Utilization Rate</div>
              <div className="text-xl font-black text-slate-900">{currentConstituency.utilizationRate}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metric Grid for this Area */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Sanctioned Funds</span>
            <IndianRupee className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900">
            ₹{(currentConstituency.sanctionedLakhs / 100).toFixed(2)} Cr
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Total allocation: ₹{(currentConstituency.allocatedLakhs / 100).toFixed(2)} Cr
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Spent Funds</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-emerald-600">
            ₹{(currentConstituency.spentLakhs / 100).toFixed(2)} Cr
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Unspent balance: ₹{(currentConstituency.unspentLakhs / 100).toFixed(2)} Cr
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>SC Mandatory Quota</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                currentConstituency.scAllocationPercent >= 15
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {currentConstituency.scAllocationPercent >= 15 ? 'Pass (≥15%)' : 'Deficit'}
            </span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900">
            {currentConstituency.scAllocationPercent}%
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                currentConstituency.scAllocationPercent >= 15 ? 'bg-emerald-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, (currentConstituency.scAllocationPercent / 15) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Sanction Lag</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900">
            {currentConstituency.avgSanctionDelayDays} Days
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Norm is &lt; 45 days from recommendation
          </div>
        </div>
      </div>

      {/* Projects in this Area: Clean list with Risk & Reason right on the front! */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Works in {currentConstituency.constituency} ({areaProjects.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Every project with its risk level and specific reason clearly stated
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({areaProjects.length})
            </button>
            <button
              onClick={() => setActiveFilter('flagged')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeFilter === 'flagged'
                  ? 'bg-white text-red-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Flagged ({flaggedProjects.length})
            </button>
            <button
              onClick={() => setActiveFilter('clean')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeFilter === 'clean'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Clean ({cleanProjects.length})
            </button>
          </div>
        </div>

        {/* Projects Cards List */}
        <div className="p-5 divide-y divide-slate-100 space-y-4">
          {displayedProjects.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No works matching filter criteria.
            </div>
          ) : (
            displayedProjects.map((p) => {
              const flags = p.anomalyFlags || p.detectedAnomalies || [];
              const hasAnomaly = flags.length > 0;
              const primaryReason =
                flags[0]?.description ||
                (hasAnomaly ? flags[0]?.title : 'Fully compliant with MoSPI guidelines.');

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="pt-4 first:pt-0 group"
                >
                  <div className="p-4 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-xs transition-all bg-slate-50/40 hover:bg-white">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                      {/* Work Details */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-mono text-slate-400">{p.workCode}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {p.category}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            ₹{p.sanctionedAmountLakhs.toFixed(2)} Lakhs
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {p.title}
                        </h3>

                        {/* Front Reason Callout */}
                        <div
                          className={`p-3 rounded-lg text-xs leading-relaxed ${
                            p.riskLevel === 'Critical'
                              ? 'bg-red-50 text-red-900 border border-red-100'
                              : p.riskLevel === 'High'
                              ? 'bg-amber-50 text-amber-900 border border-amber-100'
                              : p.riskLevel === 'Medium'
                              ? 'bg-yellow-50 text-yellow-900 border border-yellow-100'
                              : 'bg-emerald-50 text-emerald-900 border border-emerald-100'
                          }`}
                        >
                          <div className="font-bold mb-0.5 flex items-center gap-1.5">
                            <span>Reason:</span>
                            {hasAnomaly && flags[0]?.title && (
                              <span className="font-medium text-slate-600">
                                ({flags[0]?.title})
                              </span>
                            )}
                          </div>
                          <div>{primaryReason}</div>
                        </div>

                        {/* Metadata row */}
                        <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                          <span>Agency: <strong className="text-slate-700">{p.implementingAgency}</strong></span>
                          <span>•</span>
                          <span>Contractor: <strong className="text-slate-700">{p.contractorName}</strong></span>
                          <span>•</span>
                          <span>Tender: <strong className="text-slate-700">{p.tenderType}</strong></span>
                        </div>
                      </div>

                      {/* Right: Risk Badge & Action */}
                      <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0">
                        <div className="text-right">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
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
                            {p.riskLevel} Risk ({p.overallRiskScore}/100)
                          </span>
                        </div>

                        <button
                          onClick={() => onSelectProject(p)}
                          className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                        >
                          <span>Full Audit Details</span>
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

      {/* Contractor Footprint in this Area */}
      {areaContractors.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Vendors Operating in {currentConstituency.constituency}</span>
            </h3>
            <span className="text-xs text-slate-500">Cartel & Single-Bid Exposure</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {areaContractors.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-semibold text-slate-900 text-xs">{c.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    GSTIN: <span className="font-mono text-slate-600">{c.gstin}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Works: {c.totalWorksAwarded} • Total Value: ₹{(c.totalValueLakhs / 100).toFixed(2)} Cr
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Single-Bid Ratio</div>
                  <div
                    className={`text-sm font-black ${
                      c.singleBidRatio > 60 ? 'text-red-600' : 'text-slate-700'
                    }`}
                  >
                    {c.singleBidRatio}%
                  </div>
                  {c.isFlaggedForSlicing && (
                    <span className="text-[10px] font-bold text-amber-600">Slicing Flag</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
