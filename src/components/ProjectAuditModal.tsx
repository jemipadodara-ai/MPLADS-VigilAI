import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  X,
  Sparkles,
  ShieldAlert,
  FileText,
  AlertTriangle,
  Building2,
  Calendar,
  IndianRupee,
  Copy,
  Check,
  Download,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MPLADProject, ProjectAuditResult } from '../types';

interface ProjectAuditModalProps {
  project: MPLADProject | null;
  onClose: () => void;
  initialAuditResult?: ProjectAuditResult | null;
}

export const ProjectAuditModal: React.FC<ProjectAuditModalProps> = ({
  project,
  onClose,
  initialAuditResult,
}) => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'audit' | 'memo'>('audit');
  const [auditResult, setAuditResult] = useState<ProjectAuditResult | null>(initialAuditResult || null);
  const [memoText, setMemoText] = useState<string>('');
  const [loadingAudit, setLoadingAudit] = useState<boolean>(false);
  const [loadingMemo, setLoadingMemo] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  if (!project) return null;

  const runGeminiAudit = async () => {
    setLoadingAudit(true);
    try {
      const res = await fetch('/api/ai/audit-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project, language }),
      });
      const data = await res.json();
      if (data.analysis) {
        setAuditResult(data.analysis);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAudit(false);
    }
  };

  const generateStatutoryMemo = async () => {
    setActiveTab('memo');
    if (memoText) return; // already generated
    setLoadingMemo(true);
    try {
      const res = await fetch('/api/ai/generate-memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project, language }),
      });
      const data = await res.json();
      if (data.memo) {
        setMemoText(data.memo);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMemo(false);
    }
  };

  const copyMemo = () => {
    navigator.clipboard.writeText(memoText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-5 bg-white border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                {project.workCode}
              </span>
              <span
                className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                  project.riskLevel === 'Critical'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : project.riskLevel === 'High'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                Risk {project.overallRiskScore}/100 ({project.riskLevel})
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1.5 leading-snug">{project.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {project.constituency} ({project.state}) • MP: {project.mpName} • Agency: {project.implementingAgency}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="px-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-3 px-3.5 border-b-2 font-bold flex items-center gap-2 transition-colors ${
                activeTab === 'audit'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Gemini Forensic Findings
            </button>

            <button
              onClick={generateStatutoryMemo}
              className={`py-3 px-3.5 border-b-2 font-bold flex items-center gap-2 transition-colors ${
                activeTab === 'memo'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Statutory Show-Cause Memo
            </button>
          </div>

          {activeTab === 'audit' && (
            <button
              onClick={runGeminiAudit}
              disabled={loadingAudit}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingAudit ? 'animate-spin' : ''}`} />
              {loadingAudit ? 'Auditing...' : 'Re-Run AI Audit'}
            </button>
          )}

          {activeTab === 'memo' && memoText && (
            <button
              onClick={copyMemo}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs flex items-center gap-1.5 transition-all"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied to Clipboard' : 'Copy Notice Text'}
            </button>
          )}
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs leading-relaxed">
          {activeTab === 'audit' && (
            <>
              {!auditResult && !loadingAudit && (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <Sparkles className="h-8 w-8 text-indigo-600 mx-auto" />
                  <div className="text-sm font-bold text-slate-900">Perform Deep AI Forensic Cross-Examination</div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Gemini will analyze work order logs, contractor histories, tender parameters, and spatial coordinate records against MoSPI 2023 Guidelines.
                  </p>
                  <button
                    onClick={runGeminiAudit}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
                  >
                    Run AI Audit Inspection Now
                  </button>
                </div>
              )}

              {loadingAudit && (
                <div className="p-12 text-center text-slate-500 space-y-3">
                  <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
                  <div className="text-sm font-semibold text-slate-800">
                    Gemini Flash is analyzing project telemetry & tender registers...
                  </div>
                </div>
              )}

              {auditResult && !loadingAudit && (
                <div className="space-y-4">
                  {/* Executive Summary Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                        Executive Forensic Assessment
                      </span>
                      <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                        Exposure: {auditResult.financialImpact}
                      </span>
                    </div>
                    <p className="text-slate-700 text-xs leading-relaxed">{auditResult.summary}</p>
                  </div>

                  {/* Detected Anomalies */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-red-600" />
                      Specific Violations & MoSPI Guideline Citations:
                    </h4>
                    <div className="space-y-2">
                      {auditResult.detectedAnomalies.map((anom, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs">{anom.title}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-bold">
                              {anom.severity}
                            </span>
                          </div>
                          <p className="text-slate-600 text-xs mt-1">{anom.finding}</p>
                          <div className="text-[11px] text-indigo-700 font-semibold pt-1">
                            Clause: {anom.guidelineClause}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                    <h4 className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Recommended Vigilance Directives for District Magistrate:
                    </h4>
                    <ul className="space-y-1.5 text-slate-700">
                      {auditResult.statutoryRecommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-600 font-bold">✓</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Evidence Checklist */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-900 text-xs">Evidence Demanded for Sub-Divisional Inquiry:</h4>
                    <ul className="space-y-1 text-slate-600">
                      {auditResult.evidenceRequested.map((ev, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-slate-400">•</span>
                          <span>{ev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'memo' && (
            <>
              {loadingMemo ? (
                <div className="p-12 text-center text-slate-500 space-y-3">
                  <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
                  <div className="text-sm font-semibold text-slate-800">
                    Drafting official statutory show-cause notice based on MoSPI protocol...
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Drafted for: Office of District Magistrate & Nodal District Authority</span>
                    <span>Standard Government Dispatch Format</span>
                  </div>

                  <pre className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-800 leading-relaxed whitespace-pre-wrap select-all overflow-x-auto">
                    {memoText}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Audit reference: MoSPI/MPLADS/VigilAI/2026
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </motion.div>
    </div>
  );
};
