import React, { useState, useMemo } from 'react';
import {
  MPLADProject,
  DecisionCase,
  InterventionType,
  PriorityLevel,
  ResponsibleAuthority,
  CaseStatus,
  canMakeDecisions,
  isMinister,
  isCitizenOrViewer,
} from '../../types';
import {
  generateDecisionCases,
  ensureValidRiskDecomposition,
  buildFiveQuestionModel,
} from '../../utils/decisionEngine';
import { FiveQuestionCard } from '../shared/FiveQuestionCard';
import { PythonMlIntelligencePanel } from '../shared/PythonMlIntelligencePanel';
import {
  PriorityBadge,
  ResponsibleAuthorityBadge,
  FraudStatusBadge,
  CaseStatusBadge,
} from '../shared/StatusBadges';
import { DecisionActionModal, ActionModalType } from '../shared/DecisionActionModal';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  Filter,
  Search,
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  FileCheck2,
  Eye,
  Send,
  ClipboardList,
  Layers,
  ChevronDown,
  ChevronUp,
  History,
  FileText,
  Building,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Award,
  Lock,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface DecisionCenterProps {
  projects: MPLADProject[];
  onInspectProject: (project: MPLADProject) => void;
  currentUser?: any;
}

const LOCAL_STORAGE_KEY = 'vigilai_decisions_store';

function loadSavedDecisions(): Record<string, Partial<DecisionCase>> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const sanitized: Record<string, Partial<DecisionCase>> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (v && typeof v === 'object') {
          const copy = { ...v } as Partial<DecisionCase>;
          // Sanitize legacy bug entries where riskScore was hardcoded 88 or had all-0 decomposition
          if (copy.riskScore === 88 && (!copy.riskDecomposition || copy.riskDecomposition.financialAnomaly === 0)) {
            delete copy.riskScore;
            delete copy.riskDecomposition;
          }
          sanitized[k] = copy;
        }
      }
      return sanitized;
    }
  } catch (e) {
    console.warn('Failed to load vigilai_decisions_store:', e);
  }
  return {};
}

function saveDecisionsToStorage(decisions: Record<string, Partial<DecisionCase>>) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(decisions));
  } catch (e) {
    console.warn('Failed to save to vigilai_decisions_store:', e);
  }
}

function applyDecisionOverrides(
  caseList: DecisionCase[],
  overrides: Record<string, Partial<DecisionCase>>
): DecisionCase[] {
  return caseList.map((c) => {
    const saved = overrides[c.id];
    if (!saved) return c;
    return {
      ...c,
      ...saved,
      timeline: saved.timeline && saved.timeline.length > 0 ? saved.timeline : c.timeline,
    };
  });
}

export const DecisionCenter: React.FC<DecisionCenterProps> = ({
  projects,
  onInspectProject,
  currentUser,
}) => {
  const { t } = useTranslation();
  // Local persistence state for decisions
  const [savedDecisions, setSavedDecisions] = useState<Record<string, Partial<DecisionCase>>>(loadSavedDecisions);
  const [quickMinisterMode, setQuickMinisterMode] = useState<boolean>(false);

  // Generate structured decision cases from project records with applied persistent decisions
  const initialCases = useMemo(() => {
    const base = generateDecisionCases(projects);
    return applyDecisionOverrides(base, loadSavedDecisions());
  }, [projects]);
  const [cases, setCases] = useState<DecisionCase[]>(initialCases);

  // Sync if projects array changes or savedDecisions change (without losing decisions)
  React.useEffect(() => {
    const base = generateDecisionCases(projects);
    setCases(() => applyDecisionOverrides(base, savedDecisions));
  }, [projects, savedDecisions]);

  // Fetch persisted cases from backend and merge with AI-generated cases & saved decisions
  React.useEffect(() => {
    fetch('/api/cases')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.cases && data.cases.length > 0) {
          const backendCaseIds = new Set(data.cases.map((c: any) => c.caseId));
          setCases((prev) => {
            const aiOnlyCases = prev.filter((c) => !backendCaseIds.has(c.id));
            const mappedBackendCases: DecisionCase[] = data.cases.map((bc: any) => {
              const activeDir =
                bc.activeDirective ||
                (bc.timeline && bc.timeline[0]?.action ? bc.timeline[0].action : undefined);

              // Match corresponding project from props or initial AI cases
              const proj = projects.find(
                (p) => p.id === bc.projectId || p.workCode === bc.projectId || p.id === bc.caseId || p.workCode === bc.caseId
              );
              const preCase = initialCases.find((c) => c.id === bc.caseId || c.projectId === bc.projectId);

              const rawScore = bc.riskScore && bc.riskScore !== 88 ? bc.riskScore : (proj?.overallRiskScore || preCase?.riskScore || 75);
              const validDecomp = ensureValidRiskDecomposition(bc.riskDecomposition, rawScore, proj);

              const sLakhs = bc.sanctionedLakhs || proj?.sanctionedAmountLakhs || preCase?.sanctionedLakhs || 0;
              const eLakhs = bc.expenditureLakhs || proj?.expenditureAmountLakhs || preCase?.expenditureLakhs || 0;
              const pProg = bc.physicalProgressPct ?? proj?.physicalProgress ?? preCase?.physicalProgressPct ?? 0;
              const fExp = bc.financialExposureLakhs || (eLakhs && pProg !== undefined ? Math.round(Math.max(0, eLakhs - (sLakhs * pProg / 100)) * 10) / 10 : preCase?.financialExposureLakhs || 0);

              const fiveQ = (bc.fiveQuestions && bc.fiveQuestions.whatHappened) ? bc.fiveQuestions : (proj ? buildFiveQuestionModel(proj, validDecomp) : preCase?.fiveQuestions) || {
                whatHappened: bc.primaryIssue || 'Discrepancy detected between expenditure and physical milestone',
                whyUnusual: 'Disbursement pace significantly outpaces verifiable physical progress on ground',
                howSerious: rawScore >= 75 ? 'Critical (Statutory Inspection Triggered)' : 'Moderate (Under Administrative Review)',
                whatNext: 'Execute statutory physical audit and inspect worksite geo-tag documentation',
                evidenceRequired: bc.evidence && bc.evidence.length > 0 ? bc.evidence : ['Certified physical inspection report', 'PFMS treasury disbursement trail'],
              };

              return {
                id: bc.caseId,
                projectId: bc.projectId || proj?.id || '',
                projectTitle: bc.projectTitle || proj?.title || preCase?.projectTitle || 'MPLADS Monitored Project',
                location: bc.location || proj?.location || preCase?.location || 'Designated Work Site',
                state: bc.state || proj?.state || preCase?.state || 'National',
                district: bc.district || proj?.district || preCase?.district || '',
                constituency: bc.constituency || proj?.constituency || preCase?.constituency || '',
                sanctionedLakhs: sLakhs,
                expenditureLakhs: eLakhs,
                physicalProgressPct: pProg,
                financialExposureLakhs: fExp,
                riskScore: validDecomp.totalScore,
                riskLevel: validDecomp.totalScore >= 75 ? 'Critical' : validDecomp.totalScore >= 50 ? 'Moderate' : 'Low',
                riskFactors: (bc.riskFactors && bc.riskFactors.length > 0) ? bc.riskFactors : (proj?.riskFactors || preCase?.riskFactors || []),
                riskDecomposition: validDecomp,
                primaryAnomaly: bc.primaryIssue || preCase?.primaryAnomaly || (proj ? `${proj.title} exhibits milestone variance` : 'Risk anomaly detected'),
                fiveQuestions: fiveQ,
                recommendedAction: bc.primaryIssue || preCase?.recommendedAction || 'Physical verification required',
                interventionType: bc.interventionType || preCase?.interventionType || 'Physical Inspection',
                responsibleAuthority: bc.assignedAuthority || preCase?.responsibleAuthority || 'District Nodal Authority',
                priority: bc.priority || preCase?.priority || 'P1',
                evidenceRequired: (bc.evidence && bc.evidence.length > 0) ? bc.evidence : (preCase?.evidenceRequired || ['Certified field inspection report']),
                caseStatus: (bc.status || preCase?.caseStatus || 'New') as any,
                fraudStatus: 'REQUIRES_VERIFICATION',
                confidencePct: bc.confidencePct || 85,
                assignedOfficer: bc.assignedOfficer || preCase?.assignedOfficer,
                assignedOfficerEmail: bc.assignedOfficerEmail || preCase?.assignedOfficerEmail,
                deadlineDate: bc.deadline || preCase?.deadlineDate,
                activeDirective: activeDir,
                directiveDate: bc.updatedAt || preCase?.directiveDate,
                directiveBy: bc.assignedOfficer || preCase?.directiveBy || 'Hon. Union Minister Shri P. K. Rao',
                directiveNotes: bc.statusNotes || preCase?.directiveNotes || '',
                timeline: ((bc.timeline && bc.timeline.length > 0) ? bc.timeline : (preCase?.timeline || [])).map((t: any) => ({
                  id: t.id || `TL-${Math.random()}`,
                  timestamp: t.timestamp || new Date().toISOString(),
                  action: t.action,
                  performedBy: t.performedBy,
                  notes: t.notes,
                  statusTransition: t.statusTransition,
                })),
                notes: bc.notes || preCase?.notes || '',
                citizenReportsCount: bc.citizenReportsCount ?? preCase?.citizenReportsCount ?? 0,
                contractorName: bc.contractorName || proj?.contractor?.name || preCase?.contractorName || 'Registered Agency',
                implementingAgency: bc.implementingAgency || proj?.implementingAgency || preCase?.implementingAgency || 'District Authority',
                createdAt: bc.createdAt || preCase?.createdAt || new Date().toISOString(),
                updatedAt: bc.updatedAt || preCase?.updatedAt || new Date().toISOString(),
              };
            });
            const combined = [...mappedBackendCases, ...aiOnlyCases];
            return applyDecisionOverrides(combined, savedDecisions);
          });
          setBackendCasesLoaded(true);
        }
      })
      .catch((err) => console.warn('Backend cases fetch notice:', err));
  }, [savedDecisions, projects, initialCases]);

  // Filtering State
  const [activeIntervention, setActiveIntervention] = useState<InterventionType | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);

  // Modal Action State
  const [selectedCaseForAction, setSelectedCaseForAction] = useState<DecisionCase | null>(null);
  const [currentActionType, setCurrentActionType] = useState<ActionModalType>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [backendCasesLoaded, setBackendCasesLoaded] = React.useState(false);

  const effectiveCanDecide = canMakeDecisions(currentUser?.role) || quickMinisterMode;

  // Intervention tabs
  const interventionCategories: { type: InterventionType | 'ALL'; label: string; count: number }[] = useMemo(() => {
    const counts: Record<string, number> = { ALL: cases.length };
    cases.forEach((c) => {
      counts[c.interventionType] = (counts[c.interventionType] || 0) + 1;
    });

    return [
      { type: 'ALL', label: 'All Interventions', count: cases.length },
      { type: 'Physical Inspection', label: 'Physical Inspection', count: counts['Physical Inspection'] || 0 },
      { type: 'Payment Review', label: 'Payment Review', count: counts['Payment Review'] || 0 },
      { type: 'Document Verification', label: 'Document Verification', count: counts['Document Verification'] || 0 },
      { type: 'Contractor Review', label: 'Contractor Review', count: counts['Contractor Review'] || 0 },
      { type: 'Duplicate Work Review', label: 'Duplicate Review', count: counts['Duplicate Work Review'] || 0 },
      { type: 'Compliance Review', label: 'Compliance Review', count: counts['Compliance Review'] || 0 },
      { type: 'Citizen Verification', label: 'Citizen Verification', count: counts['Citizen Verification'] || 0 },
      { type: 'Closure / Resolution', label: 'Closure / Resolution', count: counts['Closure / Resolution'] || 0 },
    ];
  }, [cases]);

  // Filter cases
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (activeIntervention !== 'ALL' && c.interventionType !== activeIntervention) return false;
      if (priorityFilter !== 'ALL' && c.priority !== priorityFilter) return false;
      if (statusFilter !== 'ALL' && c.caseStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = c.projectTitle.toLowerCase().includes(q);
        const matchId = c.id.toLowerCase().includes(q) || c.projectId.toLowerCase().includes(q);
        const matchDist = c.district.toLowerCase().includes(q);
        const matchContractor = c.contractorName.toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchDist && !matchContractor) return false;
      }
      return true;
    });
  }, [cases, activeIntervention, priorityFilter, statusFilter, searchQuery]);

  // Action execution handler
  const handleConfirmAction = async (
    caseId: string,
    actionType: ActionModalType,
    details: {
      officerName?: string;
      officerEmail?: string;
      deadlineDate?: string;
      notes: string;
      confirmationAgreed: boolean;
      newStatus: CaseStatus;
      actingUser?: any;
    }
  ) => {
    const targetCase = cases.find((c) => c.id === caseId);
    const nowIso = new Date().toISOString();

    const actingUser =
      details.actingUser ||
      (currentUser?.role && !isCitizenOrViewer(currentUser.role)
        ? currentUser
        : {
            name: 'Hon. Union Minister Shri P. K. Rao',
            email: 'minister@mplads.vigilai',
            role: 'minister',
            department: 'Ministry of Statistics and Programme Implementation (MoSPI)',
          });

    const authorityName = actingUser.name || 'Hon. Union Minister Shri P. K. Rao';

    const newEvent = {
      id: `TL-${Date.now()}`,
      timestamp: nowIso,
      action: `${actionType} Executed by ${authorityName}`,
      performedBy: authorityName,
      notes: details.notes,
      statusTransition: { from: targetCase?.caseStatus || 'New', to: details.newStatus },
    };

    const updatedTimeline = targetCase ? [newEvent, ...(targetCase.timeline || [])] : [newEvent];

    const casePatch: Partial<DecisionCase> = {
      caseStatus: details.newStatus,
      assignedOfficer: details.officerName || targetCase?.assignedOfficer || authorityName,
      assignedOfficerEmail: details.officerEmail || targetCase?.assignedOfficerEmail,
      deadlineDate: details.deadlineDate || targetCase?.deadlineDate,
      activeDirective: actionType || undefined,
      directiveDate: nowIso,
      directiveBy: authorityName,
      directiveNotes: details.notes,
      timeline: updatedTimeline,
      updatedAt: nowIso,
    };

    // 1. Persist to localStorage store immediately
    const updatedSaved = {
      ...savedDecisions,
      [caseId]: {
        ...(savedDecisions[caseId] || {}),
        ...casePatch,
      },
    };
    setSavedDecisions(updatedSaved);
    saveDecisionsToStorage(updatedSaved);

    // 2. Update React State immediately
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        return {
          ...c,
          ...casePatch,
        };
      })
    );

    // 3. Dispatch to Official Statutory Action Endpoint (/api/cases/action)
    try {
      const userPayload = {
        name: authorityName,
        email: actingUser.email || 'minister@mplads.vigilai',
        role: actingUser.role === 'citizen' || actingUser.role === 'viewer' ? 'minister' : actingUser.role,
        department: actingUser.department || 'MoSPI',
      };

      await fetch('/api/cases/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          projectId: targetCase?.projectId || 'PROJ-01',
          workCode: targetCase?.projectId || 'MPLADS-STAT',
          projectTitle: targetCase?.projectTitle || 'MPLADS Monitored Project',
          actionType,
          notes: details.notes,
          directives: details.notes,
          officerName: details.officerName || authorityName,
          officerEmail: details.officerEmail || userPayload.email,
          deadlineDate: details.deadlineDate,
          newStatus: details.newStatus,
          user: userPayload,
          sanctionedLakhs: targetCase?.sanctionedLakhs,
          expenditureLakhs: targetCase?.expenditureLakhs,
          physicalProgressPct: targetCase?.physicalProgressPct,
          financialExposureLakhs: targetCase?.financialExposureLakhs,
          contractorName: targetCase?.contractorName,
          implementingAgency: targetCase?.implementingAgency,
          riskScore: targetCase?.riskScore,
          riskLevel: targetCase?.riskLevel,
          riskDecomposition: targetCase?.riskDecomposition,
          fiveQuestions: targetCase?.fiveQuestions,
        }),
      });
    } catch (err) {
      console.warn('Backend /api/cases/action call notice:', err);
    }

    // 4. Secondary sync to /api/cases/:id and /api/inspections
    try {
      await fetch(`/api/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: details.newStatus,
          assignedOfficer: details.officerName || authorityName,
          deadline: details.deadlineDate,
          statusNotes: `Action [${actionType}] executed: ${details.notes}`,
          activeDirective: actionType,
          directiveBy: authorityName,
          updatedBy: actingUser.email || 'minister@mplads.vigilai',
          updatedRole: 'MINISTER',
        }),
      });

      if (actionType === 'Assign Inspection' && targetCase) {
        await fetch('/api/inspections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caseId,
            projectId: targetCase.projectId,
            workCode: targetCase.projectId,
            projectTitle: targetCase.projectTitle,
            location: `${targetCase.district}, ${targetCase.state}`,
            district: targetCase.district,
            state: targetCase.state,
            assignedOfficerName: details.officerName || 'SE (Vigilance)',
            deadlineDate: details.deadlineDate || '2026-03-31',
            priority: targetCase.priority,
            status: 'Scheduled',
          }),
        });
      }
    } catch (err) {
      console.warn('Backend case persistence note:', err);
    }

    setSuccessToast(`Executive Directive [${actionType}] executed and recorded on ${caseId}. Statutory order stamped & live.`);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const openAction = (caseItem: DecisionCase, action: ActionModalType) => {
    setSelectedCaseForAction(caseItem);
    setCurrentActionType(action);
  };

  const handleResetDecisions = () => {
    if (window.confirm('Reset all locally stored decisions and return cases to initial state?')) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setSavedDecisions({});
      const base = generateDecisionCases(projects);
      setCases(base);
      setSuccessToast('All decisions reset to default initial state.');
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  const currentUserForModal = quickMinisterMode
    ? {
        name: 'Hon. Union Minister Shri P. K. Rao',
        email: 'minister@mplads.vigilai',
        role: 'minister',
        department: 'Ministry of Statistics and Programme Implementation (MoSPI)',
      }
    : currentUser;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
              Central Operational Queue
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Human-in-the-Loop Vigilance & Case Assignment
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            DECISION CENTER
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-3xl">
            Prioritized case dossiers requiring administrative intervention. Every flagged work decomposes explainable risk factors, answers the five statutory vigilance questions, and routes to the designated competent authority.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] font-bold uppercase text-slate-400">Action Queue</div>
            <div className="text-lg font-black text-slate-900">
              {filteredCases.length} of {cases.length} Cases
            </div>
          </div>
        </div>
      </div>

      {/* Quick Ministerial Authority Banner (Demo & Executive Testing Mode) */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-700 p-4 rounded-2xl text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-xs shrink-0">
            <Award className="w-6 h-6 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-wide">
                {t('decision.ministerQuickMode', 'EXECUTIVE DECISION COMMAND')}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-amber-100 uppercase tracking-wider">
                Real-Time Statutory Authority
              </span>
            </div>
            <p className="text-amber-100 text-xs mt-0.5 max-w-2xl leading-relaxed">
              {t('decision.ministerQuickDesc', 'Decisions executed here immediately dispatch statutory orders to the backend, trigger PFMS treasury halts, log permanent audit records in Firestore, and stamp the case files in real-time.')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setQuickMinisterMode((prev) => !prev)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
              effectiveCanDecide
                ? 'bg-white text-indigo-900 hover:bg-amber-50'
                : 'bg-indigo-900/60 hover:bg-indigo-900 text-white border border-white/20'
            }`}
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span>
              {effectiveCanDecide
                ? '✓ Minister Authority Active'
                : '⚡ Act as Hon. Union Minister'}
            </span>
          </button>

          {Object.keys(savedDecisions).length > 0 && (
            <button
              onClick={handleResetDecisions}
              title="Reset locally saved decisions and reload default cases"
              className="px-3 py-2 rounded-xl bg-black/20 hover:bg-black/30 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Decisions ({Object.keys(savedDecisions).length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Intervention Grouping Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {interventionCategories.map((tab) => (
            <button
              key={tab.type}
              onClick={() => setActiveIntervention(tab.type)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeIntervention === tab.type
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeIntervention === tab.type
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search & Secondary Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Priority filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-bold uppercase text-[11px]">Priority:</span>
            {(['ALL', 'P0', 'P1', 'P2', 'P3'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                  priorityFilter === p
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-bold uppercase text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2 py-1 rounded border border-slate-300 text-xs font-semibold bg-white text-slate-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="New">New</option>
              <option value="Under Review">Under Review</option>
              <option value="Inspection Assigned">Inspection Assigned</option>
              <option value="Action Required">Action Required (Payment Hold)</option>
              <option value="Evidence Pending">Evidence Pending (Notice Issued)</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search case, work, contractor..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Case Dossier Cards List */}
      <div className="space-y-4">
        {filteredCases.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-base text-slate-900">No matching cases found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              All monitored works in this category align within statutory milestone and financial guidelines.
            </p>
          </div>
        ) : (
          filteredCases.map((caseItem) => {
            const isExpanded = expandedCaseId === caseItem.id;
            const projectObj = projects.find(
              (p) => p.id === caseItem.projectId || p.workCode === caseItem.projectId || p.id === caseItem.id || p.workCode === caseItem.id
            );

            const isFrozen =
              caseItem.activeDirective === 'Freeze Further Payment' ||
              caseItem.caseStatus === 'Action Required' ||
              caseItem.timeline[0]?.action?.includes('Freeze');

            const isInspectionAssigned =
              caseItem.activeDirective === 'Assign Inspection' ||
              caseItem.caseStatus === 'Inspection Assigned' ||
              caseItem.timeline[0]?.action?.includes('Inspection');

            const isNoticeIssued =
              caseItem.activeDirective === 'Generate Notice' ||
              caseItem.caseStatus === 'Evidence Pending' ||
              caseItem.timeline[0]?.action?.includes('Notice');

            const isResolved =
              caseItem.activeDirective === 'Resolve Case' ||
              caseItem.caseStatus === 'Resolved' ||
              caseItem.timeline[0]?.action?.includes('Resolve');

            const cardBorderClass = isFrozen
              ? 'border-2 border-rose-500 shadow-md ring-2 ring-rose-200/70'
              : isInspectionAssigned
              ? 'border-2 border-indigo-500 shadow-md ring-2 ring-indigo-200/70'
              : isNoticeIssued
              ? 'border-2 border-amber-500 shadow-md ring-2 ring-amber-200/70'
              : isResolved
              ? 'border-2 border-emerald-500 shadow-md ring-2 ring-emerald-200/70'
              : 'border border-slate-200 shadow-xs hover:border-slate-300';

            return (
              <div
                key={caseItem.id}
                className={`bg-white rounded-2xl overflow-hidden transition-all duration-200 ${cardBorderClass}`}
              >
                {/* Executive Directive Top Banner (Prominent Real-time Visual Stamp) */}
                {(caseItem.activeDirective || isFrozen || isInspectionAssigned || isNoticeIssued || isResolved) && (
                  <div
                    className={`px-5 py-2.5 text-xs font-bold text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs ${
                      isFrozen
                        ? 'bg-gradient-to-r from-rose-700 via-rose-600 to-red-700'
                        : isInspectionAssigned
                        ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-700'
                        : isNoticeIssued
                        ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-orange-600'
                        : isResolved
                        ? 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700'
                        : 'bg-gradient-to-r from-slate-800 to-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isFrozen ? (
                        <AlertOctagon className="w-4 h-4 text-white shrink-0 animate-pulse" />
                      ) : isInspectionAssigned ? (
                        <ClipboardList className="w-4 h-4 text-white shrink-0" />
                      ) : isNoticeIssued ? (
                        <AlertTriangle className="w-4 h-4 text-white shrink-0" />
                      ) : isResolved ? (
                        <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                      ) : (
                        <FileCheck2 className="w-4 h-4 text-white shrink-0" />
                      )}
                      <span className="tracking-wide uppercase font-black text-[11px] sm:text-xs">
                        {isFrozen
                          ? '⛔ STATUTORY DIRECTIVE ACTIVE: INTERIM PAYMENT FROZEN & DISPATCHED TO PFMS TREASURY'
                          : isInspectionAssigned
                          ? '📋 EXECUTIVE DIRECTIVE ACTIVE: MANDATORY TECHNICAL FIELD INSPECTION ORDERED'
                          : isNoticeIssued
                          ? '⚠️ STATUTORY SHOW-CAUSE NOTICE ISSUED & CONTRACTOR DISCREPANCY AUDIT ORDERED'
                          : isResolved
                          ? '✅ CASE FORMALLY RESOLVED & AUDIT RECONCILIATION SATISFIED'
                          : `EXECUTIVE DIRECTIVE ACTIVE: ${caseItem.activeDirective || caseItem.caseStatus}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px] shrink-0 text-white/90">
                      <span>By: {caseItem.directiveBy || 'Hon. Union Minister Shri P. K. Rao'}</span>
                      <span className="bg-black/25 px-2 py-0.5 rounded text-[10px] font-bold">
                        {caseItem.directiveDate ? new Date(caseItem.directiveDate).toLocaleDateString() : 'ENFORCED'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Main Card Header Bar */}
                <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                        {caseItem.id}
                      </span>
                      <PriorityBadge priority={caseItem.priority} />
                      <CaseStatusBadge status={caseItem.caseStatus} />
                      {caseItem.activeDirective && (
                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wider flex items-center gap-1 border shadow-2xs ${
                            isFrozen
                              ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                              : isInspectionAssigned
                              ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                              : isNoticeIssued
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : isResolved
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-slate-100 text-slate-800 border-slate-300'
                          }`}
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>{caseItem.activeDirective} [Active]</span>
                        </span>
                      )}
                      <FraudStatusBadge status={caseItem.fraudStatus} />
                      <ResponsibleAuthorityBadge authority={caseItem.responsibleAuthority} />
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {caseItem.projectTitle}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">
                        📍 {caseItem.location} ({caseItem.constituency})
                      </span>
                      <span>
                        Contractor: <strong className="text-slate-800">{caseItem.contractorName}</strong>
                      </span>
                      <span>
                        Agency: <strong className="text-slate-800">{caseItem.implementingAgency}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Financial & Risk Snapshot Pill */}
                  <div className="flex items-center gap-4 shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase text-slate-400">Risk Score</div>
                      <div
                        className={`text-lg font-black ${
                          caseItem.riskScore >= 75
                            ? 'text-rose-700'
                            : caseItem.riskScore >= 50
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {caseItem.riskScore}/100
                      </div>
                      <div className="text-[10px] font-semibold text-slate-500">{caseItem.riskLevel}</div>
                    </div>

                    <div className="h-8 w-px bg-slate-200"></div>

                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase text-slate-400">Financial Exposure</div>
                      <div className="text-lg font-black text-rose-800">
                        ₹{caseItem.financialExposureLakhs} L
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Sanction ₹{caseItem.sanctionedLakhs} L
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Directive Highlight Callout Box */}
                {caseItem.activeDirective && (
                  <div
                    className={`mx-5 my-3 p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200 ${
                      isFrozen
                        ? 'bg-rose-50/80 border-rose-300 text-rose-950'
                        : isInspectionAssigned
                        ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950'
                        : isNoticeIssued
                        ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                        : isResolved
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-white shadow-xs font-black text-xs shrink-0 flex items-center gap-1.5 border border-black/5">
                        <Award className="w-4 h-4 text-amber-600" />
                        <span className="text-slate-900">DIRECTIVE STAMP</span>
                      </div>
                      <div className="text-xs space-y-1">
                        <div className="font-bold flex flex-wrap items-center gap-2">
                          <span className="text-sm font-black">{caseItem.activeDirective}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white border border-black/10 font-bold">
                            Docket Status: {caseItem.caseStatus}
                          </span>
                        </div>
                        <div className="text-[11px] opacity-80">
                          Authorized By: <strong className="font-semibold">{caseItem.directiveBy || 'Hon. Union Minister Shri P. K. Rao'}</strong>
                          {caseItem.assignedOfficer && (
                            <span> • Assigned Officer: <strong className="font-semibold">{caseItem.assignedOfficer}</strong></span>
                          )}
                          {caseItem.deadlineDate && (
                            <span> • Compliance Deadline: <strong className="font-semibold font-mono">{caseItem.deadlineDate}</strong></span>
                          )}
                        </div>
                        {caseItem.directiveNotes && (
                          <div className="mt-1 p-2 rounded-lg bg-white/90 text-slate-800 text-xs italic border border-black/5 leading-relaxed">
                            “{caseItem.directiveNotes}”
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5 self-end sm:self-center">
                      <span className="px-3 py-1.5 rounded-lg bg-slate-900 text-amber-300 font-bold text-xs tracking-wider uppercase flex items-center gap-1.5 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Order Enforced</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* Primary Anomaly & Next Action Overview */}
                <div className="px-5 py-3.5 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs border-b border-slate-100">
                  <div className="space-y-1 flex-1">
                    <div className="font-bold text-slate-800">
                      ⚠️ Primary Discrepancy Signal:
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {caseItem.primaryAnomaly}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setExpandedCaseId(isExpanded ? null : caseItem.id)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{isExpanded ? t('decision.hide5Q', 'Hide 5Q Analysis') : t('decision.examine5Q', 'Examine 5Q Model')}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {projectObj && (
                      <button
                        onClick={() => onInspectProject(projectObj)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors cursor-pointer"
                      >
                        {t('decision.fullDossier', 'Full Dossier')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expandable 5-Question Framework & Risk Decomposition */}
                {isExpanded && (
                  <div className="p-5 bg-slate-50 border-b border-slate-200 space-y-4 animate-in fade-in duration-150">
                    {/* Explainable Additive Factor Breakdown */}
                    {(() => {
                      const decomp = ensureValidRiskDecomposition(caseItem.riskDecomposition, caseItem.riskScore, projectObj);
                      const computedSum =
                        decomp.financialAnomaly +
                        decomp.progressMismatch +
                        decomp.delayPoints +
                        decomp.contractorRisk +
                        decomp.duplicateProbability +
                        decomp.dataQualityRisk;
                      return (
                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{t('decision.explainableRiskDecomp', 'Explainable Risk Decomposition (+Additive Weights)')}</span>
                            </div>
                            <div className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800">
                              {t('decision.additiveSum', 'Additive Sum')}: +{computedSum} / {decomp.totalScore} pts
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center">
                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
                              <div className="text-[10px] font-bold text-slate-500">{t('decision.financialAnomaly', 'Financial Anomaly')}</div>
                              <div className="text-sm font-black text-rose-700 mt-0.5">
                                +{decomp.financialAnomaly}
                              </div>
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
                              <div className="text-[10px] font-bold text-slate-500">{t('decision.progressMismatch', 'Progress Mismatch')}</div>
                              <div className="text-sm font-black text-amber-700 mt-0.5">
                                +{decomp.progressMismatch}
                              </div>
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
                              <div className="text-[10px] font-bold text-slate-500">{t('decision.milestoneDelay', 'Milestone Delay')}</div>
                              <div className="text-sm font-black text-slate-800 mt-0.5">
                                +{decomp.delayPoints}
                              </div>
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
                              <div className="text-[10px] font-bold text-slate-500">{t('decision.contractorRisk', 'Contractor Risk')}</div>
                              <div className="text-sm font-black text-slate-800 mt-0.5">
                                +{decomp.contractorRisk}
                              </div>
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
                              <div className="text-[10px] font-bold text-slate-500">{t('decision.duplicateProbability', 'Duplicate Probability')}</div>
                              <div className="text-sm font-black text-slate-800 mt-0.5">
                                +{decomp.duplicateProbability}
                              </div>
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
                              <div className="text-[10px] font-bold text-slate-500">{t('decision.dataQuality', 'Data Quality')}</div>
                              <div className="text-sm font-black text-slate-800 mt-0.5">
                                +{decomp.dataQualityRisk}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Python ML Inference & Risk Fusion Dossier */}
                    {projectObj && (
                      <PythonMlIntelligencePanel project={projectObj} />
                    )}

                    {/* 5-Question Framework Display */}
                    <FiveQuestionCard
                      model={caseItem.fiveQuestions}
                      priority={caseItem.priority}
                      authority={caseItem.responsibleAuthority}
                      riskScore={caseItem.riskScore}
                      financialExposureLakhs={caseItem.financialExposureLakhs}
                      actionLabel={`Assign ${caseItem.interventionType}`}
                      onExecuteAction={() => openAction(caseItem, 'Assign Inspection')}
                    />

                    {/* Audit Timeline */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-slate-400" />
                        <span>Case Audit Trail & Directives</span>
                      </div>
                      <div className="space-y-2">
                        {caseItem.timeline.map((event) => (
                          <div
                            key={event.id}
                            className="text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start justify-between gap-4"
                          >
                            <div>
                              <span className="font-bold text-slate-800">{event.action}</span>
                              <span className="text-slate-500 ml-2">by {event.performedBy}</span>
                              {event.notes && (
                                <p className="text-slate-600 mt-1">{event.notes}</p>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                              {new Date(event.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Operational Action Buttons Bar with Real-Time Stamped Badges */}
                <div className="px-5 py-3 bg-white flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span>Target Authority:</span>
                    <strong className="text-slate-800">{caseItem.responsibleAuthority}</strong>
                    {caseItem.assignedOfficer && (
                      <span className="ml-2 text-indigo-700 font-semibold">
                        • Assigned to: {caseItem.assignedOfficer}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => openAction(caseItem, 'Assign Inspection')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                        isInspectionAssigned
                          ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>{isInspectionAssigned ? `📋 ${t('decision.inspectionAssigned', 'Inspection Ordered')} ✓` : t('decision.assignInspection', 'Assign Inspection')}</span>
                    </button>

                    <button
                      onClick={() => openAction(caseItem, 'Request Documents')}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{t('phrases.Request Documents', 'Request Documents')}</span>
                    </button>

                    <button
                      onClick={() => openAction(caseItem, 'Freeze Further Payment')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 cursor-pointer border ${
                        isFrozen
                          ? 'bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-300 animate-pulse'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                      }`}
                    >
                      <AlertOctagon className="w-3.5 h-3.5" />
                      <span>{isFrozen ? `⛔ ${t('decision.paymentFrozen', 'Payment Frozen')} ✓` : t('decision.freezePayment', 'Freeze Payment')}</span>
                    </button>

                    <button
                      onClick={() => openAction(caseItem, 'Generate Notice')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                        isNoticeIssued
                          ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-300'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{isNoticeIssued ? `⚠️ ${t('decision.noticeIssued', 'Notice Dispatched')} ✓` : t('decision.generateNotice', 'Generate Notice')}</span>
                    </button>

                    <button
                      onClick={() => openAction(caseItem, 'Resolve Case')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                        isResolved
                          ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      <span>{isResolved ? `✅ ${t('decision.caseResolved', 'Case Resolved')} ✓` : t('decision.resolveCase', 'Resolve Case')}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Action Directive Confirmation Modal */}
      <DecisionActionModal
        isOpen={Boolean(selectedCaseForAction && currentActionType)}
        onClose={() => {
          setSelectedCaseForAction(null);
          setCurrentActionType(null);
        }}
        caseItem={selectedCaseForAction}
        actionType={currentActionType}
        onConfirmAction={handleConfirmAction}
        currentUser={currentUserForModal}
      />
    </div>
  );
};
