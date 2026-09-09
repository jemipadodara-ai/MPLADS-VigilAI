import React, { useState } from 'react';
import {
  MapPin,
  ShieldAlert,
  AlertTriangle,
  Eye,
  Camera,
  Layers,
  Compass,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { MPLADProject } from '../types';

interface GeospatialInspectorProps {
  projects: MPLADProject[];
  onSelectProject: (project: MPLADProject) => void;
  onAuditProject: (project: MPLADProject) => void;
}

export const GeospatialInspector: React.FC<GeospatialInspectorProps> = ({
  projects,
  onSelectProject,
  onAuditProject,
}) => {
  const [selectedCluster, setSelectedCluster] = useState<'rampur' | 'channasandra'>('rampur');

  // Specific high-impact geospatial cases
  const duplicateClusterProjects = projects.filter((p) => p.workCode.includes('VAR-2024'));

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Compass className="h-5 w-5 text-indigo-600" />
              <span>Geospatial Collision & Ghost Asset Inspector</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cross-matches DGPS coordinates, satellite imagery, and e-SAKSHI metadata to detect twin sanctions within 100m and physical coordinate drift
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedCluster('rampur')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCluster === 'rampur'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Case 1: Twin Sanction Collision (&lt;40m)
            </button>
            <button
              onClick={() => setSelectedCluster('channasandra')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCluster === 'channasandra'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Case 2: 18.4 km Geo-Tag Drift (Ghost Asset)
            </button>
          </div>
        </div>
      </div>

      {/* Case 1: Duplicate Collision Inspection */}
      {selectedCluster === 'rampur' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                  Critical Spatial Collision Detected
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1.5">
                  Rampur Gram Panchayat Twin Sanction (Varanasi Rural)
                </h3>
                <p className="text-xs text-slate-500">
                  Two separate MPLADS sanctions disbursed by different implementing agencies for the same community asset within a 38-meter radius
                </p>
              </div>
              <div className="text-left sm:text-right">
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-50 text-red-700 border border-red-200">
                  Proximity Distance: 38 Meters
                </span>
              </div>
            </div>

            {/* Spatial Visualizer Map Graphic */}
            <div className="relative w-full h-64 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center p-4">
              {/* Grid backdrop */}
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px]"></div>

              {/* Radar Circles */}
              <div className="absolute w-72 h-72 rounded-full border border-indigo-200 animate-pulse pointer-events-none"></div>
              <div className="absolute w-44 h-44 rounded-full border border-red-200 pointer-events-none"></div>
              <div className="absolute w-20 h-20 rounded-full border border-red-300 pointer-events-none"></div>

              {/* Coordinate Points */}
              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-12 sm:gap-20">
                {/* Point 1 */}
                <div className="flex flex-col items-center text-center group cursor-pointer">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-full bg-red-600 flex items-center justify-center shadow-md shadow-red-200 border-2 border-white animate-bounce">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white"></span>
                  </div>
                  <div className="mt-2 bg-white p-2.5 rounded-xl border border-red-200 text-[11px] shadow-sm max-w-[180px]">
                    <div className="font-mono text-[9px] text-slate-500 font-bold">MPLADS-VAR-2024-089</div>
                    <div className="font-semibold text-slate-900">Work A: Community Center</div>
                    <div className="text-[10px] text-slate-500">RES Div-1 • ₹28.5L</div>
                    <div className="text-[9px] text-indigo-600 font-mono">25.2812° N, 82.9739° E</div>
                  </div>
                </div>

                {/* Overlap Vector */}
                <div className="flex flex-col items-center text-red-600">
                  <div className="h-0.5 w-16 sm:w-28 bg-red-400 relative">
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-white px-2 py-0.5 rounded-full border border-red-200 text-red-700 shadow-2xs">
                      38m Overlap
                    </span>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-red-600 mt-2">
                    Duplicate Risk: 98%
                  </span>
                </div>

                {/* Point 2 */}
                <div className="flex flex-col items-center text-center group cursor-pointer">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-full bg-amber-600 flex items-center justify-center shadow-md shadow-amber-200 border-2 border-white">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="mt-2 bg-white p-2.5 rounded-xl border border-amber-200 text-[11px] shadow-sm max-w-[180px]">
                    <div className="font-mono text-[9px] text-slate-500 font-bold">MPLADS-VAR-2024-094</div>
                    <div className="font-semibold text-slate-900">Work B: Community Shed</div>
                    <div className="text-[10px] text-slate-500">Zilla Panchayat • ₹24.0L</div>
                    <div className="text-[9px] text-indigo-600 font-mono">25.2815° N, 82.9741° E</div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-2 left-3 text-[10px] text-slate-400">
                Satellite telemetry source: e-SAKSHI Spatial Deduplication Index
              </div>
            </div>

            {/* Side-by-Side Comparison of Colliding Works */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {duplicateClusterProjects.map((p) => (
                <div key={p.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-700">{p.workCode}</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-50 text-red-700 border border-red-200">
                      Risk {p.overallRiskScore}/100
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{p.title}</h4>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Implementing Agency</span>
                      <span className="text-slate-700 font-medium">{p.implementingAgency}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Contractor</span>
                      <span className="text-slate-700 font-medium">{p.contractorName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Sanction Amount</span>
                      <span className="text-slate-900 font-bold">₹{p.sanctionedAmountLakhs} Lakhs</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Status</span>
                      <span className="text-amber-700 font-semibold">{p.status}</span>
                    </div>
                  </div>

                  {p.photoProofUrl && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 h-32 relative group">
                      <img
                        src={p.photoProofUrl}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2.5">
                        <span className="text-[10px] text-white flex items-center gap-1 font-medium">
                          <Camera className="h-3 w-3 text-amber-300" /> Uploaded e-SAKSHI Site Proof
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <button
                      onClick={() => onAuditProject(p)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                    >
                      Audit with Gemini <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onSelectProject(p)}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      View Full File
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Case 2: 18.4 km Geo-Tag Drift (Ghost Asset) */}
      {selectedCluster === 'channasandra' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                  Extreme Telemetry Discrepancy (Ghost Plant)
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1.5">
                  Channasandra RO Water Purification Plant (Bangalore Rural)
                </h3>
                <p className="text-xs text-slate-500">
                  Uploaded completion inspection photos originate 18.4 km away from the sanctioned Gram Panchayat site
                </p>
              </div>
              <div className="text-left sm:text-right">
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-50 text-red-700 border border-red-200">
                  Geo-Tag Divergence: 18.4 Kilometers
                </span>
              </div>
            </div>

            {/* Visual Telemetry Divergence Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Sanctioned Target Location
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">12.8712° N, 77.4915° E</span>
                </div>
                <div className="text-xs text-slate-700">
                  Designated beneficiary location: <strong>Channasandra Gram Panchayat Village Common Plot</strong>, Ramanagara District.
                </div>
                <div className="p-3 bg-white rounded-xl text-[11px] text-slate-600 border border-slate-200">
                  Ground Vigilance Report: Zero physical RO plant machinery found at target village. Pump house unbuilt.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                    <XCircle className="h-4 w-4 text-red-600" /> Actual Photo Telemetry Recorded
                  </span>
                  <span className="font-mono text-[10px] text-red-700 font-bold">12.9822° N, 77.6201° E</span>
                </div>
                <div className="text-xs text-red-900">
                  Metadata on contractor uploaded photograph points to a commercial equipment warehouse in Bengaluru Urban.
                </div>
                <div className="p-3 bg-white rounded-xl text-[11px] text-red-800 border border-red-200">
                  Conclusion: High-confidence Ghost Completion scam. 100% fund disbursement claimed without asset delivery.
                </div>
              </div>
            </div>

            {/* Quick Action */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-900">Work ID: MPLADS-BLR-2023-019 (₹18.0 Lakhs)</div>
                <div className="text-[11px] text-slate-500">Contractor: AquaPure Infra Solutions • Implementing Agency: RWSS Board</div>
              </div>

              <button
                onClick={() => {
                  const proj = projects.find((p) => p.id === 'proj-006');
                  if (proj) onAuditProject(proj);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors self-start sm:self-auto"
              >
                Constitute Physical Audit Inquiry
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
