import React from 'react';
import { ShieldAlert, Activity, CheckCircle2, AlertTriangle, IndianRupee, RefreshCw, Landmark } from 'lucide-react';
import { MPLADProject } from '../types';

interface HeaderProps {
  projects: MPLADProject[];
  isAuditing: boolean;
  onRunAudit: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  projects,
  isAuditing,
  onRunAudit,
  activeTab,
  setActiveTab,
}) => {
  const criticalCount = projects.filter((p) => p.riskLevel === 'Critical').length;
  const highCount = projects.filter((p) => p.riskLevel === 'High').length;
  const totalExposureLakhs = projects
    .filter((p) => p.riskLevel === 'Critical' || p.riskLevel === 'High')
    .reduce((acc, p) => acc + p.sanctionedAmountLakhs, 0);

  const tabs = [
    { id: 'dashboard', label: 'Command Center', icon: Activity },
    { id: 'scanner', label: 'Anomaly & Fraud Scanner', icon: ShieldAlert, badge: criticalCount + highCount },
    { id: 'cartels', label: 'Contractor Cartels & Slicing', icon: AlertTriangle },
    { id: 'geospatial', label: 'Geospatial & Ghost Inspector', icon: Landmark },
    { id: 'investigator', label: 'AI Forensic Investigator', icon: RefreshCw, ai: true },
    { id: 'sandbox', label: 'Pre-Sanction Sandbox', icon: CheckCircle2 },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-xl">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/30 border border-amber-400/30">
            <ShieldAlert className="h-6 w-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                MPLADS <span className="text-amber-400">VigilAI</span>
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                MoSPI Compliance v2023
              </span>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                AI Sentinel Live
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Forensic Audit Engine for Anomaly, Fraud & Inefficiency Detection in Member of Parliament Local Area Development Scheme
            </p>
          </div>
        </div>

        {/* Action and Summary Pill */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 text-xs">
            <IndianRupee className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-slate-400">Flagged Exposure:</span>
            <span className="font-semibold text-amber-300">₹{(totalExposureLakhs / 100).toFixed(2)} Cr</span>
          </div>

          <button
            onClick={onRunAudit}
            disabled={isAuditing}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow transition-all ${
              isAuditing
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold active:scale-95'
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isAuditing ? 'animate-spin text-amber-400' : ''}`} />
            {isAuditing ? 'Scanning Registry...' : 'Run Forensic Scan'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 flex overflow-x-auto no-scrollbar gap-1 pt-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-amber-400 text-amber-300 bg-slate-800/60 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/40">
                  {tab.badge}
                </span>
              )}
              {tab.ai && (
                <span className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase rounded bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                  Gemini
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
