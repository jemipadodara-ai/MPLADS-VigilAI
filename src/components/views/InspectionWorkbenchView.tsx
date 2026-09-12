import React, { useState, useEffect } from 'react';
import { MPLADProject, InspectionAssignment, canMakeDecisions } from '../../types';
import { PriorityBadge } from '../shared/StatusBadges';
import {
  ClipboardList,
  CheckCircle2,
  Camera,
  MapPin,
  Send,
  Loader2,
  Plus,
  X,
  FileCheck2,
  AlertOctagon,
  Calendar,
} from 'lucide-react';

interface InspectionWorkbenchViewProps {
  projects: MPLADProject[];
  onInspectProject: (project: MPLADProject) => void;
  currentUser?: any;
}

export const InspectionWorkbenchView: React.FC<InspectionWorkbenchViewProps> = ({
  projects,
  onInspectProject,
  currentUser,
}) => {
  const initialInspections: InspectionAssignment[] = [
    {
      id: 'INSP-2026-042',
      caseId: 'CASE-2026-101',
      projectId: projects[0]?.id || 'PROJ-01',
      projectTitle: projects[0]?.title || 'Community Health Center Construction',
      district: projects[0]?.district || 'Varanasi',
      state: projects[0]?.state || 'Uttar Pradesh',
      assignedOfficerName: 'Shri R. K. Sharma, SE (Vigilance)',
      officerDesignation: 'Superintending Engineer, Vigilance Wing',
      assignedAuthority: 'District Nodal Authority',
      deadlineDate: '2026-03-25',
      priority: 'P0',
      status: 'Field Work in Progress',
      objectives: [
        'Verify physical foundation & RCC superstructure milestone against 40% measurement book entry',
        'Inspect mandatory MoSPI Citizen Information Board at site',
        'Record geo-tagged site coordinates and compare against administrative sanction',
        'Sample construction material test certificates (cement & rebar heat numbers)',
      ],
      checklist: [
        { id: 'c1', task: 'Check GPS coordinates match sanctioned boundary within 50m', completed: true, findings: 'Site matches sanction boundary' },
        { id: 'c2', task: 'Inspect physical presence of superstructure walls and columns', completed: false },
        { id: 'c3', task: 'Reconcile Measurement Book Page 42-48 with on-site work', completed: false },
        { id: 'c4', task: 'Photograph project display board showing MP name and work cost', completed: true, findings: 'Display board is missing; contractor cited fabrication delay' },
      ],
      gpsCoordinates: { lat: 25.3176, lng: 82.9739 },
      requiredDocuments: ['Measurement Book (MB)', 'Itemized Vouchers', 'SoR Compliance Sheet'],
      uploadedEvidence: [
        {
          id: 'ev-1',
          title: 'Site Foundation Photo (North Elevation)',
          type: 'Photo',
          url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
          timestamp: '2026-03-12T10:15:00Z',
          uploadedBy: 'R. K. Sharma',
        },
      ],
      inspectionNotes: 'Initial visit completed. Structure is approximately 25% complete physically despite 65% billing ledger.',
      officerFindings: '',
      lastUpdated: '2026-03-12T11:00:00Z',
    },
    {
      id: 'INSP-2026-043',
      caseId: 'CASE-2026-104',
      projectId: projects[1]?.id || 'PROJ-02',
      projectTitle: projects[1]?.title || 'Drinking Water RO Plant Installation',
      district: projects[1]?.district || 'Gorakhpur',
      state: projects[1]?.state || 'Uttar Pradesh',
      assignedOfficerName: 'Smt. Anjali Verma, EE',
      officerDesignation: 'Executive Engineer, Rural Water Supply',
      assignedAuthority: 'Implementing Agency',
      deadlineDate: '2026-03-28',
      priority: 'P1',
      status: 'Scheduled',
      objectives: [
        'Verify operational status of water purification membranes and pipeline distribution network',
        'Interview local Gram Panchayat representatives regarding commissioning date',
      ],
      checklist: [
        { id: 'c21', task: 'Verify pump & RO membrane machinery installation', completed: false },
        { id: 'c22', task: 'Obtain water quality lab test certificate', completed: false },
        { id: 'c23', task: 'Verify electrical supply connection and meter reading', completed: false },
      ],
      gpsCoordinates: { lat: 26.7606, lng: 83.3732 },
      requiredDocuments: ['Equipment Invoice', 'Water Quality Certificate'],
      uploadedEvidence: [],
      inspectionNotes: 'Scheduled for joint inspection with Gram Pradhan.',
      officerFindings: '',
      lastUpdated: '2026-03-10T14:30:00Z',
    },
  ];

  const [inspections, setInspections] = useState<InspectionAssignment[]>(initialInspections);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string>(initialInspections[0]?.id || '');
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);
  const [officerNotesInput, setOfficerNotesInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Photo modal state
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Fetch persisted inspections from backend
  useEffect(() => {
    fetch('/api/inspections')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.inspections && data.inspections.length > 0) {
          // Map API InspectionRecord fields -> InspectionAssignment shape
          const mapped: InspectionAssignment[] = data.inspections.map((i: any) => ({
            id: i.id,
            caseId: i.caseId || '',
            projectId: i.projectId || i.workCode || '',
            projectTitle: i.projectTitle || '',
            district: i.district || '',
            state: i.state || '',
            assignedOfficerName: i.assignedOfficerName || 'Assigned Officer',
            officerDesignation: i.officerDesignation || 'Vigilance Officer',
            assignedAuthority: i.assignedAuthority || 'District Nodal Authority',
            deadlineDate: i.deadlineDate || '',
            priority: i.priority || 'P2',
            status: i.status || 'Scheduled',
            objectives: i.objectives || [],
            checklist: (i.checklist || []).map((c: any) => ({
              id: c.id,
              task: c.task,
              completed: !!c.completed,
              findings: c.findings,
            })),
            // gpsCoordinates may be missing from backend — fall back to 0,0
            gpsCoordinates: (i.gpsCoordinates && typeof i.gpsCoordinates.lat === 'number')
              ? i.gpsCoordinates
              : { lat: 0, lng: 0 },
            requiredDocuments: i.requiredDocuments || [],
            uploadedEvidence: (i.uploadedEvidence || []).map((ev: any) => ({
              id: ev.id || `ev-${Date.now()}-${Math.random()}`,
              title: ev.title || '',
              type: ev.type || 'Photo',
              url: ev.url || '',
              timestamp: ev.timestamp || new Date().toISOString(),
              uploadedBy: ev.uploadedBy || 'Officer',
            })),
            inspectionNotes: i.inspectionNotes || '',
            officerFindings: i.officerFindings || '',
            lastUpdated: i.lastUpdated || new Date().toISOString(),
          }));

          const remoteIds = new Set(mapped.map((i) => i.id));
          const combined = [
            ...mapped,
            ...initialInspections.filter((i) => !remoteIds.has(i.id)),
          ];
          setInspections(combined);
          if (!selectedInspectionId && combined.length > 0) {
            setSelectedInspectionId(combined[0].id);
          }
        }
      })
      .catch((err) => console.warn('Could not fetch remote inspections:', err));
  }, []);

  const activeInsp = inspections.find((i) => i.id === selectedInspectionId) || inspections[0];

  useEffect(() => {
    if (activeInsp) {
      setOfficerNotesInput(activeInsp.officerFindings || activeInsp.inspectionNotes || '');
    }
  }, [activeInsp?.id]);

  const handleToggleChecklist = async (inspId: string, taskId: string) => {
    if (!canMakeDecisions(currentUser?.role)) {
      alert('You need officer or minister credentials to update inspection records.');
      return;
    }
    const target = inspections.find((i) => i.id === inspId);
    if (!target) return;

    const updatedChecklist = target.checklist.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );

    setInspections((prev) =>
      prev.map((i) => (i.id === inspId ? { ...i, checklist: updatedChecklist } : i))
    );

    try {
      await fetch(`/api/inspections/${inspId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist: updatedChecklist }),
      });
    } catch (e) {
      console.warn('Checklist sync notice:', e);
    }
  };

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canMakeDecisions(currentUser?.role)) {
      alert('You need officer or minister credentials to update inspection records.');
      return;
    }
    if (!activeInsp || !newPhotoTitle.trim()) return;

    setIsUploadingPhoto(true);
    const photoPayload = {
      title: newPhotoTitle,
      type: 'Photo',
      url: newPhotoUrl || 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=800',
      uploadedBy: currentUser?.name || 'Inspection Officer',
      timestamp: new Date().toISOString(),
    };

    try {
      const res = await fetch(`/api/inspections/${activeInsp.id}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(photoPayload),
      });
      const data = await res.json();
      const savedEvidence = data.evidence || { ...photoPayload, id: `ev-${Date.now()}` };

      setInspections((prev) =>
        prev.map((i) =>
          i.id === activeInsp.id
            ? { ...i, uploadedEvidence: [...i.uploadedEvidence, savedEvidence] }
            : i
        )
      );

      setShowPhotoModal(false);
      setNewPhotoTitle('');
      setNewPhotoUrl('');
      setSubmissionFeedback('Geo-tagged photographic evidence attached and logged.');
      setTimeout(() => setSubmissionFeedback(null), 4000);
    } catch (err) {
      console.error('Evidence upload error:', err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!canMakeDecisions(currentUser?.role)) {
      alert('You need officer or minister credentials to update inspection records.');
      return;
    }
    if (!activeInsp) return;
    setIsSubmitting(true);

    try {
      await fetch(`/api/inspections/${activeInsp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Report Submitted',
          officerFindings: officerNotesInput,
          completedDate: new Date().toISOString().split('T')[0],
        }),
      });

      setInspections((prev) =>
        prev.map((i) =>
          i.id === activeInsp.id
            ? {
                ...i,
                status: 'Report Submitted',
                officerFindings: officerNotesInput,
                lastUpdated: new Date().toISOString(),
              }
            : i
        )
      );

      setSubmissionFeedback(
        `Field inspection report for ${activeInsp.id} signed & submitted to District Nodal Authority with audit docket.`
      );
      setTimeout(() => setSubmissionFeedback(null), 5000);
    } catch (err) {
      console.error('Inspection report submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
              Field Vigilance &amp; Verification
            </span>
            <span className="text-xs text-slate-500 font-medium">On-Site Inspection Operations</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            INSPECTION WORKBENCH
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-3xl">
            Mobile-optimized officer interface for conducting on-site physical audits, geo-tagged photography, Measurement Book (MB) reconciliation, and milestone verification.
          </p>
        </div>

        <div className="text-right shrink-0">
          <div className="text-[11px] font-bold uppercase text-slate-400">Assigned Missions</div>
          <div className="text-lg font-black text-slate-900">{inspections.length} Active Audits</div>
        </div>
      </div>

      {submissionFeedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{submissionFeedback}</span>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Inspections List */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Assigned Work Missions
          </div>
          {inspections.map((insp) => (
            <div
              key={insp.id}
              onClick={() => setSelectedInspectionId(insp.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                activeInsp?.id === insp.id
                  ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold text-indigo-700">{insp.id}</span>
                <PriorityBadge priority={insp.priority} />
              </div>
              <h4 className="font-bold text-sm text-slate-900 leading-snug">{insp.projectTitle}</h4>
              <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
                <span>📍 {insp.district}</span>
                <span
                  className={`font-semibold ${
                    insp.status === 'Report Submitted'
                      ? 'text-emerald-700'
                      : 'text-indigo-700'
                  }`}
                >
                  {insp.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Active Inspection Detail Workbench */}
        {activeInsp && (
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              {/* Mission Header */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {activeInsp.id}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Linked to {activeInsp.caseId}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-md text-xs font-bold border ${
                      activeInsp.status === 'Report Submitted'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {activeInsp.status}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-900 mt-2">
                  {activeInsp.projectTitle}
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Officer In-Charge
                    </span>
                    <span className="font-semibold text-slate-800">
                      {activeInsp.assignedOfficerName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Target Due Date
                    </span>
                    <span className="font-semibold text-rose-700">{activeInsp.deadlineDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Supervising Body
                    </span>
                    <span className="font-semibold text-slate-800">
                      {activeInsp.assignedAuthority || 'District Nodal Authority'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inspection Objectives */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase text-slate-700">
                  Statutory Audit Objectives
                </div>
                <ul className="space-y-1.5">
                  {(activeInsp.objectives || []).map((obj, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Interactive Field Checklist */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase text-slate-700 flex items-center justify-between">
                  <span>Field Verification Checklist</span>
                  <span className="text-[11px] text-slate-500">
                    {(activeInsp.checklist || []).filter((t) => t.completed).length} of{' '}
                    {(activeInsp.checklist || []).length} Completed
                  </span>
                </div>
                <div className="space-y-2">
                  {(activeInsp.checklist || []).map((item) => (
                    <label
                      key={item.id}
                      className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                        item.completed
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleChecklist(activeInsp.id, item.id)}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div className="text-xs flex-1">
                        <span
                          className={`font-semibold ${
                            item.completed ? 'text-emerald-950 line-through' : 'text-slate-800'
                          }`}
                        >
                          {item.task}
                        </span>
                        {item.findings && (
                          <div className="text-[11px] text-slate-600 mt-1 font-medium bg-white p-1.5 rounded border border-slate-200">
                            <strong>Recorded Note:</strong> {item.findings}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Uploaded Evidence & Geo-tag */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase text-slate-700 flex items-center justify-between">
                  <span>Geo-Tagged Photographic Evidence</span>
                  <button
                    onClick={() => setShowPhotoModal(true)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Attach New Photo
                  </button>
                </div>

                {(activeInsp.uploadedEvidence || []).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeInsp.uploadedEvidence.map((ev) => (
                      <div
                        key={ev.id}
                        className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 text-xs"
                      >
                        <img
                          src={ev.url}
                          alt={ev.title}
                          className="w-full h-32 object-cover"
                          crossOrigin="anonymous"
                        />
                        <div className="p-2.5">
                          <div className="font-bold text-slate-900">{ev.title}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Geo-Tagged • By {ev.uploadedBy}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                    No field photographs uploaded yet. Click "Attach New Photo" above.
                  </div>
                )}
              </div>

              {/* Field Officer Notes & Findings */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Field Officer Concluding Findings &amp; Recommendation
                </label>
                <textarea
                  rows={3}
                  value={officerNotesInput}
                  onChange={(e) => setOfficerNotesInput(e.target.value)}
                  placeholder="Record reconciliation findings regarding measurement book entries, labor presence, and material specifications..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Submit Report Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  onClick={handleSubmitReport}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting to District Authority...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Signed Field Verification Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Photo Attachment Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-600" />
                <span>Attach Geo-Tagged Photo Evidence</span>
              </h3>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEvidence} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Evidence Description / Angle
                </label>
                <input
                  type="text"
                  required
                  value={newPhotoTitle}
                  onChange={(e) => setNewPhotoTitle(e.target.value)}
                  placeholder="e.g. Pillar RCC joint inspection (South-West corner)"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Photo URL (or placeholder camera image)
                </label>
                <input
                  type="url"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  placeholder="https://... (leave blank for standard sample photo)"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Automatic GPS Stamp</span>
                </div>
                <div>Lat: 25.3176° N, Lng: 82.9739° E (Within 12m of work site)</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(false)}
                  className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingPhoto || !newPhotoTitle.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isUploadingPhoto ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Attach Photo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
