import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Info,
  RefreshCw,
  Building,
  HelpCircle,
  FileCheck,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { SandboxProposal } from '../types';

interface SandboxResult {
  riskScore: number;
  recommendation: 'APPROVED' | 'CONDITIONAL_APPROVAL' | 'REJECT_STATUTORY_BREACH';
  summary: string;
  violations: string[];
  guidance: string[];
}

export const SandboxProposalAudit: React.FC = () => {
  const [proposal, setProposal] = useState<SandboxProposal>({
    title: 'Installation of High-Mast Solar Street Lights (Ward 3-5)',
    description: 'Procurement and civil installation of 30 standalone LED solar lighting units with 5-year AMC in rural ward areas.',
    category: 'Solar & Clean Energy',
    constituency: 'Varanasi',
    state: 'Uttar Pradesh',
    proposedCostLakhs: 9.9,
    implementingAgency: 'Rural Engineering Services (RES)',
    proposedContractor: 'Mahadev Infra Projects Pvt Ltd',
    isPrivateOrTrustProperty: false,
    isReligiousOrMemorial: false,
    targetAreaType: 'General',
    proposedTenderMethod: 'Quotation (Sub-threshold)',
    locationCoordinates: '25.2910, 82.9810',
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<SandboxResult | null>(null);

  const loadScenario = (scenario: 'slicing' | 'prohibited' | 'clean') => {
    if (scenario === 'slicing') {
      setProposal({
        title: 'Installation of Solar Street Lighting Units (Pkg-C)',
        description: 'Supply of 35 LED 40W solar street light luminaires across Panchayat ward.',
        category: 'Solar & Clean Energy',
        constituency: 'Wayanad',
        state: 'Kerala',
        proposedCostLakhs: 9.85,
        implementingAgency: 'Small Industries Corp',
        proposedContractor: 'GreenPower Systems India',
        isPrivateOrTrustProperty: false,
        isReligiousOrMemorial: false,
        targetAreaType: 'ST Area (7.5%)',
        proposedTenderMethod: 'Quotation (Sub-threshold)',
        locationCoordinates: '11.5540, 76.1290',
      });
      setResult(null);
    } else if (scenario === 'prohibited') {
      setProposal({
        title: 'Construction of Pilgrim Rest Pavilion & Gateway',
        description: 'Paved pavilion, decorative stone arch, and boundary wall within the premises of Shri Radha Krishna Temple Trust.',
        category: 'Community Infrastructure',
        constituency: 'Baramati',
        state: 'Maharashtra',
        proposedCostLakhs: 38.0,
        implementingAgency: 'Public Works Department (PWD)',
        proposedContractor: 'Local Civil Agency',
        isPrivateOrTrustProperty: true,
        isReligiousOrMemorial: true,
        targetAreaType: 'General',
        proposedTenderMethod: 'Open Tender',
        locationCoordinates: '18.1520, 74.5780',
      });
      setResult(null);
    } else {
      setProposal({
        title: 'Construction of Additional Science Laboratory in Govt Senior Secondary School',
        description: 'Complete civil construction of 2-room physics and chemistry laboratory including furniture and water supply lines in government school campus.',
        category: 'Education & Anganwadi',
        constituency: 'Gwalior',
        state: 'Madhya Pradesh',
        proposedCostLakhs: 24.5,
        implementingAgency: 'District Education Office / PWD',
        proposedContractor: 'To be determined via open e-tender',
        isPrivateOrTrustProperty: false,
        isReligiousOrMemorial: false,
        targetAreaType: 'SC Area (15%)',
        proposedTenderMethod: 'Open Tender',
        locationCoordinates: '26.2201, 78.1850',
      });
      setResult(null);
    }
  };

  const handleEvaluate = () => {
    setAnalyzing(true);
    setTimeout(() => {
      const violations: string[] = [];
      const guidance: string[] = [];
      let score = 10;

      // Rule 1: Prohibited Works Check (Annexure-II)
      if (proposal.isPrivateOrTrustProperty || proposal.isReligiousOrMemorial) {
        score += 65;
        violations.push(
          'Direct Violation of Annexure-II (Items 1 & 7): MPLADS strictly prohibits assets on private trust property, religious structures, places of worship, or memorial gates.'
        );
        guidance.push(
          'District Collector cannot sanction this work unless land title is formally gifted and transferred to the State Government/Local Body.'
        );
      }

      // Rule 2: Tender Slicing Check
      if (
        proposal.proposedCostLakhs >= 9.5 &&
        proposal.proposedCostLakhs < 10.0 &&
        proposal.proposedTenderMethod.includes('Quotation')
      ) {
        score += 45;
        violations.push(
          'Suspicion of Tender Slicing (Smurfing): Project priced at ₹' +
            proposal.proposedCostLakhs +
            ' Lakhs using sub-threshold quotation to evade mandatory Open E-Tendering (threshold ₹10.0 Lakhs).'
        );
        guidance.push(
          'Consolidate related works across the block into a single consolidated tender with open competitive e-bidding.'
        );
      }

      // Rule 3: Single-bid / Dominant contractor check
      if (proposal.proposedContractor.toLowerCase().includes('mahadev')) {
        score += 25;
        violations.push(
          'Vendor Cartel Alert: Proposed contractor holds 78.5% single-bid win ratio in the nodal district.'
        );
        guidance.push(
          'Ensure strict open e-procurement on state portal with minimum 21 days tender notice to guarantee competitive bidding.'
        );
      }

      let recommendation: 'APPROVED' | 'CONDITIONAL_APPROVAL' | 'REJECT_STATUTORY_BREACH' = 'APPROVED';
      if (score >= 70) {
        recommendation = 'REJECT_STATUTORY_BREACH';
      } else if (score >= 35) {
        recommendation = 'CONDITIONAL_APPROVAL';
      }

      const summary =
        recommendation === 'REJECT_STATUTORY_BREACH'
          ? 'STATUTORY REJECTION RECOMMENDED: This proposal violates fundamental provisions of the MPLADS Guidelines 2023. Issuing administrative sanction exposes the Nodal District Authority to vigilance inquiry and recovery.'
          : recommendation === 'CONDITIONAL_APPROVAL'
          ? 'CONDITIONAL APPROVAL: Proposal is eligible in principle but requires procedural corrections (e.g. converting tender method to open e-tender) before sanction.'
          : 'APPROVED & COMPLIANT: Proposal satisfies all eligibility criteria under MPLADS Guidelines 2023 Chapters II & V.';

      setResult({
        riskScore: Math.min(100, score),
        recommendation,
        summary,
        violations,
        guidance,
      });
      setAnalyzing(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span>Pre-Sanction Compliance & Fraud Prevention Sandbox</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate new MP work proposals against MoSPI 2023 Guidelines before issuing administrative sanction to catch prohibited works, contract slicing, and cartel collusions
            </p>
          </div>

          {/* Quick Scenario Buttons */}
          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Load Test:</span>
            <button
              onClick={() => loadScenario('slicing')}
              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold border border-amber-200 text-[11px]"
            >
              Tender Slicing
            </button>
            <button
              onClick={() => loadScenario('prohibited')}
              className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-800 font-semibold border border-red-200 text-[11px]"
            >
              Prohibited Trust Asset
            </button>
            <button
              onClick={() => loadScenario('clean')}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200 text-[11px]"
            >
              Fully Compliant
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Inputs & Evaluation Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight border-b border-slate-100 pb-3">
            Proposal Work Specifications
          </h3>

          <div className="space-y-3.5 text-xs">
            {/* Title */}
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Proposed Work Title</label>
              <input
                type="text"
                value={proposal.title}
                onChange={(e) => setProposal({ ...proposal, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Detailed Scope & Site Particulars</label>
              <textarea
                rows={3}
                value={proposal.description}
                onChange={(e) => setProposal({ ...proposal, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Row 2: Category & Cost */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Category</label>
                <select
                  value={proposal.category}
                  onChange={(e) => setProposal({ ...proposal, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Community Infrastructure">Community Infrastructure</option>
                  <option value="Solar & Clean Energy">Solar & Clean Energy</option>
                  <option value="Drinking Water">Drinking Water</option>
                  <option value="Education & Anganwadi">Education & Anganwadi</option>
                  <option value="Primary Health">Primary Health</option>
                  <option value="Roads, Bridges & Pathways">Roads, Bridges & Pathways</option>
                  <option value="Sanitation">Sanitation</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Estimated Cost (₹ in Lakhs)</label>
                <input
                  type="number"
                  step="0.05"
                  value={proposal.proposedCostLakhs}
                  onChange={(e) => setProposal({ ...proposal, proposedCostLakhs: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>
            </div>

            {/* Row 3: Tender Method & Area Quota */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Procurement / Tender Method</label>
                <select
                  value={proposal.proposedTenderMethod}
                  onChange={(e) => setProposal({ ...proposal, proposedTenderMethod: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Open Tender">Open E-Tender (Mandatory &ge;₹10L)</option>
                  <option value="Quotation (Sub-threshold)">Quotation (Sub-threshold &lt;₹10L)</option>
                  <option value="Limited Tender">Limited Tender</option>
                  <option value="Nomination / Single Bid">Nomination / Single Bid</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Beneficiary Earmark</label>
                <select
                  value={proposal.targetAreaType}
                  onChange={(e) => setProposal({ ...proposal, targetAreaType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="General">General Area</option>
                  <option value="SC Area (15%)">SC Populated Area (15% Quota)</option>
                  <option value="ST Area (7.5%)">ST Populated Area (7.5% Quota)</option>
                </select>
              </div>
            </div>

            {/* Prohibited Checks */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-800 block">
                Statutory Integrity Declarations (Annexure-II):
              </span>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={proposal.isPrivateOrTrustProperty}
                  onChange={(e) => setProposal({ ...proposal, isPrivateOrTrustProperty: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700 text-xs">
                  Work is situated on Private Land or Unregistered Trust Property
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={proposal.isReligiousOrMemorial}
                  onChange={(e) => setProposal({ ...proposal, isReligiousOrMemorial: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700 text-xs">
                  Work is a Place of Worship, Memorial, Statue, or Religious Asset
                </span>
              </label>
            </div>

            <button
              onClick={handleEvaluate}
              disabled={analyzing}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 text-xs active:scale-95"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Cross-verifying with MoSPI Rules...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Run Pre-Sanction AI Compliance Audit</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Sandbox Result */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight border-b border-slate-100 pb-3 flex items-center justify-between">
            <span>AI Compliance Verdict & Risk Matrix</span>
            {result && (
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  result.recommendation === 'REJECT_STATUTORY_BREACH'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : result.recommendation === 'CONDITIONAL_APPROVAL'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                Risk Score: {result.riskScore}/100
              </span>
            )}
          </h3>

          {!result ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <ShieldAlert className="h-10 w-10 mx-auto text-slate-300" />
              <div className="text-xs font-semibold text-slate-600">Sandbox Ready</div>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Fill out the proposed project parameters on the left or select a sample scenario, then click &ldquo;Run Pre-Sanction AI Compliance Audit&rdquo;.
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 text-xs"
            >
              {/* Verdict Card */}
              <div
                className={`p-4 rounded-xl border leading-relaxed ${
                  result.recommendation === 'REJECT_STATUTORY_BREACH'
                    ? 'bg-red-50 text-red-900 border-red-200'
                    : result.recommendation === 'CONDITIONAL_APPROVAL'
                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                }`}
              >
                <div className="font-bold text-sm mb-1 flex items-center gap-2">
                  {result.recommendation === 'REJECT_STATUTORY_BREACH' ? (
                    <XCircle className="h-5 w-5 text-red-600" />
                  ) : result.recommendation === 'CONDITIONAL_APPROVAL' ? (
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  )}
                  {result.recommendation === 'REJECT_STATUTORY_BREACH'
                    ? 'REJECT STATUTORY BREACH'
                    : result.recommendation === 'CONDITIONAL_APPROVAL'
                    ? 'CONDITIONAL APPROVAL'
                    : 'APPROVED & COMPLIANT'}
                </div>
                <p className="text-xs text-slate-700">{result.summary}</p>
              </div>

              {/* Violations List */}
              {result.violations.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-red-700 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-600" /> Detected Non-Compliance Flags:
                  </span>
                  {result.violations.map((v, i) => (
                    <div
                      key={i}
                      className="p-3 bg-red-50/50 rounded-xl border border-red-200 text-red-900 text-xs"
                    >
                      {v}
                    </div>
                  ))}
                </div>
              )}

              {/* Statutory Guidance */}
              {result.guidance.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-amber-800 text-xs flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-amber-600" /> Required Administrative Action:
                  </span>
                  {result.guidance.map((g, i) => (
                    <div
                      key={i}
                      className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 text-amber-900 text-xs"
                    >
                      {g}
                    </div>
                  ))}
                </div>
              )}

              {/* Clean proposal note */}
              {result.violations.length === 0 && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-1">
                  <div className="font-bold text-xs">All MoSPI Checklist Criteria Passed:</div>
                  <ul className="list-disc list-inside text-[11px] text-emerald-800 space-y-0.5">
                    <li>Asset creates durable public infrastructure on government school campus.</li>
                    <li>Qualifies for statutory SC area entitlement quota (15% mandate).</li>
                    <li>Full open e-tendering ensures competitive market rates.</li>
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
