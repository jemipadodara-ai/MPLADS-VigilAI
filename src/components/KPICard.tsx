import React from 'react';

interface KPICardProps {
  id?: string;
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  badge?: {
    text: string;
    variant?: 'neutral' | 'warning' | 'danger' | 'success';
  };
  onClick?: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({
  id,
  title,
  value,
  subtext,
  icon,
  badge,
  onClick,
}) => {
  const badgeStyles = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }[badge?.variant || 'neutral'];

  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:border-slate-300' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          <div className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 shrink-0">
          {icon}
        </div>
      </div>

      {(subtext || badge) && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {subtext && <span className="text-slate-500">{subtext}</span>}
          {badge && (
            <span
              className={`px-2 py-0.5 rounded-md font-medium border text-[11px] ${badgeStyles}`}
            >
              {badge.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
