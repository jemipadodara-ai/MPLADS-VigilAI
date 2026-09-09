import React from 'react';
import { DetectedAnomaly } from '../types';
import { RiskBadge } from './RiskBadge';
import { AlertCircle, CheckCircle2, ShieldAlert, FileText } from 'lucide-react';

interface AnomalyCardProps {
  anomaly: DetectedAnomaly;
  onActionClick?: (action: string) => void;
}

export const AnomalyCard: React.FC<AnomalyCardProps> = ({ anomaly, onActionClick }) => {
  const categoryIcon = {
    Financial: AlertCircle,
    Progress: AlertCircle,
    Cost: AlertCircle,
    Duplicate: ShieldAlert,
    Contractor: ShieldAlert,
    'Data Quality': FileText,
  }[anomaly.category] || AlertCircle;

  const Icon = categoryIcon;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-xs transition-all space-y-3.5">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 shrink-0 mt-0.5">
            <Icon className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {anomaly.category} Anomaly
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 mt-0.5">{anomaly.title}</h4>
          </div>
        </div>

        <RiskBadge level={anomaly.severity} size="sm" />
      </div>

      {/* Description & Indicator */}
      <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 space-y-2">
        <p className="text-xs text-slate-700 leading-relaxed font-normal">
          {anomaly.description}
        </p>

        {anomaly.indicator && (
          <div className="text-[11px] font-mono font-semibold text-slate-800 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/70 inline-block">
            {anomaly.indicator}
          </div>
        )}
      </div>

      {/* Evidence & Guideline */}
      <div className="space-y-1.5 text-xs">
        {anomaly.evidence && (
          <div className="text-slate-600">
            <strong className="font-semibold text-slate-800">Observed Evidence: </strong>
            {anomaly.evidence}
          </div>
        )}

        {anomaly.guidelineRule && (
          <div className="text-[11px] text-slate-500">
            <strong className="font-semibold text-slate-700">Guideline: </strong>
            {anomaly.guidelineRule}
          </div>
        )}
      </div>

      {/* Recommended Verification Actions */}
      {anomaly.recommendedActions && anomaly.recommendedActions.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Recommended Verification Actions:
          </div>
          <ul className="space-y-1.5">
            {anomaly.recommendedActions.map((act, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Mandatory Regulatory Disclaimer */}
      <div className="text-[10px] text-slate-600 font-medium italic pt-1">
        * Note: Automated indicators highlight anomalies for inspection. Final determinations require authorized physical verification.
      </div>
    </div>
  );
};
