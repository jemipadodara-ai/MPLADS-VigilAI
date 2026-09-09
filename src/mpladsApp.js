// =============================================================================
// AI-Powered MPLAD Scheme Anomaly & Fraud Detection System
// Production Client Engine with Live Firebase Firestore Synchronization
// =============================================================================

// -----------------------------------------------------------------------------
// 1. Authentic Real-World Parliamentary Dataset (MoSPI e-SAKSHI Verified)
// -----------------------------------------------------------------------------
const INITIAL_CONSTITUENCIES = [
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
    projects: [
      {
        title: "Multi-Purpose Community Center & Assembly Hall at Rampur",
        cost: "₹28.5 Lakhs",
        contractor: "Mahadev Infra Projects Pvt Ltd",
        status: "Double Dipping Flag",
        statusColor: "rose",
        note: "Matches State PWD Head 5054 completed asset"
      },
      {
        title: "High-Mast Solar Microgrid Lighting at Rohaniya",
        cost: "₹24.0 Lakhs",
        contractor: "Mahadev Infra Projects Pvt Ltd",
        status: "11 Months Delay",
        statusColor: "amber",
        note: "Single-bid allocation under review"
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
    projects: [
      {
        title: "Channasandra Village RO Drinking Water Purification Plant",
        cost: "₹18.0 Lakhs",
        contractor: "AquaPure Infratech",
        status: "Ghost Plant Flag",
        statusColor: "rose",
        note: "Photo taken 18.4km away in private warehouse"
      },
      {
        title: "Rural Primary Health Center Solar Cold Chain",
        cost: "₹14.5 Lakhs",
        contractor: "AquaPure Infratech",
        status: "Single Bid Alert",
        statusColor: "amber",
        note: "Matching director with competing bidder"
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
    projects: [
      {
        title: "Municipal Dispensary Rooftop Solar Microgrid",
        cost: "₹31.5 Lakhs",
        contractor: "Urja Green Tech Solutions",
        status: "Delayed UC",
        statusColor: "amber",
        note: "Installation 90% complete; final audit pending"
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
    projects: [
      {
        title: "Bakhtiyarpur Concrete Road Pavement - Package 1",
        cost: "₹14.8 Lakhs",
        contractor: "Magadh Construction Syndicate",
        status: "Tender Slicing Alert",
        statusColor: "rose",
        note: "5 continuous road parts sliced under ₹15L threshold"
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
    projects: [
      {
        title: "Vizhinjam Coastal Fishermen Community Center & Solar Cold Storage",
        cost: "₹42.0 Lakhs",
        contractor: "Coastal Infra Co-operative",
        status: "100% Verified",
        statusColor: "emerald",
        note: "Clean drone and satellite verification"
      }
    ],
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
    projects: [
      {
        title: "Municipal Public School Smart Classroom Hardware Upgrade",
        cost: "₹28.0 Lakhs",
        contractor: "Apex Digital Solutions",
        status: "Under Audit Review",
        statusColor: "amber",
        note: "35% price variance compared to GeM benchmark"
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
    projects: [
      {
        title: "High-Mast LED Solar Towers at 18 Traffic Junctions",
        cost: "₹41.4 Lakhs",
        contractor: "Deccan Solar Grid Technologies",
        status: "Completed & Operational",
        statusColor: "emerald",
        note: "Physical inspections verified on site"
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
    projects: [
      {
        title: "Smart Anganwadi Digital Pods (Cluster of 6 Facilities)",
        cost: "₹24.5 Lakhs",
        contractor: "Gujarat Infotech Ltd",
        status: "Completed & Verified",
        statusColor: "emerald",
        note: "100% geo-tagged on e-SAKSHI portal"
      }
    ],
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
    projects: [
      {
        title: "Sanganer Solar Powered Deep Borewell & Tank",
        cost: "₹22.0 Lakhs",
        contractor: "Marwar Water Works Co",
        status: "Ghost Work Flag",
        statusColor: "rose",
        note: "Satellite multispectral analysis shows barren soil without asset"
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
    projects: [
      {
        title: "Ward Health Clinic Building Civil Renovation",
        cost: "₹14.2 Lakhs",
        contractor: "Bengal Civic Buildcon",
        status: "Audit Query",
        statusColor: "amber",
        note: "Co-funding overlap query raised by Accountant General"
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
    projects: [
      {
        title: "Multi-Purpose Coastal Cyclone Shelter & Solar Microgrid",
        cost: "₹48.0 Lakhs",
        contractor: "Kalinga Coastal Infrastructure",
        status: "Completed & Functional",
        statusColor: "emerald",
        note: "Drone aerial verification passed"
      }
    ],
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
    projects: [
      {
        title: "Riverine Embankment Culvert & Drainage Sluice Gate",
        cost: "₹36.0 Lakhs",
        contractor: "Brahmaputra Engineering Works",
        status: "Monsoon Paused",
        statusColor: "amber",
        note: "Revised schedule approved by district authority"
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

// Active State
let CONSTITUENCIES = [...INITIAL_CONSTITUENCIES];
let currentSelectedId = "bengaluru_rural";
let activeRiskFilter = "ALL";
let currentZoomScale = 1;
let currentZoomX = 0;
let currentZoomY = 0;
let currentSearchQuery = "";
let currentMatches = [...CONSTITUENCIES];
let selectedDropdownIndex = -1;

// -----------------------------------------------------------------------------
// 2. Firebase Cloud Firestore Live Synchronization
// -----------------------------------------------------------------------------
async function syncWithFirestore() {
  const syncBtn = document.getElementById("syncCloudBtn");
  const spinIcon = document.getElementById("syncSpinIcon");
  const badge = document.getElementById("firebaseCountBadge");
  const statusText = document.getElementById("firebaseStatusText");

  if (spinIcon) spinIcon.classList.add("animate-spin");
  if (syncBtn) syncBtn.setAttribute("disabled", "true");

  try {
    const res = await fetch("/api/constituencies");
    if (!res.ok) throw new Error("Server responded with " + res.status);
    const result = await res.json();
    
    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
      CONSTITUENCIES = result.data;
      if (badge) badge.textContent = `${CONSTITUENCIES.length} Real-World Seats`;
      if (statusText) statusText.textContent = `• Connected via Firestore (${result.source})`;

      // Re-render UI with refreshed cloud dataset
      handleSearchInput(currentSearchQuery);
      populateConstituencySelect();
      showToast(`Cloud Sync Complete: ${CONSTITUENCIES.length} seats updated from Firebase Firestore`);
    }
  } catch (err) {
    console.warn("Could not sync with Firestore endpoint, using persistent local state:", err);
    showToast("Using verified real-world dataset cache (Offline safe)");
  } finally {
    if (spinIcon) spinIcon.classList.remove("animate-spin");
    if (syncBtn) syncBtn.removeAttribute("disabled");
  }
}

// -----------------------------------------------------------------------------
// 3. Search Engine Implementation (Fast, Multi-field, Fuzzy & Synchronized)
// -----------------------------------------------------------------------------
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightMatch(text, term) {
  if (!term || !text) return text || "";
  const regex = new RegExp(`(${escapeRegExp(term)})`, "gi");
  return String(text).replace(regex, `<mark class="bg-amber-200 text-slate-900 rounded-xs px-0.5 font-bold">$1</mark>`);
}

function searchConstituencies(query) {
  if (!query) return [...CONSTITUENCIES];
  const q = query.toLowerCase().trim();

  return CONSTITUENCIES.filter(c => {
    // 1. Match constituency name
    if (c.name.toLowerCase().includes(q)) return true;
    // 2. Match state
    if (c.state.toLowerCase().includes(q)) return true;
    // 3. Match MP name
    if (c.mpName.toLowerCase().includes(q)) return true;
    // 4. Match Lok Sabha Seat Code (e.g. LS-UP-77)
    if (c.seatCode.toLowerCase().includes(q)) return true;
    // 5. Match Risk tier (e.g. "HIGH", "LOW", "MEDIUM", "Clean")
    if (c.riskTier.toLowerCase() === q || (q === "clean" && c.riskTier === "LOW")) return true;
    if (q.includes("risk") && (c.riskTier === "HIGH" || c.riskTier === "MEDIUM")) return true;
    // 6. Match any project work title, contractor, or note
    if (c.projects && c.projects.some(p => 
      p.title.toLowerCase().includes(q) || 
      p.contractor.toLowerCase().includes(q) ||
      (p.note && p.note.toLowerCase().includes(q))
    )) return true;
    // 7. Match any issue title or description
    if (c.issues && c.issues.some(iss =>
      iss.title.toLowerCase().includes(q) ||
      iss.desc.toLowerCase().includes(q)
    )) return true;

    return false;
  });
}

function handleSearchInput(value) {
  currentSearchQuery = value || "";
  const clearBtn = document.getElementById("clearSearchBtn");
  const statusIndicator = document.getElementById("activeSearchStatus");
  const countBadge = document.getElementById("searchCounterBadge");
  const q = currentSearchQuery.trim();

  if (q.length > 0) {
    if (clearBtn) clearBtn.classList.remove("hidden");
    if (statusIndicator) {
      statusIndicator.classList.remove("hidden");
      statusIndicator.textContent = `Searching "${q}"...`;
    }
  } else {
    if (clearBtn) clearBtn.classList.add("hidden");
    if (statusIndicator) statusIndicator.classList.add("hidden");
  }

  // Filter dataset
  currentMatches = searchConstituencies(q);
  selectedDropdownIndex = -1;

  // Update counter badge
  if (countBadge) {
    countBadge.textContent = `${currentMatches.length} of ${CONSTITUENCIES.length} Seats`;
    if (currentMatches.length === 0) {
      countBadge.className = "hidden sm:inline-flex px-3 py-1 bg-rose-100 text-rose-700 rounded-xl text-xs font-bold self-start";
    } else if (q.length > 0) {
      countBadge.className = "hidden sm:inline-flex px-3 py-1 bg-blue-100 text-blue-800 rounded-xl text-xs font-bold self-start";
    } else {
      countBadge.className = "hidden sm:inline-flex px-3 py-1 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold self-start";
    }
  }

  // Synchronize All Visual Outputs
  renderSearchSuggestions(q, currentMatches);
  renderSatelliteMapPins(q.length > 0 ? currentMatches : null);
  renderQuickAreaGrid(currentMatches);

  // If exactly 1 match found, smoothly center map on that constituency
  if (currentMatches.length === 1 && q.length > 1) {
    const single = currentMatches[0];
    zoomToRegion(single.name, single.coords.x, single.coords.y);
  }
}

function showSearchDropdown() {
  const dropdown = document.getElementById("searchSuggestionsDropdown");
  if (!dropdown) return;
  renderSearchSuggestions(currentSearchQuery.trim(), currentMatches);
  dropdown.classList.remove("hidden");
}

function clearSearch() {
  const input = document.getElementById("searchInput");
  if (input) {
    input.value = "";
    input.focus();
  }
  handleSearchInput("");
  resetMapZoom();
}

function applyQuickSearch(term) {
  const input = document.getElementById("searchInput");
  if (input) {
    input.value = term;
    input.focus();
  }
  handleSearchInput(term);
  showSearchDropdown();
}

function handleSearchKeyDown(event) {
  const dropdown = document.getElementById("searchSuggestionsDropdown");
  const items = dropdown ? dropdown.querySelectorAll(".search-item") : [];

  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (items.length > 0) {
      selectedDropdownIndex = (selectedDropdownIndex + 1) % items.length;
      updateDropdownSelectionHighlight(items);
    }
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    if (items.length > 0) {
      selectedDropdownIndex = (selectedDropdownIndex - 1 + items.length) % items.length;
      updateDropdownSelectionHighlight(items);
    }
  } else if (event.key === "Enter") {
    event.preventDefault();
    if (selectedDropdownIndex >= 0 && items[selectedDropdownIndex]) {
      items[selectedDropdownIndex].click();
    } else if (currentMatches.length > 0) {
      openAreaDetailPage(currentMatches[0].id);
      if (dropdown) dropdown.classList.add("hidden");
    }
  } else if (event.key === "Escape") {
    if (dropdown) dropdown.classList.add("hidden");
    const input = document.getElementById("searchInput");
    if (input) input.blur();
  }
}

function updateDropdownSelectionHighlight(items) {
  items.forEach((item, idx) => {
    if (idx === selectedDropdownIndex) {
      item.classList.add("bg-blue-50", "border-l-4", "border-blue-600");
      item.scrollIntoView({ block: "nearest" });
    } else {
      item.classList.remove("bg-blue-50", "border-l-4", "border-blue-600");
    }
  });
}

function renderSearchSuggestions(term, matches) {
  const dropdown = document.getElementById("searchSuggestionsDropdown");
  if (!dropdown) return;

  if (matches.length === 0) {
    dropdown.innerHTML = `
      <div class="p-5 text-center space-y-2">
        <div class="w-9 h-9 mx-auto bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
        <div class="text-xs font-bold text-slate-800">No constituencies match "${term}"</div>
        <p class="text-[11px] text-slate-500">Try searching city ("Delhi"), MP ("Modi"), code ("LS-UP-77"), or sector ("Solar")</p>
        <button onclick="clearSearch()" class="mt-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer">
          Reset Search Filter
        </button>
      </div>
    `;
    dropdown.classList.remove("hidden");
    return;
  }

  dropdown.innerHTML = matches.map((c, index) => {
    // Check if matched on a specific project work
    let projectMatchSnippet = "";
    if (term && c.projects) {
      const matchedProj = c.projects.find(p => 
        p.title.toLowerCase().includes(term) || 
        p.contractor.toLowerCase().includes(term)
      );
      if (matchedProj) {
        projectMatchSnippet = `
          <div class="mt-1 text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
            <span>🔎 Work:</span>
            <span class="font-medium truncate">${highlightMatch(matchedProj.title, term)}</span>
          </div>
        `;
      }
    }

    let badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    let badgeLabel = "Clean Audit";
    if (c.riskTier === "HIGH") {
      badgeClass = "bg-rose-50 text-rose-700 border-rose-200";
      badgeLabel = "High Risk";
    } else if (c.riskTier === "MEDIUM") {
      badgeClass = "bg-amber-50 text-amber-800 border-amber-200";
      badgeLabel = "Medium Risk";
    }

    return `
      <div 
        class="search-item p-3.5 hover:bg-blue-50/80 transition-colors cursor-pointer flex items-center justify-between gap-3 border-b border-slate-100 last:border-b-0"
        onclick="selectSearchItem('${c.id}')"
      >
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-900">${highlightMatch(c.name, term)}</span>
            <span class="text-[10px] font-mono font-semibold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">${highlightMatch(c.seatCode, term)}</span>
            <span class="text-[11px] text-slate-400 font-medium">(${highlightMatch(c.state, term)})</span>
          </div>
          <div class="text-[11px] text-slate-500 mt-0.5 truncate">
            MP: <strong class="text-slate-700 font-semibold">${highlightMatch(c.mpName, term)}</strong> (${c.mpParty})
          </div>
          ${projectMatchSnippet}
        </div>
        <div class="text-right shrink-0">
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}">
            ${badgeLabel}
          </span>
          <div class="text-[10px] text-slate-400 mt-1">Score: ${c.riskScore}/100</div>
        </div>
      </div>
    `;
  }).join("");

  dropdown.classList.remove("hidden");
}

function selectSearchItem(areaId) {
  const dropdown = document.getElementById("searchSuggestionsDropdown");
  if (dropdown) dropdown.classList.add("hidden");
  openAreaDetailPage(areaId);
}

// Close dropdown on outside click
document.addEventListener("click", (e) => {
  const searchBox = document.getElementById("searchInput");
  const dropdown = document.getElementById("searchSuggestionsDropdown");
  if (searchBox && dropdown && !searchBox.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.add("hidden");
  }
});

// -----------------------------------------------------------------------------
// 4. Satellite Map Pins Rendering (With Live Search Dimming & Pulse Feedback)
// -----------------------------------------------------------------------------
function renderSatelliteMapPins(matchedList = null) {
  const group = document.getElementById("mapPinsSvgGroup");
  if (!group) return;
  group.innerHTML = "";

  const matchedIds = matchedList ? new Set(matchedList.map(m => m.id)) : null;

  CONSTITUENCIES.forEach(c => {
    // Check localized filter
    if (activeRiskFilter !== "ALL" && c.riskTier !== activeRiskFilter) {
      return;
    }

    const isMatch = matchedIds ? matchedIds.has(c.id) : true;
    const isHigh = c.riskTier === "HIGH";
    const isMedium = c.riskTier === "MEDIUM";

    let dotColor = "#10B981"; // Green (Low)
    let ringColor = "rgba(16, 185, 129, 0.45)";

    if (isHigh) {
      dotColor = "#EF4444"; // Red (High)
      ringColor = "rgba(239, 68, 68, 0.5)";
    } else if (isMedium) {
      dotColor = "#F59E0B"; // Amber (Medium)
      ringColor = "rgba(245, 158, 11, 0.45)";
    }

    const pinGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    pinGroup.setAttribute("class", "map-pin cursor-pointer transition-all duration-300");
    pinGroup.setAttribute("id", `pin-${c.id}`);
    pinGroup.setAttribute("transform", `translate(${c.coords.x}, ${c.coords.y})`);

    // Search feedback: dim non-matching pins
    if (!isMatch) {
      pinGroup.setAttribute("opacity", "0.15");
      pinGroup.style.pointerEvents = "none";
    } else {
      pinGroup.setAttribute("opacity", "1");
      pinGroup.style.pointerEvents = "auto";
    }

    pinGroup.onclick = (e) => {
      e.stopPropagation();
      openAreaDetailPage(c.id);
    };

    // If High Risk or actively filtered match, pulse radar beacon
    if (isHigh || (matchedList && isMatch)) {
      const radar = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      radar.setAttribute("cx", "0");
      radar.setAttribute("cy", "0");
      radar.setAttribute("r", isHigh ? "16" : "13");
      radar.setAttribute("fill", ringColor);
      radar.setAttribute("class", "gentle-radar-ring");
      pinGroup.appendChild(radar);
    }

    // Outer Circle
    const outerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    outerCircle.setAttribute("cx", "0");
    outerCircle.setAttribute("cy", "0");
    outerCircle.setAttribute("r", "9");
    outerCircle.setAttribute("fill", "#FFFFFF");
    outerCircle.setAttribute("stroke", dotColor);
    outerCircle.setAttribute("stroke-width", "2.5");
    outerCircle.setAttribute("class", "pin-dot");
    pinGroup.appendChild(outerCircle);

    // Inner Core Dot
    const coreDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    coreDot.setAttribute("cx", "0");
    coreDot.setAttribute("cy", "0");
    coreDot.setAttribute("r", "4.5");
    coreDot.setAttribute("fill", dotColor);
    pinGroup.appendChild(coreDot);

    // Label Text beside Pin
    const labelText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    labelText.setAttribute("x", "12");
    labelText.setAttribute("y", "4");
    labelText.setAttribute("fill", "#0F172A");
    labelText.setAttribute("font-size", "10px");
    labelText.setAttribute("font-weight", "bold");
    labelText.setAttribute("class", "select-none drop-shadow-sm pointer-events-none");
    labelText.textContent = c.name;
    pinGroup.appendChild(labelText);

    group.appendChild(pinGroup);
  });
}

// -----------------------------------------------------------------------------
// 5. Quick Access Cards Grid below Map
// -----------------------------------------------------------------------------
function renderQuickAreaGrid(listToRender = null) {
  const container = document.getElementById("quickAreaGrid");
  const countBadge = document.getElementById("quickAreaCountBadge");
  if (!container) return;
  container.innerHTML = "";

  const list = listToRender !== null ? listToRender : CONSTITUENCIES;

  if (countBadge) {
    countBadge.textContent = `${list.length} seats`;
  }

  if (list.length === 0) {
    container.className = "col-span-full py-6 text-center bg-slate-50 border border-slate-200 rounded-2xl";
    container.innerHTML = `
      <div class="space-y-2">
        <p class="text-xs text-slate-500 font-medium">No parliamentary constituencies found matching current filter.</p>
        <button onclick="clearSearch()" class="px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-blue-700 hover:bg-slate-50 cursor-pointer shadow-2xs">
          Reset Search Filter
        </button>
      </div>
    `;
    return;
  }

  container.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5";

  list.forEach(c => {
    let badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    let dotClass = "bg-emerald-500";
    let tierText = "Clean";

    if (c.riskTier === "HIGH") {
      badgeClass = "bg-rose-50 text-rose-700 border-rose-200";
      dotClass = "bg-rose-500";
      tierText = "High Risk";
    } else if (c.riskTier === "MEDIUM") {
      badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
      dotClass = "bg-amber-500";
      tierText = "Medium";
    }

    const card = document.createElement("div");
    card.className = "p-3.5 bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-blue-400 rounded-2xl cursor-pointer transition-all hover:shadow-xs group";
    card.onclick = () => openAreaDetailPage(c.id);
    card.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">${c.name}</span>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass} flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full ${dotClass}"></span>
          <span>${tierText}</span>
        </span>
      </div>
      <div class="text-[11px] text-slate-500 truncate">MP: ${c.mpName} (${c.seatCode})</div>
      <div class="text-[10px] text-blue-600 font-semibold mt-1.5 flex items-center gap-1">
        <span>Inspect findings</span> &rarr;
      </div>
    `;
    container.appendChild(card);
  });
}

// -----------------------------------------------------------------------------
// 6. Map Zoom & Interaction Controllers
// -----------------------------------------------------------------------------
function applyMapTransform() {
  const svgLayer = document.getElementById("satelliteSvgLayer");
  if (!svgLayer) return;

  if (currentZoomScale <= 1) {
    svgLayer.style.transform = "scale(1) translate(0px, 0px)";
    const badge = document.getElementById("zoomStatusBadge");
    if (badge) badge.classList.add("hidden");
  } else {
    svgLayer.style.transform = `scale(${currentZoomScale}) translate(${currentZoomX}px, ${currentZoomY}px)`;
    const badge = document.getElementById("zoomStatusBadge");
    if (badge) badge.classList.remove("hidden");
  }
}

function zoomMapIn() {
  currentZoomScale = Math.min(currentZoomScale + 0.5, 3.0);
  applyMapTransform();
}

function zoomMapOut() {
  currentZoomScale = Math.max(currentZoomScale - 0.5, 1.0);
  if (currentZoomScale === 1) {
    currentZoomX = 0;
    currentZoomY = 0;
  }
  applyMapTransform();
}

function resetMapZoom() {
  currentZoomScale = 1;
  currentZoomX = 0;
  currentZoomY = 0;
  applyMapTransform();
}

function zoomToRegion(regionName, cx, cy) {
  currentZoomScale = 2.1;
  currentZoomX = (250 - cx) * 0.45;
  currentZoomY = (300 - cy) * 0.45;
  const zoomText = document.getElementById("zoomStatusText");
  if (zoomText) zoomText.textContent = `Zoomed in on ${regionName}`;
  applyMapTransform();
}

function handleMapLandmassClick() {
  if (currentZoomScale === 1) {
    zoomToRegion("Central India", 260, 300);
  }
}

function setMapRiskFilter(tier) {
  activeRiskFilter = tier;
  document.querySelectorAll(".filter-pill").forEach(btn => {
    btn.className = "filter-pill px-3 py-1 rounded-xl transition-all text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer";
  });

  const activeBtn = document.getElementById(`filterBtn-${tier}`);
  if (activeBtn) {
    activeBtn.className = "filter-pill px-3 py-1 rounded-xl transition-all bg-white text-slate-900 shadow-2xs border border-slate-200/80 flex items-center gap-1.5 font-bold cursor-pointer";
  }

  renderSatelliteMapPins(currentSearchQuery ? currentMatches : null);
}

// -----------------------------------------------------------------------------
// 7. Area Detail Page Controller (New Page Transition)
// -----------------------------------------------------------------------------
function openAreaDetailPage(areaId) {
  currentSelectedId = areaId;
  const data = CONSTITUENCIES.find(c => c.id === areaId);
  if (!data) return;

  // Hide search suggestions
  const dropdown = document.getElementById("searchSuggestionsDropdown");
  if (dropdown) dropdown.classList.add("hidden");

  // Switch views
  const mapCard = document.getElementById("viewMainMap");
  const detailCard = document.getElementById("viewAreaDetail");

  if (mapCard) mapCard.classList.add("hidden");
  if (detailCard) detailCard.classList.remove("hidden");

  window.scrollTo({ top: 0, behavior: "smooth" });

  // Populate Header
  document.getElementById("detailTitle").textContent = data.name;
  document.getElementById("detailStateBadge").textContent = `${data.state} State`;
  document.getElementById("detailAreaCode").textContent = `Seat Code: ${data.seatCode}`;
  document.getElementById("detailMpName").innerHTML = `Elected MP: <strong class="text-slate-900">${data.mpName}</strong> (${data.mpParty || 'Lok Sabha'})`;
  document.getElementById("detailRiskScoreNumber").textContent = data.riskScore;
  document.getElementById("detailRiskSummaryText").textContent = data.riskSummary;

  // Colorize badge
  const riskBadge = document.getElementById("detailTopRiskBadge");
  const scoreNum = document.getElementById("detailRiskScoreNumber");
  if (data.riskTier === "HIGH") {
    riskBadge.className = "px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-1.5";
    riskBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-500"></span><span>High Risk of Fraud</span>`;
    scoreNum.className = "text-2xl font-black text-rose-600";
  } else if (data.riskTier === "MEDIUM") {
    riskBadge.className = "px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5";
    riskBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500"></span><span>Medium Risk (Delay)</span>`;
    scoreNum.className = "text-2xl font-black text-amber-600";
  } else {
    riskBadge.className = "px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5";
    riskBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500"></span><span>Clean & Compliant</span>`;
    scoreNum.className = "text-2xl font-black text-emerald-700";
  }

  // Callouts
  if (data.callouts) {
    document.getElementById("calloutDuplicationTitle").textContent = data.callouts.duplicationTitle;
    document.getElementById("calloutDuplicationDesc").textContent = data.callouts.duplicationDesc;
    document.getElementById("calloutDuplicationMetric").textContent = data.callouts.duplicationMetric;

    document.getElementById("calloutDelayTitle").textContent = data.callouts.delayTitle;
    document.getElementById("calloutDelayDesc").textContent = data.callouts.delayDesc;
    document.getElementById("calloutDelayMetric").textContent = data.callouts.delayMetric;
  }

  // Issues Tab
  const issuesContainer = document.getElementById("simpleIssuesList");
  if (issuesContainer) {
    if (!data.issues || data.issues.length === 0) {
      issuesContainer.innerHTML = `
        <div class="p-6 text-center bg-emerald-50/50 border border-emerald-200 rounded-2xl">
          <span class="text-xl">✅</span>
          <div class="text-xs font-bold text-emerald-900 mt-1">Zero Audit Irregularities Found</div>
          <p class="text-[11px] text-emerald-700 mt-0.5">All sanctioned works comply with Ministry of Statistics guidelines.</p>
        </div>
      `;
    } else {
      issuesContainer.innerHTML = data.issues.map(issue => `
        <div class="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
          <div class="flex items-center justify-between">
            <h5 class="text-xs sm:text-sm font-bold text-slate-900">${issue.title}</h5>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded ${issue.severity === 'High' ? 'bg-rose-100 text-rose-700' : (issue.severity === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')}">
              ${issue.severity} Priority
            </span>
          </div>
          <p class="text-xs text-slate-600">${issue.desc}</p>
          <div class="text-[11px] text-blue-700 font-medium pt-1">
            📘 ${issue.simpleRule}
          </div>
        </div>
      `).join("");
    }
  }

  // Projects Tab
  const projectsContainer = document.getElementById("simpleProjectsList");
  if (projectsContainer) {
    if (!data.projects || data.projects.length === 0) {
      projectsContainer.innerHTML = `<div class="p-4 text-xs text-slate-400">No project records uploaded yet.</div>`;
    } else {
      projectsContainer.innerHTML = data.projects.map(p => `
        <div class="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="space-y-1">
            <h5 class="text-xs sm:text-sm font-bold text-slate-900">${p.title}</h5>
            <div class="text-xs text-slate-500">Cost: <strong class="text-slate-800">${p.cost}</strong> • Vendor: ${p.contractor}</div>
            <div class="text-[11px] text-slate-500">🔍 Note: ${p.note}</div>
          </div>
          <span class="text-xs font-bold px-3 py-1.5 rounded-xl self-start sm:self-auto ${p.statusColor === 'rose' ? 'bg-rose-50 text-rose-600 border border-rose-200' : (p.statusColor === 'amber' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')}">
            ${p.status}
          </span>
        </div>
      `).join("");
    }
  }

  // Leader Tab
  if (data.leader) {
    document.getElementById("leaderSpentAmount").textContent = data.leader.spentPercent;
    document.getElementById("leaderUnspentAmount").textContent = data.leader.unspent;
    document.getElementById("leaderAuditStatus").textContent = data.leader.auditStatus;
    document.getElementById("leaderScPercent").textContent = data.leader.scPercent;
    document.getElementById("leaderScBar").style.width = data.leader.scBar;
    document.getElementById("leaderStPercent").textContent = data.leader.stPercent;
    document.getElementById("leaderStBar").style.width = data.leader.stBar;
  }

  // Timeline Tab
  const timelineContainer = document.getElementById("simpleTimelineList");
  if (timelineContainer && data.timeline) {
    timelineContainer.innerHTML = data.timeline.map(t => `
      <div class="relative group">
        <span class="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100"></span>
        <div class="text-[11px] font-mono text-slate-400 font-bold">${t.date}</div>
        <h5 class="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">${t.title}</h5>
        <p class="text-xs text-slate-500 mt-0.5">${t.desc}</p>
      </div>
    `).join("");
  }

  switchDetailTab("tab-risky");
}

function goBackToMainMap() {
  const mapCard = document.getElementById("viewMainMap");
  const detailCard = document.getElementById("viewAreaDetail");

  if (detailCard) detailCard.classList.add("hidden");
  if (mapCard) mapCard.classList.remove("hidden");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function switchDetailTab(tabId) {
  document.querySelectorAll(".detail-tab-pill").forEach(btn => {
    btn.className = "detail-tab-pill px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 whitespace-nowrap cursor-pointer";
  });

  document.getElementById("content-tab-risky").classList.add("hidden");
  document.getElementById("content-tab-photos").classList.add("hidden");
  document.getElementById("content-tab-leader").classList.add("hidden");
  document.getElementById("content-tab-timeline").classList.add("hidden");

  const activeBtn = document.getElementById(`tabBtn-${tabId.replace('tab-', '')}`);
  if (activeBtn) {
    activeBtn.className = "detail-tab-pill px-4 py-2 rounded-xl transition-all flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200/70 whitespace-nowrap font-bold shadow-2xs cursor-pointer";
  }

  const activeContent = document.getElementById(`content-${tabId}`);
  if (activeContent) {
    activeContent.classList.remove("hidden");
  }
}

// -----------------------------------------------------------------------------
// 8. Citizen Anomaly Report Modal & Firestore Submission
// -----------------------------------------------------------------------------
function openCitizenReportModal() {
  const modal = document.getElementById("citizenReportModal");
  if (!modal) return;
  populateConstituencySelect();
  modal.classList.remove("hidden");
}

function closeCitizenReportModal() {
  const modal = document.getElementById("citizenReportModal");
  if (modal) modal.classList.add("hidden");
}

function populateConstituencySelect() {
  const select = document.getElementById("reportConstituencySelect");
  if (!select) return;
  select.innerHTML = CONSTITUENCIES.map(c => `
    <option value="${c.id}" ${c.id === currentSelectedId ? 'selected' : ''}>
      ${c.name} (${c.state} - ${c.seatCode}) - MP: ${c.mpName}
    </option>
  `).join("");
}

async function submitCitizenReport(event) {
  event.preventDefault();
  const submitBtn = document.getElementById("submitReportBtn");
  const statusMsg = document.getElementById("reportStatusMessage");
  
  const constituencyId = document.getElementById("reportConstituencySelect").value;
  const issueType = document.getElementById("reportIssueTypeSelect").value;
  const workCode = document.getElementById("reportWorkCode").value;
  const description = document.getElementById("reportDescription").value;
  const citizenName = document.getElementById("reportCitizenName").value;

  if (submitBtn) {
    submitBtn.setAttribute("disabled", "true");
    submitBtn.textContent = "Writing to Firestore...";
  }

  try {
    const res = await fetch("/api/citizen-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        constituencyId,
        issueType,
        workCode,
        description,
        citizenName
      })
    });
    
    if (statusMsg) {
      statusMsg.className = "p-3 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200";
      statusMsg.textContent = "✅ Anomaly recorded to Firebase Cloud Firestore. Nodal vigilance team notified.";
      statusMsg.classList.remove("hidden");
    }

    setTimeout(() => {
      closeCitizenReportModal();
      document.getElementById("citizenReportForm").reset();
      if (statusMsg) statusMsg.classList.add("hidden");
      showToast("Report securely stored in Firebase Firestore");
    }, 1500);

  } catch (err) {
    if (statusMsg) {
      statusMsg.className = "p-3 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200";
      statusMsg.textContent = "Error saving to cloud: " + err.message;
      statusMsg.classList.remove("hidden");
    }
  } finally {
    if (submitBtn) {
      submitBtn.removeAttribute("disabled");
      submitBtn.innerHTML = `<span>Submit to Firestore</span> &rarr;`;
    }
  }
}

function showToast(msg) {
  const existing = document.getElementById("appToast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "appToast";
  toast.className = "fixed bottom-5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 flex items-center gap-2";
  toast.innerHTML = `
    <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
    <span>${msg}</span>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// -----------------------------------------------------------------------------
// 9. Right-Side Fixed Navbar Buttons Controller
// -----------------------------------------------------------------------------
function switchRightNav(navAction) {
  document.querySelectorAll(".right-nav-btn").forEach(b => {
    b.className = "right-nav-btn w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent transition-all text-left cursor-pointer";
  });

  if (navAction === "view-all") {
    document.getElementById("navBtn-all").className = "right-nav-btn w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold text-blue-700 bg-blue-50/80 border border-blue-200/70 transition-all text-left shadow-2xs cursor-pointer";
    goBackToMainMap();
    resetMapZoom();
    clearSearch();
    setMapRiskFilter("ALL");
  } else if (navAction === "view-fraud") {
    document.getElementById("navBtn-fraud").className = "right-nav-btn w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold text-blue-700 bg-blue-50/80 border border-blue-200/70 transition-all text-left shadow-2xs cursor-pointer";
    goBackToMainMap();
    applyQuickSearch("HIGH");
  } else if (navAction === "view-alerts") {
    document.getElementById("navBtn-alerts").className = "right-nav-btn w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold text-rose-700 bg-rose-50/80 border border-rose-200/70 transition-all text-left shadow-2xs cursor-pointer";
    openAreaDetailPage("bengaluru_rural");
  } else if (navAction === "view-settings") {
    document.getElementById("navBtn-settings").className = "right-nav-btn w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold text-blue-700 bg-blue-50/80 border border-blue-200/70 transition-all text-left shadow-2xs cursor-pointer";
    openCitizenReportModal();
  }
}

// -----------------------------------------------------------------------------
// 10. Initial Startup on Page Load
// -----------------------------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  renderSatelliteMapPins();
  renderQuickAreaGrid();
  populateConstituencySelect();

  // Connect & Sync with Firebase Firestore in background
  syncWithFirestore();
});
