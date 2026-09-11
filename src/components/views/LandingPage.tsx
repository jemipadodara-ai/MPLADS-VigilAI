import React from 'react';
import {
  ShieldCheck,
  ArrowRight,
  MapPin,
  FileCheck2,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Users,
  Search,
  Building2,
  Shield,
  Layers,
} from 'lucide-react';
import { MPLADProject } from '../../types';

interface LandingPageProps {
  onEnterPortal: () => void;
  onExploreProjects?: () => void;
  onSelectProject?: (p: MPLADProject) => void;
  featuredProject?: MPLADProject | null;
  totalProjects?: number;
  totalSanctionedCr?: number;
  user?: {
    email?: string | null;
    displayName?: string | null;
    role?: string;
  } | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterPortal,
  onSelectProject,
  featuredProject,
  totalProjects = 22,
  totalSanctionedCr = 186.4,
  user,
}) => {
  // Use provided featured project or a representative default
  const fp = featuredProject || {
    id: 'proj-var-001',
    workCode: 'MPLADS/2023-24/UP/VAR-089',
    title: 'Multi-Purpose Community Center & Assembly Hall at Rampur',
    constituency: 'Varanasi',
    district: 'Varanasi Rural',
    sanctionedAmountLakhs: 28.5,
    expenditureAmountLakhs: 28.5,
    completionPercentage: 42,
    status: 'Under Investigation',
    overallRiskScore: 87,
    coordinates: { lat: 25.2812, lng: 82.9739 },
    contractorName: 'Mahadev Infra Projects Pvt Ltd',
    notes: 'Financial Discrepancy: Disbursement at 100% while Physical Progress is 42%. Overlapping contractor tenders detected.',
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-sm ring-1 ring-indigo-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900">
                MPLADS <span className="text-indigo-600">VigilAI</span>
              </span>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block leading-none">
                Civic Infrastructure &amp; Public Fund Monitoring
              </p>
            </div>
          </div>

          {/* Simple Anchor Links */}
          <nav className="flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#platform" className="hover:text-indigo-600 transition-colors">
              Platform
            </a>
            <a href="#about" className="hover:text-indigo-600 transition-colors">
              About
            </a>
          </nav>

          {/* User Status / Explore Header Button */}
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                {user.displayName || user.email?.split('@')[0]}
              </span>
            )}
            <button
              id="landing-header-explore-btn"
              onClick={onEnterPortal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-12 pb-16 sm:pt-16 sm:pb-24 overflow-hidden border-b border-slate-200/60 bg-gradient-to-b from-white via-white to-slate-50/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/70 text-indigo-700 text-xs font-semibold tracking-wide uppercase shadow-2xs mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span>Civic Infrastructure &amp; Public Fund Monitoring</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12] max-w-4xl mx-auto">
            Make every development project accountable.
          </h1>

          {/* Subhead */}
          <p className="mt-5 text-base sm:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
            A unified workspace bringing project telemetry, expenditure data, and anomaly detection into one transparent dashboard.
          </p>

          {/* Primary CTA: Single, prominent "Explore Dashboard" button */}
          <div className="mt-8 flex justify-center">
            <button
              id="hero-explore-dashboard-btn"
              onClick={onEnterPortal}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-base font-bold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all cursor-pointer group"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Trust Telemetry Line */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Real-Time Audit Telemetry</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
              <span>MoSPI MPLADS 2023 Guidelines Compliant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>PFMS Treasury &amp; GIS Harmonized</span>
            </div>
          </div>

          {/* Featured Project Callout Card */}
          <div className="mt-12 max-w-3xl mx-auto text-left">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5 sm:p-6 transition-all hover:border-indigo-300">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-mono font-bold text-[11px]">
                    {fp.workCode || 'PRJ-AND-2025-0412'}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500 font-medium">
                    {fp.district || fp.constituency || 'District Oversight'} • Active Sanction
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[11px] border border-rose-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span>Priority Review</span>
                </div>
              </div>

              <div className="py-4 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-8 space-y-3">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {fp.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600">
                    <span>
                      Ward/District: <strong className="text-slate-800">{fp.constituency || fp.district}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Sanctioned: <strong className="text-slate-800 font-mono">₹{(fp.sanctionedAmountLakhs || 28.5).toFixed(1)} Lakh</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Contractor: <strong className="text-slate-800">{fp.contractorName || 'Assigned Vendor'}</strong>
                    </span>
                  </div>

                  {/* Progress vs Treasury Breakdown */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                      <span>Physical Progress vs Financial Disbursement</span>
                      <span className="text-rose-600 font-mono">
                        {fp.completionPercentage || 42}% physical vs 100% disbursed
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full transition-all"
                        style={{ width: `${fp.completionPercentage || 42}%` }}
                        title="Physical Progress"
                      />
                      <div
                        className="bg-rose-400 h-full opacity-60"
                        style={{ width: `${Math.max(0, 100 - (fp.completionPercentage || 42))}%` }}
                        title="Disbursement Divergence"
                      />
                    </div>
                  </div>
                </div>

                {/* Explainable Risk Score Box */}
                <div className="md:col-span-4 bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-center">
                  <div className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                    Risk Score
                  </div>
                  <div className="text-3xl font-black text-rose-600 my-1 tracking-tight font-mono">
                    {fp.overallRiskScore || 87}
                    <span className="text-sm font-bold text-slate-400">/100</span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-600 line-clamp-2">
                    Financial Discrepancy: Disbursement at 100% while Physical Progress is 42%.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-[11px]">
                    Coordinates: 25.2812° N, 82.9739° E
                  </span>
                  <span className="text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                    Verified
                  </span>
                </div>

                <button
                  onClick={() => onSelectProject ? onSelectProject(fp as any) : onEnterPortal()}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                >
                  <span>Inspect Forensic Record &rarr;</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Two-Column Value Cards */}
      <section className="py-16 sm:py-20 bg-slate-50/60 border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Two Perspectives, One Single Source of Truth
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              Equipping both the public and oversight authorities with unambiguous infrastructure telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card 1: Public Transparency */}
            <div className="bg-white rounded-2xl p-7 sm:p-8 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-indigo-300 hover:shadow-xs transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Public Transparency
                  </h3>
                  <p className="text-sm text-slate-600 mt-1 font-medium">
                    Track sanctioned works, verified progress, and ward-level investments.
                  </p>
                </div>

                <div className="pt-2 space-y-3 text-xs sm:text-sm text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Search sanctioned development works by ward, sector, or MP allocation.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>View verified physical milestone completions backed by ground evidence.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Inspect ward-level investment distributions and completion timelines.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Access open government telemetry with zero sign-in barriers for citizens.</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <button
                  onClick={onEnterPortal}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer"
                >
                  <span>Explore Public Transparency &rarr;</span>
                </button>
              </div>
            </div>

            {/* Card 2: Auditor Intelligence */}
            <div className="bg-white rounded-2xl p-7 sm:p-8 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-indigo-300 hover:shadow-xs transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Auditor Intelligence
                  </h3>
                  <p className="text-sm text-slate-600 mt-1 font-medium">
                    Automated risk scoring, expenditure vs physical lag alerts, and contractor concentration flags.
                  </p>
                </div>

                <div className="pt-2 space-y-3 text-xs sm:text-sm text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>Automated multi-factor risk scoring (0-100) combining fiscal and ground signals.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>Instant expenditure vs physical lag alerts when funds are disbursed ahead of works.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>Contractor concentration and single-bid tender monopoly detection.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>One-click statutory audit dossier generation for CVC and MoSPI inquiries.</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <button
                  onClick={onEnterPortal}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
                >
                  <span>Access Auditor Workspace &rarr;</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Platform Architecture Section */}
      <section id="platform" className="py-16 bg-white border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Platform Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-3">
              From scattered records to clear action.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              Harmonizing parliamentary allocations, PFMS treasury transactions, and on-ground milestone certifications into a unified audit trail.
            </p>
          </div>

          {/* 4-Step Linear Pipeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 hover:border-indigo-200 transition-colors">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                01. Sanctions Layer
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Sanction &amp; Allocation</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Work orders, nodal agency notifications, and recommended parliamentary budget line items.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 hover:border-indigo-200 transition-colors">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                02. Fiscal Telemetry
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Financial Drawdowns</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                PFMS treasury transfers, contractor advance vouchers, and utilization certificates.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 hover:border-indigo-200 transition-colors">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                03. Ground Verification
              </div>
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
                <MapPin className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Physical Evidence</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Geo-tagged photography, Measurement Book (MB) entries, and citizen signboard presence.
              </p>
            </div>

            <div className="bg-indigo-50/70 rounded-2xl p-5 border border-indigo-200 hover:border-indigo-300 transition-colors">
              <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-2">
                04. Decision Engine
              </div>
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-3">
                <Activity className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-indigo-950 mb-1">Explainable AI Audit</h4>
              <p className="text-xs text-indigo-800 leading-relaxed">
                Variance flags, prioritized inspection queues, and statutory compliance memos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. About & Standards Section */}
      <section id="about" className="py-16 bg-slate-50 border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-2xs">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-8 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Standards &amp; Governance
                </span>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  About MPLADS VigilAI
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  MPLADS VigilAI is an open civic oversight platform aligned with the Member of Parliament Local Area Development Scheme Guidelines (revised 2023) issued by the Ministry of Statistics and Programme Implementation (MoSPI).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    <span>MoSPI e-SAKSHI Data Standard Compliant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    <span>General Financial Rules (GFR 2017) Rule 144</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    <span>Clause 6.4 Mandatory Citizen Info Stones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    <span>Central Vigilance Commission (CVC) Standards</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-4 bg-slate-50 rounded-2xl p-6 border border-slate-200/80 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-900">National MPLADS Coverage</div>
                <p className="text-xs text-slate-500">
                  Monitoring development works across Parliamentary Constituencies with live Cloud Firestore state.
                </p>
                <button
                  onClick={onEnterPortal}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Explore Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-slate-200/80 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">MPLADS VigilAI</span>
            <span>•</span>
            <span>Civic Intelligence &amp; Public Fund Transparency</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Data synced from MoSPI e-SAKSHI &amp; District Measurement Books.
          </div>
        </div>
      </footer>
    </div>
  );
};
