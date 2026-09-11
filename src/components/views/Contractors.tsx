import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Layers,
  ShieldCheck,
  RotateCcw,
  IndianRupee,
  Star,
  ExternalLink,
  Info,
} from 'lucide-react';
import { MPLADProject, ContractorProfile } from '../../types';

interface ContractorsProps {
  projects: MPLADProject[];
  contractorProfiles?: ContractorProfile[];
  onInspectProject: (project: MPLADProject) => void;
}

export interface ComputedContractor {
  id: string;
  name: string;
  gstin: string;
  ownerOrDirector: string;
  totalWorksHandled: number;
  totalSanctionedLakhs: number;
  totalExpenditureLakhs: number;
  avgCompletionRate: number;
  completedCount: number;
  inProgressCount: number;
  delayedCount: number;
  underInvestigationCount: number;
  singleBidCount: number;
  singleBidPercentage: number;
  subThresholdCount: number; // < 10 Lakhs
  constituenciesCovered: string[];
  performanceRating: number; // 1.0 to 5.0
  performanceTier: 'High Performer' | 'Satisfactory' | 'Review Advised' | 'High Risk';
  performanceSummary: string;
  works: MPLADProject[];
}

export const Contractors: React.FC<ContractorsProps> = ({
  projects,
  contractorProfiles = [],
  onInspectProject,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [selectedContractorId, setSelectedContractorId] = useState<string>('');
  const [sortBy, setSortBy] = useState<'works' | 'value' | 'rating' | 'completion'>('works');

  // 1. Group and compute comprehensive contractor performance directly from the unified dataset
  const computedContractors = useMemo<ComputedContractor[]>(() => {
    const contractorMap = new Map<string, {
      profile?: ContractorProfile;
      works: MPLADProject[];
      name: string;
      gstin: string;
    }>();

    // Seed known profiles first
    contractorProfiles.forEach((cp) => {
      const key = cp.name.trim().toLowerCase();
      contractorMap.set(key, {
        profile: cp,
        works: [],
        name: cp.name,
        gstin: cp.gstin || 'Unregistered / Exempt',
      });
    });

    // Populate with projects
    projects.forEach((p) => {
      const cName = (p.contractorName || '').trim();
      if (!cName) return;

      const key = cName.toLowerCase();
      let entry = contractorMap.get(key);

      if (!entry) {
        // Look up by partial or gstin match
        for (const [k, v] of contractorMap.entries()) {
          if (p.contractorGstin && v.gstin && p.contractorGstin === v.gstin) {
            entry = v;
            break;
          }
          if (cName.includes(k) || k.includes(cName)) {
            entry = v;
            break;
          }
        }
      }

      if (!entry) {
        entry = {
          works: [],
          name: cName,
          gstin: p.contractorGstin || 'Exempt / Not Provided',
        };
        contractorMap.set(key, entry);
      }

      entry.works.push(p);
    });

    const list: ComputedContractor[] = [];

    contractorMap.forEach((entry, key) => {
      const works = entry.works;
      const profile = entry.profile;
      const worksCount = works.length > 0 ? works.length : (profile?.totalWorksAwarded || 1);
      const totalSanctioned = works.reduce(
        (acc, w) => acc + (w.sanctionedAmountLakhs || 0),
        0
      ) || (profile?.totalValueLakhs || 0);

      const totalExpenditure = works.reduce(
        (acc, w) => acc + (w.expenditureAmountLakhs || 0),
        0
      );

      const completedCount = works.filter((w) => w.status === 'Completed' || (w.completionPercentage || 0) >= 100).length;
      const delayedCount = works.filter((w) => w.status === 'Delayed' || ((w as any).delayDays && (w as any).delayDays > 0)).length;
      const underInvestigationCount = works.filter((w) => w.status === 'Under Investigation').length;
      const inProgressCount = works.filter((w) => w.status === 'In Progress' || w.status === 'Sanctioned').length;

      const totalProgress = works.reduce((acc, w) => acc + (w.completionPercentage || 0), 0);
      const avgCompletion = works.length > 0 ? Math.round(totalProgress / works.length) : 75;

      const singleBidCount = works.filter((w) => w.tenderType === 'Nomination / Single Bid' || w.bidCount === 1).length;
      const singleBidPct = works.length > 0
        ? Math.round((singleBidCount / works.length) * 100)
        : (profile?.singleBidRatio || 0);

      const subThresholdCount = works.filter(
        (w) => (w.sanctionedAmountLakhs || 0) > 0 && (w.sanctionedAmountLakhs || 0) < 10
      ).length || (profile?.subThresholdCount || 0);

      const constituencies = Array.from(
        new Set(works.map((w) => w.constituency || w.district).filter(Boolean))
      );
      if (profile?.constituenciesCovered) {
        profile.constituenciesCovered.forEach((c) => {
          if (!constituencies.includes(c)) constituencies.push(c);
        });
      }

      // Calculate an objective Performance Rating (1.0 to 5.0)
      let rating = 4.5;
      if (delayedCount > 0) rating -= delayedCount * 0.4;
      if (underInvestigationCount > 0) rating -= underInvestigationCount * 0.8;
      if (singleBidPct > 60) rating -= 0.6;
      if (avgCompletion < 50) rating -= 0.5;
      if (profile?.cartelRiskScore && profile.cartelRiskScore > 75) rating -= 0.6;

      // Bound between 1.0 and 5.0
      rating = Math.max(1.0, Math.min(5.0, Number(rating.toFixed(1))));

      let performanceTier: ComputedContractor['performanceTier'] = 'Satisfactory';
      if (rating >= 4.2 && delayedCount === 0 && underInvestigationCount === 0) {
        performanceTier = 'High Performer';
      } else if (rating < 2.5 || underInvestigationCount > 0 || (profile?.cartelRiskScore && profile.cartelRiskScore > 80)) {
        performanceTier = 'High Risk';
      } else if (rating < 3.5 || delayedCount > 0 || singleBidPct >= 50) {
        performanceTier = 'Review Advised';
      }

      // Plain language performance summary
      let summary = 'Execution meets standard project milestones with verified measurement records.';
      if (underInvestigationCount > 0) {
        summary = 'Administrative review active: physical execution discrepancy noted against Measurement Book.';
      } else if (delayedCount > 0) {
        summary = `Milestone lag recorded: ${delayedCount} project(s) running behind planned completion dates.`;
      } else if (singleBidPct >= 50) {
        summary = `High single-bid procurement concentration (${singleBidPct}% of contracts awarded without multiple bids).`;
      } else if (completedCount >= 2 && delayedCount === 0) {
        summary = 'Consistently delivers on schedule with certified citizen information boards.';
      }

      list.push({
        id: profile?.id || `c-${key.replace(/[^a-z0-9]/g, '-')}`,
        name: entry.name,
        gstin: entry.gstin,
        ownerOrDirector: profile?.ownerOrDirector || 'Registered Executive Director',
        totalWorksHandled: worksCount,
        totalSanctionedLakhs: totalSanctioned,
        totalExpenditureLakhs: totalExpenditure,
        avgCompletionRate: avgCompletion,
        completedCount,
        inProgressCount,
        delayedCount,
        underInvestigationCount,
        singleBidCount,
        singleBidPercentage: singleBidPct,
        subThresholdCount,
        constituenciesCovered: constituencies,
        performanceRating: rating,
        performanceTier,
        performanceSummary: summary,
        works,
      });
    });

    return list;
  }, [projects, contractorProfiles]);

  // Set default selected contractor
  const selectedContractor = useMemo(() => {
    if (selectedContractorId) {
      const found = computedContractors.find((c) => c.id === selectedContractorId);
      if (found) return found;
    }
    return computedContractors[0] || null;
  }, [computedContractors, selectedContractorId]);

  // Filter and sort contractors
  const filteredContractors = useMemo(() => {
    return computedContractors
      .filter((c) => {
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          const matchName = c.name.toLowerCase().includes(q);
          const matchGstin = c.gstin.toLowerCase().includes(q);
          const matchDirector = c.ownerOrDirector.toLowerCase().includes(q);
          if (!matchName && !matchGstin && !matchDirector) return false;
        }

        if (selectedTier !== 'All') {
          if (c.performanceTier !== selectedTier) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'works') return b.totalWorksHandled - a.totalWorksHandled;
        if (sortBy === 'value') return b.totalSanctionedLakhs - a.totalSanctionedLakhs;
        if (sortBy === 'rating') return b.performanceRating - a.performanceRating;
        if (sortBy === 'completion') return b.avgCompletionRate - a.avgCompletionRate;
        return 0;
      });
  }, [computedContractors, searchTerm, selectedTier, sortBy]);

  // High-level macro statistics
  const macroStats = useMemo(() => {
    const totalContractors = computedContractors.length;
    const totalAwardedLakhs = computedContractors.reduce((acc, c) => acc + c.totalSanctionedLakhs, 0);
    const highRiskCount = computedContractors.filter(
      (c) => c.performanceTier === 'High Risk' || c.performanceTier === 'Review Advised'
    ).length;
    const avgOverallRating = (
      computedContractors.reduce((acc, c) => acc + c.performanceRating, 0) /
      (totalContractors || 1)
    ).toFixed(1);

    return {
      totalContractors,
      totalAwardedCr: (totalAwardedLakhs / 100).toFixed(2),
      highRiskCount,
      avgOverallRating,
    };
  }, [computedContractors]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. Top Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold uppercase tracking-wider">
                Vendor Oversight
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 text-xs font-medium">
                Contractor Performance &amp; Delivery Tracking
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Contractor Performance Registry
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Objective delivery track record, milestone timeliness, and procurement transparency ratings across all executing vendors.
            </p>
          </div>

          {/* Quick macro metrics */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Vendors</span>
              <strong className="text-slate-900 text-sm font-bold font-mono">
                {macroStats.totalContractors} Entities
              </strong>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Allocation</span>
              <strong className="text-slate-900 text-sm font-bold font-mono">
                ₹{macroStats.totalAwardedCr} Cr
              </strong>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs">
              <span className="text-amber-700 block text-[10px] uppercase font-bold">Review Recommended</span>
              <strong className="text-amber-900 text-sm font-bold font-mono">
                {macroStats.highRiskCount} Vendors
              </strong>
            </div>
          </div>
        </div>

        {/* 2. Search & Filter Bar */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search vendor by name, GSTIN, or director..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50/80 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {/* Performance Tier Filter */}
          <div className="lg:col-span-3">
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50/80 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-slate-700"
            >
              <option value="All">All Performance Tiers</option>
              <option value="High Performer">High Performer (4.2★ - 5.0★)</option>
              <option value="Satisfactory">Satisfactory (3.5★ - 4.1★)</option>
              <option value="Review Advised">Review Advised (Delays / Single-Bid)</option>
              <option value="High Risk">High Risk / Active Review</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="lg:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50/80 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-slate-700"
            >
              <option value="works">Sort by: Projects Count (High to Low)</option>
              <option value="value">Sort by: Contract Outlay (High to Low)</option>
              <option value="rating">Sort by: Performance Rating</option>
              <option value="completion">Sort by: Average Completion Rate</option>
            </select>
          </div>

          {/* Reset Button */}
          <div className="lg:col-span-1 flex justify-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedTier('All');
                setSortBy('works');
              }}
              title="Reset Filters"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer w-full sm:w-auto flex items-center justify-center"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Split View: Left List + Right Detail Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Vendor Cards List (5 Cols on large) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            <span>Contractors ({filteredContractors.length})</span>
            <span>Click to view profile</span>
          </div>

          {filteredContractors.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/90 text-slate-500 space-y-2">
              <Users className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-semibold">No contractors match your filters.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTier('All');
                }}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            filteredContractors.map((contractor) => {
              const isSelected = selectedContractor?.id === contractor.id;

              return (
                <div
                  key={contractor.id}
                  onClick={() => setSelectedContractorId(contractor.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-indigo-600 shadow-sm ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 max-w-[70%]">
                      <div className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">
                        {contractor.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 truncate">
                        GSTIN: {contractor.gstin}
                      </div>
                    </div>

                    {/* Performance Rating Badge */}
                    <div className="flex flex-col items-end">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-slate-100 text-slate-800 border border-slate-200">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>{contractor.performanceRating.toFixed(1)}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold mt-1 ${
                          contractor.performanceTier === 'High Performer'
                            ? 'text-emerald-700'
                            : contractor.performanceTier === 'High Risk'
                            ? 'text-rose-700'
                            : contractor.performanceTier === 'Review Advised'
                            ? 'text-amber-700'
                            : 'text-blue-700'
                        }`}
                      >
                        {contractor.performanceTier}
                      </span>
                    </div>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Works Handled</span>
                      <strong className="text-slate-900 font-bold font-mono">
                        {contractor.totalWorksHandled}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Outlay</span>
                      <strong className="text-slate-900 font-bold font-mono">
                        ₹{(contractor.totalSanctionedLakhs).toFixed(1)}L
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Avg Completion</span>
                      <strong className="text-slate-900 font-bold font-mono">
                        {contractor.avgCompletionRate}%
                      </strong>
                    </div>
                  </div>

                  {/* Operational Notes / Alert */}
                  {contractor.delayedCount > 0 && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                      <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="truncate">{contractor.delayedCount} project(s) experiencing timeline delay</span>
                    </div>
                  )}

                  {contractor.underInvestigationCount > 0 && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold text-rose-800 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
                      <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                      <span className="truncate">Active physical inspection flag</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Contractor Performance Dossier (7 Cols on large) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedContractor ? (
            <>
              {/* Profile Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                        Vendor Performance Profile
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500 font-medium">
                        {selectedContractor.constituenciesCovered.join(', ') || 'District Division'}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {selectedContractor.name}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Director / Authorized Signatory:{' '}
                      <strong className="text-slate-800">{selectedContractor.ownerOrDirector}</strong> • GSTIN:{' '}
                      <code className="font-mono text-slate-700">{selectedContractor.gstin}</code>
                    </p>
                  </div>

                  {/* Rating & Performance Tier */}
                  <div className="sm:text-right shrink-0">
                    <div className="text-[11px] text-slate-400 font-bold uppercase">Performance Rating</div>
                    <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      <span className="text-2xl font-black text-slate-900 font-mono">
                        {selectedContractor.performanceRating.toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-400">/ 5.0</span>
                    </div>
                    <span
                      className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full mt-1 border ${
                        selectedContractor.performanceTier === 'High Performer'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : selectedContractor.performanceTier === 'High Risk'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : selectedContractor.performanceTier === 'Review Advised'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}
                    >
                      {selectedContractor.performanceTier}
                    </span>
                  </div>
                </div>

                {/* Performance Metrics Quad */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Awarded</span>
                    <strong className="text-base font-bold text-slate-900 font-mono">
                      ₹{(selectedContractor.totalSanctionedLakhs / 100).toFixed(2)} Cr
                    </strong>
                    <span className="text-[10px] text-slate-500 block">
                      {selectedContractor.totalWorksHandled} total works
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Physical Completion</span>
                    <strong className="text-base font-bold text-slate-900 font-mono">
                      {selectedContractor.avgCompletionRate}%
                    </strong>
                    <span className="text-[10px] text-slate-500 block">
                      Average progress rate
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Single-Bid Awards</span>
                    <strong
                      className={`text-base font-bold font-mono ${
                        selectedContractor.singleBidPercentage > 50 ? 'text-amber-700' : 'text-slate-900'
                      }`}
                    >
                      {selectedContractor.singleBidPercentage}%
                    </strong>
                    <span className="text-[10px] text-slate-500 block">
                      {selectedContractor.singleBidCount} single-bid works
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Execution Status</span>
                    <strong className="text-base font-bold text-slate-900 font-mono">
                      {selectedContractor.completedCount} Done
                    </strong>
                    <span className="text-[10px] text-slate-500 block">
                      {selectedContractor.delayedCount} delayed • {selectedContractor.inProgressCount} active
                    </span>
                  </div>
                </div>

                {/* Qualitative Performance Diagnostic Note */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-indigo-600" />
                    <span>Auditor Diagnostic Summary &amp; Procurement Observation</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {selectedContractor.performanceSummary}
                  </p>
                </div>
              </div>

              {/* Associated MPLADS Works Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-3">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                      <span>Assigned Works Handled ({selectedContractor.works.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      All projects linked to {selectedContractor.name} in the master public registry.
                    </p>
                  </div>
                </div>

                {selectedContractor.works.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No active individual project records currently mapped in this district window.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                          <th className="py-3 px-4">Work Code &amp; Title</th>
                          <th className="py-3 px-4">Location</th>
                          <th className="py-3 px-4">Sanctioned</th>
                          <th className="py-3 px-4 min-w-[120px]">Completion</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedContractor.works.map((work) => {
                          const isDelayed = work.status === 'Delayed';
                          const isInvestigation = work.status === 'Under Investigation';

                          return (
                            <tr
                              key={work.id}
                              className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                              onClick={() => onInspectProject(work)}
                            >
                              <td className="py-3 px-4 max-w-xs">
                                <div className="font-mono text-[10px] text-slate-400 font-semibold">
                                  {work.workCode || work.id}
                                </div>
                                <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                                  {work.title}
                                </div>
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                                {work.constituency || work.district}
                              </td>

                              <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                                ₹{(work.sanctionedAmountLakhs || 0).toFixed(2)}L
                              </td>

                              <td className="py-3 px-4">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                                    <span>{work.completionPercentage || 0}%</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        (work.completionPercentage || 0) >= 90
                                          ? 'bg-emerald-500'
                                          : (work.completionPercentage || 0) >= 50
                                          ? 'bg-blue-500'
                                          : 'bg-amber-500'
                                      }`}
                                      style={{ width: `${work.completionPercentage || 0}%` }}
                                    />
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    isInvestigation
                                      ? 'bg-rose-100 text-rose-800'
                                      : isDelayed
                                      ? 'bg-amber-100 text-amber-800'
                                      : work.status === 'Completed'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {work.status}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onInspectProject(work);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 transition-all cursor-pointer"
                                >
                                  <span>Inspect</span>
                                  <ArrowRight className="w-3 h-3" />
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
            </>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 text-slate-400 space-y-2">
              <Users className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Select a contractor to view their performance dossier.</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Data Transparency & Provenance Disclaimer Footer Card */}
      <div className="bg-slate-100/80 rounded-2xl border border-slate-200 p-4 sm:p-5 text-xs text-slate-600 space-y-1.5">
        <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Data Transparency &amp; Vendor Rating Disclaimer</span>
        </div>
        <p className="text-slate-500 leading-relaxed text-[11px]">
          Contractor performance ratings, single-bid ratios, and project progress statistics are computed strictly from public MPLADS project records and statutory progress returns (MoSPI Guidelines Clause 5.2 &amp; General Financial Rules Rule 144). Performance ratings serve as administrative monitoring indicators for scheduling physical audits and do not constitute formal commercial debars or legal judgments.
        </p>
      </div>
    </div>
  );
};
