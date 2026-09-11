import React from 'react';
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
  Shield,
  LogOut,
  UserCheck,
  User,
  AlertTriangle,
} from 'lucide-react';

export type ActiveTab =
  | 'landing'
  | 'dashboard'
  | 'projects'
  | 'contractors'
  | 'map'
  | 'assistant-settings'
  | 'profile';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  criticalAlertsCount?: number;
  totalProjectsCount?: number;
  totalContractorsCount?: number;
  user?: {
    email?: string | null;
    displayName?: string | null;
    isAnonymous?: boolean;
    role?: 'admin' | 'standard' | 'citizen';
  } | null;
  onSignOut?: () => void;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  adminOnly?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  criticalAlertsCount = 0,
  totalProjectsCount = 22,
  user,
  onSignOut,
}) => {
  const isAdmin = user?.role === 'admin';

  // Core Navigation Items
  const navItems: NavItem[] = [
    {
      id: 'landing',
      label: 'Landing Page',
      icon: Globe,
    },
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'projects',
      label: 'Projects Registry',
      icon: FolderGit2,
      badge: totalProjectsCount,
    },
    {
      id: 'contractors',
      label: 'Contractor Performance',
      icon: Users,
    },
    {
      id: 'map',
      label: 'Geospatial Map',
      icon: MapPin,
    },
    {
      id: 'assistant-settings',
      label: 'AI Assistant & Settings',
      icon: Sparkles,
      adminOnly: false,
    },
  ];

  return (
    <aside
      id="main-sidebar"
      className={`fixed top-0 left-0 h-screen bg-white border-r border-slate-200/90 z-40 flex flex-col justify-between transition-all duration-300 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
      aria-label="Application Navigation"
    >
      {/* Top Header & Branding */}
      <div>
        <div className="h-16 border-b border-slate-200/80 flex items-center justify-between px-4">
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
                  MPLADS <span className="text-indigo-600">VigilAI</span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium truncate">
                  Civic Intelligence
                </div>
              </div>
            </div>
          ) : (
            <div
              className="mx-auto cursor-pointer"
              onClick={() => onSelectTab('landing')}
              title="NigraniAI - MPLADS VigilAI"
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
            className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors ${
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
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors w-full flex justify-center"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* District Nodal Pill */}
        {!isCollapsed && (
          <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium truncate">Ahmedabad / District Nodal</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[9px] border border-slate-200">
              Official
            </span>
          </div>
        )}

        {/* 5 Core Navigation Items */}
        <nav className="p-3 space-y-1 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <div key={item.id} className="relative group">
                <button
                  id={`nav-item-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                    isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5 text-left'
                  } ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/80 shadow-2xs'
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
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                      {item.badge}
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
            );
          })}
        </nav>
      </div>

      {/* User Profile & Sign Out Footer */}
      <div className="p-3 border-t border-slate-200/80 space-y-2">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div
              id="sidebar-user-profile-card"
              className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {user?.displayName || (user?.email ? user.email.split('@')[0] : 'Vikram Malhotra, IAS')}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${
                        isAdmin ? 'bg-indigo-600' : 'bg-emerald-500'
                      }`}
                    />
                    <span>
                      {isAdmin ? 'District Audit Officer' : 'Monitoring Officer'}
                    </span>
                  </div>
                </div>
              </div>

              {onSignOut && (
                <button
                  id="sidebar-signout-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSignOut();
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
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
            <div
              className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold"
              title="Auditor Officer Terminal"
            >
              <User className="w-4 h-4" />
            </div>
            {onSignOut && (
              <button
                id="sidebar-signout-btn-collapsed"
                onClick={onSignOut}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
