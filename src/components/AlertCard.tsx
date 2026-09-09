import React, { useState } from 'react';
import { Alert } from '../types';
import { RiskBadge } from './RiskBadge';
import { ShieldAlert, CheckCircle2, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

interface AlertCardProps {
  alert: Alert;
  onStatusChange?: (alertId: string, newStatus: string) => Promise<void>;
  onInspect?: () => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onStatusChange,
  onInspect,
}) => {
  const [currentStatus, setCurrentStatus] = useState(alert.status || 'New');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusSelect = async (newStatus: string) => {
    setCurrentStatus(newStatus as any);
    if (onStatusChange) {
      setIsUpdating(true);
      try {
        await onStatusChange(alert.id, newStatus);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-xs transition-all space-y-3">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 shrink-0 mt-0.5">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">{alert.constituencyName}</span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] text-slate-500 font-medium">{alert.timestamp}</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 mt-0.5 leading-snug">
              {alert.title}
            </h4>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <RiskBadge level={alert.severity} size="sm" />
          {alert.financialExposure && (
            <span className="text-[11px] font-mono font-bold text-slate-700">
              Exp: {alert.financialExposure}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-600 leading-relaxed pl-11">
        {alert.description}
      </p>

      {/* Recommended Action */}
      {alert.recommendedAction && (
        <div className="pl-11 pt-1 text-xs">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 text-slate-700 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-slate-900">Recommended Action: </strong>
              {alert.recommendedAction}
            </div>
          </div>
        </div>
      )}

      {/* Footer / Status change */}
      <div className="pl-11 pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500">Status:</span>
          <select
            value={currentStatus}
            disabled={isUpdating}
            onChange={(e) => handleStatusSelect(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="New">New</option>
            <option value="Under Review">Under Review</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        {onInspect && (
          <button
            onClick={onInspect}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 transition-colors"
          >
            <span>Review Constituency</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
