import { getDb } from './firebaseClient';
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { INITIAL_PROJECTS, CONTRACTOR_PROFILES, CONSTITUENCY_SUMMARIES } from '../src/data/mpladsData';

export type CaseStatus =
  | 'NEW'
  | 'UNDER_REVIEW'
  | 'INSPECTION_ASSIGNED'
  | 'EVIDENCE_PENDING'
  | 'ACTION_REQUIRED'
  | 'ESCALATED'
  | 'UNDER_INVESTIGATION'
  | 'RESOLVED'
  | 'CLOSED'
  | 'FALSE_POSITIVE';

export interface CaseRecord {
  caseId: string;
  projectId: string;
  workCode?: string;
  projectTitle: string;
  location: string;
  state: string;
  district: string;
  constituency: string;
  sanctionedLakhs?: number;
  expenditureLakhs?: number;
  physicalProgressPct?: number;
  financialExposureLakhs?: number;
  contractorName?: string;
  implementingAgency?: string;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  riskDecomposition?: {
    financialAnomaly: number;
    progressMismatch: number;
    delayPoints: number;
    contractorRisk: number;
    duplicateProbability: number;
    dataQualityRisk: number;
    totalScore: number;
  };
  primaryIssue: string;
  evidence: string[];
  assignedAuthority: string;
  assignedOfficer?: string;
  assignedOfficerEmail?: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  deadline: string;
  status: CaseStatus;
  activeDirective?: string;
  directiveDate?: string;
  directiveBy?: string;
  directiveNotes?: string;
  fiveQuestions?: {
    whatHappened: string;
    whyUnusual: string;
    howSerious: string;
    whatNext: string;
    evidenceRequired: string[];
  };
  timeline: {
    id: string;
    timestamp: string;
    action: string;
    performedBy: string;
    role: string;
    notes?: string;
    statusTransition?: { from: string; to: string };
    evidenceAttached?: string[];
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface InspectionRecord {
  id: string; // e.g. INSP-2026-042
  caseId: string;
  projectId: string;
  workCode?: string;
  projectTitle: string;
  location: string;
  district: string;
  state: string;
  assignedOfficerName: string;
  officerDesignation: string;
  assignedAuthority: string;
  deadlineDate: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
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
  gpsCoordinates?: { lat: number; lng: number };
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
  citizenComplaints?: string[];
  previousInspections?: string[];
  lastUpdated: string;
}

export interface CitizenReportRecord {
  reportId: string;
  projectId: string;
  workCode?: string;
  projectTitle: string;
  citizenId?: string;
  citizenName?: string;
  category:
    | 'Missing Asset'
    | 'Incomplete Work'
    | 'Poor Quality'
    | 'Wrong Location'
    | 'Duplicate Work'
    | 'Non-functional Asset'
    | 'Incorrect Status'
    | 'Other';
  description: string;
  latitude?: number;
  longitude?: number;
  photos?: string[];
  timestamp: string;
  status: 'Pending Triage' | 'Corroborated' | 'Dispatched to Officer' | 'Inspected' | 'Resolved';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  createdAt: string;
  district?: string;
  state?: string;
  isAnonymous?: boolean;
  aiClassification?: {
    category: string;
    summary: string;
    priority: string;
    relatedProject: string;
    confidence: number;
    preliminaryAssessment: string;
  };
}

export interface NotificationRecord {
  notificationId: string;
  recipientId?: string;
  recipientRole: 'MINISTRY' | 'STATE' | 'DISTRICT' | 'MP' | 'CITIZEN' | 'ALL';
  type:
    | 'CRITICAL_RISK'
    | 'CITIZEN_REPORT'
    | 'INSPECTION_ASSIGNED'
    | 'INSPECTION_OVERDUE'
    | 'RECOMMENDATION_REVIEW'
    | 'DOCUMENT_PENDING'
    | 'ESCALATION'
    | 'DEADLINE_APPROACHING'
    | 'RISK_SPIKE';
  title: string;
  message: string;
  projectId?: string;
  caseId?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  who: string;
  role: string;
  action: string;
  project?: string;
  case?: string;
  timestamp: string;
  oldState?: string;
  newState?: string;
  reason?: string;
  details?: string;
}

// ---------------------------------------------------------------------------
// IN-MEMORY STORES WITH FIRESTORE SYNCHRONIZATION
// ---------------------------------------------------------------------------

export const CASES_STORE: CaseRecord[] = [
  {
    caseId: 'CASE-2026-101',
    projectId: 'proj-001',
    workCode: 'MPLADS-VAR-2024-089',
    projectTitle: 'Construction of Multi-Purpose Community Center & Hall',
    location: 'Rampur Village Chowk, Varanasi, Uttar Pradesh',
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    constituency: 'Varanasi',
    sanctionedLakhs: 28.5,
    expenditureLakhs: 28.5,
    physicalProgressPct: 20,
    financialExposureLakhs: 22.8,
    contractorName: 'Mahadev Infra Projects Pvt Ltd',
    implementingAgency: 'Rural Engineering Services (RES) Div-1',
    riskScore: 94,
    riskLevel: 'Critical',
    riskDecomposition: {
      financialAnomaly: 30,
      progressMismatch: 22,
      delayPoints: 15,
      contractorRisk: 11,
      duplicateProbability: 12,
      dataQualityRisk: 4,
      totalScore: 94,
    },
    primaryIssue: 'Severe financial-progress mismatch (100% funds disbursed vs 20% physical completion) and duplicate sanction on PWD asset',
    evidence: [
      'Treasury Disbursal Voucher showing ₹28.5 Lakhs drawn',
      'Site drone & satellite imagery showing incomplete plinth beam structure only',
      'Duplicate Sanction detected on Existing PWD Asset (Head 5054, 96% confidence)',
      'Nomination / single-bid allocation to dominant vendor without competitive discovery',
      'Absence of statutory MoSPI citizen information display board',
    ],
    assignedAuthority: 'District Nodal Authority',
    assignedOfficer: 'Shri R. K. Sharma, SE (Vigilance)',
    assignedOfficerEmail: 'rk.sharma@vigilai.gov.in',
    priority: 'P0',
    deadline: '2026-03-30',
    status: 'ACTION_REQUIRED',
    timeline: [
      {
        id: 't-1',
        timestamp: '2026-03-01T09:00:00Z',
        action: 'AI Risk Engine Flagged Anomaly',
        performedBy: 'VigilAI Automated Anomaly Engine',
        role: 'SYSTEM',
        notes: 'Fused risk score computed at 94/100 (Financial Mismatch: 100%, Duplicate Probability: 96%). P0 action mandated.',
      },
      {
        id: 't-2',
        timestamp: '2026-03-02T11:30:00Z',
        action: 'District Officer Preliminary Review',
        performedBy: 'Shri A. K. Rai (Chief Development Officer)',
        role: 'DISTRICT',
        notes: 'Confirmed 100% expenditure against 20% physical progress. Case initiated under MoSPI Guidelines Clause 6.4.',
        statusTransition: { from: 'NEW', to: 'UNDER_REVIEW' },
      },
      {
        id: 't-3',
        timestamp: '2026-03-04T15:00:00Z',
        action: 'Physical Inspection Assigned',
        performedBy: 'District Magistrate, Varanasi',
        role: 'DISTRICT',
        notes: 'Superintending Engineer directed to conduct physical site measurement within 14 days.',
        statusTransition: { from: 'UNDER_REVIEW', to: 'INSPECTION_ASSIGNED' },
      },
    ],
    createdAt: '2026-03-01T09:00:00Z',
    updatedAt: '2026-03-04T15:00:00Z',
  },
  {
    caseId: 'CASE-2026-102',
    projectId: 'proj-002',
    workCode: 'MPLADS-GOR-2024-042',
    projectTitle: 'Drinking Water RO Plant Installation & Pipeline Network',
    location: 'Campierganj, Gorakhpur, Uttar Pradesh',
    state: 'Uttar Pradesh',
    district: 'Gorakhpur',
    constituency: 'Gorakhpur',
    sanctionedLakhs: 35.0,
    expenditureLakhs: 33.2,
    physicalProgressPct: 35,
    financialExposureLakhs: 20.95,
    contractorName: 'Purvanchal Water Infra Ltd',
    implementingAgency: 'UP Jal Nigam',
    riskScore: 91,
    riskLevel: 'Critical',
    riskDecomposition: {
      financialAnomaly: 28,
      progressMismatch: 21,
      delayPoints: 15,
      contractorRisk: 12,
      duplicateProbability: 11,
      dataQualityRisk: 4,
      totalScore: 91,
    },
    primaryIssue: 'Citizen non-functionality complaints, dry plant reports, and single-bid tender allocation',
    evidence: [
      '14 verified citizen reports reporting non-functional plant after 3 weeks',
      'Contractor Cartel Index flagged: Single bid award under sub-threshold limit',
      'Overdue milestone timeline by 65 days beyond sanction schedule',
    ],
    assignedAuthority: 'Implementing Agency',
    assignedOfficer: 'Smt. Anjali Verma, EE',
    assignedOfficerEmail: 'anjali.verma@vigilai.gov.in',
    priority: 'P0',
    deadline: '2026-04-05',
    status: 'INSPECTION_ASSIGNED',
    timeline: [
      {
        id: 't-21',
        timestamp: '2026-03-05T10:00:00Z',
        action: 'Case Created from Citizen Signal Spike',
        performedBy: 'Citizen Social Audit Engine',
        role: 'SYSTEM',
        notes: 'Cluster of 14 citizen reports corroborating asset shutdown.',
      },
    ],
    createdAt: '2026-03-05T10:00:00Z',
    updatedAt: '2026-03-05T10:00:00Z',
  },
];

export const INSPECTIONS_STORE: InspectionRecord[] = [
  {
    id: 'INSP-2026-042',
    caseId: 'CASE-2026-101',
    projectId: 'proj-001',
    workCode: 'MPLADS-VAR-2024-089',
    projectTitle: 'Construction of Multi-Purpose Community Center & Hall',
    location: 'Rohaniya Block, Varanasi, UP',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    assignedOfficerName: 'Shri R. K. Sharma, SE (Vigilance)',
    officerDesignation: 'Superintending Engineer, Vigilance Wing',
    assignedAuthority: 'District Nodal Authority',
    deadlineDate: '2026-03-30',
    priority: 'P0',
    status: 'Field Work in Progress',
    objectives: [
      'Verify physical foundation & RCC superstructure milestone against 40% measurement book entry',
      'Inspect mandatory MoSPI Citizen Information Board at site with project cost and MP details',
      'Record geo-tagged site coordinates and compare against administrative sanction',
      'Sample construction material test certificates (cement & rebar heat numbers)',
    ],
    checklist: [
      { id: 'c1', task: 'Check GPS coordinates match sanctioned boundary within 50m', completed: true, findings: 'Site matches sanction boundary' },
      { id: 'c2', task: 'Inspect physical presence of superstructure walls and columns', completed: false, findings: 'Only plinth beams visible' },
      { id: 'c3', task: 'Reconcile Measurement Book Page 42-48 with on-site work', completed: false },
      { id: 'c4', task: 'Photograph project display board showing MP name and work cost', completed: true, findings: 'Display board is missing; contractor cited fabrication delay' },
    ],
    gpsCoordinates: { lat: 25.3176, lng: 82.9739 },
    requiredDocuments: ['Measurement Book (MB)', 'Itemized Vouchers', 'SoR Compliance Sheet', 'Material Invoices'],
    uploadedEvidence: [
      {
        id: 'ev-1',
        title: 'Site Foundation Photo (North Elevation)',
        type: 'Photo',
        url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
        timestamp: '2026-03-12T10:15:00Z',
        uploadedBy: 'R. K. Sharma',
      },
    ],
    inspectionNotes: 'Initial inspection conducted on site. Contractor representative present. Actual progress visually does not exceed 20-25%.',
    officerFindings: 'Clear discrepancy between 95% billing withdrawal and site state. Formal verification report pending contractor explanation.',
    citizenComplaints: [
      'RCC pillar structure was erected 8 months ago, but no masonry or roof work has been done.',
    ],
    previousInspections: ['Preliminary sanction inspection by Junior Engineer on 2024-04-10 (Passed)'],
    lastUpdated: '2026-03-12T11:00:00Z',
  },
  {
    id: 'INSP-2026-043',
    caseId: 'CASE-2026-102',
    projectId: 'proj-002',
    workCode: 'MPLADS-GOR-2024-042',
    projectTitle: 'Drinking Water RO Plant Installation & Pipeline Network',
    location: 'Campierganj, Gorakhpur, UP',
    district: 'Gorakhpur',
    state: 'Uttar Pradesh',
    assignedOfficerName: 'Smt. Anjali Verma, EE',
    officerDesignation: 'Executive Engineer, Rural Water Supply',
    assignedAuthority: 'Implementing Agency',
    deadlineDate: '2026-04-05',
    priority: 'P1',
    status: 'Scheduled',
    objectives: [
      'Verify operational status of water purification membranes and pipeline distribution network',
      'Interview local Gram Panchayat representatives regarding commissioning date and daily yield',
    ],
    checklist: [
      { id: 'c21', task: 'Verify pump & RO membrane machinery installation', completed: false },
      { id: 'c22', task: 'Obtain water quality lab test certificate', completed: false },
      { id: 'c23', task: 'Verify electrical supply connection and meter reading', completed: false },
    ],
    gpsCoordinates: { lat: 26.7606, lng: 83.3732 },
    requiredDocuments: ['Equipment Invoice', 'Water Quality Certificate', 'Electricity Sanction Letter'],
    uploadedEvidence: [],
    inspectionNotes: 'Scheduled for joint inspection with Gram Pradhan.',
    officerFindings: '',
    lastUpdated: '2026-03-10T14:30:00Z',
  },
];

export const CITIZEN_REPORTS_STORE: CitizenReportRecord[] = [
  {
    reportId: 'CIT-2026-081',
    projectId: 'PROJ-01',
    workCode: 'MPLADS/2023-24/UP/VAR-089',
    projectTitle: 'Construction of Community Health Sub-Center at Rohaniya',
    citizenId: 'cit-9921',
    citizenName: 'Devendra Tripathi',
    category: 'Incomplete Work',
    description: 'RCC pillar structure was erected 8 months ago, but no masonry or roof work has been done. The official portal shows 65% completion while on ground cattle are tied here.',
    latitude: 25.3176,
    longitude: 82.9739,
    photos: ['https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600'],
    timestamp: '2026-03-08T14:20:00Z',
    status: 'Corroborated',
    priority: 'P0',
    createdAt: '2026-03-08T14:20:00Z',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    isAnonymous: false,
    aiClassification: {
      category: 'Incomplete Work',
      summary: 'Potential structural stall: Foundation erected with no recent progress',
      priority: 'P0',
      relatedProject: 'MPLADS/2023-24/UP/VAR-089',
      confidence: 0.94,
      preliminaryAssessment: 'Potential issue requiring verification.',
    },
  },
  {
    reportId: 'CIT-2026-082',
    projectId: 'PROJ-02',
    workCode: 'MPLADS/2023-24/UP/GOR-042',
    projectTitle: 'Drinking Water RO Plant Installation & Pipeline Network',
    citizenId: 'cit-anonymous',
    citizenName: 'Anonymous Citizen',
    category: 'Non-functional Asset',
    description: 'Lights and plant stopped functioning within 3 weeks of inauguration. No contractor contact details displayed on the citizen board.',
    latitude: 26.7606,
    longitude: 83.3732,
    photos: [],
    timestamp: '2026-03-10T09:15:00Z',
    status: 'Dispatched to Officer',
    priority: 'P1',
    createdAt: '2026-03-10T09:15:00Z',
    district: 'Gorakhpur',
    state: 'Uttar Pradesh',
    isAnonymous: true,
    aiClassification: {
      category: 'Non-functional Asset',
      summary: 'Public asset operational failure post-inauguration',
      priority: 'P1',
      relatedProject: 'MPLADS/2023-24/UP/GOR-042',
      confidence: 0.88,
      preliminaryAssessment: 'Potential issue requiring verification.',
    },
  },
];

export const NOTIFICATIONS_STORE: NotificationRecord[] = [
  {
    notificationId: 'notif-001',
    recipientRole: 'DISTRICT',
    type: 'CRITICAL_RISK',
    title: 'P0 Risk Alert: VAR-089 Financial Mismatch',
    message: 'Work Code MPLADS/2023-24/UP/VAR-089 triggered critical anomaly (89/100). Disbursed 95% against 20% completion.',
    projectId: 'PROJ-01',
    caseId: 'CASE-2026-089',
    read: false,
    createdAt: '2026-03-01T09:05:00Z',
  },
  {
    notificationId: 'notif-002',
    recipientRole: 'DISTRICT',
    type: 'INSPECTION_ASSIGNED',
    title: 'Inspection Assigned: INSP-2026-042',
    message: 'You have been assigned site inspection for Community Health Sub-Center. Deadline: 30 March 2026.',
    projectId: 'PROJ-01',
    caseId: 'CASE-2026-089',
    read: false,
    createdAt: '2026-03-04T15:05:00Z',
  },
  {
    notificationId: 'notif-003',
    recipientRole: 'MINISTRY',
    type: 'RISK_SPIKE',
    title: 'National Risk Alert: Contractor Concentration Spike',
    message: 'Apex InfraWorks Ltd awarded 39.4% of total constituency works in Varanasi with high single-bid ratio.',
    projectId: 'PROJ-01',
    caseId: 'CASE-2026-089',
    read: false,
    createdAt: '2026-03-02T10:00:00Z',
  },
  {
    notificationId: 'notif-004',
    recipientRole: 'MP',
    type: 'CITIZEN_REPORT',
    title: 'New Citizen Feedback: Rohaniya Health Sub-Center',
    message: 'A citizen reported incomplete construction on your recommended work MPLADS/2023-24/UP/VAR-089.',
    projectId: 'PROJ-01',
    caseId: 'CASE-2026-089',
    read: true,
    createdAt: '2026-03-08T14:25:00Z',
  },
  {
    notificationId: 'notif-005',
    recipientRole: 'CITIZEN',
    type: 'CITIZEN_REPORT',
    title: 'Report Received: CIT-2026-081',
    message: 'Your report regarding Rohaniya Health Sub-Center has been received and corroborated by the VigilAI watchdog system.',
    projectId: 'PROJ-01',
    read: false,
    createdAt: '2026-03-08T14:21:00Z',
  },
];

export const AUDIT_LOGS_STORE: AuditLogRecord[] = [
  {
    id: 'al-001',
    who: 'VigilAI Automated Anomaly Engine',
    role: 'SYSTEM',
    action: 'RISK_DETECTED',
    project: 'MPLADS/2023-24/UP/VAR-089',
    case: 'CASE-2026-089',
    timestamp: '2026-03-01T09:00:00Z',
    details: 'System computed multi-factor risk score 89/100. P0 intervention recommended.',
  },
  {
    id: 'al-002',
    who: 'Shri A. K. Rai (CDO)',
    role: 'DISTRICT',
    action: 'HUMAN_REVIEW',
    project: 'MPLADS/2023-24/UP/VAR-089',
    case: 'CASE-2026-089',
    timestamp: '2026-03-02T11:30:00Z',
    oldState: 'NEW',
    newState: 'UNDER_REVIEW',
    reason: 'Verified expenditure ledger against progress report.',
    details: 'Officer flagged financial discrepancy under MoSPI Guidelines Clause 6.4.',
  },
  {
    id: 'al-003',
    who: 'District Magistrate, Varanasi',
    role: 'DISTRICT',
    action: 'INSPECTION_ASSIGNED',
    project: 'MPLADS/2023-24/UP/VAR-089',
    case: 'CASE-2026-089',
    timestamp: '2026-03-04T15:00:00Z',
    oldState: 'UNDER_REVIEW',
    newState: 'INSPECTION_ASSIGNED',
    reason: 'Physical on-site verification required.',
    details: 'Assigned Superintending Engineer R. K. Sharma. Deadline set to 2026-03-30.',
  },
];

// Helper to log all state transitions to Firestore and memory
export async function logAuditEvent(params: {
  who: string;
  role: string;
  action: string;
  project?: string;
  case?: string;
  oldState?: string;
  newState?: string;
  reason?: string;
  details?: string;
}) {
  const log: AuditLogRecord = {
    id: `al-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    ...params,
  };
  AUDIT_LOGS_STORE.unshift(log);

  const database = getDb();
  if (database) {
    try {
      await setDoc(doc(database, 'audit_logs', log.id), log);
    } catch (e) {
      console.warn('Firestore audit log write notice:', e);
    }
  }
  return log;
}

// Helper to create notifications in Firestore and memory
export async function createNotification(params: {
  recipientId?: string;
  recipientRole: 'MINISTRY' | 'STATE' | 'DISTRICT' | 'MP' | 'CITIZEN' | 'ALL';
  type: NotificationRecord['type'];
  title: string;
  message: string;
  projectId?: string;
  caseId?: string;
}) {
  const notif: NotificationRecord = {
    notificationId: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    read: false,
    createdAt: new Date().toISOString(),
    ...params,
  };
  NOTIFICATIONS_STORE.unshift(notif);

  const database = getDb();
  if (database) {
    try {
      await setDoc(doc(database, 'notifications', notif.notificationId), notif);
    } catch (e) {
      console.warn('Firestore notification write notice:', e);
    }
  }
  return notif;
}

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

export const MINISTER_ACTIONS_STORE: MinisterActionRecord[] = [
  {
    id: 'MIN-ACT-1726001',
    actionId: 'MIN-ACT-1726001',
    caseId: 'CASE-2026-001',
    projectId: 'PROJ-01',
    workCode: 'MPLADS/2023-24/UP/VAR-089',
    projectTitle: 'Construction of Community Hall, Rohania, Varanasi',
    actionType: 'Freeze Further Payment',
    ministerName: 'Hon. Union Minister Shri P. K. Rao',
    ministerEmail: 'minister@mplads.vigilai',
    ministerRole: 'MINISTER',
    notes: 'Severe milestone discrepancy: 92% funds disbursed while physical work stands at 32%. Disbursements frozen pending physical ground verification.',
    directives: 'Direct treasury to cease release of final installment (₹24.0 Lakhs). Direct District Collector to conduct physical measurement.',
    statusTransition: { from: 'UNDER_REVIEW', to: 'ACTION_REQUIRED' },
    statutoryClause: 'MPLADS Guidelines 2023 Clause 6.4 & GFR Rule 144',
    timestamp: '2026-03-24T14:30:00.000Z',
    digitalSignature: 'SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  {
    id: 'MIN-ACT-1726002',
    actionId: 'MIN-ACT-1726002',
    caseId: 'CASE-2026-002',
    projectId: 'PROJ-02',
    workCode: 'MPLADS/2022-23/BH/PAT-045',
    projectTitle: 'Solar Street Lights Installation, Danapur, Patna',
    actionType: 'Assign Inspection',
    ministerName: 'Hon. Union Minister Shri P. K. Rao',
    ministerEmail: 'minister@mplads.vigilai',
    ministerRole: 'MINISTER',
    notes: 'Duplicate geo-coordinates detected. Assigned Superintending Engineer to conduct unannounced on-site audit.',
    directives: 'Verify barcode and serial numbers of solar panels installed. Compare with vendor billing records.',
    officerAssigned: 'Shri R. K. Sharma, SE (Vigilance)',
    deadlineDate: '2026-03-30',
    statusTransition: { from: 'NEW', to: 'INSPECTION_ASSIGNED' },
    statutoryClause: 'MPLADS Guidelines 2023 Clause 7.1',
    timestamp: '2026-03-25T10:15:00.000Z',
    digitalSignature: 'SHA256:2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
  },
];

export async function logMinisterAction(action: Omit<MinisterActionRecord, 'id'>) {
  const id = action.actionId || `MIN-ACT-${Date.now()}`;
  const record: MinisterActionRecord = {
    ...action,
    id,
    actionId: id,
    timestamp: action.timestamp || new Date().toISOString(),
    digitalSignature: `SHA256:${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`,
  };
  MINISTER_ACTIONS_STORE.unshift(record);

  const database = getDb();
  if (database) {
    try {
      await setDoc(doc(database, 'minister_actions', id), record);
    } catch (e) {
      console.warn('Firestore minister action write notice:', e);
    }
  }
  return record;
}
