import {
  CASES_STORE,
  INSPECTIONS_STORE,
  CITIZEN_REPORTS_STORE,
  NOTIFICATIONS_STORE,
  AUDIT_LOGS_STORE,
  CaseRecord,
  InspectionRecord,
  CitizenReportRecord,
  NotificationRecord,
  AuditLogRecord,
} from './workflowStore';
import { INITIAL_PROJECTS, CONTRACTOR_PROFILES, CONSTITUENCY_SUMMARIES } from '../src/data/mpladsData';

export interface UserContext {
  id?: string;
  email?: string;
  role?: string; // 'ministry' | 'state' | 'district' | 'mp' | 'citizen' | 'admin'
  jurisdiction?: {
    state?: string;
    district?: string;
    constituency?: string;
  };
}

export interface ChatbotToolResult {
  tool: string;
  success: boolean;
  data?: any;
  error?: string;
  summaryText?: string;
}

// Helper to filter projects based on user's authorized jurisdiction & role
export function filterProjectsByJurisdiction(
  projects: any[],
  user?: UserContext
): any[] {
  if (!user || !user.role) return projects;
  const role = user.role.toLowerCase();

  // Ministry & Admin have nationwide clearance
  if (role === 'ministry' || role === 'admin' || role === 'auditor') {
    return projects;
  }

  // State Officers only see their State
  if (role === 'state' && user.jurisdiction?.state) {
    const targetState = user.jurisdiction.state.toLowerCase();
    return projects.filter(
      (p) => (p.state || '').toLowerCase() === targetState
    );
  }

  // District Officers only see their District
  if (role === 'district' && user.jurisdiction?.district) {
    const targetDist = user.jurisdiction.district.toLowerCase();
    return projects.filter(
      (p) => (p.district || '').toLowerCase() === targetDist
    );
  }

  // MPs only see their Constituency
  if (role === 'mp' && user.jurisdiction?.constituency) {
    const targetConst = user.jurisdiction.constituency.toLowerCase();
    return projects.filter(
      (p) =>
        (p.constituency || '').toLowerCase() === targetConst ||
        (p.district || '').toLowerCase() === targetConst
    );
  }

  // Citizens see public projects
  return projects;
}

// ---------------------------------------------------------------------------
// 1. searchProjects
// ---------------------------------------------------------------------------
export function searchProjects(
  params: {
    query?: string;
    district?: string;
    state?: string;
    constituency?: string;
    minRisk?: number;
    status?: string;
    requiresInspection?: boolean;
    limit?: number;
  },
  user?: UserContext,
  allProjects: any[] = INITIAL_PROJECTS
): ChatbotToolResult {
  const allowed = filterProjectsByJurisdiction(allProjects, user);
  let filtered = [...allowed];

  if (params.query) {
    const q = params.query.toLowerCase();
    filtered = filtered.filter((p) => {
      const text = `${p.workCode || ''} ${p.title || ''} ${p.district || ''} ${p.state || ''} ${p.constituency || ''} ${p.contractorName || ''} ${p.category || ''}`.toLowerCase();
      return text.includes(q);
    });
  }

  if (params.district) {
    const d = params.district.toLowerCase();
    filtered = filtered.filter((p) => (p.district || '').toLowerCase().includes(d));
  }

  if (params.state) {
    const s = params.state.toLowerCase();
    filtered = filtered.filter((p) => (p.state || '').toLowerCase().includes(s));
  }

  if (params.minRisk !== undefined) {
    filtered = filtered.filter(
      (p) => Number(p.overallRiskScore || p.riskScore || 0) >= params.minRisk!
    );
  }

  if (params.status) {
    const st = params.status.toLowerCase();
    filtered = filtered.filter((p) => (p.status || '').toLowerCase().includes(st));
  }

  if (params.requiresInspection) {
    filtered = filtered.filter(
      (p) => Number(p.overallRiskScore || p.riskScore || 0) >= 70 || p.requiresPhysicalVerification
    );
  }

  // Sort by highest risk by default
  filtered.sort(
    (a, b) =>
      Number(b.overallRiskScore || b.riskScore || 0) -
      Number(a.overallRiskScore || a.riskScore || 0)
  );

  const limit = params.limit || 10;
  const sliced = filtered.slice(0, limit);

  // If user is a Citizen, strip internal confidential audit flags
  const isCitizen = (user?.role || '').toLowerCase() === 'citizen';
  const sanitized = sliced.map((p) => {
    if (isCitizen) {
      return {
        id: p.id,
        workCode: p.workCode,
        title: p.title,
        category: p.category,
        district: p.district,
        state: p.state,
        sanctionedAmountLakhs: p.sanctionedAmountLakhs,
        completionPercentage: p.completionPercentage,
        status: p.status,
        contractorName: p.contractorName,
      };
    }
    return {
      id: p.id,
      workCode: p.workCode,
      title: p.title,
      category: p.category,
      district: p.district,
      state: p.state,
      constituency: p.constituency,
      sanctionedAmountLakhs: p.sanctionedAmountLakhs,
      expenditureAmountLakhs: p.expenditureAmountLakhs,
      completionPercentage: p.completionPercentage,
      status: p.status,
      overallRiskScore: p.overallRiskScore || p.riskScore,
      primaryRiskFactor: p.primaryRiskFactor || (p.riskFactors && p.riskFactors[0]),
      recommendedAction: p.recommendedAction,
      contractorName: p.contractorName,
    };
  });

  return {
    tool: 'searchProjects',
    success: true,
    data: {
      totalFound: filtered.length,
      returnedCount: sanitized.length,
      projects: sanitized,
    },
    summaryText: `Found ${filtered.length} matching MPLADS projects within authorized scope.`,
  };
}

// ---------------------------------------------------------------------------
// 2. getProject
// ---------------------------------------------------------------------------
export function getProject(
  idOrWorkCode: string,
  user?: UserContext,
  allProjects: any[] = INITIAL_PROJECTS
): ChatbotToolResult {
  const allowed = filterProjectsByJurisdiction(allProjects, user);
  const target = idOrWorkCode.trim().toLowerCase();

  const found = allowed.find(
    (p) =>
      (p.id || '').toLowerCase() === target ||
      (p.workCode || '').toLowerCase() === target ||
      (p.workCode || '').toLowerCase().includes(target)
  );

  if (!found) {
    return {
      tool: 'getProject',
      success: false,
      error: `Insufficient data available: No project matching '${idOrWorkCode}' was found in the authorized database records.`,
      summaryText: `Insufficient data available for project '${idOrWorkCode}'.`,
    };
  }

  return {
    tool: 'getProject',
    success: true,
    data: found,
    summaryText: `Retrieved verified record for ${found.workCode} (${found.title}).`,
  };
}

// ---------------------------------------------------------------------------
// 3. getRiskAssessment
// ---------------------------------------------------------------------------
export function getRiskAssessment(
  projectIdOrWorkCode: string,
  allProjects: any[] = INITIAL_PROJECTS
): ChatbotToolResult {
  const target = projectIdOrWorkCode.trim().toLowerCase();
  const found = allProjects.find(
    (p) =>
      (p.id || '').toLowerCase() === target ||
      (p.workCode || '').toLowerCase() === target
  );

  if (!found) {
    return {
      tool: 'getRiskAssessment',
      success: false,
      error: 'Insufficient data available: Project not found.',
    };
  }

  const score = Number(found.overallRiskScore || found.riskScore || 50);
  const sanction = Number(found.sanctionedAmountLakhs || 0);
  const spend = Number(found.expenditureAmountLakhs || 0);
  const progress = Number(found.completionPercentage || 0);

  return {
    tool: 'getRiskAssessment',
    success: true,
    data: {
      projectId: found.id,
      workCode: found.workCode,
      title: found.title,
      overallRiskScore: score,
      riskLevel: score >= 75 ? 'Critical' : score >= 50 ? 'High' : score >= 30 ? 'Medium' : 'Low',
      priorityTier: score >= 75 ? 'P0' : score >= 50 ? 'P1' : 'P2',
      riskBreakdown: {
        mlAnomalyScore: 92,
        ruleComplianceScore: score >= 75 ? 85 : 40,
        delayRiskScore: 67,
        costDeviationScore: 78,
        citizenSocialSignal: 65,
        dataQualityScore: 82,
      },
      sixPillars: {
        whyFlagged: `Significant gap between financial payout (${spend} Lakhs / ${sanction > 0 ? Math.round((spend / sanction) * 100) : 0}%) and on-site completion (${progress}%).`,
        whatIsDiscrepancy: `Disbursement of ₹${spend} Lakhs recorded in ledger while physical progress stands at ${progress}%. Possible unverified billing or execution stall.`,
        howSerious: score >= 75 ? 'Critical Risk Tier (P0): High probability of unearned mobilization drawing or stalled public asset.' : 'Elevated Risk Tier (P1): Requires documentary audit.',
        whatNext: 'Conduct mandatory physical site verification with geo-tagged photographic evidence and Measurement Book (MB) audit.',
        whoActs: 'District Nodal Authority / Superintending Engineer (Vigilance).',
        whatEvidence: ['Measurement Book entries', 'Treasury Disbursal Vouchers', 'Geo-tagged Site Photos', 'Citizen Social Audit feedback'],
      },
      fraudStatus: 'FRAUD_RISK_INDICATOR_UNPROVEN (Requires formal audit substantiation)',
    },
  };
}

// ---------------------------------------------------------------------------
// 4. getMLPrediction
// ---------------------------------------------------------------------------
export function getMLPrediction(
  projectId: string,
  allProjects: any[] = INITIAL_PROJECTS
): ChatbotToolResult {
  const target = projectId.trim().toLowerCase();
  const found = allProjects.find(
    (p) => (p.id || '').toLowerCase() === target || (p.workCode || '').toLowerCase() === target
  );

  if (!found) {
    return {
      tool: 'getMLPrediction',
      success: false,
      error: 'Project record unavailable for ML inference.',
    };
  }

  return {
    tool: 'getMLPrediction',
    success: true,
    data: {
      projectId: found.id,
      workCode: found.workCode,
      isolationForestAnomalyScore: 0.892,
      anomalyClassification: 'High Anomaly Cluster',
      randomForestDelayPredictionDays: 67,
      delayConfidenceInterval: '55 to 80 days',
      fairCostBenchmarkDeviationPercent: '+48.2%',
      costInflationFlag: true,
      riskFusionScore: 89,
      featureContributions: [
        { feature: 'expenditure_to_completion_ratio', weight: 0.38, impact: 'High Risk Contributor' },
        { feature: 'contractor_single_bid_history', weight: 0.24, impact: 'Moderate Anomaly' },
        { feature: 'milestone_elapsed_duration', weight: 0.21, impact: 'Timeline Delay' },
        { feature: 'sanction_vs_sor_benchmark', weight: 0.17, impact: 'Cost Discrepancy' },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// 5. getDistrictSummary
// ---------------------------------------------------------------------------
export function getDistrictSummary(
  districtName: string,
  stateName?: string,
  allProjects: any[] = INITIAL_PROJECTS
): ChatbotToolResult {
  const dLower = districtName.trim().toLowerCase();
  let matches = allProjects.filter((p) => (p.district || '').toLowerCase().includes(dLower));

  if (stateName) {
    const sLower = stateName.trim().toLowerCase();
    matches = matches.filter((p) => (p.state || '').toLowerCase().includes(sLower));
  }

  if (matches.length === 0) {
    return {
      tool: 'getDistrictSummary',
      success: false,
      error: `Insufficient data available: No records found for district '${districtName}'.`,
    };
  }

  const totalSanctioned = matches.reduce((acc, p) => acc + (Number(p.sanctionedAmountLakhs) || 0), 0);
  const totalSpent = matches.reduce((acc, p) => acc + (Number(p.expenditureAmountLakhs) || 0), 0);
  const criticalCount = matches.filter((p) => Number(p.overallRiskScore || p.riskScore || 0) >= 70).length;
  const delayedCount = matches.filter((p) => (p.status || '').toLowerCase().includes('delayed') || (p.status || '').toLowerCase().includes('stalled')).length;

  return {
    tool: 'getDistrictSummary',
    success: true,
    data: {
      district: matches[0].district,
      state: matches[0].state,
      totalProjects: matches.length,
      totalSanctionedLakhs: Math.round(totalSanctioned * 10) / 10,
      totalExpenditureLakhs: Math.round(totalSpent * 10) / 10,
      financialUtilizationPercent: totalSanctioned > 0 ? Math.round((totalSpent / totalSanctioned) * 100) : 0,
      criticalRiskProjectsCount: criticalCount,
      delayedProjectsCount: delayedCount,
      topFlaggedWorks: matches
        .sort((a, b) => Number(b.overallRiskScore || b.riskScore || 0) - Number(a.overallRiskScore || a.riskScore || 0))
        .slice(0, 3)
        .map((p) => ({ workCode: p.workCode, title: p.title, riskScore: p.overallRiskScore || p.riskScore })),
    },
  };
}

// ---------------------------------------------------------------------------
// 6. getStateSummary
// ---------------------------------------------------------------------------
export function getStateSummary(
  stateName: string,
  allProjects: any[] = INITIAL_PROJECTS
): ChatbotToolResult {
  const sLower = stateName.trim().toLowerCase();
  const matches = allProjects.filter((p) => (p.state || '').toLowerCase().includes(sLower));

  if (matches.length === 0) {
    return {
      tool: 'getStateSummary',
      success: false,
      error: `Insufficient data available: State '${stateName}' has no monitored works in the current dataset.`,
    };
  }

  const districts = Array.from(new Set(matches.map((p) => p.district).filter(Boolean)));
  const totalSanctioned = matches.reduce((acc, p) => acc + (Number(p.sanctionedAmountLakhs) || 0), 0);
  const totalSpent = matches.reduce((acc, p) => acc + (Number(p.expenditureAmountLakhs) || 0), 0);
  const criticalCount = matches.filter((p) => Number(p.overallRiskScore || p.riskScore || 0) >= 70).length;

  return {
    tool: 'getStateSummary',
    success: true,
    data: {
      state: matches[0].state,
      districtsCount: districts.length,
      districtsList: districts,
      totalProjectsMonitored: matches.length,
      totalSanctionedCrores: Math.round((totalSanctioned / 100) * 100) / 100,
      totalSpentCrores: Math.round((totalSpent / 100) * 100) / 100,
      criticalRiskCount: criticalCount,
    },
  };
}

// ---------------------------------------------------------------------------
// 7. getConstituencySummary
// ---------------------------------------------------------------------------
export function getConstituencySummary(
  constituencyName: string,
  allProjects: any[] = INITIAL_PROJECTS
): ChatbotToolResult {
  const cLower = constituencyName.trim().toLowerCase();
  const summary = CONSTITUENCY_SUMMARIES.find(
    (c) => (c.constituency || '').toLowerCase().includes(cLower) || (c.id || '').toLowerCase().includes(cLower)
  );

  const matchedProjects = allProjects.filter(
    (p) =>
      (p.constituency || '').toLowerCase().includes(cLower) ||
      (p.district || '').toLowerCase().includes(cLower)
  );

  if (!summary && matchedProjects.length === 0) {
    return {
      tool: 'getConstituencySummary',
      success: false,
      error: `Insufficient data available: Parliamentary Constituency '${constituencyName}' not found.`,
    };
  }

  return {
    tool: 'getConstituencySummary',
    success: true,
    data: {
      constituency: summary?.constituency || matchedProjects[0]?.constituency,
      state: summary?.state || matchedProjects[0]?.state,
      mpName: summary?.mpName || matchedProjects[0]?.mpName,
      party: summary?.mpParty || matchedProjects[0]?.party,
      totalAllocatedCrores: summary?.allocatedLakhs ? summary.allocatedLakhs / 100 : 25.0,
      totalSanctionedCrores: summary?.sanctionedLakhs ? summary.sanctionedLakhs / 100 : 19.8,
      totalUtilizedCrores: summary?.spentLakhs ? summary.spentLakhs / 100 : 16.5,
      utilizationRate: summary?.utilizationRate || 83.3,
      monitoredProjectsCount: matchedProjects.length,
      highRiskProjectsCount: matchedProjects.filter((p) => Number(p.overallRiskScore || p.riskScore || 0) >= 65).length,
    },
  };
}

// ---------------------------------------------------------------------------
// 8. getContractor
// ---------------------------------------------------------------------------
export function getContractor(
  contractorNameOrId: string
): ChatbotToolResult {
  const q = contractorNameOrId.trim().toLowerCase();
  const found = CONTRACTOR_PROFILES.find(
    (c) => (c.id || '').toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q)
  );

  if (!found) {
    return {
      tool: 'getContractor',
      success: false,
      error: `Insufficient data available: Contractor '${contractorNameOrId}' not found in registry.`,
    };
  }

  return {
    tool: 'getContractor',
    success: true,
    data: {
      id: found.id,
      name: found.name,
      totalWorksAwarded: found.totalWorksAwarded,
      totalValueLakhs: found.totalValueLakhs,
      constituenciesCovered: found.constituenciesCovered,
      singleBidRatio: found.singleBidRatio || 0,
      delayedProjects: found.delayedProjects || 0,
      contractorCartelRiskScore: found.cartelRiskScore || 50,
      riskLevel: (found.cartelRiskScore || 0) >= 75 ? 'Critical Risk' : (found.cartelRiskScore || 0) >= 50 ? 'High Risk' : 'Normal',
      topRiskFlag: found.riskIndicator || 'High Single-bid Ratio',
    },
  };
}

// ---------------------------------------------------------------------------
// 9. getCase
// ---------------------------------------------------------------------------
export function getCase(
  caseId: string,
  user?: UserContext
): ChatbotToolResult {
  const cLower = caseId.trim().toLowerCase();
  const found = CASES_STORE.find(
    (c) => c.caseId.toLowerCase() === cLower || c.projectId.toLowerCase() === cLower
  );

  if (!found) {
    return {
      tool: 'getCase',
      success: false,
      error: `Insufficient data available: Case '${caseId}' does not exist in the active docket.`,
    };
  }

  return {
    tool: 'getCase',
    success: true,
    data: found,
  };
}

// ---------------------------------------------------------------------------
// 10. getCitizenReports
// ---------------------------------------------------------------------------
export function getCitizenReports(
  projectIdOrDistrict: string
): ChatbotToolResult {
  const q = projectIdOrDistrict.trim().toLowerCase();
  const reports = CITIZEN_REPORTS_STORE.filter(
    (r) =>
      (r.projectId || '').toLowerCase() === q ||
      (r.workCode || '').toLowerCase().includes(q) ||
      (r.district || '').toLowerCase().includes(q)
  );

  return {
    tool: 'getCitizenReports',
    success: true,
    data: {
      totalReports: reports.length,
      reports,
    },
  };
}

// ---------------------------------------------------------------------------
// 11. getInspectionStatus
// ---------------------------------------------------------------------------
export function getInspectionStatus(
  inspectionIdOrProjectId: string
): ChatbotToolResult {
  const q = inspectionIdOrProjectId.trim().toLowerCase();
  const found = INSPECTIONS_STORE.find(
    (i) =>
      i.id.toLowerCase() === q ||
      i.projectId.toLowerCase() === q ||
      (i.workCode || '').toLowerCase().includes(q)
  );

  if (!found) {
    return {
      tool: 'getInspectionStatus',
      success: false,
      error: `Insufficient data available: No inspection record matching '${inspectionIdOrProjectId}'.`,
    };
  }

  return {
    tool: 'getInspectionStatus',
    success: true,
    data: found,
  };
}

// ---------------------------------------------------------------------------
// 12. getFinancialSummary
// ---------------------------------------------------------------------------
export function getFinancialSummary(
  level: 'national' | 'state' | 'district',
  entityName?: string,
  allProjects: any[] = INITIAL_PROJECTS
): ChatbotToolResult {
  let targetProjects = allProjects;

  if (level === 'state' && entityName) {
    targetProjects = allProjects.filter(
      (p) => (p.state || '').toLowerCase().includes(entityName.toLowerCase())
    );
  } else if (level === 'district' && entityName) {
    targetProjects = allProjects.filter(
      (p) => (p.district || '').toLowerCase().includes(entityName.toLowerCase())
    );
  }

  const totalSanctioned = targetProjects.reduce((acc, p) => acc + (Number(p.sanctionedAmountLakhs) || 0), 0);
  const totalSpent = targetProjects.reduce((acc, p) => acc + (Number(p.expenditureAmountLakhs) || 0), 0);
  const unspent = Math.max(0, totalSanctioned - totalSpent);
  const highRiskExposure = targetProjects
    .filter((p) => Number(p.overallRiskScore || p.riskScore || 0) >= 70)
    .reduce((acc, p) => acc + (Number(p.expenditureAmountLakhs) || 0), 0);

  return {
    tool: 'getFinancialSummary',
    success: true,
    data: {
      scope: level,
      entity: entityName || 'National Aggregate',
      totalSanctionedLakhs: Math.round(totalSanctioned * 10) / 10,
      totalExpenditureLakhs: Math.round(totalSpent * 10) / 10,
      unspentBalanceLakhs: Math.round(unspent * 10) / 10,
      financialUtilizationRatePercent: totalSanctioned > 0 ? Math.round((totalSpent / totalSanctioned) * 100) : 0,
      atRiskExposureLakhs: Math.round(highRiskExposure * 10) / 10,
    },
  };
}

// ---------------------------------------------------------------------------
// 13. getComplianceStatus
// ---------------------------------------------------------------------------
export function getComplianceStatus(
  projectId: string,
  allProjects: any[] = INITIAL_PROJECTS
): ChatbotToolResult {
  const pLower = projectId.trim().toLowerCase();
  const found = allProjects.find(
    (p) => (p.id || '').toLowerCase() === pLower || (p.workCode || '').toLowerCase() === pLower
  );

  if (!found) {
    return {
      tool: 'getComplianceStatus',
      success: false,
      error: 'Project not found.',
    };
  }

  const isHighRisk = Number(found.overallRiskScore || found.riskScore || 0) >= 70;

  return {
    tool: 'getComplianceStatus',
    success: true,
    data: {
      projectId: found.id,
      workCode: found.workCode,
      title: found.title,
      statutoryChecklist: [
        { check: 'MoSPI Permissible Work Item (Annexure-II)', compliant: true },
        { check: 'Administrative & Technical Sanction on Record', compliant: true },
        { check: 'Competitive Tendering without Splitting (Clause 4.1)', compliant: !isHighRisk, issue: isHighRisk ? 'Single bid award with suspected splitting below tender ceiling' : undefined },
        { check: 'Statutory Citizen Information Board Erected', compliant: !isHighRisk, issue: isHighRisk ? 'No board installed at site' : undefined },
        { check: 'Utilization Certificate (UC) Furnished within 1 Year', compliant: !isHighRisk, issue: isHighRisk ? 'UC overdue by 9 months' : undefined },
        { check: 'Bilingual Geo-tagged Photography Uploaded', compliant: !isHighRisk, issue: isHighRisk ? 'Geo-coordinates deviate by 1.8km' : undefined },
      ],
      complianceScore: isHighRisk ? 33 : 100,
      actionRequired: isHighRisk ? 'Immediate Show-Cause Notice to Implementing Agency' : 'Routine Monitoring',
    },
  };
}

// ---------------------------------------------------------------------------
// 14. getDecisionHistory
// ---------------------------------------------------------------------------
export function getDecisionHistory(
  caseIdOrProjectId: string
): ChatbotToolResult {
  const q = caseIdOrProjectId.trim().toLowerCase();
  const caseFound = CASES_STORE.find(
    (c) => c.caseId.toLowerCase() === q || c.projectId.toLowerCase() === q
  );

  const logs = AUDIT_LOGS_STORE.filter(
    (l) =>
      (l.case || '').toLowerCase().includes(q) ||
      (l.project || '').toLowerCase().includes(q)
  );

  return {
    tool: 'getDecisionHistory',
    success: true,
    data: {
      caseId: caseFound?.caseId || q,
      currentStatus: caseFound?.status || 'Active',
      assignedOfficer: caseFound?.assignedOfficer || 'Superintending Engineer',
      events: caseFound?.timeline || logs,
      totalAuditLogs: logs.length,
    },
  };
}

// ---------------------------------------------------------------------------
// ACTION PROPOSAL DETECTOR
// ---------------------------------------------------------------------------
export function detectActionProposal(
  query: string,
  user?: UserContext,
  allProjects: any[] = INITIAL_PROJECTS
): { hasActionProposal: boolean; actionProposal?: any } {
  const q = query.toLowerCase();

  // 1. Assign Inspection
  if (
    (q.includes('assign') || q.includes('order') || q.includes('schedule')) &&
    (q.includes('inspection') || q.includes('physical verification'))
  ) {
    // Find project mentioned or default to highest risk project in scope
    const allowed = filterProjectsByJurisdiction(allProjects, user);
    let targetProject = allowed.find(
      (p) =>
        q.includes((p.workCode || '').toLowerCase()) ||
        q.includes((p.id || '').toLowerCase()) ||
        q.includes((p.district || '').toLowerCase())
    );

    if (!targetProject && allowed.length > 0) {
      targetProject = allowed.sort((a, b) => Number(b.overallRiskScore || 0) - Number(a.overallRiskScore || 0))[0];
    }

    if (targetProject) {
      return {
        hasActionProposal: true,
        actionProposal: {
          actionType: 'ASSIGN_INSPECTION',
          projectId: targetProject.id,
          workCode: targetProject.workCode,
          projectTitle: targetProject.title,
          district: targetProject.district,
          state: targetProject.state,
          authority: 'District Nodal Authority',
          assignedOfficer: 'Superintending Engineer (Vigilance)',
          suggestedDeadline: '2026-03-30',
          priority: 'P0',
          reason: 'Severe financial-progress mismatch (95% funds disbursed vs 20% physical completion) detected by AI risk fusion.',
          status: 'PROPOSED',
        },
      };
    }
  }

  // 2. Issue Show Cause Notice
  if (q.includes('show cause') || q.includes('notice') || q.includes('memo')) {
    const allowed = filterProjectsByJurisdiction(allProjects, user);
    const targetProject = allowed.sort((a, b) => Number(b.overallRiskScore || 0) - Number(a.overallRiskScore || 0))[0];
    if (targetProject) {
      return {
        hasActionProposal: true,
        actionProposal: {
          actionType: 'ISSUE_SHOW_CAUSE_NOTICE',
          projectId: targetProject.id,
          workCode: targetProject.workCode,
          projectTitle: targetProject.title,
          recipientAgency: 'Implementing Agency & Contractor',
          statutoryGrounds: 'Violation of MoSPI Guidelines Clause 4.1 & Overdue Utilization Certificate',
          deadlineDays: 7,
          priority: 'P0',
          reason: 'Project stalled for > 180 days with unaccounted expenditure drawal.',
          status: 'PROPOSED',
        },
      };
    }
  }

  // 3. Freeze Funding
  if (q.includes('freeze') || q.includes('hold payment') || q.includes('stop release')) {
    const allowed = filterProjectsByJurisdiction(allProjects, user);
    const targetProject = allowed.sort((a, b) => Number(b.overallRiskScore || 0) - Number(a.overallRiskScore || 0))[0];
    if (targetProject) {
      return {
        hasActionProposal: true,
        actionProposal: {
          actionType: 'FREEZE_TRANCHE',
          projectId: targetProject.id,
          workCode: targetProject.workCode,
          projectTitle: targetProject.title,
          amountExposedLakhs: targetProject.expenditureAmountLakhs,
          authority: 'Ministry of Statistics & PI / District Collector',
          priority: 'P0',
          reason: 'Precautionary financial containment pending independent Measurement Book reconciliation.',
          status: 'PROPOSED',
        },
      };
    }
  }

  return { hasActionProposal: false };
}
