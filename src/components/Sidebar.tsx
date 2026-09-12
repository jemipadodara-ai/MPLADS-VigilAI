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
  Building,
  Lock,
  LogOut,
  UserCheck,
} from 'lucide-react';

export type ActiveTab =
  | 'landing'
  | 'dashboard'
  | 'projects'
  | 'contractors'
  | 'map'
  | 'assistant-settings'
  | 'profile'
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
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  totalProjectsCount = 22,
  user,
  onSignOut,
}) => {
  // Navigation Items
  const navItems: NavItem[] = [
    {
      id: 'landing',
      label: 'Platform Overview',
      icon: Globe,
    },
    {
      id: 'dashboard',
      label: 'Risk Dashboard',
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
      label: 'Contractor Registry',
      icon: Users,
    },
    {
      id: 'map',
      label: 'Map View',
      icon: MapPin,
    },
    {
      id: 'assistant-settings',
      label: 'Settings',
      icon: Sparkles,
    },
  ];

  // If not logged in, add quick link to Officer Login
  if (!user) {
    navItems.push({
      id: 'login',
      label: 'Officer Sign In',
      icon: Lock,
    });
  }

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
                  MPLADS <span className="text-indigo-600">VigilAI</span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium truncate">
                  Risk Monitoring
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
        <nav className="p-3 space-y-1 mt-2">
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

      {/* Footer Info & Auth Controls */}
      <div className="p-3 border-t border-slate-200">
        {!isCollapsed ? (
          <div className="space-y-2">
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
                      title="Sign Out"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => onSelectTab('login')}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Officer Sign In</span>
              </button>
            )}

            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60 text-[10px] text-slate-500 leading-snug">
              Protected by MoSPI AI Vigilance Gateway
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1 text-slate-400">
            {user && onSignOut ? (
              <button
                onClick={onSignOut}
                className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onSelectTab('login')}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-cyan-600 transition-colors cursor-pointer"
                title="Sign In"
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
