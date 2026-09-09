import React, { useState } from 'react';
import { MPLADProject, AnomalyCategory } from '../../types';
import { AnomalyCard } from '../AnomalyCard';
import { ProjectTable } from '../ProjectTable';
import {
  AlertCircle,
  Coins,
  Clock,
  TrendingUp,
  CopyCheck,
  Building,
  FileCheck2,
} from 'lucide-react';

interface AnomalyExplorerViewProps {
  projects: MPLADProject[];
  onSelectProject: (p: MPLADProject) => void;
}

const CATEGORIES: { id: AnomalyCategory; label: string; icon: any; description: string }[] = [
  {
    id: 'Financial',
    label: 'Financial Anomalies',
    icon: Coins,
    description: 'Expenditure exceeding sanction ceiling or high disbursements with low physical progress.',
  },
  {
    id: 'Progress',
    label: 'Progress & Delay',
    icon: Clock,
    description: 'Projects overdue past statutory 18-month ceiling or lagging significantly behind scheduled timeline.',
  },
  {
    id: 'Cost',
    label: 'Cost Anomalies',
    icon: TrendingUp,
    description: 'Work costs exceeding 1.6x the median benchmark for similar public asset types.',
  },
  {
    id: 'Duplicate',
    label: 'Duplicate / Overlapping',
    icon: CopyCheck,
    description: 'Works sharing identical geospatial coordinates, descriptions, or duplicate asset scope.',
  },
  {
    id: 'Contractor',
    label: 'Contractor Patterns',
    icon: Building,
    description: 'Procurement clustering, high single-bid ratios, or market concentration in specific districts.',
  },
  {
    id: 'Data Quality',
    label: 'Data Integrity',
    icon: FileCheck2,
    description: 'Missing mandatory fields, illogical percentages, or inconsistent date entries.',
  },
];

export const AnomalyExplorerView: React.FC<AnomalyExplorerViewProps> = ({
  projects,
  onSelectProject,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AnomalyCategory>('Financial');

  // Filter projects that have at least one detected anomaly in the selected category
  const matchingProjects = projects.filter((p) =>
    (p.detectedAnomalies || []).some((a) => a.category === selectedCategory)
  );

  const activeCategoryMeta = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Anomaly Explorer</h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Deterministic compliance & fraud-risk pattern analysis across MPLADS categories
        </p>
      </div>

      {/* Category Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          const count = projects.filter((p) =>
            (p.detectedAnomalies || []).some((a) => a.category === cat.id)
          ).length;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between shadow-2xs ${
                isSelected
                  ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-white border-slate-200/90 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon
                  className={`w-4 h-4 ${isSelected ? 'text-blue-700' : 'text-slate-500'}`}
                />
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </div>
              <div className="mt-2">
                <div
                  className={`text-xs font-bold leading-tight ${
                    isSelected ? 'text-blue-950' : 'text-slate-800'
                  }`}
                >
                  {cat.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Category Description Banner */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-white border border-slate-200 text-blue-700 shrink-0">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-900">
            {activeCategoryMeta.label} Detection Rule
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">{activeCategoryMeta.description}</p>
        </div>
      </div>

      {/* Detected Anomalies Samples & Project Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800">
            Identified Projects with {activeCategoryMeta.label} ({matchingProjects.length})
          </span>
          <span className="text-slate-500 text-[11px]">
            Sorted by Risk Severity
          </span>
        </div>

        <ProjectTable
          projects={matchingProjects}
          onSelectProject={onSelectProject}
          pageSize={8}
        />
      </div>
    </div>
  );
};
