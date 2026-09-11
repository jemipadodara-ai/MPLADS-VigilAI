import React from 'react';
import { RiskLevel } from '../types';

interface RiskScoreProps {
  score: number;
  level?: RiskLevel;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  showBar?: boolean;
}

export const RiskScore: React.FC<RiskScoreProps> = ({
  score,
  level,
  size = 'md',
  showLabel = true,
  showBar = false,
}) => {
  const cleanScore = Math.min(100, Math.max(0, Math.round(score || 0)));

  // Determine level if not provided or to ensure exact score alignment
  let computedLevel: RiskLevel = level || 'Low';
  if (!level || (level === 'Low' && cleanScore >= 40) || (level === 'Medium' && cleanScore >= 70)) {
    if (cleanScore >= 70) computedLevel = 'High';
    else if (cleanScore >= 40) computedLevel = 'Medium';
    else computedLevel = 'Low';
  }

  const levelTheme = {
    Low: {
      text: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      bar: 'bg-emerald-500',
      pill: 'bg-emerald-100 text-emerald-800',
    },
    Medium: {
      text: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      bar: 'bg-amber-500',
      pill: 'bg-amber-100 text-amber-800',
    },
    High: {
      text: 'text-orange-700',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      bar: 'bg-orange-500',
      pill: 'bg-orange-100 text-orange-800',
    },
    Critical: {
      text: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      bar: 'bg-rose-500',
      pill: 'bg-rose-100 text-rose-800',
    },
  }[computedLevel];

  if (size === 'xl') {
    return (
      <div className={`p-5 rounded-2xl border ${levelTheme.border} ${levelTheme.bg} flex flex-col items-center text-center shadow-xs`}>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Risk Score</span>
        <div className="flex items-baseline gap-1">
          <span className={`text-4xl font-extrabold tracking-tight ${levelTheme.text}`}>{cleanScore}</span>
          <span className="text-slate-400 font-semibold text-base">/ 100</span>
        </div>
        <div className={`mt-2.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${levelTheme.pill}`}>
          {computedLevel} Risk
        </div>
        {showBar && (
          <div className="w-full bg-slate-200/80 rounded-full h-2 mt-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${levelTheme.bar}`}
              style={{ width: `${cleanScore}%` }}
            />
          </div>
        )}
        <div className="text-[11px] text-slate-500 mt-2 font-medium">
          Scale: 0–30 Low • 31–60 Medium • 61–80 High • 81–100 Critical
        </div>
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center border font-black ${levelTheme.border} ${levelTheme.bg} ${levelTheme.text}`}>
          <span className="text-lg leading-none">{cleanScore}</span>
          <span className="text-[9px] text-slate-400 font-semibold mt-0.5">/100</span>
        </div>
        {showLabel && (
          <div>
            <div className={`text-xs font-bold uppercase tracking-wider ${levelTheme.text}`}>
              {computedLevel} Risk
            </div>
            <div className="text-[11px] text-slate-500">Anomaly Index</div>
          </div>
        )}
      </div>
    );
  }

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-lg border ${levelTheme.border} ${levelTheme.bg} ${levelTheme.text}`}>
        <span>{cleanScore}</span>
        <span className="text-slate-400 font-normal">/100</span>
      </span>
    );
  }

  // Default 'md'
  return (
    <div className="inline-flex items-center gap-2">
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-bold ${levelTheme.border} ${levelTheme.bg} ${levelTheme.text}`}>
        {cleanScore} <span className="text-slate-400 font-normal ml-0.5">/100</span>
      </span>
      {showLabel && (
        <span className={`text-xs font-semibold ${levelTheme.text}`}>
          {computedLevel}
        </span>
      )}
    </div>
  );
};
