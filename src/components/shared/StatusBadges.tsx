import React from 'react';
import { PriorityLevel, ResponsibleAuthority, FraudStatus, CaseStatus } from '../../types';
import { AlertTriangle, ShieldCheck, Clock, Eye, AlertOctagon, FileCheck2, Building2 } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

export const PriorityBadge: React.FC<{ priority: PriorityLevel }> = ({ priority }) => {
  const { t } = useTranslation();
  const styles: Record<PriorityLevel, { bg: string; text: string; label: string; border: string }> = {
    P0: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'P0 Immediate' },
    P1: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', label: 'P1 High' },
    P2: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', label: 'P2 Normal' },
    P3: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', label: 'P3 Monitor' },
  };

  const s = styles[priority] || styles.P2;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border ${s.bg} ${s.text} ${s.border}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {t(s.label, s.label)}
    </span>
  );
};

export const ResponsibleAuthorityBadge: React.FC<{ authority: ResponsibleAuthority }> = ({ authority }) => {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 text-xs font-medium">
      <Building2 className="w-3.5 h-3.5 text-slate-500" />
      <span>{t(authority, authority)}</span>
    </span>
  );
};

export const FraudStatusBadge: React.FC<{ status: FraudStatus }> = ({ status }) => {
  const { t } = useTranslation();
  const config: Record<FraudStatus, { label: string; bg: string; text: string; border: string; icon: any }> = {
    NOT_ESTABLISHED: {
      label: 'Not Established (Routine Oversight)',
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      border: 'border-slate-200',
      icon: Eye,
    },
    REQUIRES_VERIFICATION: {
      label: 'Requires Physical Verification',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      icon: AlertTriangle,
    },
    UNDER_INVESTIGATION: {
      label: 'Under Administrative Inquiry',
      bg: 'bg-indigo-50',
      text: 'text-indigo-800',
      border: 'border-indigo-200',
      icon: Clock,
    },
    SUBSTANTIATED: {
      label: 'Discrepancy Formally Established',
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-200',
      icon: AlertOctagon,
    },
    CLOSED: {
      label: 'Verified & Reconciled',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      icon: ShieldCheck,
    },
  };

  const c = config[status] || config.REQUIRES_VERIFICATION;
  const Icon = c.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{t(c.label, c.label)}</span>
    </span>
  );
};

export const CaseStatusBadge: React.FC<{ status: CaseStatus }> = ({ status }) => {
  const { t } = useTranslation();
  const map: Record<CaseStatus, { bg: string; text: string; border: string }> = {
    New: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'Under Review': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    'Inspection Assigned': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    'Evidence Pending': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    'Action Required': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    'Under Investigation': { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
    Resolved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    Closed: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
    'False Positive': { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
  };

  const s = map[status] || map.New;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${s.bg} ${s.text} ${s.border}`}>
      {t(status, status)}
    </span>
  );
};
