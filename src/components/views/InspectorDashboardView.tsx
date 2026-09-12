import React, { useMemo } from 'react';
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Calendar,
  MapPin,
  TrendingUp,
  FileText,
  User,
  Bell,
} from 'lucide-react';
import { InspectorAssignedProject } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
import { ActiveTab } from '../Sidebar';

interface InspectorDashboardViewProps {
  assignments: InspectorAssignedProject[];
  currentUser: { name: string; email: string; department: string } | null;
  onSelectAssignment: (assignment: InspectorAssignedProject) => void;
  onNavigate: (tab: ActiveTab) => void;
}

const priorityColors: Record<string, string> = {
  P0: 'bg-rose-100 text-rose-700 border-rose-200',
  P1: 'bg-orange-100 text-orange-700 border-orange-200',
  P2: 'bg-amber-100 text-amber-700 border-amber-200',
  P3: 'bg-slate-100 text-slate-600 border-slate-200',
};

const statusColors: Record<string, string> = {
  'Pending': 'bg-blue-50 text-blue-700 border-blue-200',
  'In Progress': 'bg-amber-50 text-amber-700 border-amber-200',
  'Submitted': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Overdue': 'bg-rose-50 text-rose-700 border-rose-200',
};

const riskColors: Record<string, string> = {
  'Critical': 'text-rose-600 font-bold',
  'High': 'text-orange-600 font-bold',
  'Medium': 'text-amber-600 font-semibold',
  'Low': 'text-emerald-600 font-semibold',
};

export const InspectorDashboardView: React.FC<InspectorDashboardViewProps> = ({
  assignments,
  currentUser,
  onSelectAssignment,
  onNavigate,
}) => {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    const total = assignments.length;
    const pending = assignments.filter((a) => a.status === 'Pending').length;
    const inProgress = assignments.filter((a) => a.status === 'In Progress').length;
    const submitted = assignments.filter((a) => a.status === 'Submitted').length;
    const overdue = assignments.filter((a) => a.status === 'Overdue').length;
    return { total, pending, inProgress, submitted, overdue };
  }, [assignments]);

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date() && true;
  };

  const formatDeadline = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 p-6 text-white shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-200 uppercase tracking-wider mb-1">
              <User className="w-3.5 h-3.5" />
              <span>{t('inspector.fieldInspectionOfficer', 'Field Inspection Officer')}</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight mb-1">
              {t('inspector.welcomeBack', 'Welcome back')}, {currentUser?.name?.split(',')[0] || t('inspector.inspector', 'Inspector')}
            </h1>
            <p className="text-sm text-cyan-100 font-medium">
              {currentUser?.department}
            </p>
            {stats.overdue > 0 && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-rose-500/30 border border-rose-400/50 rounded-xl text-xs font-bold text-white">
                <Bell className="w-3.5 h-3.5 animate-pulse" />
                {stats.overdue} {t('inspector.assignmentsOverdue', 'assignment(s) are overdue — action required')}
              </div>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-3 bg-white/10 border border-white/20 rounded-2xl">
            <ClipboardCheck className="w-8 h-8 text-cyan-200" />
            <div className="text-right">
              <div className="text-2xl font-black">{stats.total}</div>
              <div className="text-xs font-semibold text-cyan-200">{t('inspector.totalAssigned', 'Total Assigned')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('inspector.pendingInspections', 'Pending')}
          value={stats.pending}
          icon={<Clock className="w-5 h-5 text-blue-500" />}
          color="blue"
        />
        <StatCard
          label={t('inspector.inProgress', 'In Progress')}
          value={stats.inProgress}
          icon={<TrendingUp className="w-5 h-5 text-amber-500" />}
          color="amber"
        />
        <StatCard
          label={t('inspector.submitted', 'Submitted')}
          value={stats.submitted}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          color="emerald"
        />
        <StatCard
          label={t('inspector.overdue', 'Overdue')}
          value={stats.overdue}
          icon={<AlertTriangle className="w-5 h-5 text-rose-500" />}
          color={stats.overdue > 0 ? 'rose' : 'slate'}
        />
      </div>

      {/* Assigned Projects */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base">
              {t('inspector.myAssignments', 'My Assigned Inspections')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('inspector.clickToInspect', 'Click on a project to start or continue the site inspection')}
            </p>
          </div>
          <button
            onClick={() => onNavigate('inspector-project')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
          >
            {t('inspector.viewAll', 'View All')} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  {t('inspector.project', 'Project')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  {t('inspector.location', 'Location')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  {t('inspector.progress', 'Progress')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  {t('inspector.deadline', 'Deadline')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  {t('inspector.status', 'Status')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  {t('inspector.priority', 'Priority')}
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignments.map((assignment) => (
                <tr
                  key={assignment.assignmentId}
                  className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                    assignment.status === 'Overdue' ? 'bg-rose-50/30' : ''
                  }`}
                  onClick={() => onSelectAssignment(assignment)}
                >
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900 text-xs leading-tight">
                      {assignment.projectTitle}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {assignment.projectWorkCode}
                    </div>
                    {assignment.riskLevel && (
                      <div className={`text-[10px] mt-0.5 ${riskColors[assignment.riskLevel] || 'text-slate-500'}`}>
                        {t('inspector.riskScore', 'Risk')}: {assignment.riskScore} — {t(`risk.${assignment.riskLevel.toLowerCase()}`, assignment.riskLevel)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{assignment.district}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{assignment.state}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-xs">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] text-slate-500 w-14">{t('inspector.physical', 'Physical')}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 min-w-[60px]">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${assignment.reportedPhysicalProgressPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-700">{assignment.reportedPhysicalProgressPct}%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 w-14">{t('inspector.financial', 'Financial')}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 min-w-[60px]">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full"
                            style={{ width: `${assignment.reportedFinancialProgressPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-700">{assignment.reportedFinancialProgressPct}%</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className={`flex items-center gap-1 text-xs font-medium ${
                      isOverdue(assignment.deadline) && assignment.status !== 'Submitted'
                        ? 'text-rose-600'
                        : 'text-slate-700'
                    }`}>
                      <Calendar className="w-3 h-3 shrink-0" />
                      {formatDeadline(assignment.deadline)}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      statusColors[assignment.status] || 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {t(`inspector.status${assignment.status.replace(' ', '')}`, assignment.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      priorityColors[assignment.priority] || 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {assignment.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectAssignment(assignment); }}
                      className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      {assignment.status === 'Submitted'
                        ? t('inspector.viewReport', 'View')
                        : t('inspector.inspect', 'Inspect')}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden divide-y divide-slate-100">
          {assignments.map((assignment) => (
            <div
              key={assignment.assignmentId}
              className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                assignment.status === 'Overdue' ? 'border-l-2 border-l-rose-500' : ''
              }`}
              onClick={() => onSelectAssignment(assignment)}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-slate-900 leading-tight truncate">
                    {assignment.projectTitle}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">{assignment.projectWorkCode}</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${priorityColors[assignment.priority]}`}>
                    {assignment.priority}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${statusColors[assignment.status] || ''}`}>
                    {t(`inspector.status${assignment.status.replace(' ', '')}`, assignment.status)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" />
                  {assignment.district}, {assignment.state}
                </span>
                <span className={`flex items-center gap-1 font-medium ${
                  isOverdue(assignment.deadline) && assignment.status !== 'Submitted'
                    ? 'text-rose-600'
                    : ''
                }`}>
                  <Calendar className="w-2.5 h-2.5" />
                  {formatDeadline(assignment.deadline)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex gap-3 text-[10px]">
                  <span className="text-slate-500">{t('inspector.physical', 'Physical')}: <span className="font-bold text-blue-600">{assignment.reportedPhysicalProgressPct}%</span></span>
                  <span className="text-slate-500">{t('inspector.financial', 'Financial')}: <span className="font-bold text-emerald-600">{assignment.reportedFinancialProgressPct}%</span></span>
                </div>
                <button className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 cursor-pointer">
                  {assignment.status === 'Submitted' ? t('inspector.viewReport', 'View') : t('inspector.inspect', 'Inspect')}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {assignments.length === 0 && (
          <div className="py-12 text-center text-slate-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">{t('inspector.noAssignments', 'No assignments found')}</p>
            <p className="text-xs mt-1">{t('inspector.noAssignmentsHint', 'Your assigned inspections will appear here')}</p>
          </div>
        )}
      </div>

      {/* Info footer */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700">
        <ClipboardCheck className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
        <div>
          <div className="font-bold">{t('inspector.importantNote', 'Important')}</div>
          <div className="mt-0.5 leading-relaxed">
            {t('inspector.rbacNote', 'You can only view and inspect projects that have been specifically assigned to you by the District Authority. Do not attempt to access or modify any other project data.')}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Helper sub-component: Stat Card
// ---------------------------------------------------------------------------
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'amber' | 'emerald' | 'rose' | 'slate';
}

const colorMap = {
  blue: 'bg-blue-50 border-blue-200',
  amber: 'bg-amber-50 border-amber-200',
  emerald: 'bg-emerald-50 border-emerald-200',
  rose: 'bg-rose-50 border-rose-200',
  slate: 'bg-slate-50 border-slate-200',
};

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => (
  <div className={`rounded-2xl border p-4 ${colorMap[color]}`}>
    <div className="flex items-center justify-between mb-2">
      {icon}
      <span className="text-2xl font-black text-slate-900">{value}</span>
    </div>
    <div className="text-xs font-bold text-slate-600">{label}</div>
  </div>
);
