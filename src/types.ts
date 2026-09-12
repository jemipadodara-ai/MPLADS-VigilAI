export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type AnomalyCategory =
  | 'Financial'
  | 'Progress'
  | 'Cost'
  | 'Duplicate'
  | 'Contractor'
  | 'Data Quality'
  | 'Geographic';

export interface NormalizedProject {
  projectId: string;
  projectName: string;
  mpName: string | null;
  state: string | null;
  district: string | null;
  constituency: string | null;
  village: string | null;
  category: string | null;
  sanctionedAmount: number | null; // in Lakhs
  releasedAmount: number | null; // in Lakhs
  expenditure: number | null; // in Lakhs
  completionPercentage: number | null; // 0 - 100
  startDate: string | null;
  expectedEndDate: string | null;
  actualEndDate: string | null;
  status: string | null;
  contractorId: string | null;
  contractorName: string | null;
  latitude: number | null;
  longitude: number | null;

  // Supplementary/compatibility fields
  workCode?: string;
  implementingAgency?: string | null;
  sector?: string | null;
  description?: string | null;
  tenderType?: string | null;
  bidCount?: number | null;
  satelliteVerified?: boolean;
  notes?: string | null;
  rawDoc?: any;
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  detailedIssues: DataQualityIssue[];
  scorePenalty: number;
  anomaly: DetectedAnomaly | null;
}

export interface ProjectRiskAnalysis {
  projectId: string;
  projectName: string;
  riskScore: number;
  riskLevel: RiskLevel;
  anomalies: DetectedAnomaly[];
  riskFactors: RiskFactor[];
  similarProjects: SimilarProjectMatch[];
  mainAnomaly: string;
  requiresVerification: boolean;
  dataQualityIssues: DataQualityIssue[];
  verificationActions: string[];
}

export interface DiagnosticSummary {
  totalRecords: number;
  validRecords: number;
  dataQualityIssues: number;
  financialAnomalies: number;
  progressAnomalies: number;
  costAnomalies: number;
  potentialDuplicates: number;
  contractorIndicators: number;
  geographicAnomalies: number;
  highRiskProjects: number;
  criticalProjects: number;
  analyzedAt: string;
}

export type ProjectStatus =
  | 'Recommended'
  | 'Sanctioned'
  | 'In Progress'
  | 'Completed'
  | 'Stalled'
  | 'Delayed'
  | 'Under Investigation'
  | 'Cancelled';

export type InvestigationStatus = 'New' | 'Under Review' | 'Verified' | 'Dismissed';

export type TenderType =
  | 'Open Tender'
  | 'Limited Tender'
  | 'Nomination / Single Bid'
  | 'Quotation (Sub-threshold)';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RiskFactor {
  category: AnomalyCategory;
  points: number;
  title: string;
  description: string;
}

export interface DetectedAnomaly {
  id: string;
  category: AnomalyCategory;
  severity: RiskLevel;
  title: string;
  description: string;
  indicator: string;
  evidence: string;
  guidelineRule?: string;
  recommendedActions: string[];
}

export interface SimilarProjectMatch {
  projectId: string;
  workCode: string;
  title: string;
  similarityPercentage: number;
  reason: string;
  locationDistanceKm?: number;
}

export interface MPLADProject {
  id: string;
  workCode: string;
  title: string;
  description: string;
  category: string;
  constituencyId?: string;
  constituency: string;
  mpName: string;
  mpType?: 'Lok Sabha' | 'Rajya Sabha' | 'Nominated';
  party?: string;
  state: string;
  district: string;
  nodalDistrict?: string;
  recommendedDate?: string;
  sanctionDate: string;
  workOrderDate?: string;
  expectedCompletionDate: string;
  actualCompletionDate?: string;
  financialYear?: string;
  recommendedAmountLakhs?: number;
  sanctionedAmountLakhs: number;
  expenditureAmountLakhs: number;
  unspentAmountLakhs?: number;
  completionPercentage?: number; // 0 - 100
  status: ProjectStatus;
  implementingAgency: string;
  contractorName: string;
  contractorGstin?: string;
  tenderType?: TenderType;
  bidCount?: number;
  coordinates?: Coordinates;
  actualGeoCoordinates?: Coordinates;
  gpsLat?: number;
  gpsLng?: number;
  location?: string;
  satelliteVerified?: boolean;
  geoTagVerified?: boolean;
  geoTagDiscrepancyKm?: number;
  photoProofUrl?: string;
  hasMandatoryCitizenBoard?: boolean;
  hasUtilizationCertificate?: boolean;
  scStEarmark?: string;
  anomalyFlags?: any[];
  
  // Risk & Anomaly Intelligence
  overallRiskScore?: number; // 0 - 100
  riskScore?: number; // legacy/alias
  riskLevel?: RiskLevel;
  riskFactors?: RiskFactor[];
  detectedAnomalies?: DetectedAnomaly[];
  similarProjects?: SimilarProjectMatch[];
  mainAnomaly?: string;
  
  // Human Investigation Workflow
  investigationStatus?: InvestigationStatus;
  investigationNotes?: string;
  investigationOfficer?: string;
  lastUpdatedDate?: string;
  lastAuditedDate?: string;
  notes?: string;
  rawDoc?: any;

  // Data Provenance & Trust
  provenance?: DataProvenance;

  // Citizen Reality Check Metrics
  citizenVerificationsCount?: number;
  citizenConfirmedCount?: number;
  citizenIssueCount?: number;
  citizenDiscrepancyFlag?: boolean;
  citizenStatus?: string;
}

export interface Alert {
  id: string;
  constituencyId: string;
  constituencyName: string;
  severity: RiskLevel;
  title: string;
  description: string;
  timestamp: string;
  financialExposure: string;
  recommendedAction: string;
  status: 'New' | 'Read' | 'Under Review' | 'Resolved';
}

export interface ContractorProfile {
  id: string;
  name: string;
  gstin?: string;
  ownerOrDirector?: string;
  totalWorksAwarded: number;
  totalValueLakhs: number;
  completedProjects?: number;
  delayedProjects?: number;
  highRiskProjects?: number;
  singleBidRatio?: number;
  linkedAgencies?: string[];
  constituenciesCovered: string[];
  cartelRiskScore?: number;
  isFlaggedForSlicing?: boolean;
  subThresholdCount?: number;
  shellCompanySignals?: string[];
  riskIndicator?: string;
}

export interface ConstituencySummary {
  id?: string;
  constituency: string;
  state: string;
  mpName: string;
  mpType?: string;
  mpParty?: string;
  seatCode?: string;
  allocatedLakhs: number;
  sanctionedLakhs: number;
  spentLakhs: number;
  unspentLakhs: number;
  utilizationRate?: number;
  totalProjects: number;
  criticalAnomalies: number;
  riskTier?: 'HIGH' | 'MEDIUM' | 'LOW';
  riskScore?: number;
  scAllocationPercent?: number;
  stAllocationPercent?: number;
  avgSanctionDelayDays?: number;
  lat?: number;
  lng?: number;
}

export interface AuditFilterState {
  searchQuery?: string;
  category?: string;
  riskLevel?: string;
  anomalyType?: string;
  constituency?: string;
  status?: string;
  state?: string;
  district?: string;
}

export interface ProjectAuditResult {
  passed: boolean;
  score: number;
  anomaliesFound: DetectedAnomaly[];
  recommendations: string[];
}

export interface SandboxProposal {
  id: string;
  title: string;
  category: string;
  estimatedCostLakhs: number;
  constituency: string;
  district: string;
  implementingAgency: string;
  contractorName?: string;
  description: string;
  justification?: string;
  [key: string]: any;
}

export interface DataQualityIssue {
  id: string;
  projectId: string;
  workCode: string;
  projectTitle: string;
  district: string;
  field: string;
  issueType:
    | 'Missing Field'
    | 'Invalid Date'
    | 'Negative Amount'
    | 'Expenditure Exceeds Sanction'
    | 'Completion Exceeds 100%'
    | 'Invalid Status'
    | 'Duplicate Identifier';
  description: string;
  currentValue: string | number;
}

export interface DataProvenance {
  source: string; // e.g. "Government / data.gov.in" | "Official Baseline / MoSPI"
  dataType: 'Official' | 'AI-Derived' | 'Citizen-Submitted';
  lastSynchronized: string;
  sourceUrl?: string;
  verifiedOfficial: boolean;
  citation: string;
}

export interface CitizenVerification {
  id: string;
  projectId: string;
  workCode?: string;
  projectTitle?: string;
  constituency?: string;
  district?: string;
  state?: string;
  status:
    | 'Completed'
    | 'Incomplete'
    | 'Not Found'
    | 'Wrong Location'
    | 'Damaged'
    | 'Not Operational'
    | 'Quality Concern'
    | 'Other';
  description: string;
  locationLandmark?: string;
  citizenName?: string;
  isAnonymous: boolean;
  createdAt: string;
  photoUrl?: string;
  reviewedByAdmin?: boolean;
}

export interface InspectionPriorityItem {
  rank: number;
  project: MPLADProject;
  priorityTier: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  priorityScore: number; // 0 - 100 composite
  reasons: string[];
  suggestedChecklist: string[];
  citizenDiscrepancy: boolean;
}

export interface AuditLogEntry {
  id: string;
  userEmail: string;
  userRole: string;
  action: string;
  target: string;
  timestamp: string;
  details?: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export interface ProjectFilterState {
  searchQuery: string;
  state: string;
  district: string;
  mp: string;
  constituency: string;
  category: string;
  status: string;
  riskLevel: string;
  amountMin?: number;
  amountMax?: number;
  completionMin?: number;
  completionMax?: number;
}

// ---------------------------------------------------------------------------
// DECISION INTELLIGENCE & VIGILANCE PLATFORM EXTENSIONS
// ---------------------------------------------------------------------------

export type PlatformRole =
  | 'minister'       // Hon. Union / State Minister (Executive decisions, payment freezes, statutory orders)
  | 'admin'          // Ministry / National Administrator
  | 'district'       // District Magistrate / District Collector
  | 'nodal_officer'  // District Nodal Authority / District Officer
  | 'state_nodal'    // State Nodal Authority
  | 'mp'             // Member of Parliament
  | 'analyst'        // Senior Vigilance / Audit Analyst
  | 'citizen'        // Citizen / Public User (View-only, cannot execute decisions)
  | 'viewer'         // Public Observer (View-only)
  | 'inspector';     // Field Inspection Officer (assigned projects only)

export interface MinisterActionRecord {
  id: string;
  actionId: string;
  caseId: string;
  projectId?: string;
  workCode?: string;
  projectTitle?: string;
  actionType: string;
  ministerName: string;
  ministerEmail: string;
  ministerRole: string;
  notes: string;
  directives?: string;
  statusTransition?: { from: string; to: string };
  officerAssigned?: string;
  deadlineDate?: string;
  statutoryClause?: string;
  timestamp: string;
  digitalSignature?: string;
}

export const canMakeDecisions = (role?: string | null): boolean => {
  if (!role) return false;
  const r = role.toLowerCase();
  return ['minister', 'admin', 'district', 'nodal_officer', 'mp'].includes(r);
};

export const isMinister = (role?: string | null): boolean => {
  if (!role) return false;
  const r = role.toLowerCase();
  return r === 'minister' || r === 'admin';
};

export const isCitizenOrViewer = (role?: string | null): boolean => {
  if (!role) return true;
  const r = role.toLowerCase();
  return r === 'citizen' || r === 'viewer';
};

export const isInspector = (role?: string | null): boolean => {
  if (!role) return false;
  return role.toLowerCase() === 'inspector';
};

export type FraudStatus =
  | 'NOT_ESTABLISHED'
  | 'REQUIRES_VERIFICATION'
  | 'UNDER_INVESTIGATION'
  | 'SUBSTANTIATED'
  | 'CLOSED';

export type PriorityLevel = 'P0' | 'P1' | 'P2' | 'P3';

export type InterventionType =
  | 'Physical Inspection'
  | 'Payment Review'
  | 'Document Verification'
  | 'Contractor Review'
  | 'Duplicate Work Review'
  | 'Compliance Review'
  | 'Citizen Verification'
  | 'Closure / Resolution';

export type ResponsibleAuthority =
  | 'District Nodal Authority'
  | 'State Nodal Authority'
  | 'Ministry of Statistics & PI'
  | 'Implementing Agency'
  | 'Internal Audit Wing';

export type CaseStatus =
  | 'New'
  | 'Under Review'
  | 'Inspection Assigned'
  | 'Evidence Pending'
  | 'Action Required'
  | 'Under Investigation'
  | 'Resolved'
  | 'Closed'
  | 'False Positive';

export interface CaseTimelineEvent {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  notes?: string;
  statusTransition?: { from: CaseStatus; to: CaseStatus };
  evidenceAttached?: string[];
}

export interface RiskDecomposition {
  financialAnomaly: number; // e.g. +25
  progressMismatch: number; // e.g. +20
  delayPoints: number;      // e.g. +15
  contractorRisk: number;   // e.g. +10
  duplicateProbability: number; // e.g. +12
  dataQualityRisk: number;  // e.g. +5
  totalScore: number;       // e.g. 87/100
}

export interface FiveQuestionModel {
  whatHappened: string;
  whyUnusual: string;
  howSerious: string;
  whatNext: string;
  evidenceRequired: string[];
}

export interface DecisionCase {
  id: string; // e.g. CASE-2026-089
  projectId: string;
  projectTitle: string;
  location: string;
  state: string;
  district: string;
  constituency: string;
  sanctionedLakhs: number;
  expenditureLakhs: number;
  physicalProgressPct: number;
  financialExposureLakhs: number;
  riskScore: number;
  riskLevel: RiskLevel;
  riskFactors: RiskFactor[];
  riskDecomposition: RiskDecomposition;
  primaryAnomaly: string;
  fiveQuestions: FiveQuestionModel;
  recommendedAction: string;
  interventionType: InterventionType;
  responsibleAuthority: ResponsibleAuthority;
  priority: PriorityLevel;
  evidenceRequired: string[];
  caseStatus: CaseStatus;
  fraudStatus: FraudStatus;
  confidencePct: number;
  assignedOfficer?: string;
  assignedOfficerEmail?: string;
  deadlineDate?: string;
  timeline: CaseTimelineEvent[];
  notes?: string;
  citizenReportsCount: number;
  contractorName: string;
  implementingAgency: string;
  createdAt: string;
  updatedAt: string;
  activeDirective?: string;
  directiveDate?: string;
  directiveBy?: string;
  directiveNotes?: string;
}

export interface PredictiveRiskForecast {
  projectId: string;
  projectTitle: string;
  currentRisk: number;
  forecast30d: number;
  forecast60d: number;
  forecast90d: number;
  spendingVelocityLakhsPerMonth: number;
  progressVelocityPctPerMonth: number;
  delayDays: number;
  riskTrajectory: 'Escalating' | 'Stable' | 'De-escalating';
  factors: string[];
  isDeterministicModel: boolean;
}

export interface DuplicateWorkPair {
  id: string;
  projectA: MPLADProject;
  projectB: MPLADProject;
  similarityPercentage: number;
  distanceKm: number;
  reasons: string[];
  recommendedAction: string;
  confidencePct: number;
  status: 'Flagged' | 'Under Investigation' | 'Verified Distinct' | 'Confirmed Duplicate';
}

export interface CostBenchmarkAnalysis {
  projectId: string;
  projectTitle: string;
  category: string;
  district: string;
  state: string;
  observedCostLakhs: number;
  benchmarkRangeLakhs: [number, number];
  costVariancePct: number;
  confidencePct: number;
  isOverpriced: boolean;
  comparableCount: number;
  comparableProjects: {
    id: string;
    title: string;
    costLakhs: number;
    district: string;
  }[];
  explanation: string;
  recommendedAction: string;
}

export type ComplianceCheckStatus = 'Compliant' | 'Warning' | 'Non-compliant' | 'Unknown / Missing Data';

export interface ProjectComplianceAudit {
  projectId: string;
  eligibility: ComplianceCheckStatus;
  administrativeApproval: ComplianceCheckStatus;
  technicalApproval: ComplianceCheckStatus;
  tenderCompliance: ComplianceCheckStatus;
  financialUtilization: ComplianceCheckStatus;
  physicalProgress: ComplianceCheckStatus;
  geoVerification: ComplianceCheckStatus;
  completionDocumentation: ComplianceCheckStatus;
  utilizationCertificate: ComplianceCheckStatus;
  auditDocumentation: ComplianceCheckStatus;
  overallComplianceScore: number; // 0 - 100
  flaggedItems: string[];
}

export type CitizenReportCategory =
  | 'Missing Asset'
  | 'Incomplete Work'
  | 'Poor Quality'
  | 'Wrong Location'
  | 'Duplicate Work'
  | 'Non-functional Asset'
  | 'Incorrect Status'
  | 'Other';

export interface CitizenReportSubmission {
  id: string;
  projectId: string;
  projectTitle: string;
  location: string;
  district: string;
  state: string;
  category: CitizenReportCategory;
  description: string;
  verificationVerdict: 'Yes' | 'No' | 'Partially Completed' | 'Cannot Verify';
  evidencePriority: PriorityLevel;
  hasGps: boolean;
  hasPhoto: boolean;
  gpsCoordinates?: { lat: number; lng: number };
  photoUrl?: string;
  corroborationCount: number;
  submittedAt: string;
  citizenContact?: string;
  citizenName?: string;
  citizenPhone?: string;
  isVerifiedCitizen?: boolean;
  isAnonymous: boolean;
  status: 'Pending Triage' | 'Corroborated' | 'Dispatched to Officer' | 'Inspected' | 'Resolved';
}

export interface InspectionAssignment {
  id: string; // e.g. INSP-2026-042
  caseId: string;
  projectId: string;
  projectTitle: string;
  district: string;
  state: string;
  assignedOfficerName: string;
  officerDesignation: string;
  assignedAuthority: ResponsibleAuthority;
  deadlineDate: string;
  priority: PriorityLevel;
  status:
    | 'Pending Assignment'
    | 'Scheduled'
    | 'Field Work in Progress'
    | 'Evidence Uploaded'
    | 'Report Submitted'
    | 'Verified'
    | 'Discrepancy Confirmed';
  objectives: string[];
  checklist: {
    id: string;
    task: string;
    completed: boolean;
    findings?: string;
  }[];
  gpsCoordinates: { lat: number; lng: number };
  requiredDocuments: string[];
  uploadedEvidence: {
    id: string;
    title: string;
    type: 'Photo' | 'Measurement Book' | 'Voucher' | 'GeoTag' | 'Inspection Note';
    url: string;
    timestamp: string;
    uploadedBy: string;
  }[];
  inspectionNotes: string;
  officerFindings: string;
  lastUpdated: string;
}

export interface MinistryRecommendation {
  id: string;
  priority: PriorityLevel;
  issue: string;
  evidence: string;
  impact: string;
  recommendedIntervention: string;
  responsibleAuthority: ResponsibleAuthority;
  targetCount: number;
  financialExposureLakhs: number;
}

export interface NationalRiskIndex {
  currentValue: number; // e.g. 46.8
  previousPeriodValue: number; // e.g. 52.1
  trend: 'Improving' | 'Deteriorating' | 'Stable';
  trendDelta: number; // e.g. -5.3
  majorContributingFactors: {
    factor: string;
    impactPercentage: number;
    direction: 'Up' | 'Down';
  }[];
}

// ---------------------------------------------------------------------------
// INSPECTOR ROLE — NEW TYPES
// ---------------------------------------------------------------------------

export interface InspectorAssignedProject {
  assignmentId: string;            // e.g. INSP-2026-042
  projectId: string;               // links to MPLADProject.id or workCode
  projectWorkCode: string;         // e.g. MPLADS-2026-001
  projectTitle: string;
  district: string;
  state: string;
  constituency: string;
  sanctionedAmountLakhs: number;
  reportedPhysicalProgressPct: number;
  reportedFinancialProgressPct: number;
  riskScore?: number;
  riskLevel?: string;
  deadline: string;                // ISO date
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  status: 'Pending' | 'In Progress' | 'Submitted' | 'Overdue';
  assignedBy: string;              // Officer email/name who assigned
  assignedAt: string;              // ISO timestamp
  reportId?: string;               // populated after report is submitted
  notes?: string;                  // Officer notes to Inspector
}

export type SiteConditionStatus = 'Verified' | 'Not Verified' | 'N/A';

export interface ComponentVerification {
  name: string;                    // e.g. 'Civil Structure', 'Roads', 'Equipment'
  reportedPct: number;
  actualPct: number;
  discrepancyPct: number;
  status: 'Match' | 'Minor Discrepancy' | 'Major Discrepancy' | 'Not Inspected';
  remarks: string;
}

export interface SiteChecklist {
  item: string;
  status: SiteConditionStatus;
  remarks?: string;
}

export interface InspectionReport {
  reportId: string;                // e.g. RPT-2026-089
  assignmentId: string;
  projectId: string;
  projectWorkCode: string;
  projectTitle: string;
  district: string;
  state: string;
  inspectorEmail: string;
  inspectorName: string;

  // Step 1 — Physical Progress
  reportedPhysicalPct: number;
  actualPhysicalPct: number;
  physicalDiscrepancyPct: number;
  reportedFinancialPct: number;
  actualFinancialPct: number;
  financialDiscrepancyPct: number;

  // Step 2 — Component Verification
  componentVerifications: ComponentVerification[];

  // Step 3 — Site Condition Checklist
  siteChecklist: SiteChecklist[];
  overallSiteCondition: 'Satisfactory' | 'Needs Attention' | 'Serious Issue';

  // Step 4 — GPS
  gpsVerified: boolean;
  gpsCoordinates?: { lat: number; lng: number };
  gpsAccuracyM?: number;

  // Step 5 — Evidence
  evidenceFiles: {
    id: string;
    name: string;
    type: 'Photo' | 'Video' | 'Document' | 'GeoTag';
    size: string;
    uploadedAt: string;
  }[];

  // Step 6 — Observations
  inspectorObservations: string;
  issuesFound: string[];

  // Step 7 — Verdict
  verdict: 'Satisfactory' | 'Minor Issues' | 'Major Discrepancy' | 'Fraud Suspected';
  autoSummary: string;

  // Meta
  submittedAt: string;
  isSubmitted: boolean;
  isReadOnly: boolean;

  // Officer actions (after submission)
  officerReviewStatus?: 'Pending Review' | 'Reviewed' | 'Escalated' | 'Re-inspection Requested';
  officerNotes?: string;
  officerReviewedAt?: string;
  officerReviewedBy?: string;
}

