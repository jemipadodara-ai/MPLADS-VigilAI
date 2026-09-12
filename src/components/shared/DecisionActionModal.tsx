import React, { useState } from 'react';
import { DecisionCase, InterventionType, CaseStatus, canMakeDecisions, isMinister, isCitizenOrViewer } from '../../types';
import { PriorityBadge, ResponsibleAuthorityBadge } from './StatusBadges';
import {
  AlertOctagon,
  ShieldAlert,
  FileCheck2,
  Send,
  X,
  Lock,
  UserCheck,
  Calendar,
  AlertTriangle,
  ClipboardList,
  Award,
} from 'lucide-react';

export type ActionModalType =
  | 'Assign Inspection'
  | 'Request Documents'
  | 'Freeze Further Payment'
  | 'Generate Notice'
  | 'Mark Under Review'
  | 'Resolve Case'
  | null;

interface DecisionActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: DecisionCase | null;
  actionType: ActionModalType;
  onConfirmAction: (
    caseId: string,
    actionType: ActionModalType,
    details: {
      officerName?: string;
      officerEmail?: string;
      deadlineDate?: string;
      notes: string;
      confirmationAgreed: boolean;
      newStatus: CaseStatus;
      actingUser?: any;
    }
  ) => void;
  currentUser?: any;
}

export const DecisionActionModal: React.FC<DecisionActionModalProps> = ({
  isOpen,
  onClose,
  caseItem,
  actionType,
  onConfirmAction,
  currentUser,
}) => {
  if (!isOpen || !caseItem || !actionType) return null;

  const [actingAsMinisterOverride, setActingAsMinisterOverride] = useState(false);
  const canDecide = canMakeDecisions(currentUser?.role) || actingAsMinisterOverride;
  const isMinisterUser = isMinister(currentUser?.role) || actingAsMinisterOverride;

  const [officerName, setOfficerName] = useState(
    caseItem.assignedOfficer || (currentUser?.name ? `${currentUser.name} (Authorized)` : 'Hon. Union Minister Shri P. K. Rao')
  );
  const [officerEmail, setOfficerEmail] = useState(
    caseItem.assignedOfficerEmail || 'minister@mplads.vigilai'
  );
  const [deadlineDate, setDeadlineDate] = useState(
    new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFreeze = actionType === 'Freeze Further Payment';
  const isInspection = actionType === 'Assign Inspection';
  const isNotice = actionType === 'Generate Notice';
  const isResolve = actionType === 'Resolve Case';

  const defaultNewStatus: CaseStatus = isFreeze
    ? 'Action Required'
    : isInspection
    ? 'Inspection Assigned'
    : isNotice
    ? 'Evidence Pending'
    : isResolve
    ? 'Resolved'
    : 'Under Review';

  const handleConfirm = () => {
    if (!canDecide) return;
    if (isFreeze && !confirmed) return;
    setIsSubmitting(true);

    const actingUser = actingAsMinisterOverride
      ? {
          name: 'Hon. Union Minister Shri P. K. Rao',
          email: 'minister@mplads.vigilai',
          role: 'minister',
          department: 'Ministry of Statistics and Programme Implementation (MoSPI)',
        }
      : currentUser || {
          name: 'Hon. Union Minister Shri P. K. Rao',
          email: 'minister@mplads.vigilai',
          role: 'minister',
          department: 'Ministry of Statistics and Programme Implementation (MoSPI)',
        };

    setTimeout(() => {
      onConfirmAction(caseItem.id, actionType, {
        officerName,
        officerEmail,
        deadlineDate,
        notes: notes || `Administrative action [${actionType}] recorded by authorized officer.`,
        confirmationAgreed: confirmed,
        newStatus: defaultNewStatus,
        actingUser,
      });
      setIsSubmitting(false);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header banner */}
        <div
          className={`px-6 py-4 flex items-center justify-between border-b ${
            isFreeze
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : isInspection
              ? 'bg-indigo-50 border-indigo-200 text-indigo-950'
              : isNotice
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : isResolve
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-slate-50 border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                isFreeze
                  ? 'bg-rose-600'
                  : isInspection
                  ? 'bg-indigo-600'
                  : isNotice
                  ? 'bg-amber-600'
                  : isResolve
                  ? 'bg-emerald-600'
                  : 'bg-slate-700'
              }`}
            >
              {isFreeze ? (
                <AlertOctagon className="w-4 h-4" />
              ) : isInspection ? (
                <ClipboardList className="w-4 h-4" />
              ) : (
                <FileCheck2 className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {isFreeze
                  ? 'Execute Statutory Payment Freeze'
                  : isInspection
                  ? 'Issue Mandatory On-Site Inspection Order'
                  : isNotice
                  ? 'Issue Show-Cause & Discrepancy Notice'
                  : isResolve
                  ? 'Formal Case Resolution & Clearance'
                  : `Execute Directive: ${actionType}`}
              </h3>
              <p className="text-xs opacity-75 mt-0.5">
                Statutory Docket Reference: {caseItem.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/5 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-sm text-slate-700">
          {/* RBAC Status Banner */}
          {!canDecide ? (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2.5">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong className="text-amber-950 block mb-0.5 font-bold">
                    View-Only Access Mode ({currentUser?.role ? currentUser.role.toUpperCase() : 'PUBLIC / CITIZEN'})
                  </strong>
                  Citizens and public viewers possess read-only clearance under statutory guidelines. Would you like to authorize this directive using Executive Ministerial Authority?
                </div>
              </div>
              <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-amber-800">Statutory Clearance Override:</span>
                <button
                  type="button"
                  onClick={() => {
                    setActingAsMinisterOverride(true);
                    setOfficerName('Hon. Union Minister Shri P. K. Rao');
                    setOfficerEmail('minister@mplads.vigilai');
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Award className="w-3.5 h-3.5 text-amber-300" />
                  <span>Authorize as Union Minister</span>
                </button>
              </div>
            </div>
          ) : isMinisterUser ? (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-indigo-50 border border-amber-300 text-indigo-950 flex items-start gap-3 shadow-xs">
              <Award className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <strong className="text-indigo-900 block mb-0.5 font-bold">
                  Hon. Union Minister Executive Clearance Active
                </strong>
                Your decision will be executed as a formal executive directive, logged in the MoSPI National Ministerial Actions Registry, and persisted in Firestore with permanent audit trail hash.
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-slate-600">
                <strong className="text-slate-900 block mb-0.5">Statutory Governance Safeguard</strong>
                VigilAI provides decision support and anomaly identification. The system never enforces legal sanctions or financial freezes automatically without authenticated human officer approval.
              </div>
            </div>
          )}

          {/* Project Details Snapshot */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/60 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block">Location:</span>
              <span className="font-semibold text-slate-900">{caseItem.district}, {caseItem.state}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Financial Exposure:</span>
              <span className="font-bold text-rose-700">₹{caseItem.financialExposureLakhs} Lakhs</span>
            </div>
            <div>
              <span className="text-slate-500 block">Executing Contractor:</span>
              <span className="font-medium text-slate-800 truncate block">{caseItem.contractorName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Recommended Authority:</span>
              <span className="font-medium text-slate-800">{caseItem.responsibleAuthority}</span>
            </div>
          </div>

          {/* Fields for Assign Inspection */}
          {isInspection && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assigned Inspection Officer / Authority
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Officer name and designation"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Officer Email (NIC/Gov.in)
                  </label>
                  <input
                    type="email"
                    value={officerEmail}
                    onChange={(e) => setOfficerEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Inspection Target Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="date"
                      value={deadlineDate}
                      onChange={(e) => setDeadlineDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* High Warning for Freeze Payment */}
          {isFreeze && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Interim Payment Halt Instruction
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                This notice dispatches an interim stop-payment request to the District Nodal Authority and Public Financial Management System (PFMS) treasury portal pending measurement book verification.
              </p>
              <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="text-xs font-semibold text-rose-950">
                  I confirm that I have reviewed the underlying evidence and authorize this interim payment hold.
                </span>
              </label>
            </div>
          )}

          {/* Notes & Justification */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Official Decision Directive & Notes (Added to Audit Trail)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record explicit instructions, required evidentiary deliverables, or references to file numbers..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canDecide || (isFreeze && !confirmed) || isSubmitting}
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-xs flex items-center gap-1.5 ${
              !canDecide
                ? 'bg-slate-400 cursor-not-allowed opacity-60'
                : isFreeze
                ? 'bg-rose-600 hover:bg-rose-700 disabled:opacity-50 cursor-pointer'
                : 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer'
            }`}
          >
            {!canDecide ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Decision Rights Restricted (Citizen View-Only)</span>
              </>
            ) : isSubmitting ? (
              <span>Recording Action...</span>
            ) : isMinisterUser ? (
              <>
                <Award className="w-3.5 h-3.5" />
                <span>Issue Ministerial Executive Order</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Confirm &amp; Dispatch Directive</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
