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
import { Dashboard } from './components/views/Dashboard';
import { Projects } from './components/views/Projects';
import { Contractors } from './components/views/Contractors';
import { GeospatialMap } from './components/views/GeospatialMap';
import { AssistantAndSettings } from './components/views/AssistantAndSettings';
import { ProjectDetails } from './components/ProjectDetails';

// Firebase (for live persistence if available, with immediate local fallback)
import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';

// Icons
import {
  Globe,
  FolderGit2,
} from 'lucide-react';

export function App() {
  // Navigation State (Landing, Dashboard, Projects, Contractors, Map, Settings)
  const [activeTab, setActiveTab] = useState<ActiveTab>('landing');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

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

  // ---------------------------------------------------------------------------
  // 1. PUBLIC LANDING PAGE VIEW
  // ---------------------------------------------------------------------------
  if (activeTab === 'landing') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        <LandingPage
          onEnterPortal={() => {
            setActiveTab('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onExploreProjects={() => {
            setActiveTab('projects');
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
  // 2. MAIN APPLICATION CONSOLE VIEW (Direct Access Without Authentication)
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
                MPLADS-VigilAI • Project Risk Monitoring
              </div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 truncate">
                {activeTab === 'dashboard' && 'Risk Dashboard'}
                {activeTab === 'projects' && 'Projects Master Registry'}
                {activeTab === 'contractors' && 'Contractor Performance & Registry'}
                {activeTab === 'map' && 'Geospatial Project Map'}
                {activeTab === 'assistant-settings' && 'Platform Settings'}
              </h1>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Return to Platform Overview */}
            <button
              id="header-overview-btn"
              onClick={() => setActiveTab('landing')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Return to Platform Overview"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>Overview</span>
            </button>

            {/* Quick Link to Projects */}
            {activeTab !== 'projects' && (
              <button
                id="header-projects-btn"
                onClick={() => setActiveTab('projects')}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>Projects ({scoredProjects.length})</span>
              </button>
            )}
          </div>
        </header>

        {/* 3. Primary Content Area Based on Active Tab */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
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
              onSelectProjectByWorkCode={(code) => {
                const found = scoredProjects.find(
                  (p) => p.workCode === code || p.id === code
                );
                if (found) setSelectedProject(found);
              }}
            />
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
