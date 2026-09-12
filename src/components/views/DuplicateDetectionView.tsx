import React, { useState, useMemo } from 'react';
import { MPLADProject, DuplicateWorkPair } from '../../types';
import { detectPotentialDuplicates } from '../../utils/decisionEngine';
import {
  Copy,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  FileCheck2,
  Search,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface DuplicateDetectionViewProps {
  projects: MPLADProject[];
  onInspectProject: (project: MPLADProject) => void;
}

export const DuplicateDetectionView: React.FC<DuplicateDetectionViewProps> = ({
  projects,
  onInspectProject,
}) => {
  const initialPairs = useMemo(() => detectPotentialDuplicates(projects), [projects]);
  const [duplicatePairs, setDuplicatePairs] = useState<DuplicateWorkPair[]>(initialPairs);
  const [searchQuery, setSearchQuery] = useState('');
  const [minSimilarity, setMinSimilarity] = useState<number>(60);

  // Sync if projects changes
  React.useEffect(() => {
    setDuplicatePairs(detectPotentialDuplicates(projects));
  }, [projects]);

  const filteredPairs = useMemo(() => {
    return duplicatePairs.filter((pair) => {
      if (pair.similarityPercentage < minSimilarity) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const aMatch = pair.projectA.title.toLowerCase().includes(q) || (pair.projectA.id || '').toLowerCase().includes(q);
        const bMatch = pair.projectB.title.toLowerCase().includes(q) || (pair.projectB.id || '').toLowerCase().includes(q);
        if (!aMatch && !bMatch) return false;
      }
      return true;
    });
  }, [duplicatePairs, minSimilarity, searchQuery]);

  const handleUpdateStatus = (pairId: string, newStatus: DuplicateWorkPair['status']) => {
    setDuplicatePairs((prev) =>
      prev.map((p) => (p.id === pairId ? { ...p, status: newStatus } : p))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold uppercase tracking-wider">
              Asset Integrity Shield
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Geospatial & Lexical Duplication Engine
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            DUPLICATE WORK DETECTION
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-3xl">
            Identifies overlapping, co-located, or duplicate asset sanctions across MPLADS, State schemes, and local authority registers to prevent dual billing.
          </p>
        </div>

        <div className="text-right shrink-0">
          <div className="text-[11px] font-bold uppercase text-slate-400">Flagged Pairs</div>
          <div className="text-xl font-black text-purple-900">
            {filteredPairs.length} Overlap Suspects
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-600 uppercase">Min Similarity Threshold:</span>
          <div className="flex items-center gap-1">
            {[50, 60, 75, 90].map((val) => (
              <button
                key={val}
                onClick={() => setMinSimilarity(val)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  minSimilarity === val
                    ? 'bg-purple-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ≥ {val}%
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search work title or ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Pairs List */}
      <div className="space-y-5">
        {filteredPairs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="font-bold text-base text-slate-900">No duplicate work conflicts identified</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              All active works have distinct spatial coordinates and verified non-overlapping scopes.
            </p>
          </div>
        ) : (
          filteredPairs.map((pair) => (
            <div
              key={pair.id}
              className="bg-white rounded-2xl border border-purple-200 shadow-xs overflow-hidden transition-all hover:border-purple-300"
            >
              {/* Pair Header */}
              <div className="px-6 py-4 bg-purple-50/40 border-b border-purple-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white font-black text-sm flex items-center justify-center">
                    {pair.similarityPercentage}%
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-purple-900">
                      Similarity Index • {pair.distanceKm} km Proximity
                    </span>
                    <h4 className="text-xs font-semibold text-purple-700">
                      Potential Overlap Flagged between Works
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Status:</span>
                  <select
                    value={pair.status}
                    onChange={(e) => handleUpdateStatus(pair.id, e.target.value as any)}
                    className="text-xs font-bold px-2.5 py-1 rounded-lg border border-purple-300 bg-white text-purple-900"
                  >
                    <option value="Flagged">Flagged</option>
                    <option value="Under Investigation">Under Investigation</option>
                    <option value="Verified Distinct">Verified Distinct</option>
                    <option value="Confirmed Duplicate">Confirmed Duplicate</option>
                  </select>
                </div>
              </div>

              {/* Side-by-side Project Cards */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Project A */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {pair.projectA.workCode || pair.projectA.id}
                    </span>
                    <span className="text-xs font-bold text-indigo-700">Work Candidate A</span>
                  </div>

                  <h5 className="font-bold text-sm text-slate-900 leading-snug">
                    {pair.projectA.title}
                  </h5>

                  <div className="text-xs text-slate-600 space-y-1">
                    <div>📍 Location: <strong className="text-slate-800">{pair.projectA.location || pair.projectA.district}</strong></div>
                    <div>Sector: <strong className="text-slate-800">{pair.projectA.category}</strong></div>
                    <div>Sanctioned: <strong className="text-slate-800">₹{pair.projectA.sanctionedAmountLakhs} Lakhs</strong></div>
                    <div>Contractor: <strong className="text-slate-800">{pair.projectA.contractorName || 'N/A'}</strong></div>
                  </div>

                  <button
                    onClick={() => onInspectProject(pair.projectA)}
                    className="w-full py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Inspect Record A</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Project B */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {pair.projectB.workCode || pair.projectB.id}
                    </span>
                    <span className="text-xs font-bold text-purple-700">Work Candidate B</span>
                  </div>

                  <h5 className="font-bold text-sm text-slate-900 leading-snug">
                    {pair.projectB.title}
                  </h5>

                  <div className="text-xs text-slate-600 space-y-1">
                    <div>📍 Location: <strong className="text-slate-800">{pair.projectB.location || pair.projectB.district}</strong></div>
                    <div>Sector: <strong className="text-slate-800">{pair.projectB.category}</strong></div>
                    <div>Sanctioned: <strong className="text-slate-800">₹{pair.projectB.sanctionedAmountLakhs} Lakhs</strong></div>
                    <div>Contractor: <strong className="text-slate-800">{pair.projectB.contractorName || 'N/A'}</strong></div>
                  </div>

                  <button
                    onClick={() => onInspectProject(pair.projectB)}
                    className="w-full py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Inspect Record B</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Matched Signals and Recommended Administrative Action */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-slate-700 uppercase text-[11px]">
                    Matched Detection Factors:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {pair.reasons.map((r, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-md bg-white border border-purple-200 text-purple-900 font-medium text-[11px]"
                      >
                        ✓ {r}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Directive</span>
                  <span className="font-bold text-indigo-700">{pair.recommendedAction}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
