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
