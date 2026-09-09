import React, { useState } from 'react';
import { Database, Shield, Sliders, RefreshCw, CheckCircle2, Lock } from 'lucide-react';

interface SettingsViewProps {
  onRefreshData: () => void;
  isLoading?: boolean;
  userRole?: 'admin' | 'standard';
  isRoleLoading?: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onRefreshData,
  isLoading,
  userRole = 'standard',
  isRoleLoading = false,
}) => {
  const [financialWeight] = useState(25);
  const [progressWeight] = useState(20);
  const [costWeight] = useState(20);
  const [contractorWeight] = useState(15);
  const [duplicateWeight] = useState(15);
  const [dataQualityWeight] = useState(5);

  const isAdmin = userRole === 'admin';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header with Role Indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Settings &amp; Compliance</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Vigilance parameters, data connectors, and regulatory baseline references
          </p>
        </div>

        {/* Current User Role Pill */}
        <div className="flex items-center gap-2">
          {isRoleLoading ? (
            <div className="h-6 w-24 bg-slate-200 animate-pulse rounded-full" />
          ) : (
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                isAdmin
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {isAdmin ? (
                <>
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span>Role: Administrator</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Role: Standard Auditor</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Connectivity & Database Status - Protected by RBAC */}
      {isRoleLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3 animate-pulse">
          <div className="h-5 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-100 rounded w-2/3" />
        </div>
      ) : isAdmin ? (
        /* Admin View: Full Cloud Database Card & Force Re-sync Control */
        <div id="admin-firestore-sync-card" className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Firestore Cloud Database</h3>
                <p className="text-xs text-slate-500">
                  Connected to persistent database <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 text-[11px]">ai-studio-mpladsvigilaiano-b1936725-3072-44fb-b055-a3e8fb748dbb</code>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active &amp; Synced</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div>
              Collections active: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">projects</code>,{' '}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">users</code>,{' '}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">constituencies</code>,{' '}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">alerts</code>,{' '}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">citizen_reports</code>
            </div>

            <button
              id="admin-force-resync-btn"
              onClick={onRefreshData}
              disabled={isLoading}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Force Re-sync</span>
            </button>
          </div>
        </div>
      ) : (
        /* Standard User View: Simple Online Status, No database controls */
        <div id="standard-user-status-card" className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800">System Status: Online</h3>
              <p className="text-[11px] text-slate-500">
                Data synchronization managed by administrator • Standard auditor privileges active
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Connected</span>
          </div>
        </div>
      )}

      {/* Risk Scoring Engine Architecture */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Deterministic Anomaly Engine Weights
            </h3>
            <p className="text-xs text-slate-500">
              Zero hallucination: transparent point allocation for each regulatory audit category (Total = 100)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800">Financial Anomalies</div>
              <div className="text-[11px] text-slate-500">Expenditure &gt; Sanction / High spend low progress</div>
            </div>
            <span className="font-mono font-bold text-blue-700 bg-white px-2 py-1 rounded-lg border border-slate-200">
              +{financialWeight} pts
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800">Progress Delay Anomalies</div>
              <div className="text-[11px] text-slate-500">Target deadline overdue / Stalled work</div>
            </div>
            <span className="font-mono font-bold text-blue-700 bg-white px-2 py-1 rounded-lg border border-slate-200">
              +{progressWeight} pts
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800">Cost Benchmark Anomalies</div>
              <div className="text-[11px] text-slate-500">Exceeds 1.6x category median benchmark</div>
            </div>
            <span className="font-mono font-bold text-blue-700 bg-white px-2 py-1 rounded-lg border border-slate-200">
              +{costWeight} pts
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800">Contractor Concentration</div>
              <div className="text-[11px] text-slate-500">&gt;35% district share or high single-bid ratio</div>
            </div>
            <span className="font-mono font-bold text-blue-700 bg-white px-2 py-1 rounded-lg border border-slate-200">
              +{contractorWeight} pts
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800">Duplicate Work Similarity</div>
              <div className="text-[11px] text-slate-500">Geographic co-location &amp; title/scope overlap</div>
            </div>
            <span className="font-mono font-bold text-blue-700 bg-white px-2 py-1 rounded-lg border border-slate-200">
              +{duplicateWeight} pts
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800">Data Integrity Checks</div>
              <div className="text-[11px] text-slate-500">Missing fields, negative values, date mismatch</div>
            </div>
            <span className="font-mono font-bold text-blue-700 bg-white px-2 py-1 rounded-lg border border-slate-200">
              +{dataQualityWeight} pts
            </span>
          </div>
        </div>
      </div>

      {/* Guidelines & Legal Reference */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-5 space-y-3 text-xs">
        <div className="flex items-center gap-2 text-slate-900 font-bold">
          <Shield className="w-4 h-4 text-blue-700" />
          <span>Statutory Framework Reference</span>
        </div>
        <p className="text-slate-600 leading-relaxed">
          The vigilance algorithms operate in strict alignment with the{' '}
          <strong>Revised Guidelines on Members of Parliament Local Area Development Scheme (MPLADS) 2023</strong>{' '}
          promulgated by the Ministry of Statistics and Programme Implementation (MoSPI), Government of India.
        </p>
        <div className="text-[11px] text-slate-500 pt-1">
          * Algorithmic outputs constitute investigative indicators. Final administrative action requires inspection by designated District Authority.
        </div>
      </div>
    </div>
  );
};
