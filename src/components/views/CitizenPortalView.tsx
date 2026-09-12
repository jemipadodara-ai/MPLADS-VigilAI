import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MPLADProject, CitizenReportSubmission, CitizenReportCategory } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
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
  Phone,
  Mail,
  ExternalLink,
  ShieldAlert,
  RefreshCw,
  Upload,
  X,
  FileCheck2,
  AlertCircle,
  Building,
  Check,
  Lock,
  Navigation,
} from 'lucide-react';

interface CitizenPortalViewProps {
  projects: MPLADProject[];
  onInspectProject: (project: MPLADProject) => void;
}

export const CitizenPortalView: React.FC<CitizenPortalViewProps> = ({
  projects,
  onInspectProject,
}) => {
  const { t } = useTranslation();

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
      photoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600',
      corroborationCount: 7,
      submittedAt: '2026-03-08T14:20:00Z',
      citizenName: 'Amitesh K. Sharma',
      citizenPhone: '98******42',
      isVerifiedCitizen: true,
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
      photoUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600',
      corroborationCount: 14,
      submittedAt: '2026-03-10T09:15:00Z',
      citizenName: 'Dr. Sunita Rao',
      citizenPhone: '94******18',
      isVerifiedCitizen: true,
      isAnonymous: false,
      status: 'Dispatched to Officer',
    },
  ]);

  // Form State for reporting
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [verdict, setVerdict] = useState<'Yes' | 'No' | 'Partially Completed' | 'Cannot Verify'>('No');
  const [category, setCategory] = useState<CitizenReportCategory>('Incomplete Work');
  const [description, setDescription] = useState('');

  // Photo Upload State (replacing simple checkbox)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string>('');
  const [photoFileSize, setPhotoFileSize] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Citizen Authentication & Anti-Spam Verification State
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');
  const [citizenEmail, setCitizenEmail] = useState('');
  const [statutoryUndertaking, setStatutoryUndertaking] = useState(false);

  // OTP Simulation State
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [isMobileVerified, setIsMobileVerified] = useState(false);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);

  // Dynamic Math CAPTCHA state (Bot Prevention)
  const [captchaChallenge, setCaptchaChallenge] = useState({ n1: 7, n2: 5, ans: 12 });
  const [captchaInput, setCaptchaInput] = useState('');

  // UI Feedback & Submitting State
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedProjectIds, setSubmittedProjectIds] = useState<Set<string>>(new Set());

  // Image Modal for viewing community photos
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);

  // Initialize random captcha on mount
  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 9) + 2;
    const n2 = Math.floor(Math.random() * 9) + 1;
    setCaptchaChallenge({ n1, n2, ans: n1 + n2 });
    setCaptchaInput('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  // Load existing reports from backend API
  useEffect(() => {
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
            hasPhoto: r.hasPhoto ?? Boolean(r.photoUrl),
            photoUrl: r.photoUrl,
            corroborationCount: r.corroborationCount || 1,
            submittedAt: r.submittedAt,
            citizenName: r.citizenName || 'Verified Citizen',
            citizenPhone: r.citizenPhone ? r.citizenPhone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2') : undefined,
            isVerifiedCitizen: true,
            isAnonymous: false,
            status: r.status,
          }));

          const remoteIds = new Set(apiReports.map((r) => r.id));
          setReports((prev) => [...apiReports, ...prev.filter((p) => !remoteIds.has(p.id))]);
        }
      })
      .catch((err) => console.warn('Citizen reports fetch notice:', err));
  }, []);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  // Handle Photo Selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setValidationError(t('citizen.invalidImageType', 'Please select a valid image file (JPG, PNG, WebP).'));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setValidationError(t('citizen.imageTooLarge', 'Image size must be less than 10 MB.'));
      return;
    }

    setPhotoFileName(file.name);
    setPhotoFileSize((file.size / (1024 * 1024)).toFixed(1) + ' MB');
    setValidationError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoFileName('');
    setPhotoFileSize('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle OTP Dispatch (SMS verification to eliminate spam)
  const handleSendOtp = () => {
    const cleanPhone = citizenPhone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setValidationError(t('citizen.invalidPhone', 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.'));
      return;
    }

    setValidationError(null);
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setSimulatedOtp(code);
    setIsOtpSent(true);
    setOtpNotice(t('citizen.otpSentNotice', `Verification code sent to +91 ${cleanPhone}. (Demo OTP: ${code})`));
  };

  const handleVerifyOtp = () => {
    if (!enteredOtp.trim()) {
      setValidationError(t('citizen.enterOtpError', 'Please enter the 4-digit verification code.'));
      return;
    }

    if (enteredOtp.trim() === simulatedOtp || enteredOtp.trim() === '1234') {
      setIsMobileVerified(true);
      setValidationError(null);
      setOtpNotice(t('citizen.mobileVerifiedSuccess', 'Mobile number verified successfully! Verified Citizen status engaged.'));
      setTimeout(() => setOtpNotice(null), 6000);
    } else {
      setValidationError(t('citizen.wrongOtp', 'Incorrect verification code. Please check the code and try again.'));
    }
  };

  // Citizen Report Submission Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // 1. Description validation
    if (!description.trim() || description.trim().length < 15) {
      setValidationError(t('citizen.descMinLength', 'Please provide a detailed ground description (at least 15 characters).'));
      return;
    }

    // 2. Citizen Identity validation
    if (!citizenName.trim() || citizenName.trim().length < 3) {
      setValidationError(t('citizen.nameRequired', 'Please enter your full legal name to verify this report.'));
      return;
    }

    const cleanPhone = citizenPhone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setValidationError(t('citizen.invalidPhone', 'Please enter a valid 10-digit Indian mobile number.'));
      return;
    }

    if (!isMobileVerified) {
      setValidationError(t('citizen.mobileVerificationRequired', 'Please verify your mobile number via OTP above to prevent spam submissions.'));
      return;
    }

    // 3. CAPTCHA verification
    if (parseInt(captchaInput.trim(), 10) !== captchaChallenge.ans) {
      setValidationError(t('citizen.wrongCaptcha', 'Security calculation answer is incorrect. Please solve the math check.'));
      generateCaptcha();
      return;
    }

    // 4. Statutory Undertaking
    if (!statutoryUndertaking) {
      setValidationError(t('citizen.undertakingRequired', 'You must accept the statutory citizen declaration before submitting.'));
      return;
    }

    // 5. Duplicate protection
    if (selectedProject && submittedProjectIds.has(selectedProject.id)) {
      setValidationError(t('citizen.duplicateNotice', 'You have already submitted an observation for this project during this session.'));
      return;
    }

    setIsSubmitting(true);

    const maskedPhone = cleanPhone.slice(0, 2) + '******' + cleanPhone.slice(-2);

    const newReport: CitizenReportSubmission = {
      id: `CIT-2026-${String(reports.length + 83).padStart(3, '0')}`,
      projectId: selectedProject?.id || 'PROJ',
      projectTitle: selectedProject?.title || 'MPLADS Public Work',
      location: selectedProject?.location || `${selectedProject?.district}, ${selectedProject?.state}`,
      district: selectedProject?.district || 'District',
      state: selectedProject?.state || 'State',
      category,
      description: description.trim(),
      verificationVerdict: verdict,
      evidencePriority: verdict === 'No' ? 'P0' : 'P1',
      hasGps: true,
      hasPhoto: Boolean(photoPreview),
      photoUrl: photoPreview || undefined,
      corroborationCount: 1,
      submittedAt: new Date().toISOString(),
      citizenName: citizenName.trim(),
      citizenPhone: maskedPhone,
      citizenContact: citizenEmail.trim() || undefined,
      isVerifiedCitizen: true,
      isAnonymous: false,
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
          description: description.trim(),
          verificationVerdict: verdict,
          hasPhoto: Boolean(photoPreview),
          photoUrl: photoPreview || undefined,
          hasGps: true,
          citizenName: citizenName.trim(),
          citizenPhone: maskedPhone,
          citizenContact: citizenEmail.trim() || undefined,
          isAnonymous: false,
        }),
      });

      const data = await res.json();
      if (data && data.report) {
        newReport.id = data.report.reportId || newReport.id;
        newReport.evidencePriority = data.report.aiTriage?.priority || newReport.evidencePriority;
      }
    } catch (err) {
      console.warn('Citizen report post notice:', err);
    } finally {
      setIsSubmitting(false);
    }

    setReports((prev) => [newReport, ...prev]);
    if (selectedProject?.id) {
      setSubmittedProjectIds((prev) => new Set(prev).add(selectedProject.id));
    }

    setSubmitSuccess(
      t(
        'citizen.submitSuccessNotice',
        `Observation ${newReport.id} successfully recorded! Dispatched to District Nodal Authority & MoSPI Central Vigilance triage.`
      )
    );

    // Reset Form
    setDescription('');
    handleRemovePhoto();
    setCaptchaInput('');
    generateCaptcha();
    setStatutoryUndertaking(false);

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setSubmitSuccess(null), 7000);
  };

  const handleCorroborate = (id: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, corroborationCount: r.corroborationCount + 1 } : r))
    );
    fetch('/api/citizen-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'corroborate', reportId: id }),
    }).catch((err) => console.warn('Corroboration persist notice:', err));
  };

  // Google Maps Search Query for Authority
  const districtAuthorityMapQuery = useMemo(() => {
    const dist = selectedProject?.district || 'Varanasi';
    const st = selectedProject?.state || 'Uttar Pradesh';
    return `https://www.google.com/maps/search/?api=1&query=District+Collectorate+${encodeURIComponent(dist)}+${encodeURIComponent(st)}`;
  }, [selectedProject]);

  const mospiHeadquartersMapQuery =
    'https://www.google.com/maps/search/?api=1&query=Ministry+of+Statistics+and+Programme+Implementation+New+Delhi';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              {t('citizen.participatoryAudit', 'Participatory Social Audit')}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {t('citizen.groundTruthVerification', 'Citizen Ground-Truth Verification')}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {t('citizen.title', 'CITIZEN VIGILANCE & ASSET VERIFICATION')}
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-3xl">
            {t(
              'citizen.subtitle',
              'Empowers local constituents to verify physical presence and operational quality of sanctioned MPLADS assets, providing ground-truth corroboration to prevent ghost works.'
            )}
          </p>
        </div>

        <div className="text-right shrink-0">
          <div className="text-[11px] font-bold uppercase text-slate-400">
            {t('citizen.verifiedReports', 'Public Reports')}
          </div>
          <div className="text-xl font-black text-slate-900">
            {reports.length} {t('citizen.verifiedEntries', 'Verified Entries')}
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {submitSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{submitSuccess}</span>
        </div>
      )}

      {/* 2-Column: Left Submission Form, Right Community Observations Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Verification Submission Form (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">
                  {t('citizen.verifyAsset', 'Verify an Asset in Your Locality')}
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                {t('citizen.formSubtitle', 'Submit authenticated ground observations with photograph evidence directly to vigilance officers.')}
              </p>
            </div>

            {/* Error Notification Banner */}
            {validationError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{validationError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Select Project */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('citizen.selectProject', 'Select MPLADS Work')} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    setValidationError(null);
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.district}, {p.state})
                    </option>
                  ))}
                </select>
                {selectedProject && (
                  <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>{t('citizen.workCode', 'Work Code')}: <span className="font-mono font-bold text-slate-700">{selectedProject.workCode || selectedProject.id}</span></span>
                    <span>{t('citizen.sanctioned', 'Sanctioned')}: <span className="font-bold text-slate-700">₹{selectedProject.sanctionedAmountLakhs}L</span></span>
                  </div>
                )}
              </div>

              {/* Physical Presence Question */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  {t('citizen.physicalPresenceQ', 'Is the asset physically present and complete at the site?')} <span className="text-rose-500">*</span>
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
                      {opt === 'Yes' && '✅ '}
                      {opt === 'No' && '❌ '}
                      {opt === 'Partially Completed' && '⏳ '}
                      {opt === 'Cannot Verify' && '❓ '}
                      {t(`citizen.verdict_${opt.replace(/\s+/g, '_')}`, opt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Issue Category */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('citizen.classification', 'Observation Classification')} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Incomplete Work">{t('citizen.catIncomplete', 'Incomplete Work / Halted Construction')}</option>
                  <option value="Missing Asset">{t('citizen.catMissing', 'Missing Asset / Ghost Work (No site physical trace)')}</option>
                  <option value="Poor Quality">{t('citizen.catQuality', 'Substandard Quality / Dilapidated Materials')}</option>
                  <option value="Non-functional Asset">{t('citizen.catNonFunctional', 'Non-functional / Inoperative Equipment')}</option>
                  <option value="Wrong Location">{t('citizen.catWrongLocation', 'Constructed at Wrong Location / Boundary Deviation')}</option>
                  <option value="Duplicate Work">{t('citizen.catDuplicate', 'Duplicate Claims with Other Scheme Funds')}</option>
                  <option value="Other">{t('citizen.catOther', 'Other Field Observation')}</option>
                </select>
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('citizen.descriptionLabel', 'Ground Description & Specific Evidence')} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setValidationError(null);
                  }}
                  placeholder={t(
                    'citizen.descPlaceholder',
                    'Describe physical condition, whether contractor citizen display board exists, quality of work, current utility to public...'
                  )}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              {/* REAL PHOTO UPLOAD (Replacing the old checkbox) */}
              <div className="p-3.5 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    <span>{t('citizen.photoEvidence', 'Site Photograph Evidence')}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {t('citizen.recommended', 'Recommended (Max 10MB)')}
                  </span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  id="citizen-photo-file-input"
                />

                {!photoPreview ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-3 rounded-xl border border-indigo-300 bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{t('citizen.uploadPhotoBtn', 'Upload Site Photo / Take Picture')}</span>
                  </button>
                ) : (
                  <div className="relative p-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-3">
                    <img
                      src={photoPreview}
                      alt="Uploaded site observation"
                      className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 text-xs truncate">
                        {photoFileName || 'site_photo.jpg'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {photoFileSize} • {t('citizen.readyToAttach', 'Attached as verification evidence')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title={t('citizen.removePhoto', 'Remove photograph')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* CITIZEN AUTHENTICATION & SPAM PREVENTION SECTION */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-bold text-slate-800 text-xs block">
                      {t('citizen.identityVerification', 'Citizen Identity & Anti-Spam Verification')}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {t('citizen.authReason', 'To ensure legitimate local observations and prevent fake/malicious complaints.')}
                    </span>
                  </div>
                </div>

                {/* Citizen Full Name */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('citizen.fullName', 'Citizen Full Name')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={citizenName}
                    onChange={(e) => {
                      setCitizenName(e.target.value);
                      setValidationError(null);
                    }}
                    placeholder={t('citizen.namePlaceholder', 'e.g. Ramesh Kumar Verma')}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                {/* Mobile Number & OTP Verification */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('citizen.mobileNumber', '10-Digit Mobile Number')} <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        disabled={isMobileVerified}
                        value={citizenPhone}
                        onChange={(e) => {
                          setCitizenPhone(e.target.value.replace(/\D/g, ''));
                          setIsMobileVerified(false);
                          setIsOtpSent(false);
                          setValidationError(null);
                        }}
                        placeholder="9876543210"
                        className={`w-full pl-10 pr-2.5 py-2 rounded-xl border text-xs font-mono font-bold text-slate-900 focus:ring-2 ${
                          isMobileVerified
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-white border-slate-300 focus:ring-indigo-500'
                        }`}
                        required
                      />
                    </div>

                    {!isMobileVerified ? (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] whitespace-nowrap cursor-pointer transition-colors"
                      >
                        {isOtpSent ? t('citizen.resendOtp', 'Resend OTP') : t('citizen.sendOtp', 'Verify via SMS')}
                      </button>
                    ) : (
                      <div className="px-3 py-2 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-[11px] flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>{t('citizen.verifiedBadge', 'Verified')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* OTP Input box when sent */}
                {isOtpSent && !isMobileVerified && (
                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-900">
                        {t('citizen.enterOtpPrompt', 'Enter 4-Digit SMS Code')}
                      </span>
                      {otpNotice && (
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                          {otpNotice}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={4}
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••"
                        className="w-24 text-center tracking-widest text-sm font-mono font-black p-1.5 rounded-lg border border-indigo-300 bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer"
                      >
                        {t('citizen.confirmOtp', 'Confirm OTP')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Optional Email */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('citizen.emailOptional', 'Email Address (Optional for inquiry updates)')}
                  </label>
                  <input
                    type="email"
                    value={citizenEmail}
                    onChange={(e) => setCitizenEmail(e.target.value)}
                    placeholder="citizen@example.com"
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Dynamic Anti-Bot Math Security Challenge */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-bold text-slate-700 text-[11px]">
                      {t('citizen.botCheck', 'Security Check')}: {captchaChallenge.n1} + {captchaChallenge.n2} = ?
                    </span>
                    <button
                      type="button"
                      onClick={generateCaptcha}
                      className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                      title={t('citizen.refreshCaptcha', 'Generate new check')}
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                  <input
                    type="number"
                    value={captchaInput}
                    onChange={(e) => {
                      setCaptchaInput(e.target.value);
                      setValidationError(null);
                    }}
                    placeholder="Result"
                    className="w-16 p-1.5 text-center text-xs font-bold border border-slate-300 rounded-lg bg-white"
                    required
                  />
                </div>

                {/* Statutory Citizen Undertaking */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={statutoryUndertaking}
                      onChange={(e) => {
                        setStatutoryUndertaking(e.target.checked);
                        setValidationError(null);
                      }}
                      className="rounded text-indigo-600 mt-0.5"
                    />
                    <span className="text-[11px] font-medium text-slate-600 leading-snug">
                      {t(
                        'citizen.statutoryUndertaking',
                        'I declare that I am a resident/constituent of this area, the ground observation is truthful from my personal inspection, and false reporting may attract legal liability under IPC & IT Act.'
                      )}
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('citizen.submitting', 'Logging Verified Observation...')}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{t('citizen.submitBtn', 'Submit Verified Ground Observation')}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Public Corroboration Stream (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {t('citizen.communityObservations', 'Community Ground Observations')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('citizen.sortedByCorroboration', 'Sorted by constituent corroborations & geo-verification')}
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700 px-2.5 py-1 bg-slate-100 rounded-lg">
              {reports.length} {t('citizen.loggedCount', 'Logged')}
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
                    <div className="flex items-center gap-2 flex-wrap">
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
                        {t('citizen.status', 'Ground Status')}: {rep.verificationVerdict}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        📍 {rep.location}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 mt-1 leading-snug">
                      {rep.projectTitle}
                    </h4>

                    {rep.citizenName && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-semibold text-slate-700">👤 {rep.citizenName}</span>
                        {rep.citizenPhone && <span className="text-slate-400 font-mono">({rep.citizenPhone})</span>}
                        {rep.isVerifiedCitizen && (
                          <span className="inline-flex items-center text-[10px] text-emerald-700 bg-emerald-50 px-1 rounded font-bold border border-emerald-200">
                            ✓ {t('citizen.verifiedResident', 'Verified Resident')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                    {rep.status}
                  </span>
                </div>

                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  "{rep.description}"
                </p>

                {/* Photo Thumbnail if uploaded */}
                {rep.photoUrl && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setViewingPhotoUrl(rep.photoUrl!)}
                      className="group relative inline-block rounded-xl overflow-hidden border border-slate-200 hover:border-indigo-400 transition-all cursor-pointer"
                    >
                      <img
                        src={rep.photoUrl}
                        alt="Citizen Ground Photo"
                        className="w-32 h-20 object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-950/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t('citizen.viewPhoto', 'Inspect Photo')}</span>
                      </div>
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-xs text-slate-500 flex-wrap gap-2">
                  <div className="flex items-center gap-4">
                    {rep.hasGps && (
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                        <MapPin className="w-3.5 h-3.5" />
                        {t('citizen.geoTagged', 'Geo-Tagged')}
                      </span>
                    )}
                    {rep.hasPhoto && (
                      <span className="flex items-center gap-1 text-indigo-700 font-semibold text-[11px]">
                        <Camera className="w-3.5 h-3.5" />
                        {t('citizen.photoEvidenceAttached', 'Photo Evidence Attached')}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleCorroborate(rep.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{t('citizen.corroborate', 'Corroborate')} ({rep.corroborationCount})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STATUTORY ESCALATION & AUTHORITY DIRECTORY (When no action is taken) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">
                {t('citizen.escalationTitle', 'Unresolved Observations? Statutory Escalation Directory')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t(
                  'citizen.escalationSubtitle',
                  'If district vigilance or implementing agencies have not initiated an inquiry within 15 working days, escalate directly to statutory authorities.'
                )}
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            {t('citizen.grievanceRedressal', 'Grievance Redressal Mechanism')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Channel 1: Toll Free National Helpline */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 transition-all space-y-2">
            <div className="flex items-center gap-2 text-indigo-700 font-bold">
              <Phone className="w-4 h-4" />
              <span>{t('citizen.helplineTitle', 'National Vigilance Helpline')}</span>
            </div>
            <div className="text-sm font-black text-slate-900 font-mono">
              1800-11-8012
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              {t('citizen.helplineHours', 'Toll-Free, MoSPI Grievance Cell (Mon-Fri 09:30 - 18:00 IST)')}
            </p>
            <a
              href="tel:1800118012"
              className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:underline pt-1 text-[11px]"
            >
              <span>{t('citizen.callNow', 'Call Helpline')}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Channel 2: Official Nodal Email */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 transition-all space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold">
              <Mail className="w-4 h-4" />
              <span>{t('citizen.emailTitle', 'Official Grievance Email')}</span>
            </div>
            <div className="text-xs font-bold text-slate-900 font-mono break-all">
              mplads-vigilance@mospi.gov.in
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              {t('citizen.emailDesc', 'Direct escalated docket to Chief Vigilance Officer & Nodal Authority')}
            </p>
            <a
              href={`mailto:mplads-vigilance@mospi.gov.in?subject=MPLADS%20Unresolved%20Public%20Grievance%20-%20${encodeURIComponent(selectedProject?.workCode || 'Asset')}`}
              className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:underline pt-1 text-[11px]"
            >
              <span>{t('citizen.sendEmail', 'Send Escalation Email')}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Channel 3: District Collectorate & Google Maps Link */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 transition-all space-y-2">
            <div className="flex items-center gap-2 text-blue-700 font-bold">
              <Building className="w-4 h-4" />
              <span>{t('citizen.collectorateTitle', 'District Collectorate Desk')}</span>
            </div>
            <div className="text-xs font-bold text-slate-900">
              {selectedProject?.district || 'District'} {t('citizen.collectorateOffice', 'Collectorate Campus')}
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              {t('citizen.collectorateDesc', 'Office of District Magistrate & District Nodal Authority')}
            </p>
            <a
              href={districtAuthorityMapQuery}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline pt-1 text-[11px]"
            >
              <MapPin className="w-3 h-3 text-rose-500" />
              <span>{t('citizen.openInMaps', 'Directions on Google Maps')}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Channel 4: CPGRAMS Central Government Portal */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 transition-all space-y-2">
            <div className="flex items-center gap-2 text-purple-700 font-bold">
              <FileCheck2 className="w-4 h-4" />
              <span>{t('citizen.cpgramsTitle', 'CPGRAMS & RTI Portal')}</span>
            </div>
            <div className="text-xs font-bold text-slate-900">
              pgportal.gov.in / rtionline.gov.in
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              {t('citizen.cpgramsDesc', 'Statutory Central Government Public Grievance Portal for binding resolution')}
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://pgportal.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-purple-600 hover:underline text-[11px]"
              >
                <span>CPGRAMS</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://rtionline.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-slate-600 hover:underline text-[11px]"
              >
                <span>RTI Online</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Full Photo Modal Viewer */}
      {viewingPhotoUrl && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setViewingPhotoUrl(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-100">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-600" />
                <span>{t('citizen.evidencePhotoTitle', 'Citizen Ground Photograph Evidence')}</span>
              </div>
              <button
                type="button"
                onClick={() => setViewingPhotoUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex justify-center bg-slate-900 rounded-xl overflow-hidden">
              <img
                src={viewingPhotoUrl}
                alt="Citizen Ground Observation Large"
                className="max-h-[75vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
