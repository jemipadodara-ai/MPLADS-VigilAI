import React, { useState } from 'react';
import {
  Users,
  AlertTriangle,
  Building,
  FileSpreadsheet,
  Link,
  ShieldAlert,
  Search,
  ExternalLink,
  Briefcase,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ContractorProfile, MPLADProject } from '../types';

interface ContractorCartelVisualizerProps {
  contractors: ContractorProfile[];
  projects: MPLADProject[];
  onSelectProject: (project: MPLADProject) => void;
}

export const ContractorCartelVisualizer: React.FC<ContractorCartelVisualizerProps> = ({
  contractors,
  projects,
  onSelectProject,
}) => {
  const [selectedContractorId, setSelectedContractorId] = useState<string>(contractors[0]?.id || '');
  const [filterSlicingOnly, setFilterSlicingOnly] = useState<boolean>(false);

  const activeContractors = filterSlicingOnly
    ? contractors.filter((c) => c.isFlaggedForSlicing || c.cartelRiskScore > 70)
    : contractors;

  const currentContractor =
    contractors.find((c) => c.id === selectedContractorId) || contractors[0];

  const contractorWorks = projects.filter(
    (p) =>
      (currentContractor?.name && p.contractorName?.toLowerCase() === currentContractor.name.toLowerCase()) ||
      (currentContractor?.gstin && p.contractorGstin === currentContractor.gstin)
  );

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              <span>Contractor Cartel, Bid-Rigging & Tender Slicing Engine</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated procurement forensics auditing vendor dominance, sub-threshold contract slicing (&lt;₹10L), single-bid awards, and shell-entity linkages
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => setFilterSlicingOnly(!filterSlicingOnly)}
              className={`px-3 py-1.5 rounded-xl border font-semibold transition-all ${
                filterSlicingOnly
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {filterSlicingOnly ? 'Showing High-Risk Cartels Only' : 'Filter High-Risk Cartels'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Contractor List & Detailed Cartel Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Contractor Cards List */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Registered Vendor Entities ({activeContractors.length})
          </div>

          {activeContractors.map((c) => {
            const isSelected = c.id === currentContractor?.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedContractorId(c.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-white border-indigo-600 shadow-xs ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{c.name}</h4>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">GSTIN: {c.gstin}</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                      c.cartelRiskScore >= 80
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : c.cartelRiskScore >= 50
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    Risk {c.cartelRiskScore}/100
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Works</span>
                    <span className="font-semibold text-slate-800">{c.totalWorksAwarded}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Value</span>
                    <span className="font-semibold text-slate-800">₹{c.totalValueLakhs}L</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Single-Bid %</span>
                    <span
                      className={`font-semibold ${
                        c.singleBidRatio > 50 ? 'text-red-600' : 'text-slate-800'
                      }`}
                    >
                      {c.singleBidRatio}%
                    </span>
                  </div>
                </div>

                {c.isFlaggedForSlicing && (
                  <div className="mt-2.5 flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                    <AlertTriangle className="h-3 w-3 text-amber-600" /> Flagged for Tender Slicing (&lt;₹10L)
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right 2 Cols: Deep Cartel Dossier & Linked Works */}
        <div className="lg:col-span-2 space-y-6">
          {currentContractor ? (
            <>
              {/* Detailed Vendor Header */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      Forensic Entity Dossier
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1.5">{currentContractor.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Promoter / Signatory: <strong className="text-slate-700">{currentContractor.ownerOrDirector}</strong> • GSTIN: {currentContractor.gstin}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-xs text-slate-400">Cartel & Slicing Risk Score</div>
                    <div
                      className={`text-2xl font-black ${
                        currentContractor.cartelRiskScore >= 80
                          ? 'text-red-600'
                          : currentContractor.cartelRiskScore >= 50
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {currentContractor.cartelRiskScore} / 100
                    </div>
                  </div>
                </div>

                {/* Key Metrics Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-400 block text-[10px]">Total Awarded</span>
                    <span className="text-base font-bold text-slate-900">₹{(currentContractor.totalValueLakhs / 100).toFixed(2)} Cr</span>
                    <span className="text-[10px] text-slate-500 block">in {currentContractor.totalWorksAwarded} contracts</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-400 block text-[10px]">Single-Bid Awards</span>
                    <span className={`text-base font-bold ${currentContractor.singleBidRatio > 50 ? 'text-red-600' : 'text-slate-800'}`}>
                      {currentContractor.singleBidRatio}%
                    </span>
                    <span className="text-[10px] text-slate-500 block">No competitive bids</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-400 block text-[10px]">Sub-Threshold Slicing</span>
                    <span className="text-base font-bold text-amber-700">{currentContractor.subThresholdCount} Works</span>
                    <span className="text-[10px] text-slate-500 block">Priced ₹9.5L - ₹9.99L</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-400 block text-[10px]">Constituencies</span>
                    <span className="text-base font-bold text-slate-900">{currentContractor.constituenciesCovered.length}</span>
                    <span className="text-[10px] text-slate-500 block truncate">{currentContractor.constituenciesCovered.join(', ')}</span>
                  </div>
                </div>

                {/* Shell Entity & Cartelization Red Flags */}
                {currentContractor.shellCompanySignals.length > 0 && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs space-y-2">
                    <div className="font-bold text-red-800 flex items-center gap-1.5 text-xs">
                      <ShieldAlert className="h-4 w-4 text-red-600" />
                      Forensic Red Flags Logged:
                    </div>
                    <ul className="space-y-1 text-slate-700">
                      {currentContractor.shellCompanySignals.map((sig, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-red-500 font-bold">•</span>
                          <span>{sig}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Implementing Agencies Funnel */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-600 mb-2">Awarding Implementing Agencies:</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentContractor.linkedAgencies.map((agency) => (
                      <span
                        key={agency}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium"
                      >
                        {agency}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Awarded Projects Table for this Contractor */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
                    <span>MPLADS Works Awarded to {currentContractor.name} ({contractorWorks.length})</span>
                  </h4>
                </div>

                {contractorWorks.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                    No individual projects for this contractor in current active view.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {contractorWorks.map((work) => (
                      <div
                        key={work.id}
                        onClick={() => onSelectProject(work)}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-white cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {work.workCode}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                                work.riskLevel === 'Critical'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : work.riskLevel === 'High'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              Risk {work.overallRiskScore}
                            </span>
                            <span className="text-slate-500">{work.tenderType}</span>
                          </div>
                          <div className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors">
                            {work.title}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 sm:text-right shrink-0">
                          <div>
                            <div className="font-bold text-slate-800">₹{work.sanctionedAmountLakhs} Lakhs</div>
                            <div className="text-[10px] text-slate-400">{work.status}</div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl">
              Select a contractor profile to view forensic cartel data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
