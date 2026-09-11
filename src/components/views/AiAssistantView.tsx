import React, { useState } from 'react';
import { MPLADProject } from '../../types';
import { Sparkles, Send, Bot, User, CornerDownLeft, Loader2, ShieldAlert } from 'lucide-react';

interface AiAssistantViewProps {
  projects: MPLADProject[];
  onSelectProjectByWorkCode: (code: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  citedWorkCodes?: string[];
}

const SAMPLE_QUESTIONS = [
  'Show high-risk projects in Varanasi',
  'Which districts have the most delayed projects?',
  'Show projects where expenditure is above 90% but completion is below 50%',
  'Which contractors have the highest number of projects?',
  'Explain why Project MPLADS/2023-24/UP/VAR-089 was flagged.',
];

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  projects,
  onSelectProjectByWorkCode,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: 'Hello. I am VigilAI, an AI Monitoring & Risk Intelligence Assistant grounded in your MPLADS project records. Ask me about specific projects, high-risk works, contractors, expenditure variances, or statutory compliance rules.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      // Send query to backend grounded API endpoint
      const response = await fetch('/api/ai/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          contextProjects: projects,
          datasetSummary: {
            totalProjects: projects.length,
            districts: Array.from(new Set(projects.map((p) => p.district || p.constituency))),
          },
        }),
      });

      const data = await response.json();
      const replyText =
        data.response ||
        'I could not find enough data in the available MPLAD dataset to answer this specific query.';

      // Extract any mentioned work codes
      const citedCodes: string[] = [];
      projects.forEach((p) => {
        if (replyText.includes(p.workCode)) {
          citedCodes.push(p.workCode);
        }
      });

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citedWorkCodes: citedCodes.length > 0 ? citedCodes : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('AI assistant query error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-err-${Date.now()}`,
          sender: 'assistant',
          text: 'I could not find enough data in the available MPLAD dataset. Please check that your network connection and server routes are active.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto flex flex-col h-[760px]">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">
              VigilAI Intelligence Assistant
            </h2>
            <p className="text-[11px] text-slate-500">
              Strictly grounded in Firebase project records • Zero hallucination guardrails
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Gemini 3.8 Flash</span>
        </div>
      </div>

      {/* Suggested Quick Queries */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">
          Quick queries:
        </span>
        {SAMPLE_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-blue-700 whitespace-nowrap transition-colors shadow-2xs text-[11px] font-medium shrink-0"
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
                  isUser ? 'bg-slate-900' : 'bg-gradient-to-tr from-blue-700 to-indigo-600'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-2xl space-y-1.5 ${isUser ? 'items-end' : ''}`}>
                <div
                  className={`p-4 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-slate-900 text-white rounded-tr-xs'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-xs font-normal'
                  }`}
                >
                  {m.text}

                  {/* Cited Work Codes Chips */}
                  {m.citedWorkCodes && m.citedWorkCodes.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Referenced Works:
                      </span>
                      {m.citedWorkCodes.map((code) => (
                        <button
                          key={code}
                          onClick={() => onSelectProjectByWorkCode(code)}
                          className="px-2 py-0.5 rounded-md bg-white border border-slate-300 font-mono font-bold text-[11px] text-blue-700 hover:bg-blue-50 transition-colors"
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className={`text-[10px] text-slate-400 px-1 ${
                    isUser ? 'text-right' : 'text-left'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-700 flex items-center justify-center text-white shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-2 text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Analyzing Firebase records & verifying rules...</span>
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
          placeholder="Ask VigilAI about any project, contractor, anomaly, or MoSPI rule..."
          className="flex-1 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none font-medium"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="px-4 py-2 bg-blue-700 text-white rounded-xl text-xs font-semibold hover:bg-blue-800 disabled:opacity-40 transition-colors flex items-center gap-1.5 shadow-2xs"
        >
          <span>Ask</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
