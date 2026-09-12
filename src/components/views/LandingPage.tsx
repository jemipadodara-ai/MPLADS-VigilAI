import React from 'react';
import {
  ShieldCheck,
  ArrowRight,
  FileText,
  Search,
  AlertTriangle,
  FileDown,
  CheckCircle2,
  Database,
  Sliders,
  Cpu,
  Eye,
  Layers,
  Activity,
  ArrowDown,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { LanguageSelector } from '../shared/LanguageSelector';

interface LandingPageProps {
  onEnterPortal: () => void;
  onExploreProjects?: () => void;
  onNavigateToLogin?: () => void;
  onNavigateToRegister?: () => void;
  onSelectProject?: (p: any) => void;
  featuredProject?: any;
  totalProjects?: number;
  totalSanctionedCr?: number;
  user?: any;
  onSignOut?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterPortal,
  onExploreProjects,
  onNavigateToLogin,
  onNavigateToRegister,
  user,
  onSignOut,
}) => {
  const { t } = useTranslation();
  const handleGoToProjects = onExploreProjects || onEnterPortal;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900">
                MPLADS <span className="text-indigo-600">VigilAI</span>
              </span>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block leading-none">
                {t('app.subtitle', 'Government Project Risk Monitoring')}
              </p>
            </div>
          </div>

          {/* Quick Actions & Language Selector */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Global Language Selector */}
            <LanguageSelector variant="header" />

            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-slate-800">{user.name}</span>
                  <span className="text-slate-400">({user.role})</span>
                </div>
                <button
                  onClick={onEnterPortal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
                >
                  <span>{t('landing.enterPortal', 'Risk Dashboard')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors text-xs font-semibold cursor-pointer"
                    title={t('header.signOut', 'Sign Out')}
                  >
                    {t('header.signOut', 'Sign Out')}
                  </button>
                )}
              </div>
            ) : (
              <>
                {onNavigateToRegister && (
                  <button
                    id="landing-create-account-btn"
                    onClick={onNavigateToRegister}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                  >
                    <span>{t('header.createAccount', 'Create Account')}</span>
                  </button>
                )}

                {onNavigateToLogin && (
                  <button
                    id="landing-signin-btn"
                    onClick={onNavigateToLogin}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                  >
                    <span>{t('header.officerSignIn', 'Sign In')}</span>
                  </button>
                )}

                <button
                  onClick={handleGoToProjects}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
                >
                  <span>{t('landing.exploreWorks', 'Explore Projects')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-20 sm:pb-24 border-b border-slate-200 bg-gradient-to-b from-white via-white to-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {user ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Session Active: Welcome back, {user.name} ({user.department || 'MoSPI Directorate'})</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold tracking-wide uppercase shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('app.subtitle', 'Government Project Risk Monitoring')}</span>
            </div>
          )}

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
            {t('landing.title', 'MPLADS-VigilAI')}
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            {t('landing.subtitle', 'Find government projects that may need attention and understand the reasons behind each risk.')}
          </p>

          {/* Primary Actions */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {user ? (
              <>
                <button
                  id="hero-enter-dashboard-btn"
                  onClick={onEnterPortal}
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-base font-bold shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all cursor-pointer group"
                >
                  <span>{t('landing.enterPortal', 'Launch Risk Dashboard')}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  id="hero-explore-projects-btn"
                  onClick={handleGoToProjects}
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-base font-bold transition-all shadow-xs cursor-pointer"
                >
                  <span>{t('landing.exploreWorks', 'Browse All Projects')}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  id="hero-explore-projects-btn"
                  onClick={handleGoToProjects}
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-base font-bold shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all cursor-pointer group"
                >
                  <span>{t('landing.exploreWorks', 'Explore Projects')}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                {onNavigateToRegister && (
                  <button
                    id="hero-create-account-btn"
                    onClick={onNavigateToRegister}
                    className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <span>{t('header.createAccount', 'Create Account')}</span>
                  </button>
                )}

                {onNavigateToLogin && (
                  <button
                    id="hero-signin-btn"
                    onClick={onNavigateToLogin}
                    className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-base font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <span>{t('header.officerSignIn', 'Officer Sign In')}</span>
                  </button>
                )}
              </>
            )}
          </div>

          <div className="pt-4 text-xs text-slate-400 font-medium">
            Demonstration project data for public infrastructure monitoring
          </div>
        </div>
      </section>

      {/* 3. What MPLADS-VigilAI does */}
      <section className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {t('What MPLADS-VigilAI Does', 'What MPLADS-VigilAI Does')}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              {t('MPLADS-VigilAI analyzes government project data to identify unusual spending, delays, low progress and other risk indicators.', 'MPLADS-VigilAI analyzes government project data to identify unusual spending, delays, low progress and other risk indicators.')}
            </p>
          </div>

          {/* 4 Simple Items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Risk Detection */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">{t('Risk Detection', 'Risk Detection')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {t('Find projects with unusual or concerning patterns.', 'Find projects with unusual or concerning patterns.')}
              </p>
            </div>

            {/* 2. Risk Explanation */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">{t('Risk Explanation', 'Risk Explanation')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {t('See exactly why a project has been flagged.', 'See exactly why a project has been flagged.')}
              </p>
            </div>

            {/* 3. Project Monitoring */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">{t('Project Monitoring', 'Project Monitoring')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {t('Compare spending, progress and project status.', 'Compare spending, progress and project status.')}
              </p>
            </div>

            {/* 4. Data Export */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <FileDown className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">{t('Data Export', 'Data Export')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {t('Download detailed project information for further review.', 'Download detailed project information for further review.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How the platform works / Platform Architecture */}
      <section id="architecture" className="py-16 sm:py-20 bg-slate-50/80 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              {t('Platform Architecture', 'Platform Architecture')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-1">
              {t('How the platform works', 'How the platform works')}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-normal">
              {t('From project data to clear risk information.', 'From project data to clear risk information.')}
            </p>
          </div>

          {/* 5 Simple Stages in a Visual Architecture Flow */}
          <div className="space-y-4 max-w-3xl mx-auto">
            {/* Stage 1 */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs flex items-start gap-4 hover:border-indigo-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 font-black text-sm">
                1
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">{t('Stage 1', 'Stage 1')}</div>
                <h3 className="text-base font-bold text-slate-900">{t('PROJECT DATA', 'PROJECT DATA')}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t('Project information, financial data, progress data, contractor details.', 'Project information, financial data, progress data, contractor details.')}
                </p>
              </div>
            </div>

            <div className="flex justify-center text-slate-300">
              <ArrowDown className="w-5 h-5 text-indigo-400" />
            </div>

            {/* Stage 2 */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs flex items-start gap-4 hover:border-indigo-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 font-black text-sm">
                2
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">{t('Stage 2', 'Stage 2')}</div>
                <h3 className="text-base font-bold text-slate-900">{t('DATA CHECK', 'DATA CHECK')}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t('Clean and organize project information.', 'Clean and organize project information.')}
                </p>
              </div>
            </div>

            <div className="flex justify-center text-slate-300">
              <ArrowDown className="w-5 h-5 text-indigo-400" />
            </div>

            {/* Stage 3 */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs flex items-start gap-4 hover:border-indigo-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 font-black text-sm">
                3
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">{t('Stage 3', 'Stage 3')}</div>
                <h3 className="text-base font-bold text-slate-900">{t('RISK ENGINE', 'RISK ENGINE')}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t('Check for cost overrun, project delay, low progress, unusual spending, and other available risk indicators.', 'Check for cost overrun, project delay, low progress, unusual spending, and other available risk indicators.')}
                </p>
              </div>
            </div>

            <div className="flex justify-center text-slate-300">
              <ArrowDown className="w-5 h-5 text-indigo-400" />
            </div>

            {/* Stage 4 */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs flex items-start gap-4 hover:border-indigo-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 font-black text-sm">
                4
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">{t('Stage 4', 'Stage 4')}</div>
                <h3 className="text-base font-bold text-slate-900">{t('EXPLAINABLE RISK', 'EXPLAINABLE RISK')}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t('Generate Risk Level, Risk Score, Risk Reasons, and Supporting Evidence.', 'Generate Risk Level, Risk Score, Risk Reasons, and Supporting Evidence.')}
                </p>
              </div>
            </div>

            <div className="flex justify-center text-slate-300">
              <ArrowDown className="w-5 h-5 text-indigo-400" />
            </div>

            {/* Stage 5 */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs flex items-start gap-4 hover:border-indigo-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 font-black text-sm">
                5
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">{t('Stage 5', 'Stage 5')}</div>
                <h3 className="text-base font-bold text-slate-900">{t('PROJECT REVIEW', 'PROJECT REVIEW')}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t('View complete project details, filter projects, compare risks, and export project data.', 'View complete project details, filter projects, compare risks, and export project data.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Why It Matters Section */}
      <section className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('Why It Matters', 'Why It Matters')}
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            {t('Instead of checking every project manually, the platform highlights projects with unusual patterns so they can be reviewed first.', 'Instead of checking every project manually, the platform highlights projects with unusual patterns so they can be reviewed first.')}
          </p>

          <div className="pt-4 flex justify-center">
            <button
              onClick={handleGoToProjects}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm sm:text-base font-bold shadow-xs transition-all cursor-pointer"
            >
              <span>{t('View Project Risks', 'View Project Risks')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="py-8 bg-white text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">MPLADS-VigilAI</span>
            <span>•</span>
            <span>{t('Government Project Risk Monitoring', 'Government Project Risk Monitoring')}</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            {t('Demonstration project data for monitoring public works.', 'Demonstration project data for monitoring public works.')}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
