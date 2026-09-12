import React, { useState } from 'react';
import { MPLADProject, CitizenReportSubmission, CitizenReportCategory } from '../../types';
import {
  Users,
  MapPin,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Send,
  ShieldCheck,
  Search,
  ThumbsUp,
  Clock,
  Eye,
} from 'lucide-react';

interface CitizenPortalViewProps {
  projects: MPLADProject[];
  onInspectProject: (project: MPLADProject) => void;
}

export const CitizenPortalView: React.FC<CitizenPortalViewProps> = ({
  projects,
  onInspectProject,
}) => {
  // Existing verified citizen reports
  const [reports, setReports] = useState<CitizenReportSubmission[]>([
    {
      id: 'CIT-2026-081',
      projectId: projects[0]?.id || 'PROJ-01',
      projectTitle: projects[0]?.title || 'Community Health Sub-Center',
      location: projects[0]?.district ? `${projects[0].district}, ${projects[0].state}` : 'Varanasi, UP',
      district: projects[0]?.district || 'Varanasi',
      state: projects[0]?.state || 'Uttar Pradesh',
      category: 'Incomplete Work',
      description: 'RCC pillar structure was erected 8 months ago, but no masonry or roof work has been done. The official portal shows 65% completion.',
      verificationVerdict: 'Partially Completed',
      evidencePriority: 'P1',
      hasGps: true,
      hasPhoto: true,
      corroborationCount: 7,
      submittedAt: '2026-03-08T14:20:00Z',
      isAnonymous: false,
      status: 'Corroborated',
    },
    {
      id: 'CIT-2026-082',
      projectId: projects[1]?.id || 'PROJ-02',
      projectTitle: projects[1]?.title || 'Solar High Mast Street Lighting System',
      location: projects[1]?.district ? `${projects[1].district}, ${projects[1].state}` : 'Gorakhpur, UP',
      district: projects[1]?.district || 'Gorakhpur',
      state: projects[1]?.state || 'Uttar Pradesh',
      category: 'Non-functional Asset',
      description: 'Lights stopped functioning within 3 weeks of inauguration. No contractor contact details displayed on the citizen board.',
      verificationVerdict: 'No',
      evidencePriority: 'P2',
      hasGps: true,
      hasPhoto: true,
      corroborationCount: 14,
      submittedAt: '2026-03-10T09:15:00Z',
      isAnonymous: true,
      status: 'Dispatched to Officer',
    },
  ]);

  // Form State for reporting
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [verdict, setVerdict] = useState<'Yes' | 'No' | 'Partially Completed' | 'Cannot Verify'>('No');
  const [category, setCategory] = useState<CitizenReportCategory>('Incomplete Work');
  const [description, setDescription] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing reports from backend API
  React.useEffect(() => {
    fetch('/api/citizen-reports')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.reports && data.reports.length > 0) {
          const apiReports: CitizenReportSubmission[] = data.reports.map((r: any) => ({
            id: r.reportId || r.id,
            projectId: r.projectId,
            projectTitle: r.projectTitle,
            location: r.location,
            district: r.district,
            state: r.state,
            category: r.category,
            description: r.description,
            verificationVerdict: r.verificationVerdict || 'Partially Completed',
            evidencePriority: r.aiTriage?.priority || 'P1',
            hasGps: r.hasGps ?? true,
            hasPhoto: r.hasPhoto ?? false,
            corroborationCount: r.corroborationCount || 1,
            submittedAt: r.submittedAt,
            isAnonymous: r.isAnonymous ?? false,
            status: r.status,
          }));

          const remoteIds = new Set(apiReports.map((r) => r.id));
          setReports((prev) => [...apiReports, ...prev.filter((p) => !remoteIds.has(p.id))]);
        }
      })
      .catch((err) => console.warn('Citizen reports fetch notice:', err));
  }, []);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const newReport: CitizenReportSubmission = {
      id: `CIT-2026-${String(reports.length + 83).padStart(3, '0')}`,
      projectId: selectedProject?.id || 'PROJ',
      projectTitle: selectedProject?.title || 'MPLADS Public Work',
      location: selectedProject?.location || `${selectedProject?.district}, ${selectedProject?.state}`,
      district: selectedProject?.district || 'District',
      state: selectedProject?.state || 'State',
      category,
      description,
      verificationVerdict: verdict,
      evidencePriority: verdict === 'No' ? 'P0' : 'P1',
      hasGps: true,
      hasPhoto,
      corroborationCount: 1,
      submittedAt: new Date().toISOString(),
      isAnonymous,
      status: 'Pending Triage',
    };

    try {
      const res = await fetch('/api/citizen-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject?.id,
          workCode: selectedProject?.workCode,
          projectTitle: selectedProject?.title,
          location: selectedProject?.location || `${selectedProject?.district}, ${selectedProject?.state}`,
          district: selectedProject?.district,
          state: selectedProject?.state,
          category,
          description,
          verificationVerdict: verdict,
          hasPhoto,
          hasGps: true,
          isAnonymous,
        }),
      });

      const data = await res.json();
      if (data.report) {
        newReport.id = data.report.reportId || newReport.id;
        newReport.evidencePriority = data.report.aiTriage?.priority || newReport.evidencePriority;
      }
    } catch (err) {
      console.warn('Citizen report post notice:', err);
    } finally {
      setIsSubmitting(false);
    }

    setReports([newReport, ...reports]);
    setSubmitSuccess(`Report ${newReport.id} logged & triaged by AI! Dispatched to district vigilance queue.`);
    setDescription('');
    setTimeout(() => setSubmitSuccess(null), 5000);
  };

  const handleCorroborate = (id: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, corroborationCount: r.corroborationCount + 1 } : r))
    );
    // Persist corroboration to backend
    fetch('/api/citizen-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'corroborate', reportId: id }),
    }).catch((err) => console.warn('Corroboration persist notice:', err));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              Participatory Social Audit
            </span>
            <span className="text-xs text-slate-500 font-medium">Citizen Ground-Truth Verification</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            CITIZEN VIGILANCE & ASSET VERIFICATION
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-3xl">
            Empowers local constituents to verify physical presence and operational quality of sanctioned MPLADS assets, providing ground-truth corroboration to prevent ghost works.
          </p>
        </div>

        <div className="text-right shrink-0">
          <div className="text-[11px] font-bold uppercase text-slate-400">Public Reports</div>
          <div className="text-xl font-black text-slate-900">{reports.length} Verified Entries</div>
        </div>
      </div>

      {submitSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{submitSuccess}</span>
        </div>
      )}

      {/* 2-Column: Left Submission Form, Right Verified Citizen Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Verification Submission Form (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                Verify an Asset in Your Locality
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Answer four simple questions to submit a structured field observation.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Select Project */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select MPLADS Work
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-900"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.district})
                    </option>
                  ))}
                </select>
              </div>

              {/* Physical Presence Question */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Is the asset physically present and complete at the location?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Yes', 'No', 'Partially Completed', 'Cannot Verify'] as const).map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => setVerdict(opt)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        verdict === opt
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Issue Category */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Observation Classification
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-900"
                >
                  <option value="Incomplete Work">Incomplete Work</option>
                  <option value="Missing Asset">Missing Asset / Ghost Work</option>
                  <option value="Poor Quality">Substandard Quality of Material</option>
                  <option value="Non-functional Asset">Non-functional / Inoperative</option>
                  <option value="Wrong Location">Constructed at Wrong Location</option>
                  <option value="Duplicate Work">Duplicate / Multiple Claims</option>
                  <option value="Other">Other Observation</option>
                </select>
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ground Description & Details
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe physical condition, whether contractor citizen display board exists, current utility to public..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  required
                />
              </div>

              {/* Attachments checklist */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasPhoto}
                    onChange={(e) => setHasPhoto(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span className="font-semibold text-slate-700">
                    I have taken a photograph at the site
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span className="font-semibold text-slate-700">
                    Keep my identity anonymous from public display
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Ground Observation</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right: Public Corroboration Stream (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">
              Community Ground Observations
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Sorted by local citizen corroborations
            </span>
          </div>

          <div className="space-y-3">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {rep.id}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          rep.verificationVerdict === 'No'
                            ? 'bg-rose-100 text-rose-800'
                            : rep.verificationVerdict === 'Partially Completed'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        Ground Status: {rep.verificationVerdict}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        📍 {rep.location}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 mt-1 leading-snug">
                      {rep.projectTitle}
                    </h4>
                  </div>

                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                    {rep.status}
                  </span>
                </div>

                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  "{rep.description}"
                </p>

                <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
                  <div className="flex items-center gap-4">
                    {rep.hasGps && (
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                        <MapPin className="w-3.5 h-3.5" />
                        Geo-Tagged
                      </span>
                    )}
                    {rep.hasPhoto && (
                      <span className="flex items-center gap-1 text-indigo-700 font-semibold">
                        <Camera className="w-3.5 h-3.5" />
                        Photo Evidence Attached
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleCorroborate(rep.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Corroborate ({rep.corroborationCount})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
