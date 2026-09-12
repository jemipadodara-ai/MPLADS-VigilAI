import React, { useState, useMemo, useEffect } from 'react';
import { MPLADProject, ConstituencySummary, RiskLevel } from '../../types';
import { decomposeProjectRisk, calculateNationalRiskIndex } from '../../utils/decisionEngine';
import {
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Clock,
  Layers,
  Copy,
  DollarSign,
  Building,
  CheckCircle2,
  Filter,
  RefreshCw,
  Search,
  ChevronRight,
  MapPin,
  FileSpreadsheet,
  ArrowUpRight,
} from 'lucide-react';

interface NationalCommandCenterProps {
  projects: MPLADProject[];
  constituencies?: ConstituencySummary[];
  onInspectProject: (project: MPLADProject) => void;
  onNavigateToDecisionCenter: () => void;
}

export const NationalCommandCenter: React.FC<NationalCommandCenterProps> = ({
  projects,
  constituencies = [],
  onInspectProject,
  onNavigateToDecisionCenter,
}) => {
  // Region drilldown states: State -> District -> Constituency
  const [selectedState, setSelectedState] = useState<string>('All States');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Districts');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mlHealth, setMlHealth] = React.useState<any>(null);
  const [mlModelInfo, setMlModelInfo] = React.useState<any>(null);

  useEffect(() => {
    fetch('/api/ml/health').then(r => r.ok ? r.json() : null).then(d => setMlHealth(d)).catch(() => {});
    fetch('/api/ml/model-info').then(r => r.ok ? r.json() : null).then(d => setMlModelInfo(d)).catch(() => {});
  }, []);

  // Extract unique states & categories
  const states = useMemo(() => {
    const list = Array.from(new Set(projects.map((p) => p.state).filter(Boolean))) as string[];
    return ['All States', ...list.sort()];
  }, [projects]);

  const districts = useMemo(() => {
    const filtered = selectedState === 'All States'
      ? projects
      : projects.filter((p) => p.state === selectedState);
    const list = Array.from(new Set(filtered.map((p) => p.district).filter(Boolean))) as string[];
    return ['All Districts', ...list.sort()];
  }, [projects, selectedState]);

  const categories = useMemo(() => {
    const list = Array.from(new Set(projects.map((p) => p.category).filter(Boolean))) as string[];
    return ['All Categories', ...list.sort()];
  }, [projects]);

  // Filter projects by drill-down selection
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (selectedState !== 'All States' && p.state !== selectedState) return false;
      if (selectedDistrict !== 'All Districts' && p.district !== selectedDistrict) return false;
      if (selectedCategory !== 'All Categories' && p.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (p.title || '').toLowerCase().includes(q);
        const codeMatch = (p.workCode || p.id || '').toLowerCase().includes(q);
        const districtMatch = (p.district || '').toLowerCase().includes(q);
        if (!titleMatch && !codeMatch && !districtMatch) return false;
      }
      return true;
    });
  }, [projects, selectedState, selectedDistrict, selectedCategory, searchQuery]);

  // Calculate high-precision KPI metrics
  const kpis = useMemo(() => {
    const totalWorks = filteredProjects.length;
    const totalSanctionedLakhs = filteredProjects.reduce((acc, p) => acc + (p.sanctionedAmountLakhs || 0), 0);
    const totalExpenditureLakhs = filteredProjects.reduce((acc, p) => acc + (p.expenditureAmountLakhs || 0), 0);

    let highRiskCount = 0;
    let criticalCount = 0;
    let delayedCount = 0;
    let potentialDuplicates = 0;
    let pendingVerificationCount = 0;
    let totalExposureLakhs = 0;

    filteredProjects.forEach((p) => {
      const decomp = decomposeProjectRisk(p, projects);
      if (decomp.totalScore >= 75) criticalCount++;
      else if (decomp.totalScore >= 55) highRiskCount++;

      const delayDays = (p as any).delayDays || 0;
      if (p.status === 'Delayed' || delayDays > 14) delayedCount++;

      if (decomp.duplicateProbability >= 8) potentialDuplicates++;

      if (decomp.totalScore >= 60 || p.status === 'Under Investigation') {
        pendingVerificationCount++;
      }

      const sanctioned = p.sanctionedAmountLakhs || 0;
      const spent = p.expenditureAmountLakhs || 0;
      const progress = p.completionPercentage || 0;
      const exposure = Math.max(0, spent - (sanctioned * (progress / 100)));
      totalExposureLakhs += exposure;
    });

    return {
      totalWorks,
      totalSanctionedCr: (totalSanctionedLakhs / 100).toFixed(2),
      totalExpenditureCr: (totalExpenditureLakhs / 100).toFixed(2),
      highRiskCount,
      criticalCount,
      delayedCount,
      potentialDuplicates,
      pendingVerificationCount,
      totalExposureCr: (totalExposureLakhs / 100).toFixed(2),
    };
  }, [filteredProjects, projects]);

  // National Risk Index metrics
  const nationalRiskIndex = useMemo(() => {
    return calculateNationalRiskIndex(filteredProjects.length > 0 ? filteredProjects : projects);
  }, [filteredProjects, projects]);

  // State-wise risk breakdown for heatmap table
  const stateRiskTable = useMemo(() => {
    const stateMap = new Map<string, { total: number; high: number; exposure: number; sanction: number }>();
    projects.forEach((p) => {
      const st = p.state || 'Other';
      const existing = stateMap.get(st) || { total: 0, high: 0, exposure: 0, sanction: 0 };
      const decomp = decomposeProjectRisk(p, projects);
      const isHigh = decomp.totalScore >= 55;
      const sanctioned = p.sanctionedAmountLakhs || 0;
      const spent = p.expenditureAmountLakhs || 0;
      const progress = p.completionPercentage || 0;
      const exposure = Math.max(0, spent - (sanctioned * (progress / 100)));

      stateMap.set(st, {
        total: existing.total + 1,
        high: existing.high + (isHigh ? 1 : 0),
        exposure: existing.exposure + exposure,
        sanction: existing.sanction + sanctioned,
      });
    });

    return Array.from(stateMap.entries())
      .map(([name, data]) => {
        const riskPct = data.total > 0 ? (data.high / data.total) * 100 : 0;
        let riskBand: 'Green' | 'Yellow' | 'Orange' | 'Red' = 'Green';
        if (riskPct >= 40 || data.high >= 5) riskBand = 'Red';
        else if (riskPct >= 25 || data.high >= 3) riskBand = 'Orange';
        else if (riskPct >= 10 || data.high >= 1) riskBand = 'Yellow';

        return {
          stateName: name,
          totalWorks: data.total,
          flaggedWorks: data.high,
          riskPct: Number(riskPct.toFixed(1)),
          exposureLakhs: Number(data.exposure.toFixed(1)),
          sanctionLakhs: Number(data.sanction.toFixed(1)),
          riskBand,
        };
      })
      .sort((a, b) => b.riskPct - a.riskPct);
  }, [projects]);

  return (
    <div className="space-y-6">
      {/* Title & Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
              MoSPI Vigilance Oversight
            </span>
            <span className="text-xs text-slate-500 font-medium">
              National Monitoring & Early Warning Division
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            NATIONAL MPLADS COMMAND CENTER
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-2xl">
            Real-time geospatial decision intelligence, explainable risk indexes, and multi-tier statutory oversight across Parliamentary Constituencies.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onNavigateToDecisionCenter}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <span>Open Decision Center</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drill-down Region Filters (India -> State -> District -> Constituency -> Project) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>National Drill-down Navigation Hierarchy</span>
          </div>
          {(selectedState !== 'All States' || selectedDistrict !== 'All Districts' || selectedCategory !== 'All Categories' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedState('All States');
                setSelectedDistrict('All Districts');
                setSelectedCategory('All Categories');
                setSearchQuery('');
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Reset All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* State Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              State / UT
            </label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict('All Districts');
              }}
              className="w-full text-xs rounded-lg border border-slate-300 bg-white py-2 px-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* District Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              District Jurisdiction
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={selectedState === 'All States' && districts.length > 50}
              className="w-full text-xs rounded-lg border border-slate-300 bg-white py-2 px-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Infrastructure Sector
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 bg-white py-2 px-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Search by ID/Title */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Search Work or ID
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Work code, title, locality..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Active Breadcrumb path */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-600 overflow-x-auto">
          <span className="font-semibold text-slate-900">National Scope</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className={selectedState !== 'All States' ? 'font-bold text-indigo-700' : 'text-slate-500'}>
            {selectedState}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className={selectedDistrict !== 'All Districts' ? 'font-bold text-indigo-700' : 'text-slate-500'}>
            {selectedDistrict}
          </span>
          <span className="ml-auto text-slate-500 text-[11px]">
            Displaying {filteredProjects.length} matching works
          </span>
        </div>
      </div>

      {/* Top National KPI Grid (9 KPIs as specified) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. Total Monitored Works */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-slate-500 truncate">Total Works</div>
          <div className="text-xl font-black text-slate-900 mt-1">{kpis.totalWorks}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Active under monitoring</div>
        </div>

        {/* 2. Total Sanctioned */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-slate-500 truncate">Sanctioned Amount</div>
          <div className="text-xl font-black text-slate-900 mt-1">₹{kpis.totalSanctionedCr} Cr</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Approved allocations</div>
        </div>

        {/* 3. Total Expenditure */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-slate-500 truncate">Total Expenditure</div>
          <div className="text-xl font-black text-slate-900 mt-1">₹{kpis.totalExpenditureCr} Cr</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Disbursed to date</div>
        </div>

        {/* 4. High-Risk Works */}
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-amber-800 truncate">High-Risk Works</div>
          <div className="text-xl font-black text-amber-900 mt-1">{kpis.highRiskCount}</div>
          <div className="text-[10px] text-amber-700 font-semibold mt-0.5">Score 55 – 74</div>
        </div>

        {/* 5. Critical Works */}
        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/40 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-rose-800 truncate">Critical Works</div>
          <div className="text-xl font-black text-rose-900 mt-1">{kpis.criticalCount}</div>
          <div className="text-[10px] text-rose-700 font-semibold mt-0.5">Score ≥ 75 (P0 Priority)</div>
        </div>

        {/* 6. Delayed Works */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-slate-500 truncate">Delayed Works</div>
          <div className="text-xl font-black text-slate-800 mt-1">{kpis.delayedCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Behind milestone target</div>
        </div>

        {/* 7. Potential Duplicates */}
        <div className="bg-white p-4 rounded-xl border border-purple-200 bg-purple-50/30 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-purple-800 truncate">Potential Duplicates</div>
          <div className="text-xl font-black text-purple-900 mt-1">{kpis.potentialDuplicates}</div>
          <div className="text-[10px] text-purple-700 font-semibold mt-0.5">Similarity & proximity flag</div>
        </div>

        {/* 8. Pending Verification */}
        <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/30 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-blue-800 truncate">Pending Verification</div>
          <div className="text-xl font-black text-blue-900 mt-1">{kpis.pendingVerificationCount}</div>
          <div className="text-[10px] text-blue-700 font-semibold mt-0.5">Awaiting on-site inspection</div>
        </div>

        {/* 9. Estimated Financial Exposure */}
        <div className="bg-white p-4 rounded-xl border border-rose-300 bg-gradient-to-br from-white to-rose-50/50 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold uppercase text-rose-800 truncate">Financial Exposure</div>
          <div className="text-xl font-black text-rose-950 mt-1">₹{kpis.totalExposureCr} Cr</div>
          <div className="text-[10px] text-rose-700 font-semibold mt-0.5">Spending ahead of work</div>
        </div>
      </div>

      {/* NATIONAL RISK INDEX BLOCK */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xl">
              {nationalRiskIndex.currentValue}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Composite National Index
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                National MPLADS Risk Index (NMRI)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Previous Period</div>
              <div className="text-sm font-bold text-slate-700">
                {nationalRiskIndex.previousPeriodValue} / 100
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Trajectory Trend</div>
              <div className="flex items-center gap-1 text-sm font-bold text-emerald-700">
                <TrendingDown className="w-4 h-4" />
                <span>{Math.abs(nationalRiskIndex.trendDelta)} pts (Improving)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Major Contributing Factors */}
        <div className="mt-5">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Primary Contributing Risk Drivers
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {nationalRiskIndex.majorContributingFactors.map((driver, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
              >
                <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                  <span>{driver.impactPercentage}% Weighted Impact</span>
                  <span className="text-[11px] text-emerald-600 flex items-center gap-0.5 font-semibold">
                    <TrendingDown className="w-3 h-3" />
                    Declining
                  </span>
                </div>
                <p className="text-slate-600 leading-snug">{driver.factor}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* State-Level Risk Heatmap & Drill-Down Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              State & Territorial Risk Distribution
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Heatmap classification based on proportion of works exhibiting severe milestone or financial divergence.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Low
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Moderate
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> High
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span> Critical
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-6">State / Union Territory</th>
                <th className="py-3 px-4 text-center">Risk Heatmap</th>
                <th className="py-3 px-4 text-right">Monitored Works</th>
                <th className="py-3 px-4 text-right">Flagged Anomalies</th>
                <th className="py-3 px-4 text-right">Sanctioned (₹ Lakhs)</th>
                <th className="py-3 px-4 text-right">Financial Exposure</th>
                <th className="py-3 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {stateRiskTable.map((item) => (
                <tr
                  key={item.stateName}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    selectedState === item.stateName ? 'bg-indigo-50/40 font-semibold' : ''
                  }`}
                >
                  <td className="py-3.5 px-6 font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>{item.stateName}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        item.riskBand === 'Red'
                          ? 'bg-rose-100 text-rose-800'
                          : item.riskBand === 'Orange'
                          ? 'bg-orange-100 text-orange-800'
                          : item.riskBand === 'Yellow'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.riskBand} ({item.riskPct}%)
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium">{item.totalWorks}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className={item.flaggedWorks > 0 ? 'text-rose-700 font-bold' : 'text-slate-500'}>
                      {item.flaggedWorks}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono">₹{item.sanctionLakhs} L</td>
                  <td className="py-3.5 px-4 text-right font-mono text-rose-700 font-bold">
                    ₹{item.exposureLakhs} L
                  </td>
                  <td className="py-3.5 px-6 text-center">
                    <button
                      onClick={() => {
                        setSelectedState(item.stateName);
                        setSelectedDistrict('All Districts');
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold text-[11px] transition-colors cursor-pointer"
                    >
                      Filter Region
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ML Engine Status */}
      {mlHealth && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">ML Inference Engine</h3>
              <p className="text-xs text-slate-500">{mlHealth.engine || 'FastAPI + scikit-learn'}</p>
            </div>
            <div className="ml-auto">
              <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                mlHealth.modelsLoaded ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${mlHealth.modelsLoaded ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                {mlHealth.modelsLoaded ? 'Models Loaded' : 'Fallback Active'}
              </span>
            </div>
          </div>
          {mlModelInfo?.metadata && (
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(mlModelInfo.metadata).slice(0, 3).map(([key, val]) => (
                <div key={key} className="bg-slate-50 rounded-xl p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-400">{key}</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">{String(val).slice(0, 30)}</div>
                </div>
              ))}
            </div>
          )}
          {mlModelInfo?.evaluation && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {Object.entries(mlModelInfo.evaluation).slice(0, 4).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{key}:</span>
                  <span className="font-bold text-slate-800">{typeof val === 'number' ? val.toFixed(3) : String(val)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
