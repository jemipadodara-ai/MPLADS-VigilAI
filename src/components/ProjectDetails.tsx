import React, { useState, useEffect, useMemo } from 'react';
import { MPLADProject, InvestigationStatus, CitizenVerification } from '../types';
import { RiskScore } from './RiskScore';
import { RiskBadge } from './RiskBadge';
import { computeProjectRisk } from '../utils/riskEngine';
import { exportSingleProjectToWord } from '../utils/docxExport';
import {
  X,
  MapPin,
  FileText,
  AlertTriangle,
  Clock,
  IndianRupee,
  Activity,
  FileDown,
  UserCheck,
  AlertCircle,
  Building,
  Calendar,
  Layers,
} from 'lucide-react';

interface ProjectDetailsProps {
  project: MPLADProject;
  onClose: () => void;
  onUpdateInvestigation?: (
    projectId: string,
    status: InvestigationStatus,
    notes?: string
  ) => Promise<void>;
  onOpenCitizenVerify?: (p: MPLADProject) => void;
  isAdmin?: boolean;
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  project,
  onClose,
  onUpdateInvestigation,
  onOpenCitizenVerify,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [verifications, setVerifications] = useState<CitizenVerification[]>([]);

  useEffect(() => {
    const loadVerifications = async () => {
      try {
        const res = await fetch(`/api/citizen-verifications?projectId=${project.id}`);
        const data = await res.json();
        if (data.data) {
          setVerifications(data.data);
        }
      } catch (e) {
        console.warn('Failed to load project verifications:', e);
      }
    };
    loadVerifications();
  }, [project.id]);

  // Compute unified, transparent risk details
  const riskAnalysis = useMemo(() => computeProjectRisk(project), [project]);

  const handleExportWord = async () => {
    try {
      setIsExporting(true);
      await exportSingleProjectToWord(project);
    } catch (err) {
      console.error('Failed to export Word document:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const spentAmount = project.expenditureAmountLakhs || 0;
  const sanctionedAmount = project.sanctionedAmountLakhs || 0;
  const progressPct = project.completionPercentage || 0;
  const costDiff = spentAmount - sanctionedAmount;
  const spentPct = sanctionedAmount > 0 ? Math.round((spentAmount / sanctionedAmount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Clickable backdrop overlay */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* CENTERED Large Modal Dialog */}
      <div
        id="project-detail-modal"
        className="relative z-10 bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 my-auto font-sans"
      >
        {/* Header Bar */}
        <div className="px-5 sm:px-8 py-5 border-b border-slate-200 bg-slate-50/90 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-700">
              <FileText className="w-3.5 h-3.5" />
              <span>Project Risk Details</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-mono">{project.workCode || project.id}</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug tracking-tight">
              {project.title}
            </h1>
            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap pt-0.5">
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {project.district || project.constituency}, {project.state}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-semibold">
                Status: {project.status}
              </span>
            </div>
          </div>

          {/* Action Area: Word Export & Close */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="export-word-btn"
              onClick={handleExportWord}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all disabled:opacity-50"
              title="Download detailed project risk report as real Microsoft Word document (.docx)"
            >
              <FileDown className="w-4 h-4" />
              <span>{isExporting ? 'Generating...' : 'Export Word Report'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* ========================================================================= */}
          {/* 1. TOP RISK BANNER: RISK LEVEL & SCORE                                   */}
          {/* ========================================================================= */}
          <div
            className={`p-5 sm:p-6 rounded-2xl border transition-all ${
              riskAnalysis.riskLevel === 'High'
                ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-400/20'
                : riskAnalysis.riskLevel === 'Medium'
                ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-400/20'
                : 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-400/20'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <AlertTriangle
                    className={`w-4 h-4 ${
                      riskAnalysis.riskLevel === 'High'
                        ? 'text-rose-600'
                        : riskAnalysis.riskLevel === 'Medium'
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  />
                  <span>Assigned Project Risk Assessment</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                  {riskAnalysis.riskTierLabel.toUpperCase()} — {riskAnalysis.riskScore}/100
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-3">
                <RiskBadge level={riskAnalysis.riskLevel} size="lg" />
                <div className="px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs text-center min-w-[95px]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Risk Score</span>
                  <span className="text-xl font-black font-mono text-slate-900">
                    {riskAnalysis.riskScore}
                    <span className="text-xs font-semibold text-slate-400">/100</span>
                  </span>
                </div>
              </div>
            </div>

            {/* ======================================================================= */}
            {/* 2. WHY THIS PROJECT IS FLAGGED (REASONS)                                */}
            {/* ======================================================================= */}
            <div className="mt-5 space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-slate-600" />
                <span>Why is this project flagged?</span>
              </h2>
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2.5">
                {riskAnalysis.reasons.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        riskAnalysis.riskLevel === 'High'
                          ? 'bg-rose-500'
                          : riskAnalysis.riskLevel === 'Medium'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <span className="text-xs text-slate-900 font-semibold leading-relaxed">
                      {reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ======================================================================= */}
            {/* 3. RISK EVIDENCE & QUANTITATIVE DATA                                    */}
            {/* ======================================================================= */}
            <div className="mt-5 space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-600" />
                <span>Risk Evidence</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Approved Amount</span>
                  <div className="text-base font-bold font-mono text-slate-900">
                    ₹{sanctionedAmount.toFixed(2)} Lakh
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Actual Expenditure</span>
                  <div className="text-base font-bold font-mono text-slate-900">
                    ₹{spentAmount.toFixed(2)} Lakh
                  </div>
                  {costDiff > 0 ? (
                    <span className="inline-block text-[10px] font-bold text-rose-600">
                      +₹{costDiff.toFixed(2)} Lakh (+{riskAnalysis.evidence.costOverrunPct}% Overrun)
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 font-bold">Within budget</span>
                  )}
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Physical Progress</span>
                  <div className="text-base font-bold text-slate-900">
                    {progressPct}% Done
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Funds released: {spentPct}%
                  </span>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Timeline Status</span>
                  <div className="text-base font-bold text-slate-900">
                    {riskAnalysis.evidence.isDelayed
                      ? `${riskAnalysis.evidence.delayDays} Days Overdue`
                      : 'On Schedule'}
                  </div>
                  <span className="text-[10px] text-slate-500 truncate block">
                    Target: {project.expectedCompletionDate || 'Not Specified'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. PROJECT DETAILS (ALL MEANINGFUL FIELDS)                                */}
          {/* ========================================================================= */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-slate-500" />
              <span>Project Details</span>
            </div>

            <div className="bg-slate-50/90 rounded-2xl border border-slate-200 p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Project ID</span>
                  <strong className="text-slate-900 font-mono font-bold text-xs">
                    {project.workCode || project.id}
                  </strong>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">District &amp; State</span>
                  <span className="text-slate-900 font-medium">
                    {project.district || project.constituency}, {project.state}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Category / Sector</span>
                  <span className="text-slate-900 font-medium">
                    {project.category || 'Public Works'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Executing Contractor</span>
                  <span className="text-slate-900 font-medium truncate block">
                    {project.contractorName || 'Open Procurement / Unassigned'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Implementing Agency</span>
                  <span className="text-slate-900 font-medium truncate block">
                    {project.implementingAgency || 'District Authority'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Sponsoring MP Office</span>
                  <span className="text-slate-900 font-medium">
                    {project.mpName || 'Lok Sabha / Rajya Sabha MP'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Sanction Date</span>
                  <span className="text-slate-700">
                    {project.sanctionDate || 'Not Specified'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Target Completion Date</span>
                  <span className="text-slate-700">
                    {project.expectedCompletionDate || 'Not Specified'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Procurement Mode</span>
                  <span className="text-slate-700">
                    {project.tenderType || 'Open Competitive Tender'}
                  </span>
                </div>

                {project.description && (
                  <div className="sm:col-span-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Scope / Description</span>
                    <p className="text-slate-700 leading-relaxed mt-0.5 font-normal">
                      {project.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 5. MONEY FLOW PIPELINE (PROGRESS VS SPENDING)                            */}
          {/* ========================================================================= */}
          <div className="p-4 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-indigo-600" />
                Project Spending vs. Work Completion
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">
                Allocation: ₹{sanctionedAmount.toFixed(2)} Lakh
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px]">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-0.5">
                <div className="text-slate-400 font-bold uppercase">1. Approved</div>
                <div className="text-xs font-bold font-mono text-slate-900">₹{sanctionedAmount.toFixed(1)}L</div>
                <div className="text-slate-500">100% Budget</div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-0.5">
                <div className="text-slate-400 font-bold uppercase">2. Disbursed</div>
                <div className="text-xs font-bold font-mono text-slate-900">₹{spentAmount.toFixed(1)}L</div>
                <div className="text-slate-500">{spentPct}% Released</div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-0.5">
                <div className="text-slate-400 font-bold uppercase">3. Progress</div>
                <div className="text-xs font-bold font-mono text-slate-900">{progressPct}%</div>
                <div className="text-slate-500">Physical Work</div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-0.5">
                <div className="text-slate-400 font-bold uppercase">4. Status</div>
                <div className="text-xs font-bold text-slate-900">{project.status}</div>
                <div className="text-slate-500">{progressPct >= 100 ? 'Completed' : 'Active'}</div>
              </div>
            </div>
          </div>

          {/* Citizen Observations (if any) */}
          {verifications.length > 0 && (
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  Citizen Ground Observations ({verifications.length})
                </span>
              </div>
              <div className="space-y-2">
                {verifications.map((v) => (
                  <div key={v.id} className="p-3 bg-white rounded-xl border border-emerald-200/70 text-xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-800">{v.citizenName}</strong>
                      <span className="text-[10px] font-semibold text-slate-500">{v.status}</span>
                    </div>
                    <p className="text-slate-600 mt-1">"{v.description}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Administrative Disclaimer */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] leading-relaxed">
            <strong>Disclaimer:</strong> Risk indicators are intended to support project monitoring and review. A risk flag does not by itself indicate fraud or wrongdoing.
          </div>
        </div>

        {/* Modal Footer Bar */}
        <div className="px-5 sm:px-8 py-3.5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Project ID: <span className="font-mono text-slate-800">{project.workCode || project.id}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportWord}
              disabled={isExporting}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              {isExporting ? 'Generating...' : 'Export Word Report (.docx)'}
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
