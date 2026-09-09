import React from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';
import { ProjectFilterState } from '../types';

interface FilterBarProps {
  filters: ProjectFilterState;
  onChange: (newFilters: ProjectFilterState) => void;
  statesList: string[];
  districtsList: string[];
  mpsList: string[];
  categoriesList: string[];
  statusesList: string[];
  totalResults: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChange,
  statesList,
  districtsList,
  mpsList,
  categoriesList,
  statusesList,
  totalResults,
}) => {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, searchQuery: e.target.value });
  };

  const handleSelectChange = (key: keyof ProjectFilterState, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onChange({
      searchQuery: '',
      state: '',
      district: '',
      mp: '',
      constituency: '',
      category: '',
      status: '',
      riskLevel: '',
    });
  };

  const hasActiveFilters =
    Boolean(filters.searchQuery) ||
    Boolean(filters.state) ||
    Boolean(filters.district) ||
    Boolean(filters.mp) ||
    Boolean(filters.category) ||
    Boolean(filters.status) ||
    Boolean(filters.riskLevel);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
      {/* Top row: Search input & primary controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="global-project-search"
            type="text"
            value={filters.searchQuery}
            onChange={handleSearchChange}
            placeholder="Search project, work code, village, contractor, MP or district..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
          />
        </div>

        {/* Risk Level Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {['', 'Critical', 'High', 'Medium', 'Low'].map((lvl) => {
            const isSelected = filters.riskLevel === lvl;
            const label = lvl === '' ? 'All Risks' : lvl;
            return (
              <button
                key={lvl || 'all'}
                onClick={() => handleSelectChange('riskLevel', lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Toggle Advanced Filters */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
            showAdvanced || hasActiveFilters
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-blue-600" />
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
            title="Reset all filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Advanced Filter Row (Dropdowns) */}
      {showAdvanced && (
        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {/* State */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">State</label>
            <select
              value={filters.state}
              onChange={(e) => handleSelectChange('state', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All States</option>
              {statesList.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* District */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">District</label>
            <select
              value={filters.district}
              onChange={(e) => handleSelectChange('district', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Districts</option>
              {districtsList.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* MP */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Member of Parliament</label>
            <select
              value={filters.mp}
              onChange={(e) => handleSelectChange('mp', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All MPs</option>
              {mpsList.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleSelectChange('category', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categoriesList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Execution Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleSelectChange('status', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {statusesList.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Counter bar */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
        <span>Showing <strong className="text-slate-800 font-bold">{totalResults}</strong> projects</span>
        {hasActiveFilters && (
          <span className="text-blue-600 font-medium">Active filters applied</span>
        )}
      </div>
    </div>
  );
};
