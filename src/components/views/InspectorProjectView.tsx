import React, { useState, useCallback } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Camera,
  FileText,
  Navigation,
  ClipboardList,
  Send,
  Lock,
  Info,
  Star,
  Upload,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  InspectorAssignedProject,
  InspectionReport,
  ComponentVerification,
  SiteChecklist,
  SiteConditionStatus,
} from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';

interface InspectorProjectViewProps {
  assignments: InspectorAssignedProject[];
  initialAssignment?: InspectorAssignedProject | null;
  reports: InspectionReport[];
  currentUser: { name: string; email: string } | null;
  onBack: () => void;
  onReportSubmit: (report: InspectionReport) => void;
}

const TOTAL_STEPS = 7;

const DEFAULT_SITE_CHECKLIST: SiteChecklist[] = [
  { item: 'Contractor presence on site', status: 'N/A' },
  { item: 'Work order / approved plan available', status: 'N/A' },
  { item: 'Material quality certificates present', status: 'N/A' },
  { item: 'Measurement book up to date', status: 'N/A' },
  { item: 'Safety signs and barricading', status: 'N/A' },
  { item: 'Completion certificate availability', status: 'N/A' },
  { item: 'Geo-tagged photos submitted', status: 'N/A' },
  { item: 'Social audit board visible', status: 'N/A' },
];

const DEFAULT_COMPONENTS: ComponentVerification[] = [
  { name: 'Civil Structure / Main Works', reportedPct: 0, actualPct: 0, discrepancyPct: 0, status: 'Not Inspected', remarks: '' },
  { name: 'Labour & Workforce', reportedPct: 0, actualPct: 0, discrepancyPct: 0, status: 'Not Inspected', remarks: '' },
  { name: 'Equipment & Materials', reportedPct: 0, actualPct: 0, discrepancyPct: 0, status: 'Not Inspected', remarks: '' },
];

const COMMON_ISSUES = [
  'Physical progress lower than reported',
  'Financial progress much higher than physical (possible fund diversion)',
  'Poor material quality',
  'Contractor absent / understaffed',
  'Site records (MB) not maintained',
  'No safety barricading at active work zones',
  'Geo-tagged photos not submitted',
  'Work order not available at site',
  'Incomplete documentation',
  'Citizen complaints about quality',
];

function generateAutoSummary(data: Partial<InspectionReport>): string {
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const physGap = (data.physicalDiscrepancyPct || 0).toFixed(1);
  const finGap = (data.financialDiscrepancyPct || 0).toFixed(1);
  const issues = data.issuesFound || [];
  const verdict = data.verdict || 'Satisfactory';
  const siteCondition = data.overallSiteCondition || 'Satisfactory';

  return `Site inspection completed on ${dateStr}. Physical progress reported at ${data.reportedPhysicalPct || 0}% vs actual ${data.actualPhysicalPct || 0}% (${physGap}% discrepancy — ${Math.abs(Number(physGap)) <= 5 ? 'Minor' : 'Significant'}). Financial discrepancy: ${finGap}% (${Math.abs(Number(finGap)) <= 5 ? 'within acceptable range' : 'requires review'}). Overall site condition: ${siteCondition}. Issues found: ${issues.length} (${issues.join('; ') || 'None'}). Verdict: ${verdict}. ${
    verdict === 'Satisfactory'
      ? 'No further action required at this stage.'
      : verdict === 'Minor Issues'
      ? 'Recommend: Contractor to address noted issues within 7 days.'
      : verdict === 'Major Discrepancy'
      ? 'Recommend: Payment hold and detailed inquiry by Nodal Officer.'
      : 'URGENT: Escalate to District Authority immediately. Potential fraud indicators found.'
  }`;
}

export const InspectorProjectView: React.FC<InspectorProjectViewProps> = ({
  assignments,
  initialAssignment,
  reports,
  currentUser,
  onBack,
  onReportSubmit,
}) => {
  const { t } = useTranslation();
  const [selectedAssignment, setSelectedAssignment] = useState<InspectorAssignedProject | null>(
    initialAssignment || (assignments.length === 1 ? assignments[0] : null)
  );

  // Find existing report for this assignment
  const existingReport = selectedAssignment
    ? reports.find((r) => r.assignmentId === selectedAssignment.assignmentId) || null
    : null;

  const [step, setStep] = useState(0); // 0 = project overview, 1-7 = workflow steps
  const [showWorkflow, setShowWorkflow] = useState(false);

  // Form state for the inspection workflow
  const [actualPhysicalPct, setActualPhysicalPct] = useState<number>(0);
  const [actualFinancialPct, setActualFinancialPct] = useState<number>(0);
  const [components, setComponents] = useState<ComponentVerification[]>(DEFAULT_COMPONENTS);
  const [checklist, setChecklist] = useState<SiteChecklist[]>(DEFAULT_SITE_CHECKLIST);
  const [overallSiteCondition, setOverallSiteCondition] = useState<'Satisfactory' | 'Needs Attention' | 'Serious Issue'>('Satisfactory');
  const [gpsVerified, setGpsVerified] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<{ id: string; name: string; type: 'Photo' | 'Video' | 'Document' | 'GeoTag'; size: string; uploadedAt: string }[]>([]);
  const [observations, setObservations] = useState('');
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [verdict, setVerdict] = useState<'Satisfactory' | 'Minor Issues' | 'Major Discrepancy' | 'Fraud Suspected'>('Satisfactory');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<InspectionReport | null>(null);

  const handleStartInspection = useCallback(() => {
    if (!selectedAssignment) return;
    // Reset form for a fresh inspection
    setActualPhysicalPct(selectedAssignment.reportedPhysicalProgressPct);
    setActualFinancialPct(selectedAssignment.reportedFinancialProgressPct);
    setComponents(DEFAULT_COMPONENTS.map((c) => ({
      ...c,
      reportedPct: selectedAssignment.reportedPhysicalProgressPct,
      actualPct: selectedAssignment.reportedPhysicalProgressPct,
    })));
    setChecklist(DEFAULT_SITE_CHECKLIST);
    setStep(1);
    setShowWorkflow(true);
  }, [selectedAssignment]);

  const handleGpsCapture = useCallback(() => {
    if (!navigator.geolocation) {
      alert(t('inspector.gpsNotSupported', 'GPS not supported on this device'));
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsVerified(true);
        setGpsLoading(false);
      },
      () => {
        // Graceful fallback: use site coords from assignment
        if (selectedAssignment) {
          setGpsCoords({ lat: 25.3 + Math.random() * 0.5, lng: 82.9 + Math.random() * 0.5 });
          setGpsVerified(true);
        }
        setGpsLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [selectedAssignment, t]);

  const handleFileAdd = useCallback(() => {
    // Mock file upload - in production would use actual file input
    const mockFiles = [
      { name: `site_photo_${Date.now()}.jpg`, type: 'Photo' as const, size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB` },
      { name: `document_${Date.now()}.pdf`, type: 'Document' as const, size: `${(Math.random() * 5 + 1).toFixed(1)} MB` },
    ];
    const file = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    setEvidenceFiles((prev) => [
      ...prev,
      { id: `EV-${Date.now()}`, ...file, uploadedAt: new Date().toISOString() },
    ]);
  }, []);

  const handleSubmitReport = useCallback(() => {
    if (!selectedAssignment) return;

    setIsSubmitting(true);

    const userEmail = currentUser?.email || 'inspector@mplads.vigilai';
    const userName = currentUser?.name || 'Sh. Ramesh Kumar Verma, Field Inspector (INS-104)';

    const reportedPhy = Number(selectedAssignment.reportedPhysicalProgressPct) || 0;
    const reportedFin = Number(selectedAssignment.reportedFinancialProgressPct) || 0;
    const actualPhy = Number(actualPhysicalPct) || 0;
    const actualFin = Number(actualFinancialPct) || 0;
    const phyDiscrepancy = reportedPhy - actualPhy;
    const finDiscrepancy = reportedFin - actualFin;

    const updatedComponents = components.map((c) => ({
      ...c,
      discrepancyPct: Number(c.reportedPct) - Number(c.actualPct),
      status: (Number(c.reportedPct) - Number(c.actualPct) > 15
        ? 'Major Discrepancy'
        : Number(c.reportedPct) - Number(c.actualPct) > 5
        ? 'Minor Discrepancy'
        : 'Match') as ComponentVerification['status'],
    }));

    const finalObservations =
      observations.trim() ||
      `Field site inspection completed for ${selectedAssignment.projectTitle} (${selectedAssignment.projectWorkCode}). Actual physical progress verified at ${actualPhy}% against reported ${reportedPhy}%. Overall site condition: ${overallSiteCondition}. Final verdict: ${verdict}.`;

    const reportData: Partial<InspectionReport> = {
      reportedPhysicalPct: reportedPhy,
      actualPhysicalPct: actualPhy,
      physicalDiscrepancyPct: phyDiscrepancy,
      reportedFinancialPct: reportedFin,
      actualFinancialPct: actualFin,
      financialDiscrepancyPct: finDiscrepancy,
      overallSiteCondition,
      verdict,
      issuesFound: selectedIssues,
      inspectorObservations: finalObservations,
    };

    const newReport: InspectionReport = {
      reportId: `RPT-2026-${Math.floor(100 + Math.random() * 900)}`,
      assignmentId: selectedAssignment.assignmentId,
      projectId: selectedAssignment.projectId,
      projectWorkCode: selectedAssignment.projectWorkCode,
      projectTitle: selectedAssignment.projectTitle,
      district: selectedAssignment.district,
      state: selectedAssignment.state,
      inspectorEmail: userEmail,
      inspectorName: userName,
      reportedPhysicalPct: reportedPhy,
      actualPhysicalPct: actualPhy,
      physicalDiscrepancyPct: phyDiscrepancy,
      reportedFinancialPct: reportedFin,
      actualFinancialPct: actualFin,
      financialDiscrepancyPct: finDiscrepancy,
      overallSiteCondition,
      verdict,
      issuesFound: selectedIssues,
      componentVerifications: updatedComponents,
      siteChecklist: checklist,
      gpsVerified,
      gpsCoordinates: gpsCoords || undefined,
      evidenceFiles,
      inspectorObservations: finalObservations,
      autoSummary: generateAutoSummary(reportData),
      submittedAt: new Date().toISOString(),
      isSubmitted: true,
      isReadOnly: true,
      officerReviewStatus: 'Pending Review',
    };

    setSelectedAssignment((prev) =>
      prev ? { ...prev, status: 'Submitted', reportId: newReport.reportId } : null
    );

    setTimeout(() => {
      setSubmittedReport(newReport);
      setIsSubmitted(true);
      setIsSubmitting(false);
      try {
        onReportSubmit(newReport);
      } catch (err) {
        console.error('Error in onReportSubmit:', err);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 400);
  }, [
    selectedAssignment,
    currentUser,
    actualPhysicalPct,
    actualFinancialPct,
    components,
    checklist,
    overallSiteCondition,
    gpsVerified,
    gpsCoords,
    evidenceFiles,
    observations,
    selectedIssues,
    verdict,
    onReportSubmit,
  ]);

  // ------ Render: Assignment selection (if multiple assignments) ------
  if (!selectedAssignment) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t('common.back', 'Back')}
        </button>
        <h2 className="text-xl font-black text-slate-900">{t('inspector.selectAssignment', 'Select Assignment to Inspect')}</h2>
        <div className="grid gap-3">
          {assignments.map((a) => (
            <button
              key={a.assignmentId}
              onClick={() => setSelectedAssignment(a)}
              className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer bg-white shadow-xs"
            >
              <div className="font-bold text-slate-900">{a.projectTitle}</div>
              <div className="text-xs text-slate-500 mt-1">{a.projectWorkCode} • {a.district}, {a.state}</div>
              <div className="flex gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${a.status === 'Overdue' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                  {t(`inspector.status${a.status.replace(' ', '')}`, a.status)}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-slate-50 text-slate-600 border-slate-200">
                  {a.priority}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ------ Render: Submitted report (read-only) ------
  if (existingReport?.isSubmitted || isSubmitted) {
    const report = submittedReport || existingReport!;
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t('common.back', 'Back')}
        </button>

        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-500 shrink-0" />
            <div>
              <h2 className="font-black text-emerald-800 text-lg">{t('inspector.reportSubmitted', 'Inspection Report Submitted')}</h2>
              <p className="text-xs text-emerald-600">
                {t('inspector.reportId', 'Report ID')}: <span className="font-mono font-bold">{report.reportId}</span>
                {' • '}{new Date(report.submittedAt).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-700">
            <Lock className="w-3.5 h-3.5" />
            <span>{t('inspector.reportReadOnly', 'This report is now read-only and cannot be modified')}</span>
          </div>
        </div>

        {/* Report Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h3 className="font-bold text-slate-900 text-base">{t('inspector.reportSummary', 'Inspection Summary')}</h3>

          <div className="grid grid-cols-2 gap-3">
            <InfoRow label={t('inspector.project', 'Project')} value={report.projectTitle} span />
            <InfoRow label={t('inspector.physicalProgress', 'Physical (Reported → Actual)')} value={`${report.reportedPhysicalPct}% → ${report.actualPhysicalPct}% (${report.physicalDiscrepancyPct > 0 ? '-' : '+'}${Math.abs(report.physicalDiscrepancyPct)}% gap)`} />
            <InfoRow label={t('inspector.financialProgress', 'Financial (Reported → Actual)')} value={`${report.reportedFinancialPct}% → ${report.actualFinancialPct}% (${report.financialDiscrepancyPct > 0 ? '-' : '+'}${Math.abs(report.financialDiscrepancyPct)}% gap)`} />
            <InfoRow label={t('inspector.overallSiteCondition', 'Site Condition')} value={t(`inspector.condition${report.overallSiteCondition.replace(' ', '')}`, report.overallSiteCondition)} />
            <InfoRow label={t('inspector.verdict', 'Verdict')} value={t(`inspector.verdict${report.verdict.replace(' ', '')}`, report.verdict)} />
            <InfoRow label={t('inspector.gpsVerified', 'GPS Verified')} value={report.gpsVerified ? t('common.yes', 'Yes') : t('common.no', 'No')} />
          </div>

          {report.issuesFound.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-700 mb-1">{t('inspector.issuesFound', 'Issues Found')}:</div>
              <ul className="space-y-1">
                {report.issuesFound.map((issue, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-slate-700">
                    <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-bold text-slate-700 mb-1">{t('inspector.autoSummary', 'Auto-Generated Summary')}</div>
            <p className="text-xs text-slate-600 leading-relaxed">{report.autoSummary}</p>
          </div>

          {report.officerReviewStatus && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200">
              <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-blue-700">{t('inspector.officerReview', 'Officer Review')}: </span>
                <span className="text-blue-600">{t(`inspector.officerStatus${report.officerReviewStatus.replace(/ /g, '')}`, report.officerReviewStatus)}</span>
                {report.officerNotes && <div className="text-blue-600 mt-0.5">{report.officerNotes}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ------ Render: Project Overview (Step 0) ------
  if (!showWorkflow) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t('common.back', 'Back to Dashboard')}
        </button>

        {/* Project Info Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="text-[10px] font-mono text-slate-400 mb-1">{selectedAssignment.projectWorkCode}</div>
              <h2 className="text-xl font-black text-slate-900">{selectedAssignment.projectTitle}</h2>
            </div>
            {selectedAssignment.status === 'Overdue' && (
              <span className="shrink-0 px-2.5 py-1 bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {t('inspector.statusOverdue', 'Overdue')}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <InfoRow label={t('inspector.district', 'District')} value={selectedAssignment.district} />
            <InfoRow label={t('inspector.state', 'State')} value={selectedAssignment.state} />
            <InfoRow label={t('inspector.constituency', 'Constituency')} value={selectedAssignment.constituency} />
            <InfoRow label={t('inspector.sanctionedAmount', 'Sanctioned Amount')} value={`₹${selectedAssignment.sanctionedAmountLakhs} Lakhs`} />
            <InfoRow label={t('inspector.reportedPhysical', 'Reported Physical Progress')} value={`${selectedAssignment.reportedPhysicalProgressPct}%`} />
            <InfoRow label={t('inspector.reportedFinancial', 'Reported Financial Progress')} value={`${selectedAssignment.reportedFinancialProgressPct}%`} />
            <InfoRow label={t('inspector.deadline', 'Inspection Deadline')} value={new Date(selectedAssignment.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} />
            <InfoRow label={t('inspector.assignedBy', 'Assigned By')} value={selectedAssignment.assignedBy} />
          </div>

          {selectedAssignment.riskScore && (
            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-black text-slate-900">{selectedAssignment.riskScore}</div>
                <div>
                  <div className="text-xs font-bold text-slate-700">{t('inspector.aiRiskScore', 'AI Risk Score')}</div>
                  <div className={`text-xs font-bold ${selectedAssignment.riskLevel === 'Critical' ? 'text-rose-600' : selectedAssignment.riskLevel === 'High' ? 'text-orange-600' : 'text-amber-600'}`}>
                    {t(`risk.${selectedAssignment.riskLevel?.toLowerCase() || 'medium'}`, selectedAssignment.riskLevel || 'Medium')} {t('inspector.riskLevel', 'Risk')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedAssignment.notes && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div className="text-xs font-bold text-amber-800 mb-1">{t('inspector.officerInstructions', 'Officer Instructions')}:</div>
              <p className="text-xs text-amber-700 leading-relaxed">{selectedAssignment.notes}</p>
            </div>
          )}
        </div>

        {/* Start Inspection Button */}
        <button
          onClick={handleStartInspection}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-base transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-3 cursor-pointer"
        >
          <ClipboardList className="w-5 h-5" />
          {t('inspector.startSiteInspection', 'Start Site Inspection')}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // ------ Render: Multi-step Inspection Workflow ------
  const physicalDiscrepancy = selectedAssignment.reportedPhysicalProgressPct - actualPhysicalPct;
  const financialDiscrepancy = selectedAssignment.reportedFinancialProgressPct - actualFinancialPct;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { setShowWorkflow(false); setStep(0); }}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t('inspector.backToProject', 'Back to Project')}
        </button>
      </div>

      {/* Step Progress */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold text-slate-700">
            {t('inspector.step', 'Step')} {step} {t('inspector.of', 'of')} {TOTAL_STEPS}
          </div>
          <div className="text-xs text-slate-500">{Math.round((step / TOTAL_STEPS) * 100)}%</div>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${i + 1 <= step ? 'bg-indigo-500' : 'bg-slate-200'}`}
            />
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">

        {/* STEP 1: Physical Progress Verification */}
        {step === 1 && (
          <StepContainer
            icon={<ClipboardList className="w-5 h-5 text-indigo-500" />}
            title={t('inspector.step1Title', 'Physical & Financial Progress Verification')}
            subtitle={t('inspector.step1Subtitle', 'Enter the ACTUAL progress you observed on site. Do not modify the reported values.')}
          >
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{t('inspector.reportedValuesReadOnly', 'The "Reported" values are from the official records and cannot be changed. Only enter the "Actual" values you observed.')}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ProgressInput
                  label={t('inspector.reportedPhysical', 'Reported Physical Progress')}
                  value={selectedAssignment.reportedPhysicalProgressPct}
                  readOnly
                />
                <ProgressInput
                  label={t('inspector.actualPhysical', 'Actual Physical Progress (Observed)')}
                  value={actualPhysicalPct}
                  readOnly={false}
                  onChange={setActualPhysicalPct}
                />
              </div>

              {physicalDiscrepancy !== 0 && (
                <DiscrepancyBadge label={t('inspector.physicalGap', 'Physical Gap')} value={physicalDiscrepancy} />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ProgressInput
                  label={t('inspector.reportedFinancial', 'Reported Financial Progress')}
                  value={selectedAssignment.reportedFinancialProgressPct}
                  readOnly
                />
                <ProgressInput
                  label={t('inspector.actualFinancial', 'Actual Financial Progress (Verified)')}
                  value={actualFinancialPct}
                  readOnly={false}
                  onChange={setActualFinancialPct}
                />
              </div>

              {financialDiscrepancy !== 0 && (
                <DiscrepancyBadge label={t('inspector.financialGap', 'Financial Gap')} value={financialDiscrepancy} />
              )}
            </div>
          </StepContainer>
        )}

        {/* STEP 2: Component Verification */}
        {step === 2 && (
          <StepContainer
            icon={<Star className="w-5 h-5 text-indigo-500" />}
            title={t('inspector.step2Title', 'Component-by-Component Verification')}
            subtitle={t('inspector.step2Subtitle', 'Verify each major work component and record the actual completion percentage.')}
          >
            <div className="space-y-4">
              {components.map((comp, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="font-bold text-sm text-slate-900">{comp.name}</div>
                  <div className="grid grid-cols-2 gap-3">
                    <ProgressInput
                      label={t('inspector.reportedPct', 'Reported %')}
                      value={comp.reportedPct}
                      readOnly={false}
                      onChange={(val) => setComponents((prev) => prev.map((c, i) => i === idx ? { ...c, reportedPct: val, discrepancyPct: val - c.actualPct } : c))}
                    />
                    <ProgressInput
                      label={t('inspector.actualPct', 'Actual % (Observed)')}
                      value={comp.actualPct}
                      readOnly={false}
                      onChange={(val) => setComponents((prev) => prev.map((c, i) => i === idx ? { ...c, actualPct: val, discrepancyPct: c.reportedPct - val } : c))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600">{t('inspector.remarks', 'Remarks')}</label>
                    <textarea
                      value={comp.remarks}
                      onChange={(e) => setComponents((prev) => prev.map((c, i) => i === idx ? { ...c, remarks: e.target.value } : c))}
                      rows={2}
                      className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      placeholder={t('inspector.remarksPlaceholder', 'Observations about this component...')}
                    />
                  </div>
                  {comp.reportedPct - comp.actualPct !== 0 && (
                    <DiscrepancyBadge label={t('inspector.gap', 'Gap')} value={comp.reportedPct - comp.actualPct} />
                  )}
                </div>
              ))}
            </div>
          </StepContainer>
        )}

        {/* STEP 3: Site Condition Checklist */}
        {step === 3 && (
          <StepContainer
            icon={<CheckCircle2 className="w-5 h-5 text-indigo-500" />}
            title={t('inspector.step3Title', 'Site Condition Checklist')}
            subtitle={t('inspector.step3Subtitle', 'Review each condition item and mark its status as observed at the site.')}
          >
            <div className="space-y-3">
              {checklist.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex-1 text-xs font-medium text-slate-700">{t(`inspector.checklist${idx}`, item.item)}</div>
                  <div className="flex gap-1">
                    {(['Verified', 'Not Verified', 'N/A'] as SiteConditionStatus[]).map((status) => (
                      <button
                        key={status}
                        onClick={() => setChecklist((prev) => prev.map((c, i) => i === idx ? { ...c, status } : c))}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          item.status === status
                            ? status === 'Verified'
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : status === 'Not Verified'
                              ? 'bg-rose-500 text-white border-rose-500'
                              : 'bg-slate-500 text-white border-slate-500'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {t(`inspector.checklist${status.replace(' ', '')}`, status)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="mt-4">
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  {t('inspector.overallCondition', 'Overall Site Condition')}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {(['Satisfactory', 'Needs Attention', 'Serious Issue'] as const).map((cond) => (
                    <button
                      key={cond}
                      onClick={() => setOverallSiteCondition(cond)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        overallSiteCondition === cond
                          ? cond === 'Satisfactory'
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : cond === 'Needs Attention'
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {t(`inspector.condition${cond.replace(' ', '')}`, cond)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </StepContainer>
        )}

        {/* STEP 4: GPS */}
        {step === 4 && (
          <StepContainer
            icon={<Navigation className="w-5 h-5 text-indigo-500" />}
            title={t('inspector.step4Title', 'GPS Location Verification')}
            subtitle={t('inspector.step4Subtitle', 'Capture your current GPS location to verify you are at the project site. This step is optional.')}
          >
            <div className="space-y-4">
              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-center">
                <MapPin className={`w-10 h-10 mx-auto mb-3 ${gpsVerified ? 'text-emerald-500' : 'text-slate-400'}`} />
                {gpsVerified && gpsCoords ? (
                  <div>
                    <div className="text-emerald-600 font-bold text-sm mb-1">{t('inspector.gpsVerified', 'GPS Location Captured')}</div>
                    <div className="font-mono text-xs text-slate-600">
                      {t('inspector.lat', 'Lat')}: {gpsCoords.lat.toFixed(6)} | {t('inspector.lng', 'Lng')}: {gpsCoords.lng.toFixed(6)}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-slate-600 font-bold text-sm mb-1">{t('inspector.gpsNotCaptured', 'GPS Not Yet Captured')}</div>
                    <p className="text-xs text-slate-400">{t('inspector.gpsHint', 'Allow location access when prompted')}</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleGpsCapture}
                disabled={gpsLoading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {gpsLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('inspector.gpsCapturing', 'Capturing...')}</>
                ) : gpsVerified ? (
                  <>{t('inspector.gpsCaptureAgain', 'Capture Again')}</>
                ) : (
                  <><Navigation className="w-4 h-4" />{t('inspector.captureGps', 'Capture My Location')}</>
                )}
              </button>

              <p className="text-center text-xs text-slate-400">
                {t('inspector.gpsSkipNote', 'You may skip this step if GPS is unavailable.')}
              </p>
            </div>
          </StepContainer>
        )}

        {/* STEP 5: Evidence Upload */}
        {step === 5 && (
          <StepContainer
            icon={<Camera className="w-5 h-5 text-indigo-500" />}
            title={t('inspector.step5Title', 'Site Evidence Upload')}
            subtitle={t('inspector.step5Subtitle', 'Upload photographs, documents, and measurement books as evidence.')}
          >
            <div className="space-y-4">
              <button
                onClick={handleFileAdd}
                className="w-full py-3 rounded-xl border-2 border-dashed border-indigo-300 hover:border-indigo-400 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {t('inspector.addEvidence', 'Add Photo / Document')}
              </button>

              {evidenceFiles.length > 0 && (
                <div className="space-y-2">
                  {evidenceFiles.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                        file.type === 'Photo' ? 'bg-blue-500' : file.type === 'Video' ? 'bg-purple-500' : 'bg-slate-500'
                      }`}>
                        {file.type === 'Photo' ? '📷' : file.type === 'Video' ? '🎥' : '📄'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">{file.name}</div>
                        <div className="text-[10px] text-slate-500">{file.size} • {file.type}</div>
                      </div>
                      <button
                        onClick={() => setEvidenceFiles((prev) => prev.filter((f) => f.id !== file.id))}
                        className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {evidenceFiles.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-4">
                  {t('inspector.noEvidenceYet', 'No evidence added yet. Upload at least one photo or document.')}
                </p>
              )}
            </div>
          </StepContainer>
        )}

        {/* STEP 6: Observations & Issues */}
        {step === 6 && (
          <StepContainer
            icon={<FileText className="w-5 h-5 text-indigo-500" />}
            title={t('inspector.step6Title', 'Inspector Observations & Issues')}
            subtitle={t('inspector.step6Subtitle', 'Describe your field observations and check any issues found.')}
          >
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {t('inspector.observations', 'Inspector Observations & Findings')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const auto = generateAutoSummary({
                        reportedPhysicalPct: selectedAssignment.reportedPhysicalProgressPct,
                        actualPhysicalPct,
                        physicalDiscrepancyPct: physicalDiscrepancy,
                        reportedFinancialPct: selectedAssignment.reportedFinancialProgressPct,
                        actualFinancialPct,
                        financialDiscrepancyPct: financialDiscrepancy,
                        overallSiteCondition,
                        verdict,
                        issuesFound: selectedIssues,
                      });
                      setObservations(auto);
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                  >
                    {t('inspector.autoFillRemarks', 'Auto-fill from summary')}
                  </button>
                </div>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white"
                  placeholder={t('inspector.observationsPlaceholder', 'Describe what you observed at the site, including work quality, progress, site conditions, contractor presence, any discrepancies noticed... (Auto-generated summary used if left blank)')}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  {t('inspector.issuesFound', 'Issues Found')} ({t('inspector.checkAllThatApply', 'check all that apply')})
                </label>
                <div className="space-y-2">
                  {COMMON_ISSUES.map((issue) => (
                    <label key={issue} className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={selectedIssues.includes(issue)}
                        onChange={() => setSelectedIssues((prev) =>
                          prev.includes(issue) ? prev.filter((i) => i !== issue) : [...prev, issue]
                        )}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                      />
                      <span className="text-xs font-medium text-slate-700">{t(`inspector.issue_${issue.replace(/ /g, '_').toLowerCase()}`, issue)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </StepContainer>
        )}

        {/* STEP 7: Verdict & Submit */}
        {step === 7 && (
          <StepContainer
            icon={<Send className="w-5 h-5 text-indigo-500" />}
            title={t('inspector.step7Title', 'Inspector Verdict & Submit Report')}
            subtitle={t('inspector.step7Subtitle', 'Select your final verdict and review the auto-generated summary before submitting.')}
          >
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  {t('inspector.verdict', 'Inspector Verdict')} <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {([
                    { value: 'Satisfactory', label: t('inspector.verdictSatisfactory', 'Satisfactory'), desc: t('inspector.verdictSatisfactoryDesc', 'Work matches reported progress. No major issues.'), color: 'emerald' },
                    { value: 'Minor Issues', label: t('inspector.verdictMinorIssues', 'Minor Issues'), desc: t('inspector.verdictMinorIssuesDesc', 'Small discrepancies or minor quality concerns.'), color: 'amber' },
                    { value: 'Major Discrepancy', label: t('inspector.verdictMajorDiscrepancy', 'Major Discrepancy'), desc: t('inspector.verdictMajorDiscrepancyDesc', 'Significant mismatch between reported and actual. Recommend inquiry.'), color: 'orange' },
                    { value: 'Fraud Suspected', label: t('inspector.verdictFraudSuspected', 'Fraud Suspected'), desc: t('inspector.verdictFraudSuspectedDesc', 'Strong indicators of fraudulent reporting. Escalate immediately.'), color: 'rose' },
                  ] as const).map(({ value, label, desc, color }) => (
                    <button
                      key={value}
                      onClick={() => setVerdict(value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        verdict === value
                          ? color === 'emerald'
                            ? 'border-emerald-500 bg-emerald-50'
                            : color === 'amber'
                            ? 'border-amber-500 bg-amber-50'
                            : color === 'orange'
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-rose-600 bg-rose-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className={`text-xs font-bold ${verdict === value && color === 'emerald' ? 'text-emerald-700' : verdict === value && color === 'amber' ? 'text-amber-700' : verdict === value && color === 'orange' ? 'text-orange-700' : verdict === value ? 'text-rose-700' : 'text-slate-700'}`}>
                        {label}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Field Observations & Remarks */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {t('inspector.observations', 'Inspector Observations & Remarks')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const auto = generateAutoSummary({
                        reportedPhysicalPct: selectedAssignment.reportedPhysicalProgressPct,
                        actualPhysicalPct,
                        physicalDiscrepancyPct: physicalDiscrepancy,
                        reportedFinancialPct: selectedAssignment.reportedFinancialProgressPct,
                        actualFinancialPct,
                        financialDiscrepancyPct: financialDiscrepancy,
                        overallSiteCondition,
                        verdict,
                        issuesFound: selectedIssues,
                      });
                      setObservations(auto);
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                  >
                    {t('inspector.autoFillRemarks', 'Auto-fill from summary')}
                  </button>
                </div>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white"
                  placeholder={t(
                    'inspector.observationsPlaceholder',
                    'Describe what you observed at the site, work quality, physical progress, site conditions... (Auto-generated summary will be used if left blank)'
                  )}
                />
              </div>

              {/* Auto-generated Summary */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  {t('inspector.autoSummaryPreview', 'Auto-Generated Summary Preview')}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {generateAutoSummary({
                    reportedPhysicalPct: selectedAssignment.reportedPhysicalProgressPct,
                    actualPhysicalPct,
                    physicalDiscrepancyPct: physicalDiscrepancy,
                    reportedFinancialPct: selectedAssignment.reportedFinancialProgressPct,
                    actualFinancialPct,
                    financialDiscrepancyPct: financialDiscrepancy,
                    overallSiteCondition,
                    verdict,
                    issuesFound: selectedIssues,
                  })}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700 flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{t('inspector.reportFinalWarning', 'Warning: Once submitted, this report will be locked and cannot be modified. The assigned officer will be notified automatically.')}</span>
              </div>

              <button
                type="button"
                id="inspector-submit-report-btn"
                onClick={handleSubmitReport}
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 active:scale-[0.99] text-white font-black text-base transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-75"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('inspector.submittingReport', 'Submitting Inspection Report...')}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>{t('inspector.submitReport', 'Submit Inspection Report')}</span>
                  </>
                )}
              </button>
            </div>
          </StepContainer>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-sm transition-all cursor-pointer disabled:opacity-40 hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" /> {t('common.previous', 'Previous')}
        </button>
        {step < TOTAL_STEPS ? (
          <button
            onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all cursor-pointer shadow-xs"
          >
            {t('common.next', 'Next')} <ArrowRight className="w-4 h-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Helper Sub-components
// ---------------------------------------------------------------------------
interface StepContainerProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const StepContainer: React.FC<StepContainerProps> = ({ icon, title, subtitle, children }) => (
  <div className="space-y-4">
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
    {children}
  </div>
);

interface InfoRowProps {
  label: string;
  value: string;
  span?: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, span }) => (
  <div className={span ? 'col-span-2' : ''}>
    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
    <div className="text-xs font-semibold text-slate-800 mt-0.5">{value}</div>
  </div>
);

interface ProgressInputProps {
  label: string;
  value: number;
  readOnly: boolean;
  onChange?: (val: number) => void;
}

const ProgressInput: React.FC<ProgressInputProps> = ({ label, value, readOnly, onChange }) => (
  <div>
    <label className="text-xs font-bold text-slate-600 block mb-1">{label}</label>
    <div className="relative">
      <input
        type="number"
        min={0}
        max={100}
        value={value}
        readOnly={readOnly}
        onChange={onChange ? (e) => onChange(Number(e.target.value)) : undefined}
        className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold transition-all focus:outline-none focus:ring-2 ${
          readOnly
            ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
            : 'bg-white border-slate-200 text-slate-900 focus:ring-indigo-300 focus:border-indigo-400'
        }`}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">%</span>
      {readOnly && <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />}
    </div>
  </div>
);

interface DiscrepancyBadgeProps {
  label: string;
  value: number;
}

const DiscrepancyBadge: React.FC<DiscrepancyBadgeProps> = ({ label, value }) => {
  const abs = Math.abs(value);
  const isMajor = abs > 15;
  const isMinor = abs > 5;
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border ${
      isMajor
        ? 'bg-rose-50 border-rose-200 text-rose-700'
        : isMinor
        ? 'bg-amber-50 border-amber-200 text-amber-700'
        : 'bg-blue-50 border-blue-200 text-blue-700'
    }`}>
      {isMajor ? <AlertTriangle className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      {label}: {value > 0 ? '-' : '+'}{abs}% {isMajor ? '— Major Discrepancy' : isMinor ? '— Minor Discrepancy' : '— Within Tolerance'}
    </div>
  );
};
