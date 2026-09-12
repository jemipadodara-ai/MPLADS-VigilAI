import React, { useState, useMemo, useEffect } from 'react';
import { MPLADProject, CostBenchmarkAnalysis } from '../../types';
import { analyzeCostIntelligence } from '../../utils/decisionEngine';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Layers,
  Scale,
  ArrowUpRight,
  Building,
} from 'lucide-react';

interface CostIntelligenceViewProps {
  projects: MPLADProject[];
  onInspectProject: (project: MPLADProject) => void;
}

export const CostIntelligenceView: React.FC<CostIntelligenceViewProps> = ({
  projects,
  onInspectProject,
}) => {
  const analyses = useMemo(() => analyzeCostIntelligence(projects), [projects]);
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [varianceOnly, setVarianceOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mlCostPredictions, setMlCostPredictions] = React.useState<Record<string, any>>({});

  useEffect(() => {
    if (projects.length === 0) return;
    fetch('/api/ml/predict/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projects: projects.slice(0, 20) }),
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.results) {
          const predMap: Record<string, any> = {};
          data.results.forEach((r: any) => { predMap[r.projectId] = r; });
          setMlCostPredictions(predMap);
        }
      })
      .catch(err => console.warn('ML cost batch prediction notice:', err));
  }, [projects]);

  const sectors = useMemo(() => {
    const list = Array.from(new Set(analyses.map((a) => a.category).filter(Boolean)));
    return ['ALL', ...list];
  }, [analyses]);

  const filtered = useMemo(() => {
    return analyses.filter((a) => {
      if (sectorFilter !== 'ALL' && a.category !== sectorFilter) return false;
      if (varianceOnly && !a.isOverpriced) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!a.projectTitle.toLowerCase().includes(q) && !a.projectId.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [analyses, sectorFilter, varianceOnly, searchQuery]);

  const overpricedCount = analyses.filter((a) => a.isOverpriced).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              Procurement & Estimation Benchmarking
            </span>
            <span className="text-xs text-slate-500 font-medium">Schedule of Rates (SoR) Alignment</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            COST INTELLIGENCE & BENCHMARKING
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-3xl">
            Detects inflated estimates, gold-plating, and unusual bill of quantities (BoQ) variances by comparing project sanctions against historical regional benchmarks for identical public works.
          </p>
        </div>

        <div className="text-right shrink-0">
          <div className="text-[11px] font-bold uppercase text-slate-400">Anomalous Estimates</div>
          <div className="text-xl font-black text-rose-800">{overpricedCount} Works Flagged</div>
        </div>
      </div>

      {/* Filter and toggle controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-bold uppercase text-[11px]">Sector:</span>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white text-slate-800"
            >
              {sectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <input
              type="checkbox"
              checked={varianceOnly}
              onChange={(e) => setVarianceOnly(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Show Only Cost-Variance Anomalies (&gt;25% above SoR)</span>
          </label>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search work title or ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Benchmark Cards List */}
      <div className="space-y-4">
        {filtered.map((item) => {
          const projectObj = projects.find((p) => p.id === item.projectId || p.workCode === item.projectId);

          return (
            <div
              key={item.projectId}
              className={`bg-white rounded-2xl border p-5 shadow-xs transition-all hover:border-slate-300 space-y-4 ${
                item.isOverpriced ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {item.projectId}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                      {item.category}
                    </span>
                    {item.isOverpriced ? (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                        ⚠️ +{item.costVariancePct}% Above Benchmark
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        ✓ Within SoR Range
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-slate-900 mt-1 leading-snug">
                    {item.projectTitle}
                  </h3>

                  <div className="text-xs text-slate-500 mt-0.5">
                    📍 {item.district}, {item.state}
                  </div>
                </div>

                {/* Financial snapshot */}
                <div className="flex items-center gap-4 shrink-0 bg-white p-3 rounded-xl border border-slate-200">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Sanctioned Cost</div>
                    <div className="text-lg font-black text-slate-900 font-mono">
                      ₹{item.observedCostLakhs.toFixed(1)} L
                    </div>
                  </div>
                  <div className="h-7 w-px bg-slate-200"></div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Benchmark Range</div>
                    <div className="text-sm font-bold text-slate-700 font-mono">
                      ₹{item.benchmarkRangeLakhs[0]} – ₹{item.benchmarkRangeLakhs[1]} L
                    </div>
                  </div>
                </div>
              </div>

              {/* ML Cost Benchmark */}
              {mlCostPredictions[item.projectId]?.cost && (
                <div className="mt-1.5 flex items-center gap-2 text-[10px]">
                  <span className="font-bold text-indigo-700">ML Benchmark:</span>
                  <span className="text-slate-700">₹{mlCostPredictions[item.projectId].cost.expectedCostLakhs?.toFixed(1)} L</span>
                  <span className={`font-bold px-1.5 py-0.5 rounded ${
                    mlCostPredictions[item.projectId].cost.risk === 'HIGH' ? 'bg-red-100 text-red-700'
                    : mlCostPredictions[item.projectId].cost.risk === 'MEDIUM' ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    Deviation: {mlCostPredictions[item.projectId].cost.deviationPercent?.toFixed(1)}%
                  </span>
                </div>
              )}

              {/* Explanatory Assessment */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-indigo-600" />
                  Engineering Benchmark Findings:
                </div>
                <p className="leading-relaxed">{item.explanation}</p>
                <p className="text-indigo-900 font-semibold pt-1">
                  Directive: {item.recommendedAction}
                </p>
              </div>

              {/* Comparable Projects in same category */}
              {item.comparableProjects.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase text-slate-400">
                    Regional Comparable Works:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {item.comparableProjects.map((comp) => (
                      <div
                        key={comp.id}
                        className="p-2 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between"
                      >
                        <span className="truncate font-medium text-slate-700 max-w-[150px]">
                          {comp.title}
                        </span>
                        <span className="font-bold font-mono text-slate-900 ml-2">
                          ₹{comp.costLakhs.toFixed(1)} L
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {projectObj && (
                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => onInspectProject(projectObj)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    View Project Details →
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
