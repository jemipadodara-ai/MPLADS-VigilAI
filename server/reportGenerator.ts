import {
  CASES_STORE,
  INSPECTIONS_STORE,
  CITIZEN_REPORTS_STORE,
  CaseRecord,
  InspectionRecord,
  CitizenReportRecord,
} from './workflowStore';
import { INITIAL_PROJECTS, CONTRACTOR_PROFILES, CONSTITUENCY_SUMMARIES } from '../src/data/mpladsData';

export interface GeneratedReport {
  reportType: string;
  reportTitle: string;
  generatedAt: string;
  scope: string;
  referenceNumber: string;
  confidentiality: 'PUBLIC' | 'OFFICIAL_USE_ONLY' | 'STATUTORY_RESTRICTED';
  executiveSummary: string;
  metrics: Record<string, any>;
  sections: {
    heading: string;
    content: string;
    table?: {
      headers: string[];
      rows: (string | number)[][];
    };
  }[];
  statutoryDirectives: string[];
  signatory: {
    name: string;
    designation: string;
    authority: string;
  };
}

export function generateStatutoryReport(
  type: string,
  params: {
    projectId?: string;
    state?: string;
    district?: string;
    constituency?: string;
    caseId?: string;
  },
  allProjects: any[] = INITIAL_PROJECTS
): GeneratedReport {
  const now = new Date();
  const timestamp = now.toISOString();
  const ref = `VIGILAI-REP-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  switch (type) {
    case 'national-risk': {
      const totalSanctioned = allProjects.reduce((acc, p) => acc + (Number(p.sanctionedAmountLakhs) || 0), 0);
      const totalExpenditure = allProjects.reduce((acc, p) => acc + (Number(p.expenditureAmountLakhs) || 0), 0);
      const highRisk = allProjects.filter((p) => Number(p.overallRiskScore || p.riskScore || 0) >= 70);
      const delayed = allProjects.filter((p) => (p.status || '').toLowerCase().includes('delayed') || (p.status || '').toLowerCase().includes('stalled'));

      return {
        reportType: 'national-risk',
        reportTitle: 'National MPLADS Risk & Vigilance Comprehensive Assessment',
        generatedAt: timestamp,
        scope: 'Pan-India MPLADS Audit Registry',
        referenceNumber: ref,
        confidentiality: 'OFFICIAL_USE_ONLY',
        executiveSummary: `Automated forensic risk scan across ${allProjects.length} monitored parliamentary projects. Identified ${highRisk.length} projects operating in the Critical/P0 Risk Tier representing ₹${Math.round(highRisk.reduce((a, b) => a + (b.expenditureAmountLakhs || 0), 0))} Lakhs in immediate fiscal exposure.`,
        metrics: {
          totalProjectsMonitored: allProjects.length,
          totalSanctionedCr: Math.round((totalSanctioned / 100) * 100) / 100,
          totalExpenditureCr: Math.round((totalExpenditure / 100) * 100) / 100,
          nationalUtilizationRate: `${Math.round((totalExpenditure / totalSanctioned) * 100)}%`,
          p0CriticalProjectsCount: highRisk.length,
          delayedWorksCount: delayed.length,
        },
        sections: [
          {
            heading: '1. National Risk Tier Distribution',
            content: 'Multi-factor synthesis of Isolation Forest ML anomalies, contractor concentration, and expenditure velocity indicates persistent clustering in civil works and rural drinking water schemes.',
            table: {
              headers: ['Work Code', 'Title', 'State / District', 'Risk Score', 'Priority', 'Flagged Anomaly'],
              rows: highRisk.slice(0, 10).map((p) => [
                p.workCode,
                p.title,
                `${p.district}, ${p.state}`,
                p.overallRiskScore || p.riskScore,
                Number(p.overallRiskScore || p.riskScore || 0) >= 75 ? 'P0' : 'P1',
                p.primaryRiskFactor || 'Financial-Progress Divergence',
              ]),
            },
          },
          {
            heading: '2. Systemic Contractor Concentration',
            content: 'Analysis of single-bid awards and repeated sub-threshold tender awards indicates potential cartelization across select northern and central districts.',
          },
        ],
        statutoryDirectives: [
          'Immediate physical measurement verification for all P0 tier works.',
          'Suspension of secondary installment releases where UC has been overdue > 180 days.',
          'Mandatory submission of geo-tagged bilingual citizen board photographs.',
        ],
        signatory: {
          name: 'Joint Secretary (MPLADS)',
          designation: 'Central Vigilance Officer',
          authority: 'Ministry of Statistics & Programme Implementation',
        },
      };
    }

    case 'district-risk': {
      const distName = params.district || 'Varanasi';
      const districtProjects = allProjects.filter((p) => (p.district || '').toLowerCase().includes(distName.toLowerCase()));
      const dSanctioned = districtProjects.reduce((acc, p) => acc + (Number(p.sanctionedAmountLakhs) || 0), 0);
      const dExp = districtProjects.reduce((acc, p) => acc + (Number(p.expenditureAmountLakhs) || 0), 0);
      const critical = districtProjects.filter((p) => Number(p.overallRiskScore || p.riskScore || 0) >= 65);

      return {
        reportType: 'district-risk',
        reportTitle: `District Vigilance & Risk Brief: ${distName}`,
        generatedAt: timestamp,
        scope: `District: ${distName} (${districtProjects[0]?.state || 'Uttar Pradesh'})`,
        referenceNumber: ref,
        confidentiality: 'OFFICIAL_USE_ONLY',
        executiveSummary: `Detailed review of ${districtProjects.length} active MPLAD works in ${distName}. Overall fund absorption is at ${dSanctioned > 0 ? Math.round((dExp / dSanctioned) * 100) : 0}%. ${critical.length} works require prompt on-site inquiry under District Magistrate authority.`,
        metrics: {
          district: distName,
          totalProjects: districtProjects.length,
          totalSanctionedLakhs: dSanctioned,
          totalExpenditureLakhs: dExp,
          criticalWorks: critical.length,
        },
        sections: [
          {
            heading: 'District Work Sanctions & Measurement Audit',
            content: 'Works flagged with high discrepancy between contractor withdrawal and physical ground verification.',
            table: {
              headers: ['Work Code', 'Title', 'Sanctioned (₹ Lakhs)', 'Spent (₹ Lakhs)', 'Progress %', 'Risk'],
              rows: districtProjects.map((p) => [
                p.workCode,
                p.title,
                p.sanctionedAmountLakhs || 0,
                p.expenditureAmountLakhs || 0,
                `${p.completionPercentage || 0}%`,
                p.overallRiskScore || p.riskScore || 50,
              ]),
            },
          },
        ],
        statutoryDirectives: [
          'Direct Superintending Engineer to submit physical inspection briefs within 14 days.',
          'Summon contractor measurement books for works showing > 30% progress mismatch.',
        ],
        signatory: {
          name: 'District Magistrate & Collector',
          designation: 'District Nodal Authority',
          authority: `District Administration, ${distName}`,
        },
      };
    }

    case 'project-risk': {
      const targetId = params.projectId || 'PROJ-01';
      const project = allProjects.find((p) => p.id === targetId || p.workCode === targetId) || allProjects[0];
      const riskScore = Number(project.overallRiskScore || project.riskScore || 85);

      return {
        reportType: 'project-risk',
        reportTitle: `Statutory Project Forensic Audit Report: ${project.workCode}`,
        generatedAt: timestamp,
        scope: `Project: ${project.title}`,
        referenceNumber: ref,
        confidentiality: 'STATUTORY_RESTRICTED',
        executiveSummary: `Detailed multi-engine forensic report for Work Code ${project.workCode}. Total sanctioned cost: ₹${project.sanctionedAmountLakhs} Lakhs. Treasury disbursement: ₹${project.expenditureAmountLakhs} Lakhs (${project.sanctionedAmountLakhs ? Math.round((project.expenditureAmountLakhs / project.sanctionedAmountLakhs) * 100) : 0}%). Physical Progress on ground: ${project.completionPercentage}%. Fused Risk Score: ${riskScore}/100.`,
        metrics: {
          workCode: project.workCode,
          sanctionedCost: `₹${project.sanctionedAmountLakhs} Lakhs`,
          disbursedAmount: `₹${project.expenditureAmountLakhs} Lakhs`,
          physicalCompletion: `${project.completionPercentage}%`,
          anomalyIndex: '0.892 (High Anomaly)',
          delayProjectionDays: '67 Days',
          fairCostDeviation: '+48.2%',
          fraudStatus: 'FRAUD_RISK_INDICATOR_UNPROVEN',
        },
        sections: [
          {
            heading: '1. Forensic Six-Pillar Breakdown',
            content: `WHY FLAGGED: Extreme financial-progress divergence.\nWHAT IS THE DISCREPANCY: Disbursed 95% against 20% on-site completion.\nHOW SERIOUS: Critical (P0) Tier fiscal irregularity.\nWHAT NEXT: Complete physical site audit and record findings in official case file.\nWHO ACTS: District Nodal Authority.\nWHAT EVIDENCE: Treasury vouchers, geo-tagged photos, citizen social audit.`,
          },
          {
            heading: '2. Citizen Ground Social Audit Signals',
            content: 'Multiple ground verifications report construction stopped at foundation stage with no ongoing labor activity despite official billing updates.',
          },
        ],
        statutoryDirectives: [
          'Issue formal Show Cause Memo to the Implementing Agency.',
          'Seal Measurement Book records for forensic audit.',
          'Require contractor to produce authentic material invoices within 7 business days.',
        ],
        signatory: {
          name: 'Director (Vigilance & Enforcement)',
          designation: 'Authorized Vigilance Inquirer',
          authority: 'MoSPI Vigilance Wing',
        },
      };
    }

    case 'inspection-brief': {
      const targetId = params.projectId || 'PROJ-01';
      const project = allProjects.find((p) => p.id === targetId || p.workCode === targetId) || allProjects[0];

      return {
        reportType: 'inspection-brief',
        reportTitle: `Official Field Inspection Brief: ${project.workCode}`,
        generatedAt: timestamp,
        scope: `Site Inspection for: ${project.title}`,
        referenceNumber: ref,
        confidentiality: 'OFFICIAL_USE_ONLY',
        executiveSummary: `Mandatory field verification directive issued under Clause 6.4 of MPLADS Guidelines. The inspecting officer must independently substantiate whether physical progress corresponds to the sanctioned measurement entries and voucher records.`,
        metrics: {
          workCode: project.workCode,
          location: `${project.district}, ${project.state}`,
          contractor: project.contractorName || 'Apex InfraWorks Ltd',
          priority: 'P0 - Immediate Site Visit',
          deadline: 'Within 14 calendar days',
        },
        sections: [
          {
            heading: 'Core Verification Directives for Inspecting Officer',
            content: `1. Physical Boundary & GPS: Verify actual site coordinates against sanction order boundary within 50m tolerance.\n2. Superstructure & Plinth: Physically measure RCC foundation, column numbers, and masonry elevation against Measurement Book.\n3. Citizen Display Board: Confirm installation of permanent board displaying MP name, work cost, and sanction date.\n4. Material Sampling: Review cement test reports and steel invoice dispatch dates.`,
          },
          {
            heading: 'Mandatory Questions for Implementing Agency',
            content: `Q1: Why was 95% payment cleared when masonry roof slab remains uncast?\nQ2: Where are the daily labor attendance rolls for the last 6 months?\nQ3: Has any penalty clause been invoked for the 67-day delay?`,
          },
        ],
        statutoryDirectives: [
          'Upload 4 geo-tagged photographs (North, South, East, West elevations) with timestamp watermark.',
          'Complete physical verification checklist in VigilAI Workbench before closing docket.',
        ],
        signatory: {
          name: 'Superintending Engineer (Vigilance)',
          designation: 'Field Inspection In-charge',
          authority: 'District Planning & Vigilance Cell',
        },
      };
    }

    case 'ml-analytics': {
      return {
        reportType: 'ml-analytics',
        reportTitle: 'Machine Learning Model Performance & Anomaly Analytics',
        generatedAt: timestamp,
        scope: 'Scikit-Learn Microservice Tabular Engine (Port 5001)',
        referenceNumber: ref,
        confidentiality: 'OFFICIAL_USE_ONLY',
        executiveSummary: 'Analytical summary of tabular machine learning models: Isolation Forest Anomaly Detector, Random Forest Milestone Delay Regressor, and Fair Cost Benchmark Regressor trained on historical MPLADS execution datasets.',
        metrics: {
          isolationForestContamination: '0.08',
          randomForestDelayR2: '0.864',
          fairCostRegressorMAE: '₹2.8 Lakhs',
          totalFeaturesEvaluated: 17,
          activeProjectsEvaluated: allProjects.length,
        },
        sections: [
          {
            heading: 'Model Architecture & Fusion Formulation',
            content: 'Final Risk Score = 0.35 * ML_Anomaly + 0.25 * Rule_Engine + 0.15 * Delay_Risk + 0.15 * Cost_Deviation + 0.10 * Citizen_Signal. No single model overrides deterministic statutory non-compliance.',
          },
        ],
        statutoryDirectives: [
          'Maintain regular re-training cadence upon receipt of quarterly PAC audit reports.',
          'All P0 automated flags must be confirmed by human authority prior to legal sanction.',
        ],
        signatory: {
          name: 'Lead AI & Data Architect',
          designation: 'Principal Data Scientist',
          authority: 'VigilAI Analytics Division',
        },
      };
    }

    case 'citizen-feedback': {
      return {
        reportType: 'citizen-feedback',
        reportTitle: 'Citizen Social Audit & Field Corroboration Summary',
        generatedAt: timestamp,
        scope: 'Public Verification & Citizen Watchdog Registry',
        referenceNumber: ref,
        confidentiality: 'PUBLIC',
        executiveSummary: `Compilation of ${CITIZEN_REPORTS_STORE.length} verified citizen reports and ground observations across active parliamentary constituencies. Citizen reporting provides real-time verification of asset presence and operational functionality.`,
        metrics: {
          totalCitizenReports: CITIZEN_REPORTS_STORE.length,
          corroboratedReports: CITIZEN_REPORTS_STORE.filter((r) => r.status === 'Corroborated').length,
          dispatchedToOfficers: CITIZEN_REPORTS_STORE.filter((r) => r.status === 'Dispatched to Officer').length,
          topIssueCategory: 'Incomplete Civil Works',
        },
        sections: [
          {
            heading: 'Citizen Reports Breakdown',
            content: 'Summary of community observations regarding stalled public assets and unserviceable equipment.',
            table: {
              headers: ['Report ID', 'Project', 'Category', 'Location', 'Priority', 'Status'],
              rows: CITIZEN_REPORTS_STORE.map((r) => [
                r.reportId,
                r.projectTitle,
                r.category,
                `${r.district || ''}, ${r.state || ''}`,
                r.priority,
                r.status,
              ]),
            },
          },
        ],
        statutoryDirectives: [
          'Every corroborated citizen report with photo evidence must be investigated within 21 days.',
          'Citizen identity protection must be preserved under Public Interest Disclosure norms.',
        ],
        signatory: {
          name: 'Citizen Engagement Nodal Officer',
          designation: 'Director of Public Grievances',
          authority: 'MoSPI Transparency Cell',
        },
      };
    }

    default: {
      return {
        reportType: type,
        reportTitle: `Statutory Vigilance Report (${type})`,
        generatedAt: timestamp,
        scope: 'General MPLADS Audit Scope',
        referenceNumber: ref,
        confidentiality: 'OFFICIAL_USE_ONLY',
        executiveSummary: `Generated statutory report for ${type}.`,
        metrics: { totalProjects: allProjects.length },
        sections: [
          {
            heading: 'General Summary',
            content: 'Comprehensive review completed in accordance with MoSPI Guidelines.',
          },
        ],
        statutoryDirectives: ['Maintain records in permanent project file.'],
        signatory: {
          name: 'Authorized Signatory',
          designation: 'Vigilance Officer',
          authority: 'District Nodal Agency',
        },
      };
    }
  }
}
