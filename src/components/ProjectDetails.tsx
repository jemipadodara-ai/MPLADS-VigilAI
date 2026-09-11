import React, { useState, useEffect, useMemo } from 'react';
import { MPLADProject, InvestigationStatus, CitizenVerification } from '../types';
import { RiskScore } from './RiskScore';
import { RiskBadge } from './RiskBadge';
import { AnomalyCard } from './AnomalyCard';
import { computeProjectRisk, exportProjectsToCSV } from '../utils/riskEngine';
import {
  X,
  Sparkles,
  CheckCircle2,
  Calendar,
  Building,
  User,
  MapPin,
  FileCheck,
  ShieldCheck,
  RotateCcw,
  Loader2,
  AlertTriangle,
  HeartPulse,
  Clock,
  IndianRupee,
  Activity,
  Layers,
  FileDown,
  UserCheck,
  Shield,
  HelpCircle,
  FileText,
  AlertCircle,
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
  isAdmin = false,
}) => {
  const [invStatus, setInvStatus] = useState<InvestigationStatus>(
    project.investigationStatus || 'New'
  );
  const [notes, setNotes] = useState(project.investigationNotes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // AI explanation state
  const [isAiExplaining, setIsAiExplaining] = useState(false);
  const [aiMode, setAiMode] = useState<'citizen' | 'technical'>('citizen');
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  // Citizen verifications for this project
  const [verifications, setVerifications] = useState<CitizenVerification[]>([]);
  const [isLoadingVerifications, setIsLoadingVerifications] = useState(false);

  useEffect(() => {
    const loadVerifications = async () => {
      setIsLoadingVerifications(true);
      try {
        const res = await fetch(`/api/citizen-verifications?projectId=${project.id}`);
        const data = await res.json();
        if (data.data) {
          setVerifications(data.data);
        }
      } catch (e) {
        console.warn('Failed to load project verifications:', e);
      } finally {
        setIsLoadingVerifications(false);
      }
    };
    loadVerifications();
  }, [project.id]);

  const handleSaveInvestigation = async () => {
    if (!onUpdateInvestigation) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onUpdateInvestigation(project.id, invStatus, notes);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save investigation:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateAiExplain = async (mode = aiMode) => {
    setIsAiExplaining(true);
    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project,
          riskScore: project.overallRiskScore || 50,
          riskFactors: project.riskFactors || [],
          detectedAnomalies: project.detectedAnomalies || [],
          mode,
        }),
      });
      const data = await res.json();
      if (data.explanation) {
        setAiExplanation(data.explanation);
      }
    } catch (err) {
      console.error('AI explanation error:', err);
      setAiExplanation(
        mode === 'citizen'
          ? `Funds have been disbursed (${project.expenditureAmountLakhs} Lakhs) while physical completion is reported at ${project.completionPercentage}%. A physical check is recommended to confirm work on the ground.`
          : 'Statutory compliance variance flagged under MoSPI MPLADS Guidelines 2023 and GFR Rule 144. Physical voucher and site audit recommended.'
      );
    } finally {
      setIsAiExplaining(false);
    }
  };

  const spentPct =
    project.sanctionedAmountLakhs > 0
      ? Math.round((project.expenditureAmountLakhs / project.sanctionedAmountLakhs) * 100)
      : 0;

  // 5 Health Indicators evaluation
  const financialHealth =
    spentPct > 70 && (project.completionPercentage || 0) < 40
      ? { label: 'Severe Discrepancy', color: 'text-rose-600 bg-rose-50 border-rose-200' }
      : spentPct > 50 && (project.completionPercentage || 0) < 50
      ? { label: 'Spending Lead', color: 'text-amber-600 bg-amber-50 border-amber-200' }
      : { label: 'Synchronized', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };

  const isDelayed =
    project.expectedCompletionDate &&
    new Date(project.expectedCompletionDate).getTime() < Date.now() &&
    (project.completionPercentage || 0) < 100;
  const timelineHealth = isDelayed
    ? { label: 'Overdue Delay', color: 'text-rose-600 bg-rose-50 border-rose-200' }
    : { label: 'On Schedule', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };

  const progressHealth =
    project.completionPercentage >= 100
      ? { label: '100% Certified', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' }
      : project.completionPercentage < 30
      ? { label: 'Low Progress', color: 'text-amber-600 bg-amber-50 border-amber-200' }
      : { label: `${project.completionPercentage}% In Progress`, color: 'text-blue-600 bg-blue-50 border-blue-200' };

  const dataQualityHealth =
    project.hasMandatoryCitizenBoard === false || project.hasUtilizationCertificate === false
      ? { label: 'Missing UCs/Board', color: 'text-amber-600 bg-amber-50 border-amber-200' }
      : { label: 'Verified Complete', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };

  const citizenHealth =
    verifications.length > 0 && verifications.some((v) => v.status !== 'Completed')
      ? { label: 'Ground Discrepancy', color: 'text-rose-600 bg-rose-50 border-rose-200' }
      : verifications.length > 0
      ? { label: 'Citizen Verified', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' }
      : { label: 'Pending Check', color: 'text-slate-600 bg-slate-50 border-slate-200' };

  // Money Pipeline Breakdown Point Detection
  const hasPipelineBreakdown = spentPct > 50 && (project.completionPercentage || 0) < 40;

  // Compute unified risk analysis
  const riskAnalysis = useMemo(() => computeProjectRisk(project), [project]);

  const handleExportProject = () => {
    exportProjectsToCSV(
      [project],
      `project_${(project.workCode || project.id).replace(/[^a-zA-Z0-9_-]/g, '_')}_risk_audit.csv`
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
      {/* Backdrop overlay */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Side Drawer Panel */}
      <div
        id="project-side-drawer"
        className="relative z-10 bg-white border-l border-slate-200 shadow-2xl max-w-2xl sm:max-w-3xl w-full h-full flex flex-col overflow-hidden animate-slide-in-right"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-blue-700">
              <HeartPulse className="w-4 h-4 text-rose-500" />
              <span>Project Digital Health Card</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-800">{project.workCode}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1 max-w-2xl leading-snug">
              {project.title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {project.district || project.constituency}, {project.state}
              </span>
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {project.mpName || 'MP Office'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-semibold">
                Official Status: {project.status}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportProject}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs cursor-pointer transition-colors"
              title="Download single project risk audit report as CSV"
            >
              <FileDown className="w-3.5 h-3.5 text-indigo-600" />
              <span>Export Report</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* 1. TOP SECTION: RISK PROFILE (MOST IMPORTANT INFORMATION) */}
          <div className={`p-5 rounded-2xl border transition-all ${
            riskAnalysis.riskLevel === 'High'
              ? 'bg-rose-50/50 border-rose-300 ring-1 ring-rose-400/20'
              : riskAnalysis.riskLevel === 'Medium'
              ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-400/20'
              : 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-400/20'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
              <div className="space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <AlertTriangle className={`w-4 h-4 ${
                    riskAnalysis.riskLevel === 'High' ? 'text-rose-600' : riskAnalysis.riskLevel === 'Medium' ? 'text-amber-600' : 'text-emerald-600'
                  }`} />
                  <span>Project Risk Assessment</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {riskAnalysis.riskTierLabel.toUpperCase()}
                </div>
              </div>

              {/* Large Risk Badge & Gauge Score */}
              <div className="flex items-center gap-3">
                <RiskBadge level={riskAnalysis.riskLevel} size="lg" />
                <div className="px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs text-center min-w-[90px]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Risk Score</span>
                  <span className="text-xl font-black font-mono text-slate-900">
                    {riskAnalysis.riskScore}<span className="text-xs font-semibold text-slate-400">/100</span>
                  </span>
                </div>
              </div>
            </div>

            {/* A. Why is this project risky? (Risk Reasons) */}
            <div className="mt-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>Why is this project flagged? (Risk Reasons)</span>
              </h3>
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                {riskAnalysis.reasons.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      riskAnalysis.riskLevel === 'High' ? 'bg-rose-500' : riskAnalysis.riskLevel === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    <span className="text-xs text-slate-800 font-medium leading-relaxed">
                      {reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* B. Risk Evidence & Quantitative Telemetry */}
            <div className="mt-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-600" />
                <span>Risk Evidence &amp; Financial Discrepancy Telemetry</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Approved Sanction</span>
                  <div className="text-sm font-bold font-mono text-slate-900">
                    ₹{riskAnalysis.evidence.sanctionedAmountLakhs.toFixed(2)} Lakh
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Actual Spend</span>
                  <div className="text-sm font-bold font-mono text-slate-900">
                    ₹{riskAnalysis.evidence.expenditureAmountLakhs.toFixed(2)} Lakh
                  </div>
                  {riskAnalysis.evidence.costOverrunPct > 0 && (
                    <span className="inline-block text-[10px] font-bold text-rose-600">
                      +{riskAnalysis.evidence.costOverrunPct}% Cost Overrun
                    </span>
                  )}
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Physical Progress</span>
                  <div className="text-sm font-bold text-slate-900">
                    {riskAnalysis.evidence.completionPercentage}% Done
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Disbursed: {riskAnalysis.evidence.fundUtilizationPct}%
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Timeline Lag</span>
                  <div className="text-sm font-bold text-slate-900">
                    {riskAnalysis.evidence.delayDays > 0 ? `${riskAnalysis.evidence.delayDays} Days Overdue` : 'On Schedule'}
                  </div>
                  <span className="text-[10px] text-slate-500 truncate block">
                    Tender: {riskAnalysis.evidence.tenderType}
                  </span>
                </div>
              </div>
            </div>

            {/* C. Recommended Review / Action */}
            <div className="mt-4 p-3.5 bg-white rounded-xl border border-indigo-200/90 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                Recommended Auditor Action / Next Step
              </span>
              <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                {riskAnalysis.recommendedAction}
              </p>
            </div>
          </div>

          {/* 2. PROJECT DETAILS SECTION */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Administrative Project Details</span>
            </div>

            <div className="bg-slate-50/80 rounded-2xl border border-slate-200/90 p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3.5 gap-x-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Work Code / ID</span>
                  <strong className="text-slate-900 font-mono font-bold text-xs">
                    {project.workCode || project.id}
                  </strong>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">District &amp; State</span>
                  <span className="text-slate-800 font-medium">
                    {project.district || project.constituency}, {project.state}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Category / Sector</span>
                  <span className="text-slate-800 font-medium">
                    {project.category || 'Public Infrastructure'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Sanctioned Budget</span>
                  <span className="text-slate-900 font-mono font-bold">
                    ₹{project.sanctionedAmountLakhs.toFixed(2)} Lakh
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Actual Expenditure</span>
                  <span className="text-slate-900 font-mono font-bold">
                    ₹{project.expenditureAmountLakhs.toFixed(2)} Lakh
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Certified Progress</span>
                  <span className="text-slate-800 font-medium">
                    {project.completionPercentage}% Certified Complete
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Sanction Date</span>
                  <span className="text-slate-700">
                    {project.sanctionDate || 'Not Specified'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Target Completion</span>
                  <span className="text-slate-700">
                    {project.expectedCompletionDate || 'Not Specified'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Executing Contractor</span>
                  <span className="text-slate-900 font-medium truncate block">
                    {project.contractorName || 'Open Procurement / Unassigned'}
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Implementing Agency</span>
                  <span className="text-slate-800 font-medium">
                    {project.implementingAgency || 'District Rural Development Agency (DRDA)'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Sponsoring MP Office</span>
                  <span className="text-slate-800 font-medium">
                    {project.mpName || 'Lok Sabha / Rajya Sabha MP'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. 5 VISUAL HEALTH INDICATORS BAR */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              5-Point Digital Health Assessment
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">1. Financial</span>
                <div className={`px-2 py-0.5 rounded-md border font-bold text-[11px] text-center ${financialHealth.color}`}>
                  {financialHealth.label}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">2. Timeline</span>
                <div className={`px-2 py-0.5 rounded-md border font-bold text-[11px] text-center ${timelineHealth.color}`}>
                  {timelineHealth.label}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">3. Progress</span>
                <div className={`px-2 py-0.5 rounded-md border font-bold text-[11px] text-center ${progressHealth.color}`}>
                  {progressHealth.label}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">4. Data Quality</span>
                <div className={`px-2 py-0.5 rounded-md border font-bold text-[11px] text-center ${dataQualityHealth.color}`}>
                  {dataQualityHealth.label}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">5. Citizen Ground</span>
                <div className={`px-2 py-0.5 rounded-md border font-bold text-[11px] text-center ${citizenHealth.color}`}>
                  {citizenHealth.label}
                </div>
              </div>
            </div>
          </div>

          {/* 4. FOLLOW THE MONEY PIPELINE */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-blue-700" />
                Follow the Money: Public Capital Pipeline
              </span>
              {hasPipelineBreakdown && (
                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold animate-pulse">
                  Pipeline Breakdown Point Detected
                </span>
              )}
            </div>

            {/* Step diagram */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-[10px]">
              <div className="p-2 bg-white rounded-xl border border-slate-200 space-y-1">
                <div className="text-slate-400 font-bold">1. Allocation</div>
                <div className="font-bold text-slate-800">MPLADS Fund</div>
                <div className="text-emerald-700 font-mono">₹{project.sanctionedAmountLakhs}L</div>
              </div>

              <div className="p-2 bg-white rounded-xl border border-slate-200 space-y-1">
                <div className="text-slate-400 font-bold">2. Sanction</div>
                <div className="font-bold text-slate-800">District Collector</div>
                <div className="text-blue-700 truncate">{project.district || 'Approved'}</div>
              </div>

              <div className="p-2 bg-white rounded-xl border border-slate-200 space-y-1">
                <div className="text-slate-400 font-bold">3. Agency</div>
                <div className="font-bold text-slate-800 truncate" title={project.implementingAgency}>
                  {project.implementingAgency?.slice(0, 15) || 'Exec Agency'}
                </div>
                <div className="text-slate-500">Supervisory</div>
              </div>

              <div className="p-2 bg-white rounded-xl border border-slate-200 space-y-1">
                <div className="text-slate-400 font-bold">4. Vendor</div>
                <div className="font-bold text-slate-800 truncate" title={project.contractorName}>
                  {project.contractorName?.slice(0, 15) || 'Tender Open'}
                </div>
                <div className="text-slate-500">Contractor</div>
              </div>

              {/* Breakdown Stage */}
              <div
                className={`p-2 rounded-xl border space-y-1 ${
                  hasPipelineBreakdown
                    ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-xs'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="font-bold text-[10px]">5. Disbursement</div>
                <div className="font-bold text-slate-800 font-mono">₹{project.expenditureAmountLakhs}L</div>
                <div className="font-bold">{spentPct}% Paid</div>
              </div>

              <div
                className={`p-2 rounded-xl border space-y-1 ${
                  (project.completionPercentage || 0) >= 100
                    ? 'bg-emerald-50 border-emerald-300'
                    : (project.completionPercentage || 0) < 40 && hasPipelineBreakdown
                    ? 'bg-rose-50 border-rose-300'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="text-slate-400 font-bold">6. Handover</div>
                <div className="font-bold text-slate-800">{project.completionPercentage}% Done</div>
                <div className="text-slate-500">{project.completionPercentage >= 100 ? 'In Use' : 'Incomplete'}</div>
              </div>
            </div>
          </div>

          {/* 5. DUAL AI EXPLAINER */}
          <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/80 rounded-2xl p-4 border border-blue-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-blue-700" />
                <span>AI Vigilance Intelligence Summary</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Mode Toggle */}
                <div className="flex items-center bg-white/80 p-0.5 rounded-xl border border-blue-200 text-[11px] font-semibold">
                  <button
                    onClick={() => {
                      setAiMode('citizen');
                      handleGenerateAiExplain('citizen');
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      aiMode === 'citizen' ? 'bg-blue-700 text-white shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Citizen Mode
                  </button>
                  <button
                    onClick={() => {
                      setAiMode('technical');
                      handleGenerateAiExplain('technical');
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      aiMode === 'technical' ? 'bg-blue-700 text-white shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Technical / Statutory
                  </button>
                </div>

                <button
                  onClick={() => handleGenerateAiExplain(aiMode)}
                  disabled={isAiExplaining}
                  className="px-3 py-1 rounded-xl bg-blue-700 text-white font-semibold text-xs hover:bg-blue-800 disabled:opacity-50 transition-all shadow-2xs"
                >
                  {isAiExplaining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Refresh'}
                </button>
              </div>
            </div>

            {aiExplanation ? (
              <p className="text-xs text-slate-800 leading-relaxed bg-white/95 p-3.5 rounded-xl border border-blue-200/60 font-medium">
                {aiExplanation}
              </p>
            ) : (
              <p className="text-xs text-slate-600">
                Click above to generate a grounded, natural-language explanation of why this project was flagged,
                available in either simple Citizen English or Technical statutory citations.
              </p>
            )}
          </div>

          {/* 5. WHY IS THIS PROJECT HIGH RISK? */}
          {project.riskFactors && project.riskFactors.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Why was this project flagged? (Itemized Risk Points)
              </h3>
              <div className="space-y-2">
                {project.riskFactors.map((rf, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-700">
                          {rf.category}
                        </span>
                        <strong className="text-slate-900 font-bold text-xs">{rf.title}</strong>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">{rf.description}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold font-mono text-xs whitespace-nowrap">
                      +{rf.points} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. CITIZEN REALITY CHECK GROUND OBSERVATIONS */}
          <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                <span>Citizen Reality Check: Ground Verifications ({verifications.length})</span>
              </div>
              {onOpenCitizenVerify && (
                <button
                  onClick={() => onOpenCitizenVerify(project)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-colors shadow-2xs"
                >
                  Submit Ground Check
                </button>
              )}
            </div>

            {verifications.length === 0 ? (
              <p className="text-xs text-slate-500">
                No citizen ground verification reports have been recorded for this work yet.
                If you have visited this site, click "Submit Ground Check" to report on-ground progress.
              </p>
            ) : (
              <div className="space-y-2">
                {verifications.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 bg-white rounded-xl border border-emerald-200/70 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{v.citizenName}</span>
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          v.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium">"{v.description}"</p>
                    {v.locationLandmark && (
                      <div className="text-[10px] text-slate-400">Landmark: {v.locationLandmark}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 7. Detected Anomalies List */}
          {project.detectedAnomalies && project.detectedAnomalies.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Compliance Violations &amp; Recommended Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.detectedAnomalies.map((anom) => (
                  <AnomalyCard key={anom.id} anomaly={anom} />
                ))}
              </div>
            </div>
          )}

          {/* 8. Admin Investigation Workflow (Shown when isAdmin or onUpdateInvestigation is passed) */}
          {isAdmin && onUpdateInvestigation && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-blue-700" />
                  Official Investigation &amp; Resolution Actions
                </h3>
                <span className="text-[11px] text-slate-500">
                  Persisted securely to Firestore
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Investigation Status
                  </label>
                  <select
                    value={invStatus}
                    onChange={(e) => setInvStatus(e.target.value as InvestigationStatus)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="New">New (Pending Review)</option>
                    <option value="Under Review">Under Review (Inspection Ordered)</option>
                    <option value="Verified">Verified (Confirmed Non-compliant)</option>
                    <option value="Dismissed">Dismissed (False Positive / Cleared)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Contractor / Agency
                  </label>
                  <div className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium">
                    {project.contractorName || 'Tender Award Open'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Investigation Directives &amp; Field Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter field audit observations, site visit date, Measurement Book (MB) volume number, or justification for status change..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs">
                  {saveSuccess && (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Updated in Firestore successfully!
                    </span>
                  )}
                </div>

                <button
                  onClick={handleSaveInvestigation}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-2xs"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Investigation Record</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Sanction: {project.sanctionDate} • Target Completion: {project.expectedCompletionDate}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-white transition-colors"
          >
            Close Health Card
          </button>
        </div>
      </div>
    </div>
  );
};
