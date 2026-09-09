import React from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  ShieldAlert,
  SearchCode,
  MapPin,
  Building2,
  Sparkles,
  DatabaseZap,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  LogOut,
  UserCheck,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'projects'
  | 'risk-center'
  | 'anomalies'
  | 'map'
  | 'contractors'
  | 'ai-assistant'
  | 'data-quality'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  criticalAlertsCount?: number;
  user?: {
    email?: string | null;
    displayName?: string | null;
    isAnonymous?: boolean;
    role?: 'admin' | 'standard';
  } | null;
  onSignOut?: () => void;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'risk-center', label: 'Risk Center', icon: ShieldAlert, badge: undefined },
  { id: 'anomalies', label: 'Anomalies', icon: SearchCode },
  { id: 'map', label: 'Map View', icon: MapPin },
  { id: 'contractors', label: 'Contractors', icon: Building2 },
  { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles },
  { id: 'data-quality', label: 'Data Quality', icon: DatabaseZap },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  criticalAlertsCount = 0,
  user,
  onSignOut,
}) => {
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
        <div className="h-16 border-b border-slate-200/80 flex items-center justify-between px-4">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-bold shadow-xs shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="truncate">
                <div className="font-extrabold text-sm tracking-tight text-slate-900 leading-tight">
                  MPLADS VigilAI
                </div>
                <div className="text-[10px] text-slate-500 font-medium truncate">
                  Govt. Risk Intelligence
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-bold shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          )}

          {/* Toggle Button */}
          <button
            id="sidebar-toggle-btn"
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors ${
              isCollapsed ? 'hidden' : 'block'
            }`}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Collapsed Expand Toggle (Shown at top when collapsed) */}
        {isCollapsed && (
          <div className="px-3 pt-3 flex justify-center">
            <button
              id="sidebar-expand-btn"
              onClick={onToggleCollapse}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors w-full flex justify-center"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 mt-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const badgeCount = item.id === 'risk-center' ? criticalAlertsCount : item.badge;

            return (
              <div key={item.id} className="relative group">
                <button
                  id={`nav-item-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center rounded-xl font-semibold text-xs transition-all ${
                    isCollapsed
                      ? 'justify-center p-3'
                      : 'gap-3 px-3 py-2.5 text-left'
                  } ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-blue-700' : 'text-slate-500 group-hover:text-slate-800'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="truncate flex-1 tracking-normal">{item.label}</span>
                  )}
                  {!isCollapsed && badgeCount && badgeCount > 0 ? (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                      {badgeCount}
                    </span>
                  ) : null}
                </button>

                {/* Tooltip for collapsed mode */}
                {isCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                    {item.label}
                    {badgeCount && badgeCount > 0 ? ` (${badgeCount})` : ''}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Sign Out Footer */}
      <div className="p-3 border-t border-slate-200/80 space-y-2">
        {!isCollapsed ? (
          <div className="space-y-2">
            {/* User Account Info */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {user?.email ? user.email.split('@')[0] : 'Auditor Official'}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${
                        user?.role === 'admin' ? 'bg-blue-600' : 'bg-slate-400'
                      }`}
                    />
                    <span>
                      {user?.role === 'admin'
                        ? 'Admin Official'
                        : user?.isAnonymous
                        ? 'Guest Auditor'
                        : 'Standard Auditor'}
                    </span>
                  </div>
                </div>
              </div>

              {onSignOut && (
                <button
                  id="sidebar-signout-btn"
                  onClick={onSignOut}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {onSignOut && (
              <button
                id="sidebar-signout-btn-collapsed"
                onClick={onSignOut}
                className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
