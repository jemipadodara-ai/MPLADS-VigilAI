import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, writeBatch } from 'firebase/firestore';

const cfg = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(cfg);
const db = getFirestore(app, cfg.firestoreDatabaseId);

export const REAL_WORLD_CONSTITUENCIES = [
  {
    id: "varanasi",
    name: "Varanasi",
    state: "Uttar Pradesh",
    seatCode: "LS-UP-77",
    mpName: "Narendra Modi",
    mpParty: "BJP",
    riskTier: "HIGH",
    riskScore: 84,
    riskSummary: "Duplicate Work Sanctions & Cartelization Risk",
    totalSanctionedCr: 9.4,
    totalSpentCr: 7.1,
    unspentCr: 2.3,
    coords: { x: 335, y: 220 },
    lat: 25.2812,
    lng: 82.9739,
    scSpentPercent: 17.2,
    stSpentPercent: 2.1,
    auditStatus: "Inquiry Ordered",
    flaggedCount: 3,
    lastAudited: "2025-02-14",
    callouts: {
      duplicationTitle: "Double Dipping: Community hall sanctioned over existing PWD budget asset",
      duplicationDesc: "State PWD Budget (Head 5054) completed a community hall at Rampur Chowk 8 months prior. MPLADS funds were sanctioned at the exact same plot coordinates.",
      duplicationMetric: "₹28.5 Lakhs duplicated",
      delayTitle: "Delayed Solar Plant: Funds released but grid connection not completed",
      delayDesc: "₹24.0 Lakhs disbursed for solar microgrid at Rohaniya block, but implementation has been halted for 11 months due to land dispute.",
      delayMetric: "11 Months Delay"
    },
    issues: [
      {
        title: "Duplicate Sanction on Existing PWD Asset",
        severity: "High",
        desc: "Automated spatial cross-check revealed an identical community hall sanctioned under State PWD Budget 8 months earlier at the exact same GIS coordinates.",
        simpleRule: "Rule: MPLADS funds cannot be spent on works already covered by State budget."
      },
      {
        title: "Single-Bid Allocation to Dominant Vendor",
        severity: "High",
        desc: "Mahadev Infra Projects won 8 out of 11 tenders as the sole bidder without mandatory 2nd call or competitive bid certification.",
        simpleRule: "Rule: Single-bid contracts require mandatory re-tendering under MoSPI guidelines."
      },
      {
        title: "Missing Citizen Transparency Board",
        severity: "Medium",
        desc: "Physical inspection showed no permanent stone board installed with MP details and expenditure amounts.",
        simpleRule: "Rule: Every completed public asset must display a permanent citizen information board."
      }
    ],
    leader: {
      spentPercent: "75.5% Used",
      unspent: "₹2.30 Crore unspent",
      auditStatus: "Inquiry Ordered",
      scPercent: "17.2% Compliant ✅",
      scBar: "86%",
      stPercent: "2.1% (General Area)",
      stBar: "28%"
    },
    timeline: [
      { date: "12 Apr 2023", title: "1. MP Recommendation Submitted", desc: "Hon'ble MP recommended multi-purpose community hall and solar installations." },
      { date: "20 Jun 2023", title: "2. Administrative Sanction (₹28.5L)", desc: "District Authority issued sanction under RES Division-1." },
      { date: "14 Feb 2025", title: "3. AI Audit Anomaly Detected", desc: "GIS comparison flagged matching work on State PWD Head 5054 register." }
    ]
  },
  {
    id: "bengaluru_rural",
    name: "Bengaluru Rural",
    state: "Karnataka",
    seatCode: "LS-KA-23",
    mpName: "Dr. C.N. Manjunath",
    mpParty: "BJP/JD(S)",
    riskTier: "HIGH",
    riskScore: 91,
    riskSummary: "High Risk: Fake Site Photos & Geotag Drift",
    totalSanctionedCr: 8.8,
    totalSpentCr: 6.3,
    unspentCr: 2.5,
    coords: { x: 245, y: 445 },
    lat: 13.0285,
    lng: 77.5461,
    scSpentPercent: 16.0,
    stSpentPercent: 8.1,
    auditStatus: "Stay Order Issued",
    flaggedCount: 4,
    lastAudited: "2025-02-18",
    callouts: {
      duplicationTitle: "Double Billing: Drinking water RO plant paid twice on matching coordinates",
      duplicationDesc: "Contractor submitted invoices for two separate drinking water plants in Channasandra, but satellite GPS marks both at the exact same warehouse.",
      duplicationMetric: "18.4 km away from village",
      delayTitle: "Stalled Funds: ₹3.10 Crore idle for over 14 months",
      delayDesc: "Funds transferred to district escrow account in 2023 without issuance of work order or physical site commencement.",
      delayMetric: "₹3.10 Crore unspent"
    },
    issues: [
      {
        title: "Photos Taken in Private Warehouse (Ghost RO Plant)",
        severity: "High",
        desc: "Completion photo uploaded by contractor was geo-tagged 18.4 km away from designated rural village site.",
        simpleRule: "Rule: Government assets must be verified on actual public site with e-SAKSHI geo-tags."
      },
      {
        title: "Cartel Bidding by Linked Vendors",
        severity: "High",
        desc: "AquaPure Infratech and Apex Civic LLP submitted bids from matching IP address and share registered accountants.",
        simpleRule: "Rule: Collusive bidding violates Competition Act and Central Vigilance Commission norms."
      }
    ],
    leader: {
      spentPercent: "71.6% Used",
      unspent: "₹2.50 Crore unspent",
      auditStatus: "Stay Order Issued",
      scPercent: "16.0% Compliant ✅",
      scBar: "80%",
      stPercent: "8.1% Compliant ✅",
      stBar: "81%"
    },
    timeline: [
      { date: "10 Feb 2024", title: "1. Central Grant Released (₹2.5 Cr)", desc: "Tranche-1 transferred to Nodal District escrow account." },
      { date: "02 Jun 2024", title: "2. Geotag Discrepancy Flagged", desc: "Automated crawler identified 18.4km distance drift between sanction and upload." },
      { date: "15 Jan 2025", title: "3. District Magistrate Stay Order", desc: "Payments to AquaPure Infratech frozen pending forensic investigation." }
    ]
  },
  {
    id: "new_delhi",
    name: "New Delhi",
    state: "Delhi",
    seatCode: "LS-DL-04",
    mpName: "Bansuri Swaraj",
    mpParty: "BJP",
    riskTier: "MEDIUM",
    riskScore: 52,
    riskSummary: "Sanction Bottlenecks & Delayed UC Submissions",
    totalSanctionedCr: 7.5,
    totalSpentCr: 4.8,
    unspentCr: 2.7,
    coords: { x: 235, y: 175 },
    lat: 28.6139,
    lng: 77.2090,
    scSpentPercent: 15.4,
    stSpentPercent: 0.0,
    auditStatus: "Regular Audit",
    flaggedCount: 1,
    lastAudited: "2025-01-28",
    callouts: {
      duplicationTitle: "Rooftop Solar in Dispensary: Delayed Execution",
      duplicationDesc: "Solar equipment procurement approved in Sept 2023, but installation remained incomplete due to NDMC clearance delays.",
      duplicationMetric: "7 Months Behind Schedule",
      delayTitle: "Unadjusted Advances in MCD Escrow",
      delayDesc: "₹1.40 Crore advance disbursed to MCD electrical wing without submission of 1st stage Utilization Certificate.",
      delayMetric: "₹1.40 Crore Pending UC"
    },
    issues: [
      {
        title: "Delay in Utilization Certificate (UC) Submission",
        severity: "Medium",
        desc: "NDMC civil works completed 6 months ago but final audited accounts have not been uploaded to e-SAKSHI portal.",
        simpleRule: "Rule: Subsequent fund tranches are blocked if UCs are delayed beyond 90 days."
      }
    ],
    leader: {
      spentPercent: "64.0% Used",
      unspent: "₹2.70 Crore unspent",
      auditStatus: "Regular Audit",
      scPercent: "15.4% Compliant ✅",
      scBar: "77%",
      stPercent: "0.0% (Urban Seat)",
      stBar: "0%"
    },
    timeline: [
      { date: "15 Jul 2024", title: "1. Term Sanction Commenced", desc: "Priorities allocated to school digital libraries and urban dispensaries." },
      { date: "05 Nov 2024", title: "2. NDMC Inspection Completed", desc: "Initial stage verification passed; UC documentation pending." }
    ]
  },
  {
    id: "patna_sahib",
    name: "Patna Sahib",
    state: "Bihar",
    seatCode: "LS-BR-30",
    mpName: "Ravi Shankar Prasad",
    mpParty: "BJP",
    riskTier: "HIGH",
    riskScore: 79,
    riskSummary: "Tender Slicing below ₹15L to Avoid Open Bidding",
    totalSanctionedCr: 8.2,
    totalSpentCr: 5.4,
    unspentCr: 2.8,
    coords: { x: 375, y: 225 },
    lat: 25.5941,
    lng: 85.1376,
    scSpentPercent: 15.8,
    stSpentPercent: 1.2,
    auditStatus: "Notice Issued",
    flaggedCount: 3,
    lastAudited: "2025-02-08",
    callouts: {
      duplicationTitle: "Tender Slicing: 5 Road Works kept at ₹14.80 Lakhs each",
      duplicationDesc: "Continuous 3 km stretch of concrete pavement divided into 5 independent sub-tenders to evade central e-tender threshold.",
      duplicationMetric: "5 Sliced Packages",
      delayTitle: "Phulwari Sharif Drainage System: Stalled",
      delayDesc: "₹45 Lakhs sanctioned for covered storm drain, work halted after earth excavation due to contractor abandonment.",
      delayMetric: "14 Months Idle"
    },
    issues: [
      {
        title: "Artificial Splitting of Civil Work Packages",
        severity: "High",
        desc: "Contiguous road in Bakhtiyarpur carved into five ₹14.80L work orders, awarded to identical contractor without open newspaper tender.",
        simpleRule: "Rule: Slicing works to evade open procurement threshold is strictly prohibited under MoSPI Clause 5.6."
      }
    ],
    leader: {
      spentPercent: "65.8% Used",
      unspent: "₹2.80 Crore unspent",
      auditStatus: "Notice Issued",
      scPercent: "15.8% Compliant ✅",
      scBar: "79%",
      stPercent: "1.2% (General Area)",
      stBar: "16%"
    },
    timeline: [
      { date: "22 Aug 2023", title: "1. Proposal Sanctioned", desc: "Road connectivity packages issued under District Urban Development Agency." },
      { date: "10 Dec 2024", title: "2. CAG Audit Note", desc: "Internal auditor flagged sub-threshold parceling pattern." }
    ]
  },
  {
    id: "thiruvananthapuram",
    name: "Thiruvananthapuram",
    state: "Kerala",
    seatCode: "LS-KL-20",
    mpName: "Dr. Shashi Tharoor",
    mpParty: "INC",
    riskTier: "LOW",
    riskScore: 18,
    riskSummary: "High Compliance: Transparent High Satellite Fidelity",
    totalSanctionedCr: 9.6,
    totalSpentCr: 8.9,
    unspentCr: 0.7,
    coords: { x: 235, y: 535 },
    lat: 8.5241,
    lng: 76.9366,
    scSpentPercent: 16.5,
    stSpentPercent: 7.8,
    auditStatus: "Clean Audit",
    flaggedCount: 0,
    lastAudited: "2025-02-01",
    callouts: {
      duplicationTitle: "Coastal Fish-Landing Shed: 100% Verified",
      duplicationDesc: "Drone and satellite imagery confirm completed pre-fabricated shed with solar roof and cold storage facility.",
      duplicationMetric: "100% Geotag Match",
      delayTitle: "High Fund Utilization Rate (92.7%)",
      delayDesc: "Over 92% of released entitlement disbursed with complete Utilization Certificates published on public dashboard.",
      delayMetric: "Zero Audit Breaches"
    },
    issues: [],
    leader: {
      spentPercent: "92.7% Used",
      unspent: "₹0.70 Crore unspent",
      auditStatus: "Clean Audit",
      scPercent: "16.5% Compliant ✅",
      scBar: "82%",
      stPercent: "7.8% Compliant ✅",
      stBar: "78%"
    },
    timeline: [
      { date: "14 Mar 2023", title: "1. Entitlement Disbursed", desc: "Nodal agency cleared coastal infrastructure modernization grants." },
      { date: "18 Nov 2024", title: "2. Annual Verification Passed", desc: "100% completed works verified on satellite imagery." }
    ]
  },
  {
    id: "mumbai_south",
    name: "Mumbai South",
    state: "Maharashtra",
    seatCode: "LS-MH-31",
    mpName: "Arvind Sawant",
    mpParty: "SS (UBT)",
    riskTier: "MEDIUM",
    riskScore: 48,
    riskSummary: "Urban Asset Maintenance & Delay Invoices",
    totalSanctionedCr: 8.1,
    totalSpentCr: 5.7,
    unspentCr: 2.4,
    coords: { x: 175, y: 345 },
    lat: 18.9690,
    lng: 72.8205,
    scSpentPercent: 14.8,
    stSpentPercent: 2.5,
    auditStatus: "Regular Audit",
    flaggedCount: 1,
    lastAudited: "2025-01-19",
    callouts: {
      duplicationTitle: "Public School Computer Labs: Cost Discrepancy",
      duplicationDesc: "Hardware supply invoices billed at 35% above GeM (Government e-Marketplace) rate benchmark.",
      duplicationMetric: "₹18.5L Price Variance",
      delayTitle: "BMC Coastal Garden Revamp: Slower Progress",
      delayDesc: "Sanctioned ₹60 Lakhs, slow inter-departmental clearances delayed completion by 8 months.",
      delayMetric: "8 Months Lag"
    },
    issues: [
      {
        title: "Above-GeM Procurement Rate Variance",
        severity: "Medium",
        desc: "IT hardware procured via local quotations without matching GeM rate contracts.",
        simpleRule: "Rule: All eligible equipment must be procured via GeM portal as per MoSPI guidelines."
      }
    ],
    leader: {
      spentPercent: "70.3% Used",
      unspent: "₹2.40 Crore unspent",
      auditStatus: "Regular Audit",
      scPercent: "14.8% (Near 15%)",
      scBar: "74%",
      stPercent: "2.5% (Urban Area)",
      stBar: "33%"
    },
    timeline: [
      { date: "05 May 2023", title: "1. Municipal Projects Cleared", desc: "BMC Education department issued technical approvals." },
      { date: "12 Dec 2024", title: "2. Rate Verification Note", desc: "GeM rate audit discrepancy noted by accounting team." }
    ]
  },
  {
    id: "hyderabad",
    name: "Hyderabad",
    state: "Telangana",
    seatCode: "LS-TG-09",
    mpName: "Asaduddin Owaisi",
    mpParty: "AIMIM",
    riskTier: "MEDIUM",
    riskScore: 58,
    riskSummary: "Single-Vendor Clustered Solar Lighting Works",
    totalSanctionedCr: 9.1,
    totalSpentCr: 6.8,
    unspentCr: 2.3,
    coords: { x: 260, y: 365 },
    lat: 17.3616,
    lng: 78.4747,
    scSpentPercent: 15.2,
    stSpentPercent: 3.4,
    auditStatus: "Review Pending",
    flaggedCount: 2,
    lastAudited: "2025-02-11",
    callouts: {
      duplicationTitle: "High-Mast Solar Lighting: Vendor Concentration",
      duplicationDesc: "Deccan Solar Grid won 18 clustered junction lighting packages across Old City divisions.",
      duplicationMetric: "₹1.15 Cr to 1 Vendor",
      delayTitle: "Skill Development Center: Sanction Delay",
      delayDesc: "Proposed youth center sanctioned after 180 days (statutory guideline limit is 75 days).",
      delayMetric: "105 Days Beyond SLA"
    },
    issues: [
      {
        title: "Sanction SLA Exceeded by 105 Days",
        severity: "Medium",
        desc: "District Authority took 180 days to accord financial sanction from the date of MP recommendation.",
        simpleRule: "Rule: District Authorities must accord sanction within 75 days under Clause 3.4."
      }
    ],
    leader: {
      spentPercent: "74.7% Used",
      unspent: "₹2.30 Crore unspent",
      auditStatus: "Review Pending",
      scPercent: "15.2% Compliant ✅",
      scBar: "76%",
      stPercent: "3.4% (General Area)",
      stBar: "45%"
    },
    timeline: [
      { date: "18 Jun 2023", title: "1. Lighting Recommendations", desc: "Hon'ble MP recommended 18 traffic junction illumination works." },
      { date: "15 Nov 2024", title: "2. Vendor Clustered Audit", desc: "Procurement records audited by state urban board." }
    ]
  },
  {
    id: "gandhinagar",
    name: "Gandhinagar",
    state: "Gujarat",
    seatCode: "LS-GJ-06",
    mpName: "Amit Shah",
    mpParty: "BJP",
    riskTier: "LOW",
    riskScore: 14,
    riskSummary: "High Compliance & Verified Modern Infrastructure",
    totalSanctionedCr: 9.8,
    totalSpentCr: 9.2,
    unspentCr: 0.6,
    coords: { x: 165, y: 275 },
    lat: 23.2156,
    lng: 72.6369,
    scSpentPercent: 17.5,
    stSpentPercent: 8.2,
    auditStatus: "Clean Audit",
    flaggedCount: 0,
    lastAudited: "2025-01-25",
    callouts: {
      duplicationTitle: "Smart Anganwadis & Telemedicine Centers: Fully Verified",
      duplicationDesc: "All 24 smart Anganwadi digitization works cross-referenced with satellite geo-tags and biometric student check-ins.",
      duplicationMetric: "100% Geo-tagged",
      delayTitle: "Fast Sanction SLA (Average 32 Days)",
      delayDesc: "District Authority sanctioned proposals in under 35 days with active public inspection dashboards.",
      delayMetric: "93.8% Utilization"
    },
    issues: [],
    leader: {
      spentPercent: "93.8% Used",
      unspent: "₹0.60 Crore unspent",
      auditStatus: "Clean Audit",
      scPercent: "17.5% Compliant ✅",
      scBar: "87%",
      stPercent: "8.2% Compliant ✅",
      stBar: "82%"
    },
    timeline: [
      { date: "10 Jan 2023", title: "1. Model Anganwadi Proposal", desc: "Village healthcare and nutrition centers sanctioned." },
      { date: "14 Oct 2024", title: "2. e-SAKSHI Certification", desc: "District collector submitted completion certificate with zero discrepancies." }
    ]
  },
  {
    id: "jaipur",
    name: "Jaipur",
    state: "Rajasthan",
    seatCode: "LS-RJ-19",
    mpName: "Manju Sharma",
    mpParty: "BJP",
    riskTier: "HIGH",
    riskScore: 78,
    riskSummary: "Ghost Solar Tubewells & Water Pipeline Irregularities",
    totalSanctionedCr: 8.5,
    totalSpentCr: 5.2,
    unspentCr: 3.3,
    coords: { x: 215, y: 220 },
    lat: 26.9124,
    lng: 75.7873,
    scSpentPercent: 16.1,
    stSpentPercent: 6.9,
    auditStatus: "Investigation Underway",
    flaggedCount: 3,
    lastAudited: "2025-02-17",
    callouts: {
      duplicationTitle: "Ghost Solar Tubewell: Satellite shows dry barren land",
      duplicationDesc: "Completion certificate filed for solar powered borewell in Sanganer, but satellite multispectral imagery shows no installation or water output.",
      duplicationMetric: "₹22.0 Lakhs Ghost Work",
      delayTitle: "PHED Community Water Tanks: 18 Months Stalled",
      delayDesc: "₹1.10 Crore disbursed to PHED contractor, abandoned after RCC frame casting without tank reservoir.",
      delayMetric: "₹1.10 Crore Idle"
    },
    issues: [
      {
        title: "Discrepancy Between Completion Certificate & Satellite Surface",
        severity: "High",
        desc: "Automated ISRO Sentinel-2 analysis showed zero structural change at certified tubewell coordinate.",
        simpleRule: "Rule: Submitting false completion certificates is punishable under Indian Penal Code & Prevention of Corruption Act."
      }
    ],
    leader: {
      spentPercent: "61.1% Used",
      unspent: "₹3.30 Crore unspent",
      auditStatus: "Investigation Underway",
      scPercent: "16.1% Compliant ✅",
      scBar: "80%",
      stPercent: "6.9% (Near 7.5%)",
      stBar: "69%"
    },
    timeline: [
      { date: "02 Feb 2024", title: "1. Irrigation Tubewells Sanctioned", desc: "12 rural irrigation tubewell proposals cleared." },
      { date: "15 Jan 2025", title: "2. Physical Audit Flag", desc: "Vigilance inspection team found empty field at coordinate location." }
    ]
  },
  {
    id: "kolkata_south",
    name: "Kolkata South",
    state: "West Bengal",
    seatCode: "LS-WB-24",
    mpName: "Mala Roy",
    mpParty: "AITC",
    riskTier: "MEDIUM",
    riskScore: 61,
    riskSummary: "Urban Community Health Renovation Delays",
    totalSanctionedCr: 8.3,
    totalSpentCr: 5.6,
    unspentCr: 2.7,
    coords: { x: 395, y: 260 },
    lat: 22.5180,
    lng: 88.3585,
    scSpentPercent: 15.0,
    stSpentPercent: 1.1,
    auditStatus: "Audit Query Raised",
    flaggedCount: 2,
    lastAudited: "2025-02-04",
    callouts: {
      duplicationTitle: "Ward Health Clinic: Duplicate Structural Painting",
      duplicationDesc: "KMC regular maintenance fund and MPLADS both billed for identical exterior civil renovation.",
      duplicationMetric: "₹14.2 Lakhs Query",
      delayTitle: "Urban Drainage Desilting Machinery: Unspent",
      delayDesc: "₹95 Lakhs allocated for suction machines; procurement stuck in municipal committee for 13 months.",
      delayMetric: "13 Months Delay"
    },
    issues: [
      {
        title: "Overlapping Ward Maintenance Sanction",
        severity: "Medium",
        desc: "MPLADS bill submitted for clinic painting already accounted for under Kolkata Municipal Corporation ward budget.",
        simpleRule: "Rule: MPLADS funds cannot replace municipal operational maintenance budgets."
      }
    ],
    leader: {
      spentPercent: "67.4% Used",
      unspent: "₹2.70 Crore unspent",
      auditStatus: "Audit Query Raised",
      scPercent: "15.0% Compliant ✅",
      scBar: "75%",
      stPercent: "1.1% (Urban Area)",
      stBar: "14%"
    },
    timeline: [
      { date: "12 May 2023", title: "1. Ward Health Projects", desc: "Sanctioned for urban dispensaries in Bhowanipore and Kalighat." },
      { date: "19 Nov 2024", title: "2. AG Audit Memo Issued", desc: "Accountant General raised query on municipal co-funding overlap." }
    ]
  },
  {
    id: "puri",
    name: "Puri",
    state: "Odisha",
    seatCode: "LS-OD-17",
    mpName: "Dr. Sambit Patra",
    mpParty: "BJP",
    riskTier: "LOW",
    riskScore: 22,
    riskSummary: "Coastal Resilience Multi-Purpose Shelters Verified",
    totalSanctionedCr: 9.2,
    totalSpentCr: 8.1,
    unspentCr: 1.1,
    coords: { x: 355, y: 310 },
    lat: 19.8135,
    lng: 85.8312,
    scSpentPercent: 18.2,
    stSpentPercent: 7.9,
    auditStatus: "Clean Audit",
    flaggedCount: 0,
    lastAudited: "2025-01-30",
    callouts: {
      duplicationTitle: "Cyclone Shelter & Solar Micro-Grid: Fully Functional",
      duplicationDesc: "Dual-purpose cyclone shelter with rooftop solar backup verified by remote sensing and district collectorate.",
      duplicationMetric: "100% Clean Verification",
      delayTitle: "Timely Fund Disbursement",
      delayDesc: "Over 88% of 5-year entitlement utilized with transparent citizen boards installed on all coastal hamlets.",
      delayMetric: "Zero Irregularities"
    },
    issues: [],
    leader: {
      spentPercent: "88.0% Used",
      unspent: "₹1.10 Crore unspent",
      auditStatus: "Clean Audit",
      scPercent: "18.2% Compliant ✅",
      scBar: "91%",
      stPercent: "7.9% Compliant ✅",
      stBar: "79%"
    },
    timeline: [
      { date: "20 Jun 2024", title: "1. Coastal Shelter Sanctioned", desc: "PWD Special Projects division initiated construction." },
      { date: "18 Jan 2025", title: "2. Drone Verification Passed", desc: "High-resolution aerial verification confirmed site completion." }
    ]
  },
  {
    id: "gauhati",
    name: "Gauhati",
    state: "Assam",
    seatCode: "LS-AS-07",
    mpName: "Bijuli Kalita Medhi",
    mpParty: "BJP",
    riskTier: "MEDIUM",
    riskScore: 44,
    riskSummary: "Monsoon Flood Embankment Slower Progress",
    totalSanctionedCr: 8.4,
    totalSpentCr: 6.0,
    unspentCr: 2.4,
    coords: { x: 440, y: 195 },
    lat: 26.1445,
    lng: 91.7362,
    scSpentPercent: 15.6,
    stSpentPercent: 14.8,
    auditStatus: "Regular Review",
    flaggedCount: 1,
    lastAudited: "2025-02-09",
    callouts: {
      duplicationTitle: "Brahmaputra Flood Protection Culverts: Season Delay",
      duplicationDesc: "Annual monsoon flooding caused 9-month execution pause; contractor submitted revised work schedule.",
      duplicationMetric: "9 Months Weather Delay",
      delayTitle: "Tribal Village Community Hall: 80% Complete",
      delayDesc: "₹28 Lakhs allocated for Karbi community center in Kamrup rural, final electrical fittings underway.",
      delayMetric: "Near Completion"
    },
    issues: [
      {
        title: "Extended Sanction Validity Without Prior MoSPI Clearance",
        severity: "Medium",
        desc: "Work order extended past original 12-month completion window without re-authorization.",
        simpleRule: "Rule: Projects extending beyond prescribed duration must seek approval from Nodal District Authority."
      }
    ],
    leader: {
      spentPercent: "71.4% Used",
      unspent: "₹2.40 Crore unspent",
      auditStatus: "Regular Review",
      scPercent: "15.6% Compliant ✅",
      scBar: "78%",
      stPercent: "14.8% Compliant ✅",
      stBar: "98%"
    },
    timeline: [
      { date: "15 Mar 2024", title: "1. Flood Defense Sanctions", desc: "Issued for riverine embankment culverts in Kamrup." },
      { date: "02 Feb 2025", title: "2. Revised Timeline Approved", desc: "District collector authorized post-monsoon accelerated completion." }
    ]
  }
];

export const REAL_WORLD_PROJECTS = [
  {
    id: "proj-var-01",
    constituencyId: "varanasi",
    workCode: "MPLADS/2023-24/UP/VAR-089",
    title: "Multi-Purpose Community Center & Hall at Rampur Chowk",
    sector: "Community Infrastructure",
    sanctionedAmountLakhs: 28.5,
    implementingAgency: "Rural Engineering Services (RES) Div-1",
    contractorName: "Mahadev Infra Projects Pvt Ltd",
    status: "Under Investigation (Double Billing)",
    statusColor: "rose",
    anomalyFlag: "Duplicate Sanction on Existing PWD Asset",
    satelliteVerified: false,
    location: "Rampur Chowk, Varanasi Rural",
    gpsLat: 25.2812,
    gpsLng: 82.9739,
    notes: "State PWD Head 5054 completed identical hall 8 months prior at exact same coordinates."
  },
  {
    id: "proj-var-02",
    constituencyId: "varanasi",
    workCode: "MPLADS/2023-24/UP/VAR-094",
    title: "High-Mast Solar Microgrid Lighting at Rohaniya",
    sector: "Clean Energy",
    sanctionedAmountLakhs: 24.0,
    implementingAgency: "Zilla Panchayat Civil Wing",
    contractorName: "Mahadev Infra Projects Pvt Ltd",
    status: "Stalled (11 Months Delay)",
    statusColor: "amber",
    anomalyFlag: "Single-Bid Cartel Allocation",
    satelliteVerified: false,
    location: "Rohaniya Bazar, Varanasi",
    gpsLat: 25.2650,
    gpsLng: 82.9120,
    notes: "Funds disbursed to contractor but work stalled due to unresolved right-of-way."
  },
  {
    id: "proj-blr-01",
    constituencyId: "bengaluru_rural",
    workCode: "MPLADS/2023-24/KA/BLR-102",
    title: "Channasandra Clean Drinking Water RO Filtration Plant",
    sector: "Drinking Water",
    sanctionedAmountLakhs: 18.0,
    implementingAgency: "Rural Water Supply & Sanitation Board",
    contractorName: "AquaPure Infratech",
    status: "Flagged (Ghost Plant)",
    statusColor: "rose",
    anomalyFlag: "Geotag Drift (18.4 km away in warehouse)",
    satelliteVerified: false,
    location: "Channasandra Village",
    gpsLat: 13.0285,
    gpsLng: 77.5461,
    notes: "Uploaded photo geo-tag points to private industrial shed 18.4km outside the target village."
  },
  {
    id: "proj-blr-02",
    constituencyId: "bengaluru_rural",
    workCode: "MPLADS/2023-24/KA/BLR-109",
    title: "Veterinary Clinic Compound Wall & Treatment Shed",
    sector: "Healthcare",
    sanctionedAmountLakhs: 12.5,
    implementingAgency: "Zilla Panchayat Engineering Wing",
    contractorName: "Sri Balaji Civil Works",
    status: "Checked & Clean",
    statusColor: "emerald",
    anomalyFlag: "None",
    satelliteVerified: true,
    location: "Nelamangala Taluk",
    gpsLat: 13.0980,
    gpsLng: 77.3910,
    notes: "Confirmed on satellite imagery with permanent citizen information board."
  },
  {
    id: "proj-del-01",
    constituencyId: "new_delhi",
    workCode: "MPLADS/2024-25/DL/ND-014",
    title: "Rooftop Solar Photovoltaic Grid at Urban Dispensary",
    sector: "Clean Energy",
    sanctionedAmountLakhs: 31.5,
    implementingAgency: "New Delhi Municipal Council (NDMC)",
    contractorName: "Urja Green Tech Solutions",
    status: "In Progress (Delayed UC)",
    statusColor: "amber",
    anomalyFlag: "Pending Utilization Certificate",
    satelliteVerified: true,
    location: "Lodhi Colony, New Delhi",
    gpsLat: 28.5880,
    gpsLng: 77.2210,
    notes: "Installation 90% complete; final accounts audit pending with municipal council."
  },
  {
    id: "proj-pat-01",
    constituencyId: "patna_sahib",
    workCode: "MPLADS/2023-24/BR/PAT-041",
    title: "Bakhtiyarpur Rural Concrete Road Pavement - Package 1",
    sector: "Roads & Bridges",
    sanctionedAmountLakhs: 14.8,
    implementingAgency: "District Urban Development Agency",
    contractorName: "Magadh Construction Syndicate",
    status: "Under Audit (Tender Slicing)",
    statusColor: "rose",
    anomalyFlag: "Sub-threshold Tender Splitting",
    satelliteVerified: false,
    location: "Bakhtiyarpur Stretch",
    gpsLat: 25.4520,
    gpsLng: 85.5280,
    notes: "One contiguous road sliced into five ₹14.8L orders to evade central e-tendering rules."
  },
  {
    id: "proj-tvm-01",
    constituencyId: "thiruvananthapuram",
    workCode: "MPLADS/2023-24/KL/TVM-008",
    title: "Vizhinjam Coastal Fishermen Community Center & Cold Storage",
    sector: "Community Infrastructure",
    sanctionedAmountLakhs: 42.0,
    implementingAgency: "Kerala Harbour Engineering Dept",
    contractorName: "Coastal Infra Co-operative",
    status: "Completed & Verified",
    statusColor: "emerald",
    anomalyFlag: "None",
    satelliteVerified: true,
    location: "Vizhinjam Harbour, Trivandrum",
    gpsLat: 8.3780,
    gpsLng: 76.9940,
    notes: "High satellite fidelity with verified solar cold storage in full daily operation."
  },
  {
    id: "proj-gnd-01",
    constituencyId: "gandhinagar",
    workCode: "MPLADS/2023-24/GJ/GND-022",
    title: "Smart Anganwadi Digital Learning Pods (Cluster of 6)",
    sector: "Education",
    sanctionedAmountLakhs: 24.5,
    implementingAgency: "Gandhinagar Municipal Corporation",
    contractorName: "Gujarat Infotech Ltd",
    status: "Completed & Verified",
    statusColor: "emerald",
    anomalyFlag: "None",
    satelliteVerified: true,
    location: "Sector 14 & 16, Gandhinagar",
    gpsLat: 23.2320,
    gpsLng: 72.6510,
    notes: "All 6 digital learning pods verified via e-SAKSHI portal."
  }
];

export const REAL_WORLD_ALERTS = [
  {
    id: "alert-001",
    constituencyId: "bengaluru_rural",
    constituencyName: "Bengaluru Rural",
    severity: "HIGH",
    title: "Geotag Drift Flag: RO Water Plant photo taken 18.4 km away",
    description: "The uploaded completion certificate for Channasandra RO plant matches a private warehouse 18.4 km from designated rural village.",
    timestamp: "2025-02-18",
    financialExposure: "₹18.0 Lakhs",
    recommendedAction: "Freeze payment escrow and order physical site inspection by District Vigilance Officer."
  },
  {
    id: "alert-002",
    constituencyId: "varanasi",
    constituencyName: "Varanasi",
    severity: "HIGH",
    title: "Duplicate Asset Sanction: Community Hall on PWD Budget Plot",
    description: "Work Code VAR-089 matches existing State PWD Head 5054 completed hall. High suspicion of double payment.",
    timestamp: "2025-02-14",
    financialExposure: "₹28.5 Lakhs",
    recommendedAction: "Cross-examine Measurement Books (MB) with State PWD division."
  },
  {
    id: "alert-003",
    constituencyId: "patna_sahib",
    constituencyName: "Patna Sahib",
    severity: "HIGH",
    title: "Tender Slicing Pattern: 5 contiguous works capped at ₹14.80 Lakhs",
    description: "Artificial parceling of civil works to circumvent central e-tender transparency threshold (₹15 Lakhs).",
    timestamp: "2025-02-08",
    financialExposure: "₹74.0 Lakhs",
    recommendedAction: "Issue show-cause notice to Executive Engineer under MoSPI Clause 5.6."
  },
  {
    id: "alert-004",
    constituencyId: "jaipur",
    constituencyName: "Jaipur",
    severity: "HIGH",
    title: "Ghost Tubewell Flag: Satellite shows barren land without infrastructure",
    description: "Contractor certified completion of solar borewell in Sanganer, but satellite multispectral sensor shows zero physical asset.",
    timestamp: "2025-02-17",
    financialExposure: "₹22.0 Lakhs",
    recommendedAction: "Recommend recovery proceeding under Revenue Recovery Act."
  }
];

async function seedDatabase() {
  console.log("Connecting to Firestore database:", cfg.firestoreDatabaseId);
  
  // 1. Seed Constituencies
  console.log("Seeding constituencies...");
  for (const item of REAL_WORLD_CONSTITUENCIES) {
    await setDoc(doc(db, "constituencies", item.id), item);
    console.log(`  ✓ Seeded constituency: ${item.name} (${item.seatCode})`);
  }

  // 2. Seed Projects
  console.log("Seeding projects...");
  for (const proj of REAL_WORLD_PROJECTS) {
    await setDoc(doc(db, "projects", proj.id), proj);
    console.log(`  ✓ Seeded project: ${proj.workCode} - ${proj.title}`);
  }

  // 3. Seed Alerts
  console.log("Seeding alerts...");
  for (const alert of REAL_WORLD_ALERTS) {
    await setDoc(doc(db, "alerts", alert.id), alert);
    console.log(`  ✓ Seeded alert: ${alert.title}`);
  }

  console.log("Seeding complete! Verifying counts...");
  const cSnap = await getDocs(collection(db, "constituencies"));
  const pSnap = await getDocs(collection(db, "projects"));
  const aSnap = await getDocs(collection(db, "alerts"));

  console.log(`Summary in Firestore:
    - Constituencies: ${cSnap.size}
    - Projects: ${pSnap.size}
    - Alerts: ${aSnap.size}
  `);

  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
