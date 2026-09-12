import { MPLADProject, RiskLevel } from '../types';

export interface ProjectRiskEvidence {
  sanctionedAmountLakhs: number;
  expenditureAmountLakhs: number;
  costOverrunPct: number;
  fundUtilizationPct: number;
  completionPercentage: number;
  discrepancyGapPct: number; // fund utilization % - completion %
  delayDays: number;
  isDelayed: boolean;
  tenderType: string;
  bidCount: number;
  contractorName: string;
  hasCitizenBoard?: boolean;
  hasUtilizationCertificate?: boolean;
}

export interface ProjectRiskDetails {
  riskScore: number;
  riskLevel: 'High' | 'Medium' | 'Low';
  riskTierLabel: string;
  primaryReason: string;
  reasons: string[];
  evidence: ProjectRiskEvidence;
  recommendedAction: string;
}

/**
 * Single source of truth for Risk Level based strictly on Risk Score.
 * 70 - 100: High
 * 40 - 69:  Medium
 * 0 - 39:   Low
 */
export function scoreToRiskLevel(score: number): 'High' | 'Medium' | 'Low' {
  const clean = Math.min(100, Math.max(0, Math.round(score || 0)));
  if (clean >= 70) return 'High';
  if (clean >= 40) return 'Medium';
  return 'Low';
}

/**
 * Computes deterministic, data-backed risk analysis for any MPLAD project.
 * Uses ONLY real fields from the project record:
 * - Sanctioned amount vs Expenditure (Cost overrun)
 * - Fund utilization % vs Physical completion % (Financial discrepancy gap)
 * - Target completion date vs current date or delayDays (Milestone delay)
 * - Tender type & bid count (Procurement risk)
 * - Status (Under Investigation / Delayed)
 * - Statutory compliance (Citizen boards, UCs)
 */
export function computeProjectRisk(p: MPLADProject): ProjectRiskDetails {
  const sanctioned = p.sanctionedAmountLakhs || 0;
  const expenditure = p.expenditureAmountLakhs || 0;
  const progress = p.completionPercentage || 0;

  // 1. Cost overrun calculation
  let costOverrunPct = 0;
  if (sanctioned > 0 && expenditure > sanctioned) {
    costOverrunPct = Math.round(((expenditure - sanctioned) / sanctioned) * 100);
  }

  // 2. Fund utilization calculation
  const fundUtilizationPct =
    sanctioned > 0 ? Math.round((expenditure / sanctioned) * 100) : 0;

  // 3. Discrepancy gap (spending lead)
  const discrepancyGapPct = Math.max(0, fundUtilizationPct - progress);

  // 4. Delay calculation
  let delayDays = (p as any).delayDays || 0;
  let isDelayed = p.status === 'Delayed' || delayDays > 0;

  if (!isDelayed && p.expectedCompletionDate && progress < 100 && p.status !== 'Completed') {
    const expected = new Date(p.expectedCompletionDate).getTime();
    const now = Date.now();
    if (!isNaN(expected) && expected < now) {
      delayDays = Math.max(delayDays, Math.round((now - expected) / (1000 * 60 * 60 * 24)));
      isDelayed = delayDays > 14;
    }
  }

  // 5. Procurement indicators
  const isSingleBid =
    p.tenderType === 'Nomination / Single Bid' ||
    (p.bidCount !== undefined && p.bidCount !== null && p.bidCount <= 1);

  // --- Calculate Transparent Score ---
  // Start from base: if project already has a validated score, use it as baseline
  let score = 15; // baseline nominal review weight

  const reasons: string[] = [];

  // Severe Flag: Cost Overrun
  if (costOverrunPct > 0) {
    score += Math.min(35, 15 + Math.round(costOverrunPct * 0.8));
    reasons.push(
      `Cost overrun: Actual spending (₹${expenditure.toFixed(2)} Lakh) exceeds approved sanction (₹${sanctioned.toFixed(2)} Lakh) by ${costOverrunPct}%.`
    );
  }

  // Severe Flag: High Fund Utilization with Low Physical Work
  if (fundUtilizationPct >= 65 && progress <= 45 && discrepancyGapPct >= 20) {
    score += 30;
    reasons.push(
      `Disbursement gap: ${fundUtilizationPct}% of funds released, but physical progress is only ${progress}% (${discrepancyGapPct}% gap).`
    );
  } else if (fundUtilizationPct >= 50 && progress < 30 && discrepancyGapPct >= 20) {
    score += 20;
    reasons.push(
      `Early spending divergence: ${fundUtilizationPct}% disbursed while physical progress is stalled at ${progress}%.`
    );
  }

  // Flag: Project Delayed
  if (isDelayed) {
    const delayPoints = delayDays > 90 ? 25 : delayDays > 30 ? 18 : 12;
    score += delayPoints;
    reasons.push(
      `Project delayed: Milestone execution is ${delayDays > 0 ? `${delayDays} days ` : ''}behind expected completion schedule.`
    );
  }

  // Flag: Single-bid / Nomination procurement
  if (isSingleBid && progress < 100) {
    score += 12;
    reasons.push('Procurement risk: Contract awarded on single-bid / nomination basis without multi-vendor competition.');
  }

  // Flag: Active investigation
  if (p.status === 'Under Investigation') {
    score += 35;
    reasons.push('Under administrative inquiry: On-site verification requested for measurement book reconciliation.');
  }

  // Flag: Statutory non-compliance
  if (p.hasMandatoryCitizenBoard === false) {
    score += 8;
    reasons.push('Statutory flag: Missing mandatory citizen information board required under MoSPI guidelines.');
  }
  if (p.hasUtilizationCertificate === false && fundUtilizationPct >= 75 && progress < 100) {
    score += 10;
    reasons.push('Regulatory lag: Utilization Certificate (UC) pending despite over 75% fund release.');
  }

  // Mitigations (Score reductions for healthy projects)
  if (p.status === 'Completed' && progress >= 100) {
    if (costOverrunPct === 0 && !isDelayed) {
      score = Math.min(score, 18);
    } else if (costOverrunPct === 0) {
      score = Math.min(score, 32);
    }
  } else if (discrepancyGapPct <= 5 && !isDelayed && costOverrunPct === 0) {
    score = Math.min(score, 30);
  }

  // Harmonize with existing overallRiskScore if provided in data
  if (p.overallRiskScore !== undefined && p.overallRiskScore !== null && p.overallRiskScore > 0) {
    // Official ground truth risk score takes precedence for cross-view consistency
    score = p.overallRiskScore;
  }

  // Bound score strictly between 5 and 98
  const finalScore = Math.min(98, Math.max(5, Math.round(score)));
  const riskLevel = scoreToRiskLevel(finalScore);

  // If no specific anomaly reasons triggered but score is low
  if (reasons.length === 0) {
    if (progress >= 100) {
      reasons.push('Work completed and fully certified within approved allocation.');
    } else if (fundUtilizationPct <= progress + 5) {
      reasons.push(`Milestones progressing normally: ${progress}% physical progress matches ${fundUtilizationPct}% fund utilization.`);
    } else {
      reasons.push('Routine administrative review advised to ensure continuous milestone tracking.');
    }
  }

  const primaryReason = reasons[0];

  // Concrete, practical audit recommendations based on the flags
  let recommendedAction = 'Routine administrative oversight; review quarterly progress reports.';
  if (p.status === 'Under Investigation') {
    recommendedAction = 'Depute District Vigilance Officer for physical inspection and seal Measurement Book entries.';
  } else if (costOverrunPct > 0) {
    recommendedAction = 'Audit revised expenditure vouchers against initial technical sanction and seek cost escalation justification.';
  } else if (discrepancyGapPct >= 20) {
    recommendedAction = 'Conduct immediate on-site physical verification with geo-tagged photos to inspect work completed vs billed amounts.';
  } else if (isDelayed) {
    recommendedAction = 'Issue show-cause notice to implementing agency regarding milestone delays and establish revised completion deadline.';
  } else if (isSingleBid) {
    recommendedAction = 'Examine tender justification file to confirm compliance with General Financial Rules (GFR) open tendering.';
  }

  const evidence: ProjectRiskEvidence = {
    sanctionedAmountLakhs: sanctioned,
    expenditureAmountLakhs: expenditure,
    costOverrunPct,
    fundUtilizationPct,
    completionPercentage: progress,
    discrepancyGapPct,
    delayDays,
    isDelayed,
    tenderType: p.tenderType || 'Open Tender',
    bidCount: p.bidCount || 1,
    contractorName: p.contractorName || 'Assigned Vendor',
    hasCitizenBoard: p.hasMandatoryCitizenBoard,
    hasUtilizationCertificate: p.hasUtilizationCertificate,
  };

  return {
    riskScore: finalScore,
    riskLevel,
    riskTierLabel: riskLevel === 'High' ? 'High Risk' : riskLevel === 'Medium' ? 'Medium Risk' : 'Low Risk',
    primaryReason,
    reasons,
    evidence,
    recommendedAction,
  };
}

/**
 * Universal project export to CSV format
 * Contains all essential project and risk audit fields.
 */
export function exportProjectsToCSV(
  projects: MPLADProject[],
  fileName = 'mplads-project-risk-audit.csv'
) {
  if (!projects || projects.length === 0) {
    throw new Error('No projects selected for export.');
  }

  const headers = [
    'Project ID',
    'Project Name',
    'District',
    'State',
    'Category',
    'Contractor Name',
    'Approved Amount (Lakhs)',
    'Actual Expenditure (Lakhs)',
    'Cost Overrun (%)',
    'Fund Utilization (%)',
    'Physical Progress (%)',
    'Status',
    'Risk Score',
    'Risk Level',
    'Primary Risk Reason',
    'Recommended Action',
    'Expected Completion',
  ];

  const rows = projects.map((p) => {
    const risk = computeProjectRisk(p);
    const escapeCsv = (val: any) => {
      const s = String(val ?? '').replace(/"/g, '""');
      return `"${s}"`;
    };

    return [
      escapeCsv(p.workCode || p.id),
      escapeCsv(p.title),
      escapeCsv(p.district || p.constituency),
      escapeCsv(p.state),
      escapeCsv(p.category),
      escapeCsv(p.contractorName || 'Unassigned'),
      (p.sanctionedAmountLakhs || 0).toFixed(2),
      (p.expenditureAmountLakhs || 0).toFixed(2),
      risk.evidence.costOverrunPct,
      risk.evidence.fundUtilizationPct,
      p.completionPercentage || 0,
      escapeCsv(p.status),
      risk.riskScore,
      risk.riskLevel,
      escapeCsv(risk.primaryReason),
      escapeCsv(risk.recommendedAction),
      escapeCsv(p.expectedCompletionDate || ''),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
