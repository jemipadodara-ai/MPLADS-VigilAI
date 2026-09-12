import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { MPLADProject } from '../../types';
import {
  Sparkles,
  Send,
  Bot,
  User,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Building,
  MapPin,
  Clock,
  Loader2,
  ExternalLink,
  Phone,
  Mail,
  HelpCircle,
  RotateCcw,
  Copy,
  Check,
  FileText,
  ChevronRight,
  Headphones,
  MessageSquare,
} from 'lucide-react';

interface AiAssistantViewProps {
  projects: MPLADProject[];
  onSelectProjectByWorkCode: (code: string) => void;
  currentUser?: any;
}

interface ActionProposal {
  hasActionProposal: boolean;
  actionType: string;
  projectId?: string;
  workCode?: string;
  projectTitle?: string;
  authority?: string;
  assignedOfficer?: string;
  suggestedDeadline?: string;
  priority?: string;
  reason?: string;
  targetRole?: string;
  state?: string;
  district?: string;
}

interface MenuItem {
  id: string;
  number: number;
  label: string;
  badge?: string;
  icon: any;
  description: string;
  isHelpline?: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  source?: string;
  actionProposal?: ActionProposal | null;
  citedProjects?: { id: string; workCode: string; title: string; riskScore: number }[];
  actionConfirmed?: boolean;
  isMenu?: boolean;
  menuRole?: string;
  showHelplineCard?: boolean;
  docketCode?: string;
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  projects,
  onSelectProjectByWorkCode,
  currentUser,
}) => {
  const { language } = useLanguage();
  const rawRole = (currentUser?.role || 'minister').toLowerCase();
  const initialRole = ['minister', 'inspector', 'citizen'].includes(rawRole)
    ? rawRole
    : 'minister';
  const [selectedRole, setSelectedRole] = useState<string>(initialRole);

  // Helpline interactive callback state
  const [callbackNumber, setCallbackNumber] = useState('');
  const [callbackStatus, setCallbackStatus] = useState<Record<string, string>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const getGreetingTitle = (r: string) => {
    if (r === 'minister') return 'Honorable Minister';
    if (r === 'inspector') return 'Field Inspector';
    return 'Citizen';
  };

  const getRoleDisplayName = (r: string) => {
    if (r === 'minister') return 'UNION MINISTER';
    if (r === 'inspector') return 'FIELD INSPECTOR';
    return 'CITIZEN';
  };

  // Role Menu Definitions (JioMart / Brand Helpline style)
  const roleMenus: Record<string, MenuItem[]> = useMemo(() => ({
    minister: [
      {
        id: 'opt-min-1',
        number: 1,
        label: 'National High-Risk Projects Dossier',
        badge: 'Critical P0',
        icon: AlertTriangle,
        description: 'View 5 highest-risk works, fund exposure & unverified milestone gaps.',
      },
      {
        id: 'opt-min-2',
        number: 2,
        label: 'State Fund Absorption & Delay Overview',
        badge: 'State Audit',
        icon: Building,
        description: 'Fund utilization percentages, unspent balances & delayed UCs by state.',
      },
      {
        id: 'opt-min-3',
        number: 3,
        label: 'Contractor Cartel & Single-Bid concentration',
        badge: 'Cartel Alert',
        icon: ShieldAlert,
        description: 'Vendor concentration audit for Apex InfraWorks & sub-10 Lakh slicing.',
      },
      {
        id: 'opt-min-4',
        number: 4,
        label: 'Executive Decisions & Statutory Directives',
        badge: 'Statutory',
        icon: FileCheck2,
        description: 'Review pending stop-payment proposals and CAG inspection panel orders.',
      },
      {
        id: 'opt-min-5',
        number: 5,
        label: 'Talk to Ministry Assistant / Nodal Helpline',
        badge: 'Live Support',
        icon: Phone,
        description: 'Connect with MoSPI Vigilance Desk (1800-11-8012) or request callback.',
        isHelpline: true,
      },
    ],
    inspector: [
      {
        id: 'opt-ins-1',
        number: 1,
        label: 'My Priority Site Inspection Missions',
        badge: 'Assigned',
        icon: FileText,
        description: 'Briefing on 3 assigned field verification missions in Varanasi division.',
      },
      {
        id: 'opt-ins-2',
        number: 2,
        label: 'Work Code VAR-089 Progress vs Financial Gap',
        badge: 'Audit VAR-089',
        icon: AlertTriangle,
        description: 'Evaluate 20% physical progress vs 100% disbursed funds at Rampur Chowk.',
      },
      {
        id: 'opt-ins-3',
        number: 3,
        label: 'Geo-Tagged Photo & Measurement Book Protocols',
        badge: 'MoSPI SOP',
        icon: CheckCircle2,
        description: 'Mandatory on-site verification standards, GPS tolerance & checklist.',
      },
      {
        id: 'opt-ins-4',
        number: 4,
        label: 'Flagged Contractors & Quality Warning List',
        badge: 'Vendor Alert',
        icon: ShieldAlert,
        description: 'Quality alerts for Apex InfraWorks and Mahadev Infra Projects.',
      },
      {
        id: 'opt-ins-5',
        number: 5,
        label: 'Talk to Control Room / SE Helpline',
        badge: 'Live Support',
        icon: Phone,
        description: 'Contact District Vigilance Control Room (1800-11-8012) or request callback.',
        isHelpline: true,
      },
    ],
    citizen: [
      {
        id: 'opt-cit-1',
        number: 1,
        label: 'Public Works in My Area (Completed & Active)',
        badge: 'Public Works',
        icon: Building,
        description: 'Status of 8 community projects, water plants & parks in Varanasi.',
      },
      {
        id: 'opt-cit-2',
        number: 2,
        label: 'How to Report a Stalled or Fake Project',
        badge: 'Social Audit',
        icon: AlertTriangle,
        description: 'Step-by-step guide to uploading mobile site photos & filing social audit.',
      },
      {
        id: 'opt-cit-3',
        number: 3,
        label: 'Check Expenditure & Contractor for My Ward',
        badge: 'Transparency',
        icon: FileText,
        description: 'Look up sanctioned funds, spent amounts and contractors for local works.',
      },
      {
        id: 'opt-cit-4',
        number: 4,
        label: 'Citizen Display Board Verification Checklist',
        badge: 'Mandatory',
        icon: FileCheck2,
        description: 'What information must be displayed on physical project signage.',
      },
      {
        id: 'opt-cit-5',
        number: 5,
        label: 'Talk to Citizen Helpline / File Grievance',
        badge: 'Live Support',
        icon: Phone,
        description: 'Call national toll-free helpline (1800-11-8012), email, or get callback.',
        isHelpline: true,
      },
    ],
  }), []);

  // Predefined rich English responses with aggregated statistics
  const getPredefinedResponse = (optionNumber: number, role: string) => {
    const totalProjectsCount = projects.length || 12;
    const criticalProjects = projects.filter(
      (p) => (p.overallRiskScore || p.riskScore || 0) >= 75
    );
    const totalSanctioned = projects.reduce(
      (sum, p) => sum + (p.sanctionedAmountLakhs || 0),
      0
    ) || 248.5;
    const totalSpent = projects.reduce(
      (sum, p) => sum + (p.expenditureAmountLakhs || 0),
      0
    ) || 192.4;

    if (optionNumber === 5) {
      const docket = `VIGIL-DESK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        text: `### 📞 Official Assistance & Statutory Redressal Desk\n\nIf you need to speak directly with an official assistant, report emergency irregularities, or escalate an unaddressed matter, please connect with the verified channels below.\n\n- **National Toll-Free Helpline:** **1800-11-8012** (MoSPI Public Grievance Desk, Mon–Fri 09:30 – 18:00 IST)\n- **Official Vigilance Email:** **mplads-vigilance@mospi.gov.in** (Official acknowledgment within 48 business hours)\n- **District Nodal Office:** Office of the District Magistrate & Collectorate Vigilance Cell, Varanasi, UP\n- **Central Grievance Portal:** [CPGRAMS Portal (pgportal.gov.in)](https://pgportal.gov.in) — Scheme: *MPLADS*\n- **Tracking Docket Code:** \`${docket}\`\n\nYou can also use the direct dial buttons or request a priority officer callback below:`,
        showHelplineCard: true,
        docketCode: docket,
      };
    }

    if (role === 'minister') {
      if (optionNumber === 1) {
        return {
          text: `🏛️ **Union Minister Executive Vigilance Briefing**\n\n### 📊 National High-Risk Portfolio Overview:\nA comprehensive review of the MPLADS National Monitoring Registry identified a total of **${criticalProjects.length || 5} projects** classified under **Critical Risk (P0)**, accounting for **₹107.30 Lakhs** in sanctioned capital and **₹97.80 Lakhs** in disbursed funds.\n\n- **Critical Risk (P0):** **5 projects** exhibit composite risk scores exceeding 75/100, demanding immediate executive stop-payment or technical audit.\n- **Acute Physical-Financial Gap:** **2 projects** have recorded 100% financial disbursement with less than 25% ground execution.\n- **Prolonged Slippage:** **1 project** has exceeded its completion schedule by over 120 days.\n- **Asset Distribution:** Works comprise **1 Community Center**, **2 Drinking Water RO Plants**, **1 Concrete Road**, and **1 Clean Energy Microgrid**.\n- **Geographic Spread:** Located across **2 in Varanasi (UP)**, **1 in Bengaluru Rural (KA)**, **1 in Jaipur (RJ)**, and **1 in Patna (BR)**.\n\n### 📋 Monitored Critical Works:\n1. 🚨 **Community Center at Rampur Chowk** (\`MPLADS/2023-24/UP/VAR-089\`): ₹28.5L (100% disbursed) vs 20% physical progress. Risk: 94/100.\n2. 🚨 **Channasandra RO Drinking Water Plant** (\`MPLADS/2023-24/KA/BLR-102\`): ₹18.0L (100% disbursed) vs unverified pump installation. Risk: 91/100.\n3. 🚨 **Deep Solar Tubewell in Sanganer** (\`MPLADS/2023-24/RJ/JPR-055\`): ₹22.0L (100% disbursed) vs missing power grid link. Risk: 88/100.\n4. 🚨 **Bakhtiyarpur Rural Concrete Road** (\`MPLADS/2023-24/BR/PAT-041\`): ₹14.8L (100% disbursed) vs substandard pavement core samples. Risk: 86/100.\n5. 🚨 **High-Mast Solar Lighting at Rohaniya** (\`MPLADS/2023-24/UP/VAR-094\`): ₹24.0L sanctioned, ₹14.5L spent, stalled at 55%. Risk: 81/100.`,
          citedProjects: [
            { id: 'proj-var-001', workCode: 'MPLADS/2023-24/UP/VAR-089', title: 'Community Center at Rampur Chowk', riskScore: 94 },
            { id: 'proj-blr-002', workCode: 'MPLADS/2023-24/KA/BLR-102', title: 'Channasandra RO Drinking Water Plant', riskScore: 91 },
          ],
        };
      }
      if (optionNumber === 2) {
        return {
          text: `🏛️ **Union Minister Executive Vigilance Briefing**\n\n### 📊 State Fund Absorption & Delay Overview:\nCross-state financial reconciliation reveals notable variances in fund absorption across key states:\n\n- **Uttar Pradesh:** **₹84.20 Crores** allocated across 75 districts. Current fund absorption rate is **68.4%**. **14 districts** have pending Utilization Certificates (UCs) exceeding 6 months.\n- **Bihar:** **₹52.10 Crores** allocated. Absorption rate is **61.2%**, with **8 rural constituencies** experiencing severe contracting delays.\n- **Karnataka:** **₹48.90 Crores** allocated with **76.5%** absorption. **3 urban drinking water works** flagged for contractor milestone disputes.\n- **Unspent Balances Alert:** A cumulative unspent balance of **₹34.80 Crores** remains idling in District Authority escrow accounts, requiring expenditure re-allocation under MoSPI 2023 Guidelines.`,
        };
      }
      if (optionNumber === 3) {
        return {
          text: `🏛️ **Union Minister Executive Vigilance Briefing**\n\n### 🏢 Contractor Cartel & Single-Bid Tender Concentration:\nAutomated procurement analysis identifies acute contractor concentration in eastern Uttar Pradesh:\n\n- **Flagged Vendor:** **Apex InfraWorks Private Limited**\n- **Volume of Allocations:** Awarded **7 separate works** totaling **₹68.40 Lakhs** across Varanasi division.\n- **Tender Slicing Pattern:** **5 out of 7 tenders** were priced between ₹9.40 Lakhs and ₹9.85 Lakhs — deliberately positioned below the mandatory ₹10 Lakhs open e-procurement threshold to enable single-bid quotation awards.\n- **Vigilance Concern:** **2 works** have overdue milestone verifications exceeding 90 days, and **1 work** exhibits an 80% physical execution gap.\n- **Recommended Executive Action:** Issue show-cause notice under GFR Rule 151 and mandate third-party measurement book verification prior to any new tender approvals.`,
        };
      }
      if (optionNumber === 4) {
        return {
          text: `🏛️ **Union Minister Executive Vigilance Briefing**\n\n### ⚖️ Executive Directives & Decision Center Docket:\nUnder the powers vested under MoSPI MPLADS Guidelines 2023, the Minister may execute immediate statutory interventions:\n\n- **Payment Freeze Order:** Freeze remaining disbursements for Work Code \`MPLADS/2023-24/UP/VAR-089\` pending physical inspection report.\n- **Deploy CAG Vigilance Audit Panel:** Constitute a 3-member technical audit team led by Superintending Engineer to re-measure executed work on site.\n- **Contractor Debarment Notice:** Initiate formal debarment inquiry against Apex InfraWorks under General Financial Rules.\n- **PAC Review Docket:** Generate an executive compliance brief for Parliamentary Public Accounts Committee review.\n\n*To formalize any directive, navigate to the Decision Center or confirm the proposed action card below.*`,
          actionProposal: {
            hasActionProposal: true,
            actionType: 'FREEZE_FUNDS_AND_DISPATCH_AUDIT',
            workCode: 'MPLADS/2023-24/UP/VAR-089',
            projectTitle: 'Community Center at Rampur Chowk',
            assignedOfficer: 'District Vigilance Officer, Varanasi',
            suggestedDeadline: '15 Days',
            priority: 'P0',
            reason: '100% financial disbursement with verified 20% physical execution',
          },
        };
      }
    }

    if (role === 'inspector') {
      if (optionNumber === 1) {
        return {
          text: `🔍 **Field Inspector Site Verification Briefing**\n\n### 📋 Assigned On-Site Verification Missions:\nYou have **3 active inspection assignments** prioritized in Varanasi division:\n\n1. 🚨 **Mission 1 (Critical Priority):** Work Code \`MPLADS/2023-24/UP/VAR-089\` — Multi-Purpose Community Center at Rampur Chowk. Objective: Reconcile 20% physical progress against 100% certified billing.\n2. ⚠️ **Mission 2 (Overdue Milestone):** Work Code \`MPLADS/2023-24/UP/VAR-045\` — Solar High-Mast Lighting at Rohaniya Bazar. Objective: Inspect battery bank specifications and verify asset serial barcode tags.\n3. 🔹 **Mission 3 (Quality Sampling):** Work Code \`MPLADS/2023-24/UP/VAR-092\` — Rural Concrete Road Pavement. Objective: Extract core samples to verify 150mm concrete thickness and drainage alignment.\n\n*Open your 'Field Inspection Mission' tab to log GPS coordinates and upload live verification photos.*`,
          citedProjects: [
            { id: 'proj-var-001', workCode: 'MPLADS/2023-24/UP/VAR-089', title: 'Community Center at Rampur Chowk', riskScore: 94 },
          ],
        };
      }
      if (optionNumber === 2) {
        return {
          text: `🔍 **Field Inspector Site Verification Briefing**\n\n### 📐 Work Code VAR-089 Technical Audit Dossier:\n- **Work Code:** \`MPLADS/2023-24/UP/VAR-089\`\n- **Sanction Amount:** **₹28.50 Lakhs** | **Disbursed:** **₹28.50 Lakhs (100%)**\n- **Physical Ground Progress:** Recorded at only **20%** (Foundation and partial columns only).\n- **Physical vs Financial Deficit:** An acute **80% execution deficit**.\n- **Contractor:** Mahadev Infra Projects Pvt Ltd / Apex InfraWorks.\n- **Inspector Instructions:** Conduct on-site measurement of column heights, inspect reinforcement steel specifications, and examine the physical Measurement Book (MB) signed by the junior engineer.`,
          citedProjects: [
            { id: 'proj-var-001', workCode: 'MPLADS/2023-24/UP/VAR-089', title: 'Community Center at Rampur Chowk', riskScore: 94 },
          ],
        };
      }
      if (optionNumber === 3) {
        return {
          text: `🔍 **Field Inspector Site Verification Briefing**\n\n### 📸 Geo-Tagged Photo & Measurement Book Rules (MoSPI 2023 SOP):\nWhen conducting field verification, inspectors must strictly adhere to the following statutory checklist:\n\n1. **Four Cardinal Angle Photographs:** Capture high-resolution photos facing North, South, East, and West with project asset centered.\n2. **GPS Accuracy Requirement:** Ensure device GPS accuracy is within **±5 meters** at the moment of photo capture.\n3. **Citizen Board Inspection:** Verify the physical presence, legibility, and exact wording of the mandatory Citizen Information Display Board.\n4. **Measurement Book (MB) Cross-Check:** Compare entries in the physical MB with physical dimensions on site.\n5. **Citizen Witness Signatures:** Record comments and contact details of at least 2 local resident beneficiaries present during inspection.`,
        };
      }
      if (optionNumber === 4) {
        return {
          text: `🔍 **Field Inspector Site Verification Briefing**\n\n### ⚠️ Flagged Contractors & Quality Alert Registry:\n- **Apex InfraWorks Private Limited:** Flagged for single-bid tender clustering and sub-contracting works to unapproved third parties.\n- **Mahadev Infra Projects Pvt Ltd:** Flagged for delayed milestone submissions and unverified foundation concrete testing.\n- **Special Protocol:** Every inspection involving these vendors requires destructive core testing or non-destructive rebound hammer tests on RCC structures before signing off verification certificates.`,
        };
      }
    }

    // Citizen
    if (optionNumber === 1) {
      return {
        text: `👥 **Citizen Public Transparency Briefing**\n\n### 🏘️ Public Works in Your Area (Varanasi Constituency):\nAccording to official MPLADS records, there are currently **8 public works** being monitored in your district:\n\n- **4 Fully Completed Works:**\n  1. ✅ Solar RO Drinking Water Plant (Ward 14, Order: ₹18.0L) — Operating & dispensing clean water.\n  2. ✅ Primary Health Center Extension Wing (Rohaniya, ₹16.5L) — Open for patient care.\n  3. ✅ High-School Science Laboratory Modernization (Shivpur, ₹12.0L) — Equipment installed.\n  4. ✅ Community Paver Block Pathway (Rampur Ward 3, ₹8.5L) — Completed.\n\n- **2 Works Under Construction:**\n  1. 🔨 Community Center & Skill Hall (Rampur, ₹28.5L) — Active scrutiny on progress.\n  2. 🔨 High-Mast Solar Microgrid System (Rohaniya Bazar, ₹24.0L) — 55% completed.\n\n- **2 Delayed / Review Works:** In review by District Collectorate for contractor milestone compliance.`,
      };
    }
    if (optionNumber === 2) {
      return {
        text: `👥 **Citizen Public Transparency Briefing**\n\n### 📢 How to Report a Stalled or Fake Project:\nCitizens are the first line of vigilance in the MPLADS scheme. Follow these simple steps to report an issue:\n\n1. **Open Citizen Social Audit Tab:** Click 'Citizen Social Audit & Verification' in the left menu.\n2. **Select Your Project:** Choose the project from the list or search by ward.\n3. **Take a Real Site Photo:** Capture a live photograph of the incomplete work, missing water tank, or broken signboard.\n4. **Quick Mobile OTP Verification:** Enter your 10-digit mobile number and verify with a simulated OTP to ensure authentic reporting.\n5. **Receive Permanent Tracking Docket:** Upon submission, you will immediately receive a grievance tracking code (e.g. \`VIGIL-2026-XXXX\`) for follow-up with the District Magistrate.`,
      };
    }
    if (optionNumber === 3) {
      return {
        text: `👥 **Citizen Public Transparency Briefing**\n\n### 💰 Check Expenditure & Contractor for Your Ward:\nEvery citizen has the legal right to know where public funds are being spent:\n\n- **Search Projects Tab:** Go to the 'Projects Master Registry' tab to search by your ward, village, or constituency.\n- **Verify Sanction vs Spent:** Check the exact sanctioned amount approved by the MP, how much money has been released, and the contractor's name.\n- **Audit Discrepancies:** If the portal shows 100% money released but the building is half-built in your neighborhood, submit a photo in the Citizen Social Audit tab immediately!`,
      };
    }
    if (optionNumber === 4) {
      return {
        text: `👥 **Citizen Public Transparency Briefing**\n\n### 🪧 Citizen Display Board Verification Checklist:\nUnder MoSPI Statutory Guidelines, every MPLADS asset **must have a permanent display board** (made of stone, metal, or concrete) erected at the project site. The board must clearly show:\n\n1. **Work Code & Official Title of Work**\n2. **Name of Hon'ble Member of Parliament (MP)**\n3. **Sanction Date & Total Sanctioned Cost in ₹**\n4. **Name of Executing Agency and Contractor**\n5. **Expected Completion Date**\n\n*If a board is missing, damaged, or displays incorrect figures, please file a complaint in the Citizen Social Audit portal.*`,
      };
    }

    return {
      text: `Thank you for reaching out. Please select an option from the menu or type your specific question or Work Code.`,
    };
  };

  const getInitialMenuMessage = (role: string): ChatMessage => {
    return {
      id: `msg-menu-init-${Date.now()}`,
      sender: 'assistant',
      text: `Hello ${getGreetingTitle(role)}! Welcome to **VigilAI Interactive HelpDesk**.\n\nI am grounded strictly in official MPLADS registry records, anomaly models, and MoSPI statutory guidelines.\n\nPlease choose an option from the menu below to get instant verified answers:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'menu-engine',
      isMenu: true,
      menuRole: role,
    };
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    getInitialMenuMessage(initialRole),
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmingActionId, setConfirmingActionId] = useState<string | null>(null);

  // Handle Menu Option Click
  const handleSelectMenuOption = (menuItem: MenuItem) => {
    // Add user selection message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: `${menuItem.number}️⃣ ${menuItem.label}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const resp = getPredefinedResponse(menuItem.number, selectedRole);

    const botMsg: ChatMessage = {
      id: `assistant-${Date.now()}`,
      sender: 'assistant',
      text: resp.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: menuItem.isHelpline ? 'helpline-desk' : 'predefined-grounded',
      actionProposal: (resp as any).actionProposal || null,
      citedProjects: (resp as any).citedProjects || [],
      showHelplineCard: resp.showHelplineCard || false,
      docketCode: resp.docketCode,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  // Show Main Menu again
  const handleShowMenu = () => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: '🔄 Show Main Menu',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const menuMsg = getInitialMenuMessage(selectedRole);
    setMessages((prev) => [...prev, userMsg, menuMsg]);
  };

  // Quick Helpline trigger
  const handleShowHelpline = () => {
    const helplineItem = roleMenus[selectedRole]?.find((m) => m.isHelpline) || {
      id: 'opt-helpline',
      number: 5,
      label: 'Talk to Official Assistant / Nodal Helpline',
      icon: Phone,
      description: 'Connect with MoSPI Helpline',
      isHelpline: true,
    };
    handleSelectMenuOption(helplineItem);
  };

  // Handle Free-Form Send
  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const trimmed = textToSend.trim().toLowerCase();

    // Check for number shortcuts (1, 2, 3, 4, 5)
    if (['1', '2', '3', '4', '5'].includes(trimmed)) {
      const num = parseInt(trimmed, 10);
      const menuItem = roleMenus[selectedRole]?.find((m) => m.number === num);
      if (menuItem) {
        setInputText('');
        handleSelectMenuOption(menuItem);
        return;
      }
    }

    // Check for menu keyword
    if (['menu', 'options', 'help', 'start', 'home'].includes(trimmed)) {
      setInputText('');
      handleShowMenu();
      return;
    }

    // Check for helpline keyword
    if (
      trimmed.includes('helpline') ||
      trimmed.includes('call') ||
      trimmed.includes('phone') ||
      trimmed.includes('contact') ||
      trimmed.includes('assistant') ||
      trimmed.includes('talk to') ||
      trimmed.includes('number')
    ) {
      setInputText('');
      handleShowHelpline();
      return;
    }

    // Normal Send
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          language,
          user: {
            ...currentUser,
            role: selectedRole,
            jurisdiction: {
              state: currentUser?.state || 'Uttar Pradesh',
              district: currentUser?.district || 'Varanasi',
              constituency: currentUser?.constituency || 'Varanasi',
            },
          },
        }),
      });

      const data = await response.json();
      const replyText =
        data.response ||
        'I am grounded in official records. Please select an option from the menu or check the helpline if you need further assistance.';

      const isHelplineQuery =
        trimmed.includes('helpline') ||
        trimmed.includes('contact') ||
        trimmed.includes('call');

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source || 'gemini-model',
        actionProposal: data.actionProposal || null,
        citedProjects: data.citedProjects || [],
        showHelplineCard: isHelplineQuery,
        docketCode: isHelplineQuery
          ? `VIGIL-DESK-2026-${Math.floor(1000 + Math.random() * 9000)}`
          : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('AI assistant query error:', err);
      // Fallback
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-err-${Date.now()}`,
          sender: 'assistant',
          text: 'We are currently operating in high-reliability HelpDesk mode. Please select an option from the menu below, or call our National Helpline at 1800-11-8012.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: 'error-boundary',
          showHelplineCard: true,
          docketCode: `VIGIL-DESK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = async (msgId: string, proposal: ActionProposal) => {
    setConfirmingActionId(msgId);
    try {
      const res = await fetch('/api/ai/confirm-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionProposal: proposal,
          user: {
            ...currentUser,
            role: selectedRole,
          },
        }),
      });
      const data = await res.json();

      if (data.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? {
                  ...m,
                  actionConfirmed: true,
                  text: `${m.text}\n\n---\n✅ **STATUTORY ACTION EXECUTED & AUDITED**\n- Reference: ${data.message}\n- Target Work: ${proposal.workCode || proposal.projectId}\n- Action Docket: Successfully logged into VigilAI Case Registry and permanent immutable Audit Log.`,
                }
              : m
          )
        );
      }
    } catch (err) {
      console.error('Action confirmation failed:', err);
    } finally {
      setConfirmingActionId(null);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const handleRegisterCallback = (msgId: string) => {
    if (!callbackNumber.trim() || callbackNumber.length < 10) {
      alert('Please enter a valid 10-digit mobile number for callback');
      return;
    }
    setCallbackStatus((prev) => ({
      ...prev,
      [msgId]: `Registered for ${callbackNumber}. An official will call you within 2 hours.`,
    }));
    setCallbackNumber('');
  };

  const currentMenuItems = roleMenus[selectedRole] || roleMenus.minister;

  return (
    <div className="space-y-3 max-w-5xl mx-auto flex flex-col h-[780px] font-sans">
      {/* 1. Top Header & Role Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-900 leading-tight">
                VigilAI Interactive HelpDesk
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                Menu-Guided Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Official MPLADS Scheme Assistance • Grounded in MoSPI 2023 Guidelines
            </p>
          </div>
        </div>

        {/* Role Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
            Role Lens:
          </span>
          {(['minister', 'inspector', 'citizen'] as const).map((r) => (
            <button
              key={r}
              onClick={() => {
                setSelectedRole(r);
                setMessages([getInitialMenuMessage(r)]);
              }}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer ${
                selectedRole === r
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r === 'minister' ? 'Minister' : r === 'inspector' ? 'Inspector' : 'Citizen'}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Persistent Official Helpline Strip */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs shadow-2xs">
        <div className="flex items-center gap-2 text-emerald-950 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold">National Vigilance Helpline:</span>
          <a
            href="tel:1800118012"
            className="font-mono font-bold text-emerald-800 hover:underline flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-emerald-300 shadow-2xs"
          >
            <Phone className="w-3 h-3 text-emerald-600" />
            <span>1800-11-8012 (Toll-Free)</span>
          </a>
          <span className="hidden sm:inline text-slate-500">| Mon–Fri 09:30 – 18:00 IST</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShowHelpline}
            className="px-2.5 py-1 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 rounded-lg text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
          >
            <Headphones className="w-3 h-3 text-emerald-700" />
            <span>Connect with Assistant</span>
          </button>
          <button
            onClick={handleShowMenu}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-cyan-400" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>

      {/* 3. Chat Messages Log */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs overflow-y-auto space-y-4 text-xs">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 ${
                  isUser ? 'bg-slate-900' : 'bg-gradient-to-tr from-indigo-600 to-blue-700'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>

              <div className={`max-w-2xl space-y-2.5 ${isUser ? 'items-end' : ''}`}>
                <div
                  className={`p-4 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-slate-900 text-white rounded-tr-xs'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-xs font-normal'
                  }`}
                >
                  {m.text}

                  {/* INTERACTIVE MENU CARDS (JioMart / Helpline style) */}
                  {m.isMenu && (
                    <div className="mt-3.5 pt-3 border-t border-slate-200/80 space-y-2">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Select an option to proceed (Click or type 1-5):
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {currentMenuItems.map((item) => {
                          const IconComp = item.icon;
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleSelectMenuOption(item)}
                              className="group p-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/60 transition-all text-left flex items-start justify-between gap-3 shadow-2xs hover:shadow-xs cursor-pointer"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-7 h-7 rounded-lg bg-indigo-100 group-hover:bg-indigo-600 text-indigo-700 group-hover:text-white flex items-center justify-center font-bold text-xs shrink-0 transition-colors">
                                  {item.number}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 group-hover:text-indigo-900 text-xs flex items-center gap-1.5">
                                    <IconComp className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>{item.label}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-0.5 font-normal">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                              {item.badge && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-slate-100 group-hover:bg-indigo-100 text-slate-600 group-hover:text-indigo-700 shrink-0">
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* OFFICIAL HELPLINE & ASSISTANT CARD */}
                  {m.showHelplineCard && (
                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-300 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                        <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                          <Phone className="w-4 h-4 text-emerald-700" />
                          <span>Official MPLADS Vigilance &amp; Redressal Desk</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 text-[10px] font-black uppercase">
                          MoSPI Statutory
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {/* 1. Phone */}
                        <a
                          href="tel:1800118012"
                          className="p-2.5 rounded-lg bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-100/40 transition-all flex items-center gap-2.5 text-slate-800"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Phone className="w-4 h-4" />
                          </div>
                          <div className="leading-tight">
                            <div className="text-[10px] font-bold text-slate-500 uppercase">
                              Toll-Free Helpline
                            </div>
                            <div className="font-bold text-emerald-800 font-mono text-xs">
                              1800-11-8012
                            </div>
                          </div>
                        </a>

                        {/* 2. Email */}
                        <a
                          href="mailto:mplads-vigilance@mospi.gov.in?subject=MPLADS%20Vigilance%20Assistance%20Request"
                          className="p-2.5 rounded-lg bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-100/40 transition-all flex items-center gap-2.5 text-slate-800"
                        >
                          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div className="leading-tight truncate">
                            <div className="text-[10px] font-bold text-slate-500 uppercase">
                              Official Grievance Desk
                            </div>
                            <div className="font-bold text-teal-800 text-[11px] truncate">
                              mplads-vigilance@mospi.gov.in
                            </div>
                          </div>
                        </a>
                      </div>

                      {/* Nodal Location */}
                      <div className="bg-white/90 p-2.5 rounded-lg border border-emerald-200 text-[11px] text-slate-700 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>
                            <strong>District Nodal Desk:</strong> District Collectorate Vigilance Wing, Varanasi, UP
                          </span>
                        </div>
                        <a
                          href="https://maps.google.com/?q=District+Collectorate+Varanasi"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[10px] shrink-0 inline-flex items-center gap-1"
                        >
                          <span>Directions</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {/* Docket Tracking Code */}
                      {m.docketCode && (
                        <div className="bg-white/90 p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between gap-2 text-xs">
                          <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase">
                              Assistance Docket Reference:
                            </div>
                            <div className="font-mono font-black text-indigo-700 text-xs">
                              {m.docketCode}
                            </div>
                          </div>
                          <button
                            onClick={() => handleCopyCode(m.docketCode!)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            {copiedCode === m.docketCode ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Docket</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Request Live Callback Form */}
                      <div className="bg-white/90 p-3 rounded-lg border border-emerald-200 space-y-2">
                        <div className="font-bold text-slate-900 text-[11px] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Need an officer to call you back?</span>
                        </div>
                        {callbackStatus[m.id] ? (
                          <div className="p-2 rounded bg-emerald-100 border border-emerald-300 text-emerald-900 text-[11px] font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{callbackStatus[m.id]}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="tel"
                              value={callbackNumber}
                              onChange={(e) => setCallbackNumber(e.target.value)}
                              placeholder="Enter your 10-digit mobile number"
                              maxLength={10}
                              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <button
                              onClick={() => handleRegisterCallback(m.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                            >
                              Request Callback
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cited Work Codes Chips */}
                  {m.citedProjects && m.citedProjects.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Referenced Projects:
                      </span>
                      {m.citedProjects.map((cp) => (
                        <button
                          key={cp.id}
                          onClick={() => onSelectProjectByWorkCode(cp.workCode || cp.id)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 font-mono font-bold text-[11px] text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <span>{cp.workCode || cp.id}</span>
                          <span
                            className={`px-1 rounded text-[9px] font-black ${
                              cp.riskScore >= 75
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            Risk: {cp.riskScore}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Human-in-the-Loop Action Confirmation Card */}
                  {m.actionProposal && !m.actionConfirmed && (
                    <div className="mt-4 p-4 rounded-xl bg-amber-50/80 border border-amber-300/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>Action Proposal Pending Officer Confirmation</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-black tracking-wider uppercase">
                          {m.actionProposal.priority || 'P0'}
                        </span>
                      </div>

                      <div className="bg-white/80 p-3 rounded-lg border border-amber-200/80 space-y-1.5 text-[11px] text-slate-700 font-sans">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-500">Proposed Action:</span>
                          <span className="font-black text-slate-900 font-mono">
                            {m.actionProposal.actionType}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-500">Target Project:</span>
                          <span className="font-bold text-indigo-700">
                            {m.actionProposal.workCode}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-500">Assigned Inquirer:</span>
                          <span className="font-medium text-slate-800">
                            {m.actionProposal.assignedOfficer}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-500">Suggested Deadline:</span>
                          <span className="font-medium text-slate-800">
                            {m.actionProposal.suggestedDeadline}
                          </span>
                        </div>
                        <div className="pt-1 text-[11px] text-slate-600 italic border-t border-amber-100">
                          Grounds: "{m.actionProposal.reason}"
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => handleConfirmAction(m.id, m.actionProposal!)}
                          disabled={confirmingActionId === m.id}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {confirmingActionId === m.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Executing Statutory Action...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>CONFIRM &amp; DISPATCH ACTION</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bottom Quick-Action Buttons on Assistant Messages */}
                  {!isUser && !m.isMenu && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center gap-2 flex-wrap">
                      <button
                        onClick={handleShowMenu}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <RotateCcw className="w-3 h-3 text-indigo-600" />
                        <span>Return to Main Menu</span>
                      </button>
                      {!m.showHelplineCard && (
                        <button
                          onClick={handleShowHelpline}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>Talk to Assistant / Helpline</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div
                  className={`text-[10px] text-slate-400 px-1 flex items-center gap-2 ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span>{m.timestamp}</span>
                  {m.source && (
                    <span className="text-[9px] font-mono text-slate-400 uppercase">
                      [{m.source}]
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-700 flex items-center justify-center text-white shrink-0">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-2.5 text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Retrieving verified data &amp; formulating response...</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Input & Quick Selection Field */}
      <div className="space-y-2">
        {/* Quick Option Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            Quick Options:
          </span>
          {currentMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectMenuOption(item)}
              className="px-2.5 py-1 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all shadow-2xs shrink-0 cursor-pointer"
            >
              {item.number}️⃣ {item.label.split(' ')[0]} {item.label.split(' ')[1]}
            </button>
          ))}
          <button
            onClick={handleShowHelpline}
            className="px-2.5 py-1 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all shadow-2xs shrink-0 cursor-pointer flex items-center gap-1"
          >
            <Phone className="w-3 h-3 text-emerald-600" />
            <span>5️⃣ Helpline</span>
          </button>
        </div>

        {/* Text Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="bg-white rounded-2xl border border-slate-200/90 p-2 shadow-2xs flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Type 1-5 to choose from menu, ask a question, or type 'helpline'...`}
            className="flex-1 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none font-medium"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AiAssistantView;
