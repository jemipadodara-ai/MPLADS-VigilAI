import React, { useState } from 'react';
import { MPLADProject, ProjectStatus, TenderType } from '../types';
import { X, Save, Plus, AlertTriangle } from 'lucide-react';

interface ProjectFormModalProps {
  project?: MPLADProject | null; // null for create, existing for edit
  onClose: () => void;
  onSave: (data: Partial<MPLADProject>) => Promise<{ success: boolean; error?: string; project?: any }>;
}

const PROJECT_CATEGORIES = [
  'Infrastructure', 'Healthcare', 'Education', 'Water Supply', 'Sanitation',
  'Roads & Transport', 'Agriculture', 'Energy', 'Environment', 'Rural Development', 'Other'
];

const PROJECT_STATUSES: ProjectStatus[] = [
  'Recommended', 'Sanctioned', 'In Progress', 'Completed', 'Stalled', 'Delayed', 'Under Investigation', 'Cancelled'
];

const TENDER_TYPES: TenderType[] = [
  'Open Tender', 'Limited Tender', 'Nomination / Single Bid', 'Quotation (Sub-threshold)'
];

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({ project, onClose, onSave }) => {
  const isEdit = Boolean(project);
  const [formData, setFormData] = useState({
    title: project?.title || '',
    description: project?.description || '',
    category: project?.category || 'Infrastructure',
    state: project?.state || '',
    district: project?.district || '',
    constituency: project?.constituency || '',
    mpName: project?.mpName || '',
    implementingAgency: project?.implementingAgency || '',
    contractorName: project?.contractorName || '',
    sanctionedAmountLakhs: project?.sanctionedAmountLakhs || 0,
    expenditureAmountLakhs: project?.expenditureAmountLakhs || 0,
    completionPercentage: project?.completionPercentage || 0,
    status: project?.status || 'Sanctioned',
    tenderType: project?.tenderType || 'Open Tender',
    sanctionDate: project?.sanctionDate || new Date().toISOString().split('T')[0],
    expectedCompletionDate: project?.expectedCompletionDate || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.state.trim()) {
      setError('Project title and state are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await onSave(formData);
      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Failed to save project.');
      }
    } catch (err: any) {
      setError(err.message || 'Unexpected error.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              {isEdit ? 'Edit Project' : 'Add New MPLADS Project'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">All fields marked * are required</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1">Project Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => handleChange('title', e.target.value)}
                placeholder="e.g. Construction of Community Health Center at Village X"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={e => handleChange('description', e.target.value)}
                placeholder="Brief description of the project scope..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={e => handleChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {PROJECT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* State */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">State *</label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={e => handleChange('state', e.target.value)}
                placeholder="e.g. Uttar Pradesh"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* District */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">District</label>
              <input
                type="text"
                value={formData.district}
                onChange={e => handleChange('district', e.target.value)}
                placeholder="e.g. Varanasi"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Constituency */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Constituency</label>
              <input
                type="text"
                value={formData.constituency}
                onChange={e => handleChange('constituency', e.target.value)}
                placeholder="e.g. Varanasi"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* MP Name */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">MP Name</label>
              <input
                type="text"
                value={formData.mpName}
                onChange={e => handleChange('mpName', e.target.value)}
                placeholder="Hon. Member of Parliament name"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Implementing Agency */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Implementing Agency</label>
              <input
                type="text"
                value={formData.implementingAgency}
                onChange={e => handleChange('implementingAgency', e.target.value)}
                placeholder="e.g. District Panchayat / Municipal Corp"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Contractor */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Contractor Name</label>
              <input
                type="text"
                value={formData.contractorName}
                onChange={e => handleChange('contractorName', e.target.value)}
                placeholder="Registered contractor name"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Sanctioned Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Sanctioned Amount (₹ Lakhs)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.sanctionedAmountLakhs}
                onChange={e => handleChange('sanctionedAmountLakhs', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Expenditure */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Expenditure (₹ Lakhs)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.expenditureAmountLakhs}
                onChange={e => handleChange('expenditureAmountLakhs', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Completion % */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Completion (0–100%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.completionPercentage}
                onChange={e => handleChange('completionPercentage', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={e => handleChange('status', e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Tender Type */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Tender Type</label>
              <select
                value={formData.tenderType}
                onChange={e => handleChange('tenderType', e.target.value as TenderType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {TENDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Sanction Date */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Sanction Date</label>
              <input
                type="date"
                value={formData.sanctionDate}
                onChange={e => handleChange('sanctionDate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Expected Completion */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Expected Completion Date</label>
              <input
                type="date"
                value={formData.expectedCompletionDate}
                onChange={e => handleChange('expectedCompletionDate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors cursor-pointer"
            >
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
              ) : (
                <>{isEdit ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}{isEdit ? 'Save Changes' : 'Create Project'}</>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectFormModal;
