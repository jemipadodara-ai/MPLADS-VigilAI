import {
  normalizeProjectData,
  validateProjectData,
  detectFinancialAnomaly,
  detectProgressAnomaly,
  detectCostAnomaly,
  detectSimilarProjects,
  detectContractorAnomaly,
  detectGeographicAnomaly,
  calculateRiskScore,
  analyzeAllProjects,
} from "../src/utils/anomalyEngine";
import { CONTRACTOR_PROFILES, INITIAL_PROJECTS } from "../src/data/mpladsData";

console.log("=================================================");
console.log("MPLADS VIGILAI - ANOMALY DETECTION ENGINE VERIFICATION");
console.log("=================================================\n");

interface TestCase {
  name: string;
  project: any;
  allProjects?: any[];
  expectedChecks: (res: any, analysis: any) => boolean;
  description: string;
}

const testCases: TestCase[] = [
  {
    name: "Edge Case 1: Missing Expenditure",
    project: {
      id: "EC-01",
      name: "Rural Road Construction Block 1",
      sanctionedAmountLakhs: 50,
      // expenditure omitted / undefined
      completionPercentage: 30,
      status: "In Progress",
      category: "Roads & Bridges",
    },
    description: "Must handle missing expenditure gracefully without crashing; no financial anomaly flagged; data quality issue recorded.",
    expectedChecks: (res, analysis) => {
      const fin = res.anomalies.find((a: any) => a.category === "Financial");
      const dq = analysis.validation.detailedIssues.some((i: any) => i.field === "expenditure");
      return !fin && dq;
    },
  },
  {
    name: "Edge Case 2: Missing Completion",
    project: {
      id: "EC-02",
      name: "Community Center Facility",
      sanctionedAmountLakhs: 25,
      expenditureAmountLakhs: 10,
      // completion omitted
      status: "In Progress",
      category: "Community Infrastructure",
    },
    description: "Must handle missing completion percentage gracefully; no progress anomaly; data quality issue recorded.",
    expectedChecks: (res, analysis) => {
      const prog = res.anomalies.find((a: any) => a.category === "Progress");
      const dq = analysis.validation.detailedIssues.some((i: any) => i.field === "completionPercentage");
      return !prog && dq;
    },
  },
  {
    name: "Edge Case 3: Expenditure > Sanctioned Amount (Overspending)",
    project: {
      id: "EC-03",
      name: "Drinking Water Pipeline Extension",
      sanctionedAmountLakhs: 20,
      expenditureAmountLakhs: 28, // 140% of sanctioned
      completionPercentage: 60,
      status: "In Progress",
      category: "Drinking Water",
    },
    description: "Must detect Financial Anomaly for overspending (>100% sanctioned), add +25 risk points.",
    expectedChecks: (res) => {
      const fin = res.anomalies.find((a: any) => a.category === "Financial");
      return fin !== undefined && fin.severity === "Critical" && res.riskScore >= 25;
    },
  },
  {
    name: "Edge Case 4: Completion > 100%",
    project: {
      id: "EC-04",
      name: "Solar High Mast Lighting",
      sanctionedAmountLakhs: 15,
      expenditureAmountLakhs: 15,
      completionPercentage: 125, // invalid government figure
      status: "Completed",
      category: "Energy",
    },
    description: "Must record Data Quality issue for impossible completion >100% without crashing or breaking score math.",
    expectedChecks: (res, analysis) => {
      const dq = analysis.validation.detailedIssues.some((i: any) => i.field === "completionPercentage");
      return dq && typeof res.riskScore === "number";
    },
  },
  {
    name: "Edge Case 5: Completion = 0% with High Expenditure",
    project: {
      id: "EC-05",
      name: "Primary Health Center Renovation",
      sanctionedAmountLakhs: 40,
      expenditureAmountLakhs: 32, // 80% spent, 0% physical progress
      completionPercentage: 0,
      status: "In Progress",
      category: "Healthcare",
    },
    description: "Severe ghost project / phantom expenditure indicator: 80% spent at 0% progress; triggers Critical Financial Anomaly (+25 pts).",
    expectedChecks: (res) => {
      const fin = res.anomalies.find((a: any) => a.category === "Financial");
      return fin !== undefined && (fin.severity === "Critical" || fin.severity === "High");
    },
  },
  {
    name: "Edge Case 6: Expenditure = 0 with In-Progress status",
    project: {
      id: "EC-06",
      name: "Public Library Reading Hall",
      sanctionedAmountLakhs: 30,
      expenditureAmountLakhs: 0,
      completionPercentage: 0,
      status: "Sanctioned",
      category: "Education",
    },
    description: "Legitimate newly sanctioned project: 0 expenditure and 0 progress is normal; should not trigger false positive financial anomaly.",
    expectedChecks: (res) => {
      const fin = res.anomalies.find((a: any) => a.category === "Financial");
      return !fin && res.riskScore <= 30;
    },
  },
  {
    name: "Edge Case 7: Very Short Project Duration (Rush Job / Expedited)",
    project: {
      id: "EC-07",
      name: "Borewell Drilling and Handpump Setup",
      sanctionedAmountLakhs: 5,
      expenditureAmountLakhs: 5,
      completionPercentage: 100,
      startDate: "2025-01-01",
      expectedCompletionDate: "2025-01-04", // 3 days
      status: "Completed",
      category: "Drinking Water",
    },
    description: "Must handle short duration calculation safely without division by zero or NaN.",
    expectedChecks: (res) => {
      return !isNaN(res.riskScore) && res.riskScore >= 0 && res.riskScore <= 100;
    },
  },
  {
    name: "Edge Case 8: Extremely Long Project Duration (Stalled / Multi-year)",
    project: {
      id: "EC-08",
      name: "Inter-Village Bridge Infrastructure",
      sanctionedAmountLakhs: 180,
      expenditureAmountLakhs: 120,
      completionPercentage: 35,
      startDate: "2019-01-01",
      expectedCompletionDate: "2021-01-01", // severely overdue (years ago)
      status: "Stalled",
      category: "Roads & Bridges",
    },
    description: "Must detect Progress Anomaly (+20 pts) and Stalled Status (+15 pts); elevated risk tier.",
    expectedChecks: (res) => {
      const prog = res.anomalies.find((a: any) => a.category === "Progress");
      return prog !== undefined && res.riskScore >= 35;
    },
  },
  {
    name: "Edge Case 9: Missing Dates",
    project: {
      id: "EC-09",
      name: "Anganwadi Center Repair",
      sanctionedAmountLakhs: 12,
      expenditureAmountLakhs: 6,
      completionPercentage: 50,
      // startDate and expectedCompletionDate omitted
      status: "In Progress",
      category: "Social Welfare",
    },
    description: "Must skip date-dependent calculations cleanly without inventing dates or throwing TypeError.",
    expectedChecks: (res) => {
      return !isNaN(res.riskScore);
    },
  },
  {
    name: "Edge Case 10: Invalid Dates (End Date Before Start Date)",
    project: {
      id: "EC-10",
      name: "Veterinary Clinic Upgrade",
      sanctionedAmountLakhs: 20,
      expenditureAmountLakhs: 10,
      completionPercentage: 40,
      startDate: "2025-06-01",
      expectedCompletionDate: "2024-06-01", // 1 year prior to start
      status: "In Progress",
      category: "Animal Husbandry",
    },
    description: "Must catch chronology inversion and record Data Quality Issue without negative duration NaN errors.",
    expectedChecks: (res, analysis) => {
      const dq = analysis.validation.detailedIssues.some((i: any) => i.field === "expectedEndDate");
      return dq;
    },
  },
  {
    name: "Edge Case 11: Extremely Expensive Project (> 1.6x Category Benchmark)",
    project: {
      id: "EC-11",
      name: "VIP Roadside Beautification Corridor",
      sanctionedAmountLakhs: 195, // substantially higher than typical 25-30L benchmarks
      expenditureAmountLakhs: 190,
      completionPercentage: 80,
      status: "In Progress",
      category: "Community Infrastructure",
    },
    allProjects: [
      {
        id: "BENCH-01",
        name: "Standard Community Center",
        sanctionedAmountLakhs: 25,
        category: "Community Infrastructure",
      },
      {
        id: "BENCH-02",
        name: "Ward Library Shed",
        sanctionedAmountLakhs: 30,
        category: "Community Infrastructure",
      },
      {
        id: "BENCH-03",
        name: "Community Meeting Hall",
        sanctionedAmountLakhs: 28,
        category: "Community Infrastructure",
      },
    ],
    description: "Must flag Cost Anomaly for severe deviation above category benchmark (>1.6x median).",
    expectedChecks: (res) => {
      const cost = res.anomalies.find((a: any) => a.category === "Cost");
      return cost !== undefined && res.riskScore >= 15;
    },
  },
  {
    name: "Edge Case 12: Potential Similar / Duplicate Projects",
    project: {
      id: "EC-12-B",
      name: "Construction of CC Road in Ward 14",
      sanctionedAmountLakhs: 25,
      expenditureAmountLakhs: 20,
      completionPercentage: 70,
      status: "In Progress",
      category: "Roads & Bridges",
      coordinates: { lat: 26.8467, lng: 80.9462 },
    },
    allProjects: [
      {
        id: "EC-12-A",
        name: "Construction of CC Road in Ward 14",
        sanctionedAmountLakhs: 25,
        expenditureAmountLakhs: 25,
        completionPercentage: 100,
        status: "Completed",
        category: "Roads & Bridges",
        coordinates: { lat: 26.8468, lng: 80.9463 }, // ~15 meters away
      },
    ],
    description: "Must detect co-located identical works (<200m and matching keywords) as Potential Duplicate Anomaly (+15 pts).",
    expectedChecks: (res) => {
      const dup = res.anomalies.find((a: any) => a.category === "Duplicate");
      return dup !== undefined;
    },
  },
];

let passed = 0;
let failed = 0;

testCases.forEach((tc, idx) => {
  try {
    const norm = normalizeProjectData(tc.project);
    const validation = validateProjectData(norm);
    const pool = tc.allProjects ? [tc.project, ...tc.allProjects] : [tc.project];
    const riskAnalysis = calculateRiskScore(norm, pool, CONTRACTOR_PROFILES);

    const isOk = tc.expectedChecks(riskAnalysis, { validation, norm });
    if (isOk) {
      console.log(`[PASS] Test ${idx + 1}: ${tc.name}`);
      console.log(`       Risk Score: ${riskAnalysis.riskScore} (${riskAnalysis.riskLevel}) | Anomalies: ${riskAnalysis.anomalies.length} | Issues: ${validation.detailedIssues.length}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${idx + 1}: ${tc.name}`);
      console.error(`       Details: ${tc.description}`);
      console.error(`       Actual Anomalies:`, riskAnalysis.anomalies.map((a: any) => a.title));
      console.error(`       Actual Issues:`, validation.detailedIssues.map((i: any) => `${i.field}: ${i.description}`));
      failed++;
    }
  } catch (err: any) {
    console.error(`[ERROR] Test ${idx + 1}: ${tc.name} threw exception:`, err?.message);
    failed++;
  }
});

console.log("\n-------------------------------------------------");
console.log(`EDGE CASE AUDIT RESULTS: ${passed}/${testCases.length} Passed, ${failed} Failed`);
console.log("-------------------------------------------------\n");

// Now run Diagnostic Summary on the active dataset
console.log("GENERATING FULL DIAGNOSTIC SUMMARY (PHASE 18)...");
const fullAnalysis = analyzeAllProjects(INITIAL_PROJECTS, CONTRACTOR_PROFILES);
console.log("\n=================================");
console.log("MPLADS ANOMALY ENGINE DIAGNOSTIC SUMMARY");
console.log("=================================");
console.log(`Projects analyzed:            ${fullAnalysis.summary.totalRecords}`);
console.log(`Valid records:                ${fullAnalysis.summary.validRecords}`);
console.log(`Data quality issues:          ${fullAnalysis.summary.dataQualityIssues}`);
console.log(`Financial anomalies:          ${fullAnalysis.summary.financialAnomalies}`);
console.log(`Progress anomalies:           ${fullAnalysis.summary.progressAnomalies}`);
console.log(`Cost anomalies:               ${fullAnalysis.summary.costAnomalies}`);
console.log(`Potential similar projects:   ${fullAnalysis.summary.potentialDuplicates}`);
console.log(`Contractor indicators:        ${fullAnalysis.summary.contractorIndicators}`);
console.log(`Geographic anomalies:         ${fullAnalysis.summary.geographicAnomalies}`);
console.log(`High-risk projects (61-80):   ${fullAnalysis.summary.highRiskProjects}`);
console.log(`Critical projects (81-100):   ${fullAnalysis.summary.criticalProjects}`);
console.log("=================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("ALL ENGINE TESTS & DIAGNOSTICS COMPLETED SUCCESSFULLY.");
}
