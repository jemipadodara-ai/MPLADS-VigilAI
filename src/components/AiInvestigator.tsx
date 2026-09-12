import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Sparkles,
  Send,
  ShieldAlert,
  Bot,
  User,
  RefreshCw,
  HelpCircle,
  FileCheck,
  Building,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { MPLADProject, ConstituencySummary } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface AiInvestigatorProps {
  projects: MPLADProject[];
  constituencies: ConstituencySummary[];
}

export const AiInvestigator: React.FC<AiInvestigatorProps> = ({ projects, constituencies }) => {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-01',
      sender: 'assistant',
      text: `Hello, I am VigilAI, your AI Forensic Auditor for the Member of Parliament Local Area Development Scheme (MPLADS).\n\nI continuously monitor project recommendations, tender logs, contractor allocations, spatial coordinates, and fund disbursements across Lok Sabha and Rajya Sabha constituencies to detect:\n- Ghost projects & duplicate sanctions\n- Contractor cartels & single-bid collusion\n- Tender slicing (smurfing) below ₹10 Lakhs\n- Annexure-II prohibited asset violations\n- Statutory SC/ST earmark non-compliance\n\nHow may I assist your audit investigation today? You can select a sample inquiry below or type a specific forensic query.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const samplePrompts = [
    'Cross-examine single-bid allocations and vendor cartels in Varanasi',
    'Identify works suspected of tender slicing under the ₹10 Lakh e-tender threshold',
    'Audit projects with unspent balances older than 18 months and missing UCs',
    'Evaluate compliance with statutory SC/ST mandatory quotas (15% SC, 7.5% ST)',
    'Investigate the twin duplicate sanctions at Rampur Gram Panchayat',
  ];

  const handleSendQuery = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          language,
          datasetSummary: {
            totalProjects: projects.length,
            criticalCount: projects.filter((p) => p.riskLevel === 'Critical').length,
            highCount: projects.filter((p) => p.riskLevel === 'High').length,
            totalFlaggedExpenditure: projects
              .filter((p) => p.riskLevel === 'Critical' || p.riskLevel === 'High')
              .reduce((a, b) => a + b.sanctionedAmountLakhs, 0),
            constituencies: constituencies.map((c) => ({
              name: c.constituency,
              utilization: c.utilizationRate,
              criticalAlerts: c.criticalAnomalies,
              scRatio: c.scAllocationPercent,
              stRatio: c.stAllocationPercent,
            })),
          },
          contextProjects: projects.map((p) => ({
            workCode: p.workCode,
            title: p.title,
            constituency: p.constituency,
            mpName: p.mpName,
            costLakhs: p.sanctionedAmountLakhs,
            contractor: p.contractorName,
            tender: p.tenderType,
            riskScore: p.overallRiskScore,
            flags: (p.anomalyFlags || p.detectedAnomalies || []).map((f: any) => f.title),
          })),
        }),
      });

      const data = await response.json();
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: data.response || 'No analysis generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const errMessage: Message = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: 'Unable to connect to the forensic audit engine. Please verify system connection.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                AI Forensic Investigator (Powered by Gemini)
              </h2>
              <p className="text-xs text-slate-500">
                Natural-language cross-examination of procurement records, spatial coordinates, vendor histories, and MoSPI guidelines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
              Model: gemini-3.8-flash
            </span>
          </div>
        </div>

        {/* Suggested Quick Prompts */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1">Quick Prompts:</span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuery(p)}
              disabled={loading}
              className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 transition-colors text-[11px] text-left"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 shadow-xs min-h-[440px] max-h-[580px] overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isAssistant = m.sender === 'assistant';
          return (
            <div
              key={m.id}
              className={`flex gap-3 text-xs ${isAssistant ? 'justify-start' : 'justify-end'}`}
            >
              {isAssistant && (
                <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`p-4 rounded-2xl max-w-2xl leading-relaxed space-y-2 ${
                  isAssistant
                    ? 'bg-white text-slate-800 border border-slate-200 shadow-xs'
                    : 'bg-indigo-600 text-white font-medium self-end shadow-xs'
                }`}
              >
                <div className="whitespace-pre-line text-xs font-normal">
                  {m.text}
                </div>
                <div
                  className={`text-[9px] text-right mt-1 ${
                    isAssistant ? 'text-slate-400' : 'text-indigo-200'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>

              {!isAssistant && (
                <div className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 text-xs items-center text-slate-500">
            <div className="h-8 w-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 animate-pulse">
              <Sparkles className="h-4 w-4 animate-spin" />
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
              <span>Gemini is cross-examining project registry & guidelines...</span>
            </div>
          </div>
        )}
      </div>

      {/* Query Input Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex items-center gap-3">
        <input
          type="text"
          placeholder="Ask VigilAI any forensic question regarding contractors, duplicate sanctions, unspent funds..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendQuery();
          }}
          disabled={loading}
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <button
          onClick={() => handleSendQuery()}
          disabled={!inputQuery.trim() || loading}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
            !inputQuery.trim() || loading
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
          }`}
        >
          <Send className="h-3.5 w-3.5" />
          <span>Inquire</span>
        </button>
      </div>
    </div>
  );
};
