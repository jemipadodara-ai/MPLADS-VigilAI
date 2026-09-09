import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MPLADProject,
  ContractorProfile,
  Alert,
  InvestigationStatus,
} from './types';
import { analyzeAllProjects } from './utils/anomalyEngine';
import { INITIAL_PROJECTS, CONTRACTOR_PROFILES } from './data/mpladsData';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { ProjectDetails } from './components/ProjectDetails';
import { Login } from './components/views/Login';
import { SignUp } from './components/views/SignUp';
import { DashboardView } from './components/views/DashboardView';
import { ProjectsView } from './components/views/ProjectsView';
import { RiskCenterView } from './components/views/RiskCenterView';
import { AnomalyExplorerView } from './components/views/AnomalyExplorerView';
import { MapView } from './components/MapView';
import { ContractorAnalyticsView } from './components/views/ContractorAnalyticsView';
import { AiAssistantView } from './components/views/AiAssistantView';
import { DataQualityView } from './components/views/DataQualityView';
import { SettingsView } from './components/views/SettingsView';
import { Menu, ShieldCheck, RefreshCw, Sparkles, LogOut, Radio } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';

export interface AuthUserInfo {
  uid?: string;
  email: string | null;
  displayName?: string | null;
  isAnonymous?: boolean;
  role?: 'admin' | 'standard';
}

const ADMIN_EMAILS = [
  'jemipadodara@gmail.com',
  'auditor@vigilai.gov.in',
  'admin@vigilai.gov.in',
];

export function App() {
  // Authentication state & view toggle
  const [currentUser, setCurrentUser] = useState<AuthUserInfo | null>(() => {
    try {
      const saved = localStorage.getItem('mplads_auth_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isRoleLoading, setIsRoleLoading] = useState(false);

  // Sidebar collapsed state remembered in localStorage
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('mplads_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedProject, setSelectedProject] = useState<MPLADProject | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');

  // Data states
  const [rawProjects, setRawProjects] = useState<MPLADProject[]>(INITIAL_PROJECTS);
  const [contractors, setContractors] = useState<ContractorProfile[]>(CONTRACTOR_PROFILES);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Firebase Auth listener with Firestore Role Fetching
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsRoleLoading(true);
        const email = user.email || '';
        const isAdminEmail = ADMIN_EMAILS.includes(email.toLowerCase());
        let determinedRole: 'admin' | 'standard' = isAdminEmail ? 'admin' : 'standard';

        if (!user.isAnonymous && user.uid) {
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              if (userData?.role) {
                determinedRole = userData.role;
              }
              if (isAdminEmail) {
                determinedRole = 'admin';
              }
            } else {
              // Bootstrap Firestore profile if missing
              const newProfile = {
                uid: user.uid,
                email: email || 'auditor@vigilai.gov.in',
                displayName: user.displayName || (email ? email.split('@')[0] : 'Auditor'),
                role: determinedRole,
                createdAt: new Date().toISOString(),
              };
              try {
                await setDoc(userDocRef, newProfile);
              } catch (setErr) {
                console.warn('Auto profile initialization error:', setErr);
              }
            }
          } catch (err) {
            console.warn('Firestore role query notice:', err);
          }
        }

        const userInfo: AuthUserInfo = {
          uid: user.uid,
          email: user.email || 'auditor@vigilai.gov.in',
          displayName: user.displayName || (email ? email.split('@')[0] : 'Vigilance Official'),
          isAnonymous: user.isAnonymous,
          role: determinedRole,
        };
        setCurrentUser(userInfo);
        setIsRoleLoading(false);
        try {
          localStorage.setItem('mplads_auth_session', JSON.stringify(userInfo));
        } catch (e) {
          console.warn(e);
        }
      } else {
        // Check if a client-side guest session exists
        try {
          const saved = localStorage.getItem('mplads_auth_session');
          if (saved) {
            setCurrentUser(JSON.parse(saved));
          } else {
            setCurrentUser(null);
          }
        } catch {
          setCurrentUser(null);
        }
        setIsRoleLoading(false);
      }
      setIsAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Firebase sign out notice:', err);
    }
    setCurrentUser(null);
    try {
      localStorage.removeItem('mplads_auth_session');
    } catch (e) {
      console.warn(e);
    }
  };

  // Toggle and persist sidebar collapsed state
  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('mplads_sidebar_collapsed', String(next));
      } catch (e) {
        console.warn('Could not persist to localStorage:', e);
      }
      return next;
    });
  };

  // Connect live Firestore collection for real-time synchronization
  useEffect(() => {
    try {
      const projectsCol = collection(db, 'projects');
      const unsubscribe = onSnapshot(
        projectsCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreProjects: MPLADProject[] = [];
            snapshot.forEach((docSnap) => {
              const d = docSnap.data();
              const pId = docSnap.id;
              firestoreProjects.push({
                id: pId,
                workCode: d.workCode || pId,
                title: d.title || (d.workCode ? `Work ${d.workCode}` : 'Untitled Project'),
                description: d.description || d.notes || `${d.title || 'Project'} under active audit monitoring`,
                category: d.sector || d.category || 'General Infrastructure',
                constituencyId: d.constituencyId,
                constituency: d.location || d.constituency || 'Constituency Area',
                mpName: d.mpName || 'MP Office',
                mpType: d.mpType || 'Lok Sabha',
                party: d.party || 'Independent',
                state: d.state || 'India',
                district: d.district || d.location || 'District Area',
                sanctionDate: d.sanctionDate || '2023-01-01',
                expectedCompletionDate: d.expectedCompletionDate || '2024-12-31',
                actualCompletionDate: d.actualCompletionDate,
                sanctionedAmountLakhs: Number(d.sanctionedAmountLakhs ?? 0),
                expenditureAmountLakhs: Number(d.expenditureAmountLakhs ?? d.expenditure ?? 0),
                unspentAmountLakhs: Math.max(
                  0,
                  Number(d.sanctionedAmountLakhs ?? 0) - Number(d.expenditureAmountLakhs ?? d.expenditure ?? 0)
                ),
                completionPercentage: Number(
                  d.completionPercentage ?? (d.status === 'Completed' ? 100 : 0)
                ),
                status: (d.status as any) || 'In Progress',
                implementingAgency: d.implementingAgency || 'District Implementation Agency',
                contractorName: d.contractorName || 'Tender Open / Unspecified',
                contractorGstin: d.contractorGstin,
                tenderType: d.tenderType || 'Open Tender',
                bidCount: d.bidCount ?? 1,
                coordinates:
                  d.gpsLat && d.gpsLng ? { lat: d.gpsLat, lng: d.gpsLng } : undefined,
                gpsLat: d.gpsLat,
                gpsLng: d.gpsLng,
                satelliteVerified: d.satelliteVerified,
                notes: d.notes,
                investigationStatus: d.investigationStatus || 'New',
                investigationNotes: d.investigationNotes,
                ...d,
              });
            });

            // Merge with INITIAL_PROJECTS so all 15 authentic baseline records are preserved
            // while giving priority to live Firestore documents
            const mergedMap = new Map<string, MPLADProject>();
            INITIAL_PROJECTS.forEach((p) => mergedMap.set(p.id, p));
            firestoreProjects.forEach((p) => mergedMap.set(p.id, p));
            setRawProjects(Array.from(mergedMap.values()));
            setIsLiveConnected(true);
          } else {
            setIsLiveConnected(true);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'projects');
          console.warn('Firestore live listener notice (falling back cleanly to mpladsData):', error.message);
          setIsLiveConnected(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Could not establish live Firestore listener:', err);
    }
  }, []);

  // Fetch projects and contractor data from API (additional server endpoint sync)
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch projects
      const projRes = await fetch('/api/projects');
      if (projRes.ok) {
        const pData = await projRes.json();
        if (pData.data && Array.isArray(pData.data) && pData.data.length > 0) {
          setRawProjects(pData.data);
        }
      }

      // 2. Fetch contractors
      const contRes = await fetch('/api/contractors');
      if (contRes.ok) {
        const cData = await contRes.json();
        if (cData.data && Array.isArray(cData.data)) {
          setContractors(cData.data);
        }
      }

      // 3. Fetch alerts
      const alertRes = await fetch('/api/alerts');
      if (alertRes.ok) {
        const aData = await alertRes.json();
        if (aData.data && Array.isArray(aData.data)) {
          setAlerts(aData.data);
        }
      }
    } catch (err) {
      console.warn('API fetch warning, using loaded dataset:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Compute deterministic risk score & anomalies for every project via the production Anomaly Engine
  const { scoredProjects, diagnosticSummary } = useMemo(() => {
    const analysis = analyzeAllProjects(rawProjects, contractors);
    return {
      scoredProjects: analysis.projects,
      diagnosticSummary: analysis.summary,
    };
  }, [rawProjects, contractors]);

  // Update investigation status in state and Firestore
  const handleUpdateInvestigation = async (
    projectId: string,
    status: InvestigationStatus,
    notes?: string
  ) => {
    // Optimistic local state update
    setRawProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              investigationStatus: status,
              investigationNotes: notes,
              lastUpdatedDate: new Date().toISOString(),
            }
          : p
      )
    );

    if (selectedProject && selectedProject.id === projectId) {
      setSelectedProject((prev) =>
        prev
          ? {
              ...prev,
              investigationStatus: status,
              investigationNotes: notes,
            }
          : null
      );
    }

    // Persist to server API & Firestore
    try {
      await fetch(`/api/projects/${projectId}/investigation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investigationStatus: status, notes }),
      });
    } catch (err) {
      console.error('Failed to persist investigation update:', err);
    }
  };

  // Helper to open project details by work code (used by AI Assistant citations)
  const handleSelectByWorkCode = (workCode: string) => {
    const found = scoredProjects.find(
      (p) => p.workCode.toLowerCase() === workCode.toLowerCase()
    );
    if (found) {
      setSelectedProject(found);
    }
  };

  // Critical alerts count for sidebar badge
  const criticalCount = scoredProjects.filter((p) => p.riskLevel === 'Critical').length;

  // Render loading state while checking session
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4 font-sans">
        <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
        <div className="text-sm font-bold text-slate-200">Loading MPLADS VigilAI...</div>
        <div className="text-xs text-slate-400 mt-1">Connecting to audit services</div>
      </div>
    );
  }

  // If unauthenticated, render Login or SignUp View
  if (!currentUser) {
    if (authView === 'signup') {
      return (
        <SignUp
          onSignUpSuccess={(user) => {
            const email = user.email || '';
            const isAdminEmail = ADMIN_EMAILS.includes(email.toLowerCase());
            const role = user.role || (isAdminEmail ? 'admin' : 'standard');
            const completeUser = { ...user, role };
            setCurrentUser(completeUser);
            try {
              localStorage.setItem('mplads_auth_session', JSON.stringify(completeUser));
            } catch (e) {
              console.warn(e);
            }
          }}
          onNavigateToLogin={() => setAuthView('login')}
        />
      );
    }

    return (
      <Login
        onLoginSuccess={(user) => {
          const email = user.email || '';
          const isAdminEmail = ADMIN_EMAILS.includes(email.toLowerCase());
          const role = user.role || (isAdminEmail ? 'admin' : 'standard');
          const completeUser = { ...user, role };
          setCurrentUser(completeUser);
          try {
            localStorage.setItem('mplads_auth_session', JSON.stringify(completeUser));
          } catch (e) {
            console.warn(e);
          }
        }}
        onNavigateToSignUp={() => setAuthView('signup')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* 1. FIXED COLLAPSIBLE LEFT NAVBAR */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setMobileMenuOpen(false);
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        criticalAlertsCount={criticalCount}
        user={currentUser}
        onSignOut={handleSignOut}
      />

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 2. MAIN SCROLLABLE CONTENT AREA */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {/* Mobile Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 sticky top-0 z-20 md:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-700 flex items-center justify-center text-white font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-slate-900">MPLADS VigilAI</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('ai-assistant')}
              className="p-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Assistant</span>
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              projects={scoredProjects}
              onSelectProject={setSelectedProject}
              onNavigateToTab={setActiveTab}
              globalSearch={globalSearch}
              setGlobalSearch={setGlobalSearch}
              diagnosticSummary={diagnosticSummary}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsView
              projects={scoredProjects}
              onSelectProject={setSelectedProject}
              onRefresh={fetchAllData}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'risk-center' && (
            <RiskCenterView
              projects={scoredProjects}
              onSelectProject={setSelectedProject}
            />
          )}

          {activeTab === 'anomalies' && (
            <AnomalyExplorerView
              projects={scoredProjects}
              onSelectProject={setSelectedProject}
            />
          )}

          {activeTab === 'map' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Geographic Project Monitoring
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Verified GPS coordinates, district-level approximations &amp; risk distribution across India
                </p>
              </div>
              <MapView
                projects={scoredProjects}
                onSelectProject={setSelectedProject}
              />
            </div>
          )}

          {activeTab === 'contractors' && (
            <ContractorAnalyticsView
              projects={scoredProjects}
              contractors={contractors}
              onSelectProject={setSelectedProject}
            />
          )}

          {activeTab === 'ai-assistant' && (
            <AiAssistantView
              projects={scoredProjects}
              onSelectProjectByWorkCode={handleSelectByWorkCode}
            />
          )}

          {activeTab === 'data-quality' && (
            <DataQualityView
              projects={scoredProjects}
              onSelectProject={setSelectedProject}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              onRefreshData={fetchAllData}
              isLoading={isLoading}
              userRole={currentUser?.role}
              isRoleLoading={isRoleLoading}
            />
          )}
        </main>
      </div>

      {/* 3. PROJECT DETAILS MODAL */}
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

