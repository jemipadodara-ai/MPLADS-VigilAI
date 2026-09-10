import React, { useState } from 'react';
import {
  Search,
  Filter,
  ShieldAlert,
  AlertTriangle,
  FileText,
  MapPin,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  IndianRupee,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MPLADProject, AuditFilterState } from '../types';

interface AnomalyScannerProps {
  projects: MPLADProject[];
  onAuditProject: (project: MPLADProject) => void;
  onGenerateMemo: (project: MPLADProject) => void;
  onSelectProjectDetails: (project: MPLADProject) => void;
}

export const AnomalyScanner: React.FC<AnomalyScannerProps> = ({
  projects = [],
  onAuditProject,
  onGenerateMemo,
  onSelectProjectDetails,
}) => {
  const safeProjects = projects || [];
  const [filters, setFilters] = useState<AuditFilterState>({
    searchQuery: '',
    constituency: 'ALL',
    category: 'ALL',
    riskLevel: 'ALL',
    anomalyType: 'ALL',
    status: 'ALL',
    tenderType: 'ALL',
    financialYear: 'ALL',
    scStFilter: 'ALL',
  });

  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  // Filter options extraction
  const constituencies = Array.from(new Set(safeProjects.map((p) => p.constituency))).sort();
  const categories = Array.from(new Set(safeProjects.map((p) => p.category))).sort();

  // Apply filters
  const filteredProjects = safeProjects.filter((p) => {
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const matches =
        p.title.toLowerCase().includes(q) ||
        p.workCode.toLowerCase().includes(q) ||
        p.contractorName.toLowerCase().includes(q) ||
        p.mpName.toLowerCase().includes(q) ||
        p.constituency.toLowerCase().includes(q) ||
        p.implementingAgency.toLowerCase().includes(q);
      if (!matches) return false;
    }

    if (filters.constituency !== 'ALL' && p.constituency !== filters.constituency) return false;
    if (filters.category !== 'ALL' && p.category !== filters.category) return false;
    if (filters.riskLevel !== 'ALL' && p.riskLevel !== filters.riskLevel) return false;
    if (filters.status !== 'ALL' && p.status !== filters.status) return false;
    if (filters.tenderType !== 'ALL' && p.tenderType !== filters.tenderType) return false;

    if (filters.anomalyType !== 'ALL') {
      const hasType = (p.anomalyFlags || p.detectedAnomalies || []).some(
        (a: any) => a.type === filters.anomalyType
      );
      if (!hasType) return false;
    }

    if (filters.scStFilter !== 'ALL') {
      if (filters.scStFilter === 'SC' && p.scStEarmark !== 'SC Area (Mandatory 15%)') return false;
      if (filters.scStFilter === 'ST' && p.scStEarmark !== 'ST Area (Mandatory 7.5%)') return false;
      if (filters.scStFilter === 'GENERAL' && p.scStEarmark !== 'General') return false;
    }

    return true;
  });

  const getRiskBadge = (level: string, score: number) => {
    switch (level) {
      case 'Critical':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            Critical ({score}/100)
          </span>
        );
      case 'High':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
            High ({score}/100)
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-800 border border-yellow-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-600"></span>
            Medium ({score}/100)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            Compliant ({score}/100)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-indigo-600" />
              <span>Comprehensive Works & Fraud Registry</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live automated screening against MoSPI guidelines, procurement collusion algorithms, and spatial duplicate registers
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-700">
              Showing <span className="text-indigo-600 font-bold">{filteredProjects.length}</span> of {projects.length} works
            </span>
          </div>
        </div>

        {/* Search Input & Quick Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search box */}
          <div className="lg:col-span-2 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search work code, title, contractor, MP..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Risk Level Filter */}
          <div>
            <select
              value={filters.riskLevel}
              onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="Critical">Critical Risk (75-100)</option>
              <option value="High">High Risk (50-74)</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low / Clean Risk</option>
            </select>
          </div>

          {/* Anomaly Category */}
          <div>
            <select
              value={filters.anomalyType}
              onChange={(e) => setFilters({ ...filters, anomalyType: e.target.value })}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Anomaly Types</option>
              <option value="DUPLICATE_WORK">Duplicate / Ghost Works</option>
              <option value="TENDER_SLICING">Tender Slicing (&lt;₹10L)</option>
              <option value="PROHIBITED_CATEGORY">Prohibited Asset Violation</option>
              <option value="CONTRACTOR_CARTEL">Contractor Cartels</option>
              <option value="GEOTAG_MISMATCH">Geo-Tag Deviation</option>
              <option value="COST_INFLATION">Cost Escalation</option>
              <option value="UNSPENT_DELAY">Stalled / Unspent Delay</option>
              <option value="MISSING_UC">Missing UC Certificate</option>
            </select>
          </div>

          {/* Constituency Filter */}
          <div>
            <select
              value={filters.constituency}
              onChange={(e) => setFilters({ ...filters, constituency: e.target.value })}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Constituencies</option>
              {constituencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary Filter Tags */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Quick Filter:
          </span>

          <button
            onClick={() => setFilters({ ...filters, riskLevel: filters.riskLevel === 'Critical' ? 'ALL' : 'Critical' })}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
              filters.riskLevel === 'Critical'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Critical Breaches
          </button>

          <button
            onClick={() =>
              setFilters({ ...filters, anomalyType: filters.anomalyType === 'DUPLICATE_WORK' ? 'ALL' : 'DUPLICATE_WORK' })
            }
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
              filters.anomalyType === 'DUPLICATE_WORK'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Twin / Ghost Works
          </button>

          <button
            onClick={() =>
              setFilters({ ...filters, anomalyType: filters.anomalyType === 'TENDER_SLICING' ? 'ALL' : 'TENDER_SLICING' })
            }
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
              filters.anomalyType === 'TENDER_SLICING'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tender Slicing (&lt;₹10L)
          </button>

          <button
            onClick={() =>
              setFilters({ ...filters, anomalyType: filters.anomalyType === 'PROHIBITED_CATEGORY' ? 'ALL' : 'PROHIBITED_CATEGORY' })
            }
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
              filters.anomalyType === 'PROHIBITED_CATEGORY'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Prohibited Assets
          </button>

          <button
            onClick={() =>
              setFilters({
                searchQuery: '',
                constituency: 'ALL',
                category: 'ALL',
                riskLevel: 'ALL',
                anomalyType: 'ALL',
                status: 'ALL',
                tenderType: 'ALL',
                financialYear: 'ALL',
                scStFilter: 'ALL',
              })
            }
            className="text-[11px] text-indigo-600 hover:text-indigo-800 ml-auto font-medium"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Project Cards List */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-xs">
            <ShieldAlert className="h-10 w-10 mx-auto text-slate-400 mb-3" />
            <div className="text-base font-semibold text-slate-800">No matching MPLADS records found</div>
            <p className="text-xs text-slate-400 mt-1">Try relaxing the search filters or choosing a different constituency.</p>
          </div>
        ) : (
          filteredProjects.map((project) => {
            const isExpanded = expandedProjectId === project.id;
            const flags = project.anomalyFlags || project.detectedAnomalies || [];
            const primaryAnomaly = flags[0];
            const reasonText =
              project.riskLevel === 'Low'
                ? 'Passed all MoSPI parameter audits without spatial collision or cartel signals.'
                : primaryAnomaly
                ? `${primaryAnomaly.title}: ${primaryAnomaly.description}`
                : 'Irregularity identified under procedural inspection.';

            return (
              <motion.div
                key={project.id}
                layout
                className={`bg-white border transition-all rounded-2xl overflow-hidden shadow-xs ${
                  project.riskLevel === 'Critical'
                    ? 'border-red-200/90'
                    : project.riskLevel === 'High'
                    ? 'border-amber-200/90'
                    : 'border-slate-200'
                }`}
              >
                {/* Main Card Header Row */}
                <div className="p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {project.workCode}
                      </span>
                      {getRiskBadge(project.riskLevel, project.overallRiskScore)}
                      <span className="px-2 py-0.5 text-xs rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        {project.category}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        FY {project.financialYear}
                      </span>
                      {project.scStEarmark !== 'General' && (
                        <span className="px-2 py-0.5 text-xs rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                          {project.scStEarmark}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {project.title}
                    </h3>

                    {/* Prominent Risk Reason on the Front */}
                    <div
                      className={`p-3 rounded-xl border text-xs leading-relaxed ${
                        project.riskLevel === 'Critical'
                          ? 'bg-red-50 text-red-900 border-red-100'
                          : project.riskLevel === 'High'
                          ? 'bg-amber-50 text-amber-900 border-amber-100'
                          : project.riskLevel === 'Medium'
                          ? 'bg-yellow-50 text-yellow-900 border-yellow-100'
                          : 'bg-emerald-50 text-emerald-900 border-emerald-100'
                      }`}
                    >
                      <span className="font-bold mr-1">Risk Reason:</span>
                      <span>{reasonText}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        {project.constituency} ({project.state})
                      </span>
                      <span>•</span>
                      <span>
                        MP: <strong className="text-slate-800">{project.mpName}</strong> ({project.mpType} - {project.party})
                      </span>
                      <span>•</span>
                      <span>Agency: {project.implementingAgency}</span>
                    </div>
                  </div>

                  {/* Financial Metrics & Actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:self-center shrink-0">
                    <div className="text-right sm:pr-4 sm:border-r border-slate-200">
                      <div className="text-[11px] text-slate-400">Sanctioned Cost</div>
                      <div className="text-lg font-bold text-slate-900 flex items-center justify-end gap-1">
                        <IndianRupee className="h-4 w-4 text-slate-500" />
                        {project.sanctionedAmountLakhs} <span className="text-xs font-normal text-slate-500">Lakhs</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Spent: <span className="text-slate-700 font-medium">₹{project.expenditureAmountLakhs}L</span>
                        {project.unspentAmountLakhs > 0 && (
                          <span className="text-amber-600 font-bold ml-1">(₹{project.unspentAmountLakhs}L Unspent)</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onAuditProject(project)}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        AI Deep Audit
                      </button>

                      <button
                        onClick={() => onGenerateMemo(project)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                        title="Generate Official Statutory Memo"
                      >
                        <FileText className="h-3.5 w-3.5 text-slate-600" />
                        Statutory Memo
                      </button>

                      <button
                        onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                        aria-label="Toggle details"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Dossier Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="p-5 bg-slate-50/70 border-t border-slate-200 text-xs space-y-4"
                    >
                      {/* Description */}
                      <div>
                        <h4 className="font-semibold text-slate-700 text-xs mb-1">Sanctioned Scope of Work:</h4>
                        <p className="text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                          {project.description}
                        </p>
                      </div>

                      {/* Detailed Flags Breakdown */}
                      {(project.anomalyFlags || project.detectedAnomalies || []).length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-800 text-xs mb-2 flex items-center gap-1.5">
                            <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
                            <span>Detailed Guideline Breaches ({(project.anomalyFlags || project.detectedAnomalies || []).length}):</span>
                          </h4>
                          <div className="space-y-2">
                            {(project.anomalyFlags || project.detectedAnomalies || []).map((flag: any) => (
                              <div
                                key={flag.id}
                                className="p-3 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-red-700 text-xs">{flag.title}</span>
                                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                    AI Confidence: {flag.confidence || 85}%
                                  </span>
                                </div>
                                <p className="text-slate-700 text-xs leading-relaxed">{flag.description}</p>
                                <div className="text-[11px] text-indigo-700 font-medium pt-1">
                                  Rule Reference: {flag.ruleReference || 'MoSPI Guidelines'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Technical Metadata */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Awarded Contractor</span>
                          <span className="font-semibold text-slate-900">{project.contractorName}</span>
                          <div className="font-mono text-[10px] text-slate-500">GSTIN: {project.contractorGstin}</div>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Tender Modality</span>
                          <span className="font-semibold text-slate-900">{project.tenderType}</span>
                          <div className="text-[10px] text-slate-500">Bids Received: {project.bidCount}</div>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Geo-Tag Status</span>
                          <span
                            className={`font-semibold ${
                              project.geoTagVerified ? 'text-emerald-700' : 'text-red-700'
                            }`}
                          >
                            {project.geoTagVerified ? 'Verified by e-SAKSHI' : 'Discrepancy / Unverified'}
                          </span>
                          {project.geoTagDiscrepancyKm !== undefined && project.geoTagDiscrepancyKm > 0.1 && (
                            <div className="text-[10px] text-red-600 font-bold">
                              Deviation: {project.geoTagDiscrepancyKm} km away!
                            </div>
                          )}
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Mandatory Citizen Board</span>
                          <span
                            className={`font-semibold ${
                              project.hasMandatoryCitizenBoard ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {project.hasMandatoryCitizenBoard ? 'Installed with QR Code' : 'Missing Physical Plaque'}
                          </span>
                          <div className="text-[10px] text-slate-500">
                            UC Submitted: {project.hasUtilizationCertificate ? 'Yes' : 'Pending'}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
