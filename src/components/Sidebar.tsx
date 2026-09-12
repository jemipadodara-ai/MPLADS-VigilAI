import React, { useMemo } from 'react';
import {
  Globe,
  LayoutDashboard,
  FolderGit2,
  Users,
  MapPin,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building,
  Lock,
  LogOut,
  UserCheck,
  Compass,
  Scale,
  TrendingUp,
  ListOrdered,
  Copy,
  DollarSign,
  FileCheck2,
  ClipboardList,
  Building2,
  FileText,
  ClipboardCheck,
} from 'lucide-react';
import { isCitizenOrViewer, canMakeDecisions, isInspector } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageSelector } from './shared/LanguageSelector';

export type ActiveTab =
  | 'landing'
  | 'national-command'
  | 'decision-center'
  | 'ai-copilot'
  | 'risk-forecast'
  | 'audit-prioritization'
  | 'duplicate-detection'
  | 'cost-intelligence'
  | 'compliance-center'
  | 'inspection-workbench'
  | 'citizen-portal'
  | 'executive-briefing'
  | 'dashboard'
  | 'projects'
  | 'contractors'
  | 'map'
  | 'profile'
  | 'admin-users'
  | 'inspector-dashboard'
  | 'inspector-project'
  | 'login';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  criticalAlertsCount?: number;
  totalProjectsCount?: number;
  totalContractorsCount?: number;
  user?: any;
  onSignOut?: () => void;
  onSwitchToCitizenPortal?: () => void;
  notificationsCount?: number;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  section?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  totalProjectsCount = 22,
  user,
  onSignOut,
  notificationsCount = 0,
}) => {
  const { t } = useTranslation();

  // Navigation Items
  const navItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = [
      {
        id: 'landing',
        label: t('nav.overview', 'Platform Overview'),
        icon: Globe,
      },
      {
        id: 'national-command',
        label: t('nav.commandCenter', 'Command Center'),
        icon: Compass,
        section: t('nav.sectionDecision', 'DECISION INTELLIGENCE'),
      },
      {
        id: 'ai-copilot',
        label: t('nav.aiCopilot', 'AI Vigilance Copilot'),
        icon: Sparkles,
        badge: 'Grounded',
        section: t('nav.sectionDecision', 'DECISION INTELLIGENCE'),
      },
      {
        id: 'decision-center',
        label: t('nav.decisionCenter', 'Decision Center'),
        icon: Scale,
        badge: 'Action',
        section: t('nav.sectionDecision', 'DECISION INTELLIGENCE'),
      },
      {
        id: 'executive-briefing',
        label: t('nav.executiveBriefing', 'Executive Briefing'),
        icon: Building2,
        section: t('nav.sectionDecision', 'DECISION INTELLIGENCE'),
      },
      {
        id: 'risk-forecast',
        label: t('nav.riskForecast', 'Risk Forecast'),
        icon: TrendingUp,
        section: t('nav.sectionVigilance', 'VIGILANCE & AUDIT'),
      },
      {
        id: 'audit-prioritization',
        label: t('nav.auditPrioritization', 'Audit Prioritization'),
        icon: ListOrdered,
        section: t('nav.sectionVigilance', 'VIGILANCE & AUDIT'),
      },
      {
        id: 'duplicate-detection',
        label: t('nav.duplicateDetection', 'Duplicate Detection'),
        icon: Copy,
        section: t('nav.sectionVigilance', 'VIGILANCE & AUDIT'),
      },
      {
        id: 'cost-intelligence',
        label: t('nav.costIntelligence', 'Cost Intelligence'),
        icon: DollarSign,
        section: t('nav.sectionVigilance', 'VIGILANCE & AUDIT'),
      },
      {
        id: 'compliance-center',
        label: t('nav.complianceCenter', 'Compliance Center'),
        icon: FileCheck2,
        section: t('nav.sectionVigilance', 'VIGILANCE & AUDIT'),
      },
      {
        id: 'inspection-workbench',
        label: t('nav.inspectionWorkbench', 'Inspection Workbench'),
        icon: ClipboardList,
        section: t('nav.sectionField', 'FIELD & CITIZEN'),
      },
      {
        id: 'citizen-portal',
        label: t('nav.citizenPortal', 'Citizen Vigilance'),
        icon: Users,
        section: t('nav.sectionField', 'FIELD & CITIZEN'),
      },
      {
        id: 'dashboard',
        label: t('nav.anomalyDashboard', 'Anomaly Dashboard'),
        icon: LayoutDashboard,
        section: t('nav.sectionRegistries', 'CORE REGISTRIES'),
      },
      {
        id: 'projects',
        label: t('nav.projects', 'Projects Registry'),
        icon: FolderGit2,
        badge: totalProjectsCount,
        section: t('nav.sectionRegistries', 'CORE REGISTRIES'),
      },
      {
        id: 'contractors',
        label: t('nav.contractors', 'Contractor Registry'),
        icon: Building,
        section: t('nav.sectionRegistries', 'CORE REGISTRIES'),
      },
      {
        id: 'map',
        label: t('nav.gisMap', 'Geospatial Map'),
        icon: MapPin,
        section: t('nav.sectionRegistries', 'CORE REGISTRIES'),
      },
    ];

    if (!user) {
      items.push({
        id: 'login',
        label: t('header.officerSignIn', 'Sign In'),
        icon: Lock,
      });
    }

    return items;
  }, [t, totalProjectsCount, user]);

  // Inspector-specific nav items (strictly assigned projects & tools)
  const inspectorNavItems: NavItem[] = useMemo(() => [
    {
      id: 'landing',
      label: t('nav.overview', 'Overview'),
      icon: Globe,
    },
    {
      id: 'inspector-dashboard',
      label: t('nav.inspectorDashboard', 'My Dashboard'),
      icon: LayoutDashboard,
      section: t('nav.sectionInspector', 'FIELD INSPECTION'),
    },
    {
      id: 'inspector-project',
      label: t('nav.myAssignments', 'My Assignments'),
      icon: ClipboardCheck,
      section: t('nav.sectionInspector', 'FIELD INSPECTION'),
    },
    {
      id: 'ai-copilot',
      label: t('nav.aiChatbot', 'AI Vigilance Chatbot'),
      icon: Sparkles,
      badge: 'Grounded',
      section: t('nav.sectionInspector', 'FIELD INSPECTION'),
    },
    {
      id: 'map',
      label: t('nav.gisMap', 'Project Map'),
      icon: MapPin,
      section: t('nav.sectionInspector', 'FIELD INSPECTION'),
    },
  ], [t]);

  const userRole = (user?.role || '').toLowerCase();
  const isViewerOnly = isCitizenOrViewer(userRole) || userRole === 'citizen';
  const userIsInspector = isInspector(userRole);
  const isMinister = userRole === 'minister' || userRole === 'admin';

  // Allowed tabs for public/citizen users
  const citizenAllowedTabs: ActiveTab[] = [
    'landing',
    'citizen-portal',
    'projects',
    'map',
    'ai-copilot',
    'login',
  ];

  // Inspectors get restricted inspectorNavItems
  const visibleNavItems = userIsInspector
    ? inspectorNavItems
    : isViewerOnly
    ? navItems.filter((item) => citizenAllowedTabs.includes(item.id))
    : navItems.filter((item) => {
        // Minister does NOT need citizen social audit form
        if (isMinister && item.id === 'citizen-portal') return false;
        // Hide inspector-only tabs from non-inspectors
        if (item.id === 'inspector-dashboard' || item.id === 'inspector-project') return false;
        // Hide user accounts from standard view
        if (item.id === 'admin-users') return false;
        return true;
      });


  return (
    <aside
      id="main-sidebar"
      className={`fixed top-0 left-0 h-screen bg-white border-r border-slate-200 z-40 flex flex-col justify-between transition-all duration-300 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
      aria-label="Application Navigation"
    >
      {/* Top Header & Branding */}
      <div>
        <div className="h-16 border-b border-slate-200 flex items-center justify-between px-4">
          {!isCollapsed ? (
            <div
              className="flex items-center gap-2.5 overflow-hidden cursor-pointer"
              onClick={() => onSelectTab('landing')}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-700 flex items-center justify-center text-white font-bold shadow-xs shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="truncate">
                <div className="font-black text-sm tracking-tight text-slate-900 leading-tight">
                  {t('MPLADS', 'MPLADS')} <span className="text-indigo-600">{t('VigilAI', 'VigilAI')}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium truncate">
                  {t('Risk Monitoring', 'Risk Monitoring')}
                </div>
              </div>
            </div>
          ) : (
            <div
              className="mx-auto cursor-pointer"
              onClick={() => onSelectTab('landing')}
              title="MPLADS-VigilAI"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-700 flex items-center justify-center text-white font-bold shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          )}

          {/* Toggle Button */}
          <button
            id="sidebar-toggle-btn"
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer ${
              isCollapsed ? 'hidden' : 'block'
            }`}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Collapsed Expand Toggle */}
        {isCollapsed && (
          <div className="px-3 pt-3 flex justify-center">
            <button
              id="sidebar-expand-btn"
              onClick={onToggleCollapse}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors w-full flex justify-center cursor-pointer"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 mt-1 overflow-y-auto max-h-[calc(100vh-145px)] scrollbar-thin">
          {visibleNavItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const prevItem = visibleNavItems[idx - 1];
            const showSection = !isCollapsed && item.section && item.section !== prevItem?.section;

            return (
              <React.Fragment key={item.id}>
                {showSection && (
                  <div className="pt-3 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {item.section}
                  </div>
                )}
                <div className="relative group">
                  <button
                    id={`nav-item-${item.id}`}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                      isCollapsed ? 'justify-center p-3' : 'gap-2.5 px-3 py-2 text-left'
                    } ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-700'
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="truncate flex-1 tracking-normal">{item.label}</span>
                    )}
                    {!isCollapsed && item.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.badge === 'Action'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {typeof item.badge === 'string' ? t(item.badge, item.badge) : item.badge}
                      </span>
                    )}
                  </button>

                  {/* Tooltip for collapsed mode */}
                  {isCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                      {item.label}
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Auth Controls */}
      <div className="p-3 border-t border-slate-200">
        {!isCollapsed ? (
          <div className="space-y-2">
            {/* Language Selector in Sidebar */}
            <div className="pb-1">
              <LanguageSelector variant="sidebar" />
            </div>

            {user ? (
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                      <UserCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-slate-800 truncate leading-tight">
                        {user.name || user.displayName || user.email?.split('@')[0]}
                      </div>
                      <div className="text-[10px] text-cyan-700 font-medium capitalize">
                        {user.role ? user.role.replace('_', ' ') : 'Officer'}
                      </div>
                    </div>
                  </div>
                  {onSignOut && (
                    <button
                      onClick={onSignOut}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title={t('header.signOut', 'Sign Out')}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className={`text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded text-center ${
                  ['minister', 'admin'].includes(user?.role?.toLowerCase() || '') ? 'bg-red-100 text-red-700'
                  : ['district', 'nodal_officer', 'mp', 'analyst'].includes(user?.role?.toLowerCase() || '') ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-500'
                }`}>
                  {['minister', 'admin'].includes(user?.role?.toLowerCase() || '') ? 'Executive Access'
                   : ['district', 'nodal_officer', 'mp', 'analyst'].includes(user?.role?.toLowerCase() || '') ? 'Officer Access'
                   : 'View Only'}
                </div>
                {notificationsCount > 0 && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg text-[10px]">
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                      {notificationsCount > 9 ? '9+' : notificationsCount}
                    </span>
                    <span className="font-semibold text-amber-800">{notificationsCount} new alert{notificationsCount > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onSelectTab('login')}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t('header.officerSignIn', 'Officer Sign In')}</span>
              </button>
            )}

            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60 text-[10px] text-slate-500 leading-snug">
              Protected by MoSPI AI Vigilance Gateway
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1 text-slate-400">
            <LanguageSelector variant="compact" />
            {user && onSignOut ? (
              <button
                onClick={onSignOut}
                className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                title={t('header.signOut', 'Sign Out')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onSelectTab('login')}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-cyan-600 transition-colors cursor-pointer"
                title={t('header.officerSignIn', 'Officer Sign In')}
              >
                <Lock className="w-4 h-4 text-cyan-600" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
