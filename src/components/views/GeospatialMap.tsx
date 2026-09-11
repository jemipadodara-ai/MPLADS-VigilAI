import React, { useMemo } from 'react';
import { MapView } from '../MapView';
import { MPLADProject } from '../../types';
import { MapPin, AlertTriangle, Layers, Navigation, ShieldAlert, Sparkles } from 'lucide-react';

interface GeospatialMapProps {
  projects: MPLADProject[];
  onInspectProject: (project: MPLADProject) => void;
}

export const GeospatialMap: React.FC<GeospatialMapProps> = ({ projects, onInspectProject }) => {
  const highRiskCount = useMemo(() => {
    return projects.filter(
      (p) =>
        (p.overallRiskScore || 0) >= 60 ||
        p.riskLevel === 'Critical' ||
        p.riskLevel === 'High'
    ).length;
  }, [projects]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold uppercase tracking-wider">
              Spatial Telemetry / GIS
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 text-xs font-medium">
              Geographic Information System
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            GIS Map Intelligence &amp; Spatial Anomaly Radar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Geocoded overlay of monitored development works to detect geographic clustering and proximity flags.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
            <span className="text-slate-400">Mapped Works: </span>
            <strong className="text-slate-900 font-bold">{projects.length}</strong>
          </div>
          <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
            <span className="text-rose-500">Spatial Hotspots: </span>
            <strong className="text-rose-900 font-bold">{highRiskCount}</strong>
          </div>
        </div>
      </div>

      {/* Map Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 overflow-hidden">
        <MapView projects={projects} onSelectProject={onInspectProject} />
      </div>
    </div>
  );
};
