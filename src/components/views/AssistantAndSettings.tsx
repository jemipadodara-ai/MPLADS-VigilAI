import React, { useState } from 'react';
import { Sparkles, Settings, ShieldCheck, ShieldAlert, Bot, Sliders } from 'lucide-react';
import { MPLADProject } from '../../types';
import { AiAssistantView } from './AiAssistantView';
import { SettingsView } from './SettingsView';

interface AssistantAndSettingsProps {
  projects: MPLADProject[];
  onSelectProjectByWorkCode: (code: string) => void;
  onRefreshData?: () => void;
  isLoadingData?: boolean;
  userRole?: 'admin' | 'standard';
  isRoleLoading?: boolean;
  currentUser?: any;
}

export const AssistantAndSettings: React.FC<AssistantAndSettingsProps> = ({
  projects,
  onSelectProjectByWorkCode,
  onRefreshData = () => {},
  isLoadingData = false,
  userRole = 'admin',
  isRoleLoading = false,
  currentUser,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'assistant' | 'settings'>('assistant');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Top Segmented Controller */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold uppercase tracking-wider">
              Intelligence &amp; Control
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 text-xs font-medium">
              Grounded AI &amp; Governance Center
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {activeSubTab === 'assistant' ? 'AI Grounded Investigator' : 'System Administration & Settings'}
          </h1>
          <p className="text-xs text-slate-500">
            {activeSubTab === 'assistant'
              ? 'Query the project dataset, extract anomalous procurement trends, or request natural language work breakdowns.'
              : 'Calibrate statutory risk weights, manage role-based access control, and manage Firestore persistence.'}
          </p>
        </div>

        {/* Toggle Pill */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            id="subtab-assistant-btn"
            onClick={() => setActiveSubTab('assistant')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'assistant'
                ? 'bg-white text-indigo-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Assistant</span>
          </button>

          <button
            id="subtab-settings-btn"
            onClick={() => setActiveSubTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'settings'
                ? 'bg-white text-indigo-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings &amp; Admin</span>
            {userRole === 'admin' && (
              <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 text-[10px] font-black">
                Admin
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content View */}
      <div>
        {activeSubTab === 'assistant' ? (
          <AiAssistantView
            projects={projects}
            onSelectProjectByWorkCode={onSelectProjectByWorkCode}
            currentUser={currentUser}
          />
        ) : (
          <SettingsView
            onRefreshData={onRefreshData}
            isLoading={isLoadingData}
            userRole={userRole}
            isRoleLoading={isRoleLoading}
          />
        )}
      </div>
    </div>
  );
};
