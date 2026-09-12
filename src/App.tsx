import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MPLADProject,
  ContractorProfile,
  ConstituencySummary,
  InvestigationStatus,
  DiagnosticSummary,
  ProjectFilterState,
} from './types';
import {
  INITIAL_PROJECTS,
  CONTRACTOR_PROFILES,
  CONSTITUENCY_SUMMARIES,
} from './data/mpladsData';
import officialProjectsData from './data/officialMpladsIngest.json';
import { analyzeAllProjects, validateProjectData } from './utils/anomalyEngine';

// Components & Views
import { Sidebar, ActiveTab } from './components/Sidebar';
import { LandingPage } from './components/views/LandingPage';
import { LoginPage, AuthenticatedUser } from './components/views/LoginPage';
import { Dashboard } from './components/views/Dashboard';
import { Projects } from './components/views/Projects';
import { Contractors } from './components/views/Contractors';
import { GeospatialMap } from './components/views/GeospatialMap';
import { AssistantAndSettings } from './components/views/AssistantAndSettings';
import { ProjectDetails } from './components/ProjectDetails';

// New Decision Intelligence & Vigilance Views
import { NationalCommandCenter } from './components/views/NationalCommandCenter';
import { DecisionCenter } from './components/views/DecisionCenter';
import { PredictiveRiskForecastView } from './components/views/PredictiveRiskForecastView';
import { AuditPrioritizationView } from './components/views/AuditPrioritizationView';
import { DuplicateDetectionView } from './components/views/DuplicateDetectionView';
import { CostIntelligenceView } from './components/views/CostIntelligenceView';
import { ComplianceAuditView } from './components/views/ComplianceAuditView';
import { InspectionWorkbenchView } from './components/views/InspectionWorkbenchView';
import { CitizenPortalView } from './components/views/CitizenPortalView';
import { MinistryBriefingView } from './components/views/MinistryBriefingView';
import { AiAssistantView } from './components/views/AiAssistantView';
import { AdminUsersView } from './components/views/AdminUsersView';
import { useTranslation } from './i18n/LanguageContext';
import { LanguageSelector } from './components/shared/LanguageSelector';

// Firebase (for live persistence if available, with immediate local fallback)
import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';

// Icons
import {
  Globe,
  FolderGit2,
  Lock,
  UserCheck,
  LogOut,
} from 'lucide-react';

export function App() {
  const { t } = useTranslation();
  // Navigation State (Landing, Dashboard, Projects, Contractors, Map, Settings, Login)
  const [activeTab, setActiveTab] = useState<ActiveTab>('landing');
  const [loginInitialMode, setLoginInitialMode] = useState<'signin' | 'signup'>('signin');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(() => {
    try {
      const saved = localStorage.getItem('vigilai_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Modal State
  const [selectedProject, setSelectedProject] = useState<MPLADProject | null>(null);

  // Core Data
  const [rawProjects, setRawProjects] = useState<MPLADProject[]>(
    officialProjectsData && officialProjectsData.length > 0
      ? (officialProjectsData as unknown as MPLADProject[])
      : INITIAL_PROJECTS
  );
  const [contractors] = useState<ContractorProfile[]>(CONTRACTOR_PROFILES);
  const [constituencies] = useState<ConstituencySummary[]>(CONSTITUENCY_SUMMARIES);

  // Check server session on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.authenticated && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('vigilai_user_session', JSON.stringify(data.user));
        }
      })
      .catch(() => {
        // Continue with cached local state
      });
  }, []);

  // Handle successful login or account creation - redirect to home page
  const handleLoginSuccess = useCallback((user: AuthenticatedUser) => {
    setCurrentUser(user);
    localStorage.setItem('vigilai_user_session', JSON.stringify(user));
    setActiveTab('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Handle sign out
  const handleSignOut = useCallback(async () => {
    setCurrentUser(null);
    localStorage.removeItem('vigilai_user_session');
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignored
    }
    setActiveTab('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Firestore automatic listener with fallback to authentic dataset
  useEffect(() => {
    try {
      const projectsCol = collection(db, 'projects');
      const unsubscribe = onSnapshot(
        projectsCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const liveData: MPLADProject[] = snapshot.docs.map((d) => ({
              ...(d.data() as MPLADProject),
              id: d.id,
            }));
            setRawProjects(liveData);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'projects');
        }
      );
      return () => unsubscribe();
    } catch {
      // Graceful fallback to initial projects
    }
  }, []);

  // Compute risk scores and flags
  const { scoredProjects } = useMemo(() => {
    try {
      const result = analyzeAllProjects(rawProjects, contractors);
      const computedProjects = result.scoredProjects || result.projects || rawProjects;
      return { scoredProjects: computedProjects };
    } catch (err) {
      console.warn('Risk engine calculation notice:', err);
      return { scoredProjects: rawProjects };
    }
  }, [rawProjects, contractors]);

  // Update investigation status in state and Firestore
  const handleUpdateInvestigation = useCallback(
    async (projectId: string, status: InvestigationStatus, notes?: string) => {
      setRawProjects((prev) =>
        prev.map((p) =>
          p.id === projectId || p.workCode === projectId
            ? { ...p, status, notes: notes || p.notes }
            : p
        )
      );
      if (selectedProject && (selectedProject.id === projectId || selectedProject.workCode === projectId)) {
        setSelectedProject((prev) => (prev ? { ...prev, status, notes: notes || prev.notes } : null));
      }

      try {
        const docRef = doc(db, 'projects', projectId);
        await updateDoc(docRef, {
          status,
          ...(notes ? { notes } : {}),
          lastUpdated: new Date().toISOString(),
        });
      } catch {
        // Local state already updated
      }
    },
    [selectedProject]
  );

  // Notifications State & Fetch
  const [notifications, setNotifications] = useState<any[]>([]);
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    fetch('/api/notifications')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.notifications) {
          setNotifications(data.notifications.slice(0, 50));
        }
      })
      .catch(() => {});
  }, []);

  // Create a new project (officer/minister only)
  const handleCreateProject = useCallback(
    async (projectData: Partial<MPLADProject>) => {
      try {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectData),
        });
        const data = await res.json();
        if (data.success && data.project) {
          setRawProjects((prev) => [data.project as MPLADProject, ...prev]);
          return { success: true, project: data.project };
        }
        return { success: false, error: data.error || 'Failed to create project' };
      } catch (err: any) {
        console.error('Project creation error:', err);
        return { success: false, error: err.message };
      }
    },
    []
  );

  // Update an existing project
  const handleUpdateProject = useCallback(
    async (projectId: string, updates: Partial<MPLADProject>) => {
      try {
        const res = await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        const data = await res.json();
        if (data.success) {
          setRawProjects((prev) =>
            prev.map((p) => (p.id === projectId ? { ...p, ...updates } : p))
          );
          return { success: true };
        }
        return { success: false, error: data.error || 'Failed to update project' };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
    []
  );

  // ---------------------------------------------------------------------------
  // 1. PUBLIC LANDING PAGE VIEW
  // ---------------------------------------------------------------------------
  if (activeTab === 'landing') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        <LandingPage
          onEnterPortal={() => {
            setActiveTab('national-command');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onExploreProjects={() => {
            setActiveTab('projects');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateToLogin={() => {
            setLoginInitialMode('signin');
            setActiveTab('login');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateToRegister={() => {
            setLoginInitialMode('signup');
            setActiveTab('login');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSelectProject={(p) => setSelectedProject(p)}
          featuredProject={scoredProjects[0] || null}
          totalProjects={scoredProjects.length}
          totalSanctionedCr={Number(
            (
              scoredProjects.reduce((acc, p) => acc + (p.sanctionedAmountLakhs || 0), 0) /
              100
            ).toFixed(1)
          )}
          user={currentUser}
          onSignOut={handleSignOut}
        />

        {/* Project Details Modal */}
        {selectedProject && (
          <ProjectDetails
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
            onUpdateInvestigation={handleUpdateInvestigation}
          />
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. AUTHENTICATED LOGIN / REGISTRATION PAGE VIEW
  // ---------------------------------------------------------------------------
  if (activeTab === 'login') {
    return (
      <LoginPage
        initialMode={loginInitialMode}
        onLoginSuccess={handleLoginSuccess}
        onExplorePublic={() => {
          setActiveTab('landing');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // 3. MAIN APPLICATION CONSOLE VIEW
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">
      {/* 1. Collapsible Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        totalProjectsCount={scoredProjects.length}
        totalContractorsCount={contractors.length}
        user={currentUser}
        onSignOut={handleSignOut}
        notificationsCount={unreadNotificationsCount}
      />

      {/* 2. Main Application Canvas */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 shadow-2xs">
          {/* Active Tab Heading & Breadcrumbs */}
          <div className="flex items-center gap-3 overflow-hidden">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {t('header.tagline', 'MPLADS-VigilAI • Project Risk Monitoring')}
              </div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 truncate">
                {activeTab === 'national-command' && t('nav.commandCenter', 'National Command Center')}
                {activeTab === 'ai-copilot' && t('nav.aiCopilot', 'AI Grounded Vigilance Copilot')}
                {activeTab === 'decision-center' && t('nav.decisionCenter', 'Decision Center & Case Authorization')}
                {activeTab === 'executive-briefing' && t('nav.executiveBriefing', 'Executive Vigilance Briefing')}
                {activeTab === 'risk-forecast' && t('nav.riskForecast', 'Predictive Risk Forecasting')}
                {activeTab === 'audit-prioritization' && t('nav.auditPrioritization', 'Audit Prioritization Engine')}
                {activeTab === 'duplicate-detection' && t('nav.duplicateDetection', 'Duplicate Work & Asset Detection')}
                {activeTab === 'cost-intelligence' && t('nav.costIntelligence', 'Cost Intelligence & SoR Benchmarks')}
                {activeTab === 'compliance-center' && t('nav.complianceCenter', 'Statutory Compliance Center')}
                {activeTab === 'inspection-workbench' && t('nav.inspectionWorkbench', 'On-Site Inspection Workbench')}
                {activeTab === 'citizen-portal' && t('nav.citizenPortal', 'Citizen Social Audit & Verification')}
                {activeTab === 'dashboard' && t('nav.dashboard', 'Risk Dashboard')}
                {activeTab === 'projects' && t('nav.projects', 'Projects Master Registry')}
                {activeTab === 'contractors' && t('nav.contractors', 'Contractor Performance & Registry')}
                {activeTab === 'map' && t('nav.gisMap', 'Geospatial Project Map')}
                {activeTab === 'assistant-settings' && t('nav.settings', 'Platform Settings')}
                {activeTab === 'admin-users' && t('nav.adminUsers', 'User Accounts & Access Control')}
              </h1>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Global Language Selector */}
            <LanguageSelector variant="header" />

            {/* User Profile Badge or Sign In Button */}
            {currentUser ? (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs">
                <div className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-[10px]">
                  <UserCheck className="w-3 h-3" />
                </div>
                <div className="leading-tight text-left">
                  <div className="font-bold text-slate-800 text-[11px] leading-none">
                    {currentUser.name}
                  </div>
                  <div className="text-[9px] font-medium text-slate-500 uppercase tracking-wide">
                    {currentUser.role.replace('_', ' ')}
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="ml-1 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors p-1"
                  title={t('header.signOut', 'Sign Out')}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="header-signin-btn"
                onClick={() => setActiveTab('login')}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title={t('header.officerSignIn', 'Officer Sign In')}
              >
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t('header.officerSignIn', 'Officer Sign In')}</span>
              </button>
            )}

            {/* Return to Platform Overview */}
            <button
              id="header-overview-btn"
              onClick={() => setActiveTab('landing')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title={t('header.overviewBtn', 'Return to Platform Overview')}
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t('header.overviewBtn', 'Overview')}</span>
            </button>

            {/* Quick Link to Projects */}
            {activeTab !== 'projects' && (
              <button
                id="header-projects-btn"
                onClick={() => setActiveTab('projects')}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>
                  {t('header.projectsBtn', 'Projects')} ({scoredProjects.length})
                </span>
              </button>
            )}
          </div>
        </header>

        {/* 3. Primary Content Area Based on Active Tab */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Tab: National Command Center */}
          {activeTab === 'national-command' && (
            <NationalCommandCenter
              projects={scoredProjects}
              onNavigateToDecisionCenter={() => setActiveTab('decision-center')}
              onNavigateToAuditPrioritization={() => setActiveTab('audit-prioritization')}
              onNavigateToDuplicateDetection={() => setActiveTab('duplicate-detection')}
              onNavigateToCostIntelligence={() => setActiveTab('cost-intelligence')}
              onInspectProject={(p) => setSelectedProject(p)}
            />
          )}

          {/* Tab: AI Copilot */}
          {activeTab === 'ai-copilot' && (
            <AiAssistantView
              projects={scoredProjects}
              currentUser={currentUser}
              onSelectProjectByWorkCode={(code) => {
                const found = scoredProjects.find(
                  (p) => p.workCode === code || p.id === code
                );
                if (found) setSelectedProject(found);
              }}
            />
          )}

          {/* Tab: Decision Center */}
          {activeTab === 'decision-center' && (
            <DecisionCenter
              projects={scoredProjects}
              onInspectProject={(p) => setSelectedProject(p)}
              currentUser={currentUser}
            />
          )}

          {/* Tab: Executive Briefing */}
          {activeTab === 'executive-briefing' && (
            <MinistryBriefingView
              projects={scoredProjects}
              onNavigateToDecisionCenter={() => setActiveTab('decision-center')}
            />
          )}

          {/* Tab: Predictive Risk Forecast */}
          {activeTab === 'risk-forecast' && (
            <PredictiveRiskForecastView
              projects={scoredProjects}
              onInspectProject={(p) => setSelectedProject(p)}
            />
          )}

          {/* Tab: Audit Prioritization */}
          {activeTab === 'audit-prioritization' && (
            <AuditPrioritizationView
              projects={scoredProjects}
              onInspectProject={(p) => setSelectedProject(p)}
              currentUser={currentUser}
            />
          )}

          {/* Tab: Duplicate Detection */}
          {activeTab === 'duplicate-detection' && (
            <DuplicateDetectionView
              projects={scoredProjects}
              onInspectProject={(p) => setSelectedProject(p)}
              currentUser={currentUser}
            />
          )}

          {/* Tab: Cost Intelligence */}
          {activeTab === 'cost-intelligence' && (
            <CostIntelligenceView
              projects={scoredProjects}
              onInspectProject={(p) => setSelectedProject(p)}
            />
          )}

          {/* Tab: Compliance Center */}
          {activeTab === 'compliance-center' && (
            <ComplianceAuditView
              projects={scoredProjects}
              onInspectProject={(p) => setSelectedProject(p)}
              currentUser={currentUser}
            />
          )}

          {/* Tab: Inspection Workbench */}
          {activeTab === 'inspection-workbench' && (
            <InspectionWorkbenchView
              projects={scoredProjects}
              onInspectProject={(p) => setSelectedProject(p)}
              currentUser={currentUser}
            />
          )}

          {/* Tab: Citizen Portal */}
          {activeTab === 'citizen-portal' && (
            <CitizenPortalView
              projects={scoredProjects}
              onInspectProject={(p) => setSelectedProject(p)}
            />
          )}

          {/* Tab: Dashboard */}
          {activeTab === 'dashboard' && (
            <Dashboard
              projects={scoredProjects}
              constituencies={constituencies}
              onInspectProject={(p) => setSelectedProject(p)}
              onNavigateToProjects={() => setActiveTab('projects')}
              onNavigateToContractors={() => setActiveTab('contractors')}
            />
          )}

          {/* Tab: Projects Registry */}
          {activeTab === 'projects' && (
            <Projects
              projects={scoredProjects}
              onInspectProject={(p) => setSelectedProject(p)}
              currentUser={currentUser}
              onCreateProject={handleCreateProject}
              onUpdateProject={handleUpdateProject}
            />
          )}

          {/* Tab: Contractors */}
          {activeTab === 'contractors' && (
            <Contractors
              projects={scoredProjects}
              contractorProfiles={contractors}
              onInspectProject={(p) => setSelectedProject(p)}
            />
          )}

          {/* Tab: Map */}
          {activeTab === 'map' && (
            <GeospatialMap
              projects={scoredProjects}
              onInspectProject={(p) => setSelectedProject(p)}
            />
          )}

          {/* Tab: Settings */}
          {activeTab === 'assistant-settings' && (
            <AssistantAndSettings
              projects={scoredProjects}
              currentUser={currentUser}
              onSelectProjectByWorkCode={(code) => {
                const found = scoredProjects.find(
                  (p) => p.workCode === code || p.id === code
                );
                if (found) setSelectedProject(found);
              }}
            />
          )}

          {/* Tab: User Accounts & Roles (Admin) */}
          {activeTab === 'admin-users' && (
            <AdminUsersView currentUser={currentUser} />
          )}
        </main>
      </div>

      {/* 4. Centered Project Details Modal */}
      {selectedProject && (
        <ProjectDetails
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onUpdateInvestigation={handleUpdateInvestigation}
        />
      )}
    </div>
  );
}

export default App;
