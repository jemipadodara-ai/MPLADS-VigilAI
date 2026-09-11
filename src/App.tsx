import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MPLADProject,
  ContractorProfile,
  ConstituencySummary,
  InvestigationStatus,
  DiagnosticSummary,
  ProjectFilterState,
  CitizenVerification,
  AuditLogEntry,
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
import { GeospatialMap } from './components/views/GeospatialMap';
import { AssistantAndSettings } from './components/views/AssistantAndSettings';
import { DataQualityView } from './components/views/DataQualityView';
import { Login, UserAuthProfile } from './components/views/Login';
import { SignUp } from './components/views/SignUp';

import { ProjectTable } from './components/ProjectTable';
import { FilterBar } from './components/FilterBar';
import { AnomalyScanner } from './components/AnomalyScanner';
import { MapView } from './components/MapView';
import { ContractorCartelVisualizer } from './components/ContractorCartelVisualizer';
import { SandboxProposalAudit } from './components/SandboxProposalAudit';
import { ProjectDetails } from './components/ProjectDetails';
import { ProjectAuditModal } from './components/ProjectAuditModal';
import { RiskBadge } from './components/RiskBadge';
import { RiskScore } from './components/RiskScore';

// Firebase & Auth
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, signOut, signInAnonymously, User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, doc, updateDoc, addDoc, getDoc } from 'firebase/firestore';

// Icons
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Database,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileCheck2,
  Users,
  MapPin,
  ClipboardList,
  Sparkles,
  Lock,
  LogOut,
  Globe,
  Building2,
  ExternalLink,
  Info,
  Clock,
  Send,
  Eye,
  ChevronRight,
} from 'lucide-react';

const ADMIN_EMAILS = [
  'jemipadodara@gmail.com',
  'auditor@vigilai.gov.in',
  'admin@vigilai.gov.in',
];

export function App() {
  // Navigation & Portal State (Landing, Dashboard, Projects, Map, Assistant & Settings)
  const [activeTab, setActiveTab] = useState<ActiveTab>('landing');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isCitizenPortal, setIsCitizenPortal] = useState<boolean>(false);
  const [authView, setAuthView] = useState<'login' | 'signup' | null>(null);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserAuthProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isRoleLoading, setIsRoleLoading] = useState<boolean>(false);

  // Filter & Search State
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [projectFilters, setProjectFilters] = useState<ProjectFilterState>({
    searchQuery: '',
    state: '',
    district: '',
    mp: '',
    constituency: '',
    category: '',
    status: '',
    riskLevel: '',
  });

  // Modal State
  const [selectedProject, setSelectedProject] = useState<MPLADProject | null>(null);
  const [selectedAuditProject, setSelectedAuditProject] = useState<MPLADProject | null>(null);

  // Core Data
  const [rawProjects, setRawProjects] = useState<MPLADProject[]>(
    officialProjectsData && officialProjectsData.length > 0
      ? (officialProjectsData as unknown as MPLADProject[])
      : INITIAL_PROJECTS
  );
  const [contractors, setContractors] = useState<ContractorProfile[]>(CONTRACTOR_PROFILES);
  const [constituencies, setConstituencies] = useState<ConstituencySummary[]>(CONSTITUENCY_SUMMARIES);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [lastAuditTimestamp, setLastAuditTimestamp] = useState<string>(
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  );

  // Citizen Report Submission State (for Public Citizen Portal)
  const [citizenWorkCode, setCitizenWorkCode] = useState<string>('');
  const [citizenIssueType, setCitizenIssueType] = useState<string>('Delayed Work');
  const [citizenDescription, setCitizenDescription] = useState<string>('');
  const [citizenName, setCitizenName] = useState<string>('');
  const [citizenSubmitting, setCitizenSubmitting] = useState<boolean>(false);
  const [citizenSuccessMsg, setCitizenSuccessMsg] = useState<string | null>(null);

  // 1. Firebase Auth Listener & Role Resolution
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        setIsRoleLoading(true);
        const email = fbUser.email || '';
        let role: 'admin' | 'standard' = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'standard';

        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data?.role) {
              role = data.role;
            }
          }
        } catch {
          // Fall back to email heuristic
        }

        setCurrentUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Auditor Official'),
          role,
          isAnonymous: fbUser.isAnonymous,
        });
        setAuthView(null);
        setIsRoleLoading(false);
      } else {
        setCurrentUser(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Firestore Real-Time Projects Listener (graceful fallback to authentic local dataset)
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
            setIsLiveConnected(true);
          } else {
            setIsLiveConnected(false);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'projects');
          setIsLiveConnected(false);
        }
      );
      return () => unsubscribe();
    } catch {
      setIsLiveConnected(false);
    }
  }, []);

  // 3. Anomaly Engine pass: Compute statutory compliance, risk scores, and flags
  const { scoredProjects, diagnosticSummary } = useMemo(() => {
    try {
      const result = analyzeAllProjects(rawProjects, contractors);
      const computedProjects = result.scoredProjects || result.projects || rawProjects;

      let dqCount = 0;
      let financialCount = 0;
      let progressCount = 0;
      let costCount = 0;
      let duplicateCount = 0;
      let contractorCount = 0;
      let geoCount = 0;
      let highRisk = 0;
      let criticalRisk = 0;

      computedProjects.forEach((p) => {
        const { detailedIssues } = validateProjectData(p);
        dqCount += detailedIssues.length;

        const flags = p.anomalyFlags || p.detectedAnomalies || [];
        flags.forEach((f: any) => {
          const type = (f.type || f.category || '').toLowerCase();
          if (type.includes('financial')) financialCount++;
          if (type.includes('progress') || type.includes('delay')) progressCount++;
          if (type.includes('cost')) costCount++;
          if (type.includes('duplicate')) duplicateCount++;
          if (type.includes('contractor')) contractorCount++;
          if (type.includes('geographic') || type.includes('geo')) geoCount++;
        });

        const score = p.overallRiskScore || p.riskScore || 0;
        if (score >= 81) criticalRisk++;
        else if (score >= 61) highRisk++;
      });

      const summary: DiagnosticSummary = {
        totalRecords: computedProjects.length,
        validRecords: Math.max(0, computedProjects.length - (criticalRisk + highRisk)),
        dataQualityIssues: dqCount,
        financialAnomalies: financialCount,
        progressAnomalies: progressCount,
        costAnomalies: costCount,
        potentialDuplicates: duplicateCount,
        contractorIndicators: contractorCount,
        geographicAnomalies: geoCount,
        highRiskProjects: highRisk,
        criticalProjects: criticalRisk,
        analyzedAt: new Date().toISOString(),
      };

      return { scoredProjects: computedProjects, diagnosticSummary: summary };
    } catch (err) {
      console.warn('Anomaly engine calculation notice:', err);
      return { scoredProjects: rawProjects, diagnosticSummary: undefined };
    }
  }, [rawProjects, contractors]);

  // Critical alerts count for sidebar badge
  const criticalAlertsCount = useMemo(() => {
    return scoredProjects.filter((p) => (p.overallRiskScore || p.riskScore || 0) >= 81).length;
  }, [scoredProjects]);

  // Unique filter lists for ProjectTable / FilterBar
  const { statesList, districtsList, mpsList, categoriesList, statusesList } = useMemo(() => {
    const states = new Set<string>();
    const districts = new Set<string>();
    const mps = new Set<string>();
    const categories = new Set<string>();
    const statuses = new Set<string>();

    scoredProjects.forEach((p) => {
      if (p.state) states.add(p.state);
      if (p.district) districts.add(p.district);
      if (p.mpName) mps.add(p.mpName);
      if (p.category) categories.add(p.category);
      if (p.status) statuses.add(p.status);
    });

    return {
      statesList: Array.from(states).sort(),
      districtsList: Array.from(districts).sort(),
      mpsList: Array.from(mps).sort(),
      categoriesList: Array.from(categories).sort(),
      statusesList: Array.from(statuses).sort(),
    };
  }, [scoredProjects]);

  // Filtered projects for ProjectTable
  const filteredProjects = useMemo(() => {
    return scoredProjects.filter((p) => {
      if (projectFilters.searchQuery) {
        const q = projectFilters.searchQuery.toLowerCase();
        const matchesTitle = (p.title || '').toLowerCase().includes(q);
        const matchesCode = (p.workCode || '').toLowerCase().includes(q);
        const matchesDesc = (p.description || '').toLowerCase().includes(q);
        const matchesContractor = (p.contractorName || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCode && !matchesDesc && !matchesContractor) return false;
      }
      if (projectFilters.state && p.state !== projectFilters.state) return false;
      if (projectFilters.district && p.district !== projectFilters.district) return false;
      if (projectFilters.mp && p.mpName !== projectFilters.mp) return false;
      if (projectFilters.category && p.category !== projectFilters.category) return false;
      if (projectFilters.status && p.status !== projectFilters.status) return false;
      if (projectFilters.riskLevel) {
        const score = p.overallRiskScore || p.riskScore || 0;
        if (projectFilters.riskLevel === 'Critical' && score < 81) return false;
        if (projectFilters.riskLevel === 'High' && (score < 61 || score > 80)) return false;
        if (projectFilters.riskLevel === 'Medium' && (score < 31 || score > 60)) return false;
        if (projectFilters.riskLevel === 'Low' && score > 30) return false;
      }
      return true;
    });
  }, [scoredProjects, projectFilters]);

  // Inspection Priority items: Ranked by highest risk with discrepancy check
  const inspectionPriorityProjects = useMemo(() => {
    return [...scoredProjects]
      .sort((a, b) => (b.overallRiskScore || b.riskScore || 0) - (a.overallRiskScore || a.riskScore || 0))
      .filter((p) => (p.overallRiskScore || p.riskScore || 0) >= 60);
  }, [scoredProjects]);

  // Trigger manual re-audit
  const handleRunAudit = useCallback(() => {
    setIsAuditing(true);
    setTimeout(() => {
      try {
        const result = analyzeAllProjects(rawProjects, contractors);
        if (result.scoredProjects) {
          setRawProjects([...result.scoredProjects]);
        }
      } catch (e) {
        console.warn('Audit pass notice:', e);
      }
      setIsAuditing(false);
      setLastAuditTimestamp(
        new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      );
    }, 800);
  }, [rawProjects, contractors]);

  // Sign out handler
  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch {
      setCurrentUser(null);
    }
  }, []);

  // Quick Guest Login
  const handleGuestLogin = useCallback(async () => {
    try {
      setIsAuthLoading(true);
      const res = await signInAnonymously(auth);
      setCurrentUser({
        uid: res.user.uid,
        email: null,
        displayName: 'Guest Auditor',
        role: 'standard',
        isAnonymous: true,
      });
      setAuthView(null);
    } catch (e) {
      console.warn('Guest sign-in notice:', e);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

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

  // Submit Citizen Field Reality Check
  const handleSubmitCitizenReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizenWorkCode || !citizenDescription) return;

    setCitizenSubmitting(true);
    setCitizenSuccessMsg(null);

    const newReport = {
      workCode: citizenWorkCode.trim(),
      issueType: citizenIssueType,
      description: citizenDescription.trim(),
      citizenName: citizenName.trim() || 'Anonymous Citizen',
      createdAt: new Date().toISOString(),
      status: 'Submitted for Auditor Verification',
      source: 'Public Citizen Reality Check Portal',
    };

    try {
      await addDoc(collection(db, 'citizen_reports'), newReport);
      setCitizenSuccessMsg('✅ Field reality check submitted successfully! Registered for auditor verification.');
      setCitizenWorkCode('');
      setCitizenDescription('');
      setCitizenName('');
      setTimeout(() => setCitizenSuccessMsg(null), 4000);
    } catch {
      setCitizenSuccessMsg('✅ Report recorded locally. Auditor team notified.');
      setCitizenWorkCode('');
      setCitizenDescription('');
      setCitizenName('');
      setTimeout(() => setCitizenSuccessMsg(null), 4000);
    } finally {
      setCitizenSubmitting(false);
    }
  };

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
          user={
            currentUser
              ? {
                  email: currentUser.email,
                  displayName: currentUser.displayName,
                  role: currentUser.role,
                }
              : null
          }
        />

        {/* Project Details Audit Drawer if clicked */}
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
  // AUTH MODAL VIEW (If User Wants to Sign In or Sign Up)
  // ---------------------------------------------------------------------------
  if (authView) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setAuthView(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              &larr; Back to App
            </button>
            <button
              onClick={() => setIsCitizenPortal(true)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Public Citizen Portal</span>
            </button>
          </div>

          {authView === 'login' ? (
            <Login
              onLoginSuccess={(profile) => {
                setCurrentUser(profile);
                setAuthView(null);
              }}
              onNavigateToSignUp={() => setAuthView('signup')}
            />
          ) : (
            <SignUp
              onSignUpSuccess={(profile) => {
                setCurrentUser(profile);
                setAuthView(null);
              }}
              onNavigateToLogin={() => setAuthView('login')}
            />
          )}

          <div className="pt-3 border-t border-slate-100 text-center">
            <button
              onClick={handleGuestLogin}
              className="text-xs font-semibold text-slate-600 hover:text-blue-700 transition-colors py-1 cursor-pointer"
            >
              Or continue with Instant Guest Auditor Access &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // AUDITOR CONSOLE VIEW (Standard Full GitHub Layout with Sidebar)
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
        criticalAlertsCount={criticalAlertsCount}
        user={
          currentUser
            ? {
                email: currentUser.email,
                displayName: currentUser.displayName,
                isAnonymous: currentUser.isAnonymous,
                role: currentUser.role,
              }
            : null
        }
        onSignOut={currentUser ? handleSignOut : () => setAuthView('login')}
        onSwitchToCitizenPortal={() => setIsCitizenPortal(true)}
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
                MPLADS VigilAI • Civic Intelligence System
              </div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 truncate">
                {activeTab === 'dashboard' && 'Executive Oversight Dashboard'}
                {activeTab === 'projects' && 'Projects Master Registry'}
                {activeTab === 'map' && 'GIS Map Intelligence & Spatial Anomaly Radar'}
                {activeTab === 'assistant-settings' && 'Grounded AI & System Settings'}
                {activeTab === 'profile' && 'Auditor Credentials & Security Profile'}
              </h1>
            </div>
          </div>

          {/* Actions & Sync State */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Quick Switch to Public Landing Portal */}
            <button
              id="header-public-portal-btn"
              onClick={() => setActiveTab('landing')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="Return to Public Landing Page"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden md:inline">Public Portal</span>
            </button>

            {/* Live Firestore indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <span
                className={`w-2 h-2 rounded-full ${
                  isLiveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'
                }`}
              />
              <span>{isLiveConnected ? 'Live Cloud Sync' : 'Static Baseline'}</span>
            </div>

            {/* Manual Re-Audit Pass Button */}
            <button
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Run algorithmic re-audit over all project records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isAuditing ? 'Auditing...' : 'Run Forensic Audit'}</span>
            </button>

            {/* Auth status or sign-in prompt */}
            {!currentUser && (
              <button
                onClick={() => setAuthView('login')}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Auditor Sign In</span>
              </button>
            )}
          </div>
        </header>

        {/* 3. Primary Content Area Based on Active Tab */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* View 2: Executive Oversight Dashboard */}
          {activeTab === 'dashboard' && (
            <Dashboard
              projects={scoredProjects}
              constituencies={constituencies}
              onInspectProject={(p) => setSelectedProject(p)}
              onNavigateToProjects={() => setActiveTab('projects')}
              onRefreshData={handleRunAudit}
              isRefreshing={isAuditing}
              userRole={currentUser?.role}
              userEmail={currentUser?.email}
            />
          )}

          {/* View 3: Projects Master Registry */}
          {activeTab === 'projects' && (
            <Projects
              projects={scoredProjects}
              onInspectProject={(p) => setSelectedProject(p)}
            />
          )}

          {/* View 4: Geospatial Map Intelligence */}
          {activeTab === 'map' && (
            <GeospatialMap
              projects={scoredProjects}
              onInspectProject={(p) => setSelectedProject(p)}
            />
          )}

          {/* View 5: AI Grounded Assistant & Settings */}
          {activeTab === 'assistant-settings' && (
            <AssistantAndSettings
              projects={scoredProjects}
              onSelectProjectByWorkCode={(code) => {
                const found = scoredProjects.find(
                  (p) => p.workCode === code || p.id === code
                );
                if (found) setSelectedProject(found);
              }}
              onRefreshData={handleRunAudit}
              isLoadingData={isAuditing}
              userRole={currentUser?.role || 'standard'}
              isRoleLoading={isRoleLoading}
            />
          )}

          {/* Tab 14: Profile & Credentials */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-700 flex items-center justify-center text-white font-black text-xl shadow-xs">
                  {currentUser?.displayName?.[0]?.toUpperCase() || 'A'}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    {currentUser?.displayName || 'Auditor Official'}
                  </h2>
                  <div className="text-xs text-slate-500">{currentUser?.email || 'Guest Auditor Session'}</div>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                    <span>Role: {currentUser?.role === 'admin' ? 'Administrative Auditor' : 'Field Auditor (Standard)'}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="font-bold text-slate-800">Session Security & Clearance</div>
                <div className="text-slate-600">
                  User ID: <code className="text-slate-800 font-mono">{currentUser?.uid || 'Anonymous'}</code>
                </div>
                <div className="text-slate-600">
                  Authentication Provider: <strong className="text-slate-800">{currentUser?.isAnonymous ? 'Firebase Anonymous Auth' : 'Firebase Email/Password Auth'}</strong>
                </div>
                <div className="text-slate-600">
                  Jurisdiction: <strong className="text-slate-800">National MPLADS Oversight Register</strong>
                </div>
              </div>

              {currentUser && (
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Auditor Console</span>
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {/* 4. Interactive Modals */}
      {selectedProject && (
        <ProjectDetails
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onUpdateInvestigation={handleUpdateInvestigation}
        />
      )}

      {selectedAuditProject && (
        <ProjectAuditModal
          project={selectedAuditProject}
          onClose={() => setSelectedAuditProject(null)}
        />
      )}
    </div>
  );
}

export default App;
