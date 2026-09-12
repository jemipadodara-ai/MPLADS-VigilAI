import React, { useState } from 'react';
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
  Calendar,
  UserCheck,
  Building,
  MapPin,
  Clock,
  Loader2,
  ExternalLink,
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

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  source?: string;
  actionProposal?: ActionProposal | null;
  citedProjects?: { id: string; workCode: string; title: string; riskScore: number }[];
  actionConfirmed?: boolean;
}

const ROLE_PROMPTS: Record<string, string[]> = {
  ministry: [
    'What are the 5 highest-risk projects nationally?',
    'Provide state-level fund utilization and delay overview for Uttar Pradesh',
    'Which contractors have excessive single-bid concentration?',
    'Generate national risk brief for PAC review',
  ],
  state: [
    'Show districts in Uttar Pradesh with critical P0 projects',
    'Which districts have overdue physical milestone verifications?',
    'Summarize contractor cartel risk across eastern constituencies',
  ],
  district: [
    'Show delayed projects in Varanasi requiring immediate site audit',
    'Assign physical inspection for VAR-089 to SE Vigilance',
    'What is the financial divergence in Work Code MPLADS/2023-24/UP/VAR-089?',
    'Review contractor Apex InfraWorks tenders in this district',
  ],
  mp: [
    'Summarize fund absorption and completed works in Varanasi constituency',
    'What citizen complaints or social audits are logged in my constituency?',
    'Which recommended projects have pending sanction delays?',
  ],
  citizen: [
    'Show completed public works and citizen boards in Varanasi',
    'How do I report a missing water tank or stalled community hall?',
    'What is the expenditure on school laboratory upgrades in my ward?',
  ],
};

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  projects,
  onSelectProjectByWorkCode,
  currentUser,
}) => {
  const userRole = (currentUser?.role || 'district').toLowerCase();
  const [selectedRole, setSelectedRole] = useState<string>(userRole);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `Greetings Officer. I am **VigilAI Assistant**, grounded strictly in official MPLADS registry records, Scikit-Learn anomaly models, and MoSPI statutory guidelines.\n\nActive Role: **${(
        selectedRole || 'DISTRICT'
      ).toUpperCase()}** | Jurisdiction: **${currentUser?.district || 'Varanasi'}, ${currentUser?.state || 'Uttar Pradesh'}**.\n\nI can retrieve project ground metrics, evaluate multi-engine risk fusion scores, audit contractor concentration, and formulate formal inspection assignments upon your confirmation.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'grounded-engine',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmingActionId, setConfirmingActionId] = useState<string | null>(null);

  const activeQuestions = ROLE_PROMPTS[selectedRole] || ROLE_PROMPTS.district;

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim() || isLoading) return;

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
          user: {
            ...currentUser,
            role: selectedRole,
            jurisdiction: {
              state: currentUser?.state || 'Uttar Pradesh',
              district: currentUser?.district || 'Varanasi',
              constituency: currentUser?.constituency || 'Varanasi',
            },
          },
          conversationHistory: messages.slice(-4).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
        }),
      });

      const data = await response.json();
      const replyText =
        data.response ||
        'Insufficient data available for this conclusion.';

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source || 'gemini-model',
        actionProposal: data.actionProposal || null,
        citedProjects: data.citedProjects || [],
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
          text: 'Insufficient data available for this conclusion. Please verify backend service connectivity.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: 'error-boundary',
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

  return (
    <div className="space-y-4 max-w-5xl mx-auto flex flex-col h-[780px] font-sans">
      {/* Top Header & Role Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-900 leading-tight">
                VigilAI Grounded Assistant &amp; Decision Copilot
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                Anti-Hallucination Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Grounded exclusively in 14 backend tools, Scikit-Learn ML models, and Firebase Firestore
            </p>
          </div>
        </div>

        {/* Role Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
            Role Lens:
          </span>
          {(['ministry', 'state', 'district', 'mp', 'citizen'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRole(r)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer ${
                selectedRole === r
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Suggested Quick Queries for selected role */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
          {selectedRole} Directives:
        </span>
        {activeQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 whitespace-nowrap transition-colors shadow-2xs text-[11px] font-medium shrink-0 cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
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

              <div className={`max-w-2xl space-y-2 ${isUser ? 'items-end' : ''}`}>
                <div
                  className={`p-4 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-slate-900 text-white rounded-tr-xs'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-xs font-normal'
                  }`}
                >
                  {m.text}

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
              <span>Querying backend tools, evaluating ML anomalies &amp; applying guardrails...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Field */}
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
          placeholder={`Ask VigilAI as ${selectedRole.toUpperCase()} (e.g., 'Show 5 highest-risk projects', 'Assign inspection for VAR-089')...`}
          className="flex-1 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none font-medium"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <span>Ask</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
