import React, { useState } from 'react';
import { MPLADProject, InvestigationStatus } from '../types';
import { RiskScore } from './RiskScore';
import { RiskBadge } from './RiskBadge';
import { AnomalyCard } from './AnomalyCard';
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
} from 'lucide-react';

interface ProjectDetailsProps {
  project: MPLADProject;
  onClose: () => void;
  onUpdateInvestigation: (
    projectId: string,
    status: InvestigationStatus,
    notes?: string
  ) => Promise<void>;
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  project,
  onClose,
  onUpdateInvestigation,
}) => {
  const [invStatus, setInvStatus] = useState<InvestigationStatus>(
    project.investigationStatus || 'New'
  );
  const [notes, setNotes] = useState(project.investigationNotes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // AI explanation state
  const [isAiExplaining, setIsAiExplaining] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  const handleSaveInvestigation = async () => {
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

  const handleGenerateAiExplain = async () => {
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
        }),
      });
      const data = await res.json();
      if (data.explanation) {
        setAiExplanation(data.explanation);
      }
    } catch (err) {
      console.error('AI explanation error:', err);
      setAiExplanation(
        'Project exhibits abnormal expenditure timeline variance vs reported ground milestones. Immediate verification of Measurement Book (MB) and site photography recommended.'
      );
    } finally {
      setIsAiExplaining(false);
    }
  };

  const spentPct =
    project.sanctionedAmountLakhs > 0
      ? Math.round((project.expenditureAmountLakhs / project.sanctionedAmountLakhs) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div
        id="project-details-modal"
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/90 flex items-start justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-blue-700">
              <span>{project.workCode}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-sans font-medium">{project.category}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1 max-w-2xl leading-snug">
              {project.title}
            </h2>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {project.district || project.constituency}, {project.state}
              </span>
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {project.mpName || 'MP Office'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-semibold">
                Status: {project.status}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Top Metric Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Risk Score Summary */}
            <RiskScore
              score={project.overallRiskScore || 0}
              level={project.riskLevel}
              size="xl"
              showBar={true}
            />

            {/* Financial Card */}
            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/70 flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Financial Execution
              </span>
              <div className="my-2">
                <div className="text-2xl font-bold text-slate-900 font-mono">
                  ₹{project.expenditureAmountLakhs.toFixed(1)}{' '}
                  <span className="text-sm font-normal text-slate-500">
                    / ₹{project.sanctionedAmountLakhs.toFixed(1)} Lakhs
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Budget Disbursed: <strong className="text-slate-800">{spentPct}%</strong>
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full"
                  style={{ width: `${Math.min(100, spentPct)}%` }}
                />
              </div>
            </div>

            {/* Physical Milestone Progress */}
            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/70 flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Physical Milestones
              </span>
              <div className="my-2">
                <div className="text-2xl font-bold text-slate-900">
                  {project.completionPercentage}%{' '}
                  <span className="text-xs font-normal text-slate-500">certified complete</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Agency: <strong className="text-slate-800">{project.implementingAgency}</strong>
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    project.completionPercentage >= 100
                      ? 'bg-emerald-500'
                      : project.completionPercentage < 40
                      ? 'bg-rose-500'
                      : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min(100, project.completionPercentage)}%` }}
                />
              </div>
            </div>
          </div>

          {/* AI Explanation Banner */}
          <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/80 rounded-2xl p-4 border border-blue-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-blue-700" />
                <span>AI Vigilance Intelligence Breakdown</span>
              </div>
              <button
                onClick={handleGenerateAiExplain}
                disabled={isAiExplaining}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-700 text-white font-semibold text-xs hover:bg-blue-800 disabled:opacity-50 transition-all shadow-2xs"
              >
                {isAiExplaining ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{aiExplanation ? 'Re-generate Analysis' : 'Explain Risk'}</span>
                  </>
                )}
              </button>
            </div>

            {aiExplanation ? (
              <p className="text-xs text-slate-800 leading-relaxed bg-white/90 p-3 rounded-xl border border-blue-200/60 font-medium">
                {aiExplanation}
              </p>
            ) : (
              <p className="text-xs text-slate-600">
                Click above to generate a grounded, AI-audited plain-English summary of why this project was flagged based on MoSPI compliance rules.
              </p>
            )}
          </div>

          {/* Why Was This Project Flagged? Risk Factor Breakdown */}
          {project.riskFactors && project.riskFactors.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Why was this project flagged? (Point Weights)
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

          {/* Detected Anomalies List */}
          {project.detectedAnomalies && project.detectedAnomalies.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Detailed Anomaly Indicators & Recommended Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.detectedAnomalies.map((anom) => (
                  <AnomalyCard key={anom.id} anomaly={anom} />
                ))}
              </div>
            </div>
          )}

          {/* Similar / Duplicate Project Matches */}
          {project.similarProjects && project.similarProjects.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Potentially Similar or Overlapping Works</span>
              </div>
              <p className="text-[11px] text-amber-800">
                * Note: Similarity is only an algorithmic indicator for physical cross-verification and does not legally prove duplicate billing.
              </p>
              <div className="space-y-2">
                {project.similarProjects.map((sm, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-amber-200/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-blue-700">{sm.workCode}</div>
                      <div className="font-semibold text-slate-900">{sm.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{sm.reason}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold font-mono text-xs whitespace-nowrap ml-3">
                      {sm.similarityPercentage}% Similarity
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Human Verification Workflow (Persisted to Firestore) */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Investigation & Resolution Status
              </h3>
              <span className="text-[11px] text-slate-500">
                Persisted securely to Firestore database
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
                Investigation Notes & Field Observations
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
                  <span>Save Investigation Status</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Sanction Date: {project.sanctionDate} • Expected Completion:{' '}
            {project.expectedCompletionDate}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
