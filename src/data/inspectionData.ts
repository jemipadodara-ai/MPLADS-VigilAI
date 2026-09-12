/**
 * MPLADS VigilAI — Inspector Role: Mock Data
 * 
 * Contains:
 *  - INSPECTOR_ACCOUNTS: demo login credentials for inspectors
 *  - INSPECTOR_ASSIGNED_PROJECTS: project assignments per inspector
 *  - INSPECTION_REPORTS: pre-seeded inspection reports (submitted + draft)
 *  - INSPECTION_ORDERS: officer-created inspection orders
 */

import { InspectorAssignedProject, InspectionReport } from '../types';

// ---------------------------------------------------------------------------
// Inspector demo account configuration (mirrors PRECONFIGURED_USERS pattern)
// ---------------------------------------------------------------------------
export const INSPECTOR_ACCOUNTS: Record<string, {
  pass: string;
  name: string;
  department: string;
  description: string;
  badge: string;
  assignedProjectIds: string[];
}> = {
  'inspector@mplads.vigilai': {
    pass: 'VigilAI@2026',
    name: 'Sh. Ramesh Kumar Verma, Field Inspector (INS-104)',
    department: 'District Collectorate — Field Inspection Wing, Varanasi',
    description: 'Field Inspection Officer: Conduct on-site physical progress verification for assigned MPLADS projects.',
    badge: 'Field Inspector',
    assignedProjectIds: ['MPLADS-2026-001', 'MPLADS-2026-007', 'MPLADS-2026-012'],
  },
  'inspector2@mplads.vigilai': {
    pass: 'VigilAI@2026',
    name: 'Ms. Priya Nair, Field Inspector (INS-201)',
    department: 'District Collectorate — Field Inspection Wing, Thiruvananthapuram',
    description: 'Field Inspection Officer: Technical site verification and compliance checks.',
    badge: 'Field Inspector',
    assignedProjectIds: ['MPLADS-2026-003', 'MPLADS-2026-005'],
  },
};

// ---------------------------------------------------------------------------
// Inspector Assigned Projects — for inspector@mplads.vigilai (INS-104)
// ---------------------------------------------------------------------------
export const INSPECTOR_ASSIGNED_PROJECTS: InspectorAssignedProject[] = [
  {
    assignmentId: 'INSP-2026-042',
    projectId: 'MPLADS-2026-001',
    projectWorkCode: 'MPLADS-2026-001',
    projectTitle: 'Rural Water Supply & Sanitation — Varanasi Block A',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    constituency: 'Varanasi',
    sanctionedAmountLakhs: 45.0,
    reportedPhysicalProgressPct: 78,
    reportedFinancialProgressPct: 82,
    riskScore: 74,
    riskLevel: 'High',
    deadline: '2026-09-20',
    priority: 'P0',
    status: 'Pending',
    assignedBy: 'district@mplads.vigilai',
    assignedAt: '2026-09-01T09:00:00.000Z',
    notes: 'Priority inspection. Citizen complaints received about incomplete work at pipeline section B7. Verify actual progress against reported 78%. Photograph all completed pipeline sections.',
  },
  {
    assignmentId: 'INSP-2026-051',
    projectId: 'MPLADS-2026-007',
    projectWorkCode: 'MPLADS-2026-007',
    projectTitle: 'Community Health Sub-Centre Construction — Kashi',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    constituency: 'Varanasi',
    sanctionedAmountLakhs: 30.0,
    reportedPhysicalProgressPct: 55,
    reportedFinancialProgressPct: 70,
    riskScore: 88,
    riskLevel: 'Critical',
    deadline: '2026-09-15',
    priority: 'P1',
    status: 'Overdue',
    assignedBy: 'district@mplads.vigilai',
    assignedAt: '2026-08-25T11:30:00.000Z',
    notes: 'Financial utilization (70%) significantly exceeds physical progress (55%). Possible fund diversion. Verify foundation quality and structural work.',
  },
  {
    assignmentId: 'INSP-2026-067',
    projectId: 'MPLADS-2026-012',
    projectWorkCode: 'MPLADS-2026-012',
    projectTitle: 'Village Road Repair & Widening — Sarnath Cluster',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    constituency: 'Varanasi',
    sanctionedAmountLakhs: 25.0,
    reportedPhysicalProgressPct: 90,
    reportedFinancialProgressPct: 88,
    riskScore: 42,
    riskLevel: 'Medium',
    deadline: '2026-09-30',
    priority: 'P2',
    status: 'Submitted',
    assignedBy: 'nodal@mplads.vigilai',
    assignedAt: '2026-08-15T08:00:00.000Z',
    reportId: 'RPT-2026-031',
    notes: 'Routine verification. Confirm road surface quality and drainage channels.',
  },
];

// ---------------------------------------------------------------------------
// Pre-seeded Inspection Reports
// ---------------------------------------------------------------------------
export const INSPECTION_REPORTS: InspectionReport[] = [
  {
    // A completed report for MPLADS-2026-012 (Village Road)
    reportId: 'RPT-2026-031',
    assignmentId: 'INSP-2026-067',
    projectId: 'MPLADS-2026-012',
    projectWorkCode: 'MPLADS-2026-012',
    projectTitle: 'Village Road Repair & Widening — Sarnath Cluster',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    inspectorEmail: 'inspector@mplads.vigilai',
    inspectorName: 'Sh. Ramesh Kumar Verma, Field Inspector (INS-104)',

    reportedPhysicalPct: 90,
    actualPhysicalPct: 85,
    physicalDiscrepancyPct: 5,
    reportedFinancialPct: 88,
    actualFinancialPct: 87,
    financialDiscrepancyPct: 1,

    componentVerifications: [
      {
        name: 'Road Surface (WBM/BT)',
        reportedPct: 92,
        actualPct: 87,
        discrepancyPct: 5,
        status: 'Minor Discrepancy',
        remarks: 'Bituminous surface incomplete in 400m stretch near Sarnath junction.',
      },
      {
        name: 'Drainage Channels',
        reportedPct: 88,
        actualPct: 90,
        discrepancyPct: -2,
        status: 'Match',
        remarks: 'Drainage work exceeds reported. Well-constructed side channels observed.',
      },
      {
        name: 'Road Width Compliance',
        reportedPct: 100,
        actualPct: 100,
        discrepancyPct: 0,
        status: 'Match',
        remarks: 'Width measured at 5.5m consistently along the route.',
      },
    ],

    siteChecklist: [
      { item: 'Contractor presence on site', status: 'Verified', remarks: 'Contractor team with 12 workers present' },
      { item: 'Work order / approved plan available', status: 'Verified', remarks: 'Copy available with site engineer' },
      { item: 'Material quality certificates present', status: 'Verified', remarks: 'Bitumen grade test certificates verified' },
      { item: 'Measurement book up to date', status: 'Verified', remarks: 'MB updated till last payment' },
      { item: 'Safety signs and barricading', status: 'Not Verified', remarks: 'No barricading at 3 locations — safety risk' },
      { item: 'Completion certificate availability', status: 'N/A', remarks: 'Work not yet complete' },
      { item: 'Geo-tagged photos submitted', status: 'Verified' },
      { item: 'Social audit board visible', status: 'Verified', remarks: 'Board displayed at site entrance' },
    ],
    overallSiteCondition: 'Needs Attention',

    gpsVerified: true,
    gpsCoordinates: { lat: 25.3745, lng: 83.0061 },
    gpsAccuracyM: 4,

    evidenceFiles: [
      { id: 'EV-001', name: 'road_section_photo_1.jpg', type: 'Photo', size: '2.3 MB', uploadedAt: '2026-09-05T10:15:00.000Z' },
      { id: 'EV-002', name: 'drainage_channel_photo.jpg', type: 'Photo', size: '1.8 MB', uploadedAt: '2026-09-05T10:20:00.000Z' },
      { id: 'EV-003', name: 'measurement_book_scan.pdf', type: 'Document', size: '4.1 MB', uploadedAt: '2026-09-05T10:45:00.000Z' },
      { id: 'EV-004', name: 'site_geotag.json', type: 'GeoTag', size: '12 KB', uploadedAt: '2026-09-05T09:55:00.000Z' },
    ],

    inspectorObservations: 'The road construction is broadly progressing as per plan. Minor discrepancy of 5% in surface completion is due to pending bituminous work at Sarnath junction section. Overall work quality is acceptable. Drainage channels are well-constructed. No safety barricading observed at active work zones — this requires immediate rectification. Contractor cooperation was good during the inspection.',
    issuesFound: ['Missing safety barricading at active work zones (3 locations)', 'Bituminous surface incomplete at Sarnath junction (400m pending)'],

    verdict: 'Minor Issues',
    autoSummary: 'Site inspection completed on 05-Sep-2026. Physical progress reported at 90% vs actual 85% (5% discrepancy — Minor). Financial discrepancy: 1% (within acceptable range). Overall site condition: Needs Attention. Issues found: 2 (safety & pending surface). Verdict: Minor Issues. Recommend: Safety barricading to be installed within 48 hours, surface work completion by 20-Sep-2026.',

    submittedAt: '2026-09-05T12:30:00.000Z',
    isSubmitted: true,
    isReadOnly: true,

    officerReviewStatus: 'Reviewed',
    officerNotes: 'Noted. Contractor directed to install barricading immediately. Progress acceptable.',
    officerReviewedAt: '2026-09-06T09:00:00.000Z',
    officerReviewedBy: 'district@mplads.vigilai',
  },
];

// ---------------------------------------------------------------------------
// Inspection Orders — created by Officers, visible in Inspection Workbench
// ---------------------------------------------------------------------------
export interface InspectionOrder {
  orderId: string;
  projectId: string;
  projectWorkCode: string;
  projectTitle: string;
  district: string;
  state: string;
  createdBy: string;           // Officer email
  createdAt: string;
  assignedTo: string;          // Inspector email
  assignedInspectorName: string;
  deadline: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  instructions: string;
  status: 'Open' | 'Accepted' | 'In Progress' | 'Submitted' | 'Closed';
  reportId?: string;
}

export const INSPECTION_ORDERS: InspectionOrder[] = [
  {
    orderId: 'ORD-2026-042',
    projectId: 'MPLADS-2026-001',
    projectWorkCode: 'MPLADS-2026-001',
    projectTitle: 'Rural Water Supply & Sanitation — Varanasi Block A',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    createdBy: 'district@mplads.vigilai',
    createdAt: '2026-09-01T09:00:00.000Z',
    assignedTo: 'inspector@mplads.vigilai',
    assignedInspectorName: 'Sh. Ramesh Kumar Verma (INS-104)',
    deadline: '2026-09-20',
    priority: 'P0',
    instructions: 'Verify physical progress against reported 78%. Inspect pipeline sections B7 and B8 specifically. Photograph completed infrastructure. Citizen complaints pending resolution.',
    status: 'Open',
  },
  {
    orderId: 'ORD-2026-051',
    projectId: 'MPLADS-2026-007',
    projectWorkCode: 'MPLADS-2026-007',
    projectTitle: 'Community Health Sub-Centre Construction — Kashi',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    createdBy: 'district@mplads.vigilai',
    createdAt: '2026-08-25T11:30:00.000Z',
    assignedTo: 'inspector@mplads.vigilai',
    assignedInspectorName: 'Sh. Ramesh Kumar Verma (INS-104)',
    deadline: '2026-09-15',
    priority: 'P1',
    instructions: 'Financial utilization far exceeds physical progress. Verify structural work quality and actual foundation status. Collect contractor MBs.',
    status: 'Open',
  },
  {
    orderId: 'ORD-2026-067',
    projectId: 'MPLADS-2026-012',
    projectWorkCode: 'MPLADS-2026-012',
    projectTitle: 'Village Road Repair & Widening — Sarnath Cluster',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    createdBy: 'nodal@mplads.vigilai',
    createdAt: '2026-08-15T08:00:00.000Z',
    assignedTo: 'inspector@mplads.vigilai',
    assignedInspectorName: 'Sh. Ramesh Kumar Verma (INS-104)',
    deadline: '2026-09-30',
    priority: 'P2',
    instructions: 'Routine verification. Confirm road surface quality and drainage channels.',
    status: 'Submitted',
    reportId: 'RPT-2026-031',
  },
];
