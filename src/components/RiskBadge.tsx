import React from 'react';
import { RiskLevel } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface RiskBadgeProps {
  level: RiskLevel | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  size = 'sm',
  showDot = true,
  className = '',
}) => {
  const { t } = useTranslation();
  const normLevel = (level || 'Low').toString().toLowerCase();

  let styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let dotColor = 'bg-emerald-500';
  let label = 'Low Risk';

  if (normLevel.includes('crit') || normLevel === 'critical') {
    styles = 'bg-rose-50 text-rose-700 border-rose-200';
    dotColor = 'bg-rose-500';
    label = 'Critical Risk';
  } else if (normLevel.includes('high') || normLevel === 'high') {
    styles = 'bg-orange-50 text-orange-700 border-orange-200';
    dotColor = 'bg-orange-500';
    label = 'High Risk';
  } else if (normLevel.includes('med') || normLevel === 'medium') {
    styles = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
    label = 'Medium Risk';
  }

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-xs',
    lg: 'px-3.5 py-2 text-sm',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold border rounded-full whitespace-nowrap shadow-2xs ${styles} ${sizeClasses} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />}
      <span>{t(label, label)}</span>
    </span>
  );
};
