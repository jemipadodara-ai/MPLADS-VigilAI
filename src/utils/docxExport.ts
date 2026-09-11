import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
} from 'docx';
import { MPLADProject } from '../types';
import { computeProjectRisk } from './riskEngine';

/**
 * Maps raw JSON/model keys to human-readable labels for official reporting.
 */
const FIELD_LABEL_MAP: Record<string, string> = {
  id: 'Project System ID',
  workCode: 'Work Code / ID',
  title: 'Project Title',
  description: 'Project Description',
  category: 'Infrastructure Category',
  state: 'State',
  district: 'District',
  constituency: 'Parliamentary Constituency',
  mpName: 'Sponsoring Member of Parliament',
  sanctionedAmountLakhs: 'Approved Sanction Budget (₹ Lakhs)',
  expenditureAmountLakhs: 'Actual Expenditure (₹ Lakhs)',
  completionPercentage: 'Physical Work Completion (%)',
  status: 'Administrative Status',
  sanctionDate: 'Sanction Approval Date',
  expectedCompletionDate: 'Target Completion Date',
  actualCompletionDate: 'Actual Completion Date',
  contractorName: 'Executing Contractor / Vendor',
  implementingAgency: 'Implementing Agency',
  tenderType: 'Procurement / Tender Type',
  bidCount: 'Total Registered Bidders',
  hasMandatoryCitizenBoard: 'Citizen Information Board Installed',
  hasUtilizationCertificate: 'Utilization Certificate (UC) Submitted',
  fundUtilizationPercentage: 'Disbursement Utilization (%)',
  overallRiskScore: 'Computed Risk Score',
  riskLevel: 'Assigned Risk Level',
  costOverrunPercentage: 'Cost Overrun (%)',
  delayDays: 'Timeline Delay (Days)',
  latitude: 'Latitude Coordinate',
  longitude: 'Longitude Coordinate',
  notes: 'Field Notes & Observations',
};

function formatValue(key: string, value: any): string {
  if (value === undefined || value === null || value === '') return 'Not Specified';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') {
    if (key.toLowerCase().includes('lakh')) return `₹${value.toFixed(2)} Lakhs`;
    if (key.toLowerCase().includes('percent') || key.toLowerCase().includes('pct')) return `${value}%`;
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return 'None';
    return value.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(', ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

const borderNone = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

const borderThin = {
  top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
  left: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
  right: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
};

/**
 * Creates a formatted key-value row for Word tables.
 */
function createKeyValueRow(key: string, val: string, isAlternate = false): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 35, type: WidthType.PERCENTAGE },
        borders: borderThin,
        shading: { fill: isAlternate ? 'F8FAFC' : 'FFFFFF', type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: key,
                bold: true,
                size: 19,
                color: '334155',
                font: 'Calibri',
              }),
            ],
            spacing: { before: 80, after: 80 },
          }),
        ],
      }),
      new TableCell({
        width: { size: 65, type: WidthType.PERCENTAGE },
        borders: borderThin,
        shading: { fill: isAlternate ? 'F8FAFC' : 'FFFFFF', type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: val,
                size: 19,
                color: '0F172A',
                font: 'Calibri',
              }),
            ],
            spacing: { before: 80, after: 80 },
          }),
        ],
      }),
    ],
  });
}

/**
 * Builds the Word document structure for a single project risk report.
 */
export async function exportSingleProjectToWord(project: MPLADProject) {
  const risk = computeProjectRisk(project);
  const p = project as Record<string, any>;
  const workId = p.workCode || p.id || 'N/A';

  // Extract all meaningful fields from project object
  const detailRows: TableRow[] = [];
  let rowIdx = 0;
  const skipKeys = new Set([
    'detectedAnomalies',
    'anomalyFlags',
    'verifications',
    'milestones',
    'photos',
  ]);

  for (const [key, rawVal] of Object.entries(p)) {
    if (skipKeys.has(key)) continue;
    if (rawVal === undefined || rawVal === null || rawVal === '') continue;
    const label = FIELD_LABEL_MAP[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
    detailRows.push(createKeyValueRow(label, formatValue(key, rawVal), rowIdx % 2 === 1));
    rowIdx++;
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 },
          },
        },
        children: [
          // Header
          new Paragraph({
            children: [
              new TextRun({
                text: 'MPLADS-VigilAI',
                bold: true,
                size: 28,
                color: '1E293B',
                font: 'Calibri',
              }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'GOVERNMENT PROJECT RISK REPORT',
                bold: true,
                size: 36,
                color: '0F172A',
                font: 'Calibri',
              }),
            ],
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} • Project ID: ${workId}`,
                size: 18,
                color: '64748B',
                font: 'Calibri',
              }),
            ],
            spacing: { after: 280 },
          }),

          // 1. Project Overview Table
          new Paragraph({
            text: '1. Project Overview',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              createKeyValueRow('Project Name', p.title || 'Untitled Project', false),
              createKeyValueRow('Project ID / Work Code', workId, true),
              createKeyValueRow('District & State', `${p.district || p.constituency || 'N/A'}, ${p.state || 'N/A'}`, false),
              createKeyValueRow('Infrastructure Category', p.category || 'Public Infrastructure', true),
              createKeyValueRow('Administrative Status', p.status || 'In Progress', false),
              createKeyValueRow('Executing Contractor', p.contractorName || 'Open Procurement / Unassigned', true),
              createKeyValueRow('Implementing Agency', p.implementingAgency || 'District Rural Development Agency', false),
              createKeyValueRow('Sponsoring MP Office', p.mpName || 'Not Specified', true),
            ],
          }),

          // 2. Risk Summary
          new Paragraph({
            text: '2. Risk Summary',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 280, after: 100 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              createKeyValueRow('Assigned Risk Level', risk.riskTierLabel.toUpperCase(), false),
              createKeyValueRow('Assigned Risk Score', `${risk.riskScore} / 100`, true),
              createKeyValueRow('Risk Category', risk.riskLevel === 'High' ? 'Critical / High Attention Required' : risk.riskLevel === 'Medium' ? 'Moderate Variance' : 'Low / Nominal Risk', false),
            ],
          }),

          // 3. Why This Project Is Flagged (Risk Reasons)
          new Paragraph({
            text: '3. Why This Project Is Flagged (Detected Risk Reasons)',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 280, after: 100 },
          }),
          ...risk.reasons.map(
            (reason) =>
              new Paragraph({
                bullet: { level: 0 },
                children: [
                  new TextRun({
                    text: reason,
                    size: 20,
                    color: '1E293B',
                    font: 'Calibri',
                  }),
                ],
                spacing: { before: 60, after: 60 },
              })
          ),

          // 4. Risk Evidence
          new Paragraph({
            text: '4. Quantitative Risk Evidence & Discrepancy Telemetry',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 280, after: 100 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              createKeyValueRow('Approved Sanction Amount', `₹${risk.evidence.sanctionedAmountLakhs.toFixed(2)} Lakhs`, false),
              createKeyValueRow('Actual Released Expenditure', `₹${risk.evidence.expenditureAmountLakhs.toFixed(2)} Lakhs`, true),
              createKeyValueRow(
                'Cost Overrun / Variance',
                risk.evidence.costOverrunPct > 0
                  ? `+₹${(risk.evidence.expenditureAmountLakhs - risk.evidence.sanctionedAmountLakhs).toFixed(2)} Lakhs (+${risk.evidence.costOverrunPct}% Overrun)`
                  : '₹0.00 (Within Approved Budget)',
                false
              ),
              createKeyValueRow('Fund Utilization Rate', `${risk.evidence.fundUtilizationPct}% of Sanction Disbursed`, true),
              createKeyValueRow('Certified Physical Progress', `${risk.evidence.completionPercentage}% Certified Complete`, false),
              createKeyValueRow('Disbursement vs Physical Gap', `${risk.evidence.discrepancyGapPct}% Funds Released Ahead of Verified Progress`, true),
              createKeyValueRow('Timeline Delay Status', risk.evidence.isDelayed ? `${risk.evidence.delayDays} Days Overdue Against Schedule` : 'Milestones On Schedule', false),
              createKeyValueRow('Procurement Tender Type', risk.evidence.tenderType, true),
              createKeyValueRow('Bid Competition Count', `${risk.evidence.bidCount} Bidder(s) Recorded`, false),
              createKeyValueRow('Statutory Citizen Board', risk.evidence.hasCitizenBoard === false ? 'Non-Compliant: Missing On-Site Board' : 'Compliant / Installed', true),
              createKeyValueRow('Utilization Certificate (UC)', risk.evidence.hasUtilizationCertificate === false ? 'Pending Formal Submission' : 'Submitted and Reconciled', false),
            ],
          }),

          // 5. Complete Project Details (All Available Fields)
          new Paragraph({
            text: '5. Complete Project Records (All Registered Fields)',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 280, after: 100 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: detailRows,
          }),

          // 6. Contractor Performance Data
          new Paragraph({
            text: '6. Contractor Execution Profile',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 280, after: 100 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              createKeyValueRow('Contractor Name', p.contractorName || 'Open Procurement / Unassigned', false),
              createKeyValueRow('Active Contract Scope', p.category || 'Civil Infrastructure', true),
              createKeyValueRow('Executing Agency', p.implementingAgency || 'District Authority', false),
              createKeyValueRow('Tender Award Modality', p.tenderType || 'Open Competitive Bidding', true),
            ],
          }),

          // 7. Data Fields Used for Risk Calculation
          new Paragraph({
            text: '7. Data Fields Evaluated by Risk Engine',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 280, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'The risk level and score were calculated deterministically using the following verified fields: ',
                size: 19,
                font: 'Calibri',
                color: '475569',
              }),
              new TextRun({
                text: 'sanctionedAmountLakhs, expenditureAmountLakhs, completionPercentage, status, delayDays, expectedCompletionDate, tenderType, bidCount, hasMandatoryCitizenBoard, hasUtilizationCertificate.',
                bold: true,
                size: 19,
                font: 'Calibri',
                color: '334155',
              }),
            ],
            spacing: { before: 80, after: 160 },
          }),

          // 8. Disclaimer
          new Paragraph({
            text: 'Legal & Administrative Disclaimer',
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 240, after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Risk indicators are intended to support project monitoring and review. A risk flag does not by itself indicate fraud or wrongdoing. Official determinations require physical verification and administrative inquiry by competent authorities.',
                italics: true,
                size: 18,
                color: '64748B',
                font: 'Calibri',
              }),
            ],
            spacing: { after: 200 },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const cleanId = (workId).replace(/[^a-zA-Z0-9_-]/g, '_');
  triggerDownload(blob, `Project_Risk_Report_${cleanId}.docx`);
}

/**
 * Builds the Word document structure for filtered projects report from the Projects Registry.
 */
export async function exportFilteredProjectsToWord(
  projects: MPLADProject[],
  activeFilters: {
    search?: string;
    state?: string;
    district?: string;
    category?: string;
    status?: string;
    riskLevel?: string;
  }
) {
  if (!projects || projects.length === 0) {
    throw new Error('No projects match the selected criteria for export.');
  }

  // Applied filter descriptions
  const filterList: string[] = [];
  if (activeFilters.search) filterList.push(`Search Term: "${activeFilters.search}"`);
  if (activeFilters.state && activeFilters.state !== 'All') filterList.push(`State: ${activeFilters.state}`);
  if (activeFilters.district && activeFilters.district !== 'All') filterList.push(`District: ${activeFilters.district}`);
  if (activeFilters.category && activeFilters.category !== 'All') filterList.push(`Category: ${activeFilters.category}`);
  if (activeFilters.status && activeFilters.status !== 'All') filterList.push(`Status: ${activeFilters.status}`);
  if (activeFilters.riskLevel && activeFilters.riskLevel !== 'All') filterList.push(`Risk Level: ${activeFilters.riskLevel}`);
  if (filterList.length === 0) filterList.push('No filter constraints (Full Registry Export)');

  // Build summary table rows
  const summaryRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          borders: borderThin,
          shading: { fill: '0F172A', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: '#', bold: true, color: 'FFFFFF', size: 18 })] })],
        }),
        new TableCell({
          borders: borderThin,
          shading: { fill: '0F172A', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: 'Project Name', bold: true, color: 'FFFFFF', size: 18 })] })],
        }),
        new TableCell({
          borders: borderThin,
          shading: { fill: '0F172A', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: 'District', bold: true, color: 'FFFFFF', size: 18 })] })],
        }),
        new TableCell({
          borders: borderThin,
          shading: { fill: '0F172A', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: 'Sanction / Spent', bold: true, color: 'FFFFFF', size: 18 })] })],
        }),
        new TableCell({
          borders: borderThin,
          shading: { fill: '0F172A', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: 'Risk Level', bold: true, color: 'FFFFFF', size: 18 })] })],
        }),
        new TableCell({
          borders: borderThin,
          shading: { fill: '0F172A', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: 'Primary Flag Reason', bold: true, color: 'FFFFFF', size: 18 })] })],
        }),
      ],
    }),
  ];

  projects.forEach((proj, idx) => {
    const r = computeProjectRisk(proj);
    summaryRows.push(
      new TableRow({
        children: [
          new TableCell({
            borders: borderThin,
            shading: { fill: idx % 2 === 1 ? 'F8FAFC' : 'FFFFFF', type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: String(idx + 1), size: 17 })] })],
          }),
          new TableCell({
            borders: borderThin,
            shading: { fill: idx % 2 === 1 ? 'F8FAFC' : 'FFFFFF', type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: proj.title || 'Untitled', bold: true, size: 17 })] })],
          }),
          new TableCell({
            borders: borderThin,
            shading: { fill: idx % 2 === 1 ? 'F8FAFC' : 'FFFFFF', type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: proj.district || proj.constituency || 'N/A', size: 17 })] })],
          }),
          new TableCell({
            borders: borderThin,
            shading: { fill: idx % 2 === 1 ? 'F8FAFC' : 'FFFFFF', type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: `₹${(proj.sanctionedAmountLakhs || 0).toFixed(1)}L / ₹${(proj.expenditureAmountLakhs || 0).toFixed(1)}L`, size: 17 })] })],
          }),
          new TableCell({
            borders: borderThin,
            shading: { fill: idx % 2 === 1 ? 'F8FAFC' : 'FFFFFF', type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: `${r.riskLevel} (${r.riskScore}/100)`, bold: true, size: 17 })] })],
          }),
          new TableCell({
            borders: borderThin,
            shading: { fill: idx % 2 === 1 ? 'F8FAFC' : 'FFFFFF', type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: r.primaryReason, size: 16 })] })],
          }),
        ],
      })
    );
  });

  // Detailed Project Sections for each project
  const projectDetailSections: (Paragraph | Table)[] = [];

  projects.forEach((proj, pIndex) => {
    const risk = computeProjectRisk(proj);
    const p = proj as Record<string, any>;
    const workId = p.workCode || p.id || 'N/A';

    projectDetailSections.push(
      new Paragraph({
        text: `Project ${pIndex + 1}: ${p.title || 'Untitled Project'}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 320, after: 100 },
      })
    );

    projectDetailSections.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          createKeyValueRow('Project ID / Work Code', workId, false),
          createKeyValueRow('Assigned Risk Profile', `${risk.riskTierLabel.toUpperCase()} — Score: ${risk.riskScore}/100`, true),
          createKeyValueRow('District & State', `${p.district || p.constituency || 'N/A'}, ${p.state || 'N/A'}`, false),
          createKeyValueRow('Sector / Category', p.category || 'Civil Works', true),
          createKeyValueRow('Sanctioned Budget', `₹${(p.sanctionedAmountLakhs || 0).toFixed(2)} Lakhs`, false),
          createKeyValueRow('Actual Expenditure', `₹${(p.expenditureAmountLakhs || 0).toFixed(2)} Lakhs`, true),
          createKeyValueRow('Physical Progress', `${p.completionPercentage || 0}% Certified Complete`, false),
          createKeyValueRow('Project Status', p.status || 'Active', true),
          createKeyValueRow('Executing Contractor', p.contractorName || 'Open Procurement / Unassigned', false),
          createKeyValueRow('Implementing Agency', p.implementingAgency || 'District Authority', true),
        ],
      })
    );

    // Reasons bullet list
    projectDetailSections.push(
      new Paragraph({
        text: 'Risk Reasons & Evidence Flags:',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 140, after: 60 },
      })
    );

    risk.reasons.forEach((r) => {
      projectDetailSections.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [
            new TextRun({
              text: r,
              size: 19,
              color: '1E293B',
              font: 'Calibri',
            }),
          ],
          spacing: { before: 40, after: 40 },
        })
      );
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 },
          },
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'MPLADS-VigilAI',
                bold: true,
                size: 28,
                color: '1E293B',
                font: 'Calibri',
              }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'FILTERED PROJECT RISK REPORT',
                bold: true,
                size: 34,
                color: '0F172A',
                font: 'Calibri',
              }),
            ],
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} • Total Projects Matching Filters: ${projects.length}`,
                size: 18,
                color: '64748B',
                font: 'Calibri',
              }),
            ],
            spacing: { after: 200 },
          }),

          // Applied Filters Summary
          new Paragraph({
            text: 'Applied Filter Criteria:',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 160, after: 80 },
          }),
          ...filterList.map(
            (f) =>
              new Paragraph({
                bullet: { level: 0 },
                children: [
                  new TextRun({
                    text: f,
                    size: 19,
                    bold: true,
                    color: '334155',
                    font: 'Calibri',
                  }),
                ],
                spacing: { before: 40, after: 40 },
              })
          ),

          // Overview Table
          new Paragraph({
            text: 'Summary Table of Filtered Projects',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 100 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: summaryRows,
          }),

          // Detailed Projects
          new Paragraph({
            text: 'Detailed Project Breakdowns',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 140 },
          }),
          ...projectDetailSections,

          // Disclaimer
          new Paragraph({
            text: 'Administrative Notice & Disclaimer',
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 300, after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Risk indicators are intended to support project monitoring and review. A risk flag does not by itself indicate fraud or wrongdoing. Official determinations require physical verification and administrative inquiry by competent authorities.',
                italics: true,
                size: 18,
                color: '64748B',
                font: 'Calibri',
              }),
            ],
            spacing: { after: 200 },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const dateStr = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `MPLADS_Filtered_Projects_Risk_Report_${dateStr}.docx`);
}
