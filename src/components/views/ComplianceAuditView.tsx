import React, { useState, useMemo } from 'react';
import { MPLADProject, ProjectComplianceAudit, ComplianceCheckStatus } from '../../types';
import { auditProjectCompliance } from '../../utils/decisionEngine';
import {
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Download,
} from 'lucide-react';
import { canMakeDecisions } from '../../types';

interface ComplianceAuditViewProps {
  projects: MPLADProject[];
  onInspectProject: (project: MPLADProject) => void;
  currentUser?: any;
}

export const ComplianceAuditView: React.FC<ComplianceAuditViewProps> = ({
  projects,
  onInspectProject,
  currentUser,
}) => {
  const audits = useMemo(() => projects.map((p) => auditProjectCompliance(p)), [projects]);
  const [filterScore, setFilterScore] = useState<'ALL' | 'HIGH' | 'WARNING' | 'CRITICAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return audits.filter((a) => {
      if (filterScore === 'HIGH' && a.overallComplianceScore < 80) return false;
      if (filterScore === 'WARNING' && (a.overallComplianceScore >= 80 || a.overallComplianceScore < 60)) return false;
      if (filterScore === 'CRITICAL' && a.overallComplianceScore >= 60) return false;
      if (searchQuery.trim()) {
        const p = projects.find((proj) => proj.id === a.projectId);
        const title = (p?.title || '').toLowerCase();
        const code = (p?.workCode || a.projectId).toLowerCase();
        const q = searchQuery.toLowerCase();
        if (!title.includes(q) && !code.includes(q)) return false;
      }
      return true;
    });
  }, [audits, filterScore, searchQuery, projects]);

  const renderStatusPill = (status: ComplianceCheckStatus) => {
    switch (status) {
      case 'Compliant':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Compliant
          </span>
        );
      case 'Warning':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Warning
          </span>
        );
      case 'Non-compliant':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
            <XCircle className="w-3 h-3 text-rose-600" />
            Non-compliant
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
            Missing Data
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
              Statutory MPLADS Guidelines Audit
            </span>
            <span className="text-xs text-slate-500 font-medium">10-Gate Regulatory Verification</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            COMPLIANCE & STATUTORY RECONCILIATION
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-3xl">
            Automated verification of administrative sanctions, technical estimates, open tendering, Utilization Certificates (UCs), and mandatory public citizen boards.
          </p>
        </div>

        <div className="shrink-0">
          <button
            onClick={() => {
              if (!canMakeDecisions(currentUser?.role)) {
                alert('Statutory compliance report generation requires Officer or Ministerial authorization.');
                return;
              }
              const reportBlob = new Blob([
                JSON.stringify({
                  generatedAt: new Date().toISOString(),
                  generatedBy: currentUser?.name || currentUser?.email || 'Authorized Officer',
                  totalWorksAudited: audits.length,
                  compliantCount: audits.filter(a => a.overallComplianceScore >= 80).length,
                  warningCount: audits.filter(a => a.overallComplianceScore >= 60 && a.overallComplianceScore < 80).length,
                  criticalCount: audits.filter(a => a.overallComplianceScore < 60).length,
                  audits,
                }, null, 2)
              ], { type: 'application/json' });
              const url = URL.createObjectURL(reportBlob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `MPLADS_Compliance_Audit_${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export Compliance Dossier
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-bold uppercase text-[11px]">Compliance Tier:</span>
          {(['ALL', 'HIGH', 'WARNING', 'CRITICAL'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterScore(t)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                filterScore === t
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t === 'HIGH' ? 'Score ≥ 80' : t === 'WARNING' ? 'Score 60 – 79' : t === 'CRITICAL' ? 'Score < 60' : 'All Works'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search work or ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* 10-Gate Matrix Cards */}
      <div className="space-y-4">
        {filtered.map((audit) => {
          const project = projects.find((p) => p.id === audit.projectId);
          if (!project) return null;

          return (
            <div
              key={audit.projectId}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
            >
              {/* Card Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {project.workCode || project.id}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      📍 {project.district}, {project.state}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mt-1 leading-snug">
                    {project.title}
                  </h3>
                </div>

                <div className="flex items-center gap-3 shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Compliance Score</div>
                    <div
                      className={`text-lg font-black ${
                        audit.overallComplianceScore >= 80
                          ? 'text-emerald-700'
                          : audit.overallComplianceScore >= 60
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {audit.overallComplianceScore} / 100
                    </div>
                  </div>
                </div>
              </div>

              {/* 10 Statutory Gates Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">1. Eligibility</span>
                  <div className="mt-1">{renderStatusPill(audit.eligibility)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">2. Admin Sanction</span>
                  <div className="mt-1">{renderStatusPill(audit.administrativeApproval)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">3. Technical Sanction</span>
                  <div className="mt-1">{renderStatusPill(audit.technicalApproval)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">4. Open Tendering</span>
                  <div className="mt-1">{renderStatusPill(audit.tenderCompliance)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">5. Spending Bounds</span>
                  <div className="mt-1">{renderStatusPill(audit.financialUtilization)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">6. Milestone Parity</span>
                  <div className="mt-1">{renderStatusPill(audit.physicalProgress)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">7. Geo Verification</span>
                  <div className="mt-1">{renderStatusPill(audit.geoVerification)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">8. Completion Cert</span>
                  <div className="mt-1">{renderStatusPill(audit.completionDocumentation)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">9. Utilization Cert</span>
                  <div className="mt-1">{renderStatusPill(audit.utilizationCertificate)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">10. Audit Records</span>
                  <div className="mt-1">{renderStatusPill(audit.auditDocumentation)}</div>
                </div>
              </div>

              {/* Flagged Items Alert */}
              {audit.flaggedItems.length > 0 && (
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
                  <span className="font-bold uppercase text-[10px] text-amber-800 block">
                    Statutory Action Items Requiring Resolution:
                  </span>
                  <ul className="space-y-1">
                    {audit.flaggedItems.map((flag, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-1 flex justify-end">
                <button
                  onClick={() => onInspectProject(project)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Inspect Full File & Documents →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
